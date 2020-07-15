export default class PageScripts {
  constructor(extension) {
    this.extension = extension;
    this.console = this.extension.console;
  }

  init(config) {
    this.console.trace(`init()`);
    return new Promise((resolve, reject) => {
      let vue1 = new Vue({
        "el": `#script-test-01`,
        "data": {
          "message": "test-01"
        }
      });

      let vue2 = new Vue({
        "el": `#script-test-02`,
        "data": {
          "message": "test-02"
        }
      });
      resolve();
    });
  }

  renderNav(config) {
    this.console.trace(`renderNav()`);
  }

  render(config) {
    this.console.trace(`renderPage()`);
  }
}