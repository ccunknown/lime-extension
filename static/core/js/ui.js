export default class ExtensionUi {
  constructor(extension) {
    this.extension = extension;
    this.console = this.extension.console;

    this.mustache = window.Mustache;

    this.page = {};
    this.view = null;
  }

  init() {
    return new Promise(async (resolve, reject) => {
      await this.initView();
      await this.initRaid();
      await this.initScript();
      resolve();
    });
  }

  initView() {
    let ext = this.extension.schema.extension;
    let define = this.extension.schema.define;
    let mainView = this.extension.loader.getCoreObject(`page-main`);
    let resourceView = this.extension.loader.getCoreObject(`page-resource`);
    let customViews = this.extension.loader.getCustomViews();
    let customObjects = this.extension.loader.getCustomObjects();
    let data = {
      ext: ext,
      define: define,
      page: null,
      nav: ``,
      content: ``
    };
    let resource = new DOMParser().parseFromString(resourceView, "text/html");

    for(let i in customViews) {
      let schema = this.extension.loader.getSchemaDefine(i);
      this.page[i] = {};
      this.page[i].schema = schema;
      this.page[i].view = customViews[i];
      if(schema[`link-script`])
        this.page[i].object = new (this.extension.loader.getObject(schema[`link-script`]))(this.extension);
    }

    for(let i in this.page) {
      data.page = this.page[i];
      data.nav = `${data.nav} ${this.mustache.render(resource.getElementById(`extension-template-nav`).innerHTML, data)}`;
      data.content = `${data.content} ${this.mustache.render(resource.getElementById(`extension-template-content`).innerHTML, data)}`;
    }

    this.view = this.mustache.render(mainView, data);
    this.dom = new DOMParser().parseFromString(this.view, `text/html`);

    console.log(this.dom);
  }

  initRaid() {
    
  }

  initScript() {

  }

  htmlCompile(html) {
    let str = `${html}`;

  }

  render() {

  }

  getNav() {
    
  }
}