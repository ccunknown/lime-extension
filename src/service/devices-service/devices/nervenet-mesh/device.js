'use strict'

const Path = require(`path`);
const {Device} = require(`gateway-addon`);

const ConfigTranslator = require(`./config-translator.js`);

class NervenetMesh extends Device {
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
      "script": null
    };

    this.configTranslator = new ConfigTranslator(this.exConf[`devices-service`]);
  }

  init(config) {
    console.log(`[${this.constructor.name}]`, `init() >> `);
    return new Promise(async (resolve, reject) => {
      config = (config) ? config : this.exConf.config;

      this.configTranslator.translate(config)
      .then((schema) => this.initAttr(schema))
      .then(() => this.initEngine(config.engine))
      .then((engine) => this.initProperty())
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  initAttr(schema) {
    console.log(`[${this.constructor.name}]`, `initAttr() >> `);
    return new Promise(async (resolve, reject) => {
      for(let i in schema)
        this[i] = schema[i];
      resolve();
    });
  }

  initProperty() {
    console.log(`[${this.constructor.name}]`, `initProperty() >> `);
    return new Promise(async (resolve, reject) => {
      let config = this.exConf.config.properties;
      console.log(`[${this.constructor.name}]`, `config: ${JSON.stringify(config, null, 2)}`);
      try {
        // for(let i in config) {
        //   await this.addProperty(i, config[i]);
        // }
        Object.keys(config).reduce((prevProm, index) => {
          return prevProm.then(() => this.addProperty(index, config[index]));
        }, Promise.resolve())
        .then(() => resolve());
        // resolve();
      }
      catch(err) {
        reject(err);
      }  
    });
  }

  initEngine(engineName) {
    console.log(`[${this.constructor.name}]`, `initEngine() >> `);
    return new Promise((resolve, reject) => {
      let enginesService = this.exConf[`devices-service`].enginesService;
      Promise.resolve(enginesService.get(this.exConf.config.engine, {"object": true}))
      .then((engine) => {
        engine.event.on(`running`, () => this.getScript() ? this.enableProperties() : null);
        engine.event.on(`error`, () => {
          console.log(`NervenetMesh: on engine error >> `);
          this.disableProperties();
        });
        this.exConf.engine = engine;
      })
      .then(() => resolve(this.exConf.engine))
      .catch((err) => reject(err));
    });
  }

  getEngine() {
    console.log(`[${this.constructor.name}]`, `getEngine() >> `);
    let engine = this.exConf.engine;
    let state = (engine) ? engine.getState() : null;
    if(state != `running`)
      this.disableProperties();
    return (state == `running`) ? engine : null;
  }

  getState() {
    console.log(`[${this.constructor.name}]`, `getState() >> `);
    return new Promise((resolve, reject) => {
      let props = this.getPropertyDescriptions();
      let hasRunningProp = false;
      let hasStoppedProp = false;
      for(let i in props) {
        let prop = this.findProperty(i);
        prop = (prop.master) ? prop.master : prop;
        console.log(`${i} period: ${prop.period && true}`);
        if(prop.period && true)
          hasRunningProp = true;
        else
          hasStoppedProp = true;
        // if((prop.isRunning) ? prop.isRunning() : (prop.period && true))
        //   hasRunningProp = true;
        // else
        //   hasStoppedProp = true;
      }
      let state = (hasRunningProp && hasStoppedProp) ? `semi-running` :
        (hasRunningProp) ? `running` :
        (hasStoppedProp) ? `stopped` :
        `no-property`;
      resolve(state);
    });
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
    console.log(`[${this.constructor.name}]`, `start() >> `);
    return new Promise((resolve, reject) => {
      this.disableProperties()
      .then(() => resolve())
      .catch((err) => {
        this.state = `error`;
        this.error = err;
        reject(err);
      });
    });
  }

  addProperty(id, config) {
    console.log(`[${this.constructor.name}]`, `addProperty() >> `);
    // console.log(`>> config: ${JSON.stringify(config, null, 2)}`);
    return new Promise(async (resolve, reject) => {
      let PropertyObject = require(`./property/${config.template}/property.js`);
      let property = new PropertyObject(this, id, config);
      try {
        property.init()
        .then(() => property.start())
        // .then(() => this.properties.set(id, property))
        .then(() => resolve())
        .catch((err) => reject(err));
      } catch(err) {
        reject(err);
      }
    });
  }

  enableProperties() {
    console.log(`[${this.constructor.name}]`, `enableProperties() >> `);
    return new Promise((resolve, reject) => {
      let promArr = [];
      let props = this.getPropertyDescriptions();
      // console.log(`Properties : ${JSON.stringify(props, null, 2)}`);
      for(let i in props) {
        let prop = this.findProperty(i);
        prop = (prop.master) ? prop.master : prop;
        promArr.push(prop.start());
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
}

module.exports = NervenetMesh;