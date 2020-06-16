export default class PageEngines {
  constructor(extension) {
    this.extension = extension;
    this.console = this.extension.console;
  }

  init(config) {
    this.trace(`init()`);
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  renderNav(config) {
    this.trace(`renderNav()`);
  }

  renderPage(config) {
    this.trace(`renderPage()`);
  }
}