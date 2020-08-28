'use strict'

const fs = require(`fs`);
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
      //this.sysportService = (await this.laborsManager.getService(`sysport-service`)).obj;
      this.sysportService = this.laborsManager.getService(`sysport-service`).obj;
      //let sysport = this.laborsManager.getService(`sysport-service`);
      //this.sysportService = sysport.obj;
      this.config = (config) ? config : this.config;
      this.engineList = [];
      this.engineTemplateList = {};
      resolve();
    });
  }

  initEngine(config) {
    console.log(`EnginesService: initEngine() >> `);
    return new Promise(async (resolve, reject) => {
      config = (config) ? config : this.config;
      this.engineTemplateList = (await this.getTemplate(null, {"deep": true}));
      this.engineList = [];
      let serviceSchema = this.getSchema();
      //let list = serviceSchema.config.list;
      let list = serviceSchema.list;
      for(let i in list) {
        await this.add(list[i]);
      }
      resolve();
    });
  }

  add(schema) {
    console.log(`EnginesService: add("${schema.name}")`);
    return new Promise(async (resolve, reject) => {
      let template = this.engineTemplateList.find((elem) => schema.engine == elem.name);
      if(template) {
        let path = template.path.replace(/^\//, ``);
        let Obj = require(`./${path}`);
        let engine = {
          "schema": schema,
          "object": new (Obj)()
        };
        this.engineList.push(engine);
        await this.startEngine(schema.name);
        resolve();
      }
      reject(new Error(`Engine '${schema.name}' not found!!!`));
    });
  }

  remove(name) {
    console.log(`EnginesService: remove("${name}")`);
    return new Promise(async (resolve, reject) => {
      await this.stopEngine(name);
      //delete this.engineList[name];
      this.engineList = this.engineList.filter((elem) => elem.schema.name != name);
      resolve();
    });
  }

  startEngine(name) {
    console.log(`EnginesService: startEngine("${name}") >> `);
    return new Promise(async (resolve, reject) => {
      let engine = this.get(name, {"object": true});
      console.log(`start engine '${name} : ${JSON.stringify(engine, null ,2)}'`);
      let port = (await this.sysportService.get(engine.schema.port, {"object": true})).object;
      engine.object.init(port);
      engine.object.start();
      resolve();
      // let port = (await this.sysportService.get(this.engineList.find((elem) => elem.schema.name == name).schema.port)).object;
      // this.engineList.find((elem) => elem.schema.name == name).object.init(port);
      // this.engineList.find((elem) => elem.schema.name == name).object.start();
      // resolve();
    });
  }

  stopEngine(name) {
    console.log(`EnginesService: stopEngine("${name}") >> `);
    return new Promise(async (resolve, reject) => {
      await this.engineList.find((elem) => elem.schema.name == name).object.stop();
      resolve();
    });
  }

  start() {
    return new Promise(async (resolve, reject) => {
      await this.initEngine();
      resolve();
    });
  }

  get(name, options) {
    console.log(`EnginesService: getEngine(${name}) >> `);
    //console.log(this.engineList);
    if(name) {
      let result = {};
      //console.log(`engineList: ${JSON.stringify(this.engineList, null, 2)}`);
      let engine = this.engineList.find((elem) => elem.schema.name == name);
      //console.log(`engine: ${JSON.stringify(engine, null, 2)}`);
      for(let i in engine) {
        if(i == `object`) {
          if(options && options.object)
            result[i] = engine.object;
        }
        else {
          result[i] = engine[i];
        }
      }
      if(options && options.state)
        result.state = engine.object.state;
      //console.log(`result: ${JSON.stringify(result, null, 2)}`);
      return result;
    }
    else {
      let result = [];
      this.engineList.forEach((elem) => result.push(this.get(elem.schema.name, options)));
      return result;
    }
  }

  getByAttribute(attr, val) {
    return this.engineList.find((elem) => elem.schema[attr] == val);
  }

  getTemplate(key, options) {
    console.log(`EnginesService: get(${(key) ? key : ``})`);
    return new Promise(async (resolve, reject) => {
      let serviceSchema = this.getSchema();
      let templateList = (await this.getDirectorySchema(serviceSchema.directory, options)).children;
      if(key) {
        if(!templateList.find((elem) => elem.name == key))
          resolve(undefined);
        else {
          let engine = JSON.parse(JSON.stringify(templateList.find((elem) => elem.name == key)));
          resolve(engine);
        }
      }
      else {
        resolve(templateList);
      }
    });
  }
}

module.exports = EnginesService;