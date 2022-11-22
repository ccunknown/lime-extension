/* eslint-disable no-nested-ternary */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const { Validator } = require(`jsonschema`);
// const MAX_ADDRESS_PER_REQUEST = 125;

const {
  ValidateConfigSchema,
  AlternateList,
  AttributeList,
} = require(`./define.js`);

class PropertyConfigTranslator {
  constructor(devicesService) {
    this.devicesService = devicesService;
    this.scriptsService = this.devicesService.scriptsService;

    this.validator = new Validator();

    const rootDir = this.devicesService.getRootDirectory();
    // console.log(`>> Root Directory: ${rootDir}`);
    this.Errors = require(`${rootDir}/constants/errors.js`);
  }

  generateConfigSchema(params) {
    console.log(`PropertyConfigTranslator: generateConfigSchema() >> `);
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
      if (
        params &&
        params.script &&
        params.script !== `` &&
        params.properties &&
        params.properties.table &&
        params.properties.table !== ``
      ) {
        Promise.resolve()
          .then(() =>
            this.scriptsService.get(params.script, { object: true, deep: true })
          )
          .then((script) => {
            const readMap = script.children.find(
              (elem) => elem.name === `readMap.js`
            ).object.map;
            const addrList = readMap[params.properties.table];
            config.properties.address.items.enum = [];
            config.properties.address.items.enumDisplay = {};
            Object.keys(addrList).forEach((i) => {
              config.properties.address.items.enum.push(Number(i));
              config.properties.address.items.enumDisplay[Number(i)] = {
                title: `${addrList[i].name} [Addr:${Number(i).toString(16)}] ${(addrList[i].unit) ? `(${addrList[i].unit})` : ``}`
              };
            });

            //  Initial 'name' property.
            console.log(`address: ${params.properties.address}`);
            if (
              Object.prototype.hasOwnProperty.call(
                params.properties,
                `address`
              ) &&
              params.properties.address.length
            ) {
              params.properties.address.sort((a, b) => a - b);
              const first = params.properties.address[0];
              const last =
                params.properties.address[params.properties.address.length - 1];
              console.log(`>> address: ${params.properties.address}`);
              // console.log(`readmap: ${JSON.stringify(readMap[params.properties.table], null, 2)}`);
              if (
                Object.prototype.hasOwnProperty.call(
                  params.properties,
                  `name`
                ) &&
                readMap[params.properties.table][first] &&
                readMap[params.properties.table][last]
              ) {
                const firstName = readMap[params.properties.table][first].name;
                const lastName = readMap[params.properties.table][last].name;
                config.properties.name.const = `${firstName}->${lastName}`;
              }
            }
          })
          .then(() => resolve(config))
          .catch((err) => reject(err));
      } else {
        resolve(config);
      }
    });
  }

  generateId(params) {
    console.log(`PropertyConfigTranslator: generateId() >> `);
    return new Promise((resolve, reject) => {
      params.properties.address.sort((a, b) => a-b);
      const first = params.properties.address[0];
      const last =
        params.properties.address[params.properties.address.length - 1];
      const id = `bulk-reader-${params.properties.table}-${Number(first).toString(16)}-${Number(last).toString(16)}`;
      Promise.resolve()
        .then(() =>
          this.scriptsService.get(params.script, { object: true, deep: true })
        )
        .then(
          (script) =>
            script.children.find((elem) => elem.name === `readMap.js`).object
              .map
        )
        .then((readMap) => [
          readMap[params.properties.table][first],
          readMap[params.properties.table][last],
        ])
        .then((prop) => {
          const result = {
            id,
            name: `${prop[0].name}->${prop[1].name}`,
          };
          console.log(
            `>> prop id gen result: ${JSON.stringify(result, null, 2)}`
          );
          resolve(result);
        })
        .catch((err) => reject(err));
    });
  }

  translate(config, fullMap) {
    console.log(`PropertyConfigTranslator: translate() >> `);
    return new Promise((resolve, reject) => {
      const validateInfo = this.validator.validate(
        config,
        ValidateConfigSchema
      );
      if (validateInfo.errors.length)
        reject(new this.Errors.InvalidConfigSchema(validateInfo.errors));

      const modbusRegister = fullMap.map[config.table][`${config.address[0]}`];
      // console.log(`>> FullMap: ${JSON.stringify(fullMap.map[config.table], null, 2)}`);
      try {
        const schema = {
          name: modbusRegister.name,
          type: modbusRegister.type,
          value:
            modbusRegister.type === `string`
              ? ``
              : modbusRegister.type === `number`
              ? 0
              : modbusRegister.type === `boolean`
              ? false
              : undefined,
          unit: modbusRegister.unit,
          readOnly: true,
        };

        resolve(schema);
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = PropertyConfigTranslator;
