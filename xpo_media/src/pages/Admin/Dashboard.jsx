"use client"

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import AdNavbar from "./AdNavbar"
import { useAuthContext } from "../../Context/AuthContext"

export default function Dashboard() {
  const navigate = useNavigate()
  const { admin, loading, forceLogout } = useAuthContext()

  // ✅ Redirect unauthorized users
  useEffect(() => {
    if (!loading) {
      if (!admin?.adminId) {
        forceLogout()
        navigate("/admin/login", { replace: true })
      }
    }
  }, [admin, loading, navigate, forceLogout])

  if (loading || !admin) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="d-flex flex-column" style={{ height: "100vh", overflow: "hidden" }}>
      {/* Navbar */}
      <AdNavbar />

      {/* Dashboard Content */}
      <div className="p-4 flex-grow-1" style={{ overflowY: "auto" }}>
        <h2 className="fw-bold mb-4">Welcome, {admin.name} 🎉</h2>

        {/* Quick Stats */}
        <div className="row g-4">
          <div className="col-md-4">
            <div className="card shadow-sm p-3 text-center">
              <h5 className="fw-bold">Total Students</h5>
              <p className="fs-3 text-primary">120</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm p-3 text-center">
              <h5 className="fw-bold">Total Trainers</h5>
              <p className="fs-3 text-success">15</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm p-3 text-center">
              <h5 className="fw-bold">Active Classes</h5>
              <p className="fs-3 text-warning">8</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card shadow-sm p-4 mt-4">
          <h5 className="fw-bold mb-3">Recent Activity</h5>
          <ul className="list-unstyled">
            <li>✅ New student registered (John Doe)</li>
            <li>📢 Notice sent to all Trainers</li>
            <li>🎓 Student fee updated for Batch 2025</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
