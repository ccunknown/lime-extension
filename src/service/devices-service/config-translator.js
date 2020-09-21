const Validator = require('jsonschema').Validator;

const {
  ValidateConfigSchema,
  AttributeList,
  AlternateList
} = require(`./define`);

class ServiceConfigTranslator {
  constructor(devicesService) {
    this.devicesService = devicesService;
    this.Errors = require(`${this.devicesService.getRootDirectory()}/constants/errors.js`);
  }

  generateConfigSchema(params) {
    console.log(`ServiceConfigTranslator: generateConfigSchema() >> `);
    console.log(`Params: ${JSON.stringify(params, null, 2)}`);
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
      let deviceTemplateList = await this.devicesService.getTemplate(null, {"deep": true});
      config.properties[`template`].enum = deviceTemplateList.map((elem) => elem.name);

      //  Extend device config using 'params.template'.
      if(params && params.template && params.template != ``) {
        let DeviceConfigTranslator = require(`./devices/${params.template}/config-translator.js`);
        let devConfTrans = new DeviceConfigTranslator(this.devicesService);
        let devConf = await devConfTrans.generateConfigSchema(params);
        console.log(`>> devConf: ${JSON.stringify(devConf, null, 2)}`);
        for(let i in devConf.properties) {
          config.properties[i] = devConf.properties[i];
        }
        config.required = [...config.required, ...devConf.required]
      }

      resolve(config);
    });
  }

  generatePropertyId(params) {
    console.log(`ServiceConfigTranslator: generatePropertyId() >> `);
    return new Promise((resolve, reject) => {
      let DeviceConfigTranslator = require(`./devices/${params.template}/config-translator.js`);
      let devConfTrans = new DeviceConfigTranslator(this.devicesService);
      devConfTrans.generatePropertyId(params)
      .then((result) => resolve(result))
      .catch((err) => reject(err));
    });
  }

  translate(config) {
    console.log(`ServiceConfigTranslator: translate() >> `);
    return new Promise(async (resolve, reject) => {
      let DeviceConfigTranslator = require(`./devices/${config.template}/config-translator.js`);
      let devConfTrans = new DeviceConfigTranslator(this.devicesService);
      let wotSchema = await devConfTrans.translate(config, {"properties": true});

      resolve(wotSchema);
    });
  }

  validate(config) {
    console.log(`ServiceConfigTranslator: validateParams() >> `);
    return new Promise(async (resolve, reject) => {
      let validator = new Validator();
      if(config.properties) {
        let deviceConfig = JSON.parse(JSON.stringify(config));
        deviceConfig.properties = {};
        for(let i in config.properties) {
          let propertyConfig = JSON.parse(JSON.stringify(config.properties[i]));

          let params = JSON.parse(JSON.stringify(deviceConfig));
          params.properties = JSON.parse(JSON.stringify(propertyConfig));
          let schema = await this.generateConfigSchema(params);

          params.properties = {};
          params.properties[i] = propertyConfig;
          let valid = validator.validate(params, schema);

          if(valid.errors && valid.errors.length) {
            reject(new this.Errors.InvalidConfigSchema(valid));
            break;
          }
        }
        resolve({});
      }
      else
        this.validateParams(config)
        .then((validInfo) => resolve(validInfo))
        .catch((err) => reject(err));
    });
  }

  validateParams(deviceConfig, propertyConfig) {
    console.log(`ServiceConfigTranslator: validateParams() >> `);
    return new Promise((resolve, reject) => {
      deviceConfig
      params.properties = config.properties[i];
      this.generateConfigSchema(params)
      .then((schema) => {
        let validator = new Validator();
        return validator.validate(params, schema);
      })
      .then((validInfo) => resolve(validInfo))
      .catch((err) => reject(err));
    });
  }
}

module.exports = ServiceConfigTranslator;