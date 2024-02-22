class SysportOperator {
  constructor(parent) {
    this.parent = parent;
  }

  getSchema() {
    return this.parent.config;
  }
}

module.exports = SysportOperator;
