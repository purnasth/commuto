import { Link } from 'react-router-dom';
// import nepal from '../assets/images/nepal.svg';
import logo from '../assets/logo.svg';
import CareOurEarth from './ui/CareOurEarth';
import branch1 from '../assets/images/about/branch1.svg';
import branch2 from '../assets/images/about/branch2.svg';

import { ROUTE_ABOUT } from '../constants/routes';

const AboutInfo = () => {
  return (
    <>
      <section className="relative z-10 h-auto bg-teal-200 bg-[radial-gradient(circle,_#2dd4bf_10%,_transparent_10%),_radial-gradient(circle,_#f5f5f5_10%,_transparent_10%)] bg-[length:20px_20px] bg-[position:0_0,10px_10px] px-0 py-0 dark:bg-teal-500/50 dark:bg-[radial-gradient(circle,_rgba(94,234,212,0.2)_10%,_transparent_10%),_radial-gradient(circle,_rgba(240,253,250,0.2)_10%,_transparent_10%)] xl:h-screen">
        <div className="pointer-events-none absolute inset-0 -z-10 size-full select-none bg-gradient-to-b from-white via-transparent to-teal-300 dark:from-dark dark:via-transparent dark:to-dark"></div>
        <div className="flex h-full flex-col justify-between gap-0 sm:gap-16 md:items-center xl:flex-row xl:gap-0">
          <img
            src={branch1}
            alt="Human branch"
            className="order-3 mr-auto aspect-square size-72 object-contain md:order-1 md:size-96"
            draggable="false"
          />
          {/* <img
            src={nepal}
            className="absolute inset-0 -z-10 size-full scale-75 mix-blend-overlay"
          /> */}
          <div className="order-1 flex size-full max-w-4xl flex-col items-center justify-center gap-4 px-6 pb-12 text-center sm:pb-0 md:order-2">
            <CareOurEarth />

            <h2 className="mt-4 text-2xl font-bold capitalize leading-snug md:text-4xl md:leading-snug lg:text-5xl lg:leading-snug">
              A world where we all share resources to better preserve our
              planet.
            </h2>

            <p className="max-w-2xl font-body text-xs dark:text-shadow-dark sm:text-sm md:text-sm">
              Commuto is the platform that connects your co-workers sharing the
              same route to work. Share resources, reduce your carbon footprint,
              save money, and step towards a greener planet and sustainable
              future. We are committed to making a positive impact on the
              environment and helping you do the same. Join us in our mission to
              create a more sustainable future for all.
            </p>

            <Link
              to={ROUTE_ABOUT}
              className="transition-150 group mt-4 flex items-center gap-2.5 rounded-full bg-dark px-4 py-3 pr-5 text-sm font-light text-light shadow-lg hover:bg-teal-600 sm:text-sm md:mt-10"
            >
              <img
                src={logo}
                alt="Logo"
                className="group-hover:filter-white transition-150 size-4 object-contain sm:size-5"
              />
              More About Commuto
            </Link>
          </div>
          {/* <img
            src={logo}
            className="absolute inset-0 -z-20 size-full scale-75 object-contain opacity-50 drop-shadow"
          /> */}
          <img
            src={branch2}
            alt="Human branch"
            draggable="false"
            className="order-2 ml-auto aspect-square size-72 object-contain md:order-3 md:size-96"
          />
        </div>
      </section>
    </>
  );
};

export default AboutInfo;
