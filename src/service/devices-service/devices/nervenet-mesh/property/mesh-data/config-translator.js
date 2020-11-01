const Validator = require('jsonschema').Validator;

const {
  ValidateConfigSchema, 
  AlternateList,
  AttributeList
} = require(`./define.js`);

class PropertyConfigTranslator {
  constructor(devicesService) {
    this.devicesService = devicesService;
    this.scriptsService = this.devicesService.scriptsService;

    this.validator = new Validator();

    let rootDir = this.devicesService.getRootDirectory();
    // console.log(`>> Root Directory: ${rootDir}`);
    this.Errors = require(`${rootDir}/constants/errors.js`);
  }

  generateConfigSchema(params) {
    console.log(`PropertyConfigTranslator: generateConfigSchema() >> `);
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
      //

      resolve(config);
    });
  }

  generateId(params) {
    console.log(`PropertyConfigTranslator: generateId() >> `);
    return new Promise((resolve, reject) => {
      resolve({
        "id": `mesh-data`,
        "title": params.properties.title
      });
    });
  }

  translate(config) {
    console.log(`PropertyConfigTranslator: translate() >> `);
    return new Promise((resolve, reject) => {
      let validateInfo = this.validator.validate(config, ValidateConfigSchema);
      if(validateInfo.errors.length)
        reject(new this.Errors.InvalidConfigSchema(validateInfo.errors));

      try {
        let schema = {
          "title": config.title,
          "type": `string`,
          "value": ``,
          "unit": ``,
          "readOnly": true
        };
        resolve(schema);
      } catch(err) {
        reject(err);
      }
    });
  }
}

module.exports = PropertyConfigTranslator;