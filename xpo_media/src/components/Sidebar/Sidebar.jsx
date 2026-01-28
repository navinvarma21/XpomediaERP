("use client")

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import "bootstrap/dist/css/bootstrap.min.css"
// --- ADDED: Import AuthContext to handle storage clearing ---
import { useAuthContext } from "../../Context/AuthContext"

// Import icons from your assets folder
import dashboardIcon from "../../images/Sidebar-icons/dashboard.png"
import adminIcon from "../../images/Sidebar-icons/admin.png"
import admissionIcon from "../../images/Sidebar-icons/admission.png"
import transactionIcon from "../../images/Sidebar-icons/transaction.png"
import transportIcon from "../../images/Sidebar-icons/transport.png"
import collectionIcon from "../../images/Sidebar-icons/collection.png"
import paymentIcon from "../../images/Sidebar-icons/payment.png"
import debitIcon from "../../images/Sidebar-icons/debit.png"
import settingIcon from "../../images/Sidebar-icons/setting.png"
import logoutIcon from "../../images/Sidebar-icons/logout.png"
import logo from "../../images/Logo/logo.jpg"

// Logout Confirmation Modal Component
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

function Sidebar({ isOpen, toggleSidebar, isMobile }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeItem, setActiveItem] = useState(location.pathname)
  const [expandedItem, setExpandedItem] = useState(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const navRef = useRef(null) // Ref for the scrollable nav container

  // --- ADDED: Use AuthContext ---
  const { logout } = useAuthContext()

  // Memoize the logout click handler
  const handleLogoutClick = useCallback(() => {
    setShowLogoutModal(true)
  }, [])

  const confirmLogout = () => {
    // --- ADDED: Trigger Context logout to clear both storages ---
    logout()
    navigate("/login")
    setShowLogoutModal(false)
  }

  const cancelLogout = () => setShowLogoutModal(false)

  // Memoize the menuItems array
  const menuItems = useMemo(
    () => [
      {
        id: 1,
        title: "Dashboard",
        icon: dashboardIcon,
        path: "/home",
        subItems: [],
      },
      {
        id: 2,
        title: "Administration",
        icon: adminIcon,
        path: "/administration",
        subItems: [
          { id: "2-1", title: "• Standard/Course Setup", path: "/administration/standard-setup" },
          { id: "2-2", title: "• Section Setup", path: "/administration/section-setup" },
          { id: "2-3", title: "• Fee Head Setup", path: "/administration/fee-setup" },
          { id: "2-4", title: "• Miscellaneous Fee Head Setup", path: "/administration/miscellaneous-feeHead-setup" },
          { id: "2-5", title: "• Hostel Fee Head Setup", path: "/administration/Hostel-Fee-Head-Setup" },
          { id: "2-6", title: "• Students Category", path: "/administration/Students-Category" },
          { id: "2-7", title: "• Tuition Fee Setup", path: "/administration/tuition-setup" },
          { id: "2-8", title: "• Hostel Fee Setup", path: "/administration/Hostel-Fee-Setup" },
          { id: "2-9", title: "• Community and Caste Setup", path: "/administration/community-setup" },
          { id: "2-10", title: "• Parent Occupation Setup", path: "/administration/occupation-setup" },
          { id: "2-11", title: "• Mother Tongue", path: "/administration/Mother-Tongue-Setup" },
          { id: "2-12", title: "• Blood Group", path: "/administration/blood-group-Setup" },
          { id: "2-13", title: "• State And District Management", path: "/administration/State-And-District-Management" },
          { id: "2-14", title: "• Payment Setup", path: "/administration/payment-setup" },
          { id: "2-15", title: "• Receipt Setup", path: "/administration/receipt-setup" },
          { id: "2-16", title: "• Staff Designation and Category", path: "/administration/Staff-Designation-and-Category" },
          { id: "2-17", title: "• Staff Master", path: "/administration/staff-master" },
          { id: "2-18", title: "• Certificate Preparation", path: "/administration/certificate" },
          { id: "2-19", title: "• Role Based Account", path: "/administration/password-setup" },
        ],
      },
      {
        id: 3,
        title: "Admission Master",
        icon: admissionIcon,
        path: "/admission",
        subItems: [
          { id: "3-1", title: "• External master Setup/Enquiry", path: "/admission/enquiry" },
          { id: "3-2", title: "• Admission Form", path: "/admission/AdmissionForm" },
          { id: "3-3", title: "• Student Detail", path: "/admission/StudentDetails" },
          { id: "3-4", title: "• QR code Design", path: "/admission/Bar-code-Design" },
          { id: "3-5", title: "• Student Details Report", path: "/admission/Student-Details-Report" },
          { id: "3-6", title: "• Transfer Certificate", path: "/admission/Transfer-Certificate" },
          { id: "3-7", title: "• Demand Report", path: "/admission/Demand-Report" },
          { id: "3-8", title: "• Section Replace", path: "/admission/Section-Replace" },
          { id: "3-9", title: "• Student Phone Replace", path: "/admission/phone-number-replace" },
          { id: "3-10", title: "• Arrear / Fee Updating", path: "/admission/Arrear-FeeUpdating" },
        ],
      },
      {
        id: 4,
        title: "Store",
        icon: admissionIcon,
        path: "/book",
        subItems: [
          { id: "4-8", title: "• Group Setup", path: "/book/Group-Setup" },
          { id: "4-9", title: "• Unit Setup", path: "/book/Unit-Setup" },
          { id: "4-9", title: "• Bank Setup", path: "/book/Bank-Setup" },

          {
            id: "4-1",
            title: "• Supplier Setup",
            path: "/book/supplier-Setup",
          },
          {
            id: "4-2",
            title: "• Item/Book Master",
            path: "/book/item-book-master",
          },
          { id: "4-3", title: "• Category Head", path: "/book/category-head" },
          {
            id: "4-4",
            title: "• Customer / Staff Master",
            path: "/book/customer-staff-master",
          },
          { id: "45-5", title: "• Book Master", path: "/book/Book-Master" },
          {
            id: "4-6",
            title: "• Book Setup Class Wise",
            path: "/book/Book-setup-class-wise",
          },
          {
            id: "4-7",
            title: "• Store Transaction",
            path: "/book/Book-transaction",
          },
          {
            id: "4-10",
            title: "• Store Transaction Report",
            path: "/book/book-transaction-Report",
          },
        ],
      },
      {
        id: 5,
        title: "Transaction",
        icon: transactionIcon,
        path: "/transaction",
        subItems: [
          { id: "5-1", title: "• Billing Entry", path: "/transaction/billing-entry" },
          { id: "5-2", title: "• Other Fee / Miscellaneous Fee", path: "/transaction/other-fee" },
          { id: "5-3", title: "• Individual Paid", path: "/transaction/individual-paid" },
          { id: "5-4", title: "• Payment Entry", path: "/transaction/payment-entry" },
          { id: "5-5", title: "• Receipt Entry", path: "/transaction/receipt-entry" },
          { id: "5-6", title: "• Duplicate Bill", path: "/transaction/duplicate-bill" },
          { id: "5-7", title: "• Staff Phone Update", path: "/transaction/staff-update" },
          { id: "5-9", title: "• Attendance Entry", path: "/transaction/attendance-entry" },
          { id: "5-10", title: "• SMS Send", path: "/transaction/sms-send" },
          { id: "3-11", title: "• Bill Cancel", path: "/transaction/Bill-Cancel-Transaction" },
        ],
      },
      {
        id: 6,
        title: "Transport",
        icon: transportIcon,
        path: "/transport",
        subItems: [
          { id: "6-1", title: "• Bus / Van Fee Head Setup", path: "/transport/bus-van-fee" },
          { id: "6-2", title: "• Driver Conductor Route Setup", path: "/transport/driver-conductor-setup" },
          { id: "6-3", title: "• Place Setup", path: "/transport/place-setup" },
          { id: "6-4", title: "• Bus Fee Setup", path: "/transport/bus-fee-setup" },
          { id: "6-5", title: "• New Bus Bill", path: "/transport/new-bus-bill" },
          { id: "6-6", title: "• Day Bus Fee Collection", path: "/transport/day-bus-fee" },
          { id: "6-7", title: "• Period Bus Fee Collection Report", path: "/transport/period-bus-collection" },
          { id: "6-8", title: "• Bus Fee Balance Report", path: "/transport/bus-balance-report" },
          { id: "6-9", title: "• Placewise List", path: "/admission/Student-Details-Report/stage-wise-report" },
        ],
      },
      {
        id: 7,
        title: "Collection Report",
        icon: collectionIcon,
        path: "/collection-report",
        subItems: [
          { id: "7-1", title: "• Tution Fee", path: "/collection-report/tution-fee" },
          { id: "7-2", title: "• Miscellaneous Fee Collection", path: "/collection-report/Miscellaneous-Fee-Collection" },
          { id: "7-3", title: "• Concession A/C", path: "/collection-report/Concession-AC" },
          { id: "7-4", title: "• Bill Wise Details", path: "/collection-report/Bill-Wise-Details" },
          { id: "7-5", title: "• Receipt Details", path: "/collection-report/Receipt-Details" },
          { id: "7-6", title: "• Routwise Balance Report", path: "/collection-report/Routwise-Balance-Report" },
        ],
      },
      {
        id: 8,
        title: "Payment Reports",
        icon: paymentIcon,
        path: "/payment-report",
        subItems: [],
      },
      {
        id: 9,
        title: "Debit/Credit Report",
        icon: debitIcon,
        path: "/debit-credit-report",
        subItems: [
          { id: "9-1", title: "• Day D/C Report ( Day Book )", path: "/debit-credit-report/day-dc-report" },
          { id: "9-2", title: "• Period D/C Report ( Ledger )", path: "/debit-credit-report/period-dc-report" },
          { id: "9-3", title: "• Bank Ledger", path: "/debit-credit-report/bank-ledger" },
          { id: "9-4", title: "• Balance List", path: "/debit-credit-report/balance-list" },
          { id: "9-5", title: "• Consolidated Strength", path: "/debit-credit-report/consolidated-strength" },
          { id: "9-6", title: "• Promotion / Higher Class Process", path: "/debit-credit-report/Promotion-Higher" },
          { id: "9-7", title: "• Cash Expenses", path: "/debit-credit-report/Cash-Expenses" },
          { id: "9-8", title: "• Bank Expenses", path: "/debit-credit-report/Bank-Expenses" },
          { id: "9-9", title: "• Trail Balance", path: "/debit-credit-report/Trail-Balance" },
          { id: "9-10", title: "• Backup Data", path: "/debit-credit-report/Backup-Data" },
        ],
      },
      {
        id: 10,
        title: "Library Management",
        icon: settingIcon,
        path: "/library",
        subItems: [
          {
            id: "10-1",
            title: "• Staff & Student Master Setup",
            path: "/library/Staff-Student-Master-Setup",
          },

          {
            id: "10-2",
            title: "• Book Supplier Master",
            path: "/library/Book-Supplier-Master",
          },

          { id: "10-3", title: "• Book Setup", path: "/Library/book-setup" }, //category , publisher , Add New Book Details

          {
            id: "10-4",
            title: "• QR code Setup",
            path: "/Library/QR-code-Setup",
          }, //New and Exist

          {
            id: "10-5",
            title: "• Book Issue / Book Entry",
            path: "/library/Bookissue_entry",
          },
          {
            id: "10-7",
            title: "• Library Book Report Generation",
            path: "/library/Library_Report_Generation",
          },
          {
            id: "10-6",
            title: "• Book Detail Management",
            path: "/library/BookManagement",
          },
        ],
      },
      {
        id: 11,
        title: "Settings",
        icon: settingIcon,
        path: "/settings",
        subItems: [],
      },
      {
        id: 12,
        title: "Logout",
        icon: logoutIcon,
        path: "/logout",
        subItems: [],
        onClick: handleLogoutClick,
      },
    ],
    [handleLogoutClick]
  )

  // This effect runs on location change to expand the correct menu and scroll it into view
  useEffect(() => {
    setActiveItem(location.pathname)

    let activeParent = menuItems.find(
      (item) => item.subItems && item.subItems.some((subItem) => location.pathname.startsWith(subItem.path))
    )

    let activeMainItem = null
    let itemToScrollId = null

    if (activeParent) {
      // Found an active sub-item, expand its parent
      setExpandedItem(activeParent.id)
      itemToScrollId = activeParent.id
    } else {
      // No active sub-item, find the matching top-level item
      activeMainItem = menuItems.find(
        (item) =>
          item.path === location.pathname ||
          (item.path !== "/" && item.path !== "/home" && location.pathname.startsWith(item.path))
      )

      if (activeMainItem) {
        itemToScrollId = activeMainItem.id
        // Collapse other submenus if navigating to a top-level item
        if (!activeMainItem.subItems || activeMainItem.subItems.length === 0) {
          setExpandedItem(null)
        }
      } else if (location.pathname === "/home" || location.pathname === "/") {
        // Handle dashboard/home case explicitly
        itemToScrollId = 1 // Assuming Dashboard is id: 1
        setExpandedItem(null)
      }
    }

    // Scroll the active item to the top of the nav container
    if (itemToScrollId) {
      setTimeout(() => {
        if (navRef.current) {
          const element = navRef.current.querySelector(`#menu-item-${itemToScrollId}`)
          if (element) {
            // Scroll to the top of the container
            element.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        }
      }, 100) // Delay to allow DOM to update (e.g., submenu opening)
    }
  }, [location.pathname, menuItems]) // menuItems is now stable

  const sidebarStyle = {
    backgroundColor: "#0B3D7B",
    height: "calc(100vh - 48px)", // Fill height from bottom of navbar to bottom of screen
    width: "280px",
    position: "relative", // Parent div in MainContentPage is already 'fixed'
    transition: "left 0.3s ease-in-out",
    zIndex: 1000,
    display: isOpen ? "flex" : isMobile ? "none" : "flex", // Use flex
    flexDirection: "column", // Arrange children (logo, nav) vertically
  }

  const menuItemStyle = {
    backgroundColor: "transparent",
    border: "none",
    width: "100%",
    textAlign: "left",
    padding: "16px 20px",
    color: "white",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    position: "relative",
    fontSize: "16px",
  }

  const activeMenuItemStyle = {
    ...menuItemStyle,
    backgroundColor: "#1D1616",
  }

  const subMenuStyle = {
    paddingLeft: "56px",
    backgroundColor: "#1D1616",
    display: "flex",
    alignItems: "center",
    color: "white",
    padding: "12px 20px",
    border: "none",
    width: "100%",
    textAlign: "left",
    transition: "all 0.3s ease",
    fontSize: "15px",
  }

  const activeSubMenuStyle = {
    ...subMenuStyle,
    color: "#146FDF",
  }

  const iconStyle = {
    filter: "brightness(0) invert(1)",
  }

  const activeIconStyle = {
    ...iconStyle,
    filter: "none",
  }

  const toggleButtonStyle = {
    backgroundColor: "transparent",
    border: "none",
    color: "white",
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    cursor: "pointer",
    fontSize: "16px",
    padding: "5px",
  }

  const handleNavigation = (path, itemId, event) => {
    setActiveItem(path)
    if (expandedItem === itemId) {
      setExpandedItem(null)
    } else {
      setExpandedItem(itemId)
      // Scroll to the clicked item when expanding
      const menuItemElement = event.currentTarget.closest(".sidebar-item") // Find the parent item
      if (menuItemElement) {
        setTimeout(() => {
          menuItemElement.scrollIntoView({ behavior: "smooth", block: "nearest" })
        }, 100) // Small delay to allow submenu to render
      }
    }
    const menuItem = menuItems.find((item) => item.id === itemId)
    if (menuItem && menuItem.onClick) {
      menuItem.onClick()
    } else if (!menuItems.find((item) => item.id === itemId)?.subItems?.length) {
      navigate(path)
      if (isMobile) {
        toggleSidebar()
      }
    }
  }

  const handleSubItemClick = (path) => {
    setActiveItem(path)
    navigate(path)
    if (isMobile) {
      toggleSidebar()
    }
  }

  const toggleSubmenu = (itemId, event) => {
    event.stopPropagation()
    const newExpandedItem = expandedItem === itemId ? null : itemId
    setExpandedItem(newExpandedItem)
    if (newExpandedItem) {
      // Scroll to the clicked item when expanding
      const menuItemElement = event.currentTarget.closest(".sidebar-item") // Find the parent item
      if (menuItemElement) {
        setTimeout(() => {
          menuItemElement.scrollIntoView({ behavior: "smooth", block: "nearest" })
        }, 100) // Small delay to allow submenu to render
      }
    }
  }

  const isItemActive = (item) => {
    return (
      activeItem.startsWith(item.path) ||
      (item.subItems && item.subItems.some((subItem) => activeItem.startsWith(subItem.path)))
    )
  }

  return (
    <>
      <div style={sidebarStyle}>
        <div
          className="d-flex align-items-center my-3 my-lg-0 justify-content-center p-lg-4 gap-3"
          style={{ marginTop: "10px" }}
        >
          <img
            src={logo || "/placeholder.svg"}
            alt="XPO Media Logo"
            className="img-fluid rounded-circle"
            style={{ maxWidth: "70px" }}
          />
          <span className="text-white fs-4 fw-semibold">XPO Media</span>
        </div>

        {/* This nav is now the main scrollable container */}
        <nav
          ref={navRef}
          style={{ flex: 1, overflowY: "auto", paddingBottom: "20px" }}
        >
          {menuItems.map((item) => (
            // Added ID here for the scrolling useEffect
            <div key={item.id} id={`menu-item-${item.id}`} className="sidebar-item">
              <div
                onClick={(e) => handleNavigation(item.path, item.id, e)}
                style={isItemActive(item) ? activeMenuItemStyle : menuItemStyle}
                className="menu-item"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleNavigation(item.path, item.id, e)
                  }
                }}
              >
                <img
                  src={item.icon || "/placeholder.svg"}
                  className="col-1"
                  alt={item.title}
                  style={isItemActive(item) ? activeIconStyle : iconStyle}
                />
                <span>{item.title}</span>
                {item.subItems && item.subItems.length > 0 && (
                  <button onClick={(e) => toggleSubmenu(item.id, e)} style={toggleButtonStyle}>
                    {expandedItem === item.id ? "-" : "+"}
                  </button>
                )}
              </div>
              {item.subItems && item.subItems.length > 0 && expandedItem === item.id && (
                <div className="sub-menu">
                  {item.subItems.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => handleSubItemClick(subItem.path)}
                      style={activeItem.startsWith(subItem.path) ? activeSubMenuStyle : subMenuStyle}
                      className="sub-menu-item ms-4"
                    >
                      {subItem.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <style>
          {`
            .sidebar-item {
              display: flex;
              flex-direction: column;
            }

            .menu-item:hover {
              background-color: #1D1616 !important;
              color: #146FDF !important;
            }

            .menu-item:hover img {
              filter: none !important;
            }

            .sub-menu-item:hover {
              background-color: #1D1616 !important;
              color: #146FDF !important;
            }

            /* REMOVED overflow-y and max-height from nav, 
              as it's now controlled by inline styles on the nav tag 
            */
            nav {
              padding-bottom: 20px;
            }

            nav::-webkit-scrollbar {
              width: 6px;
            }

            nav::-webkit-scrollbar-track {
              background: transparent;
            }

            nav::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.2);
              border-radius: 3px;
            }

            nav::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.3);
            }

            .sub-menu {
              overflow: hidden;
              transition: max-height 0.3s ease-in-out;
              background-color: #1D1616;
            }
          `}
        </style>
      </div>
      <LogoutModal isOpen={showLogoutModal} onClose={cancelLogout} onConfirm={confirmLogout} />
    </>
  )
}

export default Sidebar