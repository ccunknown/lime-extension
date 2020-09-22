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
      "call": {
        "count": 0,
        "last": null
      },
      "success-call": {
        "count": 0,
        "last": null
      },
      "fail-call": {
        "count": 0,
        "last": null
      }
    });
  }

  init() {
    return new Promise((resolve, reject) => {
      try {
        this.configTranslator.translate(this.exConf.config, this.device.exConf.script)
        .then((schema) => {
          this.copyDescr(schema);
          this.setCachedValue(schema.value);
        })
        .then(() => resolve())
        .catch((err) => reject(err));
      } catch(err) {
        reject(err);
      } 
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
    console.log(`${this.name}: DefaultProperty: start() >> `);
    return new Promise((resolve, reject) => {
      this.metrics.set(`start`, (new Date()).toString())
      .then(() => this.setPeriodWork())
      .then((res) => resolve(res))
      .catch((err) => reject(err));
    });
  }

  stop() {
    console.log(`${this.name}: DefaultProperty: stop() >> `);
    return this.clearPeriodWork();
  }

  setPeriodWork() {
    console.log(`${this.name}: DefaultProperty: setPeriodWork() >> `);
    let locker = this.exConf.lock.period.locker;
    let key = this.exConf.lock.period.key;
    return new Promise((resolve, reject) => {
      locker.acquire(key, async () => {
        if(this.device && !this.period) {
          console.log(`>> setPeriodWork(${this.name}) >> Accept.`);
          await this.periodWork();
          this.period = setInterval(() => this.periodWork(), this.exConf.config.period);
        }
        else
          console.log(`>> setPeriodWork(${this.name}) >> Deny.`);
        return ;
      })
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  clearPeriodWork() {
    console.log(`${this.name}: DefaultProperty: clearPeriodWork() >> `);
    let locker = this.exConf.lock.period.locker;
    let key = this.exConf.lock.period.key;
    return new Promise((resolve, reject) => {
      locker.acquire(key, () => {
        clearInterval(this.period);
        this.period = null;
        return ;
      })
      .then(() => resolve());
    });
  }

  periodWork() {
    let locker = this.exConf.lock.periodWork.locker;
    let key = this.exConf.lock.periodWork.key;
    return new Promise((resolve, reject) => {
      locker.acquire(
        key, 
        async (done) => {
          if(this.device && this.exConf[`devices-service`]) {
            let ret = await this._periodWork();
            done(null, ret);
          }
          else {
            await this.clearPeriodWork();
            done(new this.Errors(ParentObjectUnavailable));
          }
        },
        (err, ret) => (err) ? reject(err) : resolve(ret),
        {maxPending: 1}
      );
    });
  }

  _periodWork() {
    // console.log(`${this.name}: DefaultProperty: _periodWork() >> `);
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
      this.metrics.set(`call.last`, (new Date()).toString());
      this.metrics.increase(`call.count`);

      try {
        if(script && engine && engine.getState() == "running") {
          let ret = await engine.act({
            "action": "read",
            "id": id,
            "address": address,
            "table": table,
            "numtoread": ntr
          });

          let value = script.map[table][address].translator(ret.buffer, script.map[table][address]);
          console.log(`${this.device.id}[${this.name}] => [hex: ${ret.buffer.toString('hex')}] / [${typeof value}: ${value}]`);
          this.metrics.set(`success-call.last`, (new Date()).toString());
          this.metrics.increase(`success-call.count`);
          //console.log(`${this.device.id} : ${this.name} : ${typeof value} : ${value}`);
          this.setCachedValueAndNotify(value);
        }
      }
      catch(err) {
        console.log(`DefaultProperty: periodWork() >> Error!!!`);
        this.metrics.set(`fail-call.last`, (new Date()).toString());
        this.metrics.increase(`fail-call.count`);
        console.error(err);
      }
      //this.deviceObject.setProperty(this.property.name, value);
      
      resolve();
    });
  }
}

module.exports = DefaultProperty;