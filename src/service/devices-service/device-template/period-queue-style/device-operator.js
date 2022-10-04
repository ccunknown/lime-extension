/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const { Device } = require(`gateway-addon`);
const wtAdapter = require(`./wtAdapter`);

class DeviceOperator {
  constructor(parent) {
    this.parent = parent;
    this.id = this.parent.id;
    this.devicesService = this.parent.devicesService;
    this.config = this.parent.config;

    // Initial vAdapter
    this.initWtAdapter();

    /*
      Device(adapter, id)
        this.adapter = adapter;
        this.id = id;
        this['@context'] = 'https://iot.mozilla.org/schemas';
        this['@type'] = [];
        this.title = '';
        this.description = '';
        this.properties = new Map();
        this.actions = new Map();
        this.events = new Map();
        this.links = [];
        this.baseHref = null;
        this.pinRequired = false;
        this.pinPattern = null;
        this.credentialsRequired = false;
    */
    // this.wtDevice = new Device(this.devicesService.adapter, this.id);
    this.wtDevice = new Device(
      this.devicesService.shareResource.get(`wtAdapter`),
      this.id
    );
    this.wtDevice.limeDevice = this.parent;

    this.parent.om.obj.log(`${this.id}`, `Construct device operator`);
  }

  initWtAdapter() {
    this.wtAdapter = this.devicesService.shareResource.get(`wtAdapter`);
    if (!this.wtAdapter) {
      // eslint-disable-next-line new-cap
      this.wtAdapter = new wtAdapter(
        this.devicesService.addonManager,
        this.devicesService.manifest.id,
        this.devicesService.manifest.name,
        this.devicesService
      );
      this.devicesService.shareResource.set(`wtAdapter`, this.wtAdapter);

      this.wtAdapter.extEventEmitter.removeAllListeners(`remove`);
      this.wtAdapter.extEventEmitter.on(`remove`, (deviceId) =>
        this.devicesService.removeFromService(deviceId)
      );
    }
  }

  init() {
    return new Promise((resolve, reject) => {
      // let wtPropertyMap;
      Promise.resolve()
        .then(() => this.parent.init())
        // .then((propMap) => {
        //   wtPropertyMap = propMap;
        // })
        .then(() => this.wtAdapter.handleDeviceAdded(this.wtDevice))
        // .then(() =>
        //   wtPropertyMap.forEach((key, value) =>
        //     this.wtDevice.addProperty(value)
        //   )
        // )
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  getSchema() {
    return this.wtDevice.asThing();
  }

  getProperty(id) {
    console.log(`[${this.constructor.name}]:`, `getProperty(${id})`);
    console.log(
      `[${this.constructor.name}]:`,
      `properties:`,
      Object.keys(this.properties)
    );
    const propertyUnit = this.wtDevice.findProperty(id);
    return propertyUnit && propertyUnit.master
      ? propertyUnit.master
      : propertyUnit;
  }

  addChild(childId /* , child */) {
    console.log(`[${this.constructor.name}]`, `addChild(${childId})`);
  }

  getChild(childId) {
    return childId
      ? this.wtDevice.findProperty(childId)
      : this.wtDevice.getPropertyDescriptions();
  }

  start() {
    console.log(`[${this.constructor.name}]`, `start() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.parent.oo.startChild())
        .then((ret) => resolve(ret))
        .catch((err) => {
          reject(err);
        });
    });
  }

  startChild(childId) {
    console.log(
      `[${this.constructor.name}]`,
      `startChild(${childId || ``}) >> `
    );
  }

  stop() {
    console.log(`[${this.constructor.name}]`, `stop() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.parent.oo.stopChild())
        .then((ret) => resolve(ret))
        .catch((err) => {
          reject(err);
        });
    });
  }

  stopChild(childId) {
    console.log(
      `[${this.constructor.name}]`,
      `stopChild(${childId || ``}) >> `
    );
  }
}

module.exports = DeviceOperator;
