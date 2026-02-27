import { createContext, useState, useEffect } from "react";
import { login, register, getMe } from "./services/auth.api";



export const AuthContext = createContext()


export const AuthProvider=({ children })=> {

    const [ user, setUser ] = useState(null)
    const [ loading, setLoading ] = useState(true)

    useEffect(() => {
        const checkUserSession = async () => {
            try {
                const data = await getMe(); 
                setUser(data.user);        
            } catch (error) {
                setUser(null);              
            } finally {
                setLoading(false);         
            }
        };

        checkUserSession();
    }, []);




    return (
        <AuthContext.Provider value={{ user,setUser, loading,setLoading }}>
            {children}
        </AuthContext.Provider>
    )
}