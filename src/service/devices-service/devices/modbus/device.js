'use strict'

const MAXIMUM_MODBUS_READ_AMOUNT = 10;
const WARNING_MESSAGE_STACK_SIZE = 20;
const DEFAULT_START_RETRY_NUMBER = 2;
const DEFAULT_START_RETRY_DELAY = 60000;

const Path = require(`path`);
const { Device } = require(`gateway-addon`);

const ConfigTranslator = require(`./config-translator.js`);
const ScriptBuilder = require(`./script-builder.js`);
const { resolvePtr } = require("dns");

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
      "config": config,
      "engine": null,
      "script": null,
      "startRetryment": {},
      "state": {
        "last": `unload`
      }
    };

    this.log = [
      // {
      //   "timestamp": "ISO time string eg.: 2011-10-05T14:48:00.000Z",
      //   "type": "info, warning, error",
      //   "message": "any message"
      // }
    ];

    this.configTranslator = new ConfigTranslator(this.exConf[`devices-service`]);
    this.scriptBuilder = new ScriptBuilder();
  }

  init(config = this.exConf.config) {
    console.log(`[${this.constructor.name}]`, `init() >> `);
    return new Promise((resolve, reject) => {
      this.configTranslator.translate(config)
      .then((schema) => this.initAttr(schema))
      .then(() => this.initEngine(config.engine))
      .then(() => this.initScript(config.script))
      .then((script) => this.initProperty())
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  initAttr(schema) {
    console.log(`[${this.constructor.name}]`, `initAttr() >> `);
    return new Promise((resolve, reject) => {
      for(let i in schema)
        this[i] = schema[i];
      resolve();
    });
  }

  initProperty() {
    console.log(`[${this.constructor.name}]`, `initProperty() >> `);
    return new Promise((resolve, reject) => {
      let propertiesConfig = this.exConf.config.properties;
      Object.keys(propertiesConfig).reduce((prevProm, id) => {
        return prevProm.then(() => this.addProperty(id, propertiesConfig[id]));
      }, Promise.resolve())
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  initEngine(engineName) {
    return new Promise((resolve, reject) => {
      let enginesService = this.exConf[`devices-service`].enginesService;
      Promise.resolve(enginesService.get(this.exConf.config.engine, {"object": true}))
      .then((engine) => {
        if(!engine)
          throw new Error(`Engine "${engineName}" not in service.`);
        engine.event.on(`running`, () => this.getScript() ? this.enableProperties() : null);
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
      let scriptsService = this.exConf[`devices-service`].scriptsService;
      Promise.resolve(scriptsService.get(scriptName, {"object": true, "deep": true}))
      .then((script) => {
        let readMap = script.children.find((elem) => elem.name == `readMap.js`).object;
        let calcMap = script.children.find((elem) => elem.name == `calcMap.js`).object;
        this.exConf.script = this.scriptBuilder.buildFullMap(readMap, calcMap);
      })
      .then(() => resolve(this.exConf.script))
      .catch((err) => reject(err));
    });
  }

  getEngine() {
    let engine = this.exConf.engine;
    let state = (engine) ? engine.getState() : null;
    // if(state != `running`)
    //   this.disableProperties();
    // return (state == `running`) ? engine : null;
    return (state == `running`) ? engine : null;
  }

  getScript() {
    return this.exConf.script;
  }

  getState() {
    console.log(`[${this.constructor.name}]`, `getState() >> `);
    // return new Promise((resolve, reject) => {
    //   Promise.resolve()
    //   .then(() => this._getState())
    //   .then((state) => {
    //     this.exConf.lastState = state;
    //     return state;
    //   })
    //   .then((ret) => resolve(ret))
    //   .catch((err) => reject(err));
    // });
    let state = this._getState();
    this.exConf.lastState = state;
    return state;
  }

  _getState() {
    // return new Promise((resolve, reject) => {
    let props = this.getPropertyDescriptions();
    let hasRunningProp = false;
    let hasStoppedProp = false;
    let hasStartPending = Object.values(this.exConf.startRetryment).find(e => e.timeout) ? true : false;
    for(let i in props) {
      let prop = this.findProperty(i);
      prop = (prop.master) ? prop.master : prop;
      console.log(`${i} period: ${ prop.period && true }`);
      if(prop.period && true)
        hasRunningProp = true;
      else
        hasStoppedProp = true;
    }
    let state =
      (hasRunningProp && !hasStoppedProp)
      ? `running`
      : (hasRunningProp)
        ? `semi-running`
        : (hasStartPending)
          ? `pending`
          : (hasStoppedProp)
            ? `stopped`
            : `no-property`;
    console.log(`[${this.constructor.name}]`, `state:`, state);
    return state;
      // resolve(state);
    // });
  }

  getMetrics() {
    console.log(`[${this.constructor.name}]`, `getMetrics() >> `);
    return this.getPropertyMetrics();
  }

  getPropertyMetrics(id) {
    console.log(`[${this.constructor.name}]`, `getPropertyMetrics(${(id) ? `${id}` : ``}) >> `);
    return new Promise((resolve, reject) => {
      if(id) {
        let property = this.findProperty(id);
        property = (property.master) ? property.master : property;
        resolve(property.metrics.get());
      }
      else {
        let result = {};
        // let propKeyList = Object.keys(this.properties);
        let propKeyList = [];
        this.properties.forEach((property, id) => propKeyList.push(id));
        console.log(`propKeyList: ${propKeyList}`);
        let prom = propKeyList.reduce((prev, next) => {
          console.log(`next: ${next}`);
          return prev
            .then(() => this.getPropertyMetrics(next))
            .then((metrics) => result[next] = metrics)
            .catch((err) => reject(err));
        }, Promise.resolve());
        prom.then(() => resolve(result)).catch((err) => reject(err));
      }
    });
  }

  start() {
    console.log(`[${this.constructor.name}]`, `start() >> `);
    return new Promise((resolve, reject) => {
      this.enableProperties()
      .then(() => {
        resolve()
      })
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
      .then(() => resolve())
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
      let PropertyObject = require(`./property/${config.template}/property.js`);
      let property = new PropertyObject(this, id, config);
      try {
        Promise.resolve()
        .then(() => property.init())
        .then(() => this.startPropertyRetry(
          property, 
          this.exConf.config.retry
            ? this.exConf.config.retryNumber 
            : 0,
          this.exConf.config.retry
            ? this.exConf.config.retryDelay 
            : undefined
        ))
        // .then(() => this.properties.set(id, property))
        .then(() => resolve())
        .catch((err) => reject(err));
      } catch(err) {
        reject(err);
      }
    });
  }

  startPropertyRetry(
    property, 
    retry = DEFAULT_START_RETRY_NUMBER, 
    delay = DEFAULT_START_RETRY_DELAY
  ) {
    console.log(`[${this.constructor.name}]`, `startPropertyRetry(${property.id}, ${retry}) >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.startProperty(property))
      .then((ret) => {
        if(ret) {
          this.exConf.startRetryment[property.id] = { timeout: false };
          this.afterRetryProcess();
          resolve(`started`);
        }
        else {
          if(retry) {
            // this.exConf.startRetryment[property.id] = true;
            this.exConf.startRetryment[property.id] = {
              timeout: retry
              ? setTimeout(
                  () => this.startPropertyRetry(
                    property, 
                    retry == -1 ? -1 : retry - 1
                  ),
                  delay
                )
              : undefined
            };
            // setTimeout(() => this.startPropertyRetry(property, retry == -1 ? -1 : retry - 1), delay);
            resolve(`pending`);
          }
          else {
            this.exConf.startRetryment[property.id] = { timeout: false };
            console.error(new Error(`Reach maximum retry number to start property[${property.id}].`));
            this.afterRetryProcess();
            resolve(`stopped`);
          }
        }
        // this.afterRetryProcess();
      })
      .catch((err) => reject(err));
    });
  }

  stopPropertyRetry(propertyId) {
    console.log(`[${this.constructor.name}]`, `stopPropertyRetry() >> `);
    if(propertyId) {
      this.exConf.startRetryment[propertyId] &&
      this.exConf.startRetryment[propertyId].timeout &&
      clearTimeout(this.exConf.startRetryment[propertyId].timeout);
      this.exConf.startRetryment[propertyId].timeout = undefined;
    }
    else {
      Object.keys(this.exConf.startRetryment).forEach(id => {
        this.stopPropertyRetry(id);
      });
    }
  }

  startProperty(property) {
    console.log(`[${this.constructor.name}]`, `startProperty(${property.id}) >> `);
    return new Promise((resolve, reject) => {
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
    let props = this.getPropertyDescriptions();
    let hasRunningProp = false;
    let hasStoppedProp = false;
    let hasStartPending = Object.values(this.exConf.startRetryment).find(e => e.timeout) ? true : false;
    for(let i in props) {
      let prop = this.findProperty(i);
      prop = (prop.master) ? prop.master : prop;
      console.log(`${i} period: ${ prop.period && true }`);
      if(prop.period && true)
        hasRunningProp = true;
      else
        hasStoppedProp = true;
    }
    if(hasStartPending) {
      return ;
    }
    else if(hasRunningProp) {
      return ;
    }
    else if(hasStoppedProp) {
      this.exConf[`devices-service`].removeFromService(this.id);
    }
  }

  enableProperties() {
    console.log(`[${this.constructor.name}]`, `enableProperties() >> `);
    return new Promise((resolve, reject) => {
      let promArr = [];
      let props = this.getPropertyDescriptions();
      let propMasterIdArr = [];
      let retry =
        this.exConf.config.retry
        ? this.exConf.config.retryNumber 
        : 0;
      let retryDelay =
        this.exConf.config.retry
        ? this.exConf.config.retryDelay 
        : undefined
      // console.log(`Properties : ${JSON.stringify(props, null, 2)}`);
      for(let i in props) {
        let prop = this.findProperty(i);
        if(prop.master) {
          if(!propMasterIdArr.includes(prop.master.id)) {
            propMasterIdArr.push(prop.master.id);
            promArr.push(this.startPropertyRetry(prop.master, retry, retryDelay));
          }
        }
        else {
          promArr.push(this.startPropertyRetry(prop, retry, retryDelay));
        }
        // prop = (prop.master) ? prop.master : prop;
        // promArr.push(prop.start());
      }
      Promise.all(promArr)
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  disableProperties() {
    console.log(`[${this.constructor.name}]`, `disableProperties() >> `);
    return new Promise((resolve, reject) => {
      let promArr = [];
      let props = this.getPropertyDescriptions();
      // console.log(`Properties : ${JSON.stringify(props, null, 2)}`);
      for(let i in props) {
        let prop = this.findProperty(i);
        prop = (prop.master) ? prop.master : prop;
        promArr.push(prop.stop());
      }
      Promise.all(promArr)
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