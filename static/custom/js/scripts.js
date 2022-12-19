/* eslint-disable no-undef */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
export default class PageScripts {
  constructor(extension) {
    this.extension = extension;
    this.console = this.extension.console;
    this.api = this.extension.api;
    this.ui = this.extension.ui;
    this.urlPrefix = this.extension.loader.define[`url-prefix`];
  }

  init(/* config */) {
    this.console.trace(`init()`);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.initVue())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  initVue() {
    this.console.trace(`initVue()`);
    const id = this.ui.said(`content.scripts.section`);
    this.console.log(`id : ${id}`);

    // eslint-disable-next-line no-undef
    this.vue = new Vue({
      el: `#${id}`,
      // "components": {
      //   vueTagsInput
      // },
      data: {
        /* Loader */
        loader: this.extension.schema,
        /* Resource */
        resource: {
          config: { directory: null, list: [] },
          schema: {},
          scripts: [],
        },
        /* UI */
        ui: {
          current: {
            slider: {
              name: null,
            },
          },
          slider: {
            hide: true,
            ready: false,
            edit: true,
            form: {},
            slider: {
              fname: null,
              hide: true,
              ready: false,
              current: null, // Current edit file name.
              editor: {
                // fname: content
              },
            },
          },
          base: {
            ready: false,
          },
          tag: "",
        },
        /* Function */
        fn: {
          add: () => {},
          view: () => {},
          remove: () => {},
          save: () => {},
          download: () => {},
          renderBase: () => {},
          renderSlider: () => {},
          onSelectFile: () => {},
          removeFile: () => {},
          addTag: () => {},
          getTag: () => {},
          clearTag: () => {},
          renderSlide2: () => {},
          swapFile: () => {},
          save2: () => {},
        },
      },
      methods: {},
    });

    //  Setup vue function.
    this.vue.fn = {
      add: async () => {
        this.renderSlider();
      },
      view: (name) => {
        this.console.log(`view(${name})`);
        if (name) this.vue.ui.current.slider.name = name;
        this.renderSlider(name || undefined);
      },
      remove: (name) => {
        this.console.log(`delete(${name})`);
        return new Promise((resolve, reject) => {
          // eslint-disable-next-line no-undef, no-alert, no-restricted-globals
          const conf = confirm(`Confirm to delete script "${name}"!`);
          if (conf) {
            this.vue.ui.base.ready = false;
            Promise.resolve()
              .then(() => this.deleteScript(name))
              .then((res) => this.console.log(res))
              .then(() => this.render())
              .then(() => {
                this.vue.ui.base.ready = true;
              })
              .then(() => resolve())
              .catch((err) => reject(err));
          } else {
            resolve();
          }
        });
      },
      save: () => {
        this.console.log(`save()`);
        return new Promise((resolve, reject) => {
          Promise.resolve()
            .then(() => {
              this.vue.ui.slider.ready = false;
            })
            .then(() => {
              const tags = this.vue.fn.getTag();
              const result = JSON.parse(
                JSON.stringify(this.vue.ui.slider.form)
              );
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
      download: (name) => {
        const file = this.vue.ui.slider.form.children.find(
          (elem) => elem.name === name
        );
        if (file) this.download(file.name, atob(file.base64));
      },
      renderBase: () => {
        this.render();
      },
      renderSlider: () => {
        this.render(false);
      },
      onSelectFile: (event) => {
        return new Promise((resolve, reject) => {
          const { files } = event.target;
          this.console.log(`files:`, files);
          Object.values(files)
            .reduce((prevProm, file) => {
              return prevProm
                .then(() => {
                  this.console.log(file);
                  this.vue.ui.slider.form.children.push({
                    name: file.name,
                    type: "file",
                  });
                })
                .then(() => this.readFile(file))
                .then((res) => {
                  const result = btoa(res);
                  this.vue.ui.slider.form.children =
                    this.vue.ui.slider.form.children.filter(
                      (elem) => elem.name !== file.name
                    );
                  this.vue.ui.slider.form.children.push({
                    name: file.name,
                    type: `file`,
                    base64: result,
                  });
                })
                .catch((err) => this.console.error(err));
            }, Promise.resolve())
            .then(() => resolve())
            .catch((err) => reject(err));
          // Object.values(files).forEach((file) => {
          //   this.console.log(file);
          //   this.vue.ui.slider.form.children.push({
          //     name: file.name,
          //     type: "file",
          //   });
          //   this.readFile(file).then((res) => {
          //     const result = btoa(res);
          //     this.vue.ui.slider.form.children =
          //       this.vue.ui.slider.form.children.filter(
          //         (elem) => elem.name !== file.name
          //       );
          //     this.vue.ui.slider.form.children.push({
          //       name: file.name,
          //       type: `file`,
          //       base64: result,
          //     });
          //   });
          // });
          // resolve();
        });
      },
      removeFile: (name) => {
        this.console.log(`removeFile(${name})`);
        this.vue.ui.slider.form.children =
          this.vue.ui.slider.form.children.filter((elem) => elem.name !== name);
      },
      addTag: (name) => {
        if (
          !this.vue.ui.slider.form.meta.tags.find((elem) => name === elem.text)
        )
          this.vue.ui.slider.form.meta.tags.push({
            text: name,
            tiClasses: ["ti-valid"],
          });
      },
      getTag: () => {
        return this.vue.ui.slider.form.meta.tags.map((elem) => elem.text);
      },
      clearTag: () => {
        this.vue.ui.slider.form.meta.tags = [];
      },
      renderSlider2: (fname) => {
        this.renderSlider2(fname);
      },
      swapFile: (fname) => {
        this.console.log(`swapCaller() >> `);
        this.swapFile(fname);
      },
      save2: () => {
        return new Promise((resolve, reject) => {
          Promise.resolve()
            .then(() => this.saveEdit())
            // .then(() => this.render(false))
            .then(() =>
              this.renderSlider(this.vue.ui.current.slider.name, true)
            )
            .then(() => resolve())
            .catch((err) => reject(err));
        });
      },
    };

    this.console.log(this.vue);
  }

  render(base = true) {
    this.console.log(`render()`);
    return new Promise((resolve, reject) => {
      this.console.trace(`render()`);
      Promise.resolve()
        .then(() => this.getSchema())
        .then((schema) => {
          this.vue.resource.schema = schema;
        })
        .then(() => (base ? this.renderBase() : this.renderSlider()))
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
          this.vue.ui.base.ready = false;
          this.vue.ui.slider.hide = true;
          this.vue.ui.slider.slider.hide = true;
        })
        .then(() => this.getConfig())
        .then((config) => {
          this.vue.resource.config = config;
        })
        .then(() => this.getScript())
        .then((scripts) => {
          this.vue.resource.scripts = scripts;
        })
        .then(() => resolve())
        .catch((err) => reject(err))
        .finally(() => {
          this.vue.ui.base.ready = true;
        });

      // let config = await this.getConfig();
      // this.vue.resource.config = config;
      // let scripts = await this.getScript();
      // this.vue.resource.scripts = scripts;

      // this.vue.ui.base.ready = true;
      // resolve();
    });
  }

  renderSlider(name, renew = false) {
    this.console.log(`renderSlider()`);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => {
          this.vue.ui.slider.ready = false;
          this.vue.ui.slider.hide = false;
          this.vue.ui.slider.slider.hide = true;
        })
        .then(() => renew && this.getSchema())
        .then((schema) => {
          if (renew) this.vue.resource.schema = schema;
        })
        .then(() => {
          const shortSchema = this.ui.shortJsonElement(
            this.vue.resource.schema,
            `[^\n]+`
          );
          this.console.log(`schema:`, this.vue.resource.schema);
          this.console.log(`shortSchema:`, shortSchema);
          this.vue.ui.slider.form = this.ui.generateData(shortSchema);
        })
        .then(() => this.renderForm(name))
        .then(() => resolve())
        .catch((err) => reject(err))
        .finally(() => {
          this.vue.ui.slider.ready = true;
        });
    });
  }

