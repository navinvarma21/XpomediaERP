import React, { useEffect, useState, useCallback } from "react";
import {
  Container, Card, CardContent, Typography, Box, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Stack,
  Divider, FormControl, InputLabel, Select, MenuItem, Grid, Button,
  CircularProgress, Fade, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, InputAdornment, Switch, FormControlLabel,
  Collapse, IconButton, LinearProgress,
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SchoolIcon from "@mui/icons-material/School";
import EventNoteIcon from "@mui/icons-material/EventNote";
import FilterListIcon from "@mui/icons-material/FilterList";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RoomIcon from "@mui/icons-material/Room";
import DateRangeIcon from "@mui/icons-material/DateRange";
import InfoIcon from "@mui/icons-material/Info";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import SaveIcon from "@mui/icons-material/Save";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";

const generateExamDocId = (academicYear, term, standard, examType) =>
  `${academicYear.replace(/\s+/g, "")}_${term.replace(/\s+/g, "_")}_${standard}_${examType.replace(/\s+/g, "_")}`;

export default function Exam_Schedule_View() {
  const [allExams, setAllExams] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [standards, setStandards] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedStandard, setSelectedStandard] = useState("");
  const [selectedExamType, setSelectedExamType] = useState("");
  const [filteredExams, setFilteredExams] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [showInternal, setShowInternal] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [lastFetched, setLastFetched] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "createdExamFlat"),
      (snapshot) => {
        setLoading(true);
        try {
          const exams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAllExams(exams);
          setAcademicYears([...new Set(exams.map(e => e.academicYear))].filter(Boolean));
          setTerms([...new Set(exams.map(e => e.term))].filter(Boolean));
          setStandards([...new Set(exams.map(e => e.standard))].filter(Boolean));
          setExamTypes([...new Set(exams.map(e => e.examType))].filter(Boolean));
          setLastFetched(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
        } catch (err) {
          toast.error("Failed to load exams", { position: "top-center", theme: "colored" });
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        toast.error("Error fetching exams: " + err.message, { position: "top-center", theme: "colored" });
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const filterExams = useCallback(() => {
    let filtered = allExams;
    if (selectedYear) filtered = filtered.filter(exam => exam.academicYear === selectedYear);
    if (selectedTerm) filtered = filtered.filter(exam => exam.term === selectedTerm);
    if (selectedStandard) filtered = filtered.filter(exam => exam.standard === selectedStandard);
    if (selectedExamType) filtered = filtered.filter(exam => exam.examType === selectedExamType);

    const groupMap = {};
    filtered.forEach(exam => {
      const key = [exam.academicYear, exam.term, exam.standard, exam.examType].join("||");
      if (!groupMap[key]) {
        groupMap[key] = {
          academicYear: exam.academicYear,
          term: exam.term,
          standard: exam.standard,
          examType: exam.examType,
          schedules: [],
          examIds: []
        };
      }
      groupMap[key].schedules.push(...(exam.schedules || []));
      groupMap[key].examIds.push(exam.id);
    });
    let grouped = Object.values(groupMap);

    if (searchQuery) {
      grouped = grouped.map(exam => ({
        ...exam,
        schedules: exam.schedules.filter(sch =>
          sch.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sch.examCategory.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(exam => exam.schedules.length > 0);
    }

    setFilteredExams(grouped);
  }, [allExams, selectedYear, selectedTerm, selectedStandard, selectedExamType, searchQuery]);

  useEffect(() => {
    filterExams();
  }, [filterExams]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr) => timeStr || "-";

  const clearAllFilters = () => {
    setResetDialogOpen(true);
  };

  const confirmClearFilters = () => {
    setSelectedYear("");
    setSelectedTerm("");
    setSelectedStandard("");
    setSelectedExamType("");
    setSearchQuery("");
    setResetDialogOpen(false);
    toast.info("Filters cleared", { position: "top-center", theme: "colored" });
  };

  const handleSaveFilteredExams = async () => {
    setSaveDialogOpen(false);
    setLoading(true);
    try {
      for (const exam of filteredExams) {
        const docId = generateExamDocId(
          exam.academicYear,
          exam.term,
          exam.standard,
          exam.examType
        );
        await setDoc(doc(db, "examFlat", docId), {
          academicYear: exam.academicYear,
          term: exam.term,
          standard: exam.standard,
          examType: exam.examType,
          schedules: exam.schedules,
          createdAt: new Date().toISOString()
        });
      }
      toast.success("Exams saved successfully!", { position: "top-center", theme: "colored" });
    } catch (err) {
      toast.error("Error saving exams: " + err.message, { position: "top-center", theme: "colored" });
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      const data = [];
      filteredExams.forEach(exam => {
        exam.schedules.forEach(sch => {
          if (showInternal || !sch.examCategory?.toLowerCase().includes("internal")) {
            data.push({
              AcademicYear: exam.academicYear || "-",
              Term: exam.term || "-",
              Standard: exam.standard || "-",
              ExamType: exam.examType || "-",
              Subject: sch.subject || "-",
              Category: sch.examCategory || "-",
              MaxMark: sch.maximumMark || "-",
              PassMark: sch.passMark || "-",
              ExamDate: formatDate(sch.examDate),
              StartTime: formatTime(sch.startTime),
              EndTime: formatTime(sch.endTime),
              RoomNo: sch.roomNo || "TBA",
              Instructions: sch.instructions || "No instructions"
            });
          }
        });
      });

      if (data.length === 0) {
        toast.warn("No data to export", { position: "top-center", theme: "colored" });
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Exam Schedules");

      XLSX.writeFile(workbook, `exam_schedules_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Excel file downloaded successfully!", { position: "top-center", theme: "colored" });
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Error exporting to Excel: " + err.message, { position: "top-center", theme: "colored" });
    } finally {
      setExportLoading(false);
    }
  };

  const getExportDataCount = () => {
    let count = 0;
    filteredExams.forEach(exam => {
      count += exam.schedules.filter(sch => showInternal || !sch.examCategory?.toLowerCase().includes("internal")).length;
    });
    return count;
  };

  return (
    <Container
      maxWidth="xl"
      sx={{
        mt: 4,
        mb: 4,
        py: 4,
        background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
        fontFamily: "'Roboto', sans-serif",
      }}
    >
      <ToastContainer position="top-center" autoClose={3000} theme="colored" />
      <Fade in={true} timeout={600}>
        <Box sx={{ maxWidth: 1400, mx: "auto" }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 900, color: "#1a237e", mb: 2, textAlign: "center" }}
          >
            <AssignmentIcon sx={{ mr: 2, fontSize: 42, verticalAlign: "middle", color: "#1565c0" }} />
            Exam Schedule Dashboard
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "#37474f", mb: 4, textAlign: "center", fontWeight: 500, fontSize: "1.1rem" }}
          >
            Seamlessly manage and export exam schedules with advanced filtering
          </Typography>

          {lastFetched && (
            <Typography
              variant="caption"
              sx={{ color: "#546e7a", mb: 3, display: "block", textAlign: "center" }}
              aria-live="polite"
            >
              Last updated: {lastFetched}
            </Typography>
          )}

          <Card
            sx={{
              mb: 4,
              borderRadius: 4,
              boxShadow: "0 12px 24px rgba(0, 0, 0, 0.12)",
              bgcolor: "linear-gradient(145deg, #ffffff, #e3f2fd)",
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  mb: 3,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <FilterListIcon color="primary" sx={{ fontSize: 30 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#1565c0" }}>
                    Filter Schedules
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  aria-label={filtersOpen ? "Collapse filters" : "Expand filters"}
                  sx={{ color: "#1565c0" }}
                >
                  {filtersOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              <Collapse in={filtersOpen}>
                {loading && (
                  <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                    <CircularProgress size={32} sx={{ color: "#1565c0" }} />
                  </Box>
                )}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small" disabled={loading}>
                      <InputLabel id="academic-year-label">Academic Year</InputLabel>
                      <Select
                        labelId="academic-year-label"
                        value={selectedYear}
                        label="Academic Year"
                        onChange={e => setSelectedYear(e.target.value)}
                        aria-label="Select academic year"
                        sx={{ bgcolor: "#f5f5f5", borderRadius: 2 }}
                      >
                        <MenuItem value="">All Years</MenuItem>
                        {academicYears.map(year => (
                          <MenuItem key={year} value={year}>{year}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small" disabled={loading}>
                      <InputLabel id="term-label">Term</InputLabel>
                      <Select
                        labelId="term-label"
                        value={selectedTerm}
                        label="Term"
                        onChange={e => setSelectedTerm(e.target.value)}
                        aria-label="Select term"
                        sx={{ bgcolor: "#f5f5f5", borderRadius: 2 }}
                      >
                        <MenuItem value="">All Terms</MenuItem>
                        {terms.map(term => (
                          <MenuItem key={term} value={term}>{term}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small" disabled={loading}>
                      <InputLabel id="standard-label">Standard</InputLabel>
                      <Select
                        labelId="standard-label"
                        value={selectedStandard}
                        label="Standard"
                        onChange={e => setSelectedStandard(e.target.value)}
                        aria-label="Select standard"
                        sx={{ bgcolor: "#f5f5f5", borderRadius: 2 }}
                      >
                        <MenuItem value="">All Standards</MenuItem>
                        {standards.map(std => (
                          <MenuItem key={std} value={std}>{std}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small" disabled={loading}>
                      <InputLabel id="exam-type-label">Exam Type</InputLabel>
                      <Select
                        labelId="exam-type-label"
                        value={selectedExamType}
                        label="Exam Type"
                        onChange={e => setSelectedExamType(e.target.value)}
                        aria-label="Select exam type"
                        sx={{ bgcolor: "#f5f5f5", borderRadius: 2 }}
                      >
                        <MenuItem value="">All Exam Types</MenuItem>
                        {examTypes.map(type => (
                          <MenuItem key={type} value={type}>
                            {type.replace(/_/g, " ")}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", mb: 3 }}>
                  <TextField
                    size="small"
                    placeholder="Search by subject or category..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    sx={{ flex: 1, minWidth: { xs: 200, sm: 300 }, bgcolor: "#f5f5f5", borderRadius: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    aria-label="Search exam schedules"
                    disabled={loading}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showInternal}
                        onChange={e => setShowInternal(e.target.checked)}
                        disabled={loading}
                        color="primary"
                      />
                    }
                    label="Show Internal Exams"
                    sx={{ mr: 2, fontWeight: 500 }}
                  />
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
                  {selectedYear && (
                    <Chip
                      label={`Year: ${selectedYear}`}
                      onDelete={() => setSelectedYear("")}
                      color="primary"
                      variant="outlined"
                      sx={{ borderRadius: 2, fontWeight: 500 }}
                    />
                  )}
                  {selectedTerm && (
                    <Chip
                      label={`Term: ${selectedTerm}`}
                      onDelete={() => setSelectedTerm("")}
                      color="primary"
                      variant="outlined"
                      sx={{ borderRadius: 2, fontWeight: 500 }}
                    />
                  )}
                  {selectedStandard && (
                    <Chip
                      label={`Std: ${selectedStandard}`}
                      onDelete={() => setSelectedStandard("")}
                      color="primary"
                      variant="outlined"
                      sx={{ borderRadius: 2, fontWeight: 500 }}
                    />
                  )}
                  {selectedExamType && (
                    <Chip
                      label={`Exam: ${selectedExamType.replace(/_/g, " ")}`}
                      onDelete={() => setSelectedExamType("")}
                      color="primary"
                      variant="outlined"
                      sx={{ borderRadius: 2, fontWeight: 500 }}
                    />
                  )}
                  {(selectedYear || selectedTerm || selectedStandard || selectedExamType || searchQuery) && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="medium"
                      onClick={clearAllFilters}
                      disabled={loading}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 600,
                        px: 4,
                        py: 1.5,
                        borderWidth: 2,
                        "&:hover": { bgcolor: "#ffebee", borderWidth: 2 },
                      }}
                      aria-label="Clear all filters"
                    >
                      Clear Filters
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<SaveIcon />}
                    onClick={() => setSaveDialogOpen(true)}
                    disabled={loading || filteredExams.length === 0}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 600,
                      px: 4,
                      py: 1.5,
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                      "&:hover": { transform: "scale(1.05)", boxShadow: "0 6px 16px rgba(0, 0, 0, 0.3)" },
                    }}
                    aria-label="Save filtered exams"
                  >
                    Save Exams
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportExcel}
                    disabled={loading || exportLoading || filteredExams.length === 0}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 600,
                      px: 4,
                      py: 1.5,
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                      "&:hover": { transform: "scale(1.05)", boxShadow: "0 6px 16px rgba(0, 0, 0, 0.3)" },
                      position: "relative",
                    }}
                    aria-label="Download as Excel"
                  >
                    {exportLoading ? (
                      <LinearProgress
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 4,
                          bgcolor: "transparent",
                        }}
                      />
                    ) : (
                      "Download Excel"
                    )}
                  </Button>
                </Box>
              </Collapse>
            </CardContent>
          </Card>

          {filteredExams.length > 0 && (
            <Card sx={{ mb: 3, bgcolor: "#e8f5e9", borderLeft: "5px solid #43a047", borderRadius: 3, p: 2 }}>
              <CardContent>
                <Typography variant="body1" sx={{ fontWeight: 600, color: "#2e7d32" }} aria-live="polite">
                  📊 Found {filteredExams.length} exam schedule(s) with {getExportDataCount()} total entries
                </Typography>
                <Typography variant="body2" sx={{ color: "#388e3c", mt: 1 }}>
                  Filters applied: {[
                    selectedYear && `Year: ${selectedYear}`,
                    selectedTerm && `Term: ${selectedTerm}`,
                    selectedStandard && `Standard: ${selectedStandard}`,
                    selectedExamType && `Exam Type: ${selectedExamType.replace(/_/g, " ")}`,
                    searchQuery && `Search: ${searchQuery}`
                  ].filter(Boolean).join(" | ") || "None"}
                </Typography>
              </CardContent>
            </Card>
          )}
          {filteredExams.length === 0 && allExams.length > 0 && !loading && (
            <Card sx={{ mb: 3, bgcolor: "#fff8e1", borderLeft: "5px solid #fb8c00", borderRadius: 3, p: 2 }}>
              <CardContent>
                <Typography variant="body1" sx={{ color: "#ef6c00" }} aria-live="polite">
                  🔍 No schedules match your filters. Try adjusting your selections or search query.
                </Typography>
              </CardContent>
            </Card>
          )}
          {allExams.length === 0 && !loading && (
            <Card sx={{ mb: 3, bgcolor: "#ffebee", borderLeft: "5px solid #e53935", borderRadius: 3, p: 2 }}>
              <CardContent>
                <Typography variant="body1" sx={{ color: "#d32f2f", textAlign: "center" }} aria-live="polite">
                  📝 No exams have been created yet. Create exams first to view them here.
                </Typography>
              </CardContent>
            </Card>
          )}

          <Stack spacing={3}>
            {filteredExams.map((exam, idx) => (
              <Fade in={true} timeout={400 * (idx + 1)} key={idx}>
                <Card
                  sx={{
                    borderRadius: 4,
                    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
                    border: "2px solid #1565c0",
                    bgcolor: "#f5f6fa",
                    "&:hover": { transform: "scale(1.02)", boxShadow: "0 12px 24px rgba(0, 0, 0, 0.15)" },
                  }}
                >
                  <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
                      <SchoolIcon color="primary" sx={{ fontSize: 36 }} />
                      <Typography variant="h5" sx={{ fontWeight: 700, color: "#1a237e" }}>
                        Standard {exam.standard} - {exam.examType?.replace(/_/g, " ")}
                      </Typography>
                      <Chip
                        label={exam.academicYear}
                        color="primary"
                        size="large"
                        sx={{ fontWeight: 600, borderRadius: 2 }}
                      />
                      <Chip
                        label={exam.term}
                        color="success"
                        size="large"
                        sx={{ fontWeight: 600, borderRadius: 2 }}
                      />
                    </Box>
                    <Divider sx={{ my: 3, bgcolor: "#e0e0e0" }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#1565c0" }}>
                      📋 Exam Schedule (
                      {exam.schedules?.filter(sch => showInternal || !sch.examCategory?.toLowerCase().includes("internal")).length || 0} entries)
                    </Typography>
                    <TableContainer
                      component={Paper}
                      sx={{
                        borderRadius: 3,
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                        overflowX: "auto",
                        maxHeight: 400,
                        bgcolor: "#ffffff",
                      }}
                    >
                      <Table aria-label={`Exam schedule for ${exam.standard} ${exam.examType}`}>
                        <TableHead sx={{ position: "sticky", top: 0, zIndex: 1, bgcolor: "#1565c0" }}>
                          <TableRow>
                            <TableCell sx={{ color: "#fff", fontWeight: 700, fontSize: 16, minWidth: 160 }}>
                              Subject
                            </TableCell>
                            <TableCell sx={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>
                              Category
                            </TableCell>
                            <TableCell sx={{ color: "#fff", fontWeight: 700, fontSize: 16 }} align="center">
                              Max Mark
                            </TableCell>
                            <TableCell sx={{ color: "#fff", fontWeight: 700, fontSize: 16 }} align="center">
                              Pass Mark
                            </TableCell>
                            <TableCell sx={{ color: "#fff", fontWeight: 700, fontSize: 16, minWidth: 120 }}>
                              Exam Date
                            </TableCell>
                            <TableCell sx={{ color: "#fff", fontWeight: 700, fontSize: 16, minWidth: 100 }}>
                              Start Time
                            </TableCell>
                            <TableCell sx={{ color: "#fff", fontWeight: 700, fontSize: 16, minWidth: 100 }}>
                              End Time
                            </TableCell>
                            <TableCell sx={{ color: "#fff", fontWeight: 700, fontSize: 16, minWidth: 120 }}>
                              Room No
                            </TableCell>
                            <TableCell sx={{ color: "#fff", fontWeight: 700, fontSize: 16, minWidth: 200 }}>
                              Instructions
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {exam.schedules
                            ?.filter(sch => showInternal || !sch.examCategory?.toLowerCase().includes("internal"))
                            .map((sch, sidx) => (
                              <TableRow
                                key={sidx}
                                sx={{ "&:nth-of-type(even)": { bgcolor: "#f5f5f5" }, "&:hover": { bgcolor: "#e3f2fd" } }}
                              >
                                <TableCell sx={{ fontWeight: 600, color: "#1a237e", fontSize: 15 }}>
                                  {sch.subject}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={sch.examCategory}
                                    color={
                                      sch.examCategory.includes("Internal")
                                        ? "warning"
                                        : sch.examCategory === "Theory"
                                        ? "primary"
                                        : "success"
                                    }
                                    size="small"
                                    sx={{ fontWeight: 500 }}
                                  />
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>
                                  {sch.maximumMark || "-"}
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>
                                  {sch.passMark || "-"}
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <DateRangeIcon color="action" fontSize="small" />
                                    <Typography variant="body2">
                                      {formatDate(sch.examDate)}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <AccessTimeIcon color="action" fontSize="small" />
                                    <Typography variant="body2">
                                      {formatTime(sch.startTime)}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <AccessTimeIcon color="action" fontSize="small" />
                                    <Typography variant="body2">
                                      {formatTime(sch.endTime)}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <RoomIcon color="action" fontSize="small" />
                                    <Typography variant="body2">
                                      {sch.roomNo || "TBA"}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <InfoIcon color="action" fontSize="small" />
                                    <Typography variant="body2">
                                      {sch.instructions || "No instructions"}
                                    </Typography>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Box sx={{ mt: 3, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                      <EventNoteIcon color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Document IDs: <strong>{exam.examIds?.join(", ") || "N/A"}</strong>
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            ))}
          </Stack>

          <Dialog
            open={saveDialogOpen}
            onClose={() => setSaveDialogOpen(false)}
            PaperProps={{ sx: { borderRadius: 3, p: 2, minWidth: { xs: 300, sm: 400 } } }}
            TransitionComponent={Fade}
          >
            <DialogTitle sx={{ fontWeight: 600, color: "#1a237e" }}>
              Confirm Save
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1">
                Are you sure you want to save {filteredExams.length} exam schedule(s) to the flat collection? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button
                onClick={() => setSaveDialogOpen(false)}
                sx={{ borderRadius: 2, color: "#546e7a" }}
                disabled={loading}
                aria-label="Cancel save"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveFilteredExams}
                variant="contained"
                color="success"
                sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}
                disabled={loading}
                aria-label="Confirm save"
              >
                Save
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={resetDialogOpen}
            onClose={() => setResetDialogOpen(false)}
            PaperProps={{ sx: { borderRadius: 3, p: 2, minWidth: { xs: 300, sm: 400 } } }}
            TransitionComponent={Fade}
          >
            <DialogTitle sx={{ fontWeight: 600, color: "#1a237e" }}>
              Confirm Reset
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1">
                Are you sure you want to clear all filters? This will reset your current selection.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button
                onClick={() => setResetDialogOpen(false)}
                sx={{ borderRadius: 2, color: "#546e7a" }}
                disabled={loading}
                aria-label="Cancel reset"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmClearFilters}
                variant="contained"
                color="error"
                sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}
                disabled={loading}
                aria-label="Confirm reset"
              >
                Reset
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
    </Container>
  );
}