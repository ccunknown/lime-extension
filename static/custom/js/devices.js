/* eslint-disable no-nested-ternary */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-alert */
/* eslint-disable no-undef */
export default class PageDevices {
  constructor(extension) {
    this.extension = extension;
    this.console = this.extension.console;
    this.api = this.extension.api;
    this.ui = this.extension.ui;
    this.lastConfig = ``;
    this.meta = {
      "service-id": "devices-service",
      "service-title": "Devices Service",
      "resource-id": "device",
      "resource-title": "Device",
    };
  }

  init(/* config */) {
    this.console.trace(`init() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.initCustomRest())
        .then(() => this.initVue())
        // .then(() => this.initInterval())
        .then(() => this.initRTCPeerSubscribe())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  initRTCPeerSubscribe() {
    this.console.log(`initRTCPeerSubscribe() >>>>>>>>>>>>>>>>>>>>>>>>>>>>> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() =>
          this.extension.rtcpeer.addSubscribe(
            `/service/devices-service/service-device/.*`,
            this.onDeviceSchemaChange.bind(this)
          )
        )
        .then((ret) => resolve(ret))
        .catch((err) => reject(err));
    });
  }

  onDeviceSchemaChange(topic, data) {
    const deviceId = topic
      .split(`/`)
      .filter((e) => e.length)
      .pop();
    this.console.log(
      `[${this.constructor.name}]`,
      `onDeviceSchemaChange(${deviceId}) >> `
    );
    this.console.log(data);
    const { config } = this.vue.resource;
    this.console.log(config[deviceId]);
    config[deviceId] = data;
    this.vue.resource.config = config;
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
        .then(() => this.initDeviceCustomRest())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  initDeviceCustomRest() {
    this.console.log(`initDeviceCustomRest() >> `);
    Object.assign(this.rest, {
      generatePropertyId: (params) => {
        this.console.log(`generatePropertyId() >> `);
        return new Promise((resolve, reject) => {
          Promise.resolve()
            .then(() =>
              this.api.restCall(
                `post`,
                `/api/service/devices-service/config/generate-property-id`,
                params
              )
            )
            .then((res) => resolve(res))
            .catch((err) => reject(err));
        });
      },
      getPropertyMetrics: (deviceId, propertyId) => {
        return new Promise((resolve, reject) => {
          Promise.resolve()
            .then(() =>
              this.api.restCall(
                `get`,
                `/api/service/devices-service/service-device/${deviceId}/properties/${propertyId}/metrics`
              )
            )
            .then((res) => resolve(res))
            .catch((err) => reject(err));
        });
      },
      getMetrics: (id) => {
        return new Promise((resolve, reject) => {
          Promise.resolve()
            .then(() =>
              this.api.restCall(
                `get`,
                `/api/service/devices-service/service-device/${id}/metrics`
              )
            )
            .then((res) => resolve(res))
            .catch((err) => reject(err));
        });
      },
    });
  }

  // initInterval() {
  //   this.console.trace(`initInterval()`);
  //   this.interval = setInterval(() => this.intervalTask(), 5000);
  // }

  // intervalTask() {
  //   this.console.log(`[${this.constructor.name}]`, `intervalTask()`);
  //   return new Promise((resolve, reject) => {
  //     Promise.resolve()
  //     .then(() => this.api.rest.getJson(`/extensions/lime-extension/api/service/devices-service/service-device`))
  //     // .then(() => this.rest.getServicedItem())
  //     .then((config) => {
  //       if(JSON.stringify(config) != JSON.stringify(this.lastConfig)) {
  //         this.console.log(config);
  //         this.vue.resource.config = config;
  //         this.lastConfig = config;
  //       }
  //     })
  //     .then((ret) => resolve(ret))
  //     .catch((err) => reject(err));
  //   });
  // }

  initVue() {
    this.console.trace(`initVue()`);
    const domId = this.ui.said(`content.devices.section`);
    this.console.log(`id : ${domId}`);

    // eslint-disable-next-line no-undef
    this.vue = new Vue({
      el: `#${domId}`,
      data: {
        // Loader
        loader: this.extension.schema,
        // Resource
        resource: {
          deviceConfigSchema: {},
          config: { directory: null, list: [] },
        },
        // UI
        ui: {
          slider: {
            hide: true,
            ready: false,
            "edit-id": null,
            form: {},
            formTemplate: {},
            final: {
              device: {},
              properties: {},
            },
          },
          base: {
            ready: false,
          },
          type: "",
        },
        deviceForm: {},
        propertyForm: {},
        metrics: {},
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
          const conf = confirm(`Are you sure to delete device "${id}"!`);
          if (conf) {
            Promise.resolve()
              .then(() => this.rest.deleteConfig(id))
              .then(() => this.render())
              .then(() => resolve())
              .catch((err) => reject(err));
          } else resolve();
        });
      },
      save: () => {
        this.console.log(`save()`);
        return new Promise((resolve, reject) => {
          this.vue.ui.slider.ready = false;
          this.vue.ui.base.ready = false;
          //  Build final.
          this.vue.ui.slider.final.device = JSON.parse(
            JSON.stringify(this.vue.deviceForm)
          );
          this.vue.ui.slider.final.device.properties = JSON.parse(
            JSON.stringify(this.vue.ui.slider.final.properties)
          );

          const id = this.vue.ui.slider[`edit-id`];
          const config = this.vue.ui.slider.final.device;
          Promise.resolve()
            .then(() =>
              id
                ? this.rest.editConfig(id, config)
                : this.rest.addConfig(config)
            )
            .then(() => this.render())
            .then(() => resolve())
            .catch((err) => reject(err))
            .finally(() => {
              this.vue.ui.slider.ready = true;
            });
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
      showMetrics: (id) => {
        this.console.log(`showMetrics(${id})`);
        return new Promise((resolve, reject) => {
          this.vue.metrics = null;
          this.ui.saidObj(`content.devices.modal.metrics`).modal();
          Promise.resolve()
            .then(() => this.rest.getMetrics(id))
            .then((res) => {
              this.vue.metrics = res;
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
      renderBase: () => {
        this.render();
      },
      renderSlider: () => {
        this.render(false);
      },
      onAlternateChange: () => {
        this.console.log(`onAlternateChange() >> `);
        this.onAlternateChange();
      },
      typeIdentify: (param) => {
        let type;
        if (param.attrs && param.attrs.type) type = param.attrs.type;
        else if (param.enum) type = `select`;
        else if (param.type === `string`) type = `text`;
        else if (param.type === `number`) type = `number`;
        else if (param.type === `boolean`) type = `check`;
        else if (param.type === `object`) type = `object`;
        return type;
      },
      isDisabled: (param) => {
        return !!param.const;
      },
      isEmpty: (json) => {
        return JSON.stringify(json) === `{}`;
      },
      defaultValue: (param) => {
        return param.const
          ? param.const
          : param.default
          ? param.default
          : param.enum && param.enum.length > 0
          ? param.enum[0]
          : param.type === `string`
          ? ``
          : param.type === `number`
          ? param.min
            ? param.min
            : 0
          : param.type === `boolean`
          ? false
          : undefined;
      },
      hasPropertyConfigSchema: () => {
        if (
          this.vue.resource.deviceConfigSchema &&
          this.vue.resource.deviceConfigSchema.properties &&
          this.vue.resource.deviceConfigSchema.properties.properties &&
          JSON.stringify(
            this.vue.resource.deviceConfigSchema.properties.properties
          ) !== `{}`
        )
          return true;
        return false;
      },
      addProperty: (id) => {
        this.console.log(`addProperty()`);
        this.console.log(
          `properties: ${JSON.stringify(this.vue.propertyForm, null, 2)}`
        );

        const params = JSON.parse(JSON.stringify(this.vue.deviceForm));
        params.properties = JSON.parse(JSON.stringify(this.vue.propertyForm));

        if (id) {
          const finalProp = JSON.parse(
            JSON.stringify(this.vue.ui.slider.final.properties)
          );
          finalProp[id] = params.properties;
          this.vue.ui.slider.final.properties = finalProp;
          return id;
        }
        return new Promise((resolve, reject) => {
          Promise.resolve()
            .then(() => this.rest.generatePropertyId(params))
            .then((res) => {
              const resId = res.id;
              const finalProp = JSON.parse(
                JSON.stringify(this.vue.ui.slider.final.properties)
              );
              finalProp[resId] = params.properties;
              finalProp[resId].title = res.title;
              this.vue.ui.slider.final.properties = finalProp;
              return resId;
            })
            .then((retId) => resolve(retId))
            .catch((err) => reject(err));
        });
      },
      editProperty: (id) => {
        this.console.log(`editProperty(${id})`);
        return new Promise((resolve, reject) => {
          if (
            Object.prototype.hasOwnProperty.call(
              this.vue.ui.slider.final.properties,
              id
            )
          ) {
            this.vue.propertyForm = this.vue.ui.slider.final.properties[id];
            Promise.resolve()
              .then(() => this.onAlternateChange())
              /* *** *** Hot fix. *** *** */
              .then(() => {
                this.vue.propertyForm = this.vue.ui.slider.final.properties[id];
              })
              .then(() => this.onAlternateChange())
              /* *** *** *** *** *** *** */
              .then(() =>
                this.ui.saidObj(`content.devices.modal.property`).modal()
              )
              .then(() => resolve())
              .catch((err) => reject(err));
            // eslint-disable-next-line prefer-promise-reject-errors
          } else reject(`Property id "${id}" not found!`);
        });
      },
      removeProperty: (id) => {
        this.console.log(`removeProperty(${id})`);
        const result = {};
        Object.keys(this.vue.ui.slider.final.properties).forEach((i) => {
          if (i !== id) result[i] = this.vue.ui.slider.final.properties[i];
        });
        // for(let i in this.vue.ui.slider.final.properties)
        //   if(i != id)
        //     result[i] = this.vue.ui.slider.final.properties[i];
        this.vue.ui.slider.final.properties = result;
      },
      showPropertyMetrics: (id) => {
        this.console.log(`showPropertyMetrics(${id})`);
        return new Promise((resolve, reject) => {
          this.vue.metrics = null;
          this.ui.saidObj(`content.devices.modal.metrics`).modal();
          Promise.resolve()
            .then(() =>
              this.rest.getPropertyMetrics(this.vue.ui.slider[`edit-id`], id)
            )
            .then((res) => {
              this.vue.metrics = res;
            })
            .then(() => resolve())
            .catch((err) => reject(err));
        });
      },
      objectToText: (obj) => {
        let result = ``;
        Object.keys(obj).forEach((i) => {
          if (typeof obj[i] !== `object`)
            result = `${result === `` ? `` : `${result}/`}${obj[i]}`;
        });
        // for(let i in obj) {
        //   if(typeof obj[i] != `object`)
        //     result = `${(result == ``) ? `` : `${result}/`}${obj[i]}`;
        // }
        return result;
      },
    };
    this.console.log(this.vue);
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
    this.console.trace(`PageDevices: renderNav()`);
  }

  renderBase() {
    this.console.log(`PageDevices: renderBase()`);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => {
          this.vue.ui.base.ready = false;
          this.vue.ui.slider.hide = true;
        })
        .then(() => this.rest.getServicedItem())
        .then((config) => {
          this.vue.resource.config = config;
        })
        .then(() => resolve())
        .catch((err) => reject(err))
        .finally(() => {
          this.vue.ui.base.ready = true;
        });
    });
  }

  renderSlider(name) {
    this.console.log(`PageDevices: renderSlider() >> `);
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
    this.console.log(`PageDevices: renderForm(${id || ``}) >> `);
    return new Promise((resolve, reject) => {
      if (id) {
        Promise.all([this.rest.getItemConfig(id)])
          .then((promArr) => {
            const config = promArr[0];
            this.console.log(`config: ${JSON.stringify(config, null, 2)}`);
            //  Pre-set form (Cleaning).
            this.vue.resource.deviceConfigSchema = {};
            this.vue.ui.slider.final.device = {};
            this.vue.ui.slider.final.properties = {};

            this.vue.deviceForm = config;
            return config;
          })
          .then((config) => this.rest.generateConfigSchema(config))
          .then((schema) => {
            this.vue.resource.deviceConfigSchema = schema;
          })
          .then(() => {
            Object.keys(this.vue.deviceForm.properties).forEach((i) => {
              this.vue.propertyForm = JSON.parse(
                JSON.stringify(this.vue.deviceForm.properties[i])
              );
              this.vue.fn.addProperty(i);
            });
          })
          .then(() => this.onAlternateChange())
          .then(() => resolve())
          .catch((err) => reject(err));
      } else {
        //  Pre-set form (Cleaning).
        this.vue.resource.deviceConfigSchema = {};
        this.vue.ui.slider.final.device = {};
        this.vue.ui.slider.final.properties = {};

        this.vue.deviceForm = {};
        this.vue.propertyForm = {};
        Promise.resolve()
          .then(() => this.onAlternateChange())
          .then(() => resolve())
          .catch((err) => reject(err));
      }
    });
  }

  // onAlternateChange() {
  //   this.console.log(`onAlternateChange() >> `);
  //   return new Promise(async (resolve, reject) => {
  //     const config = JSON.parse(JSON.stringify(this.vue.deviceForm));
  //     config.properties = JSON.parse(JSON.stringify(this.vue.propertyForm));

  //     const schema = await this.rest.generateConfigSchema(config);
  //     const oldSchema = JSON.parse(
  //       JSON.stringify(this.vue.resource.deviceConfigSchema)
  //     );
  //     this.vue.resource.deviceConfigSchema = JSON.parse(JSON.stringify(schema));

  //     const deviceGen = await this.ui.generateData(schema);
  //     const vueDevTemp = JSON.parse(JSON.stringify(this.vue.deviceForm));
  //     // let deviceCopy = this.jsonCopy(vueDevTemp, deviceGen);
  //     const copySchema = this.jsonDiv(
  //       oldSchema.properties ? oldSchema.properties : {},
  //       schema.properties,
  //       { level: 1 }
  //     );
  //     const deviceCopy = this.jsonCopyBySchema(
  //       vueDevTemp,
  //       deviceGen,
  //       copySchema
  //     );
  //     this.console.log(`oldSchema`, JSON.parse(JSON.stringify(oldSchema)));
  //     this.console.log(`newSchema`, schema);
  //     this.console.log(`copySchema: `, copySchema);
  //     this.console.log(`deviceCopy: ${deviceCopy}`);
  //     this.console.log(`deviceGen: `, deviceGen);
  //     this.vue.deviceForm = vueDevTemp;

  //     let propertyCopy = false;
  //     if (
  //       schema.properties &&
  //       schema.properties.properties &&
  //       schema.properties.properties.patternProperties
  //     ) {
  //       this.console.log(
  //         schema.properties.properties.patternProperties[`^[^\n]+$`].properties
  //       );
  //       const propertyGen = await this.ui.generateData(
  //         schema.properties.properties.patternProperties[`^[^\n]+$`]
  //       );
  //       const vuePropTemp = JSON.parse(JSON.stringify(this.vue.propertyForm));
  //       this.console.log(`vuePropTemp: `, JSON.stringify(vuePropTemp, null, 2));
  //       this.console.log(`propertyGen: `, JSON.stringify(propertyGen, null, 2));
  //       const oldPropertySchema =
  //         oldSchema &&
  //         oldSchema.properties &&
  //         oldSchema.properties.properties &&
  //         oldSchema.properties.properties.patternProperties &&
  //         oldSchema.properties.properties.patternProperties[`^[^\n]+$`]
  //           ? oldSchema.properties.properties.patternProperties[`^[^\n]+$`]
  //               .properties
  //           : {};
  //       const propSchema = this.jsonDiv(
  //         oldPropertySchema,
  //         schema.properties.properties.patternProperties[`^[^\n]+$`].properties,
  //         { level: 1 }
  //       );
  //       propertyCopy = this.jsonCopyBySchema(
  //         vuePropTemp,
  //         propertyGen,
  //         propSchema
  //       );
  //       this.vue.propertyForm = vuePropTemp;
  //       this.console.log(
  //         `propertyForm: `,
  //         JSON.stringify(vuePropTemp, null, 2)
  //       );
  //     }

  //     if (deviceCopy || propertyCopy) await this.onAlternateChange();

  //     resolve();
  //   });
  // }

  onAlternateChange() {
    this.console.log(`onAlternateChange() >> `);
    return new Promise((resolve, reject) => {
      const config = JSON.parse(JSON.stringify(this.vue.deviceForm));
      config.properties = JSON.parse(JSON.stringify(this.vue.propertyForm));
      const oldSchema = JSON.parse(
        JSON.stringify(this.vue.resource.deviceConfigSchema)
      );
      let schema;
      let copySchema;
      let deviceGen;
      let deviceCopy;
      let vueDevTemp;
      let propertyGen;
      let propertyCopy = false;
      let vuePropTemp;

      Promise.resolve()
        .then(() => this.rest.generateConfigSchema(config))
        .then((s) => {
          schema = s;
        })
        .then(() => {
          this.vue.resource.deviceConfigSchema = JSON.parse(
            JSON.stringify(schema)
          );
        })
        .then(() => this.ui.generateData(schema))
        .then((devGen) => {
          deviceGen = devGen;
        })
        .then(() => {
          vueDevTemp = JSON.parse(JSON.stringify(this.vue.deviceForm));
          // let deviceCopy = this.jsonCopy(vueDevTemp, deviceGen);
          copySchema = this.jsonDiv(
            oldSchema.properties ? oldSchema.properties : {},
            schema.properties,
            { level: 1 }
          );
          deviceCopy = this.jsonCopyBySchema(vueDevTemp, deviceGen, copySchema);
          this.console.log(`oldSchema`, JSON.parse(JSON.stringify(oldSchema)));
          this.console.log(`newSchema`, schema);
          this.console.log(`copySchema: `, copySchema);
          this.console.log(`deviceCopy: ${deviceCopy}`);
          this.console.log(`deviceGen: `, deviceGen);
          this.vue.deviceForm = vueDevTemp;
        })
        .then(
          () =>
            (schema.properties &&
              schema.properties.properties &&
              schema.properties.properties.patternProperties) ||
            (() => {
              throw new Error(`err`);
            })()
        )
        .then(
          () => {
            this.console.log(
              schema.properties.properties.patternProperties[`^[^\n]+$`]
                .properties
            );
            return Promise.resolve()
              .then(() =>
                this.ui.generateData(
                  schema.properties.properties.patternProperties[`^[^\n]+$`]
                )
              )
              .then((propGen) => {
                propertyGen = propGen;
              })
              .then(() => {
                vuePropTemp = JSON.parse(JSON.stringify(this.vue.propertyForm));
                this.console.log(
                  `vuePropTemp: `,
                  JSON.stringify(vuePropTemp, null, 2)
                );
                this.console.log(
                  `propertyGen: `,
                  JSON.stringify(propertyGen, null, 2)
                );
                const oldPropertySchema =
                  oldSchema &&
                  oldSchema.properties &&
                  oldSchema.properties.properties &&
                  oldSchema.properties.properties.patternProperties &&
                  oldSchema.properties.properties.patternProperties[`^[^\n]+$`]
                    ? oldSchema.properties.properties.patternProperties[
                        `^[^\n]+$`
                      ].properties
                    : {};
                const propSchema = this.jsonDiv(
                  oldPropertySchema,
                  schema.properties.properties.patternProperties[`^[^\n]+$`]
                    .properties,
                  { level: 1 }
                );
                propertyCopy = this.jsonCopyBySchema(
                  vuePropTemp,
                  propertyGen,
                  propSchema
                );
                this.vue.propertyForm = vuePropTemp;
                this.console.log(
                  `propertyForm: `,
                  JSON.stringify(vuePropTemp, null, 2)
                );
              })
              .catch((err) => {
                throw err;
              });
          },
          () => {}
        )
        .then(() =>
          resolve(deviceCopy || propertyCopy ? this.onAlternateChange() : {})
        )
        .catch((err) => reject(err));
    });
  }

  jsonCopyBySchema(dst, source, schema) {
    const src = JSON.parse(JSON.stringify(source));
    let copyFlag = false;
    Object.keys(schema).forEach((i) => {
      if (schema[i] === true) {
        // eslint-disable-next-line no-param-reassign
        dst[i] = [`object`, `array`].includes(typeof src[i])
          ? JSON.parse(JSON.stringify(src[i]))
          : src[i];
        copyFlag = true;
      } else if ([`object`, `array`].includes(typeof schema[i]))
        copyFlag = this.jsonCopyBySchema(dst[i], src[i], schema[i]) || copyFlag;
    });
    return copyFlag;
  }

  jsonDiv(dst, src, options) {
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
