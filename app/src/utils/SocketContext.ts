import { createContext } from 'react';
interface SocketContextType {
  socket: any;
  isConnected: boolean;
  messages: string[];
  rideStatus: string;
  setShowFeedbackPopup: React.Dispatch<React.SetStateAction<boolean>>;
  showFeedbackPopup: boolean;
  setRideStatus: React.Dispatch<React.SetStateAction<string>>;
}
export const SocketContext = createContext<SocketContextType | undefined>(
  undefined,
);
