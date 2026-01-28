import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Box,
  Chip,
  Divider,
  Stack,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Zoom
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import CheckIcon from '@mui/icons-material/Check';
import SchoolIcon from '@mui/icons-material/School';

// --- Notifications ---
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useUserContext } from "../../../Context/UserContext";
import { ENDPOINTS } from "../../../SpringBoot/config";

// --- Constants ---
const TOAST_CONFIG = {
  position: "top-center",
  autoClose: 2000,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: false,
  draggable: true,
  theme: "colored",
  style: { borderRadius: '12px', fontSize: '0.9rem' }
};

export default function SubjectEnrollment() {
  // --- Context & State ---
  const {
    schoolId,
    currentAcademicYear,
    activeTermName,
    activeSectionName,
    teacher,
    getAuthHeaders
  } = useUserContext();

  const theme = useTheme();
  
  // Custom Breakpoints
  const isTiny = useMediaQuery("(max-width:325px)");
  const isMobile = useMediaQuery("(max-width:430px)");
  const isTablet = useMediaQuery("(max-width:770px)");
  const isDesktop = !isTablet;

  const [academicYear, setAcademicYear] = useState("");
  const [term, setTerm] = useState("");
  const [standard, setStandard] = useState("");
  const [section, setSection] = useState("");

  const [subjectName, setSubjectName] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [fetchedData, setFetchedData] = useState(null);

  // Editing state
  const [editIndex, setEditIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [tableDirty, setTableDirty] = useState(false);

  // UI State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState("");
  const [pendingIndex, setPendingIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subjectNameError, setSubjectNameError] = useState("");

  // Import State
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importSourceTerm, setImportSourceTerm] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [availableTerms, setAvailableTerms] = useState([]);

  // --- Initialization ---
  useEffect(() => {
    if (currentAcademicYear) setAcademicYear(currentAcademicYear);
    if (activeTermName) setTerm(activeTermName);
    if (activeSectionName) setSection(activeSectionName);
    if (teacher?.userDetails?.classInCharge) {
      setStandard(teacher.userDetails.classInCharge);
    }
  }, [currentAcademicYear, activeTermName, activeSectionName, teacher]);

  useEffect(() => {
    const fetchTerms = async () => {
      if (!schoolId || !academicYear) return;
      try {
        const response = await fetch(`${ENDPOINTS.teachers}/academicyear/terms/${academicYear}`, {
          method: "GET",
          headers: { ...getAuthHeaders(), "X-School-ID": schoolId },
        });
        if (response.ok) {
          const data = await response.json();
          setAvailableTerms(data);
        }
      } catch (error) {
        console.error("Failed to fetch terms list", error);
      }
    };
    fetchTerms();
  }, [schoolId, academicYear, getAuthHeaders]);

  // --- Validation & Handlers ---
  useEffect(() => {
    if (subjectName.trim() === "") {
      setSubjectNameError("");
    } else if (
      (fetchedData?.subjects?.includes(subjectName)) ||
      selectedSubjects.includes(subjectName)
    ) {
      setSubjectNameError("Subject already exists");
    } else {
      setSubjectNameError("");
    }
  }, [subjectName, selectedSubjects, fetchedData]);

  const handleAddSubject = useCallback(() => {
    if (subjectName.trim() === "" || subjectNameError) {
      toast.error(subjectNameError || "Please enter a subject name", TOAST_CONFIG);
      return;
    }
    setSelectedSubjects((prev) => [...prev, subjectName.trim()]);
    setSubjectName("");
    toast.info("Subject staged", TOAST_CONFIG);
  }, [subjectName, subjectNameError]);

  const handleFetchData = useCallback(async () => {
    if (!schoolId || !academicYear || !term || !standard) {
      toast.error("Missing Class/Term Details", TOAST_CONFIG);
      return;
    }

    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        schoolId, academicYear, term, standard, section: section || "",
      });

      const response = await fetch(`${ENDPOINTS.teacherams}/subjectenrollment/get?${queryParams}`, {
        method: "GET",
        headers: { ...getAuthHeaders(), "X-School-ID": schoolId },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.subjects) {
          setFetchedData({
            academicYear, term, standard, section,
            subjects: data.subjects,
          });
          setSelectedSubjects([]);
          toast.success("Subjects loaded successfully", TOAST_CONFIG);
        }
      } else {
        setFetchedData({ academicYear, term, standard, section, subjects: [] });
        if (response.status !== 404) toast.error("Failed to load subjects", TOAST_CONFIG);
      }
      setTableDirty(false);
    } catch (error) {
      toast.error("Network error", TOAST_CONFIG);
    } finally {
      setLoading(false);
    }
  }, [schoolId, academicYear, term, standard, section, getAuthHeaders]);

  // --- Import Logic ---
  const handleOpenImportDialog = () => {
    setImportSourceTerm("");
    setImportDialogOpen(true);
  };

  const handleImportFetch = async () => {
    if (!importSourceTerm || importSourceTerm === term) return;

    setImportLoading(true);
    try {
      const queryParams = new URLSearchParams({
        schoolId, academicYear, term: importSourceTerm, standard, section: section || "",
      });

      const response = await fetch(`${ENDPOINTS.teacherams}/subjectenrollment/get?${queryParams}`, {
        method: "GET",
        headers: { ...getAuthHeaders(), "X-School-ID": schoolId },
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.subjects?.length > 0) {
          const existingSubjects = fetchedData?.subjects || [];
          const stagedSubjects = selectedSubjects;
          const newSubjects = data.subjects.filter(sub =>
            !existingSubjects.includes(sub) && !stagedSubjects.includes(sub)
          );

          if (newSubjects.length > 0) {
            setSelectedSubjects(prev => [...prev, ...newSubjects]);
            toast.success(`Imported ${newSubjects.length} subjects`, TOAST_CONFIG);
            setImportDialogOpen(false);
          } else {
            toast.info("No new unique subjects found", TOAST_CONFIG);
          }
        } else {
          toast.warning("Source term has no subjects", TOAST_CONFIG);
        }
      }
    } catch (error) {
      toast.error("Import failed", TOAST_CONFIG);
    } finally {
      setImportLoading(false);
    }
  };

  const handleSaveSubjects = useCallback(async () => {
    if (!schoolId || selectedSubjects.length === 0) return;
    setLoading(true);
    try {
      const currentSubjects = fetchedData ? [...fetchedData.subjects] : [];
      const combinedSubjects = [...currentSubjects, ...selectedSubjects];

      const payload = {
        schoolId, academicYear, term, standard, section,
        subjects: combinedSubjects,
      };

      const url = fetchedData
        ? `${ENDPOINTS.teacherams}/subjectenrollment/update`
        : `${ENDPOINTS.teacherams}/subjectenrollment/save`;

      const method = fetchedData ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { ...getAuthHeaders(), "X-School-ID": schoolId },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed");

      toast.success("Saved successfully", TOAST_CONFIG);
      setFetchedData({ academicYear, term, standard, section, subjects: combinedSubjects });
      setSelectedSubjects([]);
      setTableDirty(false);
    } catch (error) {
      toast.error("Save failed", TOAST_CONFIG);
    } finally {
      setLoading(false);
    }
  }, [schoolId, academicYear, term, standard, section, selectedSubjects, fetchedData, getAuthHeaders]);

  // --- Edit/Delete Logic ---
  const handleEditStart = (idx) => {
    setDialogType("edit");
    setPendingIndex(idx);
    setDialogOpen(true);
  };

  const handleEditConfirmed = () => {
    setEditIndex(pendingIndex);
    setEditValue(fetchedData.subjects[pendingIndex]);
    setDialogOpen(false);
    setPendingIndex(null);
  };

  const handleEditSave = (idx) => {
    const newVal = editValue.trim();
    if (newVal === "" || (fetchedData.subjects.includes(newVal) && newVal !== fetchedData.subjects[idx])) {
      toast.error("Name invalid or already exists", TOAST_CONFIG);
      return;
    }
    const newSubjects = [...fetchedData.subjects];
    newSubjects[idx] = newVal;
    setFetchedData({ ...fetchedData, subjects: newSubjects });
    setEditIndex(null);
    setTableDirty(true);
  };

  const handleDeleteSubject = (idx) => {
    setDialogType("delete");
    setPendingIndex(idx);
    setDialogOpen(true);
  };

  const handleDeleteConfirmed = () => {
    const newSubjects = [...fetchedData.subjects];
    newSubjects.splice(pendingIndex, 1);
    setFetchedData({ ...fetchedData, subjects: newSubjects });
    setTableDirty(true);
    setDialogOpen(false);
    setPendingIndex(null);
  };

  const handleSaveTableChanges = async () => {
    if (!fetchedData) return;
    setLoading(true);
    try {
      const payload = { ...fetchedData, schoolId };
      const response = await fetch(`${ENDPOINTS.teacherams}/subjectenrollment/update`, {
        method: "PUT",
        headers: { ...getAuthHeaders(), "X-School-ID": schoolId },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Update failed");
      toast.success("Changes synced successfully", TOAST_CONFIG);
      setTableDirty(false);
    } catch (e) {
      toast.error("Update failed", TOAST_CONFIG);
    } finally {
      setLoading(false);
    }
  };

  // --- Excel Export Logic ---
  const handleDownloadExcel = () => {
    if (!fetchedData?.subjects?.length) return;
    
    const excelData = fetchedData.subjects.map((sub, i) => ({
      "S.No": i + 1,
      "Subject Name": sub,
      "Class": fetchedData.standard,
      "Section": fetchedData.section || "N/A", // <--- Added Section Here
      "Term": fetchedData.term
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Subjects");
    
    // Auto-width for columns
    const wscols = [{wch:6}, {wch:25}, {wch:10}, {wch:10}, {wch:15}];
    worksheet['!cols'] = wscols;

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), `Subjects_${fetchedData.standard}_${fetchedData.term}.xlsx`);
    toast.success("Excel downloaded", TOAST_CONFIG);
  };

  // --- Render Helpers ---

  const NativeHeader = () => (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        mb: 3,
        borderRadius: 4,
        background: isTablet
          ? "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" // Light gradient for mobile/tab
          : "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        border: "1px solid #e0e0e0",
        display: "flex",
        flexDirection: isTablet ? "column" : "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1
      }}
    >
        <Box sx={{ width: '100%' }}>
            {isTablet ? (
            // Mobile: Compact Header
            <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
                <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{academicYear}</Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#333' }}>
                            {standard}
                        </Typography>
                        {section && (
                            <Chip label={section} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#e3f2fd', color: '#1565c0' }} />
                        )}
                    </Stack>
                </Box>
                <Chip 
                    label={term} 
                    size="small" 
                    sx={{ 
                        bgcolor: '#333', 
                        color: '#fff', 
                        fontWeight: 600,
                        borderRadius: 2
                    }} 
                />
            </Stack>
            ) : (
            // Desktop: Expanded Header
            <Stack direction="row" spacing={4} divider={<Divider orientation="vertical" flexItem />}>
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>ACADEMIC YEAR</Typography>
                    <Typography variant="subtitle1" fontWeight={700}>{academicYear}</Typography>
                </Box>
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>TERM</Typography>
                    <Typography variant="subtitle1" fontWeight={700}>{term}</Typography>
                </Box>
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>CLASS</Typography>
                    <Typography variant="subtitle1" fontWeight={700}>{standard}</Typography>
                </Box>
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>SECTION</Typography>
                    <Typography variant="subtitle1" fontWeight={700}>{section || "N/A"}</Typography>
                </Box>
            </Stack>
            )}
        </Box>
    </Paper>
  );

  return (
    <Container
      maxWidth="lg"
      disableGutters={isTablet} // Full width on mobile
      sx={{
        mt: isTablet ? 1 : 4,
        mb: 10, // Space for sticky footer
        px: isTablet ? 2 : 3
      }}
    >
      <ToastContainer />

      <Box sx={{ maxWidth: 1000, mx: "auto" }}>
        
        <NativeHeader />

        <Card 
          elevation={0} 
          sx={{ 
            borderRadius: 4, 
            overflow: 'visible', // Allow elements to pop out if needed
            border: isDesktop ? '1px solid #e0e0e0' : 'none',
            bgcolor: 'background.paper'
          }}
        >
          <CardContent sx={{ p: isTablet ? 0 : 4 }}>

            {/* ACTION BAR */}
            <Stack direction="row" justifyContent="flex-end" spacing={1} mb={3} sx={{ px: isTablet ? 1 : 0 }}>
              <Button
                variant="text"
                onClick={handleOpenImportDialog}
                startIcon={<SystemUpdateAltIcon />}
                size="small"
                sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
              >
                Import
              </Button>

              {!fetchedData ? (
                <Button
                  variant="outlined"
                  onClick={handleFetchData}
                  startIcon={<RefreshIcon />}
                  size="small"
                  sx={{ borderRadius: 20, textTransform: 'none', px: 3, fontWeight: 600 }}
                >
                  Load Data
                </Button>
              ) : (
                 <Button 
                    variant="text"
                    onClick={handleDownloadExcel} 
                    startIcon={<DownloadIcon />}
                    size="small"
                    sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600, color: 'primary.main' }}
                 >
                    Export
                 </Button>
              )}
            </Stack>

            {/* INPUT SECTION */}
            <Paper 
                elevation={0} 
                sx={{ 
                    p: 2, 
                    mb: 4, 
                    bgcolor: '#fafafa', 
                    borderRadius: 3,
                    border: '1px dashed #bdbdbd'
                }}
            >
              <Typography variant="caption" sx={{ mb: 1, fontWeight: 700, color: 'text.secondary', display: 'block', letterSpacing: 0.5 }}>
                ADD NEW SUBJECT
              </Typography>
              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="E.g. Physics"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  error={!!subjectNameError}
                  helperText={subjectNameError}
                  sx={{
                    '& .MuiOutlinedInput-root': { 
                        borderRadius: 2, 
                        bgcolor: '#fff',
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddSubject}
                  disabled={!subjectName.trim()}
                  disableElevation
                  sx={{
                    minWidth: isTablet ? 60 : 100,
                    borderRadius: 2,
                    fontWeight: 700
                  }}
                >
                  <AddIcon />
                </Button>
              </Stack>

              {/* Staged Chips */}
              {selectedSubjects.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Stack direction="row" flexWrap="wrap" gap={1} mb={2}>
                    {selectedSubjects.map((sub, idx) => (
                      <Chip
                        key={idx}
                        label={sub}
                        onDelete={() => setSelectedSubjects(prev => prev.filter((_, i) => i !== idx))}
                        color="primary"
                        variant="outlined"
                        size="small"
                        sx={{ borderRadius: 1.5, fontWeight: 600, bgcolor: '#fff' }}
                      />
                    ))}
                  </Stack>
                  <Button
                    fullWidth={isTablet}
                    variant="contained"
                    color="success"
                    onClick={handleSaveSubjects}
                    disableElevation
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                  >
                    Save {selectedSubjects.length} New Subjects
                  </Button>
                </Box>
              )}
            </Paper>

            <Divider sx={{ my: 3, opacity: 0.5 }} />

            {/* DATA LIST */}
            <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} sx={{ px: isTablet ? 1 : 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                        Subject List
                    </Typography>
                    <Chip 
                        label={fetchedData?.subjects?.length || 0} 
                        size="small" 
                        sx={{ fontWeight: 700, bgcolor: '#eceff1', color: '#455a64' }} 
                    />
                </Stack>

                {fetchedData?.subjects?.length > 0 ? (
                    isDesktop ? (
                        // --- DESKTOP VIEW ---
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', borderRadius: 3 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f9fafb' }}>
                                        <TableCell width="10%" sx={{ fontWeight: 700, color: 'text.secondary' }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>SUBJECT NAME</TableCell>
                                        <TableCell align="right" width="20%" sx={{ fontWeight: 700, color: 'text.secondary' }}>ACTIONS</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {fetchedData.subjects.map((sub, idx) => (
                                        <TableRow key={idx} hover>
                                            <TableCell>{idx + 1}</TableCell>
                                            <TableCell>
                                                {editIndex === idx ? (
                                                    <TextField
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        size="small"
                                                        fullWidth
                                                        autoFocus
                                                        sx={{ '& .MuiInputBase-root': { fontSize: '0.875rem' } }}
                                                    />
                                                ) : <Typography variant="body2" fontWeight={500}>{sub}</Typography>}
                                            </TableCell>
                                            <TableCell align="right">
                                                {editIndex === idx ? (
                                                    <Stack direction="row" justifyContent="flex-end" spacing={1}>
                                                        <IconButton size="small" color="success" onClick={() => handleEditSave(idx)}><CheckIcon fontSize="small" /></IconButton>
                                                        <IconButton size="small" color="error" onClick={() => setEditIndex(null)}><CloseIcon fontSize="small" /></IconButton>
                                                    </Stack>
                                                ) : (
                                                    <Stack direction="row" justifyContent="flex-end">
                                                        <IconButton size="small" sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' } }} onClick={() => handleEditStart(idx)}><EditIcon fontSize="small" /></IconButton>
                                                        <IconButton size="small" sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }} onClick={() => handleDeleteSubject(idx)}><DeleteIcon fontSize="small" /></IconButton>
                                                    </Stack>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        // --- MOBILE VIEW (Clean Cards) ---
                        <Stack spacing={1.5}>
                            {fetchedData.subjects.map((sub, idx) => (
                                <Paper
                                    key={idx}
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        borderRadius: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        bgcolor: editIndex === idx ? '#e3f2fd' : '#fff',
                                        border: '1px solid',
                                        borderColor: editIndex === idx ? 'primary.main' : '#eee',
                                    }}
                                >
                                    {editIndex === idx ? (
                                        <Stack direction="row" spacing={1} width="100%" alignItems="center">
                                            <TextField
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                size="small"
                                                fullWidth
                                                autoFocus
                                                sx={{ bgcolor: '#fff' }}
                                            />
                                            <IconButton color="success" sx={{ bgcolor: '#fff', border: '1px solid #eee' }} onClick={() => handleEditSave(idx)}>
                                                <CheckIcon />
                                            </IconButton>
                                        </Stack>
                                    ) : (
                                        <>
                                            <Stack direction="row" spacing={2} alignItems="center">
                                                <Avatar 
                                                    sx={{ 
                                                        width: 32, height: 32, 
                                                        fontSize: '0.75rem', 
                                                        bgcolor: '#f5f5f5',
                                                        color: '#666',
                                                        fontWeight: 700
                                                    }}
                                                >
                                                    {idx + 1}
                                                </Avatar>
                                                <Typography variant="body1" fontWeight={600} color="text.primary">
                                                    {sub}
                                                </Typography>
                                            </Stack>
                                            <Box>
                                                <IconButton size="small" onClick={() => handleEditStart(idx)} sx={{ color: '#bdbdbd' }}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => handleDeleteSubject(idx)} sx={{ color: '#bdbdbd' }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </>
                                    )}
                                </Paper>
                            ))}
                        </Stack>
                    )
                ) : (
                    <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#f9fafb', borderRadius: 3, border: '1px dashed #e0e0e0' }}>
                        <Typography variant="body2" color="text.secondary">
                            No subjects found. Start by adding or importing.
                        </Typography>
                    </Box>
                )}
            </Box>

          </CardContent>
        </Card>
      </Box>

      {/* STICKY FOOTER FOR UPDATES */}
      {tableDirty && (
          <Zoom in={tableDirty}>
            <Box
                onClick={handleSaveTableChanges}
                sx={{ 
                    position: 'fixed', 
                    bottom: 24, 
                    left: 0, 
                    right: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    zIndex: 1000,
                    cursor: 'pointer'
                }}
            >
                <Paper 
                    elevation={4}
                    sx={{ 
                        borderRadius: 50,
                        px: 4, py: 1.5,
                        bgcolor: '#1976d2',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        boxShadow: '0 4px 20px rgba(25, 118, 210, 0.4)'
                    }}
                >
                    <Typography variant="button" sx={{ mr: 1.5, fontWeight: 700 }}>SYNC CHANGES</Typography>
                    {loading ? <CircularProgress size={18} color="inherit"/> : <SaveIcon fontSize="small" />}
                </Paper>
            </Box>
          </Zoom>
      )}

      {/* Confirmation Dialogs */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{dialogType === "edit" ? "Edit Subject" : "Remove Subject"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogType === "edit" ? "Update the subject name below." : "Are you sure you want to remove this subject?"}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: 2, color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
          <Button 
            onClick={dialogType === "edit" ? handleEditConfirmed : handleDeleteConfirmed} 
            color={dialogType === "edit" ? "primary" : "error"} 
            variant="contained" 
            disableElevation
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Import Subjects</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth>
                <InputLabel>Source Term</InputLabel>
                <Select
                value={importSourceTerm}
                label="Source Term"
                onChange={(e) => setImportSourceTerm(e.target.value)}
                sx={{ borderRadius: 2 }}
                >
                {availableTerms.filter(t => t.name !== term).map((t) => (
                    <MenuItem key={t.id || t.name} value={t.name}>{t.name}</MenuItem>
                ))}
                </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setImportDialogOpen(false)} sx={{ borderRadius: 2, color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleImportFetch} variant="contained" disableElevation disabled={!importSourceTerm || importLoading} sx={{ borderRadius: 2, fontWeight: 700 }}>
            {importLoading ? "Importing..." : "Import"}
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
}