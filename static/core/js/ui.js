export default class ExtensionUi {
  constructor(extension) {
    this.extension = extension;
    this.console = this.extension.console;

    this.mustache = window.Mustache;

    this.ext = this.extension.schema.extension;
    this.def = this.extension.schema.define;

    this.page = {};
    this.view = null;
  }

  init() {
    return new Promise(async (resolve, reject) => {
      await this.initView();
      await this.initRaid(this.view);
      this.initFunction();
      //await this.initScript();
      //await this.initScript();
      resolve();
    });
  }

  initView() {
    let mainView = this.extension.loader.getCoreObject(`page-main`);
    let resourceView = this.extension.loader.getCoreObject(`page-resource`);
    let customViews = this.extension.loader.getCustomViews();
    let customObjects = this.extension.loader.getCustomObjects();
    let data = {
      ext: this.ext,
      def: this.def,
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

  initRaid(str) {
    return new Promise((resolve, reject) => {
      //let list = this.getHtmlId(str);
      str = (str) ? str : $(`#${this.extension.schema.extension.html}-extension-view`).html();
      let list = this.getHtmlId(str);
      if(!this.raid) {
        this.console.log(`new raid`);
        const raid = this.extension.loader.getCoreObject(`raid`);
        this.raid = new raid(list);
      }
      else {
        this.console.log(`update raid`);
        this.raid.updateIdList(list);
      }
      this.console.log(list);
      this.said = this.raid.stringAutoId.bind(this.raid);
      this.saidObj = this.raid.stringAutoIdObject.bind(this.raid);
      resolve();
    });
  }

  initFunction() {
    this.show = (id) => this.saidObj(id).removeClass(`hide`);
    this.hide = (id) => this.saidObj(id).addClass(`hide`);
    this.enable = (id) => this.saidObj(id).removeClass(`disabled`);
    this.disable = (id) => this.saidObj(id).addClass(`disabled`);
    this.click = (id) => this.saidObj(id).click();
  }

  initScript() {
    for(let i in this.page) {
      let page = this.page[i];
      if(page.object && page.object.init)
        page.object.init();
    }
  }

  initNavEvent() {
    for(let i in this.page) {
      //this.console.log(this.saidObj);
      let navObj = this.saidObj(`${this.ext.html}.nav.${this.page[i].schema.name}`);
      navObj.on(`click`, () => {
        this.onNavClick(this.page[i]);
        
      });
      //this.console.log(navObj);
    }
  }

  onNavClick(page) {
    this.console.log(`onNavClick(${page.schema.name})`);
    if(page.object)
      page.object.render();
  }

  render() {

  }

  getNav() {
    
  }

  getHtmlId(str) {
    return $(`*`, str).map(function() {
      if(this.id)
        return this.id;
    }).get();
  }

  genComponent(type, id, schema) {
    let result = ``;
    switch(type) {
      case `input-text`:
        result = `<input type="text" class="" id="${id}">`
        break;
      default :
        console.warn(`genComponent with 'type': '${type}' not support!!!`);
        break;
    }
    return result;
  }
}