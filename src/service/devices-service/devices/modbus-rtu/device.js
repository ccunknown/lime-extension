'use strict'

const Path = require(`path`);
const {Device} = require(`gateway-addon`);

class ModbusDevice extends Device {
  constructor(devicesService, adapter, schema) {
    super(adapter, schema.id);
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
      "schema": schema,
      "engine": null,
      "script": null
    };
    this.name = schema.name;
    this.type = schema.type;
    this['@type'] = schema['@type'];
    this.description = schema.description;
    //this.init();
  }

  getConfigSchema(params) {
    console.log(`ModbusDevice: getConfigSchema() >> `);
    console.log(`params: ${JSON.stringify(params, null, 2)}`);
    return new Promise(async (resolve, reject) => {
      let devicesService = this.exConf[`devices-service`];
      let devices = await devicesService.getTemplate(null, {"deep": true});
      let schema = await devicesService.getTemplate(__dirname.split(`/`).pop(), {"deep": true});
      let props = schema.children.find((elem) => elem.name == `property`).children;
      let compatScript = await devicesService.getCompatibleScript([`modbus-rtu`]);
      let compatEngine = await devicesService.getCompatibleEngine([`modbus-rtu`]);
      //console.log(`schema : ${JSON.stringify(schema, null ,2)}`);
      let config = {
        "config": {
          "type": "object",
          "required": [],
          "additionalProperties": false,
          "properties": {
            "device": {
              "type": "string",
              "default": "modbus-rtu",
              "enum": devices.map((elem) => elem.name)
            },
            "script": {
              "type": "string",
              "enum": compatScript
            },
            "engine": {
              "type": "string",
              "enum": compatEngine
            },
            "address": {
              "type": "number",
              "default": 1,
              "min": 0
            }
          }
        },
        "properties": {
          "type": "array",
          "items": {
            "type": "object",
            "required": [],
            "additionalProperties": false,
            "properties": {
              "property": {
                "type": "string",
                "enum": props.map((elem) => elem.name.split(`.js`)[0])
              },
              "table": {
                "type": "string",
                "default": "inputRegisters",
                "enum": [`coils`, `contacts`, `inputRegisters`, `holdingRegisters`]
              },
              "address": {
                "type": "number",
                "pre-require": ["config.script", "properties.table"]
              },
              "period": {
                "type": "number",
                "default": 1000,
                "min": 1000
              }
            }
          }
        }
      };
      if( params && 
        params.config && 
        params.config.script && 
        params.properties && 
        params.properties.table) {

        await this.initScript(params.config.script);
        let addrList = this.exConf.script.map[params.properties.table];
        config.properties.items.properties.address.enum = [];
        for(let i in addrList) {
          config.properties.items.properties.address.enum.push({
            "title": `${addrList[i].name} [Addr:${Number(i).toString(16)}]`,
            "value": i
          });
        }
      }
      resolve(config);
    });
  }

  init(schema) {
    console.log(`ModbusDevice: init() >> `);
    return new Promise(async (resolve, reject) => {
      this.schema = (schema) ? schema : this.schema;
      await this.initEngine();
      await this.initScript();
      await this.initPropertyTemplate();
      await this.initProperty();
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
      console.log(`script: ${JSON.stringify(script, null, 2)}`);
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
        //console.log(`propSchema : ${JSON.stringify(propSchema, null ,2)}`);
        //console.log(this.propertyTemplate[propSchema.config.property]);
        let prop = new (this.propertyTemplate[propSchema.config.property])(this, schema.properties[i]);
        await prop.start();
        this.properties.set(propSchema.name, prop);
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

        elem.translator = this.getTranslator(calcMapConfig, elem.translator);
        result.map[tname][j] = elem;
      }
      delete table.define;
    }
    return result;
  }

  getTranslator(calcMapConfig, translatorDst) {
    let taddr = translatorDst.split(`.`);
    let pointer = calcMapConfig;
    for(let i in taddr) {
      pointer = (pointer[taddr[i]]) ? pointer[taddr[i]] : null;
    }
    return (typeof pointer == `function`) ? pointer : null;
  }
}

module.exports = ModbusDevice;