'use strict'

const EventEmitter = require('events').EventEmitter;

//const Database = require('../lib/my-database');
const {Defaults, Errors} = require('../../constants/constants');
const {
  Adapter,
  Database,
  Device,
  Event,
  Property,
} = require('gateway-addon');

class vthingService extends EventEmitter {
  constructor(extension, config) {
    console.log(`vthingService: contructor() >> `);
    super(extension.addonManager, extension.manifest.id);

    this.extension = extension;
    this.manifest = extension.manifest;
    this.addonManager = extension.addonManager;

    this.laborsManager = this.extension.laborsManager;

    this.config = config;
    this.schemaList = config.vthing.list;
    this.deviceList = [];

    this.init();
  }

  init() {
    console.log(`vthingService: init() >> `);
    return new Promise((resolve, reject) => {
      this.initDependencies()
      .then(() => resolve());
    });
  }

  initDependencies() {
    console.log(`vthingService: initDependencies() >> `);
    return new Promise((resolve, reject) => {
      Promise.all([
        this.laborsManager.getService(`modbus-service`)
      ])
      .then((arr) => {
        this.modbusService = arr[0].obj;
        //console.log(`>>>>>>>>>>>>>>>>>>>>>>`);
        //this.modbusService.init();
        //this.modbusService.read(`test`, {}, `template`);
        //console.log(`modbusService : ${arr[0].id}`);
        resolve();
      });
    });
  }

  start() {
    console.log(`vthingService: start() >> `);
    return new Promise((resolve, reject) => {
      this.initialVAdapter()
      .then(() => this.setReadPeriode(5000))
      .then(() => resolve());
    });
  }

  stop() {
    console.log(`vthingService: stop() >> `);
  }

  initialVAdapter() {
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

  setReadPeriode(periode) {
    console.log(`vthingService: setReadPeriode() >> `);
    this.readPeriode = setInterval(() => {
      this.periodeWorker();
    }, periode);
  }

  periodeWorker() {
    console.log(`vthingService: periodeWorker() >> `);

    this.deviceList.forEach(async (elem) => {
      let device = elem.device;
      let schema = elem.schema;
      let address = elem.address;

      for(let i in schema.properties) {
        let property = schema.properties[i];
        //device.getProperty(i);

        let deviceAddr = address;
        let prop = {
          table: property.metadata.table,
          address: property.metadata.address
        };
        let template = `SDM120CT`;
        let result = await this.modbusService.read(deviceAddr, prop, template);
        console.log(`${i} : ${result}`);

        //let devProp = device.getProperty(i);
        //devProp.setValue(result);
        //device.getProperty(i)
        //.then((p) => p.setValue(result));
        device.setProperty(i, result);
      }
    });
  }

  createVDevice(schema) {

  }

  createVProperty(schema) {

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

module.exports = vthingService;