/* eslint-disable no-nested-ternary */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-underscore-dangle */
const Service = require(`../service-template/service`);

// const ConfigTranslator = require(`./config-translator.js`);

class EnginesService extends Service {
  constructor(extension, config, id) {
    super(extension, config, id);
    console.log(`[${this.constructor.name}]`, `contructor(${id}) >> `);
  }

  init(config) {
    console.log(`[${this.constructor.name}]`, `init() >> `);
    try {
      this.sysportService =
        this.laborsManager.getService(`sysport-service`).obj;
      this.config = config || this.config;
    } catch (err) {
      console.error(err);
    }
    return Promise.resolve();
  }

  start() {
    console.log(`[${this.constructor.name}]`, `start() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.initEngine())
        .then((result) =>
          console.log(
            `[${this.constructor.name}]`,
            `initEngine: ${JSON.stringify(result, null, 2)}`
          )
        )
        // .then(() => {
        //   this.configTranslator = new ConfigTranslator(this);
        // })
        .then(() => console.log(`[${this.constructor.name}]`, `engine started`))
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  initEngine() {
    console.log(`[${this.constructor.name}]`, `initEngine() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => {
          this.engineList = [];
          return this.getSchema();
        })
        .then((schema) => schema.list)
        .then((list) =>
          Object.keys(list).reduce((prevProm, id) => {
            return prevProm.then(() => {
              if (
                Object.prototype.hasOwnProperty.call(list[id], `_config`) &&
                Object.prototype.hasOwnProperty.call(
                  list[id]._config,
                  `enable`
                ) &&
                list[id]._config.enable
              )
                return this.addToService(id, list[id]).catch((err) =>
                  console.error(err)
                );
              return Promise.resolve();
            });
          }, Promise.resolve())
        )
        .then(() =>
          console.log(`[${this.constructor.name}]`, `initEngine complete`)
        )
        .then(() => resolve({}))
        .catch((err) => reject(err));
    });
  }

  loadEngine(config, template) {
    console.log(`[${this.constructor.name}]`, `loadEngine() >> `);
    return new Promise((resolve, reject) => {
      console.log(
        `[${this.constructor.name}]`,
        `template: ${JSON.stringify(template, null, 2)}`
      );
      let engine;
      Promise.resolve()
        .then(() => {
          const path = template.path.replace(/^\//, ``);
          const Obj = require(`./${path}/engine.js`);
          engine = new Obj(this, config);
        })
        .then(() => this.sysportService.get(config.port, { object: true }))
        .then((sysport) => engine.init(sysport))
        .then(() =>
          Object.prototype.hasOwnProperty.call(engine, `oo`) &&
          typeof engine.oo.start === `function`
            ? engine.oo.start()
            : engine.start()
        )
        .then(() => resolve(engine))
        .catch((err) => reject(err));
    });
  }
}

module.exports = EnginesService;
