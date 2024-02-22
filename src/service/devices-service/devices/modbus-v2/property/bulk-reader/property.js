/* eslint-disable no-underscore-dangle */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const PERIOD_WORK_TIMEOUT = 9000;
// const MAXIMUM_MODBUS_READ_AMOUNT = 255;

// const AsyncLock = require(`async-lock`);
const PropertyTemplate = require(`../../../../device-template/period-queue-style/property-template.js`);

const ConfigTranslator = require(`./config-translator.js`);
const PropertyUnit = require(`./propertyUnit.js`);
const { ObjectState } = require(`../../../../../object-template/object-state`);
// const DefaultConfig = require(`../../defalt-config`);

class BulkReader extends PropertyTemplate {
  constructor(device, id, config) {
    super(device.devicesService, device.id, id);
    this.id = id;
    this.config = config;
    this.device = device;
    this.devicesService = device.devicesService;
    this.timeout = 9000;
    this.meta = {
      type: `period-worker`,
    };
    this.lastPeriodSuccess = false;
    this.periodWorkFlag = false;
    this.continuousFail = 0;

    this.queryTemplate = null;
    this.properties = {};

    this.Errors = require(`${this.devicesService.getRootDirectory()}/constants/errors.js`);
    this.configTranslator = new ConfigTranslator(this.devicesService);

    // const itemMetricsPath = `${this.devicesService.getRootDirectory()}/src/service/item-metrics.js`;
    // console.log(`Item Metrics Path: ${itemMetricsPath}`);
    // const ItemMetrics = require(itemMetricsPath);
    // this.metrics = new ItemMetrics({});
  }

  init() {
    return new Promise((resolve, reject) => {
      this.initProperty(this.config)
        .then((wtPropMap) => resolve(wtPropMap))
        .catch((err) => reject(err));
    });
  }

