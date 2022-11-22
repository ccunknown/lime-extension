class ConfigApi {
  constructor(extension) {
    this.extension = extension;
    this.configManager = extension.configManager;
  }

  getConfig(path) {
    console.log(`[${this.constructor.name}]`, `getConfig(${path || ``})`);
    return this.configManager.getConfig(path);
  }
}

module.exports = ConfigApi;
