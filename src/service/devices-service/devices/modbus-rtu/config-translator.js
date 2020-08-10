class ConfigTranslator {
  constructor(device) {
    this.device = device;
    this.devicesService = this.device.exConf[`devices-service`];
  }

  getConfig(params) {
    console.log(`ConfigSchema: getConfigSchema() >> `);
    console.log(`params: ${JSON.stringify(params, null, 2)}`);
    return new Promise(async (resolve, reject) => {
      let devices = await this.devicesService.getTemplate(null, {"deep": true});
      let schema = await this.devicesService.getTemplate(__dirname.split(`/`).pop(), {"deep": true});
      let props = schema.children.find((elem) => elem.name == `property`).children;
      let compatScript = await this.devicesService.getCompatibleScript(this.device.exConf.compatibleScriptList);
      let compatEngine = await this.devicesService.getCompatibleEngine(this.device.exConf.compatibleEngineList);
      //console.log(`schema : ${JSON.stringify(schema, null ,2)}`);

      let config = {
        "type": "object",
        "required": [`script`, `engine`, `address`],
        "additionalProperties": false,
        "properties": {
          "script": {
            "type": "string",
            "title": "Script",
            "enum": compatScript,
            "alternate": true
          },
          "engine": {
            "type": "string",
            "title": "Engine",
            "enum": compatEngine
          },
          "address": {
            "type": "number",
            "title": "Modbus Address",
            "default": 1,
            "min": 0,
            "attr": {
              "placeholder": "Modbus address"
            }
          },
          "properties": {
            "type": "object",
            "title": "Property",
            "required": [],
            "patternProperties": {
              ".+": {
                "type": "object",
                "required": [],
                "additionalProperties": false,
                "properties": {
                  "template": {
                    "type": "string",
                    "title": "Property template",
                    "enum": props.map((elem) => elem.name.split(`.js`)[0])
                  },
                  "table": {
                    "type": "string",
                    "title": "Register table",
                    "default": "inputRegisters",
                    "enum": [`coils`, `contacts`, `inputRegisters`, `holdingRegisters`],
                    "alternate": true
                  },
                  "address": {
                    "type": "number",
                    "title": "Register address"
                  },
                  "period": {
                    "type": "number",
                    "title": "Period (ms)",
                    "default": 10000,
                    "min": 1000
                  }
                }
              }
            }
          }
        }
      };
      if(params && 
        params.script && 
        params.script != `` && 
        params.properties && 
        params.properties.table &&
        params.properties.table != ``) {

        await this.device.initScript(params.script);
        let addrList = this.device.exConf.script.map[params.properties.table];
        config.properties.properties.patternProperties[`.+`].properties.address.enum = [];
        for(let i in addrList) {
          config.properties.properties.patternProperties[`.+`].properties.address.enum.push(`${addrList[i].name} [Addr:${Number(i).toString(16)}]`);
        }
      }
      resolve(config);
    });
  }

  translate(schema) {
    //console.trace(`who call`);
    return new Promise(async (resolve, reject) => {
      let result = {
        //"id": schema.device.id,
        "name": schema.name,
        "type": [
          "modbus-device"
        ],
        "description": schema.description,
        "@context": "https://iot.mozilla.org/schemas",
        "@type": [`EnergyMonitor`],
        "config": {
          "template": schema.template,
          "script": schema.script,
          "engine": schema.engine,
          "address": Number(schema.address)
        },
        "properties": {}
      };
      await this.device.initScript(schema.script);
      console.log(`schema: ${JSON.stringify(schema, null, 2)}`);
      for(let i in schema.properties) {
        let prop = schema.properties[i];
        let id = `${prop.address.match(/(?:\[)([^\]]+)/i)[1].replace(`:`, ``).toLowerCase()}`;
        console.log(`prop id: ${id}`);
        let addrstr = prop.address.match(/(?:\[\w+:)([^\]]+)/i)[1];
        let address = parseInt(`0x${addrstr}`);
        console.log(`address: ${addrstr}/${address}`);
        let script = this.device.exConf.script.map[prop.table][address];

        result.properties[id] = {
          //"name": id,
          "label": script.name,
          "title": script.name,
          "type": script.type,
          "value": (script.type == `string`) ? `` : (script.type == `number`) ? 0 : (script.type == `boolean`) ? false : undefined,
          "unit": script.unit,
          "readOnly": true,
          "config": {
            "template": prop.template,
            "address": address,
            "table": prop.table,
            "period": Number(prop.period)
          }
        };
      }

      resolve(result);
    });
  }
}

module.exports = ConfigTranslator;