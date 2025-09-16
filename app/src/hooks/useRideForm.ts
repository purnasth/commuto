import { useEffect } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { RideFormData } from '../interfaces/types';
import { LS_RIDE_FORM_DATA_KEY } from '../constants/enums';

const useRideForm = (setValue: UseFormSetValue<RideFormData>) => {
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

      localStorage.removeItem(LS_RIDE_FORM_DATA_KEY);
    }
  }, [setValue]);
};

export default useRideForm;
