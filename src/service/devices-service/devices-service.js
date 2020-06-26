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

class devicesService extends Service {
  constructor(extension, config, id) {
    console.log(`devicesService: contructor() >> `);
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
    console.log(`devicesService: init() >> `);
    return new Promise(async (resolve, reject) => {
      this.config = (config) ? config : this.config;
      this.adapter = new vAdapter(this.addonManager, this.manifest.name);
      this.initDeviceTemplate();
      resolve();
    });
  }

  initDeviceTemplate() {
    console.log(`devicesService: initDeviceTemplate() >> `);
    return new Promise(async (resolve, reject) => {
      this.deviceTemplate = {};
      let dirs = await this.getDirectory(Path.join(__dirname, `/devices`));
      dirs.forEach((elem) => {
        this.deviceTemplate[elem] = require(`./devices/${elem}/device`);
      });
      resolve();
    });
  }

  initDevices() {
    console.log(`devicesService: initDevices() >> `);
    return new Promise(async (resolve, reject) => {
      let serviceSchema = this.getSchema();
      let list = serviceSchema.config.list;
      for(let i in list) {
        //await this.addDevice(list[i]);
        let device = new (this.deviceTemplate[list[i].config.device])(this, this.adapter, list[i]);
        await device.init();
        this.adapter.handleDeviceAdded(device);
      }
      resolve();
    });
  }

  start() {
    console.log(`devicesService: start() >> `);    
    return new Promise(async (resolve, reject) => {
      this.scriptsService = (await this.laborsManager.getService(`scripts-service`)).obj;
      this.enginesService = (await this.laborsManager.getService(`engines-service`)).obj;
      //console.log(`engine service : `);
      //console.log(this.enginesService);
      await this.initDevices();
      resolve();
    });
  }

  stop() {
    console.log(`devicesService: stop() >> `);
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  /*
  addDevice(schema) {
    console.log(`devicesService: addDevice() >> `);
    return new Promise(async (resolve, reject) => {
      let device = {
        "schema": schema,
        "object": new vDevice(this.adapter, `${schema.id}`, schema),
        "engine": this.enginesService.getEngine(schema.config.engine).object,
        "script": this.scriptsService.getScript(schema.config.script),
        "property": {}
      };
      //console.log(`device engine : `);
      //console.log(device.engine);
      for(let j in schema.properties) {
        let prop = new PropertyWorker({
          "device": device,
          "property": schema.properties[j]
        });
        await prop.start();
        device.property[j] = prop;
      }
      this.deviceList[schema.id] = device;
      this.adapter.handleDeviceAdded(this.deviceList[schema.id].object);
      resolve();
    });
  }
  */

  removeDevice(id) {
    console.log(`devicesService: removeDevice() >> `);
    return new Promise((resolve, reject) => {
      if(this.deviceList[id]) {
        this.adapter.handleDeviceRemoved(this.deviceList[i].object);
        delete this.deviceList[id];
      }
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

module.exports = devicesService;