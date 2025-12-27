import { toast } from 'react-toastify';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, ReactNode } from 'react';

import { RIDE_STATUS, CUSTOM_EVENTS, USER_ROLE } from '../constants/enums';

import { getUserId } from '../utils/auth';
import { getFeedbackKey } from '../utils/functions';
import { useRideEvent } from '../utils/useRideEvent';
import { SocketContext } from '../utils/SocketContext';
import { dispatchRideStatusChanged } from '../utils/customEvents';

const SERVER_URL =
  import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001';
const isDev = import.meta.env.MODE === 'development';

interface SocketManagerProps {
  children: ReactNode;
}

export const SocketManager = ({ children }: SocketManagerProps) => {
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const { triggerRideConfirmed } = useRideEvent();
  const [isConnected, setIsConnected] = useState(false);
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const [rideStatus, setRideStatus] = useState<RIDE_STATUS>(
    (localStorage.getItem('rideStatus') as RIDE_STATUS) || RIDE_STATUS.IDLE,
  );
  const userId = getUserId();

  const log = (msg: string, extra = '') => {
    const full = `${msg}${extra ? ` - ${extra}` : ''}`;

    if (isDev) console.log(full);

    setMessages((prev) => [...prev, full]);
  };

  // Sync ride status with localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const currentStatus =
        (localStorage.getItem('rideStatus') as RIDE_STATUS) || RIDE_STATUS.IDLE;
      setRideStatus(currentStatus);
    };

    const handleCustomStatusChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setRideStatus(customEvent.detail.status as RIDE_STATUS);
    };

    // Listen for storage changes (when localStorage is updated from other components)
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom status change events
    window.addEventListener(
      CUSTOM_EVENTS.RIDE_STATUS_CHANGED,
      handleCustomStatusChange,
    );

    // Also check on component mount/update and set up interval for local changes
    handleStorageChange();

    // Check for localStorage changes every 100ms to catch same-tab updates
    const interval = setInterval(handleStorageChange, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(
        CUSTOM_EVENTS.RIDE_STATUS_CHANGED,
        handleCustomStatusChange,
      );

      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      console.warn('[SocketManager] No userId. Aborting connection.');
      socket?.disconnect();
      setSocket(null);
      return;
    }

    const registerCustomEvents = (socket: Socket) => {
      socket.on('registrationSuccess', (msg: string) => {
        log(`[Server] Registration: ${msg}`);
      });

      socket.on('pong', (data: string) => {
        log(`[Server Pong] ${data}`);
      });

      socket.on(
        'messageToAll',
        ({ sender, message }: { sender: string; message: string }) => {
          log(`[Broadcast from ${sender}] ${message}`);
        },
      );

      socket.on(
        'privateMessage',
        ({
          senderUserId,
          message,
        }: {
          senderUserId: string;
          message: string;
        }) => {
          log(`[Private Message from ${senderUserId}] ${message}`);
        },
      );

      socket.on('error', (msg: string) => {
        log(`[Server Error] ${msg}`);
      });

      socket.on(
        'rideConfirmed',
        (ride: {
          id: string;
          from: string;
          to: string;
          message: string;
          role: string;
          timestamp?: string;
          riderId?: number;
        }) => {
          log(
            `✅ Ride Confirmed! ID: ${ride.id}, From: ${ride.from}, To: ${ride.to}`,
          );
          const lastParams = localStorage.getItem('lastSearchParams');
          console.log('[SocketManager] Last search params:', lastParams);
          if (lastParams) {
            localStorage.removeItem('lastSearchParams');
          }

          localStorage.setItem('rideStatus', RIDE_STATUS.CONFIRMED);
          setRideStatus(RIDE_STATUS.CONFIRMED);

          // Show toast notifications for both users with unique IDs to prevent duplicates
          toast.success('Congratulations! Your ride has been confirmed!', {
            toastId: 'ride-confirmed-success',
          });
          toast.info('You can now view your ride details.', {
            autoClose: 5000,
            toastId: 'ride-confirmed-info',
          });

          triggerRideConfirmed({
            ...ride,
            status: RIDE_STATUS.CONFIRMED,
            riderId: ride.riderId?.toString(),
          });
          navigate(
            `/ride-details?id=${ride.id}&from=${encodeURIComponent(ride.from)}&to=${encodeURIComponent(
              ride.to,
            )}&message=${encodeURIComponent(ride.message)}&role=${encodeURIComponent(
              ride.role,
            )}&timestamp=${encodeURIComponent(ride.timestamp ?? '')}`,
          );

          // toast.info('A ride you were viewing has been confirmed!');
        },
      );

      socket.on(
        'rideCompleted',
        (ride: {
          id: string;
          from: string;
          to: string;
          message: string;
          role: string;
          timestamp?: string;
        }) => {
          console.log('✅ Ride completed via socket:', ride);
          localStorage.setItem('rideStatus', RIDE_STATUS.COMPLETED);
          setRideStatus(RIDE_STATUS.COMPLETED);
          const currentUserId = getUserId();

          if (!currentUserId) {
            console.error('User not found or invalid user data');
            return;
          }

          // Check if user has already submitted feedback
          const feedbackKey = getFeedbackKey({ id: ride.id }, currentUserId);
          const hasSubmittedFeedback =
            localStorage.getItem(feedbackKey) === 'true';

          if (!hasSubmittedFeedback) {
            // Show toast notifications for both users
            toast.success('Your ride has been completed!');
            toast.info('Please provide feedback to earn rewards.', {
              autoClose: 10000,
            });
          }

          // Trigger custom event for components that need to update
          dispatchRideStatusChanged({
            status: RIDE_STATUS.COMPLETED,
            ride: { ...ride, role: ride.role as USER_ROLE },
          });

          log(
            `✅ Ride completed! User can now provide feedback via the button`,
          );
        },
      );
    };

    const newSocket = io(SERVER_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      log('[Socket] Connected to server', newSocket.id);

      newSocket.emit('registerUser', userId);
      log(`[Socket] Registering as user: ${userId}`);
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      log(`[Socket] Disconnected: ${reason}`);
    });

    newSocket.on('connect_error', (err) => {
      log(`[Socket ERROR] Connection failed: ${err.message}`);
    });

    registerCustomEvents(newSocket);

    return () => {
      newSocket.disconnect();
      log('[SocketManager] Cleanup: Socket disconnected.');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Keep the log function accessible for debugging

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        messages,
        rideStatus,
        setRideStatus,
        showFeedbackPopup,
        setShowFeedbackPopup,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
