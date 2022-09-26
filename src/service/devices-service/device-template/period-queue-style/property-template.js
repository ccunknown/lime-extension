const ObjectTemplate = require(`../../../object-template/object-template`);

class PropertyTemplate extends ObjectTemplate {
  constructor(devicesService, deviceId, propertyId) {
    const id = `${deviceId}/${propertyId}`;
    super(devicesService, id);
    this.id = id;
    this.om.obj.log(`${this.id}`, `Construct template`);
  }
}

module.exports = PropertyTemplate;
