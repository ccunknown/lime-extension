'use strict';

const limeExtension = require('./src/lime-extension');

module.exports = (addonManager) => {
  new limeExtension(addonManager);
};
