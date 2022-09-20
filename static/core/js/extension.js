export default class ExtensionMain extends window.Extension {
  constructor(schema) {
    super(schema.extension.full);
    this.schema = JSON.parse(JSON.stringify(schema));
    this.addMenuEntry(`${this.schema.extension[`title-full`]}`);

    this.promise = [];
    this.content = '';
    this.contents = {};
    this.resourceSchema = null;
    this.resourceObj = null;

    this.console = console;
    this.console.trace = () => {};

    this.init();
  }

  init() {
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.initLoader())
      .then(() => this.initCoreObject())
      .then(() => this.initWindowObject())
      .then(() => this.api.getConfig())
      .then((config) => {
        this.config = config;
        this.console.log(`config`, this.config);
      })
      .then(() => this.initRTCPeer())
      .then(() => this.ui.render(this.config))
      .then(() => this.rtcpageController.init())
      // .then(() => this.rtcpeer.init(config[`service-config`][`rtcpeer-service`].config))
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  initLoader() {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => import(`/extensions/${this.id}/static/core/js/loader.js`))
        .then((ExtensionLoader) => new ExtensionLoader.default(this))
        .then((loader) => this.loader = loader)
        .then(() => this.loader.init())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  initCoreObject() {
    return new Promise((resolve, reject) => {
      this.collector = new (this.loader.getCoreObject(`collector`))(this);
      this.api = new (this.loader.getCoreObject(`api`))(this);
      this.ui = new (this.loader.getCoreObject(`ui`))(this);
      this.rtcpeer = new (this.loader.getCoreObject(`rtcPeer`))();
      this.rtcpageController = new (this.loader.getCoreObject(`rtcPageController`))(this);

      // await this.ui.init();
      // await this.collector.init();
      // await this.api.init();

      //  Sequential promise using 'reduce'.
      let initialCoreComp = [this.ui, this.collector, this.api].reduce((prev, next) => {
        return prev.then(() => next.init()).catch((err) => reject(err));
      }, Promise.resolve());
      initialCoreComp.then(() => resolve());
    });
  }

  initWindowObject() {
    return new Promise(async (resolve, reject) => {
      let name = this.schema.extension.code;
      if(!window[name]) {
        window[name] = this;
      }
      else {
        this.console.warn(`window.${name} already exist!`);
      }
      resolve();
    });
  }

  initRTCPeer() {
    this.console.log(`initRTCPeer() >> `);
    let config = JSON.parse(JSON.stringify({
      peerConnectionConfig: this.config[`service-config`][`rtcpeer-service`],
      apiOptions: {
        endpoint: `/${this.loader.define[`url-prefix`].split(`/`).filter(e => e.length).join(`/`)}/api/rtcpeer`,
        headers: window.API.headers()
      }
      // apiEndpoint: `/${this.loader.define[`url-prefix`].split(`/`).filter(e => e.length).join(`/`)}/api`
    }));
    // config.apiEndpoint = `/${this.loader.define[`url-prefix`].split(`/`).filter(e => e.length).join(`/`)}/api`;
    // return this.rtcpeer.init(config);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.rtcpeer.init(config))
      .then(() => this.rtcpeer.start())
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  render() {
    this.console.trace(`render() >> `);
    let schema = this.resourceSchema;

  }

  show() {
    /*
    Promise.all(this.promise).then(() => {
      this.view.innerHTML = this.ui.view;
      this.api.getConfig().then((config) => {
        this.console.log(`get config`);
        this.config = config;
        this.console.log(JSON.stringify(this.config, null, 2));
      });
    });
    */
  }

  idOfText(content) {
    return $(`*`, content).map(function() {
      if(this.id)
        return this.id;
    }).get();
  }
}