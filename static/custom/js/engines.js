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

      this.vue = new Vue({
        "el": `#${id}`,
        "data": {
          /** Loader **/
          "loader": this.extension.schema,
          /** Resource **/
          "resource": {
            "systemEngine": {},
            "configEngine": {},
            "configSchema": {}
          },
          /** UI **/
          "ui": {
            "slider": {
              "hide": true,
              "ready": false,
              "edit-id": null,
              "form": {}
            },
            "base": {
              "ready": false
            }
          },
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
          return new Promise((resolve, reject) => {
            let conf = confirm(`Are you sure to delete engine "${id}"!`);
            if(conf) {
              this.deleteConfig(id)
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
            ((id) ? this.editConfig(id, config) : this.addConfig(config))
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

      // let systemEngine = await this.getSystemEngine();
      let systemEngine = await this.getServiceEngine();
      this.vue.resource.systemEngine = systemEngine;

      this.vue.ui.base.ready = true;
      resolve();
    });
  }

  renderSlider(id) {
    this.console.log(`renderSlider()`);
    return new Promise(async (resolve, reject) => {
      this.vue.ui.slider.ready = false;
      this.vue.ui.slider.hide = false;

      await this.renderForm(id);

      this.vue.ui.slider.ready = true;
      resolve();
    });
  }

  renderForm(id) {
    this.console.log(`PageEngines: renderForm(${(id) ? `${id}` : ``}) >> `);
    return new Promise((resolve, reject) => {
      if(id) {
        this.getConfigEngine(id)
        .then((conf) => {
          this.vue.ui.slider.form = conf;
          return this.generateConfigSchema(conf);
        })
        .then((schema) => {
          this.vue.resource.configSchema = schema;
          return ;
        })
        .then(() => resolve())
        .catch((err) => reject(err));
      }
      else {
        this.vue.resource.configSchema = {};
        this.vue.ui.slider.form = {};
        this.onAlternateChange()
        .then(() => resolve())
        .catch((err) => reject(err));
      }
    });
  }

  onAlternateChange() {
    this.console.log(`PageEngines: onAlternateChange() >> `);
    return new Promise(async (resolve, reject) => {
      let config = JSON.parse(JSON.stringify(this.vue.ui.slider.form));

      this.console.log(`config: `, config);

      let newSchema = await this.generateConfigSchema(config);
      let oldSchema = JSON.parse(JSON.stringify(this.vue.resource.configSchema));
      this.vue.resource.configSchema = JSON.parse(JSON.stringify(newSchema));

      let newData = await this.ui.generateData(newSchema);
      let oldData = JSON.parse(JSON.stringify(this.vue.ui.slider.form));
      
      this.console.log(`old schema: `, oldSchema);
      this.console.log(`new schema: `, newSchema);
      this.console.log(`old data: `, oldData);
      this.console.log(`new data: `, newData);

      let copySchema = this.jsonDiv((oldSchema.properties) ? oldSchema.properties : {}, newSchema.properties, {"level": 1});
      let dataCopy = this.jsonCopyBySchema(oldData, newData, copySchema);

      this.vue.ui.slider.form = oldData;

      this.console.log(`Data copy: ${dataCopy}`);
      if(dataCopy)
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

  getConfigEngine(id) {
    this.console.log(`PageEngines: getConfigEngine(${(id) ? `${id}` : ``}) >> `);
    return new Promise((resolve, reject) => {
      this.api.restCall(`get`, `/api/service/engines-service/config-engine${(id) ? `/${id}` : ``}`)
      .then((res) => (res.error) ? reject(res.error) : resolve(res))
      .catch((err) => reject(err));
    });
  }

  getServiceEngine(id) {
    this.console.log(`PageEngines: getServiceEngine(${(id) ? `${id}` : ``}) >> `);
    return new Promise((resolve, reject) => {
      this.api.restCall(`get`, `/api/service/engines-service/service-engine${(id) ? `/${id}` : ``}`)
      .then((res) => (res.error) ? reject(res.error) : resolve(res))
      .catch((err) => reject(err));
    });
  }

  // getSystemEngine() {
  //   this.console.log(`PageEngines: getSystemEngine() >> `);
  //   return new Promise((resolve, reject) => {
  //     this.api.restCall(`get`, `/api/service/engines-service/system-engine`)
  //     .then((res) => (res.error) ? reject(res.error) : resolve(res))
  //     .catch((err) => reject(err));
  //   });
  // }

  addConfig(config) {
    this.console.log(`PageEngines: addConfig() >> `);
    return new Promise((resolve, reject) => {
      let toast = this.ui.toast.info(`Adding new engine.`);
      this.api.restCall(`post`, `/api/service/engines-service/config-engine`, config)
      .then((res) => {
        this.ui.toast.success(`Engine saving complete.`, {"icon": `fa-save`});
        resolve(res);
      })
      .catch((err) => reject(err))
      .finally(() => toast.remove());
    });
  }

  editConfig(id, config) {
    this.console.log(`PageEngines: editConfig() >> `);
    return new Promise((resolve, reject) => {
      let toast = this.ui.toast.info(`Edit engine "${id}".`);
      this.api.restCall(`put`, `/api/service/engines-service/config-engine/${id}`, config)
      .then((res) => {
        this.ui.toast.success(`Engine "${id}" edit complete.`, {"icon": `fa-save`});
        resolve(res);
      })
      .catch((err) => reject(err))
      .finally(() => toast.remove());
    });
  }

  deleteConfig(id) {
    this.console.log(`PageEngines: deleteConfig() >> `);
    return new Promise((resolve, reject) => {
      let toast = this.ui.toast.info(`Delete engine "${id}".`, {"icon": `fa-trash-alt`});
      this.api.restCall(`delete`, `/api/service/engines-service/config-engine/${id}`)
      .then((res) => {
        this.ui.toast.success(`Engine "${id}" delete complete.`, {"icon": `fa-trash-alt`});
        resolve(res);
      })
      .catch((err) => reject(err))
      .finally(() => toast.remove());
    });
  }

  generateConfigSchema(param) {
    this.console.log(`PageSysport: generateConfigSchema() >> `);
    return new Promise((resolve, reject) => {
      this.api.restCall(`post`, `/api/service/engines-service/generate-schema`, (param) ? param : undefined)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
    });
  }
}