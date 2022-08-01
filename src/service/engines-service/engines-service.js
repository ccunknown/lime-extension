const { Errors } = require(`../../../constants/constants`);
const Service = require(`../service`);

const ConfigTranslator = require(`./config-translator.js`);

class EnginesService extends Service {
  constructor(extension, config, id) {
    super(extension, config, id);
    console.log(`[${this.constructor.name}]`, `contructor() >> `);
  }

  init(config) {
    console.log(`[${this.constructor.name}]`, `init() >> `);
    try {
      this.sysportService = this.laborsManager.getService(`sysport-service`).obj;
      this.config = config || this.config;
      this.engineList = {};
      this.engineTemplateList = {};
    } catch (err) {
      console.error(err);
    }
    return Promise.resolve();
    // return new Promise((resolve, reject) => {
    //   this.sysportService = this.laborsManager.getService(`sysport-service`).obj;
    //   this.config = config || this.config;
    //   this.engineList = {};
    //   this.engineTemplateList = {};
    //   resolve();
    // });
  }

  start() {
    console.log(`[${this.constructor.name}]`, `start() >> `);
    return new Promise((resolve, reject) => {
      // this.devicesService = this.laborsManager.getService(`devices-service`).obj;
      Promise.resolve()
        .then(() => this.initEngine())
        .then((result) => console.log(`[${this.constructor.name}]`, `initEngine: ${JSON.stringify(result, null, 2)}`))
        .then(() => {
          this.configTranslator = new ConfigTranslator(this);
        })
        .then(() => console.log(`[${this.constructor.name}]`, `engine started`))
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  // initEngine(configuration) {
  initEngine() {
    console.log(`[${this.constructor.name}]`, `initEngine() >> `);
    return new Promise((resolve, reject) => {
      // const config = configuration || this.config;
      Promise.resolve()
        .then(() => this.getTemplate({ deep: true }))
        // eslint-disable-next-line no-return-assign
        .then((engineTemplateList) => {
          this.engineTemplateList = engineTemplateList;
        })
        .then(() => {
          this.engineList = [];
          return this.getSchema();
        })
        .then((schema) => schema.list)
        .then((list) =>
          Object.keys(list).reduce((prevProm, id) => {
            return prevProm.then(() => {
              // eslint-disable-next-line no-underscore-dangle
              if (list[id]._config && list[id]._config.addToService)
                return this.addToService(id, list[id]).catch((err) => console.error(err));
              return Promise.resolve();
            });
          }, Promise.resolve())
        )
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
        .then((iden) => {
          id = iden;
        })
        .then(() => this.addToService(id, config))
        .then(() => this.addToConfig(id, config))
        .then(() => {
          const res = {};
          res[id] = config;
          resolve(res);
        })
        .catch((err) => reject(err));
    });
  }

  addToConfig(id, config) {
    console.log(`[${this.constructor.name}]`, `addToConfig() >> `);
    return new Promise((resolve, reject) => {
      this.configTranslator
        .validate(config)
        .then((validateInfo) => {
          if (validateInfo.errors && validateInfo.errors.length)
            throw new Errors.InvalidConfigSchema(validateInfo.errors);
          else return validateInfo;
        })
        .then(() => this.configManager.addToConfig(config, `service-config.engines-service.list.${id}`))
        .then((res) => resolve(res))
        .catch((err) => reject(err || new Errors.ErrorObjectNotReturn()));
    });
  }

  loadEngine(config, template) {
    console.log(`[${this.constructor.name}]`, `loadEngine() >> `);
    return new Promise((resolve, reject) => {
      console.log(
        `[${this.constructor.name}]`,
        `template: ${JSON.stringify(template, null, 2)}`
      );
      const path = template.path.replace(/^\//, ``);
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const Obj = require(`./${path}/engine.js`);
      const engine = new Obj(this, config);

      this.sysportService
        .get(config.port, { object: true })
        .then((sysportSchema) => engine.init(sysportSchema.object))
        .then(() => engine.start())
        .then(() => resolve(engine))
        .catch((err) => reject(err));
    });
  }

  addToService(id, configuration, options) {
    let config = configuration || undefined;
    console.log(`[${this.constructor.name}]`, `addToService(${id}) >> `);
    console.log(`[${this.constructor.name}]`, `[${id}] config: ${JSON.stringify(config, null, 2)}`);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => config || this.getConfigEngine(id))
        .then((conf) => {
          config = conf;
          config.id = id;
          console.log(`[${this.constructor.name}]`, `config:`, conf);
        })
        .then(() => this.getTemplate({ deep: true }))
        .then((templateList) => {
          console.log(
            `[${this.constructor.name}]`,
            `template list: ${JSON.stringify(templateList)}`
          );
          console.log(
            `[${this.constructor.name}]`,
            `config template: ${config.template}`
          );
          console.log(`[${this.constructor.name}]`, `config:`, config);
          return templateList;
        })
        .then((templateList) =>
          templateList.find((elem) => config.template === elem.name)
        )
        .then((template) => {
          return !template
            ? new Error(`template "${config.template}" not found!`)
            : template;
        })
        .then((template) => this.loadEngine(config, template))
        .then((engine) => {
          this.engineList[id] = engine;
        })
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
        .then((service) => {
          devicesService = service.obj;
        })
        .then(() => devicesService.getDeviceConfigByAttribute(`engine`, id))
        .then((deviceList) => {
          const prom = [];
          Object.keys(deviceList).forEach((identity) => {
            prom.push(devicesService.removeFromService(identity));
          });
          return Promise.all(prom);
        })
        .then(() => devicesService.getDeviceConfigByAttribute(`engine`, id))
        .then((deviceList) =>
          Object.keys(deviceList).reduce((prevProm, identity) => {
            // return this.devicesService.addToService(id);
            return this.addDeviceToService(identity);
          }, Promise.resolve())
        )
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  addDeviceToService(id) {
    console.log(`[${this.constructor.name}]`, `addDeviceToService(${id}) >> `);
    return new Promise((resolve, reject) => {
      let devicesService = null;
      Promise.resolve()
        .then(() => this.laborsManager.getService(`devices-service`))
        .then((service) => {
          devicesService = service.obj;
        })
        .then(() => devicesService.getConfigDevice(id))
        .then((config) =>
          // eslint-disable-next-line no-underscore-dangle
          config._config && config._config.addToService ? devicesService.addToService(id) : Promise.resolve()
        )
        .then(() => resolve())
        .catch((err) => reject(err));
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
      this.configManager
        .deleteConfig(`service-config.engines-service.list.${id}`)
        .then(() => resolve({}))
        .catch((err) => reject(err || new Errors.ErrorObjectNotReturn()));
    });
  }

  // removeFromService(id, options) {
  removeFromService(id) {
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
          const res = {};
          res[id] = config;
          resolve(res);
        })
        .catch((err) => reject(err));
    });
  }

