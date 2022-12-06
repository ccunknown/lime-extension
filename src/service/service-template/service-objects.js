/* eslint-disable no-underscore-dangle */
/* eslint-disable no-nested-ternary */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const SERVICE_OBJECT_NAME_PAIR = {
  "devices-service": `device`,
  "engines-service": `engine`,
  "ioports-service": `ioport`,
};

const Path = require(`path`);
const { ObjectServiceState } = require(`../object-template/object-state`);
const { Errors } = require(`../../../constants/constants`);
const ServiceObjectsMetric = require("./service-objects-metric");

class ServiceObjects {
  constructor(service) {
    this.service = service;
    this.objects = new Map();
    this.metric = new ServiceObjectsMetric(service);
  }

  /*
    Object config management section
  */

  // getConfig2(id) {
  //   console.log(
  //     `[${this.constructor.name}:${this.service.id}]`,
  //     `getConfig(${id || ``})`
  //   );
  //   return new Promise((resolve, reject) => {
  //     Promise.resolve()
  //       .then(() => this.service.getConfig({ renew: true }))
  //       .then((conf) => {
  //         const { list } = conf;
  //         resolve(
  //           id
  //             ? Object.prototype.hasOwnProperty.call(list, id)
  //               ? list[id]
  //               : {}
  //             : list
  //         );
  //       })
  //       .catch((err) => reject(err));
  //   });
  // }

