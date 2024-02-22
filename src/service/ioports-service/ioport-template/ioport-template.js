const ObjectMonitor = require(`../../object-template/object-template`);
const IoportOperator = require("./ioport-operator");

class IoportTemplate extends ObjectMonitor {
  constructor(enginesService, id, config) {
    super(enginesService, id, config);

    this.enginesService = enginesService;
    this.id = id;
    this.config = config;

    this.to = new IoportOperator(this);

    this.om.obj.log(`${this.id}`, `Construct template`);
  }
}

module.exports = IoportTemplate;
