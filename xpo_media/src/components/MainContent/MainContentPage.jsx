"use client"
import { useState, useEffect } from "react"
import Sidebar from "../Sidebar/Sidebar"
import TopNavbar from "../Navbar/TopNavbar"
import Footer from "../Footer/Footer"
import "../../assets/global.css"

function MainContentPage({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 770
      setIsMobile(newIsMobile)
      setIsSidebarOpen(!newIsMobile) // Close sidebar on mobile, open on larger screens
    }
    window.addEventListener("resize", handleResize)
    handleResize() // Initial check for screen size
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  // Close sidebar when clicking outside on mobile
  const handleContentClick = () => {
    if (isMobile && isSidebarOpen) {
      setIsSidebarOpen(false)
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
      }}
    >
      {/* Fixed TopNavbar with consistent width */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          width: "100vw", // Always full viewport width
          zIndex: 1001, // Higher than sidebar
          backgroundColor: "#fff",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <TopNavbar toggleSidebar={toggleSidebar} isMobile={isMobile} />
      </div>

      {/* Content area with top margin to account for fixed navbar */}
      <div 
        style={{ 
          display: "flex", 
          flex: 1,
          marginTop: "60px", // Adjust this value based on your TopNavbar height
        }}
      >
        {/* Sidebar positioned below navbar */}
        <div
          style={{
            position: "fixed",
            top: "48px", // Position below the navbar
            left: 0,
            zIndex: 1000, // Lower than navbar but higher than content
          }}
        >
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} />
        </div>
        
        {/* Main Content Area */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            marginLeft: isMobile || !isSidebarOpen ? 0 : "280px",
            maxWidth: isMobile ? "100%" : "auto",
            overflowX: "auto",
            // Ensure content doesn't get cut off by fixed navbar
            minHeight: "calc(100vh - 60px)",
          }}
          onClick={handleContentClick}
        >
          <main
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#f3f4f6",
              padding: isMobile ? "12px" : "32px",
              overflowX: "auto",
            }}
          >
            <div style={{ flex: 1 }}>{children}</div>
            <div className="text-center text-lg-start">
              <Footer />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default MainContentPage