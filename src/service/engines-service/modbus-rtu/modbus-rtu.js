const EventEmitter = require('events').EventEmitter;
const SerialPort = require(`serialport`);
const ModbusRTU = require('modbus-serial');
const AsyncLock = require('async-lock');

var MIN_MODBUSRTU_FRAMESZ = 5;

class ModbusRtu {
  constructor() {
    this.event = new EventEmitter();
    this.client = new ModbusRTU();
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
      // check if we have options
      let options;
      if (typeof next === "undefined" && typeof options === "function") {
        next = options;
        options = {};
      }

      // check if we have options
      if (typeof options === "undefined") {
        options = {};
      }

      // create the SerialPort
      var SerialPort = require("./rtubufferedport");
      this.client._port = new SerialPort(this.port);

      options.platformOptions = { vmin: MIN_MODBUSRTU_FRAMESZ, vtime: 0 };

      // open and call next
      return open(this.client, next);
    };
  }

  start() {
    return new Promise((resolve, reject) => {
      this.client.connectRTUBuffered(this.port, () => {
        resolve();
      });
    });
  }

  act(cmd) {
    return new Promise((resolve, reject) => {
      let locker = this.lock[`act`].locker;
      let key = this.lock[`act`].key;
      locker.acquire(key, () => {
        return this._act(cmd);
      })
      .then((ret) => resolve(ret));
    });
  }

  _act(cmd) {
    return new Promise(async (resolve, reject) => {
      if(cmd.action == `read`) {
        this.client.setID(cmd.id);
        let val;
        //console.log(`modbus-rtu: act(${cmd.table}) >> `);
        //console.log(`cmd : ${JSON.stringify(cmd, null, 2)}`);
        switch(cmd.table) {
          case `coils`:            
            val = await this.client.readCoils(cmd.address, cmd.numtoread);
            break;
          case `contacts`:
            val = await this.client.readDiscreteInputs(cmd.address, cmd.numtoread);
            break;
          case `inputRegisters`:
            val = await this.client.readInputRegisters(cmd.address, cmd.numtoread);
            break;
          case `holdingRegisters`:
            val = await this.client.readHoldingRegisters(cmd.address, cmd.numtoread);
            break;
          default:
            console.error(`${cmd.table} not in scope.`);
            break;
        }
        resolve(val);
      }
      else {
        console.warn(`Action "${cmd.action}" not define!!!`);
        resolve(null);
      }
    });
  }
}

module.exports = ModbusRtu