import {createBrowserRouter} from 'react-router';
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import Footer from './features/components/Footer/Footer';
import Feed from './features/post/pages/Feed';
import CreatePost from './features/post/pages/CreatePost';


const router = createBrowserRouter([
{
  path:"/",
  element:<Feed/>
},
{
  path:"/login",
  element:<Login/>
},
{
  path:"/register",
  element:<Register/>
},
{
  path:'/create-post',
  element:<CreatePost/>
}



])  


export default router;