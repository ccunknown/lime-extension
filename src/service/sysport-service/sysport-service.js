/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-nested-ternary */
const Service = require(`../service`);
// const Database = require(`../../lib/my-database`);
// const { Defaults, Errors } = require(`../../../constants/constants`);
const { Errors } = require(`../../../constants/constants`);

const ConfigTranslator = require(`./config-translator.js`);

const SerialPort = require(`serialport`);

class SysportService extends Service {
  constructor(extension, config, id) {
    super(extension, config, id);
    console.log(`[${this.constructor.name}]`, `contructor() >> `);
  }

  init(config) {
    console.log(`[${this.constructor.name}]`, `init() >> `);
    return new Promise((resolve) => {
      this.config = config || this.config;
      this.portList = {};
      resolve();
    });
  }

  start(conf) {
    return new Promise((resolve, reject) => {
      console.log(`[${this.constructor.name}]`, `start() >> `);
      // eslint-disable-next-line no-unused-vars
      const config = conf || this.config;
      this.portList = {};
      // this.enginesService = this.laborsManager.getService(`engines-service`).obj;
      this.configTranslator = new ConfigTranslator(this);
      // console.log(`sysport config : ${JSON.stringify(this.config, null, 2)}`);
      const serviceSchema = this.getSchema();
      console.log(`[${this.constructor.name}]`, JSON.stringify(serviceSchema));
      const { list } = serviceSchema;
      Object.keys(list)
        .reduce((prevProm, id) => {
          return prevProm
            .then(() => this.addToService(id, list[id]))
            .catch((err) => console.error(err));
        }, Promise.resolve())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  loadObject(config, template) {
    console.log(`[${this.constructor.name}]`, `loadObject() >> `);
    return new Promise((resolve, reject) => {
      console.log(`[${this.constructor.name}]`, `template:`, template);
      let object;
      Promise.resolve()
        .then(() => {
          const path = template.path.replace(/^\//, ``);
          const Obj = require(`./${path}/sysport.js`);
          object = new Obj(this, config);
        })
        .then(() => object.init())
        .then(() =>
          Object.prototype.hasOwnProperty.call(object, `oo`) &&
          typeof object.oo.start === `function`
            ? object.oo.start()
            : object.start()
        )
        .then(() => resolve(object))
        .catch((err) => reject(err));
    });
  }

  add(config) {
    console.log(`[${this.constructor.name}]`, `add() >> `);
    return new Promise((resolve, reject) => {
      let id = null;
      Promise.resolve()
        .then(() => this.generateId())
        .then((generatedId) => {
          id = generatedId;
        })
        .then(() => this.addToConfig(id, config))
        .then(() => this.addToService(id, config))
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
      Promise.resolve()
        .then(() => this.configTranslator.validate(config))
        .then((validateInfo) => {
          if (validateInfo.errors && validateInfo.errors.length)
            throw new Errors.InvalidConfigSchema(validateInfo.errors);
          else return validateInfo;
        })
        .then(() =>
          this.configManager.addToConfig(
            config,
            `service-config.sysport-service.list.${id}`
          )
        )
        .then((res) => resolve(res))
        .catch((err) => reject(err || new Errors.ErrorObjectNotReturn()));
    });
  }

  addToService(id, configuration, options) {
    let config = configuration
      ? JSON.parse(JSON.stringify(configuration))
      : undefined;
    console.log(
      `[${this.constructor.name}]`,
      `addToService("${id}", "${config.path}") >> `
    );
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => config || this.getConfigSysport(id))
        .then((conf) => {
          config = conf;
          config.id = id;
          console.log(`[${this.constructor.name}]`, `config:`, conf);
        })
        .then(() => this.getTemplate({ deep: true }))
        .then((templateList) => {
          console.log(
            `[${this.constructor.name}]`,
            `config template: ${config.template}`
          );
          // console.log(`[${this.constructor.name}]`, `config`, config);
          return templateList;
        })
        .then((templateList) =>
          templateList.find((e) => config.template === e.name)
        )
        .then((template) => {
          return !template
            ? new Error(`template "${config.template}" not found!`)
            : template;
        })
        .then((template) => this.loadObject(config, template))
        .then((sysport) => {
          this.portList[id] = sysport;
        })
        .then(() => options && options.chain && this.addToServiceChain(id))
        .then(() => resolve(config))
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
        .then((service) => {
          enginesService = service.obj;
        })
        .then(() => enginesService.getByConfigAttribute(`port`, id))
        .then((list) => {
          engines = list;
        })
        .then(() => {
          const prom = [];
          Object.keys(engines).forEach((i) => {
            prom.push(enginesService.removeFromService(i));
          });
          return Promise.all(prom);
        })
        .then(() => {
          const prom = [];
          Object.keys(engines).forEach((i) =>
            prom.push(enginesService.addToService(i))
          );
          return Promise.all(prom);
        })
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  remove(id) {
    console.log(`[${this.constructor.name}]`, `remove(${id}) >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.removeFromConfig(id))
        .then(() => this.removeFromService(id))
        .then(() => resolve({}))
        .catch((err) => reject(err || new Errors.ErrorObjectNotReturn()));
    });
  }

  removeFromConfig(id) {
    console.log(`[${this.constructor.name}]`, `removeFromConfig(${id}) >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() =>
          this.configManager.deleteConfig(
            `service-config.sysport-service.list.${id}`
          )
        )
        .then(() => resolve())
        .catch((err) => reject(err || new Errors.ErrorObjectNotReturn()));
    });
  }

  removeFromService(id) {
    console.log(`[${this.constructor.name}]`, `removeFromService(${id}) >> `);
    return new Promise((resolve, reject) => {
      const port = this.portList[id];
      Promise.resolve()
        .then(() => {
          if (!port) throw new Error(`Port "${id}" not found!!!`);
          port.stop();
          delete this.portList[id];
        })
        .then(() => resolve())
        .catch((err) => reject(err));
      // if (port.port.isOpen) {
      //   port.object.close((err) => {
      //     if (err) reject(err);
      //     delete this.portList[id];
      //     resolve();
      //   });
      // } else {
      //   delete this.portList[id];
      //   resolve();
      // }
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
          if (key) {
            const found = templateList.find((elem) => elem.name === key);
            return found ? JSON.parse(JSON.stringify(found)) : undefined;
          }
          return templateList;
        })
        .then((ret) => resolve(ret))
        .catch((err) => reject(err));
    });
  }

