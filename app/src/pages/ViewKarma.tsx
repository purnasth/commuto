import { MdWorkspacePremium } from 'react-icons/md';

import CtoUI from '../components/ui/CtoUI';
import LogoBar from '../components/ui/LogoBar';

const karmaPointsDescription = `Karma Points are rewards you earn for sharing rides and helping others reduce their carbon footprint. The more you contribute, the more points you collect!`;

const distanceTiers = [
  { tier: 'Short', range: '0-2 km', multiplier: '1.0x' },
  { tier: 'Medium', range: '2-5 km', multiplier: '1.5x' },
  { tier: 'Long', range: '5-10 km', multiplier: '2.0x' },
  { tier: 'Very Long', range: '10+ km', multiplier: '2.5x' },
];

const sentimentBonuses = [
  { emoji: '😊', description: 'Satisfied', bonus: '+5' },
  { emoji: '😐', description: 'Neutral', bonus: '+2' },
  { emoji: '😠', description: 'Dissatisfied', bonus: '+0' },
];

const ViewKarma = () => {
  return (
    <>
      <main className="relative">
        <div className="container flex size-full max-w-4xl flex-col items-center justify-center gap-4 text-center">
          <span className="inline-flex items-center justify-center gap-2 rounded-full bg-teal-100 px-4 py-1 text-xs font-semibold uppercase text-teal-700 sm:text-sm md:text-base">
            <MdWorkspacePremium className="text-lg text-teal-700" />
            Every ride makes a difference!
          </span>
          <h1 className="mt-4 text-2xl font-bold capitalize leading-snug text-teal-500 md:text-4xl md:leading-snug lg:text-5xl lg:leading-snug">
            How to Earn Karma Points?
          </h1>
          <p className="max-w-2xl font-body text-xs sm:text-sm md:text-sm">
            {karmaPointsDescription}
          </p>
        </div>
      </main>
      <LogoBar />

      <main>
        <div className="container max-w-4xl space-y-10">
          <section className="space-y-2">
            <h2>What are Karma Points?</h2>
            <p className="text-sm">{karmaPointsDescription}</p>
          </section>
          <section className="space-y-2">
            <h2>Why are Karma Points Important?</h2>
            <p className="text-sm">
              Higher Karma Points increase your reputation on the platform,
              giving you access to exclusive features, priority matching, and
              special rewards. Maintaining a high Karma score helps you stand
              out as a trusted rider and encourages a positive community.
            </p>
          </section>
          <section className="space-y-2">
            <h2>How to Earn Karma Points?</h2>
            <p className="text-sm">You can earn Karma Points by:</p>
            <ul className="ml-6 list-disc space-y-1 text-sm">
              <li>Completing rides without cancellations or delays.</li>
              <li>Receiving positive feedback from passengers.</li>
              <li>Maintaining punctuality and clear communication.</li>
              <li>Helping passengers feel safe and comfortable.</li>
              <li>
                Consistently demonstrating responsible and respectful behavior.
              </li>
            </ul>
          </section>
          <section className="space-y-2">
            <h2>How are Karma Points Calculated?</h2>
            <div className="mb-4 text-sm">
              <p>
                Karma Points for riders are calculated using a transparent,
                tiered system based on ride distance and feedback quality.
              </p>
              <ul className="ml-6 mt-2 list-disc">
                <li>Ride distance (short, medium, long, very long)</li>
                <li>Feedback sentiment (Satisfied, Neutral, Dissatisfied)</li>
                <li>Base participation points</li>
                <li>Distance-based multiplier</li>
                <li>Sentiment bonus</li>
                <li>Minimum and maximum caps for system stability</li>
              </ul>
              <div className="mt-8">
                <span className="font-semibold">Formula used:</span>
                <pre
                  className="mt-2 overflow-x-auto border border-teal-200 bg-teal-50 p-3 text-xs text-teal-700 dark:border-teal-700 dark:bg-teal-950 dark:text-teal-300 md:w-fit md:text-sm"
                  aria-label="Karma points (P) equals the minimum of the maximum of (Base times Multiplier plus Sentiment Bonus, Min Floor), and Max Cap."
                >
                  {`P = min(max((Base × Multiplier) + SentimentBonus, MinFloor), MaxCap)`}
                </pre>
                <p className="mt-2">
                  For example, longer rides and positive feedback result in
                  higher points. See below for details.
                </p>
              </div>
            </div>
            <div className="space-y-8">
              <div className="mt-8">
                <h3>Distance Tiers & Multipliers</h3>
                <div className="overflow-x-auto">
                  <table className="mt-2 w-full border border-teal-200 text-xs dark:border-teal-600">
                    <thead>
                      <tr className="bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-600 dark:to-teal-800">
                        <th className="px-4 py-2 text-left">Tier</th>
                        <th className="px-4 py-2 text-left">Distance Range</th>
                        <th className="px-4 py-2 text-left">Multiplier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distanceTiers.map((tier, idx) => (
                        <tr
                          key={tier.tier}
                          className={
                            idx % 2 === 0
                              ? 'bg-white dark:bg-teal-950'
                              : 'bg-teal-50 dark:bg-teal-900'
                          }
                        >
                          <td className="border-b border-teal-100 px-4 py-2 dark:border-teal-600">
                            {tier.tier}
                          </td>
                          <td className="border-b border-teal-100 px-4 py-2 dark:border-teal-600">
                            {tier.range}
                          </td>
                          <td className="border-b border-teal-100 px-4 py-2 dark:border-teal-600">
                            {tier.multiplier}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h3>Sentiment-Based Bonuses</h3>
                <div className="overflow-x-auto">
                  <table className="mt-2 w-full border border-teal-200 text-xs dark:border-teal-600">
                    <thead>
                      <tr className="bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-600 dark:to-teal-800">
                        <th className="px-4 py-2 text-left">Emoji</th>
                        <th className="px-4 py-2 text-left">Description</th>
                        <th className="px-4 py-2 text-left">Bonus Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sentimentBonuses.map((bonus, idx) => (
                        <tr
                          key={bonus.description}
                          className={
                            idx % 2 === 0
                              ? 'bg-white dark:bg-teal-950'
                              : 'bg-teal-50 dark:bg-teal-900'
                          }
                        >
                          <td className="border-b border-teal-100 px-4 py-2 text-base dark:border-teal-600">
                            {bonus.emoji}
                          </td>
                          <td className="border-b border-teal-100 px-4 py-2 dark:border-teal-600">
                            {bonus.description}
                          </td>
                          <td className="border-b border-teal-100 px-4 py-2 dark:border-teal-600">
                            {bonus.bonus}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <main>
        <CtoUI
          title="Earn Karma Points Today!"
          description="Share a ride, Be a hero & Save the Environment! Earn Karma Points with every ride you share. Start your journey towards a greener planet today."
        />
      </main>
    </>
  );
};

export default ViewKarma;
