/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-nested-ternary */
const SERVICE_OBJECT_NAME_PAIR = {
  "devices-service": `device`,
  "engines-service": `engine`,
  "sysport-service": `sysport`,
};

const fs = require(`fs`);
const rimraf = require(`rimraf`);
const Path = require(`path`);
const { EventEmitter } = require(`events`);

const { ObjectServiceState } = require(`../object-template/object-state`);
const serviceTools = require(`./service-tools`);
const { Errors } = require(`../../../constants/constants`);

class Service extends EventEmitter {
  constructor(extension, config, id) {
    super(extension.addonManager, extension.manifest.id);

    this.extension = extension;
    this.manifest = extension.manifest;
    this.addonManager = extension.addonManager;
    this.id = id;
    this.laborsManager = this.extension.laborsManager;
    this.configManager = this.extension.configManager;
    this.routesManager = this.extension.routesManager;

    // Assign 'service-tools' function into 'Service' object.
    Object.entries(serviceTools).forEach(([k, fn]) => {
      this[k] = fn;
    });

    this.config = JSON.parse(JSON.stringify(config));
    this.id = id;
    this.serviceDir = Path.join(Path.join(__dirname, `../`), this.id);
    this.objects = new Map();
    this.sharedResource = new Map();

    if (![`scripts-service`, `rtcpeer-service`].includes(id)) {
      console.log(`[${this.constructor.name}]`, `id:`, id);
      this.scriptsService =
        this.laborsManager.getService(`scripts-service`).obj;
      this.rtcpeerService =
        this.laborsManager.getService(`rtcpeer-service`).obj;
      const ConfigTranslatorObject = require(`../${this.id}/config-translator`);
      this.configTranslator = new ConfigTranslatorObject(this);
    }

    // this.initService();
    this.setupConfigHandler();
    // console.log(`Service constructor : ${this.id}`);
  }

  // initService() {
  //   this.initUtil();
  //   this.initObjectFunctions();
  // }

  // initUtil() {
  //   this.util = {
  //     path: {
  //       trim: (path) => {
  //         return path.replace(/^\//, ``).replace(/^\/$/, ``);
  //       },
  //     },
  //   };
  // }

  // initObjectFunctions() {
  //   this.objectFunctions = {
  //     patchConfig: (id, config) => {
  //       console.log(`${this.id}: objectFunctions: patchConfig`);
  //       return new Promise((resolve, reject) => {
  //         // if(config && config.hasOwnProperty(`addToService`)) {
  //         if (config) {
  //           Promise.resolve()
  //             .then(() =>
  //               this.configManager.updateConfig(
  //                 config,
  //                 `service-config.${this.id}.list.${id}._config`
  //               )
  //             )
  //             .then(() => resolve())
  //             .catch((err) => reject(err));
  //         } else {
  //           resolve();
  //         }
  //       });
  //     },
  //   };
  // }

  // applyObjectOptions(id, options = {}) {
  //   console.log(`[${this.constructor.name}]`, `applyObjectOptions() >> `);
  //   // console.log(`Service: applyObjectOptions(${id}) >> `);
  //   return new Promise((resolve, reject) => {
  //     Object.keys(options)
  //       .reduce(
  //         (prevProm, key) =>
  //           // eslint-disable-next-line no-prototype-builtins
  //           prevProm.then(() =>
  //             Object.prototype.hasOwnProperty.call(this.objectFunctions, key)
  //               ? this.objectFunctions[key](id, options[key])
  //               : Promise.resolve()
  //           ),
  //         Promise.resolve()
  //       )
  //       .then(() => resolve())
  //       .catch((err) => reject(err));
  //   });
  // }

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

  /*
    Config management section.
  */

