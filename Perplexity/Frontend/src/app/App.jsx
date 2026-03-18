import React, { useEffect } from 'react'
import { RouterProvider } from 'react-router'
import { router } from './app.routes';
import { useAuth } from '../features/auth/hook/useAuth';
import { initializeSocketConnection } from '../features/chat/service/chat.socket';
import { useDispatch } from 'react-redux';
import { appendChunk } from '../features/chat/chat.slice';


 

const App = () => {

  const auth = useAuth();
  const dispatch = useDispatch();

  useEffect(() => {
    auth.handleGetMe();
    
    // Initialize global socket and chunk listener
    const socket = initializeSocketConnection();
    socket.on("chunk", (chunk) => {
      dispatch(appendChunk(chunk));
    });

    return () => {
      socket.off("chunk");
    };
  }, []);


  return (
    <RouterProvider router={router}/>
  )
}

export default App