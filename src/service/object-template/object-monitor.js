const { v1: uuid } = require(`uuid`);
const Path = require(`path`);
const winston = require(`winston`);

const { generateConfig } = require(`./log-config-generator`);

class ObjectMonitor {
  constructor(service, id) {
    const { extension } = service;
    const storageDir = Path.join(
      extension.addonManager.getUserProfile().dataDir,
      extension.manifest.id,
      `monitor-log`,
      service.id,
      id
    );
    const properties = {
      extension,
      service,
      id,
      storageDir,
      publishPath: `/service/${service.id}/monitor/${id}/`,
      rtcPeerService: service.laborsManager.getService(`rtcpeer-service`).obj,
      logger: winston.createLogger(
        generateConfig({
          console: {
            label: id,
          },
          files: [
            {
              dirname: storageDir,
              filename: `${id}`,
            },
          ],
        })
      ),
      task: {},
    };

    Object.entries(properties).forEach(([key, val]) => {
      this[key] = val;
    });
    this.init();
  }

  init() {
    this.initObjectLogger();
    this.initTaskLogger();
  }

  initObjectLogger() {
    this.obj = {
      state: (state) => {
        const msg = `[STATE:${state}]`;
        this.logger.info(msg);
        this.publish(msg, `state`);
      },
      log: (...message) => {
        const msg = [...message].join(` `);
        this.logger.info(msg);
        this.publish(msg);
      },
      error: (err) => {
        const msg = `[ERR: <${err.name}:${err.message}> <stack:[${err.stack
          .split(`\n`)
          .join(`, `)}]>]`;
        this.logger.error(msg);
        this.publish(msg, `log`, `error`);
      },
    };
  }

  initTaskLogger() {
    this.task = {
      add: (id = uuid(), cmd = null) => {
        this.obj.log(`[JID:${id}]`, `[ACT:ADD]`, `[CMD:${cmd}]`);
        return id;
      },
      start: (id = uuid()) => {
        this.obj.log(`[JID:${id}]`, `[ACT:START]`);
        return id;
      },
      log: (id = uuid(), ...message) => {
        this.obj.log(`[JID:${id}]`, `[LOG:${[...message].join(` `)}]`);
      },
      end: (id = uuid(), result = null) => {
        this.obj.log(`[JID:${id}]`, `[ACT:END]`, `[RES:${result}]`);
        return id;
      },
      reject: (id, err = new Error(`Undefine error`)) => {
        const msg = [
          `[JID:${id}]`,
          `[ACT:REJECT: <${err.name}:${err.message}> <stack:[${err.stack
            .split(`\n`)
            .join(`, `)}]>]`,
        ].join(` `);
        this.logger.error(msg);
        this.publish(msg, `log`, `error`);
      },
      error: (id, err = new Error(`Undefine error`)) => {
        const msg = [
          `[JID:${id}]`,
          `[ERR: <${err.name}:${err.message}> <stack:[${err.stack
            .split(`\n`)
            .join(`, `)}]>]`,
        ].join(` `);
        this.logger.error(msg);
        this.publish(msg, `log`, `error`);
      },
    };
  }

  publish(msg, category = `log`, level = `log`, timestamp = new Date()) {
    const topic = Path.join(this.publishPath, category);
    const message = JSON.stringify({
      timestamp,
      level,
      message: msg,
    });
    this.rtcPeerService.publish(topic, message);
  }
}

module.exports = ObjectMonitor;
