const config = require(`config`);
const fs = require(`fs`);
const Path = require(`path`);

const configFileName = `default.json`;
const defaultConfig = {
  setting: {},
};
const defaultKey = Object.keys(defaultConfig)[0];

class MyDatabase {
  constructor(configPath) {
    // this.originalConfig = config;
    this.configPath = configPath;
    this.init();
  }

  // init() {
  //   // this.config.addConfig(dbPath);
  //   try {
  //     this.config.addConfig(this.configPath);
  //   } catch (err) {
  //     if (err.code === `ENOENT`) {
  //       fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig));
  //       this.config.addConfig(this.configPath);
  //     } else {
  //       throw err;
  //     }
  //   }
  // }

  init() {
    console.log(`[${this.constructor.name}]`, `config path:`, this.configPath);
    const filePath = Path.join(this.configPath, configFileName);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultConfig));
    }
    // this.config = config.util.loadFileConfigs(this.configPath);
    // console.log(`this.config:`, this.config);
    // console.log(`config source:`, config.util.getConfigSources());
  }

  open() {}

  close() {}

  loadConfig() {
    return this.getSetting(defaultKey);
  }

  saveConfig(conf) {
    return this.setSetting(defaultKey, conf);
  }

  getSetting(name) {
    // const value = this.config.get(name);
    // return JSON.parse(value);
    const data = fs.readFileSync(Path.join(this.configPath, configFileName));
    return JSON.parse(data)[name];
  }

  setSetting(name, value) {
    // const jsonValue = JSON.stringify(value);
    // this.config.set(name, jsonValue);
    // this.config.save();
    const setting = { [name]: value };
    fs.writeFileSync(
      Path.join(this.configPath, configFileName),
      JSON.stringify(setting)
    );
  }
}

module.exports = MyDatabase;
