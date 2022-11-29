const limeExtension = require(`./src/lime-extension`);

module.exports = (addonManager) => {
  // eslint-disable-next-line no-new, new-cap
  new limeExtension(addonManager);
};
