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
      await this.initVueComponent();
      await this.initVue();
      resolve();
    });
  }

  initVueComponent() {
    return new Promise(async (resolve, reject) => {
      //  Load resource.
      let loader = this.ui.extension.loader;
      let script = await loader.getObject(`vue-component-json-schema-script`);
      console.log(loader.objects);
      script.template = await loader.getObject(`vue-component-json-schema-template`);

      Vue.component(`json-schema-form`, script);
      resolve();
    });
  }

  initVue() {
    this.console.trace(`initVue()`);
    return new Promise(async (resolve, reject) => {
      let id = this.ui.said(`content.devices.section`);
      this.console.log(`id : ${id}`);
      //let schema = await this.getSchema();

      this.vue = new Vue({
        "el": `#${id}`,
        "data": {
          /** Loader **/
          "loader": this.extension.schema,
          /** Resource **/
          "resource": {
            //"schema": schema,
            //"deviceTemplate": [],
            "deviceConfigSchema": {},
            "config": {"directory": null, "list": []}
          },
          /** UI **/
          "ui": {
            "slider": {
              "hide": true,
              "ready": false,
              "edit": true,
              "form": {},//this.ui.generateData(this.ui.shortJsonElement(schema, `items`)),
              "formTemplate": {},
              "final": {
                "device": {},
                "properties": {}
              }
            },
            "base": {
              "ready": false
            },
            "type": ""
          },
          "deviceForm": {},
          "propertyForm": {},
          /** Function **/
          "fn": {
            // "add": () => {},
            // "edit": () => {},
            // "remove": () => {},
            // "save": () => {},
            // "renderBase": () => {},
            // "renderSlider": () => {},
            // "onDeviceTemplateChange": () => {},
            // "onDeviceConfigChange": () => {},
            // "typeIdentify": () => {},
            // "isDisabled": () => {}
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
        "remove": (id) => {
          this.console.log(`delete(${id})`);
          return new Promise(async (resolve, reject) => {
            let res = await this.deleteDevice(id);
            this.render();
            resolve();
          });
        },
        "save": () => {
          this.console.log(`save()`);
          return new Promise(async (resolve, reject) => {
            this.vue.ui.slider.ready = false;
            this.vue.ui.base.ready = false;
            //  Build final.
            this.vue.ui.slider.final.device = JSON.parse(JSON.stringify(this.vue.deviceForm));
            this.vue.ui.slider.final.device.properties = JSON.parse(JSON.stringify(this.vue.ui.slider.final.properties));
            //await this.api.restCall(`put`, `/api/service/devices`, this.vue.ui.slider.final);
            await this.api.restCall(`put`, `/api/service/devices`, this.vue.ui.slider.final.device);
            await this.render();
            resolve();
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
        },
        "onDeviceConfigChange": async (event, position) => {
          console.log(event);
          console.log(position);
          let preRequireList = this.getPreRequire(this.vue.resource.deviceConfigSchema);
          console.log(`preRequireList: ${preRequireList}`);
          if(position == `template` || preRequireList.includes(position))
            this.renewDeviceConfigSchema();
        },
        "onAlternateChange": () => {
          console.log(`onAlternateChange() >> `);
          this.onAlternateChange();
        },
        "typeIdentify": (param) => {
          let type = undefined;
          if(param.attrs && param.attrs.type)
            type = param.attrs.type;
          else if(param.enum)
            type = `select`;
          else if(param.type == `string`)
            type = `text`;
          else if(param.type == `number`)
            type = `number`;
          else if(param.type == `boolean`)
            type = `check`;
          else if(param.type == `object`)
            type = `object`
          //this.console.log(`${param.title} : ${type}`);
          return type;
        },
        "isDisabled": (param) => {
          if(param.const)
            return true;
          // else if(param.prerequire)
          //   return true;
          return false;
        },
        "isEmpty": (json) => {
          return (JSON.stringify(json) == `{}`) ? true : false;
        },
        "defaultValue": (param) => {
          return (param.const) ? param.const :
          (param.default) ? param.default :
          (param.enum && param.enum.length > 0) ? param.enum[0] :
          (param.type == `string`) ? `` :
          (param.type == `number`) ? (param.min) ? param.min : 0 :
          (param.type == `boolean`) ? false : undefined;
        },
        "hasPropertyConfigSchema": () => {
          if(this.vue.resource.deviceConfigSchema &&
            this.vue.resource.deviceConfigSchema.properties &&
            this.vue.resource.deviceConfigSchema.properties.properties &&
            JSON.stringify(this.vue.resource.deviceConfigSchema.properties.properties) != `{}`)
            return true;
          else
            return false;
        },
        "addProperty": () => {
          this.console.log(`addProperty()`);
          this.console.log(`properties: ${JSON.stringify(this.vue.propertyForm, null ,2)}`);

          let params = JSON.parse(JSON.stringify(this.vue.deviceForm));
          params.properties = JSON.parse(JSON.stringify(this.vue.propertyForm));
          this.generatePropertyId(params)
          .then((id) => {
            let finalProp = JSON.parse(JSON.stringify(this.vue.ui.slider.final.properties));
            finalProp[id] = params.properties;
            this.vue.ui.slider.final.properties = finalProp;
          });

          //this.vue.ui.slider.final.properties.push(JSON.parse(JSON.stringify(this.vue.propertyForm)));
        },
        "objectToText": (obj) => {
          let result = ``;
          for(let i in obj) {
            if(typeof obj[i] != `object`)
              result = `${(result == ``) ? `` : `${result}/`}${obj[i]}`;
          }
          return result;
        },
        "removeProperty": (prop) => {
          this.vue.ui.slider.final.properties = this.vue.ui.slider.final.properties.filter((elem) => JSON.stringify(elem) != JSON.stringify(prop));
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
    this.console.log(`PageDevices: renderForm(${(name) ? `${name}` : ``}) >> `);
    return new Promise(async (resolve, reject) => {
      //this.vue.resource.deviceTemplate = await this.getDeviceTemplate();
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
        //  Pre-set form (Cleaning).
        this.vue.ui.slider.final.device = {};
        this.vue.ui.slider.final.properties = {};

        // this.vue.ui.slider.form = {};
        // await this.onAlternateChange();
        // await this.onAlternateChange();
        // resolve();
        this.vue.deviceForm = {};
        this.vue.propertyForm = {};
        await this.onAlternateChange();
        //await this.onAlternateChange();
        resolve();
      }
    });
  }

  onAlternateChange() {
    this.console.log(`onAlternateChange() >> `);
    return new Promise(async (resolve, reject) => {
      let config = JSON.parse(JSON.stringify(this.vue.deviceForm));
      config.properties = JSON.parse(JSON.stringify(this.vue.propertyForm));

      let schema = await this.generateDeviceConfigSchema(config);
      this.vue.resource.deviceConfigSchema = JSON.parse(JSON.stringify(schema));

      let deviceGen = await this.ui.generateData(schema);
      let vueDevTemp = JSON.parse(JSON.stringify(this.vue.deviceForm));
      let deviceCopy = this.jsonCopy(vueDevTemp, deviceGen);
      this.vue.deviceForm = vueDevTemp;

      let propertyCopy = false;
      if(schema.properties && schema.properties.properties && schema.properties.properties.patternProperties) {
        this.console.log(schema.properties.properties.patternProperties);
        let propertyGen = await this.ui.generateData(schema.properties.properties.patternProperties[`^[^\n]+$`]);
        let vuePropTemp = JSON.parse(JSON.stringify(this.vue.propertyForm));
        propertyCopy = this.jsonCopy(vuePropTemp, propertyGen);
        this.vue.propertyForm = vuePropTemp;
      }

      if(deviceCopy || propertyCopy)
        await this.onAlternateChange();

      resolve();
    });
  }

  generateDeviceConfigSchema(params) {
    this.console.log(`generateDeviceConfigSchema() >> `);
    return new Promise(async (resolve, reject) => {
      params = (params) ? params : {};
      let res = await this.api.restCall(`post`, `/api/service/devices-service/generateConfigSchema`, params);
      resolve(res);
    });
  }

  generatePropertyId(params) {
    this.console.log(`generatePropertyId() >> `);
    return new Promise(async (resolve, reject) => {
      let res = await this.api.restCall(`post`, `/api/service/devices-service/generatePropertyId`, params);
      resolve((res.id) ? res.id : null);
    });
  }

  deleteDevice(id) {
    this.console.log(`deleteDevice(${id}) >> `);
    return new Promise(async (resolve, reject) => {
      let res = await this.api.restCall(`delete`, `/api/service/devices-service/devices/${id}`);
      resolve(res);
    });
  }

  jsonCopy(dst, src) {
    src = JSON.parse(JSON.stringify(src));
    let copy = false;
    for(let i in src) {
      if(!dst.hasOwnProperty(i)) {
        dst[i] = src[i];
        copy = true;
      }
      else if(typeof src[i] == `object`)
        copy = this.jsonCopy(dst[i], src[i]) || copy;
    }
    return copy;
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
}
