// TODO: make this responsive and beautify design

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Bar, Doughnut, PolarArea, Bubble } from 'react-chartjs-2';
import { TooltipItem } from 'chart.js';
import 'chart.js/auto';

interface LogEntry {
  from?: string;
  to?: string;
  level: string;
  message: string;
  role?: string;
  tag: string;
  timestamp: string;
  userId?: number;
  rideId?: number;
  expirationTime?: string;
  karmaPoints?: number;
}

interface BubbleDataPoint {
  x: number;
  y: number;
  r: number;
  label: string;
}

interface CountMap {
  [key: string]: number;
}

type FilterType = 'today' | 'all';

const LogsDashboard: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('today');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [userIdFilter, setUserIdFilter] = useState<string>('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const endpoint = filter === 'today' ? '/logs/today' : '/logs/all';
        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setLogs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [filter]);

  // Filter logs for table
  const filteredLogs = logs.filter((log) => {
    return (
      (!levelFilter || log.level === levelFilter) &&
      (!tagFilter || log.tag === tagFilter) &&
      (!userIdFilter || String(log.userId) === userIdFilter)
    );
  });

  // Memoized unique values for filters
  const levelOptions = useMemo(
    () => Array.from(new Set(logs.map((log) => log.level))).filter(Boolean),
    [logs],
  );
  const tagOptions = useMemo(
    () => Array.from(new Set(logs.map((log) => log.tag))).filter(Boolean),
    [logs],
  );
  const userIdOptions = useMemo(
    () =>
      Array.from(new Set(logs.map((log) => String(log.userId)))).filter(
        (id) => id !== 'undefined',
      ),
    [logs],
  );

  // Chart 1: Log count per hour
  const hourCounts: CountMap = {};
  logs.forEach((log) => {
    const hour = new Date(log.timestamp).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const chartDataHour = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Log Count',
        data: Array.from({ length: 24 }, (_, i) => hourCounts[i] || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
      },
    ],
  };

  const mostActiveHour =
    Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

  // Chart 2: Log level distribution
  const levelCounts: CountMap = {};
  logs.forEach((log) => {
    levelCounts[log.level] = (levelCounts[log.level] || 0) + 1;
  });

  const chartDataLevel = {
    labels: Object.keys(levelCounts),
    datasets: [
      {
        label: 'Log Level',
        data: Object.values(levelCounts),
        backgroundColor: [
          'rgba(59,130,246,0.7)',
          'rgba(34,197,94,0.7)',
          'rgba(239,68,68,0.7)',
          'rgba(234,179,8,0.7)',
        ],
      },
    ],
  };

  // Chart 3: Tag distribution
  const tagCounts: CountMap = {};
  logs.forEach((log) => {
    tagCounts[log.tag] = (tagCounts[log.tag] || 0) + 1;
  });

  const chartDataTag = {
    labels: Object.keys(tagCounts),
    datasets: [
      {
        label: 'Tag Count',
        data: Object.values(tagCounts),
        backgroundColor: 'rgba(34,197,94,0.7)',
      },
    ],
  };

  // Chart 4: Ride creation per location (From)
  const fromCounts: CountMap = {};
  logs.forEach((log) => {
    if (log.from) {
      fromCounts[log.from] = (fromCounts[log.from] || 0) + 1;
    }
  });

  const chartDataFrom = {
    labels: Object.keys(fromCounts),
    datasets: [
      {
        label: 'Rides Created (From)',
        data: Object.values(fromCounts),
        backgroundColor: 'rgba(234,179,8,0.7)',
      },
    ],
  };

  const mostPopularFrom =
    Object.entries(fromCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

  // Chart 5: Ride creation per location (To)
  const toCounts: CountMap = {};
  logs.forEach((log) => {
    if (log.to) {
      toCounts[log.to] = (toCounts[log.to] || 0) + 1;
    }
  });

  const chartDataTo = {
    labels: Object.keys(toCounts),
    datasets: [
      {
        label: 'Rides Created (To)',
        data: Object.values(toCounts),
        backgroundColor: 'rgba(59,130,246,0.7)',
      },
    ],
  };

  const mostPopularTo =
    Object.entries(toCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

  // Chart 6: User activity
  const userCounts: CountMap = {};
  logs.forEach((log) => {
    if (log.userId) {
      userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
    }
  });

  const chartDataUser = {
    labels: Object.keys(userCounts),
    datasets: [
      {
        label: 'User Activity',
        data: Object.values(userCounts),
        backgroundColor: 'rgba(239,68,68,0.7)',
      },
    ],
  };

  const mostActiveUser =
    Object.entries(userCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

  // Chart 7: Karma points distribution
  const karmaCounts: CountMap = {};
  logs.forEach((log) => {
    if (log.userId && typeof log.karmaPoints === 'number') {
      karmaCounts[log.userId] = log.karmaPoints;
    }
  });

  const chartDataKarma = {
    labels: Object.keys(karmaCounts),
    datasets: [
      {
        label: 'Karma Points',
        data: Object.values(karmaCounts),
        backgroundColor: [
          'rgba(59,130,246,0.7)',
          'rgba(34,197,94,0.7)',
          'rgba(239,68,68,0.7)',
          'rgba(234,179,8,0.7)',
        ],
      },
    ],
  };

  // Chart 8: Bubble chart
  const bubbleData: BubbleDataPoint[] = [
    { x: 1, y: 120, r: 10, label: 'Alice' },
    { x: 2, y: 80, r: 15, label: 'Bob' },
    { x: 3, y: 200, r: 25, label: 'Charlie' },
    { x: 4, y: 60, r: 8, label: 'Diana' },
    { x: 5, y: 150, r: 20, label: 'Eve' },
    { x: 6, y: 90, r: 12, label: 'Frank' },
    { x: 7, y: 180, r: 22, label: 'Grace' },
    { x: 8, y: 50, r: 6, label: 'Heidi' },
    { x: 9, y: 220, r: 30, label: 'Ivan' },
    { x: 10, y: 110, r: 14, label: 'Judy' },
    { x: 11, y: 75, r: 9, label: 'Mallory' },
    { x: 12, y: 160, r: 18, label: 'Oscar' },
    { x: 13, y: 130, r: 16, label: 'Peggy' },
    { x: 14, y: 95, r: 11, label: 'Sybil' },
    { x: 15, y: 210, r: 28, label: 'Trent' },
  ];

  const chartDataBubble = {
    datasets: [
      {
        label: 'User Activity & Karma',
        data: bubbleData,
        backgroundColor: [
          'rgba(59,130,246,0.5)',
          'rgba(34,197,94,0.5)',
          'rgba(239,68,68,0.5)',
          'rgba(234,179,8,0.5)',
          'rgba(168,85,247,0.5)',
          'rgba(16,185,129,0.5)',
          'rgba(251,191,36,0.5)',
          'rgba(59,130,246,0.5)',
          'rgba(34,197,94,0.5)',
          'rgba(239,68,68,0.5)',
          'rgba(234,179,8,0.5)',
          'rgba(168,85,247,0.5)',
          'rgba(16,185,129,0.5)',
          'rgba(251,191,36,0.5)',
          'rgba(59,130,246,0.5)',
        ],
        borderColor: 'rgba(59,130,246,1)',
        borderWidth: 2,
        hoverBackgroundColor: 'rgba(239,68,68,0.7)',
        hoverBorderColor: 'rgba(239,68,68,1)',
      },
    ],
  };

  const bubbleOptions = {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bubble'>) => {
            const rawData = context.raw as BubbleDataPoint;
            return `${rawData.label}: Karma=${rawData.y}, Logs=${rawData.r}`;
          },
        },
      },
      title: {
        display: true,
        text: 'User Activity vs Karma Points vs Log Count',
        font: { size: 18 },
        color: '#3b82f6',
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'User ID', color: '#3b82f6' },
        grid: { color: '#e5e7eb' },
      },
      y: {
        title: { display: true, text: 'Karma Points', color: '#3b82f6' },
        grid: { color: '#e5e7eb' },
      },
    },
  };

  const handleResetFilters = useCallback(() => {
    setLevelFilter('');
    setTagFilter('');
    setUserIdFilter('');
  }, []);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Logs Dashboard</h1>

      <div className="mb-6 flex gap-2">
        <button
          className={`rounded-full border px-4 py-1 font-semibold transition-colors ${
            filter === 'today'
              ? 'border-blue-500 bg-blue-500 text-white'
              : 'border-blue-500 bg-white text-blue-500 hover:bg-blue-50'
          }`}
          onClick={() => setFilter('today')}
        >
          Today
        </button>
        <button
          className={`rounded-full border px-4 py-1 font-semibold transition-colors ${
            filter === 'all'
              ? 'border-green-500 bg-green-500 text-white'
              : 'border-green-500 bg-white text-green-500 hover:bg-green-50'
          }`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="md:col-span-2">
              <h2 className="mb-2 text-lg font-semibold">
                User Activity Bubble Chart
              </h2>
              <p className="mb-2 text-sm text-gray-700">
                This beautiful bubble chart visualizes user activity, karma
                points, and log count. Each bubble represents a user, with the
                X-axis as User ID, Y-axis as Karma Points, and bubble size as
                the number of logs generated. Hover over bubbles for details.
              </p>
              <Bubble
                data={chartDataBubble}
                options={bubbleOptions}
                height={120}
              />
            </div>

            <div>
              <h2 className="mb-2 text-lg font-semibold">Log Count Per Hour</h2>
              <p className="mb-2 text-sm text-gray-700">
                This chart shows the number of log entries generated for each
                hour of the day. It helps identify peak system activity times
                and usage patterns.
              </p>
              <Bar data={chartDataHour} />
              <p className="mt-2 text-xs text-gray-500">
                Most active hour:{' '}
                <span className="font-bold">{mostActiveHour}:00</span>
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-semibold">
                Log Level Distribution
              </h2>
              <p className="mb-2 text-sm text-gray-700">
                This polar area chart visualizes the distribution of log levels
                (info, warn, error, etc.), giving insight into the health and
                issues in the system.
              </p>
              <PolarArea data={chartDataLevel} />
            </div>

            <div>
              <h2 className="mb-2 text-lg font-semibold">
                Rides Created Per Location (From)
              </h2>
              <p className="mb-2 text-sm text-gray-700">
                Displays the number of rides created from each starting
                location. Useful for identifying popular pickup points.
              </p>
              <Bar data={chartDataFrom} />
              <p className="mt-2 text-xs text-gray-500">
                Most popular 'from' location:{' '}
                <span className="font-bold">{mostPopularFrom}</span>
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-semibold">
                Rides Created Per Location (To)
              </h2>
              <p className="mb-2 text-sm text-gray-700">
                Shows the number of rides created to each destination. Useful
                for identifying popular drop-off points.
              </p>
              <Bar data={chartDataTo} />
              <p className="mt-2 text-xs text-gray-500">
                Most popular 'to' location:{' '}
                <span className="font-bold">{mostPopularTo}</span>
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-semibold">Tag Distribution</h2>
              <p className="mb-2 text-sm text-gray-700">
                This chart shows how many logs are generated for each tag,
                representing different modules or features (e.g., ride, auth).
              </p>
              <Bar data={chartDataTag} />
            </div>

            <div>
              <h2 className="mb-2 text-lg font-semibold">User Activity</h2>
              <p className="mb-2 text-sm text-gray-700">
                This chart shows the number of log entries generated by each
                user, indicating their activity level in the system.
              </p>
              <Bar data={chartDataUser} />
              <p className="mt-2 text-xs text-gray-500">
                Most active user:{' '}
                <span className="font-bold">{mostActiveUser}</span>
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-semibold">
                Karma Points Distribution
              </h2>
              <p className="mb-2 text-sm text-gray-700">
                Displays the karma points for each user, reflecting their
                positive contributions and completed rides.
              </p>
              <Doughnut data={chartDataKarma} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <div>
                <label className="mr-2 text-sm font-medium text-gray-700">
                  Level:
                </label>
                <select
                  className="rounded border px-2 py-1 text-sm"
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                >
                  <option value="">All</option>
                  {levelOptions.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mr-2 text-sm font-medium text-gray-700">
                  Tag:
                </label>
                <select
                  className="rounded border px-2 py-1 text-sm"
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                >
                  <option value="">All</option>
                  {tagOptions.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mr-2 text-sm font-medium text-gray-700">
                  User ID:
                </label>
                <select
                  className="rounded border px-2 py-1 text-sm"
                  value={userIdFilter}
                  onChange={(e) => setUserIdFilter(e.target.value)}
                >
                  <option value="">All</option>
                  {userIdOptions.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="ml-2 rounded bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-300"
                onClick={handleResetFilters}
              >
                Reset Filters
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto rounded border border-gray-200 bg-white shadow">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50">
                  <tr>
                    <th className="border px-2 py-1 text-left font-semibold text-gray-700">
                      Time
                    </th>
                    <th className="border px-2 py-1 text-left font-semibold text-gray-700">
                      Level
                    </th>
                    <th className="border px-2 py-1 text-left font-semibold text-gray-700">
                      Tag
                    </th>
                    <th className="border px-2 py-1 text-left font-semibold text-gray-700">
                      Message
                    </th>
                    <th className="border px-2 py-1 text-left font-semibold text-gray-700">
                      User ID
                    </th>
                    <th className="border px-2 py-1 text-left font-semibold text-gray-700">
                      Ride ID
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-4 text-center text-gray-400"
                      >
                        No logs found for selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log, idx) => (
                      <tr key={idx} className="border-t hover:bg-gray-50">
                        <td className="border px-2 py-1">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="border px-2 py-1">{log.level}</td>
                        <td className="border px-2 py-1">{log.tag}</td>
                        <td
                          className="max-w-xs truncate whitespace-pre-line border px-2 py-1"
                          title={log.message}
                        >
                          {log.message}
                        </td>
                        <td className="border px-2 py-1">
                          {log.userId ?? '-'}
                        </td>
                        <td className="border px-2 py-1">
                          {log.rideId ?? '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LogsDashboard;
