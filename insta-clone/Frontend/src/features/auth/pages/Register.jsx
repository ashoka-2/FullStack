import React ,{useState} from 'react'
import { Link } from 'react-router';

import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router';


const Register = () => {

    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const {handleRegister,loading} = useAuth();
    const navigate = useNavigate();


    if(loading){
        return(
            <h1>Loading...</h1>
        )
    }

    async function handleSubmit(e) {
        e.preventDefault();

        handleRegister(username,email,password)
        .then((res)=>{
            console.log(res);
            navigate('/')
            
        })

      

    }


    return (
        <main>
            <div className='form-container'>
                <h1>Register</h1>
                <form onSubmit={handleSubmit}>
                    <input
                        onInput={(e)=>setUsername(e.target.value)}
                        type="text"
                        placeholder='Enter Username' 
                        name='username' />

                    <input
                     onInput={(e)=>setEmail(e.target.value)}
                        type="email"
                     placeholder='Enter Email'
                      name='email' />

                    <input 
                        onInput={(e)=>setPassword(e.target.value)}
                    type="password"
                     placeholder='Enter Password' name='password' />

                    <button >Register</button>
                </form>
                <p>Already have an account? <Link className='toggleAuthForm' to="/login">Login</Link></p>
            </div>
        </main>
    )
}

export default Register