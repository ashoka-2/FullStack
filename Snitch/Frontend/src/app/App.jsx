import { useEffect } from 'react'
import './App.css'
import { RouterProvider } from 'react-router'
import { routes } from './app.routes'

function App() {
  
  // Set theme globally on mount based on localStorage or default to dark
  useEffect(() => {
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
      <RouterProvider router={routes} />
    </>
  )
}

export default App