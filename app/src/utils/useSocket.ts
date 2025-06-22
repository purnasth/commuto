import { useContext } from 'react';
import { SocketContext } from './SocketContext';

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketManager provider');
  }
  return context;
}
