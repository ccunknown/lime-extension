/* eslint-disable no-nested-ternary */
/* eslint-disable no-alert */
/* eslint-disable no-undef */
export default class PageSysport {
  constructor(extension) {
    this.extension = extension;
    this.console = this.extension.console;
    this.api = this.extension.api;
    this.ui = this.extension.ui;
    this.meta = {
      "service-id": "sysport-service",
      "service-title": "System Port Service",
      "resource-id": "port",
      "resource-title": "Port",
    };
  }

  init(config) {
    this.console.trace(`init() >> `);
    this.console.log(`config:`, config);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.initCustomRest())
        .then(() => this.initVue())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  initCustomRest() {
    this.console.trace(`initCustomRest() >> `);
    return new Promise((resolve, reject) => {
      let customRest = null;
      Promise.resolve()
        .then(() =>
          this.ui.getCustomObject(`custom-rest`, {}, this.extension, this.meta)
        )
        .then((object) => {
          customRest = object;
        })
        .then(() => customRest.init())
        .then(() => {
          this.rest = customRest;
        })
        .then(() => this.initSysportCustomRest())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  initSysportCustomRest() {
    this.console.log(`initSysportCustomRest() >> `);
    Object.assign(this.rest, {
      getSystemPort: () => {
        this.console.log(`PageSysport: getSystemPort() >> `);
        return new Promise((resolve, reject) => {
          Promise.resolve()
            .then(() =>
              this.api.restCall(
                `get`,
                `/api/service/sysport-service/system-port`
              )
            )
            .then((res) => {
              if (res.error) reject(res.error);
              else
                resolve(
                  res.map((elem) => {
                    return {
                      path: elem.path,
                      pnpid: elem.pnpId ? elem.pnpId : `null`,
                      manufacturer: elem.manufacturer
                        ? elem.manufacturer
                        : `null`,
                    };
                  })
                );
            })
            .catch((err) => reject(err));
        });
      },
    });
  }

  initVue() {
    this.console.trace(`initVue()`);
    const domId = this.ui.said(`content.sysport.section`);

    this.vue = new Vue({
      el: `#${domId}`,
      data: {
        // Loader
        loader: this.extension.schema,
        // Resource
        resource: {
          configPort: {},
          systemPort: [],
        },
        // UI
        ui: {
          slider: {
            hide: true,
            ready: false,
            "edit-id": null,
            form: {},
          },
          base: {
            ready: false,
          },
        },
        // Function
        fn: {
          add: () => {},
          edit: () => {},
          remove: () => {},
          save: () => {},
          updateSystemPort: () => {},
          shortSchemaCall: () => {},
        },
      },
      methods: {},
    });

    //  Setup vue function.
    this.vue.fn = {
      add: () => {
        this.vue.ui.slider[`edit-id`] = null;
        return this.renderSlider();
      },
      addSubscribe: (id) => {
        this.console.log(`addSubscribe(${id})`);
        return new Promise((resolve, reject) => {
          const { rtcpageController } = this.extension;
          const topic = `/service/${this.meta[`service-id`]}/monitor/${id}/.*`;
          Promise.resolve()
            .then(() => this.console.log(`topic:`, topic))
            .then(() => rtcpageController.addSubscribe(topic))
            .then(() => resolve())
            .catch((err) => reject(err));
        });
      },
      edit: (iden) => {
        this.console.log(`edit(${iden})`);
        this.vue.ui.slider[`edit-id`] = iden;
        this.renderSlider(iden);
      },
      remove: (iden) => {
        this.console.log(`delete(${iden})`);
        return new Promise((resolve, reject) => {
          // eslint-disable-next-line no-restricted-globals
          const conf = confirm(`Are you sure to delete port "${iden}"!`);
          if (conf) {
            this.rest
              .deleteConfig(iden)
              .then((res) => this.console.log(res))
              .then(() => this.render())
              .then(() => resolve())
              .catch((err) => reject(err));
          } else resolve();
        });
      },
      save: () => {
        this.console.log(`save()`);
        this.console.log(
          `save data: ${JSON.stringify(this.vue.ui.slider.form, null, 2)}`
        );
        return new Promise((resolve, reject) => {
          const iden = this.vue.ui.slider[`edit-id`];
          const config = this.vue.ui.slider.form;
          Promise.resolve()
            .then(() =>
              iden
                ? this.rest.editConfig(iden, config)
                : this.rest.addConfig(config)
            )
            .then((res) => this.console.log(res))
            .then(() => this.render())
            .then(() => resolve())
            .catch((err) => reject(err));
        });
      },
      typeIdentify: (param) => {
        let type;
        if (param.attrs && param.attrs.type) type = param.attrs.type;
        else if (param.enum) type = `select`;
        else if (param.type === `string`) type = `text`;
        else if (param.type === `number`) type = `number`;
        else if (param.type === `boolean`) type = `check`;
        else if (param.type === `object`) type = `object`;
        // console.log(`type: ${type}`);
        return type;
      },
      renderBase: () => {
        this.render();
      },
      renderSlider: () => {
        this.render(false);
      },
      updateSystemPort: async () => {
        this.console.log(`sysport.updateSystemPort()`);
        this.vue.resource.systemPort = await this.rest.getSystemPort();
      },
      shortSchemaCall: (key) => {
        const res = this.ui.shortJsonElement(this.vue.resource.schema, key);
        this.console.log(`short json : ${JSON.stringify(res, null, 2)}`);
        return res;
      },
      print: (obj) => {
        this.console.log(obj);
      },
    };
  }

  render(base = true) {
    this.console.log(`render()`);
    return new Promise((resolve, reject) => {
      this.console.trace(`render()`);
      Promise.resolve()
        .then(() => (base ? this.renderBase() : this.renderSlider()))
        .then((result) => resolve(result))
        .catch((err) => reject(err));
    });
  }

  renderNav() {
    this.console.trace(`renderNav()`);
  }

  renderBase() {
    this.console.log(`renderBase()`);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => {
          this.vue.ui.base.ready = false;
          this.vue.ui.slider.hide = true;
        })
        .then(() => this.rest.getItemConfig())
        .then((config) => {
          this.vue.resource.configPort = config;
        })
        .then(() => resolve())
        .catch((err) => reject(err))
        .finally(() => {
          this.vue.ui.base.ready = true;
        });
    });
  }

