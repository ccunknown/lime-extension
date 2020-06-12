export default class PageSysport {
  constructor(extension) {
    this.extension = extension;
    this.console = this.extension.console;
  }

  init() {
    this.trace(`init()`);

  }

  renderNav(config) {
    this.trace(`renderNav()`);
  }

  renderPage(config) {
    this.trace(`renderPage()`);
  }
}