/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const servicePrefix = "./service/";
const Path = require(`path`);

class LaborsManager {
  constructor(extension) {
    this.extension = extension;
    this.addonManager = extension.addonManager;
    this.configManager = extension.configManager;
    this.routesManager = extension.routesManager;

    this.serviceList = {};
    this.init();
  }

  init() {
    console.log(`[${this.constructor.name}]`, `init() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.loadService())
        .then(() => this.startService())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  loadService() {
    console.log(`[${this.constructor.name}]`, `loadService() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.configManager.getConfig())
        .then((config) => {
          // console.log(`[${this.constructor.name}]`, `config:`, JSON.stringify(config));
          const serviceList = config.service;
          const conf = JSON.parse(JSON.stringify(config));
          return Object.keys(serviceList)
            .reduce((prevProm, id) => {
              const service = serviceList[id];
              return prevProm.then(() => {
                const path = Path.join(`${servicePrefix}`, `${service.path}`);
                const ServiceClass = require(`./${path}`);
                service.obj = new ServiceClass(
                  this.extension,
                  conf[`service-config`][id],
                  id
                );
                console.log(`[${this.constructor.name}]`, `service : ${id}`);
                this.serviceList[id] = service;
              });
              // .then(() => service.obj.init());
            }, Promise.resolve())
            .catch((err) => reject(err));
        })
        .then(() =>
          Object.keys(this.serviceList).reduce((prevProm, id) => {
            return prevProm.then(() => this.serviceList[id].obj.init());
          }, Promise.resolve())
        )
        .then(() =>
          console.log(`[${this.constructor.name}]`, `services load complete`)
        )
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  startService(serviceId) {
    console.log(
      `[${this.constructor.name}]`,
      `startService(${serviceId || ``})`
    );
    return new Promise((resolve, reject) => {
      if (serviceId) {
        Promise.resolve()
          .then(() => this.getService(serviceId))
          .then((service) => service.obj.start())
          .then(() => resolve())
          .catch((err) => reject(err));
      } else {
        Object.keys(this.serviceList)
          .reduce((prevProm, id) => {
            const service = this.serviceList[id];
            return prevProm
              .then(() =>
                console.log(
                  `[${this.constructor.name}]`,
                  `service "${id}" starting ...`
                )
              )
              .then(() =>
                service.enable ? this.startService(id) : Promise.resolve()
              )
              .then(() =>
                service.enable
                  ? console.log(
                      `[${this.constructor.name}]`,
                      `service "${id}" started ###`
                    )
                  : console.log(
                      `[${this.constructor.name}]`,
                      `service "${id}" skipped >>>`
                    )
              );
          }, Promise.resolve())
          .then(() =>
            console.log(`[${this.constructor.name}]`, `all service started`)
          )
          .then(() => resolve())
          .catch((err) => reject(err));
      }
    });
  }

  getConfigService() {
    console.log(`[${this.constructor.name}]`, `getConfigService() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.configManager.getConfig())
        .then((config) => resolve(config.service))
        .catch((err) => reject(err));
    });
  }

  getService(id) {
    // console.log(`[${this.constructor.name}]`, `getService(${id}) >> `);
    return this.serviceList[id];
  }
}

module.exports = LaborsManager;
