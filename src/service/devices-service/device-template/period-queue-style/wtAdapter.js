/* eslint-disable global-require */
const { Adapter } = require(`gateway-addon`);

class vAdapter extends Adapter {
  constructor(addonManager, packageId, packageName, devicesService) {
    super(addonManager, packageId, packageName);
    addonManager.addAdapter(this);
    const events = require(`events`);
    this.devicesService = devicesService;
    this.extEventEmitter = new events.EventEmitter();
  }

  removeDevice(deviceId) {
    console.log(`[${this.constructor.name}]`, `removeDevice(${deviceId}) >> `);
    return new Promise((resolve, reject) => {
      const device = this.devices[deviceId];
      if (device) {
        this.handleDeviceRemoved(device);
        resolve(device);
      } else {
        reject(new Error(`Device: ${deviceId} not found.`));
      }
    });
  }

  // startPairing(_timeoutSeconds) {
  startPairing() {
    console.log("ExampleAdapter:", this.name, "id", this.id, "pairing started");
  }

  cancelPairing() {
    console.log(
      "ExampleAdapter:",
      this.name,
      "id",
      this.id,
      "pairing cancelled"
    );
  }

  removeThing(device) {
    console.log(
      "ExampleAdapter:",
      this.name,
      "id",
      this.id,
      "removeThing(",
      device.id,
      ") started"
    );

    this.extEventEmitter.emit(`remove`, device.id);

    Promise.resolve()
      .then(() => this.removeDevice(device.id))
      .then(() =>
        console.log(">> ExampleAdapter: device:", device.id, "was unpaired.")
      )
      .catch((err) => {
        console.error(">> ExampleAdapter: unpairing", device.id, "failed");
        console.error(err);
      });
  }

  cancelRemoveThing(device) {
    console.log(
      ">> ExampleAdapter:",
      this.name,
      "id",
      this.id,
      "cancelRemoveThing(",
      device.id,
      ")"
    );
  }

  unload() {
    console.log(`[${this.constructor.name}]`, `unload() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.devicesService.stop())
        .then(() => console.log(`>> devices-service stopped.`))
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }
}

module.exports = vAdapter;
