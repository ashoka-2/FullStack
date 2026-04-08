import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import Layout from '../components/layout/Layout';

const App = () => {
  const theme = useSelector((state) => state.chat.theme);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  return <Layout />;
};

export default App;