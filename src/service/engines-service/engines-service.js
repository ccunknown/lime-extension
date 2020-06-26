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
    return new Promise(async (resolve, reject) => {
      this.sysportService = (await this.laborsManager.getService(`sysport-service`)).obj;
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
    return new Promise(async (resolve, reject) => {
      config = (config) ? config : this.config;
      //let list = config[`engines-service`].list;
      this.engineList = {};
      let serviceSchema = this.getSchema();
      let list = serviceSchema.config.list;
      for(let i in list) {
        await this.add(list[i]);
      }
      resolve();
    });
  }

  add(schema) {
    console.log(`enginesService: add("${schema.name}")`);
    return new Promise(async (resolve, reject) => {
      let engine = {
        "schema": schema,
        "object": new (this.engineTemplateList[schema.engine].object)()
      };
      this.engineList[schema.name] = engine;
      await this.startEngine(schema.name);
      resolve();
    });
  }

  remove(name) {
    console.log(`enginesService: remove("${name}")`);
    return new Promise(async (resolve, reject) => {
      await this.stopEngine(name);
      delete this.engineList[name];
      resolve();
    });
  }

  startEngine(name) {
    console.log(`enginesService: startEngine("${name}") >> `);
    return new Promise(async (resolve, reject) => {
      let port = (await this.sysportService.get(this.engineList[name].schema.port)).object;
      this.engineList[name].object.init(port);
      this.engineList[name].object.start();
      resolve();
    });
  }

  stopEngine(name) {
    console.log(`enginesService: stopEngine("${name}") >> `);
    return new Promise(async (resolve, reject) => {
      await this.engineList[name].object.stop();
      resolve();
    });
  }

  start() {
    return new Promise(async (resolve, reject) => {
      await this.initEngineTemplate();
      await this.initEngine();
      resolve();
    });
  }

  get(key) {
    console.log(`enginesService: getEngine(${key}) >> `);
    //console.log(this.engineList);
    return (key) ? this.engineList[key] : this.engineList;
  }

  getByAttribute(attr, val) {
    for(let i in this.engineList) {
      if(this.engineList[i].schema[attr] == val)
        return this.engineList[i];
    }
    return null;
  }

  getTemplate(key) {
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