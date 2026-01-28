"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Paper,
  List,
  ListItemButton,
  ListItemIcon,
  Typography,
  ListItemText,
  IconButton,
  Breadcrumbs,
  Link,
  Divider,
  useMediaQuery,
  Drawer,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Avatar,
  Tooltip,
  Fade
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ChecklistRtlIcon from "@mui/icons-material/ChecklistRtl";
import ContentPasteSearchIcon from "@mui/icons-material/ContentPasteSearch";
import DrawIcon from "@mui/icons-material/Draw";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import LogoutIcon from "@mui/icons-material/Logout";
import CloseIcon from "@mui/icons-material/Close";
import SchoolIcon from '@mui/icons-material/School';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Teacher_Dashboard from "./Teacher_Dashboard";
import { useUserContext } from "../../Context/UserContext";
import { useNavigate, useSearchParams } from "react-router-dom";

// Lazy load components for better performance
const lazyComponents = {
  Dashboard: Teacher_Dashboard,
  Academic_year_setup: () => import("./Academic Year Configuration/Academic_year_setup"),
  Student_Admission: () => import("./Academic Year Configuration/Student_Admission"),
  Teacher_Admission: () => import("./Academic Year Configuration/Teacher_Admission"),
  Subject_Enrollment: () => import("./Academic Year Configuration/Subject_Enrollment"),
  Teacher_Allotment: () => import("./Academic Year Configuration/Teacher_Allotment"),
  TimetableAllocationMain: () => import("../components/Timetable/TimetableAllocationMain"),
  Overview: () => import("./Academic Year Configuration/Overview"),
  AttendanceRecord: () => import("./Attendance/AttendanceRecord"),
  Attendance_History: () => import("./Attendance/Attendance_History"),
  Disciplinary_Records: () => import("./Attendance/Disciplinary_Record"),
  Create_Exam_Type: () => import("./Examination_Management/Create_Exam_Type"),
  Examination_Creation_Scheduling: () => import("./Examination_Management/Examination_Creation_Scheduling"),
  Exam_Schedule_View: () => import("./Examination_Management/Exam_Schedule_View"),
  MarksEntry_GradeCalculations: () => import("./Examination_Management/MarksEntry_GradeCalculations"),
  Exam_Results: () => import("./Examination_Management/Exam_Results"),
  Assignment_Creation: () => import("./Homework_&_Assignment_Management/Assignment_Creation"),
  Evaluation_Tools: () => import("./Homework_&_Assignment_Management/Evaluation_Tools"),
  Deadline_Tracker: () => import("./Homework_&_Assignment_Management/Deadline_Tracker"),
  Assignment_Management_Tabs: () => import("./Homework_&_Assignment_Management/Assignment_Management_Tabs"),
  PerformanceMetrics: () => import("./Performance_Metrics/PerformanceMetrics"),
  EventActivityManagementModule: () => import("./Event_&_Activity_Management/EventActivityManagementModule"),
};

