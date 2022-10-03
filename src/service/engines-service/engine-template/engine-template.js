const ObjectMonitor = require(`../../object-template/object-template`);
const EngineOperator = require("./engine-operator");

class EngineTemplate extends ObjectMonitor {
  constructor(enginesService, id, config) {
    console.log(`[EngineTemplate]`, enginesService.constructor.name, id);
    super(enginesService, id);
    this.id = id;
    this.config = config;

    this.to = new EngineOperator(this);

    this.om.obj.log(`${this.id}`, `Construct template`);
  }
}

module.exports = EngineTemplate;
