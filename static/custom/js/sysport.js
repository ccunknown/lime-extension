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
      this.ui.saidObj(`content.sysport.slider`).addClass(`hide`);
      //this.showLoading();
      //let result = await this.renderPage();
      //this.showContent();
      let result = await this.renderBase();
      resolve(result);
    });
  }

  renderNav() {
    this.console.trace(`renderNav()`);
  }

  renderPage() {
    this.console.trace(`renderPage()`);
    return new Promise(async (resolve, reject) => {
      /*
      this.getPortList()
      .then((list) => this.initialList(list, schema))
      .then(() => resolve());
      */
      await this.renderBase();
      resolve();
    });
  }

  /*
  initialList(list) {
    let template = this.ui.saidObj(`content.sysport.base.listpanel.template.item`).html();
    this.ui.saidObj(`content.sysport.base.listpanel`).empty();
    list.forEach((data) => {
      let elem = this.ui.mustache.render(template, data);
      this.ui.saidObj(`content.sysport.base.listpanel`).append(elem);
    });
    let adder = this.ui.saidObj(`content.sysport.base.listpanel.template.adder`).html();
    this.ui.saidObj(`content.sysport.base.listpanel`).append(adder);
  }
  */

  renderBase() {
    return new Promise(async (resolve, reject) => {
      this.showLoading();

      let config = await this.getConfig();
      console.log(config);

      let template = this.ui.saidObj(`content.sysport.base.listpanel.template.item`).html();
      this.ui.saidObj(`content.sysport.base.listpanel`).empty();
      config.list.forEach((data) => {
        let elem = this.ui.mustache.render(template, data);
        this.ui.saidObj(`content.sysport.base.listpanel`).append(elem);
      });
      let adder = this.ui.saidObj(`content.sysport.base.listpanel.template.adder`).html();
      //this.ui.saidObj(`content.sysport.base.listpanel`).append(adder);
      let adderDom = new DOMParser().parseFromString(adder, "text/html");
      let adderElem = adderDom.getElementsByClassName(`miso-grid-item-adder`);
      adderElem[0].id = `extension-lime-content-sysport-base-listpanel-adder`;
      this.ui.saidObj(`content.sysport.base.listpanel`).append(adderElem);
      this.ui.initRaid();
      this.ui.saidObj(`content.sysport.base.listpanel.adder`).on(`click`, () => {
        console.log(`add click`);
        this.renderSlider();
      });
      //this.ui.saidObj(`content.sysport.base.listpanel`).append(adder);

      this.showContent();
      resolve();
    });
  }

  renderSlider() {
    return new Promise(async (resolve, reject) => {
      this.showLoading();
      let portlist = await this.getPortList();
      console.log(portlist);

      this.ui.saidObj(`content.sysport.slider.form.port`).empty();
      portlist.forEach((port) => {
        let option = new Option(`${port.path}`, `${port.path}`);
        this.ui.saidObj(`content.sysport.slider.form.port`).append(option);
      });
      
      this.showContent();
      resolve();
    });
  }

  getConfig() {
    return new Promise((resolve, reject) => {
      this.api.getConfig()
      .then((config) => resolve(config[`service-config`][`sysport-service`]));
    });
  }

  getSchema() {
    return new Promise((resolve, reject) => {
      this.api.getSchema()
      .then((schema) => resolve(schema.properties[`service-config`].properties[`sysport-service`]));
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
    this.ui.saidObj(`content.sysport.base.header.reload`).on(`click`, () => {
      this.console.log(`reload click`);
      //this.getPortList()
      //.then((list) => this.initialList(list));
      this.render();
    });

    this.ui.saidObj(`content.sysport.slider.header.back`).on(`click`, () => {
      this.console.log(`back click`);
      this.ui.saidObj(`content.sysport.slider`).addClass(`hide`);
    });
  }

  showLoading() {
    this.console.log(`showLoading()`);
    //  Slider
    this.ui.saidObj(`content.sysport.slider.form`).addClass(`hide`);
    this.ui.saidObj(`content.sysport.slider.loading`).removeClass(`hide`);
    //  Base
    this.ui.saidObj(`content.sysport.base.listpanel`).addClass(`hide`);
    this.ui.saidObj(`content.sysport.base.loading`).removeClass(`hide`);
  }

  showContent() {
    this.console.log(`showContent()`);
    //  Slider
    this.ui.saidObj(`content.sysport.slider.loading`).addClass(`hide`);
    this.ui.saidObj(`content.sysport.slider.form`).removeClass(`hide`);
    //  Base
    this.ui.saidObj(`content.sysport.base.loading`).addClass(`hide`);
    this.ui.saidObj(`content.sysport.base.listpanel`).removeClass(`hide`);
  }
}