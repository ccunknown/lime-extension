const Queue = require(`bull`);

class ObjectOperator {
  constructor(parent, parentService, id) {
    this.parent = parent;
    this.id = id;
    this.parentService = parentService;
    this.state = `unload`;
    this.queue = new Queue(`${this.parentService.id}-${this.id}`);

    this.objMon = this.parent.om.obj;
    this.taskMon = this.parent.om.task;

    this.initProcessor();
  }

  getState() {
    return this.state;
  }

  setState(state) {
    this.state = state;
    this.objMon.state(state);
  }

  enable() {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.objMon.log(`enabling`))
        .then(() =>
          this.configManager.updateConfig(
            { addToService: true },
            `service-config.${this.parentService.id}.list.${this.id}._config`
          )
        )
        .then(() => ![`running`].includes(this.getState()) && this.start())
        .then(() => this.setState(`enabled`))
        .then(() => resolve())
        .catch((err) => {
          reject(err);
        });
    });
  }

  disable() {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.objMon.log(`disabling`))
        .then(() =>
          this.configManager.updateConfig(
            { addToService: false },
            `service-config.${this.parentService.id}.list.${this.id}._config`
          )
        )
        .then(
          () => ![`stop`, `disabled`].includes(this.getState()) && this.stop()
        )
        .then(() => this.setState(`disabled`))
        .then(() => resolve())
        .catch((err) => {
          reject(err);
        });
    });
  }

  start() {
    // console.log(`[${this.constructor.name}]`, `oo start() >> `);
    return new Promise((resolve) => {
      try {
        Promise.resolve()
          .then(() => this.objMon.log(`${this.id} starting`))
          .then(() => this.parent.start())
          .then(() => this.setState(`running`))
          .then((ret) => resolve(ret));
      } catch (err) {
        this.setState(`error`);
        this.objMon.error(err);
        this.restart();
        resolve();
      }
    });
  }

  stop() {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.objMon.log(`${this.id} stopping.`))
        .then(() => this.parent.stop())
        .then(() => this.setState(`stopped`))
        .then(() => resolve())
        .catch((err) => {
          this.setState(`error`);
          this.objMon.error(err);
          reject(err);
        });
    });
  }

  restart() {
    return new Promise((resolve) => {
      Promise.resolve()
        .then(() => this.setState(`restarting`))
        .then(() => this.parent.stop())
        .then(() => this.parent.start())
        .then(() => resolve())
        .catch((err) => {
          this.objMon.error(err);
          setTimeout(() => this.restart(), 5000);
        });
    });
  }

  initProcessor() {
    this.queue.process(`act`, (job, done) => {
      Promise.resolve()
        .then(() => this.taskMon.start(job.data.jobId))
        .then(() => this.processor(job.data.jobId, job.data.cmd))
        .then((ret) => done(null, ret))
        .catch((err) => {
          this.taskMon.error(job.data.jobId, err);
          done(err);
        });
    });
  }

  processor(jobId, cmd) {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.parent.processor(jobId, cmd))
        .then((ret) => {
          return ret;
        })
        .then((ret) => resolve(ret))
        .catch((err) => reject(err));
    });
  }
}

module.exports = ObjectOperator;
