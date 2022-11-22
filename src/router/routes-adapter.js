/* eslint-disable class-methods-use-this */
const { EventEmitter } = require(`events`);
// const Crypto = require(`crypto`);

const { APIHandler, APIResponse } = require(`gateway-addon`);

const { Errors } = require(`../../constants/constants`);

const ConfigRouter = require(`./config-router`);
const ServiceRouter = require(`./service-router`);

class RouteAdapter extends APIHandler {
  constructor(extension) {
    super(extension.addonManager, extension.manifest.id);
    this.configManager = extension.configManager;
    this.laborsManager = extension.laborsManager;

    this.event = new EventEmitter();
    this.historyService = null;
    this.setRouter();
  }

  setRouter() {
    this.router = [];
    [
      new ConfigRouter(this.extension, this),
      new ServiceRouter(this.extension, this),
    ].forEach((e) => {
      this.router = [...this.router, ...e.getRouter()];
    });
  }

  handleRequest(req) {
    console.log(`get req : ${JSON.stringify(req)}`);

    try {
      JSON.parse(JSON.stringify(req.body));
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
    if (!arr.length)
      return Promise.resolve(this.catchErrorRespond(new Errors.Http404()));
    const func = arr[0].method[req.method];
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

module.exports = RouteAdapter;
