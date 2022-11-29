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
  constructor(ioportsService) {
    console.log(`[${this.constructor.name}]`, `constructor() >> `);
    this.ioportsService = ioportsService;
    this.validator = new Validator();
  }

  generateConfigSchema(params) {
    console.log(`ServiceConfigTranslator: generateConfigSchema() >> `);
    console.log(`Params: ${JSON.stringify(params, null, 2)}`);
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
      let ioportTemplate;
      Promise.resolve()
        .then(() =>
          this.ioportsService.objects.getTemplate(null, { deep: true })
        )
        .then((template) => {
          ioportTemplate = template;
        })
        .then(() => {
          config.properties.template.enum = ioportTemplate.map((e) => e.name);
          if (params && params.template && params.template.length) {
            const dir = this.ioportsService.config.directory;
            const IoportConfigTranslator = require(Path.join(
              dir.startsWith(`./`) ? Path.join(__dirname, dir) : dir,
              params.template,
              `config-translator.js`
            ));
            const sysConfTrans = new IoportConfigTranslator(
              this.ioportsService
            );
            return sysConfTrans.generateConfigSchema(params);
          }
          return undefined;
        })
        .then((sysConf) => {
          if (sysConf) {
            Object.keys(sysConf.properties).forEach((i) => {
              config.properties[i] = sysConf.properties[i];
            });
            config.required = [...config.required, ...sysConf.required];
            if (
              Object.prototype.hasOwnProperty.call(
                sysConf,
                `addditionalProperties`
              )
            )
              config.additionalProperties = sysConf.additionalProperties;
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
