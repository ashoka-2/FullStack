import React,{useState} from 'react'
import '../style/form.scss';
import {Link} from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router';



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
         <div className='form-container'>
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>

                <input  onInput={(e)=>{setUsername(e.target.value)}} type="text" placeholder='Enter Username' name='username'/>
                <input onInput={(e)=>{setPassword(e.target.value)}} type="password" placeholder='Enter Password' name='password'/>
                <button>Login</button>
            </form>
            <p>Don't have an account? <Link className='toggleAuthForm' to="/register">Register</Link></p>

         </div>
    </main>
  )
}

export default Login
