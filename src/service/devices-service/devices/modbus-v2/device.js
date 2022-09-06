/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-underscore-dangle */
// const DEFAULT_START_RETRY_NUMBER = 2;
// const DEFAULT_START_RETRY_DELAY = 60000;
// const MAX_CONTINUOUS_FAIL_CHANGE_STATE = 3;

// const Path = require(`path`);
const { Device } = require(`gateway-addon`);

const ConfigTranslator = require(`./config-translator.js`);
const ScriptBuilder = require(`./script-builder.js`);
// const { resolvePtr } = require("dns");

const DefaultConfig = require(`./defalt-config`);

class ModbusDevice extends Device {
  constructor(devicesService, adapter, id, config) {
    super(adapter, id);
    console.log(`[${this.constructor.name}]`, `constructor(${this.id}) >> `);
    /*
    constructor(adapter, id)
      this.adapter = adapter;
      this.id = id;
      this['@context'] = 'https://iot.mozilla.org/schemas';
      this['@type'] = [];
      this.title = '';
      this.description = '';
      this.properties = new Map();
      this.actions = new Map();
      this.events = new Map();
      this.links = [];
      this.baseHref = null;
      this.pinRequired = false;
      this.pinPattern = null;
      this.credentialsRequired = false;
    */
    this.exConf = {
      "devices-service": devicesService,
      config,
      engine: null,
      script: null,
      startRetryment: {},
      state: {
        last: `unload`,
      },
    };

    this.configTranslator = new ConfigTranslator(
      this.exConf[`devices-service`]
    );
    this.scriptBuilder = new ScriptBuilder();
  }