  initProperty(bulkConf) {
    console.log(`[${this.constructor.name}]`, `initProperty() >> `);
    return new Promise((resolve, reject) => {
      // console.log(`bulkConf: ${JSON.stringify(bulkConf, null, 2)}`)
      const confJson = {};
      const propUnits = new Map();
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
          return prevProm
            .then(() => this.addUnitProperty(id, confJson[id]))
            .then((propUnit) => {
              if (propUnit) propUnits.set(id, propUnit);
            });
        }, Promise.resolve())
        .then(() => resolve(propUnits))
        .catch((err) => reject(err));
    });
  }

  addUnitProperty(id, config) {
    console.log(`[${this.constructor.name}]`, `addUnitProperty(${id}) >> `);
    return new Promise((resolve, reject) => {
      const conf = JSON.parse(JSON.stringify(config));
      const fullMap = this.device.getScript();
      conf.address = [conf.address];
      Promise.resolve()
        .then(() => this.configTranslator.translate(conf, fullMap))
        .then((translated) => {
          // console.log(`${id}: ${JSON.stringify(translated, null, 2)}`);
          return new PropertyUnit(this, id, translated);
        })
        // .then((prop) => this.device.to.wtDevice.properties.set(id, prop))
        .then((prop) => this.device.to.wtDevice.addProperty(prop))
        .then((propUnit) => resolve(propUnit))
        .catch((err) => reject(err));
    });
  }

  start() {
    console.log(`[${this.constructor.name}]`, `start() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => !this.isRunning() && this.buildQueryTemplate())
        .then(() => !this.isRunning() && this.setPeriodWork())
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  }

  stop() {
    console.log(`[${this.constructor.name}]`, `stop() >> `);
    return this.clearPeriodWork();
  }

  isRunning() {
    return !!this.period;
  }

  getState() {
    return this.oo.getState();
  }

  setState(state) {
    return this.oo.setState(state);
  }

  setPeriodWork() {
    console.log(`[${this.constructor.name}]`, `setPeriodWork() >> `);
    return new Promise((resolve, reject) => {
      if (this.device.to.wtDevice && !this.period) {
        console.log(`>> setPeriodWork(${this.id}) >> Accept.`);
        Promise.resolve()
          .then(() => this.act())
          .then(() => {
            this.period = setInterval(() => this.act(), this.config.period);
          })
          // .then(() => this.oo.setState(ObjectState.RUNNING))
          .then(() => resolve(null))
          .catch((err) => reject(err));
      } else if (!this.device.to.wtDevice) {
        console.log(`>> setPeriodWork(${this.id}) >> Deny.`);
        reject(new Error(`Device ${this.device.to.wtDevice.id} unavailable!`));
      } else if (this.period) {
        reject(new Error(`Period already set at ${this.period}`));
      }
    });
  }

  clearPeriodWork() {
    console.log(`${this.id}: BulkReaderProperty: clearPeriodWork() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => {
          clearInterval(this.period);
          this.period = null;
        })
        // .then(() => this.oo.setState(ObjectState.STOPPED))
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  generatePropertyId(address) {
    return `${this.id}-${Number(address).toString(16)}`;
  }

  // eslint-disable-next-line no-unused-vars
  processor(jobId, cmd) {
    return new Promise((resolve, reject) => {
      setTimeout(
        () => reject(new Error(`period work timeout!`)),
        PERIOD_WORK_TIMEOUT
      );

      Promise.resolve()
        .then(() =>
          Promise.all([this.device.getEngine(), this.device.getScript()])
        )
        .then(([engine, script]) => {
          if (!engine)
            throw new Error(
              `Engine "${this.device.config.engine}" unavailable`
            );
          if (!script)
            throw new Error(
              `Script "${this.device.config.engine}" unavailable`
            );
          return this.queryTemplate.reduce((prevProm, opt) => {
            return prevProm.then(() => this.chunkProcess(jobId, opt, engine));
          }, Promise.resolve());
        })
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  buildQueryTemplate() {
    this.om.obj.log(`building query template.`);
    const script = this.device.getScript();
    const ip = Object.prototype.hasOwnProperty.call(this.device.config, `ip`)
      ? this.device.config.ip
      : undefined;
    const port = Object.prototype.hasOwnProperty.call(
      this.device.config,
      `port`
    )
      ? this.device.config.port
      : undefined;
    const id = this.device.config.address;
    const { table } = this.config;
    const chunkSize = this.config.size;

    const tmpAddrArr = [...this.config.address];
    tmpAddrArr.sort((a, b) => a - b);
    this.queryTemplate = [];
    while (tmpAddrArr.length) {
      const opt = {
        calculate: [],
        engineOpt: {
          action: `read`,
          id,
          table,
          address: 0,
          numtoread: 0,
        },
      };
      const addrArr = [];
      let numtoread = 0;

      do {
        const addr = tmpAddrArr.shift();
        addrArr.push(addr);
        opt.calculate.push({
          registerAddress: addr,
          ...script.map[table][addr],
        });
        numtoread =
          addrArr[addrArr.length - 1] +
          script.map[table][addrArr[addrArr.length - 1]].registerSpec.number -
          addrArr[0];
        if (tmpAddrArr.length) {
          const nextAddr = tmpAddrArr[0];
          const nexttoread = script.map[table][nextAddr].registerSpec.number;
          if (nextAddr + nexttoread - addrArr[0] > chunkSize) break;
        }
      } while (tmpAddrArr.length);

      // opt.engineOpt.numtoread =
      //   addrArr[addrArr.length - 1] + numtoread - addrArr[0];
      opt.engineOpt.numtoread = numtoread;
      [opt.engineOpt.address] = addrArr;
      if (ip && port) {
        opt.engineOpt.ip = ip;
        opt.engineOpt.port = port;
      }
      this.queryTemplate.push(opt);
    }
    // console.log(`queryTemplate:`, this.queryTemplate);
    this.om.obj.log(
      `Query template built, got ${
        Object.keys(this.queryTemplate).length
      } chunk.`
    );
    this.queryTemplate.forEach((e) => {
      this.om.obj.log(
        `chunk: <${e.engineOpt.address} -> ${e.engineOpt.numtoread}>`
      );
    });
  }

  // Modbus chunk read & process.
  chunkProcess(jobId, opt, engine) {
    return new Promise((resolve, reject) => {
      // console.log(`engine delay:`, engine.config.delay);
      Promise.resolve()
        // .then(() => engine.act(opt.engineOpt, jobId))
        .then(() => engine.act(opt.engineOpt))
        .then((raw) => {
          opt.calculate.forEach((e) => {
            const addressOffset = opt.engineOpt.address;
            const bits = e.registerSpec.number * e.registerSpec.size;
            const bytes = bits / 8;
            if (bits % 8 === 0) {
              const startPoint =
                (e.registerSpec.size / 8) * (e.registerAddress - addressOffset);
              const endPoint = startPoint + bytes;
              const buffVal = Buffer.from(raw.slice(startPoint, endPoint));
              const value = e.translator(buffVal, e);

              const addrStr = e.registerAddress.toString(16);
              const addrStrLen =
                addrStr.length % 2 === 0 ? addrStr.length : addrStr.length + 1;
              this.om.task.log(
                jobId,
                `result`,
                `<addr:0x${addrStr.padStart(addrStrLen, `0`)}>`,
                `<raw:0x${buffVal.toString(`hex`)}>`,
                `<${e.name}:${value}>`
              );

              this.device.to.wtDevice
                .findProperty(this.generatePropertyId(e.registerAddress))
                .setCachedValueAndNotify(value);
            } else {
              throw new Error(`Coil reading currently not support.`);
            }
          });
        })
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  // commandToString(cmd) {}

  // resultToString(res) {}
}

module.exports = BulkReader;
