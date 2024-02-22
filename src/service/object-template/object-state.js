const ObjectServiceState = {
  config: {
    UNAVAILABLE: { value: `unavailable`, level: 0 },
    INVALID: { value: `invalid`, level: 0 },
    VALID: { value: `valid`, level: 100 },
  },
  enable: {
    DISABLE: { value: false, level: 0 },
    ENABLE: { value: true, level: 100 },
  },
  inServiceList: {
    NOTINSERVICE: { value: false, level: 0 },
    INSERVICE: { value: true, level: 100 },
  },
};

const ObjectState = {
  UNLOAD: { value: `unload`, level: 0 },
  PENDING: { value: `pending`, level: 50 },
  RUNNING: { value: `running`, level: 100 },
  STOPPED: { value: `stopped`, level: 50 },
  MAXPENDING: { value: `max-pending`, level: 0 },
};

const ObjectActivity = {
  IDLE: { value: `idle`, level: 100 },
  ACTIVE: { value: `active`, level: 100 },
};

module.exports = {
  ObjectServiceState,
  ObjectState,
  ObjectActivity,
};
