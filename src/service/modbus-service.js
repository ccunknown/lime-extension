'use strict'

const EventEmitter = require('events').EventEmitter;

const Database = require('../lib/my-database');
const {Defaults, Errors} = require('../../constants/constants');

const SerialPort = require(`serialport`);

const ModbusRTU = require('modbus-serial');

class modbusService extends EventEmitter {
  constructor(extension, config) {
    console.log(`modbusService: contructor() >> `);
    super(extension.addonManager, extension.manifest.id);

    this.extension = extension;
    this.manifest = extension.manifest;
    this.addonManager = extension.addonManager;

    this.config = config;

    this.templateList = {};

    this.init();
  }

  init() {
    console.log(`modbusService: init() >> `);
    return new Promise((resolve, reject) => {
      this.initModbusServer(`/dev/ttyUSB0`, 9600)
      .then(() => resolve());
    });
  }

  initModbusServer(port, baudrate) {
    console.log(`modbusService: initModbusServer("${port}") >> `);
    return new Promise((resolve, reject) => {
      this.modbus = new ModbusRTU();
      this.modbus.connectRTUBuffered(port, {baudRate: baudrate}, () => {
        resolve();
      });
    });
    //return Promise.resolve();
  }

  start() {
    console.log(`modbusService: start() >> `);
    return Promise.resolve();
  }

  stop() {
    console.log(`modbusService: stop() >> `);
  }

  getSerialPortList() {
    console.log(`modbusService: getSerialPortList() >> `);
    return new Promise((resolve, reject) => {
      let portList = [];
      SerialPort.list()
      .then((ports) => {
        ports.forEach((port) => {
          portList.push({
            path: port.path,
            pnpId: (port.pnpId) ? port.pnpId : null,
            manufacturer: (port.manufacturer) ? port.manufacturer : null
          });
        });
        console.log(`portList : ${JSON.stringify(portList, null, 2)}`);
        resolve(portList);
      })
      .catch((err) => {
        reject(err);
      });
    });
  }

  read(address, prop, template) {
    console.log(`address: ${address}`);
    console.log(`prop: ${JSON.stringify(prop, null, 2)}`);
    console.log(`template: ${template}`);

    this.modbus.setID(address);

    return new Promise(async (resolve, reject) => {
      if(!this.templateList.hasOwnProperty(template)) {
        if(!this.isinTemplateList(template)) {
          reject(new Error(`template "${template}" not found in list.`));
        }
        let path = this.getTemplatePath(template);
        let readmap = require(path.readmap);
        let calcmap = require(path.calcmap);
        let map = this.rebuildReadMap(readmap, calcmap);

        this.templateList[template] = {
          name: template,
          map: map
        };
      }

      this.modbus.setID(address);

      let readMap = this.templateList[template].map;

      let elem = readMap.map[prop.table][prop.address];
      //let addr = address;
      let addr = prop.address;
      let ntr = elem.registerSpec.number;

      
      //console.log(`element : ${JSON.stringify(elem, null, 2)}`);
      //console.log(`read address : ${addr}`);
      //console.log(`number to read : ${ntr}`);
      //console.log(`function : ${elem.translator.name}`);
      
      /*
      let val = null;
      switch(prop.table) {
        case `coils`:
          val = await this.modbus.readCoils(addr, ntr);
          break;
        case `contacts`:
          val = await this.modbus.readDiscreteInputs(addr, ntr);
          break;
        case `inputRegisters`:
          val = await this.modbus.readInputRegisters(addr, ntr);
          break;
        case `holdingRegisters`:
          val = await this.modbus.readHoldingRegisters(addr, ntr);
          break;
        default:
          console.error(`${prop.table} not in scope.`);
          break;
      }*/

      let val = null;
      let tryNum = 2;

      //console.log(tname);
      let func = () => {
        return new Promise(async (resolve, reject) => {
          let res;
          setTimeout(() => {resolve(null)}, 1000);
          switch(prop.table) {
            case `coils`:
              res = await this.modbus.readCoils(addr, ntr);
              break;
            case `contacts`:
              res = await this.modbus.readDiscreteInputs(addr, ntr);
              break;
            case `inputRegisters`:
              res = await this.modbus.readInputRegisters(addr, ntr);
              break;
            case `holdingRegisters`:
              res = await this.modbus.readHoldingRegisters(addr, ntr);
              break;
            default:
              console.error(`${prop.table} not in scope.`);
              break;
          }
          resolve(res);
        });
      };

      while(tryNum > 0) {
        tryNum = tryNum - 1;
        val = await func();
        if(val)
          break;
        else if(tryNum > 0)
          console.log(`!!! Unsuccess to read "${elem.name}", try to read again.`);
        else
          console.log(`!!! Fail to read "${elem.name}".`);
      }

      let result;
      if(val) {
        result = elem.translator(val.buffer, elem);
        console.log(`hex : ${val.buffer.toString('hex')}`);
        console.log(`result : ${result}`);
      }
      else {
        result = null;
        console.log(`${elem.name} : null`);
      }

      resolve(result);

    });
  }

  getTemplatePath(name) {
    let result = null;
    this.config.template.list.forEach((elem) => {
      if(elem.name == name)
        result = {
          readmap: elem.path.readmap,
          calcmap: elem.path.calcmap
        };
    });
    return result;
  }

  isinTemplateList(name) {
    let result = false;
    this.config.template.list.forEach((elem) => {
      if(elem.name == name)
        result = true;
    });
    return result;
  }

  rebuildReadMap(readMapConfig, calcMapConfig) {
    console.log(`modbusService: rebuildReadMap() >> `);

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

      //  type
      if(localDefine && localDefine.type)
        Object.assign(define, localDefine.type);
      
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

        //  translator
        if(!elem.translator)
          elem.translator = define.translator.default;

        //  type
        if(!elem.type)
          elem.type = define.type.default;

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

module.exports = modbusService;