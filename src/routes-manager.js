'use strict';

const EventEmitter = require('events').EventEmitter;
const Crypto = require(`crypto`);

const {APIHandler, APIResponse} = require('gateway-addon');
const {Errors} = require('../constants/constants');
//const manifest = require('../manifest.json');

const util = require('util');

class RoutesManager extends APIHandler{
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

      /***  Resource : /config  ***/
      {
        "resource": /\/config/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.configManager.getConfig()
              .then((conf) => {
                console.log(`conf : ${JSON.stringify(conf, null, 2)}`);
                resolve(this.makeJsonRespond(JSON.stringify(conf)))
              })
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "POST": (req) => {
            return new Promise(async (resolve, reject) => {
              let params = this.getParameters(req);
              this.configManager.addToConfig(req.body, params.path)
              .then((res) => resolve(this.makeJsonRespond(JSON.stringify(res))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "PUT": (req) => {
            return new Promise(async (resolve, reject) => {
              this.configManager.saveConfig(req.body)
              .then((conf) => resolve(this.makeJsonRespond(JSON.stringify(conf))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "PATCH": (req) => {
            return new Promise(async (resolve, reject) => {
              let params = this.getParameters(req);
              this.configManager.updateConfig(req.body, params.path)
              .then((res) => resolve(this.makeJsonRespond(JSON.stringify(res))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "DELETE": (req) => {
            return new Promise(async (resolve, reject) => {
              let params = this.getParameters(req);
              if(this.configManager.isEmptyObject(params)) {
                this.configManager.deleteConfig()
                .then((res) => resolve(this.makeJsonRespond(JSON.stringify(res))))
                .catch((err) => resolve(this.catchErrorRespond(err)));
              }
              else {
                this.configManager.deleteConfig(params.path)
                .then((res) => resolve(this.makeJsonRespond(JSON.stringify(res))))
                .catch((err) => resolve(this.catchErrorRespond(err)));
              }
            });
          }
        }
      },

      /***  Resource : /hash/sha256/config  ***/
      {
        "resource": /\/hash\/sha256\/config/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.configManager.getConfig()
              .then((config) => {
                return {
                  "hash": "sha256",
                  "digest": "hex",
                  "value": Crypto.createHash(`sha256`).update(JSON.stringify(config)).digest(`hex`)
                }
              })
              .then((res) => resolve(this.makeJsonRespond(JSON.stringify(res))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /schema  ***/
      {
        "resource": /\/schema/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              try {
                let schema = this.configManager.getSchema();
                resolve(this.makeJsonRespond(JSON.stringify(schema)));
              } catch(err) {
                resolve(this.catchErrorRespond(err))
              };
            });
          }
        }
      },

      /***  Resource : /service  ***/
      {
        "resource": /\/service/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService().map((service) => {
              //this.laborsManager.getService()
              //.then((serviceList) => serviceList.map((service) => {
                return {
                  id: service.id,
                  enable: service.enable,
                  status: service.status,
                  description: (service.description) ? service.description : ``
                };
              //}))
              })
              .then((servList) => resolve(this.makeJsonRespond(JSON.stringify(servList))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /service/devices-service/devicesConfigSchema  ***/
      {
        "resource": /\/service\/devices-service\/config\/generate-schema/,
        "method": {
          "POST": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`devices-service`).obj.generateConfigSchema(req.body)
              .then((json) => {
                //console.log(`device list : ${JSON.stringify(json, null, 2)}`);
                resolve(this.makeJsonRespond(JSON.stringify(json)));
              })
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /service/devices-service/generatePropertyId  ***/
      {
        "resource": /\/service\/devices-service\/config\/generate-property-id/,
        "method": {
          "POST": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`devices-service`).obj.generatePropertyId(req.body)
              .then((res) => {
                console.log(`propId: ${JSON.stringify(res, null, 2)}`);
                resolve(this.makeJsonRespond(JSON.stringify(res)));
              })
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /service/devices-service/translate  ***/
      {
        "resource": /\/service\/devices-service\/config\/translate/,
        "method": {
          "POST": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`devices-service`).obj.translateConfig(req.body)
              .then((json) => {
                //console.log(`device list : ${JSON.stringify(json, null, 2)}`);
                resolve(this.makeJsonRespond(JSON.stringify(json)));
              })
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      // /***  Resource : /service/devices-service/device  ***/
      // {
      //   "resource": /\/service\/devices-service\/device/,
      //   "method": {
      //     "GET": (req) => {
      //       return new Promise((resolve, reject) => {
      //         this.laborsManager.getService(`devices-service`).obj.getDevice()
      //         .then((devices) => resolve(this.makeJsonRespond(JSON.stringify(devices))))
      //         .catch((err) => resolve(this.catchErrorRespond(err)));
      //       });
      //     }
      //   }
      // },

      /***  Resource : /service/devices-service/service-device  ***/
      {
        "resource": /\/service\/devices-service\/service-device/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`devices-service`).obj.getServiceDevice()
              .then((devices) => resolve(this.makeJsonRespond(JSON.stringify(devices))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /service/devices-service/service-device/{id}  ***/
      {
        "resource": /\/service\/devices-service\/service-device\/[^/]+/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              let id = req.path.split(`/`).pop();
              this.laborsManager.getService(`devices-service`).obj.getServiceDevice(id)
              .then((devices) => resolve(this.makeJsonRespond(JSON.stringify(devices))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /service/devices-service/service-device/{id}/{cmd}  ***/
      {
        "resource": /\/service\/devices-service\/service-device\/[^/]+\/[^/]+/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              let pathArr = req.path.split(`/`);
              let cmd = pathArr.pop();
              let id = pathArr.pop();
              if(cmd == `start`) {
                this.laborsManager.getService(`devices-service`).obj.startDevice(id)
                .then(() => resolve(this.makeJsonRespond(JSON.stringify({}))))
                .catch((err) => resolve(this.catchErrorRespond(err)));
              }
              else if(cmd == `stop`) {
                this.laborsManager.getService(`devices-service`).obj.stopDevice(id)
                .then(() => resolve(this.makeJsonRespond(JSON.stringify({}))))
                .catch((err) => resolve(this.catchErrorRespond(err)));
              }
              else if(cmd == `add-to-service`) {
                this.laborsManager.getService(`devices-service`).obj.addToService(id)
                .then((res) => resolve(this.makeJsonRespond(JSON.stringify(res))))
                .catch((err) => resolve(this.catchErrorRespond(err)));
              }
              else if(cmd == `remove-from-service`) {
                this.laborsManager.getService(`devices-service`).obj.removeFromService(id)
                .then((res) => resolve(this.makeJsonRespond(JSON.stringify(res))))
                .catch((err) => resolve(this.catchErrorRespond(err)));
              }
              else
                resolve(this.catchErrorRespond(new Errors.PathInvalid(cmd)));
            });
          }
        }
      },

      /***  Resource : /service/devices-service/config-device  ***/
      {
        "resource": /\/service\/devices-service\/config-device/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`devices-service`).obj.getConfigDevice()
              .then((devices) => resolve(this.makeJsonRespond(JSON.stringify(devices))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "POST": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`devices-service`).obj.add(req.body)
              .then((json) => resolve(this.makeJsonRespond(JSON.stringify(json))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /service/devices-service/config-device/{id}  ***/
      {
        "resource": /\/service\/devices-service\/config-device\/[^/]+/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              let id = req.path.split(`/`).pop();
              this.laborsManager.getService(`devices-service`).obj.getConfigDevice(id)
              .then((device) => resolve(this.makeJsonRespond(JSON.stringify(device))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "PUT": (req) => {
            return new Promise((resolve, reject) => {
              let id = req.path.split(`/`).pop();
              this.laborsManager.getService(`devices-service`).obj.update(id, req.body)
              .then((json) => resolve(this.makeJsonRespond(JSON.stringify(json))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "DELETE": (req) => {
            return new Promise((resolve, reject) => {
              let id = req.path.split(`/`).pop();
              this.laborsManager.getService(`devices-service`).obj.remove(id)
              .then((json) => {
                //console.log(`device list : ${JSON.stringify(json, null, 2)}`);
                resolve(this.makeJsonRespond(JSON.stringify(json)));
              })
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /service/scripts  ***/
      {
        "resource": /\/service\/scripts/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`scripts-service`).obj.get(null, {"deep": true})
              //this.laborsManager.getService(`scripts-service`)
              //.then((scriptService) => scriptService.obj.get())
              .then((json) => {
                //console.log(`script list : ${JSON.stringify(json, null, 2)}`);
                resolve(this.makeJsonRespond(JSON.stringify(json)));
              })
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "PUT": (req) => {
            return new Promise(async (resolve, reject) => {
              this.laborsManager.getService(`scripts-service`).obj.create(req.body, `scripts`)
              .then((conf) => resolve(this.makeJsonRespond(JSON.stringify(conf))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "DELETE": (req) => {
            return new Promise(async (resolve, reject) => {
              this.configManager.saveConfig({})
              .then((conf) => resolve(this.makeJsonRespond(JSON.stringify(conf))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /service/scripts/{name}  ***/
      {
        "resource": /\/service\/scripts\/[^/]+/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`scripts-service`).obj.get(req.path.split(`/`).pop(), {"base64": true, "deep":true})
              //this.laborsManager.getService(`scripts-service`)
              //.then((scriptService) => scriptService.obj.get(req.path.split(`/`).pop(), {"base64": true}))
              .then((json) => {
                //console.log(`script list : ${JSON.stringify(json, null, 2)}`);
                resolve(this.makeJsonRespond(JSON.stringify(json)));
              })
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "DELETE": (req) => {
            return new Promise(async (resolve, reject) => {
              this.laborsManager.getService(`scripts-service`).obj.delete(req.path.split(`/`).pop())
              .then((res) => resolve(this.makeJsonRespond(JSON.stringify(res))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      // /***  Resource : /service/engines  ***/
      // {
      //   "resource": /\/service\/engines/,
      //   "method": {
      //     "GET": (req) => {
      //       return new Promise((resolve, reject) => {
      //         Promise.resolve(this.laborsManager.getService(`engines-service`).obj.get(null, {"state": true}))
      //         .then((conf) => resolve(this.makeJsonRespond(JSON.stringify(conf))))
      //         .catch((err) => resolve(this.catchErrorRespond(err)));
      //       });
      //     }
      //   }
      // },

      // /***  Resource : /service/engines/{name}  ***/
      // {
      //   "resource": /\/service\/engines\/[^/]+/,
      //   "method": {
      //     "GET": (req) => {
      //       return new Promise((resolve, reject) => {
      //         let name = req.path.split(`/`).pop();
      //         Promise.resolve(this.laborsManager.getService(`engines-service`).obj.get(name, {"state": true}))
      //         .then((conf) => resolve(this.makeJsonRespond(JSON.stringify(conf))))
      //         .catch((err) => resolve(this.catchErrorRespond(err)));
      //       });
      //     }
      //   }
      // },

      // /***  Resource : /service/engineTemplate  ***/
      // {
      //   "resource": /\/service\/engineTemplate/,
      //   "method": {
      //     "GET": (req) => {
      //       return new Promise((resolve, reject) => {
      //         this.laborsManager.getService(`engines-service`).obj.getTemplate(null, {"deep": true})
      //         .then((conf) => resolve(this.makeJsonRespond(JSON.stringify(conf))))
      //         .catch((err) => resolve(this.catchErrorRespond(err)));
      //       });
      //     }
      //   }
      // },

      // /***  Resource : /service/engineTemplate/{name}  ***/
      // {
      //   "resource": /\/service\/engineTemplate\/[^/]+/,
      //   "method": {
      //     "GET": (req) => {
      //       return new Promise((resolve, reject) => {
      //         let name = req.path.split(`/`).pop();
      //         this.laborsManager.getService(`engines-service`).obj.getTemplate(name, {"deep": true, "base64": true})
      //         .then((conf) => {
      //           console.log(`config: ${JSON.stringify(conf, null ,2)}`);
      //           resolve(this.makeJsonRespond(JSON.stringify(conf)))
      //         })
      //         .catch((err) => resolve(this.catchErrorRespond(err)));
      //       });
      //     }
      //   }
      // },



      /***  Resource : /service/engines-service/generateConfigSchema  ***/
      {
        "resource": /\/service\/engines-service\/generateConfigSchema/,
        "method": {
          "POST": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`engines-service`).obj.generateConfigSchema(req.body)
              .then((json) => {
                resolve(this.makeJsonRespond(JSON.stringify(json)));
              })
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /service/engines-service/system-engine  ***/
      {
        "resource": /\/service\/engines-service\/system-engine/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`engines-service`).obj.getSystemEngine()
              .then((engines) => resolve(this.makeJsonRespond(JSON.stringify(engines))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /service/engines-service/config-engine  ***/
      {
        "resource": /\/service\/engines-service\/config-engine/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`engines-service`).obj.get()
              .then((engines) => resolve(this.makeJsonRespond(JSON.stringify(engines))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "POST": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`engines-service`).obj.add(req.body)
              .then((engine) => resolve(this.makeJsonRespond(JSON.stringify(engine))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /service/engines-service/config-engine/{{id}}  ***/
      {
        "resource": /\/service\/engines-service\/config-engine\/[^/]+/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              let id = req.path.split(`/`).pop();
              this.laborsManager.getService(`engines-service`).obj.get(id)
              .then((engine) => resolve(this.makeJsonRespond(JSON.stringify(engine))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "PUT": (req) => {
            return new Promise((resolve, reject) => {
              let id = req.path.split(`/`).pop();
              this.laborsManager.getService(`engines-service`).obj.update(id, req.body)
              .then((engine) => resolve(this.makeJsonRespond(JSON.stringify(engine))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "DELETE": (req) => {
            return new Promise((resolve, reject) => {
              let id = req.path.split(`/`).pop();
              this.laborsManager.getService(`engines-service`).obj.remove(id)
              .then((engine) => resolve(this.makeJsonRespond(JSON.stringify(engine))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },



      /***  Resource : /service/sysport-service/generateConfigSchema  ***/
      {
        "resource": /\/service\/sysport-service\/generateConfigSchema/,
        "method": {
          "POST": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`sysport-service`).obj.generateConfigSchema(req.body)
              .then((json) => {
                resolve(this.makeJsonRespond(JSON.stringify(json)));
              })
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /service/sysport-service/system-port  ***/
      {
        "resource": /\/service\/sysport-service\/system-port/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`sysport-service`).obj.getSerialPortList()
              .then((ports) => resolve(this.makeJsonRespond(JSON.stringify(ports))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /service/sysport-service/config-port  ***/
      {
        "resource": /\/service\/sysport-service\/config-port/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`sysport-service`).obj.get()
              .then((ports) => resolve(this.makeJsonRespond(JSON.stringify(ports))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "POST": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`sysport-service`).obj.add(req.body)
              .then((ports) => resolve(this.makeJsonRespond(JSON.stringify(ports))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /service/sysport-service/config-port/{{id}}  ***/
      {
        "resource": /\/service\/sysport-service\/config-port\/[^/]+/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              let id = req.path.split(`/`).pop();
              this.laborsManager.getService(`sysport-service`).obj.get(id)
              .then((ports) => resolve(this.makeJsonRespond(JSON.stringify(ports))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "PUT": (req) => {
            return new Promise((resolve, reject) => {
              let id = req.path.split(`/`).pop();
              this.laborsManager.getService(`sysport-service`).obj.update(id, req.body)
              .then((ports) => resolve(this.makeJsonRespond(JSON.stringify(ports))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "DELETE": (req) => {
            return new Promise((resolve, reject) => {
              let id = req.path.split(`/`).pop();
              this.laborsManager.getService(`sysport-service`).obj.remove(id)
              .then((ports) => resolve(this.makeJsonRespond(JSON.stringify(ports))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      }

    ];
  }

  handleRequest(req) {
    console.log("get req : "+JSON.stringify(req));

    try{
      let body = JSON.parse(JSON.stringify(req.body));
    } catch(err) {
      return Promise.resolve(this.catchErrorRespond(new Errors.AcceptOnlyJsonBody()));
    };

    console.log(`[${req.method}] ${req.path} : ${JSON.stringify((req.body) ? req.body : {}, null, 2)}`);

    let arr = this.router.filter((elem) => {
      return (this.pathMatch(req.path, elem.resource) && elem.method.hasOwnProperty(req.method)) ? true : false;
    });
    //console.log(`arr : ${JSON.stringify(arr, null, 2)}`);
    if(!arr.length)
      return Promise.resolve(this.catchErrorRespond(new Errors.Http404()));
    let func = arr[0].method[req.method];
    //return func(req);
    return new Promise((resolve, reject) => {
      func(req)
      .then((result) => {
        let event = `${req.method.toUpperCase()}${arr[0].resource}`;
        console.log(`Emit event : ${event}`);
        this.event.emit(event, req);
        resolve(result);
      });
    });
  }

  pathMatch(path, regex) {
    let arr = path.match(regex);
    if(arr && arr[0].length == path.length)
      return true;
    return false;
  }

  reqVerify(req, method, path) {
    return (req.method === method && req.path === path);
  }

  getParameters(req) {
    console.log(`RoutesManager: getParameters() >> `);
    let params = {};
    for(let i in req.query) {
      let preKey = i.split(`.`);
      let paramsTmp = params;
      while(preKey.length > 1) {
        let key = preKey.shift();
        if(!paramsTmp[key])
          paramsTmp[key] = {};
        paramsTmp = paramsTmp[key];
      }
      paramsTmp[preKey.shift()] = req.query[i];
    }
    return JSON.parse(JSON.stringify(params));
  }

  makeJsonRespond(data) {
    return new APIResponse({
      status: 200,
      contentType: 'application/json',
      content: data
    });
  }

  catchErrorRespond(err) {
    console.log(`catchErrorRespond() >> `);
    return new Promise((resolve, reject) => {
      err = (err) ? err : new Errors.ErrorObjectNotReturn();
      console.error(err);
      let res;
      if(err.getHttpResponse) {
        console.log(`Extension error.`);
        res = err.getHttpResponse();
      }
      else {
        console.log(`System error.`);
        console.log(`error message: ${err.message}`);
        res = {
          "status": 500,
          "content": err.message
        };
      }
      res.contentType = "application/json";
      res.content = JSON.stringify({
        "error": {
          "name": err.name,
          "message": res.content
        }
      });
      resolve(new APIResponse(res));
    });
  }
}

module.exports = RoutesManager;