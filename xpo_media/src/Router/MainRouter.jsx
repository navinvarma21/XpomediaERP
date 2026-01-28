import { Routes, Route, Navigate } from "react-router-dom"
import { PublicRoute } from "./PublicRouter"
import { PrivateRoute } from "./PrivateRouter"

// Auth pages
import Login from "../pages/Auth/Login"
import Register from "../pages/Auth/Register"

// Main pages
import Home from "../pages/MainPages/Home"
import Settings from "../pages/MainPages/Settings"
import MainContentPage from "../components/MainContent/MainContentPage"

// Sub routers
import AdministrationMaster from "./SubRouters/AdmissionMaster"
import TransactionRoute from "./SubRouters/TransactionRoute"
import TransportRoute from "./SubRouters/TransportRoute"
import CollectionReportRoute from "./SubRouters/CollectionReportRoute"
import PaymentReportRoute from "./SubRouters/PaymentReportRoute"
import DebitCardReportRoute from "./SubRouters/DebitCardReportRoute"
import LibraryManagementRoute from "./SubRouters/LibraryManagementRoute"
import BookRoutes from "./SubRouters/BookRoutes"

// Extra pages
import PaymentReport from "../pages/MainPages/PaymentReport"

// Admin router
import AdminRouter from "./AdminRouter"
import AdministrationRoute from "./SubRouters/AdministrationRoute"

function MainRouter() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Private Routes */}
      <Route
        path="/home"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        }
      />
      <Route
        path="/main"
        element={
          <PrivateRoute>
            <MainContentPage />
          </PrivateRoute>
        }
      />

      {/* Sub Routers */}
      <Route
        path="/administration/*"
        element={
          <PrivateRoute>
            <AdministrationRoute />
          </PrivateRoute>
        }
      />
      <Route
        path="/admission/*"
        element={<PrivateRoute><AdministrationMaster /></PrivateRoute>}
      />
      <Route
        path="/transaction/*"
        element={<PrivateRoute><TransactionRoute /></PrivateRoute>}
      />
      <Route
        path="/transport/*"
        element={<PrivateRoute><TransportRoute /></PrivateRoute>}
      />
      <Route
        path="/collection-report/*"
        element={<PrivateRoute><CollectionReportRoute /></PrivateRoute>}
      />
      <Route
        path="/payment-report/*"
        element={<PrivateRoute><PaymentReportRoute /></PrivateRoute>}
      />
      <Route
        path="/payment-report"
        element={<PrivateRoute><PaymentReport /></PrivateRoute>}
      />
      <Route
        path="/debit-credit-report/*"
        element={<PrivateRoute><DebitCardReportRoute /></PrivateRoute>}
      />
      <Route
        path="/library/*"
        element={<PrivateRoute><LibraryManagementRoute /></PrivateRoute>}
      />
      <Route
        path="/book/*"
        element={<PrivateRoute><BookRoutes /></PrivateRoute>}
      />

      {/* ✅ Admin routes */}
      <Route path="/admin/*" element={<AdminRouter />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default MainRouter
