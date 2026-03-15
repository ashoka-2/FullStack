import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router'

const Protected = ({children}) => {

    const user = useSelector(state => state.auth.user)
    const loading = useSelector(state => state.auth.loading)


    if(loading){
        return <div className='flex h-screen items-center justify-center text-3xl font-bold text-[#31b8c6]'>Loading...</div>

    }
    if(!user){
        return <Navigate to="/login" replace /> 
    }


  return children
}

export default Protected