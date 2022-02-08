'use strict';

const {APIHandler, APIResponse} = require('gateway-addon');
const {Errors} = require('../constants/errors');
const manifest = require('../manifest.json');

const ConfigManager = require('./config-manager');
const LaborsManager = require('./labors-manager');
const RoutesManager = require('./routes-manager');

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
      .then((configManager) => this.configManager = configManager)
      .then(() => new LaborsManager(this))
      .then((laborsManager) => this.laborsManager = laborsManager)
      .then(() => new RoutesManager(this))
      .then((routesManager) => this.routesManager = routesManager)
      .then(() => this.addonManager.addAPIHandler(this.routesManager))
      .catch((err) => reject(err));
    });
  }
}

module.exports = LimeExtension;
