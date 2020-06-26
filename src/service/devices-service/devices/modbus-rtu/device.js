'use strict'

const Path = require(`path`);
const {Device} = require(`gateway-addon`);

class ModbusDevice extends Device {
  constructor(devicesService, adapter, schema) {
    super(adapter, schema.id);
    /*
    constructor(adapter, id)
      this.adapter = adapter;
      this.id = id;
      this['@context'] = 'https://iot.mozilla.org/schemas';
      this['@type'] = [];
      this.title = '';
      this.description = '';
      this.properties = new Map();
      this.actions = new Map();
      this.events = new Map();
      this.links = [];
      this.baseHref = null;
      this.pinRequired = false;
      this.pinPattern = null;
      this.credentialsRequired = false;
    */
    this.exConf = {
      "devices-service": devicesService,
      "schema": schema
    };
    this.name = schema.name;
    this.type = schema.type;
    this['@type'] = schema['@type'];
    this.description = schema.description;
    //this.init();
  }

  init(schema) {
    console.log(`ModbusDevice: init() >> `);
    return new Promise(async (resolve, reject) => {
      this.schema = (schema) ? schema : this.schema;
      await this.initPropertyTemplate();
      await this.initProperty();
      resolve();
    });
  }

  initPropertyTemplate() {
    console.log(`ModbusDevice: initPropertyTemplate() >> `);
    return new Promise(async (resolve, reject) => {
      this.propertyTemplate = {};
      let propArr = await this.getDirectory(Path.join(__dirname, `property`));
      propArr.forEach((file) => {
        let name = (file.endsWith(`.js`)) ? `${file.substring(0, file.length - 3)}` : `${file}`;
        this.propertyTemplate[name] = require(`./property/${name}`);
      });
      resolve();
    });
  }

  initProperty() {
    console.log(`ModbusDevice: initProperty() >> `);
    return new Promise(async (resolve, reject) => {
      let schema = this.exConf.schema;
      //console.log(this.propertyTemplate);
      for(let i in this.exConf.schema.properties) {
        let propSchema = this.exConf.schema.properties[i];
        //console.log(`propSchema : ${JSON.stringify(propSchema, null ,2)}`);
        //console.log(this.propertyTemplate[propSchema.config.property]);
        let prop = new (this.propertyTemplate[propSchema.config.property])(this, schema.properties[i]);
        await prop.start();
        this.properties.set(propSchema.name, prop);
      }
      resolve();
    });
  }

  getDirectory(path) {
    return new Promise((resolve, reject) => {
      const fs = require(`fs`);
      fs.readdir(path, (err, files) => {
        (err) ? reject(err) : resolve(files);
      });
    });
  }
}

module.exports = ModbusDevice;