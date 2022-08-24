/* eslint-disable no-undef */
export default class ExtensionRTCPageController {
  constructor(extension) {
    this.extension = extension;
    this.console = this.extension.console;
    // this.init();
  }

  init() {
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
    return new Promise((resolve, reject) => {
      const id = `${this.extension.schema.extension.html}-rtc-overlay`;
      this.console.log(`id : ${id}`);

      this.vue = new Vue({
        el: `#${id}`,
        // "components": {
        //   vueTagsInput
        // },
        data: {
          // Loader
          // loader: this.extension.schema,
          // Resource
          resource: {
            config: null,
          },
          // UI
          ui: {
            loading: false,
            active: false,
          },
          // Function
          fn: {
            switchToggle: () => {},
          },
        },
        methods: {},
      });

      //  Setup vue function.
      this.vue.fn = {
        switchToggle: () => {
          this.vue.ui.active = !this.vue.ui.active;
        },
      };
      this.console.log(this.vue);
      resolve();
    });
  }
}
