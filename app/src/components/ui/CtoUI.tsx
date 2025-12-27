// TODO: responsive on mobile, tablet and accessibility check

import { Link } from 'react-router-dom';
import { USER_ROLE } from '../../constants/enums';
import { ROUTE_LOGIN, ROUTE_PROFILE, ROUTE_ROLE } from '../../constants/routes';

import saveEarth from '../../assets/vector/save-earth-2.svg';

import { getFirstNameFromFullName, getStoredUser } from '../../utils/functions';

interface CtoUIProps {
  title: string;
  description: string;
}

const CtoUI = ({ title, description }: CtoUIProps) => {
  const user = getStoredUser();

  let cta = null;
  let profileGreeting = null;

  const userName = user?.fullname
    ? getFirstNameFromFullName(user.fullname)
    : null;

  if (!user) {
    profileGreeting = null;
    cta = (
      <Link
        to={ROUTE_LOGIN}
        className="transition-150 inline-flex items-center gap-1 rounded-full border border-teal-400 bg-gradient-to-tr from-teal-100 via-teal-300 to-teal-200 px-6 py-2.5 text-sm font-normal text-dark hover:scale-110 hover:bg-gradient-to-tl hover:from-teal-400 hover:to-teal-300 dark:border-teal-700 dark:bg-teal-900 dark:text-dark dark:hover:bg-teal-800"
      >
        Join Commuto!
      </Link>
    );
  } else {
    profileGreeting = (
      <Link
        to={ROUTE_PROFILE}
        className="transition-150 inline-flex items-center gap-1 rounded-full border border-teal-400 bg-gradient-to-tr from-teal-400 via-teal-200 to-teal-400 px-6 py-2.5 text-sm font-normal text-dark hover:scale-110 hover:bg-gradient-to-tl hover:from-teal-400 hover:to-teal-300 dark:border-teal-700 dark:bg-teal-900 dark:text-dark dark:hover:bg-teal-800"
      >
        <span className="animate-wave">&#128075;</span>
        Hi, {userName}!
      </Link>
    );

    const role = (user.role || '').toLowerCase();
    if (role === USER_ROLE.RIDER) {
      cta = (
        <Link
          to={ROUTE_ROLE.replace(':roleId', 'rider')}
          className="transition-150 inline-flex items-center gap-1 rounded-full border border-teal-400 bg-gradient-to-tr from-teal-200 via-teal-100 to-teal-400 px-6 py-2.5 text-sm font-normal text-dark hover:scale-110 hover:bg-gradient-to-tl hover:from-teal-400 hover:to-teal-300 dark:border-teal-700 dark:bg-teal-900 dark:text-dark dark:hover:bg-teal-800"
        >
          Post a Ride
        </Link>
      );
    } else if (role === USER_ROLE.PASSENGER) {
      cta = (
        <Link
          to={ROUTE_ROLE.replace(':roleId', 'passenger')}
          className="transition-150 inline-flex items-center gap-1 rounded-full border border-teal-400 bg-gradient-to-tr from-teal-200 via-teal-100 to-teal-400 px-6 py-2.5 text-sm font-normal text-dark hover:scale-110 hover:bg-gradient-to-tl hover:from-teal-400 hover:to-teal-300 dark:border-teal-700 dark:bg-teal-900 dark:text-dark dark:hover:bg-teal-800"
        >
          Find a Ride
        </Link>
      );
    }
  }

  return (
    <>
      <div className="relative mx-auto flex w-fit flex-col items-center justify-evenly rounded-2xl bg-gradient-to-br from-teal-200 via-teal-50 to-teal-400 shadow dark:from-teal-900 dark:via-dark dark:to-teal-700 md:gap-12 lg:flex-row">
        <div className="space-y-4 text-pretty p-6 sm:p-10 md:space-y-6 lg:p-16">
          <h2 className="text-2xl md:text-3xl">{title}</h2>
          <p className="max-w-lg font-body text-xs sm:text-sm md:text-sm">
            {description}
          </p>
          <div className="flex w-fit origin-left items-center space-x-4 md:scale-110 lg:pt-5">
            {profileGreeting}
            {cta}
          </div>
        </div>
        <div className="flex">
          <img
            src={saveEarth}
            alt="Celebrations"
            className="pointer-events-none h-60 w-full origin-bottom translate-y-2 scale-110 select-none object-cover md:h-96 md:translate-y-16 md:scale-125 lg:scale-150"
            draggable="false"
          />
        </div>
      </div>
    </>
  );
};

export default CtoUI;
