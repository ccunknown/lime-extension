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
      // this.config = (config) ? config : this.config;
      // let serviceSchema = this.getSchema();
      // //let list = await this.getDirectory(Path.join(__dirname, serviceSchema.config.directory));
      // let list = await this.getDirectory(Path.join(__dirname, serviceSchema.directory));
      // console.log(`script list : ${list}`);
      // this.scriptList = {};
      // for(let i in list) {
      //   console.log(`script : ${list[i]}`);
      //   //let path = Path.join(__dirname, serviceSchema.config.directory, list[i]);
      //   let path = Path.join(__dirname, serviceSchema.directory, list[i]);
      //   await this.add(list[i], path);
      // }
      // console.log(`scriptList : ${JSON.stringify(this.scriptList, null, 2)}`);
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

  // add(name, path) {
  //   console.log(`ScriptsService: add("${name}", "${path}") >> `);
  //   return new Promise(async (resolve, reject) => {
  //     let fs = require(`fs`);
  //     let files = await this.getDirectory(path);
  //     let script = {
  //       "name": name,
  //       "path": path,
  //       "meta": {},
  //       "list": {}
  //     };
  //     let regex = /\..+$/gi;
  //     for(let i in files) {
  //       let index = files[i].replace(regex, ``).toLowerCase();
  //       //let s = require(`${path}/${files[i]}`);
  //       //script.list[index] = s;
  //       if(files[i] == `metadata.js`) {
  //         let meta = require(`${script.path}/${files[i]}`);
  //         script.meta = JSON.parse(JSON.stringify(meta));
  //       }
  //       else {
  //         script.list[index] = {
  //           "path": files[i]
  //         };
  //       }
  //     }
  //     this.scriptList[name] = script;
  //     resolve(this.scriptList[name]);
  //   });
  // }

  create(schema, parentPath) {
    /*
      "schema" should be : 
      {
        "path": "string",
        "name": "string",
        "type": "string",
        "meta": {
          "title": "string",
          "description": "string",
          "tags": ["string"]
        }
        "children": [
          {
            "path": "string",
            "name": "string",
            "type": "string",
            "base64": "string"
          }
        ]
      }
    */

    console.log(`ScriptsService: create(${schema.name}) >> `);
    //console.log(`schema : ${JSON.stringify(schema, null, 2)}`);
    return new Promise(async (resolve, reject) => {
      let serviceSchema = this.getSchema();
      parentPath = (parentPath) ? parentPath : ``;
      if(schema.meta) {
        schema.children.push({
          "name": "metadata.js",
          "type": "file",
          "base64": this.base64Encode(this.initialMeta(schema.meta))
        });
      }
      for(let i in schema.children) {
        if(schema.children[i].type == `file`)
          await this.createFile(Path.join(parentPath, schema.name, schema.children[i].name), schema.children[i].base64);
        else if(schema.children[i].type == `directory`)
          await this.create(schema.children[i], Path.join(parentPath, schema.name));
        else
          console.warn(`Type '${schema.children[i].type}' not support!!!`);
      }
      resolve({});
    });
  }

  createFile(path, raw) {
    console.log(`ScriptsService: createFile() >> `);
    //console.log(`schema : ${JSON.stringify(schema, null, 2)}`);
    return new Promise(async (resolve, reject) => {
      let data = this.base64Decode(raw);
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

  get(name, options) {
    console.log(`ScriptsService: get(${(name) ? `${name}` : ``})`);
    return new Promise(async (resolve, reject) => {
      let serviceSchema = this.getSchema();
      let scriptList = (await this.getDirectorySchema(serviceSchema.directory, options)).children;
      console.log(`directory: ${serviceSchema.directory}`);
      console.log(`scriptList: ${JSON.stringify(scriptList, null, 2)}`);
      if(name) {
        let script = scriptList.find((elem) => elem.name == name);
        if(!script)
          resolve(undefined);
        else {
          //let script = JSON.parse(JSON.stringify(script));
          let meta = script.children.find((elem) => elem.name == `metadata.js`);
          script.children = script.children.filter((elem) => elem.name != `metadata.js`);
          let path = Path.join(__dirname, script.path.replace(/^\//, ``), `metadata.js`);
          script.meta = (meta) ? JSON.parse(JSON.stringify(require(path))) : {};
          resolve(script);
        }
      }
      else {
        let result = [];
        for(let i in scriptList) {
          let script = await this.get(scriptList[i].name, options);
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

  // readFile(path, encoding) {
  //   return new Promise((resolve, reject) => {
  //     const fs = require(`fs`);
  //     encoding = (encoding) ? encoding : `utf8`;
  //     fs.readFile(path, encoding, (err, data) => {
  //       (err) ? reject(err) : resolve(data);
  //     });
  //   });
  // }
}

module.exports = ScriptsService;