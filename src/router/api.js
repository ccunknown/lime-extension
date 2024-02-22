const ConfigApi = require(`./config-api`);
const ServiceApi = require(`./service-api`);

class API {
  constructor(extension) {
    this.extension = extension;
    this.configApi = new ConfigApi(extension);
    this.serviceApi = new ServiceApi(extension);
  }
}

module.exports = API;
