const fs = require(`fs`);
const rimraf = require(`rimraf`);
const Path = require(`path`);
const { EventEmitter } = require(`events`);

const serviceTools = require(`./service-tools`);

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
    this.initService();
    this.setupConfigHandler();
    // console.log(`Service constructor : ${this.id}`);

    // Assign 'service-tools' function into 'Service' object.
    Object.entries(serviceTools).forEach(([k, fn]) => {
      this[k] = fn;
    });
  }

  initService() {
    this.initUtil();
    this.initObjectFunctions();
  }

  initUtil() {
    this.util = {
      path: {
        trim: (path) => {
          return path.replace(/^\//, ``).replace(/^\/$/, ``);
        },
      },
    };
  }

  initObjectFunctions() {
    this.objectFunctions = {
      patchConfig: (id, config) => {
        console.log(`${this.id}: objectFunctions: patchConfig`);
        return new Promise((resolve, reject) => {
          // if(config && config.hasOwnProperty(`addToService`)) {
          if (config) {
            Promise.resolve()
              .then(() =>
                this.configManager.updateConfig(
                  config,
                  `service-config.${this.id}.list.${id}._config`
                )
              )
              .then(() => resolve())
              .catch((err) => reject(err));
          } else {
            resolve();
          }
        });
      },
    };
  }

  applyObjectOptions(id, options = {}) {
    console.log(`[${this.constructor.name}]`, `applyObjectOptions() >> `);
    // console.log(`Service: applyObjectOptions(${id}) >> `);
    return new Promise((resolve, reject) => {
      Object.keys(options)
        .reduce(
          (prevProm, key) =>
            // eslint-disable-next-line no-prototype-builtins
            this.objectFunctions.hasOwnProperty(key)
              ? this.objectFunctions[key](id, options[key])
              : Promise.resolve(),
          Promise.resolve()
        )
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  getSchema(options) {
    console.log(`[${this.constructor.name}]`, `getSchema() >>`);
    if (options && options.renew) {
      return new Promise((resolve, reject) => {
        Promise.resolve()
          .then(() => this.getConfig(options))
          .then((config) => resolve(config[`service-config`][this.id]))
          .catch((err) => reject(err));
      });
    }
    return this.config[`service-config`][this.id];
  }

  // saveSchema(schema) {
  //   return new Promise(async (resolve, reject) => {

  //     resolve();
  //   });
  // }

  getConfig(options) {
    if (options && options.renew) {
      return Promise.resolve(
        options.save ? this.reloadConfig() : this.configManager.getConfig()
      );
      // return new Promise(async (resolve, reject) => {
      //   resolve((options.save) ? this.reloadConfig() : this.configManager.getConfig());
      // });
    }
    return this.config;
  }

  reloadConfig() {
    console.log(`[${this.constructor.name}]`, `reloadConfig() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.configManager.getConfig())
        .then((ret) => JSON.parse(JSON.stringify(ret)))
        .then((ret) => {
          this.config = ret;
        })
        .then(() => resolve(this.config))
        .catch((err) => reject(err));
    });
    // return new Promise(async (resolve, reject) => {
    //   this.config = JSON.parse(JSON.stringify(await this.configManager.getConfig()));
    //   resolve(this.config);
    // });
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
      absolute: `string (absolute path)`,
      object: boolean
    }
  */
  getDirectorySchema(dirPath, options) {
    // console.log(`[${this.constructor.name}]`, `getDirectorySchema() >> `);
    // console.log(`dirPath:`, dirPath);
    try {
      const path = Path.join(``, dirPath);
      const fpath =
        options && options.absolute
          ? Path.join(options.absolute, path)
          : Path.join(__dirname, this.id, path);
      const stats = fs.lstatSync(fpath);
      const info = {
        path: Path.join(``, path),
        name: Path.basename(path),
      };
      if (stats.isDirectory()) {
        info.type = `directory`;
        if (options && options.deep) {
          const children = fs.readdirSync(fpath);
          info.children = [];
          Object.values(children).forEach((val) => {
            info.children.push(
              this.getDirectorySchema(Path.join(path, val), options)
            );
          });
        }
      } else {
        info.type = `file`;
        if (options && options.base64) {
          const str = fs.readFileSync(path);
          info.base64 = this.base64Encode(str);
        }
        if (options && options.object) {
          const p = `/${fpath.replace(/^\//, ``)}`;
          if (require.cache[require.resolve(p)])
            delete require.cache[require.resolve(p)];
          // eslint-disable-next-line import/no-dynamic-require, global-require
          info.object = require(p);
        }
      }
      return info;
    } catch (err) {
      console.error(err);
      return null;
    }
    // return new Promise((resolve, reject) => {
    //   const path = Path.join(``, dirPath);
    //   const fpath =
    //     options && options.absolute
    //       ? Path.join(options.absolute, path)
    //       : Path.join(__dirname, this.id, path);
    //   const stats = fs.lstatSync(fpath);
    //   const info = {
    //     path: Path.join(``, path),
    //     name: Path.basename(path),
    //   };
    //   Promise.resolve()
    //     .then(() => {
    //       if (stats.isDirectory()) {
    //         info.type = `directory`;
    //         if (options && options.deep) {
    //           const children = fs.readdirSync(fpath);
    //           info.children = [];
    //           // Object.values(children)
    //           Object.values(children).forEach((val) => {
    //             info.children.push(
    //               this.getDirectorySchema(Path.join(path, val), options)
    //             );
    //           });
    //           return Promise.all(info.children);
    //         }
    //         // return Promise.resolve();
    //       } else {
    //         info.type = `file`;
    //         if (options && options.base64) {
    //           const str = fs.readFileSync(path);
    //           info.base64 = this.base64Encode(str);
    //         }
    //         if (options && options.object) {
    //           const p = `/${fpath.replace(/^\//, ``)}`;
    //           // console.log(`require: ${p}`);
    //           if (require.cache[require.resolve(p)])
    //             delete require.cache[require.resolve(p)];
    //           // eslint-disable-next-line import/no-dynamic-require, global-require
    //           info.object = require(p);
    //         }
    //       }
    //       return Promise.resolve();
    //     })
    //     .then(() => console.log(`info:`, info))
    //     .then(() => resolve(info))
    //     .catch((err) => reject(err));
    // });
  }

  // getDirectorySchema(path, options) {
  //   //console.log(`getDirectorySchema(${path}, ${JSON.stringify(options, null, 2)})`);
  //   //console.log(`getDirectorySchema(${path})`);
  //   return new Promise(async (resolve, reject) => {
  //     path = Path.join(``, path);
  //     let fpath = (options && options.absolute) ? Path.join(options.absolute, path) : Path.join(__dirname, this.id, path);
  //     // console.log(`fpath: ${fpath}`);
  //     let stats = fs.lstatSync(fpath);
  //     let info = {
  //       path: Path.join(``, path),
  //       name: Path.basename(path)
  //     };
  //     if(stats.isDirectory()) {
  //       info.type = `directory`;
  //       if(options && options.deep) {
  //         let children = fs.readdirSync(fpath);
  //         info.children = [];
  //         for(let i in children) {
  //           let child = await this.getDirectorySchema(Path.join(path, children[i]), options);
  //           info.children.push(child);
  //         }
  //       }
  //     }
  //     else {
  //       info.type = `file`;
  //       if(options && options.base64) {
  //         let str = await this.readFile(path);
  //         info.base64 = this.base64Encode(str);
  //       }
  //       if(options && options.object) {
  //         let p = `/${fpath.replace(/^\//, ``)}`;
  //         //console.log(`require: ${p}`);
  //         if(require.cache[require.resolve(p)])
  //           delete require.cache[require.resolve(p)];
  //         info.object = require(p);
  //       }
  //     }
  //     resolve(info);
  //   });
  // }

  // // eslint-disable-next-line class-methods-use-this
  // getRootDirectory() {
  //   const split = __dirname.split(`/`);
  //   split.pop();
  //   split.pop();
  //   return split.join(`/`);
  // }

  readFile(path, encoding) {
    return new Promise((resolve, reject) => {
      const p = path.startsWith(`/`)
        ? Path.join(__dirname, this.id, path)
        : path;
      const e = encoding || `utf8`;
      fs.readFile(p, e, (err, data) => (err ? reject(err) : resolve(data)));
    });
  }

  writeFile(_path, data, _encoding) {
    return new Promise((resolve, reject) => {
      const encoding = _encoding || `utf8`;
      const path = Path.join(__dirname, this.id, _path);
      const dir = path.replace(/[^/]+$/g, ``);
      console.log(`dir : ${dir}`);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      fs.writeFile(path, data, encoding, (err) =>
        err ? reject(err) : resolve()
      );
    });
  }

  deleteDirectory(dirPath) {
    return new Promise((resolve, reject) => {
      const path = dirPath.startsWith(`/`)
        ? Path.join(__dirname, this.id, dirPath)
        : dirPath;
      console.log(`deleteDirectory(${path})`);
      rimraf(path, (err) => (err ? reject(err) : resolve({})));
    });
  }

  // base64Encode(data) {
  //   const buff = Buffer.from(data);
  //   const base64 = buff.toString(`base64`);
  //   return base64;
  // }

  // base64Decode(data, encoding) {
  //   const buff = Buffer.from(data, `base64`);
  //   const result = buff.toString(encoding || `utf8`);
  //   return result;
  // }

  // jsonToArray(json, keyOfId) {
  //   const arr = [];
  //   Object.keys(json).forEach((k) => {
  //     const elem = JSON.parse(JSON.stringify(json[k]));
  //     if (keyOfId) elem[keyOfId] = k;
  //     arr.push(elem);
  //   });
  //   // for (const i in json) {
  //   //   const elem = JSON.parse(JSON.stringify(json[i]));
  //   //   if (keyOfId) elem[keyOfId] = i;
  //   //   arr.push(elem);
  //   // }
  //   return arr;
  // }

  // arrayToJson(array, keyAttr) {
  //   const json = {};
  //   array.forEach((elem) => {
  //     json[elem[keyAttr]] = elem;
  //   });
  //   return JSON.parse(JSON.stringify(json));
  // }
}

module.exports = Service;
