import React, { useEffect } from 'react'
import { RouterProvider } from 'react-router'
import { router } from './app.routes';
import { useAuth } from '../features/auth/hook/useAuth';
import { initializeSocketConnection } from '../features/chat/service/chat.socket';
import { useDispatch } from 'react-redux';
import { appendChunk } from '../features/chat/chat.slice';
import { isMaintenanceModeActive } from '../utils/maintenance';
import MaintenanceMode from '../features/pages/MaintenanceMode';

const App = () => {
  const isMaintenance = isMaintenanceModeActive();
  const auth = useAuth();
  const dispatch = useDispatch();

  useEffect(() => {
    // If in maintenance mode, block all server authentication, sockets, and data fetches
    if (isMaintenance) return;

    auth.handleGetMe();
    
    // Initialize global socket and chunk listener
    const socket = initializeSocketConnection();
    socket.on("chunk", (chunk) => {
      dispatch(appendChunk(chunk));
    });

    return () => {
      socket.off("chunk");
    };
  }, [isMaintenance]);

  // When maintenance mode is active, users can only view the Maintenance Mode page
  if (isMaintenance) {
    return <MaintenanceMode />;
  }

  return (
    <RouterProvider router={router}/>
  );
};

export default App;