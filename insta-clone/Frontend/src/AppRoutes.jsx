import {createBrowserRouter} from 'react-router';
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import Feed from './features/post/pages/Feed';
import CreatePost from './features/post/pages/CreatePost';
import MainLayout from './features/shared/components/MainLayout';
import ProfilePage from './features/auth/pages/ProfilePage';
import FollowersPage from './features/Users/pages/FollowersPage';
import ExplorePage from './features/Users/pages/ExplorePage';
import EditProfile from './features/auth/pages/EditProfile';


const router = createBrowserRouter([
{
  path:"/",
  element:<MainLayout/>,
  children:[
    {
      path:'/',
      element:<Feed/>
    },
    {
      path:'/create-post',
      element:<CreatePost/>
    },
    {
      path:"/profile",
      element:<ProfilePage/>
    },
    {
      path:"/edit-profile",
      element:<EditProfile/>
    },
    {
      path:"/notifications",
      element:<FollowersPage/>
    },
    {
      path:"/explore",
      element:<ExplorePage/>
    }
  ]
},


{
  path:"/login",
  element:<Login/>
},
{
  path:"/register",
  element:<Register/>
},



])  


export default router;