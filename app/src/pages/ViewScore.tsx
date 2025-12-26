import Confetti from 'react-confetti';
import { TbTrophy } from 'react-icons/tb';

import { useCreditScore } from '../hooks/useCreditScore';

import CtoUI from '../components/ui/CtoUI';
import LogoBar from '../components/ui/LogoBar';

const ViewScore = () => {
  const { creditScore } = useCreditScore();

  return (
    <>
      <Confetti
        // width={window.innerWidth}
        // height={window.innerHeight}
        // numberOfPieces={200}
        recycle={false}
        gravity={0.1}
        initialVelocityY={10}
        // tweenDuration={1000}
      />
      <main className="relative pb-0">
        <div className="container flex size-full max-w-4xl flex-col items-center justify-center gap-4 text-center">
          <span className="inline-flex items-center justify-center gap-2 rounded-full bg-teal-100 px-4 py-1 text-xs font-semibold uppercase text-teal-700 sm:text-sm md:text-base">
            <TbTrophy className="text-lg text-teal-700" />
            Every shared journey matters!
          </span>
          <h1 className="mt-4 text-2xl font-bold capitalize leading-snug text-teal-500 md:text-4xl md:leading-snug lg:text-5xl lg:leading-snug">
            View your credit score
          </h1>
          <p className="max-w-2xl font-body text-xs sm:text-sm md:text-sm">
            Your credit score reflects your reliability and trustworthiness as a
            passenger. Maintain a good credit score to unlock more ride
            opportunities on our platform.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 p-3 px-2 pt-0 md:flex-row md:justify-between md:gap-0">
          <div className="relative mx-auto flex translate-y-10 flex-col items-center md:translate-y-12">
            <div className="relative mb-0 flex h-40 w-80 items-end justify-center drop-shadow-xl md:mb-2 md:h-48 md:w-96">
              <svg viewBox="0 0 320 160" className="absolute left-0 top-0">
                <path
                  d="M40,148 A120,120 0 0,1 280,160"
                  fill="none"
                  stroke="#5eead4"
                  strokeWidth="36"
                  strokeLinecap="round"
                  opacity="0.3"
                />
                <path
                  d="M40,160 A120,120 0 0,1 240,64"
                  fill="none"
                  stroke="#14b8a6"
                  strokeWidth="36"
                  strokeLinecap="round"
                />
              </svg>
              <div className="mb-10 text-center">
                <span className="text-5xl font-extrabold text-teal-500 dark:text-teal-500">
                  {creditScore}
                </span>
                {/* <p className="text-xs font-semibold text-teal-500 dark:text-teal-500">
                  Credit Score
                </p> */}
              </div>
            </div>
          </div>
        </div>
      </main>
      <LogoBar />

      <main>
        <div className="container max-w-4xl space-y-10">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">What is Credit Score?</h2>
            <p className="text-sm">
              Your credit score is a measure of your reliability and
              trustworthiness as a passenger. It is calculated based on your
              ride completion rate, feedback from riders, and responsible ride
              behavior. A higher score means you are a preferred passenger for
              future rides.
            </p>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Why is Credit Score Important?
            </h2>
            <p className="text-sm">
              A better credit score gives you higher priority when matching with
              rides, meaning you are more likely to be paired with preferred
              riders and routes. It also increases your trust level on the
              platform, which can lead to access to exclusive ride options and
              faster booking. Maintaining a good score ensures you get the best
              possible experience and opportunities.
            </p>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              How to Improve Your Credit Score?
            </h2>
            <p className="text-sm">
              To improve your credit score, focus on these key actions:
            </p>
            <ul className="ml-6 list-disc space-y-1 text-sm">
              <li>
                Complete more rides as a passenger to build your ride history.
              </li>
              <li>
                Ensure you receive positive feedback from riders by being
                punctual, polite, and cooperative.
              </li>
              <li>
                Avoid cancellations and always show up for your booked rides.
              </li>
              <li>
                Communicate clearly and promptly with riders about your plans.
              </li>
              <li>
                Maintain a consistent record of responsible ride behavior.
              </li>
            </ul>
          </section>
        </div>
      </main>

      <main>
        <CtoUI
          title="Improve Your Credit Score Today!"
          description="Start joining rides and building your reputation on Commuto. The more reliable and trustworthy you are, the better your credit score will be. Take the first step towards becoming a preferred passenger now!"
        />
      </main>
    </>
  );
};

export default ViewScore;
