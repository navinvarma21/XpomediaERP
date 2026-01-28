"use client"

import { useState, useEffect } from "react"
import "bootstrap/dist/css/bootstrap.min.css"
import leftprofile from "../../images/leftprofile.jpg"
import logo from "../../images/Logo/logo.jpg"
import { useNavigate, Link } from "react-router-dom"
import { useAuthContext } from "../../Context/AuthContext"

function AdminLogin() {
  const [formData, setFormData] = useState({ adminId: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const { admin, adminLogin, loading: authLoading } = useAuthContext()

  // ✅ Auto-redirect after successful login
  useEffect(() => {
    if (!authLoading && admin?.adminId) {
      navigate("/admin/dashboard", { replace: true })
    }
  }, [authLoading, admin?.adminId, navigate])

  // ✅ Handle input change
  const handleChange = (e) => {
    setError("")
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // ✅ Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const { success, error } = await adminLogin(formData.adminId, formData.password)
      if (!success) {
        setError(error || "Invalid Admin ID or Password")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-fluid p-0" style={{ height: "100vh", overflow: "hidden" }}>
      <div className="row m-0 h-100">
        {/* Left side image */}
        <div className="col-lg-6 d-none d-lg-block p-3" style={{ backgroundColor: "#fff" }}>
          <div className="d-flex justify-content-center align-items-center h-100">
            <img
              src={leftprofile}
              alt="Admin Illustration"
              className="img-fluid"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          </div>
        </div>

        {/* Right side form */}
        <div
          className="col-lg-6 col-md-12 d-flex align-items-center justify-content-center p-4"
          style={{ background: "linear-gradient(180deg, #1470E1 0%, #0B3D7B 100%)" }}
        >
          <div className="w-100" style={{ maxWidth: "400px" }}>
            <div className="text-center mb-4">
              <img
                src={logo}
                alt="Admin Logo"
                className="mb-3 rounded-circle"
                width="100"
                height="100"
              />
              <h1 className="text-white fw-bold mb-2" style={{ fontSize: "2rem" }}>
                Admin Login
              </h1>
              <p className="text-white mb-4" style={{ fontSize: "1rem", opacity: 0.9 }}>
                Access your ERP Admin Dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter Admin ID"
                  name="adminId"
                  value={formData.adminId}
                  onChange={handleChange}
                  required
                  style={{
                    padding: "0.75rem",
                    borderRadius: "10px",
                    fontSize: "0.9rem",
                    border: "none",
                  }}
                />
              </div>

              <div className="mb-3">
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter Password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{
                    padding: "0.75rem",
                    borderRadius: "10px",
                    fontSize: "0.9rem",
                    border: "none",
                  }}
                />
              </div>

              {error && <div className="alert alert-danger">{error}</div>}

              <button
                type="submit"
                className="btn w-100 mb-3"
                disabled={loading}
                style={{
                  backgroundColor: "#FFE500",
                  color: "#000",
                  padding: "0.75rem",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "1rem",
                }}
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <div className="text-center text-white" style={{ fontSize: "0.9rem" }}>
                <Link to="/" className="text-warning text-decoration-none fw-bold">
                  Back
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
