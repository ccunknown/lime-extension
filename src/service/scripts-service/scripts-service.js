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
      //let list = await this.getDirectory(Path.join(__dirname, serviceSchema.config.directory));
      let list = await this.getDirectory(Path.join(__dirname, serviceSchema.directory));
      console.log(`script list : ${list}`);
      this.scriptList = {};
      for(let i in list) {
        console.log(`script : ${list[i]}`);
        //let path = Path.join(__dirname, serviceSchema.config.directory, list[i]);
        let path = Path.join(__dirname, serviceSchema.directory, list[i]);
        await this.add(list[i], path);
      }
      console.log(`scriptList : ${JSON.stringify(this.scriptList, null, 2)}`);
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
        "meta": {},
        "list": {}
      };
      let regex = /\..+$/gi;
      for(let i in files) {
        let index = files[i].replace(regex, ``).toLowerCase();
        //let s = require(`${path}/${files[i]}`);
        //script.list[index] = s;
        if(files[i] == `metadata.js`) {
          let meta = require(`${script.path}/${files[i]}`);
          script.meta = JSON.parse(JSON.stringify(meta));
        }
        else {
          script.list[index] = {
            "path": files[i]
          };
        }
      }
      this.scriptList[name] = script;
      resolve(this.scriptList[name]);
    });
  }

  create(schema) {
    /*
      "schema" should be : 
      {
        "name": "string",
        "meta": {
          "title": "string",
          "description": "string",
          "tag": ["string"]
        }
        "list": {
          "key": {
            "path": "string",
            "base64": "string"
          }
        }
      }
    */
    console.log(`ScriptsService: create() >> `);
    //console.log(`schema : ${JSON.stringify(schema, null, 2)}`);
    return new Promise(async (resolve, reject) => {
      let serviceSchema = this.getSchema();
      if(schema.meta) {
        schema.list.meta = {
          "path": "metadata.js",
          "base64": this.base64Encode(this.initialMeta(schema.meta))
        };
      }
      for(let i in schema.list) {
        let path = Path.join(__dirname, serviceSchema.directory, schema.name, schema.list[i].path);
        await this.createFile(path, schema.list[i]);
      }
      resolve({});
    });
  }

  createFile(path, schema) {
    console.log(`ScriptsService: createFile() >> `);
    console.log(`schema : ${JSON.stringify(schema, null, 2)}`);
    return new Promise(async (resolve, reject) => {
      let data = this.base64Decode(schema.base64);
      console.log(`create file : ${path}`);
      await this.writeFile(path, data);
      resolve();
    });
  }

  initialMeta(schema) {
    const str = `
      const meta = ${JSON.stringify(schema)};
      module.exports = meta;
    `;
    return str;
  }

  get(key, options) {
    console.log(`ScriptsService: getScript(${key})`);
    //console.log(this.scriptList);
    return new Promise(async (resolve, reject) => {
      if(key) {
        if(!this.scriptList[key])
          resolve(undefined);
        else {
          let script = JSON.parse(JSON.stringify(this.scriptList[key]));
          for(let i in script.list) {
            let filepath = `${script.path}/${script.list[i].path}`
            if(options && options.object)
              script.list[i].object = require(`${filepath}`);
            if(options && options.base64)
              script.list[i].base64 = this.base64Encode(await this.readFile(filepath));
          }
          resolve(script);
        }
      }
      else {
        let result = [];
        for(let i in this.scriptList) {
          result.push(JSON.parse(JSON.stringify(this.scriptList[i])));
        }
        resolve(result);
      }
    });
    //return (key) ? this.scriptList[key] : this.scriptList;
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
    let buff = Buffer.from(data);
    let base64 = buff.toString(`base64`);
    return base64;
  }

  base64Decode(data, encoding) {
    //let buff = new Buffer(data, `base64`);
    let buff = Buffer.from(data, `base64`);
    let result = buff.toString((encoding) ? encoding : `utf8`);
    return result;
  }

  readFile(path, encoding) {
    return new Promise((resolve, reject) => {
      const fs = require(`fs`);
      encoding = (encoding) ? encoding : `utf8`;
      fs.readFile(path, encoding, (err, data) => {
        (err) ? reject(err) : resolve(data);
      });
    });
  }

  writeFile(path, data, encoding) {
    return new Promise((resolve, reject) => {
      const fs = require(`fs`);
      encoding = (encoding) ? encoding : `utf8`;
      let dir = path.replace(/[^/]+$/g, ``);
      console.log(`dir : ${dir}`);
      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
      }
      fs.writeFile(path, data, encoding, (err) => {
        (err) ? reject(err) : resolve();
      });
    });
  }
}

module.exports = ScriptsService;