import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router'

const Protected = ({children}) => {
    const user = useSelector(state => state.auth.user)
    const loading = useSelector(state => state.auth.loading)
    const location = useLocation()

    // While initial auth is verifying on page refresh/reload, don't redirect away
    if (loading) {
        return null;
    }

    if (!user) {
        return <Navigate to="/auth" state={{ from: location }} replace /> 
    }

    return children
}

export default Protected