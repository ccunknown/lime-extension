'use strict';

const Validator = require('jsonschema').Validator;
const EventEmitter = require('events').EventEmitter;
const Database = require('./lib/my-database');
const {Defaults, Errors} = require('../constants/constants.js');

const util = require('util');

class ConfigManager {
  constructor(extension) {
    this.addonManager = extension.addonManager;
    this.manifest = extension.manifest;
    this.validator = new Validator();
    this.event = new EventEmitter();
  }

  getConfig() {
    console.log("getConfig() >> ");
    return new Promise((resolve, reject) => {
      try {
        this.getConfigFromDatabase().then((config) => {
          if(this.isEmptyObject(config))
            config = this.initialConfig();
          let validateInfo = this.validate(config);
          if(validateInfo.errors.length) {
            console.warn(`Invalid config!!!`);
            console.warn(JSON.stringify(validateInfo.errors, null, 2));
          }
          else
            console.log(`Valid config.`);
          resolve(config);
        });
      } catch(err) {
        console.log(`getConfig error.`);
        err = (err) ? err : new Errors.ErrorObjectNotReturn();
        reject(err);
      }
    });
  }

  saveConfig(config) {
    console.log("saveConfig() >> ");
    return new Promise((resolve, reject) => {
      this.saveConfigToDatabase(config)
      .then((conf) => resolve(conf))
      .catch((err) => {
        //console.log(`saveConfig() : found error : ${err}`);
        err = (err) ? err : new Errors.ErrorObjectNotReturn();
        reject(err);
      });
    });
  }

  deleteConfig() {
    console.log(`deleteConfig() >> `);
    return new Promise((resolve, reject) => {
      this.deleteConfigFromDatabase()
      .then(() => this.getConfig())
      .then((conf) => resolve(conf))
      .catch((err) => {
        err = (err) ? err : new Errors.ErrorObjectNotReturn();
        reject(err);
      });
    });
  }

  getConfigFromDatabase() {
    console.log("getConfigFromDatabase() >> ");
    return new Promise((resolve, reject) => {
      if(Database) {
        //console.log("{Database} found.");
        this.db = new Database(this.manifest.name);
        //console.log("{Database} imported.");
        this.db.open()
        .then(() => {
          //console.log("opened database.");
          var config = this.db.loadConfig();
          this.db.close();
          resolve(config);
        });
      }
      else {
        console.error(`{Database} not found!!!`);
        reject(new Errors.DatabaseObjectUndefined(Database));
      }
    });
  }

  saveConfigToDatabase(config) {
    console.log("saveConfigToDatabase() >> ");
    return new Promise((resolve, reject) => {
      //  Validate config.
      let validateInfo = this.validate(config);
      if(validateInfo.errors.length)
        throw(new Errors.InvalidConfigSchema(validateInfo.errors));
      //  Save to Database
      else {
        if(Database) {
          //console.log("{Database found.}");
          this.db = new Database(this.manifest.name);
          //console.log("{Database} imported.");
          this.db.open()
          .then(() => {
            //console.log("opened database.");
            this.db.saveConfig(validateInfo.instance);
            this.db.close();
            resolve(validateInfo.instance);
          });
        }
        else {
          console.error(`{Database} not found!!!`);
          reject(new Errors.DatabaseObjectUndefined(Database));
        }
      }
    });
  }

  deleteConfigFromDatabase() {
    console.log("deleteConfigFromDatabase() >> ");
    return new Promise((resolve, reject) => {
      if(Database) {
        this.db = new Database(this.manifest.name);
        this.db.open()
        .then(() => {
          this.db.saveConfig({});
          this.db.close();
          resolve({});
        });
      }
      else {
        console.error(`{Database} not found!!!`);
        reject(new Errors.DatabaseObjectUndefined(Database));
      }
    });
  }

  initialConfig() {
    let config = JSON.parse(JSON.stringify(Defaults.config));
    return config;
  }

  isEmptyObject(obj) {
    return !Object.keys(obj).length;
  }

  getDefaults() {
    //return Object.assign({}, Defaults);
    return JSON.parse(JSON.stringify(Defaults));
  }

  getSchema() {
    //return Object.assign({}, Defaults.schema);
    return JSON.parse(JSON.stringify(Defaults.schema));
  }

  validate(data, schema) {
    schema = (schema) ? schema : this.getSchema();
    return this.validator.validate(data, schema);
  }

  validateAccount(data) {
    let schema = (schema) ? schema : this.getSchema().account;
    return this.validator.validate(data, schema);
  }
}

module.exports = ConfigManager;