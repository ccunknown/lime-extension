/* eslint-disable class-methods-use-this */
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
    this.om = {
      extension,
      service,
      id,
      storageDir,
      publishPath: `/service/${service.id}/monitor/${id}`,
      rtcPeerService: service.laborsManager.getService(`rtcpeer-service`).obj,
      logger: winston.createLogger(
        generateConfig({
          console: true,
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
    console.log(
      `[${this.constructor.name}]`,
      `storage path:`,
      this.om.storageDir
    );
    this.om_init();
  }

  om_init() {
    this.om_initTaskLogger();
  }

  om_initTaskLogger() {
    const taskLogger = {
      add: (id = uuid(), cmd = null) => {
        this.om_info(`[JID:${id}]`, `[ACT:ADD]`, `[CMD:${cmd}]`);
        return id;
      },
      start: (id = uuid()) => {
        this.om_info(`[JID:${id}]`, `[ACT:JOBSTART]`);
        return id;
      },
      log: (id = uuid(), ...message) => {
        this.om_info(`[JID:${id}]`, `[LOG:${[...message].join(` `)}]`);
        return id;
      },
      end: (id = uuid(), result = null) => {
        this.om_info(`[JID:${id}]`, `[ACT:JOBEND]`, `[RES:${result}]`);
        return id;
      },
      error: (id, err = new Error(`Undefine error`)) => {
        this.om_error(
          `[JID:${id}]`,
          `[ERR: <${err.name}:${err.message}> <stack:[${err.stack
            .split(`\n`)
            .join(`, `)}]>]`
        );
      },
    };

    Object.entries(taskLogger).forEach(([key, val]) => {
      this.om.task[key] = val;
    });
  }

  om_publish(msg) {
    this.om.rtcPeerService.publish(this.om.publishPath, msg);
  }

  om_info(...args) {
    this.om.logger.info([...args].join(` `));
  }

  om_error(...args) {
    this.om.logger.error([...args].join(` `));
  }
}

module.exports = ObjectMonitor;