  get(identity, opt) {
    const options =
      opt || (typeof identity === `object` ? identity : undefined);
    const id =
      typeof identity === `string`
        ? identity
        : options && options.id
        ? options.id
        : undefined;
    console.log(
      `[${this.constructor.name}]`,
      `get(${id ? `"${id}"` : ``}) >> `
    );
    Object.keys(this.portList).forEach((i) => {
      console.log(`[${this.constructor.name}]`, `port id: ${i}`);
    });
    return new Promise((resolve) => {
      if (options && options.object === true)
        resolve(id ? this.portList[id] : this.portList);
      else if (id) resolve(this.portList[id]);
      else {
        const portList = {};
        Object.keys(this.portList).forEach((i) => {
          portList[i] = this.portList[i].config;
        });
        resolve(portList);
      }
    });
  }

  getByAttribute(attr, val) {
    let result = null;
    Object.keys(this.portList).forEach((i) => {
      if (this.portList[i].config[attr] === val) result = this.portList[i];
    });
    return result;
  }

  getSerialPortList() {
    console.log(`[${this.constructor.name}]`, `getSerialPortList() >> `);
    return new Promise((resolve, reject) => {
      const portList = [];
      Promise.resolve()
        .then(() => SerialPort.list())
        .then((ports) => {
          ports.forEach((port) => {
            portList.push({
              path: port.path,
              pnpId: port.pnpId ? port.pnpId : null,
              manufacturer: port.manufacturer ? port.manufacturer : null,
            });
          });
          console.log(
            `[${this.constructor.name}]`,
            `port: ${JSON.stringify(ports, null, 2)}`
          );
          console.log(
            `[${this.constructor.name}]`,
            `portList: ${JSON.stringify(portList, null, 2)}`
          );
          resolve(portList);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  update(id, config) {
    console.log(`[${this.constructor.name}]`, `update(${id}) >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.updateConfig(id, config))
        .then(() => this.updateService(id, config))
        .then(() => {
          const res = {};
          res[id] = config;
          resolve(res);
        })
        .catch((err) => reject(err));
    });
  }

  updateConfig(id, config) {
    console.log(`[${this.constructor.name}]`, `updateConfig(${id}) >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.configTranslator.validate(config))
        .then((validateInfo) => {
          if (validateInfo.errors && validateInfo.errors.length)
            throw new Errors.InvalidConfigSchema(validateInfo.errors);
          else return validateInfo;
        })
        // .then((validateInfo) =>
        .then(() =>
          this.configManager.updateConfig(
            config,
            `service-config.sysport-service.list.${id}`
          )
        )
        .then((res) => resolve(res))
        .catch((err) => reject(err || new Errors.ErrorObjectNotReturn()));
    });
  }

  updateService(id, config) {
    console.log(`[${this.constructor.name}]`, `updateService(${id}) >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.removeFromService(id))
        .then(() => this.addToService(id, config, { chain: true }))
        .then(() => resolve())
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
            id = `port-${i}`;
            if (!Object.prototype.hasOwnProperty.call(list, id)) break;
          }
          return id;
        })
        .then((ret) => resolve(ret))
        .catch((err) => reject(err));
    });
  }
}

module.exports = SysportService;
