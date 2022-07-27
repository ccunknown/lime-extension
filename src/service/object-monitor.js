class ObjectMonitor {
  constructor(service, id) {
    this.om = {
      service,
      id,
      publishPath: `/service/${this.service.id}/monitor/${this.id}`,
      rtcPeerService: service.laborsManager.getService(`rtcpeer-service`).obj,
    };
  }

  static om_onActive() {}

  om_publish(msg) {
    this.om.rtcPeerService.publish(this.om.publishPath, msg);
  }

  static om_onTaskStart() {}

  static om_onTaskEnd() {}
}

module.exports = ObjectMonitor;
