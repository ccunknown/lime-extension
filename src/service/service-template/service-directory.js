const Path = require(`path`);
const fs = require(`fs`);
const rimraf = require(`rimraf`);

class ServiceDirectory {
  constructor(serviceDir) {
    // this.parent = parent;
    this.serviceDir = serviceDir;
  }

  getRoot() {
    const split = __dirname.split(`/`);
    split.pop();
    split.pop();
    split.pop();
    return split.join(`/`);
  }

  /*
    options: {
      base64: boolean,
      deep: boolean,
      absolute: `string (absolute path)`,
      object: boolean
    }
  */
  getSchema(dirPath, options) {
    // console.log(`[${this.constructor.name}]`, `dirPath:`, dirPath);
    try {
      const path = Path.join(``, dirPath);
      const fpath =
        options && options.absolute
          ? Path.join(options.absolute, path)
          : Path.join(this.serviceDir, path);
      const stats = fs.lstatSync(fpath);
      const info = {
        path: Path.join(``, path),
        name: Path.basename(path),
      };
      if (stats.isDirectory()) {
        info.type = `directory`;
        if (options && options.deep) {
          const children = fs.readdirSync(fpath);
          info.children = [];
          Object.values(children).forEach((val) => {
            info.children.push(this.getSchema(Path.join(path, val), options));
          });
        }
      } else {
        info.type = `file`;
        if (options && options.base64) {
          const str = fs.readFileSync(fpath);
          info.base64 = this.base64Encode(str);
        }
        if (options && options.object) {
          const p = `/${fpath.replace(/^\//, ``)}`;
          if (require.cache[require.resolve(p)])
            delete require.cache[require.resolve(p)];
          // eslint-disable-next-line import/no-dynamic-require, global-require
          info.object = require(p);
        }
      }
      return info;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  readFile(path, encoding) {
    return new Promise((resolve, reject) => {
      const p = path.startsWith(`/`) ? Path.join(this.serviceDir, path) : path;
      const e = encoding || `utf8`;
      fs.readFile(p, e, (err, data) => (err ? reject(err) : resolve(data)));
    });
  }

  writeFile(_path, data, _encoding) {
    return new Promise((resolve, reject) => {
      const encoding = _encoding || `utf8`;
      const path = Path.join(this.serviceDir, _path);
      const dir = path.replace(/[^/]+$/g, ``);
      console.log(`dir : ${dir}`);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      fs.writeFile(path, data, encoding, (err) =>
        err ? reject(err) : resolve()
      );
    });
  }

  delete(dirPath) {
    return new Promise((resolve, reject) => {
      const path = dirPath.startsWith(`/`)
        ? Path.join(this.serviceDir, dirPath)
        : dirPath;
      console.log(`delete(${path})`);
      rimraf(path, (err) => (err ? reject(err) : resolve({})));
    });
  }

  // eslint-disable-next-line class-methods-use-this
  base64Encode(data) {
    const buff = Buffer.from(data);
    const base64 = buff.toString(`base64`);
    return base64;
  }

  // eslint-disable-next-line class-methods-use-this
  base64Decode(data, encoding) {
    const buff = Buffer.from(data, `base64`);
    const result = buff.toString(encoding || `utf8`);
    return result;
  }
}

module.exports = ServiceDirectory;
