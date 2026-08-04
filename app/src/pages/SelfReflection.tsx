import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { RIDE_STATUS, USER_ROLE } from '../constants/enums';
import { ROUTE_LOGIN } from '../constants/routes';
import { API_RIDES_HISTORY } from '../constants/api';

import {
  RideHistory,
  ReflectionStats,
  RideStatsResponse,
} from '../interfaces/types';

import { apiFetch, fetchRideStats } from '../utils/api';
import { getStoredUser } from '../utils/functions';
import { useKarmaPoints } from '../hooks/useKarmaPoints';
import { useCreditScore } from '../hooks/useCreditScore';

import Dashboard from '../components/Dashboard';
import ReflectionDashboard from '../components/ReflectionDashboard';

const EMPTY_TOTALS: RideStatsResponse = {
  postedCount: 0,
  completedCount: 0,
  distanceTravelled: 0,
  co2Reduced: 0,
  peopleImpacted: 0,
};

const SelfReflection = () => {
  const [rides, setRides] = useState<RideHistory[]>([]);
  // Totals come from the server so they cover the whole history, not just the
  // page of rides currently loaded below.
  const [totals, setTotals] = useState<RideStatsResponse>(EMPTY_TOTALS);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<USER_ROLE>(USER_ROLE.RIDER);

  const { karmaPoints } = useKarmaPoints();
  const { creditScore } = useCreditScore();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const storedUser = getStoredUser();
    if (!storedUser) {
      navigate(ROUTE_LOGIN);
      return;
    }
    setUserId(storedUser.id ?? null);
    // Normalize role comparison - database stores "Rider"/"Passenger", enum uses "rider"/"passenger"
    const normalizedRole =
      storedUser.role?.toLowerCase() === 'rider'
        ? USER_ROLE.RIDER
        : USER_ROLE.PASSENGER;
    setUserRole(normalizedRole);

    const fetchWithRetry = async (retries = 3) => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const url = `${baseUrl}${API_RIDES_HISTORY}?userId=${storedUser.id}`;

      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const res = await apiFetch<{
            rides: RideHistory[];
            nextCursor: string | null;
          }>(url);
          if (!cancelled) {
            setRides(res.rides);
            setNextCursor(res.nextCursor);
          }
          break;
        } catch {
          if (attempt === retries - 1 && !cancelled) setRides([]);
        }
      }
    };

    const fetchTotals = async () => {
      try {
        const result = await fetchRideStats(storedUser.id);
        if (!cancelled) setTotals(result);
      } catch {
        if (!cancelled) setTotals(EMPTY_TOTALS);
      }
    };

    fetchWithRetry();
    fetchTotals();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const loadMore = async () => {
    const storedUser = getStoredUser();
    if (!storedUser || !nextCursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const url = `${baseUrl}${API_RIDES_HISTORY}?userId=${storedUser.id}&cursor=${encodeURIComponent(nextCursor)}`;
      const res = await apiFetch<{
        rides: RideHistory[];
        nextCursor: string | null;
      }>(url);
      setRides((current) => [...current, ...res.rides]);
      setNextCursor(res.nextCursor);
    } catch {
      // Leave the cursor in place so the user can retry.
    } finally {
      setLoadingMore(false);
    }
  };

  // Only the rides currently loaded -- used for the completed-rides list, not
  // for any total. Totals come from `totals`, which covers the full history.
  const completedRides = rides.filter(({ status, rider, passengers }) => {
    if (status !== RIDE_STATUS.COMPLETED) return false;

    if (userRole === USER_ROLE.RIDER) {
      return rider?.id === userId;
    }

    return Array.isArray(passengers) && passengers.some((p) => p.id === userId);
  });

  const stats: ReflectionStats = {
    postedCount: totals.postedCount,
    confirmedCount: totals.completedCount,
    karmaPoints: karmaPoints ?? 0,
    creditScore: creditScore ?? 0,
    distanceTravelled: totals.distanceTravelled,
    co2Reduced: totals.co2Reduced,
    peopleImpacted: totals.peopleImpacted,
  };

  return (
    <>
      <main className="overflow-hidden p-2 md:p-4 xl:p-8">
        <div className="absolute left-0 -z-10 size-96 -translate-x-1/2 rounded-full bg-teal-300 opacity-40 blur-[100px]" />
        <div className="absolute right-0 top-1/4 -z-10 size-[36rem] translate-x-1/2 rounded-full bg-teal-300 opacity-80 blur-[200px]" />

        <ReflectionDashboard
          stats={stats}
          completedRides={completedRides}
          currentUserId={userId || 0}
          userRole={userRole}
        />
        <Dashboard rides={rides} />

        {nextCursor && (
          <div className="flex justify-center py-6">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="transition-150 rounded-full border border-teal-300 bg-teal-100 px-6 py-2.5 text-sm font-medium text-teal-700 transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-teal-700 dark:bg-teal-900 dark:text-teal-100 dark:hover:bg-teal-800"
            >
              {loadingMore ? 'Loading…' : 'Show more rides'}
            </button>
          </div>
        )}
      </main>
    </>
  );
};

export default SelfReflection;
