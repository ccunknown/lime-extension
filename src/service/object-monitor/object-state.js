const ObjectState = {
  start: {
    ENABLE: `enable`,
    DISABLE: `disable`,
  },
  status: {
    UNLOAD: `unload`,
    RUNNING: `running`,
    STOPPED: `stopped`,
  },
  detail: {
    UNDEFINED: `undefined`,
    FINE: `fine`,
    MIXED: `mixed`,
    FAIL: `fail`,
  },
};

module.exports = ObjectState;
