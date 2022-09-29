const ObjectTemplate = require(`../../../object-template/object-template`);
const DeviceOperator = require(`./device-operator`);

class DeviceTemplate extends ObjectTemplate {
  constructor(devicesService, deviceId, deviceConfig) {
    super(devicesService, `${deviceId}`);

    this.id = deviceId;
    this.devicesService = devicesService;
    this.config = deviceConfig;

    this.to = new DeviceOperator(this);
    this.om.obj.log(`${this.id}`, `Construct device template`);
  }
}

module.exports = DeviceTemplate;
