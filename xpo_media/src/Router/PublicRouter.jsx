import { Navigate } from "react-router-dom"
import { useAuthContext } from "../Context/AuthContext"

export const PublicRoute = ({ children }) => {
  const { isAuth } = useAuthContext()
  return isAuth ? <Navigate to="/home" replace /> : children
}
