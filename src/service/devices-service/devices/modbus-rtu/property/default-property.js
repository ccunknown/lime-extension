'use strict'

const AsyncLock = require('async-lock');
const {Property} = require('gateway-addon');

class DefaultProperty extends Property{
  constructor(device, name, schema) {
    super(device, name, schema);
    /*
    constructor(device, name, propertyDescr) {
      this.device = device;
      this.name = name;
      this.visible = true;
      this.fireAndForget = false;
      this.visible = propertyDescr.visible;
    */

    this.exConf = {
      "device-service": device.exConf[`devices-service`],
      "schema": schema,
      "lock": {
        "period": {
          "key": `period`,
          "locker": new AsyncLock()
        }
      },
      "timeout": 5000
    };

    this.setCachedValue(this.exConf.schema.value);
    this.device.notifyPropertyChanged(this);
  }

  start() {
    console.log(`propertyWorker: start() >> `);
    return new Promise(async (resolve, reject) => {
      //this.periodWork();
      await this.setPeriodWork();
      resolve();
    });
  }

  stop() {
    console.log(`propertyWorker: stop() >> `);
    //return clearTimeout(this.period);
    return this.clearPeriodWork();
  }

  setPeriodWork() {
    let locker = this.exConf.lock.period.locker;
    let key = this.exConf.lock.period.key;
    return new Promise((resolve, reject) => {
      locker.acquire(key, async () => {
        if(this.device) {
          await this.periodWork();
          this.period = setTimeout(() => this.setPeriodWork(), this.exConf.schema.config.period);
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
      let id = this.device.exConf.schema.config.address;
      //console.log(`device : ${JSON.stringify(this.device.exConf.schema, null, 2)}`);
      let address = ex.schema.config.address;
      let table = ex.schema.config.table;
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
            "numtoread": ntr,
            "table": table
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