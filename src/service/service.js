'use strict'

const EventEmitter = require(`events`).EventEmitter;

class Service extends EventEmitter {
  constructor(extension, config, id) {
    super(extension.addonManager, extension.manifest.id);

    this.extension = extension;
    this.manifest = extension.manifest;
    this.addonManager = extension.addonManager;
    this.laborsManager = this.extension.laborsManager;
    this.configManager = this.extension.configManager;
    this.routesManager = this.extension.routesManager;

    this.config = JSON.parse(JSON.stringify(config));
    this.id = id;
    this.setupConfigHandler();
    //console.log(`Service constructor : ${this.id}`);
  }

  getSchema(options) {
    if(options && options.renew)
      return new Promise(async (resolve, reject) => {
        let config = await this.getConfig(options);
        resolve(config[`service-config`].find((elem) => (elem.id == this.id)));
      });
    else {
      return this.config[`service-config`][this.id];
    }
  }

  getConfig(options) {
    if(options && options.renew)
      return new Promise(async (resolve, reject) => {
        let config = (options.save) ? 
          await this.reloadConfig() : 
          await this.configManager.getConfig();
        resolve(config);
      });
    else
      return this.config;
  }

  reloadConfig() {
    console.log(`laborsManager: reloadConfig() >> `);
    return new Promise(async (resolve, reject) => {
      this.config = JSON.parse(JSON.stringify(await this.configManager.getConfig()));
      resolve(this.config);
    });
  }

  setupConfigHandler() {
    this.configManager.event.on(`new-config`, () => {
      console.log(`New config!`);
    });
  }
}

module.exports = Service;