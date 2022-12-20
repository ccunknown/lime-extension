/* eslint-disable import/extensions */
/* eslint-disable no-alert */
/* eslint-disable no-restricted-globals */

import LimeExtensionChartRender from "../../core/js/chart-render/chart-render.js";

/* eslint-disable no-nested-ternary */
export default class LimeExtenisonPageObjects {
  constructor(extension) {
    this.extension = extension;
    this.console = this.extension.console;
    this.api = this.extension.api;
    this.ui = this.extension.ui;
    this.meta = {
      devices: {
        "service-id": "devices-service",
        "service-title": "Devices Service",
        "resource-id": "device",
        "resource-title": "Device",
      },
      engines: {
        "service-id": "engines-service",
        "service-title": "Engines Service",
        "resource-id": "engine",
        "resource-title": "Engine",
      },
      ioports: {
        "service-id": "ioports-service",
        "service-title": "I/O Port Service",
        "resource-id": "ioport",
        "resource-title": "IOPort",
      },
    };
  }

  init(/* config */) {
    this.console.trace(`init()`);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.initCustomRest())
        .then(() => this.initVue())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  initCustomRest(service) {
    this.console.trace(`initCustomRest()`);
    return new Promise((resolve, reject) => {
      let customRest = null;
      if (service) {
        Promise.resolve()
          .then(() =>
            this.ui.getCustomObject(
              `custom-rest`,
              {},
              this.extension,
              this.meta[service]
            )
          )
          .then((object) => {
            customRest = object;
          })
          .then(() => customRest.init())
          .then(() => {
            this.rest = this.rest || {};
            this.rest[service] = customRest;
          })
          .then(() => resolve())
          .catch((err) => reject(err));
      } else {
        Promise.resolve()
          .then(() =>
            Object.keys(this.meta).reduce((prevProm, currId) => {
              return prevProm.then(() => this.initCustomRest(currId));
            }, Promise.resolve())
          )
          .then(() => resolve());
      }
    });
  }

