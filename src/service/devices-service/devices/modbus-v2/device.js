/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-underscore-dangle */
// const DEFAULT_START_RETRY_NUMBER = 2;
// const DEFAULT_START_RETRY_DELAY = 60000;
// const MAX_CONTINUOUS_FAIL_CHANGE_STATE = 3;

const Path = require(`path`);

const ConfigTranslator = require(`./config-translator.js`);
const ScriptBuilder = require(`./script-builder.js`);

const DeviceTemplate = require(`../../device-template/period-queue-style/device-template.js`);

class ModbusDevice extends DeviceTemplate {
  constructor(devicesService, id, config) {
    super(devicesService, id, config);
    console.log(`[${this.constructor.name}]`, `constructor(${this.id}) >> `);

    // this.devicesService = devicesService;
    // this.config = config;
    this.engine = null;
    this.script = null;

    this.configTranslator = new ConfigTranslator(devicesService);
    this.scriptBuilder = new ScriptBuilder();
  }

  init(config = this.config) {
    console.log(`[${this.constructor.name}]`, `init() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.configTranslator.translate(config))
        .then(() => this.initEngine(config.engine))
        .then(() => this.initScript(config.script))
        .then(() => this.initProperty())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  initProperty() {
    console.log(`[${this.constructor.name}]`, `initProperty() >> `);
    return new Promise((resolve, reject) => {
      const propertiesConfig = this.config.properties;
      Object.keys(propertiesConfig)
        .reduce(
          (prevProm, id) =>
            prevProm
              .then(() => this.oo.addChild(id, propertiesConfig[id]))
              .catch((err) => this.om.obj.error(err)),
          Promise.resolve()
        )
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  initEngine(engineName) {
    return new Promise((resolve, reject) => {
      const { enginesService } = this.devicesService;
      Promise.resolve()
        .then(() =>
          enginesService.objects.get(this.config.engine, { object: true })
        )
        .then((engine) => {
          if (!engine)
            throw new Error(`Engine "${engineName}" not in service.`);
          engine.event.on(`running`, () =>
            this.getScript() ? this.enableProperties() : null
          );
          engine.event.on(`error`, () => {
            console.log(`[${this.constructor.name}]`, `on engine error >> `);
            this.disableProperties();
          });
          this.engine = engine;
        })
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  initScript(scriptName) {
    return new Promise((resolve, reject) => {
      const { scriptsService } = this.devicesService;
      Promise.resolve()
        .then(() =>
          scriptsService.get(scriptName, { object: true, deep: true })
        )
        .then((script) => {
          const readMap = script.children.find(
            (elem) => elem.name === `readMap.js`
          ).object;
          const calcMap = script.children.find(
            (elem) => elem.name === `calcMap.js`
          ).object;
          this.script = this.scriptBuilder.buildFullMap(readMap, calcMap);
        })
        .then(() => resolve(this.script))
        .catch((err) => reject(err));
    });
  }

  // getEngine() {
  //   const state = this.engine ? this.engine.getState() : null;
  //   if (state === `running`) {
  //     return Promise.resolve(this.engine);
  //   }
  //   return this.devicesService.enginesService.objects.get(this.config.engine, {
  //     object: true,
  //   });
  // }
  getEngine(engineName = this.config.engine) {
    return new Promise((resolve) => {
      Promise.resolve()
        .then(() => this.devicesService.getEngine(engineName))
        .then((engine) => resolve(engine))
        .catch((err) => {
          this.om.obj.error(err);
          resolve(null);
        });
    });
  }

  getScript() {
    return this.script;
  }

  // eslint-disable-next-line class-methods-use-this
  getState() {
    return this.oo.getState();
  }
}

module.exports = ModbusDevice;
