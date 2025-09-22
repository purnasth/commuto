import { useState, useEffect } from 'react';
import { TbPlus } from 'react-icons/tb';

import { AVATAR_GRID_CONFIG } from '../../constants/enums';
import { AverageScoreResult } from '../../interfaces/types';

import {
  getRemainingEmojis,
  getScoreDescription,
  getAverageScoreEmoji,
} from '../../utils/utils';
import { fetchUserAverageScore } from '../../utils/api';

import Tooltip from './Tooltip';
import PeopleImpactedModal from '../PeopleImpactedModal';

interface Person {
  id: number;
  name: string;
  img: string;
}

interface PeopleAvatarGridProps {
  people: Person[];
  userId: number;
  className?: string;
}

const PeopleImpactedWithScore = ({ people, userId }: PeopleAvatarGridProps) => {
  const [showModal, setShowModal] = useState(false);
  const [averageScoreData, setAverageScoreData] =
    useState<AverageScoreResult | null>(null);

  const { DEFAULT_AVATAR_URL, MAX_VISIBLE_SLOTS, EMPTY_SLOT_MESSAGE } =
    AVATAR_GRID_CONFIG;

  // Fetch average score on component mount
  useEffect(() => {
    const fetchScore = async () => {
      try {
        const scoreData = await fetchUserAverageScore(userId);
        setAverageScoreData(scoreData);
      } catch (error) {
        console.error('Error fetching average score:', error);
        // API utility already handles error fallbacks
      }
    };

    fetchScore();
  }, [userId]);

  const slots = Array.from(
    { length: MAX_VISIBLE_SLOTS },
    (_, index) => people[index] || null,
  );

  const handleShowModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <section className="flex items-center justify-center gap-3">
        <div
          className={`relative flex items-center rounded-full border border-teal-300 bg-gradient-to-br from-teal-100 via-teal-300 to-teal-50 px-2.5 py-2 ${people.length > MAX_VISIBLE_SLOTS && 'pr-0'}`}
        >
          {slots.map((person: Person | null, index: number) => {
            const hasData = Boolean(person?.img);
            return (
              <div
                key={person?.id || `empty-${index}`}
                className={`relative ${index !== 0 ? '-ml-2.5' : ''} transition-150 group hover:z-50`}
              >
                <Tooltip content={hasData ? person!.name : EMPTY_SLOT_MESSAGE}>
                  <img
                    src={hasData ? person!.img : DEFAULT_AVATAR_URL}
                    alt={hasData ? person!.name : 'Unlock slot'}
                    className={`transition-150 inline-block aspect-square size-9 rounded-full object-cover group-hover:scale-110 md:size-11 ${
                      hasData
                        ? 'border-2 border-teal-300 group-hover:border-teal-400 dark:border-teal-700 dark:group-hover:border-teal-600'
                        : 'transition-150 border-2 border-teal-300 bg-light p-1 grayscale hover:grayscale-0 group-hover:border-teal-400 dark:border-0 dark:border-teal-700 dark:bg-dark dark:group-hover:border-teal-600'
                    }`}
                  />
                </Tooltip>
              </div>
            );
          })}

          {people.length > MAX_VISIBLE_SLOTS && (
            <button
              type="button"
              onClick={handleShowModal}
              aria-label="Show all people impacted"
              className={`transition-150 relative inline-flex aspect-square size-9 -translate-x-2.5 items-center justify-center rounded-full border-2 border-teal-300 bg-light bg-gradient-to-br from-teal-50 via-teal-300 to-teal-50 object-cover p-1 text-2xl text-teal-600 shadow hover:z-50 hover:border-teal-400 hover:bg-gradient-to-br hover:from-teal-400 hover:via-teal-200 hover:to-teal-300 dark:border-0 dark:border-teal-700 dark:bg-dark dark:hover:border-teal-600 dark:hover:from-teal-600 dark:hover:via-teal-700 dark:hover:to-teal-800 md:size-11`}
            >
              <TbPlus />
            </button>
          )}
        </div>

        {averageScoreData && averageScoreData.averageScore !== null && (
          <div className="relative flex items-center gap-0.5 rounded-full border border-teal-300 bg-gradient-to-bl from-teal-200 via-teal-100 to-teal-300 py-2 pl-1.5 pr-4">
            <Tooltip
              content={`Your average score: ${getScoreDescription(averageScoreData.averageScore)}`}
            >
              <span className="text-4xl">
                {getAverageScoreEmoji(averageScoreData.averageScore)}
              </span>
            </Tooltip>
            <div className="text-sm">
              <span className="opacity-80 grayscale">
                {getRemainingEmojis(averageScoreData.averageScore).join('')}
              </span>
              <p className="text-xs">
                Over{' '}
                <strong className="font-bold">
                  {averageScoreData.totalFeedback - 1}+
                </strong>{' '}
                {averageScoreData.totalFeedback === 1
                  ? 'feedback'
                  : 'feedbacks'}
              </p>
            </div>
          </div>
        )}
      </section>

      {showModal && (
        <PeopleImpactedModal onClose={handleCloseModal} people={people} />
      )}
    </>
  );
};

export default PeopleImpactedWithScore;
