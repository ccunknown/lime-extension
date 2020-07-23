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
      //this.initDeviceTemplate();
      resolve();
    });
  }

  initAdapter() {
    console.log(`DevicesService: initAdapter() >> `);
    this.adapter = new vAdapter(this.addonManager, this.manifest.name);
    this.adapter.handleDeviceRemoved
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
      this.scriptsService = this.laborsManager.getService(`scripts-service`).obj;
      this.enginesService = this.laborsManager.getService(`engines-service`).obj;
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
      console.log(`add: ${JSON.stringify(schema, null, 2)}`);
      let device = this.adapter.getDevice(schema.id);
      if(device) {
        console.warn(`Device id "${schema.id}" already exist. Remove old and add new!!!`);
        await this.remove(schema.id);
      }
      let serviceSchema = this.getSchema();
      let templates = (await this.getDirectorySchema(serviceSchema.directory, {"deep": true})).children;
      console.log(`templates: ${JSON.stringify(templates, null, 2)}`);
      let template = templates.find((elem) => {
        console.log(`schema.config.device: ${schema.config.device}`);
        console.log(`elem.name: ${elem.name}`);
        return schema.config.device == elem.name;
      });
      if(template) {
        console.log(`template: ${JSON.stringify(template, null, 2)}`);
        let path = Path.join(__dirname, `${template.path}`, `device`);
        console.log(`path: ${path}`);
        let Obj = require(path);
        device = new Obj(this, this.adapter, schema);
        await device.init();
        this.adapter.handleDeviceAdded(device);
        resolve();
      }
      else {
        reject(new Error(`Device template '${schema.config.device}' not found!!!`));
      }
    });
  }

  addWithConfigSchema(schema) {
    return new Promise(async (resolve, reject) => {
      //console.log(`schema: ${JSON.stringify(schema, null, 2)}`);
      let template = await this.getTemplate(schema.device.device, {"deep": true});
      if(template) {
        let templateObj = require(`./${template.path.replace(/^\//, ``).replace(/^\/$/, ``)}/device`);
        let device = new templateObj(this, this.adapter, {"id": "test"});
        let thingSchema = await device.translateConfigSchema(schema);
        //console.log(`thingSchema: ${JSON.stringify(thingSchema, null, 2)}`);
        // let schema = await device.getConfigSchema(params);
        // for(let i in schema.properties.device.properties)
        //   baseSchema.properties.device.properties[i] = schema.properties.device.properties[i];
        // baseSchema.properties.device.required = [...baseSchema.properties.device.required, ...schema.properties.device.required]
        // schema.properties.device = baseSchema.properties.device;
        // resolve(schema);
        await this.add(thingSchema);
        resolve(thingSchema);
      }
      else {
        reject();
      }
    });
  }

  getConfigSchema(params) {
    console.log(`DevicesService: getDeviceConfigSchema()`);
    return new Promise(async (resolve, reject) => {
      let deviceTemplateList = await this.getTemplate(null, {"deep": true});
      if(!params || !params.device || !params.device.device) {
        if(deviceTemplateList.length > 0) {
          if(!params)
            params = {};
          else if(!params.device)
            params.device = {};
          params.device.device = deviceTemplateList[0].name;
        }
      }
          
      let name = (params && params.device) ? params.device.device : undefined;
      let baseSchema = {
        "type": "object",
        "required": [`device`, `properties`],
        "additionalProperties": false,
        "properties": {
          "device": {
            "type": "object",
            "required": [`id`, `name`, `device`],
            "additionalProperties": false,
            "properties": {
              "id": {
                "type": "string",
                "title": "ID",
                "const": this.generateId()
              },
              "name": {
                "type": "string",
                "title": "Name",
                "attrs": {
                  "placeholder": "Device's display name"
                }
              },
              "description": {
                "type": "string",
                "title": "Description",
                "attrs": {
                  "type": "textarea",
                  "placeholder": "Device's description"
                }
              },
              "device": {
                "type": "string",
                "title": "Device",
                "enum": deviceTemplateList.map((elem) => elem.name)
              }
            }
          }
        }
      };
      if(name) {
        let template = await this.getTemplate(name, {"deep": true});
        if(template) {
          let templateObj = require(`./${template.path.replace(/^\//, ``).replace(/^\/$/, ``)}/device`);
          let device = new templateObj(this, this.adapter, {"id": "test"});
          let schema = await device.getConfigSchema(params);
          for(let i in schema.properties.device.properties)
            baseSchema.properties.device.properties[i] = schema.properties.device.properties[i];
          baseSchema.properties.device.required = [...baseSchema.properties.device.required, ...schema.properties.device.required]
          schema.properties.device = baseSchema.properties.device;
          resolve(schema);
        }
      }
      else {
        resolve(baseSchema);
      }
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

  getTemplate(name, options) {
    console.log(`DevicesService: getTemplate(${(name) ? name : ``})`);
    return new Promise(async (resolve, reject) => {
      let serviceSchema = this.getSchema();
      if(name) {
        let result = null;
        let opttmp = (options) ? JSON.parse(JSON.stringify(options)) : {};
        opttmp.object = false;
        let deviceList = (await this.getDirectorySchema(serviceSchema.directory, opttmp)).children;
        //console.log(`deviceList: ${JSON.stringify(deviceList, null, 2)}`);
        let device = deviceList.find((elem) => elem.name == name);
        if(device)
          result = await this.getDirectorySchema(device.path, options);
        resolve(result);
      }
      else {
        let deviceList = (await this.getDirectorySchema(serviceSchema.directory, options)).children;
        //console.log(`deviceList: ${JSON.stringify(deviceList)}`);
        resolve(deviceList);
      }
    });
  }

  getCompatibleScript(tagArr) {
    console.log(`ModbusDevice: getCompatibleScript() >> `);
    return new Promise(async (resolve, reject) => {
      let scripts = await this.scriptsService.get(null, {"deep": true});
      //console.log(`ModbusDevice: getCompatibleScript(): ${JSON.stringify(scripts, null, 2)}`);
      let result = scripts.filter((elem) => {
        //console.log(`tags: ${elem.meta.tags}`);
        return !!elem.meta.tags.find((elem) => tagArr.includes(elem));
      });
      result = result.map((elem) => elem.name);
      resolve(result);
    });
  }

  getCompatibleEngine(templateName) {
    console.log(`DevicesService: getCompatibleEngine(${templateName}) >> `);
    return new Promise(async (resolve, reject) => {
      let engines = this.enginesService.getSchema().list;
      console.log(`DevicesService: getCompatibleEngine(): ${JSON.stringify(engines, null, 2)}`);
      let result = engines.filter((elem) => elem.engine == templateName);
      result = result.map((elem) => elem.name);
      resolve(result);
    });
  }

  generateId() {
    console.log(`DevicesService: generateId() >> `);
    let deviceList = this.getSchema().list;
    let id;
    let maxIndex = 10000;
    for(let i = 1;i < maxIndex;i++) {
      id = `lime-device-${i}`;
      if(!deviceList.find((elem) => elem.id == id))
        break;
    }
    return id;
  }
}

class vAdapter extends Adapter {
  constructor(addonManager, packageName) {
    super(addonManager, 'LimeAdapter', packageName);
    addonManager.addAdapter(this);
    const events = require(`events`);
    this.extEventEmitter = new events.EventEmitter();
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

    this.extEventEmitter.emit(`remove`, device);

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