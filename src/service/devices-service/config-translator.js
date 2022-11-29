/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const { Validator } = require(`jsonschema`);
const Path = require(`path`);

const {
  ValidateConfigSchema,
  AttributeList,
  AlternateList,
} = require(`./define`);

class ServiceConfigTranslator {
  constructor(service) {
    this.service = service;
    console.log(`[${this.constructor.name}]`, this.service.constructor.name);
    this.Errors = require(`${this.service.getRootDirectory()}/constants/errors.js`);
  }

  generateConfigSchema(params) {
    console.log(`[${this.constructor.name}]`, `generateConfigSchema() >> `);
    console.log(`>> params: ${JSON.stringify(params, null, 2)}`);
    return new Promise((resolve, reject) => {
      //  Copy config from ValidateConfigSchema.
      const config = JSON.parse(JSON.stringify(ValidateConfigSchema));

      //  Assign 'alternate' attribute.
      AlternateList.forEach((index) => {
        if (Object.prototype.hasOwnProperty.call(config.properties, index))
          config.properties[index].alternate = true;
      });

      //  Assign 'attrs' attribute.
      AttributeList.forEach((index) => {
        if (
          Object.prototype.hasOwnProperty.call(config.properties, index.target)
        )
          config.properties[index.target].attrs = index.attrs;
      });

      //  Initial 'enum' attribute.
      let templates;
      Promise.resolve()
        .then(() => this.service.objects.getTemplate(null, { deep: true }))
        .then((templateList) => {
          templates = templateList;
        })
        .then(() => {
          config.properties.template.enum = templates.map((e) => e.name);
          if (params && params.template && params.template !== ``) {
            const ConfigTranslator = this.getTemplateObject(params.template);
            const objConfigTranslator = new ConfigTranslator(this.service);
            return objConfigTranslator.generateConfigSchema(params);
          }
          return undefined;
        })
        .then((schema) => {
          if (schema) {
            Object.keys(schema.properties).forEach((i) => {
              config.properties[i] = schema.properties[i];
            });
            config.required = [...config.required, ...schema.required];
            if (
              Object.prototype.hasOwnProperty.call(
                schema,
                `additionalProperties`
              )
            )
              config.additionalProperties = schema.additionalProperties;
          }
        })
        .then(() => resolve(config))
        .catch((err) => reject(err));
    });
  }

  getTemplateObject(templateName) {
    console.log(
      `[${this.constructor.name}]`,
      `getTemplateObject(${templateName || ``}) >> `
    );
    const dir = this.service.config.directory;
    const path = Path.join(
      dir.startsWith(`./`) ? Path.join(__dirname, dir) : dir,
      templateName,
      `config-translator.js`
    );
    console.log(`service config:`, this.service.config);
    console.log(`directory:`, dir);
    console.log(`path:`, path);
    const ConfigTranslator = require(path);
    return ConfigTranslator;
  }

  generatePropertyId(params) {
    console.log(`ServiceConfigTranslator: generatePropertyId() >> `);
    return new Promise((resolve, reject) => {
      const ObjectConfigTranslator = this.getTemplateObject(params.template);
      const objectConfigTranslator = new ObjectConfigTranslator(this.service);
      Promise.resolve()
        .then(() => objectConfigTranslator.generatePropertyId(params))
        .then((result) => resolve(result))
        .catch((err) => reject(err));
    });
  }

  translate(config) {
    console.log(`[${this.constructor.name}]:`, `translate() >> `);
    return new Promise((resolve, reject) => {
      const ObjectConfigTranslator = this.getTemplateObject(config.template);
      const objectConfigTranslator = new ObjectConfigTranslator(this.service);
      Promise.resolve()
        .then(() =>
          objectConfigTranslator.translate(config, { properties: true })
        )
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
        const objectConfig = JSON.parse(JSON.stringify(config));
        objectConfig.properties = {};
        Object.keys(config.properties).reduce((prevProm, i) => {
          return prevProm.then(() => {
            const propertyConfig = JSON.parse(
              JSON.stringify(config.properties[i])
            );
            const params = JSON.parse(JSON.stringify(objectConfig));
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
      } else {
        Promise.resolve()
          .then(() => this.validateParams(config))
          .then((validInfo) => resolve(validInfo))
          .catch((err) => reject(err));
      }
    });
  }

  validateParams(config /* , propertyConfig */) {
    console.log(`[${this.constructor.name}]`, `validateParams() >> `);
    return new Promise((resolve, reject) => {
      const params = JSON.parse(JSON.stringify(config));
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
