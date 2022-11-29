/* eslint-disable global-require */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-underscore-dangle */
const { EventEmitter } = require("events");

// const SerialPort = require(`serialport`);
const Path = require(`path`);
const ModbusRTU = require("modbus-serial");
// const AsyncLock = require("async-lock");

const EngineTemplate = require(`../../engine-template/engine-template.js`);
const { ObjectState } = require(`../../../object-template/object-state.js`);

class ModbusRtu extends EngineTemplate {
  constructor(enginesService, id, config) {
    super(enginesService, id, config);
    this.enginesService = enginesService;
    this.ioportsService = enginesService.ioportsService;
    this.config = config;
    this.lastProcessTimestamp = new Date();
    this.event = new EventEmitter();
    this.client = new ModbusRTU();

    // eslint-disable-next-line import/no-dynamic-require, global-require
    this.Errors = require(Path.join(
      this.enginesService.getRootDirectory(),
      `/constants/errors.js`
    ));

    this.om.obj.log(`${this.id}`, `Construct engine`);
  }

  init() {
    return new Promise((resolve, reject) => {
      let port;
      Promise.resolve()
        .then(() =>
          this.ioportsService.objects.get(this.config.port, { object: true })
        )
        .then((ioport) => {
          port = ioport;
        })
        .then(() => this.initMod())
        .then(() => require(`./rtubufferedport`))
        .then((RtuBufferedPort) => {
          this.port = new RtuBufferedPort(port.port);
        })
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  initMod() {
    const open = (obj, next) => {
      if (next) {
        // this.om.obj.log(`obj`, typeof obj, obj.constructor.name);
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
      console.log(`[${this.constructor.name}]`, `port:`, port.constructor.name);
      console.log(
        `[${this.constructor.name}]`,
        `this.port:`,
        this.port.constructor.name
      );
      this.client._port = new SerialPort(this.port);
      return open(this.client, next);
    };
  }

  start() {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() =>
          this.client.connectRTUBuffered(this.port, (error) => {
            if (error) {
              this.om.obj.error(error);
            } else {
              this.port._client.removeAllListeners("close");
              this.port._client.on(`close`, (err) => {
                this.om.obj.log(`port close. >> `);
                if (err) {
                  this.om.obj.error(err);
                }
              });
              resolve();
            }
          })
        )
        .catch((err) => reject(err));
    });
  }

  stop() {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() =>
          this.client.close(() => {
            resolve();
          })
        )
        .catch((err) => reject(err));
    });
  }

  // eslint-disable-next-line class-methods-use-this
  commandToString(cmd) {
    const ac = cmd.action;
    const tb = cmd.table;
    const { id } = cmd;
    const addr = cmd.address.toString(16).padStart(2, `0`);
    const len = cmd.numtoread;
    return `<${ac}:${tb}> <id:${id}> <addr:0x${addr}->${len}>`;
  }

  // eslint-disable-next-line class-methods-use-this
  resultToString(result) {
    const hexString = result
      .map((e) => e.toString(16).padStart(2, `0`))
      .join(` `);
    return `<0x ${hexString}>`;
  }

  processor(jobId, cmd) {
    return new Promise((resolve, reject) => {
      if (this.getState() !== ObjectState.RUNNING) {
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
          let timeout;
          Promise.resolve()
            .then(() => this.dynamicDelay(this.config.delay))
            .then(() => {
              timeout = setTimeout(() => {
                reject(new Error(`Engine command timeout`));
              }, this.config.timeout);
              this.om.task.log(
                //
                jobId,
                `start req: ${new Date().toISOString()}`
              );
            })
            .then(() => func(cmd.address, cmd.numtoread))
            .then((ret) => {
              this.lastProcessTimestamp = new Date();
              clearTimeout(timeout);
              this.om.task.log(
                jobId,
                `end req: ${this.lastProcessTimestamp.toISOString()}`
              );
              val = ret;
            })
            .then(() => {
              const ret = [...val.buffer];
              resolve(ret);
            })
            .catch((err) => reject(err));
        } else {
          const err = new Error(`Table "${cmd.table}" miss match!!!`);
          reject(err);
        }
      } else {
        const err = new Error(`Action "${cmd.action}" not define!!!`);
        reject(err);
      }
    });
  }

  // eslint-disable-next-line class-methods-use-this
  dynamicDelay(ms) {
    return new Promise((resolve, reject) => {
      try {
        const timestamp = new Date();
        const alreadyDelay = timestamp - this.lastProcessTimestamp;
        const remainingDelay = ms - alreadyDelay;
        setTimeout(() => resolve(), Math.max(remainingDelay, 0));
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = ModbusRtu;
