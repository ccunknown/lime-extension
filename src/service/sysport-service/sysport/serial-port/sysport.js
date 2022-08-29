/* eslint-disable class-methods-use-this */
/* eslint-disable global-require */
/* eslint-disable no-nested-ternary */

const SerialPort = require(`serialport`);
const Path = require(`path`);
// const AsyncLock = require("async-lock");

const SysportTemplate = require(`../../sysport-template/sysport-template`);

class SerialSysport extends SysportTemplate {
  constructor(sysportService, config) {
    super(sysportService, config);
    this.sysportService = sysportService;
    this.config = config;
    this.id = this.config.id;
    delete this.config.id;
    this.lastProcessTimestamp = new Date();

    // eslint-disable-next-line import/no-dynamic-require, global-require
    this.Errors = require(Path.join(
      this.sysportService.getRootDirectory(),
      `/constants/errors.js`
    ));

    this.om.obj.log(`${this.id}`, `Construct sysport`);
  }

  init() {
    console.log(`[${this.constructor.name}]`, `init() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => {
          // this.port = new SerialPort(this.config.path, this.config.config);
          this.port = new SerialPort(this.config.path, {
            baudRate: this.config.baudRate,
            dataBits: this.config.databits,
            parity: this.config.parity,
            stopBits: this.config.stopbits,
            flowControl: this.config.flowControl,
            autoOpen: this.config.autoOpen,
          });
          this.port.removeAllListeners();
          this.port.on("close", (err) => {
            if (err) {
              console.log(
                `[${this.constructor.name}]`,
                `Port "${this.config.id}" close with error : `
              );
              console.error(err);
            } else {
              console.log(
                `[${this.constructor.name}]`,
                `Port "${this.config.id}" close`
              );
            }
          });
        })
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  start() {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        // .then(() => this.setState(`running`))
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  stop() {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => {
          if (this.port.isOpen) {
            this.port.close((err) => {
              if (err) throw err;
            });
          }
        })
        .then(() => this.setState(`stopped`))
        .then(() => resolve())
        .catch((err) => reject(err))
        .finally(() => (!this.port.isOpen ? this.setState(`stopped`) : {}));
    });
  }

  restart() {
    this.setState(`restarting`);
    return new Promise((resolve) => {
      Promise.resolve()
        .then(() => this.stop())
        .then(() => this.start())
        .then(() => resolve())
        .catch((err) => {
          this.om.obj.error(err);
          setTimeout(() => this.restart(), 5000);
        });
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

  // eslint-disable-next-line no-unused-vars
  processor(jobId, cmd) {
    // const timestamp = new Date().toISOString();
    // return new Promise((resolve, reject) => {});
  }

  getSerialPortList() {
    console.log(`[${this.constructor.name}]`, `getSerialPortList() >> `);
    return new Promise((resolve, reject) => {
      const portList = [];
      Promise.resolve()
        .then(() => SerialPort.list())
        .then((ports) => {
          ports.forEach((port) => {
            portList.push({
              path: port.path,
              pnpId: port.pnpId ? port.pnpId : null,
              manufacturer: port.manufacturer ? port.manufacturer : null,
            });
          });
          console.log(
            `[${this.constructor.name}]`,
            `port: ${JSON.stringify(ports, null, 2)}`
          );
          console.log(
            `[${this.constructor.name}]`,
            `portList: ${JSON.stringify(portList, null, 2)}`
          );
          resolve(portList);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}

module.exports = SerialSysport;
