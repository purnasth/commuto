import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';

interface LogEntry {
  from?: string;
  to?: string;
  level: string;
  message: string;
  role?: string;
  tag: string;
  timestamp: string;
  userId?: number;
  rideId?: number;
  expirationTime?: string;
}

/**
 * Fields a log line is allowed to surface over the API.
 *
 * Log records are free-form objects, so parsing a line yields whatever the
 * caller happened to attach. Projecting onto this whitelist keeps any
 * credential or personal detail that reaches the log files from being served
 * back out, rather than trusting every call site to log carefully.
 */
const EXPOSED_LOG_FIELDS = [
  'from',
  'to',
  'level',
  'message',
  'role',
  'tag',
  'timestamp',
  'userId',
  'rideId',
  'expirationTime',
] as const satisfies readonly (keyof LogEntry)[];

/** Patterns whose presence marks a whole line as unsafe to return. */
const SECRET_PATTERNS = [
  /\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/, // bcrypt hash
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+/, // JWT
];

function redactLogEntry(raw: unknown): LogEntry | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }

  const source = raw as Record<string, unknown>;
  const entry: Record<string, unknown> = {};

  for (const field of EXPOSED_LOG_FIELDS) {
    if (source[field] !== undefined) {
      entry[field] = source[field];
    }
  }

  // A free-text message can still embed a token or hash; drop the line entirely.
  if (
    typeof entry.message === 'string' &&
    SECRET_PATTERNS.some((pattern) => pattern.test(entry.message as string))
  ) {
    return undefined;
  }

  return entry as unknown as LogEntry;
}

export function parseLogLines(data: string): LogEntry[] {
  return data
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try {
        return redactLogEntry(JSON.parse(line));
      } catch {
        return undefined;
      }
    })
    .filter((entry): entry is LogEntry => !!entry);
}

// TODO: Add role-based authorization guard to restrict logs to admin users only.
// The User model has no admin role yet, so this currently only keeps logs from
// anonymous callers - any authenticated user can still read them.
@Controller('logs')
@UseGuards(JwtAuthGuard)
export class LogsController {
  @Get('today')
  async getTodayLogs(): Promise<LogEntry[]> {
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    if (!process.env.LOGS_DIR) {
      // If LOGS_DIR is not set, do not return logs
      return [];
    }

    const logsDir = path.resolve(__dirname, process.env.LOGS_DIR);
    const logFileName = `application-${yyyy}-${mm}-${dd}.log`;
    const logFile = path.join(logsDir, logFileName);
    // Validate that logFile is inside logsDir
    if (!logFile.startsWith(logsDir)) {
      throw new Error('Invalid log file path');
    }
    try {
      await fs.promises.access(logFile, fs.constants.F_OK);
    } catch {
      return [];
    }

    try {
      const data = await fs.promises.readFile(logFile, 'utf-8');
      return parseLogLines(data);
    } catch {
      return [];
    }
  }

  @Get('all')
  async getAllLogs(): Promise<LogEntry[]> {
    if (!process.env.LOGS_DIR) {
      // If LOGS_DIR is not set, do not return logs
      return [];
    }

    const logsDir = path.resolve(__dirname, process.env.LOGS_DIR);
    let files: string[] = [];
    try {
      files = (await fs.promises.readdir(logsDir)).filter((file) =>
        file.endsWith('.log'),
      );
    } catch {
      return [];
    }

    const allEntriesArrays: LogEntry[][] = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(logsDir, file);
        // Validate that filePath is inside logsDir
        if (!filePath.startsWith(logsDir)) {
          return [];
        }
        try {
          await fs.promises.access(filePath, fs.constants.F_OK);
          const data = await fs.promises.readFile(filePath, 'utf-8');
          return parseLogLines(data);
        } catch {
          // skip unreadable files
          return [];
        }
      }),
    );

    const allEntries: LogEntry[] = ([] as LogEntry[]).concat(
      ...allEntriesArrays,
    );
    return allEntries;
  }
}
