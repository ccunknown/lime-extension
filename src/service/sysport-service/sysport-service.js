'use strict'

//const EventEmitter = require('events').EventEmitter;
const Service = require(`../service`);
const Database = require(`../../lib/my-database`);
const {Defaults, Errors} = require(`../../../constants/constants`);

const ConfigTranslator = require(`./config-translator.js`);

const SerialPort = require(`serialport`);

class SysportService extends Service {
  constructor(extension, config, id) {
    super(extension, config, id);
    console.log(`[${this.constructor.name}]`, `contructor() >> `);
  }

  init(config) {
    console.log(`[${this.constructor.name}]`, `init() >> `);
    return new Promise((resolve, reject) => {
      this.config = (config) ? config : this.config;
      this.portList = {};
      resolve();
    });
  }

  start(config) {
    return new Promise((resolve, reject) => {
      console.log(`[${this.constructor.name}]`, `start() >> `);
      config = (config) ? config : this.config;
      this.portList = {};
      // this.enginesService = this.laborsManager.getService(`engines-service`).obj;
      this.configTranslator = new ConfigTranslator(this);
      //console.log(`sysport config : ${JSON.stringify(this.config, null, 2)}`);
      let serviceSchema = this.getSchema();
      console.log(`[${this.constructor.name}]`, JSON.stringify(serviceSchema));
      //let list = serviceSchema.config.list;
      let list = serviceSchema.list;
      Object.keys(list).reduce((prevProm, id) => {
        return prevProm
        .then(() => this.addToService(id, list[id]))
        .catch((err) => console.error(err));
      }, Promise.resolve())
      .then(() => resolve())
      .catch((err) => reject(err));
      // for(let i in list) {
      //   await this.addToService(i, list[i]);
      // }
      // resolve();
    });
  }

  add(config) {
    console.log(`[${this.constructor.name}]`, `add() >> `);
    return new Promise((resolve, reject) => {
      let id = null;
      Promise.resolve()
      .then(() => this.generateId())
      .then((generatedId) => id = generatedId)
      .then(() => this.addToConfig(id, config))
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
    console.log(`[${this.constructor.name}]`, `addToConfig() >> `);
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

  addToService(id, schema, options) {
    console.log(`[${this.constructor.name}]`, `addToService("${id}": "${schema.path}") >> `);
    return new Promise((resolve, reject) => {
      ((this.portList[id]) ? this.removeFromService(id) : Promise.resolve())
      .then(() => {
        let port = {
          "schema": schema,
          "object": new SerialPort(schema.path, schema.config)
        };
        port.object.removeAllListeners();
        port.object.on("close", (err) => {
          console.log(`[${this.constructor.name}]`, `Port "${id}" error : `);
          console.error(err);
        });
        this.portList[id] = port;
      })
      .then(() => (options && options.chain) ? this.addToServiceChain(id) : Promise.resolve())
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  addToServiceChain(id) {
    console.log(`[${this.constructor.name}]`, `addToServiceChain(${id}) >> `);
    return new Promise((resolve, reject) => {
      let engines = {};
      let enginesService = null;
      Promise.resolve()
      .then(() => this.laborsManager.getService(`engines-service`))
      .then((service) => enginesService = service.obj)
      .then(() => enginesService.getByConfigAttribute(`port`, id))
      .then((list) => engines = list)
      .then(() => {
        let prom = [];
        for(let i in engines)
          prom.push(enginesService.removeFromService(i));
        return Promise.all(prom);
      })
      .then(() => {
        let prom = [];
        for(let i in engines)
          prom.push(enginesService.addToService(i));
        return Promise.all(prom);
      })
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  remove(id) {
    console.log(`[${this.constructor.name}]`, `remove(${id}) >> `);
    return new Promise((resolve, reject) => {
      this.removeFromConfig(id)
      .then(() => this.removeFromService(id))
      .then(() => resolve({}))
      .catch((err) => reject((err) ? err : new Errors.ErrorObjectNotReturn()));
    });
  }

  removeFromConfig(id) {
    console.log(`[${this.constructor.name}]`, `removeFromConfig(${id}) >> `);
    return new Promise((resolve, reject) => {
      this.configManager.deleteConfig(`service-config.sysport-service.list.${id}`)
      .then(() => resolve())
      .catch((err) => reject((err) ? err : new Errors.ErrorObjectNotReturn()));
    });
  }

  removeFromService(id) {
    console.log(`[${this.constructor.name}]`, `removeFromService(${id}) >> `);
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
    console.log(`[${this.constructor.name}]`, `update(${id}) >> `);
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
    console.log(`[${this.constructor.name}]`, `updateConfig(${id}) >> `);
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
    console.log(`[${this.constructor.name}]`, `updateService(${id}) >> `);
    return new Promise((resolve, reject) => {
      this.removeFromService(id)
      .then(() => this.addToService(id, config, {"chain": true}))
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  get(id, options) {
    options = (options) ? options : (typeof id == `object`) ? id : undefined;
    id = (typeof id == `string`) ? id : (options && options.id) ? options.id : undefined;
    console.log(`[${this.constructor.name}]`, `get(${(id) ? `"${id}"` : ``}) >> `);
    for(let i in this.portList)
      console.log(`[${this.constructor.name}]`, `port id: ${i}`);
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
    console.log(`[${this.constructor.name}]`, `getSerialPortList() >> `);
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
        console.log(`[${this.constructor.name}]`, `port: ${JSON.stringify(ports, null, 2)}`);
        console.log(`[${this.constructor.name}]`, `portList: ${JSON.stringify(portList, null, 2)}`);
        resolve(portList);
      })
      .catch((err) => {
        reject(err);
      });
    });
  }

  generateConfigSchema(params) {
    console.log(`[${this.constructor.name}]`, `generateConfigSchema() >> `);
    return new Promise(async (resolve, reject) => {
      let config = await this.configTranslator.generateConfigSchema(params);
      resolve(config);
    });
  }

  generateId() {
    console.log(`[${this.constructor.name}]`, `generateId() >> `);
    return new Promise((resolve, reject) => {
      let id;
      let maxIndex = 10000;
      Promise.resolve()
      .then(() => this.getSchema({ renew: true }))
      .then((config) => config.list)
      .then((list) => {
        for(let i = 1;i < maxIndex;i++) {
          console.log(`[${this.constructor.name}]`, `id list: ${Object.keys(list)}`);
          id = `port-${i}`;
          if(!list.hasOwnProperty(id))
            break;
        }
        return id;
      })
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    })
  }
}

module.exports = SysportService;