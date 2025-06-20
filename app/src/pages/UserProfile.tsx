import React, { useEffect, useState } from 'react';
import { UserDetails } from '../interfaces/types';
import { getStoredUser } from '../utils/functions';
import { ROUTE_LOGIN } from '../constants/routes';

import { MdOutlineCall } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Dashboard from './Dashboard';

const UserProfile: React.FC<UserDetails> = () => {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [rides] = useState([]);

  useEffect(() => {
    const storedUser = getStoredUser();

    if (storedUser) {
      setUser(storedUser);
    }
    // TODO: Fetch rides for the user and setRides here
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast.success('Logged out successfully!');
    window.location.href = ROUTE_LOGIN;
  };

  return (
    <main className="flex items-start justify-between gap-8 px-8">
      <Dashboard rides={rides} />

      <section className="relative col-span-1 w-full max-w-xl overflow-hidden rounded-2xl border shadow-md dark:border-teal-300/20">
        {user && (
          <div className="">
            <div className="pointer-events-none absolute -left-[20%] top-1/2 -z-10 size-48 rounded-full bg-teal-300 blur-[80px]" />
            <div className="pointer-events-none absolute -right-10 -top-12 -z-10 size-64 rounded-full bg-teal-300 blur-[50px]" />

            <div className="absolute -right-6 top-6 flex w-36 rotate-45 transform flex-col items-center justify-center">
              <span className="inline-block w-full bg-teal-600 py-1 text-center text-sm font-semibold text-light">
                {user.role}
              </span>
              <span className="text-sm text-yellow-400">
                {'★'.repeat(user.ratings ?? 0)}
                {'☆'.repeat(5 - (user.ratings ?? 0))}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white p-4 dark:bg-teal-950 sm:gap-6 sm:p-6">
              <img
                src={user.profilePicture}
                alt={user.fullname}
                className="size-14 rounded-full border-2 border-teal-400 object-contain shadow sm:size-20"
              />
              <div className="space-y-0.5">
                <h2 className="text-base font-semibold text-gray-800 dark:text-white sm:text-2xl">
                  {user.fullname}
                </h2>
                <div className="flex items-center gap-1">
                  <Link
                    to={`tel:${user.phone}`}
                    className="rounded-full border bg-teal-100 text-xl text-teal-800 shadow hover:bg-teal-200 dark:border-teal-300 sm:text-3xl"
                  >
                    <MdOutlineCall className="p-0.5 sm:p-1.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-full bg-teal-300 px-3 py-0.5 text-xs font-medium capitalize text-dark dark:bg-teal-400 dark:hover:bg-teal-500 sm:px-5 sm:py-1.5 sm:text-sm"
                  >
                    logout
                  </button>
                </div>
                {/* <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </p> */}
              </div>
            </div>
            <hr className="hidden dark:border-teal-300/20 sm:block" />
            <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
              <form className="space-y-4">
                {Object.entries(user).map(([key, value]) => {
                  // Skip rendering user_id and profilePicture
                  if (
                    key === 'id' ||
                    key === 'user_id' ||
                    key === 'profilePicture' ||
                    key === 'createdAt' ||
                    key === 'updatedAt' ||
                    key === 'loginTimestamp' ||
                    key === 'ratings' ||
                    key === 'role'
                  )
                    return null;

                  return (
                    <div key={key} className="relative mb-4">
                      <label
                        htmlFor={key}
                        className="mb-2 block capitalize text-teal-800 dark:text-light"
                      >
                        {key}
                      </label>
                      <input
                        name={key}
                        id={key}
                        type="text"
                        className="block w-full rounded-md bg-teal-100/80 px-4 py-2.5 text-base font-light text-dark outline outline-1 -outline-offset-1 outline-teal-500/50 placeholder:font-light placeholder:text-dark/40 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-teal-400 dark:bg-teal-900 dark:text-light dark:placeholder:text-light/60 active:dark:bg-teal-950 sm:text-lg"
                        value={value || ''}
                        readOnly
                      />
                    </div>
                  );
                })}
              </form>

              <hr className="dark:border-teal-300/20" />

              <div className="flex items-center justify-between">
                <span className="text-lg text-teal-400">
                  {'★'.repeat(user.ratings ?? 0)}
                  {'☆'.repeat(5 - (user.ratings ?? 0))}
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    to={`tel:${user.phone}`}
                    className="rounded-full border bg-teal-100 text-3xl text-teal-800 shadow hover:bg-teal-200 dark:border-teal-300"
                  >
                    <MdOutlineCall className="p-1.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-full bg-teal-300 px-4 py-1.5 text-sm font-medium capitalize text-dark dark:bg-teal-400 dark:hover:bg-teal-500"
                  >
                    logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default UserProfile;
