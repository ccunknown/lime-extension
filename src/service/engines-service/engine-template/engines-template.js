const ObjectMonitor = require(`../../object-template/object-template`);

class EngineTemplate extends ObjectMonitor {
  constructor(enginesService, config) {
    super(enginesService, config.id);
    this.id = config.id;
    this.om.obj.log(`${this.id}`, `Construct template`);
  }
}

module.exports = EngineTemplate;
