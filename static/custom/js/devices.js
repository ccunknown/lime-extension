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
      // await this.initVueComponent();
      await this.initVue();
      resolve();
    });
  }

  // initVueComponent() {
  //   return new Promise(async (resolve, reject) => {
  //     //  Load resource.
  //     let loader = this.ui.extension.loader;
  //     let script = await loader.getObject(`vue-component-json-schema-script`);
  //     console.log(loader.objects);
  //     script.template = await loader.getObject(`vue-component-json-schema-template`);

  //     Vue.component(`json-schema-form`, script);
  //     resolve();
  //   });
  // }

  initVue() {
    this.console.trace(`initVue()`);
    return new Promise(async (resolve, reject) => {
      let id = this.ui.said(`content.devices.section`);
      this.console.log(`id : ${id}`);

      this.vue = new Vue({
        "el": `#${id}`,
        "data": {
          /** Loader **/
          "loader": this.extension.schema,
          /** Resource **/
          "resource": {
            "deviceConfigSchema": {},
            "config": {"directory": null, "list": []}
          },
          /** UI **/
          "ui": {
            "slider": {
              "hide": true,
              "ready": false,
              "edit": true,
              "edit-id": null,
              "form": {},
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
          "fn": {}
        },
        "methods": {}
      });

      //  Setup vue function.
      this.vue.fn = {
        "add": async () => {
          this.vue.ui.slider[`edit-id`] = null;
          this.renderSlider();
        },
        "edit": (id) => {
          this.console.log(`edit(${id})`);
          this.vue.ui.slider[`edit-id`] = id;
          this.renderSlider(id);
        },
        "remove": (id) => {
          this.console.log(`delete(${id})`);
          return new Promise(async (resolve, reject) => {
            this.deleteConfigDevice(id)
            .then(() => this.render())
            .then(() => resolve())
            .catch((err) => reject(err));
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

            let id = this.vue.ui.slider[`edit-id`];
            let config = this.vue.ui.slider.final.device;
            ((id) ? this.editConfigDevice(id, config) : this.addConfigDevice(config))
            .then(() => this.render())
            .then(() => resolve())
            .catch((err) => reject(err));
          });
        },
        "start": (id) => {
          this.console.log(`start(${id})`);
          return new Promise((resolve, reject) => {
            this.startServiceDevice(id)
            .then(() => this.render())
            .then(() => resolve())
            .catch((err) => reject(err));
          });
        },
        "stop": (id) => {
          this.console.log(`stop(${id})`);
          return new Promise((resolve, reject) => {
            this.stopServiceDevice(id)
            .then(() => this.render())
            .then(() => resolve())
            .catch((err) => reject(err));
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
            type = `object`;
          return type;
        },
        "isDisabled": (param) => {
          if(param.const)
            return true;
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
        "addProperty": (id) => {
          this.console.log(`addProperty()`);
          this.console.log(`properties: ${JSON.stringify(this.vue.propertyForm, null ,2)}`);

          let params = JSON.parse(JSON.stringify(this.vue.deviceForm));
          params.properties = JSON.parse(JSON.stringify(this.vue.propertyForm));

          if(id){
            let finalProp = JSON.parse(JSON.stringify(this.vue.ui.slider.final.properties));
            finalProp[id] = params.properties;
            this.vue.ui.slider.final.properties = finalProp;
            return id;
          }
          else {
            return new Promise((resolve, reject) => {
              this.generatePropertyId(params)
              .then((id) => {
                let finalProp = JSON.parse(JSON.stringify(this.vue.ui.slider.final.properties));
                finalProp[id] = params.properties;
                this.vue.ui.slider.final.properties = finalProp;
                return id;
              })
              .then((id) => resolve(id))
              .catch((err) => reject(err));
            });
          }
        },
        "removeProperty": (id) => {
          this.console.log(`removeProperty(${id})`);
          let result = {};
          for(let i in this.vue.ui.slider.final.properties)
            if(i != id)
              result[i] = this.vue.ui.slider.final.properties[i];
          this.vue.ui.slider.final.properties = result;
        },
        "objectToText": (obj) => {
          let result = ``;
          for(let i in obj) {
            if(typeof obj[i] != `object`)
              result = `${(result == ``) ? `` : `${result}/`}${obj[i]}`;
          }
          return result;
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

      // let config = await this.getConfigDevice();
      let config = await this.getServiceDevice();
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

  renderForm(id) {
    this.console.log(`PageDevices: renderForm(${(id) ? `${id}` : ``}) >> `);
    return new Promise(async (resolve, reject) => {
      //this.vue.resource.deviceTemplate = await this.getDeviceTemplate();
      if(id) {
        this.vue.ui.slider.edit = false;
        Promise.all([
          this.getConfigDevice(id)
        ])
        .then((promArr) => {
          let config = promArr[0];
          this.console.log(`config: ${JSON.stringify(config, null, 2)}`);
          //  Pre-set form (Cleaning).
          this.vue.resource.deviceConfigSchema = {};
          this.vue.ui.slider.final.device = {};
          this.vue.ui.slider.final.properties = {};

          this.vue.deviceForm = config;
          // this.vue.propertyForm = config.properties;
          return config;
        })
        .then((config) => this.generateConfigSchema(config))
        .then((schema) => {
          this.vue.resource.deviceConfigSchema = schema;
          return ;
        })
        .then(() => {
          for(let i in this.vue.deviceForm.properties) {
            this.vue.propertyForm = JSON.parse(JSON.stringify(this.vue.deviceForm.properties[i]));
            this.vue.fn.addProperty(i);
          }
          return ;
        })
        .then(() => this.onAlternateChange())
        .then(() => resolve())
        .catch((err) => reject(err));
      }
      else {
        //  Pre-set form (Cleaning).
        this.vue.resource.deviceConfigSchema = {};
        this.vue.ui.slider.final.device = {};
        this.vue.ui.slider.final.properties = {};

        this.vue.deviceForm = {};
        this.vue.propertyForm = {};
        await this.onAlternateChange();

        resolve();
      }
    });
  }

  onAlternateChange() {
    this.console.log(`onAlternateChange() >> `);
    return new Promise(async (resolve, reject) => {
      let config = JSON.parse(JSON.stringify(this.vue.deviceForm));
      config.properties = JSON.parse(JSON.stringify(this.vue.propertyForm));

      let schema = await this.generateConfigSchema(config);
      let oldSchema = JSON.parse(JSON.stringify(this.vue.resource.deviceConfigSchema));
      this.vue.resource.deviceConfigSchema = JSON.parse(JSON.stringify(schema));

      let deviceGen = await this.ui.generateData(schema);
      let vueDevTemp = JSON.parse(JSON.stringify(this.vue.deviceForm));
      // let deviceCopy = this.jsonCopy(vueDevTemp, deviceGen);
      let copySchema = this.jsonDiv((oldSchema.properties) ? oldSchema.properties : {}, schema.properties, {"level": 1});
      let deviceCopy = this.jsonCopyBySchema(vueDevTemp, deviceGen, copySchema);
      console.log(`oldSchema`, JSON.parse(JSON.stringify(oldSchema)));
      console.log(`newSchema`, schema);
      console.log(`copySchema: `, copySchema);
      console.log(`deviceCopy: ${deviceCopy}`);
      console.log(`deviceGen: `, deviceGen);
      this.vue.deviceForm = vueDevTemp;


      let propertyCopy = false;
      if(schema.properties && schema.properties.properties && schema.properties.properties.patternProperties) {
        this.console.log(schema.properties.properties.patternProperties[`^[^\n]+$`].properties);
        let propertyGen = await this.ui.generateData(schema.properties.properties.patternProperties[`^[^\n]+$`]);
        let vuePropTemp = JSON.parse(JSON.stringify(this.vue.propertyForm));
        console.log(`vuePropTemp: `, JSON.stringify(vuePropTemp, null, 2));
        console.log(`propertyGen: `, JSON.stringify(propertyGen, null, 2));
        let oldPropertySchema = (
          oldSchema && 
          oldSchema.properties && 
          oldSchema.properties.properties && 
          oldSchema.properties.properties.patternProperties &&
          oldSchema.properties.properties.patternProperties[`^[^\n]+$`]
        ) ? oldSchema.properties.properties.patternProperties[`^[^\n]+$`].properties : {};
        let propSchema = this.jsonDiv(
          oldPropertySchema,
          schema.properties.properties.patternProperties[`^[^\n]+$`].properties,
          {"level": 1}
        );
        propertyCopy = this.jsonCopyBySchema(vuePropTemp, propertyGen, propSchema);
        this.vue.propertyForm = vuePropTemp;
      }

      if(deviceCopy || propertyCopy)
        await this.onAlternateChange();

      resolve();
    });
  }

  jsonCopyBySchema(dst, src, schema) {
    // console.log(`dst: `, dst);
    src = JSON.parse(JSON.stringify(src));
    let copyFlag = false;
    for(let i in schema) {
      if(schema[i] == true) {
        dst[i] = ([`object`, `array`].includes(typeof src[i])) ? JSON.parse(JSON.stringify(src[i])) : src[i];
        copyFlag = true;
        // console.log(`jsonCopyBySchema[${i}]: `, dst[i]);
      }
      else if([`object`, `array`].includes(typeof schema[i]))
        copyFlag = this.jsonCopyBySchema(dst[i], src[i], schema[i]) || copyFlag;
    }
    return copyFlag;
  }

  jsonDiv(dst, src, options) {
    // console.log(`jsonDiv()`);
    let result = {};
    let opt = (options) ? JSON.parse(JSON.stringify(options)) : {};
    if(opt.level)
      opt.level = opt.level - 1;

    for(let i in dst) {
      result[i] = (!src.hasOwnProperty(i)) ? true :
        ([`object`, `array`].includes(typeof src[i])) ? 
        (JSON.stringify(dst[i]) == JSON.stringify(src[i])) ? false :
        (opt.level == 0) ? true :
        this.jsonDiv(dst[i], src[i], opt) :
        (dst[i] == src[i]) ? false : true;
    }
    for(let i in src) {
      if(!dst.hasOwnProperty(i))
        result[i] = true;
    }
    return result;
  };

  getConfigDevice(id) {
    this.console.log(`getConfigDevice(${(id) ? `${id}` : ``}) >> `);
    return new Promise((resolve, reject) => {
      this.api.restCall(`get`, `/api/service/devices-service/config-device${(id) ? `/${id}` : ``}`)
      .then((res) => (res.error) ? reject(res.error) : resolve(res))
      .catch((err) => reject(err));
    });
  }

  getServiceDevice(id) {
    this.console.log(`getServiceDevice(${(id) ? `${id}` : ``}) >> `);
    return new Promise((resolve, reject) => {
      this.api.restCall(`get`, `/api/service/devices-service/service-device${(id) ? `/${id}` : ``}`)
      .then((res) => (res.error) ? reject(res.error) : resolve(res))
      .catch((err) => reject(err));
    });
  }

  startServiceDevice(id) {
    this.console.log(`startServiceDevice(${id})`);
    return new Promise((resolve, reject) => {
      let toast = this.ui.toast.info(`Starting device "${id}".`);
      this.api.restCall(`get`, `/api/service/devices-service/service-device/${id}/start`)
      .then((res) => {
        this.ui.toast.success(`Device "${id}" is running.`, {"icon": `fa-save`});
        resolve(res);
      })
      .catch((err) => reject(err))
      .finally(() => toast.remove());
    });
  }

  stopServiceDevice(id) {
    this.console.log(`stopServiceDevice(${id})`);
    return new Promise((resolve, reject) => {
      let toast = this.ui.toast.info(`Stopping device "${id}".`);
      this.api.restCall(`get`, `/api/service/devices-service/service-device/${id}/stop`)
      .then((res) => {
        this.ui.toast.success(`Device "${id}" stoped.`, {"icon": `fa-save`});
        resolve(res);
      })
      .catch((err) => reject(err))
      .finally(() => toast.remove());
    });
  }

  addConfigDevice(config) {
    this.console.log(`addConfigDevice() >> `);
    return new Promise((resolve, reject) => {
      let toast = this.ui.toast.info(`Adding new device.`);
      this.api.restCall(`post`, `/api/service/devices-service/config-device`, config)
      .then((res) => {
        this.ui.toast.success(`Device saving complete.`, {"icon": `fa-save`});
        resolve(res);
      })
      .catch((err) => reject(err))
      .finally(() => toast.remove());
    });
  }

  editConfigDevice(id, config) {
    this.console.log(`editConfigDevice(${id}) >> `);
    return new Promise((resolve, reject) => {
      let toast = this.ui.toast.info(`Edit device "${id}".`);
      this.api.restCall(`put`, `/api/service/devices-service/config-device/${id}`, config)
      .then((res) => {
        this.ui.toast.success(`Device "${id}" edit complete.`, {"icon": `fa-save`});
        resolve(res);
      })
      .catch((err) => reject(err))
      .finally(() => toast.remove());
    });
  }

  deleteConfigDevice(id) {
    this.console.log(`deleteConfigDevice(${id}) >> `);
    return new Promise(async (resolve, reject) => {
      let toast = this.ui.toast.info(`Delete device "${id}".`, {"icon": `fa-trash-alt`});
      this.api.restCall(`delete`, `/api/service/devices-service/config-device/${id}`)
      .then((res) => {
        this.ui.toast.success(`Device "${id}" delete complete.`, {"icon": `fa-trash-alt`});
        resolve(res);
      })
      .catch((err) => reject(err))
      .finally(() => toast.remove());
    });
  }

  getSchema() {
    this.console.log(`getSchema()`);
    return new Promise((resolve, reject) => {
      this.api.getSchema()
      .then((schema) => resolve(schema.properties[`service-config`].properties[`devices-service`]));
    });
  }

  generateConfigSchema(params) {
    this.console.log(`generateConfigSchema() >> `);
    return new Promise(async (resolve, reject) => {
      params = (params) ? params : {};
      // let res = await this.api.restCall(`post`, `/api/service/devices-service/generateConfigSchema`, params);
      let res = await this.api.restCall(`post`, `/api/service/devices-service/config/generate-schema`, params);
      resolve(res);
    });
  }

  generatePropertyId(params) {
    this.console.log(`generatePropertyId() >> `);
    return new Promise(async (resolve, reject) => {
      // let res = await this.api.restCall(`post`, `/api/service/devices-service/generatePropertyId`, params);
      let res = await this.api.restCall(`post`, `/api/service/devices-service/config/generate-property-id`, params);
      resolve((res.id) ? res.id : null);
    });
  }
}
