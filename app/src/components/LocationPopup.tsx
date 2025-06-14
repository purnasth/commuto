import React, { useEffect, useState } from 'react';
import { TbCurrentLocation, TbMapPin, TbSearch, TbX } from 'react-icons/tb';
import { PiMapPinSimpleAreaBold } from 'react-icons/pi';
import { mockLocations } from '../constants/data';
import SearchedLocations from './SearchedLocations';
import MapPopup from './MapPopup';
import { LocationPopupProps } from '../interfaces/types';
import useDisableScroll from '../hooks/useDisableScroll';
import { truncateLocation } from '../utils/functions';
import useAutoFocus from '../hooks/useAutoFocus';

const LocationPopup: React.FC<LocationPopupProps> = ({
  onClose,
  onSelect,
  initialSearchQuery,
  // activeInput,
}) => {
  useDisableScroll();

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [suggestions, setSuggestions] = useState<typeof mockLocations>([]);
  const [showMapPopup, setShowMapPopup] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState<string | null>(null);

  const inputRef = useAutoFocus<HTMLInputElement>();

  useEffect(() => {
    if (searchQuery.length > 2) {
      const filtered = mockLocations.filter(
        (loc) =>
          loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          loc.address.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );
          const data = await response.json();
          const truncatedLocation = truncateLocation(data.display_name);
          onSelect(truncatedLocation, [longitude, latitude]);
          onClose();
        },
        (error) => {
          console.error('Error fetching location:', error);
        },
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  };

  const handleChooseOnMap = () => {
    setMapSearchQuery(searchQuery); // Pass the current search query to the map
    setShowMapPopup(true);
  };

  const handleMapSelect = (location: string, coordinates?: [number, number]) => {
    onSelect(location, coordinates);
    setShowMapPopup(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="relative flex size-full items-center justify-center space-y-4 bg-white p-4 dark:bg-dark md:p-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 z-50 rounded-full border border-teal-500/20 bg-teal-50 p-1.5 text-teal-500 shadow hover:bg-teal-100 dark:bg-teal-300/10 dark:text-teal-500 dark:hover:bg-teal-300/20"
          >
            <TbX className="text-2xl" />
          </button>
          <div className="mx-auto h-fit w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium">Choose Location</h2>
            </div>

            <div className="group relative">
              <input
                type="text"
                placeholder="Search for location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                ref={inputRef}
                className="w-full rounded-lg p-3 pl-4 pr-11 text-base text-black outline outline-1 outline-teal-300 placeholder:text-base focus-visible:outline-2 focus-visible:outline-teal-300 dark:bg-dark dark:text-light"
                id="searchLocation"
              />
              <label htmlFor="searchLocation">
                <TbSearch className="pointer-events-none absolute right-3 top-3 bg-white text-2xl text-dark/40 dark:bg-dark dark:text-teal-300" />
              </label>

              <p className="mt-2 text-xs">
                {searchQuery.length > 2 && suggestions.length === 0 ? (
                  <>
                    No results found?{' '}
                    <button
                      type="button"
                      onClick={handleChooseOnMap}
                      className="bg-teal-100 font-medium text-teal-500 underline hover:text-teal-600"
                    >
                      Choose on Map
                    </button>{' '}
                    instead
                  </>
                ) : searchQuery.length > 2 && suggestions.length > 0 ? (
                  <>
                    Results matching{' '}
                    <span className="bg-teal-100 font-semibold dark:text-dark">
                      "{searchQuery}"
                    </span>{' '}
                    are shown below.
                  </>
                ) : (
                  'Enter at least three characters to get started.'
                )}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={getCurrentLocation}
                className="transition-300 inline-flex w-full items-start justify-center gap-2 rounded-lg border border-teal-400 p-3 text-sm text-teal-500 hover:bg-teal-50 md:justify-start md:gap-3"
              >
                <TbCurrentLocation className="text-lg text-teal-500 md:text-xl" />
                <span className="font-medium">Current location</span>
              </button>
              <button
                type="button"
                onClick={handleChooseOnMap}
                className="transition-300 group inline-flex w-full items-start justify-center gap-2 rounded-lg border border-teal-300 bg-teal-300 p-3 text-sm font-semibold text-dark hover:bg-teal-50 hover:text-teal-500 hover:shadow-none md:justify-start md:gap-3"
              >
                <PiMapPinSimpleAreaBold className="transition-300 text-lg text-dark/60 group-hover:text-teal-500 md:text-xl" />
                <span className="font-medium">Choose on Map</span>
              </button>
            </div>

            <hr className="dark:opacity-50" />

            <div className="space-y-2">
              <p className="font-normal text-dark dark:text-light">
                Suggested for you
              </p>
              <button
                type="button"
                className="group flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-all duration-150 ease-in-out hover:bg-teal-50 dark:border-light/50 dark:bg-teal-300/10 dark:hover:bg-teal-50"
                onClick={() => {
                  onSelect('Kathmandu BernHardt College', undefined);
                  onClose();
                }}
              >
                <TbMapPin className="text-xl text-teal-500" />
                <div className="text-start">
                  <p className="text-sm font-medium dark:group-hover:text-dark">
                    Kathmandu BernHardt College
                  </p>
                  <p className="text-xs text-gray-500">Bafal, Kathmandu</p>
                </div>
              </button>
            </div>

            {suggestions.length > 0 && (
              <>
                <hr className="dark:opacity-50" />
                <SearchedLocations
                  suggestions={suggestions}
                  onSelect={onSelect}
                  onClose={onClose}
                  searchQuery={searchQuery}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {showMapPopup && (
        <MapPopup
          onClose={() => setShowMapPopup(false)}
          onSelect={handleMapSelect}
          initialLocation={mapSearchQuery || ''}
        />
      )}
    </>
  );
};

export default LocationPopup;
