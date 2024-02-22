// eslint-disable-next-line import/no-extraneous-dependencies
const { Property } = require(`gateway-addon`);

// const DESCR_FIELDS = [
//   'title',
//   'type',
//   '@type',
//   'unit',
//   'description',
//   'minimum',
//   'maximum',
//   'enum',
//   'readOnly',
//   'multipleOf',
//   'links',
// ];

class PropertyUnit extends Property {
  constructor(master, name, schema) {
    super(master.device.to.wtDevice, name, schema);
    /*
    constructor(device, name, propertyDescr) {
      this.device = device;
      this.name = name;
      this.visible = true;
      this.fireAndForget = false;
      this.visible = propertyDescr.visible;
    */
    this.master = master;
    this.setCachedValue(schema.value);
  }

  //  Remove console.log for reduce numbers of log printout.
  setCachedValueAndNotify(value) {
    const oldValue = this.value;
    this.setCachedValue(value);

    // setCachedValue may change the value, therefore we have to check
    // this.value after the call to setCachedValue
    const hasChanged = oldValue !== this.value;

    if (hasChanged) {
      this.device.notifyPropertyChanged(this);
    }

    return hasChanged;
  }
}

module.exports = PropertyUnit;