  renderSlider(name) {
    this.console.log(`renderSlider()`);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => {
          this.vue.ui.slider.ready = false;
          this.vue.ui.slider.hide = false;
        })
        .then(() => this.renderForm(name))
        .then(() => resolve())
        .catch((err) => reject(err))
        .finally(() => {
          this.vue.ui.slider.ready = true;
        });
    });
  }

  renderForm(id) {
    this.console.log(`PageEngines: renderForm(${id || ``}) >> `);
    return new Promise((resolve, reject) => {
      if (id) {
        Promise.resolve()
          .then(() => this.rest.getItemConfig(id))
          .then((conf) => {
            this.vue.ui.slider.form = conf;
            return this.rest.generateConfigSchema(conf);
          })
          .then((schema) => {
            this.vue.resource.configSchema = schema;
          })
          .then(() => resolve())
          .catch((err) => reject(err));
      } else {
        this.vue.resource.configSchema = {};
        this.vue.ui.slider.form = {};
        Promise.resolve()
          .then(() => this.onAlternateChange())
          .then(() => resolve())
          .catch((err) => reject(err));
      }
    });
  }

  onAlternateChange() {
    this.console.log(`PageEngines: onAlternateChange() >> `);
    return new Promise((resolve, reject) => {
      let config;
      let oldSchema;
      let newSchema;
      let oldData;
      let newData;
      let copySchema;
      let dataCopy;
      Promise.resolve()
        .then(() => {
          config = JSON.parse(JSON.stringify(this.vue.ui.slider.form));
          this.console.log(`config: `, config);
        })
        .then(() => this.rest.generateConfigSchema(config))
        .then((schema) => {
          newSchema = schema;
        })
        .then(() => {
          oldSchema = JSON.parse(
            JSON.stringify(this.vue.resource.configSchema)
          );
          this.vue.resource.configSchema = JSON.parse(
            JSON.stringify(newSchema)
          );
        })
        .then(() => this.ui.generateData(newSchema))
        .then((data) => {
          newData = data;
        })
        .then(() => {
          oldData = JSON.parse(JSON.stringify(this.vue.ui.slider.form));

          this.console.log(`old schema: `, oldSchema);
          this.console.log(`new schema: `, newSchema);
          this.console.log(`old data: `, oldData);
          this.console.log(`new data: `, newData);

          copySchema = this.jsonDiv(
            oldSchema.properties ? oldSchema.properties : {},
            newSchema.properties,
            { level: 1 }
          );
          dataCopy = this.jsonCopyBySchema(oldData, newData, copySchema);
          this.console.log(`Data copy: ${dataCopy}`);

          this.vue.ui.slider.form = oldData;
        })
        .then(() => dataCopy && this.onAlternateChange())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  jsonCopyBySchema(dst, source, schema) {
    // console.log(`dst: `, dst);
    const src = JSON.parse(JSON.stringify(source));
    let copyFlag = false;
    Object.keys(schema).forEach((i) => {
      if (schema[i] === true) {
        // eslint-disable-next-line no-param-reassign
        dst[i] = [`object`, `array`].includes(typeof src[i])
          ? JSON.parse(JSON.stringify(src[i]))
          : src[i];
        copyFlag = true;
        // console.log(`jsonCopyBySchema[${i}]: `, dst[i]);
      } else if ([`object`, `array`].includes(typeof schema[i]))
        copyFlag = this.jsonCopyBySchema(dst[i], src[i], schema[i]) || copyFlag;
    });
    return copyFlag;
  }

  jsonDiv(dst, src, options) {
    // console.log(`jsonDiv()`);
    const result = {};
    const opt = options ? JSON.parse(JSON.stringify(options)) : {};
    if (opt.level) opt.level -= 1;

    Object.keys(dst).forEach((i) => {
      result[i] = !Object.prototype.hasOwnProperty.call(src, i)
        ? true
        : [`object`, `array`].includes(typeof src[i])
        ? JSON.stringify(dst[i]) === JSON.stringify(src[i])
          ? false
          : opt.level === 0
          ? true
          : this.jsonDiv(dst[i], src[i], opt)
        : dst[i] !== src[i];
    });
    Object.keys(src).forEach((i) => {
      if (!Object.prototype.hasOwnProperty.call(dst, i)) result[i] = true;
    });
    return result;
  }
}
