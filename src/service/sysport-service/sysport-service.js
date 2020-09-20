'use strict'

//const EventEmitter = require('events').EventEmitter;
const Service = require(`../service`);
const Database = require(`../../lib/my-database`);
const {Defaults, Errors} = require(`../../../constants/constants`);

const ConfigTranslator = require(`./config-translator.js`);

const SerialPort = require(`serialport`);

class SysportService extends Service {
  constructor(extension, config, id) {
    console.log(`SysportService: contructor() >> `);
    super(extension, config, id);
  }

  init(config) {
    console.log(`SysportService: init() >> `);
    return new Promise(async (resolve, reject) => {
      this.config = (config) ? config : this.config;
      this.portList = {};
      resolve();
    });
  }

  start(config) {
    return new Promise(async (resolve, reject) => {
      console.log(`SysportService: start() >> `);
      config = (config) ? config : this.config;
      this.portList = {};
      this.configTranslator = new ConfigTranslator(this);
      //console.log(`sysport config : ${JSON.stringify(this.config, null, 2)}`);
      let serviceSchema = this.getSchema();
      console.log(JSON.stringify(serviceSchema));
      //let list = serviceSchema.config.list;
      let list = serviceSchema.list;
      for(let i in list) {
        await this.addToService(i, list[i]);
      }
      resolve();
    });
  }

  add(config) {
    console.log(`SysportService: add() >> `);
    return new Promise((resolve, reject) => {
      let id = this.generateId();
      this.addToConfig(id, config)
      .then(() => this.addToService(id, config))
      .then(() => {
        let res = {};
        res[id] = config;
        resolve(res);
      })
      .catch((err) => reject(err));
    });
  }

  addToConfig(id, config) {
    console.log(`SysportService: addToConfig() >> `);
    return new Promise((resolve, reject) => {
      this.configTranslator.validate(config)
      .then((validateInfo) => {
        if(validateInfo.errors && validateInfo.errors.length)
          throw(new Errors.InvalidConfigSchema(validateInfo.errors));
        else
          return validateInfo;
      })
      .then((validateInfo) => this.configManager.addToConfig(config, `service-config.sysport-service.list.${id}`))
      .then((res) => resolve(res))
      .catch((err) => reject((err) ? err : new Errors.ErrorObjectNotReturn()));
    });
  }

  addToService(id, schema) {
    console.log(`SysportService: addPort("${id}": "${schema.path}") >> `);
    return new Promise(async (resolve, reject) => {
      if(this.portList[id]) {
        console.warn(`Port "${id}" already open, reopen port operation!!!`);
        await this.remove(id);
      }
      let port = {
        "schema": schema,
        "object": new SerialPort(schema.path, schema.config)
      };
      port.object.removeAllListeners();
      port.object.on("close", (err) => {
        console.log(`Port "${id}" error : `);
        console.error(err);
      });
      this.portList[id] = port;
      resolve();
    });
  }

  addToServiceChain(id) {
    console.log(`SysportService: addToServiceChain(${id}) >> `);
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  remove(id) {
    console.log(`SysportService: remove(${id}) >> `);
    return new Promise((resolve, reject) => {
      this.removeFromConfig(id)
      .then(() => this.removeFromService(id))
      .then(() => resolve({}))
      .catch((err) => reject((err) ? err : new Errors.ErrorObjectNotReturn()));
    });
  }

  removeFromConfig(id) {
    console.log(`SysportService: removeFromConfig(${id}) >> `);
    return new Promise((resolve, reject) => {
      this.configManager.deleteConfig(`service-config.sysport-service.list.${id}`)
      .then(() => resolve())
      .catch((err) => reject((err) ? err : new Errors.ErrorObjectNotReturn()));
    });
  }

  removeFromService(id) {
    console.log(`SysportService: removeFromService(${id}) >> `);
    return new Promise((resolve, reject) => {
      let port = this.portList[id];
      if(!port)
        reject(new Error(`Port "${id}" not found!!!`));
      if(port.object.isOpen) {
        port.object.close((err) => {
          if(err)
            reject(err)
          delete this.portList[id];
          resolve();
        });
      }
      else {
        delete this.portList[id];
        resolve();
      }
    });
  }

  update(id, config) {
    console.log(`SysportService: update(${id}) >> `);
    return new Promise((resolve, reject) => {
      this.updateConfig(id, config)
      .then(() => this.updateService(id, config))
      .then(() => {
        let res = {};
        res[id] = config;
        resolve(res);
      })
      .catch((err) => reject(err));
    });
  }

  updateConfig(id, config) {
    console.log(`SysportService: updateConfig(${id}) >> `);
    return new Promise((resolve, reject) => {
      this.configTranslator.validate(config)
      .then((validateInfo) => {
        if(validateInfo.errors && validateInfo.errors.length)
          throw(new Errors.InvalidConfigSchema(validateInfo.errors));
        else
          return validateInfo;
      })
      .then((validateInfo) => this.configManager.updateConfig(config, `service-config.sysport-service.list.${id}`))
      .then((res) => resolve(res))
      .catch((err) => reject((err) ? err : new Errors.ErrorObjectNotReturn()));
    });
  }

  updateService(id, config) {
    console.log(`SysportService: updateService(${id}) >> `);
    return new Promise((resolve, reject) => {
      this.removeFromService(id)
      .then(() => this.addToService(id, config))
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  get(id, options) {
    options = (options) ? options : (typeof id == `object`) ? id : undefined;
    id = (typeof id == `string`) ? id : (options && options.id) ? options.id : undefined;
    console.log(`SysportService: get(${(id) ? `"${id}"` : ``}) >> `);
    return new Promise(async (resolve, reject) => {
      if(options && options.object == true)
        resolve((id) ? this.portList[id] : this.portList);
      else {
        if(id)
          resolve(this.portList[id].schema);
        else {
          let portList = {};
          for(let i in this.portList)
            portList[i] = this.portList[i].schema;
          resolve(portList);
        }
      }
    });
  }

  getByAttribute(attr, val) {
    for(let i in this.portList) {
      if(this.portList[i].schema[attr] == val)
        return this.portList[i];
    }
    return null;
  }

  getSerialPortList() {
    console.log(`SysportService: getSerialPortList() >> `);
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
        console.log(`port: ${JSON.stringify(ports, null, 2)}`);
        console.log(`portList: ${JSON.stringify(portList, null, 2)}`);
        resolve(portList);
      })
      .catch((err) => {
        reject(err);
      });
    });
  }

  generateConfigSchema(params) {
    console.log(`SysportService: generateConfigSchema() >> `);
    return new Promise(async (resolve, reject) => {
      let config = await this.configTranslator.generateConfigSchema(params);
      resolve(config);
    });
  }

  generateId() {
    console.log(`SysportService: generateId() >> `);
    let id;
    let maxIndex = 10000;
    for(let i = 1;i < maxIndex;i++) {
      id = `port-${i}`;
      if(!this.portList.hasOwnProperty(id))
        break;
    }
    return id;
  }
}

module.exports = SysportService;