  getConfig(id, config) {
    console.log(
      `[${this.constructor.name}:${this.service.id}]`,
      `getConfig(${id || ``})`
    );
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(
          () =>
            config || Promise.resolve(this.service.getConfig({ renew: true }))
        )
        .then((conf) => {
          // console.log(`conf:`, conf);
          return config || conf.list;
        })
        .then((conf) => {
          // console.log(`conf:`, conf);
          if (id) {
            const idArr = id.split(`.`);
            resolve(
              idArr.length > 1
                ? this.getConfig(
                    idArr.slice(1).join(`.`),
                    conf[idArr[0]].properties
                  )
                : conf[id]
            );
          } else resolve(conf);
        })
        .catch((err) => reject(err));
    });
  }

  getConfigByAttribute(attr, val) {
    console.log(
      `[${this.constructor.name}:${this.service.id}]`,
      `getConfigByAttribute(${attr}, ${val}) >> `
    );
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.getConfig())
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

  /*
    Object management section
  */

  start(id) {
    console.log(
      `[${this.constructor.name}:${this.service.id}]`,
      `startObject(${id})`
    );
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

  stop(id) {
    console.log(`[${this.constructor.name}:${this.service.id}]`, `stop(${id})`);
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
    console.log(`[${this.constructor.name}:${this.service.id}]`, `add() >> `);
    return new Promise((resolve, reject) => {
      let id;
      Promise.resolve()
        .then(() => this.service.configTranslator.validate(config))
        .then(() => this.getTemplate(config.template, { deep: true }))
        .then((template) =>
          template
            ? this.service.generateId()
            : new Error(`Template '${config.template}' not found!!!`)
        )
        .then((i) => {
          id = i;
        })
        .then(() => this.addToConfig(id, config))
        .then(() => this.addToService(id, config))
        .then(() => this.service.reloadConfig())
        .then(() => this.getConfigWithState(id))
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  }

  addToService(id, configuration) {
    console.log(
      //
      `[${this.constructor.name}:${this.service.id}]`,
      `addToService(${id}) >> `
    );
    console.log(
      `[${this.constructor.name}:${this.service.id}]`,
      `[${id}] config: ${JSON.stringify(configuration, null, 2)}`
    );
    return new Promise((resolve, reject) => {
      let object = this.objects.get(id);
      let config = configuration;
      Promise.resolve()
        //  Check duplicate & remove.
        .then(() => (object ? Promise.resolve() : this.removeFromService(id)))
        //  Identify config.
        .then(() => (config ? Promise.resolve(config) : this.getConfig(id)))
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
            this.service.serviceDir,
            `${template.path}`,
            `${SERVICE_OBJECT_NAME_PAIR[this.service.id]}.js`
          );
          const Obj = require(path);
          object = new Obj(this.service, id, config);
        })
        .then(() => object.oo.init())
        .then(() => object.oo.start())
        .then(() => this.objects.set(id, object))
        .then(() => object.getState())
        .then(() => object.oo.getSchema())
        .then((ret) => resolve(ret))
        .catch((err) => {
          reject(err);
        });
    });
  }

  addToConfig(id, config) {
    console.log(
      `[${this.constructor.name}:${this.service.id}]`,
      `addToConfig(${id}) >> `
    );
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() =>
          this.service.configManager.addToConfig(
            config,
            `service-config.${this.service.id}.list.${id}`
          )
        )
        .then((res) => resolve(res))
        .catch((err) => reject(err || new Errors.ErrorObjectNotReturn()));
    });
  }

  remove(id) {
    console.log(
      `[${this.constructor.name}:${this.service.id}]`,
      `removeObject() >> `
    );
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.removeFromConfig(id))
        .then(() => this.removeFromService(id))
        .then(() => resolve({}))
        .catch((err) => reject(err));
    });
  }

  removeFromConfig(id) {
    console.log(
      `[${this.constructor.name}:${this.service.id}]`,
      `removeFromConfig(${id}) >> `
    );
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() =>
          this.service.configManager.deleteConfig(
            `service-config.${this.service.id}.list.${id}`
          )
        )
        .then(() => resolve({}))
        .catch((err) => reject(err));
    });
  }

  removeFromService(id) {
    console.log(
      `[${this.constructor.name}:${this.service.id}]`,
      `removeFromService(${id}) >> `
    );
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
    console.log(
      `[${this.constructor.name}:${this.service.id}]`,
      `update(${id || ``}) >> `
    );
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.service.configTranslator.validate(config))
        .then(() => this.remove(id))
        .then(() => this.add(config))
        .then(() => resolve({}))
        .catch((err) => reject(err));
    });
  }

  get(id, options) {
    console.log(`[${this.constructor.name}:${this.service.id}]`, `get(${id})`);
    // console.log(`[${this.constructor.name}:${this.service.id}]`, Array.from(this.objects.keys()));
    return new Promise((resolve, reject) => {
      try {
        if (options && options.object) {
          resolve(
            id ? this.objects.get(id) : this.service.mapToObject(this.objects)
          );
        } else if (id) {
          const object = this.objects.get(id);
          const json = object.oo.getSchema();
          resolve(JSON.parse(JSON.stringify(json)));
        } else {
          const objectList = this.service.mapToObject(this.objects);
          resolve(objectList);
          // const json = [];
          // Object.values(objectList).forEach((dev) =>
          //   json.push(dev.oo.getSchema())
          // );
          // resolve(JSON.parse(JSON.stringify(json)));
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  getState(id) {
    console.log(
      `[${this.constructor.name}:${this.service.id}]`,
      `getState(${id || ``})`
    );
    return new Promise((resolve, reject) => {
      if (id) {
        const idArr = id.split(`.`);
        const object =
          idArr.length > 1
            ? this.objects.get(idArr[0]).oo.getChild(idArr[1])
            : this.objects.get(id) || undefined;
        let config = null;
        let parentConfig = null;
        // Default state.
        const subCondition = {
          config: ObjectServiceState.config.UNAVAILABLE,
          enable: ObjectServiceState.enable.DISABLE,
          inServiceList: ObjectServiceState.inServiceList.NOTINSERVICE,
          objectState: `undefined`,
        };
        Promise.resolve()
          // Check object config (unavailable, invalid, valid).
          .then(() => this.getConfig(id))
          .then((conf) => {
            config = conf;
            if (idArr.length > 1) return this.getConfig(idArr[0]);
            return undefined;
          })
          .then((conf) => {
            parentConfig = conf;
          })
          .then(() => this.service.isValidConfig(parentConfig || config))
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
            subCondition.enable = config
              ? config.enable
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
          .then(() =>
            object ? object.oo.getState() : subCondition.objectState
          )
          .then((objectState) => {
            subCondition.objectState = objectState;
          })
          .then(() => console.log(`state[${id}]:`, subCondition))
          .then(() => resolve(subCondition))
          .catch((err) => reject(err));
      } else {
        const result = {};
        Promise.resolve()
          .then(() => this.getConfig())
          .then((config) =>
            Object.keys(config).reduce((prevProm, i) => {
              return prevProm
                .then(() => this.getState(i))
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

  // getConfigWithState2(id) {
  //   console.log(
  //     `[${this.constructor.name}:${this.service.id}]`,
  //     `getConfigWithState(${id || ``})`
  //   );
  //   return new Promise((resolve, reject) => {
  //     let config = null;
  //     let state = null;
  //     Promise.resolve()
  //       .then(() => this.getConfig(id))
  //       .then((conf) => {
  //         config = conf;
  //         return this.getState(id);
  //       })
  //       .then((s) => {
  //         state = s;
  //       })
  //       .then(() => {
  //         const result = JSON.parse(JSON.stringify(config));
  //         if (id) result.state = state;
  //         else {
  //           Object.keys(result).forEach((i) => {
  //             if (Object.prototype.hasOwnProperty.call(state, i))
  //               result[i].state = state[i];
  //             else result[i].state = `undefined`;
  //           });
  //         }
  //         return result;
  //       })
  //       .then((res) => resolve(res))
  //       .catch((err) => reject(err));
  //   });
  // }

  getConfigWithState(id) {
    console.log(
      `[${this.constructor.name}:${this.service.id}]`,
      `getConfigWithState(${id || ``})`
    );
    return new Promise((resolve, reject) => {
      if (id) {
        let config;
        let state;
        const properties = {};
        Promise.resolve()
          .then(() => this.getConfig(id))
          .then((conf) => {
            config = conf;
          })
          .then(() => this.getState(id))
          .then((s) => {
            state = s;
          })
          .then(() => {
            // console.log(`> id:`, id);
            // console.log(`> config:`, config);
            if (Object.prototype.hasOwnProperty.call(config, `properties`))
              return Object.keys(config.properties)
                .reduce((prevProm, pid) => {
                  return prevProm
                    .then(() => this.getConfigWithState([id, pid].join(`.`)))
                    .then((ret) => {
                      properties[pid] = ret;
                    });
                }, Promise.resolve())
                .then(() => {
                  config.properties = properties;
                });
            return {};
          })
          .then(() => {
            const result = JSON.parse(JSON.stringify(config));
            result.state = state;
            return result;
          })
          .then((res) => resolve(res))
          .catch((err) => reject(err));
      } else {
        const result = {};
        Promise.resolve()
          .then(() => this.getConfig())
          .then((conf) =>
            Object.keys(conf).reduce((prevProm, key) => {
              // console.log(`>>>>>> key:`, key);
              return prevProm
                .then(() => this.getConfigWithState(key))
                .then((ret) => {
                  result[key] = ret;
                });
            }, Promise.resolve())
          )
          .then(() => resolve(result))
          .catch((err) => reject(err));
      }
    });
  }

  getByConfigAttribute(attr, value) {
    console.log(
      `[${this.constructor.name}:${this.service.id}]`,
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
            result[i] = this.objects.get(i);
        });
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  }

  getTemplate(name, options) {
    console.log(
      `[${this.constructor.name}:${this.service.id}]`,
      `getTemplate(${name || ``})`
    );
    return new Promise((resolve, reject) => {
      const serviceConfig = this.service.getConfig();
      if (name) {
        const opttmp = options ? JSON.parse(JSON.stringify(options)) : {};
        opttmp.object = false;

        Promise.resolve()
          .then(() =>
            this.service.directory.getSchema(serviceConfig.directory, options)
          )
          .then((objectDir) =>
            objectDir.children.find((elem) => elem.name === name)
          )
          .then((object) =>
            object
              ? this.service.directory.getSchema(object.path, options)
              : null
          )
          .then((res) => resolve(res))
          .catch((err) => reject(err));
      } else {
        Promise.resolve()
          .then(() =>
            this.service.directory.getSchema(serviceConfig.directory, options)
          )
          .then((objectList) => resolve(objectList.children))
          .catch((err) => reject(err));
      }
    });
  }

  generateMetric(id) {
    return this.metric.buildMetric(id);
  }
}

module.exports = ServiceObjects;
