import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Stack,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  Tooltip,
  Chip,
  Avatar,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import AccountCircle from "@mui/icons-material/AccountCircle";
import Logout from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import { useUserContext } from "../../Context/UserContext";

export default function StudentHeader({ onMenuToggle }) {
  const { student, school, currentAcademicYear, logout } = useUserContext();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const theme = useTheme();

  // Responsive breakpoints
  const isDesktop = useMediaQuery("(min-width:771px)");
  const isTablet = useMediaQuery("(max-width:770px)");
  const isMobile = useMediaQuery("(max-width:450px)");

  // Student data
  const studentName = student?.studentName || "Student Name";
  const classSection = student?.userDetails?.class || "Class N/A";
  const academicYear = currentAcademicYear || "2024–2025";
  const admissionNo = student?.userDetails?.admissionNo || "N/A";
  const studentAvatar = student?.avatarUrl || null;

  const handleProfileMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  // Profile menu items
  const getProfileMenuItems = () => {
    const menuItems = [];

    // Student info header for menu
    menuItems.push(
      <MenuItem
        key="student-info"
        disabled
        sx={{
          opacity: 1,
          flexDirection: "column",
          alignItems: "flex-start",
          minHeight: "auto",
          py: 2,
          pointerEvents: "none",
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 0.1)} 100%)`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, width: "100%" }}>
          <Avatar 
            sx={{ 
              width: 52, 
              height: 52, 
              bgcolor: theme.palette.primary.main,
              fontSize: '1.3rem',
              fontWeight: 600,
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
            src={studentAvatar}
          >
            {!studentAvatar && studentName.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}>
              {studentName}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", lineHeight: 1.4 }}>
              {classSection} • ID: {admissionNo}
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 500 }}>
              Academic Year: {academicYear}
            </Typography>
          </Box>
        </Box>
      </MenuItem>
    );

    menuItems.push(<Divider key="divider-1" />);

    // Additional details for menu
    if (isTablet || isMobile) {
      menuItems.push(
        <Box key="academic-details" sx={{ px: 2, py: 1.5 }}>
          <Stack spacing={1.5}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <SchoolIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
              <Typography variant="body2" color="text.primary" fontWeight={500}>
                Class: {classSection}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <AssignmentIndIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
              <Typography variant="body2" color="text.primary" fontWeight={500}>
                Admission No: {admissionNo}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <CalendarTodayIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
              <Typography variant="body2" color="text.primary" fontWeight={500}>
                Academic Year: {academicYear}
              </Typography>
            </Box>
          </Stack>
        </Box>
      );
      menuItems.push(<Divider key="divider-2" />);
    }

    // Logout menu item
    menuItems.push(
      <MenuItem
        key="logout"
        onClick={handleLogout}
        sx={{ 
          py: 1.5,
          mx: 1,
          mb: 0.5,
          borderRadius: 1,
          "&:hover": { 
            bgcolor: alpha(theme.palette.error.main, 0.08),
            color: theme.palette.error.dark
          }
        }}
      >
        <Logout sx={{ mr: 1.5, fontSize: "20px", color: theme.palette.error.main }} />
        <Typography variant="body2" fontWeight={600}>
          Logout
        </Typography>
      </MenuItem>
    );

    return menuItems;
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: theme.palette.background.paper,
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
        boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
        borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        backdropFilter: 'blur(8px)',
        minHeight: "auto",
        transition: 'all 0.3s ease',
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingX: { xs: 1.5, sm: 2.5, md: 3 },
          minHeight: '60px !important',
          gap: { xs: 1, sm: 2 },
          flexWrap: { xs: 'nowrap', sm: 'nowrap' },
        }}
      >
        {/* Left Section: Menu Button & School Name */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: { xs: 1, sm: 1.5 },
          flex: { xs: 1, sm: 1, md: 1 },
          minWidth: 0,
          overflow: 'hidden'
        }}>
          {/* Menu Toggle for Mobile/Tablet */}
          {onMenuToggle && (
            <IconButton
              onClick={onMenuToggle}
              sx={{
                display: { xs: 'flex', lg: 'none' },
                color: theme.palette.primary.main,
                flexShrink: 0,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {/* School Name - Always show full name with smaller mobile font */}
          <Tooltip title={school?.schoolName || "School Name"} placement="bottom-start">
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 750,
                fontSize: { 
                  xs: "0.55rem",     // Mobile: even smaller font (13px)
                  sm: "1rem",       // Tablet: medium font  
                  md: "1.3rem"      // Desktop/Laptop: larger font
                },
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                flex: 1,
                minWidth: 0,
                lineHeight: 1.2,
                letterSpacing: { xs: -0.2, sm: 0 },
                textShadow: `0 2px 4px ${alpha(theme.palette.primary.main, 0.1)}`,
                maxWidth: 'none',
                width: 'auto'
              }}
            >
              {school?.schoolName || "School Name"}
            </Typography>
          </Tooltip>
        </Box>

        {/* Center Section: Student Details */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: { xs: 0.75, sm: 1.25 },
          flexShrink: 0,
          flexWrap: 'nowrap',
          overflow: 'hidden'
        }}>
          {/* Student Name - Always visible with responsive sizing */}
          <Typography
            variant="body1"
            sx={{
              fontWeight: 700,
              fontSize: {
                xs: "0.75rem",    // Smaller on mobile
                sm: "0.85rem",    // Medium on tablet
                md: "0.95rem"     // Larger on desktop
              },
              color: theme.palette.text.primary,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: {
                xs: "70px",       // Limited on mobile
                sm: "110px",      // More space on tablet
                md: "140px"       // Full on desktop
              },
              background: `linear-gradient(45deg, ${theme.palette.text.primary} 30%, ${theme.palette.text.secondary} 90%)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {studentName}
          </Typography>

          {/* Class - Visible on Desktop & Tablet */}
          {(isDesktop || isTablet) && (
            <Chip
              icon={<SchoolIcon sx={{ fontSize: '14px !important' }} />}
              label={classSection}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '0.65rem', sm: '0.7rem' },
                height: '26px',
                display: { xs: 'none', sm: 'flex' },
                border: `1.5px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                }
              }}
            />
          )}

          {/* Admission No - Visible only on Desktop */}
          {isDesktop && (
            <Chip
              icon={<AssignmentIndIcon sx={{ fontSize: '14px !important' }} />}
              label={`ID: ${admissionNo}`}
              size="small"
              variant="outlined"
              sx={{ 
                fontWeight: 600,
                fontSize: '0.7rem',
                height: '26px',
                border: `1.5px solid ${alpha(theme.palette.grey[500], 0.3)}`,
                '&:hover': {
                  borderColor: theme.palette.grey[700],
                  backgroundColor: alpha(theme.palette.grey[500], 0.04),
                }
              }}
            />
          )}

          {/* Academic Year - Visible only on Desktop */}
          {isDesktop && (
            <Chip
              icon={<CalendarTodayIcon sx={{ fontSize: '14px !important' }} />}
              label={academicYear}
              size="small"
              variant="outlined"
              color="secondary"
              sx={{ 
                fontWeight: 600,
                fontSize: '0.7rem',
                height: '26px',
                border: `1.5px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                '&:hover': {
                  borderColor: theme.palette.secondary.main,
                  backgroundColor: alpha(theme.palette.secondary.main, 0.04),
                }
              }}
            />
          )}
        </Box>

        {/* Right Section: Account Menu */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          flexShrink: 0,
          ml: { xs: 0.5, sm: 1 }
        }}>
          <Tooltip title="Account menu" placement="bottom">
            <IconButton
              onClick={handleProfileMenu}
              sx={{
                color: theme.palette.primary.main,
                padding: { xs: "6px", sm: "7px" },
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                border: `1.5px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  borderColor: theme.palette.primary.main,
                  transform: 'scale(1.08)',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                },
                transition: 'all 0.3s ease',
              }}
              aria-label="account menu"
            >
              <AccountCircle fontSize={isMobile ? "medium" : "large"} />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.15)}`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            borderRadius: 3,
            minWidth: 300,
            overflow: 'visible',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -8,
              right: 14,
              width: 16,
              height: 16,
              backgroundColor: theme.palette.background.paper,
              transform: 'rotate(45deg)',
              borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              borderLeft: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }
          },
        }}
      >
        {getProfileMenuItems()}
      </Menu>
    </AppBar>
  );
}