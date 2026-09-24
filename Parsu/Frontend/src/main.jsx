import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App.jsx'
import "./app/index.css"

import { store } from './app/app.store.js'

import { Provider } from 'react-redux';
import axios from 'axios';

axios.defaults.withCredentials = true;

// Initialize Google Analytics 4 if configured
const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
if (gaId && typeof window !== 'undefined' && !window.dataLayer) {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', gaId, { send_page_view: true });
}

createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  // {/* </StrictMode>, */}
)
