'use strict'

const EventEmitter = require('events').EventEmitter;

const Database = require('../lib/my-database');
const {Defaults, Errors} = require('../../constants/constants');

const SerialPort = require(`serialport`);

class sysportService extends EventEmitter {
  constructor(extension, config) {
    console.log(`sysportService: contructor() >> `);
    super(extension.addonManager, extension.manifest.id);

    this.extension = extension;
    this.manifest = extension.manifest;
    this.addonManager = extension.addonManager;

    this.laborsManager = this.extension.laborsManager;
    this.config = config;

    this.portList = {};
    this.init();
  }

  init() {
    console.log(`sysportService: init() >> `);

  }

  start(config) {
    return new Promise((resolve, reject) => {
      console.log(`sysportService: start() >> `);
      config = (config) ? config : this.config;
      let list = config.sysport.list;
      for(let i in list) {
        let port = {
          "schema": list[i];
          "obj": 
        };
        console.log(`${JSON.stringify(list[i], null, 2)}`);
      }
    });
  }

  getSerialPortList() {
    console.log(`sysportService: getSerialPortList() >> `);
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

module.exports = sysportService;