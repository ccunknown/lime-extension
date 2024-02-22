/* eslint-disable no-bitwise */
export default class LimeExtensionRTCColoringTool {
  // constructor() {}

  // eslint-disable-next-line class-methods-use-this
  logLevelColoring(level) {
    let color = `white`;
    switch (level) {
      case `error`:
        color = `red`;
        break;
      case `warn`:
        color = `yellow`;
        break;
      case `info`:
        color = `cyan`;
        break;
      default:
        color = `white`;
        break;
    }
    return {
      color,
    };
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
}
