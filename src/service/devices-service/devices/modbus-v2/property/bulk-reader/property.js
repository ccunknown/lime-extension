/* eslint-disable no-underscore-dangle */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const PERIOD_WORK_TIMEOUT = 9000;
// const MAXIMUM_MODBUS_READ_AMOUNT = 255;

const AsyncLock = require(`async-lock`);

const ConfigTranslator = require(`./config-translator.js`);
const PropertyUnit = require(`./propertyUnit.js`);
const DefaultConfig = require(`../../defalt-config`);

class BulkReader {
  constructor(device, id, config) {
    this.id = id;
    this.config = config;
    this.device = device;
    this.devicesService = device.exConf[`devices-service`];
    this.timeout = 9000;
    this.meta = {
      type: `period-worker`,
    };
    this.lastPeriodSuccess = false;
    this.periodWorkFlag = false;
    this.continuousFail = 0;
    this.lock = {
      period: {
        key: `period`,
        locker: new AsyncLock({ timeout: this.timeout }),
      },
      periodWork: {
        key: `periodWork`,
        locker: new AsyncLock({
          timeout: this.timeout,
          maxPending: 0,
        }),
      },
    };
    this.properties = {};

    this.Errors = require(`${this.devicesService.getRootDirectory()}/constants/errors.js`);
    this.configTranslator = new ConfigTranslator(this.devicesService);

    const itemMetricsPath = `${this.devicesService.getRootDirectory()}/src/service/item-metrics.js`;
    console.log(`Item Metrics Path: ${itemMetricsPath}`);
    const ItemMetrics = require(itemMetricsPath);
    this.metrics = new ItemMetrics({
      start: null,
      call: {
        count: 0,
        last: null,
      },
      "success-call": {
        count: 0,
        last: null,
      },
      "fail-call": {
        count: 0,
        last: null,
        "last-err-message": ``,
      },
      warning: [
        // {
        //   timestamp: "isoTimeString",
        //   message: "message"
        // }
      ],
    });
  }

