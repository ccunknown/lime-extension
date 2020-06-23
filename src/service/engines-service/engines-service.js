'use strict'

const EventEmitter = require('events').EventEmitter;

const Database = require('../../lib/my-database');
const {Defaults, Errors} = require('../../../constants/constants');

const SerialPort = require(`serialport`);

//const ModbusRTU = require('modbus-serial');
const Path = require(`path`);

class enginesService extends EventEmitter {
  constructor(extension, config) {
    console.log(`enginesService: contructor() >> `);
    super(extension.addonManager, extension.manifest.id);

    this.extension = extension;
    this.manifest = extension.manifest;
    this.addonManager = extension.addonManager;

    this.laborsManager = this.extension.laborsManager;
    this.config = config;

    this.engineList = {};
    this.engineTemplateList = {};
    this.init();
  }

  init() {
    console.log(`enginesService: init() >> `);
    return new Promise((resolve, reject) => {
      //let sysport = this.laborsManager.getService(`sysport-service`);
      //this.sysportService = sysport.obj;
      resolve();
    });
  }

  initEngineTemplate(config) {
    console.log(`enginesService: initEngineTemplate() >> `);
    return new Promise((resolve, reject) => {
      config = (config) ? config : this.config;
      let list = config[`engines-service`].template;
      this.engineTemplateList = {};
      for(let i in list) {
        let template = {
          "schema": list[i],
          "object": require(`./${Path.join(`./`, list[i].path)}`)
        };
        this.engineTemplateList[list[i].name] = template;
      }
      resolve();
    });
  }

  initEngine(config) {
    console.log(`enginesService: initEngine() >> `);
    return new Promise((resolve, reject) => {
      config = (config) ? config : this.config;
      let list = config[`engines-service`].list;
      this.engineList = {};
      for(let i in list) {
        let engine = {
          "schema": list[i],
          "object": new (this.engineTemplateList[list[i].engine].object)()
        };
        this.engineList[engine.schema.name] = engine;
        console.log(`initEngine: ${engine.schema.name}`);
      }
      resolve();
    });
  }

  startEngine() {
    console.log(`enginesService: startEngine() >> `);
    return new Promise(async (resolve, reject) => {
      this.sysportService = (await this.laborsManager.getService(`sysport-service`)).obj;
      for(let i in this.engineList) {
        //console.log(`sysport : `);
        //console.log(this.sysportService);
        let port = (await this.sysportService.getPort(this.engineList[i].schema.port)).object;
        this.engineList[i].object.init(port);
        this.engineList[i].object.start();
      }
      resolve();
    });
  }

  start() {
    return new Promise(async (resolve, reject) => {
      await this.initEngineTemplate();
      await this.initEngine();
      await this.startEngine();
      resolve();
    });
  }

  getEngines() {
    return this.engineList;
  }

  getEngine(key) {
    console.log(`enginesService: getEngine(${key}) >> `);
    console.log(this.engineList);
    return this.engineList[key];
  }

  getEngineByAttribute(attr, val) {
    for(let i in this.engineList) {
      if(this.engineList[i].schema[attr] == val)
        return this.engineList[i];
    }
    return null;
  }

  getEngineTemplate(key) {
    return this.engineTemplateList[key];
  }

  getFileInDirectory(dirPath) {
    const path = require(`path`);
    const fs = require(`fs`);

    const dest = path.join(__dirname, dirPath);

    fs.readdir(directoryPath, (err, files) => {
      if(err)
        return console.error(`Unable to scan directory: '${err}'`);
      return files;
    });
  }
}

module.exports = enginesService;