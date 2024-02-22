const { Validator } = require(`jsonschema`);
const {
  ValidateConfigSchema,
  AttributeList,
  AlternateList,
} = require(`./define`);

class ServiceConfigTranslator {
  constructor(enginesService) {
    this.enginesService = enginesService;
    this.ioportsService = this.enginesService.ioportsService;
    this.validator = new Validator();
  }

  generateConfigSchema() {
    console.log(`ServiceConfigTranslator: generateConfigSchema() >> `);
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
      Promise.resolve()
        .then(() => this.ioportsService.objects.get())
        .then((portList) => {
          console.log(
            `[${this.constructor.name}]`,
            `portList`,
            Object.keys(portList)
          );
          config.properties.port.enum = [];
          Object.keys(portList).forEach((i) => {
            config.properties.port.enum.push(i);
          });
        })
        .then(() => resolve(config))
        .catch((err) => reject(err));
      // let portList = await this.ioportsService.objects.get();
      // config.properties[`port`].enum = [];
      // for(let i in portList)
      //   config.properties[`port`].enum.push(i);

      // resolve(config);
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