  initVue() {
    this.console.trace(`initVue()`);
    const domId = this.ui.said(`content.objects.section`);
    // const domId = this.ui.said(`content.engines.section`);
    this.console.log(`id : ${domId}`);

    // eslint-disable-next-line no-undef
    this.vue = new Vue({
      el: `#${domId}`,
      data: {
        // Loader
        loader: this.extension.schema,
        // Resource
        resource: {
          objects: {},
          devices: {},
          engines: {},
          ioports: {},
          systemEngine: {},
          configEngine: {},
          configSchema: {},
        },
        // UI
        ui: {
          mode: `view`, // [view, edit, add]
          slider: {
            hide: true,
            ready: false,
            "edit-id": null,
            form: {},
          },
          base: {
            leftPanel: false,
            ready: false,
            activeId: [],
            objectLayer: null,
            quickFilter: [`device`, `engine`, `ioport`],
            selected: {},
            parentForm: {},
            // parentFormSchema: {},
            form: {},
            formSchema: {},
          },
        },
        // Function
        fn: {},
      },
      methods: {},
    });

    //  Setup vue function.
    this.vue.fn = {
      add: (objectLayer = this.vue.ui.base.objectLayer) => {
        this.console.log(`add():`, objectLayer);
        // return new Promise((resolve, reject) => {
        //   Promise.resolve()
        //     .then(() => [])
        //     .then((idArray) => {
        //       this.vue.ui.base.form = {};
        //       this.vue.ui.base.activeId = idArray;
        //       this.vue.ui.base.objectLayer = objectLayer;
        //       return this.renderForm(idArray, objectLayer);
        //     })
        //     .then(() => {
        //       this.vue.ui.mode = `add`;
        //     })
        //     .then(() => resolve())
        //     .catch((err) => reject(err));
        // });
        this.vue.ui.mode = `add`;
        return this.renderAddForm([this.generateObjectId()], objectLayer);
      },
      edit: (idArr = this.vue.ui.base.activeId) => {
        this.console.log(`edit(${idArr})`);
        // this.renderForm(idArr);
        this.vue.ui.mode = `edit`;
        return this.renderEditForm(idArr);
      },
      addProp: (
        idArr = [...this.vue.ui.base.activeId, this.generatePropertyId()],
        objectLayer = this.vue.ui.base.objectLayer
      ) => {
        this.console.log(`addProp(${idArr})`);
        // this.vue.ui.base.form.properties[idArr[idArr.length - 1]] = {};
        // return this.renderForm(idArr);
        return this.renderAddPropertyForm(idArr, objectLayer);
      },
      editProp: (idArr) => {
        this.console.log(`propEdit(${idArr})`);
        // this.vue.ui.base.parentForm = this.clone(this.vue.ui.base.form);
        // this.vue.ui.base.activeId = idArr;
        // return this.renderForm(idArr);
        return this.renderEditPropertyForm(idArr);
      },
      view: (
        id = this.vue.ui.base.activeId,
        objectLayer = this.vue.ui.base.objectLayer
      ) => {
        this.console.log(`view(${id})`);
        this.vue.ui.base.activeId = id;
        this.vue.ui.base.objectLayer = objectLayer;
        this.vue.ui.mode = `view`;
        return this.renderBaseMain(id);
      },
      render: () => {
        return this.vue.ui.mode === `view`
          ? this.vue.fn.view()
          : this.vue.ui.mode === `edit`
          ? this.vue.fn.edit()
          : {};
      },
      save: () => {
        this.console.log(`save()`);
        const idArr = this.vue.ui.base.activeId;
        const id = idArr.join(`.properties.`);
        const layer = this.vue.ui.base.objectLayer;
        const config = this.vue.ui.base.form;
        this.console.log(`id:`, id);
        this.console.log(`layer:`, layer);
        this.console.log(`config:`, JSON.stringify(config, null, 2));
        if (idArr.length > 1) {
          const propId = idArr.pop();
          this.console.log(`propId:`, propId);
          this.vue.ui.base.parentForm.properties[propId] =
            this.vue.ui.base.form;
          this.vue.ui.base.form = this.clone(this.vue.ui.base.parentForm);
          return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
          Promise.resolve()
            .then(() => {
              if (this.vue.ui.mode === `add`) return this.addObject();
              if (this.vue.ui.mode === `edit`) return this.updateObject();
              throw new Error(`Mode "${this.vue.ui.mode}" undefined.`);
            })
            .then(() => this.vue.fn.renewConfig())
            .then(() => this.renderBaseMain())
            .then(() => this.vue.fn.view())
            // .then(() => this.vue.fn.clickObject())
            // .then(() => this.vue.fn.clearForm())
            .then(() => resolve())
            .catch((err) => reject(err));
        });
      },
      remove: (idArr = this.vue.ui.base.activeId) => {
        this.console.log(`delete(${idArr})`);
        // eslint-disable-next-line no-undef
        const confirmRemove = confirm(
          `Are you sure to delete "${idArr.join(`.`)}"`
        );
        if (confirmRemove) {
          if (idArr.length > 1) return this.deleteObjectPropertyFromForm(idArr);
          return Promise.resolve()
            .then(() => this.deleteObject(idArr))
            .then(() => this.vue.fn.renewConfig());
        }
        return null;
      },
      renewConfig: (config) => {
        this.console.log(`fn.renewConfig()`);
        return new Promise((resolve, reject) => {
          const idArr = this.vue.ui.base.activeId;
          const { objectLayer } = this.vue.ui.base;
          Promise.resolve()
            .then(() => config || this.getObjectsConfig())
            .then((conf) =>
              Object.entries(conf).forEach(([key, value]) => {
                this.vue.resource[`${key}`] = value;
              })
            )
            // Copy new value to selected
            .then(() => {
              this.vue.ui.base.selected.config = this.clone(
                this.getJsonElement(
                  idArr.join(`.properties.`),
                  this.vue.resource[`${objectLayer}s`]
                )
              );
              // this.vue.ui.base.selected = {};
              this.vue.ui.base.selected = this.clone(this.vue.ui.base.selected);
            })
            .then(() => resolve())
            .catch((err) => reject(err));
        });
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
      // renderBase: () => {
      //   this.render();
      // },
      // renderSlider: () => {
      //   this.render(false);
      // },
      onAlternateChange: () => {
        this.console.log(`onAlternateChange() >> `);
        this.onAlternateChange();
      },
      craftObjectStatus: (config) => {
        const state = config.state
          ? config.state
          : {
              config: { value: `unrecognize`, level: 0 },
              enable: { value: config.enable, level: 0 },
              inServiceList: { value: `unrecognize`, level: 0 },
              objectState: { value: `unrecognize`, level: 0 },
            };
        const result = {
          config: state.config,
        };
        const enableKey = state.enable.value ? `enable` : `disable`;
        const enableKeyLevel = state.enable.value ? 100 : 0;
        const enableKeyValue = {
          value: state.inServiceList.value
            ? state.objectState.value
            : `not-in-list`,
          level: state.inServiceList
            ? state.objectState.level
            : state.inServiceList.level,
        };
        result[enableKey] = {
          keyLevel: enableKeyLevel,
          value: enableKeyValue.value,
          level: enableKeyValue.level,
        };
        return result;
      },
      clickObject: (
        idArr = this.vue.ui.base.activeId,
        objectLayer = this.vue.ui.base.objectLayer,
        mode = `view`
      ) => {
        this.console.log(`clickObject:`, idArr, objectLayer);
        this.vue.ui.base.activeId = idArr;
        this.vue.ui.base.objectLayer = objectLayer;
        this.vue.ui.mode = mode;
        this.vue.fn.toggleLeftPanel(false);
        this.console.log(`click object '`, idArr, `' layer '${objectLayer}'`);
        // this.console.log(`info:`, this.vue.resource[`${objectLayer}s`][id]);
        this.console.log(
          `info:`,
          this.getJsonElement(
            idArr.join(`.`),
            this.vue.resource[`${objectLayer}s`]
          )
        );
        return this.renderBaseMain(idArr, objectLayer);
      },
      toggleQuickFilter: (id) => {
        if (this.vue.ui.base.quickFilter.includes(id))
          this.vue.ui.base.quickFilter = this.vue.ui.base.quickFilter.filter(
            (e) => e !== id
          );
        else this.vue.ui.base.quickFilter.push(id);
      },
      toggleLeftPanel: (show = !this.vue.ui.base.leftPanel) => {
        this.vue.ui.base.leftPanel = show;
      },
      addToArray: (arr, elem) => {
        return [...arr, elem];
      },
      getJsonElement: (...args) => {
        return this.getJsonElement(...args);
      },
      objectCmd: {
        start: (
          id = this.vue.ui.base.activeId,
          objectLayer = this.vue.ui.base.objectLayer
        ) => {
          this.console.log(`start(${id})`);
          return new Promise((resolve, reject) => {
            Promise.resolve()
              .then(() =>
                this.startObject(id.join(`/properties/`), objectLayer)
              )
              // .then(() => this.getObjectsConfig())
              .then(() => this.render())
              .then(() => this.vue.fn.clickObject(id))
              .then(() => resolve())
              .catch((err) => reject(err));
          });
        },
        stop: (
          id = this.vue.ui.base.activeId,
          objectLayer = this.vue.ui.base.objectLayer
        ) => {
          this.console.log(`stop(${id})`);
          return new Promise((resolve, reject) => {
            Promise.resolve()
              .then(() => this.stopObject(id.join(`/properties/`), objectLayer))
              // .then(() => this.getObjectsConfig())
              .then(() => this.render())
              .then(() => this.vue.fn.clickObject(id))
              .then(() => resolve())
              .catch((err) => reject(err));
          });
        },
      },
      metric: {
        dataTimeRange: () => {
          this.console.log(`uptimeString()`);
          const { metric } = this.vue.ui.base.selected;
          const s = Math.floor(
            (new Date(metric.timeRange.stop) -
              new Date(metric.timeRange.start)) /
              1000
          );
          const days = Math.floor(s / 86400);
          const hours = Math.floor((s % 86400) / 3600);
          const mins = Math.floor((s % 3600) / 60);
          const secs = Math.floor(s % 60);
          let resultString = ``;
          if (days) resultString += `${days} day${days > 1 ? `s` : ``}`;
          if (resultString.length || hours > 0)
            resultString += ` ${hours} hour${hours > 0 ? `s` : ``}`;
          if (resultString.length || mins > 0)
            resultString += ` ${mins} minute${mins > 0 ? `s` : ``}`;
          if (resultString.length || secs > 0)
            resultString += ` ${secs} second${secs > 0 ? `s` : ``}`;
          this.console.log(`uptime:`, `${s} ms`, `/`, resultString);
          return resultString;
        },
        flush: (id = this.vue.ui.base.activeId.join(`.properties.`)) => {
          return new Promise((resolve, reject) => {
            Promise.resolve()
              .then(() => {
                this.vue.ui.base.ready = false;
              })
              // eslint-disable-next-line no-undef
              .then(() => confirm(`Are you sure to delete metric of "${id}" ?`))
              .then((conf) => {
                if (!conf) throw new Error(`Cancel operation`);
              })
              .then(() => this.deleteObjectMetric(id))
              .then(() => resolve())
              .catch((err) => reject(err))
              .finally(() => {
                this.vue.ui.base.ready = true;
              });
          });
        },
      },
    };

    this.console.log(this.vue);
  }

