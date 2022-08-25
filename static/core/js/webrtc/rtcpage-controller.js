const MAX_LOG_KEEP = 1000;
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
            logList: [],
            subscribeList: [],
            cmdInput: ``,
          },
          // UI
          ui: {
            loading: false,
            active: false,
          },
          // Function
          fn: {
            switchToggle: () => {},
            addSubscribe: () => {},
            removeSubscribe: () => {},
          },
        },
        methods: {},
      });

      //  Setup vue function.
      this.vue.fn = {
        switchToggle: () => {
          this.vue.ui.active = !this.vue.ui.active;
        },
        addSubscribe: () => {
          const subscribe = `${this.vue.resource.cmdInput}`;
          this.console.log(subscribe);
          if (!this.vue.resource.subscribeList.includes(subscribe)) {
            this.vue.resource.subscribeList.push(subscribe);
            this.vue.resource.cmdInput = ``;
            this.addSubscribe(subscribe);
          }
        },
        removeSubscribe: (item) => {
          const index = this.vue.resource.subscribeList.indexOf(item);
          if (index !== -1) {
            this.vue.resource.subscribeList.splice(index, 1);
          }
        },
      };
      this.console.log(this.vue);
      resolve();
    });
  }

  addSubscribe(topic) {
    this.console.log(`topic:`, topic);
    this.extension.rtcpeer.addSubscribe(
      topic,
      this.subscribeCallback.bind(this)
    );
  }

  subscribeCallback(...args) {
    this.console.log(`subscribeCallback`, ...args);
    this.vue.resource.logList.push({
      timestamp: new Date(),
      message: [...args],
    });
    while (this.vue.resource.logList.length > MAX_LOG_KEEP)
      this.vue.resource.logList.shift();
  }
}
