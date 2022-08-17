/* eslint-disable class-methods-use-this */
const ObjectMonitorSubclass = require("./object-monitor-subclass");

class ObjectMonitor {
  constructor(service, id) {
    this.om = new ObjectMonitorSubclass(service, id);
    this.om.task.log(
      `${service.id}:${id}`,
      `New object start ${new Date().toISOString()}`
    );
  }
}

module.exports = ObjectMonitor;
