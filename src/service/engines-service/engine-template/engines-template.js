const Queue = require(`bull`);
const ObjectMonitor = require(`../../object-monitor`);

class EngineTemplate extends ObjectMonitor {
  constructor(enginesService, config) {
    super(enginesService, config.id);
    this.et = {
      enginesService,
      config,
      queue: new Queue(`engineQueue-${config.id}`),
      state: `unload`,
    };

    this.et_initProcessor();
  }

  // changeState(state) {
  //   this.et.state = state;
  // }

  getState() {
    return this.et.state;
  }

  setState(state) {
    this.et.state = state;
    this.emit(this.et.state);
  }

  act(cmd) {
    console.log(
      `[${this.constructor.name}]`,
      `act(${JSON.stringify(cmd, null, 2)}) >>`
    );
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.et.queue.add(`act`, cmd))
        .then((job) => job.finished())
        .then((ret) => resolve(ret))
        .catch((err) => reject(err))
        .finally(() => {});
    });
  }

  et_initProcessor() {
    console.log(`[${this.constructor.name}]`, `et_initProcessor() >> `);
    this.et.queue.process(`act`, (job, done) => {
      Promise.resolve()
        .then(() => this.et_processor(job.data))
        .then((ret) => done(null, ret))
        .catch((err) => done(err));
    });
  }

  et_processor(cmd) {
    console.log(
      `[${this.constructor.name}]`,
      `et_processor(${JSON.stringify(cmd, null, 2)}) >> `
    );
    return new Promise((resolve, reject) => {
      let taskId;
      Promise.resolve()
        .then(() => {
          taskId = this.om_onTaskStart(cmd);
        })
        .then(() => this.processor(cmd))
        // .then((ret) => {
        //   console.log(
        //     `[${this.constructor.name}]`,
        //     `ret:`,
        //     JSON.stringify(ret, null, 2)
        //   );
        //   return ret;
        // })
        .then((ret) => resolve(ret))
        .catch((err) => reject(err))
        .finally(() => this.om_onTaskEnd(taskId));
    });
  }

  // processor() {}
}

module.exports = EngineTemplate;
