'use strict'

const AsyncLock = require('async-lock');
const {Property} = require('gateway-addon');

const ConfigTranslator = require(`./config-translator.js`);

const DESCR_FIELDS = [
  'title',
  'type',
  '@type',
  'unit',
  'description',
  'minimum',
  'maximum',
  'enum',
  'readOnly',
  'multipleOf',
  'links',
];

class MeshData extends Property{
  constructor(device, name, config) {
    super(device, name, {});
    /*
    constructor(device, name, propertyDescr) {
      this.device = device;
      this.name = name;
      this.visible = true;
      this.fireAndForget = false;
      this.visible = propertyDescr.visible;
    */

    this.exConf = {
      "devices-service": device.exConf[`devices-service`],
      "config": config,
      "schema": null,
      "lock": {
        "period": {
          "key": `period`,
          "locker": new AsyncLock()
        },
        "periodWork": {
          "key": `periodWork`,
          "locker": new AsyncLock({"maxPending": 0})
        }
      },
      "timeout": 5000
    };

    this.Errors = require(`${this.exConf[`devices-service`].getRootDirectory()}/constants/errors.js`);
    this.configTranslator = new ConfigTranslator(this.exConf[`devices-service`]);

    let itemMetricsPath = `${this.exConf[`devices-service`].getRootDirectory()}/src/service/item-metrics.js`;
    console.log(`Item Metrics Path: ${itemMetricsPath}`);
    let ItemMetrics = require(itemMetricsPath);
    this.metrics = new ItemMetrics({
      "start": null,
      "data-count": 0,
      "last-update": null
    });
  }

  init() {
    console.log(`${this.name}: MeshData: init() >> `);
    return new Promise((resolve, reject) => {
      try {
        this.configTranslator.translate(this.exConf.config)
        .then((schema) => {
          this.copyDescr(schema);
          this.setCachedValue(``);
        })
        .then(() => this.initEngineCallback())
        .then(() => this.device.properties.set(this.name, this))
        .then(() => resolve())
        .catch((err) => reject(err));
      } catch(err) {
        reject(err);
      } 
    });
  }

  initEngineCallback() {
    console.log(`${this.name}: MeshData: initEngineCallback() >> `);
    return new Promise((resolve, reject) => {
      this.engineCallback = (data) => {
        this.setCachedValueAndNotify(data);
        this.metrics.set(`last-update`, (new Date()).toString());
        this.metrics.increase(`data-count`);
      };
      resolve();
    });
  }

  copyDescr(schema) {
    if(schema.hasOwnProperty(`min`))
      this.minimum = schema.min;

    if(schema.hasOwnProperty(`max`))
      this.maximum = schema.max;

    if(schema.hasOwnProperty(`label`))
      this.title = schema.label;

    for(let field of DESCR_FIELDS) {
      if(schema.hasOwnProperty(field)) {
        this[field] = schema[field];
      }
    }
  }

  start() {
    console.log(`${this.name}: MeshData: start() >> `);
    return new Promise((resolve, reject) => {
      this.metrics.set(`start`, (new Date()).toString())
      .then(() => this.setEngineDataListener())
      .then((res) => resolve(res))
      .catch((err) => reject(err));
    });
  }

  stop() {
    console.log(`${this.name}: MeshData: stop() >> `);
    return this.clearEngineDataListener();
  }

  setEngineDataListener() {
    console.log(`${this.name}: MeshData: setEngineDataListener() >> `);
    return new Promise((resolve, reject) => {
      let engine = this.device.getEngine();
      engine.event.on(`data`, this.engineCallback);
      resolve();
    })
  }

  clearEngineDataListener() {
    console.log(`${this.name}: MeshData: clearEngineDataListener() >> `);
    return new Promise((resolve, reject) => {
      let engine = this.device.getEngine();
      engine.removeListener(`data`, this.engineCallback);
      resolve();
    });
  }

  //  Remove console.log for reduce numbers of log printout.
  setCachedValueAndNotify(value) {
    const oldValue = this.value;
    this.setCachedValue(value);

    // setCachedValue may change the value, therefore we have to check
    // this.value after the call to setCachedValue
    const hasChanged = oldValue !== this.value;

    if (hasChanged) {
      this.device.notifyPropertyChanged(this);

      // console.log('setCachedValueAndNotify for property', this.name,
      //             'from', oldValue, 'to', this.value, 'for', this.device.id);
    }

    return hasChanged;
  }
}

module.exports = MeshData;