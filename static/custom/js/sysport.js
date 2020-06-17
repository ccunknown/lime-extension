export default class PageSysport {
  constructor(extension) {
    this.extension = extension;
    this.console = this.extension.console;
    this.api = this.extension.api;
    this.ui = this.extension.ui;
  }

  init(config) {
    this.console.trace(`init()`);
    return new Promise((resolve, reject) => {
      this.initFunction();
      resolve();
    });
  }

  render() {
    return new Promise(async (resolve, reject) => {
      this.console.trace(`render()`);
      this.showLoading();
      let result = await this.renderPage();
      this.showContent();
      resolve(result);
    });
  }

  renderNav() {
    this.console.trace(`renderNav()`);
  }

  renderPage() {
    this.console.trace(`renderPage()`);
    return new Promise(async (resolve, reject) => {
      this.getPortList()
      .then((list) => this.initialList(list))
      .then(() => resolve());
    });
  }

  initialList(list) {
    let template = this.ui.saidObj(`content.sysport.listpanel.template.item`).html();
    this.ui.saidObj(`content.sysport.listpanel`).empty();
    list.forEach((data) => {
      let elem = this.ui.mustache.render(template, data);
      this.ui.saidObj(`content.sysport.listpanel`).append(elem);
    });
  }

  getPortList() {
    return new Promise(async (resolve, reject) => {
      let list = await this.api.restCall(`get`, `/api/system/portlist`);
      let data = [];
      for(let i in list) {
        data.push({
          path: list[i].path,
          pnpid: (list[i].pnpId) ? list[i].pnpId : `null`,
          manufacturer: (list[i].manufacturer) ? list[i].manufacturer : `null`,
          index: i
        });
      }
      resolve(data);
    });
  }

  initFunction() {
    this.console.log(`initFunction()`);
    this.ui.saidObj(`content.sysport.header.reload`).on(`click`, () => {
      this.console.log(`reload click`);
      //this.getPortList()
      //.then((list) => this.initialList(list));
      this.render();
    });
  }

  showLoading() {
    this.console.log(`showLoading()`);
    this.ui.saidObj(`content.sysport.listpanel`).addClass(`hide`);
    this.ui.saidObj(`content.sysport.loading`).removeClass(`hide`);
  }

  showContent() {
    this.console.log(`showContent()`);
    this.ui.saidObj(`content.sysport.loading`).addClass(`hide`);
    this.ui.saidObj(`content.sysport.listpanel`).removeClass(`hide`);
  }
}