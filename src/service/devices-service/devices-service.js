'use strict'

const EventEmitter = require('events').EventEmitter;

const {
  Adapter,
  Device,
  Event,
  Property,
} = require('gateway-addon');

const Database = require('../../lib/my-database');
const {Defaults, Errors} = require('../../../constants/constants');
const PropertyWorker = require(`./property-worker`);

class devicesService extends EventEmitter {
  constructor(extension, config) {
    console.log(`devicesService: contructor() >> `);
    super(extension.addonManager, extension.manifest.id);

    this.extension = extension;
    this.manifest = extension.manifest;
    this.addonManager = extension.addonManager;

    this.laborsManager = this.extension.laborsManager;
    this.config = config;

    this.deviceList = {};
    this.init();
  }

  init() {
    console.log(`devicesService: init() >> `);
    return new Promise(async (resolve, reject) => {
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

  initVAdapter() {
    console.log(`vthingService: initialVAdapter() >> `);
    this.adapter = new vAdapter(this.addonManager, this.manifest.name);
    this.schemaList.forEach((schema) => {
      console.log(`schema : ${JSON.stringify(schema, null, 2)}`);
      const device = new vDevice(this.adapter, `${schema.id}`, schema);
      
      this.deviceList.push({
        address: schema.address,
        schema: schema,
        device: device
      });
      
      this.adapter.handleDeviceAdded(device);
    });
    return Promise.resolve();
  }

  initDevices(config) {
    console.log(`devicesService: initDevices() >> `);
    return new Promise(async (resolve, reject) => {
      config = (config) ? config : this.config;
      let list = config[`devices-service`].list;
      this.deviceList = {};
      for(let i in list) {
        let device = {
          "schema": list[i],
          "object": new vDevice(this.adapter, `${list[i].id}`, list[i]),
          "engine": this.enginesService.getEngine(list[i].config.engine).object,
          "script": this.scriptsService.getScript(list[i].config.script),
          "property": {}
        };
        //console.log(`device engine : `);
        //console.log(device.engine);
        for(let j in list[i].properties) {
          let prop = new PropertyWorker({
            "device": device,
            "property": list[i].properties[j]
          });
          await prop.start();
          device.property[j] = prop;
        }
        this.deviceList[list[i].id] = device;
        this.adapter.handleDeviceAdded(this.deviceList[list[i].id].object);
      }
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