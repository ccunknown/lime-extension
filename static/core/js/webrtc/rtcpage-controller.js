/* eslint-disable class-methods-use-this */
/* eslint-disable no-bitwise */
const MAX_LOG_KEEP = 1000;
/* eslint-disable no-undef */
export default class ExtensionRTCPageController {
  constructor(extension) {
    this.extension = extension;
    this.console = this.extension.console;

    this.event = document.createDocumentFragment();
    this.addEventListener = this.event.addEventListener;
    this.dispatchEvent = this.event.dispatchEvent;
    this.coloring = new LimeExtensionRTCColoringTool();
  }

  init() {
    this.console.trace(`init()`);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.initVue())
        .then(() => this.initVueHandling())
        .then(() => this.initFunction())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  initVue() {
    this.console.trace(`initVue()`);
    const id = `${this.extension.schema.extension.html}-rtc-overlay`;
    this.console.log(`id : ${id}`);

    this.vue = new Vue({
      el: `#${id}`,
      data: {
        // Resource
        resource: {
          logList: [],
          newLogList: [],
          subscribeList: [],
          quickSubscribeList: [
            { title: `All`, topic: `/.*` },
            { title: `Devices`, topic: `/service/devices-service/.*` },
            { title: `Engines`, topic: `/service/engines-service/.*` },
            { title: `Ports`, topic: `/service/sysport-service/.*` },
          ],
          cmdInput: ``,
        },
        // UI
        ui: {
          loading: false,
          active: false,
          play: true,
        },
        // Function
        fn: {
          switchToggle: () => {},
          addSubscribe: () => {},
          removeSubscribe: () => {},
          consolePlay: () => {},
          consolePause: () => {},
        },
      },
      methods: {},
    });

    //  Setup vue function.
    this.vue.fn = {
      switchToggle: () => {
        this.vue.ui.active = !this.vue.ui.active;
      },
      addSubscribe: (
        subscribe = this.vue.resource.cmdInput.length
          ? `${this.vue.resource.cmdInput}`
          : `/.*`
      ) => this.addSubscribe(subscribe),
      removeSubscribe: (item) => this.removeSubscribe(item),
      consolePlayToggle: () => {
        this.vue.ui.play = !this.vue.ui.play;
        this.console.log(`change play state to:`, this.vue.ui.play);
      },
      consoleClear: () => {
        this.vue.resource.logList = [];
        document.getElementById(
          `contents-rtcoverlay-console-display`
        ).innerHTML = ``;
        this.console.log(`clear console:`, this.vue.resource.logList);
      },
    };
    this.console.log(this.vue);
  }

  initVueHandling() {
    // addSubscribe event.
    this.event.addEventListener(`addSubscribe`, (e) => {
      const topic = e.detail;
      if (!this.vue.resource.subscribeList.includes(topic)) {
        this.vue.resource.cmdInput = ``;
        this.vue.resource.subscribeList.push(topic);
      }
    });

    // removeSubscribe event.
    this.event.addEventListener(`removeSubscribe`, (e) => {
      const topic = e.detail;
      if (topic) {
        const index = this.vue.resource.subscribeList.indexOf(topic);
        if (index !== -1) {
          this.vue.resource.subscribeList.splice(index, 1);
        }
      } else {
        this.vue.resource.subscribeList = [];
      }
    });
  }

  initFunction() {
    const consoleDisplay = document.getElementById(
      `contents-rtcoverlay-console-display`
    );

    const pageScroll = () => {
      const gap =
        consoleDisplay.scrollHeight -
        consoleDisplay.scrollTop -
        consoleDisplay.clientHeight;
      const scrollLength = Math.ceil(Math.min(gap / 100.0, 100));
      consoleDisplay.scrollBy(0, scrollLength);
      const delay = Math.ceil(100.0 / Math.max(gap, 10));
      this.scroller = setTimeout(pageScroll, delay);
    };
    consoleDisplay.addEventListener(`wheel`, (event) => {
      if (event.deltaY < 0) {
        this.console.log(`scrolling up`);
        clearTimeout(this.scroller);
        this.scroller = null;
      } else if (
        Math.abs(
          consoleDisplay.scrollHeight -
            consoleDisplay.scrollTop -
            consoleDisplay.clientHeight
        ) === 0
      ) {
        this.console.log(`bottom wheel`);
        if (!this.scroller) this.scroller = setTimeout(pageScroll, 10);
      }
    });
    pageScroll();
  }

