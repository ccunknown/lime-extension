export default class ExtensionApi {
  constructor(extension) {
    this.extension = extension;

    this.console = this.extension.console;
    this.collector = this.extension.collector;

    //this.init();
  }

  init() {
    return new Promise(async (resolve, reject) => {
      this.console.trace(`init() >> `);
      this.initRest();
      await this.initConfig();
      await this.initSchema();
      this.initWorker();
      resolve();
    });
    //this.initApi();
  }

  initRest() {
    this.rest = {
      getJson(url) {
        return new Promise((resolve, reject) => {
          fetch(url, {
            method: 'GET',
            headers: window.API.headers()
          })
          .then((res) => (!res.ok) ? res.json().then((body) => reject({status: res.status, body: body})) : resolve(res.json()))
          .catch((err) => reject(err));
        });
      },
      postJson(url, data) {
        return new Promise((resolve, reject) => {
          fetch(url, {
            method: 'POST',
            headers: window.API.headers('application/json'),
            body: JSON.stringify(data)
          })
          .then((res) => (!res.ok) ? res.json().then((body) => reject({status: res.status, body: body})) : resolve(res.json()))
          .catch((err) => reject(err));
        });
      },
      putJson(url, data) {
        return new Promise((resolve, reject) => {
          fetch(url, {
            method: 'PUT',
            headers: window.API.headers('application/json'),
            body: JSON.stringify(data)
          })
          .then((res) => (!res.ok) ? res.json().then((body) => reject({status: res.status, body: body})) : resolve(res.json()))
          .catch((err) => reject(err));
        });
      },
      patchJson(url, data) {
        return new Promise((resolve, reject) => {
          fetch(url, {
            method: 'PATCH',
            headers: window.API.headers('application/json'),
            body: JSON.stringify(data)
          })
          .then((res) => (!res.ok) ? res.json().then((body) => reject({status: res.status, body: body})) : resolve(res.json()))
          .catch((err) => reject(err));
        });
      },
      delete(url) {
        return new Promise((resolve, reject) => {
          fetch(url, {
            method: 'DELETE',
            headers: window.API.headers()
          })
          .then((res) => (!res.ok) ? res.json().then((body) => reject({status: res.status, body: body})) : resolve(res.json()))
          .catch((err) => reject(err));
        });
      }
    };
  }

  initConfig() {
    return new Promise(async (resolve, reject) => {
      await this.getConfig();
      resolve();
    });
  }

  initSchema() {
    return new Promise(async (resolve, reject) => {
      await this.getSchema();
      resolve();
    });
  }

  initWorker() {
    let config = this.extension.schema.extension.config;
    this.worker = {
      configSync: {
        "start": (period) => {
          if(config[`config-sync`].enable && crypto && crypto.subtle)
            setInterval(this.worker.configSync.function, (period) ? period : config[`config-sync`].period);
          else
            console.warn(`configSync not start!!!`);
        },
        "stop": () => {
          clearInterval(this.worker.configSync.interval);
        },
        "function": () => {
          return new Promise(async (resolve, reject) => {
            let oldHash = await this.collector.getJsonSha256(`config`);
            let newHash = await this.getConfigSha256();
            this.console.log(`old hash : ${this.collector.arrayBufferToString(oldHash)}`);
            this.console.log(`new hash : ${newHash.value}`);
            resolve();
          });
        },
        "interval": null
      }
    };

    for(let i in this.worker) {
      this.worker[i].start();
    }
  }

  /***  Resource : /config  ***/
  getConfig() {
    this.console.log(`rest.getConfig()`);
    return new Promise(async (resolve, reject) => {
      let config = await this.restCall(`get`, `/api/config`);
      this.collector.set(`config`, config);
      resolve(config);
    });
  }
  putConfig(config) {
    this.console.log(`rest.putConfig()`);
    return this.restCall(`put`, `/config`, config);
  }
  deleteConfig() {
    this.console.log(`rest.deleteConfig()`);
    return this.restCall(`delete`, `/config`);
  }

  /***  Resource : /config/sha256  ***/
  getConfigSha256() {
    this.console.log(`rest.getConfigSha256()`);
    return this.restCall(`get`, `/api/hash/sha256/config`);
  }

  /***  Resource : /schema  ***/
  getSchema() {
    this.console.log(`rest.getSchema()`);
    return this.restCall(`get`, `/api/schema`);
  }

  /***  Resource : /api/system/portlist  ***/
  getSystemPortlist() {
    this.console.log(`getSystemPortlist`);
    return this.restCall(`get`, `/api/system/portlist`);
  }

  restCall(method, path, body) {
    this.console.log(`restCall(${method}, ${path})`);
    return new Promise((resolve, reject) => {
      let func;
      switch(method.toLowerCase()) {
        case `get`:
          func = this.rest.getJson;
          break;
        case `post`:
          func = this.rest.postJson;
          break;
        case `put`:
          func = this.rest.putJson;
          break;
        case `patch`:
          func = this.rest.patchJson;
          break;
        case `delete`:
          func = this.rest.delete;
          break;
      }
      func(`${this.extension.loader.define[`url-prefix`]}${path}`, body)
      .then((resBody) => resolve(resBody))
      .catch((err) => reject(err));
    });
  }
}