/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
// const Path = require(`path`);
const { Validator } = require(`jsonschema`);

const {
  ValidateConfigSchema,
  AttributeList,
  AlternateList,
} = require(`./define`);

class ServiceConfigTranslator {
  constructor(devicesService) {
    this.devicesService = devicesService;
    console.log(
      `[${this.constructor.name}] >>>>>>>>>>>>>>>>>>>>>>>>>>`,
      this.devicesService.constructor.name
    );
    this.Errors = require(`${this.devicesService.getRootDirectory()}/constants/errors.js`);
  }

  generateConfigSchema(params) {
    console.log(`ServiceConfigTranslator: generateConfigSchema() >> `);
    console.log(`Params: ${JSON.stringify(params, null, 2)}`);
    return new Promise((resolve, reject) => {
      //  Copy config from ValidateConfigSchema.
      const config = JSON.parse(JSON.stringify(ValidateConfigSchema));

      //  Assign 'alternate' attribute.
      AlternateList.forEach((index) => {
        // if (config.properties.hasOwnProperty(index))
        if (Object.prototype.hasOwnProperty.call(config, index))
          config.properties[index].alternate = true;
      });

      //  Assign 'attrs' attribute.
      AttributeList.forEach((index) => {
        // if (config.properties.hasOwnProperty(index.target))
        if (Object.prototype.hasOwnProperty.call(config, index.target))
          config.properties[index.target].attrs = index.attrs;
      });

      //  Initial 'enum' attribute.
      let deviceTemplateList;
      Promise.resolve()
        .then(() => this.devicesService.getTemplate(null, { deep: true }))
        .then((dtList) => {
          deviceTemplateList = dtList;
        })
        .then(() => {
          config.properties.template.enum = deviceTemplateList.map(
            (elem) => elem.name
          );
        })
        .then(() => {
          if (params && params.template && params.template !== ``) {
            const DeviceConfigTranslator = require(`./devices/${params.template}/config-translator.js`);
            const devConfTrans = new DeviceConfigTranslator(
              this.devicesService
            );
            return Promise.resolve()
              .then(() => devConfTrans.generateConfigSchema(params))
              .then((devConf) => {
                Object.keys(devConf.properties).forEach((i) => {
                  config.properties[i] = devConf.properties[i];
                });
                config.required = [...config.required, ...devConf.required];
              });
          }
          return Promise.resolve();
        })
        .then(() => resolve(config))
        .catch((err) => reject(err));
    });
  }

  generatePropertyId(params) {
    console.log(`ServiceConfigTranslator: generatePropertyId() >> `);
    return new Promise((resolve, reject) => {
      const DeviceConfigTranslator = require(`./devices/${params.template}/config-translator.js`);
      const devConfTrans = new DeviceConfigTranslator(this.devicesService);
      Promise.resolve()
        .then(() => devConfTrans.generatePropertyId(params))
        .then((result) => resolve(result))
        .catch((err) => reject(err));
    });
  }

  translate(config) {
    console.log(`[${this.constructor.name}]:`, `translate() >> `);
    return new Promise((resolve, reject) => {
      const DeviceConfigTranslator = require(`./devices/${config.template}/config-translator.js`);
      const devConfTrans = new DeviceConfigTranslator(this.devicesService);
      Promise.resolve()
        .then(() => devConfTrans.translate(config, { properties: true }))
        .then((wotSchema) => resolve(wotSchema))
        .catch((err) => reject(err));
    });
  }

  validate(config) {
    console.log(`[${this.constructor.name}]:`, `validate() >> `);
    return new Promise((resolve, reject) => {
      const validator = new Validator();
      let valid;
      if (config.properties) {
        const deviceConfig = JSON.parse(JSON.stringify(config));
        deviceConfig.properties = {};
        Object.keys(config.properties).reduce((prevProm, i) => {
          return prevProm.then(() => {
            const propertyConfig = JSON.parse(
              JSON.stringify(config.properties[i])
            );
            const params = JSON.parse(JSON.stringify(deviceConfig));
            params.properties = JSON.parse(JSON.stringify(propertyConfig));
            return Promise.resolve()
              .then(() => this.generateConfigSchema(params))
              .then((schema) => {
                params.properties = {};
                params.properties[i] = propertyConfig;
                valid = valid || validator.validate(params, schema);
              });
          });
        }, Promise.resolve());
        if (valid) reject(new this.Errors.InvalidConfigSchema(valid));
        else resolve({});
        // eslint-disable-next-line no-restricted-syntax, guard-for-in
        // for (const i in config.properties) {
        //   let propertyConfig = JSON.parse(JSON.stringify(config.properties[i]));

        //   let params = JSON.parse(JSON.stringify(deviceConfig));
        //   params.properties = JSON.parse(JSON.stringify(propertyConfig));
        //   let schema = await this.generateConfigSchema(params);

        //   params.properties = {};
        //   params.properties[i] = propertyConfig;
        //   valid = valid ? valid : validator.validate(params, schema);

        //   if (valid.errors && valid.errors.length) {
        //     reject(new this.Errors.InvalidConfigSchema(valid));
        //     break;
        //   }
        // }
        // resolve({});
      } else {
        Promise.resolve()
          .then(() => this.validateParams(config))
          .then((validInfo) => resolve(validInfo))
          .catch((err) => reject(err));
      }
    });
  }

  validateParams(deviceConfig /* , propertyConfig */) {
    console.log(`ServiceConfigTranslator: validateParams() >> `);
    return new Promise((resolve, reject) => {
      // deviceConfig
      // params.properties = config.properties[i];
      const params = JSON.parse(JSON.stringify(deviceConfig));
      Promise.resolve()
        .then(() => this.generateConfigSchema(params))
        .then((schema) => {
          const validator = new Validator();
          return validator.validate(params, schema);
        })
        .then((validInfo) => resolve(validInfo))
        .catch((err) => reject(err));
    });
  }
}

module.exports = ServiceConfigTranslator;
