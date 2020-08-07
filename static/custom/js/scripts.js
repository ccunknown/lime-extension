export default class PageScripts {
  constructor(extension) {
    this.extension = extension;
    this.console = this.extension.console;
    this.api = this.extension.api;
    this.ui = this.extension.ui;
  }

  init(config) {
    this.console.trace(`init()`);
    return new Promise(async (resolve, reject) => {
      await this.initVue();
      resolve();
    });
  }

  initVue() {
    this.console.trace(`initVue()`);
    return new Promise(async (resolve, reject) => {
      let id = this.ui.said(`content.scripts.section`);
      this.console.log(`id : ${id}`);
      let schema = await this.getSchema();

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
            "config": {"directory": null, "list": []},
            "schema": schema,
            "scripts": []
          },
          /** UI **/
          "ui": {
            "slider": {
              "hide": true,
              "ready": false,
              "edit": true,
              "form": this.ui.generateData(this.ui.shortJsonElement(schema, `.+`)),
              //"formTemplate": this.ui.generateVueData(this.ui.shortJsonElement(schema, `.+`))
            },
            "base": {
              "ready": false
            },
            "tag": ""
          },
          /** Function **/
          "fn": {
            "add": () => {},
            "view": () => {},
            "remove": () => {},
            "save": () => {},
            "download": () => {},
            "renderBase": () => {},
            "renderSlider": () => {},
            "onSelectFile": () => {},
            "previewFile": () => {},
            "removeFile": () => {},
            "addTag": () => {},
            "getTag": () => {},
            "clearTag": () => {}
          }
        },
        "methods": {}
      });

      //  Setup vue function.
      this.vue.fn = {
        "add": async () => {
          this.renderSlider();
        },
        "view": (name) => {
          this.console.log(`view(${name})`);
          this.renderSlider(name);
        },
        "remove": (name) => {
          this.console.log(`delete(${name})`);
          return new Promise(async (resolve, reject) => {
            let conf = confirm(`Confirm to delete script "${name}"!`);
            if(conf) {
              this.vue.ui.base.ready = false;
              let res = await this.deleteScript(name);
              await this.render();
              this.vue.ui.base.ready = true;
              resolve();
            }
            else {
              resolve();
            }
          });
        },
        "save": () => {
          this.console.log(`save()`);
          return new Promise(async (resolve, reject) => {
            this.vue.ui.slider.ready = false;
            let tags = this.vue.fn.getTag();
            let result = JSON.parse(JSON.stringify(this.vue.ui.slider.form));
            result.meta.tags = tags;
            this.console.log(`save data: ${JSON.stringify(result, null, 2)}`);
            await this.upload(result);
            this.render();
          });
        },
        "download": (name) => {
          return new Promise((resolve, reject) => {
            let file = this.vue.ui.slider.form.children.find((elem) => elem.name == name);
            if(file)
              this.download(file.name, atob(file.base64));
          });
        },
        "renderBase": () => {
          this.render();
        },
        "renderSlider": () => {
          this.render(false);
        },
        "onSelectFile": (event) => {
          return new Promise((resolve, reject) => {
            let files = event.target.files;
            files.forEach((file) => {
              this.console.log(file);
              this.vue.ui.slider.form.children.push({
                "name": file.name,
                "type": "file"
              });
              this.readFile(file)
              .then((res) => {
                let result = btoa(res);
                this.vue.ui.slider.form.children = this.vue.ui.slider.form.children.filter((elem) => elem.name != file.name);
                this.vue.ui.slider.form.children.push({
                  "name": file.name,
                  "type": `file`,
                  "base64": result
                });
              });
            });
            resolve();
          });
        },
        "previewFile": (name) => {
          this.console.log(`previewFile(${name})`);
        },
        "removeFile": (name) => {
          this.console.log(`removeFile(${name})`);
          this.vue.ui.slider.form.children = this.vue.ui.slider.form.children.filter((elem) => elem.name != name);
        },
        "addTag": (name) => {
          if(!this.vue.ui.slider.form.meta.tags.find((elem) => name == elem.text))
            this.vue.ui.slider.form.meta.tags.push({
              "text": name,
              "tiClasses": [
                "ti-valid"
              ]
            });
        },
        "getTag": () => {
          return this.vue.ui.slider.form.meta.tags.map((elem) => elem.text);
        },
        "clearTag": () => {
          this.vue.ui.slider.form.meta.tags = [];
        }
      };

      this.console.log(this.vue);

      resolve();
    });
  }

  readFile(file) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.onload = (event) => {
        //this.console.log(event.target.result);
        resolve(event.target.result);
      };
      reader.readAsText(file);
    });
  }

  render(base = true) {
    this.console.log(`render()`);
    return new Promise(async (resolve, reject) => {
      this.console.trace(`render()`);
      let result = (base) ? await this.renderBase() : await this.renderSlider();
      resolve(result);
    });
  }

  renderNav() {
    this.console.trace(`renderNav()`);
  }

  renderBase() {
    this.console.log(`renderBase()`);
    return new Promise(async (resolve, reject) => {
      this.vue.ui.base.ready = false;
      this.vue.ui.slider.hide = true;

      let config = await this.getConfig();
      this.vue.resource.config = config;
      let scripts = await this.getScript();
      this.vue.resource.scripts = scripts;

      this.vue.ui.base.ready = true;
      resolve();
    });
  }

  renderSlider(name) {
    this.console.log(`renderSlider()`);
    return new Promise(async (resolve, reject) => {
      this.vue.ui.slider.ready = false;
      this.vue.ui.slider.hide = false;

      this.console.log(`ui slider : ${JSON.stringify(this.vue.ui.slider, null, 2)}`);
      await this.renderForm(name);

      this.vue.ui.slider.ready = true;
      resolve();
    });
  }

  renderForm(name) {
    this.console.log(`PageScripts: renderVueAddForm() >> `);
    return new Promise((resolve, reject) => {
      if(name) {
        this.vue.ui.slider.edit = false;
        Promise.all([
          this.getConfig(),
          this.getScript(name)
        ])
        .then((promArr) => {
          this.vue.resource.config = promArr[0];
          let script = promArr[1];
          let tags = (script.meta && script.meta.tags) ? script.meta.tags : [];
          //script.tag = [];

          this.vue.ui.slider.form = script;
          this.vue.fn.clearTag();
          tags.forEach((tag) => this.vue.fn.addTag(tag));

          resolve();
        });
      }
      else {
        this.vue.ui.slider.edit = true;
        let schema = this.ui.shortJsonElement(this.vue.resource.schema, `.+`);
        this.vue.ui.slider.form = this.ui.generateData(schema);
        this.vue.ui.slider.form.children = [];
        resolve();
      }
    });
  }

  getConfig() {
    this.console.log(`getConfig()`);
    return new Promise((resolve, reject) => {
      this.api.getConfig()
      .then((config) => resolve(config[`service-config`][`scripts-service`]));
    });
  }

  getSchema() {
    this.console.log(`getSchema()`);
    return new Promise((resolve, reject) => {
      this.api.getSchema()
      .then((schema) => resolve(schema.properties[`service-config`].properties[`scripts-service`]));
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
    return new Promise(async (resolve, reject) => {
      await this.api.restCall(`put`, `/api/service/scripts`, schema);
      resolve();
    });
  }

  download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }
}