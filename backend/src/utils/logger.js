const logger = {
  error: (...args) => console.error(...args),
  warn: (...args) => console.warn(...args),
  info: (...args) => console.info(...args),
  http: (...args) => console.log(...args),
  debug: (...args) => console.debug(...args),
};

module.exports = logger;
