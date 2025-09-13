import { Controller, Get } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

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

@Controller('logs')
export class LogsController {
  @Get('today')
  getTodayLogs(): LogEntry[] {
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const logFileName = `application-${yyyy}-${mm}-${dd}.log`;
    const logFile = path.join(__dirname, '../logs', logFileName);

    if (!fs.existsSync(logFile)) {
      return [];
    }

    const lines = fs.readFileSync(logFile, 'utf-8').split('\n').filter(Boolean);
    const entries: LogEntry[] = lines
      .map((line) => {
        try {
          return JSON.parse(line) as LogEntry;
        } catch {
          return undefined;
        }
      })
      .filter((entry): entry is LogEntry => !!entry);

    return entries;
  }

  @Get('all')
  getAllLogs(): LogEntry[] {
    const logsDir = path.join(__dirname, '../logs');
    const files = fs
      .readdirSync(logsDir)
      .filter((file) => file.endsWith('.log'));
    let allEntries: LogEntry[] = [];
    for (const file of files) {
      const filePath = path.join(logsDir, file);
      if (!fs.existsSync(filePath)) continue;
      const lines = fs
        .readFileSync(filePath, 'utf-8')
        .split('\n')
        .filter(Boolean);
      const entries: LogEntry[] = lines
        .map((line) => {
          try {
            return JSON.parse(line) as LogEntry;
          } catch {
            return undefined;
          }
        })
        .filter((entry): entry is LogEntry => !!entry);
      allEntries = allEntries.concat(entries);
    }
    return allEntries;
  }
}
