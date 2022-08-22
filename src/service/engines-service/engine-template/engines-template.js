/* eslint-disable no-underscore-dangle */
const Queue = require(`bull`);
const ObjectMonitor = require(`../../object-monitor/object-monitor`);

class EngineTemplate extends ObjectMonitor {
  constructor(enginesService, config) {
    super(enginesService, config.id);
    this.id = config.id;
    // const { extension } = enginesService;
    this.et = {
      // extension,
      enginesService,
      config,
      queue: new Queue(`engineQueue-${config.id}`),
      state: `unload`,
      // state: {
      //   enable: config._config.addToService,
      //   running: `stopped`,
      //   detail: null,
      // },
    };

    this.et_initProcessor();
    this.om.obj.log(`${this.id}`, `Construct engine-template`);
  }

  getState() {
    return this.et.state;
  }

  setState(state) {
    this.et.state = state;
    this.om.obj.state(state);
  }

  et_enable() {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.om.obj.log(`enabling`))
        .then(() =>
          this.configManager.updateConfig(
            { addToService: true },
            `service-config.${this.et.enginesService.id}.list.${this.id}._config`
          )
        )
        .then(() => ![`running`].includes(this.getState()) && this.et_start())
        .then(() => this.setState(`enabled`))
        .then(() => resolve())
        .catch((err) => {
          reject(err);
        });
    });
  }

  et_disable() {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.om.obj.log(`disabling`))
        .then(() =>
          this.configManager.updateConfig(
            { addToService: false },
            `service-config.${this.et.enginesService.id}.list.${this.id}._config`
          )
        )
        .then(
          () =>
            ![`stop`, `disabled`].includes(this.getState()) && this.et_stop()
        )
        .then(() => this.setState(`disabled`))
        .then(() => resolve())
        .catch((err) => {
          reject(err);
        });
    });
  }

  et_start() {
    console.log(`[${this.constructor.name}]`, `et_start() >> `);
    return new Promise((resolve) => {
      try {
        Promise.resolve()
          .then(() => this.om.obj.log(`${this.id} starting`))
          .then(() => this.start())
          .then(() => this.setState(`running`))
          .then((ret) => resolve(ret));
      } catch (err) {
        this.setState(`error`);
        this.om.error(err);
        this.et_restart();
        resolve();
      }
    });
  }

  et_stop() {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.om.obj.log(`${this.id} stopping.`))
        .then(() => this.stop())
        .then(() => this.setState(`stopped`))
        .then(() => resolve())
        .catch((err) => {
          this.setState(`error`);
          this.om.error(err);
          reject(err);
        });
    });
  }

  et_restart() {
    return new Promise((resolve) => {
      Promise.resolve()
        .then(() => this.setState(`restarting`))
        .then(() => this.stop())
        .then(() => this.start())
        .then(() => resolve())
        .catch((err) => {
          this.om.error(err);
          setTimeout(() => this.restart(), 5000);
        });
    });
  }

  act(cmd) {
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
          resolve({ error: err });
        });
    });
  }

  et_initProcessor() {
    this.et.queue.process(`act`, (job, done) => {
      Promise.resolve()
        .then(() => this.om.task.start(job.data.jobId))
        .then(() => this.et_processor(job.data.jobId, job.data.cmd))
        .then((ret) => done(null, ret))
        .catch((err) => {
          this.om.task.error(job.data.jobId, err);
          done(err);
        });
    });
  }

  et_processor(jobId, cmd) {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.processor(jobId, cmd))
        .then((ret) => {
          return ret;
        })
        .then((ret) => resolve(ret))
        .catch((err) => reject(err));
    });
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
