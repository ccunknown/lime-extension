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
      resolve();
    });
  }

  start() {
    console.log(`ScriptsService: start() >> `);
    return new Promise(async (resolve, reject) => {
      //await this.initScript();
      resolve();
    });
  }

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

  delete(name) {
    console.log(`ScriptsService: delete(${name}) >> `);
    return new Promise(async (resolve, reject) => {
      let script = await this.get(name, {"deep": true});
      console.log(`delete: ${JSON.stringify(script, null, 2)}`);
      //this.delete();
    });
  }

  get(name, options) {
    console.log(`ScriptsService: get(${(name) ? `${name}` : ``})`);
    return new Promise(async (resolve, reject) => {
      let serviceSchema = this.getSchema();
      let opttmp = JSON.parse(JSON.stringify(options));
      opttmp.object = false;
      let scriptList = (await this.getDirectorySchema(serviceSchema.directory, opttmp)).children;
      console.log(`directory: ${serviceSchema.directory}`);
      console.log(`scriptList: ${JSON.stringify(scriptList, null, 2)}`);
      if(name) {
        let script = scriptList.find((elem) => elem.name == name);
        script = await this.getDirectorySchema(script.path, options);
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

  initialMeta(schema) {
    const str = `
      const meta = ${JSON.stringify(schema)};
      module.exports = meta;
    `;
    return str;
  }
}

module.exports = ScriptsService;