const Queue = require(`bull`);
const { ObjectState, ObjectActivity } = require(`./object-state`);

class ObjectOperator {
  constructor(parent, parentService, id) {
    this.parent = parent;
    this.id = id;
    this.parentService = parentService;
    this.state = ObjectState.UNLOAD;
    this.activity = ObjectActivity.IDLE;
    this.queue = new Queue(`${this.parentService.id}-${this.id}`);
    this.queue.empty();

    this.objMon = this.parent.om.obj;
    this.taskMon = this.parent.om.task;

    this.startRetirement = undefined;
    this.children = new Map();

    this.initProcessor();
  }

  init() {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() =>
          this.parent.to && this.parent.to.init
            ? this.parent.to.init()
            : this.parent.init()
        )
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  getState() {
    return this.state;
  }

  setState(state) {
    console.log(`[${this.constructor.name}]`, `setState:`, state);
    if (JSON.stringify(state) !== JSON.stringify(this.state)) {
      if (
        !Object.values(ObjectState)
          .map((e) => JSON.stringify(e))
          .includes(JSON.stringify(state))
      )
        this.objMon.error(new Error(`Object state '${state}' not in scope.`));
      this.state = state;
      this.objMon.state(state.value);
    }
  }

  getActivity() {
    return this.getActivity;
  }

  setActivity(activity) {
    if (activity !== this.activity) {
      if (!Object.values(ObjectActivity).includes(activity))
        this.objMon.error(
          new Error(`Object activity '${activity}' not in scope.`)
        );
      this.activity = activity;
      // this.objMon.state(activity);
    }
  }

  getSchema() {
    return this.parent.to.getSchema
      ? this.parent.to.getSchema()
      : this.parent.getSchema();
  }

