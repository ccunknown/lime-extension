const Mustache = require(`mustache`);

const {
  ValidateConfigSchema, 
  CompatibleList, 
  AlternateList,
  AttributeList
} = require(`./define.js`);

class DeviceConfigTranslator {
  constructor(devicesService) {
    this.devicesService = devicesService;

    let rootDir = this.devicesService.getRootDirectory();
    this.Errors = require(`${rootDir}/constants/errors.js`);
    this.propertySchemaConfig = require(`${rootDir}/config/property-schema.js`);
    this.propIdPattern = this.propertySchemaConfig.idPattern.regex;
    // console.log(`>> propertySchemaConfig: ${this.propIdPattern}`);
  }

  generateConfigSchema(params) {
    console.log(`DeviceConfigTranslator: generateConfigSchema() >> `);
    console.log(`>> params: ${JSON.stringify(params, null, 2)}`);
    return new Promise(async (resolve, reject) => {

      //  Copy config from ValidateConfigSchema.
      let config = JSON.parse(JSON.stringify(ValidateConfigSchema));
      let propertiesStr = JSON.stringify(config.properties.properties);

      let mustacheData = JSON.stringify(this.propertySchemaConfig).replace(/\\/g, `\\\\`);
      config.properties.properties = JSON.parse(Mustache.render(propertiesStr, JSON.parse(mustacheData)));

      //  Assign 'alternate' attribute.
      AlternateList.forEach((index) => {
        let indexArray = index.split(`.`);
        let pointer = config;
        while(indexArray.length > 0) {
          let i = indexArray.shift();
          console.log(`index: ${i}`);
          if(pointer.hasOwnProperty(`properties`) && pointer.properties.hasOwnProperty(i)) {
            pointer = pointer.properties[i];
            if(indexArray.length == 0)
              pointer.alternate = true;
          }
          else if(pointer.hasOwnProperty(`patternProperties`) && pointer.patternProperties.hasOwnProperty(i)) {
            pointer = pointer.patternProperties[i];
            if(indexArray.length == 0)
              pointer.alternate = true;
          }
          else {
            break;
          }
        }
      });

      //  Assign 'attrs' attribute.
      AttributeList.forEach((index) => {
        if(config.properties.hasOwnProperty(index.target))
          config.properties[index.target].attrs = index.attrs;
      });

      //  Initial 'enum' attribute.
      config.properties.engine.enum = await this.devicesService.getCompatibleEngine(CompatibleList.engine);
      let propertiesDirectorySchema = (await this.devicesService.directory.getSchema(`property`, {"deep": true, "absolute": `${__dirname}`})).children;
      config.properties.properties.patternProperties[this.propIdPattern].properties.template.enum = propertiesDirectorySchema.map((elem) => elem.name);

      //  Extend properties config using 'params.properties'.
      if(params && 
        params.properties &&
        params.properties.template &&
        params.properties.template != `` &&
        config.properties.properties.patternProperties[this.propIdPattern].properties.template.enum.includes(params.properties.template)) {

        let PropertyConfigTranslator = require(`./property/${params.properties.template}/config-translator.js`);
        let propConfTrans = new PropertyConfigTranslator(this.devicesService);
        let propConf = await propConfTrans.generateConfigSchema(params);
        for(let i in propConf.properties) {
          config.properties.properties.patternProperties[this.propIdPattern].properties[i] = propConf.properties[i];
        }
        config.properties.properties.patternProperties[this.propIdPattern].required = [...config.properties.properties.patternProperties[this.propIdPattern].required, ...propConf.required];
      }

      resolve(config);
    });
  }

  generatePropertyId(params) {
    console.log(`DeviceConfigTranslator: generatePropertyId() >> `);
    return new Promise((resolve, reject) => {
      let PropertyConfigTranslator = require(`./property/${params.properties.template}/config-translator.js`);
      let propConfTrans = new PropertyConfigTranslator(this.devicesService);
      propConfTrans.generateId(params)
      .then((result) => resolve(result))
      .catch((err) => reject(err));
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

        for(let i in config.properties) {
          let PropertyConfigTranslator = require(`./property/${config.properties[i].template}/config-translator.js`);
          let propConfTrans = new PropertyConfigTranslator(this.devicesService);
          let propSchema = await propConfTrans.translate(config.properties[i]);

          schema.properties[i] = propSchema;
        }
      }

      resolve(schema);
    });
  }
}

module.exports = DeviceConfigTranslator;