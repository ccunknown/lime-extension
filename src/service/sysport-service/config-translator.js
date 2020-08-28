const Validator = require('jsonschema').Validator;
const {
  ValidateConfigSchema,
  AttributeList,
  AlternateList
} = require(`./define`);

class ServiceConfigTranslator {
  constructor(sysportService) {
    this.sysportService = sysportService;
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
      let systemPort = await this.sysportService.getSerialPortList();
      let configPort = await this.sysportService.get();
      config.properties[`path`].enum = [];
      config.properties[`path`].enumDisplay = {};
      systemPort.forEach((elem, index) => {
        config.properties[`path`].enum.push(elem.path);
        let disabled = false;
        for(let i in configPort)
          disabled = disabled || (configPort[i].path == elem.path);
        config.properties[`path`].enumDisplay[elem.path] = {"disabled": disabled};
      });

      resolve(config);
    });
  }

  generatePortId(params) {
    console.log(`ServiceConfigTranslator: generatePortId() >> `);
    return new Promise(async (resolve, reject) => {
      resolve(propId);
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