import React, { useState } from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Snackbar,
  Alert,
} from "@mui/material";
import { Visibility, VisibilityOff, ArrowBack } from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../../../Context/UserContext";
import IMAGES from "../../Images/images";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#ffffff" },
    background: { default: "#000000", paper: "#121212" },
    text: { primary: "#ffffff", secondary: "#B0B0B0" },
  },
  typography: {
    fontFamily: "Roboto, sans-serif",
    h5: { fontWeight: 600 },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "#333333", borderRadius: "8px" },
            "&:hover fieldset": { borderColor: "#555555" },
            "&.Mui-focused fieldset": { borderColor: "#ffffff" },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          fontWeight: 600,
          textTransform: "none",
          padding: "10px 20px",
        },
        containedPrimary: {
          backgroundColor: "#ffffff",
          color: "#000000",
          "&:hover": { backgroundColor: "#e0e0e0" },
        },
      },
    },
    MuiIconButton: { styleOverrides: { root: { color: "#ffffff" } } },
  },
});

export default function StudentLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [schoolCode, setSchoolCode] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate();
  
  const { studentLogin } = useUserContext();
  
  const muiTheme = useTheme();
  const isDesktop = useMediaQuery(muiTheme.breakpoints.up("md"));

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const result = await studentLogin(schoolCode, userName, password);
      
      if (result.success) {
        navigate("/student-dashboard");
      } else {
        setError(result.error || "Login failed. Please try again.");
        setOpenSnackbar(true);
      }
    } catch (error) {
      setError(error.message || "An unexpected error occurred.");
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLanding = () => {
    navigate("/");
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <Grid container sx={{ height: "100vh" }}>
        {/* Image Section - Always on left side, only shown on desktop/laptop */}
        {isDesktop && (
          <Grid
            sx={{
              background: `url(${IMAGES.image1})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: "0 0 67.2%", // Fixed width for image section
            }}
          />
        )}

        {/* Login Form Section */}
        <Grid
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "black",
            flex: isDesktop ? "0 0 32.8%" : "1 1 100%", // Responsive width
            minHeight: "100vh",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 400, p: 3 }}>
            {loading && (
              <Box sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                bgcolor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
              }}>
                <CircularProgress color="inherit" />
              </Box>
            )}

            <Box component="form" onSubmit={handleLogin}>
              <Typography variant="h4" gutterBottom sx={{ color: "white", textAlign: "center" }}>
                Student Login
              </Typography>

              <TextField
                fullWidth
                label="School Code"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
                required
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="User Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 3 }}
              />

              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={loading}
                sx={{ mb: 2 }}
              >
                {loading ? "Logging In..." : "Log In"}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={handleBackToLanding}
                sx={{ color: "white", borderColor: "#4CAF50" }}
              >
                Back to Landing Page
              </Button>
            </Box>
          </Box>
        </Grid>

        {/* Error Snackbar */}
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </Grid>
    </ThemeProvider>
  );
}