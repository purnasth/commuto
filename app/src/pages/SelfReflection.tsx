import { FaAward } from 'react-icons/fa6';

import tree1 from '../assets/trees/1.webp';

import TitleBar from '../components/ui/TitleBar';
import UserCard from '../components/UserCard';

const SelfReflection = () => {
  return (
    <main className="overflow-hidden p-8">
      <div className="absolute left-0 -z-10 size-96 -translate-x-1/2 rounded-full bg-teal-300 opacity-40 blur-[100px]" />
      <div className="absolute right-0 top-1/4 -z-10 size-[36rem] translate-x-1/2 rounded-full bg-teal-300 opacity-80 blur-[200px]" />

      <div className="grid grid-cols-3">
        <div className="col-span-1 space-y-4 overflow-hidden rounded-3xl rounded-br-none bg-teal-50 p-4 dark:bg-teal-900">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative flex flex-col items-center rounded-xl border border-green-300 bg-gradient-to-br from-green-200 via-green-300 to-green-400 p-6 pb-6 text-center dark:from-green-300 dark:via-green-400 dark:to-green-500">
              <span className="text-lg font-semibold text-teal-900">
                Total Posted
              </span>
              <h3 className="text-5xl font-extrabold text-teal-800 drop-shadow">
                16
              </h3>
              <TitleBar
                content="Rides successfully completed"
                position="-top-2"
                color="green"
              />
            </div>

            <div className="relative flex flex-col items-center rounded-xl border border-teal-300 bg-gradient-to-br from-teal-200 via-teal-300 to-teal-400 p-6 pb-6 text-center shadow-xl dark:from-teal-300 dark:via-teal-400 dark:to-teal-500">
              <span className="text-lg font-semibold text-teal-900">
                Ride Posted
              </span>
              <h3 className="text-5xl font-extrabold text-teal-800 drop-shadow">
                20
              </h3>
              <TitleBar
                content="Total rides you have offered"
                position="-top-2"
                color="teal"
              />
            </div>
          </div>
          <div className="relative flex flex-col items-center rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-300 to-amber-100 p-6 shadow-lg dark:from-amber-400 dark:via-amber-100 dark:to-amber-200">
            <div className="relative mb-2 flex h-40 w-80 items-end justify-center">
              <svg
                width="320"
                height="160"
                viewBox="0 0 320 160"
                className="absolute left-0 top-0"
              >
                <path
                  d="M40,148 A120,120 0 0,1 280,160"
                  fill="none"
                  stroke="#facc15"
                  strokeWidth="36"
                  strokeLinecap="round"
                  opacity="0.3"
                />
                <path
                  d="M40,160 A120,120 0 0,1 240,64"
                  fill="none"
                  stroke="#f59e42"
                  strokeWidth="36"
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <span className="text-5xl font-extrabold text-amber-600">
                  320
                </span>
                <p className="font-semibold text-amber-700">Karma Points</p>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-amber-900">
              Karma Points are rewards you earn for sharing rides and helping
              others reduce their carbon footprint. The more you contribute, the
              more points you collect!
            </p>

            <button className="mt-5 rounded-full border border-dark/20 bg-amber-400 px-8 py-2 font-bold text-amber-900 shadow transition hover:bg-amber-500">
              Redeem
            </button>
            <TitleBar
              content="Redeem your Karma Points for exclusive rewards"
              position="top-2"
              color="amber"
            />
          </div>

          <div className="relative flex w-full flex-col items-center rounded-2xl border border-sky-300 bg-gradient-to-br from-sky-200 to-blue-100 p-6 shadow-lg dark:from-sky-300 dark:to-blue-200">
            <p className="mb-2 text-center text-xs text-sky-900">
              Total distance you have travelled by sharing rides. Every
              kilometer counts towards a greener planet!
            </p>
            <div className="flex w-full flex-col items-center">
              <div className="mb-1 flex w-full items-center justify-between">
                <span className="text-xs font-semibold text-sky-700">0 km</span>
                <span className="text-xs font-semibold text-sky-700">
                  1,250 km
                </span>
              </div>
              <div className="relative flex h-5 w-full items-center">
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500" />
                {/* <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center">
                  <svg
                    className="h-7 w-7 text-sky-100 drop-shadow"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 17c-1.1 0-2-.9-2-2V9c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2H5zm0 0v2m14-2v2" />
                  </svg>
                </div> */}
              </div>
            </div>

            <TitleBar
              content="Keep going! More distance, more impact."
              position="-bottom-2"
              color="sky"
            />
          </div>
        </div>
        <div className="col-span-1 rounded-3xl rounded-b-none bg-teal-50 dark:bg-teal-900">
          <div className="relative flex items-center justify-center space-y-3 rounded-3xl rounded-t-none border border-x-0 border-t-0 border-teal-300/50 bg-white py-5 dark:bg-dark">
            <div className="flex items-center justify-center gap-1">
              {Array.from({ length: 8 }).map((_, idx) => (
                <img
                  key={idx}
                  src="https://avatars.githubusercontent.com/u/107195487?v=4"
                  alt={`Avatar ${idx + 1}`}
                  className="size-10 rounded-full object-cover dark:border dark:border-teal-300/50"
                />
              ))}
            </div>
            <TitleBar
              content="People Impacted"
              position="-bottom-2"
              color="teal"
            />
          </div>
          <div className="m-4 mt-8 h-[31.5rem] scale-[1.06] overflow-hidden rounded-3xl bg-white shadow outline outline-1 outline-teal-300/50 dark:bg-teal-700">
            <UserCard />
          </div>
        </div>
        <div className="col-span-1 rounded-3xl rounded-bl-none bg-teal-50 dark:bg-teal-900">
          <div className="relative m-4 flex flex-col items-center rounded-3xl border border-green-200 bg-gradient-to-br from-green-200 via-green-100 to-green-300 p-0 shadow-lg dark:from-green-300 dark:via-green-200 dark:to-green-400">
            <svg
              className="absolute left-2 top-2 h-8 w-8 opacity-30"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path d="M12 2C7 7 2 12 12 22C22 12 17 7 12 2Z" fill="#22c55e" />
            </svg>
            <svg
              className="absolute right-4 top-6 h-6 w-6 opacity-20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle cx="12" cy="12" r="10" fill="#4ade80" />
            </svg>
            <svg
              className="absolute bottom-4 left-8 h-5 w-5 opacity-20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <ellipse cx="12" cy="12" rx="10" ry="6" fill="#bbf7d0" />
            </svg>
            <div className="z-10 flex w-full flex-col items-center p-6">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl font-bold text-green-700">
                  CO₂ Reduced
                </span>
              </div>
              <div className="relative flex items-center justify-center">
                <svg
                  className="absolute -top-4 left-1/2 -translate-x-1/2"
                  width="80"
                  height="40"
                  viewBox="0 0 80 40"
                >
                  <path
                    d="M10 35 Q40 0 70 35"
                    stroke="#4ade80"
                    strokeWidth="4"
                    fill="none"
                    opacity="0.5"
                  />
                </svg>
                <span className="relative text-5xl font-extrabold text-green-700 drop-shadow">
                  21
                </span>
                <span className="relative ml-2 text-2xl font-semibold text-green-700">
                  kg
                </span>
              </div>
              <p className="mt-4 text-center text-xs text-green-900">
                You have helped reduce carbon emissions by sharing rides. Thank
                you for your contribution to a cleaner environment!
              </p>

              <TitleBar
                content="Every ride you share makes the air cleaner!"
                position="-top-2"
                color="green"
              />
            </div>
          </div>

          <div>
            <img
              src={tree1}
              alt="Trees"
              className="h-72 w-full scale-150 object-contain"
            />
          </div>

          <div className="relative m-4 flex flex-col items-center rounded-3xl border border-amber-300 bg-gradient-to-br from-yellow-100 via-amber-100 to-yellow-200 p-0 shadow-lg">
            <svg
              className="absolute left-4 top-3 h-6 w-6 opacity-20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle cx="12" cy="12" r="10" fill="#fbbf24" />
            </svg>
            <svg
              className="absolute right-6 top-6 h-4 w-4 opacity-20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <rect x="6" y="6" width="12" height="12" rx="6" fill="#fde68a" />
            </svg>
            <svg
              className="absolute bottom-4 left-10 h-3 w-3 opacity-20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <polygon points="12,2 15,22 9,22" fill="#f59e42" />
            </svg>
            <div className="z-10 flex w-full flex-col items-center px-6 pb-6 pt-4">
              <span className="text-2xl font-extrabold text-amber-700">
                <FaAward className="mr-2 inline-block" />
                Thank You!
              </span>
              <p className="mt-1 text-center text-xs text-amber-900">
                Your positive impact is making the world a better place. We
                appreciate your efforts in sharing rides and helping the
                community!
              </p>

              <TitleBar
                content="Keep up the great work and collect more achievements!"
                position="-bottom-2"
                color="amber"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SelfReflection;
