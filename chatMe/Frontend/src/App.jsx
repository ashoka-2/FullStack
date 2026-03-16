import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Login from './components/Login';
import ChatRoom from './components/ChatRoom';
import { addMessage, addPrivateMessage, setOnlineUsers } from './redux/chatSlice';
import socket from './socket';

function App() {
  const dispatch = useDispatch();
  const { user, theme } = useSelector((state) => state.chat);

  useEffect(() => {
    if (user) {
      socket.emit('login', user);
    }
  }, [user]);

  useEffect(() => {
    // Theme switching logic (Theme badalne ki logic)
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    socket.on('message', (msg) => {
      dispatch(addMessage(msg));
    });

    socket.on('privateMessage', (msg) => {
      dispatch(addPrivateMessage(msg));
    });

    socket.on('onlineUsers', (users) => {
      dispatch(setOnlineUsers(users));
    });

    return () => {
      socket.off('message');
      socket.off('privateMessage');
      socket.off('onlineUsers');
    };
  }, [dispatch]);

  return (
    <div className="w-full h-full min-h-[100dvh] flex items-center justify-center bg-bg selection:bg-accent selection:text-bg">
      {!user ? (
        <Login socket={socket} />
      ) : (
        <ChatRoom socket={socket} />
      )}
    </div>
  );
}

export default App;
