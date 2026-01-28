import React, { useEffect, useState, useCallback } from "react";
import {
  Container, Card, CardContent, Typography, Grid, TextField,
  FormControl, InputLabel, Select, MenuItem, Checkbox,
  Box, Button, List, ListItem, CircularProgress,
  Tabs, Tab, Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControlLabel, Switch,
  Skeleton, Fade, Pagination, LinearProgress, Autocomplete,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { getAcademicYears, getTermsForYear, getStandardsForYearTerm } from "../../api/teacherAllotmentApi";

import dayjs from 'dayjs';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';
import ResetIcon from '@mui/icons-material/Restore';

const getFlatDocId = (year, term, standard) =>
  `${year.trim()}-${term.trim().replace(/\s+/g, "_")}-${standard.trim()}`;

const getAssignmentDocId = (year, term, standard, assignmentTitle) =>
  `${year.trim()}-${term.trim().replace(/\s+/g, "_")}-${standard.trim()}-${assignmentTitle.trim().replace(/\s+/g, "_")}_assignments`;

const ITEMS_PER_PAGE = 5;

export default function Assignment_Creation() {
  const [academicYears, setAcademicYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [standards, setStandards] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedStandard, setSelectedStandard] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: null,
    assignmentType: '',
    maxMarks: '',
    lateSubmissionAllowed: false,
    gracePeriodDays: 0,
    rubric: '',
    submissionType: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [assignToAll, setAssignToAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [deleteAssignmentId, setDeleteAssignmentId] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openSubmitDialog, setOpenSubmitDialog] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [page, setPage] = useState(1);

  const calculateFormProgress = () => {
    const fields = [
      selectedYear, selectedTerm, selectedStandard, selectedSection, selectedSubject,
      formData.title, formData.assignmentType, formData.maxMarks, formData.submissionType
    ];
    const filledFields = fields.filter(field => field !== "" && field !== null).length;
    return (filledFields / fields.length) * 100;
  };

  const validateForm = () => {
    const errors = {};
    if (!selectedYear) errors.selectedYear = "Academic Year is required";
    if (!selectedTerm) errors.selectedTerm = "Term is required";
    if (!selectedStandard) errors.selectedStandard = "Standard is required";
    if (!selectedSection) errors.selectedSection = "Section is required";
    if (!selectedSubject) errors.selectedSubject = "Subject is required";
    if (!formData.title) errors.title = "Assignment Title is required";
    if (!formData.assignmentType) errors.assignmentType = "Assignment Type is required";
    if (!formData.maxMarks || isNaN(formData.maxMarks) || formData.maxMarks <= 0)
      errors.maxMarks = "Valid Maximum Marks is required";
    if (!formData.submissionType) errors.submissionType = "Submission Type is required";
    if (!assignToAll && selectedStudents.length === 0)
      errors.students = "Select at least one student or enable 'Assign to All'";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchInitialData = useCallback(async () => {
    setInitialLoading(true);
    try {
      const years = await getAcademicYears();
      setAcademicYears(years);
      const snapshot = await getDocs(collection(db, 'studentAssignmentsFlat'));
      setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error('Failed to load initial data: ' + error.message);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (selectedYear) {
      getTermsForYear(selectedYear)
        .then(setTerms)
        .catch(error => toast.error('Failed to load terms: ' + error.message));
      setSelectedTerm("");
      setStandards([]);
      setSelectedStandard("");
      setSections([]);
      setSelectedSection("");
      setSubjects([]);
      setSelectedSubject("");
    } else {
      setTerms([]);
      setSelectedTerm("");
      setStandards([]);
      setSelectedStandard("");
      setSections([]);
      setSelectedSection("");
      setSubjects([]);
      setSelectedSubject("");
    }
  }, [selectedYear]);

  useEffect(() => {
    if (selectedYear && selectedTerm) {
      getStandardsForYearTerm(selectedYear, selectedTerm)
        .then(setStandards)
        .catch(error => toast.error('Failed to load standards: ' + error.message));
      setSelectedStandard("");
      setSections([]);
      setSelectedSection("");
      setSubjects([]);
      setSelectedSubject("");
    } else {
      setStandards([]);
      setSelectedStandard("");
      setSections([]);
      setSelectedSection("");
      setSubjects([]);
      setSelectedSubject("");
    }
  }, [selectedYear, selectedTerm]);

  useEffect(() => {
    const loadSections = async () => {
      if (selectedStandard) {
        try {
          const q = query(collection(db, "students_flat"), where("standard", "==", selectedStandard));
          const snapshot = await getDocs(q);
          const uniqueSections = [...new Set(snapshot.docs.map(doc => doc.data().section))].sort();
          setSections(uniqueSections);
          setSelectedSection("");
        } catch (error) {
          toast.error('Failed to load sections: ' + error.message);
          setSections([]);
          setSelectedSection("");
        }
      } else {
        setSections([]);
        setSelectedSection("");
      }
    };
    loadSections();
  }, [selectedStandard]);

  useEffect(() => {
    const loadSubjects = async () => {
      if (selectedYear && selectedTerm && selectedStandard) {
        try {
          const docId = getFlatDocId(selectedYear, selectedTerm, selectedStandard);
          const docRef = doc(db, "subjectConfigurations", docId);
          const docSnap = await getDoc(docRef);
          setSubjects(docSnap.exists() && Array.isArray(docSnap.data().subjects) ? docSnap.data().subjects : []);
          setSelectedSubject("");
        } catch (error) {
          toast.error('Failed to load subjects: ' + error.message);
          setSubjects([]);
          setSelectedSubject("");
        }
      } else {
        setSubjects([]);
        setSelectedSubject("");
      }
    };
    loadSubjects();
  }, [selectedYear, selectedTerm, selectedStandard]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedStandard || !selectedSection) {
        setStudents([]);
        return;
      }
      try {
        const q = query(
          collection(db, 'students_flat'),
          where('standard', '==', selectedStandard),
          where('section', '==', selectedSection)
        );
        const snapshot = await getDocs(q);
        setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        toast.error('Error fetching students: ' + error.message);
        setStudents([]);
      }
    };
    fetchStudents();
  }, [selectedStandard, selectedSection]);

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const assignmentDocId = getAssignmentDocId(selectedYear, selectedTerm, selectedStandard, formData.title);
      const studentsToAssign = assignToAll
        ? students.map(s => s.studentID)
        : selectedStudents.map(id => students.find(s => s.id === id)?.studentID).filter(Boolean);

      await setDoc(doc(db, "studentAssignmentsFlat", assignmentDocId), {
        assignmentId: assignmentDocId,
        academicYear: selectedYear,
        term: selectedTerm,
        standard: selectedStandard,
        section: selectedSection,
        subject: selectedSubject,
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate ? dayjs(formData.dueDate).format("YYYY-MM-DD") : null,
        createdAt: new Date().toISOString(),
        status: "assigned",
        assignmentType: formData.assignmentType,
        maxMarks: parseInt(formData.maxMarks) || 100,
        lateSubmissionAllowed: formData.lateSubmissionAllowed,
        gracePeriodDays: parseInt(formData.gracePeriodDays) || 0,
        rubric: formData.rubric,
        submissionType: formData.submissionType,
        students: studentsToAssign,
        assignedDate: new Date().toISOString(),
      });

      toast.success(`Assignment created and assigned to ${studentsToAssign.length} students`);
      resetForm();
      const snapshot = await getDocs(collection(db, 'studentAssignmentsFlat'));
      setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error(`Error creating assignment: ${error.message}`);
    } finally {
      setLoading(false);
      setOpenSubmitDialog(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: null,
      assignmentType: '',
      maxMarks: '',
      lateSubmissionAllowed: false,
      gracePeriodDays: 0,
      rubric: '',
      submissionType: ''
    });
    setSelectedYear("");
    setSelectedTerm("");
    setSelectedStandard("");
    setSelectedSection("");
    setSelectedSubject("");
    setSelectedStudents([]);
    setAssignToAll(false);
    setFormErrors({});
  };

  const handleEditClick = (assignment) => {
    setEditingAssignmentId(assignment.id);
    setEditFormData({
      title: assignment.title,
      subject: assignment.subject,
      standard: assignment.standard,
      section: assignment.section,
      dueDate: assignment.dueDate ? dayjs(assignment.dueDate) : null,
      description: assignment.description,
      assignmentType: assignment.assignmentType,
      maxMarks: assignment.maxMarks.toString(),
      lateSubmissionAllowed: assignment.lateSubmissionAllowed,
      gracePeriodDays: assignment.gracePeriodDays.toString(),
      rubric: assignment.rubric,
      submissionType: assignment.submissionType,
      academicYear: assignment.academicYear,
      term: assignment.term,
    });
  };

  const handleEditSave = async (assignmentId) => {
    try {
      await setDoc(doc(db, 'studentAssignmentsFlat', assignmentId), {
        assignmentId,
        academicYear: editFormData.academicYear,
        term: editFormData.term,
        standard: editFormData.standard,
        section: editFormData.section,
        subject: editFormData.subject,
        title: editFormData.title,
        description: editFormData.description,
        dueDate: editFormData.dueDate ? dayjs(editFormData.dueDate).format('YYYY-MM-DD') : null,
        createdAt: new Date().toISOString(),
        status: "assigned",
        assignmentType: editFormData.assignmentType,
        maxMarks: parseInt(editFormData.maxMarks) || 100,
        lateSubmissionAllowed: editFormData.lateSubmissionAllowed,
        gracePeriodDays: parseInt(editFormData.gracePeriodDays) || 0,
        rubric: editFormData.rubric,
        submissionType: editFormData.submissionType,
        students: assignments.find(a => a.id === assignmentId).students,
        assignedDate: new Date().toISOString(),
      });

      toast.success('Assignment updated successfully');
      setEditingAssignmentId(null);
      setEditFormData({});
      const snapshot = await getDocs(collection(db, 'studentAssignmentsFlat'));
      setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error('Error updating assignment: ' + error.message);
    }
  };

  const handleEditCancel = () => {
    setEditingAssignmentId(null);
    setEditFormData({});
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'studentAssignmentsFlat', deleteAssignmentId));
      setAssignments(assignments.filter(assignment => assignment.id !== deleteAssignmentId));
      toast.success('Assignment deleted successfully');
    } catch (error) {
      toast.error('Error deleting assignment: ' + error.message);
    }
    setOpenDeleteDialog(false);
    setDeleteAssignmentId(null);
  };

  const handlePreview = (assignment) => {
    setPreviewData(assignment);
    setPreviewOpen(true);
  };

  const paginatedAssignments = assignments.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (initialLoading) {
    return (
      <Container sx={{ py: 6 }}>
        <Skeleton variant="rectangular" height={80} sx={{ mb: 4, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Container>
    );
  }

  return (
    <Fade in={true} timeout={500}>
      <Container maxWidth="lg" sx={{ mt: 6, mb: 6, bgcolor: '#f5f7fa', py: 4, borderRadius: 3 }}>
        <ToastContainer position="top-right" autoClose={3000} />
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            color: '#1a237e',
            fontWeight: 700,
            mb: 4,
            textAlign: 'center',
            fontFamily: 'Roboto, sans-serif'
          }}
        >
          Teacher Assignment Portal
        </Typography>
        <Card
          sx={{
            mb: 4,
            borderRadius: 3,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            background: 'linear-gradient(145deg, #ffffff, #f9f9f9)',
            border: '1px solid #e0e0e0'
          }}
        >
          <Tabs
            value={tabIndex}
            onChange={(_, idx) => setTabIndex(idx)}
            centered
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                color: '#424242',
                textTransform: 'none',
                fontFamily: 'Roboto, sans-serif'
              },
              '& .MuiTab-root.Mui-selected': { color: '#1a237e' },
              '& .MuiTabs-indicator': { bgcolor: '#1a237e' }
            }}
          >
            <Tab label="Create Assignment" />
            <Tab label="View Assignments" />
          </Tabs>
          <CardContent sx={{ p: 4 }}>
            {tabIndex === 0 && (
              <>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color: '#1a237e',
                      fontFamily: 'Roboto, sans-serif'
                    }}
                  >
                    Create New Assignment
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<ResetIcon />}
                    onClick={resetForm}
                    sx={{ borderRadius: 2 }}
                  >
                    Reset Form
                  </Button>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={calculateFormProgress()}
                  sx={{ mb: 3, height: 8, borderRadius: 4 }}
                />
                <form onSubmit={(e) => { e.preventDefault(); if (validateForm()) setOpenSubmitDialog(true); }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small" error={!!formErrors.selectedYear}>
                        <InputLabel>Academic Year *</InputLabel>
                        <Select
                          value={selectedYear}
                          onChange={e => setSelectedYear(e.target.value)}
                          label="Academic Year"
                          required
                          sx={{ borderRadius: 2 }}
                        >
                          {academicYears.map(year => (
                            <MenuItem key={year.id || year} value={year.id || year}>{year.id || year}</MenuItem>
                          ))}
                        </Select>
                        {formErrors.selectedYear && <Typography color="error" variant="caption">{formErrors.selectedYear}</Typography>}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small" disabled={!selectedYear} error={!!formErrors.selectedTerm}>
                        <InputLabel>Term *</InputLabel>
                        <Select
                          value={selectedTerm}
                          onChange={e => setSelectedTerm(e.target.value)}
                          label="Term"
                          required
                          sx={{ borderRadius: 2 }}
                        >
                          {terms.map(term => (
                            <MenuItem key={term} value={term}>{term}</MenuItem>
                          ))}
                        </Select>
                        {formErrors.selectedTerm && <Typography color="error" variant="caption">{formErrors.selectedTerm}</Typography>}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small" disabled={!selectedTerm} error={!!formErrors.selectedStandard}>
                        <InputLabel>Standard *</InputLabel>
                        <Select
                          value={selectedStandard}
                          onChange={e => setSelectedStandard(e.target.value)}
                          label="Standard"
                          required
                          sx={{ borderRadius: 2 }}
                        >
                          {standards.map(std => (
                            <MenuItem key={std} value={std}>{std}</MenuItem>
                          ))}
                        </Select>
                        {formErrors.selectedStandard && <Typography color="error" variant="caption">{formErrors.selectedStandard}</Typography>}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small" disabled={!selectedStandard} error={!!formErrors.selectedSection}>
                        <InputLabel>Section *</InputLabel>
                        <Select
                          value={selectedSection}
                          onChange={e => setSelectedSection(e.target.value)}
                          label="Section"
                          required
                          sx={{ borderRadius: 2 }}
                        >
                          {sections.length === 0 ? (
                            <MenuItem value="" disabled>No Sections Available</MenuItem>
                          ) : (
                            sections.map(sec => (
                              <MenuItem key={sec} value={sec}>{sec}</MenuItem>
                            ))
                          )}
                        </Select>
                        {formErrors.selectedSection && <Typography color="error" variant="caption">{formErrors.selectedSection}</Typography>}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small" disabled={!selectedStandard} error={!!formErrors.selectedSubject}>
                        <InputLabel>Subject *</InputLabel>
                        <Select
                          value={selectedSubject}
                          onChange={e => setSelectedSubject(e.target.value)}
                          label="Subject"
                          required
                          sx={{ borderRadius: 2 }}
                        >
                          {subjects.map(subject => (
                            <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                          ))}
                        </Select>
                        {formErrors.selectedSubject && <Typography color="error" variant="caption">{formErrors.selectedSubject}</Typography>}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Assignment Title *"
                        value={formData.title}
                        onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        fullWidth
                        required
                        size="small"
                        error={!!formErrors.title}
                        helperText={formErrors.title}
                        sx={{ '& .MuiInputBase-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small" error={!!formErrors.assignmentType}>
                        <InputLabel>Assignment Type *</InputLabel>
                        <Select
                          value={formData.assignmentType}
                          onChange={e => setFormData(prev => ({ ...prev, assignmentType: e.target.value }))}
                          label="Assignment Type"
                          required
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="Homework">Homework</MenuItem>
                          <MenuItem value="Project">Project</MenuItem>
                          <MenuItem value="Quiz">Quiz</MenuItem>
                          <MenuItem value="Essay">Essay</MenuItem>
                          <MenuItem value="Presentation">Presentation</MenuItem>
                        </Select>
                        {formErrors.assignmentType && <Typography color="error" variant="caption">{formErrors.assignmentType}</Typography>}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Maximum Marks *"
                        type="number"
                        value={formData.maxMarks}
                        onChange={e => setFormData(prev => ({ ...prev, maxMarks: e.target.value }))}
                        fullWidth
                        required
                        size="small"
                        inputProps={{ min: 0 }}
                        error={!!formErrors.maxMarks}
                        helperText={formErrors.maxMarks}
                        sx={{ '& .MuiInputBase-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          label="Due Date"
                          value={formData.dueDate}
                          onChange={(newValue) => setFormData(prev => ({ ...prev, dueDate: newValue }))}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: 'small',
                              sx: { '& .MuiInputBase-root': { borderRadius: 2 } }
                            }
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small" error={!!formErrors.submissionType}>
                        <InputLabel>Submission Type *</InputLabel>
                        <Select
                          value={formData.submissionType}
                          onChange={e => setFormData(prev => ({ ...prev, submissionType: e.target.value }))}
                          label="Submission Type"
                          required
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="Online">Online</MenuItem>
                          <MenuItem value="In-Person">In-Person</MenuItem>
                          <MenuItem value="Both">Both</MenuItem>
                        </Select>
                        {formErrors.submissionType && <Typography color="error" variant="caption">{formErrors.submissionType}</Typography>}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.lateSubmissionAllowed}
                              onChange={e => setFormData(prev => ({ ...prev, lateSubmissionAllowed: e.target.checked }))}
                              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#1a237e' } }}
                            />
                          }
                          label="Allow Late Submissions"
                        />
                        {formData.lateSubmissionAllowed && (
                          <TextField
                            label="Grace Period (Days)"
                            type="number"
                            size="small"
                            value={formData.gracePeriodDays}
                            onChange={e => setFormData(prev => ({ ...prev, gracePeriodDays: e.target.value }))}
                            sx={{ width: 120, '& .MuiInputBase-root': { borderRadius: 2 } }}
                            inputProps={{ min: 0 }}
                          />
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Description"
                        value={formData.description}
                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        fullWidth
                        multiline
                        rows={3}
                        size="small"
                        sx={{ '& .MuiInputBase-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Grading Rubric / Criteria"
                        value={formData.rubric}
                        onChange={e => setFormData(prev => ({ ...prev, rubric: e.target.value }))}
                        fullWidth
                        multiline
                        rows={4}
                        size="small"
                        helperText="Enter grading criteria or rubric details"
                        sx={{ '& .MuiInputBase-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                  </Grid>
                  <Typography
                    variant="h6"
                    sx={{
                      mt: 4,
                      mb: 3,
                      fontWeight: 600,
                      color: '#1a237e',
                      fontFamily: 'Roboto, sans-serif'
                    }}
                  >
                    Assign to Students
                  </Typography>
                  {students.length > 0 ? (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Checkbox
                          checked={assignToAll}
                          onChange={(e) => {
                            setAssignToAll(e.target.checked);
                            setSelectedStudents(e.target.checked ? students.map(s => s.id) : []);
                          }}
                          sx={{ color: '#1a237e', '&.Mui-checked': { color: '#1a237e' } }}
                        />
                        <Typography sx={{ color: '#424242', fontWeight: 500 }}>
                          Assign to All Students ({students.length})
                        </Typography>
                      </Box>
                      <Autocomplete
                        multiple
                        options={students}
                        getOptionLabel={(option) => `${option.fullName} (ID: ${option.studentID})`}
                        value={students.filter(s => selectedStudents.includes(s.id))}
                        onChange={(e, newValue) => setSelectedStudents(newValue.map(s => s.id))}
                        disabled={assignToAll}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Select Students"
                            placeholder="Search students..."
                            error={!!formErrors.students}
                            helperText={formErrors.students}
                            sx={{ '& .MuiInputBase-root': { borderRadius: 2 } }}
                          />
                        )}
                        sx={{ mb: 3 }}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={loading}
                        sx={{
                          fontWeight: 600,
                          py: 1.5,
                          bgcolor: '#1a237e',
                          borderRadius: 2,
                          textTransform: 'none',
                          '&:hover': { bgcolor: '#131a5b' },
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                      >
                        {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Create & Assign Assignment'}
                      </Button>
                    </>
                  ) : (
                    <Alert
                      severity="info"
                      sx={{
                        borderRadius: 2,
                        bgcolor: '#e3f2fd',
                        color: '#0d47a1',
                        '& .MuiAlert-icon': { color: '#0d47a1' }
                      }}
                    >
                      No students loaded. Select standard and section to view students.
                    </Alert>
                  )}
                </form>
              </>
            )}
            {tabIndex === 1 && (
              <>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 3,
                    fontWeight: 600,
                    color: '#1a237e',
                    fontFamily: 'Roboto, sans-serif'
                  }}
                >
                  Created Assignments
                </Typography>
                {assignments.length > 0 ? (
                  <>
                    <TableContainer component={Paper} sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 2 }}>
                      <Table stickyHeader>
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#e8eaf6' }}>
                            <TableCell sx={{ fontWeight: 600, color: '#1a237e' }}>Title</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#1a237e' }}>Subject</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#1a237e' }}>Standard</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#1a237e' }}>Section</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#1a237e' }}>Due Date</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#1a237e' }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#1a237e' }}>Max Marks</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#1a237e' }}>Submission</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#1a237e' }}>Late Submission</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#1a237e' }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedAssignments.map((assignment) => (
                            <TableRow key={assignment.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f5f5f5' } }}>
                              {editingAssignmentId === assignment.id ? (
                                <>
                                  <TableCell>
                                    <TextField
                                      value={editFormData.title}
                                      onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                                      size="small"
                                      fullWidth
                                      sx={{ borderRadius: 2 }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <TextField
                                      value={editFormData.subject}
                                      onChange={(e) => setEditFormData(prev => ({ ...prev, subject: e.target.value }))}
                                      size="small"
                                      fullWidth
                                      sx={{ borderRadius: 2 }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <TextField
                                      value={editFormData.standard}
                                      onChange={(e) => setEditFormData(prev => ({ ...prev, standard: e.target.value }))}
                                      size="small"
                                      fullWidth
                                      sx={{ borderRadius: 2 }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <TextField
                                      value={editFormData.section}
                                      onChange={(e) => setEditFormData(prev => ({ ...prev, section: e.target.value }))}
                                      size="small"
                                      fullWidth
                                      sx={{ borderRadius: 2 }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                      <DatePicker
                                        value={editFormData.dueDate}
                                        onChange={(newValue) => setEditFormData(prev => ({ ...prev, dueDate: newValue }))}
                                        slotProps={{
                                          textField: { size: 'small', fullWidth: true, sx: { borderRadius: 2 } }
                                        }}
                                      />
                                    </LocalizationProvider>
                                  </TableCell>
                                  <TableCell>
                                    <FormControl fullWidth size="small">
                                      <InputLabel>Assignment Type</InputLabel>
                                      <Select
                                        value={editFormData.assignmentType}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, assignmentType: e.target.value }))}
                                        label="Assignment Type"
                                        sx={{ borderRadius: 2 }}
                                      >
                                        <MenuItem value="Homework">Homework</MenuItem>
                                        <MenuItem value="Project">Project</MenuItem>
                                        <MenuItem value="Quiz">Quiz</MenuItem>
                                        <MenuItem value="Essay">Essay</MenuItem>
                                        <MenuItem value="Presentation">Presentation</MenuItem>
                                      </Select>
                                    </FormControl>
                                  </TableCell>
                                  <TableCell>
                                    <TextField
                                      type="number"
                                      value={editFormData.maxMarks}
                                      onChange={(e) => setEditFormData(prev => ({ ...prev, maxMarks: e.target.value }))}
                                      size="small"
                                      fullWidth
                                      inputProps={{ min: 0 }}
                                      sx={{ borderRadius: 2 }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <FormControl fullWidth size="small">
                                      <InputLabel>Submission Type</InputLabel>
                                      <Select
                                        value={editFormData.submissionType}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, submissionType: e.target.value }))}
                                        label="Submission Type"
                                        sx={{ borderRadius: 2 }}
                                      >
                                        <MenuItem value="Online">Online</MenuItem>
                                        <MenuItem value="In-Person">In-Person</MenuItem>
                                        <MenuItem value="Both">Both</MenuItem>
                                      </Select>
                                    </FormControl>
                                  </TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Switch
                                        checked={editFormData.lateSubmissionAllowed}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, lateSubmissionAllowed: e.target.checked }))}
                                      />
                                      {editFormData.lateSubmissionAllowed && (
                                        <TextField
                                          type="number"
                                          value={editFormData.gracePeriodDays}
                                          onChange={(e) => setEditFormData(prev => ({ ...prev, gracePeriodDays: e.target.value }))}
                                          size="small"
                                          sx={{ width: 80, borderRadius: 2 }}
                                          inputProps={{ min: 0 }}
                                        />
                                      )}
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <IconButton
                                      onClick={() => handleEditSave(assignment.id)}
                                      sx={{ color: '#4caf50', '&:hover': { bgcolor: '#e8f5e9' } }}
                                    >
                                      <SaveIcon />
                                    </IconButton>
                                    <IconButton
                                      onClick={handleEditCancel}
                                      sx={{ color: '#f44336', '&:hover': { bgcolor: '#ffebee' } }}
                                    >
                                      <CancelIcon />
                                    </IconButton>
                                  </TableCell>
                                </>
                              ) : (
                                <>
                                  <TableCell sx={{ fontWeight: 500, color: '#1a237e' }}>{assignment.title}</TableCell>
                                  <TableCell>{assignment.subject}</TableCell>
                                  <TableCell>{assignment.standard}</TableCell>
                                  <TableCell>{assignment.section}</TableCell>
                                  <TableCell>{assignment.dueDate ? dayjs(assignment.dueDate).format('MMM D, YYYY') : 'Not set'}</TableCell>
                                  <TableCell>{assignment.assignmentType}</TableCell>
                                  <TableCell>{assignment.maxMarks}</TableCell>
                                  <TableCell>{assignment.submissionType}</TableCell>
                                  <TableCell>
                                    {assignment.lateSubmissionAllowed
                                      ? `Allowed (${assignment.gracePeriodDays} days)`
                                      : 'Not Allowed'}
                                  </TableCell>
                                  <TableCell>
                                    <IconButton
                                      onClick={() => handlePreview(assignment)}
                                      sx={{ color: '#1a237e', '&:hover': { bgcolor: '#e8eaf6' } }}
                                    >
                                      <VisibilityIcon />
                                    </IconButton>
                                    <IconButton
                                      onClick={() => handleEditClick(assignment)}
                                      sx={{ color: '#4caf50', '&:hover': { bgcolor: '#e8f5e9' } }}
                                    >
                                      <EditIcon />
                                    </IconButton>
                                    <IconButton
                                      onClick={() => {
                                        setDeleteAssignmentId(assignment.id);
                                        setOpenDeleteDialog(true);
                                      }}
                                      sx={{ color: '#f44336', '&:hover': { bgcolor: '#ffebee' } }}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </TableCell>
                                </>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Pagination
                      count={Math.ceil(assignments.length / ITEMS_PER_PAGE)}
                      page={page}
                      onChange={(e, value) => setPage(value)}
                      sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}
                      color="primary"
                    />
                  </>
                ) : (
                  <Alert
                    severity="info"
                    sx={{
                      borderRadius: 2,
                      bgcolor: '#e3f2fd',
                      color: '#0d47a1',
                      '& .MuiAlert-icon': { color: '#0d47a1' }
                    }}
                  >
                    No assignments created yet.
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>
        <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: '#1a237e', color: '#fff' }}>Assignment Preview</DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {previewData && (
              <>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a237e' }}>{previewData.title}</Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  {previewData.assignmentType} | Max Marks: {previewData.maxMarks}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2"><strong>Subject:</strong> {previewData.subject}</Typography>
                  <Typography variant="body2"><strong>Standard:</strong> {previewData.standard}</Typography>
                  <Typography variant="body2"><strong>Section:</strong> {previewData.section}</Typography>
                  <Typography variant="body2"><strong>Due Date:</strong> {previewData.dueDate ? dayjs(previewData.dueDate).format('MMM D, YYYY') : 'Not set'}</Typography>
                  <Typography variant="body2"><strong>Submission Type:</strong> {previewData.submissionType}</Typography>
                  <Typography variant="body2"><strong>Late Submission:</strong> {previewData.lateSubmissionAllowed ? `Allowed (${previewData.gracePeriodDays} days grace)` : 'Not Allowed'}</Typography>
                  <Typography variant="body1" sx={{ mt: 2, fontWeight: 600 }}>Description:</Typography>
                  <Typography variant="body2">{previewData.description || 'No description provided'}</Typography>
                  <Typography variant="body1" sx={{ mt: 2, fontWeight: 600 }}>Rubric/Criteria:</Typography>
                  <Typography variant="body2">{previewData.rubric || 'No rubric provided'}</Typography>
                </Box>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewOpen(false)} sx={{ borderRadius: 2 }}>Close</Button>
          </DialogActions>
        </Dialog>
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
          <DialogTitle sx={{ bgcolor: '#f44336', color: '#fff' }}>Confirm Delete</DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Typography>Are you sure you want to delete this assignment? This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button onClick={handleDelete} color="error" sx={{ borderRadius: 2 }}>Delete</Button>
          </DialogActions>
        </Dialog>
        <Dialog open={openSubmitDialog} onClose={() => setOpenSubmitDialog(false)}>
          <DialogTitle sx={{ bgcolor: '#1a237e', color: '#fff' }}>Confirm Submission</DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Typography>Are you sure you want to create and assign this assignment to {assignToAll ? students.length : selectedStudents.length} student(s)?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenSubmitDialog(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#1a237e', borderRadius: 2, '&:hover': { bgcolor: '#131a5b' } }}>Confirm</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Fade>
  );
}