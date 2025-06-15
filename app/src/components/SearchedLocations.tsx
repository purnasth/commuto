import React from 'react';
import { PiMapPinAreaBold } from 'react-icons/pi';
import { highlightMatch } from '../utils/functions';

interface SearchedLocationsProps {
  suggestions: {
    id: string;
    name: string;
    address: string;
    type: string;
    lat?: number;
    lng?: number;
  }[];
  onSelect: (location: string, coordinates?: [number, number]) => void;
  onClose: () => void;
  searchQuery: string;
}

const SearchedLocations: React.FC<SearchedLocationsProps> = ({
  suggestions,
  onSelect,
  onClose,
  searchQuery,
}) => {
  return (
    <>
      <div className="space-y-2">
        <p className="font-normal text-dark dark:text-light">
          Searched Locations
        </p>

        <div className="scroll max-h-60 space-y-2 overflow-y-scroll">
          {suggestions.map((location) => (
            <div
              key={location.id}
              className="group flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-all duration-150 ease-in-out hover:bg-gray-100 hover:text-dark dark:border-light/50 dark:bg-teal-50/5 dark:hover:bg-teal-50"
              onClick={() => {
                onSelect(
                  location.name,
                  location.lat !== undefined && location.lng !== undefined
                    ? [location.lng, location.lat]
                    : undefined,
                );
                onClose();
              }}
            >
              <PiMapPinAreaBold className="text-xl text-teal-500" />
              <div>
                <p
                  className="text-sm font-medium"
                  dangerouslySetInnerHTML={{
                    __html: highlightMatch(location.name, searchQuery),
                  }}
                ></p>
                <p
                  className="text-xs text-gray-500 dark:text-gray-300 dark:group-hover:text-dark"
                  dangerouslySetInnerHTML={{
                    __html: highlightMatch(location.address, searchQuery),
                  }}
                ></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default SearchedLocations;
