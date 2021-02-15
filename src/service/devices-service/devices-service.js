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
    return new Promise((resolve, reject) => {
      this.config = (config) ? config : this.config;
      this.initAdapter();
      this.scriptsService = this.laborsManager.getService(`scripts-service`).obj;
      this.enginesService = this.laborsManager.getService(`engines-service`).obj;
      resolve();
    });
  }

  initAdapter() {
    console.log(`DevicesService: initAdapter() >> `);
    this.adapter = new vAdapter(this.addonManager, this.manifest.id, this.manifest.name, this);
    this.adapter.extEventEmitter.removeAllListeners(`remove`);
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
    return new Promise((resolve, reject) => {
      let serviceSchema = this.getSchema();
      let list = serviceSchema.list;

      Object.keys(list).reduce((prevProm, id) => {
        return (list[id]._config && list[id]._config.addToService) ? 
          this.addToService(id, list[id]) : 
          Promise.resolve();
      }, Promise.resolve())
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  start() {
    console.log(`DevicesService: start() >> `);    
    return new Promise((resolve, reject) => {
      this.scriptsService = this.laborsManager.getService(`scripts-service`).obj;
      this.enginesService = this.laborsManager.getService(`engines-service`).obj;
      this.configTranslator = new ConfigTranslator(this);
      this.initDevices()
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  stop() {
    console.log(`DevicesService: stop() >> `);
    return new Promise((resolve, reject) => {
      this.getServiceDevice()
      .then((services) => {
        redArr = Object.keys(services);
        return redArr.reduce((prev, next) => {
          return prev.then(() => this.stopDevice(next)).catch((err) => reject(err));
        }, Promise.resolve());
      })
      .then(() => resolve({}))
      .catch((err) => reject(err));
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
    // console.log(`config: ${JSON.stringify(config, null, 2)}`);
    return new Promise((resolve, reject) => {
      let id, respond = {};
      this.configTranslator.validate(config)
      .then(() => this.getTemplate(config.template, {"deep": true}))
      .then((template) => (template) ? 
        this.generateId() : 
        new Error(`Template '${config.template}' not found!!!`))
      .then((i) => id = i)
      .then(() => this.addToConfig(id, config))
      .then(() => this.addToService(id, config))
      .then(() => this.reloadConfig())
      .then(() => this.getServiceDevice(id))
      .then((res) => resolve(res))
      .catch((err) => reject(err));
    });
  }

  addToService(id, config, options) {
    console.log(`DevicesService: addToService(${id}) >> `);
    return new Promise((resolve, reject) => {
      // console.log(`add: ${JSON.stringify(config, null, 2)}`);

      //  Check duplicate.
      let device = this.adapter.getDevice(id);
      ((device) ? Promise.resolve() : this.removeFromService(id))
      //  Identify config.
      .then(() => (config) ? Promise.resolve(config) : this.getConfigDevice(id))
      .then((conf) => config = conf)
      //  Get device template.
      .then(() => this.getTemplate(config.template, {"deep": true}))
      .then((template) => {
        if(!template)
          throw(new Error(`Device template '${config.template}' not found!!!`));
        let path = Path.join(__dirname, `${template.path}`, `device.js`);
        let Obj = require(path);
        device = new Obj(this, this.adapter, id, config);
        return ;
      })
      .then(() => device.init())
      .then(() => this.adapter.handleDeviceAdded(device))
      // .then(() => this.applyObjectOptions(id, options))
      .then(() => resolve(device.asThing()))
      .catch((err) => reject(err));
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
    return new Promise((resolve, reject) => {
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

  removeFromService(id, options) {
    console.log(`DevicesService: removeFromService(${id}) >> `);
    return new Promise((resolve, reject) => {
      let device = this.adapter.getDevice(id);
      if(device) {
        device.disableProperties()
        .then(() => this.adapter.handleDeviceRemoved(device))
        // .then(() => this.applyObjectOptions(id, options))
        .then(() => resolve({}))
        .catch((err) => reject(err));
      }
      else {
        console.warn(`>> Device "${id}" not in service!!!`);
        resolve({});
      }
    });
  }

  update(id, config) {
    console.log(`DevicesService: update(${(id) ? `${id}` : ``}) >> `);
    return new Promise((resolve, reject) => {
      this.configTranslator.validate(config)
      // .then((valid) => (valid.errors && valid.errors.length) ? 
      //   reject(new Errors.InvalidConfigSchema(valid)) :
      //   this.remove(id))
      .then(() => this.remove(id))
      .then(() => this.add(config))
      .then(() => resolve({}))
      .catch((err) => reject(err));
    });
  }

  get(id, options) {
    console.log(`DevicesService: get(${id})`);
    return new Promise((resolve, reject) => {
      if(options && options.object)
        resolve((id) ? this.adapter.getDevice(id) : this.adapter.getDevices());
      else if(id) {
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

  getByConfigAttribute(attr, value) {
    console.log(`DevicesService: getByConfigAttribute(${attr}, ${value})`);
    return new Promise((resolve, reject) => {
      let devices = this.adapter.getDevices();

      let result = {};
      for(let i in devices) {
        console.log(`>> exConf: ${JSON.stringify(devices[i].exConf.config, null, 2)}`);
        if(devices[i].exConf.config.hasOwnProperty(attr) && devices[i].exConf.config[attr] == value)
          result[i] = devices[i];
      }
      resolve(result);
    });
  }

  getConfigDevice(id) {
    console.log(`DevicesService: getConfigDevice(${(id) ? `${id}` : ``})`);
    return new Promise((resolve, reject) => {
      this.getSchema({"renew": true})
      .then((conf) => {
        // console.log(`>> getSchema(): ${JSON.stringify(conf, null, 2)}`);
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
        console.log(`>> result: ${JSON.stringify(result, null, 2)}`);
        if(id)
          result.state = (service) ? service.state : `not in service`;
        else {
          for(let i in result) {
            if(service.hasOwnProperty(i))
              result[i].state = service[i].state;
            else
              result[i].state = `not in service`;
          }
        }
        return result;
      })
      .then((res) => resolve(res))
      .catch((err) => reject(err));
    });
  }

  getDeviceConfigWithState(id) {
    console.log(`DevicesService: getDeviceConfigWithState(${(id) ? `${id}`: ``})`);
    return new Promise((resolve, reject) => {
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
        let redArr = Object.keys(devices);
        let reduceProm = redArr.reduce((prev, next) => {
          return prev
          .then(() => this.getDeviceConfigWithState(next))
          .then((schema) => schemas[next] = schema)
          .catch((err) => reject(err));
        }, Promise.resolve());
        reduceProm.then(() => resolve(schemas)).catch((err) => reject(err));
      }
    });
  }
  getDeviceConfigByAttribute(attr, val) {
    console.log(`DevicesService: getDeviceConfigByAttribute(${attr}, ${val}) >> `);
  // getConfigDeviceByAttribute(attr, val) {
  //   console.log(`DevicesService: getConfigDeviceByAttribute(${attr}, ${val}) >> `);
    return new Promise((resolve, reject) => {
      this.getConfigDevice()
      .then((config) => {
        let result = {};
        for(let i in config)
          if(config[i].hasOwnProperty(attr) && config[i][attr] == val)
            result[i] = JSON.parse(JSON.stringify(config[i]));
        return result;
      })
      .then((res) => resolve(res))
      .catch((err) => reject(err));
    });
  }

  generateConfigSchema(params) {
    console.log(`DevicesService: generateConfigSchema() >> `);
    return new Promise((resolve, reject) => {
      this.configTranslator.generateConfigSchema(params)
      .then((config) => resolve(config))
      .catch((err) => reject(err));
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
    return new Promise((resolve, reject) => {
      this.configTranslator.translate(config)
      .then((translated) => resolve(translated))
      .catch((err) => reject(err));
    });
  }

  getTemplate(name, options) {
    console.log(`DevicesService: getTemplate(${(name) ? name : ``})`);
    return new Promise((resolve, reject) => {
      let serviceSchema = this.getSchema();
      if(name) {
        let result = null;
        let opttmp = (options) ? JSON.parse(JSON.stringify(options)) : {};
        opttmp.object = false;

        this.getDirectorySchema(serviceSchema.directory, options)
        .then((deviceDir) => deviceDir.children.find((elem) => elem.name == name))
        .then((device) => (device) ? this.getDirectorySchema(device.path, options) : null)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
      }
      else {
        this.getDirectorySchema(serviceSchema.directory, options)
        .then((deviceList) => resolve(deviceList.children))
        .catch((err) => reject(err));
      }
    });
  }

  getCompatibleScript(tagArr) {
    console.log(`ModbusDevice: getCompatibleScript() >> `);
    return new Promise((resolve, reject) => {
      this.scriptsService.get(null, {"deep": true})
      .then((scripts) => {
        let result = scripts.filter((elem) => {
          //console.log(`tags: ${elem.meta.tags}`);
          return !!elem.meta.tags.find((elem) => tagArr.includes(elem));
        });
        return result.map((elem) => elem.name);
      })
      .then((res) => resolve(res))
      .catch((err) => reject(err));
    });
  }

  getCompatibleEngine(tagArr) {
    console.log(`DevicesService: getCompatibleEngine(${tagArr.toString()}) >> `);
    return new Promise((resolve, reject) => {
      this.enginesService.getSchema({"renew": true})
      .then((schema) => {
        let engines = schema.list;
        let result = this.jsonToArray(engines, `id`).filter((elem) => tagArr.includes(elem.template));
        return result.map((elem) => elem.id);
      })
      .then((res) => resolve(res))
      .catch((err) => reject(err));
    });
  }

  getEngineTemplateName(engineName) {
    console.log(`DevicesService: getEngineTemplateName(${engineName})`);
    return new Promise((resolve, reject) => {
      this.enginesService.getSchema({"renew": true})
      .then((config) => config.list.hasOwnProperty(engineName) ? config.list[engineName].template : null)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
    });
  }

  generateId() {
    console.log(`DevicesService: generateId() >> `);
    return new Promise((resolve, reject) => {
      this.getSchema({"renew": true})
      .then((deviceConf) => {
        let id;
        let maxIndex = 10000;
        for(let i = 1;i < maxIndex;i++) {
          id = `lime-device-${i}`;
          if(!(deviceConf.list.hasOwnProperty(id)))
            break;
        }
        return id;
      })
      .then((id) => resolve(id))
      .catch((err) => reject(err));
    });
  }
}

class vAdapter extends Adapter {
  constructor(addonManager, packageId, packageName, devicesService) {
    super(addonManager, packageId, packageName);
    addonManager.addAdapter(this);
    const events = require(`events`);
    this.devicesService = devicesService;
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
    .then(() => console.log('>> ExampleAdapter: device:', device.id, 'was unpaired.'))
    .catch((err) => {
      console.error('>> ExampleAdapter: unpairing', device.id, 'failed');
      console.error(err);
    });
  }

  cancelRemoveThing(device) {
    console.log('>> ExampleAdapter:', this.name, 'id', this.id, 'cancelRemoveThing(', device.id, ')');
  }

  unload() {
    console.log(`vAdapter: unload() >> `);
    return new Promise((resolve, reject) => {
      this.devicesService.stop()
      .then(() => console.log(`>> devices-service stopped.`))
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }
}

module.exports = DevicesService;