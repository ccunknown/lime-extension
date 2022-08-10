/* eslint-disable class-methods-use-this */
const { v1: uuid } = require(`uuid`);
const Path = require(`path`);

class ObjectMonitor {
  constructor(service, id) {
    const { extension } = service;
    this.om = {
      extension,
      service,
      id,
      storageDir: Path.join(
        extension.addonManager.getUserProfile().dataDir,
        extension.manifest.id,
        id
      ),
      publishPath: `/service/${service.id}/monitor/${id}`,
      rtcPeerService: service.laborsManager.getService(`rtcpeer-service`).obj,
    };
    console.log(
      `[${this.constructor.name}]`,
      `storage path:`,
      this.om.storageDir
    );
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
