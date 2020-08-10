'use strict'

const fs = require(`fs`);
const rimraf = require(`rimraf`);
const Path = require(`path`);
const EventEmitter = require(`events`).EventEmitter;

class Service extends EventEmitter {
  constructor(extension, config, id) {
    super(extension.addonManager, extension.manifest.id);

    this.extension = extension;
    this.manifest = extension.manifest;
    this.addonManager = extension.addonManager;
    this.laborsManager = this.extension.laborsManager;
    this.configManager = this.extension.configManager;
    this.routesManager = this.extension.routesManager;

    this.config = JSON.parse(JSON.stringify(config));
    this.id = id;
    this.initUtil();
    this.setupConfigHandler();
    //console.log(`Service constructor : ${this.id}`);
  }

  initUtil() {
    this.util = {
      "path": {
        "trim": (path) => {
          return path.replace(/^\//, ``).replace(/^\/$/, ``);
        }
      }
    };
  }

  getSchema(options) {
    if(options && options.renew)
      return new Promise(async (resolve, reject) => {
        let config = await this.getConfig(options);
        resolve(config[`service-config`].find((elem) => (elem.id == this.id)));
      });
    else {
      return this.config[`service-config`][this.id];
    }
  }

  // saveSchema(schema) {
  //   return new Promise(async (resolve, reject) => {

  //     resolve();
  //   });
  // }

  getConfig(options) {
    if(options && options.renew)
      return new Promise(async (resolve, reject) => {
        let config = (options.save) ? 
          await this.reloadConfig() : 
          await this.configManager.getConfig();
        resolve(config);
      });
    else
      return this.config;
  }

  reloadConfig() {
    console.log(`Service: reloadConfig() >> `);
    return new Promise(async (resolve, reject) => {
      this.config = JSON.parse(JSON.stringify(await this.configManager.getConfig()));
      resolve(this.config);
    });
  }

  setupConfigHandler() {
    this.configManager.event.on(`new-config`, () => {
      console.log(`New config!`);
    });
  }

  /*
    options: {
      base64: boolean,
      deep: boolean,
      object: boolean
    }
  */
  getDirectorySchema(path, options) {
    //console.log(`getDirectorySchema(${path}, ${JSON.stringify(options, null, 2)})`);
    console.log(`getDirectorySchema(${path})`);
    return new Promise(async (resolve, reject) => {
      path = Path.join(``, path);
      let fpath = Path.join(__dirname, this.id, path);
      //console.log(`fpath: ${fpath}`);
      let stats = fs.lstatSync(fpath);
      let info = {
        path: Path.join(``, path),
        name: Path.basename(path)
      };
      if(stats.isDirectory()) {
        info.type = `directory`;
        if(options && options.deep) {
          let children = fs.readdirSync(fpath);
          info.children = [];
          for(let i in children) {
            let child = await this.getDirectorySchema(Path.join(path, children[i]), options);
            info.children.push(child);
          }
        }
      }
      else {
        info.type = `file`;
        if(options && options.base64) {
          let str = await this.readFile(path);
          info.base64 = this.base64Encode(str);
        }
        if(options && options.object) {
          let p = `/${fpath.replace(/^\//, ``)}`;
          //console.log(`require: ${p}`);
          info.object = require(p);
        }
      }
      resolve(info);
    });
  }

  readFile(path, encoding) {
    return new Promise((resolve, reject) => {
      path = (path.startsWith(`/`)) ? Path.join(__dirname, this.id, path) : path;
      encoding = (encoding) ? encoding : `utf8`;
      fs.readFile(path, encoding, (err, data) => {
        (err) ? reject(err) : resolve(data);
      });
    });
  }

  writeFile(path, data, encoding) {
    return new Promise((resolve, reject) => {
      const fs = require(`fs`);
      encoding = (encoding) ? encoding : `utf8`;
      path = Path.join(__dirname, this.id, path);
      let dir = path.replace(/[^/]+$/g, ``);
      console.log(`dir : ${dir}`);
      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
      }
      fs.writeFile(path, data, encoding, (err) => {
        (err) ? reject(err) : resolve();
      });
    });
  }

  deleteDirectory(path) {
    return new Promise((resolve, reject) => {
      path = (path.startsWith(`/`)) ? Path.join(__dirname, this.id, path) : path;
      console.log(`deleteDirectory(${path})`);
      rimraf(path, (err) => {
        (err) ? reject(err) : resolve({});
      });
    });
  }

  base64Encode(data) {
    let buff = Buffer.from(data);
    let base64 = buff.toString(`base64`);
    return base64;
  }

  base64Decode(data, encoding) {
    //let buff = new Buffer(data, `base64`);
    let buff = Buffer.from(data, `base64`);
    let result = buff.toString((encoding) ? encoding : `utf8`);
    return result;
  }

  jsonToArray(json, keyOfId) {
    let arr = [];
    for(let i in json) {
      let elem = JSON.parse(JSON.stringify(json[i]));
      if(keyOfId)
        elem[keyOfId] = i;
      arr.push(elem);
    }
    return arr;
  }

  arrayToJson(array, keyAttr) {
    let json = {};
    array.forEach((elem) => {
      json[elem[keyAttr]] = elem;
    });
    return JSON.parse(JSON.stringify(json));
  }
}

module.exports = Service;