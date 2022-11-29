/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-nested-ternary */
const Service = require(`../service-template/service`);
// const Database = require(`../../lib/my-database`);
// const { Defaults, Errors } = require(`../../../constants/constants`);
// const { Errors } = require(`../../../constants/constants`);

const ConfigTranslator = require(`./config-translator.js`);

// const SerialPort = require(`serialport`);

class IoportService extends Service {
  constructor(extension, config, id) {
    super(extension, config, id);
    console.log(`[${this.constructor.name}]`, `contructor() >> `);
  }

  init(config) {
    console.log(`[${this.constructor.name}]`, `init() >> `);
    return new Promise((resolve) => {
      this.config = config || this.config;
      this.portList = {};
      resolve();
    });
  }

  start(conf) {
    return new Promise((resolve, reject) => {
      console.log(`[${this.constructor.name}]`, `start() >> `);
      // eslint-disable-next-line no-unused-vars
      const config = conf || this.config;
      this.portList = {};
      // this.enginesService = this.laborsManager.getService(`engines-service`).obj;
      this.configTranslator = new ConfigTranslator(this);
      // console.log(`ioport config : ${JSON.stringify(this.config, null, 2)}`);
      // const serviceConfig = this.getSchema();
      const serviceConfig = this.getConfig();
      console.log(`[${this.constructor.name}]`, JSON.stringify(serviceConfig));
      const { list } = serviceConfig;
      Object.keys(list)
        .reduce((prevProm, id) => {
          return prevProm
            .then(() => this.objects.addToService(id, list[id]))
            .catch((err) => console.error(err));
        }, Promise.resolve())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  loadObject(config, template) {
    console.log(`[${this.constructor.name}]`, `loadObject() >> `);
    return new Promise((resolve, reject) => {
      console.log(`[${this.constructor.name}]`, `template:`, template);
      let object;
      Promise.resolve()
        .then(() => {
          const path = template.path.replace(/^\//, ``);
          const Obj = require(`./${path}/ioport.js`);
          object = new Obj(this, config);
        })
        .then(() => object.init())
        .then(() =>
          Object.prototype.hasOwnProperty.call(object, `oo`) &&
          typeof object.oo.start === `function`
            ? object.oo.start()
            : object.start()
        )
        .then(() => resolve(object))
        .catch((err) => reject(err));
    });
  }

  // getSerialPortList() {
  //   console.log(`[${this.constructor.name}]`, `getSerialPortList() >> `);
  //   return new Promise((resolve, reject) => {
  //     const portList = [];
  //     Promise.resolve()
  //       .then(() => SerialPort.list())
  //       .then((ports) => {
  //         ports.forEach((port) => {
  //           portList.push({
  //             path: port.path,
  //             pnpId: port.pnpId ? port.pnpId : null,
  //             manufacturer: port.manufacturer ? port.manufacturer : null,
  //           });
  //         });
  //         console.log(
  //           `[${this.constructor.name}]`,
  //           `port: ${JSON.stringify(ports, null, 2)}`
  //         );
  //         console.log(
  //           `[${this.constructor.name}]`,
  //           `portList: ${JSON.stringify(portList, null, 2)}`
  //         );
  //         resolve(portList);
  //       })
  //       .catch((err) => {
  //         reject(err);
  //       });
  //   });
  // }
}

module.exports = IoportService;