  startObject(
    id = this.vue.ui.base.activeId.join(`.properties.`),
    objectLayer = this.vue.ui.base.objectLayer
  ) {
    return this.rest[`${objectLayer}s`].objects(id).cmd.start();
  }

  stopObject(
    id = this.vue.ui.base.activeId.join(`.properties.`),
    objectLayer = this.vue.ui.base.objectLayer
  ) {
    return this.rest[`${objectLayer}s`].objects(id).cmd.stop();
  }

  addObject(
    objectLayer = this.vue.ui.base.objectLayer,
    config = this.vue.ui.base.form
  ) {
    this.console.log(`addObject():`, objectLayer);
    return this.rest[`${objectLayer}s`].objects().post(config);
  }

  updateObject(
    idArr = this.vue.ui.base.activeId,
    objectLayer = this.vue.ui.base.objectLayer,
    config = this.vue.ui.base.form
  ) {
    this.console.log(`updateObject():`, idArr);
    const id = idArr.join(`.properties.`);
    return this.rest[`${objectLayer}s`].objects(id).update(config);
  }

  deleteObject(
    idArr = this.vue.ui.base.activeId,
    objectLayer = this.vue.ui.base.objectLayer
  ) {
    this.console.log(`deleteObject():`, idArr);
    const id = idArr[0];
    return this.rest[`${objectLayer}s`].objects(id).delete();
  }

