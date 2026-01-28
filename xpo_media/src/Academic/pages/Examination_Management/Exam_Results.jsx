import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Container, Card, CardContent, Typography, FormControl, InputLabel,
  Select, MenuItem, Grid, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Box, Chip, Alert,
  InputAdornment, IconButton, Button, Accordion, AccordionSummary,
  AccordionDetails, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, LinearProgress, Snackbar
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getAcademicYears,
  getTermsForYear,
  getStandardsForYearTerm
} from "../../api/teacherAllotmentApi";

function pad(num) {
  return num != null && num !== "" ? num.toString().padStart(3, "0") : "---";
}

function StudentResult({ student }) {
  const subjects = student.subjects || [];
  const grandTotal = useMemo(() => subjects.reduce((sum, subj) => sum + (subj.total || 0), 0), [subjects]);
  const allPassed = useMemo(() => subjects.every(subj => subj.pass), [subjects]);

  return (
    <Accordion sx={{ mb: 2, borderRadius: 2, boxShadow: 2 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
          <PersonIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {student.studentName} ({student.studentID})
          </Typography>
          <Chip label={`Section: ${student.section}`} color="primary" variant="outlined" size="small" />
          <Box sx={{ flexGrow: 1 }} />
          <Chip label={`Total: ${grandTotal}`} color={allPassed ? "success" : "error"} sx={{ fontWeight: 700 }} />
          <Chip label={allPassed ? "PASS" : "FAIL"} color={allPassed ? "success" : "error"} sx={{ fontWeight: 700 }} />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <TableContainer component={Paper} sx={{ border: "2px solid #388e3c" }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#388e3c" }}>
                <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Subject</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Theory</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Theory Internal</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Practical</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Practical Internal</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Total</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Result</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subjects.map((subj, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ fontWeight: 700 }}>{subj.subject}</TableCell>
                  <TableCell>{pad(subj.theory)}</TableCell>
                  <TableCell>{pad(subj.internalTheory)}</TableCell>
                  <TableCell>{pad(subj.practical)}</TableCell>
                  <TableCell>{pad(subj.internalPractical)}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{pad(subj.total)}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: subj.pass ? "#388e3c" : "#d32f2f" }}>
                    {subj.pass ? "PASS" : "FAIL"}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>GRAND TOTAL</TableCell>
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell sx={{ fontWeight: 700 }}>{pad(grandTotal)}</TableCell>
                <TableCell sx={{ fontWeight: 700, color: allPassed ? "#388e3c" : "#d32f2f" }}>
                  {allPassed ? "PASS" : "FAIL"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </AccordionDetails>
    </Accordion>
  );
}

export default function Exam_Results() {
  const [academicYears, setAcademicYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [standards, setStandards] = useState([]);
  const [sections, setSections] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedStandard, setSelectedStandard] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedExamType, setSelectedExamType] = useState("");
  const [searchStudentId, setSearchStudentId] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);
  const [exportLoading, setExportLoading] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const fetchAcademicYears = useCallback(() => {
    setLoading(true);
    getAcademicYears()
      .then(setAcademicYears)
      .catch(() => {
        toast.error("Failed to load academic years");
        setAcademicYears([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAcademicYears();
  }, [fetchAcademicYears]);

  useEffect(() => {
    if (selectedYear) {
      setLoading(true);
      getTermsForYear(selectedYear)
        .then(setTerms)
        .catch(() => {
          toast.error("Failed to load terms");
          setTerms([]);
        })
        .finally(() => setLoading(false));
    } else {
      setTerms([]);
    }
    setSelectedTerm("");
    setStandards([]);
    setSelectedStandard("");
    setSections([]);
    setSelectedSection("");
    setExamTypes([]);
    setSelectedExamType("");
    setResults([]);
    setTotalStudents(0);
  }, [selectedYear]);

  useEffect(() => {
    if (selectedYear && selectedTerm) {
      setLoading(true);
      getStandardsForYearTerm(selectedYear, selectedTerm)
        .then(setStandards)
        .catch(() => {
          toast.error("Failed to load standards");
          setStandards([]);
        })
        .finally(() => setLoading(false));
    } else {
      setStandards([]);
    }
    setSelectedStandard("");
    setSections([]);
    setSelectedSection("");
    setExamTypes([]);
    setSelectedExamType("");
    setResults([]);
    setTotalStudents(0);
  }, [selectedYear, selectedTerm]);

  useEffect(() => {
    const fetchSectionsAndExams = async () => {
      if (selectedYear && selectedTerm && selectedStandard) {
        setLoading(true);
        try {
          const q = query(
            collection(db, "marksflat"),
            where("academicYear", "==", selectedYear),
            where("term", "==", selectedTerm),
            where("standard", "==", selectedStandard)
          );
          const snapshot = await getDocs(q);
          const uniqueSections = [...new Set(snapshot.docs.map(doc => doc.data().section))];
          const uniqueExamTypes = [...new Set(snapshot.docs.map(doc => doc.data().examType))];
          setSections(uniqueSections.filter(Boolean));
          setExamTypes(uniqueExamTypes.filter(Boolean));
        } catch {
          setSections([]);
          setExamTypes([]);
          toast.error("Failed to load sections and exam types");
        } finally {
          setLoading(false);
        }
      } else {
        setSections([]);
        setExamTypes([]);
      }
      setSelectedSection("");
      setSelectedExamType("");
      setResults([]);
      setTotalStudents(0);
    };
    fetchSectionsAndExams();
  }, [selectedYear, selectedTerm, selectedStandard]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!selectedYear || !selectedTerm || !selectedStandard || !selectedExamType) {
        setResults([]);
        setTotalStudents(0);
        return;
      }
      setLoading(true);
      try {
        let q = query(
          collection(db, "marksflat"),
          where("academicYear", "==", selectedYear),
          where("term", "==", selectedTerm),
          where("standard", "==", selectedStandard),
          where("examType", "==", selectedExamType)
        );
        if (selectedSection) {
          q = query(q, where("section", "==", selectedSection));
        }
        const snapshot = await getDocs(q);
        let fetchedResults = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        if (searchStudentId.trim()) {
          fetchedResults = fetchedResults.filter(result =>
            result.studentID?.toLowerCase().includes(searchStudentId.toLowerCase())
          );
        }
        setResults(fetchedResults);
        setTotalStudents(fetchedResults.length);
      } catch (error) {
        setResults([]);
        setTotalStudents(0);
        toast.error("Failed to load results: " + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [selectedYear, selectedTerm, selectedStandard, selectedSection, selectedExamType, searchStudentId]);

  const clearSearch = () => setSearchStudentId("");
  const clearAllFilters = () => {
    setClearDialogOpen(true);
  };

  const confirmClearFilters = () => {
    setSelectedYear("");
    setSelectedTerm("");
    setSelectedStandard("");
    setSelectedSection("");
    setSelectedExamType("");
    setSearchStudentId("");
    setClearDialogOpen(false);
    toast.info("Filters cleared");
  };

  const exportToExcel = () => {
    if (results.length === 0) {
      toast.warning("No data to export!");
      return;
    }
    setExportLoading(true);
    try {
      const excelData = [];
      results.forEach(student => {
        const subjects = student.subjects || [];
        excelData.push([
          "Student Name", student.studentName,
          "Student ID", student.studentID,
          "Section", student.section
        ]);
        excelData.push([
          "Subject", "Theory", "Theory Internal", "Practical", "Practical Internal", "Total", "Result"
        ]);
        subjects.forEach(subj => {
          excelData.push([
            subj.subject,
            subj.theory || "",
            subj.internalTheory || "",
            subj.practical || "",
            subj.internalPractical || "",
            subj.total || "",
            subj.pass ? "PASS" : "FAIL"
          ]);
        });
        const grandTotal = subjects.reduce((sum, subj) => sum + (subj.total || 0), 0);
        const allPassed = subjects.every(subj => subj.pass);
        excelData.push(["GRAND TOTAL", "", "", "", "", grandTotal, allPassed ? "PASS" : "FAIL"]);
        excelData.push([]);
      });
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Results");
      const filename = `${selectedExamType}_Results_${selectedStandard}_${selectedSection || 'All'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success("Excel file downloaded successfully!");
    } catch (error) {
      toast.error("Failed to export to Excel: " + error.message);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, color: "#1976d2", mb: 3, textAlign: "center" }}>
        <SchoolIcon sx={{ mr: 1, fontSize: 36 }} />
        Exam Results Portal
      </Typography>
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 4, mx: "auto", maxWidth: "1200px" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            🔍 Search & Filter Results
          </Typography>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600 }}>Filters</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={2}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Academic Year</InputLabel>
                    <Select
                      value={selectedYear}
                      label="Academic Year"
                      onChange={e => setSelectedYear(e.target.value)}
                      disabled={loading}
                      aria-label="Select academic year"
                    >
                      {academicYears.map(year => (
                        <MenuItem key={year.id || year} value={year.id || year}>
                          {year.id || year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Term</InputLabel>
                    <Select
                      value={selectedTerm}
                      label="Term"
                      onChange={e => setSelectedTerm(e.target.value)}
                      disabled={!terms.length || loading}
                      aria-label="Select term"
                    >
                      {terms.map(term => (
                        <MenuItem key={term} value={term}>{term}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Standard</InputLabel>
                    <Select
                      value={selectedStandard}
                      label="Standard"
                      onChange={e => setSelectedStandard(e.target.value)}
                      disabled={!standards.length || loading}
                      aria-label="Select standard"
                    >
                      {standards.map(std => (
                        <MenuItem key={std} value={std}>{std}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Section</InputLabel>
                    <Select
                      value={selectedSection}
                      label="Section"
                      onChange={e => setSelectedSection(e.target.value)}
                      disabled={!sections.length || loading}
                      aria-label="Select section"
                    >
                      <MenuItem value="">All Sections</MenuItem>
                      {sections.map(sec => (
                        <MenuItem key={sec} value={sec}>{sec}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Exam Type</InputLabel>
                    <Select
                      value={selectedExamType}
                      label="Exam Type"
                      onChange={e => setSelectedExamType(e.target.value)}
                      disabled={!examTypes.length || loading}
                      aria-label="Select exam type"
                    >
                      {examTypes.map(exam => (
                        <MenuItem key={exam} value={exam}>{exam}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Search Student ID"
                    value={searchStudentId}
                    onChange={e => setSearchStudentId(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                      endAdornment: searchStudentId && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={clearSearch} aria-label="Clear search">
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    disabled={loading}
                    aria-label="Search student ID"
                  />
                </Grid>
              </Grid>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                {results.length > 0 && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<FileDownloadIcon />}
                    onClick={exportToExcel}
                    disabled={exportLoading || loading}
                    sx={{ px: 2, py: 1, fontWeight: 700, borderRadius: 2 }}
                    aria-label="Download Excel"
                  >
                    {exportLoading ? "Exporting..." : "Download Excel"}
                  </Button>
                )}
                {selectedYear && <Chip label={`Year: ${selectedYear}`} variant="outlined" />}
                {selectedTerm && <Chip label={`Term: ${selectedTerm}`} variant="outlined" />}
                {selectedStandard && <Chip label={`Std: ${selectedStandard}`} variant="outlined" />}
                {selectedSection && <Chip label={`Sec: ${selectedSection}`} variant="outlined" />}
                {selectedExamType && <Chip label={`Exam: ${selectedExamType}`} variant="outlined" />}
                {searchStudentId && <Chip label={`Search: ${searchStudentId}`} variant="outlined" color="primary" />}
                {(selectedYear || selectedTerm || selectedStandard || selectedSection || selectedExamType || searchStudentId) && (
                  <Chip
                    label="Clear All"
                    variant="outlined"
                    color="error"
                    onClick={clearAllFilters}
                    sx={{ cursor: "pointer" }}
                  />
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>
      {!loading && results.length > 0 && (
        <Alert severity="success" sx={{ mb: 3, mx: "auto", maxWidth: "1200px" }}>
          📊 Found {totalStudents} student result(s) for {selectedExamType} in {selectedStandard} {selectedSection ? `- ${selectedSection}` : ''}
        </Alert>
      )}
      {!loading && selectedYear && selectedTerm && selectedStandard && selectedExamType && results.length === 0 && (
        <Alert severity="info" sx={{ mb: 3, mx: "auto", maxWidth: "1200px" }}>
          No results found for the selected criteria. Please check your filters.
        </Alert>
      )}
      {loading && (
        <Box sx={{ textAlign: "center", py: 4, mx: "auto", maxWidth: "1200px" }}>
          <CircularProgress />
          <Typography>Loading results...</Typography>
        </Box>
      )}
      {!loading && results.length > 0 && (
        <Box sx={{ mx: "auto", maxWidth: "1200px" }}>
          {results.map((student, index) => (
            <StudentResult key={student.id} student={student} />
          ))}
        </Box>
      )}
      <Dialog
        open={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        aria-labelledby="clear-dialog-title"
      >
        <DialogTitle id="clear-dialog-title" sx={{ fontWeight: 600 }}>
          Confirm Clear
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to clear all filters? This will reset your current selection.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmClearFilters} color="primary" variant="contained">
            Clear
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={exportLoading} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="info" sx={{ width: '100%' }}>
          Exporting data...
        </Alert>
      </Snackbar>
    </Container>
  );
}