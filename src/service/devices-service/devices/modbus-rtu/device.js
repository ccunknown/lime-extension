'use strict'

const Path = require(`path`);
const {Device} = require(`gateway-addon`);

const Errors = require(`../../../../../constants/errors.js`);
const ConfigTranslator = require(`./config-translator.js`);
const ScriptBuilder = require(`./script-builder.js`);

const compatibleScriptList = [`modbus-rtu`];
const compatibleEngineList = [`modbus-rtu`];

class ModbusDevice extends Device {
  constructor(devicesService, adapter, id, config) {
    super(adapter, id);
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
      "schema": null,
      "engine": null,
      "script": null,
      "compatibleScriptList": compatibleScriptList,
      "compatibleEngineList": compatibleEngineList
    };
    this.configTranslator = new ConfigTranslator(this);
    this.scriptBuilder = new ScriptBuilder();
  }

  init(schema) {
    console.log(`ModbusDevice: init() >> `);
    console.log(`ModbusDevice: schema: ${JSON.stringify(schema, null, 2)}`);
    return new Promise(async (resolve, reject) => {
      this.exConf.schema = await this.configTranslator.translate((schema) ? schema : this.exConf.config);
      console.log(`translated schema: ${JSON.stringify(this.exConf.schema, null, 2)}`);
      await this.initAttr();
      await this.initEngine();
      await this.initScript();
      //await this.initPropertyTemplate();
      await this.initProperty();
      resolve();
    });
  }

  initAttr(schema) {
    return new Promise(async (resolve, reject) => {
      schema = (schema) ? schema : this.exConf.schema;

      this.name = schema.name;
      this.type = schema.type;
      this['@type'] = schema['@type'];
      this.description = schema.description;

      resolve();
    });
  }

  initEngine(engineName) {
    return new Promise((resolve, reject) => {
      let enginesService = this.exConf[`devices-service`].enginesService;
      let engine = enginesService.get(this.exConf.schema.config.engine, {"object": true}).object;

      engine.event.on(`running`, () => this.getScript() ? this.enableProperties() : null);
      engine.event.on(`error`, () => {
        console.log(`ModbusDevice: on engine error >> `);
        this.disableProperties();
      });

      this.exConf.engine = engine;
      resolve();
    });
  }

  getEngine() {
    let engine = this.exConf.engine;
    let state = (engine) ? engine.getState() : null;
    if(state != `running`)
      this.disableProperties();
    return (state == `running`) ? engine : null;
  }

  initScript(scriptName) {
    return new Promise(async (resolve, reject) => {
      let ex = this.exConf;
      scriptName = (scriptName) ? scriptName : ex.schema.config.script;
      let scriptsService = ex[`devices-service`].scriptsService;
      let script = await scriptsService.get(scriptName, {"object": true, "deep": true});
      //console.log(`script: ${JSON.stringify(script, null, 2)}`);
      this.exConf.script = this.rebuildReadMap(
        script.children.find((elem) => elem.name == `readMap.js`).object, 
        script.children.find((elem) => elem.name == `calcMap.js`).object
      );
      resolve(this.exConf.script);
    });
  }

  getScript() {
    return this.exConf.script;
  }

  enableProperties() {
    console.log(`ModbusDevice: enableProperties() >> `);
    let props = this.getPropertyDescriptions();
    console.log(`Properties : ${JSON.stringify(props, null, 2)}`);
    for(let i in props) {
      let prop = this.findProperty(i);
      prop.start();
    }
  }

  disableProperties() {
    console.log(`ModbusDevice: disableProperties() >> `);
    let props = this.getPropertyDescriptions();
    console.log(`Properties : ${JSON.stringify(props, null, 2)}`);
    for(let i in props) {
      let prop = this.findProperty(i);
      prop.stop();
    }
  }

  initProperty() {
    console.log(`ModbusDevice: initProperty() >> `);
    return new Promise(async (resolve, reject) => {
      let config = this.exConf.config.properties;
      for(let i in config) {
        await this.addProperty(i, config[i]);
      }
    });
  }

  addProperty(id, config) {
    console.log(`ModbusDevice: addProperty() >> `);
    console.log(`config: ${JSON.stringify(config, null, 2)}`);
    return new Promise(async (resolve, reject) => {
      let devicesService = this.exConf[`devices-service`];
      let propDirSchema = (await devicesService.getDirectorySchema(`property`, {"deep": true, "absolute": __dirname})).children;
      console.log(`propDirSchema: ${JSON.stringify(propDirSchema, null, 2)}`);
      let propDir = propDirSchema.find((elem) => elem.name == config.template);
      console.log(`propDir: ${JSON.stringify(propDir, null, 2)}`);
      if(!propDir)
        reject(new Errors.ObjectNotFound(config.name));
      let path = propDir.children.find((elem) => elem.name == `property.js`).path;
      if(!propDir.path)
        reject(new Errors.ObjectNotFound(`property.js at ${propDir.path}`));
      let Obj = require(`./${path}`);
      let property = new Obj(this, id, config);
      this.properties.set(id, property);
      await property.start();
      //property.start();
      resolve();
    });
  }
}

module.exports = ModbusDevice;