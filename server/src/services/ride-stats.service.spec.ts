import { RideStatsService } from './ride-stats.service';
import { USER_ROLE } from '../constants/enums';

/** One aggregate row as Postgres returns it: counts as bigint, sums nullable. */
const ROW = {
  rider_posted: 21n,
  passenger_posted: 4n,
  rider_completed: 14n,
  passenger_completed: 3n,
  rider_distance: 61.9685,
  passenger_distance: 12.5,
  rider_co2: 0.9915,
  passenger_co2: 0.2,
};

function makeService(rows: unknown[]) {
  const queryRaw = jest.fn().mockResolvedValue(rows);
  const service = new RideStatsService({ $queryRaw: queryRaw } as never);
  return { service, queryRaw };
}

describe('RideStatsService', () => {
  it('reports the rider columns for a rider', async () => {
    const { service } = makeService([ROW]);

    await expect(service.getStatsForUser(1, USER_ROLE.RIDER)).resolves.toEqual({
      postedCount: 21,
      completedCount: 14,
      distanceTravelled: 61.9685,
      co2Reduced: 0.9915,
      peopleImpacted: 14,
    });
  });

  it('reports the passenger columns for a passenger', async () => {
    const { service } = makeService([ROW]);

    await expect(
      service.getStatsForUser(1, USER_ROLE.PASSENGER),
    ).resolves.toEqual({
      postedCount: 4,
      completedCount: 3,
      distanceTravelled: 12.5,
      co2Reduced: 0.2,
      peopleImpacted: 3,
    });
  });

  it('converts bigint counts to plain numbers', async () => {
    // Left as bigint these would serialise to a JSON error, not a number.
    const { service } = makeService([ROW]);

    const stats = await service.getStatsForUser(1, USER_ROLE.RIDER);

    expect(typeof stats.postedCount).toBe('number');
    expect(typeof stats.completedCount).toBe('number');
  });

  it('treats a user with no completed rides as zero, not null', async () => {
    // SUM over an empty set returns NULL in SQL; the dashboard needs 0.
    const { service } = makeService([
      {
        ...ROW,
        rider_completed: 0n,
        rider_distance: null,
        rider_co2: null,
      },
    ]);

    const stats = await service.getStatsForUser(1, USER_ROLE.RIDER);

    expect(stats.distanceTravelled).toBe(0);
    expect(stats.co2Reduced).toBe(0);
    expect(stats.completedCount).toBe(0);
  });

  it('returns zeroes when the user has no rides at all', async () => {
    const { service } = makeService([]);

    await expect(service.getStatsForUser(99, USER_ROLE.RIDER)).resolves.toEqual(
      {
        postedCount: 0,
        completedCount: 0,
        distanceTravelled: 0,
        co2Reduced: 0,
        peopleImpacted: 0,
      },
    );
  });
});
