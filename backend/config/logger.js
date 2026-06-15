const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const { combine, timestamp, json, errors, colorize, printf } = format;

const jsonFormat = combine(
  timestamp({ format: 'ISO' }),
  errors({ stack: true }),
  json()
);

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}] ${message} ${metaStr}`;
  })
);

// General app logs (HTTP requests, DB queries, startup)
const appLogger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: jsonFormat,
  defaultMeta: { service: 'etp-api' },
  transports: [
    new DailyRotateFile({
      filename:    path.join('logs', 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles:    '14d',
      maxSize:     '20m',
    }),
    new DailyRotateFile({
      filename:    path.join('logs', 'app-errors-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles:    '30d',
      level:       'error',
    }),
  ],
});

// Security-only logs (failed logins, bad signatures, rate limits)
const securityLogger = createLogger({
  level: 'warn',
  format: jsonFormat,
  defaultMeta: { service: 'etp-security' },
  transports: [
    new DailyRotateFile({
      filename:    path.join('logs', 'security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles:    '90d',
      maxSize:     '50m',
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  const consoleTrans = new transports.Console({ format: devFormat });
  appLogger.add(consoleTrans);
  securityLogger.add(consoleTrans);
}

module.exports = { appLogger, securityLogger };