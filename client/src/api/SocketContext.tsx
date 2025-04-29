import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API } from '@/config/env';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: Set<string>;
  notifications: Notification[];
  clearNotifications: () => void;
  hasUnreadMessages: boolean;
}

interface Notification {
  id: string;
  type: string;
  message: string;
  data: any;
  timestamp: Date;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (token && user) {
      // Extract the base server URL without the API path
      const serverUrl = API.split('/api')[0]; 
      console.log('Attempting to connect to socket server:', serverUrl);
      console.log('With auth token:', token.substring(0, 15) + '...');

      // Connect to socket server with auth token using the base server URL
      const newSocket = io(serverUrl, {
        auth: { token },
      });

      // Add event listeners for connection status
      newSocket.on('connect', () => {
        console.log('Socket connected successfully!');
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });

      newSocket.on('error', (err) => {
        console.error('Socket error:', err);
      });

      setSocket(newSocket);

      // Listen for online status updates
      newSocket.on('userStatus', ({ userId, status }) => {
        console.log(`User ${userId} status: ${status}`);
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          if (status === 'online') {
            updated.add(userId);
          } else {
            updated.delete(userId);
          }
          return updated;
        });
      });

      // Listen for new message notifications
      newSocket.on('notification', (notification) => {
        console.log('Received notification:', notification);
        setNotifications((prev) => [
          ...prev,
          {
            ...notification,
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date(),
          },
        ]);
        setHasUnreadMessages(true);
      });

      newSocket.on('receiveMessage', (message) => {
        console.log('Received message:', message);
      });

      newSocket.on('messageSent', (message) => {
        console.log('Message sent confirmation:', message);
      });

      return () => {
        console.log('Disconnecting socket');
        newSocket.disconnect();
      };
    }
  }, [token, user]);

  const clearNotifications = () => {
    setNotifications([]);
    setHasUnreadMessages(false);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        notifications,
        clearNotifications,
        hasUnreadMessages,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
