import { Navigate, useLocation } from "react-router-dom"
import { useAuthContext } from "../Context/AuthContext"

export const PrivateRoute = ({ children }) => {
  const { isAuth, loading } = useAuthContext()
  const location = useLocation()

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuth) {
    // Store the attempted URL for redirecting after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}