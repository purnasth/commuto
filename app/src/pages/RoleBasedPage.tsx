import { useParams } from 'react-router-dom';
import { userRoles } from '../constants/data';
import Error404 from './Error404';
import Title from '../components/ui/Title';
import RideBar from '../components/RideBar';
import LogoBar from '../components/ui/LogoBar';

const RoleBasedPage = () => {
  const { roleId } = useParams<{ roleId: string }>();
  const role = userRoles.find((r) => r.id === roleId);

  return (
    <>
      {role ? (
        <section className="overflow-hidden">
          <main className="z-auto pb-0">
            <div className="pointer-events-none absolute left-0 -z-10 size-96 -translate-x-1/2 rounded-full bg-teal-300 opacity-40 blur-[100px]" />
            <div className="pointer-events-none absolute right-0 top-1/4 -z-10 size-[36rem] translate-x-1/2 rounded-full bg-teal-300 opacity-80 blur-[200px]" />
            <Title title={role.title} description={role.description} />

            <RideBar role={role.id} />
          </main>

          <div className="my-12 md:my-16 lg:my-24">
            <LogoBar />
          </div>
          <main className="pt-0">
            <h2 className="mx-auto w-fit gap-2 rounded-full bg-teal-100 px-4 py-1 text-xs font-semibold uppercase text-teal-700 sm:text-sm md:text-base">
              {role.rulesSpan}
            </h2>
            <h3 className="mx-auto mb-12 mt-8 max-w-2xl text-center text-2xl font-bold capitalize leading-snug md:mb-20 md:text-4xl md:leading-snug lg:text-5xl lg:leading-snug">
              {role.rulesTitle}
            </h3>
            {/* <div className="mt-3 grid items-center gap-6 sm:mt-5 lg:mt-12 lg:grid-cols-2 lg:gap-12"> */}
            <div className="relative flex flex-col items-center gap-6 md:gap-0">
              <div className="absolute left-1/2 -z-20 size-96 -translate-x-1/2 rounded-full bg-teal-300 opacity-80 blur-[100px] dark:opacity-40" />

              <ul className="mx-auto grid max-w-5xl list-inside list-decimal gap-4 md:grid-cols-2 md:gap-6">
                {role.rules.map((rule, index) => (
                  <li
                    key={index}
                    className="relative overflow-hidden text-pretty rounded-2xl border bg-white p-6 text-base font-light leading-relaxed shadow-sm backdrop-blur dark:border-teal-300/50 dark:bg-teal-900 sm:text-sm md:p-8 lg:text-base"
                  >
                    <div className="pointer-events-none absolute -bottom-1/2 -left-[20%] -z-10 size-32 rounded-full bg-teal-400 blur-[50px]" />
                    <div className="pointer-events-none absolute -right-10 -top-12 -z-10 size-24 rounded-full bg-teal-300 blur-[50px]" />
                    <strong className="mr-1 rounded-full bg-teal-100 px-2 font-semibold text-teal-700">
                      {rule.title}:
                    </strong>
                    {rule.description}
                  </li>
                ))}
              </ul>
              <div className="pointer-events-none relative md:-translate-y-4">
                <img
                  src={role.heroImage}
                  alt={role.id}
                  className="h-96 w-auto animate-floating-up object-contain drop-shadow md:h-[70vh]"
                />
              </div>
            </div>
          </main>
          <div className="hidden dark:block">
            <LogoBar />
          </div>
        </section>
      ) : (
        <Error404 />
      )}
    </>
  );
};

export default RoleBasedPage;
