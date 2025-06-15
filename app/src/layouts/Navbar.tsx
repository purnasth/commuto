import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TbMenu2, TbPlus, TbSearch } from 'react-icons/tb';

import logo from '../assets/logo/commuto.svg';
import logoAlt from '../assets/logo/commuto-alt.svg';

import SideNav from './SideNav';
import { useTheme } from '../contexts/ThemeProvider';
import { getUserGreeting } from '../utils/functions';
import ThemeToggle from '../components/ui/ThemeToggle';
import { ROUTE_HOME, ROUTE_LOGIN, ROUTE_PROFILE } from '../constants/routes';

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
  const [visible, setVisible] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const location = useLocation();
  const { theme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      setVisible(prevScrollPos > currentScrollPos || currentScrollPos === 0);
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

  // Close nav on route change
  useEffect(() => {
    setIsOpen(false);
    document.body.style.overflow = 'auto';
  }, [location]);

  // Greet user
  useEffect(() => {
    setUserName(getUserGreeting());
  }, []);

  const toggleNav = () => {
    setIsOpen(!isOpen);
    document.body.style.overflow = !isOpen ? 'hidden' : 'auto';
  };

  const closeNav = () => {
    setIsOpen(false);
    document.body.style.overflow = 'auto';
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
            <div className="flex items-center gap-6">
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
