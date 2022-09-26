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
      this.devicesService.getSharedResource(`wtAdapter`),
      this.id
    );
    this.wtDevice.limeDevice = this.parent;

    this.startRetirement = {};

    this.parent.om.obj.log(`${this.id}`, `Construct device operator`);
  }

  initWtAdapter() {
    this.wtAdapter = this.devicesService.getSharedResource(`wtAdapter`);
    if (!this.wtAdapter) {
      // eslint-disable-next-line new-cap
      this.wtAdapter = new wtAdapter(
        this.devicesService.addonManager,
        this.devicesService.manifest.id,
        this.devicesService.manifest.name,
        this.devicesService
      );
      this.devicesService.setSharedResource(`wtAdapter`, this.wtAdapter);

      this.wtAdapter.extEventEmitter.removeAllListeners(`remove`);
      this.wtAdapter.extEventEmitter.on(`remove`, (deviceId) =>
        this.devicesService.removeFromService(deviceId)
      );
    }
  }

  init() {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.parent.init())
        .then(() => this.wtAdapter.handleDeviceAdded(this.wtDevice))
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  addProperty(id, templatePath, config) {
    console.log(`[${this.constructor.name}]: addProperty() >> `);
    // console.log(`>> config: ${JSON.stringify(config, null, 2)}`);
    return new Promise((resolve, reject) => {
      const PropertyObject = require(templatePath);
      const property = new PropertyObject(this.parent, id, config);
      let unitProperty;
      Promise.resolve()
        .then(() => property.init())
        .then((unitProp) => {
          unitProperty = unitProp;
        })
        .then(() =>
          this.retryStartProperty(
            property,
            this.config.retry ? this.config.retryNumber : 0,
            this.config.retry ? this.config.retryDelay : undefined
          )
        )
        .then(() => {
          if (unitProperty && unitProperty.constructor.name === `Map`)
            unitProperty.forEach((propUnit, propUnitId) =>
              this.wtDevice.properties.set(propUnitId, propUnit)
            );
          else if (unitProperty)
            this.wtDevice.properties.set(unitProperty.name, unitProperty);
          else this.wtDevice.properties.set(id, property);
        })
        // .then(() => this.wtDevice.properties.set(id, property))
        .then(() => resolve())
        .catch((err) => reject(err));
      // .finally(() => this.wtDevice.properties.set(id, property));
    });
  }

  start() {
    console.log(`[${this.constructor.name}]`, `start() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.retryStartProperty())
        .then((ret) => resolve(ret))
        .catch((err) => {
          this.error = err;
          reject(err);
        });
    });
  }

  retryStartProperty(property, retry, delay) {
    console.log(
      `[${this.constructor.name}]`,
      `retryStartProperty(${property ? property.id : ``}) >> `
    );
    return new Promise((resolve, reject) => {
      if (property) {
        Promise.resolve()
          .then(() => this.startProperty(property))
          .then(
            () => {},
            (reason) => {
              this.parent.om.obj.error(reason);
              if (retry > 0)
                this.startRetirement[property.id] = setTimeout(
                  () => this.startPropertyRetry(property, retry - 1, delay),
                  delay
                );
            }
          )
          .then(() => resolve())
          .catch((err) => reject(err));
      } else {
        Promise.resolve()
          .then(() => this.wtDevice.getPropertyDescriptions())
          .then((properties) =>
            Object.values(properties).reduce((prevProm, prop) => {
              return prevProm.then(() =>
                this.startPropertyRetry(
                  prop,
                  this.config.retry ? this.config.retryNumber : 0,
                  this.config.retry ? this.config.retryDelay : 0
                ).catch((err) => this.parent.om.obj.error(err))
              );
            }, Promise.resolve())
          )
          .catch((err) => this.parent.om.obj.error(err));
      }
    });
  }

  startProperty(property) {
    console.log(
      `[${this.constructor.name}]`,
      `startProperty(${property.id}) >> `
    );
    return new Promise((resolve) => {
      Promise.resolve()
        .then(() => property.start())
        .then(() => resolve(true))
        .catch((err) => {
          console.error(err);
          resolve(false);
        });
    });
  }

  stop() {
    console.log(`[${this.constructor.name}]`, `stop() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.stopPropertyStartRetirement())
        .then(() => this.stopProperty())
        .then(() => this.wtAdapter.handleDeviceRemoved(this.wtDevice))
        // .then(() => this.getState())
        .then((ret) => resolve(ret))
        .catch((err) => {
          this.state = `error`;
          this.error = err;
          reject(err);
        });
    });
  }

  stopProperty(property) {
    console.log(`[${this.constructor.name}]`, `stopProperty() >> `);
    return new Promise((resolve, reject) => {
      if (property) {
        Promise.resolve()
          .then(() => property.stop())
          .then(() => resolve())
          .catch((err) => {
            this.parent.om.obj.error(err);
            reject(err);
          });
      } else {
        Promise.resolve()
          .then(() => this.wtDevice.getPropertyDescriptions())
          .then((properties) =>
            Object.values(properties).reduce((prevProm, prop) => {
              return prevProm
                .then(() => this.stopProperty(prop))
                .catch((err) => this.parent.om.obj.error(err));
            }, Promise.resolve())
          )
          .then(() => resolve())
          .catch((err) => {
            this.parent.om.obj.error(err);
            reject(err);
          });
      }
    });
  }

  stopPropertyStartRetirement(propertyId) {
    console.log(
      `[${this.constructor.name}]`,
      `stopPropertyStartRetirement() >> `
    );
    if (propertyId) {
      if (this.startRetirement[propertyId])
        clearTimeout(this.startRetirement[propertyId]);
      this.startRetirement[propertyId] = undefined;
    } else {
      Object.keys(this.startRetryment).forEach((id) => {
        this.stopPropertyStartRetirement(id);
      });
    }
  }
}

module.exports = DeviceOperator;
