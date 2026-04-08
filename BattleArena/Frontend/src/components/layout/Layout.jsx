import React from 'react';
import Header from './Header';
import ChatArea from '../chat/ChatArea';
import ChatInput from '../chat/ChatInput';

const Layout = () => {
  return (
    <div className="flex flex-col h-screen bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden transition-colors duration-300">
      <Header />
      <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-main)]">
        <ChatArea />
      </div>
      <ChatInput />
    </div>
  );
};

export default Layout;
