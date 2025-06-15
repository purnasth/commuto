import React, { useEffect, useState } from 'react';
import { AvailableListProps } from '../interfaces/types';
import { TbCircleDashed } from 'react-icons/tb';
import { TbMapPin } from 'react-icons/tb';
import { TbAlarm } from 'react-icons/tb';
import { USER_ROLE } from '../constants/enums';

const AvailableList: React.FC<AvailableListProps> = ({ role }) => {
  interface Ride {
    from: string;
    to: string;
    message: string;
    role: USER_ROLE;
  }

  const [items, setItems] = useState<Ride[]>([]);

  useEffect(() => {
    const storedRides = JSON.parse(localStorage.getItem('rides') || '[]');
    const filteredItems = storedRides.filter(
      (ride: Ride) => ride.role === role,
    );
    setItems(filteredItems);
  }, [role]);

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4">
      <h2 className="text-lg font-semibold">
        Available {role === USER_ROLE.RIDER ? 'Rides' : 'Passengers'}
      </h2>
      {items.length > 0 ? (
        items.map((item, index) => (
          <div
            key={index}
            className="space-y-3 rounded-3xl border border-gray-200/80 bg-teal-50 p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <TbCircleDashed className="text-base text-teal-500" />
                <div className="h-4 w-px border border-dashed border-teal-500"></div>
                <TbMapPin className="text-base text-green-500" />
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-sm font-normal text-dark">{item.from}</p>
                <p className="text-sm font-normal text-dark">{item.to}</p>
              </div>
            </div>
            <div className="relative rounded-xl bg-teal-200 p-3">
              <div className="absolute -top-2 right-5 size-0 origin-top rotate-90 scale-[2] border-l-[10px] border-r-[2px] border-t-[10px] border-l-transparent border-r-transparent border-t-teal-200"></div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-normal text-dark">{item.message}</p>
                <p className="flex min-w-24 items-center justify-center gap-0.5 rounded-full bg-teal-50 py-1 text-sm font-normal lowercase text-teal-500 shadow">
                  <TbAlarm className="text-lg" />
                  {new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p>No {role === USER_ROLE.RIDER ? 'rides' : 'passengers'} available.</p>
      )}
    </div>
  );
};

export default AvailableList;
