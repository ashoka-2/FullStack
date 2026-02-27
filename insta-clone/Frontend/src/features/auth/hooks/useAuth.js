import {useContext} from 'react'
import { AuthContext } from '../auth.context';

import { login,register,getMe,logout ,editProfile} from '../services/auth.api';

export const useAuth=()=>{
    const context = useContext(AuthContext);


    const {user,setUser,loading,setLoading} = context;


    const handleLogin = async (username,password)=>{

        setLoading(true)

        const response = await login(username,password)

        setUser(response.user)

        setLoading(false)


    }
    
    const handleRegister = async(username,email,password)=>{

        setLoading(true)

        const response = await register(username,email,password) 

        setUser(response.user)

        setLoading(false)
    }


    const handleLogout = async()=>{
        setUser(null)
        await logout();

    }


    const handleEditProfile = async (profileData) => {
    setLoading(true);
    try {
        const response = await editProfile(profileData);
        setUser(prevUser => ({
            ...prevUser,
            fullName: response.user.fullName,
            bio: response.user.bio,
            profilePic: response.user.profilePic
        }));
        return true; 
    } catch (error) {
        console.error("Edit profile failed", error);
        return false;
    } finally {
        setLoading(false);
    }
}


    return {
        user,loading,handleLogin,handleRegister,handleLogout,handleEditProfile
    }

}