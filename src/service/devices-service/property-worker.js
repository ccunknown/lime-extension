class propertyWorker {
  constructor(options) {
    this.device = options.device;
    this.deviceObject = this.device.object;

    this.deviceId = this.device.schema.config.address;
    this.engine = this.device.engine;
    this.script = this.device.script;

    this.property = options.property;

    //console.log(`propertyWorker.script : ${JSON.stringify(this.script)}`);

    this.init();
  }

  init(engine, prop) {
    console.log(`propertyWorker: init() >> `);
    this.engine = (engine) ? engine : this.engine;
    this.property = (prop) ? prop : this.property;
  }

  start() {
    console.log(`propertyWorker: start() >> `);
    return new Promise((resolve, reject) => {
      this.periodWork();
      resolve();
    });
  }

  stop() {
    console.log(`propertyWorker: stop() >> `);
    return clearTimeout(this.period);
  }

  periodWork() {
    console.log(`propertyWorker: periodWork() >> `);
    return new Promise(async (resolve, reject) => {
      let id = this.deviceId;
      let address = this.property.config.address;
      let table = this.property.config.table;
      //console.log(`script : ${JSON.stringify(this.script, null, 2)}`);
      let ntr = this.script.translator.map[table][address].registerSpec.number;

      //console.log(`engine`);
      //console.log(this.engine);

      let ret = await this.engine.act({
        "action": "read",
        "id": id,
        "address": address,
        "numtoread": ntr,
        "table": table
      });

      console.log(`ret : ${ret.buffer.toString('hex')}`);
      let value = this.script.translator.map[table][address].translator(ret.buffer, this.script.readmap.map[table][address]);
      console.log(`${this.deviceId} : ${this.property.name} : ${typeof value} : ${value}`);
      this.deviceObject.setProperty(this.property.name, value);

      this.period = setTimeout(() => this.periodWork(), this.property.config.period);
      resolve();
    });
  }
}

module.exports = propertyWorker;