// --- IMPROVED STYLING SYSTEM ---
const styles = {
  sidebar: {
    width: "280px",
    background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
    color: "#e2e8f0",
    height: "100%",
    overflowY: "auto",
    transition: "all 0.3s ease",
    borderRight: "1px solid rgba(255,255,255,0.05)",
    boxShadow: "4px 0 24px rgba(0,0,0,0.2)",
    "&::-webkit-scrollbar": {
      width: "5px",
    },
    "&::-webkit-scrollbar-track": {
      background: "transparent",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "rgba(255, 255, 255, 0.1)",
      borderRadius: "10px",
    },
    "&::-webkit-scrollbar-thumb:hover": {
      background: "rgba(255, 255, 255, 0.2)",
    },
  },
  mobileSidebar: {
    width: "240px",
    background: "#0f172a",
    color: "#fff",
    height: "100%",
    overflowY: "auto",
  },
  listItem: {
    py: 1.2,
    mx: 1.5,
    my: 0.5,
    borderRadius: "12px",
    color: "#94a3b8",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      color: "#f1f5f9",
      transform: "translateX(4px)",
    },
  },
  subListItem: {
    py: 1,
    pl: 2, 
    pr: 1,
    mx: 2,
    my: 0.2,
    borderRadius: "8px",
    color: "#94a3b8",
    transition: "all 0.2s ease",
    borderLeft: "1px solid rgba(255,255,255,0.1)",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.03)",
      color: "#fff",
      borderLeft: "1px solid rgba(255,255,255,0.5)",
    },
  },
  activeListItem: {
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    color: "#38bdf8",
    fontWeight: 600,
    boxShadow: "0 0 0 1px rgba(56, 189, 248, 0.2)",
    "&:hover": {
        backgroundColor: "rgba(56, 189, 248, 0.15)",
    }
  },
  activeSubListItem: {
    backgroundColor: "transparent",
    color: "#38bdf8",
    borderLeft: "3px solid #38bdf8",
    paddingLeft: "14px",
    fontWeight: 600,
  },
  sectionHeader: {
    padding: "24px 24px 12px 24px",
    display: "flex",
    alignItems: "center",
    gap: 2,
    background: "rgba(0,0,0,0.1)",
    marginBottom: 1,
  },
  mobileDrawer: {
    "& .MuiDrawer-paper": {
      background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
      color: "#fff",
      boxShadow: "2px 0 20px rgba(0,0,0,0.5)",
      borderRight: "1px solid rgba(255,255,255,0.1)",
    },
    "& .MuiBackdrop-root": {
      backgroundColor: "rgba(15, 23, 42, 0.7)",
      backdropFilter: "blur(4px)",
    },
  },
  mobileHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    p: 2,
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(15, 23, 42, 0.95)",
  },
  floatingMenuButton: {
    position: 'fixed',
    bottom: 24,
    left: 24,
    zIndex: 1200,
    backgroundColor: '#38bdf8',
    color: '#0f172a',
    '&:hover': {
      backgroundColor: '#7dd3fc',
    },
    boxShadow: '0 8px 20px rgba(56, 189, 248, 0.4)',
  },
  logoutButton: {
    mx: 1.5,
    mt: 2,
    mb: 2,
    borderRadius: '12px',
    color: '#f87171',
    border: '1px solid rgba(248, 113, 113, 0.2)',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(248, 113, 113, 0.1)',
      borderColor: '#f87171',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(248, 113, 113, 0.2)',
    },
  },
  dialogPaper: {
    borderRadius: '20px',
    padding: '16px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
  },
  dialogIconContainer: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    backgroundColor: '#fee2e2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    marginBottom: '20px',
    animation: 'pulse 2s infinite',
  },
};

