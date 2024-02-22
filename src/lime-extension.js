// const { APIHandler, APIResponse } = require(`gateway-addon`);
// const { Errors } = require(`../constants/errors`);
const manifest = require(`../manifest.json`);

const ConfigManager = require(`./config-manager`);
const LaborsManager = require(`./labors-manager`);
const RoutesManager = require(`./routes-manager`);
const API = require(`./router/api`);
const RoutesAdapter = require(`./router/routes-adapter`);

class LimeExtension {
  constructor(addonManager) {
    this.addonManager = addonManager;
    this.manifest = manifest;
    // this.configManager = new ConfigManager(this);
    // this.laborsManager = new LaborsManager(this);
    // this.routesManager = new RoutesManager(this);

    // addonManager.addAPIHandler(this.routesManager);
    this.init();
  }

  init() {
    console.log(`[${this.constructor.name}]`, `init() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => new ConfigManager(this))
        .then((configManager) => {
          this.configManager = configManager;
        })
        .then(() => this.configManager.getConfig())
        .then((conf) => {
          this.config = conf;
        })
        .then(() => new LaborsManager(this))
        .then((laborsManager) => {
          this.laborsManager = laborsManager;
        })
        .then(() => new RoutesManager(this))
        .then((routesManager) => {
          this.routesManager = routesManager;
        })
        // .then(() => new API(this))
        // .then((api) => {
        //   this.api = api;
        // })
        // .then(() => new RoutesAdapter(this))
        // .then((routesAdapter) => {
        //   this.routesAdapter = routesAdapter;
        // })
        .then(() => this.addonManager.addAPIHandler(this.routesManager))
        // .then(() => this.addonManager.addAPIHandler(this.routesAdapter))
        .catch((err) => reject(err));
    });
  }
}

module.exports = LimeExtension;
