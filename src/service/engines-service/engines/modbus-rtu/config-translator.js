const Validator = require('jsonschema').Validator;
const {
  ValidateConfigSchema,
  AttributeList,
  AlternateList
} = require(`./define`);

class ServiceConfigTranslator {
  constructor(enginesService) {
    this.enginesService = enginesService;
    this.sysportService = this.enginesService.sysportService;
    this.validator = new Validator();
  }

  generateConfigSchema() {
    console.log(`ServiceConfigTranslator: generateConfigSchema() >> `);
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
      let portList = await this.sysportService.objects.get();
      config.properties[`port`].enum = [];
      for(let i in portList)
        config.properties[`port`].enum.push(i);

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