  addSubscribe(topic, callback) {
    this.console.log(`addSubscribe(${topic || ``}) >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() =>
          this.extension.rtcpeer.addSubscribe(
            topic,
            callback || this.subscribeCallback.bind(this)
          )
        )
        .then(() =>
          callback
            ? {}
            : this.event.dispatchEvent(
                new CustomEvent(`addSubscribe`, { detail: topic })
              )
        )
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  removeSubscribe(topic) {
    this.console.log(`removeSubscribe(${topic || ``}) >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.extension.rtcpeer.removeSubscribe(topic))
        .then(() =>
          this.event.dispatchEvent(
            new CustomEvent(`removeSubscribe`, { detail: topic })
          )
        )
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  subscribeCallback(...args) {
    this.console.log(`subscribeCallback`, ...args);
    if (!this.vue.ui.play) return;
    const myArgs = [...args];
    const topic = myArgs[0];
    const timestamp =
      new Date(myArgs[1].timestamp).toISOString() || `undefined`;
    const level = myArgs[1].level || `log`;
    const jid = this.getLogJID(myArgs[1].message);
    const message = this.getLogWithoutJID(myArgs[1].message || ``);
    const log = {
      timestamp,
      raw: myArgs,
      cooked: {
        topic,
        idColor: this.coloring.idStyleColoring(topic),
        jid,
        jidColor: this.coloring.idStyleColoring(jid),
        level,
        levelColor: this.coloring.logLevelColoring(level),
        message: this.getLogWithoutJID(message),
      },
    };
    this.console.log(`log`, log);
    this.vue.resource.logList.push(log);
    this.addLogToView(log);
    while (this.vue.resource.logList.length > MAX_LOG_KEEP) {
      this.vue.resource.logList.shift();
      // Remove manually from dom.
      const queue = document.getElementById(
        `contents-rtcoverlay-console-display`
      );
      const elements = queue.getElementsByTagName(`div`);
      queue.removeChild(elements[0]);
    }
  }

  addLogToView(log) {
    const htmlString = `
      <div class="d-flex flex-row mb-1">
        <!-- Timestamp -->
        <span class="bg-dark">${log.timestamp}</span>
        &nbsp;:&nbsp;
        <!-- Object ID -->
        <span
          class="text-truncate"
          style="
            width: 200px;
            min-width: 200px;
            direction: rtl;
            background-color: ${log.cooked.idColor.backgroundColor};
          "
          data-toggle="tooltop"
          title="${log.cooked.topic}"
        >
          ${this.escapeHtml(log.cooked.topic)}
        </span>
        &nbsp;
        <!-- Job ID -->
        <span
          style="
            background-color: ${log.cooked.jidColor.backgroundColor};
          "
        >
          ${this.escapeHtml(log.cooked.jid)}
        </span>
        &nbsp;
        <!-- Log Message -->
        <span
          style="color: ${log.cooked.levelColor.color};"
        >
          ${this.escapeHtml(log.cooked.message)}
        </span>
      </div>
    `;
    document
      .getElementById(`contents-rtcoverlay-console-display`)
      .appendChild(this.createElementFromHTML(htmlString));
  }

  createElementFromHTML(htmlString) {
    const div = document.createElement(`div`);
    div.innerHTML = htmlString.trim();
    // Change this to div.childNodes to support multiple top-level nodes.
    return div.firstChild;
  }

  escapeHtml(unsafe) {
    return unsafe
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  getLogJID(log) {
    const idStr = log.match(/\[JID:([^\]]*)\]/);
    if (idStr && idStr[1]) return idStr[1];
    return ``;
  }

  getLogLevel(log) {
    const idStr = log.match(/\[([a-z]+)\]:/);
    if (idStr && idStr[1]) return idStr[1];
    return ``;
  }

  getLogWithoutJID(log) {
    const regex = /\[JID:[^\]]+\] ?/g;
    return log.replaceAll(regex, ``);
  }

  getLogWithoutLevel(log) {
    const regex = /\[[^\]]+\]: ?/g;
    return log.replaceAll(regex, ``);
  }
}
