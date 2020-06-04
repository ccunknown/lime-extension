(function() {

  class LimeExtension extends window.Extension {
    constructor() {
      super('lime-extension');
      this.addMenuEntry('Lime Extension');

      this.constants = {
        "idRegex": /^extension-lime/,
        "scriptAddrPrefix": `/extensions/${this.id}/static/js`,
        "pageAddrPrefix": `/extensions/${this.id}/static/views`
      };

      this.promise = [];
      this.content = '';
      this.contents = {};

      let pageSchema = null;
      let promPage = this.loadScriptSync(`/extensions/${this.id}/static/js/page/page-schema.js`)
      .then(() => {
        pageSchema = LimeExtensionPageStructure;
        console.log(`page schema : ${JSON.stringify(pageSchema, null, 2)}`);
        return ;
      })
      .then(() => {
        let pageArr = [];
        pageSchema.page.forEach((page) => pageArr.push(page.view.path));
        let loadScript = this.loadSequential(scriptArr);
        let loadPage = this.loadParallel(pageArr);
      });

      this.promise.push(promScript);
      this.promise.push(promPage);

      /*
      let loadScript = this.loadSequential(scriptArr);

      let loadPage = this.loadParallel(pageArr)
      .then((list) => {
        let schema = {};
        for(let i in pageArr) {
          this.contents[pageArr[i].match(/(?:-)([^.]+)(?:.)/i)[1]] = list[i];
        }
        
        let content = new DOMParser().parseFromString(mainPage, "text/html");
      });

      let prom = Promise.all([
        loadScript,
        loadPage
      ]);
      this.promise.push(prom);*/

      //for(let i in scriptArr)
      //  this.loadScriptSync(`${scriptAddrPrefix}${scriptArr[i]}`);

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
      });
      this.promise.push(prom);*/
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
          console.log(JSON.stringify(this.config, null, 2));
          this.pageRender();
        });
      });
    }

    loadParallel(list) {
      return new Promise((resolve, reject) => {
        let result = [];
        for(let i in list)
          result.push(this.loadResource(`${list[i]}`));
        Promise.all(result)
        .then((arr) => {
          resolve(arr);
        });
      });
    }

    loadSequential(list) {
      return new Promise(async(resolve, reject) => {
        result = [];
        for(let i in list)
          result.push(await this.loadResource(`${list[i]}`));
        resolve(result);
      });
    }

    loadResource(path) {
      if(path.endsWith(`.js`)) {
        return this.loadScriptSync(path);
      }
      else if(path.endsWith(`.html`)) {
        return this.loadPageSync(path);
      }
      else {
        console.error(`${path} not match file type.`);
        return null;
      }
    }

    loadScriptSync(src) {
      return new Promise((resolve, reject) => {
        var s = document.createElement('script');
        s.src = src;
        s.type = "text/javascript";
        s.async = false;

        s.addEventListener("load", () => {
          console.log(`loadScriptSync("${src}"") : finish`);
          resolve();
        });

        s.addEventListener("error", (err) => {
          console.log(`loadScriptSync("${src}"") : error`);
          reject(err);
        });

        console.log(`loadScriptSync("${src}"") : start`);
        document.getElementsByTagName('head')[0].appendChild(s);
      });
    }

    loadPageSync(url, type) {
      return new Promise((resolve, reject) => {
        fetch(url).then((res) => {
          resolve((type == "json") ? res.json() : res.text());
        }).catch((e) => {
          console.error(`Failed to fetch "${url}" : ${e}`);
        });
      });
    }

    idOfText(content) {
      return $(`*`, content).map(function() {
        if(this.id)
          return this.id;
      }).get();
    }

    pageRender(config) {
      console.log("pageRender() >> ");
      return new Promise((resolve, reject) => {
        resolve(true);
      });
    }

    renderContent() {
      console.log("renderContent() >> ");
      return new Promise((resolve, reject) => {
        resolve(true);
      });
    }

    renderNav() {
      console.log(`renderNav() >> `);
      return new Promise((resolve, reject) => {
        resolve(true);
      });
    }
  }

  new TurnipExtension();
})();