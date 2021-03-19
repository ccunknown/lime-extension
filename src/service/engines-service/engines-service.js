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
    return new Promise((resolve, reject) => {
      this.sysportService = this.laborsManager.getService(`sysport-service`).obj;
      this.config = (config) ? config : this.config;
      this.engineList = {};
      this.engineTemplateList = {};
      resolve();
    });
  }

  start() {
    console.log(`EnginesService: start() >> `);
    return new Promise((resolve, reject) => {
      this.devicesService = this.laborsManager.getService(`devices-service`).obj;
      this.initEngine()
      .then((result) => console.log(`initEngine: ${JSON.stringify(result, null, 2)}`))
      .then(() => this.configTranslator = new ConfigTranslator(this))
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  initEngine(config) {
    console.log(`EnginesService: initEngine() >> `);
    return new Promise((resolve, reject) => {
      config = (config) ? config : this.config;

      this.getTemplate(null, {"deep": true})
      .then((engineTemplateList) => this.engineTemplateList = engineTemplateList)
      .then(() => {
        this.engineList = [];
        return this.getSchema().list;
      })
      .then((list) => Object.keys(list).reduce((prevProm, id) => {
        if(list[id]._config && list[id]._config.addToService)
          return this.addToService(id, list[id]);
        else
          return Promise.resolve();
      }, Promise.resolve()))
      .then(() => resolve({}))
      .catch((err) => reject(err));
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

  loadEngine(config, template) {
    console.log(`EnginesService: loadEngine`);
    return new Promise((resolve, reject) => {
      let path = template.path.replace(/^\//, ``);
      let Obj = require(`./${path}/engine.js`);
      let engine = new (Obj)(this, config);

      this.sysportService.get(config.port, {"object": true})
      .then((sysportSchema) => engine.init(sysportSchema.object))
      .then(() => engine.start())
      .then(() => resolve(engine))
      .catch((err) => reject(err));
    });
  }

  addToService(id, config, options) {
    console.log(`EnginesService: addToService(${id}) >> `);
    return new Promise((resolve, reject) => {

      ((!config) ? config = this.getConfigEngine(id) : Promise.resolve())
      .then(() => this.getTemplate(null, {"deep": true}))
      .then((templateList) => templateList.find((elem) => config.template == elem.name))
      .then((template) => {
        return (!template) ? new Error(`template "${config.template}" not found!`) : template;
      })
      .then((template) => this.loadEngine(config, template))
      .then((engine) => this.engineList[id] = engine)
      .then(() => this.addToServiceChain(id))
      .then(() => resolve(config))
      .catch((err) => reject(err));
    });
  }

  addToServiceChain(id) {
    console.log(`EnginesService: addToServiceChain(${id}) >> `);
    return new Promise((resolve, reject) => {
      let devices = {};
      // this.devicesService.getByConfigAttribute(`engine`, id)
      this.devicesService.getDeviceConfigByAttribute(`engine`, id)
      .then((deviceList) => {
        let prom = [];
        Object.keys(deviceList).forEach((id) => {
          prom.push(this.devicesService.removeFromService(id))
        });
        return Promise.all(prom);
      })
      .then(() => this.devicesService.getDeviceConfigByAttribute(`engine`, id))
      .then((deviceList) => Object.keys(deviceList).reduce((prevProm, id) => {
        // return this.devicesService.addToService(id);
        return this.addDeviceToService(id);
      }, Promise.resolve()))
      .then(() => resolve())
      .catch((err) => reject(err))
    });
  }

  addDeviceToService(id) {
    console.log(`EnginesService: addDeviceToService(${id}) >> `);
    return new Promise((resolve, reject) => {
      this.devicesService.getConfigDevice(id)
      .then((config) => (config._config && config._config.addToService) ?
        this.devicesService.addToService(id) :
        Promise.resolve()
      )
      .then(() => resolve())
      .catch((err) => reject());
    });
  }

  remove(id) {
    console.log(`EnginesService: remove("${id}")`);
    return new Promise((resolve, reject) => {
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
      .then(() => resolve({}))
      .catch((err) => reject((err) ? err : new Errors.ErrorObjectNotReturn()));
    });
  }

  removeFromService(id, options) {
    console.log(`EnginesService: removeFromService() >> `);
    return new Promise((resolve, reject) => {
      this.stopEngine(id)
      .then(() => delete this.engineList[id])
      // .then(() => this.applyObjectOptions(id, options))
      .then(() => resolve({}))
      .catch((err) => reject(err));
    });
  }

  update(id, config) {
    console.log(`EnginesService: update(${id}) >> `);
    return new Promise((resolve, reject) => {
      this.updateToConfig(id, config)
      .then(() => this.updateToService(id, config))
      .then(() => {
        let res = {};
        res[id] = config;
        resolve(res);
      })
      .catch((err) => reject(err));
    });
  }

  updateToConfig(id, config) {
    console.log(`EnginesService: updateToConfig(${id}) >> `);
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

  updateToService(id, config) {
    console.log(`EnginesService: updateToService(${id}) >> `);
    return new Promise((resolve, reject) => {
      this.removeFromService(id)
      .then(() => this.addToService(id, config))
      // .then(() => this.updateToServiceChain(id))
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  startEngine(id) {
    console.log(`EnginesService: startEngine("${id}") >> `);
    return new Promise((resolve, reject) => {
      let engine = this.get(id, {"object": true});
      if(engine) {
        engine.start()
        .then(() => resolve())
        .catch((err) => reject(err));
      }
      else {
        reject(new Errors.ObjectNotFound(id));
      }
    });
  }

  stopEngine(id) {
    console.log(`EnginesService: stopEngine("${id}") >> `);
    return new Promise((resolve, reject) => {
      let engine = this.get(id, {"object": true});
      if(engine) {
        engine.stop()
        .then(() => resolve())
        .catch((err) => reject(err));
      }
      else {
        console.warn(`Object with id "${id}" not found!!!`);
        resolve();
      }
    });
  }

  get(id, options) {
    options = (options) ? options : (typeof id == `object`) ? id : undefined;
    id = (typeof id == `string`) ? id : (options && options.id) ? options.id : undefined;
    console.log(`EnginesService: get(${(id) ? `${id}` : ``}) >> `);
    // return (options && options.object) ? this.getServiceEngine(id, options) : this.getConfigEngine(id, options);
    return (options && options.object) ? ((id) ? this.engineList[id] : this.engineList) : this.getConfigEngine(id, options);
  }

  getByConfigAttribute(attr, val) {
    console.log(`EnginesService: getByConfigAttribute(${attr}, ${val}) >> `);
    return new Promise((resolve, reject) => {
      this.get()
      .then((engines) => {
        let result = {};
        for(let i in engines) {
          if(engines[i].hasOwnProperty(attr) && engines[i][attr] == val)
            result[i] = engines[i];
        }
        console.log(`>> result: ${JSON.stringify(result, null, 2)}`);
        return result;
      })
      .then((res) => resolve(res))
      .catch((err) => reject(err));
    });
  }

  getConfigEngine(id, options) {
    options = (options) ? options : (typeof id == `object`) ? id : undefined;
    id = (typeof id == `string`) ? id : (options && options.id) ? options.id : undefined;
    console.log(`EnginesService: getConfigEngine(${(id) ? `${id}` : ``}) >> `);
    return new Promise((resolve, reject) => {
      if(id) {
        this.getSchema({"renew": true})
        .then((conf) => (conf.list.hasOwnProperty(id)) ? resolve(conf.list[id]) : reject(new Errors.ObjectNotFound(id)))
        .catch((err) => reject(err));
      }
      else {
        this.getSchema({"renew": true})
        .then((conf) => {
          console.log(`>> conf: ${JSON.stringify(conf.list, null, 2)}`);
          resolve(conf.list)
        })
        .catch((err) => reject(err));
      }
    });
  }

  getServiceEngine(id) {
    console.log(`EnginesService: getServiceEngine(${(id) ? `${id}` : ``})`);
    return new Promise((resolve, reject) => {
      let config = null;
      this.getConfigEngine(id)
      .then((conf) => {
        config = conf;
        return this.getEngineConfigWithState(id);
      })
      .then((service) => {
        let result = JSON.parse(JSON.stringify(config));
        if(id)
          result.state = (service) ? service.state : `not in service`;
        else
          for(let i in result)
            result[i].state = (service.hasOwnProperty(i)) ? service[i].state : `not in service`;
        return result;
      })
      .then((res) => resolve(res))
      .catch((err) => reject(err));
    });
  }

  getEngineConfigWithState(id) {
    console.log(`EnginesService: getEngineConfigWithState(${(id) ? `${id}`: ``})`);
    return new Promise((resolve, reject) => {
      if(id) {
        if(this.engineList.hasOwnProperty(id)) {
          let schema = JSON.parse(JSON.stringify(this.engineList[id].config));
          schema.state = this.engineList[id].getState();
          resolve(schema);
        }
        else
          reject(new Errors.ObjectNotFound(id));
      }
      else {
        let schemas = {};
        Object.keys(this.engineList).reduce((prevProm, id) => {
          return prevProm
          .then(() => this.getEngineConfigWithState(id))
          .then((schema) => schemas[id] = schema)
          .catch((err) => reject(err));
        }, Promise.resolve())
        .then(() => resolve(schemas))
        .catch((err) => reject(err));
      }
    });
  }

  getTemplate(key, options) {
    console.log(`EnginesService: getTemplate(${(key) ? key : ``})`);
    return new Promise((resolve, reject) => {
      let serviceSchema = this.getSchema();
      let templateList = {};

      this.getDirectorySchema(serviceSchema.directory, options)
      .then((dirSchema) => dirSchema.children)
      .then((templateList) => {
        if(key)
          resolve((!templateList.find((elem) => elem.name == key))
            ? undefined
            : JSON.parse(JSON.stringify(templateList.find((elem) => elem.name == key))));
        else
          resolve(templateList);
      })
      .catch((err) => reject(err));
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