'use strict'

//const EventEmitter = require('events').EventEmitter;
const Service = require(`../service`);
const Database = require('../../lib/my-database');
const {Defaults, Errors} = require('../../../constants/constants');

const SerialPort = require(`serialport`);

class sysportService extends Service {
  constructor(extension, config, id) {
    console.log(`sysportService: contructor() >> `);
    super(extension, config, id);
  }

  init(config) {
    console.log(`sysportService: init() >> `);
    return new Promise(async (resolve, reject) => {
      this.config = (config) ? config : this.config;
      this.portList = {};
      resolve();
    });
  }

  start(config) {
    return new Promise(async (resolve, reject) => {
      console.log(`sysportService: start() >> `);
      config = (config) ? config : this.config;
      this.portList = {};
      //console.log(`sysport config : ${JSON.stringify(this.config, null, 2)}`);
      let serviceSchema = this.getSchema();
      console.log(JSON.stringify(serviceSchema));
      let list = serviceSchema.config.list;
      for(let i in list) {
        await this.add(list[i]);
      }
      resolve();
    });
  }

  add(schema) {
    console.log(`sysportService: addPort("${schema.name}": "${schema.path}") >> `);
    return new Promise(async (resolve, reject) => {
      if(this.portList[schema.name]) {
        console.warn(`Port "${schema.path}" already open, reopen port operation!!!`);
        await this.remove(schema.name);
      }
      let port = {
        "schema": schema,
        "object": new SerialPort(schema.path, schema.config)
      };
      this.portList[schema.name] = port;
      resolve();
    });
  }

  remove(name) {
    console.log(`sysportService: removePort("${name}") >> `);
    return new Promise((resolve, reject) => {
      let port = this.portList[name];
      if(!port)
        reject(new Error(`Port "${name}" not found!!!`));
      port.object.close((err) => {
        (err) ? reject(err) : resolve();
      });
    });
  }

  get(key) {
    return this.portList[key];
  }

  getByAttribute(attr, val) {
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