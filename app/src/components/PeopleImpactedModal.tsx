import Modal from './ui/Modal';
import { AVATAR_GRID_CONFIG } from '../constants/enums';
import { Person } from '../interfaces/types';

interface PeopleImpactedModalProps {
  onClose: () => void;
  people: Person[];
}

const PeopleImpactedModal = ({ onClose, people }: PeopleImpactedModalProps) => {
  const { DEFAULT_AVATAR_URL, MAX_VISIBLE_SLOTS } = AVATAR_GRID_CONFIG;

  return (
    <>
      <Modal onClose={onClose} className="w-full">
        <div className="mx-auto w-full max-w-md overflow-hidden border border-teal-300 bg-white shadow dark:border-teal-300/70 dark:bg-dark">
          <h3
            id="people-impacted-modal-title"
            className="border-b border-teal-300/50 bg-teal-100 p-5 text-lg font-medium text-dark dark:bg-teal-950 dark:text-teal-300 md:text-lg"
          >
            People You've Impacted ({people.length})
          </h3>

          <div className="max-h-96 space-y-3 overflow-y-auto bg-teal-50 p-3 dark:bg-teal-900 md:p-5">
            {people.map((person, index) => (
              <div
                key={person.id}
                className="flex items-center gap-3 rounded-xl border border-teal-200/70 bg-gradient-to-br from-white via-teal-100 to-white p-3 shadow-sm transition-all hover:border-teal-300 hover:shadow-sm dark:border-teal-700 dark:from-teal-950/20 dark:to-teal-700 dark:hover:border-teal-500"
              >
                <div className="relative">
                  <img
                    src={person.img || DEFAULT_AVATAR_URL}
                    alt={person.name}
                    className="size-12 rounded-full border-2 border-teal-200 bg-white object-cover dark:border-teal-600 dark:bg-dark"
                  />
                  {index < MAX_VISIBLE_SLOTS && (
                    <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-teal-500 text-xs font-medium text-white">
                      {index + 1}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{person.name}</h3>
                  <p className="text-xs opacity-80">
                    Total rides completed: <strong>{person.rideCount}</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PeopleImpactedModal;
