import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

interface RideHistory {
  id: number;
  from: string;
  to: string;
  message?: string;
  role: string;
  timestamp: string;
  status: string;
  rider: {
    id: number;
    fullname: string;
    email: string;
  };
  passengers: { id: number; fullname: string; email: string }[];
}

// TODO: add the status for the cancel.

const Dashboard: React.FC = () => {
  const [rides, setRides] = useState<RideHistory[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(userStr);
    setUserId(user.id);
    apiFetch<{ rides: RideHistory[] }>(
      `${import.meta.env.VITE_API_BASE_URL}/rides/history?userId=${user.id}`,
    ).then((res) => setRides(res.rides));
  }, [navigate]);

  // Calculate stats
  const postedRides = rides.filter((ride) => ride.rider?.id === userId);
  const requestedRides = rides.filter((ride) =>
    ride.passengers?.some((p) => p.id === userId),
  );
  const confirmedRides = rides.filter((ride) => ride.status === 'CONFIRMED');
  const statusCount = (arr: RideHistory[], status: string) =>
    arr.filter((r) => r.status === status).length;

  // Determine user role (rider or passenger)
  const userRole =
    postedRides.length > 0
      ? 'rider'
      : requestedRides.length > 0
        ? 'passenger'
        : null;

  return (
    <div className="col-span-2">
      <h2 className="mb-8 text-3xl tracking-tight text-teal-700 drop-shadow-sm">
        Profile & Dashboard
      </h2>
      <div className="mx-auto mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
        {userRole === 'rider' && (
          <div className="rounded-xl bg-gradient-to-br from-teal-200 to-teal-400 p-6 text-center shadow-lg dark:from-teal-900 dark:to-teal-700">
            <div className="mb-2 text-lg font-semibold text-teal-900 dark:text-teal-200">
              Rides Posted
            </div>
            <div className="text-4xl font-extrabold text-teal-800 dark:text-teal-100">
              {postedRides.length}
            </div>
            <div className="mt-2 text-xs text-gray-700 dark:text-gray-300">
              Active: {statusCount(postedRides, 'ACTIVE')} | Confirmed:{' '}
              {statusCount(postedRides, 'CONFIRMED')} | Rejected:{' '}
              {statusCount(postedRides, 'REJECTED')} | Expired:{' '}
              {statusCount(postedRides, 'EXPIRED')} | Cancelled:{' '}
              {statusCount(postedRides, 'CANCELLED')}
            </div>
          </div>
        )}
        {userRole === 'passenger' && (
          <div className="rounded-xl bg-gradient-to-br from-teal-200 to-teal-400 p-6 text-center shadow-lg dark:from-teal-900 dark:to-teal-700">
            <div className="mb-2 text-lg font-semibold text-teal-900 dark:text-teal-200">
              Rides Requested
            </div>
            <div className="text-4xl font-extrabold text-teal-800 dark:text-teal-100">
              {requestedRides.length}
            </div>
            <div className="mt-2 text-xs text-gray-700 dark:text-gray-300">
              Active: {statusCount(requestedRides, 'ACTIVE')} | Confirmed:{' '}
              {statusCount(requestedRides, 'CONFIRMED')} | Rejected:{' '}
              {statusCount(requestedRides, 'REJECTED')} | Expired:{' '}
              {statusCount(requestedRides, 'EXPIRED')} | Cancelled:{' '}
              {statusCount(requestedRides, 'CANCELLED')}
            </div>
          </div>
        )}
        <div className="rounded-xl bg-gradient-to-br from-green-200 to-green-400 p-6 text-center shadow-lg dark:from-green-900 dark:to-green-700">
          <div className="mb-2 text-lg font-semibold text-green-900 dark:text-green-200">
            Confirmed Rides
          </div>
          <div className="text-4xl font-extrabold text-green-800 dark:text-green-100">
            {confirmedRides.length}
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-gray-100 to-gray-300 p-6 text-center shadow-lg dark:from-gray-800 dark:to-gray-700">
          <div className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-200">
            Total Rides
          </div>
          <div className="text-4xl font-extrabold text-gray-800 dark:text-gray-100">
            {rides.length}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg bg-white shadow-lg dark:bg-dark">
        <table className="min-w-full text-sm">
          <thead className="bg-teal-100 dark:bg-teal-900">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-teal-700 dark:text-teal-200">
                From
              </th>
              <th className="px-4 py-3 text-left font-semibold text-teal-700 dark:text-teal-200">
                To
              </th>
              <th className="px-4 py-3 text-left font-semibold text-teal-700 dark:text-teal-200">
                Message
              </th>
              <th className="px-4 py-3 text-left font-semibold text-teal-700 dark:text-teal-200">
                Role
              </th>
              <th className="px-4 py-3 text-left font-semibold text-teal-700 dark:text-teal-200">
                Time
              </th>
              <th className="px-4 py-3 text-left font-semibold text-teal-700 dark:text-teal-200">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {rides.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-6 text-center text-gray-500 dark:text-gray-400"
                >
                  No rides found.
                </td>
              </tr>
            ) : (
              rides.map((ride) => {
                return (
                  <tr
                    key={ride.id}
                    className="border-b transition-colors last:border-none hover:bg-teal-50 dark:hover:bg-teal-900"
                  >
                    <td className="px-4 py-3">{ride.from}</td>
                    <td className="px-4 py-3">{ride.to}</td>
                    <td className="px-4 py-3">{ride.message || '-'}</td>
                    <td className="px-4 py-3 capitalize">{ride.role}</td>
                    <td className="px-4 py-3">
                      {new Date(ride.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {ride.status === 'ACTIVE' && (
                        <span className="rounded-full bg-blue-200 px-2.5 py-1 font-normal text-blue-600">
                          Active
                        </span>
                      )}
                      {ride.status === 'CONFIRMED' && (
                        <span className="rounded-full bg-green-100 px-2.5 py-1 font-normal text-green-600">
                          Confirmed
                        </span>
                      )}
                      {ride.status === 'REJECTED' && (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 font-normal text-red-600">
                          Rejected
                        </span>
                      )}
                      {ride.status === 'EXPIRED' && (
                        <span className="rounded-full bg-gray-200 px-2.5 py-1 font-normal text-gray-600">
                          Expired
                        </span>
                      )}
                      {ride.status === 'CANCELLED' && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 font-normal text-amber-600">
                          Cancelled
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
