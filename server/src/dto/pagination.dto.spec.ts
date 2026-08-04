import 'reflect-metadata';

import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  cursorFilter,
  decodeCursor,
  encodeCursor,
  resolveLimit,
} from './pagination.dto';

const CURSOR = { timestamp: new Date('2025-12-27T06:47:30.855Z'), id: 34 };

describe('cursor encoding', () => {
  it('round-trips a cursor without losing millisecond precision', () => {
    const decoded = decodeCursor(encodeCursor(CURSOR));

    expect(decoded).not.toBeNull();
    expect(decoded!.id).toBe(34);
    expect(decoded!.timestamp.toISOString()).toBe(
      CURSOR.timestamp.toISOString(),
    );
  });

  it('produces a URL-safe token', () => {
    expect(encodeCursor(CURSOR)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('treats an absent cursor as the first page', () => {
    expect(decodeCursor(undefined)).toBeNull();
  });

  it('falls back to the first page for a malformed cursor', () => {
    // A stale or hand-edited token should restart paging, not 500.
    expect(decodeCursor('not-base64-at-all!!')).toBeNull();
    expect(
      decodeCursor(Buffer.from('garbage').toString('base64url')),
    ).toBeNull();
    expect(
      decodeCursor(
        Buffer.from('2025-01-01T00:00:00.000Z|abc').toString('base64url'),
      ),
    ).toBeNull();
  });
});

describe('cursorFilter', () => {
  it('is empty for the first page so no rows are excluded', () => {
    expect(cursorFilter(null)).toEqual({});
  });

  it('seeks strictly past the cursor, breaking ties on id', () => {
    // Timestamps are not unique in this data, so without the id tiebreaker a
    // row sharing the boundary timestamp would be served twice or skipped.
    expect(cursorFilter(CURSOR)).toEqual({
      OR: [
        { timestamp: { lt: CURSOR.timestamp } },
        { timestamp: CURSOR.timestamp, id: { lt: CURSOR.id } },
      ],
    });
  });
});

describe('resolveLimit', () => {
  it('defaults when the client asks for nothing', () => {
    expect(resolveLimit(undefined)).toBe(DEFAULT_PAGE_SIZE);
  });

  it('honours a smaller explicit page size', () => {
    expect(resolveLimit(5)).toBe(5);
  });

  it('caps the page size so one request cannot ask for everything', () => {
    expect(resolveLimit(100_000)).toBe(MAX_PAGE_SIZE);
  });
});
