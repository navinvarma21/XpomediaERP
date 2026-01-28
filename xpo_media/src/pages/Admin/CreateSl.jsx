"use client"

import { useState, useEffect } from "react"
import "bootstrap/dist/css/bootstrap.min.css"
import leftprofile from "../../images/leftprofile.jpg"
import logo from "../../images/Logo/logo.jpg"
import { useNavigate } from "react-router-dom"
import { ENDPOINTS } from "../../SpringBoot/config"
import AdNavbar from "./AdNavbar"
import { useAuthContext } from "../../Context/AuthContext"

function CreateSl() {
  const [formData, setFormData] = useState({
    schoolId: "",
    schoolCode: "", // ✅ New field
    schoolName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    status: "Active",
    fromDate: "",
    toDate: "",
  })

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const navigate = useNavigate()
  const { admin, forceLogout, loading } = useAuthContext()

  // Redirect unauthorized users
  useEffect(() => {
    if (!loading && !admin?.adminId) {
      forceLogout()
      navigate("/admin/login", { replace: true })
    }
  }, [admin, loading, navigate, forceLogout])

  // Auto-generate School ID
  const generateSchoolId = (name) => {
    if (!name) return ""
    const prefix = "xpo"
    const chars = name.substring(0, 3).toLowerCase()
    const randomNum = Math.floor(100 + Math.random() * 900)
    return `${prefix}_${chars}_${randomNum}`
  }

  // Auto-generate School Code
  const generateSchoolCode = (name) => {
    if (!name) return ""
    const chars = name.substring(0, 4).toUpperCase()
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    return `${chars}${randomNum}`
  }

  // Handle phone number input (only numbers, max 10 digits)
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
    setFormData({ ...formData, phone: value })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    if (name === "phone") {
      handlePhoneChange(e)
    } else if (name === "schoolName") {
      setFormData({
        ...formData,
        [name]: value,
        schoolId: generateSchoolId(value),
        schoolCode: generateSchoolCode(value), // ✅ Auto-generate school code
      })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  // Handle school code validation (alphanumeric, 6-10 characters)
  const validateSchoolCode = () => {
    const schoolCode = formData.schoolCode.trim()
    if (!schoolCode) {
      setError("School Code is required")
      return false
    }
    
    if (schoolCode.length < 6 || schoolCode.length > 10) {
      setError("School Code must be between 6 and 10 characters")
      return false
    }
    
    if (!/^[A-Z0-9]+$/.test(schoolCode)) {
      setError("School Code must contain only uppercase letters and numbers")
      return false
    }
    
    return true
  }

  // Handle date validation
  const validateDates = () => {
    if (formData.fromDate && formData.toDate) {
      const from = new Date(formData.fromDate)
      const to = new Date(formData.toDate)
      
      if (from >= to) {
        setError("To date must be after From date")
        return false
      }
    }
    return true
  }

  // Validate phone number
  const validatePhone = () => {
    if (formData.phone.length !== 10) {
      setError("Phone number must be exactly 10 digits")
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validate school code
    if (!validateSchoolCode()) {
      return
    }

    // Validate phone number
    if (!validatePhone()) {
      return
    }

    // Validate passwords
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    // Validate dates
    if (!validateDates()) {
      return
    }

    // Ensure dates are provided
    if (!formData.fromDate || !formData.toDate) {
      setError("Both From Date and To Date are required")
      return
    }

    try {
      if (!admin?.adminId) {
        setError("Unauthorized! Please login as admin again.")
        navigate("/admin/login")
        return
      }

      const token = sessionStorage.getItem("adminToken")
      const response = await fetch(ENDPOINTS.admin.registerSchool, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.message || "School creation failed")
      }

      setSuccess("School created successfully! Redirecting...")
      setTimeout(() => navigate("/admin/dashboard"), 2000)
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading || !admin) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="container-fluid p-0" style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navbar */}
      <div style={{ height: "10vh" }}>
        <AdNavbar />
      </div>

      {/* Content */}
      <div className="row m-0" style={{ flex: 1, height: "90vh" }}>
        {/* Left Image */}
        <div className="col-lg-6 d-none d-lg-block p-3" style={{ backgroundColor: "#fff" }}>
          <div className="d-flex justify-content-center align-items-center h-100">
            <img
              src={leftprofile}
              alt="School Illustration"
              className="img-fluid"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          </div>
        </div>

        {/* Right Form */}
        <div
          className="col-lg-6 col-md-12 d-flex align-items-center justify-content-center p-3"
          style={{ background: "linear-gradient(180deg, #1470E1 0%, #0B3D7B 100%)" }}
        >
          <div className="w-100" style={{ maxWidth: "450px" }}>
            <div className="text-center mb-3">
              <img src={logo} alt="XPO Logo" className="mb-2 rounded-circle" width="80" height="80" />
              <h1 className="text-white fw-bold mb-1" style={{ fontSize: "1.5rem" }}>
                Create School Profile
              </h1>
              <p className="text-white mb-3" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                Setup your institution in XPO Media ERP
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* School ID - Now editable */}
              <div className="mb-2">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="School ID" 
                  name="schoolId" 
                  value={formData.schoolId} 
                  onChange={handleChange}
                  required 
                />
                <small className="text-white-50">You can edit the auto-generated School ID</small>
              </div>

              {/* ✅ New School Code Field */}
              <div className="mb-2">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="School Code (e.g., SCHL1234)" 
                  name="schoolCode" 
                  value={formData.schoolCode} 
                  onChange={handleChange}
                  maxLength="10"
                  pattern="[A-Z0-9]+"
                  title="Uppercase letters and numbers only (6-10 characters)"
                  required 
                />
                <small className="text-white-50">Unique code for your school (uppercase letters & numbers only)</small>
              </div>

              <div className="mb-2">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="School Name" 
                  name="schoolName" 
                  value={formData.schoolName} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="mb-2">
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="Email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              {/* Phone Number with 10-digit validation */}
              <div className="mb-2">
                <input 
                  type="tel" 
                  className="form-control" 
                  placeholder="Phone Number" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  required 
                  maxLength="10"
                  pattern="[0-9]{10}"
                />
              </div>

              {/* Status Field */}
              <div className="mb-2">
                <select 
                  className="form-control" 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange}
                  required
                >
                  <option value="Active">Active</option>
                  <option value="InActive">InActive</option>
                </select>
              </div>

              {/* Date Range Fields - Required */}
              <div className="row mb-2">
                <div className="col-6">
                  <label className="text-white small">From Date *</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    name="fromDate" 
                    value={formData.fromDate} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="col-6">
                  <label className="text-white small">To Date *</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    name="toDate" 
                    value={formData.toDate} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>

              <div className="mb-2">
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="mb-2">
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Confirm Password" 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              <button
                type="submit"
                className="btn w-100 mb-2"
                style={{ backgroundColor: "#FFE500", color: "#000", padding: "0.5rem", fontWeight: "bold", border: "none", borderRadius: "8px" }}
              >
                Create
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateSl