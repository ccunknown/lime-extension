const ObjectState = {
  UNLOAD: `unload`,
  PENDING: `pending`,
  RUNNING: `running`,
  STOPPED: `stopped`,
  MAXSTARTRETIREMENT: `max-start-retirement`,
};

const ObjectActivity = {
  IDLE: `idle`,
  ACTIVE: `active`,
};

module.exports = {
  ObjectState,
  ObjectActivity,
};
