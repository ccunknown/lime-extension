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

class ServiceObjects {
  constructor(parent) {
    this.parent = parent;
    this.objects = new Map();
  }

  /*
    Object config management section
  */

  getConfig(id) {
    console.log(
      `[${this.constructor.name}:${this.parent.id}]`,
      `getConfig(${id || ``})`
    );
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.parent.getConfig({ renew: true }))
        .then((conf) => {
          const { list } = conf;
          resolve(
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

  getConfigByAttribute(attr, val) {
    console.log(
      `[${this.constructor.name}:${this.parent.id}]`,
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
      `[${this.constructor.name}:${this.parent.id}]`,
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
    console.log(`[${this.constructor.name}:${this.parent.id}]`, `stop(${id})`);
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
    console.log(`[${this.constructor.name}:${this.parent.id}]`, `add() >> `);
    return new Promise((resolve, reject) => {
      let id;
      Promise.resolve()
        .then(() => this.parent.configTranslator.validate(config))
        .then(() => this.getTemplate(config.template, { deep: true }))
        .then((template) =>
          template
            ? this.parent.generateId()
            : new Error(`Template '${config.template}' not found!!!`)
        )
        .then((i) => {
          id = i;
        })
        .then(() => this.addToConfig(id, config))
        .then(() => this.addToService(id, config))
        .then(() => this.parent.reloadConfig())
        .then(() => this.getConfigWithState(id))
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  }

  addToService(id, configuration) {
    console.log(
      //
      `[${this.constructor.name}:${this.parent.id}]`,
      `addToService(${id}) >> `
    );
    console.log(
      `[${this.constructor.name}:${this.parent.id}]`,
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
            this.parent.serviceDir,
            `${template.path}`,
            `${SERVICE_OBJECT_NAME_PAIR[this.parent.id]}.js`
          );
          const Obj = require(path);
          object = new Obj(this.parent, id, config);
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
      `[${this.constructor.name}:${this.parent.id}]`,
      `addToConfig(${id}) >> `
    );
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() =>
          this.parent.configManager.addToConfig(
            config,
            `service-config.${this.parent.id}.list.${id}`
          )
        )
        .then((res) => resolve(res))
        .catch((err) => reject(err || new Errors.ErrorObjectNotReturn()));
    });
  }

  remove(id) {
    console.log(
      `[${this.constructor.name}:${this.parent.id}]`,
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
      `[${this.constructor.name}:${this.parent.id}]`,
      `removeFromConfig(${id}) >> `
    );
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() =>
          this.parent.configManager.deleteConfig(
            `service-config.${this.parent.id}.list.${id}`
          )
        )
        .then(() => resolve({}))
        .catch((err) => reject(err));
    });
  }

  removeFromService(id) {
    console.log(
      `[${this.constructor.name}:${this.parent.id}]`,
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
      `[${this.constructor.name}:${this.parent.id}]`,
      `update(${id || ``}) >> `
    );
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.parent.configTranslator.validate(config))
        .then(() => this.remove(id))
        .then(() => this.add(config))
        .then(() => resolve({}))
        .catch((err) => reject(err));
    });
  }

  get(id, options) {
    console.log(`[${this.constructor.name}:${this.parent.id}]`, `get(${id})`);
    // console.log(`[${this.constructor.name}:${this.parent.id}]`, Array.from(this.objects.keys()));
    return new Promise((resolve, reject) => {
      try {
        if (options && options.object) {
          resolve(
            id ? this.objects.get(id) : this.parent.mapToObject(this.objects)
          );
        } else if (id) {
          const object = this.objects.get(id);
          const json = object.oo.getSchema();
          resolve(JSON.parse(JSON.stringify(json)));
        } else {
          const objectList = this.parent.mapToObject(this.objects);
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
      `[${this.constructor.name}:${this.parent.id}]`,
      `getState(${id || ``})`
    );
    return new Promise((resolve, reject) => {
      if (id) {
        const object = this.objects.get(id) || undefined;
        let config = null;
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
          })
          .then(() => this.parent.isValidConfig(config))
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
          .then(() => (object ? object.getState() : subCondition.objectState))
          .then((objectState) => {
            subCondition.objectState = objectState;
          })
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

  getConfigWithState(id) {
    console.log(
      `[${this.constructor.name}:${this.parent.id}]`,
      `getConfigWithState(${id || ``})`
    );
    return new Promise((resolve, reject) => {
      let config = null;
      let state = null;
      Promise.resolve()
        .then(() => this.getConfig(id))
        .then((conf) => {
          config = conf;
          return this.getState(id);
        })
        .then((s) => {
          state = s;
        })
        .then(() => {
          const result = JSON.parse(JSON.stringify(config));
          if (id) result.state = state;
          else {
            Object.keys(result).forEach((i) => {
              if (Object.prototype.hasOwnProperty.call(state, i))
                result[i].state = state[i];
              else result[i].state = `undefined`;
            });
          }
          return result;
        })
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  }

  getByConfigAttribute(attr, value) {
    console.log(
      `[${this.constructor.name}:${this.parent.id}]`,
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
      `[${this.constructor.name}:${this.parent.id}]`,
      `getTemplate(${name || ``})`
    );
    return new Promise((resolve, reject) => {
      const serviceConfig = this.parent.getConfig();
      if (name) {
        const opttmp = options ? JSON.parse(JSON.stringify(options)) : {};
        opttmp.object = false;

        Promise.resolve()
          .then(() =>
            this.parent.directory.getSchema(serviceConfig.directory, options)
          )
          .then((objectDir) =>
            objectDir.children.find((elem) => elem.name === name)
          )
          .then((object) =>
            object
              ? this.parent.directory.getSchema(object.path, options)
              : null
          )
          .then((res) => resolve(res))
          .catch((err) => reject(err));
      } else {
        Promise.resolve()
          .then(() =>
            this.parent.directory.getSchema(serviceConfig.directory, options)
          )
          .then((objectList) => resolve(objectList.children))
          .catch((err) => reject(err));
      }
    });
  }
}

module.exports = ServiceObjects;
