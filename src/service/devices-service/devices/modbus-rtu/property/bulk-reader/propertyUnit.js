'use strict'

const {Property} = require('gateway-addon');

const ConfigTranslator = require(`./config-translator.js`);

const DESCR_FIELDS = [
  'title',
  'type',
  '@type',
  'unit',
  'description',
  'minimum',
  'maximum',
  'enum',
  'readOnly',
  'multipleOf',
  'links',
];

class PropertyUnit extends Property {
  constructor(device, master, name, schema) {
    super(device, name, schema);
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

  // start() {
  //   return this.master.start();
  // }

  // stop() {
  //   return this.master.stop();
  // }

  // isRunning() {
  //   return this.master.period && true;
  // }
}

module.exports = PropertyUnit;