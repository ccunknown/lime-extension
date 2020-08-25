export default class PageSysport {
  constructor(extension) {
    this.extension = extension;
    this.console = this.extension.console;
    this.api = this.extension.api;
    this.ui = this.extension.ui;
  }

  init(config) {
    this.console.trace(`init()`);
    return new Promise(async (resolve, reject) => {
      //this.initFunction();
      await this.initVue();
      resolve();
    });
  }

  initVue() {
    this.console.trace(`initVue()`);
    return new Promise(async (resolve, reject) => {
      let id = this.ui.said(`content.sysport.section`);
      let schema = await this.getSchema();

      this.vue = new Vue({
        "el": `#${id}`,
        "data": {
          /** Resource **/
          "resource": {
            "config": {"list": []},
            "schema": schema,
            "portList": [],
          },
          /** UI **/
          "ui": {
            "slider": {
              "hide": true,
              "ready": false,
              "form": this.ui.generateData(this.ui.shortJsonElement(schema, `.+`)),
              "formTemplate": this.ui.generateVueData(this.ui.shortJsonElement(schema, `.+`))
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
            "updatePortList": () => {},
            "shortSchemaCall": () => {}
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
        },
        "updatePortList": async () => {
          console.log(`sysport.updatePortList()`);
          this.vue.resource.portList = await this.getPortList();
        },
        "shortSchemaCall": (key) => {
          let res = this.ui.shortJsonElement(this.vue.resource.schema, key);
          console.log(`short json : ${JSON.stringify(res, null, 2)}`);
          return res;
        }
      };

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

      this.vue.ui.base.ready = true;
      resolve();
    });
  }

  renderSlider(name) {
    this.console.log(`renderSlider()`);
    return new Promise(async (resolve, reject) => {
      this.vue.ui.slider.ready = false;
      this.vue.ui.slider.hide = false;
      //this.console.log(`ui slider : ${JSON.stringify(this.vue.ui.slider, null, 2)}`);
      //this.ui.saidObj(`content.sysport.slider`).removeClass(`hide`);
      //(name) ? await this.renderEditForm(name) : await this.renderAddForm();
      await this.renderForm(name);
      this.vue.ui.slider.ready = true;
      resolve();
    });
  }

  renderForm(name) {
    this.console.log(`PageSysport: renderVueAddForm() >> `);
    return new Promise((resolve, reject) => {
      Promise.all([
        this.getConfig(),
        this.getPortList()
      ])
      .then((promArr) => {
        this.vue.resource.config = promArr[0];
        this.vue.resource.portlist = promArr[1];

        //this.console.log(`add before short : ${JSON.stringify(schema, null, 2)}`);

        let schema = this.ui.shortJsonElement(this.vue.resource.schema, `.+`);

        if(name)
          this.vue.ui.slider.form = this.vue.resource.config.list[name];
        else
          this.vue.ui.slider.form = this.ui.generateData(schema);

        this.vue.ui.slider.formTemplate = this.ui.generateVueData(schema);
        this.vue.ui.slider.formTemplate.path.enum = this.vue.resource.portlist.map((elem) => {
          let disabled = false;
          for(let i in this.vue.resource.config.list)
            if(this.vue.resource.config.list[i].path == elem.path && this.vue.resource.config.list[i] != name)
              disabled = true;
          return {
            "title": elem.path,
            "value": elem.path,
            "disabled": disabled
          }
        });

        //this.console.log(`form : ${JSON.stringify(this.vue.ui.slider.form, null, 2)}`);
        //this.console.log(`form template : ${JSON.stringify(this.vue.ui.slider.formTemplate, null, 2)}`);

        resolve();
      });
    });
  }

  getConfig() {
    this.console.log(`getConfig()`);
    return new Promise((resolve, reject) => {
      this.api.getConfig()
      .then((config) => resolve(config[`service-config`][`sysport-service`]));
    });
  }

  getSchema() {
    this.console.log(`getSchema()`);
    return new Promise((resolve, reject) => {
      this.api.getSchema()
      .then((schema) => resolve(schema.properties[`service-config`].properties[`sysport-service`]));
    });
  }

  getPortList() {
    this.console.log(`getPortList()`);
    return new Promise(async (resolve, reject) => {
      let list = await this.api.restCall(`get`, `/api/service/sysport-service/system-port`);
      let data = [];
      for(let i in list) {
        data.push({
          path: list[i].path,
          pnpid: (list[i].pnpId) ? list[i].pnpId : `null`,
          manufacturer: (list[i].manufacturer) ? list[i].manufacturer : `null`,
          index: i
        });
      }
      resolve(data);
    });
  }
}