import { useState, useEffect } from 'react';
import { TbMenu2, TbPlus, TbSearch } from 'react-icons/tb';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import logo from '../assets/logo/commuto.svg';
import logoAlt from '../assets/logo/commuto-alt.svg';

import { RIDE_STATUS } from '../constants/enums';
import { ROUTE_HOME, ROUTE_LOGIN, ROUTE_PROFILE } from '../constants/routes';

import { useSocket } from '../utils/useSocket';
import { useRideEvent } from '../utils/useRideEvent';

import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeProvider';

import SideNav from './SideNav';
import ThemeToggle from '../components/ui/ThemeToggle';
import { getFirstNameFromFullName } from '../utils/functions';

const navLinks = [
  {
    id: 1,
    title: 'Find a Ride',
    link: '/role/passenger',
    icon: <TbSearch className="text-sm md:text-lg" />,
  },
  {
    id: 2,
    title: 'Post a Ride',
    link: '/role/rider',
    icon: <TbPlus className="text-sm md:text-lg" />,
  },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [showRideButton, setShowRideButton] = useState(() => {
    const savedState = localStorage.getItem('showRideButton');
    return savedState ? JSON.parse(savedState) : false;
  });
  const { rideConfirmedData, resetRideConfirmed } = useRideEvent();
  const navigate = useNavigate();
  const { rideStatus } = useSocket();
  // const [socket] = useState(() => io(import.meta.env.VITE_SOCKET_URL));
  // useEffect(() => {
  //   if (socket) {
  //     socket.on('rideConfirmed', (ride) => {
  //       console.log('Ride Confirmed:', ride);
  //       navigate(
  //         `/ride-details?from=${encodeURIComponent(ride.from)}&to=${encodeURIComponent(
  //           ride.to,
  //         )}&message=${encodeURIComponent(ride.message)}&role=${encodeURIComponent(
  //           ride.role,
  //         )}&timestamp=${encodeURIComponent(ride.timestamp ?? '')}`,
  //       );
  //     });

  //     return () => {
  //       socket.off('rideConfirmed');
  //     };
  //   }
  // }, []);

  console.log('Navbar rideStatus:', rideStatus);

  const [visible, setVisible] = useState(true);
  const location = useLocation();
  const { theme } = useTheme();
  const { user } = useAuth();

  const userName = user?.fullname
    ? getFirstNameFromFullName(user.fullname)
    : null;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      setVisible(prevScrollPos > currentScrollPos || currentScrollPos === 0);
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

  useEffect(() => {
    localStorage.setItem('showRideButton', JSON.stringify(showRideButton));
  }, [showRideButton]);

  useEffect(() => {
    setIsOpen(false);
    document.body.style.overflow = 'auto';
  }, [location]);

  useEffect(() => {
    if (rideConfirmedData) {
      console.log('Navbar reacting to ride confirmation', rideConfirmedData);

      handleAfterRideConfirmed();

      resetRideConfirmed();
    }
  }, [rideConfirmedData, resetRideConfirmed]);

  const handleAfterRideConfirmed = () => {
    // You can trigger some function, redirect, show a badge, etc.
    setShowRideButton(true);
    console.log('Running navbar logic after ride confirmation');
  };

  const toggleNav = () => {
    setIsOpen(!isOpen);
    document.body.style.overflow = !isOpen ? 'hidden' : 'auto';
  };

  const closeNav = () => {
    setIsOpen(false);
    document.body.style.overflow = 'auto';
  };
  const handleClick = () => {
    const activeRide = localStorage.getItem('activeRide');

    if (!activeRide) {
      console.warn('No active ride found in localStorage');
      return;
    }

    const parseData = JSON.parse(activeRide);

    navigate(
      `/ride-details?from=${encodeURIComponent(parseData.from)}&to=${encodeURIComponent(
        parseData.to,
      )}&message=${encodeURIComponent(parseData.message ?? '')}&role=${encodeURIComponent(
        parseData.role,
      )}&timestamp=${encodeURIComponent(parseData.timestamp ?? '')}`,
    );
  };
  return (
    <>
      <nav
        className={`sticky top-0 z-40 w-full duration-[1s] ${window.scrollY > 0 ? 'bg-white py-3 dark:bg-dark md:py-3' : 'p-3 md:p-6'} ${visible ? '' : '-translate-y-full'}`}
        style={{ transitionProperty: 'transform, padding' }}
      >
        <div className={`flex items-center justify-between md:items-start`}>
          <Link
            to={ROUTE_HOME}
            className="inline-flex items-center gap-2.5 text-lg font-semibold text-teal-950 dark:text-teal-300 sm:text-3xl"
          >
            <img
              src={theme === 'dark' ? logo : logoAlt}
              alt="Logo"
              className="h-6 object-contain sm:h-9"
            />
          </Link>

          <div className="flex items-center justify-end gap-8">
            <ul className="hidden items-center gap-8 lg:flex">
              {navLinks.map((link) => (
                <li key={link.title}>
                  <Link
                    to={link.link}
                    className="inline-flex items-center gap-2"
                  >
                    {link.icon}
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2">
              {rideStatus === RIDE_STATUS.CONFIRMED && (
                <button
                  type="button"
                  onClick={handleClick}
                  aria-label="Active Ride"
                  className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 sm:px-4 sm:py-2 sm:text-base"
                >
                  <span className="size-2.5 animate-pulse rounded-full bg-green-600" />
                  Active
                </button>
              )}
              {rideStatus === RIDE_STATUS.COMPLETED && (
                <button
                  type="button"
                  onClick={handleClick}
                  aria-label="Feedback Pending"
                  className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700 sm:px-4 sm:py-2 sm:text-base"
                >
                  <span className="size-2 animate-pulse rounded-full bg-amber-600 sm:size-2.5" />
                  Feedback
                </button>
              )}
              {userName ? (
                <Link
                  to={ROUTE_PROFILE}
                  className="hidden items-center justify-center gap-2 rounded-full bg-teal-100 py-2 pl-4 pr-5 font-semibold text-teal-600 md:flex"
                >
                  <span className="animate-wave">&#128075;</span>
                  Hi, {userName}!
                </Link>
              ) : (
                <Link
                  to={ROUTE_LOGIN}
                  className="hidden rounded-full bg-teal-300 px-6 py-2 font-semibold dark:text-dark md:flex"
                >
                  Login
                </Link>
              )}
              <div className="group flex items-center gap-4 rounded-full py-1 pl-5 pr-1.5">
                <button
                  type="button"
                  onClick={toggleNav}
                  aria-label="Toggle Navigation"
                >
                  <TbMenu2 className="scale-150 text-base" />
                </button>

                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <SideNav
        closeNav={closeNav}
        isOpen={isOpen}
        navLinks={navLinks}
        userName={userName}
      />
    </>
  );
};

export default Navbar;
