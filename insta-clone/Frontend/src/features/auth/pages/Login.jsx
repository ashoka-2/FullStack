import React,{useState} from 'react'
import '../style/form.scss';
import {Link} from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router';
import Footer from '../../components/Footer/Footer';

import instalogo from "../../../../public/instagram.svg"



const Loginleft = () =>{
    return (

      <div className='login-left'>

        <div className="login-left-container">

          <div className='insta-logo'>
            <img src={instalogo} alt="Instagram Logo" />
          </div>
          <div className='insta-text'>
        <h1>See everyday moments from your <span>close friends</span>.</h1>

          </div >
          <div className='insta-img'>
          <img src="https://static.cdninstagram.com/rsrc.php/v4/yt/r/pAv7hjq-51n.png" alt="" />

          </div>
        </div>

       
        </div>


    )
}













const Login = () => {


    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    const {handleLogin,loading} = useAuth();
    const navigate = useNavigate();


  if(loading){
    return(

      <h1>Loading...</h1>
    )
  }


    async function handleSubmit(e){
        e.preventDefault();

        handleLogin(username,password)
        .then((res)=>{
          console.log(res);
          navigate('/')
          
        })
    }



  return (
    <main>

        <div className="login-conatiner">
           <Loginleft/>

           <div className='form-container'>
            <h3>Log into Instagram </h3>
            <form onSubmit={handleSubmit}>

                <input  onInput={(e)=>{setUsername(e.target.value)}} type="text" placeholder='Mobile number, email or username ' name='username'/>
                <input onInput={(e)=>{setPassword(e.target.value)}} type="password" placeholder='Enter Password' name='password'/>
                <button>Log in</button>
            </form>
          <div className="forgot-pass">Forgot password?</div>


          <div>
            <div className="log-facebook">
              <i className="ri-facebook-circle-fill"></i>
              Login with Facebook
            </div>

          </div>






            <p>Don't have an account? <Link className='toggleAuthForm' to="/register">Register</Link></p>

         </div>
        </div>

         <Footer/>
    </main>
  )
}








export default Login
