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
          // console: true,
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
    this.initTaskLogger();
  }

  initTaskLogger() {
    this.task = {
      add: (id = uuid(), cmd = null) => {
        const msg = [`[JID:${id}]`, `[ACT:ADD]`, `[CMD:${cmd}]`].join(` `);
        this.logger.info(msg);
        this.publish(msg, this.publishPath);
        return id;
      },
      start: (id = uuid()) => {
        const msg = [`[JID:${id}]`, `[ACT:JOBSTART]`].join(` `);
        this.logger.info(msg);
        this.publish(msg, this.publishPath);
        return id;
      },
      log: (id = uuid(), ...message) => {
        const msg = [`[JID:${id}]`, `[LOG:${[...message].join(` `)}]`].join(
          ` `
        );
        this.logger.info(msg);
        this.publish(msg, this.publishPath);
      },
      end: (id = uuid(), result = null) => {
        const msg = [`[JID:${id}]`, `[ACT:JOBEND]`, `[RES:${result}]`].join(
          ` `
        );
        this.logger.info(msg);
        this.publish(msg, this.publishPath);
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

  log(...message) {
    this.logger.info([...message].join(` `));
    this.publish(message, this.publishPath);
  }
}

module.exports = ObjectMonitorSubclass;
