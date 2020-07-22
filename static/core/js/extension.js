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
    //let prom = this.init();
    this.promise.push(this.init());

    Promise.all(this.promise).then(() => {
      this.view.innerHTML = this.ui.view;
      this.ui.initRaid();
      this.ui.initNavEvent();
      this.ui.initScript();
      this.api.getConfig().then((config) => {
        this.console.log(`get config`);
        this.config = config;
        this.console.log(this.config);
        this.ui.render(this.config);
      });
    });
  }

  init() {
    return new Promise(async (resolve, reject) => {
      await this.initLoader();
      await this.initCoreObject();
      await this.initWindowObject();
      resolve();
    });
  }

  initLoader() {
    return new Promise(async (resolve, reject) => {
      //  Call Loader.
      let ExtensionLoader = (await import(`/extensions/${this.id}/static/core/js/loader.js`)).default;
      this.loader = new ExtensionLoader(this);
      //this.loader = new ((await import(`/extensions/${this.id}/static/core/js/loader.js`)).default)();
      await this.loader.init();
      resolve();
    });
  }

  initCoreObject() {
    return new Promise(async (resolve, reject) => {
      this.collector = new (this.loader.getCoreObject(`collector`))(this);
      this.api = new (this.loader.getCoreObject(`api`))(this);
      this.ui = new (this.loader.getCoreObject(`ui`))(this);

      await this.collector.init();
      await this.api.init();
      await this.ui.init();

      resolve();
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