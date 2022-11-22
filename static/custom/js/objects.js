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
        // .then(() => {
        //   this.renderGraph = this.getRenderGraphFunction();
        // })
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
          slider: {
            hide: true,
            ready: false,
            "edit-id": null,
            form: {},
          },
          base: {
            leftPanel: false,
            ready: false,
            activeId: null,
            quickFilter: [`device`, `engine`, `ioport`],
            selected: {},
          },
        },
        // Function
        fn: {},
      },
      methods: {},
    });

    //  Setup vue function.
    this.vue.fn = {
      add: async () => {
        this.vue.ui.slider[`edit-id`] = null;
        this.renderSlider();
      },
      edit: (id) => {
        this.console.log(`edit(${id})`);
        this.vue.ui.slider[`edit-id`] = id;
        this.renderSlider(id);
      },
      remove: (id) => {
        this.console.log(`delete(${id})`);
        return new Promise((resolve, reject) => {
          // eslint-disable-next-line no-undef
          const conf = confirm(`Are you sure to delete engine "${id}"!`);
          if (conf) {
            Promise.resolve()
              .then(() => this.rest.deleteConfig(id))
              .then((/* res */) => this.render())
              .then(() => resolve())
              .catch((err) => reject(err));
          } else resolve();
        });
      },
      save: () => {
        this.console.log(`save()`);
        this.console.log(
          `save data:`,
          `${JSON.stringify(this.vue.ui.slider.form, null, 2)}`
        );
        return new Promise((resolve, reject) => {
          const id = this.vue.ui.slider[`edit-id`];
          const config = this.vue.ui.slider.form;
          Promise.resolve()
            .then(() =>
              id
                ? this.rest.editConfig(id, config)
                : this.rest.addConfig(config)
            )
            .then((/* res */) => this.render())
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
      start: (id) => {
        this.console.log(`start(${id})`);
        return new Promise((resolve, reject) => {
          Promise.resolve()
            .then(() => this.rest.startServicedItem(id))
            .then(() => this.render())
            .then(() => resolve())
            .catch((err) => reject(err));
        });
      },
      stop: (id) => {
        this.console.log(`stop(${id})`);
        return new Promise((resolve, reject) => {
          Promise.resolve()
            .then(() => this.rest.stopServicedItem(id))
            .then(() => this.render())
            .then(() => resolve())
            .catch((err) => reject(err));
        });
      },
      addToService: (id) => {
        this.console.log(`addToService(${id})`);
        return new Promise((resolve, reject) => {
          Promise.resolve()
            .then(() => this.rest.addToService(id))
            .then(() => this.render())
            .then(() => resolve())
            .catch((err) => reject(err));
        });
      },
      removeFromService: (id) => {
        this.console.log(`removeFromService(${id})`);
        return new Promise((resolve, reject) => {
          Promise.resolve()
            .then(() => this.rest.removeFromService(id))
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
              // eslint-disable-next-line no-underscore-dangle
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
        id,
        objectLayer = this.vue.ui.base.selected.objectLayer
      ) => {
        this.console.log(`clickObject:`, id, objectLayer);
        this.vue.ui.base.activeId = id;
        if (objectLayer) this.vue.ui.base.selected.objectLayer = objectLayer;
        this.vue.fn.toggleLeftPanel(false);
        this.console.log(`click object '`, id, `' layer '${objectLayer}'`);
        // this.console.log(`info:`, this.vue.resource[`${objectLayer}s`][id]);
        this.console.log(
          `info:`,
          this.getJsonElement(
            Array.isArray(id) ? id.join(`.`) : id,
            this.vue.resource[`${objectLayer}s`]
          )
        );
        return this.renderBaseMain(id, objectLayer);
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
        // renderServeQuality: () => {
        //   // eslint-disable-next-line no-undef
        //   const svg = d3.select(
        //     this.ui.said(`content.objects.basemain.chart.servequality`)
        //   );
        // },
      },
    };

    this.console.log(this.vue);
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
        // Get serviced devices.
        .then(() => this.rest.devices.getServicedItem())
        .then((devices) => {
          this.vue.resource.devices = {};
          Object.entries(devices).forEach(([key, value]) => {
            this.vue.resource.devices[key] = {
              ...value,
              // ...{ objectLayer: `device` },
            };
          });
        })
        // Get serviced engines.
        .then(() => this.rest.engines.getServicedItem())
        .then((engines) => {
          this.vue.resource.engines = {};
          Object.entries(engines).forEach(([key, value]) => {
            this.vue.resource.engines[key] = {
              ...value,
              // ...{ objectLayer: `engine` },
            };
          });
        })
        // Get serviced sysport
        .then(() => this.rest.ioports.getServicedItem())
        .then((ioports) => {
          this.vue.resource.ioports = {};
          Object.entries(ioports).forEach(([key, value]) => {
            this.vue.resource.ioports[key] = {
              ...value,
              // ...{ objectLayer: `ioport` },
            };
          });
        })
        // Combine devices, engines and sysport to objects.
        .then(() => {
          // this.vue.resource.objects = {
          //   ...this.vue.resource.devices,
          //   ...this.vue.resource.engines,
          //   ...this.vue.resource.ioports,
          // };
          // this.console.log(`objects`, this.vue.resource.objects);
        })
        .catch((err) => this.console.error(err))
        .finally(() => {
          this.vue.ui.base.ready = true;
          resolve();
        });
    });
  }

  renderBaseMain(
    objectId,
    objectLayer = this.vue.ui.base.selected.objectLayer
  ) {
    this.console.log(
      `[${this.constructor.name}]`,
      `renderBaseMain(${objectLayer}:`,
      objectId,
      `)`
    );
    this.console.log(`resource:`, this.vue.resource);
    return new Promise((resolve) => {
      const selected = { config: {}, metric: {}, objectLayer };
      Promise.resolve()
        .then(() => {
          selected.config = JSON.parse(
            JSON.stringify(
              this.getJsonElement(
                Array.isArray(objectId)
                  ? objectId.join(`.properties.`)
                  : objectId,
                this.vue.resource[`${objectLayer}s`]
              )
            )
          );
        })
        .then(() => {
          const craftedObjectId = Array.isArray(objectId)
            ? objectId.join(`/properties/`)
            : objectId;
          return this.rest[`${objectLayer}s`].getObjectMetric(craftedObjectId);
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
        // .then(() => this.renderGraph.renderSuccessRate())
        // .then(() => this.renderGraph.renderAvgWaitTime())
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
              // return {
              //   times: [
              //     {
              //       starting_time: Math.floor(
              //         new Date(e.addTime).getTime() / 1000
              //       ),
              //       ending_time: Math.floor(
              //         new Date(e.startTime).getTime() / 1000
              //       ),
              //     },
              //     {
              //       starting_time: Math.floor(
              //         new Date(e.startTime).getTime() / 1000
              //       ),
              //       ending_time: Math.floor(
              //         new Date(e.stopTime || e.rejectTime).getTime() / 1000
              //       ),
              //     },
              //   ],
              // };
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

  getJsonElement(path, obj) {
    console.log(`getJsonElement(${path}):`, obj);
    const pathArr = path.split(`.`);
    if (!obj || !pathArr.length || !obj[pathArr[0]]) return undefined;
    const result = obj[pathArr[0]];
    if (pathArr.slice(1).length) {
      this.console.log(`result:`, result);
      return this.getJsonElement(pathArr.slice(1).join(`.`), result);
    }
    this.console.log(`final result:`, result);
    return result;
  }
}
