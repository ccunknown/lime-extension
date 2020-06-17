export default class PageDevices {
  constructor(extension) {
    this.extension = extension;
    this.console = this.extension.console;
  }

  init(config) {
    this.console.trace(`init()`);
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  renderNav(config) {
    this.console.trace(`renderNav()`);
  }

  renderPage(config) {
    this.console.trace(`renderPage()`);
  }
}
