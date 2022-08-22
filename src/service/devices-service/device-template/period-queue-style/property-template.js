const Queue = require(`bull`);
const ObjectMonitor = require(`../../object-monitor/object-monitor`);

class PropertyTemplate extends ObjectMonitor {
  constructor(devicesService, deviceId, propertyId) {
    super(devicesService, `${deviceId}/${propertyId}`);
    const id = `${deviceId}:${propertyId}`;
    this.pt = {
      devicesService,
      id,
      deviceId,
      propertyId,
      queue: new Queue(`propertyQueue-${id}`),
      state: `unload`,
    };
  }
}

module.exports = PropertyTemplate;
