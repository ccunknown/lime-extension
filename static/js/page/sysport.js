class LimeExtensionPageSysport {
  constructor(parent, raid) {
    this.constants = {
      "logPrefix": `LimeExtension-Page-Sysport`
    };
    this.log(`constructor()`);
  }

  init() {
    this.log(`init()`);
  }

  renderNav(config) {
    this.log(`renderNav()`);
  }

  renderPage(config) {
    this.log(`renderPage()`);
  }

  log(str) {
    let prefix = this.constants.logPrefix;
    console.log(`${prefix} >> str`);
  }
}