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

class DefaultProperty extends Property{
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
        }
      },
      "timeout": 5000
    };

    this.configTranslator = new ConfigTranslator(this.exConf[`devices-service`]);
  }

  init() {
    return new Promise(async (resolve, reject) => {
      let schema = await this.configTranslator.translate(this.exConf.config, this.device.exConf.script);
      this.copyDescr(schema);
      this.setCachedValue(schema.value);
      //this.device.notifyPropertyChanged(this);

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
    console.log(`propertyWorker: start() >> `);
    return new Promise(async (resolve, reject) => {
      await this.setPeriodWork();
      resolve();
    });
  }

  stop() {
    console.log(`propertyWorker: stop() >> `);
    return this.clearPeriodWork();
  }

  setPeriodWork() {
    let locker = this.exConf.lock.period.locker;
    let key = this.exConf.lock.period.key;
    return new Promise((resolve, reject) => {
      locker.acquire(key, async () => {
        if(this.device) {
          await this.periodWork();
          this.period = setTimeout(() => this.setPeriodWork(), this.exConf.config.period);
        }
        return ;
      })
      .then(() => resolve());
    });
  }

  clearPeriodWork() {
    let locker = this.exConf.lock.period.locker;
    let key = this.exConf.lock.period.key;
    return new Promise((resolve, reject) => {
      locker.acquire(key, () => {
        clearTimeout(this.period);
        return ;
      })
      .then(() => resolve());
    });
  }

  periodWork() {
    console.log(`DefaultProperty: periodWork() >> `);
    return new Promise(async (resolve, reject) => {
      let engine = this.device.getEngine();
      let script = this.device.getScript();

      let ex = this.exConf;
      let id = this.device.exConf.config.address;
      let address = ex.config.address;
      let table = ex.config.table;
      //console.log(`script : ${JSON.stringify(this.script, null, 2)}`);
      let ntr = script.map[table][address].registerSpec.number;

      //  Prevent infinite await by using setTimeout to call resolve().
      //setTimeout(resolve, this.exConf.timeout);

      try {
        if(script && engine && engine.getState() == "running") {
          let ret = await engine.act({
            "action": "read",
            "id": id,
            "address": address,
            "table": table,
            "numtoread": ntr
          });

          console.log(`ret : ${ret.buffer.toString('hex')}`);
          let value = script.map[table][address].translator(ret.buffer, script.map[table][address]);
          console.log(`${this.device.id} : ${this.name} : ${typeof value} : ${value}`);
          this.setCachedValueAndNotify(value);
        }
      }
      catch(err) {
        console.log(`DefaultProperty: periodWork() >> Error!!!`);
        console.error(err);
      }
      //this.deviceObject.setProperty(this.property.name, value);
      
      resolve();
    });
  }
}

module.exports = DefaultProperty;