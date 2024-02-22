'use strict'

const EventEmitter = require(`events`).EventEmitter;
const ModbusTCP = require(`modbus-serial`);
const AsyncLock = require(`async-lock`);
const Path = require(`path`);

class ModbusTcp {
  constructor(enginesService, config) {
    this.enginesService = enginesService;
    this.config = config;
    this.event = new EventEmitter();
    this.client = new ModbusTCP();
    this.state = `stop`;
    this.lock = {
      "act": {
        "key": `act-lock`,
        "locker": new AsyncLock()
      }
    };
    this.Errors = require(Path.join(this.enginesService.getRootDirectory(), `/constants/errors.js`));
  }

  init() {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  start() {
    console.log(`ModbusTcp: start() >> `);
    if(this.state != `restarting`)
      this.emit(`starting`, this);
    return new Promise((resolve, reject) => {
      this.emit(`running`, this);
      resolve();
    });
  }

  restart() {
    console.log(`ModbusTcp: restart() >> `);
    this.emit(`restarting`, this);
    return new Promise((resolve, reject) => {
      this.stop()
      .then(() => this.start())
      .then(() => resolve())
      .catch((err) => setTimeout(() => this.restart(), 5000));
    });
  }

  stop() {
    console.log(`ModbusTcp: stop() >> `);
    if(this.state != `restarting`)
      this.emit(`stoping`, this);
    return new Promise((resolve, reject) => {
      (this.state != `restarting`) && this.emit(`stop`, this);
      resolve();
    });
  }

  emit(event, arg) {
    console.log(`ModbusTcp: emit("${event}") >> `);
    this.state = event;
    return this.event.emit(event, arg);
  }

  getState() {
    return this.state;
  }

  act(cmd) {
    return new Promise((resolve, reject) => {
      let locker = this.lock[`act`].locker;
      let key = this.lock[`act`].key;
      locker.acquire(key, () => {
        return this._act(cmd);
      })
      .then((ret) => resolve(ret))
      .catch((err) => {
        console.log(`ModbusTcp: act() >> catch error!!!`);
        console.error(err);
        reject(err);
      });
    });
  }

  _act(cmd) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.__act(cmd)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
      }, this.config.delay);
    });
  }

  __act(cmd) {
    let timestamp = (new Date()).toISOString();
    //console.log(`>>>>>> time: ${timestamp}`);
    //console.log(`cmd : ${JSON.stringify(cmd)}`);
    return new Promise((resolve, reject) => {

      let timeout = setTimeout(() => {
        let timeerr = (new Date()).toISOString();
        console.log(`>>>>>> error time: ${timestamp}/${timeerr}`);
        console.log(`cmd`, JSON.stringify(cmd, null, 2));
        reject(`Engine command timeout.`);
      }, this.config.timeout);
      if(this.state != `running`) {
        reject(new Error(`Port currently "${this.state}".`));
      }
      else if(cmd.action == `read`) {
        this.client.connectTCP(cmd.ip, {port: cmd.port})
        .then(() => this.client.setID(cmd.id))
        .then(() => 
          (cmd.table == `coils`) ? this.client.readCoils.bind(this.client) :
          (cmd.table == `contacts`) ? this.client.readDiscreteInputs.bind(this.client) :
          (cmd.table == `inputRegisters`) ? this.client.readInputRegisters.bind(this.client) :
          (cmd.table == `holdingRegisters`) ? this.client.readHoldingRegisters.bind(this.client) : 
          undefined)
        .then((func) => (func) ? func(cmd.address, cmd.numtoread) : new Error(`Table "${cmd.table}" miss match!!!`))
        // .then((ret) => resolve(ret))
        .then((ret) => this.client.close(() => resolve(ret)))
        .catch((err) => {
          console.error(`catch error`);
          reject(err)
        })
        .finally(() => clearTimeout(timeout));
      }
      else {
        // console.warn(`Action "${cmd.action}" not define!!!`);
        reject(new Error(`Action "${cmd.action}" not define!!!`));
      }
    });
  }
}

module.exports = ModbusTcp;
