import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Paper,
  IconButton,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useTheme,
  CircularProgress,
  Divider,
  useMediaQuery,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Stack,
  CardActions
} from "@mui/material";
import {
  AddCircle,
  RemoveCircle,
  Delete,
  Save,
  Refresh,
  CheckCircle,
  RadioButtonUnchecked,
  Edit,
  Close,
  FileDownload,
  CalendarMonth,
  EventAvailable
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUserContext } from "../../../Context/UserContext";
import { ENDPOINTS } from "../../../SpringBoot/config";

// --- Styles ---
const getStyles = (theme) => ({
  paper: {
    p: { xs: 2, sm: 3 },
    mb: 3,
    borderRadius: 3,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    background: "#fff",
  },
  header: {
    fontWeight: 700,
    color: theme.palette.primary.main,
    mb: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 1
  },
  tableHeader: {
    backgroundColor: theme.palette.primary.main,
    "& .MuiTableCell-root": { color: "#fff", fontWeight: "bold" },
  },
  // Mobile specific card style for list items
  mobileCard: {
    mb: 2,
    borderRadius: 2,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    border: `1px solid ${theme.palette.divider}`
  }
});

// --- Utility Functions (Kept same as original) ---
const detectTermPattern = (termNames) => {
  if (termNames.length === 0) return 'term';
  const patterns = {
    ordinal: /^(1st|2nd|3rd|[4-9]th|\d+(?:st|nd|rd|th))\s+(Term|Semester|Quarter)/i,
    simple: /^(Term|Semester|Quarter)\s+\d+$/i,
    numberOnly: /^\d+$/
  };
  for (let termName of termNames) {
    if (patterns.ordinal.test(termName)) return 'ordinal';
    if (patterns.simple.test(termName)) return 'simple';
    if (patterns.numberOnly.test(termName)) return 'numberOnly';
  }
  return 'term';
};

