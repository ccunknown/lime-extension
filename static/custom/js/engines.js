export default class PageEngines {
  constructor(extension) {
    this.extension = extension;
    this.console = this.extension.console;
    this.api = this.extension.api;
    this.ui = this.extension.ui;
  }

  init(config) {
    this.console.trace(`init()`);
    return new Promise(async (resolve, reject) => {
      await this.initVue();
      resolve();
    });
  }

  initVue() {
    this.console.trace(`initVue()`);
    return new Promise(async (resolve, reject) => {
      let id = this.ui.said(`content.engines.section`);
      this.console.log(`id : ${id}`);
      //let config = await this.getConfig();
      let schema = await this.getSchema();
      //let engines = await this.getEngine();
      //let templates = await this.getEngineTemplate();

      this.vue = new Vue({
        "el": `#${id}`,
        "data": {
          /** Resource **/
          "resource": {
            "config": {"directory": null, "list": []},
            "schema": schema,
            "engines": [],
            "templates": [],
            "ports": {"list": []}
          },
          /** UI **/
          "ui": {
            "slider": {
              "hide": true,
              "ready": false,
              "form": this.ui.generateData(this.ui.shortJsonElement(schema, `items`)),
              "formTemplate": this.ui.generateVueData(this.ui.shortJsonElement(schema, `items`))
            },
            "base": {
              "ready": false
            }
          },
          /** Function **/
          "fn": {
            "add": () => {},
            "edit": () => {},
            "remove": () => {},
            "save": () => {},
            "renderBase": () => {},
            "renderSlider": () => {}
          }
        },
        "methods": {}
      });

      //  Setup vue function.
      this.vue.fn = {
        "add": async () => {
          this.renderSlider();
        },
        "edit": (name) => {
          this.console.log(`edit(${name})`);
          this.renderSlider(name);
        },
        "remove": (name) => {
          this.console.log(`delete(${name})`);
        },
        "save": () => {
          this.console.log(`save()`);
          this.console.log(`save data: ${JSON.stringify(this.vue.ui.slider.form, null, 2)}`);
        },
        "renderBase": () => {
          this.render();
        },
        "renderSlider": () => {
          this.render(false);
        }
      };

      this.console.log(this.vue);

      resolve();
    });
  }

  render(base = true) {
    this.console.log(`render()`);
    return new Promise(async (resolve, reject) => {
      this.console.trace(`render()`);
      let result = (base) ? await this.renderBase() : await this.renderSlider();
      resolve(result);
    });
  }

  renderNav() {
    this.console.trace(`renderNav()`);
  }

  renderBase() {
    this.console.log(`renderBase()`);
    return new Promise(async (resolve, reject) => {
      this.vue.ui.base.ready = false;
      this.vue.ui.slider.hide = true;

      let config = await this.getConfig();
      this.vue.resource.config = config;
      let engines = await this.getEngine();
      this.vue.resource.engines = engines;

      this.vue.ui.base.ready = true;
      resolve();
    });
  }

  renderSlider(name) {
    this.console.log(`renderSlider()`);
    return new Promise(async (resolve, reject) => {
      this.vue.ui.slider.ready = false;
      this.vue.ui.slider.hide = false;

      this.console.log(`ui slider : ${JSON.stringify(this.vue.ui.slider, null, 2)}`);
      await this.renderForm(name);

      this.vue.ui.slider.ready = true;
      resolve();
    });
  }

  renderForm(name) {
    this.console.log(`PageEngines: renderVueAddForm() >> `);
    return new Promise((resolve, reject) => {
      Promise.all([
        this.getConfig(),
        this.getPortConfig(),
        this.getEngineTemplate()
      ])
      .then((promArr) => {
        this.vue.resource.config = promArr[0];
        this.vue.resource.ports = promArr[1].list;
        this.vue.resource.templates = promArr[2];

        //this.console.log(`add before short : ${JSON.stringify(schema, null, 2)}`);

        let schema = this.ui.shortJsonElement(this.vue.resource.schema, `items`);

        if(name)
          this.vue.ui.slider.form = this.vue.resource.config.list.find((elem) => elem.name == name);
        else
          this.vue.ui.slider.form = this.ui.generateData(schema);

        this.vue.ui.slider.formTemplate = this.ui.generateVueData(schema);
        this.vue.ui.slider.formTemplate.engine.enum = this.vue.resource.templates;
        this.vue.ui.slider.formTemplate.port.enum = this.vue.resource.ports;

        this.console.log(`form : ${JSON.stringify(this.vue.ui.slider.form, null, 2)}`);
        this.console.log(`form template : ${JSON.stringify(this.vue.ui.slider.formTemplate, null, 2)}`);

        resolve();
      });
    });
  }

  getConfig() {
    this.console.log(`getConfig()`);
    return new Promise((resolve, reject) => {
      this.api.getConfig()
      .then((config) => resolve(config[`service-config`][`engines-service`]));
    });
  }

  getPortConfig() {
    this.console.log(`getPortConfig()`);
    return new Promise((resolve, reject) => {
      this.api.getConfig()
      .then((config) => resolve(config[`service-config`][`sysport-service`]));
    });
  }

  getSchema() {
    this.console.log(`getSchema()`);
    return new Promise((resolve, reject) => {
      this.api.getSchema()
      .then((schema) => resolve(schema.properties[`service-config`].properties[`engines-service`]));
    });
  }

  getEngine(name) {
    this.console.log(`getEngine(${(name) ? name : ``})`);
    return new Promise((resolve, reject) => {
      let engines = this.api.restCall(`get`, `/api/service/engines${(name) ? `/${name}` : ``}`);
      resolve(engines);
    });
  }

  getEngineTemplate(name) {
    this.console.log(`getEngineTemplate(${(name) ? name : ``})`);
    return new Promise((resolve, reject) => {
      let templates = this.api.restCall(`get`, `/api/service/engineTemplate${(name) ? `/${name}` : ``}`);
      resolve(templates);
    });
  }
}