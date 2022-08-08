let config = {
  device: {
    startRetry: {
      number: 2,
      delay: 60000
    }
  },
  property: {
    continuousFail: {
      max: 3
    }
  }
};

module.exports = config;