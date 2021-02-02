class ScriptBuilder {
  constructor(readMap, calcMap) {
    if(readMap && calcMap)
      this.init(readMap, calcMap);
  }

  init(readMap, calcMap) {
    this.readMap = readMap;
    this.calcMap = calcMap;
    this.fullMap = buildFullMap(this.readMap, this.fullMap);
  }

  getReadMap() {
    return this.readMap;
  }

  getCalcMap() {
    return this.calcMap;
  }

  getFullMap(readMap, calcMap) {
    return (readMap && calcMap) ? this.buildFullMap(readMap, calcMap) : 
    (this.fullMap) ? this.fullMap : 
    (this.readMap && this.calcMap) ? this.buildFullMap(this.readMap, this.calcMap) : null;
  }

  buildFullMap(readMapConfig, calcMapConfig) {
    console.log(`ModbusDevice: buildFullMap() >> `);

    const tableList = [`coils`, `contacts`, `inputRegisters`, `holdingRegisters`];
    let result = JSON.parse(JSON.stringify(readMapConfig));
    let globalDefine = (result.map && result.map.define) ? result.map.define : null;

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

        if(!elem.type)
          elem.type = define.type.default;

        elem.translator = this.getCalcFunction(calcMapConfig, elem.translator);
        result.map[tname][j] = elem;
      }
      delete table.define;
    }
    return result;
  }

  getCalcFunction(calcMapConfig, translatorDst) {
    let taddr = translatorDst.split(`.`);
    let pointer = calcMapConfig;
    for(let i in taddr) {
      pointer = (pointer[taddr[i]]) ? pointer[taddr[i]] : null;
    }
    return (typeof pointer == `function`) ? pointer : null;
  }
}

module.exports = ScriptBuilder;