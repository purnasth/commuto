import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { RIDE_STATUS } from '../constants/enums';
import { ROUTE_LOGIN } from '../constants/routes';
import { API_RIDES_HISTORY } from '../constants/api';

import { RideHistory, ReflectionStats } from '../interfaces/types';

import { apiFetch } from '../utils/api';
import { getStoredUser } from '../utils/functions';
import { useKarmaPoints } from '../hooks/useKarmaPoints';

import Dashboard from '../components/Dashboard';
import ReflectionDashboard from '../components/ReflectionDashboard';

// TODO: Implement infinite scroll for ride history (pagination, fetch more on scroll)
// TODO: Backend checklist for infinite scroll:
//   1. Add pagination support to /rides/history endpoint (accept page, limit params)
//   2. Return total count or hasMore flag in response
//   3. Optimize query for large datasets (indexes, limits)
//   4. Document API changes for frontend
const SelfReflection = () => {
  const [rides, setRides] = useState<RideHistory[]>([]);
  const [userId, setUserId] = useState<number | null>(null);

  const { karmaPoints } = useKarmaPoints();
  const navigate = useNavigate();

  // TODO: Refactor ride history fetching to support pagination and infinite scroll
  useEffect(() => {
    let cancelled = false;
    const storedUser = getStoredUser();
    if (!storedUser) {
      navigate(ROUTE_LOGIN);
      return;
    }
    setUserId(storedUser.id ?? null);

    const fetchWithRetry = async (retries = 3) => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const url = `${baseUrl}${API_RIDES_HISTORY}?userId=${storedUser.id}`;

      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const res = await apiFetch<{ rides: RideHistory[] }>(url);
          if (!cancelled) setRides(res.rides);
          break;
        } catch {
          if (attempt === retries - 1 && !cancelled) setRides([]);
        }
      }
    };

    fetchWithRetry();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // Calculate stats
  const postedRides = rides.filter((ride) => ride.rider?.id === userId);
  const confirmedRides = rides.filter(
    (ride) => ride.status === RIDE_STATUS.CONFIRMED,
  );

  // Calculate dynamic stats
  const stats: ReflectionStats = {
    postedCount: postedRides.length,
    confirmedCount: confirmedRides.length,
    karmaPoints: karmaPoints ?? 0,
    distanceTravelled: confirmedRides.reduce(
      (sum, ride) => sum + (ride.distance ?? 0),
      0,
    ),
    co2Reduced: confirmedRides.reduce(
      (sum, ride) => sum + (ride.distance ?? 0) * 0.17,
      0,
    ),
    peopleImpacted: confirmedRides.reduce(
      (sum, ride) => sum + (ride.passengers?.length || 0),
      0,
    ),
  };

  return (
    <>
      <main className="overflow-hidden p-2 md:p-4 xl:p-8">
        <div className="absolute left-0 -z-10 size-96 -translate-x-1/2 rounded-full bg-teal-300 opacity-40 blur-[100px]" />
        <div className="absolute right-0 top-1/4 -z-10 size-[36rem] translate-x-1/2 rounded-full bg-teal-300 opacity-80 blur-[200px]" />

        <ReflectionDashboard stats={stats} />
        {/* TODO: Update Dashboard to support incremental loading (infinite scroll) */}
        <Dashboard rides={rides} />
      </main>
    </>
  );
};

export default SelfReflection;