  deleteObjectPropertyFromForm(idArr = this.vue.ui.base.activeId) {
    this.console.log(
      `deleteObjectPropertyFromForm():`,
      idArr[idArr.length - 1]
    );
    const props = this.clone(this.vue.ui.base.form.properties);
    delete props[idArr[idArr.length - 1]];
    this.vue.ui.base.form.properties = props;
  }

  getObjectsConfig() {
    this.console.log(`getObjectsConfig()`);
    return new Promise((resolve, reject) => {
      const config = {
        devices: {},
        engines: {},
        ioports: {},
      };
      Promise.resolve()
        .then(() =>
          Object.keys(config).reduce((prevProm, serviceId) => {
            // const serviceId = key.replace(/s$/, ``);
            return prevProm.then(() =>
              this.rest[serviceId]
                .objects()
                .configWithState.get()
                .then((objects) => {
                  config[serviceId] = {};
                  Object.entries(objects).forEach(([key, value]) => {
                    config[serviceId][key] = { ...value };
                  });
                })
            );
          }, Promise.resolve())
        )
        .then(() => resolve(config))
        .catch((err) => reject(err));
    });
  }

  deleteObjectMetric(
    id = this.vue.ui.base.activeId.join(`.properties.`),
    objectLayer = this.vue.ui.base.objectLayer
  ) {
    this.console.log(`deleteMetric()`);
    return this.rest[`${objectLayer}s`].objects(id).metric.delete();
  }

  render(base = true) {
    this.console.log(`render()`);
    return new Promise((resolve, reject) => {
      this.console.trace(`render()`);
      Promise.resolve()
        .then(() => (base ? this.renderBaseSide() : this.renderSlider()))
        .then((result) => resolve(result))
        .catch((err) => reject(err));
    });
  }

