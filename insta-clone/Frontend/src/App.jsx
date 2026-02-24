import React from 'react'

import router from './AppRoutes';
import {RouterProvider} from 'react-router';
import { AuthProvider } from './features/auth/auth.context';

import './features/shared/global.scss';
import { PostContext, PostContextProvider } from './features/post/post.context';

const App = () => {
  return (
    <AuthProvider>
      <PostContextProvider>
        
      <RouterProvider router={router}/>

      </PostContextProvider>
    </AuthProvider>    
  )
}

export default App
