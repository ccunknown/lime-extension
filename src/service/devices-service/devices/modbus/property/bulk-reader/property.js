'use strict'
const PERIOD_WORK_TIMEOUT = 9000;

const AsyncLock = require('async-lock');

const ConfigTranslator = require(`./config-translator.js`);
const PropertyUnit = require(`./propertyUnit.js`);

class BulkReader {
  constructor(device, id, config) {
    this.id = id;
    this.config = config;
    this.device = device;
    this.devicesService = device.exConf[`devices-service`];
    this.timeout = 9000;
    this.periodWorkFlag = false;
    this.lock = {
      "period": {
        "key": `period`,
        "locker": new AsyncLock({"timeout": this.timeout})
      },
      "periodWork": {
        "key": `periodWork`,
        "locker": new AsyncLock({
          "timeout": this.timeout, 
          "maxPending": 0
        })
      }
    };
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
    console.log(`BulkReaderProperty: initProperty() >> `);
    return new Promise((resolve, reject) => {
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
      Object.keys(confJson).reduce((prevProm, id) => {
        return this.addProperty(id, confJson[id]);
      }, Promise.resolve())
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  addProperty(id, config) {
    console.log(`BulkReaderProperty: addProperty(${id}) >> `);
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
    console.log(`${this.id}: BulkReaderProperty: start() >> `);
    return new Promise((resolve, reject) => {
      this.metrics.set(`start`, (new Date()).toString())
      .then(() => this.setPeriodWork())
      .then((res) => resolve(res))
      .catch((err) => reject(err));
    });
  }

  stop() {
    console.log(`${this.id}: BulkReaderProperty: stop() >> `);
    return this.clearPeriodWork();
  }

  setPeriodWork() {
    console.log(`${this.id}: BulkReaderProperty: setPeriodWork() >> `);
    let locker = this.lock.period.locker;
    let key = this.lock.period.key;
    return new Promise((resolve, reject) => {
      locker.acquire(key, (done) => {
        if(this.device && !this.period) {
          console.log(`>> setPeriodWork(${this.id}) >> Accept.`);
          this.periodWork()
          .then(() => this.period = setInterval(() => this.periodWork(), this.config.period))
          .then(() => done(null))
          .catch((err) => done(err));
        }
        else {
          console.log(`>> setPeriodWork(${this.id}) >> Deny.`);
          done(null);
        }
      },
      (err) => (err) ? reject(err) : resolve());
    });
  }

  clearPeriodWork() {
    console.log(`${this.id}: BulkReaderProperty: clearPeriodWork() >> `);
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
    if(this.periodWorkFlag){
      console.log(`${this.id}: BulkReaderProperty: previous period work still working!`);
      return Promise.resolve();
    }
    else {
      return new Promise((resolve, reject) => {
        locker.acquire(
          key, 
          (done) => {
            this.periodWorkFlag = true;
            if(this.device && this.devicesService) {
              this._periodWork()
              .then((ret) => done(null, ret))
              .catch((err) => done(err));
            }
            else {
              this.clearPeriodWork()
              .then(() => done(new this.Errors(ParentObjectUnavailable)))
              .catch((err) => done(err));
            }
          },
          (err, ret) => {
            this.periodWorkFlag = false;
            (err) ? reject(err) : resolve(ret)
          },
          {maxPending: 1}
        );
      });
    }
  }

  generatePropertyId(address) {
    return `${this.id}-${Number(address).toString(16)}`;
  }

  _periodWork() {
    // console.log(`${this.id}: DefaultProperty: _periodWork() >> `);
    return new Promise(async (resolve, reject) => {

      setTimeout(() => reject(new Error(`period work timeout!`)), PERIOD_WORK_TIMEOUT);

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

        engine.act(opt)
        .then((ret) => {
          addrArr.forEach((addr) => {
            let ref = script.map[table][addr];
            let bytes = (ref.registerSpec.number * ref.registerSpec.size) / 8;
            let startPoint = (ref.registerSpec.size/8)*(addr - addrArr[0]);
            let endPoint = startPoint + bytes;
            let buffVal = Buffer.alloc(bytes, ret.buffer.slice(startPoint, endPoint));

            let value = script.map[table][addr].translator(buffVal, script.map[table][addr]);

            this.metrics.set(`success-call.last`, (new Date()).toString());
            this.metrics.increase(`success-call.count`);

            this.device.findProperty(this.generatePropertyId(addr)).setCachedValueAndNotify(value);
          });
        })
        .then(() => resolve())
        .catch((err) => {
          console.log(`BulkReaderProperty: periodWork() >> Error!!!`);
          this.metrics.set(`fail-call.last`, (new Date()).toString());
          this.metrics.increase(`fail-call.count`);
          reject(err);
        });
      }
      else {
        resolve();
      }
      
    });
  }
}

module.exports = BulkReader;