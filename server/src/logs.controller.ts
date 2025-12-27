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

// TODO: Add role-based authorization guard to restrict logs to admin users only
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
      const lines = data.split('\n').filter(Boolean);
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
          const lines = data.split('\n').filter(Boolean);
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
