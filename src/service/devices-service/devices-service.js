'use strict'

const {
  Adapter,
  Device,
  Property,
} = require('gateway-addon');

const Path = require(`path`);
const Service = require(`../service`);
const Database = require(`../../lib/my-database`);
const {Defaults, Errors} = require(`../../../constants/constants`);
//const PropertyWorker = require(`./property-worker`);

class DevicesService extends Service {
  constructor(extension, config, id) {
    console.log(`DevicesService: contructor() >> `);
    super(extension, config, id);
    /*
    constructor(extension, config, id) {
      super(extension.addonManager, extension.manifest.id);

      this.extension = extension;
      this.manifest = extension.manifest;
      this.addonManager = extension.addonManager;
      this.laborsManager = this.extension.laborsManager;
      this.configManager = this.extension.configManager;
      this.routesManager = this.extension.routesManager;

      this.config = JSON.parse(JSON.stringify(config));
      this.id = id;
    */
  }

  init(config) {
    console.log(`DevicesService: init() >> `);
    return new Promise(async (resolve, reject) => {
      this.config = (config) ? config : this.config;
      this.adapter = new vAdapter(this.addonManager, this.manifest.name);
      this.initDeviceTemplate();
      resolve();
    });
  }

  initDeviceTemplate() {
    console.log(`DevicesService: initDeviceTemplate() >> `);
    return new Promise(async (resolve, reject) => {
      this.deviceTemplate = {};
      let serviceSchema = this.getSchema();
      //let dirs = await this.getDirectory(Path.join(__dirname, `/devices`));
      let dirs = await this.getDirectory(Path.join(__dirname, serviceSchema.directory));
      dirs.forEach((elem) => {
        this.deviceTemplate[elem] = require(`./devices/${elem}/device`);
      });
      resolve();
    });
  }

  initDevices() {
    console.log(`DevicesService: initDevices() >> `);
    return new Promise(async (resolve, reject) => {
      let serviceSchema = this.getSchema();
      let list = serviceSchema.list;
      for(let i in list) {
        await this.add(list[i]);
      }
      resolve();
    });
  }

  start() {
    console.log(`DevicesService: start() >> `);    
    return new Promise(async (resolve, reject) => {
      //this.scriptsService = (await this.laborsManager.getService(`scripts-service`)).obj;
      //this.enginesService = (await this.laborsManager.getService(`engines-service`)).obj;
      this.scriptsService = this.laborsManager.getService(`scripts-service`).obj;
      this.enginesService = this.laborsManager.getService(`engines-service`).obj;
      //console.log(`engine service : `);
      //console.log(this.enginesService);
      await this.initDevices();
      resolve();
    });
  }

  stop() {
    console.log(`DevicesService: stop() >> `);
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  add(schema) {
    return new Promise(async (resolve, reject) => {
      let device = this.adapter.getDevice(schema.id);
      if(device) {
        console.warn(`Device id "${schema.id}" already exist. Remove old and add new!!!`);
        await this.remove(schema.id);
      }
      device = new (this.deviceTemplate[schema.config.device])(this, this.adapter, schema);
      await device.init();
      this.adapter.handleDeviceAdded(device);
      resolve();
    });
  }

  remove(id) {
    console.log(`DevicesService: removeDevice() >> `);
    return new Promise((resolve, reject) => {
      let device = this.adapter.getDevice(id);
      if(device)
        this.adapter.handleDeviceRemoved(device);
      else
        console.warn(`Device "${id}" not found in list!!!`);
      resolve();
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
}

class vAdapter extends Adapter {
  constructor(addonManager, packageName) {
    super(addonManager, 'LimeAdapter', packageName);
    addonManager.addAdapter(this);
  }

  removeDevice(deviceId) {
    return new Promise((resolve, reject) => {
      const device = this.devices[deviceId];
      if (device) {
        this.handleDeviceRemoved(device);
        resolve(device);
      } else {
        reject(`Device: ${deviceId} not found.`);
      }
    });
  }

  startPairing(_timeoutSeconds) {
    console.log('ExampleAdapter:', this.name, 'id', this.id, 'pairing started');
  }

  cancelPairing() {
    console.log('ExampleAdapter:', this.name, 'id', this.id, 'pairing cancelled');
  }

  removeThing(device) {
    console.log('ExampleAdapter:', this.name, 'id', this.id, 'removeThing(', device.id, ') started');

    this.removeDevice(device.id)
    .then(() => console.log('ExampleAdapter: device:', device.id, 'was unpaired.'))
    .catch((err) => {
      console.error('ExampleAdapter: unpairing', device.id, 'failed');
      console.error(err);
    });
  }

  cancelRemoveThing(device) {
    console.log('ExampleAdapter:', this.name, 'id', this.id, 'cancelRemoveThing(', device.id, ')');
  }
}

module.exports = DevicesService;