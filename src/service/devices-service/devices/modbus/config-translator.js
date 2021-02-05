const Mustache = require(`mustache`);

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
      //console.log(`schema: ${JSON.stringify(config, null, 2)}`);

      //  Assign 'attrs' attribute.
      AttributeList.forEach((index) => {
        if(config.properties.hasOwnProperty(index.target))
          config.properties[index.target].attrs = index.attrs;
      });

      //  Initial 'enum' attribute [engine].
      config.properties.engine.enum = await this.devicesService.getCompatibleEngine(CompatibleList.engine);
      
      //  Adjust config by engine type.
      var scriptCompatibleList = [...CompatibleList.script];
      let engineTemplateName = undefined;
      if(params && params.engine) {
        engineTemplateName = await this.devicesService.getEngineTemplateName(params.engine);
        engineTemplateName && scriptCompatibleList.push(engineTemplateName);
      }
      if(engineTemplateName == `modbus-tcp`) {
        config.required.push(`ip`);
        config.required.push(`port`);
        config.properties.address.title = `Unit ID`;
      }
      else {
        delete config.properties[`ip`];
        delete config.properties[`port`];
      }

      //  Initial 'enum' attribute.
      config.properties.script.enum = await this.devicesService.getCompatibleScript(scriptCompatibleList);
      let propertiesDirectorySchema = (await this.devicesService.getDirectorySchema(`property`, {"deep": true, "absolute": `${__dirname}`})).children;
      config.properties.properties.patternProperties[this.propIdPattern].properties.template.enum = propertiesDirectorySchema.map((elem) => elem.name);

      //  Extend properties config using 'params.properties'.
      this.assignPatternProperties(config.properties.properties.patternProperties[this.propIdPattern], params)
      .then((prop) => config.properties.properties.patternProperties[this.propIdPattern] = prop)
      .then(() => resolve(config))
      .catch((err) => reject(err));

      // resolve(config);
    });
  }

  assignAlternate() {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  assignAttribute() {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  assignEnum() {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  assignPatternProperties(property, params) {
    let patternProperty = JSON.parse(JSON.stringify(property));
    return new Promise((resolve, reject) => {
      //  Check 'params' has properties template and that template are included in pattern property enum choice.
      if(params && 
        params.properties &&
        params.properties.template &&
        params.properties.template != `` &&
        patternProperty.properties.template.enum.includes(params.properties.template)) {

        let PropertyConfigTranslator = require(`./property/${params.properties.template}/config-translator.js`);
        let propConfTrans = new PropertyConfigTranslator(this.devicesService);
        propConfTrans.generateConfigSchema(params)
        .then((propConf) => {
          propConf.properties.forEach((value, i) => {
            patternProperty.properties[i] = value;
          });
          //  Merge 'required' array.
          patternProperty.required = [...patternProperty.required, ...propConf.required];
        })
        .then(() => resolve(patternProperty));
      }
      else
        resolve(patternProperty);
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
    return new Promise((resolve, reject) => {
      let schema = {
        "name": config.name,
        // "type": [
        //   "modbus-device"
        // ],
        "description": config.description,
        "@context": "https://iot.mozilla.org/schemas",
        "@type": [`EnergyMonitor`]
      };

      this.buildFullMap(config.script)
      .then((fullMap) => {
        if(options && options.properties) {
          schema.properties = {};
          for(let i in config.properties) {
            let PropertyConfigTranslator = require(`./property/${config.properties[i].template}/config-translator.js`);
            let propConfTrans = new PropertyConfigTranslator(this.devicesService);
            schema.properties[i] = propConfTrans.translate(config.properties[i], fullMap);
          }
          return Promise.all(Object.values(schema.properties));
        }
      })
      .then(() => resolve(schema))
      .catch((err) => reject(err));
    });
  }

  buildFullMap(scriptName) {
    console.log(`DeviceConfigTranslator: buildFullMap() >> `);
    return new Promise((resolve, reject) => {
      this.scriptsService.get(scriptName, {"object": true, "deep": true})
      .then((script) => {
        let readMap = script.children.find((elem) => elem.name == `readMap.js`).object;
        let calcMap = script.children.find((elem) => elem.name == `calcMap.js`).object;
        return this.scriptBuilder.buildFullMap(readMap, calcMap);
      })
      .then((fullMap) => resolve(fullMap))
      .catch((err) => reject(err));
    });
  }
}

module.exports = DeviceConfigTranslator;