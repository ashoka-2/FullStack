import { useEffect, useState } from 'react'
import './App.css'
import { RouterProvider } from 'react-router'
import { routes } from './app.routes'
import { useAuth } from '../Features/auth/Hook/useAuth'
import { ToastContainer } from '../Features/Components/Toast'
import Preloader from '../Features/Components/Preloader'
import axios from 'axios'
import { HomeSkeleton, NavbarSkeleton } from '../Features/Components/Skeletons'

function App() {
  const { fetchMe } = useAuth();
  const [isServerReady, setIsServerReady] = useState(false);
  const [showApp, setShowApp] = useState(false);
  
  // Check if we already played the cinematic intro in this session
  const [hasSeenPreloader, setHasSeenPreloader] = useState(() => {
    return sessionStorage.getItem('snitch_preloader_seen') === 'true';
  });

  // 1. Theme initialization
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const isDark = saved ? saved === 'dark' : true;
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);

  // 2. Poll server until it's "ON"
  useEffect(() => {
    let intervalId;

    const checkServer = async () => {
      try {
        await axios.get('/api/auth/me');
        console.log("Server active.");
        fetchMe();
        setIsServerReady(true);
        
        // If they've seen the preloader before, show the app immediately once server is ready
        if (hasSeenPreloader) {
            setShowApp(true);
        }
      } catch (error) {
        if (error.response) {
            fetchMe();
            setIsServerReady(true);
            if (hasSeenPreloader) setShowApp(true);
        } else {
            intervalId = setTimeout(checkServer, 2000); 
        }
      }
    };

    checkServer();
    return () => clearTimeout(intervalId);
  }, [isServerReady, fetchMe, hasSeenPreloader]);

  // Handle the completion of the cinematic intro
  const handlePreloaderComplete = () => {
    sessionStorage.setItem('snitch_preloader_seen', 'true');
    setHasSeenPreloader(true);
    setShowApp(true);
  };

  return (
    <>
      <ToastContainer />
      
      {/* 1. Show Cinematic Preloader ONLY on first session visit */}
      {!hasSeenPreloader && (
        <Preloader 
            isReady={isServerReady}
            onComplete={handlePreloaderComplete}
        />
      )}

      {/* 2. Show Skeletons ONLY on reloads when server isn't ready yet */}
      {hasSeenPreloader && !showApp && (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <NavbarSkeleton />
            <div className="pt-20">
                <HomeSkeleton />
            </div>
        </div>
      )}

      {/* 3. Show actual App when ready */}
      {showApp && (
        <RouterProvider router={routes} />
      )}
    </>
  )
}

export default App