  renderNav() {
    this.console.trace(`renderNav()`);
  }

  renderBaseSide() {
    this.console.log(`renderBaseSide()`);
    return new Promise((resolve) => {
      Promise.resolve()
        .then(() => {
          this.vue.ui.base.ready = false;
          this.vue.ui.slider.hide = true;
        })
        .then(() =>
          [`devices`, `engines`, `ioports`].forEach((key) => {
            this.vue.resource[key] = {};
          })
        )
        .then(() => this.getObjectsConfig())
        .then((config) =>
          Object.entries(config).forEach(([key, value]) => {
            this.vue.resource[key] = value;
          })
        )
        // .then(() => this.vue.$forceUpdate())
        .catch((err) => this.console.error(err))
        .finally(() => {
          this.vue.ui.base.ready = true;
          resolve();
        });
    });
  }

  renderBaseMain(
    objectId = this.vue.ui.base.activeId,
    objectLayer = this.vue.ui.base.objectLayer
  ) {
    this.console.log(
      `[${this.constructor.name}]`,
      `renderBaseMain(${objectLayer}:`,
      objectId,
      `)`
    );
    this.console.log(`resource:`, this.vue.resource);
    return new Promise((resolve) => {
      const selected = { config: {}, metric: {} };
      Promise.resolve()
        .then(() => {
          selected.config = this.clone(
            this.getJsonElement(
              Array.isArray(objectId)
                ? objectId.join(`.properties.`)
                : objectId,
              this.vue.resource[`${objectLayer}s`]
            )
          );
        })
        .then(() => {
          const craftedObjectId = Array.isArray(objectId)
            ? objectId.join(`/properties/`)
            : objectId;
          return this.rest[`${objectLayer}s`]
            .objects(craftedObjectId)
            .metric.get();
        })
        .catch((err) => console.error(err))
        .then((metric) => {
          this.console.log(metric);
          selected.metric = metric;
        })
        .then(() => {
          this.console.log(selected);
          this.vue.ui.base.selected = selected;
        })
        .then(() => this.renderMetricChart(selected.metric))
        .catch((err) => this.console.error(err))
        .finally(() => resolve());
    });
  }

  renderSlider(id) {
    this.console.log(`renderSlider()`);
    return new Promise((resolve) => {
      Promise.resolve()
        .then(() => {
          this.vue.ui.slider.ready = false;
          this.vue.ui.slider.hide = false;
        })
        .then(() => this.renderForm(id))
        .catch((err) => this.console.error(err))
        .finally(() => {
          this.vue.ui.slider.ready = true;
          resolve();
        });
    });
  }

