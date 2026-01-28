import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  LinearProgress,
  Divider,
  IconButton,
  Chip,
  Snackbar,
  Alert,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  InputAdornment
} from '@mui/material';
import { Upload as UploadIcon, FilterAlt as FilterIcon, Add as AddIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Custom MUI theme
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    success: { main: '#2e7d32' },
    background: { default: '#f5f5f5' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          transition: 'all 0.2s',
          '&:hover': { transform: 'translateY(-2px)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { transition: 'all 0.3s', '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } },
      },
    },
  },
});

const SyllabusAndLessonPlanTracker = () => {
  // State for form inputs
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [lessonPlanName, setLessonPlanName] = useState('');
  const [topics, setTopics] = useState([]);
  const [newTopic, setNewTopic] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [filterValues, setFilterValues] = useState({
    filterYear: '',
    filterClass: '',
    filterTerm: '',
    filterSubject: '',
    searchQuery: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, index: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Sample data for dropdowns
  const classes = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'];
  const subjects = ['Mathematics', 'Science', 'English', 'History', 'Geography'];
  const terms = ['Term 1', 'Term 2', 'Term 3'];
  const years = ['2022-2023', '2023-2024', '2024-2025'];

  // Calculate completion percentage
  const completionPercentage = topics.length > 0
    ? Math.round((topics.filter(t => t.completed).length / topics.length) * 100)
    : 0;

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!selectedClass) errors.selectedClass = 'Class is required';
    if (!selectedSubject) errors.selectedSubject = 'Subject is required';
    if (!selectedTerm) errors.selectedTerm = 'Term is required';
    if (!academicYear) errors.academicYear = 'Academic Year is required';
    if (!lessonPlanName) errors.lessonPlanName = 'Lesson Plan Name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle topic completion toggle
  const handleToggle = (index) => () => {
    const newTopics = [...topics];
    newTopics[index].completed = !newTopics[index].completed;
    setTopics(newTopics);
    setSnackbar({ open: true, message: `Topic marked as ${newTopics[index].completed ? 'completed' : 'incomplete'}`, severity: 'success' });
  };

  // Add new topic
  const handleAddTopic = () => {
    if (newTopic.trim()) {
      setTopics([...topics, { name: newTopic, completed: false }]);
      setNewTopic('');
      setSnackbar({ open: true, message: 'Topic added successfully', severity: 'success' });
    } else {
      setSnackbar({ open: true, message: 'Please enter a topic name', severity: 'error' });
    }
  };

  // Open delete confirmation dialog
  const handleOpenDeleteDialog = (index) => {
    setDeleteDialog({ open: true, index });
  };

  // Remove topic
  const handleRemoveTopic = () => {
    const newTopics = [...topics];
    newTopics.splice(deleteDialog.index, 1);
    setTopics(newTopics);
    setDeleteDialog({ open: false, index: null });
    setSnackbar({ open: true, message: 'Topic removed successfully', severity: 'success' });
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
      setUploadedFile(file);
      setSnackbar({ open: true, message: 'File uploaded successfully', severity: 'success' });
    } else {
      setSnackbar({ open: true, message: 'Please upload a PDF or Word document', severity: 'error' });
    }
  };

  // Handle filter changes
  const handleFilterChange = (prop) => (event) => {
    setFilterValues({ ...filterValues, [prop]: event.target.value });
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilterValues({ filterYear: '', filterClass: '', filterTerm: '', filterSubject: '', searchQuery: '' });
    setSnackbar({ open: true, message: 'Filters cleared', severity: 'info' });
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log({
      class: selectedClass,
      subject: selectedSubject,
      term: selectedTerm,
      academicYear,
      lessonPlanName,
      topics,
      uploadedFile,
    });
    setSnackbar({ open: true, message: 'Lesson plan saved successfully', severity: 'success' });
    setIsSubmitting(false);
    // Reset form
    setSelectedClass('');
    setSelectedSubject('');
    setSelectedTerm('');
    setAcademicYear('');
    setLessonPlanName('');
    setTopics([]);
    setUploadedFile(null);
    setFormErrors({});
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ bgcolor: 'primary.main', p: 3, borderRadius: 2, mb: 4 }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', color: 'white' }}>
            Syllabus & Lesson Plan Tracker
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Upload Section */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <form onSubmit={handleSubmit}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  📋 Lesson Plan Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={!!formErrors.selectedClass}>
                      <InputLabel id="class-label">Class</InputLabel>
                      <Select
                        labelId="class-label"
                        value={selectedClass}
                        label="Class"
                        onChange={(e) => setSelectedClass(e.target.value)}
                        required
                        aria-describedby="class-error"
                      >
                        {classes.map((cls) => (
                          <MenuItem key={cls} value={cls}>{cls}</MenuItem>
                        ))}
                      </Select>
                      {formErrors.selectedClass && (
                        <Typography variant="caption" color="error" id="class-error">
                          {formErrors.selectedClass}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={!!formErrors.selectedSubject}>
                      <InputLabel id="subject-label">Subject</InputLabel>
                      <Select
                        labelId="subject-label"
                        value={selectedSubject}
                        label="Subject"
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        required
                        aria-describedby="subject-error"
                      >
                        {subjects.map((subj) => (
                          <MenuItem key={subj} value={subj}>{subj}</MenuItem>
                        ))}
                      </Select>
                      {formErrors.selectedSubject && (
                        <Typography variant="caption" color="error" id="subject-error">
                          {formErrors.selectedSubject}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={!!formErrors.selectedTerm}>
                      <InputLabel id="term-label">Term</InputLabel>
                      <Select
                        labelId="term-label"
                        value={selectedTerm}
                        label="Term"
                        onChange={(e) => setSelectedTerm(e.target.value)}
                        required
                        aria-describedby="term-error"
                      >
                        {terms.map((term) => (
                          <MenuItem key={term} value={term}>{term}</MenuItem>
                        ))}
                      </Select>
                      {formErrors.selectedTerm && (
                        <Typography variant="caption" color="error" id="term-error">
                          {formErrors.selectedTerm}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={!!formErrors.academicYear}>
                      <InputLabel id="year-label">Academic Year</InputLabel>
                      <Select
                        labelId="year-label"
                        value={academicYear}
                        label="Academic Year"
                        onChange={(e) => setAcademicYear(e.target.value)}
                        required
                        aria-describedby="year-error"
                      >
                        {years.map((year) => (
                          <MenuItem key={year} value={year}>{year}</MenuItem>
                        ))}
                      </Select>
                      {formErrors.academicYear && (
                        <Typography variant="caption" color="error" id="year-error">
                          {formErrors.academicYear}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Lesson Plan Name"
                      value={lessonPlanName}
                      onChange={(e) => setLessonPlanName(e.target.value)}
                      required
                      error={!!formErrors.lessonPlanName}
                      helperText={formErrors.lessonPlanName}
                      aria-describedby="lesson-plan-name-error"
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  📝 Topics
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="Add new topic"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTopic()}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={handleAddTopic} color="primary">
                            <AddIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <List dense>
                  {topics.map((topic, index) => (
                    <ListItem
                      key={index}
                      sx={{ bgcolor: topic.completed ? 'success.light' : 'background.paper', borderRadius: 1, mb: 1 }}
                    >
                      <Checkbox
                        edge="start"
                        checked={topic.completed}
                        onChange={handleToggle(index)}
                        color="success"
                        inputProps={{ 'aria-label': `Mark ${topic.name} as completed` }}
                      />
                      <ListItemText
                        primary={topic.name}
                        sx={{ textDecoration: topic.completed ? 'line-through' : 'none' }}
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Delete Topic">
                          <IconButton edge="end" onClick={() => handleOpenDeleteDialog(index)} aria-label={`Delete ${topic.name}`}>
                            <DeleteIcon color="error" />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>

                {topics.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Completion: {completionPercentage}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={completionPercentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': { bgcolor: 'success.main' },
                      }}
                    />
                  </Box>
                )}

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  📄 File Upload (Optional)
                </Typography>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  sx={{ mr: 2 }}
                  aria-label="Upload lesson plan file"
                >
                  Upload File
                  <input
                    type="file"
                    hidden
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx"
                  />
                </Button>
                {uploadedFile && (
                  <Chip
                    label={`${uploadedFile.name} (${(uploadedFile.size / 1024).toFixed(2)} KB)`}
                    onDelete={() => setUploadedFile(null)}
                    variant="outlined"
                    color="primary"
                    sx={{ mt: 1 }}
                  />
                )}

                <Box sx={{ mt: 3 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={isSubmitting}
                    sx={{ minWidth: 150 }}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Lesson Plan'}
                  </Button>
                </Box>
              </form>
            </Paper>
          </Grid>

          {/* Filter and Status Section */}
          <Grid item xs={12} md={4}>
            <Box sx={{ position: 'sticky', top: 20 }}>
              <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <FilterIcon sx={{ mr: 1 }} /> Filter View
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search lesson plans..."
                      value={filterValues.searchQuery}
                      onChange={handleFilterChange('searchQuery')}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                      aria-label="Search lesson plans"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Academic Year</InputLabel>
                      <Select
                        value={filterValues.filterYear}
                        label="Academic Year"
                        onChange={handleFilterChange('filterYear')}
                        aria-label="Filter by academic year"
                      >
                        <MenuItem value=""><em>All</em></MenuItem>
                        {years.map((year) => (
                          <MenuItem key={year} value={year}>{year}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Class</InputLabel>
                      <Select
                        value={filterValues.filterClass}
                        label="Class"
                        onChange={handleFilterChange('filterClass')}
                        aria-label="Filter by class"
                      >
                        <MenuItem value=""><em>All</em></MenuItem>
                        {classes.map((cls) => (
                          <MenuItem key={cls} value={cls}>{cls}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Term</InputLabel>
                      <Select
                        value={filterValues.filterTerm}
                        label="Term"
                        onChange={handleFilterChange('filterTerm')}
                        aria-label="Filter by term"
                      >
                        <MenuItem value=""><em>All</em></MenuItem>
                        {terms.map((term) => (
                          <MenuItem key={term} value={term}>{term}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Subject</InputLabel>
                      <Select
                        value={filterValues.filterSubject}
                        label="Subject"
                        onChange={handleFilterChange('filterSubject')}
                        aria-label="Filter by subject"
                      >
                        <MenuItem value=""><em>All</em></MenuItem>
                        {subjects.map((subj) => (
                          <MenuItem key={subj} value={subj}>{subj}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Stack direction="row" spacing={1}>
                      <Button variant="outlined" fullWidth sx={{ mt: 1 }}>
                        Apply Filters
                      </Button>
                      <Button variant="text" fullWidth sx={{ mt: 1 }} onClick={handleClearFilters}>
                        Clear
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>

              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  📈 Overview
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Lesson Plans
                  </Typography>
                  <Typography variant="h5">24</Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Average Completion
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={65}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'grey.200',
                      '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' },
                      mt: 1,
                    }}
                  />
                  <Typography variant="body2" sx={{ textAlign: 'right', mt: 0.5 }}>
                    65%
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Recent Activity
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Mathematics - Term 1"
                      secondary="Updated 2 days ago - 85% complete"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Science - Term 2"
                      secondary="Updated 1 week ago - 45% complete"
                    />
                  </ListItem>
                </List>
              </Paper>
            </Box>
          </Grid>
        </Grid>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, index: null })}
          aria-labelledby="delete-dialog-title"
        >
          <DialogTitle id="delete-dialog-title">Delete Topic</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this topic? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false, index: null })}>Cancel</Button>
            <Button onClick={handleRemoveTopic} color="error" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </ThemeProvider>
  );
};

export default SyllabusAndLessonPlanTracker;