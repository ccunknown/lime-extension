/* eslint-disable class-methods-use-this */
const Path = require(`path`);
const { Validator } = require(`jsonschema`);
const { EventEmitter } = require(`events`);
// const Database = require(`./lib/my-database-backup`);
const Database = require(`./lib/my-database`);
const { Defaults, Errors } = require(`../constants/constants.js`);

// const util = require(`util`);

class ConfigManager {
  constructor(extension) {
    this.addonManager = extension.addonManager;
    this.manifest = extension.manifest;
    this.validator = new Validator();
    this.event = new EventEmitter();
    // this.db = new Database(this.manifest.name);
    const confPath = Path.join(
      extension.addonManager.getUserProfile().dataDir,
      extension.manifest.id,
      // `settings.json`
    );
    this.db = new Database(confPath);
  }

  getConfig(path) {
    console.log(`[${this.constructor.name}]`, `getConfig() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.getConfigFromDatabase())
        .then((conf) =>
          this.isEmptyObject(conf) ? this.initialConfig() : conf
        )
        .then((conf) => {
          const validateInfo = this.validate(conf);
          if (validateInfo.errors.length) {
            console.log(`conf:`, typeof conf, conf);
            console.warn(`Invalid config!!!`);
            console.warn(JSON.stringify(validateInfo.errors, null, 2));
          } else console.log(`Valid config.`);
          return conf;
        })
        .then((conf) => (path ? this.getJsonElement(conf, path) : conf))
        .then((conf) => {
          // console.log(`[${this.constructor.name}]`, `config:`, JSON.stringify(conf));
          return conf;
        })
        .then((conf) => resolve(conf))
        .catch((err) => reject(err || new Errors.ErrorObjectNotReturn()));
    });
  }

  saveConfig(config) {
    console.log(`[${this.constructor.name}]`, `saveConfig() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.saveConfigToDatabase(config))
        .then((conf) => resolve(conf))
        .catch((err) => reject(err || new Errors.ErrorObjectNotReturn()));
    });
  }

  updateConfig(update, path) {
    console.log(`[${this.constructor.name}]`, `updateConfig() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.getConfig())
        .then((config) => {
          const res = this.updateJsonElement(config, path, update);
          if (res) return JSON.parse(JSON.stringify(config));
          throw new Errors.PathNotFound(path);
        })
        .then((conf) => this.saveConfigToDatabase(conf))
        .then(() => resolve(update))
        .catch((err) => {
          console.log(`updateConfig error.`);
          reject(err || new Errors.ErrorObjectNotReturn());
        });
    });
  }

  addToConfig(newElem, path) {
    console.log(`[${this.constructor.name}]`, `addToConfig(${path}) >> `);
    console.log(
      `[${this.constructor.name}]`,
      `element:`,
      JSON.stringify(newElem)
    );
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.getConfig())
        .then((config) => {
          const err = this.addJsonElement(config, path, newElem)
          if (err) throw err;
          else return config;
        })
        .then((conf) => this.saveConfigToDatabase(conf))
        .then(() => resolve(newElem))
        .catch((err) => {
          console.log(`add config element error.`);
          reject(err || new Errors.ErrorObjectNotReturn());
        });
    });
  }

  deleteConfig(path) {
    console.log(`[${this.constructor.name}]`, `deleteConfig() >> `);
    return new Promise((resolve, reject) => {
      if (path) {
        Promise.resolve()
          .then(() => this.getConfig())
          .then((config) => {
            const err = this.deleteJsonElement(config, path);
            console.log(`config: ${JSON.stringify(config, null, 2)}`);
            if (err) throw err;
            else return config;
          })
          .then((conf) => this.saveConfigToDatabase(conf))
          .then(() => resolve({}))
          .catch((err) => {
            console.log(`add config element error.`);
            reject(err || new Errors.ErrorObjectNotReturn());
          });
      } else {
        Promise.resolve()
          .then(() => this.deleteConfigFromDatabase())
          .then(() => this.getConfig())
          .then((conf) => resolve(conf))
          .catch((err) => {
            reject(err || new Errors.ErrorObjectNotReturn());
          });
      }
    });
  }

  getConfigFromDatabase() {
    console.log(`[${this.constructor.name}]`, `getConfigFromDatabase() >> `);
    return new Promise((resolve, reject) => {
      if (Database) {
        // console.log("{Database} found.");
        // this.db = new Database(this.manifest.name);
        // console.log("{Database} imported.");
        let config = null;
        Promise.resolve()
          .then(() => this.db.open())
          .then(() => this.db.loadConfig())
          .then((conf) => {
            config = conf;
          })
          .then(() => this.db.close())
          .then(() => resolve(config))
          .catch((err) => reject(err));
      } else {
        console.error(`{Database} not found!!!`);
        reject(new Errors.DatabaseObjectUndefined(Database));
      }
    });
  }

  saveConfigToDatabase(config) {
    console.log(`[${this.constructor.name}]`, `saveConfigToDatabase() >> `);
    return new Promise((resolve, reject) => {
      //  Validate config.
      const validateInfo = this.validate(config);
      if (validateInfo.errors.length)
        // throw new Errors.InvalidConfigSchema(validateInfo.errors);
        reject(new Errors.InvalidConfigSchema(validateInfo.errors));
      //  Save to Database
      else if (Database) {
        // console.log("{Database found.}");
        // this.db = new Database(this.manifest.name);
        // console.log("{Database} imported.");
        Promise.resolve()
          .then(() => this.db.open())
          .then(() => this.db.saveConfig(validateInfo.instance))
          .then(() => this.db.close())
          .then(() => resolve(validateInfo.instance))
          .catch((err) => reject(err));
      } else {
        console.error(`{Database} not found!!!`);
        reject(new Errors.DatabaseObjectUndefined(Database));
      }
    });
  }

  deleteConfigFromDatabase() {
    console.log(`${this.constructor.name}`, `deleteConfigFromDatabase() >> `);
    return new Promise((resolve, reject) => {
      if (Database) {
        // this.db = new Database(this.manifest.name);
        Promise.resolve()
          .then(() => this.db.open())
          .then(() => {
            this.db.saveConfig({});
            this.db.close();
          })
          .then(() => resolve({}))
          .catch((err) => reject(err));
      } else {
        console.error(`{Database} not found!!!`);
        reject(new Errors.DatabaseObjectUndefined(Database));
      }
    });
  }

  initialConfig() {
    console.log(`[${this.constructor.name}]:`, `initialConfig() >> `);
    const config = JSON.parse(JSON.stringify(Defaults.config));
    return config;
  }

  isEmptyObject(obj) {
    return !Object.keys(obj).length;
  }

  getDefaults() {
    // return Object.assign({}, Defaults);
    return JSON.parse(JSON.stringify(Defaults));
  }

  getSchema() {
    // return Object.assign({}, Defaults.schema);
    return JSON.parse(JSON.stringify(Defaults.schema));
  }

  validate(data, schema) {
    const schematic = schema || this.getSchema();
    return this.validator.validate(data, schematic);
  }

  getJsonElement(src, path) {
    if (path && path.length) {
      const indexArr = path.split(`.`);
      const index = indexArr.shift();
      return typeof src === `object` &&
        Object.prototype.hasOwnProperty.call(src, index)
        ? this.getJsonElement(src[index], indexArr.join(`.`))
        : undefined;
    }
    return src;
  }

  updateJsonElement(src, path, data) {
    if (path && path.length) {
      const indexArr = path.split(`.`);
      const index = indexArr.shift();
      return Object.prototype.hasOwnProperty.call(src, index)
        ? this.updateJsonElement(src[index], indexArr.join(`.`), data)
        : false;
    }
    Object.keys(data).forEach((i) => {
      // eslint-disable-next-line no-param-reassign
      src[i] = data[i];
    });
    return true;
  }

  addJsonElement(src, path, data) {
    const indexArr = path.split(`.`);
    const arrLen = indexArr.length;
    const index = indexArr.shift();

    if (arrLen === 0) {
      return new Errors.PathInvalid(path);
    }
    if (arrLen === 1 && Object.prototype.hasOwnProperty.call(src, index)) {
      return new Errors.FoundDuplicate(index);
    }
    if (arrLen === 1) {
      // eslint-disable-next-line no-param-reassign
      src[index] = {};
      Object.keys(data).forEach((i) => {
        // eslint-disable-next-line no-param-reassign
        src[index][i] = data[i];
      });
      return undefined;
    }
    if (Object.prototype.hasOwnProperty.call(src, index)) {
      return this.addJsonElement(src[index], indexArr.join(`.`), data);
    }
    return new Errors.PathInvalid(path);
  }

  deleteJsonElement(src, path) {
    const indexArr = path.split(`.`);
    const arrLen = indexArr.length;
    const index = indexArr.shift();

    if (arrLen === 0) return new Errors.PathInvalid(path);
    if (arrLen === 1) {
      if (Object.prototype.hasOwnProperty.call(src, index)) {
        // eslint-disable-next-line no-param-reassign
        delete src[index];
        return undefined;
      }
      return new Errors.ObjectNotFound(index);
    }
    if (Object.prototype.hasOwnProperty.call(src, index)) {
      return this.deleteJsonElement(src[index], indexArr.join(`.`));
    }
    return new Errors.PathInvalid(path);
  }
}

module.exports = ConfigManager;
