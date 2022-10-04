/* eslint-disable class-methods-use-this */
const { EventEmitter } = require("events");

const Crypto = require(`crypto`);

// eslint-disable-next-line import/no-extraneous-dependencies
const { APIHandler, APIResponse } = require("gateway-addon");
const { Errors } = require("../constants/constants");
// const manifest = require('../manifest.json');

// const util = require('util');

class RoutesManager extends APIHandler {
  constructor(extension) {
    super(extension.addonManager, extension.manifest.id);
    this.configManager = extension.configManager;
    this.laborsManager = extension.laborsManager;

    this.event = new EventEmitter();
    this.historyService = null;

    this.setRouter();
  }

  setRouter() {
    this.router = [
      /* **  Resource : /config  ** */
      {
        resource: /\/config/,
        method: {
          // eslint-disable-next-line no-unused-vars
          GET: (req) => {
            return new Promise((resolve) => {
              Promise.resolve()
                .then(() => this.configManager.getConfig())
                .then((conf) => {
                  // console.log(`conf : ${JSON.stringify(conf, null, 2)}`);
                  resolve(this.makeJsonRespond(JSON.stringify(conf)));
                })
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          POST: (req) => {
            return new Promise((resolve) => {
              const params = this.getParameters(req);
              Promise.resolve()
                .then(() =>
                  this.configManager.addToConfig(req.body, params.path)
                )
                .then((res) =>
                  resolve(this.makeJsonRespond(JSON.stringify(res)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          PUT: (req) => {
            return new Promise((resolve) => {
              Promise.resolve()
                .then(() => this.configManager.saveConfig(req.body))
                .then((conf) =>
                  resolve(this.makeJsonRespond(JSON.stringify(conf)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          PATCH: (req) => {
            return new Promise((resolve) => {
              const params = this.getParameters(req);
              Promise.resolve()
                .then(() =>
                  this.configManager.updateConfig(req.body, params.path)
                )
                .then((res) =>
                  resolve(this.makeJsonRespond(JSON.stringify(res)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          DELETE: (req) => {
            return new Promise((resolve) => {
              const params = this.getParameters(req);
              // if(this.configManager.isEmptyObject(params)) {
              //   Promise.resolve()
              //   .then(() => this.configManager.deleteConfig())
              //   .then((res) => resolve(this.makeJsonRespond(JSON.stringify(res))))
              //   .catch((err) => resolve(this.catchErrorRespond(err)));
              // }
              // else {
              //   Promise.resolve()
              //   .then(() => this.configManager.deleteConfig(params.path))
              //   .then((res) => resolve(this.makeJsonRespond(JSON.stringify(res))))
              //   .catch((err) => resolve(this.catchErrorRespond(err)));
              // }
              Promise.resolve()
                .then(() =>
                  this.configManager.deleteConfig(
                    this.configManager.isEmptyObject(params)
                      ? undefined
                      : params.path
                  )
                )
                .then((res) =>
                  resolve(this.makeJsonRespond(JSON.stringify(res)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /hash/sha256/config
      {
        resource: /\/hash\/sha256\/config/,
        method: {
          GET: () => {
            return new Promise((resolve) => {
              Promise.resolve()
                .then(() => this.configManager.getConfig())
                .then((config) => {
                  return {
                    hash: "sha256",
                    digest: "hex",
                    value: Crypto.createHash(`sha256`)
                      .update(JSON.stringify(config))
                      .digest(`hex`),
                  };
                })
                .then((res) =>
                  resolve(this.makeJsonRespond(JSON.stringify(res)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /schema
      {
        resource: /\/schema/,
        method: {
          GET: () => {
            return new Promise((resolve) => {
              try {
                const schema = this.configManager.getSchema();
                resolve(this.makeJsonRespond(JSON.stringify(schema)));
              } catch (err) {
                resolve(this.catchErrorRespond(err));
              }
            });
          },
        },
      },

      //  Resource : /service
      {
        resource: /\/service/,
        method: {
          GET: () => {
            return new Promise((resolve) => {
              Promise.resolve()
                .then(() =>
                  this.laborsManager.getService().map((service) => {
                    return {
                      id: service.id,
                      enable: service.enable,
                      status: service.status,
                      description: service.description
                        ? service.description
                        : ``,
                    };
                  })
                )
                .then((servList) =>
                  resolve(this.makeJsonRespond(JSON.stringify(servList)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /service/devices-service/devicesConfigSchema
      {
        resource: /\/service\/devices-service\/config\/generate-schema/,
        method: {
          POST: (req) => {
            return new Promise((resolve) => {
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`devices-service`)
                    .obj.generateConfigSchema(req.body)
                )
                .then((json) => {
                  // console.log(`device list : ${JSON.stringify(json, null, 2)}`);
                  resolve(this.makeJsonRespond(JSON.stringify(json)));
                })
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /service/devices-service/config/generatePropertyId
      {
        resource: /\/service\/devices-service\/config\/generate-property-id/,
        method: {
          POST: (req) => {
            return new Promise((resolve) => {
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`devices-service`)
                    .obj.generatePropertyId(req.body)
                )
                .then((res) => {
                  console.log(`propId: ${JSON.stringify(res, null, 2)}`);
                  resolve(this.makeJsonRespond(JSON.stringify(res)));
                })
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /service/devices-service/config/translate
      {
        resource: /\/service\/devices-service\/config\/translate/,
        method: {
          POST: (req) => {
            return new Promise((resolve) => {
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`devices-service`)
                    .obj.translateConfig(req.body)
                )
                .then((json) => {
                  // console.log(`device list : ${JSON.stringify(json, null, 2)}`);
                  resolve(this.makeJsonRespond(JSON.stringify(json)));
                })
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /service/devices-service/config/validate
      {
        resource: /\/service\/devices-service\/config\/validate/,
        method: {
          POST: (req) => {
            return new Promise((resolve) => {
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`devices-service`)
                    .obj.configTranslator.validate(req.body)
                )
                .then((json) =>
                  resolve(this.makeJsonRespond(JSON.stringify(json)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /service/devices-service/service-device
      {
        resource: /\/service\/devices-service\/service-device/,
        method: {
          GET: () => {
            return new Promise((resolve) => {
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`devices-service`)
                    .obj.objects.getServicing()
                )
                .then((devices) =>
                  resolve(this.makeJsonRespond(JSON.stringify(devices)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /service/devices-service/service-device/{id}
      {
        resource: /\/service\/devices-service\/service-device\/[^/]+/,
        method: {
          GET: (req) => {
            return new Promise((resolve) => {
              const id = req.path.split(`/`).pop();
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`devices-service`)
                    .obj.objects.getServicing(id)
                )
                .then((devices) =>
                  resolve(this.makeJsonRespond(JSON.stringify(devices)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /service/devices-service/system-device/{device-id}/metrics
      {
        resource: /\/service\/devices-service\/service-device\/[^/]+\/metrics/,
        method: {
          GET: (req) => {
            return new Promise((resolve) => {
              const pathArr = req.path.split(`/`);
              pathArr.pop();
              const id = pathArr.pop();

              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`devices-service`)
                    .obj.objects.get(id, { object: true })
                )
                // .then((device) => device.getMetrics())
                .then((device) => device.generateMetric())
                .then((res) =>
                  resolve(this.makeJsonRespond(JSON.stringify(res)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /service/devices-service/system-device/{device-id}/properties/{property-id}/metrics  ***/
      {
        resource:
          /\/service\/devices-service\/service-device\/[^/]+\/properties\/[^/]+\/metrics/,
        method: {
          GET: (req) => {
            return new Promise((resolve) => {
              const pathArr = req.path.split(`/`);
              pathArr.pop();
              const propertyId = pathArr.pop();
              pathArr.pop();
              const deviceId = pathArr.pop();

              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`devices-service`)
                    .obj.objects.get(deviceId, { object: true })
                )
                // .then((device) => device.getPropertyMetrics(propertyId))
                .then((device) => {
                  if (!device) throw new Errors.ObjectNotFound(deviceId);
                  return device.oo.getChild(propertyId);
                })
                .then((property) => {
                  if (!property) throw new Errors.ObjectNotFound(propertyId);
                  console.log(
                    `property constructor:`,
                    property.constructor.name
                  );
                  return property.mb.buildMetric();
                })

                .then((res) =>
                  resolve(this.makeJsonRespond(JSON.stringify(res)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /service/devices-service/service-device/{id}/{cmd}
      {
        resource: /\/service\/devices-service\/service-device\/[^/]+\/[^/]+/,
        method: {
          GET: (req) => {
            return new Promise((resolve) => {
              const devicesService =
                this.laborsManager.getService(`devices-service`).obj;
              const pathArr = req.path.split(`/`);
              const cmd = pathArr.pop();
              const id = pathArr.pop();
              if (cmd === `start`) {
                Promise.resolve()
                  .then(() =>
                    this.laborsManager
                      .getService(`devices-service`)
                      .obj.objects.start(id)
                  )
                  .then(() => resolve(this.makeJsonRespond(JSON.stringify({}))))
                  .catch((err) => resolve(this.catchErrorRespond(err)));
              } else if (cmd === `stop`) {
                Promise.resolve()
                  .then(() =>
                    this.laborsManager
                      .getService(`devices-service`)
                      .obj.objects.stop(id)
                  )
                  .then(() => resolve(this.makeJsonRespond(JSON.stringify({}))))
                  .catch((err) => resolve(this.catchErrorRespond(err)));
              } else if (cmd === `add-to-service`) {
                Promise.resolve()
                  .then(() =>
                    devicesService.objectFunctions.patchConfig(id, {
                      enable: true,
                    })
                  )
                  .then(() =>
                    devicesService.addToService(id, null, { chain: true })
                  )
                  .then((res) =>
                    resolve(this.makeJsonRespond(JSON.stringify(res)))
                  )
                  .catch((err) => resolve(this.catchErrorRespond(err)));
              } else if (cmd === `add-to-service-chain`) {
                Promise.resolve()
                  .then(() =>
                    devicesService.objectFunctions.patchConfig(id, {
                      enable: true,
                    })
                  )
                  .then(() => devicesService.addToService(id))
                  .then((res) =>
                    resolve(this.makeJsonRespond(JSON.stringify(res)))
                  )
                  .catch((err) => resolve(this.catchErrorRespond(err)));
              } else if (cmd === `remove-from-service`) {
                Promise.resolve()
                  .then(() =>
                    devicesService.objectFunctions.patchConfig(id, {
                      enable: false,
                    })
                  )
                  .then(() => devicesService.removeFromService(id))
                  .then((res) =>
                    resolve(this.makeJsonRespond(JSON.stringify(res)))
                  )
                  .catch((err) => resolve(this.catchErrorRespond(err)));
              } else
                resolve(this.catchErrorRespond(new Errors.PathInvalid(cmd)));
            });
          },
        },
      },

      //  Resource : /service/devices-service/config-device
      {
        resource: /\/service\/devices-service\/config-device/,
        method: {
          GET: () => {
            return new Promise((resolve) => {
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`devices-service`)
                    .obj.objects.getConfig()
                )
                .then((devices) =>
                  resolve(this.makeJsonRespond(JSON.stringify(devices)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          POST: (req) => {
            return new Promise((resolve) => {
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`devices-service`)
                    .obj.objects.add(req.body)
                )
                .then((json) =>
                  resolve(this.makeJsonRespond(JSON.stringify(json)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /service/devices-service/config-device/{id}
      {
        resource: /\/service\/devices-service\/config-device\/[^/]+/,
        method: {
          GET: (req) => {
            return new Promise((resolve) => {
              const id = req.path.split(`/`).pop();
              this.laborsManager
                .getService(`devices-service`)
                .obj.objects.getConfig(id)
                .then((device) =>
                  resolve(this.makeJsonRespond(JSON.stringify(device)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          PUT: (req) => {
            return new Promise((resolve) => {
              const id = req.path.split(`/`).pop();
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`devices-service`)
                    .obj.objects.update(id, req.body)
                )
                .then((json) =>
                  resolve(this.makeJsonRespond(JSON.stringify(json)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          DELETE: (req) => {
            return new Promise((resolve) => {
              const id = req.path.split(`/`).pop();
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`devices-service`)
                    .obj.objects.remove(id)
                )
                .then((json) => {
                  // console.log(`device list : ${JSON.stringify(json, null, 2)}`);
                  resolve(this.makeJsonRespond(JSON.stringify(json)));
                })
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /service/scripts
      {
        resource: /\/service\/scripts/,
        method: {
          GET: () => {
            return new Promise((resolve) => {
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`scripts-service`)
                    .obj.get(null, { deep: true })
                )
                .then((json) => {
                  // console.log(`script list : ${JSON.stringify(json, null, 2)}`);
                  resolve(this.makeJsonRespond(JSON.stringify(json)));
                })
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          PUT: (req) => {
            return new Promise((resolve) => {
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`scripts-service`)
                    .obj.create(req.body, `scripts`)
                )
                .then((conf) =>
                  resolve(this.makeJsonRespond(JSON.stringify(conf)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          DELETE: () => {
            return new Promise((resolve) => {
              Promise.resolve()
                .then(() => this.configManager.saveConfig({}))
                .then((conf) =>
                  resolve(this.makeJsonRespond(JSON.stringify(conf)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /service/scripts/{name}
      {
        resource: /\/service\/scripts\/[^/]+/,
        method: {
          GET: (req) => {
            return new Promise((resolve) => {
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`scripts-service`)
                    .obj.get(req.path.split(`/`).pop(), {
                      base64: true,
                      deep: true,
                    })
                )
                .then((json) => {
                  // console.log(`script list : ${JSON.stringify(json, null, 2)}`);
                  resolve(this.makeJsonRespond(JSON.stringify(json)));
                })
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          DELETE: (req) => {
            return new Promise((resolve) => {
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`scripts-service`)
                    .obj.delete(req.path.split(`/`).pop())
                )
                .then((res) =>
                  resolve(this.makeJsonRespond(JSON.stringify(res)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /service/engines-service/config/generate-schema
      {
        resource: /\/service\/engines-service\/config\/generate-schema/,
        method: {
          POST: (req) => {
            return new Promise((resolve) => {
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`engines-service`)
                    .obj.generateConfigSchema(req.body)
                )
                .then((json) => {
                  resolve(this.makeJsonRespond(JSON.stringify(json)));
                })
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /service/engines-service/service-engine
      {
        resource: /\/service\/engines-service\/service-engine/,
        method: {
          GET: () => {
            return new Promise((resolve) => {
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`engines-service`)
                    // .obj.getServiceEngine()
                    .obj.objects.getServicing()
                )
                .then((engines) =>
                  resolve(this.makeJsonRespond(JSON.stringify(engines)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /service/engines-service/system-engine/{id}
      {
        resource: /\/service\/engines-service\/service-engine\/[^/]+/,
        method: {
          GET: (req) => {
            return new Promise((resolve) => {
              const id = req.path.split(`/`).pop();

              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`engines-service`)
                    .obj.objects.getServicing(id)
                )
                .then((engines) =>
                  resolve(this.makeJsonRespond(JSON.stringify(engines)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /service/engines-service/system-engine/{id}/{cmd}
      {
        resource: /\/service\/engines-service\/service-engine\/[^/]+\/[^/]+/,
        method: {
          GET: (req) => {
            return new Promise((resolve) => {
              const pathArr = req.path.split(`/`);
              const cmd = pathArr.pop();
              const id = pathArr.pop();
              const enginesService =
                this.laborsManager.getService(`engines-service`).obj;
              if (cmd === `start`) {
                Promise.resolve()
                  .then(() =>
                    this.laborsManager
                      .getService(`engines-service`)
                      .obj.objects.start(id)
                  )
                  .then(() => resolve(this.makeJsonRespond(JSON.stringify({}))))
                  .catch((err) => resolve(this.catchErrorRespond(err)));
              } else if (cmd === `stop`) {
                Promise.resolve()
                  .then(() =>
                    this.laborsManager
                      .getService(`engines-service`)
                      .obj.objects.stop(id)
                  )
                  .then(() => resolve(this.makeJsonRespond(JSON.stringify({}))))
                  .catch((err) => resolve(this.catchErrorRespond(err)));
              } else if (cmd === `add-to-service`) {
                Promise.resolve()
                  .then(() =>
                    enginesService.objectFunctions.patchConfig(id, {
                      addToService: true,
                    })
                  )
                  .then(() => enginesService.addToService(id))
                  .then((res) =>
                    resolve(this.makeJsonRespond(JSON.stringify(res)))
                  )
                  .catch((err) => resolve(this.catchErrorRespond(err)));
              } else if (cmd === `remove-from-service`) {
                Promise.resolve()
                  .then(() =>
                    enginesService.objectFunctions.patchConfig(id, {
                      addToService: false,
                    })
                  )
                  .then(() => enginesService.removeFromService(id))
                  .then((res) =>
                    resolve(this.makeJsonRespond(JSON.stringify(res)))
                  )
                  .catch((err) => resolve(this.catchErrorRespond(err)));
              } else
                resolve(this.catchErrorRespond(new Errors.PathInvalid(cmd)));
            });
          },
        },
      },

      // Resource : /service/engines-service/config-engine
      {
        resource: /\/service\/engines-service\/config-engine/,
        method: {
          GET: () => {
            return new Promise((resolve) => {
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`engines-service`)
                    .obj.objects.get()
                )
                .then((engines) =>
                  resolve(this.makeJsonRespond(JSON.stringify(engines)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          POST: (req) => {
            return new Promise((resolve) => {
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`engines-service`)
                    .obj.objects.add(req.body)
                )
                .then((engine) =>
                  resolve(this.makeJsonRespond(JSON.stringify(engine)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /service/engines-service/config-engine/{{id}}
      {
        resource: /\/service\/engines-service\/config-engine\/[^/]+/,
        method: {
          GET: (req) => {
            return new Promise((resolve) => {
              const id = decodeURI(req.path.split(`/`).pop());
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`engines-service`)
                    .obj.objects.get(id)
                )
                .then((engine) =>
                  resolve(this.makeJsonRespond(JSON.stringify(engine)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          PUT: (req) => {
            return new Promise((resolve) => {
              const id = decodeURI(req.path.split(`/`).pop());
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`engines-service`)
                    .obj.objects.update(id, req.body)
                )
                .then((engine) =>
                  resolve(this.makeJsonRespond(JSON.stringify(engine)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          DELETE: (req) => {
            return new Promise((resolve) => {
              const id = decodeURI(req.path.split(`/`).pop());
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`engines-service`)
                    .obj.objects.remove(id)
                )
                .then((engine) =>
                  resolve(this.makeJsonRespond(JSON.stringify(engine)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /service/sysport-service/config/generate-schema
      {
        resource: /\/service\/sysport-service\/config\/generate-schema/,
        method: {
          POST: (req) => {
            return new Promise((resolve) => {
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`sysport-service`)
                    .obj.generateConfigSchema(req.body)
                )
                .then((json) => {
                  resolve(this.makeJsonRespond(JSON.stringify(json)));
                })
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /service/sysport-service/system-port
      {
        resource: /\/service\/sysport-service\/system-port/,
        method: {
          GET: () => {
            return new Promise((resolve) => {
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`sysport-service`)
                    .obj.getSerialPortList()
                )
                .then((ports) =>
                  resolve(this.makeJsonRespond(JSON.stringify(ports)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /service/sysport-service/config-port
      {
        resource: /\/service\/sysport-service\/config-port/,
        method: {
          GET: () => {
            return new Promise((resolve) => {
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`sysport-service`)
                    .obj.objects.get()
                )
                .then((ports) =>
                  resolve(this.makeJsonRespond(JSON.stringify(ports)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          POST: (req) => {
            return new Promise((resolve) => {
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`sysport-service`)
                    .obj.objects.add(req.body)
                )
                .then((ports) =>
                  resolve(this.makeJsonRespond(JSON.stringify(ports)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /service/sysport-service/config-port/{{id}}
      {
        resource: /\/service\/sysport-service\/config-port\/[^/]+/,
        method: {
          GET: (req) => {
            return new Promise((resolve) => {
              const id = decodeURI(req.path.split(`/`).pop());
              console.log(`id:`, id);
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`sysport-service`)
                    .obj.objects.get(id)
                )
                .then((port) => {
                  console.log(`ports: `, port.config);
                  return port;
                })
                .then((port) =>
                  resolve(this.makeJsonRespond(JSON.stringify(port.config)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          PUT: (req) => {
            return new Promise((resolve) => {
              const id = decodeURI(req.path.split(`/`).pop());
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`sysport-service`)
                    .obj.objects.update(id, req.body)
                )
                .then((ports) =>
                  resolve(this.makeJsonRespond(JSON.stringify(ports)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          DELETE: (req) => {
            return new Promise((resolve) => {
              const id = decodeURI(req.path.split(`/`).pop());
              Promise.resolve()
                .then(() =>
                  this.laborsManager
                    .getService(`sysport-service`)
                    .obj.objects.remove(id)
                )
                .then((ports) =>
                  resolve(this.makeJsonRespond(JSON.stringify(ports)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /rtcpeer/session
      {
        resource: /\/rtcpeer\/session/,
        method: {
          GET: () => {
            return new Promise((resolve) => {
              const rtcpeerService =
                this.laborsManager.getService(`rtcpeer-service`).obj;
              Promise.resolve()
                .then(() => rtcpeerService.getSession())
                .then((ret) =>
                  resolve(this.makeJsonRespond(JSON.stringify(ret)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          POST: (req) => {
            return new Promise((resolve) => {
              const rtcpeerService =
                this.laborsManager.getService(`rtcpeer-service`).obj;
              Promise.resolve()
                .then(() => rtcpeerService.createSession(req.body.config))
                .then((session) => {
                  return { id: session.id };
                })
                .then((ret) =>
                  resolve(this.makeJsonRespond(JSON.stringify(ret)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          DELETE: () => {
            return new Promise((resolve) => {
              const rtcpeerService =
                this.laborsManager.getService(`rtcpeer-service`).obj;
              Promise.resolve()
                .then(() => rtcpeerService.deleteSession())
                .then(() => rtcpeerService.getSession())
                .then((ret) =>
                  resolve(this.makeJsonRespond(JSON.stringify(ret)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /rtcpeer/session/{sessionId}
      {
        resource: /\/rtcpeer\/session\/[^/]+/,
        method: {
          GET: (req) => {
            return new Promise((resolve) => {
              const rtcpeerService =
                this.laborsManager.getService(`rtcpeer-service`).obj;
              const id = this.getPathElement(req.path);
              Promise.resolve()
                .then(() => rtcpeerService.getSession(id))
                .then((ret) =>
                  resolve(this.makeJsonRespond(JSON.stringify(ret)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          DELETE: (req) => {
            return new Promise((resolve) => {
              const rtcpeerService =
                this.laborsManager.getService(`rtcpeer-service`).obj;
              const id = this.getPathElement(req.path);
              Promise.resolve()
                .then(() => rtcpeerService.deleteSession(id))
                .then((ret) =>
                  resolve(this.makeJsonRespond(JSON.stringify(ret)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /rtcpeer/session/{sessionId}/offer
      {
        resource: /\/rtcpeer\/session\/[^/]+\/offer/,
        method: {
          GET: (req) => {
            return new Promise((resolve) => {
              const rtcpeerService =
                this.laborsManager.getService(`rtcpeer-service`).obj;
              const id = this.getPathElement(req.path, 2);
              Promise.resolve()
                .then(() => rtcpeerService.getOffer(id))
                .then((ret) =>
                  resolve(this.makeJsonRespond(JSON.stringify(ret)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /rtcpeer/session/{sessionId}/offer-candidate
      {
        resource: /\/rtcpeer\/session\/[^/]+\/offer-candidate/,
        method: {
          GET: (req) => {
            return new Promise((resolve) => {
              const rtcpeerService =
                this.laborsManager.getService(`rtcpeer-service`).obj;
              const id = this.getPathElement(req.path, 2);
              Promise.resolve()
                .then(() => rtcpeerService.getOfferCandidate(id))
                .then((ret) =>
                  resolve(this.makeJsonRespond(JSON.stringify(ret)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /rtcpeer/session/{sessionId}/answer
      {
        resource: /\/rtcpeer\/session\/[^/]+\/answer/,
        method: {
          POST: (req) => {
            return new Promise((resolve) => {
              const rtcpeerService =
                this.laborsManager.getService(`rtcpeer-service`).obj;
              const id = this.getPathElement(req.path, 2);
              console.log(`req body:`, JSON.stringify(req.body));
              Promise.resolve()
                .then(() => rtcpeerService.addAnswer(id, req.body))
                .then((ret) =>
                  resolve(this.makeJsonRespond(JSON.stringify(ret)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },

      //  Resource : /rtcpeer/session/{sessionId}/answer-candidate
      {
        resource: /\/rtcpeer\/session\/[^/]+\/answer-candidate/,
        method: {
          POST: (req) => {
            return new Promise((resolve) => {
              const rtcpeerService =
                this.laborsManager.getService(`rtcpeer-service`).obj;
              const id = this.getPathElement(req.path, 2);
              Promise.resolve()
                .then(() => rtcpeerService.addAnswerCandidate(id, req.body))
                .then((ret) =>
                  resolve(this.makeJsonRespond(JSON.stringify(ret)))
                )
                .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
        },
      },
    ];
  }

  handleRequest(req) {
    console.log(`get req : ${JSON.stringify(req)}`);

    try {
      // eslint-disable-next-line no-unused-vars
      const body = JSON.parse(JSON.stringify(req.body));
    } catch (err) {
      return Promise.resolve(
        this.catchErrorRespond(new Errors.AcceptOnlyJsonBody())
      );
    }

    console.log(
      `[${req.method}] ${req.path} : ${JSON.stringify(
        req.body ? req.body : {},
        null,
        2
      )}`
    );

    const arr = this.router.filter((elem) => {
      return !!(
        this.pathMatch(req.path, elem.resource) &&
        Object.prototype.hasOwnProperty.call(elem.method, req.method)
      );
    });
    // console.log(`arr : ${JSON.stringify(arr, null, 2)}`);
    if (!arr.length)
      return Promise.resolve(this.catchErrorRespond(new Errors.Http404()));
    const func = arr[0].method[req.method];
    // return func(req);
    return new Promise((resolve) => {
      Promise.resolve()
        .then(() => func(req))
        .then((result) => {
          const event = `${req.method.toUpperCase()}${arr[0].resource}`;
          console.log(`Emit event : ${event}`);
          this.event.emit(event, req);
          resolve(result);
        })
        .catch((err) => console.error(err));
    });
  }

  pathMatch(path, regex) {
    const arr = path.match(regex);
    if (arr && arr[0].length === path.length) return true;
    return false;
  }

  reqVerify(req, method, path) {
    return req.method === method && req.path === path;
  }

  getPathElement(path, index) {
    const pathArr = path.replace(/^\//, ``).replace(/\/$/, ``).split(`/`);
    if (index && index > pathArr.length) return null;
    return pathArr[index || pathArr.length - 1];
  }

  getParameters(req) {
    console.log(`RoutesManager: getParameters() >> `);
    const params = {};
    Object.keys(req.query).forEach((i) => {
      const preKey = i.split(`.`);
      let paramsTmp = params;
      while (preKey.length > 1) {
        const key = preKey.shift();
        if (!paramsTmp[key]) paramsTmp[key] = {};
        paramsTmp = paramsTmp[key];
      }
      paramsTmp[preKey.shift()] = req.query[i];
    });
    return JSON.parse(JSON.stringify(params));
  }

  makeJsonRespond(data) {
    return new APIResponse({
      status: 200,
      contentType: `application/json`,
      content: data,
    });
  }

  catchErrorRespond(e) {
    console.log(`catchErrorRespond() >> `);
    return new Promise((resolve) => {
      const err = e || new Errors.ErrorObjectNotReturn();
      console.error(err);
      let res;
      console.log(`getHttpResponse type: ${typeof err.getHttpResponse}`);
      if (typeof err.getHttpResponse === `function`) {
        console.error(`Extension error.`);
        res = err.getHttpResponse();
      } else {
        console.error(`System error.`);
        console.log(`error message: ${err.message}`);
        res = {
          status: 500,
          content: err.message,
        };
      }
      res.contentType = "application/json";
      res.content = JSON.stringify({
        error: {
          name: err.name,
          message: res.content,
        },
      });
      resolve(new APIResponse(res));
    });
  }
}

module.exports = RoutesManager;
