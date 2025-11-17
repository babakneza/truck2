/* eslint-disable no-undef */
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL] || LOG_LEVELS.info;

const formatTimestamp = () => {
  const now = new Date();
  return now.toISOString();
};

const log = (level, ...args) => {
  if (LOG_LEVELS[level] >= currentLogLevel) {
    const timestamp = formatTimestamp();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    console.log(prefix, ...args);
  }
};

export const logger = {
  debug: (...args) => log('debug', ...args),
  info: (...args) => log('info', ...args),
  warn: (...args) => log('warn', ...args),
  error: (...args) => log('error', ...args),
};
