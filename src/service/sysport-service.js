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
      let list = config[`sysport-service`].list;
      for(let i in list) {
        let port = {
          "schema": list[i],
          "object": null
        };
        port.object = new SerialPort(`${port.schema.path}`, port.schema.config);
        this.portList[port.schema.name] = port;
        console.log(`${JSON.stringify(list[i], null, 2)}`);
      }
      resolve();
    });
  }

  getPort(key) {
    return this.portList[key];
  }

  getPortByAttribute(attr, val) {
    for(let i in this.portList) {
      if(this.portList[i].schema[attr] == val)
        return this.portList[i];
    }
    return null;
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