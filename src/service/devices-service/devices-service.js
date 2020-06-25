'use strict'

const {
  Adapter,
  Device,
  Property,
} = require('gateway-addon');

const Service = require(`../service`);
const Database = require('../../lib/my-database');
const {Defaults, Errors} = require('../../../constants/constants');
const PropertyWorker = require(`./property-worker`);

class devicesService extends Service {
  constructor(extension, config, id) {
    console.log(`devicesService: contructor() >> `);
    super(extension, config, id);
  }

  init(config) {
    console.log(`devicesService: init() >> `);
    return new Promise(async (resolve, reject) => {
      this.config = (config) ? config : this.config;
      this.deviceList = {};
      this.adapter = new vAdapter(this.addonManager, this.manifest.name);
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

  initDevices(config) {
    console.log(`devicesService: initDevices() >> `);
    return new Promise(async (resolve, reject) => {
      config = (config) ? config : this.config;
      let serviceSchema = this.getSchema();
      let list = serviceSchema.config.list;
      this.deviceList = {};
      for(let i in list)
        await this.addDevice(list[i]);
      resolve();
    });
  }

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
}

class vProperty extends Property {
  constructor(device, name, schema) {
    super(device, name, schema);
    this.setCachedValue(schema.value);
    this.device.notifyPropertyChanged(this);
  }

  setValue(value) {
    return new Promise((resolve, reject) => {
      super.setValue(value).then((updatedValue) => {
        resolve(updatedValue);
        this.device.notifyPropertyChanged(this);
      }).catch((err) => {
        reject(err);
      });
    });
  }
}

class vDevice extends Device {
  constructor(adapter, id, schema) {
    super(adapter, id);
    this.name = schema.name;
    this.type = schema.type;
    this['@type'] = schema['@type'];
    this.description = schema.description;
    for (const propertyName in schema.properties) {
      const propertySchema = schema.properties[propertyName];
      const property = new vProperty(this, propertyName, propertySchema);
      this.properties.set(propertyName, property);
    }
  }
}

class vAdapter extends Adapter {
  constructor(addonManager, packageName) {
    super(addonManager, 'LimeAdapter', packageName);
    addonManager.addAdapter(this);
  }

  addDevice(deviceId, schema) {
    return new Promise((resolve ,reject) => {
      if(deviceId in this.devices) {
        reject(`Device: ${deviceId} already exists.`);
      }
      else {
        const device = new vDevice(this, deviceId, schema);
        this.handleDeviceAdded(device);
        resolve(device);
      }
    });
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