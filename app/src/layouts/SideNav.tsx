import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { SideNavProps } from '../interfaces/types';
// import logo from '../assets/logo.svg';
import { IoClose } from 'react-icons/io5';
import { ROUTE_LOGIN, ROUTE_PROFILE } from '../constants/routes';

const routeLinks = [
  {
    id: 1,
    title: 'Home',
    link: '/',
  },
  {
    id: 2,
    title: 'About',
    link: '/about',
  },
  {
    id: 3,
    title: 'Leaderboard',
    link: '/leaderboard',
  },
  {
    id: 4,
    title: 'Support & FAQ',
    link: '/help',
  },
];

const SideNav: React.FC<SideNavProps> = ({
  isOpen,
  closeNav,
  navLinks,
  userName,
}) => {
  return (
    <div className="relative">
      <div
        className={`transition-700 fixed inset-0 z-50 bg-black/30 backdrop-blur-sm ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeNav}
      />

      <div
        className={`fixed left-0 top-0 m-5 w-fit transition-all duration-500 ease-in-out sm:left-auto sm:right-0 sm:m-8 ${
          isOpen ? 'translate-x-0' : '-translate-x-[200%] sm:translate-x-[200%]'
        } z-50`}
      >
        <div className="flex flex-col gap-6 sm:items-end sm:justify-end">
          <div className="flex sm:ml-auto sm:items-end sm:justify-end">
            <button
              type="button"
              aria-label="Close Menu"
              onClick={closeNav}
              className="transition-100 rounded-full bg-dark/50 p-0.5 text-lg text-teal-50 hover:bg-teal-300 hover:text-dark dark:bg-light/30 dark:text-light dark:hover:bg-teal-500 dark:hover:text-dark"
            >
              <IoClose />
            </button>
          </div>

          <ul className="space-y-5">
            {routeLinks.map((link) => (
              <li
                key={link.id}
                className="group w-fit sm:ml-auto sm:text-right"
              >
                <NavLink
                  to={link.link}
                  className={({ isActive }) =>
                    `navlink ${isActive ? 'bg-teal-700 text-light dark:bg-teal-500 dark:text-dark' : 'bg-dark/50 text-light dark:bg-light/30 dark:text-light'}`
                  }
                >
                  {link.title}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* <hr className="border-teal-50 lg:hidden" /> */}

          <ul className="flex flex-col gap-3 py-4 lg:hidden">
            {navLinks.map((link) => (
              <li key={link.id} className="group">
                <NavLink
                  key={link.id}
                  to={link.link}
                  className={({ isActive }) =>
                    `transition-150 inline-flex items-center gap-2 rounded-full py-3 pl-4 pr-5 text-xs font-normal transition-colors duration-200 hover:bg-teal-400 hover:text-dark ${isActive ? 'bg-teal-700 text-light dark:bg-teal-500 dark:text-dark' : 'bg-dark/50 text-light dark:bg-light/30 dark:text-light'}`
                  }
                >
                  {link.icon}
                  {link.title}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* <hr className="border-teal-300/40 md:hidden" /> */}

          <div>
            {userName ? (
              <Link
                to={ROUTE_PROFILE}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-teal-100 py-2 pl-4 pr-5 text-sm font-semibold text-teal-600 md:hidden md:text-base"
              >
                <span className="animate-wave">&#128075;</span>
                Hi, {userName}!
              </Link>
            ) : (
              <Link
                to={ROUTE_LOGIN}
                className="inline-flex rounded-full bg-teal-300 px-6 py-2 font-semibold dark:text-dark md:hidden"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideNav;
