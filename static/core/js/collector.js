//  JSON resource keeper, this class used by api.

export default class ExtensionCollector {
  constructor(extension) {
    this.extension = extension;
    this.console = this.extension.console;
  }

  init() {
    return new Promise((resolve, reject) => {
      this.resource = {};
      resolve();
    });
  }

  set(name, obj) {
    this.console.trace(`set(${name}) >> `);
    this.resource[name] = {
      "timestamp": new Date(),
      "object": obj
    };
  }

  get(name) {
    this.console.trace(`get(${name}) >> `);
    return this.resource[name];
  }

  arrayBufferToString(arrBuff) {
    let hashArray = Array.from(new Uint8Array(arrBuff));
    let hashHex = hashArray.map((b) => b.toString(16).padStart(2, `0`)).join('');
    return hashHex;
  }

  getJsonSha256(json) {
    return new Promise(async (resolve, reject) => {
      json = (typeof json == `string`) ? this.resource[json].object : json;
      let result = await this.getSha256(JSON.stringify(json));
      resolve(result);
    });
  }

  getSha256(message) {
    return new Promise(async (resolve, reject) => {
      if(crypto && crypto.subtle) {
        //let buffer = new TextEncoder("utf-8").encode(data);
        //let hash = await crypto.subtle.digest(`SHA-256`, buffer);
        let data = (new TextEncoder()).encode(message);
        let hash = await crypto.subtle.digest(`SHA-256`, data);
        resolve(hash);
      }
      else {
        this.console.warn(`Cannot use encrypt function cause 'crypto' or 'crypto'.subtle not found, ensure you enter site via 'https'.`);
        resolve(null);
      }
    });
  }
}