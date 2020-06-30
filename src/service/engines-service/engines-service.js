'use strict'

const Path = require(`path`);
const SerialPort = require(`serialport`);

const Service = require(`../service`);
const Database = require('../../lib/my-database');
const {Defaults, Errors} = require('../../../constants/constants');

class EnginesService extends Service {
  constructor(extension, config, id) {
    console.log(`EnginesService: contructor() >> `);
    super(extension, config, id);
  }

  init(config) {
    console.log(`EnginesService: init() >> `);
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
    console.log(`EnginesService: initEngineTemplate() >> `);
    return new Promise(async (resolve, reject) => {
      config = (config) ? config : this.config;
      //let list = config[`engines-service`].template;

      let serviceSchema = this.getSchema();
      let list = await this.getDirectory(Path.join(__dirname, serviceSchema.config.directory));
      console.log(`engine list : ${list}`);
      this.engineTemplateList = {};
      for(let i in list) {
        console.log(`engine : ${list[i]}`);
        let path = Path.join(__dirname, serviceSchema.config.directory, list[i], `index.js`);
        console.log(`engine path : ${path}`);
        let template = {
          "schema": list[i],
          "object": require(`${path}`)
        };
        this.engineTemplateList[list[i]] = template;
      }
      resolve();
    });
  }

  initEngine(config) {
    console.log(`EnginesService: initEngine() >> `);
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
    console.log(`EnginesService: add("${schema.name}")`);
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
    console.log(`EnginesService: remove("${name}")`);
    return new Promise(async (resolve, reject) => {
      await this.stopEngine(name);
      delete this.engineList[name];
      resolve();
    });
  }

  startEngine(name) {
    console.log(`EnginesService: startEngine("${name}") >> `);
    return new Promise(async (resolve, reject) => {
      let port = (await this.sysportService.get(this.engineList[name].schema.port)).object;
      this.engineList[name].object.init(port);
      this.engineList[name].object.start();
      resolve();
    });
  }

  stopEngine(name) {
    console.log(`EnginesService: stopEngine("${name}") >> `);
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
    console.log(`EnginesService: getEngine(${key}) >> `);
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

  getDirectory(path) {
    return new Promise((resolve, reject) => {
      const fs = require(`fs`);
      fs.readdir(path, (err, files) => {
        (err) ? reject(err) : resolve(files);
      });
    });
  }
}

module.exports = EnginesService;