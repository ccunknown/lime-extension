'use strict'

const fs = require(`fs`);
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
    this.setupConfigHandler();
    //console.log(`Service constructor : ${this.id}`);
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
    console.log(`laborsManager: reloadConfig() >> `);
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
      deep: boolean
    }
  */
  getDirectorySchema(path, options) {
    return new Promise(async (resolve, reject) => {
      path = Path.join(``, path);
      let fpath = Path.join(__dirname, this.id, path);
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

  base64Encode(data) {
    let buff = Buffer.from(data);
    let base64 = buff.toString(`base64`);
    return base64;
  }
}

module.exports = Service;