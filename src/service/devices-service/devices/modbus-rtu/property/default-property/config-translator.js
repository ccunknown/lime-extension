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
      if(params 
        && params.script 
        && params.script != ``
        && params.properties
        && params.properties.table
        && params.properties.table != ``) 
      {
        // let addrList = (await this.device.initScript(params.script)).map[params.properties.table];
        // let addrList = this.device.exConf.script.map[params.properties.table];
        let script = await this.scriptsService.get(params.script, {"object": true, "deep": true});
        let readMap = script.children.find((elem) => elem.name == `readMap.js`).object.map;
        let addrList = readMap[params.properties.table];
        config.properties.address.enum = [];
        config.properties.address.enumDisplay = {};
        for(let i in addrList) {
          //config.properties.address.enum.push(`${addrList[i].name} [Addr:${Number(i).toString(16)}]`);
          config.properties.address.enum.push(Number(i));
          config.properties.address.enumDisplay[Number(i)] = {
            "title": `${addrList[i].name} [Addr:${Number(i).toString(16)}]`
          };
        }

        //  Initial 'title' property.
        console.log(`address: ${params.properties.address}`);
        if(params.properties.hasOwnProperty(`address`)) {
          console.log(`>> address: ${params.properties.address}`);
          // console.log(`readmap: ${JSON.stringify(readMap[params.properties.table], null, 2)}`);
          if(readMap[params.properties.table][params.properties.address])
            config.properties.title.const = readMap[params.properties.table][params.properties.address].name;
        }
      }

      resolve(config);
    });
  }

  generateId(params) {
    console.log(`PropertyConfigTranslator: generateId() >> `);
    return new Promise((resolve, reject) => {
      let id = `${params.properties.table}-addr-${Number(params.properties.address).toString(16)}`;
      this.scriptsService.get(params.script, {"object": true, "deep": true})
      .then((script) => script.children.find((elem) => elem.name == `readMap.js`).object.map)
      .then((readMap) => readMap[params.properties.table][params.properties.address])
      .then((prop) => {
        let result = {
          "id": id,
          "title": prop.name
        }
        console.log(`>> prop id gen result: ${JSON.stringify(result, null, 2)}`);
        resolve(result);
      })
      .catch((err) => reject(err));
    });
  }

  translate(config, fullMap) {
    console.log(`PropertyConfigTranslator: translate() >> `);
    return new Promise(async (resolve, reject) => {
      let validateInfo = this.validator.validate(config, ValidateConfigSchema);
      if(validateInfo.errors.length)
        reject(new this.Errors.InvalidConfigSchema(validateInfo.errors));

      let modbusRegister = fullMap.map[config.table][`${config.address}`];
      // console.log(`>> FullMap: ${JSON.stringify(fullMap.map[config.table], null, 2)}`);
      let schema = {
        "title": modbusRegister.name,
        "type": modbusRegister.type,
        "value": (modbusRegister.type == `string`) ? `` : 
        (modbusRegister.type == `number`) ? 0 : 
        (modbusRegister.type == `boolean`) ? false : undefined,
        "unit": modbusRegister.unit,
        "readOnly": true
      };

      resolve(schema);
    });
  }
}

module.exports = PropertyConfigTranslator;