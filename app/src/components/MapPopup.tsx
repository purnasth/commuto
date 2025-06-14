import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Icon } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import 'ol/ol.css';
import { MapPopupProps } from '../interfaces/types';
import { BiSearch } from 'react-icons/bi';
import { toast, ToastContainer } from 'react-toastify';
import { MdDoneAll } from 'react-icons/md';
import { TbX } from 'react-icons/tb';
import { IoClose } from 'react-icons/io5';
import { truncateLocation } from '../utils/functions';

const MapPopup: React.FC<MapPopupProps> = ({
  onClose,
  onSelect,
  initialLocation,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const selectedCoordsRef = useRef<[number, number]>([85.324, 27.7172]); // Default Kathmandu
  const [selectedCoords, setSelectedCoords] = useState<[number, number]>([
    85.324, 27.7172,
  ]);
  const [address, setAddress] = useState<string>(initialLocation || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  interface Suggestion {
    place_id: string;
    display_name: string;
    lat: string;
    lon: string;
  }

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const markerRef = useRef<Feature | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const isLocationAllowed = useCallback((locationName: string): boolean => {
    const allowedAreas = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Patan'];
    return allowedAreas.some((area) => locationName.includes(area));
  }, []);

  const reverseGeocode = useCallback(
    async (coords: [number, number]) => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[1]}&lon=${coords[0]}`,
        );
        const data = await response.json();
        const locationName =
          data.display_name ||
          `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`;

        if (isLocationAllowed(locationName)) {
          setAddress(truncateLocation(locationName));
        } else {
          toast.error(`The service is currently unavailable for location.`);
          setAddress('');
        }
      } catch (error) {
        console.error('Error fetching location details:', error);
        const fallbackName = `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`;
        setAddress(truncateLocation(fallbackName));
      } finally {
        setIsLoading(false);
      }
    },
    [isLocationAllowed],
  );

  useEffect(() => {
    if (!mapRef.current) return;

    const marker = new Feature({
      geometry: new Point(fromLonLat(selectedCoordsRef.current)),
    });
    marker.setStyle(
      new Style({
        image: new Icon({
          src: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
          scale: 0.5,
          anchor: [0.5, 1],
        }),
      }),
    );
    markerRef.current = marker;

    const markerSource = new VectorSource({
      features: [marker],
    });

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        new VectorLayer({ source: markerSource }),
      ],
      view: new View({
        center: fromLonLat(selectedCoordsRef.current),
        zoom: 14,
      }),
    });

    map.on('click', (evt) => {
      const coords = toLonLat(evt.coordinate) as [number, number];
      selectedCoordsRef.current = coords;
      setSelectedCoords(coords);
      updateMarkerPosition(coords);
      reverseGeocode(coords);
      setIsConfirmed(false);
    });

    mapInstanceRef.current = map;

    return () => map.setTarget(undefined);
  }, [reverseGeocode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setSuggestions([]); // Close suggestions if clicked outside
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const updateMarkerPosition = (coords: [number, number]) => {
    if (markerRef.current) {
      markerRef.current.setGeometry(new Point(fromLonLat(coords)));
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a location to search.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery,
        )}`,
      );
      const results = await response.json();

      if (results.length === 0) {
        toast.error(`No location found for "${searchQuery}".`);
      } else {
        const filteredResults = results.filter((result: Suggestion) =>
          isLocationAllowed(result.display_name),
        );

        if (filteredResults.length === 0) {
          toast.error(
            `The service is currently unavailable for "${searchQuery}".`,
          );
        } else {
          setSuggestions(filteredResults);
        }
      }
    } catch (error) {
      console.error('Error searching location:', error);
      toast.error('Error searching location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    setIsConfirmed(true);
    onSelect(address, selectedCoords);
    onClose();
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    const { lat, lon, display_name } = suggestion;
    const coords: [number, number] = [parseFloat(lon), parseFloat(lat)];

    if (isLocationAllowed(display_name)) {
      selectedCoordsRef.current = coords;
      setSelectedCoords(coords);
      updateMarkerPosition(coords);
      setAddress(truncateLocation(display_name));
      setIsConfirmed(false);

      if (mapInstanceRef.current) {
        const view = mapInstanceRef.current.getView();
        view.setCenter(fromLonLat(coords));
        view.setZoom(16);
      }

      setSuggestions([]);
    } else {
      toast.error(`The service is currently unavailable for "${searchQuery}".`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!searchQuery.trim()) {
        toast.error('Please enter a location to search.');
        return;
      }
      handleSearch();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="relative h-screen w-full overflow-y-hidden bg-white">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Map"
            className="transition-300 absolute right-4 top-4 z-50 rounded-full bg-teal-50 p-2 text-teal-600 shadow-md outline outline-1 outline-teal-500 backdrop-blur-sm hover:bg-teal-100 hover:text-teal-700 dark:bg-teal-700 dark:text-teal-200 dark:hover:bg-teal-300/50 dark:hover:text-teal-700"
          >
            <TbX className="text-xl" />
          </button>

          <div ref={mapRef} className="mt-auto h-[calc(100%+15px)] w-full" />
        </div>

        <div className="fixed bottom-5 left-1/2 flex w-[calc(100%-15px-15px)] max-w-xl -translate-x-1/2 flex-col gap-1 md:w-full">
          {suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="scroll max-h-72 w-full overflow-y-auto rounded-3xl border border-dark/30 bg-white shadow-lg backdrop-blur-sm dark:bg-dark/80"
            >
              <button
                type="button"
                onClick={() => setSuggestions([])}
                className="transition-300 absolute right-2 top-2 rounded-full border border-teal-500/20 bg-teal-50 p-1 text-teal-500 shadow hover:bg-teal-100 dark:bg-teal-700 dark:text-teal-300 dark:hover:bg-teal-300/50"
              >
                <TbX className="text-xl" />
              </button>
              <ul className="divide-y divide-teal-200 dark:divide-teal-600">
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion.place_id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="cursor-pointer px-4 py-2 text-sm hover:bg-teal-100 dark:text-light dark:hover:text-dark"
                  >
                    {suggestion.display_name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex items-center gap-1 rounded-full border border-dark/30 bg-white p-1.5 dark:bg-dark">
            <input
              type="text"
              value={address || searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setAddress('');
              }}
              placeholder={truncateLocation('Search or pick a location')}
              className="w-full rounded bg-transparent px-4 py-2 text-sm dark:text-light"
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            {searchQuery || address ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setAddress('');
                }}
                className="rounded-full border border-teal-500/20 bg-teal-50 p-0.5 text-teal-500 shadow hover:bg-teal-100 dark:bg-teal-900"
              >
                <IoClose />
              </button>
            ) : null}
            {address ? (
              <button
                type="button"
                onClick={handleConfirm}
                className="transition-300 inline-flex items-center justify-center gap-1 rounded-full border border-dark/10 bg-teal-500 px-4 py-2 text-sm text-white shadow hover:bg-teal-600 dark:bg-teal-400 dark:text-dark dark:hover:bg-teal-300"
              >
                Confirm
                <MdDoneAll className="text-lg" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSearch}
                className={`transition-300 inline-flex items-center justify-center gap-1 rounded-full border border-dark/10 px-4 py-2 text-sm text-white shadow dark:text-dark ${
                  isLoading
                    ? 'cursor-not-allowed bg-teal-500'
                    : 'bg-teal-500 hover:bg-teal-600 dark:bg-teal-400 dark:hover:bg-teal-300'
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    Loading
                    <svg
                      className="ml-2 h-4 w-4 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </>
                ) : (
                  <>
                    Search
                    <BiSearch className="text-lg" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {isConfirmed && <ToastContainer />}
    </>
  );
};

export default MapPopup;
