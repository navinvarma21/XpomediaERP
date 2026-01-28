"use client"

import { Routes, Route, Navigate } from "react-router-dom"
import { useAuthContext } from "../Context/AuthContext"
import AdminLogin from "../pages/Admin/AdminLogin"
import Dashboard from "../pages/Admin/Dashboard"
import CreateSl from "../pages/Admin/CreateSl"
import Schools from "../pages/Admin/Schools"

// ✅ Private Route Component using AuthContext
function PrivateAdminRoute({ children }) {
  const { admin, loading } = useAuthContext()

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!admin?.adminId) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

export default function AdminRouter() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="login" element={<AdminLogin />} />

      {/* Protected Routes */}
      <Route
        path="dashboard"
        element={
          <PrivateAdminRoute>
            <Dashboard />
          </PrivateAdminRoute>
        }
      />

      <Route
        path="create"
        element={
          <PrivateAdminRoute>
            <CreateSl />
          </PrivateAdminRoute>
        }
      />

      <Route
        path="schools"
        element={
          <PrivateAdminRoute>
            <Schools />
          </PrivateAdminRoute>
        }
      />

      {/* Default / Catch-all */}
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  )
}
