/* eslint-disable class-methods-use-this */
const { v1: uuid } = require(`uuid`);
const ObjectMetricBuilder = require("./object-metric");
const ObjectMonitor = require("./object-monitor");
const ObjectOperator = require("./object-operator");

class ObjectTemplate {
  constructor(service, id) {
    this.om = new ObjectMonitor(service, id);
    this.oo = new ObjectOperator(this, service, id);
    this.mb = new ObjectMetricBuilder(
      this.om.storageDir,
      this.om.id /* as file name */
    );

    this.om.obj.log(`${service.id}:${id}`, `Construct object-template`);
  }

  getState() {
    return this.oo.getState();
  }

  setState(state) {
    return this.oo.setState(state);
  }

  act(cmd, jobId = uuid()) {
    return new Promise((resolve) => {
      // let jobId;
      Promise.resolve()
        .then(() => {
          this.om.task.add(jobId, this.commandToString(cmd), {
            jobId,
            removeOnComplete: 256,
            removeOnFail: 256,
          });
        })
        .then(() =>
          this.oo.queue.add(
            `act`,
            { jobId, cmd },
            {
              removeOnComplete: {
                age: 1 * 60 * 60,
                count: 100,
              },
              removeOnFail: {
                age: 1 * 60 * 60,
                count: 100,
              },
            }
          )
        )
        .then((job) => job.finished())
        .then((ret) => {
          // this.om.task.end(jobId, this.resultToString(ret));
          resolve(ret);
        })
        .catch((err) => {
          // console.error(err);
          resolve({ error: err });
        });
    });
  }

  // eslint-disable-next-line class-methods-use-this
  commandToString(cmd) {
    try {
      return JSON.stringify(cmd);
    } catch (err) {
      return `*no cmd translate`;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  resultToString(result) {
    try {
      return JSON.stringify(result);
    } catch (err) {
      return `*no result translate`;
    }
  }

  generateMetric() {
    return this.mb.buildMetric();
  }

  deleteMetric() {
    return this.mb.deleteMetric();
  }
}

module.exports = ObjectTemplate;
