import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { SocketContext } from '../utils/SocketContext';
import { useRideEvent } from '../utils/useRideEvent';

const SERVER_URL =
  import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001';
const isDev = import.meta.env.MODE === 'development';

export const SocketManager = ({ children }) => {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const { triggerRideConfirmed } = useRideEvent();
  const [isConnected, setIsConnected] = useState(false);
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const [rideStatus, setRideStatus] = useState(
    localStorage.getItem('rideStatus') || 'idle',
  );
  const user = localStorage.getItem('user');
  const userId = user ? JSON.parse(user).id : null;

  // Sync ride status with localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const currentStatus = localStorage.getItem('rideStatus') || 'idle';
      setRideStatus(currentStatus);
    };

    const handleCustomStatusChange = (event) => {
      setRideStatus(event.detail.status);
    };

    // Listen for storage changes (when localStorage is updated from other components)
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom status change events
    window.addEventListener('rideStatusChanged', handleCustomStatusChange);

    // Also check on component mount/update and set up interval for local changes
    handleStorageChange();

    // Check for localStorage changes every 100ms to catch same-tab updates
    const interval = setInterval(handleStorageChange, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('rideStatusChanged', handleCustomStatusChange);
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
  }, [userId]);

  const registerCustomEvents = (socket) => {
    socket.on('registrationSuccess', (msg) => {
      log(`[Server] Registration: ${msg}`);
    });

    socket.on('pong', (data) => {
      log(`[Server Pong] ${data}`);
    });

    socket.on('messageToAll', ({ sender, message }) => {
      log(`[Broadcast from ${sender}] ${message}`);
    });

    socket.on('privateMessage', ({ senderUserId, message }) => {
      log(`[Private Message from ${senderUserId}] ${message}`);
    });

    socket.on('error', (msg) => {
      log(`[Server Error] ${msg}`);
    });

    socket.on('rideConfirmed', (ride) => {
      log(
        `✅ Ride Confirmed! ID: ${ride.id}, From: ${ride.from}, To: ${ride.to}`,
      );
      const lastParams = localStorage.getItem('lastSearchParams');
      console.log('[SocketManager] Last search params:', lastParams);
      if (lastParams) {
        localStorage.removeItem('lastSearchParams');
      }

      localStorage.setItem('rideStatus', 'confirmed');
      setRideStatus('confirmed');

      console.log('[SocketManager] triggerRideConfirmed');
      triggerRideConfirmed(ride);
      navigate(
        `/ride-details?id=${ride.id}&from=${encodeURIComponent(ride.from)}&to=${encodeURIComponent(
          ride.to,
        )}&message=${encodeURIComponent(ride.message)}&role=${encodeURIComponent(
          ride.role,
        )}&timestamp=${encodeURIComponent(ride.timestamp ?? '')}`,
      );

      // toast.info('A ride you were viewing has been confirmed!');
    });

    socket.on('rideCompleted', (ride) => {
      console.log('ride', ride);
      localStorage.setItem('rideStatus', 'completed');
      setRideStatus('completed');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      if (!user || !user.id) {
        console.error('User not found or invalid user data');
        return;
      }

      // Don't auto-show feedback popup, let user click "Provide Feedback" button
      log(`✅ Ride completed! User can now provide feedback via the button`);
    });
  };

  const log = (msg, extra = '') => {
    const full = `${msg}${extra ? ` - ${extra}` : ''}`;
    if (isDev) console.log(full);
    setMessages((prev) => [...prev, full]);
  };

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
