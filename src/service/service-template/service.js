/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-nested-ternary */
const SERVICE_OBJECT_NAME_PAIR = {
  "devices-service": `device`,
  "engines-service": `engine`,
  "ioports-service": `ioports`,
};

const Path = require(`path`);
const { EventEmitter } = require(`events`);

const serviceTools = require(`./service-tools`);
const ServiceObjects = require(`./service-objects`);
const ServiceShareResource = require(`./service-share-resource`);
const ServiceDirectory = require(`./service-directory`);

class Service extends EventEmitter {
  constructor(extension, config, id) {
    super(extension.addonManager, extension.manifest.id);

    this.extension = extension;
    this.manifest = extension.manifest;
    this.addonManager = extension.addonManager;
    this.id = id;
    this.laborsManager = this.extension.laborsManager;
    this.configManager = this.extension.configManager;
    this.routesManager = this.extension.routesManager;

    // Assign 'service-tools' function into 'Service' object.
    Object.entries(serviceTools).forEach(([k, fn]) => {
      this[k] = fn;
    });

    this.config = JSON.parse(JSON.stringify(config));
    this.id = id;
    this.serviceDir = Path.join(Path.join(__dirname, `../`), this.id);

    this.objects = new ServiceObjects(this);
    this.shareResource = new ServiceShareResource();
    this.directory = new ServiceDirectory(this.serviceDir);

    if (![`scripts-service`, `rtcpeer-service`].includes(id)) {
      console.log(`[${this.constructor.name}]`, `id:`, id);
      this.scriptsService =
        this.laborsManager.getService(`scripts-service`).obj;
      this.rtcpeerService =
        this.laborsManager.getService(`rtcpeer-service`).obj;
      const ConfigTranslatorObject = require(`../${this.id}/config-translator`);
      this.configTranslator = new ConfigTranslatorObject(this);
    }

    this.setupConfigHandler();
    // console.log(`Service constructor : ${this.id}`);
  }

  /*
    Config management section.
  */

  getConfig(options) {
    if (options && options.renew) {
      return this.reloadConfig();
    }
    return this.config;
  }

  reloadConfig() {
    console.log(`[${this.constructor.name}]`, `reloadConfig() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.configManager.getConfig(`service-config.${this.id}`))
        .then((ret) => JSON.parse(JSON.stringify(ret)))
        .then((ret) => {
          this.config = ret;
        })
        .then(() => resolve(this.config))
        .catch((err) => reject(err));
    });
  }

  setupConfigHandler() {
    this.configManager.event.on(`new-config`, () => {
      console.log(`New config!`);
    });
  }

  /*
    Config translator section.
  */

  generateConfigSchema(params) {
    console.log(`[${this.constructor.name}]`, `generateConfigSchema() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.configTranslator.generateConfigSchema(params))
        .then((schema) => resolve(schema))
        .catch((err) => reject(err));
    });
  }

  isValidConfig(config) {
    console.log(`[${this.constructor.name}]`, `isValidConfig() >> `);
    return new Promise((resolve, reject) => {
      // console.log(`config:`, config);
      Promise.resolve()
        .then(() => this.configTranslator.validate(config))
        .then(() => resolve(true))
        .catch((err) => {
          if (err.name === `InvalidConfigSchema`) resolve(false);
          else reject(err);
        });
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

  /*
    Get object from other layer
  */

  getDevice(objectId, options = { object: true }) {
    return this.getObjectFromService(`devices-service`, objectId, options);
  }

  getDeviceConfig(objectId) {
    return this.getObjectFromService(`devices-service`, objectId);
  }

  getEngine(objectId, options = { object: true }) {
    return this.getObjectFromService(`engines-service`, objectId, options);
  }

  getEngineConfig(objectId) {
    return this.getObjectFromService(`engines-service`, objectId);
  }

  getIoport(objectId, options = { object: true }) {
    return this.getObjectFromService(`ioports-service`, objectId, options);
  }

  getIoportConfig(objectId) {
    return this.getObjectFromService(`ioports-service`, objectId);
  }

  getObjectFromService(serviceId, objectId, options) {
    const service = this.laborsManager.getService(serviceId).obj;
    return options && options.object
      ? service.objects.get(objectId, options)
      : service.objects.getConfig(objectId);
  }

  /*
    Get compatiable object
  */

  getCompatibleEngine(tagArr) {
    console.log(
      `[${this.constructor.name}]`,
      `getCompatibleEngine(${tagArr.toString()}) >> `
    );
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.laborsManager.getService(`engines-service`).obj)
        .then((enginesService) => enginesService.getConfig({ renew: true }))
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

  /*
    Miscellaneous section
  */

  generateId(prefix = `lime-${SERVICE_OBJECT_NAME_PAIR[this.id]}`) {
    console.log(`[${this.constructor.name}]`, `generateId() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        // .then(() => this.getSchema({ renew: true }))
        .then(() => this.getConfig({ renew: true }))
        .then((config) => Object.keys(config.list))
        // .then((list) => {
        //   for (let i = 1; i < maxIndex; i += 1) {
        //     console.log(
        //       `[${this.constructor.name}]`,
        //       `id list: ${Object.keys(list)}`
        //     );
        //     id = `${prefix}-${i}`;
        //     if (!Object.prototype.hasOwnProperty.call(list, id)) break;
        //   }
        //   return id;
        // })
        .then((keyList) => {
          let generated;
          let i = 0;
          do {
            i += 1;
            generated = `${prefix}-${i}`;
          } while (keyList.includes(generated));
          console.log(`got id:`, generated);
          return generated;
        })
        .then((ret) => resolve(ret))
        .catch((err) => reject(err));
    });
  }
}

module.exports = Service;
