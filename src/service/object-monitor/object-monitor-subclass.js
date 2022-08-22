const { v1: uuid } = require(`uuid`);
const Path = require(`path`);
const winston = require(`winston`);

const { generateConfig } = require(`./log-config-generator`);

class ObjectMonitorSubclass {
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
      publishPath: `/service/${service.id}/monitor/${id}`,
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
        this.logger.info(`[STATE:${state}]`);
      },
      log: (...message) => {
        this.logger.info([...message].join(` `));
        this.publish(message, this.publishPath);
      },
      error: (err) => {
        this.logger.error(
          `[ERR: <${err.name}:${err.message}> <stack:[${err.stack
            .split(`\n`)
            .join(`, `)}]>]`
        );
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
        this.obj.log(`[JID:${id}]`, `[ACT:JOBSTART]`);
        return id;
      },
      log: (id = uuid(), ...message) => {
        this.obj.log(`[JID:${id}]`, `[LOG:${[...message].join(` `)}]`);
      },
      end: (id = uuid(), result = null) => {
        this.obj.log(`[JID:${id}]`, `[ACT:JOBEND]`, `[RES:${result}]`);
        return id;
      },
      error: (id, err = new Error(`Undefine error`)) => {
        const msg = [
          `[JID:${id}]`,
          `[ERR: <${err.name}:${err.message}> <stack:[${err.stack
            .split(`\n`)
            .join(`, `)}]>]`,
        ].join(` `);
        this.logger.error(msg);
        this.publish(msg, this.publishPath);
      },
    };
  }

  publish(msg) {
    this.rtcPeerService.publish(this.publishPath, msg);
  }
}

module.exports = ObjectMonitorSubclass;
