(function() {

  class LimeExtension extends window.Extension {
    constructor() {
      super('lime-extension');
      this.addMenuEntry('Lime Extension');

      /*
      this.constants = {
        "idRegex": /^extension-lime/,
        "urlPrefix": `/extensions/${this.id}`
      };
      */
      this.config = {
        "url-prefix": `/extensions/${this.id}`,
        "api": {
          "path": `/extensions/${this.id}/static/core/js/lime-api.js`,
          "object": `LimeExtensionApi`
        },
      };

      this.promise = [];
      this.content = '';
      this.contents = {};
      this.resourceSchema = null;
      this.resourceObj = null;

      /*
      let prom = this.loadResource(`/extensions/${this.id}/static/js/page/page-schema.js`)
      .then(() => {
        this.resourceSchema = LimeExtensionLoadStructure;
        //console.log(`page schema : ${JSON.stringify(this.resourceSchema, null, 2)}`);
      })
      .then(() => {
        return new Promise(async(resolve, reject) => {
          this.resourceObj = await this.load(this.resourceSchema);
          this.console = new LimeConsole(`LimeExtension`);
          this.console.log(`Resource file loaded.`);
          this.content = this.render();
          //this.content = await this.render();
          //this.raid = new LimeRaid();
          resolve();
        });
      });

      this.promise.push(prom);*/




      let prom =this.loadResource(`/extensions/${this.id}/static/core/js/lime-api.js`)
      .then(() => {
        return new Promise((resolve, reject) => {
          //this.api = new window[`${this.config.api.object}`]();
          //this.api = new LimeExtensionApi();
          this.api = eval(`new ${this.config.api.object}()`);
          this.api.init({
            "url-prefix": `/extensions/${this.id}`,
            "load-script-path": `/config/load-script.json`
          })
          .then(() => {
            resolve();
          });
        });
      });

      this.promise.push(prom);







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
      });*/
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

    load(schema, obj) {
      return new Promise(async (resolve, reject) => {
        obj = (obj) ? obj : JSON.parse(JSON.stringify(schema.flow));
        let result = {};
        switch(typeof obj) {
          case "string":
            //console.log(`load string`);
            if(schema.define.hasOwnProperty(obj)) {
              result[obj] = await this.loadResource(`${schema.define[obj].path}`);
              resolve(result);
            }
            else
              reject(`"${obj}" not define!!!`);
            break;
          case "object":
            //console.log(`load object`);
            if(obj.type == "sequential") {
              for(let i in obj.load) {
                let res = await this.load(schema, obj.load[i]);
                Object.assign(result, res);
              }
              resolve(result);
            }
            else if(obj.type == "parallel") {
              let prom = [];
              for(let i in obj.load) {
                let res = this.load(schema, obj.load[i]);
                prom.push(res);
              }
              Promise.all(prom)
              .then((arr) => {
                arr.forEach((elem) => Object.assign(result, elem));
                resolve(result);
              });
            }
            else
              reject(`Incorrect schema : ${JSON.stringify(obj, null, 2)}`);
            break;
          default:
            reject(`load type ${typeof obj} not allow!!!`);
            break;
        }
        
      });
    }

    loadResource(path) {
      //let prefix = this.constants.urlPrefix;
      let prefix = this.config[`url-prefix`];
      path = (path.startsWith(prefix) || path.startsWith(`http`)) ? path : [prefix, `static`, path].join("/").replace(/\/+/g, "/");
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
          //console.log(`loadScriptSync("${src}") : finish`);
          resolve();
        });

        s.addEventListener("error", (err) => {
          console.log(`loadScriptSync("${src}") : error`);
          reject(err);
        });

        //console.log(`loadScriptSync("${src}") : start`);
        document.getElementsByTagName('head')[0].appendChild(s);
      });
    }

    loadPageSync(url, type) {
      return new Promise((resolve, reject) => {
        //console.log(`loadPageSync("${url}") : start`);
        fetch(url).then((res) => {
          //console.log(`loadPageSync("${url}") : finish`);
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
  }

  new LimeExtension();
})();