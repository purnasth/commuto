import { Link } from 'react-router-dom';
import error from '../assets/vector/bhaiya-ji.svg';
import { ROUTE_HOME } from '../constants/routes';

const BhaiyaJi = () => {
  return (
    <>
      <main className="flex h-screen flex-col items-center justify-center p-0">
        <img
          src={error}
          alt="Error 404"
          className="animate- floating h-auto w-96 select-none object-contain md:h-[75vh] md:w-auto"
          draggable="false"
        />
        <h1 className="pointer-events-none absolute inset-0 flex size-full select-none items-center justify-center text-8xl font-bold uppercase tracking-wider text-teal-950 mix-blend-difference">
          No rides found
        </h1>
        <Link
          to={ROUTE_HOME}
          className="mt-5 rounded-full bg-teal-300 px-6 py-2 font-semibold"
        >
          Go Home
        </Link>
      </main>
    </>
  );
};

export default BhaiyaJi;
