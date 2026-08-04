import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

/**
 * Cursor-based paging for ride listings.
 *
 * Cursors encode the sort key of the last row seen rather than an offset.
 * `OFFSET n` makes the database walk and discard n rows, so it gets slower the
 * deeper a user scrolls -- which is exactly where infinite scroll spends its
 * time. Seeking on the sort key stays flat, and it does not skip or repeat
 * rows when a ride is inserted or expires mid-scroll.
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number;

  /** Opaque to clients: pass back whatever `nextCursor` was returned. */
  @IsOptional()
  @IsString()
  cursor?: string;
}

export interface Paginated<T> {
  rides: T[];
  /** Null once the last page has been served. */
  nextCursor: string | null;
}

/**
 * Rides are ordered by `timestamp DESC`, which is not unique -- seeded rows
 * routinely share a timestamp. The row id is carried as a tiebreaker so the
 * ordering is total and no row can straddle a page boundary.
 */
export interface RideCursor {
  timestamp: Date;
  id: number;
}

export function encodeCursor(cursor: RideCursor): string {
  return Buffer.from(`${cursor.timestamp.toISOString()}|${cursor.id}`).toString(
    'base64url',
  );
}

/**
 * Returns null for anything unparseable so a stale or hand-edited cursor
 * restarts from the first page instead of failing the request.
 */
export function decodeCursor(raw: string | undefined): RideCursor | null {
  if (!raw) {
    return null;
  }

  const [timestampPart, idPart] = Buffer.from(raw, 'base64url')
    .toString('utf8')
    .split('|');

  const timestamp = new Date(timestampPart ?? '');
  const id = Number(idPart);

  if (Number.isNaN(timestamp.getTime()) || !Number.isInteger(id)) {
    return null;
  }

  return { timestamp, id };
}

/**
 * Builds the "strictly after this cursor" predicate for a `timestamp DESC, id
 * DESC` ordering: an older timestamp, or the same timestamp with a lower id.
 */
export function cursorFilter(cursor: RideCursor | null) {
  if (!cursor) {
    return {};
  }

  return {
    OR: [
      { timestamp: { lt: cursor.timestamp } },
      { timestamp: cursor.timestamp, id: { lt: cursor.id } },
    ],
  };
}

export function resolveLimit(limit?: number): number {
  return Math.min(limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
}
