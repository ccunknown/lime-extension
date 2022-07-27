// const Queue = require(`bull`);
const ObjectMonitor = require(`../object-monitor`);

class EngineTemplate extends ObjectMonitor {
  constructor(enginesService, config) {
    super(enginesService, config.id);
    this.et = {
      enginesService,
      config,
    };
    // this.state = new Proxy(this._state, );
  }

  changeState(state) {
    this.state = state;
  }

  act(cmd) {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then((ret) => resolve({ cmd, ret }))
        .catch((err) => reject(err))
        .finally(() => {});
    });
  }

  et_processor(cmd) {
    return new Promise((resolve, reject) => {
      let taskId;
      Promise.resolve()
        .then(() => {
          taskId = this.om_onTaskStart(cmd);
        })
        .then(() => this.processor())
        .then((ret) => resolve(ret))
        .catch((err) => reject(err))
        .finally(() => this.om_onTaskEnd(taskId));
    });
  }

  processor() {}
}

module.exports = EngineTemplate;
