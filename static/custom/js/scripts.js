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
      Promise.resolve()
      .then(() => this.initVue())
      // .then(() => initEditor())
      .then(() => resolve())
      .catch((err) => reject(err));
      // await this.initVue();
      // resolve();
    });
  }

  initVue() {
    this.console.trace(`initVue()`);
    return new Promise(async (resolve, reject) => {
      let id = this.ui.said(`content.scripts.section`);
      this.console.log(`id : ${id}`);
      // let schema = await this.getSchema();

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
            "schema": {},
            "scripts": []
          },
          /** UI **/
          "ui": {
            "current": {
              "slider": {
                "name": null
              }
            },
            "slider": {
              "hide": true,
              "ready": false,
              "edit": true,
              "form": {},
              // "form": this.ui.generateData(this.ui.shortJsonElement(schema, `.+`)),
              //"formTemplate": this.ui.generateVueData(this.ui.shortJsonElement(schema, `.+`))
              "slider": {
                "fname": null,
                "hide": true,
                "ready": false,
                "current": null, // Current edit file name.
                "editor": {
                  // fname: content
                }
              },
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
            "clearTag": () => {},
            "renderSlide2": () => {},
            "swapFile": () => {},
            "save2": () => {},
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
          name && (this.vue.ui.current.slider.name = name);
          this.renderSlider(name ? name : undefined);
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
            Promise.resolve()
            .then(() => {
              this.vue.ui.slider.ready = false;
            })
            .then(() => {
              let tags = this.vue.fn.getTag();
              let result = JSON.parse(JSON.stringify(this.vue.ui.slider.form));
              result.meta.tags = tags;
              return result;
            })
            .then((result) => {
              this.console.log(`save data: ${JSON.stringify(result, null, 2)}`);
              return this.upload(result);
            })
            .then(() => this.render())
            .then(() => resolve())
            .catch((err) => reject(err));
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
        },
        "renderSlider2": (fname) => {
          this.renderSlider2(fname);
        },
        "swapFile": (fname) => {
          this.console.log(`swapCaller() >> `);
          this.swapFile(fname);
        },
        "save2": () => {
          return new Promise((resolve, reject) => {
            Promise.resolve()
            .then(() => this.saveEdit())
            // .then(() => this.render(false))
            .then(() => this.renderSlider(this.vue.ui.current.slider.name, true))
            .then(() => resolve())
            .catch((err) => reject(err));
          })
        }
      };

      this.console.log(this.vue);

      resolve();
    });
  }

  initEditor(text = ``) {
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.loadJsScriptSync(`/extensions/lime-extension/static/resource/js/require.min.js`))
      .then(() => {
        require.config({ paths: { 'vs': '/extensions/lime-extension/static/resource/monaco/min/vs' }});
        window.MonacoEnvironment = { getWorkerUrl: () => proxy };
        let proxy = URL.createObjectURL(new Blob([`
          self.MonacoEnvironment = {
            baseUrl: '${window.location.origin}/extensions/lime-extension/static/resource/monaco/min/'
          };
          importScripts('${window.location.origin}/extensions/lime-extension/static/resource/monaco/min/vs/base/worker/workerMain.js');
        `], { type: 'text/javascript' }));
      })
      .then(() => require(
        ["vs/editor/editor.main"],
        (monaco) => {
          this.editor = monaco.editor.create(
            document.getElementById('extension-lime-content-scripts-slider-slider-monaco-container'), 
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
      .then((ret) => resolve(ret))
      .catch((err) => reject(err));
    });
  }

  waitForEditorReady() {
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

  swapFile(fname) {
    // this.console.log(`swap() >> `)
    if(!this.editor)
      return;
    // Keep old value.
    if(this.vue.ui.slider.slider.current) {
      this.vue.ui.slider.slider.editor[this.vue.ui.slider.slider.current] = this.editor.getValue();
    }
    // Set new value.
    fname && this.editor.setValue(this.vue.ui.slider.slider.editor[fname]);
    fname && (this.vue.ui.slider.slider.current = fname);
    // Reset scroll position.
    this.editor.setScrollPosition({scrollTop: 0});
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
      this.vue.resource.schema = await this.getSchema();
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
      this.vue.ui.slider.slider.hide = true;
      // this.vue.ui.slider.show = `base`;

      let config = await this.getConfig();
      this.vue.resource.config = config;
      let scripts = await this.getScript();
      this.vue.resource.scripts = scripts;

      this.vue.ui.base.ready = true;
      resolve();
    });
  }

  renderSlider(name, renew = false) {
    this.console.log(`renderSlider()`);
    return new Promise(async (resolve, reject) => {
      Promise.resolve()
      .then(() => {
        this.vue.ui.slider.ready = false;
        this.vue.ui.slider.hide = false;
        this.vue.ui.slider.slider.hide = true;
      })
      .then(() => renew && this.getSchema())
      .then((schema) => renew && (this.vue.resource.schema = schema))
      .then(() => {
        this.vue.ui.slider.form = this.ui.generateData(
          this.ui.shortJsonElement(this.vue.resource.schema, `.+`)
        )
      })
      .then(() => this.renderForm(name))
      .then(() => resolve())
      .catch((err) => reject(err))
      .finally(() => this.vue.ui.slider.ready = true);
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

          this.vue.ui.slider.form = script;
          this.vue.fn.clearTag();
          tags.forEach((tag) => this.vue.fn.addTag(tag));

          this.console.log(this.vue.ui.slider.form);

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

  renderSlider2() {
    this.console.log(`PageScripts: renderSlider2() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => {
        this.vue.ui.slider.slider.ready = false;
        this.vue.ui.slider.slider.hide = false;
        this.vue.ui.slider.slider.current = null;
      })
      .then(() => {
        this.vue.ui.slider.slider.form = this.vue.ui.slider.form;
        this.console.log(this.vue.ui.slider.slider.form);
      })
      // Translate file from `this.vue.ui.slider.form` to `this.vue.ui.slider.slider.editor`.
      .then(() => {
        // Clear editor.
        this.vue.ui.slider.slider.editor = {};
        // Initial meta file.
        if(this.vue.ui.slider.form.meta) {
          this.console.log(`meta:`, this.vue.ui.slider.form.meta);
          let meta = JSON.parse(JSON.stringify(this.vue.ui.slider.form.meta));
          meta.tags = this.vue.fn.getTag();
          this.vue.ui.slider.slider.editor.metadata = JSON.stringify(meta, null, 2);
        }
        // Initial script files.
        this.vue.ui.slider.form.children.forEach((child) => {
          this.vue.ui.slider.slider.editor[child.name] = atob(child.base64);
        });
        this.console.log(`child:`, this.vue.ui.slider.slider.editor);
      })
      // .then(() => this.console.log(`editor:`, this.editor))
      .then((text = ``) => this.editor ? this.editor.setValue(text) : this.initEditor(text))
      // Click first file (retry).
      .then(() => {
        let children = document.getElementById(`extension-lime-content-scripts-slider-slider-file-bar`).children;
        children.length && children[0].click();
      })
      .then((ret) => resolve(ret))
      .catch((err) => reject(err))
      .finally(() => {
        this.vue.ui.slider.slider.ready = true;
      });
    });
  }
  
  saveEdit() {
    this.console.log(`saveEdit() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.swapFile())
      .then(() => {
        let form = JSON.parse(JSON.stringify(this.vue.ui.slider.slider.form));
        let edit = JSON.parse(JSON.stringify(this.vue.ui.slider.slider.editor));
        this.console.log(`edit:`, edit);
        if(form.meta && edit.metadata) {
          form.meta = JSON.parse(edit.metadata);
          delete edit.metadata;
        }
        this.console.log(`original form:`, this.vue.ui.slider.form);
        this.console.log(`copy form:`, this.vue.ui.slider.slider.form);
        this.console.log(`form:`, form);
        Object.keys(edit).forEach(key => {
          form.children.find(e => e.name == key).base64 = btoa(edit[key])
        });
        this.console.log(`last form:`, form);
        return form;
      })
      .then((form) => this.upload(form))
      .then(() => resolve())
      .catch((err) => reject(err));
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
    return new Promise((resolve, reject) => {
      Promise.resolve()
      .then(() => this.api.restCall(`put`, `/api/service/scripts`, schema))
      .then(() => resolve())
      .catch((err) => reject(err));
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