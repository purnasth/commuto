import { TbBike } from 'react-icons/tb';
import { TbHeartHandshake } from 'react-icons/tb';
import { SiGitconnected } from 'react-icons/si';
import { PiPottedPlantBold } from 'react-icons/pi';

const AboutBrand = () => {
  return (
    <section id="brand" className="space-y-10 pb-10 md:space-y-16 md:pb-20">
      <div className="space-y-5 md:space-y-10">
        <h2 className="text-base font-medium">Brand Name</h2>
        <p className="text-sm">
          <strong>Commuto</strong> is more than a name—it's a philosophy.
          Derived from the Latin <em>"commutō"</em> (<em>com-</em> meaning
          "together" and <em>mutō</em> meaning "to change"), Commuto embodies
          our mission to transform the way we move, connect, and care for our
          communities and planet.
        </p>
        <div className="mt-2 flex flex-wrap justify-start gap-4">
          <div className="flex flex-col items-center">
            <TbBike className="inline-block text-2xl" />
            <span className="mt-1 text-xs">
              <strong className="font-extrabold">comm</strong>uting
            </span>
          </div>
          <div className="flex flex-col items-center">
            <TbHeartHandshake className="inline-block text-2xl" />
            <span className="mt-1 text-xs">
              <strong className="font-extrabold">comm</strong>unity
            </span>
          </div>
          <div className="flex flex-col items-center">
            <SiGitconnected className="inline-block text-2xl" />
            <span className="mt-1 text-xs">
              <strong className="font-extrabold">mu</strong>tual
            </span>
          </div>
          <div className="flex flex-col items-center">
            <PiPottedPlantBold className="inline-block text-2xl" />
            <span className="mt-1 text-xs">
              <strong className="font-extrabold">to</strong>:{' '}
              <span> (impact, change, connect, protect)</span>
            </span>
          </div>
        </div>
        <p className="text-sm italic text-teal-600">
          <strong className="font-extrabold">“Commuto”</strong> ={' '}
          <strong>Commuting</strong> + <strong>Community</strong> +{' '}
          <strong>Mutual</strong> + <strong>To</strong> (as an action: “to make
          an impact, “to change”, “to connect”, “to protect our planet”)
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>
            <strong>Commuting:</strong> The core activity—traveling together for
            efficiency, sustainability, and shared experience.
          </li>
          <li>
            <strong>Community:</strong> Fostering trusted, supportive groups
            within organizations and neighborhoods.
          </li>
          <li>
            <strong>Mutual:</strong> Emphasizing reciprocity, shared benefit,
            and collective impact.
          </li>
          <li>
            <strong>To:</strong> Signifying purposeful action—moving,
            connecting, helping, building, and protecting our planet for a
            better future.
          </li>
        </ul>
        <p className="text-sm">
          The name <strong>Commuto</strong> thus represents not just the act of
          commuting, but doing so together, mutually, as a community, moving
          toward shared goals and a healthier planet. Every ride, every
          connection, and every action is a step toward positive change.
        </p>
      </div>
    </section>
  );
};

export default AboutBrand;
