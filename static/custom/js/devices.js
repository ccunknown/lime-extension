export default class PageDevices {
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
      let id = this.ui.said(`content.devices.section`);
      this.console.log(`id : ${id}`);
      let schema = await this.getSchema();

      this.vue = new Vue({
        "el": `#${id}`,
        "data": {
          /** Resource **/
          "resource": {
            "config": {"directory": null, "list": []},
            "schema": schema,
            "deviceTemplate": [],
            "deviceConfigSchema": {},
            "flags": {
              "deviceConfig": false
            }
          },
          /** UI **/
          "ui": {
            "slider": {
              "hide": true,
              "ready": false,
              "edit": true,
              "form": this.ui.generateData(this.ui.shortJsonElement(schema, `items`)),
              "formTemplate": {},
            },
            "base": {
              "ready": false
            },
            "type": ""
          },
          /** Function **/
          "fn": {
            "add": () => {},
            "edit": () => {},
            "remove": () => {},
            "save": () => {},
            "renderBase": () => {},
            "renderSlider": () => {},
            "onDeviceTemplateChange": () => {},
            "onDeviceConfigChange": () => {}
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
          return new Promise(async (resolve, reject) => {
            this.vue.ui.slider.ready = false;
            let tags = this.vue.fn.getTag();
            let result = JSON.parse(JSON.stringify(this.vue.ui.slider.form));
            result.meta.tags = tags;
            this.console.log(`save data: ${JSON.stringify(result, null, 2)}`);
            await this.upload(result);
            this.render();
          });
        },
        "renderBase": () => {
          this.render();
        },
        "renderSlider": () => {
          this.render(false);
        },
        "onDeviceTemplateChange": async (event) => {
          let val = event.target.value;
          this.vue.resource.deviceConfigSchema = await this.getDeviceConfigSchema(val);
          let config = this.ui.generateData(this.vue.resource.deviceConfigSchema);
          for(let i in config) {
            if(i != `devices`)
              this.vue.ui.slider.form.config[i] = config[i];
          }
          this.vue.resource.flags.deviceConfig = true;
        },
        "onDeviceConfigChange": async (event) => {
          console.log(event);
          let params = this.vue.ui.slider.form.config;
          this.vue.resource.deviceConfigSchema = await this.getDeviceConfigSchema(params);
          this.vue.ui.slider.formTemplate.config = this.ui.generateVueData(this.vue.resource.deviceConfigSchema.config);
          // this.vue.ui.slider.formTemplate.properties = this.ui.generateVueData(this.ui.shortJsonElement(schema, `^.+$`));
          // this.vue.ui.slider.formTemplate.config.device.enum = this.vue.resource.deviceTemplate.map((elem) => elem.name);
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
    this.console.trace(`PageDevices: renderNav()`);
  }

  renderBase() {
    this.console.log(`PageDevices: renderBase()`);
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
    this.console.log(`PageDevices: renderSlider() >> `);
    return new Promise(async (resolve, reject) => {
      this.vue.ui.slider.ready = false;
      this.vue.ui.slider.hide = false;

      //this.console.log(`ui slider : ${JSON.stringify(this.vue.ui.slider, null, 2)}`);
      await this.renderForm(name);

      this.vue.ui.slider.ready = true;
      resolve();
    });
  }

  renderForm(name) {
    this.console.log(`PageDevices: renderVueAddForm() >> `);
    return new Promise(async (resolve, reject) => {
      this.vue.resource.deviceTemplate = await this.getDeviceTemplate();
      if(name) {
        this.vue.ui.slider.edit = false;
        Promise.all([
          this.getConfig(),
          this.getScript(name)
        ])
        .then((promArr) => {
          this.vue.resource.config = promArr[0];
          let script = promArr[1];
          let tags = (script.meta && script.meta.tags) ? script.meta.tags : [];
          //script.tag = [];

          this.vue.ui.slider.form = script;
          this.vue.fn.clearTag();
          tags.forEach((tag) => this.vue.fn.addTag(tag));

          resolve();
        });
      }
      else {
        // Setup Flags.
        this.vue.resource.flags.deviceConfig = false;
        //
        let schema = this.ui.shortJsonElement(this.vue.resource.schema, `items`);
        this.vue.ui.slider.form = this.ui.generateData(schema);
        this.vue.ui.slider.formTemplate = this.ui.generateVueData(schema);
        this.vue.ui.slider.formTemplate.properties = this.ui.generateVueData(this.ui.shortJsonElement(schema, `^.+$`));
        this.vue.ui.slider.formTemplate.config.device.enum = this.vue.resource.deviceTemplate.map((elem) => elem.name);
        resolve();
      }
    });
  }

  getConfig() {
    this.console.log(`getConfig()`);
    return new Promise((resolve, reject) => {
      this.api.getConfig()
      .then((config) => resolve(config[`service-config`][`devices-service`]));
    });
  }

  getSchema() {
    this.console.log(`getSchema()`);
    return new Promise((resolve, reject) => {
      this.api.getSchema()
      .then((schema) => resolve(schema.properties[`service-config`].properties[`devices-service`]));
    });
  }

  getDeviceTemplate(name) {
    this.console.log(`getDeviceTemplate()`);
    return new Promise(async (resolve, reject) => {
      let template = await this.api.restCall(`get`, `/api/service/deviceTemplate${(name) ? `/${name}` : ``}`);
      resolve(template);
    });
  }

  getDeviceConfigSchema(params) {
    this.console.log(`getDeviceConfigSchema()`);
    return new Promise(async (resolve, reject) => {
      let paramStr = ``;
      for(let i in params)
        paramStr = `${paramStr}${(paramStr != ``) ? `&` : ``}${i}=${params[i]}`;
      let template = await this.api.restCall(`get`, `/api/service/deviceConfigSchema${(params.device) ? `/${params.device}` : ``}?${paramStr}`);
      resolve(template);
    });
  }
}
