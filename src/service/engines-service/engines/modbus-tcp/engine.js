/* eslint-disable no-nested-ternary */
const { EventEmitter } = require(`events`);
const Path = require(`path`);
const ModbusTCP = require(`modbus-serial`);

const EngineTemplate = require("../../engine-template/engine-template");

class ModbusTcp extends EngineTemplate {
  constructor(enginesService, id, config) {
    super(enginesService, id, config);
    this.enginesService = enginesService;
    this.ioportsService = enginesService.ioportsService;
    this.config = config;
    this.lastProcessTimestamp = new Date();
    this.event = new EventEmitter();
    this.client = new ModbusTCP();

    // eslint-disable-next-line import/no-dynamic-require, global-require
    this.Errors = require(Path.join(
      this.enginesService.getRootDirectory(),
      `/constants/errors.js`
    ));

    this.om.obj.log(`${this.id}`, `Construct engine`);
  }

  init() {
    console.log(`[${this.constructor.name}]:`, `init() >>`);
    return Promise.resolve();
  }

  start() {
    console.log(`[${this.constructor.name}]`, `start() >> `);
    return Promise.resolve();
  }

  stop() {
    console.log(`[${this.constructor.name}]`, `stop() >> `);
    return Promise.resolve();
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
      if (cmd.action === `read`) {
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
            .then(() => this.client.connectTCP(cmd.ip, { port: cmd.port }))
            .then(() => this.client.setID(cmd.id))
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
              const timestamp = new Date();
              clearTimeout(timeout);
              this.om.task.log(jobId, `end req: ${timestamp.toISOString()}`);
              val = ret;
            })
            .then(() => {
              const ret = [...val.buffer];
              this.client.close(() => resolve(ret));
            })
            .catch((err) => reject(err))
            .finally(() => {
              this.lastProcessTimestamp = new Date().getTime();
            });
        } else {
          const err = new Error(`Table "${cmd.table}" miss match!!!`);
          reject(err);
        }
      } else {
        // console.warn(`Action "${cmd.action}" not define!!!`);
        reject(new Error(`Action "${cmd.action}" not define!!!`));
      }
    });
  }

  // eslint-disable-next-line class-methods-use-this
  dynamicDelay(ms) {
    return new Promise((resolve, reject) => {
      try {
        const timestamp = new Date().getTime();
        const alreadyDelay = timestamp - this.lastProcessTimestamp;
        const remainingDelay = ms - alreadyDelay;
        // this.om.obj.log(`target delay:`, ms);
        // this.om.obj.log(`calcul delay:`, remainingDelay);
        // this.om.obj.log(`last timestamp:`, this.lastProcessTimestamp);
        // this.om.obj.log(`curr timestamp:`, timestamp);
        setTimeout(() => resolve(), Math.max(remainingDelay, 0));
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = ModbusTcp;
