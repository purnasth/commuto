import { createContext } from 'react';
import { Socket } from 'socket.io-client';

import { RIDE_STATUS } from '../constants/enums';

export interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  messages: string[];
  rideStatus: RIDE_STATUS;
  setShowFeedbackPopup: React.Dispatch<React.SetStateAction<boolean>>;
  showFeedbackPopup: boolean;
  setRideStatus: React.Dispatch<React.SetStateAction<RIDE_STATUS>>;
}

export const SocketContext = createContext<SocketContextType | undefined>(
  undefined,
);
