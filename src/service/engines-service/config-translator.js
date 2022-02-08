const Validator = require('jsonschema').Validator;
const {
  ValidateConfigSchema,
  AttributeList,
  AlternateList
} = require(`./define`);

class ServiceConfigTranslator {
  constructor(enginesService) {
    console.log(`[${this.constructor.name}]`, `constructor() >> `)
    this.enginesService = enginesService;
    this.validator = new Validator();
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
      let engineTemplate = await this.enginesService.getTemplate(null, {"deep": true});
      config.properties[`template`].enum = engineTemplate.map((elem) => elem.name);

      //  Extend engine config using 'params.template'.
      if(params && params.template && params.template != ``) {
        let EngineConfigTranslator = require(`./engines/${params.template}/config-translator.js`);
        let engConfTrans = new EngineConfigTranslator(this.enginesService);
        let engConf = await engConfTrans.generateConfigSchema(params);
        // console.log(`engConf: ${JSON.stringify(engConf, null, 2)}`);
        for(let i in engConf.properties) {
          config.properties[i] = engConf.properties[i];
        }
        config.required = [...config.required, ...engConf.required];
        if(engConf.hasOwnProperty(`additionalProperties`))
          config.additionalProperties = engConf.additionalProperties;
      }

      resolve(config);
    });
  }

  validate(config) {
    console.log(`ServiceConfigTranslator: validate() >> `);
    return new Promise((resolve, reject) => {
      this.generateConfigSchema(config)
      .then((schema) => resolve(this.validator.validate(config, schema)))
      .catch((err) => reject(err));
    });
  }
}

module.exports = ServiceConfigTranslator;