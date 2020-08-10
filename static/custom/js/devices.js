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
                "properties": []
              }
            },
            "base": {
              "ready": false
            },
            "type": ""
          },
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
        "remove": (name) => {
          this.console.log(`delete(${name})`);
        },
        "save": () => {
          this.console.log(`save()`);
          return new Promise(async (resolve, reject) => {
            this.vue.ui.slider.ready = false;
            this.vue.ui.base.ready = false;
            //  Build final.
            this.vue.ui.slider.final.device = this.vue.ui.slider.form.device;
            await this.api.restCall(`put`, `/api/service/devices`, this.vue.ui.slider.final);
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
          this.renewDeviceConfigSchema();
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
        "defaultValue": (param) => {
          return (param.const) ? param.const :
          (param.default) ? param.default :
          (param.enum && param.enum.length > 0) ? param.enum[0] :
          (param.type == `string`) ? `` :
          (param.type == `number`) ? (param.min) ? param.min : 0 :
          (param.type == `boolean`) ? false : undefined;
        },
        "addProperty": () => {
          this.console.log(`addProperty()`);
          this.console.log(`properties: ${JSON.stringify(this.vue.ui.slider.form.properties, null ,2)}`);
          //this.vue.ui.slider.final.properties = [`hello`];
          this.vue.ui.slider.final.properties.push(JSON.parse(JSON.stringify(this.vue.ui.slider.form.properties)));
          this.console.log(`final: ${JSON.stringify(this.vue.ui.slider.final, null ,2)}`);
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
    this.console.log(`PageDevices: renderForm() >> `);
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
      // else {
      //   let schema = this.ui.shortJsonElement(this.vue.resource.schema, `items`);
      //   this.vue.ui.slider.form = this.ui.generateData(schema);
      //   this.vue.ui.slider.formTemplate = this.ui.generateVueData(schema);
      //   this.vue.ui.slider.formTemplate.properties = this.ui.generateVueData(this.ui.shortJsonElement(schema, `^.+$`));
      //   this.vue.ui.slider.formTemplate.properties.config = {};
      //   this.vue.ui.slider.formTemplate.config.device.enum = this.vue.resource.deviceTemplate.map((elem) => elem.name);
      //   resolve();
      // }
      else {
        let schema = await this.getDeviceConfigSchema();
        //  Embed Json Position.
        schema = this.embedPosition(schema);
        this.vue.resource.deviceConfigSchema = schema;
        this.vue.ui.slider.form = await this.ui.generateData(schema);
        this.vue.ui.slider.form.properties = {};
        await this.renewDeviceConfigSchema();
        resolve();
      }

      // //  Render Device ID.
      // let index = 1;
      // let id = ``;
      // this.console.log(`ui ext: ${JSON.stringify(this.ui.ext, null, 2)}`);
      // while(true) {
      //   id = `${this.ui.ext.short}-device-${index}`;
      //   let device = this.vue.resource.config.list.find((elem) => elem.id == id);
      //   if(!device) {
      //     this.vue.ui.slider.form.id = id;
      //     break;
      //   }
      // }
    });
  }

  renewDeviceConfigSchema() {
    this.console.log(`renewDeviceConfigSchema()`);
    return new Promise(async (resolve, reject) => {
      let schema = await this.getDeviceConfigSchema(this.vue.ui.slider.form);
      //  Embed Json Position.
      schema = this.embedPosition(schema);
      this.vue.resource.deviceConfigSchema = schema;
      if(!this.vue.ui.slider.form.device)
        this.vue.ui.slider.form.device = {};
      if(!this.vue.ui.slider.form.properties)
        this.vue.ui.slider.form.properties = {};

      if(!this.vue.ui.slider.final.device)
        this.vue.ui.slider.final.device = {};
      if(!this.vue.ui.slider.final.properties)
        this.vue.ui.slider.final.properties = [];
      //let data = await this.ui.generateData(schema);
      //this.vue.ui.slider.form = 
      resolve();
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
      // let paramStr = ``;
      // for(let i in params)
      //   paramStr = `${paramStr}${(paramStr != ``) ? `&` : ``}${i}=${params[i]}`;
      let paramStr = this.generateParameters(params);
      this.console.log(`params: ${params}`);
      this.console.log(`paramStr: ${paramStr}`);
      let template = await this.api.restCall(`get`, `/api/service/deviceConfigSchema${(paramStr && paramStr.length > 0) ? `?${paramStr}` : ``}`);
      resolve(template);
    });
  }

  getPreRequire(schema) {
    let list = [];
    if(!schema)
      return [];
    else if(schema.prerequire)
      list = schema.prerequire;
    else if(schema.items) {
      list = this.getPreRequire(schema.items);
    }
    else if(schema.type == `object`) {
      if(schema.properties)
        for(let i in schema.properties)
          list = [...list, ...this.getPreRequire(schema.properties[i])];
      if(schema.patternProperties)
        for(let i in schema.patternProperties)
          list = [...list, ...this.getPreRequire(schema.patternProperties[i])];
    }
    return list;
  }

  embedPosition(schema, prefix) {
    if(schema.properties) {
      for(let i in schema.properties)
        schema.properties[i] = this.embedPosition(schema.properties[i], `${(prefix) ? `${prefix}.` : ``}${i}`);
      return schema;
    }
    else if(schema.patternProperties) {
      for(let i in schema.properties)
        schema.properties[i] = this.embedPosition(schema.patternProperties[i], `${(prefix) ? `${prefix}.` : ``}${i}`);
      return schema;
    }
    else if(schema.items) {
      schema.items = this.embedPosition(schema.items, prefix);
      return schema;
    }
    else {
      schema.position = `${prefix}`;
      return schema;
    }
  }

  generateParameters(params) {
    console.log(`params: ${JSON.stringify(params, null, 2)}`);
    let result = ``;
    for(let i in params) {
      console.log(`paramsType[${i}]: ${typeof params[i]}`);
      if(typeof params[i] == `object`) {
        if(JSON.stringify(params[i]) != `{}`) {
          let tmp = this.generateParameters(params[i]);
          tmp = tmp.split(`&`).map((elem) => `${i}.${elem}`).join(`&`);
          tmp = tmp.replace(/^&/, ``);
          result = `${result}&${tmp}`;
        }
      }
      else {
        result = `${result}&${i}=${params[i]}`;
      }
    }
    result = result.replace(/^&/, ``);
    console.log(`result: ${result}`);
    return result;
  }
}
