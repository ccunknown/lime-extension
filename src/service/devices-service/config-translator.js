const {
  ValidateConfigSchema,
  AttributeList,
  AlternateList
} = require(`./define`);

class ServiceConfigTranslator {
  constructor(devicesService) {
    this.devicesService = devicesService;
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
}

module.exports = ServiceConfigTranslator;