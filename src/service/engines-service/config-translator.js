/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const { Validator } = require(`jsonschema`);
const Path = require(`path`);

const {
  ValidateConfigSchema,
  AttributeList,
  AlternateList,
} = require(`./define`);

class ServiceConfigTranslator {
  constructor(enginesService) {
    this.enginesService = enginesService;
    console.log(
      `[${this.constructor.name}]`,
      this.enginesService.constructor.name
    );
    this.validator = new Validator();
  }

  generateConfigSchema(params) {
    console.log(`[${this.constructor.name}]: generateConfigSchema() >> `);
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
      let engineTemplates;
      Promise.resolve()
        .then(() =>
          this.enginesService.objects.getTemplate(null, { deep: true })
        )
        .then((templates) => {
          engineTemplates = templates;
        })
        .then(() => {
          config.properties.template.enum = engineTemplates.map((e) => e.name);
          if (params && params.template && params.template.length) {
            const dir = this.enginesService.config.directory;
            const EngineConfigTranslator = require(Path.join(
              dir.startsWith(`./`) ? Path.join(__dirname, dir) : dir,
              params.template,
              `config-translator.js`
            ));
            const engConfTrans = new EngineConfigTranslator(
              this.enginesService
            );
            return engConfTrans.generateConfigSchema(params);
          }
          return undefined;
        })
        .then((engConf) => {
          if (engConf) {
            Object.keys(engConf.properties).forEach((i) => {
              config.properties[i] = engConf.properties[i];
            });
            config.required = [...config.required, ...engConf.required];
            if (
              Object.prototype.hasOwnProperty.call(
                engConf,
                `additionalProperties`
              )
            )
              config.additionalProperties = engConf.additionalProperties;
          }
        })
        .then(() => resolve(config))
        .catch((err) => reject(err));
    });
  }

  validate(config) {
    console.log(`ServiceConfigTranslator: validate() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.generateConfigSchema(config))
        .then((schema) => resolve(this.validator.validate(config, schema)))
        .catch((err) => reject(err));
    });
  }
}

module.exports = ServiceConfigTranslator;
