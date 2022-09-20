class ObjectMetric {
  constructor(logger) {
    this.logger = logger;
  }

  buildMetric() {
    return new Promise((resolve, reject) => {
      let metric = {};
      let logs;
      let jobs;
      let jobsMetric;
      Promise.resolve()
        .then(() => this.gatherLog())
        .then((log) => {
          logs = this.logFormat(log);
          jobs = this.jobsTrim(this.logsToJobs(logs));
          jobsMetric = this.jobsCalculate(jobs);
          metric = {
            timeRange: /* this.calJobsRange(jobs) */,
            activeTime: {
              millisecond: ,
              list: ,
            },
            jobs: {
              success: /* jobsMetric.map() */,
              fail: /* jobsMetric.map() */,
              averageWaitingTime: ,
              averageServiceTime: ,
            },
            errorList: ,
          };
        })
        .then(() => resolve(metric))
        .catch((err) => reject(err));
    });
  }

  gatherLog() {}

  logFormat() {}

  logsToJobs() {}

  jobsTrim() {}

  calJobsRange() {}

  jobsCalculate() {
    // serviceTime
    // waitingTime
  }
}

module.exports = ObjectMetric;
