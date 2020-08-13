const {
  ValidateConfigSchema, 
  CompatibleList, 
  AlternateList,
  AttributeList
} = require(`./define.js`);

const ScriptBuilder = require(`./script-builder.js`);

class DeviceConfigTranslator {
  constructor(devicesService) {
    this.devicesService = devicesService;
    this.scriptsService = this.devicesService.scriptsService;
    this.scriptBuilder = new ScriptBuilder();
  }

  generateConfigSchema(params) {
    console.log(`DeviceConfigTranslator: generateConfigSchema() >> `);
    console.log(`params: ${JSON.stringify(params, null, 2)}`);
    return new Promise(async (resolve, reject) => {

      //  Copy config from ValidateConfigSchema.
      let config = JSON.parse(JSON.stringify(ValidateConfigSchema));

      //  Assign 'alternate' attribute.
      AlternateList.forEach((index) => {
        if(config.properties.hasOwnProperty(index))
          config.properties[index].alternate = true;
      });

      //  Assign 'attrs' attribute.
      AttributeList.forEach((index) => {
        if(config.properties.hasOwnProperty(index.target))
          config.properties[index.target].attrs = index.attrs;
      });

      //  Initial 'enum' attribute.
      config.properties.script.enum = await this.devicesService.getCompatibleScript(CompatibleList.script);
      config.properties.engine.enum = await this.devicesService.getCompatibleEngine(CompatibleList.engine);
      let propertiesDirectorySchema = (await this.devicesService.getDirectorySchema(`property`, {"deep": true, "absolute": `${__dirname}`})).children;
      config.properties.properties.patternProperties[`.+`].properties.template.enum = propertiesDirectorySchema.map((elem) => elem.name);

      //  Extend properties config using 'params.properties'.
      if(params && 
        params.properties &&
        params.properties.template &&
        params.properties.template != ``) {

        let PropertyConfigTranslator = require(`./property/${params.properties.template}/config-translator.js`);
        let propConfTrans = new PropertyConfigTranslator(this.devicesService);
        let propConf = await propConfTrans.generateConfigSchema(params);
        for(let i in propConf.properties) {
          config.properties.properties.patternProperties[`.+`].properties[i] = propConf.properties[i];
        }
        config.properties.properties.patternProperties[`.+`].required = [...config.properties.properties.patternProperties[`.+`].required, ...propConf.required];
      }

      resolve(config);
    });
  }

  translate(config, options) {
    console.log(`DeviceConfigTranslator: translate() >> `);
    return new Promise(async (resolve, reject) => {
      let schema = {
        "name": config.name,
        // "type": [
        //   "modbus-device"
        // ],
        "description": config.description,
        "@context": "https://iot.mozilla.org/schemas",
        "@type": [`EnergyMonitor`]
      };

      if(options && options.properties) {
        schema.properties = {};
        
        let script = await this.scriptsService.get(config.script, {"object": true, "deep": true});
        let readMap = script.children.find((elem) => elem.name == `readMap.js`).object;
        let calcMap = script.children.find((elem) => elem.name == `calcMap.js`).object;
        //console.log(`readMap: ${JSON.stringify(readMap, null, 2)}`);
        let fullMap = this.scriptBuilder.buildFullMap(readMap, calcMap);

        for(let i in config.properties) {
          let PropertyConfigTranslator = require(`./property/${config.properties[i].template}/config-translator.js`);
          let propConfTrans = new PropertyConfigTranslator(this.devicesService);
          let propSchema = await propConfTrans.translate(config.properties[i], fullMap);

          schema.properties[i] = propSchema;
        }
      }

      resolve(schema);
    });
  }
}

module.exports = DeviceConfigTranslator;