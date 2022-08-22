/* eslint-disable class-methods-use-this */
const ObjectMonitorSubclass = require("./object-monitor-subclass");

class ObjectMonitor {
  constructor(service, id) {
    this.om = new ObjectMonitorSubclass(service, id);
    this.om.obj.log(`${service.id}:${id}`, `Construct object-monitor`);
  }
}

module.exports = ObjectMonitor;
