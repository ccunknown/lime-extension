export default class ExtensionApi {
  constructor(extension) {
    this.extension = extension;

    this.console = this.extension.console;

    this.init();
  }

  init() {
    this.console.trace(`init() >> `);
  }
}