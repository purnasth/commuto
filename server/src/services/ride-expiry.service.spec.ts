import { RideExpiryService } from './ride-expiry.service';
import { RIDE_STATUS, RIDE_EXPIRATION_GRACE_MINUTES } from '../constants/enums';

const GRACE_MS = RIDE_EXPIRATION_GRACE_MINUTES * 60 * 1000;

interface UpdateManyArgs {
  where: { status: { in: string[] }; timestamp: { lt: Date } };
  data: { status: string };
}

function makeService(updateManyResult = { count: 0 }) {
  const updateMany = jest.fn<Promise<{ count: number }>, [UpdateManyArgs]>(() =>
    Promise.resolve(updateManyResult),
  );
  const findMany = jest.fn();
  const logger = {
    log: jest.fn<void, [Record<string, unknown>]>(),
    error: jest.fn(),
  };

  const service = new RideExpiryService(
    { ride: { updateMany, findMany } } as never,
    logger as never,
  );

  return { service, updateMany, findMany, logger };
}

describe('RideExpiryService.expiryCutoff', () => {
  it('sits exactly one grace period behind now', () => {
    const before = Date.now();
    const cutoff = RideExpiryService.expiryCutoff().getTime();
    const after = Date.now();

    expect(cutoff).toBeGreaterThanOrEqual(before - GRACE_MS - 50);
    expect(cutoff).toBeLessThanOrEqual(after - GRACE_MS + 50);
  });
});

describe('RideExpiryService.sweep', () => {
  it('expires only ACTIVE and CONFIRMED rides past the cutoff', async () => {
    const { service, updateMany } = makeService({ count: 3 });

    await service.sweep();

    expect(updateMany).toHaveBeenCalledTimes(1);
    const arg = updateMany.mock.calls[0][0];

    expect(arg.where.status).toEqual({
      in: [RIDE_STATUS.ACTIVE, RIDE_STATUS.CONFIRMED],
    });
    expect(arg.where.timestamp.lt).toBeInstanceOf(Date);
    expect(arg.data).toEqual({ status: RIDE_STATUS.EXPIRED });
  });

  it('does not read the rows before updating them', async () => {
    // The previous implementation ran a findMany purely to log the rows,
    // doubling the work of what is already a background sweep.
    const { service, findMany } = makeService({ count: 2 });

    await service.sweep();

    expect(findMany).not.toHaveBeenCalled();
  });

  it('stays quiet when nothing expired', async () => {
    const { service, logger } = makeService({ count: 0 });

    const count = await service.sweep();

    expect(count).toBe(0);
    expect(logger.log).not.toHaveBeenCalled();
  });

  it('reports how many rides it retired', async () => {
    const { service, logger } = makeService({ count: 7 });

    const count = await service.sweep();

    expect(count).toBe(7);
    expect(logger.log).toHaveBeenCalledTimes(1);
    expect(logger.log.mock.calls[0][0]).toMatchObject({
      tag: 'ride',
      expiredCount: 7,
    });
  });
});
