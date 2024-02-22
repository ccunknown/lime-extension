/* eslint-disable no-nested-ternary */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
/* eslint-disable max-classes-per-file */
// const { Adapter, Device, Property } = require("gateway-addon");

// eslint-disable-next-line import/no-extraneous-dependencies

// const Path = require(`path`);
const Service = require(`../service-template/service`);
// const Database = require(`../../lib/my-database`);
// const {Defaults, Errors} = require(`../../../constants/constants`);
// const { ObjectServiceState } = require(`../object-template/object-state`);
// const { Errors } = require(`../../../constants/constants`);

// const ConfigTranslator = require(`./config-translator.js`);

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
  }

  init(config) {
    console.log(`[${this.constructor.name}]`, `init() >> `);
    return new Promise((resolve, reject) => {
      try {
        this.config = config || this.config;
        // this.initAdapter();
        // this.scriptsService =
        //   this.laborsManager.getService(`scripts-service`).obj;
        this.enginesService =
          this.laborsManager.getService(`engines-service`).obj;
        // this.rtcpeerService =
        //   this.laborsManager.getService(`rtcpeer-service`).obj;
        // this.configTranslator = new ConfigTranslator(this);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  initDevices() {
    console.log(`[${this.constructor.name}]`, `initDevices() >> `);
    return new Promise((resolve, reject) => {
      // const serviceSchema = this.getSchema();
      const serviceConfig = this.getConfig();
      const { list } = serviceConfig;

      Object.keys(list)
        .reduce((prevProm, id) => {
          return prevProm
            .then(() =>
              list[id].enable
                ? this.objects.addToService(id, list[id])
                : Promise.resolve()
            )
            .catch((err) => console.error(err));
        }, Promise.resolve())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  // onDeviceStateChange(id, state) {
  //   console.log(
  //     `[${this.constructor.name}]`,
  //     `onDeviceStateChange(${id}, ${state}) >> `
  //   );
  //   Promise.resolve()
  //     .then(() => this.getServiceDevice(id))
  //     .then((schema) =>
  //       this.rtcpeerService.publish(
  //         `/service/devices-service/service-device/${id}`,
  //         schema
  //       )
  //     )
  //     .catch((err) => console.error(err));
  // }

  start() {
    console.log(`[${this.constructor.name}]`, `start() >> `);
    return new Promise((resolve, reject) => {
      this.scriptsService =
        this.laborsManager.getService(`scripts-service`).obj;
      this.enginesService =
        this.laborsManager.getService(`engines-service`).obj;
      // this.configTranslator = new ConfigTranslator(this);
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
        // .then(() => this.getServiceDevice())
        .then(() => this.objects.get(null, { object: true }))
        .then((services) => {
          const redArr = Object.keys(services);
          return redArr.reduce((prev, id) => {
            return prev
              .then(() =>
                console.log(`[${this.constructor.name}]`, `stop id:`, id)
              )
              .then(() => this.objects.removeFromService(id))
              .catch((err) => reject(err));
          }, Promise.resolve());
        })
        .then(() => resolve({}))
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

  // getEngineTemplateName(engineName) {
  //   console.log(
  //     `[${this.constructor.name}]`,
  //     `getEngineTemplateName(${engineName})`
  //   );
  //   return new Promise((resolve, reject) => {
  //     Promise.resolve()
  //       .then(() => this.enginesService.getSchema({ renew: true }))
  //       .then((config) =>
  //         Object.prototype.hasOwnProperty.call(config.list, engineName)
  //           ? config.list[engineName].template
  //           : null
  //       )
  //       .then((res) => resolve(res))
  //       .catch((err) => reject(err));
  //   });
  // }
}

module.exports = DevicesService;
