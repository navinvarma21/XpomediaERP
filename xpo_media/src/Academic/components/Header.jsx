import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem, 
  useMediaQuery, 
  useTheme,
  Tooltip, 
  Avatar,
  ListItemIcon,
  Divider,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';
import { 
  Logout, 
  AccountCircle, 
  School,
  Badge as BadgeIcon,
  Class as ClassIcon
} from '@mui/icons-material';
import { useUserContext } from '../../Context/UserContext'; // Adjust path as needed
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { teacher, student, school, logout, userType } = useUserContext();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false); // State for Logout Dialog
  
  // Breakpoints
  const isDesktop = useMediaQuery('(min-width:770px)');
  const isTablet = useMediaQuery('(max-width:769px) and (min-width:451px)');
  const isMobile = useMediaQuery('(max-width:450px)');

  // --- MODERN STYLES ---
  const styles = {
    appBar: {
      background: 'rgba(15, 23, 42, 0.9)', 
      backdropFilter: 'blur(16px)',         
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.15)',
      transition: 'all 0.3s ease',
    },
    // The beautified dropdown menu
    menuPaper: {
      elevation: 0,
      sx: {
        overflow: 'visible',
        filter: 'drop-shadow(0px 10px 40px rgba(0,0,0,0.25))',
        mt: 1.5,
        borderRadius: '16px',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        // LOGIC: Desktop (Smallest) < Mobile (Compact Card) < Tablet (Wide Card)
        minWidth: isDesktop ? '160px' : isMobile ? '220px' : '280px', 
        bgcolor: '#ffffff',
        '&:before': {
          content: '""',
          display: 'block',
          position: 'absolute',
          top: 0,
          right: 20,
          width: 10,
          height: 10,
          bgcolor: isDesktop ? '#fff' : '#f8fafc',
          transform: 'translateY(-50%) rotate(45deg)',
          zIndex: 0,
          borderTop: '1px solid rgba(226, 232, 240, 0.8)',
          borderLeft: '1px solid rgba(226, 232, 240, 0.8)',
        },
      },
    },
    // Menu Header Gradient Area (Mobile/Tablet)
    menuHeader: {
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      padding: isMobile ? '16px' : '24px 20px', 
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: isMobile ? 1 : 1.5
    },
    // Beautiful Desktop Info Pill
    desktopInfoPill: {
      display: 'flex', 
      alignItems: 'center', 
      gap: 0, 
      bgcolor: 'rgba(30, 41, 59, 0.5)', 
      borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.1)',
      padding: '4px 8px 4px 16px',
      backdropFilter: 'blur(4px)',
      boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)'
    }
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // 1. Open Dialog
  const handleLogoutClick = () => {
    handleClose(); 
    setConfirmOpen(true); 
  };

  // 2. Confirm Action
  const handleConfirmLogout = () => {
    logout();
    setConfirmOpen(false);
  };

  // 3. Cancel Action
  const handleCancelLogout = () => {
    setConfirmOpen(false);
  };

  // --- HELPER FUNCTIONS ---
  const getDisplayName = () => {
    if (userType === 'teacher' && teacher) return teacher.name;
    if (userType === 'student' && student) return student.studentName || 'Student';
    return 'Guest';
  };

  const getUserDetails = () => {
    if (userType === 'teacher' && teacher) {
      return {
        idLabel: 'ID',
        idValue: teacher.userDetails?.staffId,
        extraLabel: 'Class',
        extraValue: teacher.userDetails?.classInCharge
      };
    } else if (userType === 'student' && student) {
      return {
        idLabel: 'ID',
        idValue: student.studentId,
        extraLabel: 'Class',
        extraValue: student.userDetails?.class,
        subExtra: student.userDetails?.admissionNo
      };
    }
    return {};
  };

  const details = getUserDetails();

  // --- RENDER MENU CONTENT ---
  // FIX: Wrapped content in a Box to avoid Fragment (<>...</>) error in MUI Menu
  const renderMenuContent = () => (
    <Box sx={{ outline: 'none' }}> 
      {/* LOGIC: Mobile/Tablet shows User Header. Desktop does not. */}
      {!isDesktop && (
        <>
          <Box sx={styles.menuHeader}>
            <Avatar 
              sx={{ 
                width: isMobile ? 48 : 64, 
                height: isMobile ? 48 : 64, 
                bgcolor: '#fff', 
                border: '1px solid #e2e8f0', 
                p: 0.5, 
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)' 
              }}
            >
              <img 
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${getDisplayName()}`} 
                alt="avatar" 
                style={{ width: '100%', borderRadius: '50%' }} 
              />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.2, fontSize: isMobile ? '0.95rem' : '1rem' }}>
                {getDisplayName()}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {userType}
              </Typography>
            </Box>
            
            {/* Mobile/Tablet Info Pills */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
              {details.idValue && (
                <Box sx={{ bgcolor: '#fff', border: '1px solid #cbd5e1', px: 1.5, py: 0.5, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700 }}>ID: {details.idValue}</Typography>
                </Box>
              )}
              {details.extraValue && (
                <Box sx={{ bgcolor: '#f0f9ff', border: '1px solid #bae6fd', px: 1.5, py: 0.5, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 700 }}>{details.extraValue}</Typography>
                </Box>
              )}
            </Box>
          </Box>
          <Divider />
        </>
      )}

      {/* Action Items */}
      <Box sx={{ p: 1 }}>
        <MenuItem 
          onClick={handleLogoutClick} 
          sx={{ 
            borderRadius: '12px', 
            color: '#ef4444', 
            py: 1.5,
            px: 2,
            gap: 1.5,
            '&:hover': { bgcolor: '#fef2f2' } 
          }}
        >
          <ListItemIcon sx={{ minWidth: 'auto' }}>
            <Logout fontSize="small" sx={{ color: '#ef4444' }} />
          </ListItemIcon>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Logout</Typography>
        </MenuItem>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar position="sticky" sx={styles.appBar}>
        <Toolbar
          sx={{
            justifyContent: 'space-between',
            paddingX: { xs: 1, sm: 2, md: 3 },
            minHeight: '3.75rem !important',
            height: '3.75rem',
            gap: 1,
          }}
        >
          {/* --- LEFT SECTION: LOGO & SCHOOL NAME --- */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', alignItems: 'center', minWidth: 0, overflow: 'hidden', mr: 1 
          }}>
            {/* Logo */}
            <Box sx={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '10px', 
              background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
              boxShadow: '0 0 15px rgba(14, 165, 233, 0.4)',
              flexShrink: 0,
              width: { xs: 30, sm: 36 }, 
              height: { xs: 30, sm: 36 },
              mr: { xs: 1, sm: 1.5 },
              '@media (max-width: 325px)': { width: 26, height: 26, mr: 0.5 }
            }}>
              <School sx={{ fontSize: { xs: 16, sm: 20 }, color: '#fff' }} />
            </Box>

            {/* School Name */}
            <Tooltip title={school?.schoolName || 'School Name'}>
              <Typography
                variant="h6"
                noWrap
                sx={{
                  color: '#f8fafc',
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  fontWeight: 700,
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                  '@media (max-width: 430px)': { fontSize: '0.75rem', fontWeight: 600 },
                  '@media (max-width: 380px)': { fontSize: '0.65rem', fontWeight: 500, letterSpacing: '-0.5px' },
                  '@media (max-width: 325px)': { fontSize: '0.55rem', fontWeight: 500, letterSpacing: '-0.5px' },
                }}
              >
                {school?.schoolName || 'School Name'}
              </Typography>
            </Tooltip>
          </Box>


          {/* --- RIGHT SECTION: USER INFO & MENU --- */}
          
          {/* 1. DESKTOP VIEW (> 770px) */}
          {isDesktop && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                
                {/* Desktop Info Pill */}
                <Box sx={styles.desktopInfoPill}>
                  {/* Name */}
                  <Box sx={{ pr: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#f1f5f9', letterSpacing: '0.2px' }}>
                        {getDisplayName()}
                      </Typography>
                  </Box>

                  {/* ID */}
                  {details.idValue && (
                    <>
                      <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.15)', height: 16, alignSelf: 'center' }} />
                      <Box sx={{ px: 2, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <BadgeIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                        <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 500, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {details.idValue}
                        </Typography>
                      </Box>
                    </>
                  )}

                  {/* Class */}
                  {details.extraValue && (
                    <>
                      <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.15)', height: 16, alignSelf: 'center' }} />
                      <Box sx={{ pl: 2, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <ClassIcon sx={{ fontSize: 16, color: '#38bdf8' }} />
                        <Typography variant="caption" sx={{ color: '#7dd3fc', fontWeight: 700 }}>
                          {details.extraValue}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>

                {/* Desktop Avatar Trigger - SMALLER SIZE */}
                <Tooltip title="Menu">
                  <IconButton 
                    onClick={handleMenu} 
                    sx={{ 
                      p: 0, 
                      border: '2px solid rgba(56, 189, 248, 0.3)',
                      transition: 'all 0.2s ease-in-out',
                      boxShadow: '0 0 10px rgba(56, 189, 248, 0.1)',
                      '&:hover': { 
                        border: '2px solid #38bdf8',
                        boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        bgcolor: '#38bdf8', 
                        fontSize: '0.85rem', 
                        fontWeight: 700, 
                        color: '#0f172a' 
                      }}
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${getDisplayName()}`}
                    >
                      {getDisplayName().charAt(0)}
                    </Avatar>
                  </IconButton>
                </Tooltip>
            </Box>
          )}

          {/* 2. TABLET VIEW */}
          {isTablet && (
            <Box 
              onClick={handleMenu}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                bgcolor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '30px',
                pl: 2, pr: 1, py: 0.5,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' }
              }}
            >
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.85rem' }}>
                  {getDisplayName()}
                </Typography>
                <Avatar sx={{ width: 30, height: 30, bgcolor: '#0ea5e9', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <AccountCircle fontSize="small" />
                </Avatar>
            </Box>
          )}

          {/* 3. MOBILE VIEW */}
          {isMobile && (
            <IconButton onClick={handleMenu} sx={{ color: '#fff' }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)' }}>
                <AccountCircle fontSize="small" />
              </Avatar>
            </IconButton>
          )}

          {/* --- DROPDOWN MENU --- */}
          <Menu
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
            TransitionComponent={Fade}
            PaperProps={styles.menuPaper}
          >
            {renderMenuContent()}
          </Menu>

        </Toolbar>
      </AppBar>

      {/* --- LOGOUT CONFIRMATION DIALOG --- */}
      <Dialog
        open={confirmOpen}
        onClose={handleCancelLogout}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            padding: '10px',
            minWidth: '300px'
          }
        }}
      >
        <DialogTitle id="alert-dialog-title" sx={{ fontWeight: 700, color: '#1e293b' }}>
          {"Confirm Logout?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description" sx={{ color: '#64748b' }}>
            Are you sure you want to log out of your account?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ padding: '0 16px 16px 16px' }}>
          <Button 
            onClick={handleCancelLogout} 
            sx={{ 
              color: '#64748b', 
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmLogout} 
            variant="contained" 
            autoFocus
            sx={{ 
              bgcolor: '#ef4444', 
              color: '#fff', 
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '8px',
              '&:hover': { bgcolor: '#dc2626' }
            }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}