'use strict'

const fs = require(`fs`);
const Path = require(`path`);
const SerialPort = require(`serialport`);

const Service = require(`../service`);
const Database = require('../../lib/my-database');
const {Defaults, Errors} = require('../../../constants/constants');

const ConfigTranslator = require(`./config-translator.js`);

class EnginesService extends Service {
  constructor(extension, config, id) {
    console.log(`EnginesService: contructor() >> `);
    super(extension, config, id);
  }

  init(config) {
    console.log(`EnginesService: init() >> `);
    return new Promise(async (resolve, reject) => {
      //this.sysportService = (await this.laborsManager.getService(`sysport-service`)).obj;
      this.sysportService = this.laborsManager.getService(`sysport-service`).obj;
      //let sysport = this.laborsManager.getService(`sysport-service`);
      //this.sysportService = sysport.obj;
      this.config = (config) ? config : this.config;
      this.engineList = {};
      this.engineTemplateList = {};
      resolve();
    });
  }

  start() {
    return new Promise(async (resolve, reject) => {
      await this.initEngine();
      this.configTranslator = new ConfigTranslator(this);
      resolve();
    });
  }

  initEngine(config) {
    console.log(`EnginesService: initEngine() >> `);
    return new Promise(async (resolve, reject) => {
      config = (config) ? config : this.config;
      this.engineTemplateList = (await this.getTemplate(null, {"deep": true}));
      this.engineList = [];
      let serviceSchema = this.getSchema();
      //let list = serviceSchema.config.list;
      let list = serviceSchema.list;
      for(let i in list) {
        await this.addToService(i, list[i]);
      }
      resolve();
    });
  }

  add(config) {
    console.log(`EnginesService: add("${config.name}")`);
    return new Promise((resolve, reject) => {
      let id = this.generateId();
      this.addToService(id, config)
      .then(() => this.addToConfig(id, config))
      .then(() => {
        let res = {};
        res[id] = config;
        resolve(res);
      })
      .catch((err) => reject(err));
    });
  }

  addToConfig(id, config) {
    console.log(`EnginesService: addToConfig() >> `);
    return new Promise((resolve, reject) => {
      this.configTranslator.validate(config)
      .then((validateInfo) => {
        if(validateInfo.errors && validateInfo.errors.length)
          throw(new Errors.InvalidConfigSchema(validateInfo.errors));
        else
          return validateInfo;
      })
      .then((validateInfo) => this.configManager.addToConfig(config, `service-config.engines-service.list.${id}`))
      .then((res) => resolve(res))
      .catch((err) => reject((err) ? err : new Errors.ErrorObjectNotReturn()));
    });
  }

