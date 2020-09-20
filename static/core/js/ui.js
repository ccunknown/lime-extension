export default class ExtensionUi {
  constructor(extension) {
    this.extension = extension;
    this.console = this.extension.console;

    this.mustache = window.Mustache;

    this.ext = this.extension.schema.extension;
    this.def = this.extension.schema.define;

    this.page = {};
    this.view = null;
    this.customObjects = {};
  }

  init() {
    return new Promise(async (resolve, reject) => {
      await this.initView();
      await this.initRaid(this.view);
      await this.initToasted();
      await this.initVueComponent();
      this.initFunction();
      //await this.initScript();
      //await this.initScript();

      this.extension.view.innerHTML = this.view;
      // this.initRaid();
      this.initNavEvent();
      this.initScript();

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

  initToasted() {
    console.log(`ExtensionUi: initVue() >> `);
    return new Promise((resolve, reject) => {
      Vue.use(Toasted, {
        "iconPack": "fontawesome"
      });
      let defaultOptions = {
        "position": `bottom-right`,
        "keepOnHover": true,
        "iconPack": `fontawesome`,
        "duration": 5000
      };
      this.toast = {
        "error": (message, options) => {
          return Vue.toasted.error(message, Object.assign(defaultOptions, 
            Object.assign({
              "icon": `fa-exclamation-triangle`
            }, (options) ? options : {})
          ));
        },
        "info": (message, options) => {
          return Vue.toasted.info(message, Object.assign(defaultOptions, 
            Object.assign({
              "icon": `fa-info-circle`
            }, (options) ? options : {})
          ));
        },
        "success": (message, options) => {
          return Vue.toasted.success(message, Object.assign(defaultOptions, 
            Object.assign({
              "icon": `fa-check-circle`
            }, (options) ? options : {})
          ));
        },
        "show": (message, options) => {
          return Vue.toasted.show(message, Object.assign(defaultOptions, 
            Object.assign({
              // "icon": `fa-check-circle`
            }, (options) ? options : {})
          ));
        },
        "transform": (toast, dest, message) => {
          let styleArr = [`default`, `success`, `info`, `error`];
          for(let i in styleArr)
            toast.el.classList.remove(styleArr[i]);
          toast.el.classList.add((styleArr.includes(dest)) ? dest : `default`);
          toast.text(message);
        }
      };
      resolve();
    });
  }

  initVueComponent() {
    return new Promise(async (resolve, reject) => {
      //  Load resource.
      let loader = this.extension.loader;
      let script = await loader.getObject(`vue-component-json-schema-script`);
      console.log(loader.objects);
      script.template = await loader.getObject(`vue-component-json-schema-template`);

      Vue.component(`json-schema-form`, script);
      resolve();
    });
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
    this.show = (id) => {
      this.saidObj(id).removeClass(`hide`);
      this.saidObj(id).addClass(`show`);
    };
    this.hide = (id) => {
      this.saidObj(id).removeClass(`show`);
      this.saidObj(id).addClass(`hide`);
    };
    this.enable = (id) => this.saidObj(id).removeClass(`disabled`);
    this.disable = (id) => this.saidObj(id).addClass(`disabled`);
    this.click = (id) => this.saidObj(id).click();

    this.vueDebug = () => {
      let arr = {};
      for(let i in this.page)
        if(this.page[i].object.vue && 
          this.page[i].object.vue.loader &&
          this.page[i].object.vue.loader.extension) {
          this.page[i].object.vue.loader.extension.debug = !this.page[i].object.vue.loader.extension.debug;
          console.log(`Debug ${i}: ${this.page[i].object.vue.loader.extension.debug}`);
          arr[i] = this.page[i].object.vue.loader.extension.debug;
        }
      return arr;
    };
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

  getCustomObject(id, options, ...args) {
    this.console.log(`getCustomObject(${id}) >> `);
    return new Promise((resolve, reject) => {
      if(!this.customObjects.hasOwnProperty(id) || !options || !options.unique) {
        let CustomObject = this.extension.loader.getCustomObject(id);
        if(CustomObject) {
          let customObject = new CustomObject(...args);
          if(options && options.unique)
            this.customObjects[id] = customObject;
          resolve(customObject);
        }
        else
          reject(`CustomObject id '${id}' not found!`);
      }
      else
        resolve(this.customObjects[id]);
    });
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

  generateData(schema, extend = false) {
    let result = {};
    if(schema.type == `object`) {
      for(let i in schema.properties) {
        result[i] = this.generateData(schema.properties[i], extend);
        if(schema.required.includes(i) && extend)
          result[i].required = true;
      }
    }
    else if(schema.type == `array`) {
      result = [];
    }
    else {
      // let value = (schema.default) ? schema.default :
      //   (schema.type == `string`) ? `` : 
      //   (schema.type == `number`) ? 0 : 
      //   (schema.type == `boolean`) ? false : null;
      let param = schema;
      let value = (param.const) ? param.const :
        (param.default) ? param.default :
        (param.enum && param.enum.length > 0) ? param.enum[0] :
        (param.type == `string`) ? `` :
        (param.type == `number`) ? (param.min) ? param.min : 0 :
        (param.type == `boolean`) ? false : undefined;
      if(extend) {
        result = JSON.parse(JSON.stringify(schema));
        result.value = value;
      }
      else
        result = value;
    }
    return result;
  }

  generateVueData(schema) {
    return this.generateData(schema, true);
  }

  shortJsonElement(schema, elem) {
    //this.console.log(`PageSysport: shortJsonElement(${elem}) >> `);
    if(schema[elem]) {
      return schema[elem];
    }
    else if(Array.isArray(schema) || typeof schema == `object`) {
      for(let i in schema) {
        let res = this.shortJsonElement(schema[i], elem);
        if(res)
          return res;
      }
      return null;
    }
    else {
      return null;
    }
  }
}