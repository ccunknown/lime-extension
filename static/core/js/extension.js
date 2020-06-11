export default class ExtensionMain extends window.Extension {
  constructor(script) {
    super(script.extension.full);
    this.script = JSON.parse(JSON.stringify(script));
    this.addMenuEntry(`${this.script.extension[`title-full`]}`);

    this.promise = [];
    this.content = '';
    this.contents = {};
    this.resourceSchema = null;
    this.resourceObj = null;

    this.console = console;
    this.console.trace = () => {};
    this.init();

    //  Load resource.

    /*
    let prom = Promise.all([
      this.loadResource(`/extensions/${this.id}/static/views/main.html`),
      this.loadResource(`/extensions/${this.id}/static/views/webhook.html`),
      this.loadResource(`/extensions/${this.id}/static/views/setting.html`),
      this.loadResource(`/extensions/${this.id}/static/views/account.html`),
      this.loadResource(`/extensions/${this.id}/static/json/render.json`, `json`),
      this.loadScript(scriptArr)
      ])
    .then(([
      mainPage,
      webhookPage,
      settingPage,
      accountPage,
      renderSchema
    ]) => {
      return new Promise((resolve, reject) => {
        this.contents.mainPage = new DOMParser().parseFromString(mainPage, "text/html");
        this.contents.webhookPage = new DOMParser().parseFromString(webhookPage, "text/html");
        this.contents.settingPage = new DOMParser().parseFromString(settingPage, "text/html");
        this.contents.accountPage = new DOMParser().parseFromString(accountPage, "text/html");
        this.renderSchema = renderSchema;
        console.log(`render schema : ${JSON.stringify(this.renderSchema, null, 2)}`);
        let idList = [];
        for(let i in this.contents)
          idList = [...idList, ...this.idOfText(this.contents[i])];
        console.log(`id list : ${JSON.stringify(idList, null, 2)}`);

        //  Set up html element id shortcut as said.
        this.turnipRaid = new TurnipRaid(idList);
        said = this.turnipRaid.stringAutoId.bind(this.turnipRaid);
        saidObj = this.turnipRaid.stringAutoIdObject.bind(this.turnipRaid);

        //  Set rest and api.
        this.turnipApi = new TurnipApi(this);
        this.api = this.turnipApi.api;
        this.rest = this.turnipApi.rest;

        ui = this.webUi();

        let content = new DOMParser().parseFromString(mainPage, "text/html");
        
        content.getElementById(said(`turnip.content.webhook`)).innerHTML = this.contents.webhookPage.body.innerHTML;
        content.getElementById(said(`turnip.content.setting`)).innerHTML = this.contents.settingPage.body.innerHTML;
        content.getElementById(said(`turnip.content.account`)).innerHTML = this.contents.accountPage.body.innerHTML;

        this.content = content.body.innerHTML;
        //console.log(`content : ${this.content}`);

        //  Initial components.
        this.webhook = new TurnipExtensionWebhook(this, this.turnipRaid);
        this.setting = new TurnipExtensionSetting(this, this.turnipRaid);
        this.account = new TurnipExtensionAccount(this, this.turnipRaid);

        resolve();
      });
    });*/
  }

  init() {
    return new Promise(async (resolve, reject) => {
      await this.initLoader();
      await this.initCoreObject();
      await this.initPageObject();
    });
  }

  initLoader() {
    return new Promise(async (resolve, reject) => {
      //  Call Loader.
      let ExtensionLoader = (await import(`/extensions/${this.id}/static/core/js/loader.js`)).default;
      this.loader = new ExtensionLoader(this);
      //this.loader = new ((await import(`/extensions/${this.id}/static/core/js/loader.js`)).default)();
      await this.loader.init();
      resolve();
    });
  }

  initCoreObject() {
    return new Promise((resolve, reject) => {
      let coreArr = [
        //"console",
        "collector",
        "api",
        //"raid",
        "ui"
      ];
      coreArr.forEach((objName) => {
        let obj = this.loader.getCoreObject(`${objName}`);
        //console.log(this.console);
        this.console.log(`objName : ${objName}`);
        //this.console.log(`obj : ${obj}`);
        this[`${objName}`] = new obj(this);
      });
      //this.loader.initConsole();
      resolve();
    });
  }

  initPageObject() {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  render() {
    this.console.trace(`render() >> `);
    let schema = this.resourceSchema;

  }

  show() {
    Promise.all(this.promise).then(() => {
      this.view.innerHTML = this.content;
      this.api.getConfig().then((config) => {
        if(!this.config) {
          this.config = config;
        }
        else
          this.config = config;
        this.console.log(JSON.stringify(this.config, null, 2));
        this.pageRender();
      });
    });
  }

  idOfText(content) {
    return $(`*`, content).map(function() {
      if(this.id)
        return this.id;
    }).get();
  }
}