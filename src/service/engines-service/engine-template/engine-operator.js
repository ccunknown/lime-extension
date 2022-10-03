class EngineOperator {
  constructor(parent) {
    this.parent = parent;
  }

  init() {
    return Promise.resolve(this.parent.init());
  }

  getSchema() {
    return this.parent.config;
  }
}

module.exports = EngineOperator;
