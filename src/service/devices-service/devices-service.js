/* eslint-disable no-nested-ternary */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
/* eslint-disable max-classes-per-file */
// const { Adapter, Device, Property } = require("gateway-addon");

// eslint-disable-next-line import/no-extraneous-dependencies

const Path = require(`path`);
const Service = require(`../service`);
// const Database = require(`../../lib/my-database`);
// const {Defaults, Errors} = require(`../../../constants/constants`);
const { Errors } = require(`../../../constants/constants`);

const ConfigTranslator = require(`./config-translator.js`);

// const PropertyWorker = require(`./property-worker`);

class DevicesService extends Service {
  constructor(extension, config, id) {
    console.log(`DevicesService: contructor() >> `);
    super(extension, config, id);
    /*
    constructor(extension, config, id) {
      super(extension.addonManager, extension.manifest.id);

      this.extension = extension;
      this.manifest = extension.manifest;
      this.addonManager = extension.addonManager;
      this.laborsManager = this.extension.laborsManager;
      this.configManager = this.extension.configManager;
      this.routesManager = this.extension.routesManager;

      this.config = JSON.parse(JSON.stringify(config));
      this.id = id;
    */
    this.devices = {};
    this.deviceState = {
      period: null,
      state: {},
    };
    this.sharedResource = {};
  }

