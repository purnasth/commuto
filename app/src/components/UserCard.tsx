import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import {
  MdVerified,
  MdOutlineCall,
  MdOutlineMailOutline,
} from 'react-icons/md';

import { UserDetails } from '../interfaces/types';

import { ROUTE_LOGIN } from '../constants/routes';

import { useAuth } from '../hooks/useAuth';

import { getCurrentUser } from '../utils/authApi';
import { getUserId, getUserData } from '../utils/auth';

import ConfirmDialog from './ui/ConfirmDialog';

const UserCard: React.FC = () => {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const userId = getUserId();
    const userData = getUserData();

    if (!userId || !userData) return;

    getCurrentUser()
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        } else {
          toast.error('User not found');
        }
      })
      .catch(() => {
        toast.error('Failed to fetch user details from server');
      });
  }, []);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      await logout();

      toast.success('Logged out successfully!');
      navigate(ROUTE_LOGIN);
    } catch {
      toast.error('Logout failed. Please try again.');
    }
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const { fullname, email, profilePicture, role, address, phone } = user || {};

  return (
    <>
      {user && (
        <div className="relative">
          <div className="pointer-events-none absolute -left-[20%] top-1/3 -z-10 size-48 rounded-full bg-teal-300 blur-[80px]" />
          <div className="pointer-events-none absolute -bottom-32 -right-10 -z-10 size-32 rounded-full bg-teal-300 blur-[50px]" />

          <div className="relative -z-10 m-2.5 flex h-28 items-end justify-between overflow-hidden rounded-2xl border border-teal-300 bg-gradient-to-br from-teal-200 via-teal-300 to-teal-400 dark:from-teal-400 dark:via-teal-500 dark:to-teal-600 md:h-40">
            <div className="absolute -right-9 top-6 z-10 flex w-36 rotate-45 transform flex-col items-center justify-center">
              <span className="inline-flex w-full items-center justify-center gap-1 bg-teal-600 py-1 text-center text-sm font-normal text-white dark:bg-teal-700">
                {role}
              </span>
            </div>

            <svg
              className="pointer-events-none absolute inset-0 h-full w-full opacity-40 dark:opacity-80"
              width="100%"
              height="100%"
              viewBox="0 0 200 80"
              fill="none"
              preserveAspectRatio="none"
            >
              <defs>
                <pattern
                  id="pattern-waves"
                  patternUnits="userSpaceOnUse"
                  width="40"
                  height="40"
                >
                  <path
                    d="M0 20 Q10 0 20 20 T40 20"
                    stroke="#2dd4bf"
                    strokeWidth="2"
                    fill="none"
                  />
                </pattern>
              </defs>
              <rect width="200" height="80" fill="url(#pattern-waves)" />
            </svg>
          </div>

          <div className="flex flex-col items-center justify-center">
            <img
              src={profilePicture}
              alt={fullname}
              className="-mt-14 size-24 rounded-full border-8 border-white bg-teal-100 object-contain dark:border-teal-700 sm:size-28"
            />
            <h2 className="inline-flex items-center gap-1 text-xl font-semibold text-gray-800 dark:text-white sm:text-2xl">
              {fullname}
              <MdVerified className="text-teal-500 dark:text-teal-300" />
            </h2>
            <h3 className="text-sm font-light md:text-base">{address}</h3>
            <div className="mt-2 flex items-center gap-2 md:mt-4">
              <Link
                to={`tel:${user.phone}`}
                className="flex items-center justify-center gap-1 rounded-full border border-teal-300/50 bg-teal-100 px-2 text-sm text-teal-800 shadow hover:bg-teal-200 dark:border-teal-300"
              >
                <MdOutlineCall />
                {phone}
              </Link>
              <Link
                to={`mailto:${email}`}
                className="flex items-center justify-center gap-1 rounded-full border border-teal-300/50 bg-teal-100 px-2 text-sm text-teal-800 shadow hover:bg-teal-200 dark:border-teal-300"
              >
                <MdOutlineMailOutline />
                {email}
              </Link>
            </div>

            <hr className="my-4 w-[96%] border-gray-200 dark:border-teal-300/20 md:my-8" />

            <p className="px-8 text-center text-xs text-teal-900 dark:text-white">
              Welcome to your profile, {fullname}! Here you can view your
              account details, contributions and achievements, and a detailed
              dashboard of your activities.
            </p>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 rounded-full border border-dark/20 bg-teal-300 px-8 py-2 font-bold text-teal-900 shadow transition hover:bg-teal-500 dark:bg-teal-400"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Confirm Logout?"
        description="Are you sure you want to logout? You will need to login again to access your account."
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </>
  );
};

export default UserCard;
