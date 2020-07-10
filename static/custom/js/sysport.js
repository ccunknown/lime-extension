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
      this.console.log(`id : ${id}`);
      let config = await this.getConfig();
      let schema = await this.getSchema();
      let portlist = await this.getPortList();

      //  initial `path` with `portlist`
      schema.properties.list.items.properties.path.enum = portlist.map((elem) => elem.path);
      schema.properties.list.items.properties.path.default = (portlist.length) ? portlist[0].path : ``;

      this.vue = {};
      let vue = new Vue({
        "el": `#${id}`,
        "data": {
          "sysport": {
            /** Config & Schema & PortList. **/
            "config": config,
            "schema": schema,
            "portList": portlist,
            /** Slider configuration. **/
            "slider": {
              "ready": false,
              "form": this.generateFromSchema(schema.properties.list.items)
            },
            /** Base configuration. **/
            "base": {
              "ready": false
            },
            /** Function **/
            "function": {
              "add": () => {
                console.log(`sysport.add()`);
                this.vue.slider.form = this.generateFromSchema(schema.properties.list.items);
                this.renderSlider();
              },
              "edit": (name) => {
                console.log(`sysport.edit()`);

              },
              "updatePortList": async () => {
                console.log(`sysport.updatePortList()`);
                this.vue.portList = await this.getPortList();
              },
              "isAvailable": (port) => {}
            }
          }
        },
        methods: {}
      });
      this.vue = vue.sysport;

      this.vue.function.isAvailable = (port) => {
        console.log(`sysport.isAvailable()`);
        return !this.vue.config.list.find((elem) => elem.path == port.path);
      };

      this.console.log(`config : ${JSON.stringify(this.vue.config, null, 2)}`);
      this.console.log(`form : ${JSON.stringify(this.vue.slider.form, null, 2)}`);

      resolve();
    });
  }

  render() {
    return new Promise(async (resolve, reject) => {
      this.console.trace(`render()`);
      this.ui.saidObj(`content.sysport.slider`).addClass(`hide`);
      //this.showLoading();
      //let result = await this.renderPage();
      //this.showContent();
      let result = await this.renderBase();
      resolve(result);
    });
  }

  renderNav() {
    this.console.trace(`renderNav()`);
  }

  renderBase() {
    this.console.log(`renderBase()`);
    return new Promise(async (resolve, reject) => {
      this.vue.base.ready = false;
      //this.showLoading();

      let config = await this.getConfig();
      this.vue.config = config;

      //this.showContent();
      this.vue.base.ready = true;
      resolve();
    });
  }

  renderSlider() {
    this.console.log(`renderSlider()`);
    return new Promise(async (resolve, reject) => {
      this.showLoading();
      this.ui.saidObj(`content.sysport.slider`).removeClass(`hide`);


      // let portlist = await this.getPortList();
      // console.log(portlist);

      // this.ui.saidObj(`content.sysport.slider.form.port`).empty();
      // portlist.forEach((port) => {
      //   let option = new Option(`${port.path}`, `${port.path}`);
      //   this.ui.saidObj(`content.sysport.slider.form.port`).append(option);
      // });
      
      this.showContent();
      resolve();
    });
  }

  getConfig() {
    return new Promise((resolve, reject) => {
      this.api.getConfig()
      .then((config) => resolve(config[`service-config`][`sysport-service`]));
    });
  }

  getSchema() {
    return new Promise((resolve, reject) => {
      this.api.getSchema()
      .then((schema) => resolve(schema.properties[`service-config`].properties[`sysport-service`]));
    });
  }

  getPortList() {
    return new Promise(async (resolve, reject) => {
      let list = await this.api.restCall(`get`, `/api/system/portlist`);
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

  showLoading() {
    this.console.log(`showLoading()`);
    //  Slider
    this.ui.saidObj(`content.sysport.slider.form`).addClass(`hide`);
    this.ui.saidObj(`content.sysport.slider.loading`).removeClass(`hide`);
    //  Base
    this.ui.saidObj(`content.sysport.base.listpanel`).addClass(`hide`);
    this.ui.saidObj(`content.sysport.base.loading`).removeClass(`hide`);
  }

  showContent() {
    this.console.log(`showContent()`);
    //  Slider
    this.ui.saidObj(`content.sysport.slider.loading`).addClass(`hide`);
    this.ui.saidObj(`content.sysport.slider.form`).removeClass(`hide`);
    //  Base
    this.ui.saidObj(`content.sysport.base.loading`).addClass(`hide`);
    this.ui.saidObj(`content.sysport.base.listpanel`).removeClass(`hide`);
  }

  isAvailable(port) {
    return new Promise(async (resolve, reject) => {
      let config = await this.getConfig();
      let result = !config.list.find((elem) => port.path == elem.path);
      console.log(`result : ${result}`);
      return result;
    });
  }

  generateFromSchema(schema) {
    let result;
    if(Array.isArray(schema.type)) {
      result = (schema.default) ? schema.default : 
      (schema.type[0] == `object`) ? {} :
      (schema.type[0] == `array`) ? [] :
      (schema.type[0] == `string`) ? `` :
      (schema.type[0] == `number`) ? 0 :
      (schema.type[0] == `boolean`) ? false : undefined;
    }
    else if(schema.type == `object`) {
      result = {};
      if(schema.properties)
        for(let i in schema.properties)
          result[i] = this.generateFromSchema(schema.properties[i]);
    }
    else if(schema.type == `array`) {
      result = [];
    }
    else if(schema.type == `number`) {
      result = (schema.default) ? schema.default : 0;
    }
    else if(schema.type == `boolean`) {
      result = (schema.default) ? schema.default : false;
    }
    else if(schema.type == `string`) {
      result = (schema.default) ? schema.default : ``;
    }
    return result
  }
}