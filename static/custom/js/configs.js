export default class PageConfigs {
  constructor(extension) {
    this.extension = extension;
    this.console = this.extension.console;
    this.api = this.extension.api;
    this.ui = this.extension.ui;
    this.urlPrefix = this.extension.loader.define[`url-prefix`];
  }

  init(config) {
    this.console.trace(`init()`);
    return new Promise(async (resolve, reject) => {
      Promise.resolve()
      .then(() => this.initVue())
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  initVue() {
    this.console.trace(`initVue()`);
    return new Promise(async (resolve, reject) => {
      let id = this.ui.said(`content.configs.section`);
      this.console.log(`id : ${id}`);

      this.vue = new Vue({
        "el": `#${id}`,
        // "components": {
        //   vueTagsInput
        // },
        "data": {
          /** Loader **/
          "loader": this.extension.schema,
          /** Resource **/
          "resource": {
            "config": null
          },
          /** UI **/
          "ui": {
            loading: false,
            pageCursor: `base`
          },
          /** Function **/
          "fn": {
            "edit": () => {},
            "restart": () => {},
            "save": () => {},
            "isBaseShow": () => {},
            "isSliderShow": () => {}
          }
        },
        "methods": {}
      });

      //  Setup vue function.
      this.vue.fn = {
        "edit": async () => {
          this.renderSlider();
        },
        "restart": async () => {
          this.renderSlider();
        },
        "save": async () => {
          this.renderSlider();
        },
        "isBaseShow": () => {
          return !this.vue.ui.loading && (this.vue.ui.pageCursor == `base`);
        },
        "isSliderShow": () => {
          return !this.vue.ui.loading && (this.vue.ui.pageCursor == `slider`);
        },
        "renderBase": () => {
          return this.renderBase();
        },
        "renderSlider": () => {
          return this.renderSlider();
        }
      };

      this.console.log(this.vue);

      resolve();
    });
  }

  render(base = true) {
    this.console.log(`render()`);
    return new Promise(async (resolve, reject) => {
      Promise.resolve()
      .then(() => (base) ? this.renderBase() : this.renderSlider())
      .then((result) => resolve(result))
      .catch((err) => reject(err));
    });
  }

  renderNav() {
    this.console.trace(`renderNav()`);
  }

  renderBase() {
    this.console.log(`renderBase()`);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => {
        this.vue.ui.loading = true;
        this.vue.ui.pageCursor = `base`;
      })
      .then(() => this.getConfig(true))
      .then((config) => this.vue.resource.config = config)
      // .then(() => this.console.log(this.vue.resource.config))
      .then((ret) => resolve(ret))
      // .then(() => )
      .catch((err) => reject(err))
      .finally(() => this.vue.ui.loading = false);
    });
  }

  renderSlider() {
    this.console.log(`renderSlider()`);
    return new Promise(async (resolve, reject) => {
      Promise.resolve()
      .then(() => {
        this.vue.ui.loading = true;
        this.vue.ui.pageCursor = `slider`;
      })
      .then(() => this.getConfig(true))
      .then((config) => this.vue.resource.config = config)
      .then(() => JSON.stringify(this.vue.resource.config, null, 2))
      .then((text = ``) => this.editor ? this.editor.setValue(text) : this.initEditor(text))
      .then((ret) => resolve(ret))
      .catch((err) => reject(err))
      .finally(() => this.vue.ui.loading = false);
    });
  }

  initEditor(text = ``) {
    this.console.log(`initEditor()`);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => !window.require && this.loadJsScriptSync(`${this.urlPrefix}/static/resource/js/require.min.js`))
      .then(() => {
        require.config({ paths: { 'vs': `${this.urlPrefix}/static/resource/monaco/min/vs` }});
        window.MonacoEnvironment = { getWorkerUrl: () => proxy };
        let proxy = URL.createObjectURL(new Blob([`
          self.MonacoEnvironment = {
            baseUrl: '${window.location.origin}${this.urlPrefix}/static/resource/monaco/min/'
          };
          importScripts('${window.location.origin}${this.urlPrefix}/static/resource/monaco/min/vs/base/worker/workerMain.js');
        `], { type: 'text/javascript' }));
      })
      .then(() => require(
        ["vs/editor/editor.main"],
        (monaco) => {
          this.editor = monaco.editor.create(
            document.getElementById('extension-lime-content-configs-slider-slider-monaco-container'), 
            {
              value: text,
              language: 'javascript',
              theme: 'vs-dark',
              automaticLayout: true
            }
          );
        }
      ))
      .then(() => this.waitForEditorReady())
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  waitForEditorReady() {
    this.console.log(`waitForEditorReady()`);
    return new Promise((resolve, reject) => {
      let fn = () => {
        if(this.editor)
          resolve();
        else
          setTimeout(fn, 100);
      }
      fn();
    })
  }

  setEditorValue(context = ``) {
    // Check editor available
    if(!this.editor) {
      alert(`Monaco editor not set.`);
      return false;
    }

    // Set new value.
    this.editor.setValue(context);
    // Reset scroll position.
    this.editor.setScrollPosition({scrollTop: 0});
    return true;
  }

  loadJsScriptSync(src) {
    return new Promise((resolve, reject) => {
      var s = document.createElement('script');
      s.src = src;
      s.type = "text/javascript";
      s.async = false;

      s.addEventListener("load", () => {
        resolve();
      });

      s.addEventListener("error", (err) => {
        console.log(`loadScriptSync("${src}"") : error`);
        reject(err);
      });

      document.getElementsByTagName('head')[0].appendChild(s);
    })
  }


  /*
    API Function.
  */

  getConfig() {
    this.console.log(`getConfig()`);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.api.getConfig())
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  getScript(name) {
    this.console.log(`getScript(${(name) ? name : ``})`);
    return new Promise(async (resolve, reject) => {
      let scripts = await this.api.restCall(`get`, `/api/service/scripts${(name) ? `/${name}` : ``}`);
      resolve(scripts);
    });
  }

  deleteScript(name) {
    this.console.log(`deleteScript(${name})`);
    return new Promise(async (resolve, reject) => {
      let res = await this.api.restCall(`delete`, `/api/service/scripts/${name}`);
      resolve(res);
    });
  }

  upload(schema) {
    this.console.log(`upload(${schema.name})`);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.api.restCall(`put`, `/api/service/scripts`, schema))
      .then(() => resolve())
      .catch((err) => reject(err));
    });
  }

  /*
    File operation.
  */

  download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }
  
  readFile(file) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      reader.readAsText(file);
    });
  }
}