import { AVATAR_GRID_CONFIG } from '../../constants/enums';
import Tooltip from './Tooltip';

interface Person {
  id: number;
  name: string;
  img: string;
}

interface PeopleAvatarGridProps {
  people: Person[];
  className?: string;
}

const AvatarSlot = ({ person, index }: { person?: Person; index: number }) => {
  const hasData = person !== undefined;

  const { DEFAULT_AVATAR_URL, EMPTY_SLOT_MESSAGE } = AVATAR_GRID_CONFIG;

  return (
    <div
      className={`relative ${index !== 0 ? '-ml-2.5' : ''} transition-150 group hover:z-50`}
    >
      <Tooltip content={hasData ? person.name : EMPTY_SLOT_MESSAGE}>
        <img
          src={hasData ? person.img : DEFAULT_AVATAR_URL}
          alt={hasData ? person.name : 'Unlock slot'}
          className={`transition-150 inline-block aspect-square size-9 rounded-full object-cover group-hover:scale-110 md:size-11 ${
            hasData
              ? 'border-2 border-teal-300 group-hover:border-teal-400 dark:border-teal-700 dark:group-hover:border-teal-600'
              : 'transition-150 border-2 border-teal-300 bg-light p-1 grayscale hover:grayscale-0 group-hover:border-teal-400 dark:border-0 dark:border-teal-700 dark:bg-dark dark:group-hover:border-teal-600'
          }`}
        />
      </Tooltip>
    </div>
  );
};

const OverflowTooltipContent = ({
  overflowPeople,
}: {
  overflowPeople: Person[];
}) => (
  <div>
    {overflowPeople.map((person, idx) => (
      <div
        key={person.id}
        className={`flex items-center gap-1.5 px-0 py-1.5 ${idx !== overflowPeople.length - 1 ? 'border-b border-light/20 dark:border-dark/20' : ''}`}
      >
        <img
          src={person.img}
          alt={person.name}
          className="size-9 rounded-full border border-light/30 object-cover dark:border-dark/30"
        />
        <span className="truncate text-sm">{person.name}</span>
      </div>
    ))}
  </div>
);

const OverflowBadge = ({
  overflowCount,
  overflowPeople,
}: {
  overflowCount: number;
  overflowPeople: Person[];
}) => (
  <Tooltip content={<OverflowTooltipContent overflowPeople={overflowPeople} />}>
    <span className="transition-150 relative z-auto -ml-2.5 inline-flex aspect-square size-9 items-center justify-center rounded-full border-2 border-white bg-gradient-to-tl from-teal-400 via-teal-200 to-teal-500 text-sm font-medium hover:scale-110 hover:bg-gradient-to-tr dark:border-teal-700 dark:bg-gradient-to-tr dark:from-teal-600 dark:via-teal-500 dark:to-teal-400 dark:text-dark md:size-11 md:text-base">
      +{overflowCount}
    </span>
  </Tooltip>
);

const PeopleAvatarGrid = ({ people }: PeopleAvatarGridProps) => {
  const { MAX_VISIBLE_SLOTS } = AVATAR_GRID_CONFIG;

  // Create avatar slots array
  const avatarSlots = Array.from({ length: MAX_VISIBLE_SLOTS }, (_, index) => (
    <AvatarSlot key={index} person={people[index]} index={index} />
  ));

  // Calculate overflow
  const hasOverflow = people.length > MAX_VISIBLE_SLOTS;
  const overflowCount = people.length - MAX_VISIBLE_SLOTS;
  const overflowPeople = people.slice(MAX_VISIBLE_SLOTS);

  return (
    <div className={`flex items-center justify-center gap-1`}>
      <div className="flex items-center">{avatarSlots}</div>

      {hasOverflow && (
        <OverflowBadge
          overflowCount={overflowCount}
          overflowPeople={overflowPeople}
        />
      )}
    </div>
  );
};

export default PeopleAvatarGrid;
