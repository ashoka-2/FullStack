import React from 'react'

import router from './AppRoutes';
import {RouterProvider} from 'react-router';
import { AuthProvider } from './features/auth/auth.context';

import './features/shared/global.scss';
import {  PostContextProvider } from './features/post/post.context';
import { UserContextprovider } from './features/Users/user.context';

const App = () => {
  return (
    <AuthProvider>
      <PostContextProvider>
        
      <UserContextprovider> 
          
        <RouterProvider router={router}/>
          
      </UserContextprovider>

      </PostContextProvider>
    </AuthProvider>    
  )
}

export default App