  init(config) {
    console.log(`[${this.constructor.name}]`, `init() >> `);
    return new Promise((resolve, reject) => {
      try {
        this.config = config || this.config;
        // this.initAdapter();
        this.scriptsService =
          this.laborsManager.getService(`scripts-service`).obj;
        this.enginesService =
          this.laborsManager.getService(`engines-service`).obj;
        this.rtcpeerService =
          this.laborsManager.getService(`rtcpeer-service`).obj;
        this.configTranslator = new ConfigTranslator(this);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  initDevices() {
    console.log(`[${this.constructor.name}]`, `initDevices() >> `);
    return new Promise((resolve, reject) => {
      const serviceSchema = this.getSchema();
      const { list } = serviceSchema;

      Object.keys(list)
        .reduce((prevProm, id) => {
          return prevProm
            .then(() =>
              list[id]._config && list[id]._config.enable
                ? this.addToService(id, list[id])
                : Promise.resolve()
            )
            .catch((err) => console.error(err));
        }, Promise.resolve())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  onDeviceStateChange(id, state) {
    console.log(
      `[${this.constructor.name}]`,
      `onDeviceStateChange(${id}, ${state}) >> `
    );
    Promise.resolve()
      .then(() => this.getServiceDevice(id))
      .then((schema) =>
        this.rtcpeerService.publish(
          `/service/devices-service/service-device/${id}`,
          schema
        )
      )
      .catch((err) => console.error(err));
  }

  start() {
    console.log(`[${this.constructor.name}]`, `start() >> `);
    return new Promise((resolve, reject) => {
      this.scriptsService =
        this.laborsManager.getService(`scripts-service`).obj;
      this.enginesService =
        this.laborsManager.getService(`engines-service`).obj;
      this.configTranslator = new ConfigTranslator(this);
      Promise.resolve()
        .then(() => this.initDevices())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  stop() {
    console.log(`[${this.constructor.name}]`, `stop() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.getServiceDevice())
        .then((services) => {
          const redArr = Object.keys(services);
          return redArr.reduce((prev, next) => {
            return prev
              .then(() => this.stopDevice(next))
              .catch((err) => reject(err));
          }, Promise.resolve());
        })
        .then(() => resolve({}))
        .catch((err) => reject(err));
    });
  }

  startDevice(id) {
    console.log(`[${this.constructor.name}]`, `startDevice(${id})`);
    return new Promise((resolve, reject) => {
      // const wtDevice = this.adapter.getDevice(id);
      const device = this.devices[id];
      if (!device) reject(new Errors.ObjectNotFound(`${id}`));
      else {
        Promise.resolve()
          .then(() => device.start())
          .then(() => resolve())
          .catch((err) => reject(err));
      }
    });
  }

  stopDevice(id) {
    console.log(`[${this.constructor.name}]`, `stopDevice(${id})`);
    return new Promise((resolve, reject) => {
      // const wtDevice = this.adapter.getDevice(id);
      const device = this.devices[id];
      if (!device) reject(new Errors.ObjectNotFound(`${id}`));
      else {
        Promise.resolve()
          .then(() => device.stop())
          .then(() => resolve())
          .catch((err) => reject(err));
      }
    });
  }

  add(config) {
    console.log(`[${this.constructor.name}]`, `add() >> `);
    // console.log(`config: ${JSON.stringify(config, null, 2)}`);
    return new Promise((resolve, reject) => {
      let id;
      Promise.resolve()
        .then(() => this.configTranslator.validate(config))
        .then(() => this.getTemplate(config.template, { deep: true }))
        .then((template) =>
          template
            ? this.generateId()
            : new Error(`Template '${config.template}' not found!!!`)
        )
        .then((i) => {
          id = i;
        })
        .then(() => this.addToConfig(id, config))
        .then(() => this.addToService(id, config))
        .then(() => this.reloadConfig())
        .then(() => this.getServiceDevice(id))
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  }

  // addToService(id, config, options) {
  addToService(id, configuration) {
    console.log(
      //
      `[${this.constructor.name}]`,
      `addToService(${id}) >> `
    );
    console.log(
      `[${this.constructor.name}]`,
      `[${id}] config: ${JSON.stringify(configuration, null, 2)}`
    );
    return new Promise((resolve, reject) => {
      // console.log(`add: ${JSON.stringify(configuration, null, 2)}`);
      //  Initial
      // let device;
      // const wtDevice = this.adapter.getDevice(id);
      let device = this.devices[id];
      let config = configuration;
      Promise.resolve()
        //  Check duplicate & remove.
        .then(() => (device ? Promise.resolve() : this.removeFromService(id)))
        //  Identify config.
        .then(() =>
          config ? Promise.resolve(config) : this.getConfigDevice(id)
        )
        .then((conf) => {
          config = JSON.parse(JSON.stringify(conf));
        })
        //  Get device template.
        .then(() => this.getTemplate(config.template, { deep: true }))
        .then((template) => {
          if (!template)
            throw new Error(
              `Device template '${config.template}' not found!!!`
            );
          const path = Path.join(__dirname, `${template.path}`, `device.js`);
          const Obj = require(path);
          device = new Obj(this, id, config);
        })
        .then(() => device.oo.init())
        // .then(() => this.applyObjectOptions(id, options))
        .then(() => {
          this.devices[id] = device;
        })
        .then(() => device.getState())
        .then(() => device.to.wtDevice.asThing())
        .then((ret) => resolve(ret))
        .catch((err) => {
          reject(err);
        });
    });
  }

  addToConfig(id, config) {
    console.log(`[${this.constructor.name}]`, `addToConfig(id) >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() =>
          this.configManager.addToConfig(
            config,
            `service-config.devices-service.list.${id}`
          )
        )
        .then((res) => resolve(res))
        .catch((err) => reject(err || new Errors.ErrorObjectNotReturn()));
    });
  }

  remove(id) {
    console.log(`[${this.constructor.name}]`, `removeDevice() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.removeFromConfig(id))
        .then(() => this.removeFromService(id))
        .then(() => resolve({}))
        .catch((err) => reject(err));
    });
  }

  removeFromConfig(id) {
    console.log(`[${this.constructor.name}]`, `removeFromConfig(${id}) >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() =>
          this.configManager.deleteConfig(
            `service-config.devices-service.list.${id}`
          )
        )
        .then(() => resolve({}))
        .catch((err) => reject(err));
    });
  }

  removeFromService(id) {
    console.log(`[${this.constructor.name}]`, `removeFromService(${id}) >> `);
    return new Promise((resolve, reject) => {
      const device = this.devices[id];
      if (device) {
        Promise.resolve()
          .then(() => device.oo.stop())
          .then(() => delete this.devices[id])
          .then(() => resolve({}))
          .catch((err) => reject(err));
      } else {
        console.warn(`>> Device "${id}" not in service!!!`);
        resolve({});
      }
    });
  }

  update(id, config) {
    console.log(
      `[${this.constructor.name}]`,
      `update(${id ? `${id}` : ``}) >> `
    );
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.configTranslator.validate(config))
        // .then((valid) => (valid.errors && valid.errors.length) ?
        //   reject(new Errors.InvalidConfigSchema(valid)) :
        //   this.remove(id))
        .then(() => this.remove(id))
        .then(() => this.add(config))
        .then(() => resolve({}))
        .catch((err) => reject(err));
    });
  }

  get(id, options) {
    console.log(`[${this.constructor.name}]`, `get(${id})`);
    return new Promise((resolve, reject) => {
      try {
        if (options && options.object)
          resolve(id ? this.devices[id] : this.devices);
        else if (id) {
          const device = this.devices[id];
          const json = device.to.wtDevice.asThing();
          resolve(JSON.parse(JSON.stringify(json)));
        } else {
          const deviceList = this.devices;
          const json = [];
          Object.values(deviceList).forEach((dev) =>
            json.push(dev.to.wtDevice.asThing())
          );
          // for(let i in deviceList)
          //   json.push(deviceList[i].asThing());
          resolve(JSON.parse(JSON.stringify(json)));
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  getByConfigAttribute(attr, value) {
    console.log(
      `[${this.constructor.name}]`,
      `getByConfigAttribute(${attr}, ${value})`
    );
    return new Promise((resolve, reject) => {
      try {
        const result = {};
        Object.keys(this.devices).forEach((i) => {
          if (
            Object.prototype.hasOwnProperty.call(
              this.devices[i].config,
              attr
            ) &&
            this.devices[i].config[attr] === value
          )
            result[i] = this.devices[i];
        });
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  }

  getConfigDevice(id) {
    console.log(
      `[${this.constructor.name}]`,
      `getConfigDevice(${id ? `${id}` : ``})`
    );
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.getSchema({ renew: true }))
        .then((conf) => {
          // console.log(`>> getSchema(): ${JSON.stringify(conf, null, 2)}`);
          const { list } = conf;
          resolve(
            // eslint-disable-next-line no-nested-ternary
            id
              ? Object.prototype.hasOwnProperty.call(list, id)
                ? list[id]
                : {}
              : list
          );
        })
        .catch((err) => reject(err));
    });
  }

  getServiceDevice(id) {
    console.log(
      `[${this.constructor.name}]`,
      `getServiceDevice(${id ? `${id}` : ``})`
    );
    return new Promise((resolve, reject) => {
      let config = null;
      let state = null;
      Promise.resolve()
        .then(() => this.getConfigDevice(id))
        .then((conf) => {
          config = conf;
          // return this.getDeviceConfigWithState(id);
          return this.getDeviceState(id);
        })
        .then((s) => {
          state = s;
        })
        .then(() => {
          const result = JSON.parse(JSON.stringify(config));
          // console.log(`>> result: ${JSON.stringify(result, null, 2)}`);
          if (id) result.state = state;
          else {
            // for(let i in result) {
            Object.keys(result).forEach((i) => {
              if (Object.prototype.hasOwnProperty.call(state, i))
                result[i].state = state[i];
              else result[i].state = `undefined`;
            });
            // }
          }
          return result;
        })
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  }

  getDeviceState(id) {
    console.log(`[${this.constructor.name}]`, `getDeviceState(${id || ``})`);
    return new Promise((resolve, reject) => {
      if (id) {
        const device = this.devices[id] ? this.devices[id] : undefined;
        let config = null;
        const subCondition = {
          config: `unavailable`,
          enable: false,
          inServiceList: false,
          objectState: `undefined`,
          serveQuality: 0,
        };
        Promise.resolve()
          // Check device config (unavailable, invalid, valid).
          .then(() => this.getConfigDevice(id))
          .then((conf) => {
            config = conf;
          })
          .then(() => this.isValidConfig(config))
          .then((valid) => {
            subCondition.config =
              !config || !Object.keys(config).length
                ? `unavailable`
                : valid
                ? `valid`
                : `invalid`;
          })
          //  Enable ?
          .then(() => {
            subCondition.enable = config
              ? config._config.enable
              : subCondition.enable;
          })
          //  In service list ?
          .then(() => {
            subCondition.inServiceList = !!device;
          })
          //  Device state ?
          .then(() => (device ? device.getState() : subCondition.objectState))
          .then((deviceState) => {
            subCondition.objectState = deviceState;
          })
          //  Device serve quality ? (0 - 100)
          // .then(() => (device ? device.mb.buildMetric))
          .then(() => resolve(subCondition))
          .catch((err) => reject(err));
      } else {
        const result = {};
        Promise.resolve()
          .then(() => this.getConfigDevice())
          .then((config) =>
            Object.keys(config).reduce((prevProm, i) => {
              return prevProm
                .then(() => this.getDeviceState(i))
                .then((state) => {
                  result[i] = state;
                });
            }, Promise.resolve())
          )
          .then(() => resolve(result))
          .catch((err) => reject(err));
      }
    });
  }

  isValidConfig(config) {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.configTranslator.validate(config))
        .then(() => resolve(true))
        .catch((err) => {
          if (err.name === `InvalidConfigSchema`) resolve(false);
          else reject(err);
        });
    });
  }

  getDeviceConfigWithState(id) {
    console.log(
      `[${this.constructor.name}]`,
      `getDeviceConfigWithState(${id ? `${id}` : ``})`
    );
    return new Promise((resolve, reject) => {
      if (id) {
        const device = this.devices[id];
        const schema = JSON.parse(JSON.stringify(device.exConf.config));
        Promise.resolve()
          .then(() => device.getState())
          .then((state) => {
            schema.state = state;
            resolve(schema);
          })
          .catch((err) => reject(err));
      } else {
        const schemas = {};
        const redArr = Object.keys(this.devices);
        const reduceProm = redArr.reduce((prev, deviceId) => {
          return prev
            .then(() => this.getDeviceConfigWithState(deviceId))
            .then((schema) => {
              schemas[deviceId] = schema;
            })
            .catch((err) => reject(err));
        }, Promise.resolve());
        reduceProm.then(() => resolve(schemas)).catch((err) => reject(err));
      }
    });
  }

  getDeviceConfigByAttribute(attr, val) {
    console.log(
      `[${this.constructor.name}]`,
      `getDeviceConfigByAttribute(${attr}, ${val}) >> `
    );
    // getConfigDeviceByAttribute(attr, val) {
    //   console.log(`DevicesService: getConfigDeviceByAttribute(${attr}, ${val}) >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.getConfigDevice())
        .then((config) => {
          const result = {};
          // for(let i in config)
          Object.keys(config).forEach((i) => {
            if (
              Object.prototype.hasOwnProperty.call(config[i], attr) &&
              config[i][attr] === val
            )
              result[i] = JSON.parse(JSON.stringify(config[i]));
          });
          return result;
        })
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  }

  generateConfigSchema(params) {
    console.log(`[${this.constructor.name}]`, `generateConfigSchema() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.configTranslator.generateConfigSchema(params))
        .then((config) => resolve(config))
        .catch((err) => reject(err));
    });
  }

  generatePropertyId(params) {
    console.log(`[${this.constructor.name}]`, `generatePropertyId() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.configTranslator.generatePropertyId(params))
        .then((result) => resolve(result))
        .catch((err) => reject(err));
    });
  }

  translateConfig(config) {
    console.log(`[${this.constructor.name}]`, `getConfigTranslation() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.configTranslator.translate(config))
        .then((translated) => resolve(translated))
        .catch((err) => reject(err));
    });
  }

  getTemplate(name, options) {
    console.log(`[${this.constructor.name}]`, `getTemplate(${name || ``})`);
    return new Promise((resolve, reject) => {
      const serviceSchema = this.getSchema();
      if (name) {
        // let result = null;
        const opttmp = options ? JSON.parse(JSON.stringify(options)) : {};
        opttmp.object = false;

        Promise.resolve()
          .then(() => this.getDirectorySchema(serviceSchema.directory, options))
          .then((deviceDir) =>
            deviceDir.children.find((elem) => elem.name === name)
          )
          .then((device) =>
            device ? this.getDirectorySchema(device.path, options) : null
          )
          .then((res) => resolve(res))
          .catch((err) => reject(err));
      } else {
        Promise.resolve()
          .then(() => this.getDirectorySchema(serviceSchema.directory, options))
          .then((deviceList) => resolve(deviceList.children))
          .catch((err) => reject(err));
      }
    });
  }

  getCompatibleScript(tagArr) {
    console.log(`[${this.constructor.name}]`, `getCompatibleScript() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.scriptsService.get(null, { deep: true }))
        .then((scripts) => {
          const result = scripts.filter((elem) => {
            // console.log(`tags: ${elem.meta.tags}`);
            return !!elem.meta.tags.find((e) => tagArr.includes(e));
          });
          return result.map((elem) => elem.name);
        })
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  }

  getCompatibleEngine(tagArr) {
    console.log(
      `[${this.constructor.name}]`,
      `getCompatibleEngine(${tagArr.toString()}) >> `
    );
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.enginesService.getSchema({ renew: true }))
        .then((schema) => {
          const engines = schema.list;
          const result = this.jsonToArray(engines, `id`).filter((elem) =>
            tagArr.includes(elem.template)
          );
          return result.map((elem) => elem.id);
        })
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  }

  getEngineTemplateName(engineName) {
    console.log(
      `[${this.constructor.name}]`,
      `getEngineTemplateName(${engineName})`
    );
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.enginesService.getSchema({ renew: true }))
        .then((config) =>
          Object.prototype.hasOwnProperty.call(config.list, engineName)
            ? config.list[engineName].template
            : null
        )
        .then((res) => resolve(res))
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
            console.log(
              `[${this.constructor.name}]`,
              `id list: ${Object.keys(list)}`
            );
            id = `lime-device-${i}`;
            if (!Object.prototype.hasOwnProperty.call(list, id)) break;
          }
          return id;
        })
        .then((ret) => resolve(ret))
        .catch((err) => reject(err));
    });
  }

  setSharedResource(key, obj, overwrite = false) {
    if (
      overwrite ||
      !Object.prototype.hasOwnProperty.call(this.sharedResource, key)
    )
      this.sharedResource[key] = obj;
  }

  getSharedResource(key) {
    return this.sharedResource[key];
  }
}

module.exports = DevicesService;
