'use strict';

const EventEmitter = require('events').EventEmitter;

const {APIHandler, APIResponse} = require('gateway-addon');
const {Errors} = require('../constants/constants');
//const manifest = require('../manifest.json');

const util = require('util');

class RoutesManager extends APIHandler{
  constructor(extension) {
    super(extension.addonManager, extension.manifest.id);
    this.configManager = extension.configManager;
    this.laborsManager = extension.laborsManager;

    this.eventEmitter = new EventEmitter();
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
          "PUT": (req) => {
            return new Promise(async (resolve, reject) => {
              this.configManager.saveConfig(req.body)
              .then((conf) => resolve(this.makeJsonRespond(JSON.stringify(conf))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          },
          "DELETE": (req) => {
            return new Promise(async (resolve, reject) => {
              let defaults = this.configManager.getDefaults();
              this.configManager.saveConfig(defaults.config)
              .then((conf) => resolve(this.makeJsonRespond(JSON.stringify(conf))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
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
              this.laborsManager.getService()
              .then((serviceList) => serviceList.map((service) => {
                return {
                  id: service.id,
                  enable: service.enable,
                  status: service.status,
                  description: (service.description) ? service.description : ``
                };
              }))
              .then((servList) => resolve(this.makeJsonRespond(JSON.stringify(servList))))
              .catch((err) => resolve(this.catchErrorRespond(err)));
            });
          }
        }
      },

      /***  Resource : /system/portlist  ***/
      {
        "resource": /\/system\/portlist/,
        "method": {
          "GET": (req) => {
            return new Promise((resolve, reject) => {
              this.laborsManager.getService(`sysport-service`)
              .then((service) => service.obj.getSerialPortList())
              .then((serialPortList) => resolve(this.makeJsonRespond(JSON.stringify(serialPortList))))
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
        this.eventEmitter.emit(event, req);
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
      let res = err.getHttpResponse();
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