const generateNextTermName = (existingTerms, pattern) => {
  const existingNames = existingTerms.map(t => t.name);
  if (pattern === 'ordinal') {
    const ordinalNumbers = existingNames.map(name => {
      const match = name.match(/^(\d+)(?:st|nd|rd|th)/i);
      return match ? parseInt(match[1]) : 0;
    }).filter(num => num > 0);
    const nextNumber = ordinalNumbers.length > 0 ? Math.max(...ordinalNumbers) + 1 : 1;
    return `${nextNumber}${getOrdinalSuffix(nextNumber)} Term`;
  }
  if (pattern === 'simple') {
    const numbers = existingNames.map(name => {
      const match = name.match(/(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    }).filter(num => num > 0);
    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    const prefixMatch = existingNames[0]?.match(/^(Term|Semester|Quarter)/i);
    const prefix = prefixMatch ? prefixMatch[1] : 'Term';
    return `${prefix} ${nextNumber}`;
  }
  if (pattern === 'numberOnly') {
    const numbers = existingNames.map(name => parseInt(name)).filter(num => !isNaN(num));
    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    return nextNumber.toString();
  }
  const numbers = existingNames.map(name => {
    const match = name.match(/Term\s+(\d+)$/i);
    return match ? parseInt(match[1]) : 0;
  }).filter(num => num > 0);
  const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `Term ${nextNumber}`;
};

const getOrdinalSuffix = (number) => {
  if (number % 100 >= 11 && number % 100 <= 13) return 'th';
  switch (number % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

export default function Academic_year_setup() {
  const theme = useTheme();
  const styles = getStyles(theme);
  const { schoolId } = useUserContext();

  // Mobile detection
  const isMobile = useMediaQuery('(max-width:600px)'); // Increased slightly to catch large phones
  const isTablet = useMediaQuery('(max-width:900px)');

  const [loading, setLoading] = useState({
    init: false,
    fetch: false,
    save: false,
    active: false,
  });

  const [allYears, setAllYears] = useState([]);
  const [termsList, setTermsList] = useState([]);

  // Active Settings Section
  const [activeSession, setActiveSession] = useState({
    year: "",
    termId: "",
    termName: "",
    sectionId: "",
    sectionName: ""
  });
  const [isEditingActive, setIsEditingActive] = useState(false);
  const [tempActiveYear, setTempActiveYear] = useState("");
  const [tempActiveTermId, setTempActiveTermId] = useState("");
  const [tempActiveSectionId, setTempActiveSectionId] = useState("");

  const [fetchedTermsForActiveSelect, setFetchedTermsForActiveSelect] = useState([]);
  const [fetchedSectionsForActiveSelect, setFetchedSectionsForActiveSelect] = useState([]);

  // Create Section
  const [createYear, setCreateYear] = useState("");
  const [newTerms, setNewTerms] = useState([{ name: "Term 1", start: null, end: null }]);
  const [existingTermsForCreate, setExistingTermsForCreate] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState('simple');
  const [showPatternSuggestions, setShowPatternSuggestions] = useState(false);

  // Manage Section
  const [manageYear, setManageYear] = useState("");
  const [editTermDialog, setEditTermDialog] = useState({ open: false, term: null });

  // --- API Helpers (Unchanged) ---
  const apiCall = async (url, method = "GET", body = null) => {
    const options = {
      method,
      headers: { "Content-Type": "application/json", "X-School-ID": schoolId },
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${ENDPOINTS.teachers}/academicyear${url}`, options);
    if (!res.ok) throw new Error(await res.text());
    return method === "GET" ? res.json() : res.text();
  };

  const fetchTermsForDropdown = async (year) => {
    if(!year) return;
    try {
      const terms = await apiCall(`/terms/${year}`);
      setFetchedTermsForActiveSelect(terms);
    } catch(e) {
      console.error(e);
      setFetchedTermsForActiveSelect([]);
    }
  };

  const fetchSectionsForDropdown = async (year) => {
    if(!year) return;
    try {
      const sections = await apiCall(`/sections/${year}`);
      setFetchedSectionsForActiveSelect(sections);
    } catch(e) {
      console.error(e);
      setFetchedSectionsForActiveSelect([]);
    }
  };

  // --- Initialization (Unchanged) ---
  const initData = useCallback(async () => {
    if (!schoolId) return;
    setLoading((p) => ({ ...p, init: true }));
    try {
      await apiCall("/init-tables", "POST");
      const years = await apiCall("/all");
      setAllYears(years);

      const activeInfo = await apiCall("/active-info");
      if (activeInfo && activeInfo.activeYear) {
        sessionStorage.setItem("activeAcademicYear", activeInfo.activeYear);
        sessionStorage.setItem("activeTermName", activeInfo.activeTermName || "");

        if (activeInfo.activeSectionId) {
            sessionStorage.setItem("activeSectionName", activeInfo.activeSectionName || "");
        } else {
            sessionStorage.removeItem("activeSectionName");
        }

        setActiveSession({
          year: activeInfo.activeYear || "",
          termId: activeInfo.activeTermId || "",
          termName: activeInfo.activeTermName || "",
          sectionId: activeInfo.activeSectionId || "",
          sectionName: activeInfo.activeSectionName || ""
        });
        setTempActiveYear(activeInfo.activeYear || "");
        setTempActiveTermId(activeInfo.activeTermId || "");
        setTempActiveSectionId(activeInfo.activeSectionId || "");

        await Promise.all([
            fetchTermsForDropdown(activeInfo.activeYear),
            fetchSectionsForDropdown(activeInfo.activeYear)
        ]);
      }
    } catch (err) {
      toast.error("Initialization failed: " + err.message);
    } finally {
      setLoading((p) => ({ ...p, init: false }));
    }
  }, [schoolId]);

  useEffect(() => { initData(); }, [initData]);

  // --- Handlers (Unchanged) ---
  const handleActiveYearChange = (year) => {
    setTempActiveYear(year);
    setTempActiveTermId("");
    setTempActiveSectionId("");
    fetchTermsForDropdown(year);
    fetchSectionsForDropdown(year);
  };

  const saveActiveSettings = async () => {
    if (!tempActiveYear || !tempActiveTermId) return toast.warn("Select year and term");

    setLoading(p => ({...p, active: true}));
    try {
      const sectionIdToSend = tempActiveSectionId === "" ? null : tempActiveSectionId;

      await apiCall("/set-active", "POST", {
          year: tempActiveYear,
          termId: tempActiveTermId,
          sectionId: sectionIdToSend
      });

      const selectedTerm = fetchedTermsForActiveSelect.find(t => t.id === tempActiveTermId);
      const selectedSection = fetchedSectionsForActiveSelect.find(s => s.id === tempActiveSectionId);

      sessionStorage.setItem("activeAcademicYear", tempActiveYear);
      sessionStorage.setItem("activeTermName", selectedTerm ? selectedTerm.name : "");

      if (tempActiveSectionId) {
          sessionStorage.setItem("activeSectionName", selectedSection ? selectedSection.section : "");
      } else {
          sessionStorage.removeItem("activeSectionName");
      }

      toast.success("Active Academic Year, Term & Section Updated!");

      setActiveSession({
        year: tempActiveYear,
        termId: tempActiveTermId,
        termName: selectedTerm ? selectedTerm.name : "",
        sectionId: tempActiveSectionId,
        sectionName: selectedSection ? selectedSection.section : ""
      });
      setIsEditingActive(false);
      if(manageYear === tempActiveYear) fetchTermsForTable(manageYear);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(p => ({...p, active: false}));
    }
  };

  const fetchExistingTermsForCreate = async (year) => {
    if (!year) {
      setExistingTermsForCreate([]);
      return;
    }
    try {
      const terms = await apiCall(`/terms/${year}`);
      setExistingTermsForCreate(terms);

      if (terms.length > 0) {
        const detectedPattern = detectTermPattern(terms.map(t => t.name));
        setSelectedPattern(detectedPattern);
        const nextTermName = generateNextTermName(terms, detectedPattern);
        setNewTerms([{ name: nextTermName, start: null, end: null }]);
        setShowPatternSuggestions(false);
      } else {
        setNewTerms([{ name: "Term 1", start: null, end: null }]);
        setSelectedPattern('simple');
        setShowPatternSuggestions(true);
      }
    } catch (e) {
      setExistingTermsForCreate([]);
      setNewTerms([{ name: "Term 1", start: null, end: null }]);
      setSelectedPattern('simple');
      setShowPatternSuggestions(true);
    }
  };

  const handleCreateYearChange = (year) => {
    setCreateYear(year);
    fetchExistingTermsForCreate(year);
  };

  const handleClearCreateYear = () => {
    setCreateYear("");
    setExistingTermsForCreate([]);
    setNewTerms([{ name: "Term 1", start: null, end: null }]);
    setShowPatternSuggestions(false);
  };

  const handleClearManageYear = () => {
    setManageYear("");
    setTermsList([]);
  };

  const handleExportExcel = () => {
    if (termsList.length === 0) {
      toast.warn("No data to export");
      return;
    }
    const excelData = termsList.map((term) => ({
      "Academic Year": term.academicYear,
      "Term Name": term.name,
      "Start Date": formatDate(term.start),
      "End Date": formatDate(term.end),
      "Status": term.currentActive ? "Active" : "Inactive"
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Academic Terms");
    XLSX.writeFile(workbook, `Academic_Terms_${manageYear || 'All'}.xlsx`);
  };

  const handlePatternChange = (pattern) => {
    setSelectedPattern(pattern);
    if (pattern === 'ordinal') {
      const nextNumber = existingTermsForCreate.length + 1;
      setNewTerms([{ name: `${nextNumber}${getOrdinalSuffix(nextNumber)} Term`, start: null, end: null }]);
    } else if (pattern === 'simple') {
      const nextNumber = existingTermsForCreate.length + 1;
      setNewTerms([{ name: `Term ${nextNumber}`, start: null, end: null }]);
    } else if (pattern === 'semester') {
      const nextNumber = existingTermsForCreate.length + 1;
      setNewTerms([{ name: `Semester ${nextNumber}`, start: null, end: null }]);
    } else if (pattern === 'quarter') {
      const nextNumber = Math.min(existingTermsForCreate.length + 1, 4);
      setNewTerms([{ name: `Quarter ${nextNumber}`, start: null, end: null }]);
    } else if (pattern === 'custom') {
      setNewTerms([{ name: "", start: null, end: null }]);
    }
  };

  const handleAddTermRow = () => {
    if (selectedPattern === 'custom') {
      setNewTerms([...newTerms, { name: "", start: null, end: null }]);
      return;
    }
    const totalTerms = existingTermsForCreate.length + newTerms.length;
    let nextTermName;
    if (selectedPattern === 'ordinal') {
      const nextNumber = totalTerms + 1;
      nextTermName = `${nextNumber}${getOrdinalSuffix(nextNumber)} Term`;
    } else if (selectedPattern === 'semester') {
      const nextNumber = totalTerms + 1;
      nextTermName = `Semester ${nextNumber}`;
    } else if (selectedPattern === 'quarter') {
      const nextNumber = Math.min(totalTerms + 1, 4);
      nextTermName = `Quarter ${nextNumber}`;
    } else {
      const nextNumber = totalTerms + 1;
      nextTermName = `Term ${nextNumber}`;
    }
    setNewTerms([...newTerms, { name: nextTermName, start: null, end: null }]);
  };

  const handleRemoveTermRow = (idx) => {
    setNewTerms(newTerms.filter((_, i) => i !== idx));
  };

  const handleTermChange = (idx, field, val) => {
    const updated = [...newTerms];
    updated[idx][field] = val;
    setNewTerms(updated);
  };

  const handleCreateTerms = async () => {
    if (!createYear) return toast.warn("Select an Academic Year");
    for (let t of newTerms) {
      if (!t.name?.trim()) return toast.warn("All term names are required");
      if (!t.start || !t.end) return toast.warn("All start and end dates are required");
      if (t.start > t.end) return toast.warn("End date must be after start date");
      const duplicateCount = newTerms.filter(term => term.name === t.name).length;
      if (duplicateCount > 1) return toast.warn(`Duplicate term name: ${t.name}`);
      const existingTerm = existingTermsForCreate.find(term => term.name === t.name);
      if (existingTerm) return toast.warn(`Term name "${t.name}" already exists for this year`);
    }

    setLoading(p => ({...p, save: true}));
    try {
      const payload = {
        academicYear: createYear,
        terms: newTerms.map(t => ({
          name: t.name.trim(),
          start: t.start.toISOString().split('T')[0],
          end: t.end.toISOString().split('T')[0]
        }))
      };
      await apiCall("/terms", "POST", payload);
      toast.success("Terms created successfully");
      setNewTerms([{ name: "Term 1", start: null, end: null }]);
      setCreateYear("");
      setExistingTermsForCreate([]);
      setShowPatternSuggestions(false);
      if(manageYear === createYear) fetchTermsForTable(createYear);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(p => ({...p, save: false}));
    }
  };

  const fetchTermsForTable = async (year) => {
    setLoading(p => ({...p, fetch: true}));
    try {
      const data = await apiCall(`/terms/${year}`);
      setTermsList(data);
    } catch(err) {
      setTermsList([]);
      toast.info("No terms found");
    } finally {
      setLoading(p => ({...p, fetch: false}));
    }
  };

  const handleDeleteTerm = async (id) => {
    if(!window.confirm("Are you sure?")) return;
    try {
      await apiCall(`/terms/${id}`, "DELETE");
      toast.success("Term deleted");
      fetchTermsForTable(manageYear);
    } catch(err) {
      toast.error(err.message);
    }
  };

  const handleEditTerm = (term) => {
    setEditTermDialog({ open: true, term: { ...term } });
  };

  const handleUpdateTerm = async () => {
    if (!editTermDialog.term) return;
    try {
      await apiCall(`/terms/${editTermDialog.term.id}`, "PUT", {
        name: editTermDialog.term.name,
        start: editTermDialog.term.start,
        end: editTermDialog.term.end
      });
      toast.success("Term updated successfully");
      setEditTermDialog({ open: false, term: null });
      fetchTermsForTable(manageYear);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return format(new Date(dateStr), "dd/MM/yyyy");
  };

  const hasSections = fetchedSectionsForActiveSelect.length > 0;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {/* Reduced margins on mobile for full-width feel */}
      <Container maxWidth="md" sx={{ mt: isMobile ? 2 : 4, mb: 4, px: isMobile ? 1 : 2 }}>
        <ToastContainer position="top-right" autoClose={3000} />

        {/* --- Section 1: Active Settings --- */}
        <Paper sx={styles.paper}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={styles.header}>
              <CheckCircle />
              <Typography variant="h6">Active Settings</Typography>
            </Box>
            {activeSession.year ? (
              <Button
                variant={isMobile ? "text" : "outlined"}
                startIcon={<Edit />}
                onClick={() => setIsEditingActive(!isEditingActive)}
              >
                {isEditingActive ? "Cancel" : "Edit"}
              </Button>
            ) : null}
          </Box>

          {activeSession.year ? (
            <>
              {/* Mobile-friendly Alert display */}
              <Alert
                severity="info"
                sx={{ mb: 3, alignItems: 'center' }}
                icon={<CheckCircle fontSize="inherit" />}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Active Session:</Typography>
                <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 0.5 : 2, mt: 0.5 }}>
                  <Typography variant="body2">Year: <strong>{activeSession.year}</strong></Typography>
                  <Typography variant="body2">Term: <strong>{activeSession.termName}</strong></Typography>
                  {activeSession.sectionName && (
                    <Typography variant="body2">Section: <strong>{activeSession.sectionName}</strong></Typography>
                  )}
                </Box>
              </Alert>

              {isEditingActive && (
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Set Active Year</InputLabel>
                      <Select
                        value={tempActiveYear}
                        label="Set Active Year"
                        onChange={(e) => handleActiveYearChange(e.target.value)}
                      >
                        {allYears.map((y) => (
                          <MenuItem key={y.yearId} value={y.year}>{y.year}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small" disabled={!tempActiveYear}>
                      <InputLabel>Set Active Term</InputLabel>
                      <Select
                        value={tempActiveTermId}
                        label="Set Active Term"
                        onChange={(e) => setTempActiveTermId(e.target.value)}
                      >
                        {fetchedTermsForActiveSelect.map((t) => (
                          <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small" disabled={!tempActiveYear || !hasSections}>
                      <InputLabel>{hasSections ? "Set Active Section" : "No Sections"}</InputLabel>
                      <Select
                        value={tempActiveSectionId}
                        label={hasSections ? "Set Active Section" : "No Sections"}
                        onChange={(e) => setTempActiveSectionId(e.target.value)}
                      >
                        <MenuItem value=""><em>None</em></MenuItem>
                        {fetchedSectionsForActiveSelect.map((s) => (
                          <MenuItem key={s.id} value={s.id}>{s.section}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      fullWidth
                      size={isMobile ? "large" : "medium"} // Larger touch target
                      onClick={saveActiveSettings}
                      disabled={loading.active || !tempActiveYear || !tempActiveTermId}
                    >
                      {loading.active ? "Saving..." : "Save Active Settings"}
                    </Button>
                  </Grid>
                </Grid>
              )}
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                No active academic year set
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddCircle />}
                onClick={() => setIsEditingActive(true)}
                fullWidth={isMobile}
              >
                Set Active Year
              </Button>
              {isEditingActive && ( /* ... Duplicate Select Block kept for brevity, same logic as above ... */
                 <Grid container spacing={2} alignItems="center" sx={{ mt: 2 }}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Academic Year</InputLabel>
                      <Select value={tempActiveYear} label="Academic Year" onChange={(e) => handleActiveYearChange(e.target.value)}>
                        {allYears.map((y) => <MenuItem key={y.yearId} value={y.year}>{y.year}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small" disabled={!tempActiveYear}>
                      <InputLabel>Term</InputLabel>
                      <Select value={tempActiveTermId} label="Term" onChange={(e) => setTempActiveTermId(e.target.value)}>
                        {fetchedTermsForActiveSelect.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small" disabled={!tempActiveYear || !hasSections}>
                      <InputLabel>Section</InputLabel>
                      <Select value={tempActiveSectionId} label="Section" onChange={(e) => setTempActiveSectionId(e.target.value)}>
                         <MenuItem value=""><em>None</em></MenuItem>
                        {fetchedSectionsForActiveSelect.map((s) => <MenuItem key={s.id} value={s.id}>{s.section}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Button variant="contained" fullWidth size="large" onClick={saveActiveSettings} disabled={loading.active || !tempActiveYear || !tempActiveTermId}>
                      {loading.active ? "Setting..." : "Set Active"}
                    </Button>
                  </Grid>
                </Grid>
              )}
            </Box>
          )}
        </Paper>

        {/* --- Section 2: Create Terms --- */}
        <Paper sx={styles.paper}>
          <Box sx={styles.header}>
            <AddCircle />
            <Typography variant="h6">Create Terms</Typography>
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }} alignItems="center">
            <Grid item xs={12} sm={8}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Academic Year</InputLabel>
                <Select
                  value={createYear}
                  label="Select Academic Year"
                  onChange={(e) => handleCreateYearChange(e.target.value)}
                >
                  {allYears.map((y) => (
                    <MenuItem key={y.yearId} value={y.year}>{y.year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
               {createYear && (
                 <Button
                   variant={isMobile ? "outlined" : "text"}
                   color="error"
                   startIcon={<Close />}
                   onClick={handleClearCreateYear}
                   fullWidth
                   size="small"
                 >
                   Clear Selection
                 </Button>
               )}
            </Grid>
          </Grid>

          {existingTermsForCreate.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>Existing:</strong> {existingTermsForCreate.map(t => t.name).join(', ')}
            </Alert>
          )}

          {showPatternSuggestions && existingTermsForCreate.length === 0 && (
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Naming Pattern</InputLabel>
              <Select
                value={selectedPattern}
                label="Naming Pattern"
                onChange={(e) => handlePatternChange(e.target.value)}
              >
                <MenuItem value="simple">Term 1, Term 2...</MenuItem>
                <MenuItem value="ordinal">1st Term, 2nd Term...</MenuItem>
                <MenuItem value="semester">Semester 1, Semester 2...</MenuItem>
                <MenuItem value="quarter">Quarter 1, Quarter 2...</MenuItem>
                <MenuItem value="custom">Custom names</MenuItem>
              </Select>
            </FormControl>
          )}

          <Divider sx={{ my: 2 }}><Typography variant="caption" color="text.secondary">NEW TERMS ENTRY</Typography></Divider>

          {newTerms.map((term, idx) => (
            // Mobile: Wrap each entry in a Box/Card to separate them visually
            <Box key={idx} sx={isMobile ? styles.mobileCard : { mb: 2 }}>
               {isMobile && <Box sx={{ p: 1, bgcolor: theme.palette.grey[100], borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary">ENTRY #{idx + 1}</Typography>
               </Box>}

               <Grid container spacing={2} sx={isMobile ? { p: 2 } : {}} alignItems="center">
                 <Grid item xs={12} sm={4}>
                   <TextField
                     label="Term Name"
                     size="small"
                     fullWidth
                     value={term.name}
                     onChange={(e) => handleTermChange(idx, 'name', e.target.value)}
                   />
                 </Grid>
                 <Grid item xs={6} sm={3}>
                   <DatePicker
                     label="Start Date"
                     format="dd/MM/yyyy"
                     value={term.start}
                     onChange={(d) => handleTermChange(idx, 'start', d)}
                     slotProps={{ textField: { size: 'small', fullWidth: true } }}
                   />
                 </Grid>
                 <Grid item xs={6} sm={3}>
                   <DatePicker
                     label="End Date"
                     format="dd/MM/yyyy"
                     value={term.end}
                     onChange={(d) => handleTermChange(idx, 'end', d)}
                     slotProps={{ textField: { size: 'small', fullWidth: true } }}
                   />
                 </Grid>
                 <Grid item xs={12} sm={2} sx={{ display: 'flex', justifyContent: isMobile ? 'space-between' : 'flex-end', gap: 1 }}>
                    {newTerms.length > 1 && (
                      <Button
                        color="error"
                        variant={isMobile ? "outlined" : "text"}
                        onClick={() => handleRemoveTermRow(idx)}
                        startIcon={<RemoveCircle />}
                        fullWidth={isMobile}
                      >
                         {isMobile ? "Remove" : ""}
                      </Button>
                    )}
                    {/* Add button logic for last item */}
                    {(idx === newTerms.length - 1 && selectedPattern !== 'quarter') ||
                     (idx === newTerms.length - 1 && selectedPattern === 'quarter' && newTerms.length < 4) ? (
                        <Button
                          color="primary"
                          variant={isMobile ? "contained" : "text"}
                          onClick={handleAddTermRow}
                          startIcon={<AddCircle />}
                          fullWidth={isMobile}
                        >
                           {isMobile ? "Add Another" : ""}
                        </Button>
                    ) : null}
                 </Grid>
               </Grid>
            </Box>
          ))}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleCreateTerms}
              disabled={loading.save || !createYear}
              fullWidth={isMobile} // Full width button on mobile
              size={isMobile ? "large" : "medium"}
            >
              {loading.save ? "Creating..." : "Create Terms"}
            </Button>
          </Box>
        </Paper>

        {/* --- Section 3: Manage Terms --- */}
        <Paper sx={styles.paper}>
          <Box sx={styles.header}>
            <EventAvailable />
            <Typography variant="h6">Manage Terms</Typography>
          </Box>

          <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Year to Manage</InputLabel>
                <Select
                  value={manageYear}
                  label="Select Year to Manage"
                  onChange={(e) => {
                    setManageYear(e.target.value);
                    fetchTermsForTable(e.target.value);
                  }}
                >
                  {allYears.map((y) => (
                    <MenuItem key={y.yearId} value={y.year}>{y.year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
               <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
                 {manageYear && (
                   <Button variant="text" color="error" startIcon={<Close />} onClick={handleClearManageYear}>
                     Clear
                   </Button>
                 )}
                 {termsList.length > 0 && !isMobile && (
                    <Button variant="outlined" color="success" startIcon={<FileDownload />} onClick={handleExportExcel}>
                      Excel
                    </Button>
                 )}
               </Box>
            </Grid>
          </Grid>

          {/* Conditional Rendering: Card List for Mobile, Table for Desktop */}
          {loading.fetch ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : termsList.length === 0 ? (
            <Typography align="center" color="text.secondary" sx={{ py: 2 }}>No terms found for selected year.</Typography>
          ) : isMobile ? (
            // --- Mobile View (Cards) ---
            <Stack spacing={2}>
              {termsList.map((row) => (
                <Card key={row.id} variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ pb: 1 }}>
                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" component="div" color="primary">
                          {row.name}
                        </Typography>
                        {row.currentActive ? (
                          <Chip label="Active" color="success" size="small" icon={<CheckCircle />} />
                        ) : (
                          <Chip label="Inactive" size="small" variant="outlined" />
                        )}
                     </Box>
                     <Divider sx={{ mb: 1 }} />
                     <Grid container spacing={1}>
                        <Grid item xs={6}>
                           <Typography variant="caption" color="text.secondary">Start Date</Typography>
                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CalendarMonth fontSize="inherit" color="action" />
                              <Typography variant="body2">{formatDate(row.start)}</Typography>
                           </Box>
                        </Grid>
                        <Grid item xs={6}>
                           <Typography variant="caption" color="text.secondary">End Date</Typography>
                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CalendarMonth fontSize="inherit" color="action" />
                              <Typography variant="body2">{formatDate(row.end)}</Typography>
                           </Box>
                        </Grid>
                     </Grid>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', bgcolor: theme.palette.grey[50], p: 1 }}>
                     <Button size="small" startIcon={<Edit />} onClick={() => handleEditTerm(row)}>
                       Edit
                     </Button>
                     <Button size="small" color="error" startIcon={<Delete />} onClick={() => handleDeleteTerm(row.id)}>
                       Delete
                     </Button>
                  </CardActions>
                </Card>
              ))}
            </Stack>
          ) : (
            // --- Desktop View (Table) ---
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={styles.tableHeader}>
                  <TableRow>
                    <TableCell>Term Name</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {termsList.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{formatDate(row.start)}</TableCell>
                      <TableCell>{formatDate(row.end)}</TableCell>
                      <TableCell>
                        {row.currentActive ? (
                          <Chip label="Active" color="success" size="small" icon={<CheckCircle />} />
                        ) : (
                          <Chip label="Inactive" size="small" variant="outlined" icon={<RadioButtonUnchecked />} />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="primary" onClick={() => handleEditTerm(row)} sx={{ mr: 1 }}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteTerm(row.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Edit Term Dialog (Standard Dialog is fine for mobile) */}
        <Dialog
          open={editTermDialog.open}
          onClose={() => setEditTermDialog({ open: false, term: null })}
          fullWidth
          maxWidth="xs" // Better for mobile
        >
          <DialogTitle>Edit Term</DialogTitle>
          <DialogContent>
            {editTermDialog.term && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                 <TextField
                   label="Term Name"
                   fullWidth
                   value={editTermDialog.term.name}
                   onChange={(e) => setEditTermDialog(prev => ({
                     ...prev,
                     term: { ...prev.term, name: e.target.value }
                   }))}
                 />
                 <DatePicker
                   label="Start Date"
                   format="dd/MM/yyyy"
                   value={editTermDialog.term.start ? new Date(editTermDialog.term.start) : null}
                   onChange={(date) => setEditTermDialog(prev => ({
                     ...prev,
                     term: { ...prev.term, start: date }
                   }))}
                   slotProps={{ textField: { fullWidth: true } }}
                 />
                 <DatePicker
                   label="End Date"
                   format="dd/MM/yyyy"
                   value={editTermDialog.term.end ? new Date(editTermDialog.term.end) : null}
                   onChange={(date) => setEditTermDialog(prev => ({
                     ...prev,
                     term: { ...prev.term, end: date }
                   }))}
                   slotProps={{ textField: { fullWidth: true } }}
                 />
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditTermDialog({ open: false, term: null })}>Cancel</Button>
            <Button onClick={handleUpdateTerm} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>

      </Container>
    </LocalizationProvider>
  );
}