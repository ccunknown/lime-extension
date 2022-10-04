/* eslint-disable class-methods-use-this */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
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

    const rootDir = this.devicesService.getRootDirectory();
    this.Errors = require(`${rootDir}/constants/errors.js`);
    this.propertySchemaConfig = require(`${rootDir}/config/property-schema.js`);
    this.propIdPattern = this.propertySchemaConfig.idPattern.regex;
    // console.log(`>> propertySchemaConfig: ${this.propIdPattern}`);
  }

  generateConfigSchema(params) {
    console.log(`DeviceConfigTranslator: generateConfigSchema() >> `);
    console.log(`>> params: ${JSON.stringify(params, null, 2)}`);
    return new Promise((resolve, reject) => {
      //  Copy config from ValidateConfigSchema.
      let config = JSON.parse(JSON.stringify(ValidateConfigSchema));
      const propertiesStr = JSON.stringify(config.properties.properties);

      const mustacheData = JSON.stringify(this.propertySchemaConfig).replace(
        /\\/g,
        `\\\\`
      );
      config.properties.properties = JSON.parse(
        Mustache.render(propertiesStr, JSON.parse(mustacheData))
      );

      //  Adjust condition field and assign enum.
      Promise.resolve()
        .then(() => this.assignConditionField(config, params, CompatibleList))
        .then((conf) => {
          config = conf;
        })

        //  Extend properties config using 'params.properties'.
        .then(() =>
          this.assignPatternProperties(
            config.properties.properties.patternProperties[this.propIdPattern],
            params
          )
        )
        .then((prop) => {
          config.properties.properties.patternProperties[this.propIdPattern] =
            prop;
        })

        //  Assign 'attrs' attribute.
        .then(() => this.assignAttribute(config, AttributeList))
        .then((conf) => {
          config = conf;
        })

        //  Assign 'alternate' attribute.
        .then(() => this.assignAlternate(config, AlternateList))
        .then((conf) => {
          config = conf;
        })

        //  Resolve config.
        .then(() => resolve(config))
        .catch((err) => reject(err));
    });
  }

  assignAlternate(conf, alternateList) {
    return new Promise((resolve) => {
      const config = JSON.parse(JSON.stringify(conf));

      //  Assign 'alternate' attribute.
      alternateList.forEach((index) => {
        const indexArray = index.split(`.`);
        let pointer = config;
        while (indexArray.length > 0) {
          const i = indexArray.shift();
          console.log(`index: ${i}`);
          if (
            Object.prototype.hasOwnProperty.call(pointer, `properties`) &&
            Object.prototype.hasOwnProperty.call(pointer, i)
          ) {
            pointer = pointer.properties[i];
            if (indexArray.length === 0) pointer.alternate = true;
          } else if (
            Object.prototype.hasOwnProperty.call(
              pointer,
              `patternProperties`
            ) &&
            Object.prototype.hasOwnProperty.call(pointer, i)
          ) {
            pointer = pointer.patternProperties[i];
            if (indexArray.length === 0) pointer.alternate = true;
          } else {
            break;
          }
        }
      });
      resolve(config);
    });
  }

  assignAttribute(conf, attributeList) {
    return new Promise((resolve) => {
      const config = JSON.parse(JSON.stringify(conf));

      //  Assign 'attrs' attribute.
      attributeList.forEach((index) => {
        // if (config.properties.hasOwnProperty(index.target))
        if (Object.prototype.hasOwnProperty.call(config, index.target))
          config.properties[index.target].attrs = index.attrs;
      });
      resolve(config);
    });
  }

  assignConditionField(conf, params, compatibleList) {
    return new Promise((resolve, reject) => {
      const config = JSON.parse(JSON.stringify(conf));
      const scriptCompatibleList = [...compatibleList.script];

      //  Initial 'enum' attribute [engine].
      Promise.resolve()
        .then(() =>
          this.devicesService.getCompatibleEngine(compatibleList.engine)
        )
        .then((list) => {
          config.properties.engine.enum = list;
        })

        //  Adjust config by engine type.
        // .then(() =>
        //   params && params.engine
        //     ? this.devicesService.getEngineTemplateName(params.engine)
        //     : undefined
        // )
        .then(() =>
          params && params.engine
            ? this.devicesService.getEngineConfig(params.engine)
            : undefined
        )
        .then((engineConfig) =>
          engineConfig ? engineConfig.template : undefined
        )
        .then((engTempName) => {
          scriptCompatibleList.push(engTempName);
          switch (engTempName) {
            case `modbus-rtu`:
            case `modbus-rtu-v2`:
              delete config.properties.ip;
              delete config.properties.port;
              break;
            case `modbus-tcp`:
              config.required.push(`ip`);
              config.required.push(`port`);
              config.properties.address.title = `Unit ID`;
              break;
            default:
              // console.error(`Engine template name "${engTempName}" not in scope!!!`);
              // reject(this.Errors.ObjectNotFound(engTempName));
              break;
          }
        })

        //  Initial 'enum' attribute.
        .then(() =>
          this.devicesService.getCompatibleScript(scriptCompatibleList)
        )
        .then((list) => {
          config.properties.script.enum = list;
        })
        .then(() =>
          this.devicesService.directory.getSchema(`property`, {
            deep: true,
            absolute: `${__dirname}`,
          })
        )
        .then((dirSchema) => dirSchema.children)
        .then((propDirSchema) => {
          config.properties.properties.patternProperties[
            this.propIdPattern
          ].properties.template.enum = propDirSchema.map((elem) => elem.name);
        })

        // Initial 'Retry' group attribute.
        .then(() => {
          if (!params.retry) {
            delete config.properties.retryNumber;
            delete config.properties.retryDelay;
          }
        })

        .then(() => resolve(config))
        .catch((err) => reject(err));
    });
  }

  assignPatternProperties(property, params) {
    return new Promise((resolve) => {
      const patternProperty = JSON.parse(JSON.stringify(property));

      //  Check 'params' has properties template and that template are included in pattern property enum choice.
      if (
        params &&
        params.properties &&
        params.properties.template &&
        params.properties.template !== `` &&
        patternProperty.properties.template.enum.includes(
          params.properties.template
        )
      ) {
        const PropertyConfigTranslator = require(`./property/${params.properties.template}/config-translator.js`);
        const propConfTrans = new PropertyConfigTranslator(this.devicesService);
        Promise.resolve()
          .then(() => propConfTrans.generateConfigSchema(params))
          .then((propConf) => {
            Object.keys(propConf.properties).forEach((i) => {
              patternProperty.properties[i] = propConf.properties[i];
            });
            //  Merge 'required' array.
            patternProperty.required = [
              ...patternProperty.required,
              ...propConf.required,
            ];
          })
          .then(() => resolve(patternProperty));
      } else resolve(patternProperty);
    });
  }

  generatePropertyId(params) {
    console.log(`DeviceConfigTranslator: generatePropertyId() >> `);
    return new Promise((resolve, reject) => {
      const PropertyConfigTranslator = require(`./property/${params.properties.template}/config-translator.js`);
      const propConfTrans = new PropertyConfigTranslator(this.devicesService);
      Promise.resolve()
        .then(() => propConfTrans.generateId(params))
        .then((result) => resolve(result))
        .catch((err) => reject(err));
    });
  }

  translate(config, options) {
    console.log(`DeviceConfigTranslator: translate() >> `);
    return new Promise((resolve, reject) => {
      const schema = {
        name: config.name,
        // "type": [
        //   "modbus-device"
        // ],
        description: config.description,
        "@context": "https://iot.mozilla.org/schemas",
        "@type": [`EnergyMonitor`],
      };

      Promise.resolve()
        .then(() => this.buildFullMap(config.script))
        .then((fullMap) => {
          if (options && options.properties) {
            schema.properties = {};
            Object.keys(config.properties).forEach((i) => {
              const PropertyConfigTranslator = require(`./property/${config.properties[i].template}/config-translator.js`);
              const propConfTrans = new PropertyConfigTranslator(
                this.devicesService
              );
              schema.properties[i] = propConfTrans.translate(
                config.properties[i],
                fullMap
              );
            });
            return Promise.all(Object.values(schema.properties));
          }
          return null;
        })
        .then(() => resolve(schema))
        .catch((err) => reject(err));
    });
  }

  buildFullMap(scriptName) {
    console.log(`DeviceConfigTranslator: buildFullMap() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() =>
          this.scriptsService.get(scriptName, { object: true, deep: true })
        )
        .then((script) => {
          const readMap = script.children.find(
            (elem) => elem.name === `readMap.js`
          ).object;
          const calcMap = script.children.find(
            (elem) => elem.name === `calcMap.js`
          ).object;
          return this.scriptBuilder.buildFullMap(readMap, calcMap);
        })
        .then((fullMap) => resolve(fullMap))
        .catch((err) => reject(err));
    });
  }
}

module.exports = DeviceConfigTranslator;
