'use strict'

const EventEmitter = require('events').EventEmitter;
const AsyncLock = require('async-lock');
const Path = require(`path`);
const {exec} = require(`child_process`);
const sqlite3 = require(`sqlite3`).verbose();

class NervenetMeshReader {
  constructor(enginesService, config) {
    this.enginesService = enginesService;
    this.config = config;
    this.event = new EventEmitter();
    this.state = `stop`;
    this.lock = {
      "act": {
        "key": `act-lock`,
        "locker": new AsyncLock()
      }
    };
    this.Errors = require(Path.join(this.enginesService.getRootDirectory(), `/constants/errors.js`));
  }

  init(port) {
    return new Promise((resolve, reject) => {
      this.period = null;
      this.lastfetch = 0;
      // this.dbSync()
      // .then(() => resolve())
      // .catch((err) => reject(err));
      resolve();
    });
  }

  start() {
    console.log(`NervenetMeshReader: start() >> `);
    if(this.state != `restarting`)
      this.emit(`starting`, this);
    return new Promise((resolve, reject) => {
      this.setSyncPeriod(this.config.period)
      .then(() => this.emit(`running`, this))
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  restart() {
    console.log(`NervenetMeshReader: restart() >> `);
    this.emit(`restarting`, this);
    return new Promise(async (resolve, reject) => {
      this.stop()
      .then(() => this.start())
      .then(() => resolve())
      .catch((err) => setTimeout(() => this.restart(), 5000));
    });
  }

  stop() {
    console.log(`NervenetMeshReader: stop() >> `);
    if(this.state != `restarting`)
      this.emit(`stoping`, this);
    return new Promise((resolve, reject) => {
      this.clearSyncPeriod()
      .then(() => {
        if(this.state != `restarting`)
          this.emit(`stop`, this);
      })
      .then(() => resolve())
      .catch((err) => reject());
    });
  }

  emit(event, arg) {
    console.log(`NervenetMeshReader: emit("${event}") >> `);
    this.state = (event == `data`) ? `running` : event;
    if(event == `data`)
      console.log(`emit 'data': ${arg}`);
    return this.event.emit(event, arg);
  }

  getState() {
    return this.state;
  }

  setSyncPeriod(period) {
    console.log(`NervenetMeshReader: setSyncPeriod(${period}) >> `);
    return new Promise((resolve, reject) => {
      ((this.period) ? this.clearSyncPeriod() : Promise.resolve())
      .then(() => this.period = setInterval(() => {this.intervalTask()}, period))
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  clearSyncPeriod() {
    console.log(`NervenetMeshReader: clearSyncPeriod() >> `);
    return new Promise((resolve, reject) => {
      clearInterval(this.period);
      resolve();
    });
  }

  intervalTask() {
    console.log(`NervenetMeshReader: intervalTask() >> `);
    return new Promise((resolve, reject) => {
      this.dbSync()
      .then(() => this.readFromDb())
      .then((rows) => rows.forEach((row) => this.emit(`data`, row.asc_payload)))
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  readFromDb() {
    console.log(`NervenetMeshReader: readFromDb() >> `);
    return new Promise((resolve, reject) => {
      let db = new sqlite3.Database(`./loramesh.sqlite3`);
      db.all(`SELECT * FROM loramesh_recv WHERE time_update > ${this.lastfetch}`, (err, rows) => {
        rows.forEach((row) => this.lastfetch = (row.time_update > this.lastfetch) ? row.time_update : this.lastfetch);
        db.close();
        resolve(rows);
      })
    });
  }

  dbSync() {
    console.log(`NervenetMeshReader: dbSync() >> `);
    return new Promise((resolve, reject) => {
      let cmd = `sshpass -p "${this.config.password}" rsync -a ${this.config.username}@${this.config.host}:${this.config.dbpath} ./loramesh.sqlite3`;
      exec(`${cmd}`, (err, stdout, stderr) => {
        (err) ? reject(err) : resolve(stdout);
      });
    });
  }
}

module.exports = NervenetMeshReader;

