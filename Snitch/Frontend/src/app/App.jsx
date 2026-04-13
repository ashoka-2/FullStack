import { useEffect } from 'react'
import './App.css'
import { RouterProvider } from 'react-router'
import { routes } from './app.routes'
import { useAuth } from '../Features/auth/Hook/useAuth'

import { ToastContainer } from '../Features/Components/Toast'

function App() {
  const { fetchMe } = useAuth();
  
  // Set theme globally on mount based on localStorage or default to dark
  useEffect(() => {
    fetchMe();
    const saved = localStorage.getItem('theme');
    const isDark = saved ? saved === 'dark' : true;
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <>
      <ToastContainer />
      <RouterProvider router={routes} />
    </>
  )
}

export default App