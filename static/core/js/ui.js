/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
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
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.initView())
        .then(() => this.initRaid(this.view))
        .then(() => this.initToasted())
        .then(() => this.initVueComponent())
        .then(() => this.initFunction())
        .then(() => {
          this.extension.view.innerHTML = this.view;
        })
        .then(() => this.initNavEvent())
        .then(() => this.initScript())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  initView() {
    console.log(`initView()`);
    const mainView = this.extension.loader.getCoreObject(`page-main`);
    const resourceView = this.extension.loader.getCoreObject(`page-resource`);
    const resource = new DOMParser().parseFromString(resourceView, "text/html");
    const rtcOverlayView =
      this.extension.loader.getCoreObject(`page-rtc-overlay`);
    const rtcOverlay = new DOMParser().parseFromString(
      rtcOverlayView,
      "text/html"
    );
    const customViews = this.extension.loader.getCustomViews();
    const customObjects = this.extension.loader.getCustomObjects();
    const data = {
      ext: this.ext,
      def: this.def,
      page: null,
      nav: ``,
      content: ``,
      // rtcOverlay,
      rtcOverlay: null,
    };

    Object.keys(customViews).forEach((i) => {
      const schema = this.extension.loader.getSchemaDefine(i);
      this.page[i] = {};
      this.page[i].schema = schema;
      this.page[i].view = customViews[i];
      if (schema[`link-script`])
        this.page[i].object = new (this.extension.loader.getObject(
          schema[`link-script`]
        ))(this.extension);
    });
    // for(let i in customViews) {
    // }

    Object.keys(this.page).forEach((i) => {
      data.page = this.page[i];
      data.nav = `${data.nav} ${this.mustache.render(
        resource.getElementById(`extension-template-nav`).innerHTML,
        data
      )}`;
      data.content = `${data.content} ${this.mustache.render(
        resource.getElementById(`extension-template-content`).innerHTML,
        data
      )}`;
    });
    // for(let i in this.page) {
    // }
    // data.rtcOverlay = this.mustache.render(rtcOverlayView, data);
    data.rtcOverlay = rtcOverlayView;
    // document.getElementById(`extension-lime-rtc-overlay`).innerHTML = rtcOverlay;
    this.view = this.mustache.render(mainView, data);
    this.dom = new DOMParser().parseFromString(this.view, `text/html`);

    console.log(this.dom);
  }

  initToasted() {
    console.log(`ExtensionUi: initVue() >> `);
    return new Promise((resolve, reject) => {
      Vue.use(Toasted, {
        iconPack: "fontawesome",
      });
      const defaultOptions = {
        position: `bottom-right`,
        keepOnHover: true,
        iconPack: `fontawesome`,
        duration: 5000,
      };
      this.toast = {
        error: (message, options) => {
          return Vue.toasted.error(
            message,
            Object.assign(defaultOptions, {
              icon: `fa-exclamation-triangle`,
              ...(options || {}),
            })
          );
        },
        info: (message, options) => {
          return Vue.toasted.info(
            message,
            Object.assign(defaultOptions, {
              icon: `fa-info-circle`,
              ...(options || {}),
            })
          );
        },
        success: (message, options) => {
          return Vue.toasted.success(
            message,
            Object.assign(defaultOptions, {
              icon: `fa-check-circle`,
              ...(options || {}),
            })
          );
        },
        show: (message, options) => {
          return Vue.toasted.show(
            message,
            Object.assign(defaultOptions, {
              // "icon": `fa-check-circle`
              ...(options || {}),
            })
          );
        },
        transform: (toast, dest, message) => {
          const styleArr = [`default`, `success`, `info`, `error`];
          Object.keys(styleArr).forEach((i) => {
            toast.el.classList.remove(styleArr[i]);
          });
          // for(let i in styleArr)
          toast.el.classList.add(styleArr.includes(dest) ? dest : `default`);
          toast.text(message);
        },
      };
      resolve();
    });
  }

  initVueComponent() {
    console.log(`initVueComponent()`);
    return new Promise((resolve, reject) => {
      //  Load resource.
      const { loader } = this.extension;
      let script;
      console.log(loader.objects);
      Promise.resolve()
        .then(() => loader.getObject(`vue-component-json-schema-script`))
        .then((s) => {
          script = s;
        })
        .then(() => loader.getObject(`vue-component-json-schema-template`))
        .then((template) => {
          script.template = template;
        })
        .then(() => Vue.component(`json-schema-form`, script))
        .then(() => this.console.log(`initVueComponent() complete`))
        .then(() => resolve())
        .catch((err) => reject(err));

      // const script = await loader.getObject(`vue-component-json-schema-script`);
      // script.template = await loader.getObject(
      //   `vue-component-json-schema-template`
      // );

      // Vue.component(`json-schema-form`, script);
      // resolve();
    });
  }

  initRaid(raidStr) {
    return new Promise((resolve, reject) => {
      // let list = this.getHtmlId(str);
      const str =
        raidStr ||
        $(`#${this.extension.schema.extension.html}-extension-view`).html();
      const list = this.getHtmlId(str);
      if (!this.raid) {
        this.console.log(`new raid`);
        const raid = this.extension.loader.getCoreObject(`raid`);
        // eslint-disable-next-line new-cap
        this.raid = new raid(list);
      } else {
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
      const arr = {};
      Object.keys(this.page).forEach((i) => {
        if (
          this.page[i].object.vue &&
          this.page[i].object.vue.loader &&
          this.page[i].object.vue.loader.extension
        ) {
          this.page[i].object.vue.loader.extension.debug =
            !this.page[i].object.vue.loader.extension.debug;
          console.log(
            `Debug ${i}: ${this.page[i].object.vue.loader.extension.debug}`
          );
          arr[i] = this.page[i].object.vue.loader.extension.debug;
        }
      });
      // for(let i in this.page)
      return arr;
    };
  }

  initScript() {
    console.log(`initScript()`);
    console.log(`this.page:`, this.page);
    Object.keys(this.page).forEach((i) => {
      console.log(`page init:`, i, this.page[i]);
      const page = this.page[i];
      if (page.object && page.object.init) page.object.init();
    });
    // for(let i in this.page) {
    // }
  }

  initNavEvent() {
    Object.keys(this.page).forEach((i) => {
      // this.console.log(this.saidObj);
      const navObj = this.saidObj(
        `${this.ext.html}.nav.${this.page[i].schema.name}`
      );
      navObj.on(`click`, () => {
        this.onNavClick(this.page[i]);
      });
      // this.console.log(navObj);
    });
    // for(let i in this.page) {
    // }
  }

  onNavClick(page) {
    this.console.log(`onNavClick(${page.schema.name})`);
    if (page.object) page.object.render();
  }

  getCustomObject(id, options, ...args) {
    this.console.log(`getCustomObject(${id}) >> `);
    return new Promise((resolve, reject) => {
      if (
        !Object.prototype.hasOwnProperty.call(this.customObjects, id) ||
        !options ||
        !options.unique
      ) {
        const CustomObject = this.extension.loader.getCustomObject(id);
        if (CustomObject) {
          const customObject = new CustomObject(...args);
          if (options && options.unique) this.customObjects[id] = customObject;
          resolve(customObject);
        } else reject(new Error(`CustomObject id '${id}' not found!`));
      } else resolve(this.customObjects[id]);
    });
  }

  render(config) {
    this.console.log(`render(${config})`);
    $("a.nav-link:first-child").trigger(`click`);
  }

  getNav() {}

  getHtmlId(str) {
    return $(`*`, str)
      .map(function () {
        if (this.id) return this.id;
      })
      .get();
  }

  genComponent(type, id, schema) {
    let result = ``;
    switch (type) {
      case `input-text`:
        result = `<input type="text" class="" id="${id}">`;
        break;
      default:
        console.warn(`genComponent with 'type': '${type}' not support!!!`);
        break;
    }
    return result;
  }

  generateData(schema, extend = false) {
    this.console.log(`generateData():`, schema);
    let result = {};
    if (schema.type === `object`) {
      this.console.log(`ui.schema:`, schema);
      const schemaProperties = schema.properties || schema.patternProperties;
      Object.keys(schemaProperties).forEach((i) => {
        result[i] = this.generateData(schemaProperties[i], extend);
        if (schema.required.includes(i) && extend) result[i].required = true;
      });
      // for(let i in schema.properties) {
      // }
    } else if (schema.type === `array`) {
      result = [];
    } else {
      const param = schema;
      const value = param.const
        ? param.const
        : param.default
        ? param.default
        : param.enum && param.enum.length > 0
        ? param.enum[0]
        : param.type === `string`
        ? ``
        : param.type === `number`
        ? param.min
          ? param.min
          : 0
        : param.type === `boolean`
        ? false
        : undefined;
      if (extend) {
        result = JSON.parse(JSON.stringify(schema));
        result.value = value;
      } else result = value;
    }
    return result;
  }

  generateVueData(schema) {
    return this.generateData(schema, true);
  }

  shortJsonElement(schema, elem) {
    this.console.log(`PageSysport: shortJsonElement(${elem}):`, schema);
    if (schema[elem]) {
      this.console.log(`founded:`, elem, schema[elem]);
      return schema[elem];
    }
    if (Array.isArray(schema) || typeof schema === `object`) {
      let result = null;
      Object.keys(schema).forEach((i) => {
        this.console.log(`recurse[${i}]:`, schema[i]);
        const res = this.shortJsonElement(schema[i], elem);
        if (res) {
          result = res;
        }
      });
      this.console.log(`founded:`, result);
      return result;
    }
    this.console.log(`founded:`, null);
    return null;
  }
}
