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
      this.configManager.getConfig()
      .then((config) => {
        let serviceList = config.service;
        return Object.keys(serviceList).reduce((prevProm, id) => {
          let service = serviceList[id];
          return prevProm
            .then(() => {
              let path = Path.join(`${servicePrefix}`, `${service.path}`);
              let serviceClass = require(`./${path}`);
              config = JSON.parse(JSON.stringify(config));
              service.obj = new serviceClass(this.extension, config, id);
              console.log(`[${this.constructor.name}]`, `service : ${id}`);
              this.serviceList[id] = service;
            })
            // .then(() => service.obj.init());
        }, Promise.resolve())
        .catch((err) => reject(err));
      })
      .then(() => Object.keys(this.serviceList).reduce((prevProm, id) => {
        return prevProm.then(() => this.serviceList[id].obj.init());
      }, Promise.resolve()))
      .then(() => console.log(`[${this.constructor.name}]`, `services load complete`))
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  startService(serviceId) {
    console.log(`[${this.constructor.name}]`, `startService(${(serviceId) ? serviceId : ``})`);
    return new Promise((resolve, reject) => {
      if(serviceId) {
        Promise.resolve()
        .then(() => this.getService(serviceId))
        .then((service) => service.obj.start())
        .then(() => resolve())
        .catch((err) => reject(err));
      }
      else {
        Object.keys(this.serviceList).reduce((prevProm, id) => {
          let service = this.serviceList[id];
          return prevProm
            .then(() => console.log(`[${this.constructor.name}]`, `service "${id}" starting ...`))
            .then(() =>
              (service.enable)
                ? this.startService(id)
                : Promise.resolve()
            )
            .then(() =>
              (service.enable)
                ? console.log(`[${this.constructor.name}]`, `service "${id}" started ###`)
                : console.log(`[${this.constructor.name}]`, `service "${id}" skipped >>>`)
            );
        }, Promise.resolve())
        .then(() => console.log(`[${this.constructor.name}]`, `all service started`))
        .then(() => resolve())
        .catch((err) => reject(err));
      }
    });
  }

  getConfigService() {
    console.log(`[${this.constructor.name}]`, `getConfigService() >> `);
    return new Promise((resolve, reject) => {
      this.configManager.getConfig()
      .then((config) => resolve(config.service))
      .catch((err) => reject(err));
    });
  }

  getService(id) {
  	console.log(`[${this.constructor.name}]`, `getService(${id}) >> `);
  	return this.serviceList[id];
  }

  // getService(serviceId) {
  //   console.log(`[${this.constructor.name}]`, `getService(${serviceId}) >> `);
  //   return new Promise((resolve, reject) => {
  //     if(!serviceId)
  //       resolve(this.serviceList);
  //     else {
  //       let arr = this.serviceList.filter((service) => (service.id == serviceId));
  //       if(arr.length == 1) {
  //         console.log(arr[0].id);
  //         resolve(arr[0]);
  //       }
  //       else if(arr.length == 0)
  //         resolve(null);
  //       else
  //         reject(new Errors.FoundDuplicateServiceId(serviceId));
  //     }
  //   });
  // }
}

module.exports = LaborsManager;