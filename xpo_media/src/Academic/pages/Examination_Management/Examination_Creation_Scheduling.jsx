import React, { useEffect, useState, useCallback } from "react";
import {
  Container, Paper, Typography, FormControl, InputLabel,
  Select, MenuItem, Grid, Button, Box, TextField,
  Checkbox, FormControlLabel, Chip, Divider, Stack, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Tooltip, Fade, Dialog, DialogTitle,
  DialogContent, DialogActions, InputAdornment,
} from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import SaveIcon from "@mui/icons-material/Save";
import ClearIcon from "@mui/icons-material/Clear";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getAcademicYears,
  getTermsForYear,
  getStandardsForYearTerm,
  getSubjectsForStandard
} from "../../api/teacherAllotmentApi";

const EXAM_TYPE_COLLECTION = "exam_types";
const EXAM_FLAT_COLLECTION = "createdExamFlat";

const getExamTypes = async () => {
  const snapshot = await getDocs(collection(db, EXAM_TYPE_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getFlatExamId = (year, term, examType, standard) =>
  `${year.trim()}-${term.trim()}-${examType.trim()}-${standard.trim()}`.replace(/\s+/g, "_");

export default function Examination_Creation_Scheduling() {
  // Dropdown states
  const [academicYears, setAcademicYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [standards, setStandards] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Selected values
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedStandards, setSelectedStandards] = useState([]);
  const [selectedExamType, setSelectedExamType] = useState("");

  // Matrix state
  const [subjectMatrix, setSubjectMatrix] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);

  // Bulk marks state
  const [bulkMarks, setBulkMarks] = useState({
    max: "",
    pass: "",
    internalMax: "",
    internalPass: ""
  });

  // Dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Fetch data with useCallback
  const fetchAcademicYears = useCallback(async () => {
    setLoading(true);
    try {
      const years = await getAcademicYears();
      setAcademicYears(years);
    } catch (err) {
      toast.error("Failed to load academic years", { position: "top-center", theme: "colored" });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchExamTypes = useCallback(async () => {
    setLoading(true);
    try {
      const types = await getExamTypes();
      setExamTypes(types);
    } catch (err) {
      toast.error("Failed to load exam types", { position: "top-center", theme: "colored" });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load dropdowns
  useEffect(() => {
    fetchAcademicYears();
    fetchExamTypes();
  }, [fetchAcademicYears, fetchExamTypes]);

  useEffect(() => {
    const fetchTerms = async () => {
      if (selectedYear) {
        setLoading(true);
        try {
          const termsData = await getTermsForYear(selectedYear);
          setTerms(termsData);
        } catch (err) {
          toast.error("Failed to load terms", { position: "top-center", theme: "colored" });
        } finally {
          setLoading(false);
        }
        setSelectedTerm("");
        setStandards([]);
        setSelectedStandards([]);
        setSubjects([]);
      } else {
        setTerms([]);
        setSelectedTerm("");
        setStandards([]);
        setSelectedStandards([]);
        setSubjects([]);
      }
    };
    fetchTerms();
  }, [selectedYear]);

  useEffect(() => {
    const fetchStandards = async () => {
      if (selectedYear && selectedTerm) {
        setLoading(true);
        try {
          const standardsData = await getStandardsForYearTerm(selectedYear, selectedTerm);
          setStandards(standardsData);
        } catch (err) {
          toast.error("Failed to load standards", { position: "top-center", theme: "colored" });
        } finally {
          setLoading(false);
        }
        setSelectedStandards([]);
        setSubjects([]);
      } else {
        setStandards([]);
        setSelectedStandards([]);
        setSubjects([]);
      }
    };
    fetchStandards();
  }, [selectedYear, selectedTerm]);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (selectedYear && selectedTerm && selectedStandards.length > 0) {
        setLoading(true);
        try {
          let allSubjects = [];
          for (let std of selectedStandards) {
            const subs = await getSubjectsForStandard(selectedYear, selectedTerm, std);
            allSubjects = allSubjects.concat(subs);
          }
          setSubjects(Array.from(new Set(allSubjects)));
        } catch (err) {
          toast.error("Failed to load subjects", { position: "top-center", theme: "colored" });
        } finally {
          setLoading(false);
        }
      } else {
        setSubjects([]);
      }
    };
    fetchSubjects();
  }, [selectedYear, selectedTerm, selectedStandards]);

  // Initialize subjectMatrix
  useEffect(() => {
    if (subjects.length > 0) {
      setSubjectMatrix(subjects.map(sub => ({
        subject: sub,
        Theory: {
          enabled: false,
          max: bulkMarks.max,
          pass: bulkMarks.pass,
          date: null,
          start: null,
          end: null,
          room: "",
          instructions: ""
        },
        TheoryInternal: {
          enabled: false,
          max: bulkMarks.internalMax,
          pass: bulkMarks.internalPass
        },
        Practical: {
          enabled: false,
          max: bulkMarks.max,
          pass: bulkMarks.pass,
          date: null,
          start: null,
          end: null,
          room: "",
          instructions: ""
        },
        PracticalInternal: {
          enabled: false,
          max: bulkMarks.internalMax,
          pass: bulkMarks.internalPass
        }
      })));
    } else {
      setSubjectMatrix([]);
    }
  }, [subjects, bulkMarks]);

  // Handlers
  const handleBulkMarksChange = (field, value) => {
    setBulkMarks(prev => ({ ...prev, [field]: value }));
    setSubjectMatrix(prev => prev.map(row => ({
      ...row,
      Theory: {
        ...row.Theory,
        max: field === "max" ? value : row.Theory.max,
        pass: field === "pass" ? value : row.Theory.pass
      },
      TheoryInternal: {
        ...row.TheoryInternal,
        max: field === "internalMax" ? value : row.TheoryInternal.max,
        pass: field === "internalPass" ? value : row.TheoryInternal.pass
      },
      Practical: {
        ...row.Practical,
        max: field === "max" ? value : row.Practical.max,
        pass: field === "pass" ? value : row.Practical.pass
      },
      PracticalInternal: {
        ...row.PracticalInternal,
        max: field === "internalMax" ? value : row.PracticalInternal.max,
        pass: field === "internalPass" ? value : row.PracticalInternal.pass
      }
    })));
  };

  const handleMatrixChange = (subIdx, category, field, value) => {
    setSubjectMatrix(prev => {
      const updated = [...prev];
      updated[subIdx][category][field] = value;
      return updated;
    });
    setValidationErrors([]); // Clear errors on change
  };

  const validateAll = () => {
    let errors = [];
    if (!selectedYear) errors.push("Academic Year is required.");
    if (!selectedTerm) errors.push("Term is required.");
    if (!selectedExamType) errors.push("Exam Type is required.");
    if (selectedStandards.length === 0) errors.push("At least one Standard is required.");

    let atLeastOne = false;
    subjectMatrix.forEach((row, idx) => {
      ["Theory", "Practical"].forEach(cat => {
        if (row[cat].enabled) {
          atLeastOne = true;
          if (!row[cat].max || !row[cat].pass || !row[cat].date || !row[cat].start || !row[cat].end || !row[cat].room) {
            errors.push(`${cat} details required for ${row.subject}`);
          }
        }
      });

      ["TheoryInternal", "PracticalInternal"].forEach(cat => {
        if (row[cat].enabled && (!row[cat].max || !row[cat].pass)) {
          errors.push(`${cat} marks required for ${row.subject}`);
        }
      });
    });

    if (!atLeastOne) errors.push("Enable at least one category for at least one subject.");
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSaveMatrix = async () => {
    if (!validateAll()) {
      toast.error("Please correct validation errors before saving.", {
        position: "top-center",
        theme: "colored"
      });
      return;
    }
    setConfirmDialogOpen(true);
  };

  const confirmSave = async () => {
    setLoading(true);
    try {
      const schedules = [];
      subjectMatrix.forEach(row => {
        if (row.Theory.enabled) {
          schedules.push({
            subject: row.subject,
            examCategory: "Theory",
            maximumMark: row.Theory.max || "",
            passMark: row.Theory.pass || "",
            examDate: row.Theory.date?.toDate
              ? row.Theory.date.toDate().toISOString().split("T")[0]
              : row.Theory.date || "",
            startTime: row.Theory.start?.toDate
              ? row.Theory.start.toDate().toISOString().split("T")[1].slice(0, 5)
              : row.Theory.start || "",
            endTime: row.Theory.end?.toDate
              ? row.Theory.end.toDate().toISOString().split("T")[1].slice(0, 5)
              : row.Theory.end || "",
            roomNo: row.Theory.room || "",
            instructions: row.Theory.instructions || ""
          });
        }

        if (row.TheoryInternal.enabled) {
          schedules.push({
            subject: row.subject,
            examCategory: "Theory Internal",
            maximumMark: row.TheoryInternal.max || "",
            passMark: row.TheoryInternal.pass || "",
            examDate: "",
            startTime: "",
            endTime: "",
            roomNo: "",
            instructions: ""
          });
        }

        if (row.Practical.enabled) {
          schedules.push({
            subject: row.subject,
            examCategory: "Practical",
            maximumMark: row.Practical.max || "",
            passMark: row.Practical.pass || "",
            examDate: row.Practical.date?.toDate
              ? row.Practical.date.toDate().toISOString().split("T")[0]
              : row.Practical.date || "",
            startTime: row.Theory.start?.toDate
              ? row.Theory.start.toDate().toISOString().split("T")[1].slice(0, 5)
              : row.Theory.start || "",
            endTime: row.Theory.end?.toDate
              ? row.Theory.end.toDate().toISOString().split("T")[1].slice(0, 5)
              : row.Theory.end || "",
            roomNo: row.Practical.room || "",
            instructions: row.Practical.instructions || ""
          });
        }

        if (row.PracticalInternal.enabled) {
          schedules.push({
            subject: row.subject,
            examCategory: "Practical Internal",
            maximumMark: row.PracticalInternal.max || "",
            passMark: row.PracticalInternal.pass || "",
            examDate: "",
            startTime: "",
            endTime: "",
            roomNo: "",
            instructions: ""
          });
        }
      });

      for (const standard of selectedStandards) {
        const docId = getFlatExamId(selectedYear, selectedTerm, selectedExamType, standard);
        const docRef = doc(db, EXAM_FLAT_COLLECTION, docId);
        await setDoc(docRef, {
          academicYear: selectedYear,
          term: selectedTerm,
          examType: selectedExamType,
          standard,
          schedules
        }, { merge: true });
      }
      toast.success("Exam matrix saved successfully!", {
        position: "top-center",
        theme: "colored"
      });
      setConfirmDialogOpen(false);
      resetForm();
    } catch (err) {
      toast.error("Error saving schedules: " + err.message, {
        position: "top-center",
        theme: "colored"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedYear("");
    setSelectedTerm("");
    setSelectedStandards([]);
    setSelectedExamType("");
    setBulkMarks({ max: "", pass: "", internalMax: "", internalPass: "" });
    setSearchQuery("");
    setValidationErrors([]);
    setSubjectMatrix([]);
  };

  const filteredSubjectMatrix = subjectMatrix.filter(row =>
    row.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container
      maxWidth="xl"
      sx={{
        mt: 4,
        mb: 4,
        pb: 4,
        background: "linear-gradient(135deg, #f5f7fa 0%, #e4e9f0 100%)",
      }}
    >
      <ToastContainer position="top-center" autoClose={3000} theme="colored" />
      <Fade in={true} timeout={600}>
        <Box sx={{ maxWidth: 1400, mx: "auto" }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#1a237e", mb: 2 }}
          >
            Exam Creation & Scheduling
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "#546e7a", mb: 4 }}
          >
            Configure and schedule exams for selected academic years, terms, and standards
          </Typography>

          <Paper
            elevation={6}
            sx={{
              p: 4,
              borderRadius: 3,
              mb: 4,
              bgcolor: "#ffffff",
              transition: "transform 0.3s ease-in-out",
              "&:hover": { transform: "translateY(-4px)" },
            }}
          >
            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                <CircularProgress />
              </Box>
            )}

            {/* Selection Table */}
            <TableContainer component={Box} sx={{ mb: 4 }}>
              <Table aria-label="exam selection table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>
                      Academic Year
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>
                      Term
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>
                      Standards
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>
                      Exam Type
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <FormControl size="small" fullWidth disabled={loading}>
                        <InputLabel>Academic Year</InputLabel>
                        <Select
                          value={selectedYear}
                          label="Academic Year"
                          onChange={e => setSelectedYear(e.target.value)}
                          aria-label="Select academic year"
                        >
                          {academicYears.map(year => (
                            <MenuItem key={year.id} value={year.id}>
                              {year.id}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth disabled={loading || !terms.length}>
                        <InputLabel>Term</InputLabel>
                        <Select
                          value={selectedTerm}
                          label="Term"
                          onChange={e => setSelectedTerm(e.target.value)}
                          aria-label="Select term"
                        >
                          {terms.map(term => (
                            <MenuItem key={term} value={term}>
                              {term}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth disabled={loading || !standards.length}>
                        <InputLabel>Standards</InputLabel>
                        <Select
                          multiple
                          value={selectedStandards}
                          onChange={e => setSelectedStandards(e.target.value)}
                          label="Standards"
                          renderValue={selected => (
                            <Stack direction="row" spacing={1}>
                              {selected.map(val => (
                                <Chip key={val} label={val} color="primary" />
                              ))}
                            </Stack>
                          )}
                          aria-label="Select standards"
                        >
                          {standards.map(std => (
                            <MenuItem key={std} value={std}>
                              {std}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth disabled={loading}>
                        <InputLabel>Exam Type</InputLabel>
                        <Select
                          value={selectedExamType}
                          label="Exam Type"
                          onChange={e => setSelectedExamType(e.target.value)}
                          aria-label="Select exam type"
                        >
                          {examTypes.map(type => (
                            <MenuItem key={type.id} value={type.id}>
                              {type.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Bulk Marks Entry */}
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, mb: 2, color: "#1976d2" }}
            >
              Bulk Marks Configuration
            </Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {[
                { label: "Max Marks (Theory/Practical)", field: "max" },
                { label: "Pass Marks (Theory/Practical)", field: "pass" },
                { label: "Internal Max Marks", field: "internalMax" },
                { label: "Internal Pass Marks", field: "internalPass" },
              ].map(({ label, field }) => (
                <Grid item xs={12} sm={6} md={3} key={field}>
                  <Tooltip title={`Set ${label.toLowerCase()} for all subjects`}>
                    <TextField
                      label={label}
                      value={bulkMarks[field]}
                      onChange={e => handleBulkMarksChange(field, e.target.value)}
                      size="small"
                      fullWidth
                      disabled={loading}
                      type="number"
                      InputProps={{ inputProps: { min: 0 } }}
                      aria-label={label}
                    />
                  </Tooltip>
                </Grid>
              ))}
            </Grid>

            {validationErrors.length > 0 && (
              <Paper
                sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: "#ffebee",
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle2" color="error.main">
                  Please fix the following errors:
                </Typography>
                {validationErrors.map((err, idx) => (
                  <Typography key={idx} variant="body2" color="error.main">
                    - {err}
                  </Typography>
                ))}
              </Paper>
            )}
          </Paper>

          {/* Exam Matrix */}
          <Paper
            elevation={6}
            sx={{
              p: 4,
              borderRadius: 3,
              bgcolor: "#ffffff",
              transition: "transform 0.3s ease-in-out",
              "&:hover": { transform: "translateY(-4px)" },
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: "#1a237e" }}
              >
                Exam Matrix
              </Typography>
              <TextField
                size="small"
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                sx={{ width: { xs: "100%", sm: 300 }, bgcolor: "#f8fafc" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                aria-label="Search subjects"
              />
            </Box>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              {filteredSubjectMatrix.length === 0 && !loading ? (
                <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                  No subjects available. Please select standards to load subjects.
                </Typography>
              ) : (
                filteredSubjectMatrix.map((row, subIdx) => (
                  <Accordion
                    key={row.subject}
                    sx={{
                      mb: 2,
                      borderRadius: 2,
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                      "&:before": { display: "none" },
                    }}
                    TransitionProps={{ timeout: 300 }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        bgcolor: "#f8fafc",
                        borderRadius: 2,
                        "&:hover": { bgcolor: "#e3f2fd" },
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {row.subject}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 3 }}>
                      <Grid container spacing={3}>
                        {[
                          {
                            title: "Theory",
                            category: "Theory",
                            color: "#e3f2fd",
                            chipColor: "primary",
                          },
                          {
                            title: "Theory Internal",
                            category: "TheoryInternal",
                            color: "#fff3e0",
                            chipColor: "warning",
                          },
                          {
                            title: "Practical",
                            category: "Practical",
                            color: "#e3f2fd",
                            chipColor: "success",
                          },
                          {
                            title: "Practical Internal",
                            category: "PracticalInternal",
                            color: "#f3e5f5",
                            chipColor: "secondary",
                          },
                        ].map(({ title, category, color, chipColor }) => (
                          <Grid item xs={12} key={category}>
                            <Paper
                              elevation={1}
                              sx={{
                                p: 3,
                                borderRadius: 2,
                                bgcolor: color,
                                transition: "all 0.3s",
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={row[category].enabled}
                                      onChange={e =>
                                        handleMatrixChange(subIdx, category, "enabled", e.target.checked)
                                      }
                                      disabled={loading}
                                    />
                                  }
                                  label={`Enable ${title}`}
                                  sx={{ fontWeight: 500 }}
                                />
                                {row[category].enabled && (
                                  <Chip label={title} color={chipColor} size="small" />
                                )}
                              </Box>
                              {row[category].enabled && (
                                <Grid container spacing={2}>
                                  {["Theory", "Practical"].includes(category) ? (
                                    <>
                                      <Grid item xs={12} sm={6} md={2}>
                                        <TextField
                                          label="Max Marks"
                                          value={row[category].max}
                                          onChange={e =>
                                            handleMatrixChange(subIdx, category, "max", e.target.value)
                                          }
                                          size="small"
                                          fullWidth
                                          type="number"
                                          disabled={loading}
                                          InputProps={{ inputProps: { min: 0 } }}
                                          aria-label={`${title} max marks`}
                                        />
                                      </Grid>
                                      <Grid item xs={12} sm={6} md={2}>
                                        <TextField
                                          label="Pass Marks"
                                          value={row[category].pass}
                                          onChange={e =>
                                            handleMatrixChange(subIdx, category, "pass", e.target.value)
                                          }
                                          size="small"
                                          fullWidth
                                          type="number"
                                          disabled={loading}
                                          InputProps={{ inputProps: { min: 0 } }}
                                          aria-label={`${title} pass marks`}
                                        />
                                      </Grid>
                                      <Grid item xs={12} sm={6} md={2}>
                                        <DatePicker
                                          label="Exam Date"
                                          value={row[category].date}
                                          onChange={v => handleMatrixChange(subIdx, category, "date", v)}
                                          slotProps={{
                                            textField: {
                                              size: "small",
                                              fullWidth: true,
                                              disabled: loading,
                                            },
                                          }}
                                          aria-label={`${title} exam date`}
                                        />
                                      </Grid>
                                      <Grid item xs={12} sm={6} md={2}>
                                        <TimePicker
                                          label="Start Time"
                                          value={row[category].start}
                                          onChange={v => handleMatrixChange(subIdx, category, "start", v)}
                                          slotProps={{
                                            textField: {
                                              size: "small",
                                              fullWidth: true,
                                              disabled: loading,
                                            },
                                          }}
                                          aria-label={`${title} start time`}
                                        />
                                      </Grid>
                                      <Grid item xs={12} sm={6} md={2}>
                                        <TimePicker
                                          label="End Time"
                                          value={row[category].end}
                                          onChange={v => handleMatrixChange(subIdx, category, "end", v)}
                                          slotProps={{
                                            textField: {
                                              size: "small",
                                              fullWidth: true,
                                              disabled: loading,
                                            },
                                          }}
                                          aria-label={`${title} end time`}
                                        />
                                      </Grid>
                                      <Grid item xs={12} sm={6} md={2}>
                                        <TextField
                                          label="Room Number"
                                          value={row[category].room}
                                          onChange={e =>
                                            handleMatrixChange(subIdx, category, "room", e.target.value)
                                          }
                                          size="small"
                                          fullWidth
                                          disabled={loading}
                                          aria-label={`${title} room number`}
                                        />
                                      </Grid>
                                      <Grid item xs={12}>
                                        <TextField
                                          label="Instructions"
                                          value={row[category].instructions}
                                          onChange={e =>
                                            handleMatrixChange(subIdx, category, "instructions", e.target.value)
                                          }
                                          size="small"
                                          fullWidth
                                          multiline
                                          rows={2}
                                          disabled={loading}
                                          aria-label={`${title} instructions`}
                                        />
                                      </Grid>
                                    </>
                                  ) : (
                                    <>
                                      <Grid item xs={12} sm={6}>
                                        <TextField
                                          label="Max Marks"
                                          value={row[category].max}
                                          onChange={e =>
                                            handleMatrixChange(subIdx, category, "max", e.target.value)
                                          }
                                          size="small"
                                          fullWidth
                                          type="number"
                                          disabled={loading}
                                          InputProps={{ inputProps: { min: 0 } }}
                                          aria-label={`${title} max marks`}
                                        />
                                      </Grid>
                                      <Grid item xs={12} sm={6}>
                                        <TextField
                                          label="Pass Marks"
                                          value={row[category].pass}
                                          onChange={e =>
                                            handleMatrixChange(subIdx, category, "pass", e.target.value)
                                          }
                                          size="small"
                                          fullWidth
                                          type="number"
                                          disabled={loading}
                                          InputProps={{ inputProps: { min: 0 } }}
                                          aria-label={`${title} pass marks`}
                                        />
                                      </Grid>
                                    </>
                                  )}
                                </Grid>
                              )}
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))
              )}
            </LocalizationProvider>

            <Divider sx={{ my: 4 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<ClearIcon />}
                onClick={resetForm}
                disabled={loading}
                sx={{ borderRadius: 2, px: 4 }}
                aria-label="Reset form"
              >
                Reset Form
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<SaveIcon />}
                onClick={handleSaveMatrix}
                disabled={loading}
                sx={{ borderRadius: 2, px: 4, boxShadow: 2 }}
                aria-label="Save exam matrix"
              >
                Save Exam Matrix
              </Button>
            </Box>
          </Paper>

          {/* Confirmation Dialog */}
          <Dialog
            open={confirmDialogOpen}
            onClose={() => setConfirmDialogOpen(false)}
            PaperProps={{ sx: { borderRadius: 3, p: 2, minWidth: 400 } }}
            TransitionComponent={Fade}
          >
            <DialogTitle sx={{ fontWeight: 600 }}>
              Confirm Save
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1">
                Are you sure you want to save the exam matrix? This will update the schedules for the selected standards.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button
                onClick={() => setConfirmDialogOpen(false)}
                sx={{ borderRadius: 2 }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmSave}
                variant="contained"
                color="success"
                sx={{ borderRadius: 2, px: 3 }}
                disabled={loading}
              >
                Save
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
    </Container>
  );
}