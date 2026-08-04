import { parseLogLines } from './logs.controller';

const REFRESH_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInR5cGUiOiJyZWZyZXNoIn0.s1gnatur3_v4lu3';

const BCRYPT_HASH =
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

function line(entry: Record<string, unknown>): string {
  return JSON.stringify(entry);
}

describe('parseLogLines', () => {
  it('keeps the documented operational fields', () => {
    const entries = parseLogLines(
      line({
        level: 'info',
        message: 'Ride created',
        tag: 'ride',
        timestamp: '2024-06-01T00:00:00.000Z',
        userId: 3,
        rideId: 9,
        from: 'A',
        to: 'B',
        role: 'rider',
      }),
    );

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      level: 'info',
      message: 'Ride created',
      tag: 'ride',
      userId: 3,
      rideId: 9,
    });
  });

  it('drops a refresh token attached as its own field', () => {
    const entries = parseLogLines(
      line({
        level: 'info',
        message: 'Logout attempt',
        tag: 'auth',
        timestamp: 't',
        refreshToken: REFRESH_TOKEN,
      }),
    );

    expect(entries[0]).not.toHaveProperty('refreshToken');
    expect(JSON.stringify(entries)).not.toContain(REFRESH_TOKEN);
  });

  it('drops email and any other undeclared field', () => {
    const entries = parseLogLines(
      line({
        level: 'warn',
        message: 'Login failed',
        tag: 'error',
        timestamp: 't',
        email: 'victim@example.com',
        password: 'hunter2',
      }),
    );

    expect(entries[0]).not.toHaveProperty('email');
    expect(entries[0]).not.toHaveProperty('password');
    expect(JSON.stringify(entries)).not.toContain('victim@example.com');
  });

  it('discards a line whose message text embeds a JWT', () => {
    const entries = parseLogLines(
      line({
        level: 'error',
        message: `Refresh token verification failed: ${REFRESH_TOKEN}`,
        tag: 'error',
        timestamp: 't',
      }),
    );

    expect(entries).toHaveLength(0);
  });

  it('discards a line whose message text embeds a bcrypt hash', () => {
    const entries = parseLogLines(
      line({
        level: 'info',
        message: `Ride created: {"password":"${BCRYPT_HASH}"}`,
        tag: 'ride',
        timestamp: 't',
      }),
    );

    expect(entries).toHaveLength(0);
  });

  it('skips malformed lines without failing the whole read', () => {
    const data = [
      'not json at all',
      line({ level: 'info', message: 'ok', tag: 'ride', timestamp: 't' }),
      '',
    ].join('\n');

    expect(parseLogLines(data)).toHaveLength(1);
  });
});
