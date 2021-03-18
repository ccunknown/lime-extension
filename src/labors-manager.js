const servicePrefix = "./service/";
const Path = require(`path`);

class laborsManager {
  constructor(extension) {
    this.extension = extension;
    this.addonManager = extension.addonManager;
    this.configManager = extension.configManager;
    this.routesManager = extension.routesManager;

    this.serviceList = {};
    this.init();
  }

  init() {
    console.log(`laborsManager: init() >> `);
    return new Promise((resolve, reject) => {
      this.loadService()
      .then(() => {
        //console.log(`service list : `);
        //console.log(this.serviceList);
        resolve(this.startService());
      });
    });
  }

  loadService() {
    console.log(`laborsManager: loadService() >> `);
    return new Promise((resolve, reject) => {
      // this.configManager.getConfig()
      // .then(async (config) => {
      //   let serviceList = config.service;
      //   for(let i in serviceList) {
      //     let service = serviceList[i];
      //     let path = Path.join(`${servicePrefix}`, `${service.path}`);
      //     let serviceClass = require(`./${path}`);
      //     config = JSON.parse(JSON.stringify(config));
      //     //service.obj = new serviceClass(this.extension, config, service.id);
      //     service.obj = new serviceClass(this.extension, config, i);
      //     await service.obj.init();
      //     //console.log(`service : ${service.id}`);
      //     console.log(`service : ${i}`);
      //     //this.serviceList.push(service);
      //     this.serviceList[i] = service;
      //   }
      //   resolve();
      // });

      this.configManager.getConfig()
      .then((config) => {
        let serviceList = config.service;
        Object.keys(serviceList).reduce((prevProm, id) => {
          let service = serviceList[id];
          let path = Path.join(`${servicePrefix}`, `${service.path}`);
          let serviceClass = require(`./${path}`);
          config = JSON.parse(JSON.stringify(config));
          service.obj = new serviceClass(this.extension, config, id);
          console.log(`service : ${id}`);
          this.serviceList[id] = service;
          return service.obj.init();
        }, Promise.resolve())
        .then(() => resolve())
        .catch((err) => reject(err));
      });
    });
  }

  startService(serviceId) {
    console.log(`laborsManager: startService(${(serviceId) ? serviceId : ``})`);
    return new Promise((resolve, reject) => {
      if(serviceId) {
      	this.getService(serviceId).obj.start()
        .then(() => resolve());
      }
      else {
        let list = [];
        Object.keys(this.serviceList).reduce((prevProm, id) => {
          let service = this.serviceList[id];
          return (service.enable) ? this.startService(id) : Promise.resolve();
        }, Promise.resolve())
        .then(() => resolve())
        .catch((err) => reject(err));
      }
    });
  }

  getConfigService() {
    console.log(`laborsManager: getConfigService() >> `);
    return new Promise((resolve, reject) => {
      this.configManager.getConfig()
      .then((config) => {
        resolve(config.service);
      });
    });
  }

  getService(id) {
  	console.log(`laborsManager: getService(${id}) >> `);
  	return this.serviceList[id];
  }

  getService2(serviceId) {
    console.log(`laborsManager: getService(${serviceId}) >> `);
    return new Promise((resolve, reject) => {
      if(!serviceId)
        resolve(this.serviceList);
      let arr = this.serviceList.filter((service) => (service.id == serviceId));
      if(arr.length == 1) {
        console.log(arr[0].id);
        resolve(arr[0]);
      }
      else if(arr.length == 0)
        resolve(null);
      else
        reject(new Errors.FoundDuplicateServiceId(serviceId));
    });
  }
}

module.exports = laborsManager;