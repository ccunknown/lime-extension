export default class ExtensionUi {
  constructor(extension) {
    this.extension = extension;
    this.console = this.extension.console;

    this.page = {};
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

    for(let i in customViews) {
      let schema = this.extension.loader.getSchemaDefine(i);
      this.page[i] = {};
      this.page[i].schema = schema;
      this.page[i].view = customViews[i];
      if(schema[`link-script`]) {
        this.page[i].object = new (this.extension.loader.getObject(schema[`link-script`]))(this.extension);
      }
    }

    for(let i in this.page) {
      
    }

    console.log(this.page);
  }

  initRaid() {
    
  }

  initScript() {

  }

  render() {

  }

  getNav() {
    
  }
}