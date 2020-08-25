'use strict'

const EventEmitter = require('events').EventEmitter;
const SerialPort = require(`serialport`);
const ModbusRTU = require('modbus-serial');
const AsyncLock = require('async-lock');

var MIN_MODBUSRTU_FRAMESZ = 5;

class ModbusRtu {
  constructor() {
    this.event = new EventEmitter();
    this.client = new ModbusRTU();
    this.state = `stop`;
    this.lock = {
      "act": {
        "key": `act-lock`,
        "locker": new AsyncLock()
      }
    };
  }

  init(port) {
    this.initMod();
    let RtuBufferedPort = require(`./rtubufferedport`);
    this.port = new RtuBufferedPort(port);
  }

  initMod() {

    let open = function(obj, next) {
      if (next) {
        obj.open(next);
      }
      else {
        var promise = new Promise(function(resolve, reject) {
          function cb(err) {
            (err) ? reject(err) : resolve();
          }
          obj.open(cb);
        });
        return promise;
      }
    };

    this.client.connectRTUBuffered = (port, next) => {
      // create the SerialPort
      var SerialPort = require("./rtubufferedport");
      this.client._port = new SerialPort(this.port);

      //options.platformOptions = { vmin: MIN_MODBUSRTU_FRAMESZ, vtime: 0 };

      // open and call next
      return open(this.client, next);
    };
  }

  start() {
    console.log(`ModbusRtu: start() >> `);
    if(this.state != `restarting`)
      this.emit(`starting`, this);
    return new Promise((resolve, reject) => {
      this.client.connectRTUBuffered(this.port, (error) => {
        if(error) {
          //setTimeout(() => this.restart(), 5000);
          reject(error);
        }
        else {
          this.port._client.removeAllListeners("close");
          this.port._client.on(`close`, (err) => {
            console.log(`ModbusRtu: on port close. >> `);
            console.error(err);
            if(err) {
              //console.log(`prepare to restart!!!`);
              this.restart();
              this.emit(`error`, err);
              //console.log(`after restart call!!!`);
              //setTimeout(() => this.restart(), 5000);
            }
          });
          this.emit(`running`, this);
          resolve();
        }
      });
    });
  }

  restart() {
    console.log(`ModbusRtu: restart() >> `);
    this.emit(`restarting`, this);
    return new Promise(async (resolve, reject) => {
      await this.stop();
      try {
        await this.start();
      } catch(err) {
        setTimeout(() => this.restart(), 5000);
      }
      resolve();
    });
  }

  stop() {
    console.log(`ModbusRtu: stop() >> `);
    if(this.state != `restarting`)
      this.emit(`stoping`, this);
    return new Promise((resolve, reject) => {
      this.client.close(() => {
        if(this.state != `restarting`)
          this.emit(`stop`, this);
        resolve();
      });
    });
  }

  emit(event, arg) {
    console.log(`ModbusRtu: emit("${event}") >> `);
    this.state = event;
    return this.event.emit(event, arg);
  }

  getState() {
    return this.state;
  }

  act(cmd) {
    //console.log(`ModbusRtu: act() >> `);
    return new Promise((resolve, reject) => {
      let locker = this.lock[`act`].locker;
      let key = this.lock[`act`].key;
      locker.acquire(key, () => {
        return this._act(cmd);
      })
      .then((ret) => resolve(ret))
      .catch((err) => {
        console.log(`ModbusRtu: act() >> catch error!!!`);
        console.error(err);
        reject(err);
      });
    });
  }

  _act(cmd) {
    return new Promise(async (resolve, reject) => {
      setTimeout(() => {
        this.__act(cmd)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
      }, 100);
    });
  }

  __act(cmd) {
    //console.log(`ModbusRtu: _act() >> `);
    let timestamp = (new Date()).toISOString();
    //console.log(`>>>>>> time: ${timestamp}`);
    //console.log(`cmd : ${JSON.stringify(cmd)}`);
    return new Promise(async (resolve, reject) => {
      let timeout = setTimeout(() => {
        let timeerr = (new Date()).toISOString();
        console.log(`>>>>>> error time: ${timestamp}/${timeerr}`);
        console.log(`cmd`, JSON.stringify(cmd, null, 2));
        reject(`Engine command timeout.`);
      }, 3000);
      if(this.state != `running`) {
        reject(new Error(`Port currently "${this.state}".`));
      }
      else if(cmd.action == `read`) {
        this.client.setID(cmd.id);
        let val;
        let func = 
        (cmd.table == `coils`) ? this.client.readCoils.bind(this.client) :
        (cmd.table == `contacts`) ? this.client.readDiscreteInputs.bind(this.client) :
        (cmd.table == `inputRegisters`) ? this.client.readInputRegisters.bind(this.client) :
        (cmd.table == `holdingRegisters`) ? this.client.readHoldingRegisters.bind(this.client) : undefined;
        
        if(func) {
          try {
            val = await func(cmd.address, cmd.numtoread);
            clearTimeout(timeout);
            resolve(val);
          }
          catch(err) {
            reject(err);
          }
        }
        else
          reject(new Error(`Table "${cmd.table}" miss match!!!`));
      }
      else {
        //console.warn(`Action "${cmd.action}" not define!!!`);
        //resolve(null);
        reject(new Error(`Action "${cmd.action}" not define!!!`));
      }
    });
  }
}

module.exports = ModbusRtu

