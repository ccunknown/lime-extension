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

const ConfigTranslator = require(`./config-translator.js`);

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
      //this.adapter = new vAdapter(this.addonManager, this.manifest.name);
      await this.initAdapter();
      //this.initDeviceTemplate();
      resolve();
    });
  }

  initAdapter() {
    console.log(`DevicesService: initAdapter() >> `);
    this.adapter = new vAdapter(this.addonManager, this.manifest.name, this.manifest.id);
    this.adapter.extEventEmitter.on(`remove`, (device) => this.onAdapterDeviceRemove(device));
  }

  onAdapterDeviceRemove(id) {
    console.log(`DevicesService: onAdapterDeviceRemove() >> `);
    let device = this.adapter.getDevice(id);
    device.disableProperties();
    return ;
  }

  initDevices() {
    console.log(`DevicesService: initDevices() >> `);
    return new Promise(async (resolve, reject) => {
      let serviceSchema = this.getSchema();
      let list = serviceSchema.list;
      for(let i in list) {
        await this.addToService(i, list[i]);
      }
      resolve();
    });
  }

  start() {
    console.log(`DevicesService: start() >> `);    
    return new Promise(async (resolve, reject) => {
      this.scriptsService = this.laborsManager.getService(`scripts-service`).obj;
      this.enginesService = this.laborsManager.getService(`engines-service`).obj;
      this.configTranslator = new ConfigTranslator(this);
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

  startDevice(id) {
    console.log(`DevicesService: startDevice(${id})`);
    return new Promise((resolve, reject) => {
      let device = this.adapter.getDevice(id);
      if(!device)
        reject(new Errors.ObjectNotFound(`${id}`));
      else {
        device.start()
        .then(() => resolve())
        .catch((err) => reject(err));
      }
    });
  }

  stopDevice(id) {
    console.log(`DevicesService: stopDevice(${id})`);
    return new Promise((resolve, reject) => {
      let device = this.adapter.getDevice(id);
      if(!device)
        reject(new Errors.ObjectNotFound(`${id}`));
      else {
        device.stop()
        .then(() => resolve())
        .catch((err) => reject(err));
      }
    });
  }

  add(config) {
    console.log(`DevicesService: add() >> `);
    console.log(`config: ${JSON.stringify(config, null, 2)}`);
    return new Promise(async (resolve, reject) => {
      let template = await this.getTemplate(config.template, {"deep": true});
      if(template) {
        let id = await this.generateId();
        this.addToConfig(id, config)
        .then((res) => this.addToService(id, config))
        .then((res) => this.reloadConfig())
        .then((res) => resolve(res))
        .catch((err) => reject((err) ? err : new Errors.ErrorObjectNotReturn()));
      }
      else {
        reject(new Error(`Template '${config.template}' not found!!!`));
      }
    });
  }

  addToService(id, config) {
    console.log(`DevicesService: addToService(${id}) >> `);
    return new Promise(async (resolve, reject) => {
      console.log(`add: ${JSON.stringify(config, null, 2)}`);

      //  Check duplicate.
      let device = this.adapter.getDevice(id);
      if(device) {
        console.warn(`Device id "${id}" already in service. Remove old and add new!!!`);
        await this.removeFromService(id);
      }

      if(!config)
        config = await this.getConfigDevice(id);

      //  Initial and Add device to adapter.
      let template = await this.getTemplate(config.template, {"deep": true});
      if(template) {
        // console.log(`template: ${JSON.stringify(template, null, 2)}`);
        let path = Path.join(__dirname, `${template.path}`, `device.js`);
        console.log(`path: ${path}`);
        let Obj = require(path);
        device = new Obj(this, this.adapter, id, config);
        await device.init();
        this.adapter.handleDeviceAdded(device);
        resolve(device.asThing());
      }
      else {
        reject(new Error(`Device template '${config.template}' not found!!!`));
      }
    });
  }

  addToConfig(id, config) {
    console.log(`devicesService: addToConfig(id) >> `);
    return new Promise((resolve, reject) => {
      this.configManager.addToConfig(config, `service-config.devices-service.list.${id}`)
      .then((res) => resolve(res))
      .catch((err) => reject((err) ? err : new Errors.ErrorObjectNotReturn()));
    });
  }

  remove(id) {
    console.log(`DevicesService: removeDevice() >> `);
    return new Promise(async (resolve, reject) => {
      this.removeFromConfig(id)
      .then(() => this.removeFromService(id))
      .then(() => resolve({}))
      .catch((err) => reject(err));
    });
  }

  removeFromConfig(id) {
    console.log(`DevicesService: removeFromConfig(${id}) >> `);
    return new Promise((resolve, reject) => {
      this.configManager.deleteConfig(`service-config.devices-service.list.${id}`)
      .then(() => resolve({}))
      .catch((err) => reject(err));
    });
  }

  removeFromService(id) {
    console.log(`DevicesService: removeFromConfig(${id}) >> `);
    return new Promise((resolve, reject) => {
      let device =this.adapter.getDevice(id);
      if(device) {
        device.disableProperties()
        .then(() => this.adapter.handleDeviceRemoved(device))
        .then(() => resolve({}))
        .catch((err) => reject(err));
      }
      else {
        console.warn(`Device "${id}" not in service!!!`);
        resolve({});
      }
    });
  }

  update(id, config) {
    console.log(`DevicesService: update(${(id) ? `${id}` : ``}) >> `);
    return new Promise((resolve, reject) => {
      this.remove(id)
      .then(() => this.add(config))
      .then(() => resolve({}))
      .catch((err) => reject(err));
    });
  }

  get(id, options) {
    console.log(`DevicesService: get(${id})`);
    return new Promise((resolve, reject) => {
      if(id) {
        let device = this.adapter.getDevice(id);
        let json = device.asThing();
        resolve(JSON.parse(JSON.stringify(json)));
      }
      else {
        let deviceList = this.adapter.getDevices();
        let json = [];
        for(let i in deviceList)
          json.push(deviceList[i].asThing());
        resolve(JSON.parse(JSON.stringify(json)));
      }
    });
  }

  getConfigDevice(id) {
    console.log(`DevicesService: getConfigDevice(${(id) ? `${id}` : ``})`);
    return new Promise((resolve, reject) => {
      this.getSchema({"renew": true})
      .then((conf) => {
        // console.log(`getSchema(): ${JSON.stringify(conf, null, 2)}`);
        let list = conf.list;
        resolve((id) ? (list.hasOwnProperty(id)) ? list[id] : {} : list);
      })
      .catch((err) => reject(err));
    });
  }

  getServiceDevice(id) {
    console.log(`DevicesService: getServiceDevice(${(id) ? `${id}` : ``})`);
    return new Promise((resolve, reject) => {
      let config = null;
      let service = null;
      this.getConfigDevice(id)
      .then((conf) => {
        config = conf;
        return this.getDeviceConfigWithState(id);
      })
      .then((serv) => {
        service = serv;
        return ;
      })
      .then(() => {
        let result = JSON.parse(JSON.stringify(config));
        for(let i in result)
          if(service.hasOwnProperty(i))
            result[i].state = service[i].state;
          else
            result[i].state = `not in service`;
        return result;
      })
      .then((res) => resolve(res))
      .catch((err) => reject(err));
    });
  }

  getDeviceConfigWithState(id) {
    console.log(`DevicesService: getDeviceConfigWithState(${(id) ? `${id}`: ``})`);
    return new Promise(async (resolve, reject) => {
      if(id) {
        let device = this.adapter.getDevice(id);
        let schema = JSON.parse(JSON.stringify(device.exConf.config));
        device.getState()
        .then((state) => {
          schema.state = state;
          resolve(schema);
        })
        .catch((err) => reject(err));
      }
      else {
        let devices = this.adapter.getDevices();
        let schemas = {};
        let promArr = [];
        try {
          for(let i in devices)
            schemas[i] = await this.getDeviceConfigWithState(i);
          resolve(schemas);
        } catch(err) {
          reject(err);
        }
      }
    });
  }

  generateConfigSchema(params) {
    console.log(`DevicesService: generateConfigSchema() >> `);
    return new Promise(async (resolve, reject) => {
      let config = await this.configTranslator.generateConfigSchema(params);
      resolve(config);
    });
  }

  generatePropertyId(params) {
    console.log(`DevicesService: generatePropertyId() >> `);
    return new Promise((resolve, reject) => {
      this.configTranslator.generatePropertyId(params)
      .then((result) => resolve(result))
      .catch((err) => reject(err));
    });
  }

  translateConfig(config) {
    console.log(`DevicesService: getConfigTranslation() >> `);
    return new Promise(async (resolve, reject) => {
      let translated = await this.configTranslator.translate(config);
      resolve(translated);
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
      let schema = await this.enginesService.getSchema({"renew": true});
      let engines = schema.list;
      // console.log(`DevicesService: getCompatibleEngine(): getSchema(): ${JSON.stringify(schema, null, 2)}`);
      // let engines = this.enginesService.getSchema().list;
      // console.log(`DevicesService: getCompatibleEngine(): ${JSON.stringify(engines, null, 2)}`);
      let result = this.jsonToArray(engines, `id`).filter((elem) => elem.template == templateName);
      result = result.map((elem) => elem.id);
      resolve(result);
    });
  }

  generateId() {
    console.log(`DevicesService: generateId() >> `);
    return new Promise(async (resolve, reject) => {
      let deviceList = (await this.getSchema({"renew": true})).list;
      console.log(deviceList);
      console.log(`deviceList: ${JSON.stringify(deviceList, null, 2)}`);
      let id;
      let maxIndex = 10000;
      for(let i = 1;i < maxIndex;i++) {
        id = `lime-device-${i}`;
        if(!(deviceList.hasOwnProperty(id)))
          break;
      }
      resolve(id);
    });
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

    this.extEventEmitter.emit(`remove`, device.id);

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