  enable() {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.objMon.log(`enabling`))
        .then(() =>
          this.configManager.updateConfig(
            true,
            `service-config.${this.parentService.id}.list.${this.id}.enable`
          )
        )
        // .then(() => ![`running`].includes(this.getState()) && this.start())
        // .then(() => this.setState(`enabled`))
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
            false,
            `service-config.${this.parentService.id}.list.${this.id}.enable`
          )
        )
        .then(
          () => ![`stop`, `disabled`].includes(this.getState()) && this.stop()
        )
        // .then(() => this.setState(`disabled`))
        .then(() => resolve())
        .catch((err) => {
          reject(err);
        });
    });
  }

  start() {
    // console.log(`[${this.constructor.name}]`, `oo start() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        // .then(() => this.objMon.log(`Object '${this.id}' starting`))
        .then(() => this.setState(ObjectState.PENDING))
        .then(() =>
          this.retryStart(
            this.parent.config.retry ? this.parent.config.retryNumber : 0,
            this.parent.config.retry ? this.parent.config.retryDelay : 0
          )
        )
        .then((ret) => resolve(ret))
        .catch((err) => {
          this.objMon.error(err);
          reject(err);
        });
    });
  }

  retryStart(retryNumber = 0, retryDelay = 0) {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        // .then(() => this.objMon.log(`${this.id} starting`))
        .then(() => this.setState(ObjectState.PENDING))
        .then(() =>
          this.parent.to && this.parent.to.start
            ? this.parent.to.start()
            : this.parent.start()
        )
        .then(
          // Start success
          (ret) => {
            this.setState(ObjectState.RUNNING);
            this.startRetirement = undefined;
            resolve(ret);
          },
          // Start fail
          () => {
            if (retryNumber && retryDelay) {
              // this.setState(`wait-for-restart`);
              this.startRetirement = setTimeout(
                () => this.retryStart(retryNumber - 1, retryDelay),
                retryDelay
              );
            } else this.setState(ObjectState.MAXPENDING);
          }
        )
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  stop() {
    console.log(`[${this.constructor.name}]`, `stop() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.objMon.log(`${this.id} stopping.`))
        .then(() => this.stopStartRetirement())
        .then(() => this.stopChild())
        .then(() =>
          this.parent.to && this.parent.to.stop
            ? this.parent.to.stop()
            : this.parent.stop()
        )
        .then(() => this.setState(ObjectState.STOPPED))
        .then(() => this.queue.close())
        .then(() => resolve())
        .catch((err) => {
          // this.setState(`error`);
          this.objMon.error(err);
          reject(err);
        });
    });
  }

  stopStartRetirement() {
    console.log(`[${this.constructor.name}]`, `stopStartRetirement() >> `);
    if (this.startRetirement) {
      clearTimeout(this.startRetirement);
      this.startRetirement = undefined;
    }
  }

  addChild(childId, templatePath, config) {
    console.log(`[${this.constructor.name}]`, `addChild(${childId}) >> `);
    return new Promise((resolve, reject) => {
      let ChildObject;
      let child;
      Promise.resolve()
        .then(() => {
          // eslint-disable-next-line import/no-dynamic-require, global-require
          ChildObject = require(templatePath);
          child = new ChildObject(this.parent, childId, config);
        })
        .then(() => child.init())
        .then(() => this.children.set(childId, child))
        .then(() =>
          this.parent.to && this.parent.to.addChild
            ? this.parent.to.addChild(childId, child)
            : this.parent.addChild(childId, child)
        )
        // .then(() => child.oo.start())
        .then(() => resolve(child))
        .catch((err) => reject(err));
    });
  }

  getChild(childId) {
    console.log(`[${this.constructor.name}]`, `getChild(${childId}) >> `);
    if (this.parent.to.getChild) {
      // const child = this.parent.to.getChild(childId);
      const child = this.children.get(childId);
      return childId
        ? child.master || child
        : child.map((kid) => kid.master || kid);
    }
    if (childId) return this.children.get(childId);
    return Object.fromEntries(this.children);
  }

  startChild(childId) {
    console.log(`[${this.constructor.name}]`, `startChild(${childId}) >> `);
    return new Promise((resolve, reject) => {
      if (childId) {
        Promise.resolve()
          .then(() => this.children.get(childId))
          .then((child) => {
            if (!child)
              throw new Error(`Child with id '${childId}' not found.`);
            return child.start();
          })
          .then(() =>
            this.parent.to && this.parent.to.startChild
              ? this.parent.to.startChild(childId)
              : this.parent.startChild(childId)
          )
          .then(() => resolve())
          .catch((err) => reject(err));
      } else {
        Promise.resolve()
          .then(() =>
            Array.from(this.children.keys()).reduce((prevProm, id) => {
              return prevProm.then(() => this.startChild(id));
            }, Promise.resolve())
          )
          .then(() => resolve())
          .catch((err) => reject(err));
      }
    });
  }

  stopChild(childId) {
    console.log(
      `[${this.constructor.name}]`,
      `stopChild(${childId || ``}) >> `
    );
    return new Promise((resolve, reject) => {
      if (childId) {
        Promise.resolve()
          .then(() => this.children.get(childId))
          .then((child) => {
            if (!child)
              throw new Error(`Child with id '${childId}' not found.`);
            return child.stop();
          })
          .then(() =>
            this.parent.to && this.parent.to.stopChild
              ? this.parent.to.stopChild(childId)
              : this.parent.stopChild(childId)
          )
          .then(() => resolve())
          .catch((err) => reject(err));
      } else {
        Promise.resolve()
          .then(() =>
            Array.from(this.children.keys()).reduce((prevProm, id) => {
              return prevProm.then(() => this.stopChild(id));
            }, Promise.resolve())
          )
          .then(() => resolve())
          .catch((err) => reject(err));
      }
    });
  }

  initProcessor() {
    this.queue.process(`act`, (job, done) => {
      Promise.resolve()
        .then(() => this.taskMon.start(job.data.jobId))
        .then(() => this.processor(job.data.jobId, job.data.cmd))
        .then((ret) => {
          this.taskMon.end(job.data.jobId);
          done(null, ret);
        })
        .catch((err) => {
          this.taskMon.reject(job.data.jobId, err);
          done(err);
        });
    });
  }

  processor(jobId, cmd) {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.setActivity(ObjectActivity.ACTIVE))
        .then(() => this.parent.processor(jobId, cmd))
        .then((ret) => {
          return ret;
        })
        .then((ret) => resolve(ret))
        .catch((err) => {
          reject(err);
        })
        .finally(() => this.setActivity(ObjectActivity.IDLE));
    });
  }
}

module.exports = ObjectOperator;
