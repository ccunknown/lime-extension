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
      console.log(`script list : ${list}`);
      this.scriptList = {};
      for(let i in list) {
        console.log(`script : ${list[i]}`);
        let path = Path.join(__dirname, serviceSchema.config.directory, list[i]);
        await this.add(list[i], path);
      }
      resolve();
    });
  }

  import(schema) {
    console.log(`ScriptsService: import() >> `);
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  remove(name) {
    console.log(`ScriptsService: remove("${name}") >> `);
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  add(name, path) {
    console.log(`ScriptsService: add("${name}", "${path}") >> `);
    return new Promise(async (resolve, reject) => {
      let fs = require(`fs`);
      let files = await this.getDirectory(path);
      let script = {
        "name": name,
        "path": path,
        "tag": [],
        "list": {}
      };
      let regex = /\..+$/gi;
      for(let i in files) {
        let index = files[i].replace(regex, ``).toLowerCase();
        let s = require(`${path}/${files[i]}`);
        script.list[index] = s;
        if(s.meta && s.meta.tag) {
          s.meta.tag.forEach((tag) => {
            if(!script.tag.includes(`${tag}`))
              script.tag.push(`${tag}`);
          });
        }
      }
      this.scriptList[name] = script;
      resolve(this.scriptList[name]);
    });
  }

  get(key) {
    console.log(`ScriptsService: getScript(${key})`);
    //console.log(this.scriptList);
    return (key) ? this.scriptList[key] : this.scriptList;
  }

  getByTag(tag) {
    console.log(`ScriptsService: getByTag(${tag}) >> `);
    let result = [];
    if(typeof tag == `string`)
      for(let i in scriptList) {
        if(scriptList[i].includes(tag))
          result.push(scriptList[i]);
      }
    else {
      let nameList = [];
      for(let i in scriptList) {
        for(let j in tag) {
          if(scriptList[i].tag.includes(tag[j])) {
            result.push(scriptList[i]);
            break;
          }
        }
      }
    }
    return result;
  }

  getJson(key) {
    return new Promise(async (resolve, reject) => {
      if(key) {
        let script = this.scriptList[key];
        let result = {
          "name": script.name,
          "tag": script.tag,
          "path": script.path,
          "list": {}
        }
        let files = await this.getDirectory(script.path);
        let regex = /\..+$/gi;
        for(let i in files) {
          let index = files[i].replace(regex, ``).toLowerCase();
          let str = await this.readFile(Path.join(script.path, files[i]));
          let buff = new Buffer(str);
          let base64 = buff.toString(`base64`);
          result.list[index] = {
            "path": files[i],
            "base64": base64
          };
        }
        resolve(result);
      }
      else {
        let result = [];
        for(let i in this.scriptList) {
          let script = await this.getJson(this.scriptList[i].name);
          result.push(script);
        }
        resolve(result);
      }
    });
  }

  getDirectory(path) {
    return new Promise((resolve, reject) => {
      const fs = require(`fs`);
      fs.readdir(path, (err, files) => {
        (err) ? reject(err) : resolve(files);
      });
    });
  }

  base64Encode(data) {
    let buff = new Buffer(data);
    let base64 = buff.toString(`base64`);
    return base64;
  }

  readFile(path) {
    return new Promise((resolve, reject) => {
      const fs = require(`fs`);
      fs.readFile(path, (err, data) => {
        (err) ? reject(err) : resolve(data);
      });
    });
  }
}

module.exports = ScriptsService;