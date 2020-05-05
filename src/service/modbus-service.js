'use strict'

const EventEmitter = require('events').EventEmitter;

const Database = require('../lib/my-database');
const {Defaults, Errors} = require('../../constants/constants');

const SerialPort = require(`serialport`);

class modbusService extends EventEmitter {
  constructor(extension, config) {
    console.log(`modbusService: contructor() >> `);
    super(extension.addonManager, extension.manifest.id);

    this.extension = extension;
    this.manifest = extension.manifest;
    this.addonManager = extension.addonManager;

    this.init();
  }

  init() {
    console.log(`modbusService: init() >> `);
  }

  start() {
    console.log(`modbusService: start() >> `);
    return Promise.resolve();
  }

  stop() {
    console.log(`modbusService: stop() >> `);
  }

  getSerialPortList() {
    console.log(`modbusService: getSerialPortList() >> `);
    return new Promise((resolve, reject) => {
      let portList = [];
      SerialPort.list()
      .then((ports) => {
        ports.forEach((port) => {
          portList.push({
            path: port.path,
            pnpId: (port.pnpId) ? port.pnpId : null,
            manufacturer: (port.manufacturer) ? port.manufacturer : null
          });
        });
        console.log(`portList : ${JSON.stringify(portList, null, 2)}`);
        resolve(portList);
      })
      .catch((err) => {
        reject(err);
      });
    });
  }
}

module.exports = modbusService;