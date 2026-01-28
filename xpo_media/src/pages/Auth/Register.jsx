import { useState } from "react"
import "bootstrap/dist/css/bootstrap.min.css"
import leftprofile from "../../images/leftprofile.jpg"
import logo from "../../images/Logo/logo.jpg"
import { useNavigate, Link } from "react-router-dom"
import { ENDPOINTS } from "../../SpringBoot/config"

function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    role: "",
    password: "",
    confirmPassword: "",
  })

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    try {
      const response = await fetch(ENDPOINTS.auth.register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          mobile: formData.mobile,
          role: formData.role,
          password: formData.password,
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || "Registration failed")
      }

      setSuccess("Registration successful! Redirecting to login...")
      setTimeout(() => navigate("/admin/login"), 2000) // ✅ fixed
    } catch (err) {
      setError(err.message)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="container-fluid p-0" style={{ height: "100vh", overflow: "hidden" }}>
      <div className="row m-0 h-100">
        {/* Left side illustration */}
        <div className="col-lg-6 d-none d-lg-block p-3" style={{ backgroundColor: "#fff" }}>
          <div className="d-flex justify-content-center align-items-center h-100">
            <img
              src={leftprofile}
              alt="Education Illustration"
              className="img-fluid"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          </div>
        </div>

        {/* Right side registration form */}
        <div
          className="col-lg-6 col-md-12 d-flex align-items-center justify-content-center p-3"
          style={{ background: "linear-gradient(180deg, #1470E1 0%, #0B3D7B 100%)" }}
        >
          <div className="w-100" style={{ maxWidth: "400px" }}>
            <div className="text-center mb-3">
              <img
                src={logo}
                alt="XPO Media ERP Logo"
                className="mb-2 rounded-circle"
                width="80"
                height="80"
              />
              <h1 className="text-white fw-bold mb-1" style={{ fontSize: "1.5rem" }}>
                Create Your XPO Media ERP Account
              </h1>
              <p className="text-white mb-3" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                Get Started with Seamless Management and Collaboration
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mb-2">
              {/* Full Name */}
              <div className="mb-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter your Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Email */}
              <div className="mb-2">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter your Email Address"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Mobile */}
              <div className="mb-2">
                <input
                  type="tel"
                  className="form-control"
                  placeholder="Enter your Mobile Number"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Role */}
              <div className="mb-2">
                <select
                  className="form-select"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Your Role</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {/* Password */}
              <div className="mb-2">
                <input
                  type="password"
                  className="form-control"
                  placeholder="Create a Password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Confirm Password */}
              <div className="mb-2">
                <input
                  type="password"
                  className="form-control"
                  placeholder="Confirm Your Password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Alerts */}
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              {/* Submit */}
              <button
                type="submit"
                className="btn w-100 mb-2"
                style={{
                  backgroundColor: "#FFE500",
                  color: "#000",
                  padding: "0.5rem",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "8px",
                }}
              >
                Register
              </button>

              {/* Link to login */}
              <div className="text-center text-white" style={{ fontSize: "0.8rem" }}>
                Already have an account?{" "}
                <Link to="/admin/login" className="text-warning text-decoration-none fw-bold">
                  Login Here
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
