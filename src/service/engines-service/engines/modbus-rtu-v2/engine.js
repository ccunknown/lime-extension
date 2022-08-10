/* eslint-disable global-require */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-underscore-dangle */
const { EventEmitter } = require("events");

// const SerialPort = require(`serialport`);
const Path = require(`path`);
const ModbusRTU = require("modbus-serial");
// const AsyncLock = require("async-lock");

const EngineTemplate = require(`../../engine-template/engines-template.js`);

class ModbusRtu extends EngineTemplate {
  constructor(enginesService, config) {
    super(enginesService, config);
    this.enginesService = enginesService;
    this.config = config;
    this.event = new EventEmitter();
    this.client = new ModbusRTU();
    // this.lock = {
    //   act: {
    //     key: `act-lock`,
    //     locker: new AsyncLock(),
    //   },
    // };
    // eslint-disable-next-line import/no-dynamic-require, global-require
    this.Errors = require(Path.join(
      this.enginesService.getRootDirectory(),
      `/constants/errors.js`
    ));
  }

  init(port) {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.initMod())
        .then(() => require(`./rtubufferedport`))
        .then((RtuBufferedPort) => {
          this.port = new RtuBufferedPort(port);
        })
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  initMod() {
    const open = (obj, next) => {
      if (next) {
        obj.open(next);
        return undefined;
      }
      return new Promise((resolve, reject) => {
        function cb(err) {
          if (err) reject(err);
          else resolve();
        }
        obj.open(cb);
      });
    };

    this.client.connectRTUBuffered = (port, next) => {
      // create the SerialPort
      const SerialPort = require("./rtubufferedport");
      this.client._port = new SerialPort(this.port);
      return open(this.client, next);
    };
  }

  start() {
    console.log(`ModbusRtu: start() >> `);
    // if (this.getState() !== `restarting`) this.emit(`starting`, this);
    if (this.getState() !== `restarting`) this.setState(`starting`);
    return new Promise((resolve, reject) => {
      this.client.connectRTUBuffered(this.port, (error) => {
        if (error) {
          // setTimeout(() => this.restart(), 5000);
          reject(error);
        } else {
          this.port._client.removeAllListeners("close");
          this.port._client.on(`close`, (err) => {
            console.log(`ModbusRtu: on port close. >> `);
            console.error(err);
            if (err) {
              // console.log(`prepare to restart!!!`);
              this.restart();
              // this.emit(`error`, err);
              this.setState(`error`);
              // console.log(`after restart call!!!`);
              // setTimeout(() => this.restart(), 5000);
            }
          });
          // this.emit(`running`, this);
          this.setState(`running`);
          resolve();
        }
      });
    });
  }

  restart() {
    console.log(`ModbusRtu: restart() >> `);
    // this.emit(`restarting`, this);
    this.setState(`restarting`);
    return new Promise((resolve) => {
      Promise.resolve()
        .then(() => this.stop())
        .then(() => this.start())
        .then(() => resolve())
        .catch((err) => {
          console.error(err);
          setTimeout(() => this.restart(), 5000);
        });
    });
  }

  stop() {
    console.log(`ModbusRtu: stop() >> `);
    if (this.getState() !== `restarting`) this.emit(`stoping`, this);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() =>
          this.client.close(() => {
            if (this.getState() !== `restarting`) this.emit(`stopped`, this);
            resolve();
          })
        )
        .catch((err) => reject(err));
    });
  }

  emit(event, arg) {
    console.log(`ModbusRtu: emit("${event}") >> `);
    // this.getState = event;
    return this.event.emit(event, arg);
  }

  // getState() {
  //   return this.state;
  // }

  processor(cmd) {
    // console.log(`ModbusRtu: _act() >> `);
    const timestamp = new Date().toISOString();
    // console.log(`>>>>>> time: ${timestamp}`);
    // console.log(`cmd : ${JSON.stringify(cmd)}`);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const timeerr = new Date().toISOString();
        console.log(`>>>>>> error time: ${timestamp}/${timeerr}`);
        console.log(`cmd`, JSON.stringify(cmd, null, 2));
        reject(new Error(`Engine command timeout.`));
      }, this.config.timeout);
      if (this.getState() !== `running`) {
        reject(new Error(`Port currently "${this.getState()}".`));
      } else if (cmd.action === `read`) {
        this.client.setID(cmd.id);
        let val;
        const func =
          cmd.table === `coils`
            ? this.client.readCoils.bind(this.client)
            : cmd.table === `contacts`
            ? this.client.readDiscreteInputs.bind(this.client)
            : cmd.table === `inputRegisters`
            ? this.client.readInputRegisters.bind(this.client)
            : cmd.table === `holdingRegisters`
            ? this.client.readHoldingRegisters.bind(this.client)
            : undefined;

        if (func) {
          Promise.resolve()
            .then(() => func(cmd.address, cmd.numtoread))
            .then((ret) => {
              val = ret;
              // console.log(`[${this.constructor.name}]`, `buf:`, val.buffer);
              // console.log(
              //   //
              //   `[${this.constructor.name}]`,
              //   `arr:`,
              //   [...val.buffer]
              // );
            })
            .then(() => clearTimeout(timeout))
            .then(() => resolve([...val.buffer]))
            .catch((err) => reject(err));
        } else reject(new Error(`Table "${cmd.table}" miss match!!!`));
      } else {
        // console.warn(`Action "${cmd.action}" not define!!!`);
        // resolve(null);
        reject(new Error(`Action "${cmd.action}" not define!!!`));
      }
    });
  }
}

module.exports = ModbusRtu;