  addToService(id, config) {
    console.log(`EnginesService: addToService(${id}) >> `);
    return new Promise(async (resolve, reject) => {
      let template = this.engineTemplateList.find((elem) => config.template == elem.name);
      if(template) {
        let path = template.path.replace(/^\//, ``);
        let Obj = require(`./${path}/engine.js`);
        let engine = new (Obj)(this, config);
        let port = (await this.sysportService.get(config.port, {"object": true})).object;
        engine.init(port)
        .then(() => engine.start())
        .then(() => {
          this.engineList[id] = engine;
          resolve({});
        })
        .catch((err) => {
          console.log(`error name: ${err.name}`);
          console.log(`error message: ${err.message}`);
          reject(err)
        });
      }
      else
        reject(new Error(`Engine id "${id}" with template "${config.template}" not found!!!`));
    });
  }

  remove(id) {
    console.log(`EnginesService: remove("${id}")`);
    return new Promise(async (resolve, reject) => {
      this.removeFromConfig(id)
      .then(() => this.removeFromService(id))
      .then(() => resolve({}))
      .catch((err) => reject(err));
    });
  }

  removeFromConfig(id) {
    console.log(`EnginesService: removeFromConfig() >> `);
    return new Promise((resolve, reject) => {
      this.configManager.deleteConfig(`service-config.engines-service.list.${id}`)
      .then(() => resolve())
      .catch((err) => reject((err) ? err : new Errors.ErrorObjectNotReturn()));
    });
  }

  removeFromService(id) {
    console.log(`EnginesService: removeFromService() >> `);
    return new Promise((resolve, reject) => {
      this.stopEngine(id)
      .then(() => delete this.engineList[id])
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  update(id, config) {
    console.log(`EnginesService: update(${id}) >> `);
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
    console.log(`EnginesService: updateConfig(${id}) >> `);
    return new Promise((resolve, reject) => {
      this.configTranslator.validate(config)
      .then((validateInfo) => {
        if(validateInfo.errors && validateInfo.errors.length)
          throw(new Errors.InvalidConfigSchema(validateInfo.errors));
        else
          return validateInfo;
      })
      .then((validateInfo) => this.configManager.updateConfig(config, `service-config.engines-service.list.${id}`))
      .then((res) => resolve(res))
      .catch((err) => reject((err) ? err : new Errors.ErrorObjectNotReturn()));
    });
  }

  updateService(id, config) {
    console.log(`EnginesService: updateService(${id}) >> `);
    return new Promise((resolve, reject) => {
      this.removeFromService(id)
      .then(() => this.addToService(id, config))
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  startEngine(id) {
    console.log(`EnginesService: startEngine("${id}") >> `);
    return new Promise((resolve, reject) => {
      this.get(id, {"object": true})
      .then((engine) => (engine) ? engine.start() : reject(new Errors.ObjectNotFound(id)))
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  stopEngine(id) {
    console.log(`EnginesService: stopEngine("${id}") >> `);
    return new Promise((resolve, reject) => {
      if(this.engineList.hasOwnProperty(id)) {
        this.engineList[id].stop()
        .then(() => resolve())
        .catch((err) => reject(err));
      }
      else {
        resolve();
      }
    });
  }

  get(id, options) {
    options = (options) ? options : (typeof id == `object`) ? id : undefined;
    id = (typeof id == `string`) ? id : (options && options.id) ? options.id : undefined;
    console.log(`EnginesService: get(${(id) ? `${id}` : ``}) >> `);
    return (options && options.object) ? this.getServiceEngine(id, options) : this.getConfigEngine(id, options);
  }

  getSystemEngine(id) {
    console.log(`EnginesService: getSystemEngine(${(id) ? `${id}` : ``}) >> `);
    return new Promise((resolve, reject) => {
      let config = null;
      this.getConfigEngine(id)
      .then((conf) => {
        config = conf;
        return (id) ? this.getServiceEngine(id, {"object": true}) : this.getServiceEngine(null, {"object": true});
      })
      .then((service) => {
        let result = JSON.parse(JSON.stringify(config));
        for(let i in result)
          result[i].state = (service.hasOwnProperty(i)) ? service[i].getState() : `error`;
        return result;
      })
      .then((result) => resolve(result))
      .catch((err) => reject(err));
    });
  }

  getServiceEngine(id, options) {
    options = (options) ? options : (typeof id == `object`) ? id : undefined;
    id = (typeof id == `string`) ? id : (options && options.id) ? options.id : undefined;
    console.log(`EnginesService: getServiceEngine(${(id) ? `${id}` : ``}) >> `);
    return new Promise(async (resolve, reject) => {
      if(options && options.object == true)
        resolve((id) ? this.engineList[id] : this.engineList);
      else {
        if(id) {
          let result = this.engineList[id].config;
          if(options && options.state)
            result.state = this.engineList[id].getState();
          resolve(result);
        }
        else {
          let engineList = {};
          for(let i in this.engineList)
            engineList[i] = await this.get(i, options);
          resolve(engineList);
        }
      }
    });
  }

  getConfigEngine(id, options) {
    options = (options) ? options : (typeof id == `object`) ? id : undefined;
    id = (typeof id == `string`) ? id : (options && options.id) ? options.id : undefined;
    console.log(`EnginesService: getConfigEngine(${(id) ? `${id}` : ``}) >> `);
    return new Promise(async (resolve, reject) => {
      if(id) {
        this.getSchema({"renew": true})
        .then((conf) => (conf.list.hasOwnProperty(id)) ? resolve(conf.list[id]) : reject(new Errors.ObjectNotFound(id)))
        .catch((err) => reject(err));
      }
      else {
        this.getSchema({"renew": true})
        .then((conf) => {
          console.log(`conf: ${JSON.stringify(conf.list, null, 2)}`);
          resolve(conf.list)
        })
        .catch((err) => reject(err));
      }
    });
  }

  // getByAttribute(attr, val) {
  //   return this.engineList.find((elem) => elem.schema[attr] == val);
  // }

  getTemplate(key, options) {
    console.log(`EnginesService: getTemplate(${(key) ? key : ``})`);
    return new Promise(async (resolve, reject) => {
      let serviceSchema = this.getSchema();
      let templateList = (await this.getDirectorySchema(serviceSchema.directory, options)).children;
      if(key) {
        if(!templateList.find((elem) => elem.name == key))
          resolve(undefined);
        else {
          let engine = JSON.parse(JSON.stringify(templateList.find((elem) => elem.name == key)));
          resolve(engine);
        }
      }
      else {
        resolve(templateList);
      }
    });
  }

  generateConfigSchema(params) {
    console.log(`EnginesService: generateConfigSchema() >> `);
    return new Promise((resolve, reject) => {
      this.configTranslator.generateConfigSchema(params)
      .then((schema) => resolve(schema))
      .catch((err) => reject(err));
    });
  }

  generateId() {
    console.log(`EnginesService: generateId() >> `);
    let id;
    let maxIndex = 10000;
    for(let i = 1;i < maxIndex;i++) {
      id = `engine-${i}`;
      if(!this.engineList.hasOwnProperty(id))
        break;
    }
    return id;
  }
}

module.exports = EnginesService;