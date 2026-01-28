import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUserContext } from '../Context/UserContext'

const ProtectedRoute = ({ children, userType = null }) => {
  const { isAuthenticated, userType: currentUserType, loading, autoLogout } = useUserContext()
  const navigate = useNavigate()
  const location = useLocation()
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (loading) {
      setShouldRender(false)
      return
    }

    if (!isAuthenticated) {
      // Not authenticated, redirect to appropriate login
      let redirectPath = '/'
      
      if (userType === 'teacher') {
        redirectPath = '/teacherlogin'
      } else if (userType === 'student') {
        redirectPath = '/studentlogin'
      } else if (currentUserType === 'teacher') {
        redirectPath = '/teacherlogin'
      } else if (currentUserType === 'student') {
        redirectPath = '/studentlogin'
      }

      // Only redirect if we're not already on the target login page
      if (!location.pathname.includes(redirectPath)) {
        navigate(redirectPath, { replace: true })
      }
      setShouldRender(false)
      return
    }

    if (userType && currentUserType !== userType) {
      // Wrong user type, auto logout and redirect
      autoLogout(true)
      setShouldRender(false)
      return
    }

    // All checks passed, render children
    setShouldRender(true)
  }, [isAuthenticated, loading, userType, currentUserType, navigate, location.pathname, autoLogout])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: 'black',
        color: 'white'
      }}>
        Loading...
      </div>
    )
  }

  if (!shouldRender) {
    return null
  }

  return children
}

export default ProtectedRoute