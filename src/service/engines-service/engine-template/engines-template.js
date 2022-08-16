const Queue = require(`bull`);
const ObjectMonitor = require(`../../object-monitor/object-monitor`);

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
    // console.log(
    //   `[${this.constructor.name}]`,
    //   `act(${JSON.stringify(cmd, null, 2)}) >>`
    // );
    return new Promise((resolve) => {
      let jobId;
      Promise.resolve()
        .then(() => {
          jobId = this.om.task.add(jobId, this.commandToString(cmd), {
            jobId,
            removeOnComplete: 256,
            removeOnFail: 256,
          });
        })
        .then(() => this.et.queue.add(`act`, { jobId, cmd }))
        .then((job) => job.finished())
        .then((ret) => {
          this.om.task.end(jobId, this.resultToString(ret));
          resolve(ret);
        })
        .catch((err) => {
          // this.om.task.error(jobId, err);
          // reject(err);
          resolve({ error: err });
        });
    });
  }

  et_initProcessor() {
    console.log(`[${this.constructor.name}]`, `et_initProcessor() >> `);
    this.et.queue.process(`act`, (job, done) => {
      Promise.resolve()
        .then(() => this.om.task.start(job.data.jobId))
        .then(() => this.et_processor(job.data.cmd))
        .then((ret) => done(null, ret))
        .catch((err) => {
          this.om.task.error(job.data.jobId, err);
          done(err);
        });
    });
  }

  et_processor(cmd) {
    // console.log(
    //   `[${this.constructor.name}]`,
    //   `et_processor(${JSON.stringify(cmd, null, 2)}) >> `
    // );
    return new Promise((resolve, reject) => {
      Promise.resolve()
        // .then(() => {
        //   taskId = this.om_onTaskStart(cmd);
        // })
        .then(() => this.processor(cmd))
        .then((ret) => {
          // const type = this.et_typeOf(ret);
          // console.log(
          //   `[${this.constructor.name}]`,
          //   `ret:`,
          //   `[${this.et_typeOf(ret)}]`
          // );

          return ret;
        })
        .then((ret) => resolve(ret))
        .catch((err) => reject(err));
      // .finally(() => this.om_onTaskEnd(taskId));
    });
  }

  // eslint-disable-next-line class-methods-use-this
  et_typeOf(v) {
    if (typeof v === `object` && Array.isArray(v))
      return `array[${v.length ? typeof v[0] : ``}]`;
    return typeof v;
  }

  // eslint-disable-next-line class-methods-use-this
  commandToString(cmd) {
    try {
      return JSON.stringify(cmd);
    } catch (err) {
      return `error cmd translate`;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  resultToString(result) {
    try {
      return JSON.stringify(result);
    } catch (err) {
      return `error result translate`;
    }
  }
}

module.exports = EngineTemplate;
