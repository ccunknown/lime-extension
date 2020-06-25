'use strict'

const Path = require(`path`);
const SerialPort = require(`serialport`);

const Service = require(`../service`);
const Database = require('../../lib/my-database');
const {Defaults, Errors} = require('../../../constants/constants');

class enginesService extends Service {
  constructor(extension, config, id) {
    console.log(`enginesService: contructor() >> `);
    super(extension, config, id);
  }

  init(config) {
    console.log(`enginesService: init() >> `);
    return new Promise((resolve, reject) => {
      //let sysport = this.laborsManager.getService(`sysport-service`);
      //this.sysportService = sysport.obj;
      this.config = (config) ? config : this.config;
      this.engineList = {};
      this.engineTemplateList = {};
      resolve();
    });
  }

  initEngineTemplate(config) {
    console.log(`enginesService: initEngineTemplate() >> `);
    return new Promise((resolve, reject) => {
      config = (config) ? config : this.config;
      //let list = config[`engines-service`].template;
      this.engineTemplateList = {};
      let serviceSchema = this.getSchema();
      let list = serviceSchema.config.template;
      for(let i in list) {
        console.log(`engine path : ${list[i].path}`);
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
      //let list = config[`engines-service`].list;
      this.engineList = {};
      let serviceSchema = this.getSchema();
      let list = serviceSchema.config.list;
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