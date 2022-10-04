/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable class-methods-use-this */
const Path = require(`path`);

const Service = require(`../service-template/service`);
// const Database = require(`../../lib/my-database`);
// const { Defaults, Errors } = require(`../../../constants/constants`);

class ScriptsService extends Service {
  constructor(extension, config, id) {
    console.log(`ScriptsService: contructor() >> `);
    super(extension, config, id);
  }

  init(config) {
    console.log(`ScriptsService: init() >> `);
    return new Promise((resolve) => {
      this.config = config || this.config;
      resolve();
    });
  }

  start() {
    console.log(`ScriptsService: start() >> `);
    return new Promise((resolve) => {
      // await this.initScript();
      resolve();
    });
  }

  create(schema, parentPath) {
    /*
      "schema" should be : 
      {
        "path": "string",
        "name": "string",
        "type": "string",
        "meta": {
          "title": "string",
          "description": "string",
          "tags": ["string"]
        }
        "children": [
          {
            "path": "string",
            "name": "string",
            "type": "string",
            "base64": "string"
          }
        ]
      }
    */

    console.log(`ScriptsService: create(${schema.name}) >> `);
    return new Promise((resolve) => {
      const path = parentPath || ``;
      if (schema.meta) {
        schema.children.push({
          name: "metadata.js",
          type: "file",
          base64: this.base64Encode(this.initialMeta(schema.meta)),
        });
      }
      Object.keys(schema.children).reduce((prevProm, i) => {
        return prevProm.then(() => {
          if (schema.children[i].type === `file`)
            return this.createFile(
              Path.join(path, schema.name, schema.children[i].name),
              schema.children[i].base64
            );
          if (schema.children[i].type === `directory`)
            return this.create(
              schema.children[i],
              Path.join(path, schema.name)
            );
          console.warn(`Type '${schema.children[i].type}' not support!!!`);
          return undefined;
        });
      }, Promise.resolve());
      // Object.keys(schema.children).forEach((i) => {
      //   if (schema.children[i].type == `file`)
      //     await this.createFile(
      //       Path.join(path, schema.name, schema.children[i].name),
      //       schema.children[i].base64
      //     );
      //   else if (schema.children[i].type == `directory`)
      //     await this.create(
      //       schema.children[i],
      //       Path.join(path, schema.name)
      //     );
      //   else console.warn(`Type '${schema.children[i].type}' not support!!!`);
      // });
      resolve({});
    });
  }

  createFile(path, raw) {
    console.log(`ScriptsService: createFile() >> `);
    // console.log(`schema : ${JSON.stringify(schema, null, 2)}`);
    return new Promise((resolve, reject) => {
      let data;
      Promise.resolve()
        .then(() => {
          data = this.base64Decode(raw);
          console.log(`create file : ${path}`);
        })
        .then(() => this.writeFile(path, data))
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  delete(name) {
    console.log(`ScriptsService: delete(${name}) >> `);
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => this.get(name, { deep: true }))
        .then((script) => {
          if (!script) throw new Error(`Directory not found!!!`);
          return this.directory.delete(script.path);
        })
        .then(() => resolve({}))
        .catch((err) => reject(err));
    });
  }

  get(name, options) {
    console.log(`[${this.constructor.name}]`, `get(${name || ``})`);
    return new Promise((resolve, reject) => {
      // const serviceSchema = this.getSchema();
      const serviceConfig = this.getConfig();
      const opttmp = options ? JSON.parse(JSON.stringify(options)) : {};
      opttmp.object = false;
      let scriptList;
      Promise.resolve()
        .then(() => this.directory.getSchema(serviceConfig.directory, opttmp))
        .then((slist) => {
          scriptList = slist.children;
          // console.log(`directory: ${serviceSchema.directory}`);
        })
        .then(() => {
          if (name) {
            const script = scriptList.find((elem) => elem.name === name);
            Promise.resolve()
              .then(() => this.directory.getSchema(script.path, options))
              .then((sDirSchema) => {
                const scriptDirSchema = sDirSchema;
                if (!scriptDirSchema) resolve(undefined);
                else {
                  // let script = JSON.parse(JSON.stringify(script));
                  const meta = scriptDirSchema.children.find(
                    (elem) => elem.name === `metadata.js`
                  );
                  scriptDirSchema.children = scriptDirSchema.children.filter(
                    (elem) => elem.name !== `metadata.js`
                  );
                  // let path = Path.join(__dirname, script.path.replace(/^\//, ``), `metadata.js`);
                  const path = Path.join(
                    __dirname,
                    scriptDirSchema.path,
                    `metadata.js`
                  );
                  if (require.cache[require.resolve(path)])
                    delete require.cache[require.resolve(path)];
                  scriptDirSchema.meta = meta
                    ? JSON.parse(JSON.stringify(require(path)))
                    : {};
                  resolve(scriptDirSchema);
                }
              });
          } else {
            const result = [];
            Promise.resolve()
              .then(() =>
                Object.keys(scriptList).reduce((prevProm, i) => {
                  return prevProm
                    .then(() => this.get(scriptList[i].name, options))
                    .then((script) => result.push(script));
                }, Promise.resolve())
              )
              .then(() => resolve(result))
              .catch((err) => reject(err));
          }
        })
        .catch((err) => reject(err));
    });
  }

  initialMeta(schema) {
    const str = `
      const meta = ${JSON.stringify(schema)};
      module.exports = meta;
    `;
    return str;
  }
}

module.exports = ScriptsService;
