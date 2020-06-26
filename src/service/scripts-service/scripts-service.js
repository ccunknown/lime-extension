'use strict'

const Path = require(`path`);

const Service = require(`../service`);
const Database = require('../../lib/my-database');
const {Defaults, Errors} = require('../../../constants/constants');

class scriptsService extends Service {
  constructor(extension, config, id) {
    console.log(`scriptsService: contructor() >> `);
    super(extension, config, id);
  }

  init(config) {
    console.log(`scriptsService: init() >> `);
    return new Promise(async (resolve, reject) => {
      this.config = (config) ? config : this.config;
      this.scriptsList = {};
      resolve();
    });
  }

  start() {
    console.log(`scriptsService: start() >> `);
    return new Promise(async (resolve, reject) => {
      await this.initScript();
      resolve();
    });
  }

  initScript(config) {
    console.log(`scriptsService: initScript() >> `);
    return new Promise(async (resolve, reject) => {
      config = (config) ? config : this.config;
      let serviceSchema = this.getSchema();
      let list = await this.getDirectory(Path.join(__dirname, serviceSchema.config.directory));
      console.log(`list : ${list}`);
      this.scriptsList = {};
      for(let i in list) {
        console.log(`script : ${list[i]}`);
        let path = Path.join(__dirname, serviceSchema.config.directory, list[i]);
        let files = await this.getDirectory(path);
        let readmap = (files && files.includes(`readMap.js`)) ? require(`${path}/readMap.js`) : null;
        let calcmap = (files && files.includes(`calcMap.js`)) ? require(`${path}/calcMap.js`) : null;
        let script = {
          "name": list[i],
          "readmap": readmap,
          "calcmap": calcmap,
          "translator": this.rebuildReadMap(readmap, calcmap)
        };
        this.scriptsList[list[i]] = script;
      }
      resolve();
    });
  }

  getScript(key) {
    console.log(`scriptService: getScript(${key})`);
    //console.log(this.scriptsList);
    return this.scriptsList[key];
  }

  getDirectory(path) {
    return new Promise((resolve, reject) => {
      const fs = require(`fs`);
      fs.readdir(path, (err, files) => {
        (err) ? reject(err) : resolve(files);
      });
    });
  }

  rebuildReadMap(readMapConfig, calcMapConfig) {
    console.log(`scriptsService: rebuildReadMap() >> `);

    let result = JSON.parse(JSON.stringify(readMapConfig));
    let globalDefine = (result.map && result.map.define) ? result.map.define : null;
    let tableList = [`coils`, `contacts`, `inputRegisters`, `holdingRegisters`];

    for(let i in tableList) {
      let tname = tableList[i];
      let table = result.map[tname];
      let localDefine = (table.define) ? table.define : null;

      let define = JSON.parse(JSON.stringify((globalDefine) ? globalDefine : {}));
      
      //  registerSpec
      if(localDefine && localDefine.registerSpec)
        Object.assign(define, localDefine.registerSpec);

      //  translator
      if(localDefine && localDefine.translator)
        Object.assign(define, localDefine.registerSpec);
      
      for(let j in table) {
        let elem = JSON.parse(JSON.stringify(table[j]));

        //  registerSpec
        if((typeof elem.registerSpec) == `string`)
          elem.registerSpec = JSON.parse(JSON.stringify((define.registerSpec[elem.registerSpec]) ? define.registerSpec[elem.registerSpec] : null));
        if(!elem.registerSpec)
          elem.registerSpec = {};
        if(!elem.registerSpec.size)
          elem.registerSpec.size = define.registerSpec.default.size;
        if(!elem.registerSpec.number)
          elem.registerSpec.number = define.registerSpec.default.number;

        if(!elem.translator)
          elem.translator = define.translator.default;

        elem.translator = this.getTranslator(calcMapConfig, elem.translator);
        result.map[tname][j] = elem;
      }
      delete table.define;
    }
    return result;
  }

  getTranslator(calcMapConfig, translatorDst) {
    let taddr = translatorDst.split(`.`);
    let pointer = calcMapConfig;
    for(let i in taddr) {
      pointer = (pointer[taddr[i]]) ? pointer[taddr[i]] : null;
    }
    return (typeof pointer == `function`) ? pointer : null;
  }
}

module.exports = scriptsService;