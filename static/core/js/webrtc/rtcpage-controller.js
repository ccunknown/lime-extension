/* eslint-disable class-methods-use-this */
/* eslint-disable no-bitwise */
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
        .then(() => this.initFunction())
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  initVue() {
    this.console.trace(`initVue()`);
    return new Promise((resolve) => {
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

  initFunction() {
    const consoleDisplay = document.getElementById(
      `contents-rtcoverlay-console-display`
    );
    // consoleDisplay.scrollIntoView({
    //   behavior: "smooth",
    //   block: "end",
    //   inline: "nearest",
    // });
    // let middleScrollCount = 0;
    // consoleDisplay.addEventListener(`scroll`, (event) => {
    //   const element = event.target;
    //   const pageScroll = () => {
    //     element.scrollBy(0, 1);
    //     this.scroller = setTimeout(pageScroll, 10);
    //   };
    //   if (element.scrollHeight - element.scrollTop === element.clientHeight) {
    //     this.console.log(`bottom scrolled`);
    //     middleScrollCount = 0;
    //     if (!this.scroller) this.scroller = setTimeout(pageScroll, 10);
    //   } else {
    //     this.console.log(`middle scrolled`, middleScrollCount);
    //     middleScrollCount += 1;
    //     if (middleScrollCount > 20) {
    //       clearTimeout(this.scroller);
    //       this.scroller = null;
    //     }
    //   }
    // });

    const pageScroll = () => {
      consoleDisplay.scrollBy(0, 1);
      this.scroller = setTimeout(pageScroll, 10);
    };
    consoleDisplay.addEventListener(`wheel`, (event) => {
      // const element = event.target;
      if (event.deltaY < 0) {
        console.log('scrolling up');
        clearTimeout(this.scroller);
        this.scroller = null;
      } else if (
        Math.abs(
          consoleDisplay.scrollHeight -
            consoleDisplay.scrollTop -
            consoleDisplay.clientHeight
        ) <= 0
      ) {
        this.console.log(`bottom wheel`);
        if (!this.scroller) this.scroller = setTimeout(pageScroll, 10);
      }
      // else {
      //   this.console.log(`middle wheel ########################`);
      //   clearTimeout(this.scroller);
      //   this.scroller = null;
      // }
    });
    pageScroll();
  }

  idStyleColoring(eid) {
    const color = this.idColoring(eid);
    // this.console.log(`id:`, eid, color);
    return {
      backgroundColor: color,
    };
  }

  idColoring(eid) {
    let color = 0xdddddd;
    const h = this.hashCode(eid);
    // this.console.log(`hash:`, h);
    color = (h % 100) / 100.0;
    color = color < 0 ? color * -1 : color;

    // this.console.log(`coloring:`, color);
    const rgb = this.HSVtoRGB(color, 0.8, 0.6);
    // this.console.log(`coloring:`, rgb);
    const c = {
      r: rgb.r.toString(16).padStart(2, `0`),
      g: rgb.g.toString(16).padStart(2, `0`),
      b: rgb.b.toString(16).padStart(2, `0`),
    };
    return `#${c.r}${c.g}${c.b}`;
  }

  // eslint-disable-next-line class-methods-use-this
  hashCode(str) {
    let hash = 0;
    let i;
    let chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i += 1) {
      chr = str.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  // eslint-disable-next-line class-methods-use-this
  HSVtoRGB(hue, sat, val) {
    let h = hue;
    let s = sat;
    let v = val;
    if (arguments.length === 1) {
      s = hue.s;
      v = hue.v;
      h = hue.h;
    }
    // eslint-disable-next-line one-var
    let r, g, b;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    // eslint-disable-next-line default-case
    switch (i % 6) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      case 5:
        r = v;
        g = p;
        b = q;
        break;
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
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
    const myArgs = [...args];
    const id = myArgs[0];
    const jid = this.getLogJID(myArgs[1]);
    const log = {
      timestamp: new Date(),
      raw: myArgs,
      cooked: {
        id,
        idColor: this.idStyleColoring(id),
        jid,
        jidColor: this.idStyleColoring(jid),
        message: this.getLogWithoutJID(myArgs[1]),
      },
    };
    this.console.log(`log`, log);
    this.vue.resource.logList.push(log);
    while (this.vue.resource.logList.length > MAX_LOG_KEEP)
      this.vue.resource.logList.shift();
  }

  getLogJID(log) {
    const idStr = log.match(/\[JID:([^\]]*)\]/);
    if (idStr && idStr[1]) return idStr[1];
    return ``;
  }

  getLogWithoutJID(log) {
    const regex = /\[JID:[^\]]+\] ?/g;
    return log.replaceAll(regex, ``);
  }
}