  init(config = this.exConf.config) {
    console.log(`[${this.constructor.name}]`, `init() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.configTranslator.translate(config))
        .then((schema) => this.initAttr(schema))
        .then(() => this.initEngine(config.engine))
        .then(() => this.initScript(config.script))
        // .then((script) => this.initProperty())
        .then(() => this.initProperty())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  initAttr(schema) {
    console.log(`[${this.constructor.name}]`, `initAttr() >> `);
    return new Promise((resolve, reject) => {
      try {
        // for (let i in schema) this[i] = schema[i];
        Object.keys(schema).forEach((k) => {
          this[k] = schema[k];
        });
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  initProperty() {
    console.log(`[${this.constructor.name}]`, `initProperty() >> `);
    return new Promise((resolve, reject) => {
      const propertiesConfig = this.exConf.config.properties;
      Object.keys(propertiesConfig)
        .reduce((prevProm, id) => {
          return prevProm.then(() =>
            this.addProperty(id, propertiesConfig[id])
          );
        }, Promise.resolve())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  initEngine(engineName) {
    return new Promise((resolve, reject) => {
      const { enginesService } = this.exConf[`devices-service`];
      Promise.resolve()
        .then(() =>
          enginesService.get(this.exConf.config.engine, { object: true })
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
          this.exConf.engine = engine;
        })
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  initScript(scriptName) {
    return new Promise((resolve, reject) => {
      const { scriptsService } = this.exConf[`devices-service`];
      Promise.resolve(
        scriptsService.get(scriptName, { object: true, deep: true })
      )
        .then((script) => {
          const readMap = script.children.find(
            (elem) => elem.name === `readMap.js`
          ).object;
          const calcMap = script.children.find(
            (elem) => elem.name === `calcMap.js`
          ).object;
          this.exConf.script = this.scriptBuilder.buildFullMap(
            readMap,
            calcMap
          );
        })
        .then(() => resolve(this.exConf.script))
        .catch((err) => reject(err));
    });
  }

  getEngine() {
    const { engine } = this.exConf;
    const state = engine ? engine.getState() : null;
    if (state === `running`) {
      return Promise.resolve(engine);
    }
    return this.exConf[`devices-service`].enginesService.get(
      this.exConf.config.engine,
      { object: true }
    );
    // return state === `running` ? engine : null;
  }

  getScript() {
    return this.exConf.script;
  }

  getState() {
    console.log(`[${this.constructor.name}]`, `getState() >> `);
    const state = this._getState();
    if (state !== this.exConf.state.last)
      this.exConf["devices-service"].onDeviceStateChange(this.id, state);
    this.exConf.state.last = state;
    return state;
  }

  _getState() {
    const props = this.getPropertyDescriptions();
    let hasRunningProp = false;
    let hasStoppedProp = false;
    let hasContinuousFail = false;
    const hasStartPending = !!Object.values(this.exConf.startRetryment).find(
      (e) => e.timeout
    );
    // for(let i in props) {
    Object.keys(props).forEach((i) => {
      let prop = this.findProperty(i);
      prop = prop.master ? prop.master : prop;
      // console.log(`${i} period: ${ prop.period && true }`);
      if (prop.period && true) {
        // hasRunningProp = true;
        // if(prop.continuousFail > MAX_CONTINUOUS_FAIL_CHANGE_STATE)
        if (prop.continuousFail >= DefaultConfig.property.continuousFail.max)
          hasContinuousFail = true;
        else hasRunningProp = true;
      } else hasStoppedProp = true;
    });
    // }
    const state =
      // eslint-disable-next-line no-nested-ternary
      hasRunningProp && !hasStoppedProp && !hasContinuousFail
        ? `running`
        : hasRunningProp
        ? `semi-running`
        : hasStartPending
        ? `pending`
        : hasContinuousFail
        ? `continuous-fail`
        : hasStoppedProp
        ? `stopped`
        : `no-property`;
    console.log(`[${this.constructor.name}]`, `state:`, state);
    return state;
  }

  getMetrics() {
    console.log(`[${this.constructor.name}]`, `getMetrics() >> `);
    return this.getPropertyMetrics();
  }

  getPropertyMetrics(id) {
    console.log(
      `[${this.constructor.name}]`,
      `getPropertyMetrics(${id ? `${id}` : ``}) >> `
    );
    return new Promise((resolve, reject) => {
      if (id) {
        let property = this.findProperty(id);
        property = property.master ? property.master : property;
        resolve(property.metrics.get());
      } else {
        const result = {};
        // let propKeyList = Object.keys(this.properties);
        const propKeyList = [];
        this.properties.forEach((property, i) => propKeyList.push(i));
        console.log(`propKeyList: ${propKeyList}`);
        const prom = propKeyList.reduce((prev, next) => {
          console.log(`next: ${next}`);
          return prev
            .then(() => this.getPropertyMetrics(next))
            .then((metrics) => {
              result[next] = metrics;
            })
            .catch((err) => reject(err));
        }, Promise.resolve());
        prom.then(() => resolve(result)).catch((err) => reject(err));
      }
    });
  }

  start() {
    console.log(`[${this.constructor.name}]`, `start() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.enableProperties())
        // .then(() => this.getState())
        .then((ret) => resolve(ret))
        .catch((err) => {
          this.error = err;
          reject(err);
        });
    });
  }

  stop() {
    console.log(`[${this.constructor.name}]`, `stop() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.stopPropertyRetry())
        .then(() => this.disableProperties())
        // .then(() => this.getState())
        .then((ret) => resolve(ret))
        .catch((err) => {
          this.state = `error`;
          this.error = err;
          reject(err);
        });
    });
  }

  addProperty(id, config) {
    console.log(`[${this.constructor.name}]: addProperty() >> `);
    // console.log(`>> config: ${JSON.stringify(config, null, 2)}`);
    return new Promise((resolve, reject) => {
      const PropertyObject = require(`./property/${config.template}/property.js`);
      const property = new PropertyObject(this, id, config);
      try {
        Promise.resolve()
          .then(() => property.init())
          .then(() =>
            this.startPropertyRetry(
              property,
              this.exConf.config.retry ? this.exConf.config.retryNumber : 0,
              this.exConf.config.retry
                ? this.exConf.config.retryDelay
                : undefined
            )
          )
          // .then(() => this.properties.set(id, property))
          .then(() => resolve())
          .catch((err) => reject(err));
      } catch (err) {
        reject(err);
      }
    });
  }

  startPropertyRetry(
    property,
    // retry = DEFAULT_START_RETRY_NUMBER,
    // delay = DEFAULT_START_RETRY_DELAY
    retry = DefaultConfig.device.startRetry.number,
    delay = DefaultConfig.device.startRetry.delay
  ) {
    console.log(
      `[${this.constructor.name}]`,
      `startPropertyRetry(${property.id}, ${retry}) >> `
    );
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.startProperty(property))
        .then((ret) => {
          if (ret) {
            this.exConf.startRetryment[property.id] = { timeout: false };
            this.afterRetryProcess();
            resolve(`started`);
          } else if (retry) {
            // this.exConf.startRetryment[property.id] = true;
            this.exConf.startRetryment[property.id] = {
              timeout: retry
                ? setTimeout(
                    () =>
                      this.startPropertyRetry(
                        property,
                        retry === -1 ? -1 : retry - 1
                      ),
                    delay
                  )
                : undefined,
            };
            // setTimeout(() => this.startPropertyRetry(property, retry == -1 ? -1 : retry - 1), delay);
            resolve(`pending`);
          } else {
            this.exConf.startRetryment[property.id] = { timeout: false };
            console.error(
              new Error(
                `Reach maximum retry number to start property[${property.id}].`
              )
            );
            this.afterRetryProcess();
            resolve(`stopped`);
          }
          // this.afterRetryProcess();
        })
        .catch((err) => reject(err));
    });
  }

  stopPropertyRetry(propertyId) {
    console.log(`[${this.constructor.name}]`, `stopPropertyRetry() >> `);
    if (propertyId) {
      // eslint-disable-next-line no-unused-expressions
      if (
        this.exConf.startRetryment[propertyId] &&
        this.exConf.startRetryment[propertyId].timeout
      )
        clearTimeout(this.exConf.startRetryment[propertyId].timeout);
      this.exConf.startRetryment[propertyId].timeout = undefined;
    } else {
      Object.keys(this.exConf.startRetryment).forEach((id) => {
        this.stopPropertyRetry(id);
      });
    }
  }

  startProperty(property) {
    console.log(
      `[${this.constructor.name}]`,
      `startProperty(${property.id}) >> `
    );
    return new Promise((resolve) => {
      Promise.resolve()
        .then(() => property.start())
        .then(() => resolve(true))
        .catch((err) => {
          console.error(err);
          resolve(false);
        });
    });
  }

  afterRetryProcess() {
    console.log(`[${this.constructor.name}]`, `afterPendingProcess() >> `);
    // Check any property on pending state ?
    const props = this.getPropertyDescriptions();
    let hasRunningProp = false;
    let hasStoppedProp = false;
    const hasStartPending = !!Object.values(this.exConf.startRetryment).find(
      (e) => e.timeout
    );
    // for(let i in props) {
    Object.keys(props).forEach((i) => {
      let prop = this.findProperty(i);
      prop = prop.master ? prop.master : prop;
      // console.log(`${i} period: ${ prop.period && true }`);
      if (prop.period && true) hasRunningProp = true;
      else hasStoppedProp = true;
    });
    // }
    if (hasStartPending) {
      // return ;
    } else if (hasRunningProp) {
      // return ;
    } else if (hasStoppedProp) {
      this.exConf[`devices-service`].removeFromService(this.id);
    }
    return this.getState();
  }

  enableProperties() {
    console.log(`[${this.constructor.name}]`, `enableProperties() >> `);
    return new Promise((resolve, reject) => {
      const promArr = [];
      const props = this.getPropertyDescriptions();
      const propMasterIdArr = [];
      const retry = this.exConf.config.retry
        ? this.exConf.config.retryNumber
        : 0;
      const retryDelay = this.exConf.config.retry
        ? this.exConf.config.retryDelay
        : undefined;
      // console.log(`Properties : ${JSON.stringify(props, null, 2)}`);
      // for(let i in props) {
      Object.keys(props).forEach(i => {
        const prop = this.findProperty(i);
        if (prop.master) {
          if (!propMasterIdArr.includes(prop.master.id)) {
            propMasterIdArr.push(prop.master.id);
            promArr.push(
              this.startPropertyRetry(prop.master, retry, retryDelay)
            );
          }
        } else {
          promArr.push(this.startPropertyRetry(prop, retry, retryDelay));
        }
      });
      //   prop = (prop.master) ? prop.master : prop;
      //   promArr.push(prop.start());
      // }
      Promise.all(promArr)
        .then(() => this.getState())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  disableProperties() {
    console.log(`[${this.constructor.name}]`, `disableProperties() >> `);
    return new Promise((resolve, reject) => {
      const promArr = [];
      const props = this.getPropertyDescriptions();
      // console.log(`Properties : ${JSON.stringify(props, null, 2)}`);
      // for(let i in props) {
      Object.keys(props).forEach(i => {
        let prop = this.findProperty(i);
        prop = prop.master ? prop.master : prop;
        promArr.push(prop.stop());
      });
      // }
      Promise.all(promArr)
        .then(() => this.getState())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  /*
    logObj: {
      "timestamp": "ISO time string eg.: 2011-10-05T14:48:00.000Z",
      "type": "info, warning, error",
      "message": "any message"
    }
  */
}

module.exports = ModbusDevice;
