'use strict'

const Service = require(`../service`);
const { Defaults, Errors } = require('../../../constants/constants');

const ConfigTranslator = require(`./config-translator.js`);

class EnginesService extends Service {
  constructor(extension, config, id) {
    super(extension, config, id);
    console.log(`[${this.constructor.name}]`, `contructor() >> `);
  }

  init(config) {
    console.log(`[${this.constructor.name}]`, `init() >> `);
    return new Promise((resolve, reject) => {
      this.sysportService = this.laborsManager.getService(`sysport-service`).obj;
      this.config = (config) ? config : this.config;
      this.engineList = {};
      this.engineTemplateList = {};
      resolve();
    });
  }

  start() {
    console.log(`[${this.constructor.name}]`, `start() >> `);
    return new Promise((resolve, reject) => {
      // this.devicesService = this.laborsManager.getService(`devices-service`).obj;
      Promise.resolve()
      .then(() => this.initEngine())
      .then((result) => console.log(
        `[${this.constructor.name}]`, 
        `initEngine: ${JSON.stringify(result, null, 2)}`
      ))
      .then(() => this.configTranslator = new ConfigTranslator(this))
      .then(() => console.log(`[${this.constructor.name}]`, `engine started`))
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  initEngine(config) {
    console.log(`[${this.constructor.name}]`, `initEngine() >> `);
    return new Promise((resolve, reject) => {
      config = (config) ? config : this.config;
      Promise.resolve()
      .then(() => this.getTemplate({"deep": true}))
      .then((engineTemplateList) => this.engineTemplateList = engineTemplateList)
      .then(() => {
        this.engineList = [];
        return this.getSchema();
      })
      .then((schema) => schema.list)
      .then((list) => Object.keys(list).reduce((prevProm, id) => {
        return prevProm.then(() => {
          if(list[id]._config && list[id]._config.addToService)
            return this.addToService(id, list[id])
            .catch((err) => console.error((err)));
          else
            return Promise.resolve();
        })
      }, Promise.resolve()))
      .then(() => console.log(`[${this.constructor.name}]`, `initEngine complete`))
      // }, Promise.resolve()).then(() => resolve({})))
      .then(() => resolve({}))
      .catch((err) => reject(err));
    });
  }

  add(config) {
    console.log(`[${this.constructor.name}]`, `add("${config.name}")`);
    console.log(`[${this.constructor.name}]`, `config: ${JSON.stringify(config, null, 2)}`);
    return new Promise((resolve, reject) => {
      // let id = this.generateId();
      let id;
      Promise.resolve()
      .then(() => this.generateId())
      .then((iden) => id = iden)
      .then(() => this.addToService(id, config))
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
    console.log(`[${this.constructor.name}]`, `addToConfig() >> `);
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
    console.log(`[${this.constructor.name}]`, `loadEngine`);
    return new Promise((resolve, reject) => {
      console.log(`[${this.constructor.name}]`, `template: ${JSON.stringify(template, null, 2)}`);
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
    console.log(`[${this.constructor.name}]`, `addToService(${id}) >> `);
    console.log(`[${this.constructor.name}]`, `[${id}] config: ${JSON.stringify(config, null, 2)}`);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => config ? config : this.getConfigEngine(id))
      .then((conf) => config = conf)
      .then(() => this.getTemplate({"deep": true}))
      .then((templateList) => {
        console.log(
          `[${this.constructor.name}]`, 
          `template list: ${JSON.stringify(templateList)}`
        );
        console.log(
          `[${this.constructor.name}]`,
          `config template: ${config.template}`
        )
        return templateList;
      })
      .then((templateList) => templateList.find((elem) => config.template == elem.name))
      .then((template) => {
        return (!template) ? new Error(`template "${config.template}" not found!`) : template;
      })
      .then((template) => this.loadEngine(config, template))
      .then((engine) => this.engineList[id] = engine)
      .then(() => options && options.chain && this.addToServiceChain(id))
      .then(() => resolve(config))
      .catch((err) => reject(err));
    });
  }

  addToServiceChain(id) {
    console.log(`[${this.constructor.name}]`, `addToServiceChain(${id}) >> `);
    return new Promise((resolve, reject) => {
      let devicesService = null;
      Promise.resolve()
      .then(() => this.laborsManager.getService(`devices-service`))
      .then((service) => devicesService = service.obj)
      .then(() => devicesService.getDeviceConfigByAttribute(`engine`, id))
      .then((deviceList) => {
        let prom = [];
        Object.keys(deviceList).forEach((id) => {
          prom.push(devicesService.removeFromService(id))
        });
        return Promise.all(prom);
      })
      .then(() => devicesService.getDeviceConfigByAttribute(`engine`, id))
      .then((deviceList) => Object.keys(deviceList).reduce((prevProm, id) => {
        // return this.devicesService.addToService(id);
        return this.addDeviceToService(id);
      }, Promise.resolve()))
      .then(() => resolve())
      .catch((err) => reject(err))
    });
  }

  addDeviceToService(id) {
    console.log(`[${this.constructor.name}]`, `addDeviceToService(${id}) >> `);
    return new Promise((resolve, reject) => {
      let devicesService = null;
      Promise.resolve()
      .then(() => this.laborsManager.getService(`devices-service`))
      .then((service) => devicesService = service.obj)
      .then(() => devicesService.getConfigDevice(id))
      .then((config) => 
        (config._config && config._config.addToService)
          ? devicesService.addToService(id)
          : Promise.resolve()
      )
      .then(() => resolve())
      .catch((err) => reject());
    });
  }

  remove(id) {
    console.log(`[${this.constructor.name}]`, `remove("${id}")`);
    return new Promise((resolve, reject) => {
      this.removeFromConfig(id)
      .then(() => this.removeFromService(id))
      .then(() => resolve({}))
      .catch((err) => reject(err));
    });
  }

  removeFromConfig(id) {
    console.log(`[${this.constructor.name}]`, `removeFromConfig() >> `);
    return new Promise((resolve, reject) => {
      this.configManager.deleteConfig(`service-config.engines-service.list.${id}`)
      .then(() => resolve({}))
      .catch((err) => reject((err) ? err : new Errors.ErrorObjectNotReturn()));
    });
  }

  removeFromService(id, options) {
    console.log(`[${this.constructor.name}]`, `removeFromService() >> `);
    return new Promise((resolve, reject) => {
      this.stopEngine(id)
      .then(() => delete this.engineList[id])
      // .then(() => this.applyObjectOptions(id, options))
      .then(() => resolve({}))
      .catch((err) => reject(err));
    });
  }

  update(id, config) {
    console.log(`[${this.constructor.name}]`, `update(${id}) >> `);
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
    console.log(`[${this.constructor.name}]`, `updateToConfig(${id}) >> `);
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
    console.log(`[${this.constructor.name}]`, `updateToService(${id}) >> `);
    return new Promise((resolve, reject) => {
      this.removeFromService(id)
      .then(() => this.addToService(id, config))
      // .then(() => this.updateToServiceChain(id))
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  startEngine(id) {
    console.log(`[${this.constructor.name}]`, `startEngine("${id}") >> `);
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
    console.log(`[${this.constructor.name}]`, `stopEngine("${id}") >> `);
    return new Promise((resolve, reject) => {
      let engine = this.get(id, {"object": true});
      if(engine) {
        engine.stop()
        .then(() => resolve())
        .catch((err) => reject(err));
      }
      else {
        console.warn(`[${this.constructor.name}]`, `Object with id "${id}" not found!!!`);
        resolve();
      }
    });
  }

  get(id, options) {
    options = (options) ? options : (typeof id == `object`) ? id : undefined;
    id = (typeof id == `string`) ? id : (options && options.id) ? options.id : undefined;
    console.log(`[${this.constructor.name}]`, `get(${(id) ? `${id}` : ``}) >> `);
    // return (options && options.object) ? this.getServiceEngine(id, options) : this.getConfigEngine(id, options);
    return (options && options.object) 
    ? (
        (id) 
          ? this.engineList[id] 
          : this.engineList
      ) 
    : this.getConfigEngine(id, options);
  }

  getByConfigAttribute(attr, val) {
    console.log(`[${this.constructor.name}]`, `getByConfigAttribute(${attr}, ${val}) >> `);
    return new Promise((resolve, reject) => {
      this.get()
      .then((engines) => {
        let result = {};
        for(let i in engines) {
          if(engines[i].hasOwnProperty(attr) && engines[i][attr] == val)
            result[i] = engines[i];
        }
        console.log(`[${this.constructor.name}]`, `>> result: ${JSON.stringify(result, null, 2)}`);
        return result;
      })
      .then((res) => resolve(res))
      .catch((err) => reject(err));
    });
  }

  getConfigEngine(id, options) {
    options = (options) ? options : (typeof id == `object`) ? id : undefined;
    id = (typeof id == `string`) ? id : (options && options.id) ? options.id : undefined;
    console.log(`[${this.constructor.name}]`, `getConfigEngine(${(id) ? `${id}` : ``}) >> `);
    return new Promise((resolve, reject) => {
      if(id) {
        this.getSchema({"renew": true})
        .then((conf) => (conf.list.hasOwnProperty(id)) ? resolve(conf.list[id]) : reject(new Errors.ObjectNotFound(id)))
        .catch((err) => reject(err));
      }
      else {
        this.getSchema({"renew": true})
        .then((conf) => {
          console.log(`[${this.constructor.name}]`, `>> conf: ${JSON.stringify(conf.list, null, 2)}`);
          resolve(conf.list)
        })
        .catch((err) => reject(err));
      }
    });
  }

  getServiceEngine(id) {
    console.log(`[${this.constructor.name}]`, `getServiceEngine(${(id) ? `${id}` : ``})`);
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
          result.state = (service) ? service.state : `disabled`;
        else
          for(let i in result)
            result[i].state = (service.hasOwnProperty(i)) ? service[i].state : `disabled`;
        return result;
      })
      .then((res) => resolve(res))
      .catch((err) => reject(err));
    });
  }

  getEngineConfigWithState(id) {
    console.log(`[${this.constructor.name}]`, `getEngineConfigWithState(${(id) ? `${id}`: ``})`);
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
    options = options ? options : (typeof key === `object`) ? key : {};
    key = typeof key === `string` ? key : null;
    console.log(`[${this.constructor.name}]`, `getTemplate(${(key) ? key : ``})`);
    return new Promise((resolve, reject) => {
      let serviceSchema;
      Promise.resolve()
      .then(() => this.getSchema())
      .then((schema) => serviceSchema = schema)
      .then(() => this.getDirectorySchema(serviceSchema.directory, options))
      .then((dirSchema) => dirSchema.children)
      .then((templateList) => {
        if(key)
          resolve((!templateList.find((elem) => elem.name == key))
            ? undefined
            : JSON.parse(JSON.stringify(templateList.find((elem) => elem.name == key)))
          );
        else
          resolve(templateList);
      })
      .catch((err) => reject(err));
    });
  }

  generateConfigSchema(params) {
    console.log(`[${this.constructor.name}]`, `generateConfigSchema() >> `);
    return new Promise((resolve, reject) => {
      this.configTranslator.generateConfigSchema(params)
      .then((schema) => resolve(schema))
      .catch((err) => reject(err));
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
          id = `engine-${i}`;
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

module.exports = EnginesService;