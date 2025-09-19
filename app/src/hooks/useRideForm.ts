import { useEffect, useState } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { RideFormData } from '../interfaces/types';
import { LS_RIDE_FORM_DATA_KEY } from '../constants/enums';

interface SavedRideCoords {
  fromCoords: [number, number] | null;
  toCoords: [number, number] | null;
}

const useRideForm = (
  setValue: UseFormSetValue<RideFormData>,
): SavedRideCoords => {
  const [savedCoords, setSavedCoords] = useState<SavedRideCoords>({
    fromCoords: null,
    toCoords: null,
  });

  useEffect(() => {
    const savedFormData = localStorage.getItem(LS_RIDE_FORM_DATA_KEY);

    if (savedFormData) {
      const parsedData: Partial<RideFormData> = JSON.parse(savedFormData);

      // Prefill the form fields
      (Object.keys(parsedData) as (keyof RideFormData)[])
        .filter((key) => key !== 'timestamp')
        .forEach((key) => {
          if (parsedData[key]) {
            setValue(key, parsedData[key] as string);
          }
        });

      // Extract coordinates
      const fromCoords: [number, number] | null =
        parsedData.fromLat && parsedData.fromLng
          ? [parsedData.fromLng, parsedData.fromLat]
          : null;

      const toCoords: [number, number] | null =
        parsedData.toLat && parsedData.toLng
          ? [parsedData.toLng, parsedData.toLat]
          : null;

      setSavedCoords({ fromCoords, toCoords });

      localStorage.removeItem(LS_RIDE_FORM_DATA_KEY);
    }
  }, [setValue]);

  return savedCoords;
};

export default useRideForm;
