'use strict'

const Path = require(`path`);
const {Device} = require(`gateway-addon`);

const ConfigTranslator = require(`./config-translator.js`);

const compatibleScriptList = [`modbus-rtu`];
const compatibleEngineList = [`modbus-rtu`];

class ModbusDevice extends Device {
  constructor(devicesService, adapter, id, schema) {
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
      "originSchema": schema,
      "schema": null,
      "engine": null,
      "script": null,
      "compatibleScriptList": compatibleScriptList,
      "compatibleEngineList": compatibleEngineList
    };
    this.configTranslator = new ConfigTranslator(this);
  }

  init(schema) {
    console.log(`ModbusDevice: init() >> `);
    console.log(`ModbusDevice: schema: ${JSON.stringify(schema, null, 2)}`);
    return new Promise(async (resolve, reject) => {
      this.exConf.schema = await this.configTranslator.translate((schema) ? schema : this.exConf.originSchema);
      console.log(`translated schema: ${JSON.stringify(this.exConf.schema, null, 2)}`);
      await this.initAttr();
      await this.initEngine();
      await this.initScript();
      await this.initPropertyTemplate();
      await this.initProperty();
      resolve();
    });
  }

  initAttr() {
    return new Promise(async (resolve, reject) => {
      let schema = this.exConf.schema;

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
      resolve();
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

  initPropertyTemplate() {
    console.log(`ModbusDevice: initPropertyTemplate() >> `);
    return new Promise(async (resolve, reject) => {
      this.propertyTemplate = {};
      let propArr = await this.getDirectory(Path.join(__dirname, `property`));
      propArr.forEach((file) => {
        let name = (file.endsWith(`.js`)) ? `${file.substring(0, file.length - 3)}` : `${file}`;
        this.propertyTemplate[name] = require(`./property/${name}`);
      });
      resolve();
    });
  }

  initProperty() {
    console.log(`ModbusDevice: initProperty() >> `);
    return new Promise(async (resolve, reject) => {
      let schema = this.exConf.schema;
      //console.log(this.propertyTemplate);
      for(let i in this.exConf.schema.properties) {
        let propSchema = this.exConf.schema.properties[i];
        console.log(`propSchema : ${JSON.stringify(propSchema, null ,2)}`);
        console.log(this.propertyTemplate[propSchema.config.template]);
        let prop = new (this.propertyTemplate[propSchema.config.template])(this, i, schema.properties[i]);
        await prop.start();
        this.properties.set(i, prop);
      }
      resolve();
    });
  }

  getDirectory(path) {
    return new Promise((resolve, reject) => {
      const fs = require(`fs`);
      fs.readdir(path, (err, files) => {
        (err) ? reject(err) : resolve(files);
      });
    });
  }

  rebuildReadMap(readMapConfig, calcMapConfig) {
    console.log(`ModbusDevice: rebuildReadMap() >> `);

    let result = JSON.parse(JSON.stringify(readMapConfig));
    let globalDefine = (result.map && result.map.define) ? result.map.define : null;
    let tableList = [`coils`, `contacts`, `inputRegisters`, `holdingRegisters`];

    for(let i in tableList) {
      let tname = tableList[i];
      let table = result.map[tname];
      let localDefine = (table.define) ? table.define : null;

      let define = JSON.parse(JSON.stringify((globalDefine) ? globalDefine : {}));
      
      //  registerSpec
      if(localDefine && localDefine.registerSpec)
        Object.assign(define, localDefine.registerSpec);

      //  translator
      if(localDefine && localDefine.translator)
        Object.assign(define, localDefine.registerSpec);
      
      for(let j in table) {
        let elem = JSON.parse(JSON.stringify(table[j]));

        //  registerSpec
        if((typeof elem.registerSpec) == `string`)
          elem.registerSpec = JSON.parse(JSON.stringify((define.registerSpec[elem.registerSpec]) ? define.registerSpec[elem.registerSpec] : null));
        if(!elem.registerSpec)
          elem.registerSpec = {};
        if(!elem.registerSpec.size)
          elem.registerSpec.size = define.registerSpec.default.size;
        if(!elem.registerSpec.number)
          elem.registerSpec.number = define.registerSpec.default.number;

        if(!elem.translator)
          elem.translator = define.translator.default;

        if(!elem.type)
          elem.type = define.type.default;

        elem.translator = this.getCalculatorFunction(calcMapConfig, elem.translator);
        result.map[tname][j] = elem;
      }
      delete table.define;
    }
    return result;
  }

  getCalculatorFunction(calcMapConfig, translatorDst) {
    let taddr = translatorDst.split(`.`);
    let pointer = calcMapConfig;
    for(let i in taddr) {
      pointer = (pointer[taddr[i]]) ? pointer[taddr[i]] : null;
    }
    return (typeof pointer == `function`) ? pointer : null;
  }
}

module.exports = ModbusDevice;