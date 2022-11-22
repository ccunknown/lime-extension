class ConfigRouter {
  constructor(extension, routesAdapter) {
    this.extension = extension;
    this.routesAdapter = routesAdapter;
    this.api = this.extension.api;
    this.configApi = this.extension.api.configApi;

    this.makeJsonRespond = this.routesAdapter.makeJsonRespond;
    this.catchErrorRespond = this.routesAdapter.catchErrorRespond;
  }

  setRouter() {
    this.router = [
      {
        resource: /\/config/,
        method: {
          GET: () => {
            return Promise.resolve()
              .then(() => this.configApi.getConfig())
              .then((res) => this.makeJsonRespond(JSON.stringify(res)))
              .catch((err) => this.catchErrorRespond(err));
          },
        },
      },
    ];
  }

  getRouter() {
    return this.router;
  }
}

module.exports = ConfigRouter;
