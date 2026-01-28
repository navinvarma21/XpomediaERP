import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainRouter from "./Router/MainRouter";
import { AuthProvider } from "./Context/AuthContext";
import { UserProvider } from "./Context/UserContext";
import "bootstrap/dist/css/bootstrap.min.css";
import YearSelector from "./components/YearlySelector/YearSelector";
import Login from "./pages/Auth/Login";
import Landing from "./Landing";
import TeacherLogin from "./Academic/pages/Authentication/TeacherLogin";
import StudentLogin from "./Academic/pages/Authentication/StudentLogin";
import StudentDashboard from "./Academic/components/StudentDashboard";
import Teacher from "./Academic/pages/Teacher";
import ProtectedRoute from "./Router/ProtectedRoute";
import Header from "./Academic/components/Header";
import StudentHeader from "./Academic/components/StudentHeader";
import { Box } from "@mui/material";

// Academic routes wrapper component
const AcademicRoutes = ({ children }) => {
  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
};

// Teacher Layout Component
// FIXED: Removed padding: '20px' to allow full width on mobile
const TeacherLayout = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Header />
      <Box sx={{ width: '100%', p: 0 }}>
        {children}
      </Box>
    </div>
  );
};

// Student Layout Component
const StudentLayout = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <StudentHeader />
      <div style={{ padding: '20px' }}>
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Landing page as default */}
          <Route path="/" element={<Landing />} />

          {/* Normal user login */}
          <Route path="/login" element={<Login />} />

          {/* Year selection */}
          <Route path="/select-year" element={<YearSelector />} />

          {/* Academic routes wrapped with UserContext */}
          <Route path="/student-dashboard" element={
            <AcademicRoutes>
              <ProtectedRoute userType="student">
                <StudentLayout>
                  <StudentDashboard />
                </StudentLayout>
              </ProtectedRoute>
            </AcademicRoutes>
          } />
          <Route path="/teacher" element={
            <AcademicRoutes>
              <ProtectedRoute userType="teacher">
                <TeacherLayout>
                  <Teacher />
                </TeacherLayout>
              </ProtectedRoute>
            </AcademicRoutes>
          } />
          <Route path="/teacherlogin" element={
            <AcademicRoutes>
              <TeacherLogin />
            </AcademicRoutes>
          } />
          <Route path="/studentlogin" element={
            <AcademicRoutes>
              <StudentLogin />
            </AcademicRoutes>
          } />

          {/* All main routes (includes admin) */}
          <Route path="/*" element={<MainRouter />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;