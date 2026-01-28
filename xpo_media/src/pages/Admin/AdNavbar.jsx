"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuthContext } from "../../Context/AuthContext"

// ---------------- Logout Modal ----------------
function LogoutModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
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

// ---------------- Admin Navbar ----------------
export default function AdNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { admin, forceLogout, loading } = useAuthContext()

  const [menuOpen, setMenuOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // ✅ Redirect if not logged in
  useEffect(() => {
    if (!loading && !admin?.adminId) {
      navigate("/admin/login", { replace: true })
    }
  }, [admin, loading, navigate])

  // ---------- Logout Handlers ----------
  const handleLogout = () => setShowLogoutModal(true)
  const confirmLogout = () => {
    forceLogout()
    navigate("/admin/login", { replace: true })
    setShowLogoutModal(false)
  }
  const cancelLogout = () => setShowLogoutModal(false)

  // ---------- Link Styles ----------
  const navLinkStyle = (path) => ({
    cursor: "pointer",
    fontWeight: location.pathname.includes(path) ? "bold" : "normal",
  })

  return (
    <>
      <nav
        style={{
          backgroundColor: "#0B3D7B",
          padding: "0.75rem 1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "white",
        }}
      >
        {/* Left - Admin Name */}
        <div
          style={{ fontWeight: "bold", fontSize: "1.25rem", cursor: "pointer" }}
          onClick={() => navigate("/admin/dashboard")}
        >
          {admin?.name || "Admin Dashboard"}
        </div>

        {/* Right - Nav Links */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <span style={navLinkStyle("dashboard")} onClick={() => navigate("/admin/dashboard")}>
            Dashboard
          </span>
          <span style={navLinkStyle("schools")} onClick={() => navigate("/admin/schools")}>
            Schools
          </span>
          <span style={navLinkStyle("create")} onClick={() => navigate("/admin/create")}>
            Create School
          </span>

          {/* Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              ☰
            </button>
            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "2.5rem",
                  backgroundColor: "white",
                  color: "#333",
                  borderRadius: "6px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  zIndex: 1000,
                }}
              >
                <button
                  onClick={handleLogout}
                  style={{
                    padding: "0.5rem 1rem",
                    border: "none",
                    background: "transparent",
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={cancelLogout}
        onConfirm={confirmLogout}
      />
    </>
  )
}
