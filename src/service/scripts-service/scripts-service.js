'use strict'

const Path = require(`path`);

const Service = require(`../service`);
const Database = require('../../lib/my-database');
const {Defaults, Errors} = require('../../../constants/constants');

class ScriptsService extends Service {
  constructor(extension, config, id) {
    console.log(`ScriptsService: contructor() >> `);
    super(extension, config, id);
  }

  init(config) {
    console.log(`ScriptsService: init() >> `);
    return new Promise(async (resolve, reject) => {
      this.config = (config) ? config : this.config;
      this.scriptList = {};
      resolve();
    });
  }

  start() {
    console.log(`ScriptsService: start() >> `);
    return new Promise(async (resolve, reject) => {
      await this.initScript();
      resolve();
    });
  }

  initScript(config) {
    console.log(`ScriptsService: initScript() >> `);
    return new Promise(async (resolve, reject) => {
      config = (config) ? config : this.config;
      let serviceSchema = this.getSchema();
      let list = await this.getDirectory(Path.join(__dirname, serviceSchema.config.directory));
      console.log(`list : ${list}`);
      this.scriptList = {};
      for(let i in list) {
        console.log(`script : ${list[i]}`);
        let path = Path.join(__dirname, serviceSchema.config.directory, list[i]);
        let files = await this.getDirectory(path);
        let readmap = (files && files.includes(`readMap.js`)) ? require(`${path}/readMap.js`) : null;
        let calcmap = (files && files.includes(`calcMap.js`)) ? require(`${path}/calcMap.js`) : null;
        let script = {
          "name": list[i],
          "readmap": readmap,
          "calcmap": calcmap
        };
        this.scriptList[list[i]] = script;
      }
      resolve();
    });
  }

  add(path) {
    console.log(`ScriptsService: add("${schema.name}") >> `);
    return new Promise(async (resolve, reject) => {
      let files = await this.getDerectory(path);
      resolve();
    });
  }

  get(key) {
    console.log(`scriptService: getScript(${key})`);
    //console.log(this.scriptList);
    return (key) ? this.scriptList[key] : this.scriptList;
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

module.exports = ScriptsService;