  updateToConfig(id, config) {
    console.log(`[${this.constructor.name}]`, `updateToConfig(${id}) >> `);
    return new Promise((resolve, reject) => {
      this.configTranslator
        .validate(config)
        .then((validateInfo) => {
          if (validateInfo.errors && validateInfo.errors.length)
            throw new Errors.InvalidConfigSchema(validateInfo.errors);
          else return validateInfo;
        })
        .then(() => this.configManager.updateConfig(config, `service-config.engines-service.list.${id}`))
        .then((res) => resolve(res))
        .catch((err) => reject(err || new Errors.ErrorObjectNotReturn()));
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
      const engine = this.get(id, { object: true });
      if (engine) {
        engine
          .start()
          .then(() => resolve())
          .catch((err) => reject(err));
      } else {
        reject(new Errors.ObjectNotFound(id));
      }
    });
  }

  stopEngine(id) {
    console.log(`[${this.constructor.name}]`, `stopEngine("${id}") >> `);
    return new Promise((resolve, reject) => {
      const engine = this.get(id, { object: true });
      if (engine) {
        engine
          .stop()
          .then(() => resolve())
          .catch((err) => reject(err));
      } else {
        console.warn(`[${this.constructor.name}]`, `Object with id "${id}" not found!!!`);
        resolve();
      }
    });
  }

  get(id, opts) {
    const options = opts || (typeof id === `object` ? id : undefined);
    let identity;
    if (typeof id === `string`) identity = id;
    else if (options && options.id) identity = options.id;
    // typeof id === `string` ? id : options && options.id ? options.id : undefined;
    console.log(`[${this.constructor.name}]`, `get(${identity ? `${identity}` : ``}) >> `);
    // return (options && options.object) ? this.getServiceEngine(id, options) : this.getConfigEngine(id, options);
    if (options && options.object && identity) return this.engineList[identity];
    if (options && options.object) return this.engineList;
    return this.getConfigEngine(identity, options);
    // return options && options.object ? (identity ? this.engineList[identity] : this.engineList) : this.getConfigEngine(identity, options);
  }

