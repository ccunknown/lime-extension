export default class PageEngines {
  constructor(extension) {
    this.extension = extension;
    this.console = this.extension.console;
  }

  init(config) {
    this.console.trace(`init()`);
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  initVue() {
    this.console.trace(`initVue()`);
    return new Promise(async (resolve, reject) => {
      let id = this.ui.said(`content.sysport.section`);
      this.console.log(`id : ${id}`);
      let config = await this.getConfig();
      let schema = await this.getSchema();
      let portlist = await this.getPortList();

      this.vue = {};
      let vue = new Vue({
        "el": `#${id}`,
        "data": {
          "engines": {
            /** Resource **/
            "resource": {
              "config": config,
              "schema": schema,
              "portList": portlist,
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
            "function": {
              "add": () => {},
              "edit": () => {},
              "remove": () => {},
              "updatePortList": () => {},
              "isAvailable": () => {},
              "shortSchemaCall": () => {}
            }
          }
        },
        "methods": {}
      });
      this.vue = vue.sysport;

      //  Setup vue function.
      this.vue.function = {
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
        "isAvailable": (port) => {
          console.log(`sysport.isAvailable()`);
          return !this.vue.resource.config.list.find((elem) => elem.path == port.path);
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

  renderNav() {
    this.console.trace(`renderNav()`);
  }

  render() {
    this.console.trace(`renderPage()`);
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

  renderSlider() {
    this.console.log(`renderSlider()`);
    return new Promise(async () => {
      resolve();
    });
  }

  getConfig() {
    return new Promise((resolve, reject) => {
      this.api.getConfig()
      .then((config) => resolve(config[`service-config`][`engines-service`]));
    });
  }

  getSchema() {
    return new Promise((resolve, reject) => {
      this.api.getSchema()
      .then((schema) => resolve(schema.properties[`service-config`].properties[`engines-service`]));
    });
  }
}