// Navigation Items
const navigationItems = [
  {
    label: "Academic Year Configuration",
    icon: <MenuBookIcon />,
    stateKey: "open1",
    children: [
      { label: "Academic Year Setup", component: "Academic_year_setup", path: "Academic-Year-Configuration/Academic-Year-Setup" },
      { label: "Subject Configuration", component: "Subject_Enrollment", path: "Academic-Year-Configuration/Subject-Configuration" },
      { label: "Student Admission", component: "Student_Admission", path: "Academic-Year-Configuration/Student-Admission" },
      { label: "Teacher Admission", component: "Teacher_Admission", path: "Academic-Year-Configuration/Teacher-Admission" },
      { label: "Teacher Subject Allocation", component: "Teacher_Allotment", path: "Academic-Year-Configuration/Teacher-Subject-Allocation" },
      { label: "Timetable Allocation", component: "TimetableAllocationMain", path: "Academic-Year-Configuration/Timetable-Allocation" },
    ],
  },
  {
    label: "Attendance & Disciplinary",
    icon: <ChecklistRtlIcon />,
    stateKey: "open2",
    children: [
      { label: "Attendance Record", component: "AttendanceRecord", path: "Attendance-&-Disciplinary/Attendance-Record" },
      { label: "Attendance History", component: "Attendance_History", path: "Attendance-&-Disciplinary/Attendance-History" },
    ],
  },
  {
    label: "Examination Management",
    icon: <ContentPasteSearchIcon />,
    stateKey: "open3",
    children: [
      { label: "Create Exam Type", component: "Create_Exam_Type", path: "Examination-Management/Create-Exam-Type" },
      { label: "Exam Creation & Scheduling", component: "Examination_Creation_Scheduling", path: "Examination-Management/Exam-Creation-&-Scheduling" },
      { label: "Exam Schedule View", component: "Exam_Schedule_View", path: "Examination-Management/Exam-Schedule-View" },
      { label: "Entry Marks", component: "MarksEntry_GradeCalculations", path: "Examination-Management/Entry-Marks" },
      { label: "Exam Results", component: "Exam_Results", path: "Examination-Management/Exam-Results" },
    ],
  },
  {
    label: "Homework & Assignment",
    icon: <DrawIcon />,
    stateKey: "open5",
    children: [
      { label: "Assignment Creation", component: "Assignment_Creation", path: "Homework-&-Assignment/Assignment-Creation" },
      { label: "Mark Evaluation", component: "Evaluation_Tools", path: "Homework-&-Assignment/Mark-Evaluation" },
      { label: "Deadline Tracker", component: "Deadline_Tracker", path: "Homework-&-Assignment/Deadline-Tracker" },
      { label: "Assignment Tracking Tabs", component: "Assignment_Management_Tabs", path: "Homework-&-Assignment/Assignment-Tracking-Tabs" },
    ],
  },
  {
    label: "Performance Metrics",
    icon: <FiberManualRecordIcon />,
    stateKey: "open4",
    children: [
      { label: "All Performance Data", component: "PerformanceMetrics", path: "Performance-Metrics/All-Performance-Data" },
    ],
  },
  {
    label: "Event & Activity Management",
    icon: <FiberManualRecordIcon />,
    stateKey: "open6",
    children: [
      { label: "Event & Activity Management", component: "EventActivityManagementModule", path: "Event-&-Activity-Management/Event-&-Activity-Management" },
    ],
  },
];

// Helper Functions
const findComponentByPath = (urlPath) => {
  if (!urlPath || urlPath === "Dashboard") return "Dashboard";
    
  for (const section of navigationItems) {
    for (const item of section.children) {
      if (item.path === urlPath) {
        return item.component;
      }
    }
  }
  return "Dashboard";
};

const findPathByComponent = (componentName) => {
  if (componentName === "Dashboard") return "Dashboard";
    
  for (const section of navigationItems) {
    for (const item of section.children) {
      if (item.component === componentName) {
        return item.path;
      }
    }
  }
  return "Dashboard";
};

const findOpenStateKeyByPath = (urlPath) => {
  if (!urlPath || urlPath === "Dashboard") return null;
  for (const section of navigationItems) {
    for (const item of section.children) {
      if (item.path === urlPath) {
        return section.stateKey;
      }
    }
  }
  return null;
};