  getByConfigAttribute(attr, val) {
    console.log(`[${this.constructor.name}]`, `getByConfigAttribute(${attr}, ${val}) >> `);
    return new Promise((resolve, reject) => {
      this.get()
        .then((engines) => {
          const result = {};
          Object.entries(engines).forEach(([key, value]) => {
            if (Object.prototype.hasOwnProperty.call(value, attr) && value[attr] === val) result[key] = value;
            // if (value.hasOwnProperty(attr) && value[attr] === val) result[key] = value;
          });
          // for (const i in engines) {
          //   if (engines[i].hasOwnProperty(attr) && engines[i][attr] == val) result[i] = engines[i];
          // }
          console.log(`[${this.constructor.name}]`, `>> result: ${JSON.stringify(result, null, 2)}`);
          return result;
        })
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  }

  getConfigEngine(identity, options) {
    // const opt = options || (typeof identity === `object` ? identity : undefined);
    // console.log(
    //   `[${this.constructor.name}]`,
    //   `getConfigEngine(${identity}) >> `
    // );
    let id;
    if (typeof identity === `string`) id = identity;
    else if (options && options.id) id = options.id;
    // typeof id === `string` ? id : options && options.id ? options.id : undefined;
    console.log(
      `[${this.constructor.name}]`,
      `getConfigEngine(${id ? `${id}` : ``}) >> `
    );
    return new Promise((resolve, reject) => {
      if (id) {
        this.getSchema({ renew: true })
          .then((conf) => {
            // console.log(`[${this.constructor.name}]`, `config:`, conf);
            if (Object.prototype.hasOwnProperty.call(conf.list, id))
              resolve(conf.list[id]);
            else reject(new Errors.ObjectNotFound(id));
            // conf.list.hasOwnProperty(id) ? resolve(conf.list[id]) : reject(new Errors.ObjectNotFound(id));
          })
          .catch((err) => reject(err));
      } else {
        this.getSchema({ renew: true })
          .then((conf) => {
            console.log(
              `[${this.constructor.name}]`,
              `>> conf: ${JSON.stringify(conf.list, null, 2)}`
            );
            resolve(conf.list);
          })
          .catch((err) => reject(err));
      }
    });
  }

  getServiceEngine(id) {
    console.log(
      `[${this.constructor.name}]`,
      `getServiceEngine(${id ? `${id}` : ``})`
    );
    return new Promise((resolve, reject) => {
      let config = null;
      this.getConfigEngine(id)
        .then((conf) => {
          config = conf;
          return this.getEngineConfigWithState(id);
        })
        .then((service) => {
          const result = JSON.parse(JSON.stringify(config));
          // console.log(`[${this.constructor.name}]`, `service:`, service);
          if (id) result.state = service ? service.state : `disabled`;
          else {
            Object.keys(result).forEach((key) => {
              result[key].state = Object.prototype.hasOwnProperty.call(
                service,
                key
              )
                ? service[key].state
                : `disabled`;
            });
          }
          // for (const i in result)
          //   result[i].state = service.hasOwnProperty(i) ? service[i].state : `disabled`;
          return result;
        })
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  }

  getEngineConfigWithState(identity) {
    console.log(
      `[${this.constructor.name}]`,
      `getEngineConfigWithState(${identity || ``})`
    );
    return new Promise((resolve, reject) => {
      if (identity) {
        const id = identity;
        // if (this.engineList.hasOwnProperty(id)) {
        if (Object.prototype.hasOwnProperty.call(this.engineList, id)) {
          const schema = JSON.parse(JSON.stringify(this.engineList[id].config));
          schema.state = this.engineList[id].getState();
          resolve(schema);
        } else reject(new Errors.ObjectNotFound(id));
      } else {
        const schemas = {};
        Object.keys(this.engineList)
          .reduce((prevProm, id) => {
            return prevProm
              .then(() => this.getEngineConfigWithState(id))
              .then((schema) => {
                schemas[id] = schema;
              })
              .catch((err) => reject(err));
          }, Promise.resolve())
          .then(() =>
            console.log(`[${this.constructor.name}]`, `schemas: `, schemas)
          )
          .then(() => resolve(schemas))
          .catch((err) => reject(err));
      }
    });
  }

  getTemplate(name, options) {
    const opts = options || (typeof name === `object` ? name : {});
    const key = typeof name === `string` ? name : null;
    console.log(`[${this.constructor.name}]`, `getTemplate(${key || ``})`);
    return new Promise((resolve, reject) => {
      let serviceSchema;
      Promise.resolve()
        .then(() => this.getSchema())
        .then((schema) => {
          serviceSchema = schema;
        })
        .then(() => this.getDirectorySchema(serviceSchema.directory, opts))
        .then((dirSchema) => dirSchema.children)
        .then((templateList) => {
          if (key)
            resolve(
              !templateList.find((elem) => elem.name === key)
                ? undefined
                : JSON.parse(JSON.stringify(templateList.find((elem) => elem.name === key)))
            );
          else resolve(templateList);
        })
        .catch((err) => reject(err));
    });
  }

  generateConfigSchema(params) {
    console.log(`[${this.constructor.name}]`, `generateConfigSchema() >> `);
    return new Promise((resolve, reject) => {
      this.configTranslator
        .generateConfigSchema(params)
        .then((schema) => resolve(schema))
        .catch((err) => reject(err));
    });
  }

  generateId() {
    console.log(`[${this.constructor.name}]`, `generateId() >> `);
    return new Promise((resolve, reject) => {
      let id;
      const maxIndex = 10000;
      Promise.resolve()
        .then(() => this.getSchema({ renew: true }))
        .then((config) => config.list)
        .then((list) => {
          for (let i = 1; i < maxIndex; i += 1) {
            console.log(`[${this.constructor.name}]`, `id list: ${Object.keys(list)}`);
            id = `engine-${i}`;
            // if (!list.hasOwnProperty(id)) break;
            if (!Object.prototype.hasOwnProperty.call(list, id)) break;
          }
          return id;
        })
        .then((ret) => resolve(ret))
        .catch((err) => reject(err));
    });
  }
}

module.exports = EnginesService;
