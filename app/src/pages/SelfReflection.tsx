import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { RIDE_STATUS, USER_ROLE } from '../constants/enums';
import { ROUTE_LOGIN } from '../constants/routes';
import { API_RIDES_HISTORY } from '../constants/api';

import { RideHistory, ReflectionStats } from '../interfaces/types';

import { apiFetch } from '../utils/api';
import { getStoredUser } from '../utils/functions';
import { useKarmaPoints } from '../hooks/useKarmaPoints';
import { useCreditScore } from '../hooks/useCreditScore';

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
  const [userRole, setUserRole] = useState<USER_ROLE>(USER_ROLE.RIDER);

  const { karmaPoints } = useKarmaPoints();
  const { creditScore } = useCreditScore();
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

  const getTotalRideCountByRole = (
    userRole: USER_ROLE,
    userId: number | null,
  ) => {
    if (userRole === USER_ROLE.RIDER) {
      return rides.filter(({ rider }) => rider?.id === userId).length;
    } else {
      return rides.filter(({ passengerId }) => passengerId === userId).length;
    }
  };

  const getUserCompletedRides = (
    userRole: USER_ROLE,
    userId: number | null,
  ) => {
    return rides.filter(({ status, rider, passengers }) => {
      if (status !== RIDE_STATUS.COMPLETED) return false;

      if (userRole === USER_ROLE.RIDER) {
        return rider?.id === userId;
      } else {
        return (
          Array.isArray(passengers) && passengers.some((p) => p.id === userId)
        );
      }
    });
  };

  const completedRides = getUserCompletedRides(userRole, userId);

  const stats: ReflectionStats = {
    postedCount: getTotalRideCountByRole(userRole, userId),
    confirmedCount: completedRides.length,
    karmaPoints: karmaPoints ?? 0,
    creditScore: creditScore ?? 0,
    distanceTravelled: completedRides.reduce(
      (sum, ride) => sum + (ride.distance ?? 0),
      0,
    ),
    co2Reduced: completedRides.reduce(
      (sum, ride) => sum + (ride.co2Saved ?? 0),
      0,
    ),
    peopleImpacted: completedRides.length,
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
        {/* TODO: Update Dashboard to support incremental loading (infinite scroll) */}
        <Dashboard rides={rides} />
      </main>
    </>
  );
};

export default SelfReflection;
