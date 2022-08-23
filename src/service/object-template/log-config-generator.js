const winston = require(`winston`);
require(`winston-daily-rotate-file`);

// const { combine, timestamp, label, printf } = winston.format;
const { combine, printf } = winston.format;

const defaultOptions = {
  console: true,
  files: [
    // {
    //   dirname: __dirname,
    //   filename: `history`,
    // },
  ],
};

const consoleLogFormat = printf(({ level, message, label }) => {
  return `[${level}]:[ID:${label}] ${message}`;
});

const fileLogFormat = printf(({ level, message }) => {
  return `${new Date().toISOString()} [${level}]: ${message}`;
});

const defaultFileOptions = {
  maxFiles: 10,
  maxSize: `10k`,
  datePattern: ``,
  format: fileLogFormat,
};

const generateConfig = (options = {}) => {
  const opt = JSON.parse(JSON.stringify(defaultOptions));
  Object.entries(options).forEach(([key, value]) => {
    opt[key] = value;
  });

  const config = {
    level: `info`,
    transports: [],
  };

  // If there are files array in opt then create file transport for each.
  if (
    Object.prototype.hasOwnProperty.call(opt, `files`) &&
    Array.isArray(opt.files)
  ) {
    opt.files.forEach((e) => {
      const fopt = { ...defaultFileOptions };
      Object.entries(e).forEach(([key, val]) => {
        if (key === `filename`) fopt.filename = `${val}.%DATE%.log`;
        else fopt[key] = val;
      });
      config.transports.push(new winston.transports.DailyRotateFile(fopt));
    });
  }

  // If console option is true then create console transport.
  if (
    Object.prototype.hasOwnProperty.call(opt, `console`) &&
    typeof opt.console === `object`
  ) {
    const consoleOpt = {
      format: combine(
        winston.format.label({ label: opt.console.label }),
        winston.format.colorize(),
        consoleLogFormat
      ),
    };
    Object.entries(opt.console).forEach(([key, val]) => {
      consoleOpt[key] = val;
    });
    config.transports.push(new winston.transports.Console(consoleOpt));
  } else if (
    Object.prototype.hasOwnProperty.call(opt, `console`) &&
    typeof opt.console === `boolean` &&
    opt.console
  ) {
    config.transports.push(
      new winston.transports.Console({
        format: combine(winston.format.colorize(), consoleLogFormat),
      })
    );
  }

  return config;
};

module.exports = { generateConfig };
