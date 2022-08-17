const winston = require(`winston`);
require(`winston-daily-rotate-file`);

const { combine, timestamp, label, printf } = winston.format;

const defaultOptions = {
  console: true,
  files: [
    // {
    //   dirname: __dirname,
    //   filename: `history`,
    // },
  ],
};

const defaultFileOptions = {
  maxFiles: 10,
  maxSize: `10k`,
  datePattern: ``,
};

const myFormat = printf(({ level, message }) => {
  return `${new Date().toISOString()} [${level}]: ${message}`;
});

const generateConfig = (options = {}) => {
  const opt = {};
  Object.entries(defaultOptions).forEach(([key, value]) => {
    if (Object.prototype.hasOwnProperty.call(options, key))
      opt[key] = options[key];
    else opt[key] = value;
  });

  const config = {
    level: `info`,
    // format: winston.format.json(),
    format: combine(
      //
      label({ label: "test label" }),
      timestamp(),
      myFormat
    ),
    transports: [],
  };

  if (opt.console) {
    config.transports.push(new winston.transports.Console());
  }
  if (opt.files.length) {
    opt.files.forEach((e) => {
      const fopt = JSON.parse(JSON.stringify(defaultFileOptions));
      fopt.filename = `${e.filename}.%DATE%.log`;
      fopt.dirname = e.dirname;
      fopt.createSymlink = true;
      fopt.symlinkName = `${e.filename}.log`;
      config.transports.push(new winston.transports.DailyRotateFile(fopt));
    });
  }

  return config;
};

module.exports = { generateConfig };
