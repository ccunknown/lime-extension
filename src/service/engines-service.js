'use strict'

const EventEmitter = require('events').EventEmitter;

const Database = require('../lib/my-database');
const {Defaults, Errors} = require('../../constants/constants');

const SerialPort = require(`serialport`);

const ModbusRTU = require('modbus-serial');

class enginesService extends EventEmitter {
  constructor(extension, config) {
    console.log(`enginesService: contructor() >> `);
    super(extension.addonManager, extension.manifest.id);

    this.extension = extension;
    this.manifest = extension.manifest;
    this.addonManager = extension.addonManager;

    this.laborsManager = this.extension.laborsManager;
    this.config = config;

    this.engineList = {};
    //this.init();
  }

  init() {
    console.log(`modbusService: init() >> `);
    return new Promise((resolve, reject) => {
      this.initModbusServer(`/dev/ttyUSB0`, 9600)
      .then(() => resolve());
    });
  }

  getEngineTemplateList() {
    let files = this.getFileInDirectory(this.config.engines.dir);
    files.forEach((f) => console.log(f));
  }

  getFileInDirectory(dirPath) {
    const path = require(`path`);
    const fs = require(`fs`);

    const dest = path.join(__dirname, dirPath);

    fs.readdir(directoryPath, (err, files) => {
      if(err)
        return console.error(`Unable to scan directory: '${err}'`);
      return files;
    });
  }
}

module.exports = enginesService;