  renderAddForm(
    idArr = [this.generateObjectId()],
    objectLayer = this.vue.ui.base.objectLayer
  ) {
    this.console.log(`renderAddForm():`, objectLayer);
    return new Promise((resolve, reject) => {
      let form;
      Promise.resolve()
        .then(() => {
          form = {};
          this.setAssemForm(form);
          form = this.getShortAssemForm();
          this.vue.ui.base.activeId = idArr;
          this.vue.ui.base.objectLayer = objectLayer;
        })
        .then(() => this.rest[`${objectLayer}s`].configSchema.post(form))
        .then((schema) => {
          this.vue.ui.base.formSchema = schema;
        })
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  renderAddPropertyForm(
    idArr = [...this.vue.ui.base.activeId, this.generatePropertyId()],
    objectLayer = this.vue.ui.base.objectLayer
  ) {
    this.console.log(`renderAddPropertyForm():`, idArr);
    return new Promise((resolve, reject) => {
      let form;
      Promise.resolve()
        .then(() => {
          form = this.getAssemForm();
          form.properties = form.properties || {};
          form.properties[idArr[idArr.length - 1]] = {};
          this.vue.ui.base.activeId = idArr;
          this.vue.ui.base.objectLayer = objectLayer;
          this.setAssemForm(form);
        })
        .then(() => this.rest[`${objectLayer}s`].configSchema.post(form))
        .then((schema) => {
          this.vue.ui.base.formSchema = schema;
        })
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  renderEditForm(
    idArr = this.vue.ui.base.activeId,
    objectLayer = this.vue.ui.base.objectLayer
  ) {
    this.console.log(`renderEditForm():`, idArr, objectLayer);
    return new Promise((resolve, reject) => {
      let config;
      Promise.resolve()
        .then(() => this.rest[`${objectLayer}s`].objects(idArr[0]).config.get())
        .then((conf) => {
          this.vue.ui.base.activeId = idArr;
          this.vue.ui.base.objectLayer = objectLayer;
          this.setAssemForm(conf);
          config = this.getShortAssemForm();
          return this.rest[`${objectLayer}s`].configSchema.post(config);
        })
        .then((schema) => {
          this.vue.ui.base.formSchema = schema;
        })
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  renderEditPropertyForm(
    idArr = this.vue.ui.base.activeId,
    objectLayer = this.vue.ui.base.objectLayer
  ) {
    this.console.log(`renderEditPropertyForm():`, idArr);
    return new Promise((resolve, reject) => {
      let config;
      Promise.resolve()
        // .then(() => this.rest[`${objectLayer}s`].objects(idArr[0]).config.get())
        .then(() => this.getAssemForm())
        .then((conf) => {
          this.vue.ui.base.activeId = idArr;
          this.vue.ui.base.objectLayer = objectLayer;
          this.setAssemForm(conf);
          config = this.getShortAssemForm();
          return this.rest[`${objectLayer}s`].configSchema.post(config);
        })
        .then((schema) => {
          this.vue.ui.base.formSchema = schema;
        })
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  renderForm(
    idArr = this.vue.ui.base.activeId,
    objectLayer = this.vue.ui.base.objectLayer
  ) {
    // this.console.log(`PageObjects: renderForm(${idArr || ``}) >> `);
    this.console.log(
      `[${this.constructor.name}]`,
      `renderForm(${objectLayer}:`,
      idArr,
      `)`
    );
    return new Promise((resolve, reject) => {
      if (idArr) {
        Promise.resolve()
          .then(() =>
            idArr.length
              ? this.rest[`${objectLayer}s`].objects(idArr[0]).config.get()
              : {}
          )
          .then((conf) => {
            // this.vue.ui.base.form = conf;
            this.console.log(`conf:`, conf);
            const form = this.clone(conf);
            if (form.properties && idArr.length > 1) {
              if (!form.properties[idArr[1]])
                form.properties[idArr[1]] = { name: `new Property` };
              this.vue.ui.base.activeId = idArr;
            }
            this.setAssemForm(form);
            this.console.log(`activeId:`, this.vue.ui.base.activeId);
            this.console.log(`form:`, this.vue.ui.base.form);
            // return this.onAlternateChange();
          })
          .then(() => {
            const form =
              idArr.length > 1
                ? this.getShortAssemForm()
                : this.vue.ui.base.form;
            this.console.log(`form:`, form);
            return this.rest[`${objectLayer}s`].configSchema.post(form);
          })
          .then((schema) => {
            this.console.log(`idArr:`, idArr);
            this.console.log(`schema:`, schema);
            this.vue.ui.base.formSchema = schema;
          })
          .then(() => resolve())
          .catch((err) => reject(err));
      } else {
        this.vue.resource.configSchema = {};
        this.vue.ui.base.form = {};
        Promise.resolve()
          .then(() => this.onAlternateChange())
          .then(() => resolve())
          .catch((err) => reject(err));
      }
    });
  }

  // eslint-disable-next-line class-methods-use-this
  renderMetricChart(metric) {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        // Render job's success rate.
        .then(() =>
          LimeExtensionChartRender.singleDonut(
            `extension-lime-content-objects-basemain-chart-successrate`,
            [
              { key: `Success Rate`, value: metric.jobs.success },
              { key: `Fail Rate`, value: metric.jobs.fail },
            ],
            {
              colors: [`#3CC692`, `#D95F02`],
            }
          )
        )
        // Render job's average wait time.
        .then(() =>
          LimeExtensionChartRender.singleDonut(
            `extension-lime-content-objects-basemain-chart-avgwaittime`,
            [
              {
                key: `Wait time`,
                value: metric.jobs.averageWaitingTime,
              },
              {
                key: `Service time`,
                value: metric.jobs.averageServiceTime,
              },
            ],
            {
              colors: [`#566573`, `#3CC692`],
            }
          )
        )
        // Render job timeline density.
        .then(() =>
          LimeExtensionChartRender.heatTimeline(
            `extension-lime-content-objects-basemain-chart-job-heat-timeline`,
            metric.activeTime.list.map((e) => {
              return {
                // start: Math.floor(new Date(e.startTime).getTime() / 1000),
                // end: Math.floor(new Date(e.stopTime || e.rejectTime).getTime() / 1000),
                name: e.jid,
                start: new Date(e.startTime).getTime(),
                end: new Date(e.stopTime || e.rejectTime).getTime(),
                errors: e.errors,
                tag: e.stopTime ? `success` : `reject`,
              };
            }),
            {
              tags: [`success`, `reject`],
              colors: [`#3CC692`, `#D95F02`],
            }
            // .filter((e, i) => i < 5)
          )
        )
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  onAlternateChange() {
    this.console.log(`PageObjects: onAlternateChange() >> `);
    return new Promise((resolve, reject) => {
      const idArr = this.vue.ui.base.activeId;
      const { objectLayer } = this.vue.ui.base;
      let form;
      let oldSchema;
      let newSchema;
      let oldData;
      let newData;
      let copySchema;
      let dataCopy;
      this.console.log(`idArr:`, idArr);
      Promise.resolve()
        .then(() => {
          form = this.getShortAssemForm();
          this.console.log(`form[${this.vue.ui.base.activeId}]: `, form);
        })
        .then(() => this.rest[`${objectLayer}s`].configSchema.post(form))
        .then((schema) => {
          newSchema = schema;
        })
        .then(() => {
          oldSchema = this.clone(this.vue.ui.base.formSchema);
          this.vue.ui.base.formSchema = this.clone(newSchema);
          this.console.log(`newSchema:`, newSchema);
        })
        .then(() => this.ui.generateData(newSchema))
        .then((data) => {
          // newData = data;
          newData = Object.keys(form.properties || {}).length
            ? data
            : { ...data, properties: newData.properties ? {} : undefined };
          if (idArr.length > 1) {
            const key = Object.keys(newData.properties)[0];
            newData.properties = newData.properties[key];
          }
        })
        .then(() => {
          // oldData = this.getShortAssemForm();
          oldData = JSON.parse(JSON.stringify(form));
          this.console.log(`form:`, form);

          this.console.log(`old schema: `, oldSchema);
          this.console.log(`new schema: `, newSchema);
          this.console.log(`old data: `, oldData);
          this.console.log(`new data: `, newData);

          copySchema = this.jsonDiv(
            oldSchema.properties ? oldSchema.properties : {},
            newSchema.properties,
            { level: 10 }
          );
          copySchema = this.jsonShortenCopySchema(copySchema);
          this.console.log(`copy schema:`, copySchema);
          dataCopy = this.jsonCopyBySchema(oldData, newData, copySchema);
          this.console.log(`Data copy: ${dataCopy}`);

          this.setShortAssemForm(oldData);
        })
        .then(() => dataCopy && this.onAlternateChange())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  generateObjectId(objectLayer = this.vue.ui.base.objectLayer) {
    this.console.log(`generatePropertyId():`, objectLayer);
    const config = this.vue.resource[`${objectLayer}s`] || {};
    this.console.log(`config:`, config);
    let i = 0;
    let result;
    do {
      i += 1;
      result = `${objectLayer}-${i}`;
    } while (Object.keys(config).includes(result));
    return result;
  }

  generatePropertyId(
    idArr = this.vue.ui.base.activeId,
    objectLayer = this.vue.ui.base.objectLayer
  ) {
    this.console.log(`generatePropertyId():`, idArr, objectLayer);
    const config = this.getJsonElement(
      // idArr.join(`.properties.`),
      `properties`,
      this.vue.ui.base.form
    ) || { properties: {} };
    this.console.log(`config:`, config);
    let i = 0;
    let result;
    do {
      i += 1;
      result = `property-${i}`;
    } while (Object.keys(config).includes(result));
    return result;
  }

  jsonCopyBySchema(dst, source, schema) {
    this.console.log(`jsonCopyBySchema():`, schema);
    // console.log(`dst: `, dst);
    const src = this.clone(source);
    let copyFlag = false;
    Object.keys(schema).forEach((i) => {
      if (schema[i] === true) {
        // eslint-disable-next-line no-param-reassign
        dst[i] = [`object`, `array`].includes(typeof src[i])
          ? this.clone(src[i])
          : src[i];
        copyFlag = true;
        // console.log(`jsonCopyBySchema[${i}]: `, dst[i]);
      } else if ([`object`, `array`].includes(typeof schema[i]))
        copyFlag = this.jsonCopyBySchema(dst[i], src[i], schema[i]) || copyFlag;
    });
    return copyFlag;
  }

  jsonShortenCopySchema(schema) {
    const result = {};
    const propKey = `^[^\n]+$`;
    const anyTrue = (obj) => {
      return !!Object.values(obj).find((e) => {
        if (typeof e === `boolean` && e) return true;
        if (typeof e === `object`) return anyTrue(e);
        return false;
      });
    };
    Object.entries(schema).forEach(([key, val]) => {
      this.console.log(`key:`, key);
      if (
        key === `properties` &&
        typeof val === `object` &&
        val.patternProperties &&
        val.patternProperties[propKey] &&
        val.patternProperties[propKey].properties
      ) {
        this.console.log(`shorten properties`);
        result[key] = this.jsonShortenCopySchema(
          val.patternProperties[propKey].properties
        );
      } else if (typeof val === `object`) {
        result[key] = anyTrue(val);
      } else result[key] = val;
    });
    return result;
  }

  jsonDiv(dst, src, options) {
    // console.log(`jsonDiv()`);
    const result = {};
    const opt = options ? this.clone(options) : {};
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

  getJsonElement(path, obj) {
    console.log(`getJsonElement(${path}):`, obj);
    const pathArr = path.split(`.`);
    if (!obj || !pathArr.length || !obj[pathArr[0]]) return undefined;
    const result = obj[pathArr[0]];
    if (pathArr.slice(1).length) {
      // this.console.log(`result:`, result);
      return this.getJsonElement(pathArr.slice(1).join(`.`), result);
    }
    // this.console.log(`final result:`, result);
    return result;
  }

  // eslint-disable-next-line class-methods-use-this
  clone(src) {
    return JSON.parse(JSON.stringify(src));
  }

  getShortAssemForm() {
    const idArr = this.vue.ui.base.activeId;
    return idArr.length > 1
      ? this.clone({
          ...this.vue.ui.base.parentForm,
          properties: this.vue.ui.base.form,
        })
      : this.clone(this.vue.ui.base.form);
  }

  setShortAssemForm(data) {
    const idArr = this.vue.ui.base.activeId;
    this.console.log(`setShortAssemForm([${idArr}]):`, data);
    if (idArr.length > 1) {
      Object.entries(data)
        .filter(([key]) => key !== `properties`)
        .forEach(([key, value]) => {
          this.console.log(`key:`, key, `->`, value);
          this.vue.ui.base.parentForm[key] = value;
        });
      // this.vue.ui.base.parentForm = this.clone(data);
      // this.vue.ui.base.form = this.clone(data.properties[idArr[1]]);
      this.vue.ui.base.form = this.clone(data.properties);
    } else {
      this.vue.ui.base.form = this.clone(data);
    }
  }

  getAssemForm() {
    const idArr = this.vue.ui.base.activeId;
    if (idArr.length > 1) {
      const result = this.clone(this.vue.ui.base.parentForm);
      result.properties[idArr[1]] = this.clone(this.vue.ui.base.form);
      return result;
    }
    return this.clone(this.vue.ui.base.form);
  }

  setAssemForm(data) {
    const idArr = this.vue.ui.base.activeId;
    this.console.log(`setAssemForm([${idArr}]):`, data);
    if (idArr.length > 1) {
      this.vue.ui.base.parentForm = this.clone(data);
      this.vue.ui.base.form = this.clone(data.properties[idArr[1]]);
      // this.vue.ui.base.form = this.clone(data.properties);
    } else {
      this.vue.ui.base.form = this.clone(data);
    }
  }
}