  renderForm(name) {
    this.console.log(`PageScripts: renderVueAddForm(${name}) >> `);
    return new Promise((resolve, reject) => {
      if (name) {
        this.vue.ui.slider.edit = false;
        Promise.all([this.getConfig(), this.getScript(name)])
          .then(([config, script]) => {
            this.vue.resource.config = config;
            // let script = promArr[1];
            const tags =
              script.meta && script.meta.tags ? script.meta.tags : [];

            this.vue.ui.slider.form = script;
            this.vue.fn.clearTag();
            tags.forEach((tag) => this.vue.fn.addTag(tag));

            this.console.log(this.vue.ui.slider.form);
          })
          .then(() => resolve())
          .catch((err) => reject(err));
      } else {
        this.vue.ui.slider.edit = true;
        const schema = this.ui.shortJsonElement(this.vue.resource.schema, `.+`);
        this.vue.ui.slider.form = this.ui.generateData(schema);
        this.vue.ui.slider.form.children = [];
        resolve();
      }
    });
  }

  /*
    Editor tool.
  */
  renderSlider2() {
    this.console.log(`PageScripts: renderSlider2() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => {
          this.vue.ui.slider.slider.ready = false;
          this.vue.ui.slider.slider.hide = false;
          this.vue.ui.slider.slider.current = null;
        })
        // Translate file from `this.vue.ui.slider.form` to `this.vue.ui.slider.slider.editor`.
        .then(() => {
          // Clear editor.
          this.vue.ui.slider.slider.editor = {};
          // Initial meta file.
          if (this.vue.ui.slider.form.meta) {
            this.console.log(`meta:`, this.vue.ui.slider.form.meta);
            const meta = JSON.parse(
              JSON.stringify(this.vue.ui.slider.form.meta)
            );
            meta.tags = this.vue.fn.getTag();
            this.vue.ui.slider.slider.editor.metadata = JSON.stringify(
              meta,
              null,
              2
            );
          }
          // Initial script files.
          this.vue.ui.slider.form.children.forEach((child) => {
            this.vue.ui.slider.slider.editor[child.name] = atob(child.base64);
          });
          this.console.log(`child:`, this.vue.ui.slider.slider.editor);
        })
        .then((text = ``) =>
          this.editor ? this.editor.setValue(text) : this.initEditor(text)
        )
        // Click first file.
        .then(() => {
          // eslint-disable-next-line no-undef
          const { children } = document.getElementById(
            `extension-lime-content-scripts-slider-slider-file-bar`
          );
          if (children.length) children[0].click();
        })
        .then(() => resolve())
        .catch((err) => reject(err))
        .finally(() => {
          this.vue.ui.slider.slider.ready = true;
        });
    });
  }

  initEditor(text = ``) {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() =>
          this.loadJsScriptSync(
            `${this.urlPrefix}/static/resource/js/require.min.js`
          )
        )
        .then(() => {
          require.config({
            paths: { vs: `${this.urlPrefix}/static/resource/monaco/min/vs` },
          });
          window.MonacoEnvironment = { getWorkerUrl: () => proxy };
          let proxy = URL.createObjectURL(
            new Blob(
              [
                `
                  self.MonacoEnvironment = {
                    baseUrl: '${window.location.origin}${this.urlPrefix}/static/resource/monaco/min/'
                  };
                  importScripts('${window.location.origin}${this.urlPrefix}/static/resource/monaco/min/vs/base/worker/workerMain.js');
                `,
              ],
              { type: "text/javascript" }
            )
          );
        })
        .then(() =>
          require(["vs/editor/editor.main"], (monaco) => {
            this.editor = monaco.editor.create(
              // eslint-disable-next-line no-undef
              document.getElementById(
                "extension-lime-content-scripts-slider-slider-monaco-container"
              ),
              {
                value: text,
                language: "javascript",
                theme: "vs-dark",
                automaticLayout: true,
              }
            );
          })
        )
        .then(() => this.waitForEditorReady())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  // eslint-disable-next-line class-methods-use-this
  loadJsScriptSync(src) {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line no-undef
      const s = document.createElement(`script`);
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

      // eslint-disable-next-line no-undef
      document.getElementsByTagName("head")[0].appendChild(s);
    });
  }

  waitForEditorReady() {
    return new Promise((resolve) => {
      const fn = () => {
        if (this.editor) resolve();
        else setTimeout(fn, 100);
      };
      fn();
    });
  }

  swapFile(fname) {
    if (!this.editor) return;
    // Keep old value.
    if (this.vue.ui.slider.slider.current) {
      this.vue.ui.slider.slider.editor[this.vue.ui.slider.slider.current] =
        this.editor.getValue();
    }
    // Set new value.
    if (fname) this.editor.setValue(this.vue.ui.slider.slider.editor[fname]);
    if (fname) this.vue.ui.slider.slider.current = fname;
    // Reset scroll position.
    this.editor.setScrollPosition({ scrollTop: 0 });

    // Change language.
    this.changeEditorLang(fname === `metadata` ? `json` : `javascript`);
  }

  changeEditorLang(lang) {
    if (!this.editor) return;
    // eslint-disable-next-line no-undef
    monaco.editor.setModelLanguage(this.editor.getModel(), lang);
  }

  saveEdit() {
    this.console.log(`saveEdit() >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.swapFile())
        .then(() => {
          const form = JSON.parse(JSON.stringify(this.vue.ui.slider.form));
          const edit = JSON.parse(
            JSON.stringify(this.vue.ui.slider.slider.editor)
          );
          if (form.meta && edit.metadata) {
            form.meta = JSON.parse(edit.metadata);
            delete edit.metadata;
          }
          Object.keys(edit).forEach((key) => {
            form.children.find((e) => e.name === key).base64 = btoa(edit[key]);
          });
          this.console.log(`last form:`, form);
          return form;
        })
        .then((form) => this.upload(form))
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  /*
    API Function.
  */

  getConfig() {
    this.console.log(`getConfig()`);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.api.getConfig())
        .then((conf) => conf[`service-config`][`scripts-service`])
        // .then((config) => resolve(config[`service-config`][`scripts-service`]));
        .then((conf) => resolve(conf))
        .catch((err) => reject(err));
    });
  }

  getSchema() {
    this.console.log(`getSchema()`);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.api.getSchema())
        .then((schema) =>
          resolve(
            schema.properties[`service-config`].properties[`scripts-service`]
          )
        )
        .catch((err) => reject(err));
    });
  }

  getScript(name) {
    this.console.log(`getScript(${name || ``})`);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() =>
          this.api.restCall(
            `get`,
            `/api/service/scripts${name ? `/${name}` : ``}`
          )
        )
        .then((scripts) => resolve(scripts))
        .catch((err) => reject(err));
      // let scripts = await this.api.restCall(
      //   `get`,
      //   `/api/service/scripts${name ? `/${name}` : ``}`
      // );
      // resolve(scripts);
    });
  }

  deleteScript(name) {
    this.console.log(`deleteScript(${name})`);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.api.restCall(`delete`, `/api/service/scripts/${name}`))
        .then((res) => resolve(res))
        .catch((err) => reject(err));
      // let res = await this.api.restCall(
      //   `delete`,
      //   `/api/service/scripts/${name}`
      // );
      // resolve(res);
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

  // eslint-disable-next-line class-methods-use-this
  download(filename, text) {
    // eslint-disable-next-line no-undef
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`
    );
    element.setAttribute("download", filename);

    element.style.display = "none";
    // eslint-disable-next-line no-undef
    document.body.appendChild(element);

    element.click();

    // eslint-disable-next-line no-undef
    document.body.removeChild(element);
  }

  // eslint-disable-next-line class-methods-use-this
  readFile(file) {
    return new Promise((resolve, reject) => {
      try {
        // eslint-disable-next-line no-undef
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target.result);
        };
        reader.readAsText(file);
      } catch (err) {
        reject(err);
      }
    });
  }
}
