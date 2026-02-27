import { createContext, useState } from "react";


export const UserContext = createContext();

export const UserContextprovider = ({children})=>{
    const [users,setUsers] = useState(null)
    const [loading, setLoading] = useState(false)
    const [followers, setFollowers] = useState([]);



    return(
        <UserContext.Provider value={{
            loading,
            setLoading,
            users,
            setUsers,
            followers,setFollowers
            
            }}>
            {children}
        </UserContext.Provider>
        
    )


}