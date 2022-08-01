/* eslint-disable class-methods-use-this */
const { v1: uuid } = require(`uuid`);

class ObjectMonitor {
  constructor(service, id) {
    this.om = {
      service,
      id,
      publishPath: `/service/${service.id}/monitor/${id}`,
      rtcPeerService: service.laborsManager.getService(`rtcpeer-service`).obj,
    };
  }

  om_onActive() {}

  om_publish(msg) {
    this.om.rtcPeerService.publish(this.om.publishPath, msg);
  }

  om_onTaskStart() {
    const id = uuid();
    const timestamp = new Date();
    console.log(
      `[${this.constructor.name}]`,
      `om_onTaskStart() >> ${id}: ${timestamp.toISOString()}`
    );
    return id;
  }

  om_onTaskEnd(id) {
    const timestamp = new Date();
    console.log(
      `[${this.constructor.name}]`,
      `om_onTaskEnd() >> ${id}: ${timestamp.toISOString()}`
    );
  }
}

module.exports = ObjectMonitor;
