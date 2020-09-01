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
      // let schema = await this.getSchema();

      this.vue = new Vue({
        "el": `#${id}`,
        "data": {
          /** Loader **/
          "loader": this.extension.schema,
          /** Resource **/
          "resource": {
            // "config": {"list": []},
            // "schema": schema,
            "configPort": {},
            "systemPort": [],
          },
          /** UI **/
          "ui": {
            "slider": {
              "hide": true,
              "ready": false,
              "edit-id": null,
              "form": {},
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
            "updateSystemPort": () => {},
            "shortSchemaCall": () => {}
          }
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
          this.console.log(`delete(${name})`);
          return new Promise((resolve, reject) => {
            let conf = confirm(`Are you sure to delete port "${id}"!`);
            if(conf) {
              this.deleteConfigPort(id)
              .then((res) => this.render())
              .then(() => resolve())
              .catch((err) => reject(err));
            }
            else
              resolve();
          });
        },
        "save": () => {
          this.console.log(`save()`);
          this.console.log(`save data: ${JSON.stringify(this.vue.ui.slider.form, null, 2)}`);
          return new Promise((resolve, reject) => {
            let id = this.vue.ui.slider[`edit-id`];
            let config = this.vue.ui.slider.form;
            ((id) ? this.editConfigPort(id, config) : this.addConfigPort(config))
            .then((res) => this.render())
            .then(() => resolve())
            .catch((err) => reject(err));
          });
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
          // console.log(`type: ${type}`);
          return type;
        },
        "renderBase": () => {
          this.render();
        },
        "renderSlider": () => {
          this.render(false);
        },
        "updateSystemPort": async () => {
          console.log(`sysport.updateSystemPort()`);
          this.vue.resource.systemPort = await this.getSystemPort();
        },
        "shortSchemaCall": (key) => {
          let res = this.ui.shortJsonElement(this.vue.resource.schema, key);
          console.log(`short json : ${JSON.stringify(res, null, 2)}`);
          return res;
        },
        "print": (obj) => {
          console.log(obj);
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

      let configPort = await this.getConfigPort();
      this.vue.resource.configPort = configPort;

      this.vue.ui.base.ready = true;
      resolve();
    });
  }

  renderSlider(name) {
    this.console.log(`renderSlider()`);
    return new Promise(async (resolve, reject) => {
      this.vue.ui.slider.ready = false;
      this.vue.ui.slider.hide = false;

      await this.renderForm(name);

      this.vue.ui.slider.ready = true;
      resolve();
    });
  }

  renderForm(name) {
    this.console.log(`PageSysport: renderVueAddForm() >> `);
    return new Promise((resolve, reject) => {
      Promise.all([
        this.getConfigPort(),
        this.getSystemPort(),
        this.generateConfigSchema()
      ])
      .then((promArr) => {
        this.vue.resource.configPort = promArr[0];
        this.vue.resource.systemPort = promArr[1];
        this.vue.resource.configSchema = promArr[2];

        this.vue.ui.slider.form = (name && this.vue.resource.configPort[name]) ? 
          this.vue.resource.configPort[name] :
          this.ui.generateData(this.vue.resource.configSchema);

        // if(name && this.vue.resource.configPort[name])
        //   this.vue.ui.slider.form = this.vue.resource.configPort[name];
        // else
        //   this.vue.ui.slider.form = this.ui.generateData(this.vue.resource.configSchema);

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

  getConfigPort() {
    this.console.log(`PageSysport: getConfigPort() >> `);
    return new Promise(async (resolve, reject) => {
      this.api.restCall(`get`, `/api/service/sysport-service/config-port`)
      .then((res) => (res.error) ? reject(res.error) : resolve(res))
      .catch((err) => reject(err));
    });
  }

  getSystemPort() {
    this.console.log(`PageSysport: getSystemPort() >> `);
    return new Promise((resolve, reject) => {
      this.api.restCall(`get`, `/api/service/sysport-service/system-port`)
      .then((res) => (res.error) ?
        reject(res.error) : 
        resolve(
          res.map((elem) => {
            return {
              path: elem.path,
              pnpid: (elem.pnpId) ? elem.pnpId : `null`,
              manufacturer: (elem.manufacturer) ? elem.manufacturer : `null`
            };
          })
        )
      )
      .catch((err) => reject(err));
    });
  }

  addConfigPort(config) {
    this.console.log(`PageSysport: addConfigPort() >> `);
    return new Promise((resolve, reject) => {
      let toast = this.ui.toast.info(`Adding new port.`);
      this.api.restCall(`post`, `/api/service/sysport-service/config-port`, config)
      .then((res) => {
        this.ui.toast.success(`Port saving complete.`, {"icon": `fa-save`});
        resolve(res);
      })
      .catch((err) => reject(err))
      .finally(() => toast.remove());
    });
  }

  editConfigPort(id, config) {
    this.console.log(`PageSysport: editConfigPort() >> `);
    return new Promise((resolve, reject) => {
      let toast = this.ui.toast.info(`Edit port "${id}".`);
      this.api.restCall(`put`, `/api/service/sysport-service/config-port/${id}`, config)
      .then((res) => {
        this.ui.toast.success(`Port "${id}" edit complete.`, {"icon": `fa-save`});
        resolve(res);
      })
      .catch((err) => reject(err))
      .finally(() => toast.remove());
    });
  }

  deleteConfigPort(id) {
    this.console.log(`PageSysport: deleteConfigPort() >> `);
    return new Promise((resolve, reject) => {
      let toast = this.ui.toast.info(`Delete port "${id}".`, {"icon": `fa-trash-alt`});
      this.api.restCall(`delete`, `/api/service/sysport-service/config-port/${id}`)
      .then((res) => {
        this.ui.toast.success(`Port "${id}" delete complete.`, {"icon": `fa-trash-alt`});
        resolve(res);
      })
      .catch((err) => reject(err))
      .finally(() => toast.remove());
    });
  }

  generateConfigSchema(param) {
    this.console.log(`PageSysport: generateConfigSchema() >> `);
    return new Promise((resolve, reject) => {
      // let toast = this.ui.toast.info(`Generate config schema.`);
      this.api.restCall(`post`, `/api/service/sysport-service/generateConfigSchema`, {})
      .then((res) => {
        // this.ui.toast.success(`Config schema generated.`);
        resolve(res);
      })
      .catch((err) => reject(err));
      // .finally(() => toast.remove());
    });
  }
}