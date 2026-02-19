import React from 'react'

import AppRoutes from './AppRoutes';
import {RouterProvider} from 'react-router';
import { AuthProvider } from './features/auth/auth.context';

import './style.scss';

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
