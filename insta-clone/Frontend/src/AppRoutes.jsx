import {BrowserRouter,Routes,Route} from 'react-router';
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import Footer from './features/components/Footer/Footer';


function AppRoutes(){  
return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Footer/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/register" element={<Register/>}/>

      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes;