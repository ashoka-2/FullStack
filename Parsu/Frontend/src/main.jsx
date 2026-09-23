import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App.jsx'
import "./app/index.css"

import { store } from './app/app.store.js'

import { Provider } from 'react-redux';
import axios from 'axios';

axios.defaults.withCredentials = true;

createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  // {/* </StrictMode>, */}
)
