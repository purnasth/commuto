import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiFetch } from '../utils/api';
import { getStoredUser } from '../utils/functions';
import { fetchUserKarmaPoints } from '../utils/karma';

import Dashboard from '../components/Dashboard';
import ReflectionDashboard from '../components/ReflectionDashboard';
import { RIDE_STATUS } from '../constants/enums';
import { ROUTE_LOGIN } from '../constants/routes';

import { RideHistory, ReflectionStats } from '../interfaces/types';

const SelfReflection = () => {
  const [rides, setRides] = useState<RideHistory[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [karmaPoints, setKarmaPoints] = useState<number>(0);
  const navigate = useNavigate();

  console.log('rides dashboard', rides);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      navigate(ROUTE_LOGIN);
      return;
    }
    setUserId(storedUser.id ?? null);
    apiFetch<{ rides: RideHistory[] }>(
      `${import.meta.env.VITE_API_BASE_URL}/rides/history?userId=${storedUser.id}`,
    ).then((res) => {
      setRides(res.rides);

      // set karma points
      if (res.rides.length === 0) {
        setKarmaPoints(0);
      } else {
        const totalKarma = res.rides.reduce(
          (sum, ride) => sum + (ride.rider.karmaPoints ?? 0),
          0,
        );
        setKarmaPoints(totalKarma);
      }
    });
    fetchUserKarmaPoints(storedUser.id).then(setKarmaPoints);
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
    karmaPoints: karmaPoints,
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
        <Dashboard rides={rides} />
      </main>
    </>
  );
};

export default SelfReflection;
