import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { SocketContext } from '../utils/SocketContext';

const SERVER_URL =
  import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001';
const isDev = import.meta.env.MODE === 'development';

export const SocketManager = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();

  const user = localStorage.getItem('user');
  const userId = user ? JSON.parse(user).id : null;

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

      navigate(
        `/ride-details?from=${encodeURIComponent(ride.from)}&to=${encodeURIComponent(
          ride.to,
        )}&message=${encodeURIComponent(ride.message)}&role=${encodeURIComponent(
          ride.role,
        )}&timestamp=${encodeURIComponent(ride.timestamp ?? '')}`,
      );
      // toast.info('A ride you were viewing has been confirmed!');
    });
  };

  const log = (msg, extra = '') => {
    const full = `${msg}${extra ? ` - ${extra}` : ''}`;
    if (isDev) console.log(full);
    setMessages((prev) => [...prev, full]);
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, messages }}>
      {children}
    </SocketContext.Provider>
  );
};
