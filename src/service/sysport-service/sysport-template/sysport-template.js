const ObjectMonitor = require(`../../object-template/object-template`);
const SysportOperator = require("./sysport-operator");

class SysportTemplate extends ObjectMonitor {
  constructor(enginesService, id, config) {
    super(enginesService, id, config);

    this.enginesService = enginesService;
    this.id = config.id;
    this.config = config;

    this.to = new SysportOperator(this);

    this.om.obj.log(`${this.id}`, `Construct template`);
  }
}

module.exports = SysportTemplate;
