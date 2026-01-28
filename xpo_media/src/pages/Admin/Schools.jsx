"use client"

import { useState, useEffect, useCallback } from "react"
import AdNavbar from "./AdNavbar"
import { ENDPOINTS } from "../../SpringBoot/config"
import { useAuthContext } from "../../Context/AuthContext"

export default function Schools() {
  const { admin, forceLogout, loading } = useAuthContext()
  const [schools, setSchools] = useState([])
  const [filteredSchools, setFilteredSchools] = useState([])
  const [loadingSchools, setLoadingSchools] = useState(true)
  const [error, setError] = useState("")
  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState({ 
    schoolCode: "", // ✅ New field
    schoolName: "", 
    email: "", 
    phone: "", 
    password: "",
    fromDate: "",
    toDate: "",
    status: "Active"
  })
  const [showEditModal, setShowEditModal] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [searchTerm, setSearchTerm] = useState("")
  const [showNotification, setShowNotification] = useState(false)
  const [notificationSchools, setNotificationSchools] = useState([])
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // ---------------- Show message and auto hide ----------------
  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  // ---------------- Redirect if admin not logged in ----------------
  useEffect(() => {
    if (!loading && !admin?.adminId) {
      forceLogout()
      window.location.href = "/admin/login"
    }
  }, [admin, loading, forceLogout])

  // ---------------- Fetch schools ----------------
  useEffect(() => {
    if (!admin?.adminId) return

    const fetchSchools = async () => {
      setLoadingSchools(true)
      setError("")
      try {
        const token = sessionStorage.getItem("adminToken")
        if (!token) throw new Error("Unauthorized! Please login again.")

        const res = await fetch(ENDPOINTS.admin.getSchools, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.message || "Failed to fetch schools")
        }

        const data = await res.json()
        // Add manualOverride flag to each school based on backend data
        const schoolsWithOverride = Array.isArray(data) ? data.map(school => ({
          ...school,
          manualOverride: school.manualOverride || false
        })) : []
        setSchools(schoolsWithOverride)
        setFilteredSchools(schoolsWithOverride)
      } catch (err) {
        setError(err.message)
        console.error("Error fetching schools:", err)
      } finally {
        setLoadingSchools(false)
      }
    }

    fetchSchools()
  }, [admin])

  // ---------------- Search functionality ----------------
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredSchools(schools)
    } else {
      const filtered = schools.filter(school =>
        school.schoolName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.phone?.includes(searchTerm) ||
        school.schoolCode?.toLowerCase().includes(searchTerm.toLowerCase()) || // ✅ Search by school code
        (school.schoolId || school.id)?.toString().includes(searchTerm)
      )
      setFilteredSchools(filtered)
    }
  }, [searchTerm, schools])

  // ---------------- Check for upcoming expiration dates ----------------
  const checkUpcomingExpirations = useCallback(() => {
    const today = new Date()
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(today.getDate() + 7)
    
    const upcomingSchools = schools.filter(school => {
      if (!school.toDate) return false
      
      const toDate = new Date(school.toDate)
      // Check if toDate is within the next 7 days and not in the past
      return toDate >= today && toDate <= sevenDaysFromNow
    })

    if (upcomingSchools.length > 0) {
      setNotificationSchools(upcomingSchools)
      setShowNotification(true)
    }
  }, [schools])

  // ---------------- Check for expirations on component mount and when schools change ----------------
  useEffect(() => {
    if (schools.length > 0) {
      checkUpcomingExpirations()
    }
  }, [schools, checkUpcomingExpirations])

  // ---------------- Update school status in backend ----------------
  const updateSchoolStatusInBackend = async (school, newStatus) => {
    try {
      const token = sessionStorage.getItem("adminToken")
      const schoolId = school.schoolId || school.id
      
      const res = await fetch(`${ENDPOINTS.admin.getSchools}/${schoolId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: newStatus,
          manualOverride: false // Keep manual override false for automatic updates
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Failed to update status")
      }

      return await res.json()
    } catch (error) {
      console.error(`Failed to update status for school ${school.schoolId}:`, error)
      throw error
    }
  }

  // ---------------- Refresh schools data from backend ----------------
  const refreshSchoolsData = async () => {
    try {
      const token = sessionStorage.getItem("adminToken")
      const res = await fetch(ENDPOINTS.admin.getSchools, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        const schoolsWithOverride = Array.isArray(data) ? data.map(school => ({
          ...school,
          manualOverride: school.manualOverride || false
        })) : []
        setSchools(schoolsWithOverride)
        setFilteredSchools(schoolsWithOverride)
      }
    } catch (error) {
      console.error("Error refreshing schools data:", error)
    }
  }

  // ---------------- Smart status update based on manual override ----------------
  const checkAndUpdateStatus = useCallback(async () => {
    if (isUpdatingStatus) return; // Prevent multiple simultaneous updates
    
    const today = new Date()
    let hasChanges = false
    const updatePromises = []

    schools.forEach(school => {
      // Skip if school has manual override
      if (school.manualOverride) {
        return
      }

      // Only auto-update schools without manual override
      if (school.fromDate && school.toDate) {
        const fromDate = new Date(school.fromDate)
        const toDate = new Date(school.toDate)
        
        const shouldBeActive = today >= fromDate && today <= toDate
        const shouldBeInactive = today < fromDate || today > toDate
        
        if (shouldBeActive && school.status !== "Active") {
          hasChanges = true
          // Create API call promise for this update
          updatePromises.push(updateSchoolStatusInBackend(school, "Active"))
        } else if (shouldBeInactive && school.status !== "InActive") {
          hasChanges = true
          // Create API call promise for this update
          updatePromises.push(updateSchoolStatusInBackend(school, "InActive"))
        }
      }
    })
    
    if (hasChanges && updatePromises.length > 0) {
      setIsUpdatingStatus(true)
      try {
        // Execute all updates in parallel
        await Promise.all(updatePromises)
        // Refresh schools data after updates
        await refreshSchoolsData()
        console.log("Automatic status updates completed successfully")
      } catch (error) {
        console.error("Error updating school statuses:", error)
        showMessage('error', 'Failed to update some school statuses automatically')
      } finally {
        setIsUpdatingStatus(false)
      }
    }
  }, [schools, isUpdatingStatus])

  useEffect(() => {
    checkAndUpdateStatus()
    // Check every hour instead of daily for more responsive updates
    const interval = setInterval(checkAndUpdateStatus, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [checkAndUpdateStatus])

  // ---------------- Handle Manual Status Toggle ----------------
  const handleStatusToggle = async (schoolId, currentStatus) => {
    const newStatus = currentStatus === "Active" ? "InActive" : "Active"
    
    // Find the school
    const school = schools.find(s => (s.schoolId === schoolId || s.id === schoolId))
    
    if (school) {
      // Check if school is within active period AND admin is trying to deactivate
      if (school.fromDate && school.toDate && newStatus === "InActive") {
        const today = new Date()
        const fromDate = new Date(school.fromDate)
        const toDate = new Date(school.toDate)
        const isWithinActivePeriod = today >= fromDate && today <= toDate
        
        if (isWithinActivePeriod) {
          const confirmMessage = 
            "This school is currently within its active period. " +
            "Setting it to InActive will prevent access regardless of dates. " +
            "Are you sure you want to proceed?"
          
          if (!confirm(confirmMessage)) {
            return
          }
        }
      }
      
      // Check if school is outside active period AND admin is trying to activate
      if (school.fromDate && school.toDate && newStatus === "Active") {
        const today = new Date()
        const fromDate = new Date(school.fromDate)
        const toDate = new Date(school.toDate)
        const isOutsideActivePeriod = today < fromDate || today > toDate
        
        if (isOutsideActivePeriod) {
          const confirmMessage = 
            "This school is currently outside its active period. " +
            "Setting it to Active will grant access regardless of dates. " +
            "Are you sure you want to proceed?"
          
          if (!confirm(confirmMessage)) {
            return
          }
        }
      }
    }
    
    try {
      const token = sessionStorage.getItem("adminToken")
      const res = await fetch(`${ENDPOINTS.admin.getSchools}/${schoolId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: newStatus,
          manualOverride: true // Always enable manual override when admin toggles
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Failed to update status")
      }

      // Get the updated school from response
      const updatedSchool = await res.json()
      
      // Update local state with manual override enabled
      const updatedSchools = schools.map(s => 
        (s.schoolId === schoolId || s.id === schoolId) 
          ? { ...s, status: updatedSchool.status, manualOverride: true } 
          : s
      )
      setSchools(updatedSchools)
      setFilteredSchools(updatedSchools)
      showMessage('success', `School status updated to ${updatedSchool.status}`)
    } catch (err) {
      showMessage('error', err.message)
    }
  }

  // ---------------- Handle Edit ----------------
  const handleEdit = (school) => {
    const schoolId = school.schoolId || school.id
    setEditId(schoolId)
    setEditData({
      schoolCode: school.schoolCode || "", // ✅ New field
      schoolName: school.schoolName || "",
      email: school.email || "",
      phone: school.phone || "",
      password: "",
      fromDate: school.fromDate ? formatDateForInput(school.fromDate) : "",
      toDate: school.toDate ? formatDateForInput(school.toDate) : "",
      status: school.status || "Active"
    })
    setShowEditModal(true)
  }

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }

  // Handle phone number input (only numbers, max 10 digits)
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
    setEditData(prev => ({ ...prev, phone: value }))
  }

  // Handle school code input (uppercase, alphanumeric)
  const handleSchoolCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    setEditData(prev => ({ ...prev, schoolCode: value }))
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'phone') {
      handlePhoneChange(e)
    } else if (name === 'schoolCode') {
      handleSchoolCodeChange(e)
    } else {
      setEditData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleUpdate = async () => {
    try {
      const token = sessionStorage.getItem("adminToken")
      
      // Validate phone number
      if (editData.phone.length !== 10) {
        alert("Phone number must be exactly 10 digits")
        return
      }
      
      // Validate school code
      if (!editData.schoolCode || editData.schoolCode.length < 6 || editData.schoolCode.length > 10) {
        alert("School Code must be between 6 and 10 characters")
        return
      }
      
      if (!/^[A-Z0-9]+$/.test(editData.schoolCode)) {
        alert("School Code must contain only uppercase letters and numbers")
        return
      }
      
      // Validate dates
      if (editData.fromDate && editData.toDate) {
        const fromDate = new Date(editData.fromDate)
        const toDate = new Date(editData.toDate)
        if (fromDate >= toDate) {
          alert("To date must be after From date")
          return
        }
      }

      const updateData = { 
        schoolCode: editData.schoolCode, // ✅ New field
        schoolName: editData.schoolName,
        email: editData.email,
        phone: editData.phone,
        status: editData.status,
        fromDate: editData.fromDate,
        toDate: editData.toDate,
        manualOverride: false // Reset manual override when dates are changed
      }
      
      // Only include password if provided and not empty
      if (editData.password && editData.password.trim() !== "") {
        updateData.password = editData.password
      }

      const res = await fetch(`${ENDPOINTS.admin.getSchools}/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Failed to update school")
      }

      const updatedSchool = await res.json()
      const updatedSchools = schools.map(s => 
        (s.schoolId === editId || s.id === editId) ? updatedSchool : s
      )
      setSchools(updatedSchools)
      setFilteredSchools(updatedSchools)
      setShowEditModal(false)
      setEditId(null)
      setEditData({ 
        schoolCode: "", // ✅ New field
        schoolName: "", 
        email: "", 
        phone: "", 
        password: "",
        fromDate: "",
        toDate: "",
        status: "Active"
      })
      showMessage('success', 'School updated successfully!')
    } catch (err) {
      showMessage('error', err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this school? This action cannot be undone.")) return

    try {
      const token = sessionStorage.getItem("adminToken")
      const res = await fetch(`${ENDPOINTS.admin.getSchools}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Failed to delete school")
      }

      const updatedSchools = schools.filter(s => s.schoolId !== id && s.id !== id)
      setSchools(updatedSchools)
      setFilteredSchools(updatedSchools)
      showMessage('success', 'School deleted successfully!')
    } catch (err) {
      showMessage('error', err.message)
    }
  }

  // ---------------- Format date for display ----------------
  const formatDate = (dateString) => {
    if (!dateString) return "Not set"
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB')
  }

  // Calculate days remaining until toDate
  const getDaysRemaining = (toDateString) => {
    if (!toDateString) return null
    const today = new Date()
    const toDate = new Date(toDateString)
    const timeDiff = toDate.getTime() - today.getTime()
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24))
    return daysRemaining
  }

  // Close modal when clicking outside
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowEditModal(false)
    }
  }

  if (loading || !admin) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh" 
      }}>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100vh" 
    }}>
      {/* Navbar */}
      <div style={{ height: "10vh" }}>
        <AdNavbar />
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: "1 1 auto",
        display: "flex", 
        flexDirection: "column", 
        padding: "2rem",
        overflowY: "auto"
      }}>
        <h2 style={{ 
          fontWeight: "bold", 
          marginBottom: "1rem",
          fontSize: "1.5rem"
        }}>
          Schools Management
          {isUpdatingStatus && (
            <span style={{
              fontSize: "0.8rem",
              color: "#007bff",
              marginLeft: "1rem",
              fontWeight: "normal"
            }}>
              (Updating statuses...)
            </span>
          )}
        </h2>

        {/* Success/Error Messages */}
        {message.text && (
          <div style={{
            background: message.type === 'success' ? "#d4edda" : "#f8d7da",
            color: message.type === 'success' ? "#155724" : "#721c24",
            padding: "0.75rem 1rem",
            borderRadius: "4px",
            border: `1px solid ${message.type === 'success' ? "#c3e6cb" : "#f5c6cb"}`,
            marginBottom: "1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span>{message.text}</span>
            <button 
              onClick={() => setMessage({ type: '', text: '' })}
              style={{
                background: "none",
                border: "none",
                color: "inherit",
                fontSize: "1.2rem",
                cursor: "pointer",
                padding: 0,
                width: "20px",
                height: "20px"
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Expiration Notification */}
        {showNotification && notificationSchools.length > 0 && (
          <div style={{
            background: "#fff3cd",
            color: "#856404",
            padding: "1rem",
            borderRadius: "4px",
            border: "1px solid #ffeaa7",
            marginBottom: "1rem",
            position: "relative"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "0.5rem"
            }}>
              <h4 style={{
                margin: 0,
                fontSize: "1rem",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                ⚠️ Upcoming Expirations
              </h4>
              <button 
                onClick={() => setShowNotification(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#856404",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  padding: 0,
                  width: "20px",
                  height: "20px"
                }}
              >
                ×
              </button>
            </div>
            <p style={{ margin: "0.5rem 0", fontSize: "0.9rem" }}>
              The following schools are expiring within 7 days:
            </p>
            <ul style={{ 
              margin: "0.5rem 0", 
              paddingLeft: "1.5rem",
              fontSize: "0.875rem"
            }}>
              {notificationSchools.map(school => {
                const daysRemaining = getDaysRemaining(school.toDate)
                return (
                  <li key={school.schoolId || school.id}>
                    <strong>{school.schoolName}</strong> ({school.schoolCode}) - Expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} ({formatDate(school.toDate)})
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Search Bar */}
        <div style={{
          marginBottom: "1.5rem",
          maxWidth: "400px"
        }}>
          <input
            type="text"
            placeholder="Search schools by name, code, email, phone, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              border: "1px solid #ced4da",
              borderRadius: "8px",
              fontSize: "0.9rem",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          />
          {searchTerm && (
            <div style={{
              marginTop: "0.5rem",
              color: "#6c757d",
              fontSize: "0.875rem"
            }}>
              Found {filteredSchools.length} school{filteredSchools.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div style={{ 
          background: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          padding: "2rem"
        }}>
          {loadingSchools && (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "2rem",
                height: "2rem",
                border: "3px solid #f3f3f3",
                borderTop: "3px solid #007bff",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto"
              }}></div>
              <p style={{ marginTop: "0.5rem" }}>Loading schools...</p>
            </div>
          )}
          
          {error && (
            <div style={{
              background: "#f8d7da",
              color: "#721c24",
              padding: "0.75rem 1rem",
              borderRadius: "4px",
              border: "1px solid #f5c6cb",
              marginBottom: "1rem"
            }}>
              {error}
            </div>
          )}

          {!loadingSchools && !error && filteredSchools.length === 0 && (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <p style={{ color: "#6c757d" }}>
                {searchTerm ? 'No schools found matching your search.' : 'No schools found. Create one from "Create School".'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  style={{
                    background: "transparent",
                    border: "1px solid #007bff",
                    color: "#007bff",
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                    marginTop: "1rem"
                  }}
                >
                  Clear Search
                </button>
              )}
            </div>
          )}

          {!loadingSchools && !error && filteredSchools.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ 
                width: "100%",
                borderCollapse: "collapse",
                background: "white"
              }}>
                <thead style={{
                  background: "#343a40",
                  color: "white"
                }}>
                  <tr>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>School ID</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>School Code</th> {/* ✅ New column */}
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>School Name</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Email</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Phone</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Status</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Active Period</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchools.map((school) => {
                    const schoolId = school.schoolId || school.id
                    const today = new Date()
                    const fromDate = school.fromDate ? new Date(school.fromDate) : null
                    const toDate = school.toDate ? new Date(school.toDate) : null
                    const isWithinActivePeriod = fromDate && toDate && today >= fromDate && today <= toDate
                    const isOutsideActivePeriod = fromDate && toDate && (today < fromDate || today > toDate)
                    const daysRemaining = getDaysRemaining(school.toDate)
                    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining >= 0
                    
                    return (
                      <tr key={schoolId} style={{
                        borderBottom: "1px solid #dee2e6",
                        background: isExpiringSoon ? "#fff3cd" : "transparent"
                      }}>
                        <td style={{ 
                          padding: "0.75rem",
                          fontWeight: "bold"
                        }}>{schoolId}</td>
                        <td style={{ 
                          padding: "0.75rem",
                          fontWeight: "600",
                          color: "#007bff"
                        }}>{school.schoolCode}</td> {/* ✅ New column */}
                        <td style={{ padding: "0.75rem" }}>{school.schoolName}</td>
                        <td style={{ padding: "0.75rem" }}>{school.email}</td>
                        <td style={{ padding: "0.75rem" }}>{school.phone}</td>
                        
                        {/* Status Column - Clean and Professional */}
                        <td style={{ padding: "0.75rem" }}>
                          <div style={{ 
                            display: "flex", 
                            alignItems: "center",
                            gap: "0.75rem"
                          }}>
                            {/* Toggle Switch */}
                            <label style={{
                              position: "relative",
                              display: "inline-block",
                              width: "3.5rem",
                              height: "1.75rem"
                            }}>
                              <input
                                type="checkbox"
                                checked={school.status === "Active"}
                                onChange={() => handleStatusToggle(schoolId, school.status)}
                                style={{
                                  opacity: 0,
                                  width: 0,
                                  height: 0
                                }}
                              />
                              <span style={{
                                position: "absolute",
                                cursor: "pointer",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: school.status === "Active" ? "#10b981" : "#6b7280",
                                transition: "0.4s",
                                borderRadius: "1.75rem",
                                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)"
                              }}>
                                <span style={{
                                  position: "absolute",
                                  content: '""',
                                  height: "1.25rem",
                                  width: "1.25rem",
                                  left: school.status === "Active" ? "1.8rem" : "0.25rem",
                                  bottom: "0.25rem",
                                  backgroundColor: "white",
                                  transition: "0.4s",
                                  borderRadius: "50%",
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
                                }}></span>
                              </span>
                            </label>
                            
                            {/* Status Text */}
                            <span style={{
                              color: school.status === "Active" ? "#10b981" : "#6b7280",
                              fontWeight: "600",
                              fontSize: "0.875rem",
                              minWidth: "4rem"
                            }}>
                              {school.status}
                            </span>
                            
                            {/* Manual Override Indicator */}
                            {school.manualOverride && (
                              <span 
                                title="Manually overridden - automatic status updates disabled"
                                style={{
                                  fontSize: "0.7rem",
                                  color: "#ff6b35",
                                  background: "#fff0eb",
                                  padding: "0.2rem 0.4rem",
                                  borderRadius: "4px",
                                  border: "1px solid #ff6b35"
                                }}
                              >
                                Manual
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Active Period */}
                        <td style={{ padding: "0.75rem" }}>
                          {school.fromDate && school.toDate ? (
                            <div>
                              <small style={{ color: "#6c757d" }}>
                                {formatDate(school.fromDate)} - {formatDate(school.toDate)}
                              </small>
                              {isWithinActivePeriod && (
                                <div style={{
                                  fontSize: "0.7rem",
                                  color: "#28a745",
                                  marginTop: "2px",
                                  fontWeight: "bold"
                                }}>
                                  ● Currently Active Period
                                </div>
                              )}
                              {isOutsideActivePeriod && (
                                <div style={{
                                  fontSize: "0.7rem",
                                  color: "#dc3545",
                                  marginTop: "2px",
                                  fontWeight: "bold"
                                }}>
                                  ● Outside Active Period
                                </div>
                              )}
                              {isExpiringSoon && (
                                <div style={{
                                  fontSize: "0.7rem",
                                  color: "#ffc107",
                                  marginTop: "2px",
                                  fontWeight: "bold"
                                }}>
                                  ⚠️ Expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: "#6c757d" }}>Not set</span>
                          )}
                        </td>

                        <td style={{ padding: "0.75rem" }}>
                          <div style={{ 
                            display: "flex", 
                            gap: "0.5rem" 
                          }}>
                            <button
                              onClick={() => handleEdit(school)}
                              title="Edit School"
                              style={{
                                background: "transparent",
                                border: "1px solid #007bff",
                                color: "#007bff",
                                padding: "0.375rem 0.75rem",
                                borderRadius: "4px",
                                fontSize: "0.875rem",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                              onMouseOver={(e) => {
                                e.target.style.background = "#007bff";
                                e.target.style.color = "white";
                              }}
                              onMouseOut={(e) => {
                                e.target.style.background = "transparent";
                                e.target.style.color = "#007bff";
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(schoolId)}
                              title="Delete School"
                              style={{
                                background: "transparent",
                                border: "1px solid #dc3545",
                                color: "#dc3545",
                                padding: "0.375rem 0.75rem",
                                borderRadius: "4px",
                                fontSize: "0.875rem",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                              onMouseOver={(e) => {
                                e.target.style.background = "#dc3545";
                                e.target.style.color = "white";
                              }}
                              onMouseOut={(e) => {
                                e.target.style.background = "transparent";
                                e.target.style.color = "#dc3545";
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal - Custom CSS */}
      {showEditModal && (
        <div 
          style={{ 
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1050,
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
          onClick={handleBackdropClick}
        >
          <div 
            style={{ 
              width: "80vw",
              maxWidth: "1200px",
              height: "80vh",
              background: "white",
              borderRadius: "8px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {/* Modal Header */}
            <div style={{ 
              background: "#343a40",
              color: "white",
              padding: "1rem 1.5rem",
              borderBottom: "2px solid #dee2e6",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h3 style={{ 
                margin: 0,
                fontWeight: "bold",
                fontSize: "1.25rem"
              }}>
                Edit School - {editId}
              </h3>
              <button 
                onClick={() => setShowEditModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "white",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  padding: 0,
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                ×
              </button>
            </div>
            
            {/* Modal Body */}
            <div style={{ 
              flex: 1,
              background: "#f8f9fa",
              overflow: "auto",
              padding: "2rem"
            }}>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "2rem",
                  height: "100%"
                }}>
                  {/* Left Column - Basic Information */}
                  <div style={{
                    paddingRight: "2rem",
                    borderRight: "1px solid #dee2e6"
                  }}>
                    <h4 style={{
                      color: "#007bff",
                      fontWeight: "bold",
                      marginBottom: "1.5rem",
                      paddingBottom: "0.5rem",
                      borderBottom: "2px solid #dee2e6",
                      display: "flex",
                      alignItems: "center",
                      fontSize: "1.1rem"
                    }}>
                      Basic Information
                    </h4>
                    
                    <div style={{ marginBottom: "1.5rem" }}>
                      <label style={{
                        display: "block",
                        fontWeight: "600",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem"
                      }}>
                        School ID
                      </label>
                      <input
                        type="text"
                        value={editId}
                        disabled
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          background: "#e9ecef",
                          border: "1px solid #ced4da",
                          borderRadius: "4px",
                          fontWeight: "500",
                          fontSize: "0.9rem"
                        }}
                      />
                      <div style={{
                        color: "#6c757d",
                        fontSize: "0.875rem",
                        marginTop: "0.25rem"
                      }}>
                        School ID cannot be changed
                      </div>
                    </div>

                    {/* ✅ New School Code Field */}
                    <div style={{ marginBottom: "1.5rem" }}>
                      <label style={{
                        display: "block",
                        fontWeight: "600",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem"
                      }}>
                        School Code *
                      </label>
                      <input
                        type="text"
                        name="schoolCode"
                        value={editData.schoolCode}
                        onChange={handleChange}
                        maxLength="10"
                        pattern="[A-Z0-9]+"
                        title="Uppercase letters and numbers only (6-10 characters)"
                        required
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "1px solid #ced4da",
                          borderRadius: "4px",
                          fontSize: "0.9rem",
                          textTransform: "uppercase"
                        }}
                      />
                      <div style={{
                        color: "#6c757d",
                        fontSize: "0.875rem",
                        marginTop: "0.25rem"
                      }}>
                        {editData.schoolCode.length}/10 characters (uppercase letters & numbers only)
                      </div>
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                      <label style={{
                        display: "block",
                        fontWeight: "600",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem"
                      }}>
                        School Name *
                      </label>
                      <input
                        type="text"
                        name="schoolName"
                        value={editData.schoolName}
                        onChange={handleChange}
                        required
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "1px solid #ced4da",
                          borderRadius: "4px",
                          fontSize: "0.9rem"
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                      <label style={{
                        display: "block",
                        fontWeight: "600",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem"
                      }}>
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={editData.email}
                        onChange={handleChange}
                        required
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "1px solid #ced4da",
                          borderRadius: "4px",
                          fontSize: "0.9rem"
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                      <label style={{
                        display: "block",
                        fontWeight: "600",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem"
                      }}>
                        Phone * (10 digits)
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={editData.phone}
                        onChange={handlePhoneChange}
                        required
                        maxLength="10"
                        pattern="[0-9]{10}"
                        placeholder="Enter 10 digit phone number"
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "1px solid #ced4da",
                          borderRadius: "4px",
                          fontSize: "0.9rem"
                        }}
                      />
                      <div style={{
                        color: "#6c757d",
                        fontSize: "0.875rem",
                        marginTop: "0.25rem"
                      }}>
                        {editData.phone.length}/10 digits
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Security & Settings */}
                  <div style={{
                    paddingLeft: "2rem"
                  }}>
                    <h4 style={{
                      color: "#007bff",
                      fontWeight: "bold",
                      marginBottom: "1.5rem",
                      paddingBottom: "0.5rem",
                      borderBottom: "2px solid #dee2e6",
                      display: "flex",
                      alignItems: "center",
                      fontSize: "1.1rem"
                    }}>
                      Security & Settings
                    </h4>

                    <div style={{ marginBottom: "2rem" }}>
                      <label style={{
                        display: "block",
                        fontWeight: "600",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem"
                      }}>
                        New Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={editData.password}
                        onChange={handleChange}
                        placeholder="Enter new password (leave blank to keep current)"
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "1px solid #ced4da",
                          borderRadius: "4px",
                          fontSize: "0.9rem"
                        }}
                      />
                      <div style={{
                        color: "#6c757d",
                        fontSize: "0.875rem",
                        marginTop: "0.25rem"
                      }}>
                        Only enter if you want to change the password
                      </div>
                    </div>

                    <div style={{ marginBottom: "2rem" }}>
                      <label style={{
                        display: "block",
                        fontWeight: "600",
                        marginBottom: "1rem",
                        fontSize: "0.9rem"
                      }}>
                        Active Period *
                      </label>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1rem",
                        marginBottom: "1rem"
                      }}>
                        <div>
                          <label style={{
                            display: "block",
                            color: "#6c757d",
                            fontWeight: "600",
                            marginBottom: "0.5rem",
                            fontSize: "0.8rem"
                          }}>
                            From Date
                          </label>
                          <input
                            type="date"
                            name="fromDate"
                            value={editData.fromDate}
                            onChange={handleChange}
                            required
                            style={{
                              width: "100%",
                              padding: "0.75rem",
                              border: "1px solid #ced4da",
                              borderRadius: "4px",
                              fontSize: "0.9rem"
                            }}
                          />
                        </div>
                        <div>
                          <label style={{
                            display: "block",
                            color: "#6c757d",
                            fontWeight: "600",
                            marginBottom: "0.5rem",
                            fontSize: "0.8rem"
                          }}>
                            To Date
                          </label>
                          <input
                            type="date"
                            name="toDate"
                            value={editData.toDate}
                            onChange={handleChange}
                            required
                            style={{
                              width: "100%",
                              padding: "0.75rem",
                              border: "1px solid #ced4da",
                              borderRadius: "4px",
                              fontSize: "0.9rem"
                            }}
                          />
                        </div>
                      </div>
                      <div style={{
                        color: "#6c757d",
                        fontSize: "0.875rem",
                        textAlign: "center"
                      }}>
                        Set the active period for this school
                      </div>
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                      <label style={{
                        display: "block",
                        fontWeight: "600",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem"
                      }}>
                        Status *
                      </label>
                      <select
                        name="status"
                        value={editData.status}
                        onChange={handleChange}
                        required
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "1px solid #ced4da",
                          borderRadius: "4px",
                          fontSize: "0.9rem",
                          background: "white"
                        }}
                      >
                        <option value="Active">Active</option>
                        <option value="InActive">InActive</option>
                      </select>
                      <div style={{
                        color: "#6c757d",
                        fontSize: "0.875rem",
                        marginTop: "0.25rem"
                      }}>
                        Admin can override automatic status based on active period
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            {/* Modal Footer */}
            <div style={{ 
              padding: "1rem 1.5rem",
              borderTop: "2px solid #dee2e6",
              background: "#f8f9fa",
              display: "flex",
              justifyContent: "flex-end",
              gap: "1rem"
            }}>
              <button 
                onClick={() => setShowEditModal(false)}
                style={{
                  background: "transparent",
                  border: "1px solid #6c757d",
                  color: "#6c757d",
                  padding: "0.5rem 1.5rem",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  minWidth: "120px"
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdate}
                style={{
                  background: "#007bff",
                  border: "1px solid #007bff",
                  color: "white",
                  padding: "0.5rem 1.5rem",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  minWidth: "160px"
                }}
              >
                Update School
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}