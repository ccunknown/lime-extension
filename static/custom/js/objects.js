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
      craftObjectStatus: (state) => {
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
      clickObject: (id, objectLayer) => {
        this.vue.ui.base.activeId = id;
        this.console.log(`click object '${id}' layer '${objectLayer}'`);
        this.console.log(`info:`, this.vue.resource[`${objectLayer}s`][id]);
        return this.renderBaseMain(id, objectLayer);
      },
      toggleQuickFilter: (id) => {
        if (this.vue.ui.base.quickFilter.includes(id))
          this.vue.ui.base.quickFilter = this.vue.ui.base.quickFilter.filter(
            (e) => e !== id
          );
        else this.vue.ui.base.quickFilter.push(id);
      },
      metric: {
        dataTimeRange: () => {
          this.console.log(`uptimeString()`);
          const { metric } = this.vue.ui.base.selected;
          const s = Math.floor(
            (new Date(metric.timeRange.stop) - new Date(metric.timeRange.start)) / 1000
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
        renderServeQuality: () => {
          // eslint-disable-next-line no-undef
          const svg = d3.select(
            this.ui.said(`content.objects.basemain.chart.servequality`)
          );
        },
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
              ...{ objectLayer: `device` },
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
              ...{ objectLayer: `engine` },
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
              ...{ objectLayer: `ioport` },
            };
          });
        })
        // Combine devices, engines and sysport to objects.
        .then(() => {
          this.vue.resource.objects = {
            ...this.vue.resource.devices,
            ...this.vue.resource.engines,
            ...this.vue.resource.ioports,
          };
          this.console.log(`objects`, this.vue.resource.objects);
        })
        .catch((err) => this.console.error(err))
        .finally(() => {
          this.vue.ui.base.ready = true;
          resolve();
        });
    });
  }

  renderBaseMain(objectId, objectLayer) {
    this.console.log(
      `[${this.constructor.name}]`,
      `renderBaseMain(${objectId})`
    );
    return new Promise((resolve) => {
      const selected = { config: {}, metric: {} };
      Promise.resolve()
        .then(() => {
          selected.config = JSON.parse(
            JSON.stringify(this.vue.resource[`${objectLayer}s`][objectId])
          );
        })
        .then(() => this.rest[`${objectLayer}s`].getObjectMetric(objectId))
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
            metric.activeTime.list
              .map((e) => {
                return {
                  // start: Math.floor(new Date(e.startTime).getTime() / 1000),
                  // end: Math.floor(new Date(e.stopTime || e.rejectTime).getTime() / 1000),
                  start: new Date(e.startTime).getTime(),
                  end: new Date(e.stopTime || e.rejectTime).getTime(),
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
              })
              // .filter((e, i) => i < 5)
          )
        )
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  // getRenderGraphFunction() {
  //   return {
  //     renderSuccessRate: () => {
  //       this.console.log(`renderSuccessRate()`);
  //       const { metric } = this.vue.ui.base.selected;
  //       const id = this.ui.said(`content.objects.basemain.chart.successrate`);
  //       this.console.log(`id:`, id);
  //       // eslint-disable-next-line no-undef
  //       const dom = document.getElementById(id);
  //       dom.style.width = "150px";
  //       dom.style.height = "150px";
  //       this.console.log(dom);
  //       const margin = 10;
  //       const width = dom.offsetWidth;
  //       const height = dom.offsetHeight;
  //       const radius = Math.min(width, height) / 2 - margin;
  //       // const thickness = Math.floor(radius * 0.2);

  //       const calcPercent = (percent) => {
  //         return [percent, 100 - percent];
  //       };
  //       const duration = 1500;
  //       // const transition = 200;
  //       const percent =
  //         (metric.jobs.success / (metric.jobs.success + metric.jobs.fail)) *
  //         100;

  //       const dataset = {
  //         lower: calcPercent(0),
  //         upper: calcPercent(percent),
  //       };
  //       const pie = d3.pie().sort(null);
  //       const format = d3.format(".0%");

  //       const arc = d3
  //         .arc()
  //         .innerRadius(radius * 0.8)
  //         .outerRadius(radius);

  //       d3.select("#extension-lime-content-objects-basemain-chart-successrate")
  //         .selectAll("*")
  //         .remove();

  //       const svg = d3
  //         .select("#extension-lime-content-objects-basemain-chart-successrate")
  //         .append("svg")
  //         .attr("width", width)
  //         .attr("height", height)
  //         .append("g")
  //         .attr("transform", `translate(${width / 2}, ${height / 2})`);

  //       const color = d3.scaleOrdinal().range([`#3CC692`, `#D95F02`]);

  //       this.chartAnimate = this.chartAnimate || {};
  //       this.chartAnimate.successRate = this.chartAnimate.successRate || {};
  //       let path = svg
  //         .selectAll("path")
  //         .data(pie(dataset.lower))
  //         .enter()
  //         .append(`path`)
  //         .attr(`fill`, function(d, i) {
  //           return color(i);
  //         })
  //         .attr("d", arc)
  //         .each(function (d) {
  //           // this.chartAnimate.successRate.current = d;
  //           this._current = d;
  //         });

  //       const text = svg
  //         .append("text")
  //         .attr("text-anchor", "middle")
  //         .attr("dy", "1.0em")
  //         .attr("fill", `#343a40`)
  //         .attr(`stroke`, `#343a40`);

  //       const text2 = svg
  //         .append("text")
  //         .attr("text-anchor", "middle")
  //         .attr("dy", "0em")
  //         .attr("fill", `#343a40`)
  //         .attr(`stroke`, `#343a40`)
  //         .style(`font-size`, `1.2rem`);
  //       text2.text(`Success Rate`);

  //       const progress = 0;

  //       const timeout = setTimeout(function () {
  //         clearTimeout(timeout);
  //         path
  //           .transition()
  //           .duration(duration)
  //           .attrTween("d", function (a) {
  //             const i = d3.interpolate(
  //               // this.chartAnimate.successRate.current,
  //               this._current,
  //               a
  //             );
  //             const i2 = d3.interpolate(progress, percent);
  //             // this.chartAnimate.successRate.current = i(0);
  //             this._current = i(0);
  //             return function (t) {
  //               text.text(format(i2(t) / 100));
  //               return arc(i(t));
  //             };
  //           });
  //         path = path.data(pie(dataset.upper));
  //       }, 200);
  //     },

  //     renderAvgWaitTime: () => {
  //       this.console.log(`renderAvgWaitTime()`);
  //       const { metric } = this.vue.ui.base.selected;
  //       const id = this.ui.said(`content.objects.basemain.chart.successrate`);
  //       this.console.log(`id:`, id);
  //       // eslint-disable-next-line no-undef
  //       const dom = document.getElementById(id);
  //       dom.style.width = "150px";
  //       dom.style.height = "150px";
  //       this.console.log(dom);
  //       const margin = 10;
  //       const width = dom.offsetWidth;
  //       const height = dom.offsetHeight;
  //       const radius = Math.min(width, height) / 2 - margin;
  //       // const thickness = Math.floor(radius * 0.2);

  //       const calcPercent = (percent) => {
  //         return [percent, 100 - percent];
  //       };
  //       const duration = 1500;
  //       // const transition = 200;
  //       const percent =
  //         (metric.jobs.averageWaitingTime /
  //           (metric.jobs.averageWaitingTime + metric.jobs.averageServiceTime)) *
  //         100;

  //       const dataset = {
  //         lower: calcPercent(0),
  //         upper: calcPercent(percent),
  //       };
  //       const pie = d3.pie().sort(null);
  //       const format = d3.format(".0%");

  //       const arc = d3
  //         .arc()
  //         .innerRadius(radius * 0.8)
  //         .outerRadius(radius);

  //       d3.select("#extension-lime-content-objects-basemain-chart-avgwaittime")
  //         .selectAll("*")
  //         .remove();

  //       const svg = d3
  //         .select("#extension-lime-content-objects-basemain-chart-avgwaittime")
  //         .append("svg")
  //         .attr("width", width)
  //         .attr("height", height)
  //         .append("g")
  //         .attr("transform", `translate(${width / 2}, ${height / 2})`);

  //       const color = d3.scaleOrdinal().range([`#566573`, `#3CC692`]);

  //       // this.chartAnimate = this.chartAnimate || {};
  //       // this.chartAnimate.successRate = this.chartAnimate.successRate || {};
  //       let path = svg
  //         .selectAll("path")
  //         .data(pie(dataset.lower))
  //         .enter()
  //         .append(`path`)
  //         .attr(`fill`, function(d, i) {
  //           return color(i);
  //         })
  //         .attr("d", arc)
  //         .each(function (d) {
  //           // this.chartAnimate.successRate.current = d;
  //           this._current = d;
  //         });

  //       const textWaitLabel = svg
  //         .append("text")
  //         .attr("text-anchor", "middle")
  //         .attr("dy", "-2em")
  //         .attr("fill", `#343a40`)
  //         .attr(`stroke`, `#343a40`)
  //         .style(`font-size`, `1.2rem`);
  //       textWaitLabel.text(`Wait Time`);

  //       const textWait = svg
  //         .append("text")
  //         .attr("text-anchor", "middle")
  //         .attr("dy", "-0.5em")
  //         .attr("fill", `#343a40`)
  //         .attr(`stroke`, `#343a40`);

  //       const textServeLabel = svg
  //         .append("text")
  //         .attr("text-anchor", "middle")
  //         .attr("dy", "1.2em")
  //         .attr("fill", `#343a40`)
  //         .attr(`stroke`, `#343a40`)
  //         .style(`font-size`, `1.2rem`);
  //       textServeLabel.text(`Process Time`);

  //       const textServe = svg
  //         .append("text")
  //         .attr("text-anchor", "middle")
  //         .attr("dy", "2em")
  //         .attr("fill", `#343a40`)
  //         .attr(`stroke`, `#343a40`);

  //       const progress = 0;

  //       const timeout = setTimeout(function () {
  //         clearTimeout(timeout);
  //         path
  //           .transition()
  //           .duration(duration)
  //           .attrTween("d", function (a) {
  //             const i = d3.interpolate(
  //               // this.chartAnimate.successRate.current,
  //               this._current,
  //               a
  //             );
  //             const i2 = d3.interpolate(progress, percent);
  //             // this.chartAnimate.successRate.current = i(0);
  //             this._current = i(0);
  //             return function (t) {
  //               textWait.text(format(i2(t) / 100));
  //               textServe.text(format((100 - i2(t)) / 100));
  //               return arc(i(t));
  //             };
  //           });
  //         path = path.data(pie(dataset.upper));
  //       }, 200);
  //     },
  //   };
  // }

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