  init() {
    return new Promise((resolve, reject) => {
      this.initProperty(this.config)
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  initProperty(bulkConf) {
    console.log(`BulkReaderProperty: initProperty() >> `);
    return new Promise((resolve, reject) => {
      // console.log(`bulkConf: ${JSON.stringify(bulkConf, null, 2)}`)
      const confJson = {};
      bulkConf.address.forEach((addr) => {
        const id = this.generatePropertyId(addr);
        const config = JSON.parse(JSON.stringify(bulkConf));
        const script = this.device.getScript();
        config.title = script.map[config.table][addr].name;
        config.address = addr;
        confJson[id] = config;
      });
      // console.log(`confJson: ${JSON.stringify(confJson, null, 2)}`);
      Object.keys(confJson)
        .reduce((prevProm, id) => {
          return this.addProperty(id, confJson[id]);
        }, Promise.resolve())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  addProperty(id, config) {
    console.log(`BulkReaderProperty: addProperty(${id}) >> `);
    return new Promise((resolve, reject) => {
      const conf = JSON.parse(JSON.stringify(config));
      const fullMap = this.device.getScript();
      conf.address = [conf.address];
      Promise.resolve()
        .then(() => this.configTranslator.translate(conf, fullMap))
        .then((translated) => {
          // console.log(`${id}: ${JSON.stringify(translated, null, 2)}`);
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
      Promise.resolve()
        .then(() => this.metrics.set(`start`, (new Date()).toString()))
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
    const { locker } = this.lock.period;
    const { key } = this.lock.period;
    return new Promise((resolve, reject) => {
      locker.acquire(
        key,
        (done) => {
          if (this.device && !this.period) {
            console.log(`>> setPeriodWork(${this.id}) >> Accept.`);
            Promise.resolve()
              .then(() => this.periodWork())
              .then(() => {
                this.period = setInterval(
                  () => this.periodWork(),
                  this.config.period
                );
              })
              .then(() => done(null))
              .catch((err) => done(err));
          } else {
            console.log(`>> setPeriodWork(${this.id}) >> Deny.`);
            done(null);
          }
        },
        (err) => (err ? reject(err) : resolve())
      );
    });
  }

  clearPeriodWork() {
    console.log(`${this.id}: BulkReaderProperty: clearPeriodWork() >> `);
    const { locker } = this.lock.period;
    const { key } = this.lock.period;
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() =>
          locker.acquire(key, () => {
            clearInterval(this.period);
            this.period = null;
          })
        )
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  periodWork() {
    const { locker } = this.lock.periodWork;
    const { key } = this.lock.periodWork;
    if (this.periodWorkFlag) {
      console.log(
        `${this.id}: BulkReaderProperty: previous period work still working!`
      );
      return Promise.resolve();
    }
    // else {
    return new Promise((resolve, reject) => {
      locker.acquire(
        key,
        (done) => {
          this.periodWorkFlag = true;
          if (this.device && this.devicesService) {
            Promise.resolve()
              .then(() => this._periodWork())
              .then((ret) => done(null, ret))
              .catch((err) => done(err));
          } else {
            this.clearPeriodWork()
              .then(() => done(new this.Errors(`ParentObjectUnavailable`)))
              .catch((err) => done(err));
          }
        },
        (err, ret) => {
          this.periodWorkFlag = false;
          if (err) reject(err);
          else resolve(ret);
          // err ? reject(err) : resolve(ret);
        },
        { maxPending: 1 }
      );
    });
    // }
  }

  generatePropertyId(address) {
    return `${this.id}-${Number(address).toString(16)}`;
  }

  _periodWork() {
    // console.log(`${this.id}: DefaultProperty: _periodWork() >> `);
    return new Promise((resolve, reject) => {
      setTimeout(
        () => reject(new Error(`period work timeout!`)),
        PERIOD_WORK_TIMEOUT
      );

      const engine = this.device.getEngine();
      const script = this.device.getScript();
      // const ip = this.device.exConf.config.hasOwnProperty(`ip`)
      const ip = Object.prototype.hasOwnProperty.call(
        this.device.exConf.config,
        `ip`
      )
        ? this.device.exConf.config.ip
        : undefined;
      // const port = this.device.exConf.config.hasOwnProperty(`port`)
      const port = Object.prototype.hasOwnProperty.call(
        this.device.exConf.config,
        `port`
      )
        ? this.device.exConf.config.port
        : undefined;
      const id = this.device.exConf.config.address;
      const { table } = this.config;
      const chunkSize = this.config.size;

      this.metrics.set(`call.last`, new Date().toString());
      this.metrics.increase(`call.count`);

      const tmpAddrArr = [...this.config.address];
      tmpAddrArr.sort((a, b) => a - b);
      const queryTask = [];
      // let firstAddr = null;
      while (tmpAddrArr.length) {
        const arr = [];
        arr.push(tmpAddrArr.shift());
        while (tmpAddrArr.length) {
          if (
            tmpAddrArr[0] +
              script.map[table][tmpAddrArr[0]].registerSpec.number -
              arr[0] <=
            chunkSize
          )
            arr.push(tmpAddrArr.shift());
          else break;
        }
        const opt = {
          action: `read`,
          id,
          address: arr[0],
          table,
          numtoread:
            arr[arr.length - 1] -
            arr[0] +
            script.map[table][arr[arr.length - 1]].registerSpec.number,
        };
        if (ip && port) {
          opt.ip = ip;
          opt.port = port;
        }
        queryTask.push(opt);
      }

      if (script && engine && engine.getState() === `running`) {
        queryTask
          .reduce((prevProm, opt) => {
            return prevProm
              .then(() => engine.act(opt))
              .then((ret) => {
                // console.log(`[${this.constructor.name}]`, `raw:`, ret);
                // console.log(`[${this.constructor.name}]`, `opt: ${opt.action} [id: ${opt.id}] [${opt.table}: ${opt.address}] -> ${opt.numtoread} word`);
                // console.log(`[${this.constructor.name}]`, `raw result: 0x${ret.buffer.toString(`hex`)}`);
                const arr = [...this.config.address]
                  .filter(
                    (e) => e >= opt.address && e < opt.address + opt.numtoread
                  )
                  .sort((a, b) => a - b);
                arr.forEach((addr) => {
                  const ref = script.map[table][addr];
                  const bytes =
                    (ref.registerSpec.number * ref.registerSpec.size) / 8;
                  const startPoint =
                    (ref.registerSpec.size / 8) * (addr - arr[0]);
                  const endPoint = startPoint + bytes;
                  // let buffVal = Buffer.alloc(bytes, ret.buffer.slice(startPoint, endPoint));
                  // let buffVal = Buffer.alloc(bytes, ret.slice(startPoint, endPoint));
                  const buffVal = Buffer.from(ret.slice(startPoint, endPoint));

                  const value = script.map[table][addr].translator(
                    buffVal,
                    script.map[table][addr]
                  );

                  console.log(
                    `[${this.constructor.name}]`,
                    `[${addr}/${addr.toString(16)}] ${ref.name}:`,
                    ` ${buffVal.toString(`hex`)} => ${value}`
                  );
                  this.device
                    .findProperty(this.generatePropertyId(addr))
                    .setCachedValueAndNotify(value);
                });
                // return;
              });
          }, Promise.resolve())
          .then(() => this.onPeriodSuccess())
          .then(() => resolve())
          .catch((err) => {
            console.log(`BulkReaderProperty: periodWork() >> Error!!!`);
            this.onPeriodFail(err);
            reject(err);
          });
      } else if (engine == null) {
        //
      }
    });
  }

  onPeriodSuccess() {
    // console.log(`[${this.constructor.name}]`, `onPeriodSuccess(id: ${this.id})`);
    const lastContinuousFail = this.continuousFail;
    const timestamp = new Date().toString();
    this.metrics.set(`success-call.last`, timestamp);
    this.metrics.increase(`success-call.count`);
    this.lastPeriodSuccess = true;
    this.continuousFail = 0;
    if (lastContinuousFail >= DefaultConfig.property.continuousFail.max)
      this.device.getState();
  }

  onPeriodFail(err) {
    console.log(`[${this.constructor.name}]`, `onPeriodFail(id: ${this.id})`);
    const timestamp = new Date().toString();
    this.metrics.set(`fail-call.last`, timestamp);
    this.metrics.increase(`fail-call.count`);
    this.metrics.set(`last-err-message`, err.toString());
    this.lastPeriodSuccess = false;
    this.continuousFail += 1;
    if (this.continuousFail === DefaultConfig.property.continuousFail.max)
      this.device.getState();
  }
}

module.exports = BulkReader;
