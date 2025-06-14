import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { ElasticsearchTransport } from 'winston-elasticsearch';

// Custom format for plain text file logs
const plainTextFormat = winston.format.printf((info) => {
  const timestamp = typeof info.timestamp === 'string' ? info.timestamp : '';
  const level = typeof info.level === 'string' ? info.level : '';
  // Only use context/tag if they are strings
  let context = '';
  if (info.context && typeof info.context === 'string') {
    context = `[${info.context}]`;
  }
  let tag = '';
  if (info.tag && typeof info.tag === 'string') {
    tag = `[${info.tag}]`;
  }
  let msg = '';
  if (typeof info.message === 'object') {
    try {
      msg = JSON.stringify(info.message);
    } catch {
      msg = '[Unserializable Object]';
    }
  } else if (typeof info.message === 'string') {
    msg = info.message;
  } else {
    msg = '[Unknown message type]';
  }
  return `${timestamp} [${level.toUpperCase()}]${context}${tag}: ${msg}`;
});

// Filter: only allow logs with a 'tag' property (custom app logs)
const fileLogFilter = winston.format((info) => {
  if (info.tag && typeof info.tag === 'string') {
    return info;
  }
  return false;
});

// Elasticsearch Winston transport config
const esTransportOpts = {
  level: 'info',
  clientOpts: {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  },
  indexPrefix: 'commuto-logs',
};
const esTransport = new ElasticsearchTransport(esTransportOpts);

export const winstonLoggerConfig = {
  transports: [
    // JSON file for machine processing
    new winston.transports.DailyRotateFile({
      dirname: 'logs',
      filename: 'application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info',
      format: winston.format.combine(
        fileLogFilter(),
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
    // Plain text file for human reading
    new winston.transports.DailyRotateFile({
      dirname: 'logs',
      filename: 'application-%DATE%.txt',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: false,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info',
      format: winston.format.combine(
        fileLogFilter(),
        winston.format.timestamp(),
        plainTextFormat,
      ),
    }),
    // Pretty console output for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        nestWinstonModuleUtilities.format.nestLike('Commuto', {
          prettyPrint: true,
        }),
      ),
    }),
    esTransport,
  ],
};
