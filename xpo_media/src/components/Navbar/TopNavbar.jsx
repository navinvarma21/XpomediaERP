("use client")

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthContext } from "../../Context/AuthContext"

// ---------------- Logout Confirmation Modal ----------------
function LogoutModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1100,
      }}
    >
      <div
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "8px",
          width: "90%",
          maxWidth: "400px",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#333" }}>
          Confirm Logout
        </h2>
        <p style={{ marginBottom: "1.5rem", color: "#666" }}>
          Are you sure you want to logout?
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
          <button
            onClick={onConfirm}
            style={{
              padding: "0.5rem 2rem",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "500",
              backgroundColor: "#0B3D7B",
              color: "white",
            }}
          >
            Yes
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "0.5rem 2rem",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "500",
              backgroundColor: "#6c757d",
              color: "white",
            }}
          >
            No
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------- Expiration Notification Modal ----------------
function ExpirationNotificationModal({ isOpen, onClose, daysRemaining, toDate }) {
  if (!isOpen) return null

  const formatDate = (dateString) => {
    if (!dateString) return "Not set"
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB')
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1100,
      }}
    >
      <div
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "8px",
          width: "90%",
          maxWidth: "450px",
          textAlign: "center",
        }}
      >
        <div style={{
          fontSize: "3rem",
          marginBottom: "1rem",
          color: "#ffc107"
        }}>
          ⚠️
        </div>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#333" }}>
          Subscription Expiring Soon
        </h2>
        <p style={{ marginBottom: "0.5rem", color: "#666", fontSize: "1.1rem" }}>
          Your school subscription will expire in
        </p>
        <p style={{ 
          marginBottom: "1rem", 
          color: "#dc3545", 
          fontSize: "1.5rem",
          fontWeight: "bold"
        }}>
          {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
        </p>
        <p style={{ marginBottom: "1.5rem", color: "#666" }}>
          Expiry Date: <strong>{formatDate(toDate)}</strong>
        </p>
        <p style={{ 
          marginBottom: "1.5rem", 
          color: "#856404",
          fontSize: "0.9rem",
          fontStyle: "italic"
        }}>
          Please contact XPO Media to renew your subscription.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
          <button
            onClick={onClose}
            style={{
              padding: "0.5rem 2rem",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "500",
              backgroundColor: "#ffc107",
              color: "#ffff",
            }}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------- Top Navbar ----------------
function TopNavbar({ toggleSidebar, isMobile }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showExpirationModal, setShowExpirationModal] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const [daysRemaining, setDaysRemaining] = useState(null)
  const navigate = useNavigate()

  const { user, admin, currentAcademicYear, loading, forceLogout } = useAuthContext()

  // Check screen width for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 770)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => {
      window.removeEventListener('resize', checkScreenSize)
    }
  }, [])

  // Check for upcoming expiration
  useEffect(() => {
    if (user?.toDate) {
      const today = new Date()
      const toDate = new Date(user.toDate)
      const timeDiff = toDate.getTime() - today.getTime()
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24))
      
      setDaysRemaining(daysRemaining)

      // Show notification if expiring within 7 days and not in the past
      if (daysRemaining <= 7 && daysRemaining >= 0) {
        // Only show if we haven't shown it recently (check localStorage)
        const lastShown = localStorage.getItem('expirationNotificationLastShown')
        const todayStr = new Date().toDateString()
        
        if (lastShown !== todayStr) {
          setShowExpirationModal(true)
          localStorage.setItem('expirationNotificationLastShown', todayStr)
        }
      }
    }
  }, [user?.toDate])

  const toggleDropdown = () => setIsDropdownOpen((prev) => !prev)

  const handleLogout = () => {
    setShowLogoutModal(true)
    setIsDropdownOpen(false)
  }

  const confirmLogout = () => {
    // This now clears localStorage AND sessionStorage due to Context updates
    forceLogout()
    navigate("/login")
    setShowLogoutModal(false)
  }

  const cancelLogout = () => setShowLogoutModal(false)

  const handleSettingsClick = () => {
    navigate("/settings")
    setIsDropdownOpen(false)
  }

  const handleYearSelectorClick = () => {
    navigate("/select-year")
    setIsDropdownOpen(false)
  }

  const closeExpirationModal = () => {
    setShowExpirationModal(false)
  }

  if (loading) {
    return (
      <nav
        style={{
          display: "flex",
          height: "64px",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0B3D7B",
          color: "white",
        }}
      >
        Loading...
      </nav>
    )
  }

  // ✅ Use AuthContext values safely
  const schoolName = user?.name || admin?.name || "School"
  const schoolId = user?.uid || admin?.adminId || "-"
  const isAdmin = admin ? true : false

  // Check if subscription is expiring soon (for badge display)
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining >= 0
  const isExpired = daysRemaining !== null && daysRemaining < 0

  return (
    <nav
      style={{
        display: "flex",
        height: isSmallScreen ? "70px" : "64px",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#0B3D7B",
        padding: "0 16px",
        color: "white",
        flexWrap: "nowrap",
        position: "relative",
      }}
    >
      {/* Mobile Sidebar Toggle */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: "24px",
            cursor: "pointer",
            marginRight: "10px",
            flexShrink: 0,
          }}
        >
          ☰
        </button>
      )}

      {/* Expiration Warning Badge */}
      {isExpiringSoon && !isAdmin && (
        <div
          style={{
            position: "absolute",
            top: "4px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#ffc107",
            color: "#856404",
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "10px",
            fontWeight: "bold",
            zIndex: 100,
            whiteSpace: "nowrap",
            animation: "pulse 2s infinite",
          }}
          title={`Subscription expires in ${daysRemaining} days`}
        >
          ⚠️ Expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
        </div>
      )}

      {isExpired && !isAdmin && (
        <div
          style={{
            position: "absolute",
            top: "4px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#dc3545",
            color: "white",
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "10px",
            fontWeight: "bold",
            zIndex: 100,
            whiteSpace: "nowrap",
            animation: "pulse 1s infinite",
          }}
          title="Subscription has expired"
        >
          ❌ Subscription Expired
        </div>
      )}

      {/* Center - School Name */}
      <div style={{ 
        flex: 1, 
        textAlign: "center",
        minWidth: 0,
        padding: isSmallScreen ? "4px 8px" : "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        marginTop: (isExpiringSoon || isExpired) ? "8px" : "0",
      }}>
        <span 
          className="school-name-text"
          style={{ 
            fontSize: isSmallScreen ? "13px" : "15px", 
            fontWeight: "600",
            lineHeight: isSmallScreen ? "1.2" : "1.5",
            display: "-webkit-box",
            WebkitLineClamp: isSmallScreen ? 2 : 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            wordBreak: "break-word",
            maxWidth: "100%",
            textAlign: "center",
          }}
        >
          {schoolName}
        </span>
      </div>

      {/* Right Section */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: isSmallScreen ? "6px" : "16px",
        flexShrink: 0,
      }}>
        {/* School ID */}
        <span
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            padding: isSmallScreen ? "3px 5px" : "6px 10px",
            borderRadius: "4px",
            fontSize: isSmallScreen ? "10px" : "14px",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {isSmallScreen ? `ID:${schoolId}` : `ID: ${schoolId}`}
        </span>

        {/* Academic Year */}
        {currentAcademicYear && (
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              padding: isSmallScreen ? "3px 5px" : "6px 12px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            onClick={handleYearSelectorClick}
          >
            {isSmallScreen ? (
              <span style={{ fontSize: "10px", fontWeight: "bold" }}>
                {currentAcademicYear}
              </span>
            ) : (
              <>
                <span style={{ fontSize: "14px", marginRight: "4px" }}>
                  Academic Year:
                </span>
                <span style={{ fontSize: "14px", fontWeight: "bold" }}>
                  {currentAcademicYear}
                </span>
              </>
            )}
          </div>
        )}

        {/* Expiration Warning Icon (for non-admin users) */}
        {isExpiringSoon && !isAdmin && (
          <div
            style={{
              backgroundColor: "rgba(255, 193, 7, 0.2)",
              padding: isSmallScreen ? "3px 5px" : "6px 10px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              border: "1px solid rgba(255, 193, 7, 0.5)",
            }}
            onClick={() => setShowExpirationModal(true)}
            title="Subscription expiring soon"
          >
            {isSmallScreen ? (
              <span style={{ fontSize: "10px", fontWeight: "bold", color: "#ffc107" }}>
                ⚠️ {daysRemaining}d
              </span>
            ) : (
              <span style={{ fontSize: "12px", fontWeight: "bold", color: "#ffc107" }}>
                ⚠️ {daysRemaining} days
              </span>
            )}
          </div>
        )}

        {/* Profile Icon */}
        <div
          style={{
            position: "relative",
            display: "flex",
            height: isSmallScreen ? "26px" : "32px",
            width: isSmallScreen ? "26px" : "32px",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "white",
            borderRadius: "50%",
            cursor: "pointer",
            overflow: "hidden",
            marginRight: isSmallScreen ? "0" : "15px",
            flexShrink: 0,
          }}
          onClick={toggleDropdown}
        >
          {isAdmin ? (
            // Admin Icon
            <svg
              width={isSmallScreen ? "14" : "20"}
              height={isSmallScreen ? "14" : "20"}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0B3D7B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="10" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ) : (
            // User Icon
            <svg
              width={isSmallScreen ? "14" : "20"}
              height={isSmallScreen ? "14" : "20"}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0B3D7B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </div>

        {/* Dropdown */}
        {isDropdownOpen && (
          <div
            style={{
              position: "absolute",
              top: isSmallScreen ? "70px" : "64px",
              right: "16px",
              backgroundColor: "white",
              borderRadius: "4px",
              boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
              zIndex: 1000,
              minWidth: "160px",
            }}
          >
            {currentAcademicYear && (
              <button
                onClick={handleYearSelectorClick}
                style={dropdownButtonStyle}
              >
                Change Academic Year
              </button>
            )}
            <button onClick={handleSettingsClick} style={dropdownButtonStyle}>
              Settings
            </button>
            {isExpiringSoon && !isAdmin && (
              <button 
                onClick={() => { setShowExpirationModal(true); setIsDropdownOpen(false); }}
                style={{
                  ...dropdownButtonStyle,
                  color: "#ffc107",
                  fontWeight: "bold",
                }}
              >
                ⚠️ Subscription Alert
              </button>
            )}
            <button onClick={handleLogout} style={dropdownButtonStyle}>
              Logout
            </button>
          </div>
        )}
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={cancelLogout}
        onConfirm={confirmLogout}
      />

      <ExpirationNotificationModal
        isOpen={showExpirationModal}
        onClose={closeExpirationModal}
        daysRemaining={daysRemaining}
        toDate={user?.toDate}
      />

      {/* Responsive CSS for better mobile handling */}
      <style>
        {`
          .school-name-text {
            /* Ensures proper text wrapping and truncation */
            hyphens: auto;
          }

          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
          }

          @media (max-width: 480px) {
            /* Further adjustments for very small screens */
            .school-name-text {
              font-size: 12px !important;
              line-height: 1.1 !important;
            }
          }
          
          @media (max-width: 370px) {
            /* Extra small screen adjustments */
            .school-name-text {
              font-size: 11px !important;
            }
          }

          /* Ensure dropdown stays on top */
          .dropdown-menu {
            z-index: 1000;
          }
        `}
      </style>
    </nav>
  )
}

const dropdownButtonStyle = {
  width: "100%",
  padding: "8px 16px",
  border: "none",
  background: "none",
  color: "#0B3D7B",
  cursor: "pointer",
  textAlign: "left",
  fontSize: "14px",
}

export default TopNavbar