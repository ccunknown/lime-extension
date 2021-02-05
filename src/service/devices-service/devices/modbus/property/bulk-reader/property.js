'use strict'

const AsyncLock = require('async-lock');

const ConfigTranslator = require(`./config-translator.js`);
const PropertyUnit = require(`./propertyUnit.js`);

class BulkReader {
  constructor(device, id, config) {
    this.id = id;
    this.config = config;
    this.device = device;
    this.devicesService = device.exConf[`devices-service`];
    this.lock = {
      "period": {
        "key": `period`,
        "locker": new AsyncLock()
      },
      "periodWork": {
        "key": `periodWork`,
        "locker": new AsyncLock({"maxPending": 0})
      }
    };
    this.timeout = 5000;
    this.properties = {};

    this.Errors = require(`${this.devicesService.getRootDirectory()}/constants/errors.js`);
    this.configTranslator = new ConfigTranslator(this.devicesService);

    let itemMetricsPath = `${this.devicesService.getRootDirectory()}/src/service/item-metrics.js`;
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
      this.initProperty(this.config)
      .then(() => resolve())
      .catch((err) => reject());
    });
  }

  initProperty(bulkConf) {
    console.log(`BulkReader: initProperty() >> `);
    return new Promise(async (resolve, reject) => {
      try {
        console.log(`bulkConf: ${JSON.stringify(bulkConf, null, 2)}`)
        let confJson = {};
        bulkConf.address.forEach((addr) => {
          let id = this.generatePropertyId(addr);
          let config = JSON.parse(JSON.stringify(bulkConf));
          let script = this.device.getScript();
          config.title = script.map[config.table][addr].name;
          config.address = addr;
          confJson[id] = config;
        });
        console.log(`confJson: ${JSON.stringify(confJson, null, 2)}`);
        for(let i in confJson)
          await this.addProperty(i, confJson[i]);
        resolve();
      } catch(err) {
        console.error(err);
        reject(err);
      }
    });
  }

  addProperty(id, config) {
    console.log(`BulkReader: addProperty(${id}) >> `);
    return new Promise((resolve, reject) => {
      let conf = JSON.parse(JSON.stringify(config));
      let fullMap = this.device.getScript();
      conf.address = [conf.address];
      this.configTranslator.translate(conf, fullMap)
      .then((translated) => {
        console.log(`${id}: ${JSON.stringify(translated, null, 2)}`);
        return new PropertyUnit(this.device, this, id, translated);
      })
      .then((prop) => this.device.properties.set(id, prop))
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  start() {
    console.log(`${this.id}: DefaultProperty: start() >> `);
    return new Promise((resolve, reject) => {
      this.metrics.set(`start`, (new Date()).toString())
      .then(() => this.setPeriodWork())
      .then((res) => resolve(res))
      .catch((err) => reject(err));
    });
  }

  stop() {
    console.log(`${this.id}: DefaultProperty: stop() >> `);
    return this.clearPeriodWork();
  }

  setPeriodWork() {
    console.log(`${this.id}: DefaultProperty: setPeriodWork() >> `);
    let locker = this.lock.period.locker;
    let key = this.lock.period.key;
    return new Promise((resolve, reject) => {
      locker.acquire(key, async () => {
        if(this.device && !this.period) {
          console.log(`>> setPeriodWork(${this.id}) >> Accept.`);
          await this.periodWork();
          this.period = setInterval(() => this.periodWork(), this.config.period);
        }
        else
          console.log(`>> setPeriodWork(${this.id}) >> Deny.`);
        return ;
      })
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  clearPeriodWork() {
    console.log(`${this.id}: DefaultProperty: clearPeriodWork() >> `);
    let locker = this.lock.period.locker;
    let key = this.lock.period.key;
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
    let locker = this.lock.periodWork.locker;
    let key = this.lock.periodWork.key;
    return new Promise((resolve, reject) => {
      locker.acquire(
        key, 
        async (done) => {
          if(this.device && this.devicesService) {
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

  generatePropertyId(address) {
    return `${this.id}-${Number(address).toString(16)}`;
  }

  _periodWork() {
    // console.log(`${this.id}: DefaultProperty: _periodWork() >> `);
    return new Promise(async (resolve, reject) => {
      let engine = this.device.getEngine();
      let script = this.device.getScript();

      let ip = (this.device.exConf.config.hasOwnProperty(`ip`)) ? this.device.exConf.config.ip : undefined;
      let port = (this.device.exConf.config.hasOwnProperty(`port`)) ? this.device.exConf.config.port : undefined;
      let id = this.device.exConf.config.address;
      let addrArr = this.config.address;
      let firstAddr = addrArr[0];
      let lastAddr = addrArr[addrArr.length-1];
      let table = this.config.table;

      addrArr.sort((a, b) => a-b);
      let address = addrArr[0];
      let ntr = lastAddr - firstAddr + script.map[table][lastAddr].registerSpec.number;
      let offset = firstAddr;

      this.metrics.set(`call.last`, (new Date()).toString());
      this.metrics.increase(`call.count`);

      try {
        if(script && engine && engine.getState() == "running") {
          let opt = {
            "action": "read",
            "id": id,
            "address": address,
            "table": table,
            "numtoread": ntr
          };

          if(ip && port) {
            opt.ip = ip;
            opt.port = port;
          }

          let ret = await engine.act(opt);

          // console.log(`${this.device.id}[${this.id}] => [hex: ${ret.buffer.toString('hex')}]`);
          // console.log(ret.buffer);

          for(let i in addrArr) {
            let addr = addrArr[i];
            let ref = script.map[table][addr];
            let bytes = (ref.registerSpec.number * ref.registerSpec.size) / 8;
            let startPoint = (ref.registerSpec.size/8)*(addr - addrArr[0]);
            let endPoint = startPoint + bytes;
            let buffVal = Buffer.alloc(bytes, ret.buffer.slice(startPoint, endPoint));
            // buffVal = ret.buffer.slice(startPoint, endPoint);
            
            // console.log(`${this.device.id}[${addr.toString(16)}] => [${startPoint}=>${endPoint}][hex: ${buffVal.toString('hex')}]`);
            let value = script.map[table][addr].translator(buffVal, script.map[table][addr]);
            // console.log(`${this.device.id}[0x${(`0000`+addr.toString(16)).slice(-4)}] => [hex: ${buffVal.toString('hex')} / value: ${typeof value}: ${value}]`);
            // let value = script.map[table][addr].translator(ret.buffer, script.map[table][address]);
            // console.log(`${this.device.id}[${this.id}] => [hex: ${ret.buffer.toString('hex')}] / [${typeof value}: ${value}]`);
            this.metrics.set(`success-call.last`, (new Date()).toString());
            this.metrics.increase(`success-call.count`);
            //console.log(`${this.device.id} : ${this.id} : ${typeof value} : ${value}`);

            this.device.findProperty(this.generatePropertyId(addr)).setCachedValueAndNotify(value);
            // this.setCachedValueAndNotify(value);
          }
        }
      }
      catch(err) {
        console.log(`DefaultProperty: periodWork() >> Error!!!`);
        this.metrics.set(`fail-call.last`, (new Date()).toString());
        this.metrics.increase(`fail-call.count`);
        console.error(err);
      }
      //this.deviceObject.setProperty(this.property.id, value);
      
      resolve();
    });
  }
}

module.exports = BulkReader;