  getConfig(options) {
    if (options && options.renew) {
      return Promise.resolve(
        options.save ? this.reloadConfig() : this.configManager.getConfig()
      );
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
  }

  setupConfigHandler() {
    this.configManager.event.on(`new-config`, () => {
      console.log(`New config!`);
    });
  }

  getObjectConfig(id) {
    console.log(`[${this.constructor.name}]`, `getObjectConfig(${id || ``})`);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.getSchema({ renew: true }))
        .then((conf) => {
          const { list } = conf;
          resolve(
            // eslint-disable-next-line no-nested-ternary
            id
              ? Object.prototype.hasOwnProperty.call(list, id)
                ? list[id]
                : {}
              : list
          );
        })
        .catch((err) => reject(err));
    });
  }

  /*
    Object management section
  */

  startObject(id) {
    console.log(`[${this.constructor.name}]`, `startObject(${id})`);
    return new Promise((resolve, reject) => {
      const object = this.objects.get(id);
      if (!object) reject(new Errors.ObjectNotFound(`${id}`));
      else {
        Promise.resolve()
          .then(() => object.oo.start())
          .then(() => resolve())
          .catch((err) => reject(err));
      }
    });
  }

  stopObject(id) {
    console.log(`[${this.constructor.name}]`, `stopObject(${id})`);
    return new Promise((resolve, reject) => {
      const object = this.objects.get(id);
      if (!object) reject(new Errors.ObjectNotFound(`${id}`));
      else {
        Promise.resolve()
          .then(() => object.oo.stop())
          .then(() => resolve())
          .catch((err) => reject(err));
      }
    });
  }

  add(config) {
    console.log(`[${this.constructor.name}]`, `add() >> `);
    // console.log(`config: ${JSON.stringify(config, null, 2)}`);
    return new Promise((resolve, reject) => {
      let id;
      Promise.resolve()
        .then(() => this.configTranslator.validate(config))
        .then(() => this.getTemplate(config.template, { deep: true }))
        .then((template) =>
          template
            ? this.generateId()
            : new Error(`Template '${config.template}' not found!!!`)
        )
        .then((i) => {
          id = i;
        })
        .then(() => this.addToConfig(id, config))
        .then(() => this.addToService(id, config))
        .then(() => this.reloadConfig())
        .then(() => this.getServiceObject(id))
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  }

  addToService(id, configuration) {
    console.log(
      //
      `[${this.constructor.name}]`,
      `addToService(${id}) >> `
    );
    console.log(
      `[${this.constructor.name}]`,
      `[${id}] config: ${JSON.stringify(configuration, null, 2)}`
    );
    return new Promise((resolve, reject) => {
      let object = this.objects.get(id);
      let config = configuration;
      Promise.resolve()
        //  Check duplicate & remove.
        .then(() => (object ? Promise.resolve() : this.removeFromService(id)))
        //  Identify config.
        .then(() =>
          config ? Promise.resolve(config) : this.getObjectConfig(id)
        )
        .then((conf) => {
          config = JSON.parse(JSON.stringify(conf));
        })
        //  Get object template.
        .then(() => this.getTemplate(config.template, { deep: true }))
        .then((template) => {
          if (!template)
            throw new Error(
              `Object template '${config.template}' not found!!!`
            );
          const path = Path.join(
            this.serviceDir,
            `${template.path}`,
            `${SERVICE_OBJECT_NAME_PAIR[this.id]}.js`
          );
          const Obj = require(path);
          object = new Obj(this, id, config);
        })
        .then(() => object.oo.init())
        .then(() => object.oo.start())
        // .then(() => this.applyObjectOptions(id, options))
        .then(() => {
          this.objects.set(id, object);
        })
        .then(() => object.getState())
        .then(() => object.oo.getSchema())
        .then((ret) => resolve(ret))
        .catch((err) => {
          reject(err);
        });
    });
  }

  addToConfig(id, config) {
    console.log(`[${this.constructor.name}]`, `addToConfig(id) >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() =>
          this.configManager.addToConfig(
            config,
            `service-config.${this.id}.list.${id}`
          )
        )
        .then((res) => resolve(res))
        .catch((err) => reject(err || new Errors.ErrorObjectNotReturn()));
    });
  }

  remove(id) {
    console.log(`[${this.constructor.name}]`, `removeObject() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.removeFromConfig(id))
        .then(() => this.removeFromService(id))
        .then(() => resolve({}))
        .catch((err) => reject(err));
    });
  }

  removeFromConfig(id) {
    console.log(`[${this.constructor.name}]`, `removeFromConfig(${id}) >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() =>
          this.configManager.deleteConfig(
            `service-config.${this.id}.list.${id}`
          )
        )
        .then(() => resolve({}))
        .catch((err) => reject(err));
    });
  }

  removeFromService(id) {
    console.log(`[${this.constructor.name}]`, `removeFromService(${id}) >> `);
    return new Promise((resolve, reject) => {
      const object = this.objects.get(id);
      if (object) {
        Promise.resolve()
          .then(() => object.oo.stop())
          .then(() => this.objects.delete(id))
          .then(() => resolve({}))
          .catch((err) => reject(err));
      } else {
        console.warn(`>> Object "${id}" not in service!!!`);
        resolve({});
      }
    });
  }

  update(id, config) {
    console.log(`[${this.constructor.name}]`, `update(${id || ``}) >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.configTranslator.validate(config))
        .then(() => this.remove(id))
        .then(() => this.add(config))
        .then(() => resolve({}))
        .catch((err) => reject(err));
    });
  }

  get(id, options) {
    console.log(`[${this.constructor.name}]`, `get(${id})`);
    return new Promise((resolve, reject) => {
      try {
        if (options && options.object)
          resolve(id ? this.objects.get(id) : Object.fromEntries(this.objects));
        else if (id) {
          const object = this.objects.get(id);
          const json = object.oo.getSchema();
          resolve(JSON.parse(JSON.stringify(json)));
        } else {
          const objectList = Object.fromEntries(this.objects);
          const json = [];
          Object.values(objectList).forEach((dev) =>
            json.push(dev.oo.getSchema())
          );
          resolve(JSON.parse(JSON.stringify(json)));
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  getByConfigAttribute(attr, value) {
    console.log(
      `[${this.constructor.name}]`,
      `getByConfigAttribute(${attr}, ${value})`
    );
    return new Promise((resolve, reject) => {
      try {
        const result = {};
        Array.from(this.objects.keys()).forEach((i) => {
          if (
            Object.prototype.hasOwnProperty.call(
              this.objects.get(i).config,
              attr
            ) &&
            this.objects.get(i).config[attr] === value
          )
            result[i] = this.object.get(i);
        });
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  }

  getServiceObject(id) {
    console.log(
      `[${this.constructor.name}]`,
      `getServiceObject(${id ? `${id}` : ``})`
    );
    return new Promise((resolve, reject) => {
      let config = null;
      let state = null;
      Promise.resolve()
        .then(() => this.getObjectConfig(id))
        .then((conf) => {
          config = conf;
          // return this.getObjectConfigWithState(id);
          return this.getObjectState(id);
        })
        .then((s) => {
          state = s;
        })
        .then(() => {
          const result = JSON.parse(JSON.stringify(config));
          // console.log(`>> result: ${JSON.stringify(result, null, 2)}`);
          if (id) result.state = state;
          else {
            // for(let i in result) {
            Object.keys(result).forEach((i) => {
              if (Object.prototype.hasOwnProperty.call(state, i))
                result[i].state = state[i];
              else result[i].state = `undefined`;
            });
            // }
          }
          return result;
        })
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  }

  getObjectState(id) {
    console.log(`[${this.constructor.name}]`, `getObjectState(${id || ``})`);
    return new Promise((resolve, reject) => {
      if (id) {
        const object = this.objects.get(id) || undefined;
        let config = null;
        const subCondition = {
          config: `unavailable`,
          enable: false,
          inServiceList: false,
          objectState: `undefined`,
          // serveQuality: { value: 0, level: 0 },
        };
        Promise.resolve()
          // Check object config (unavailable, invalid, valid).
          .then(() => this.getObjectConfig(id))
          .then((conf) => {
            config = conf;
          })
          .then(() => this.isValidConfig(config))
          .then((valid) => {
            subCondition.config =
              !config || !Object.keys(config).length
                ? ObjectServiceState.config.UNAVAILABLE
                : valid
                ? ObjectServiceState.config.VALID
                : ObjectServiceState.config.INVALID;
          })
          //  Enable ?
          .then(() => {
            subCondition.enable =
              config && config._config
                ? config._config.enable
                  ? ObjectServiceState.enable.ENABLE
                  : ObjectServiceState.enable.DISABLE
                : subCondition.enable;
          })
          //  In service list ?
          .then(() => {
            subCondition.inServiceList = object
              ? ObjectServiceState.inServiceList.INSERVICE
              : ObjectServiceState.inServiceList.NOTINSERVICE;
          })
          //  Object state ?
          .then(() => (object ? object.getState() : subCondition.objectState))
          .then((objectState) => {
            subCondition.objectState = objectState;
          })
          .then(() => resolve(subCondition))
          .catch((err) => reject(err));
      } else {
        const result = {};
        Promise.resolve()
          .then(() => this.getObjectConfig())
          .then((config) =>
            Object.keys(config).reduce((prevProm, i) => {
              return prevProm
                .then(() => this.getObjectState(i))
                .then((state) => {
                  result[i] = state;
                });
            }, Promise.resolve())
          )
          .then(() => resolve(result))
          .catch((err) => reject(err));
      }
    });
  }

  getObjectConfigByAttribute(attr, val) {
    console.log(
      `[${this.constructor.name}]`,
      `getObjectConfigByAttribute(${attr}, ${val}) >> `
    );
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.getObjectConfig())
        .then((config) => {
          const result = {};
          Object.keys(config).forEach((i) => {
            if (
              Object.prototype.hasOwnProperty.call(config[i], attr) &&
              config[i][attr] === val
            )
              result[i] = JSON.parse(JSON.stringify(config[i]));
          });
          return result;
        })
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  }

  getTemplate(name, options) {
    console.log(`[${this.constructor.name}]`, `getTemplate(${name || ``})`);
    return new Promise((resolve, reject) => {
      const serviceSchema = this.getSchema();
      if (name) {
        // let result = null;
        const opttmp = options ? JSON.parse(JSON.stringify(options)) : {};
        opttmp.object = false;

        Promise.resolve()
          .then(() => this.getDirectorySchema(serviceSchema.directory, options))
          .then((objectDir) =>
            objectDir.children.find((elem) => elem.name === name)
          )
          .then((object) =>
            object ? this.getDirectorySchema(object.path, options) : null
          )
          .then((res) => resolve(res))
          .catch((err) => reject(err));
      } else {
        Promise.resolve()
          .then(() => this.getDirectorySchema(serviceSchema.directory, options))
          .then((objectList) => resolve(objectList.children))
          .catch((err) => reject(err));
      }
    });
  }

  generateConfigSchema(params) {
    console.log(`[${this.constructor.name}]`, `generateConfigSchema() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.configTranslator.generateConfigSchema(params))
        .then((schema) => resolve(schema))
        .catch((err) => reject(err));
    });
  }

  isValidConfig(config) {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.configTranslator.validate(config))
        .then(() => resolve(true))
        .catch((err) => {
          if (err.name === `InvalidConfigSchema`) resolve(false);
          else reject(err);
        });
    });
  }

  translateConfig(config) {
    console.log(`[${this.constructor.name}]`, `getConfigTranslation() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.configTranslator.translate(config))
        .then((translated) => resolve(translated))
        .catch((err) => reject(err));
    });
  }

  /*
    Get compatiable object
  */

  getCompatibleEngine(tagArr) {
    console.log(
      `[${this.constructor.name}]`,
      `getCompatibleEngine(${tagArr.toString()}) >> `
    );
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.laborsManager.getService(`engines-service`).obj)
        .then((enginesService) => enginesService.getSchema({ renew: true }))
        .then((schema) => {
          const engines = schema.list;
          const result = this.jsonToArray(engines, `id`).filter((elem) =>
            tagArr.includes(elem.template)
          );
          return result.map((elem) => elem.id);
        })
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  }

  getCompatibleScript(tagArr) {
    console.log(`[${this.constructor.name}]`, `getCompatibleScript() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.scriptsService.get(null, { deep: true }))
        .then((scripts) => {
          const result = scripts.filter((elem) => {
            // console.log(`tags: ${elem.meta.tags}`);
            return !!elem.meta.tags.find((e) => tagArr.includes(e));
          });
          return result.map((elem) => elem.name);
        })
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  }

  /*
    File & Directory management section
  */

  /*
    options: {
      base64: boolean,
      deep: boolean,
      absolute: `string (absolute path)`,
      object: boolean
    }
  */
  getDirectorySchema(dirPath, options) {
    // console.log(`[${this.constructor.name}]`, `dirPath:`, dirPath);
    try {
      const path = Path.join(``, dirPath);
      const fpath =
        options && options.absolute
          ? Path.join(options.absolute, path)
          : Path.join(this.serviceDir, path);
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
          const str = fs.readFileSync(fpath);
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
  }

  readFile(path, encoding) {
    return new Promise((resolve, reject) => {
      const p = path.startsWith(`/`) ? Path.join(this.serviceDir, path) : path;
      const e = encoding || `utf8`;
      fs.readFile(p, e, (err, data) => (err ? reject(err) : resolve(data)));
    });
  }

  writeFile(_path, data, _encoding) {
    return new Promise((resolve, reject) => {
      const encoding = _encoding || `utf8`;
      const path = Path.join(this.serviceDir, _path);
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
        ? Path.join(this.serviceDir, dirPath)
        : dirPath;
      console.log(`deleteDirectory(${path})`);
      rimraf(path, (err) => (err ? reject(err) : resolve({})));
    });
  }

  /*
    Shared resource management section
  */

  setSharedResource(key, obj, overwrite = false) {
    if (overwrite || !this.sharedResource.has(key))
      this.sharedResource.set(key, obj);
  }

  getSharedResource(key) {
    return this.sharedResource.get(key);
  }

  /*
    Miscellaneous section
  */

  generateId(prefix = `lime-${SERVICE_OBJECT_NAME_PAIR[this.id]}`) {
    console.log(`[${this.constructor.name}]`, `generateId() >> `);
    return new Promise((resolve, reject) => {
      let id;
      const maxIndex = 10000;
      Promise.resolve()
        .then(() => this.getSchema({ renew: true }))
        .then((config) => config.list)
        .then((list) => {
          for (let i = 1; i < maxIndex; i += 1) {
            console.log(
              `[${this.constructor.name}]`,
              `id list: ${Object.keys(list)}`
            );
            id = `${prefix}-${i}`;
            if (!Object.prototype.hasOwnProperty.call(list, id)) break;
          }
          return id;
        })
        .then((ret) => resolve(ret))
        .catch((err) => reject(err));
    });
  }
}

module.exports = Service;
