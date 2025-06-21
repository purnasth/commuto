import error from '../../assets/vector/no-rides.svg';

interface NoRideFoundProps {
  title?: string;
  message?: string;
}

const NoRideFound = ({
  title = 'No rides found',
  message = 'No rides found matching your criteria. Try adjusting your search or check back later!',
}: NoRideFoundProps) => {
  return (
    <>
      <main className="relative flex size-full flex-col items-center justify-center overflow-hidden bg-white p-5 shadow-lg dark:bg-dark">
        <div className="pointer-events-none absolute left-0 -z-10 size-96 -translate-x-1/2 rounded-full bg-teal-300 opacity-40 blur-[100px]" />
        <div className="pointer-events-none absolute right-0 top-1/4 -z-10 size-[36rem] translate-x-1/2 rounded-full bg-teal-300 opacity-80 blur-[200px]" />
        <img
          src={error}
          alt="Error 404"
          className="-mt-12 h-auto w-96 animate-floating select-none object-contain md:h-[60vh] md:w-auto"
          draggable="false"
        />
        <h2 className="pointer-events-none absolute inset-0 hidden size-full -translate-y-12 select-none items-center justify-center text-center text-8xl font-bold uppercase tracking-wider text-teal-950 mix-blend-difference dark:text-teal-700 md:flex">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm md:text-base text-center font-light">
          {message}
        </p>
      </main>
    </>
  );
};

export default NoRideFound;
