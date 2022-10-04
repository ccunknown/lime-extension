const { Validator } = require("jsonschema");

const {
  ValidateConfigSchema,
  AttributeList,
  AlternateList,
} = require(`./define`);

const SerialPort = require(`serialport`);

class SysportConfigTranslator {
  constructor(sysportService) {
    this.sysportService = sysportService;
    this.validator = new Validator();
  }

  generateConfigSchema(params) {
    console.log(`[${this.constructor.name}]`, `generateConfigSchema() >> `);
    console.log(`Params: ${JSON.stringify(params, null, 2)}`);
    return new Promise((resolve, reject) => {
      //  Copy config from ValidateConfigSchema.
      const config = JSON.parse(JSON.stringify(ValidateConfigSchema));

      //  Assign 'alternate' attribute.
      AlternateList.forEach((index) => {
        // if (config.properties.hasOwnProperty(index))
        if (Object.prototype.hasOwnProperty.call(config.properties, index))
          config.properties[index].alternate = true;
      });

      //  Assign 'attrs' attribute.
      AttributeList.forEach((index) => {
        // if (config.properties.hasOwnProperty(index.target))
        if (
          Object.prototype.hasOwnProperty.call(config.properties, index.target)
        )
          config.properties[index.target].attrs = index.attrs;
      });

      //  Initial 'enum' attribute.
      let systemPort;
      let configPort;
      Promise.resolve()
        .then(() => this.getSerialPortList())
        .then((sysport) => {
          systemPort = sysport;
        })
        .then(() => this.sysportService.objects.get())
        .then((confPort) => {
          configPort = confPort;
        })
        .then(() => {
          config.properties.path.enum = [];
          config.properties.path.enumDisplay = {};
          systemPort.forEach((elem) => {
            config.properties.path.enum.push(elem.path);
            let disabled = false;
            Object.keys(configPort).forEach((i) => {
              disabled = disabled || configPort[i].path === elem.path;
            });
            config.properties.path.enumDisplay[elem.path] = {
              disabled,
            };
          });
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

  getSerialPortList() {
    console.log(`[${this.constructor.name}]`, `getSerialPortList() >> `);
    return new Promise((resolve, reject) => {
      const portList = [];
      Promise.resolve()
        .then(() => SerialPort.list())
        .then((ports) => {
          ports.forEach((port) => {
            portList.push({
              path: port.path,
              pnpId: port.pnpId ? port.pnpId : null,
              manufacturer: port.manufacturer ? port.manufacturer : null,
            });
          });
          // console.log(
          //   `[${this.constructor.name}]`,
          //   `port: ${JSON.stringify(ports, null, 2)}`
          // );
          console.log(
            `[${this.constructor.name}]`,
            `portList: ${JSON.stringify(portList, null, 2)}`
          );
          resolve(portList);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}

module.exports = SysportConfigTranslator;
