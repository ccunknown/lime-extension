/* eslint-disable class-methods-use-this */
/* eslint-disable no-nested-ternary */
const fs = require(`fs`);
const Path = require(`path`);
const rimraf = require("rimraf");

class ServiceObjectsMetric {
  constructor(service) {
    this.service = service;
  }

  setTarget(id) {
    this.directory = this.craftDirectoryName(id);
    this.filename = this.craftFileName(id);
  }

  craftDirectoryName(id) {
    const { extension } = this.service;
    return Path.join(
      extension.addonManager.getUserProfile().dataDir,
      extension.manifest.id,
      `monitor-log`,
      this.service.id,
      id
    );
  }

  craftFileName(id) {
    return id.split(`/`).pop();
  }

  deleteMetric(id) {
    if (id) this.setTarget(id);
    return rimraf.sync(this.directory);
  }

  buildMetric(id) {
    if (id) this.setTarget(id);
    return new Promise((resolve, reject) => {
      let startTime;
      let metric = {};
      let logs;
      let jobs;
      let jobsMetric;
      let completeJobsMetric;
      let successJobMetric;
      let failJobMetric;
      let serviceTime;
      let waitingTime;
      Promise.resolve()
        .then(() => {
          startTime = new Date().getTime();
        })
        .then(() => this.gatherLog())
        .then((logParagraph) => {
          logs = this.logFormat(logParagraph);
          jobs = this.jobsTrim(this.logsToJobs(logs));
          // jobs.forEach((e) => console.log(e.jid));
          // console.log(`jobs:`, JSON.stringify(jobs, null, 2));
          jobsMetric = jobs.map((job) => this.jobEvaluate(job));
          // console.log(`jobsMetric:`, jobsMetric);
          completeJobsMetric = jobsMetric.filter(
            (j) => j.addTime && (j.stopTime || j.rejectTime)
          );
          successJobMetric = completeJobsMetric.filter((j) => j.stopTime);
          failJobMetric = completeJobsMetric.filter((j) => j.rejectTime);
          serviceTime = completeJobsMetric.reduce(
            (partialSum, j) => partialSum + j.serviceTime,
            0
          );
          waitingTime = completeJobsMetric.reduce(
            (partialSum, j) => partialSum + j.waitingTime,
            0
          );
          metric = {
            timeRange: this.calJobsRange(jobs),
            activeTime: {
              millisecond: serviceTime,
              list: completeJobsMetric,
            },
            jobs: {
              success: successJobMetric.length,
              fail: failJobMetric.length,
              averageWaitingTime: waitingTime / completeJobsMetric.length,
              averageServiceTime: serviceTime / completeJobsMetric.length,
            },
            errorList: logs.filter((e) => e.level === `error`),
          };
        })
        .then(() => {
          const endTime = new Date().getTime();
          metric.calculateTime = endTime - startTime;
        })
        .then(() => resolve(metric))
        // .then(() => resolve(jobsMetric))
        .catch((err) => reject(err));
    });
  }

  gatherLog(dir = this.directory) {
    // console.log(`current id:`, this.filename);
    let log = ``;
    fs.readdirSync(dir, { withFileTypes: true })
      .filter((dirent) => dirent.isFile())
      .filter((dirent) => `${dirent.name}`.startsWith(this.filename))
      .forEach((dirent) => {
        // console.log(
        //   dirent.name,
        //   typeof dirent,
        //   dirent.name.startsWith(this.filename)
        // );
        log = `${log}${fs.readFileSync(Path.join(dir, dirent.name))}`;
      });
    // console.log(`log:`, log);
    return log;
  }

  logFormat(logParagraph) {
    // const re = /^([0-9\-T:.]+Z) \[(\w+)\]: (.*)$/;
    const re = /^([0-9\-T:.]+Z) \[(\w+)\]: ?(?:\[JID:([a-z0-9-]+)\])? ?(.*)$/;
    return logParagraph
      .split(`\n`)
      .filter((line) => line.length)
      .map((line) => {
        const arr = line.match(re) || [];
        const log = {
          timestamp: arr.length > 1 ? arr[1] : undefined,
          level: arr.length > 2 ? arr[2] : undefined,
          message:
            arr.length > 4 ? arr[4] : arr.length > 3 ? arr[3] : undefined,
          jid: arr.length > 4 ? arr[3] : undefined,
        };
        return log;
      });
  }

  logsToJobs(logs) {
    const jobs = [];
    logs.forEach((log) => {
      if (log.jid) {
        let job = jobs.find((e) => e.jid === log.jid);
        if (!job) {
          job = {
            jid: log.jid,
            logList: [],
          };
          jobs.push(job);
        }
        job.logList.push({
          timestamp: log.timestamp,
          message: log.message,
        });
      }
    });
    return jobs;
  }

  jobEvaluate(job) {
    const result = {
      jid: job.jid,
      addTime: this.getJobActTime(job.logList, `ADD`),
      startTime: this.getJobActTime(job.logList, `START`),
    };
    const stopTime = this.getJobActTime(job.logList, `END`);
    if (stopTime) result.stopTime = stopTime;
    const rejectTime = this.getJobActTime(job.logList, `REJECT`);
    if (rejectTime) {
      result.rejectTime = rejectTime;
      result.errors = this.getRejectMessage(job.logList);
    }

    result.waitingTime =
      result.startTime && result.addTime
        ? new Date(result.startTime).getTime() -
          new Date(result.addTime).getTime()
        : null;
    result.serviceTime =
      (result.stopTime || result.rejectTime) && result.startTime
        ? new Date(result.stopTime || result.rejectTime).getTime() -
          new Date(result.startTime).getTime()
        : null;
    return result;
  }

  getJobActTime(logList, act) {
    // const re = new RegExp(`\\[ACT:${act}\\]`);
    // const log = logList.find((e) => e.message.match(re));
    const word = `[ACT:${act}`;
    const log = logList.find((e) => e.message.startsWith(word));
    if (log) {
      return log.timestamp;
    }
    return null;
  }

  getRejectMessage(logList) {
    const word = `[ACT:REJECT`;
    const log = logList.find((e) => e.message.startsWith(word));
    if (!log) return null;
    const stackReg = /<stack:\[([^>]+)\]>/i;
    const stackMessage = log.message.match(stackReg);
    if (!stackMessage || stackMessage.length < 2) return null;
    const stackArray = stackMessage[1].split(`, `);
    return stackArray;
  }

  // Remove jobs which not have [ACT: START].
  jobsTrim(jobs) {
    const re = /\[ACT:ADD\]/;
    return jobs.filter((job) => {
      return !!job.logList.find((log) => log.message.match(re));
    });
  }

  calJobRange(logList) {
    let start = new Date(8640000000000000);
    let stop = new Date(-8640000000000000);
    logList.forEach((log) => {
      const timestamp = new Date(log.timestamp);
      start = timestamp < start ? timestamp : start;
      stop = timestamp > stop ? timestamp : stop;
    });
    return { start, stop };
  }

  calJobsRange(jobs) {
    let start = new Date(8640000000000000);
    let stop = new Date(-8640000000000000);
    jobs.forEach((job) => {
      job.logList.forEach((log) => {
        const timestamp = new Date(log.timestamp);
        start = timestamp < start ? timestamp : start;
        stop = timestamp > stop ? timestamp : stop;
      });
    });
    return { start, stop };
  }
}

module.exports = ServiceObjectsMetric;
