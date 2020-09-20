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
      this.initLoader()
      .then(() => this.initCoreObject())
      .then(() => this.initWindowObject())
      .then(() => this.api.getConfig())
      .then((config) => {
        this.console.log(`get config`);
        this.config = config;
        this.console.log(this.config);
        this.ui.render(this.config);
      })
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  initLoader() {
    return new Promise((resolve, reject) => {
      import(`/extensions/${this.id}/static/core/js/loader.js`)
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