function Teacher() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { logout } = useUserContext();
    
  const isLargeScreen = useMediaQuery('(min-width:770px)', { noSsr: true });
  const isTablet = useMediaQuery('(max-width:769px) and (min-width:600px)', { noSsr: true });
  const isMobile = useMediaQuery('(max-width:599px)', { noSsr: true });

  const initialUrlParam = searchParams.get('page');
    
  const initialComponent = useMemo(() => {
    return findComponentByPath(initialUrlParam);
  }, [initialUrlParam]);

  const initialOpenStates = useMemo(() => {
    const activeKey = findOpenStateKeyByPath(initialUrlParam);
    return {
      open1: activeKey === "open1",
      open2: activeKey === "open2",
      open3: activeKey === "open3",
      open4: activeKey === "open4",
      open5: activeKey === "open5",
      open6: activeKey === "open6",
    };
  }, [initialUrlParam]);

  const [component, setComponent] = useState(initialComponent);
  const [openStates, setOpenStates] = useState(initialOpenStates);
  const [CurrentComponent, setCurrentComponent] = useState(() => Teacher_Dashboard);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const updateUrl = useCallback((path) => {
    if (path) {
      const newUrl = `${window.location.pathname}?page=${path}`;
      if (searchParams.get('page') !== path) {
          navigate(newUrl, { replace: true });
      }
    }
  }, [navigate, searchParams]);

  useEffect(() => {
    const path = findPathByComponent(component);
    updateUrl(path);
  }, [component, updateUrl]);

  const getSidebarWidth = useCallback(() => {
    if (isLargeScreen) return "280px";
    if (isTablet) return "260px";
    return "240px";
  }, [isLargeScreen, isTablet]);

  useEffect(() => {
    const loadComponent = async () => {
      setIsLoading(true);
        
      if ('requestIdleCallback' in window) {
        requestIdleCallback(async () => {
          try {
            if (component === "Dashboard") {
              setCurrentComponent(() => Teacher_Dashboard);
            } else if (lazyComponents[component]) {
              const module = await lazyComponents[component]();
              setCurrentComponent(() => module.default);
            }
          } catch (error) {
            console.error(`Failed to load component: ${component}`, error);
            setCurrentComponent(() => () => <Box sx={{ p: 3 }}>Error Loading Component</Box>);
          } finally {
            setIsLoading(false);
          }
        });
      } else {
        setTimeout(async () => {
          try {
            if (component === "Dashboard") {
              setCurrentComponent(() => Teacher_Dashboard);
            } else if (lazyComponents[component]) {
              const module = await lazyComponents[component]();
              setCurrentComponent(() => module.default);
            }
          } catch (error) {
            console.error(`Failed to load component: ${component}`, error);
          } finally {
            setIsLoading(false);
          }
        }, 0);
      }
    };

    loadComponent();
  }, [component]);

  const breadcrumbs = useMemo(() => {
    const currentSection = navigationItems.find((section) =>
      section.children.some((item) => item.component === component)
    );
    const currentItem = currentSection?.children.find(
      (item) => item.component === component
    );
      
    return [
      { label: "Dashboard", component: "Dashboard" },
      ...(currentSection && currentItem
        ? [
            { label: currentSection.label },
            { label: currentItem.label, component: currentItem.component },
          ]
        : []),
    ];
  }, [component]);

  const toggleSection = useCallback((stateKey) => {
    setOpenStates(prev => {
      const newState = {};
      for (const key in prev) {
        newState[key] = key === stateKey ? !prev[key] : false;
      }
      return newState;
    });
  }, []);

  const handleComponentChange = useCallback((comp) => {
    setComponent(comp);
    if (!isLargeScreen) {
      setMobileSidebarOpen(false);
    }
  }, [isLargeScreen]);

  const handleLogoutClick = useCallback(() => {
    setLogoutDialogOpen(true);
  }, []);

  const handleLogoutConfirm = useCallback(() => {
    setLogoutDialogOpen(false);
    logout();
    navigate('/');
  }, [logout, navigate]);

  const handleLogoutCancel = useCallback(() => {
    setLogoutDialogOpen(false);
  }, []);

  const renderSidebarContent = useCallback(() => (
    <>
      {/* Branding / Logo Area */}
      <Box sx={isLargeScreen ? styles.sectionHeader : styles.mobileHeader}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
            <SchoolIcon fontSize="small" />
        </Avatar>
        <Box>
            <Typography variant="subtitle1" sx={{ color: "#fff", fontWeight: 700, lineHeight: 1 }}>
                Teacher Panel
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontSize: '0.7rem' }}>
                Academic Portal
            </Typography>
        </Box>
        
        {!isLargeScreen && (
          <IconButton onClick={() => setMobileSidebarOpen(false)} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ backgroundColor: "rgba(255,255,255,0.1)", mb: 2 }} />

      <List disablePadding sx={{ flex: 1 }}>
        <ListItemButton
          sx={{
            ...styles.listItem,
            ...(component === "Dashboard" ? styles.activeListItem : {}),
          }}
          onClick={() => handleComponentChange("Dashboard")}
        >
          <ListItemIcon sx={{ color: "inherit", minWidth: 32 }}>
            <HomeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Dashboard"
            primaryTypographyProps={{ fontSize: 14, fontWeight: component === "Dashboard" ? 600 : 400 }}
          />
        </ListItemButton>

        {navigationItems.map((section) => (
          <Box key={section.label}>
            <ListItemButton
              onClick={() => toggleSection(section.stateKey)}
              sx={{
                ...styles.listItem,
                ...(openStates[section.stateKey] ? { backgroundColor: "rgba(255,255,255,0.05)", color: "#fff" } : {})
              }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 32 }}>
                {section.icon}
              </ListItemIcon>
              <ListItemText
                primary={section.label}
                primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }}
              />
              {openStates[section.stateKey] ? (
                <RemoveIcon sx={{ fontSize: 14, opacity: 0.7 }} />
              ) : (
                <AddIcon sx={{ fontSize: 14, opacity: 0.7 }} />
              )}
            </ListItemButton>

            {/* Animated Collapse Container */}
            {openStates[section.stateKey] && (
                <Box sx={{ overflow: 'hidden', mb: 1 }}>
                    {section.children.map((item) => (
                    <ListItemButton
                        key={item.label}
                        sx={{
                        ...styles.subListItem,
                        ...(component === item.component ? styles.activeSubListItem : {}),
                        }}
                        onClick={() => handleComponentChange(item.component)}
                    >
                        {component !== item.component && (
                            <FiberManualRecordIcon sx={{ fontSize: 6, mr: 2, opacity: 0.5 }} />
                        )}
                        <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ fontSize: 13 }}
                        />
                    </ListItemButton>
                    ))}
                </Box>
            )}
          </Box>
        ))}
      </List>

      <Box sx={{ p: 2, mt: 'auto' }}>
        <Tooltip title="Sign out of your account" arrow placement="right">
            <ListItemButton onClick={handleLogoutClick} sx={styles.logoutButton}>
            <ListItemIcon sx={{ color: 'inherit', minWidth: 32 }}>
                <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
            </ListItemButton>
        </Tooltip>
      </Box>
    </>
  ), [component, openStates, handleComponentChange, toggleSection, handleLogoutClick, isLargeScreen, isMobile]);

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#f1f5f9" }}>
      {/* Desktop Sidebar */}
      {isLargeScreen && (
        <Paper 
          elevation={0}
          sx={{
            ...styles.sidebar,
            position: 'fixed',
            top: '60px', // Assuming top bar height
            left: 0,
            height: 'calc(100vh - 60px)',
            zIndex: 1000,
            borderRadius: 0,
          }}
        >
          {renderSidebarContent()}
        </Paper>
      )}

      {/* Mobile/Tablet Drawer */}
      {!isLargeScreen && (
        <Drawer
          variant="temporary"
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          sx={styles.mobileDrawer}
        >
          <Box sx={{ width: getSidebarWidth(), height: '100%' }}>
            {renderSidebarContent()}
          </Box>
        </Drawer>
      )}

      {/* Main Content */}
      <Box 
        sx={{
          flex: 1,
          marginLeft: isLargeScreen ? "280px" : 0,
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          width: isLargeScreen ? 'calc(100vw - 280px)' : '100vw',
        }}
      >
        <Box 
          sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            p: { xs: 0, md: 3 }, 
            overflow: 'hidden' 
          }}
        >
          {/* --- BEAUTIFUL BREADCRUMB CONTAINER --- */}
          <Paper
            elevation={0}
            sx={{
               // Styling: Glassmorphic look
               background: { xs: 'rgba(255,255,255,0.9)', md: 'rgba(255,255,255,0.8)' },
               backdropFilter: 'blur(8px)',
               border: '1px solid rgba(255,255,255,0.3)',
               borderRadius: { xs: 0, md: '16px' },
               mb: { xs: 0.5, md: 2 },
               // Default Mobile: Compact spacing
               px: { xs: 1.5, md: 3 }, 
               py: { xs: 0.75, md: 1.5 },
               // ULTRA-SMALL MOBILE (<325px) OVERRIDE
               '@media (max-width: 325px)': {
                  px: 1,
                  py: 0.5,
                  mb: 0.5,
                  borderRadius: 0 // Flatten corners on extremely small screens to maximize width
               },
               display: 'flex',
               alignItems: 'center',
               width: '100%',
               boxShadow: { xs: '0 1px 2px rgba(0,0,0,0.03)', md: '0 4px 20px rgba(0,0,0,0.03)' }
            }}
          >
            <Breadcrumbs 
              separator={
                <NavigateNextIcon sx={{ 
                  fontSize: { xs: '10px', md: '16px' }, 
                  color: '#94a3b8',
                  '@media (max-width: 325px)': { fontSize: '8px' } 
                }} />
              }
              sx={{ 
                 '& .MuiBreadcrumbs-ol': { 
                    flexWrap: 'nowrap', // Prevent wrapping
                    overflowX: 'auto', 
                    scrollbarWidth: 'none' 
                 }
              }}
            >
                {breadcrumbs.map((crumb, index) => {
                   const isLast = index === breadcrumbs.length - 1;
                   return (
                    <Link
                      key={crumb.label}
                      underline="none"
                      color={isLast ? "primary.main" : "text.secondary"}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (crumb.component) handleComponentChange(crumb.component);
                      }}
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        cursor: isLast ? 'default' : 'pointer',
                        fontWeight: isLast ? 700 : 500,
                        transition: 'color 0.2s',
                        '&:hover': { color: isLast ? 'primary.main' : 'primary.light' },
                        // DEFAULT FONT SIZES
                        fontSize: { xs: '0.6rem', sm: '0.75rem', md: '0.875rem' },
                        // ULTRA-SMALL (<325px) OVERRIDE
                        '@media (max-width: 325px)': {
                           fontSize: '0.5rem', // Very tiny for small screens
                           letterSpacing: '0'
                        },
                        letterSpacing: { xs: '0.01em', md: '0.02em' },
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {/* Add Home Icon to the first item */}
                      {index === 0 && (
                        <HomeIcon sx={{ 
                          mr: 0.5, 
                          fontSize: { xs: '0.8rem', md: '1.1rem' }, 
                          mb: '2px',
                          '@media (max-width: 325px)': { fontSize: '0.7rem', mr: 0.2 }
                        }} />
                      )}
                      {crumb.label}
                    </Link>
                   );
                })}
            </Breadcrumbs>
          </Paper>

          <Box 
            sx={{ 
              flex: 1, 
              backgroundColor: "#fff", 
              borderRadius: { xs: 0, md: "16px" }, 
              p: { xs: 2, md: 4 }, 
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)", 
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              border: { xs: 'none', md: "1px solid #e2e8f0" },
              position: 'relative' // For loader positioning
            }}
          >
            {isLoading ? (
              // --- NEW UNIQUE 3D GYROSCOPIC/ATOMIC LOADER ---
              <Fade in={true}>
                  <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      flex: 1,
                      gap: 4,
                      perspective: '1000px'
                  }}>
                    <Box sx={{ 
                        position: 'relative', 
                        width: '100px', 
                        height: '100px',
                        transformStyle: 'preserve-3d'
                    }}>
                        {/* Central Core */}
                        <Box sx={{
                            position: 'absolute',
                            top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '40px', height: '40px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle at 30% 30%, #7dd3fc, #0284c7)',
                            boxShadow: '0 0 20px rgba(56, 189, 248, 0.6)',
                            zIndex: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <SchoolIcon sx={{ color: '#fff', fontSize: 20 }} />
                        </Box>

                        {/* Ring 1 - Horizontal Fast */}
                        <Box sx={{
                            position: 'absolute', inset: 0,
                            border: '3px solid transparent',
                            borderTopColor: '#38bdf8',
                            borderBottomColor: '#38bdf8',
                            borderRadius: '50%',
                            animation: 'spin3D 1.5s linear infinite'
                        }} />

                        {/* Ring 2 - Vertical Angled */}
                        <Box sx={{
                            position: 'absolute', inset: '-10px',
                            border: '3px solid transparent',
                            borderLeftColor: '#818cf8',
                            borderRightColor: '#818cf8',
                            borderRadius: '50%',
                            animation: 'spin3D-rev 2s linear infinite'
                        }} />

                        {/* Ring 3 - Wide Elliptical */}
                        <Box sx={{
                            position: 'absolute', inset: '-20px',
                            border: '1px dashed rgba(99, 102, 241, 0.4)',
                            borderRadius: '50%',
                            animation: 'pulse-scale 2s ease-in-out infinite alternate'
                        }} />

                        {/* Orbiting Electron/Dot */}
                        <Box sx={{
                            position: 'absolute', top: '50%', left: '50%',
                            width: '140%', height: '140%',
                            transform: 'translate(-50%, -50%)',
                            animation: 'spin-flat 3s linear infinite'
                        }}>
                            <Box sx={{
                                position: 'absolute', top: 0, left: '50%',
                                width: '8px', height: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#fbbf24',
                                boxShadow: '0 0 10px #fbbf24'
                            }} />
                        </Box>
                        
                        {/* CSS Animations */}
                        <style>{`
                            @keyframes spin3D {
                                0% { transform: rotateX(70deg) rotateZ(0deg); }
                                100% { transform: rotateX(70deg) rotateZ(360deg); }
                            }
                            @keyframes spin3D-rev {
                                0% { transform: rotateY(60deg) rotateZ(0deg); }
                                100% { transform: rotateY(60deg) rotateZ(-360deg); }
                            }
                            @keyframes spin-flat {
                                0% { transform: translate(-50%, -50%) rotate(0deg); }
                                100% { transform: translate(-50%, -50%) rotate(360deg); }
                            }
                            @keyframes pulse-scale {
                                0% { transform: scale(0.9); opacity: 0.5; }
                                100% { transform: scale(1.1); opacity: 1; }
                            }
                            @keyframes glitch-text {
                                0% { opacity: 1; transform: skewX(0deg); }
                                20% { opacity: 0.8; transform: skewX(-2deg); }
                                40% { opacity: 1; transform: skewX(2deg); }
                                100% { opacity: 1; transform: skewX(0deg); }
                            }
                        `}</style>
                    </Box>
                    
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                color: '#334155', 
                                fontWeight: 700, 
                                letterSpacing: '-0.5px',
                                mb: 0.5
                            }}
                        >
                            Initializing Workspace
                        </Typography>
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                color: '#94a3b8', 
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1
                            }}
                        >
                            <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#38bdf8', animation: 'pulse 1s infinite' }} />
                            Fetching academic data...
                        </Typography>
                    </Box>
                  </Box>
              </Fade>
            ) : (
              <CurrentComponent />
            )}
          </Box>
        </Box>
      </Box>

      {/* Floating Button for Mobile */}
      {!isLargeScreen && (
        <Fab
          onClick={() => setMobileSidebarOpen(true)}
          sx={styles.floatingMenuButton}
          size="small"
        >
          <MenuIcon fontSize="small" />
        </Fab>
      )}

      {/* LOGOUT CONFIRMATION DIALOG */}
      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        aria-labelledby="logout-dialog-title"
        PaperProps={{ sx: styles.dialogPaper }}
        TransitionProps={{ timeout: 400 }}
      >
        <Box sx={{ p: 2, pt: 3, textAlign: 'center' }}>
          <Box sx={styles.dialogIconContainer}>
            <LogoutIcon sx={{ color: '#ef5350', fontSize: 32 }} />
          </Box>

          <DialogTitle 
            id="logout-dialog-title" 
            sx={{ p: 0, mb: 1, fontWeight: 700, fontSize: '1.25rem', color: '#1e293b' }}
          >
            Log Out?
          </DialogTitle>
            
          <DialogContent sx={{ p: 0, mb: 3 }}>
            <DialogContentText sx={{ fontSize: '0.95rem', color: '#64748b' }}>
              Are you sure you want to leave? <br/>
              Unsaved changes will be lost.
            </DialogContentText>
          </DialogContent>

          <DialogActions sx={{ justifyContent: 'center', gap: 2, p: 0 }}>
            <Button 
              onClick={handleLogoutCancel} 
              variant="outlined"
              color="inherit"
              sx={{ 
                borderRadius: '10px', 
                textTransform: 'none', 
                fontWeight: 600, 
                padding: '10px 24px',
                borderColor: '#cbd5e1', 
                color: '#64748b' 
            }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleLogoutConfirm} 
              variant="contained" 
              disableElevation
              sx={{ 
                borderRadius: '10px', 
                textTransform: 'none', 
                fontWeight: 600, 
                padding: '10px 24px',
                bgcolor: '#ef5350', 
                '&:hover': { bgcolor: '#dc2626' } 
            }}
              autoFocus
            >
              Log Out
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}

export default Teacher;