export default class ExtensionApi {
  constructor(extension) {
    this.extension = extension;

    this.console = this.extension.console;

    this.init();
  }

  init() {
    this.console.trace(`init() >> `);
    this.initRest();
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

  /***  Resource : /config  ***/
  getConfig() {
    this.console.log(`rest.getConfig()`);
    return this.restCall(`get`, `/api/config`);
  }
  putConfig(config) {
    this.console.log(`rest.putConfig()`);
    return this.restCall(`put`, `/config`, config);
  }
  deleteConfig() {
    this.console.log(`rest.deleteConfig()`);
    return this.restCall(`delete`, `/config`);
  }

  /***  Resource : /api/system/portlist  ***/
  getSystemPortlist() {
    this.console.log(`getSystemPortlist`);
    return this.restCall(`get`, `/api/system/portlist`);
  }

  restCall(method, path, body) {
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