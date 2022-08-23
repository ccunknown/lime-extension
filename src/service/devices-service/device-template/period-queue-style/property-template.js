// const Queue = require(`bull`);
const ObjectTemplate = require(`../../../object-template/object-template`);

class PropertyTemplate extends ObjectTemplate {
  constructor(devicesService, deviceId, propertyId) {
    super(devicesService, `${deviceId}/${propertyId}`);
    this.om.obj.log(`${this.id}`, `Construct template`);
  }
}

module.exports = PropertyTemplate;
