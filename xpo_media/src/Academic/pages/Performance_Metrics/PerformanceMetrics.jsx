import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  Container,
  useTheme,
} from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// Dummy data for dropdowns
const academicYears = ['2023-24', '2024-25', '2025-26'];
const academicPeriods = ['First Term', 'Second Term', 'Third Term'];
const standards = ['Class 10', 'Class 11', 'Class 12'];
const sections = ['A', 'B', 'C'];
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const examNames = ['Midterm', 'Final'];
const subjects = ['Math', 'Science', 'English'];

// Dummy student data keyed by filters (simulate API)
const dummyStudentData = {
  '2023-24|First Term|Class 10|A': [
    { id: 'S101', name: 'John Doe', standard: 'Class 10', section: 'A' },
    { id: 'S102', name: 'Jane Smith', standard: 'Class 10', section: 'A' },
  ],
  '2023-24|Second Term|Class 11|B': [
    { id: 'S201', name: 'Alice Johnson', standard: 'Class 11', section: 'B' },
  ],
};

// Dummy detailed attendance data structure for each student
const dummyPerformanceDetails = {
  S101: {
    'January': {
      attendanceSummary: {
        day: { present: 6, absent: 1, late: 0, leave: 0, total: 7 }, // 7 periods in a day
        week: { present: 30, absent: 6, late: 0, leave: 0, total: 36 }, // 6 days in a week
        month: { present: 150, absent: 30, late: 5, leave: 5, total: 190 }, // 30 days in a month (example)
      },
      disciplinaryRecord: [
        {
          date: '2024-01-15',
          studentName: 'John Doe',
          section: 'A',
          standard: 'Class 10',
          misconductCategory: 'Bullying',
          severity: 'High',
          action: 'Suspension',
          uploadedDocuments: 'report.pdf'
        },
      ],
      assignments: [
        {
          academicYear: '2023-24',
          academicPeriod: 'First Term',
          title: 'Math HW1',
          subject: 'Math',
          dueDate: '2024-01-20',
          teacherName: 'Mr. Smith',
          status: 'Submitted',
          grade: 'A',
          submittedDate: '2024-01-19'
        },
        {
          academicYear: '2023-24',
          academicPeriod: 'First Term',
          title: 'Science Project',
          subject: 'Science',
          dueDate: '2024-01-25',
          teacherName: 'Mrs. Johnson',
          status: 'Pending',
        },
      ],
    },
    'February': {
      attendanceSummary: {
        day: { present: 5, absent: 2, late: 0, leave: 0, total: 7 },
        week: { present: 25, absent: 11, late: 1, leave: 1, total: 36 },
        month: { present: 140, absent: 40, late: 3, leave: 3, total: 186 },
      },
      disciplinaryRecord: [
        {
          date: '2024-02-20',
          studentName: 'John Doe',
          section: 'A',
          standard: 'Class 10',
          misconductCategory: 'Disrespect',
          severity: 'Medium',
          action: 'Detention',
          uploadedDocuments: 'note.txt'
        },
      ],
      assignments: [
        {
          academicYear: '2023-24',
          academicPeriod: 'First Term',
          title: 'Math Quiz',
          subject: 'Math',
          dueDate: '2024-02-10',
          teacherName: 'Mr. Smith',
          status: 'Submitted',
          grade: 'B',
          submittedDate: '2024-02-09'
        },
        {
          academicYear: '2023-24',
          academicPeriod: 'First Term',
          title: 'English Essay',
          subject: 'English',
          dueDate: '2024-02-15',
          teacherName: 'Ms. Davis',
          status: 'Assigned',
        },
      ],
    },
    section: 'A',
    name: 'John Doe',
    standard: 'Class 10',
    examPerformance: [
      { academicYear: '2023-24', academicPeriod: 'First Term', examName: 'Midterm', resultSummary: 75, Math: 70, Science: 80 },
      { academicYear: '2023-24', academicPeriod: 'Second Term', examName: 'Midterm', resultSummary: 80, Math: 75, Science: 85 },
    ],
  },
  S102: {
    'January': {
      attendanceSummary: {
        day: { present: 7, absent: 0, late: 0, leave: 0, total: 7 },
        week: { present: 36, absent: 0, late: 0, leave: 0, total: 36 },
        month: { present: 180, absent: 0, late: 0, leave: 0, total: 180 },
      },
      disciplinaryRecord: [],
      assignments: [],
    },
    'February': {
      attendanceSummary: {
        day: { present: 7, absent: 0, late: 0, leave: 0, total: 7 },
        week: { present: 36, absent: 0, late: 0, leave: 0, total: 36 },
        month: { present: 180, absent: 0, late: 0, leave: 0, total: 180 },
      },
      disciplinaryRecord: [],
      assignments: [],
    },
    section: 'A',
    name: 'Jane Smith',
    standard: 'Class 10',
    examPerformance: [
      { academicYear: '2023-24', academicPeriod: 'First Term', examName: 'Midterm', resultSummary: 85, Math: 80, Science: 90 },
      { academicYear: '2023-24', academicPeriod: 'Second Term', examName: 'Midterm', resultSummary: 90, Math: 85, Science: 95 },
    ],
  },
  S201: {
    'January': {
      attendanceSummary: {
        day: { present: 5, absent: 2, late: 0, leave: 0, total: 7 },
        week: { present: 24, absent: 12, late: 0, leave: 0, total: 36 },
        month: { present: 120, absent: 60, late: 2, leave: 2, total: 184 },
      },
      disciplinaryRecord: [
        {
          date: '2024-01-13',
          studentName: 'Alice Johnson',
          section: 'B',
          standard: 'Class 11',
          misconductCategory: 'Disruptive',
          severity: 'Medium',
          action: 'Detention',
          uploadedDocuments: 'statement.pdf'
        },
      ],
      assignments: [],
    },
    'February': {
      attendanceSummary: {
        day: { present: 4, absent: 3, late: 1, leave: 1, total: 9 },
        week: { present: 20, absent: 16, late: 2, leave: 2, total: 40 },
        month: { present: 100, absent: 80, late: 4, leave: 4, total: 188 },
      },
      disciplinaryRecord: [],
      assignments: [],
    },
    section: 'B',
    name: 'Alice Johnson',
    standard: 'Class 11',
    examPerformance: [
      { academicYear: '2023-24', academicPeriod: 'First Term', examName: 'Midterm', resultSummary: 65, Math: 60, Science: 70 },
      { academicYear: '2023-24', examName: 'Midterm', academicPeriod: 'Second Term', resultSummary: 70, Math: 65, Science: 75 },
    ],
  },
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const getAttendancePieData = (summary) => [
  { name: 'Present', value: summary.present },
  { name: 'Absent', value: summary.absent },
  { name: 'Late', value: summary.late },
  { name: 'Leave', value: summary.leave },
];

const getAttendancePercentage = (present, total) =>
  total > 0 ? ((present / total) * 100).toFixed(2) : '0.00';

const PerformanceMetrics = () => {
  const theme = useTheme();

  // Filters state
  const [year, setYear] = useState('');
  const [period, setPeriod] = useState('');
  const [standard, setStandard] = useState('');
  const [section, setSection] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [selectedAcademicPeriod, setSelectedAcademicPeriod] = useState('First Term');

  // Students list and search
  const [students, setStudents] = useState([]);
  const [searchId, setSearchId] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);

  // Selected student for performance view
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Tab state for performance details
  const [tabIndex, setTabIndex] = useState(0);
  const [assignmentFilter, setAssignmentFilter] = useState('all'); // 'all', 'assigned', 'pending', 'submitted', 'overdue'


  // Loading state simulating fetch
  const [loading, setLoading] = useState(false);

  // Handle Fetch Data button click
  const handleFetchData = () => {
    if (!year || !period || !standard || !section) {
      alert('Please select all filters before fetching data.');
      return;
    }
    setLoading(true);
    setSelectedStudent(null);
    setTabIndex(0);
    setTimeout(() => {
      const key = `${year}|${period}|${standard}|${section}`;
      const data = dummyStudentData[key] || [];
      setStudents(data);
      setFilteredStudents(data);
      setLoading(false);
    }, 1000);
  };

  // Filter students by searchId
  useEffect(() => {
    if (!searchId) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter((stu) =>
        stu.id.toLowerCase().includes(searchId.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchId, students]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const getFilteredAssignments = (assignments) => {
    const today = new Date();

    switch (assignmentFilter) {
      case 'assigned':
        return assignments.filter(a => a.status === 'Assigned');
      case 'pending':
        return assignments.filter(a => a.status === 'Pending');
      case 'submitted':
        return assignments.filter(a => a.status === 'Submitted');
      case 'overdue':
        return assignments.filter(a => a.dueDate && new Date(a.dueDate) < today && a.status !== 'Submitted');
      default:
        return assignments;
    }
  };

  // Render performance details for selected student
  const renderPerformanceDetails = () => {
    if (!selectedStudent) return null;

    const studentDetails = dummyPerformanceDetails[selectedStudent.id];
    const monthDetails = studentDetails ? studentDetails[selectedMonth] : null;

    if (!monthDetails) {
      return (
        <Typography mt={2} color="error">
          No performance details found for this student in {selectedMonth}.
        </Typography>
      );
    }

    return (
      <Box mt={3}>
        <Tabs value={tabIndex} onChange={handleTabChange} aria-label="performance tabs">
          <Tab label="Attendance History" />
          <Tab label="Disciplinary Record" />
          <Tab label="Exam Performance" />
          <Tab label="Assignments & Homeworks" />
        </Tabs>

        <Box mt={2}>
          {/* Attendance History Tab */}
          {tabIndex === 0 && (
            <Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="month-select-label">Select Month</InputLabel>
                <Select
                  labelId="month-select-label"
                  value={selectedMonth}
                  label="Select Month"
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {months.map((month) => (
                    <MenuItem key={month} value={month}>{month}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Grid container spacing={2}>
                <Grid item xs={12} md={7}>
                  <TableContainer component={Paper}>
                    <Table size="small" aria-label="attendance summary table">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                          <TableCell sx={{ color: theme.palette.primary.contrastText, fontWeight: 'bold' }}>Student Name</TableCell>
                          <TableCell sx={{ color: theme.palette.primary.contrastText, fontWeight: 'bold' }}>Section</TableCell>
                          <TableCell sx={{ color: theme.palette.primary.contrastText, fontWeight: 'bold' }}>Period</TableCell>
                          <TableCell sx={{ color: theme.palette.primary.contrastText, fontWeight: 'bold' }}>Attendance %</TableCell>
                          <TableCell sx={{ color: theme.palette.primary.contrastText, fontWeight: 'bold' }}>Present</TableCell>
                          <TableCell sx={{ color: theme.palette.primary.contrastText, fontWeight: 'bold' }}>Absent</TableCell>
                          <TableCell sx={{ color: theme.palette.primary.contrastText, fontWeight: 'bold' }}>Late</TableCell>
                          <TableCell sx={{ color: theme.palette.primary.contrastText, fontWeight: 'bold' }}>Leave</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {['day', 'week', 'month'].map((periodKey, idx) => {
                          const periodLabel = periodKey.charAt(0).toUpperCase() + periodKey.slice(1);
                          const summary = monthDetails.attendanceSummary[periodKey];
                          return (
                            <TableRow
                              key={periodKey}
                            >
                              <TableCell>{monthDetails.name || studentDetails.name}</TableCell>
                              <TableCell>{monthDetails.section || studentDetails.section}</TableCell>
                              <TableCell>{periodLabel}</TableCell>
                              <TableCell>
                                {getAttendancePercentage(summary.present, summary.total)}%
                              </TableCell>
                              <TableCell>{summary.present}</TableCell>
                              <TableCell>{summary.absent}</TableCell>
                              <TableCell>{summary.late}</TableCell>
                              <TableCell>{summary.leave}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Typography variant="subtitle1" align="center" gutterBottom>
                    Attendance ({selectedMonth}) Breakdown
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={getAttendancePieData(monthDetails.attendanceSummary.month)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {getAttendancePieData(monthDetails.attendanceSummary.month).map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Disciplinary Record Tab */}
          {tabIndex === 1 && (
            <Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="month-select-label">Select Month</InputLabel>
                <Select
                  labelId="month-select-label"
                  value={selectedMonth}
                  label="Select Month"
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {months.map((month) => (
                    <MenuItem key={month} value={month}>{month}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {monthDetails && monthDetails.disciplinaryRecord && monthDetails.disciplinaryRecord.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table size="small" aria-label="disciplinary record table">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                        <TableCell sx={{ color: theme.palette.primary.contrastText }}>Date</TableCell>
                        <TableCell sx={{ color: theme.palette.primary.contrastText }}>Student Name</TableCell>
                        <TableCell sx={{ color: theme.palette.primary.contrastText }}>Section</TableCell>
                        <TableCell sx={{ color: theme.palette.primary.contrastText }}>Standard</TableCell>
                        <TableCell sx={{ color: theme.palette.primary.contrastText }}>Misconduct Category</TableCell>
                        <TableCell sx={{ color: theme.palette.primary.contrastText }}>Severity</TableCell>
                        <TableCell sx={{ color: theme.palette.primary.contrastText }}>Action</TableCell>
                        <TableCell sx={{ color: theme.palette.primary.contrastText }}>Uploaded Documents</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {monthDetails.disciplinaryRecord.map((record, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{record.date}</TableCell>
                          <TableCell>{record.studentName}</TableCell>
                          <TableCell>{record.section}</TableCell>
                          <TableCell>{record.standard}</TableCell>
                          <TableCell>{record.misconductCategory}</TableCell>
                          <TableCell>{record.severity}</TableCell>
                          <TableCell>{record.action}</TableCell>
                          <TableCell>{record.uploadedDocuments}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography>No disciplinary records found for {selectedMonth}.</Typography>
              )}
            </Box>
          )}

          {/* Exam Performance Tab */}
          {tabIndex === 2 && (
            <Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="academic-period-select-label">Select Academic Period</InputLabel>
                <Select
                  labelId="academic-period-select-label"
                  value={selectedAcademicPeriod}
                  label="Select Academic Period"
                  onChange={(e) => setSelectedAcademicPeriod(e.target.value)}
                >
                  {academicPeriods.map((period) => (
                    <MenuItem key={period} value={period}>{period}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TableContainer component={Paper}>
                <Table size="small" aria-label="exam performance table">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                      <TableCell sx={{ color: theme.palette.primary.contrastText }}>Student Name</TableCell>
                      <TableCell sx={{ color: theme.palette.primary.contrastText }}>Section</TableCell>
                      <TableCell sx={{ color: theme.palette.primary.contrastText }}>Standard</TableCell>
                      <TableCell sx={{ color: theme.palette.primary.contrastText }}>Academic Year</TableCell>
                      <TableCell sx={{ color: theme.palette.primary.contrastText }}>Academic Period</TableCell>
                      <TableCell sx={{ color: theme.palette.primary.contrastText }}>Exam Name</TableCell>
                      <TableCell sx={{ color: theme.palette.primary.contrastText }}>Result Summary</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentDetails.examPerformance
                      .filter(exam => exam.academicPeriod === selectedAcademicPeriod)
                      .map((record, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{studentDetails.name}</TableCell>
                          <TableCell>{studentDetails.section}</TableCell>
                          <TableCell>{studentDetails.standard}</TableCell>
                          <TableCell>{record.academicYear}</TableCell>
                          <TableCell>{record.academicPeriod}</TableCell>
                          <TableCell>{record.examName}</TableCell>
                          <TableCell>{record.resultSummary}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Grid container spacing={2} mt={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" align="center" gutterBottom>
                    Exam Performance Pie Chart
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={studentDetails.examPerformance
                          .filter(exam => exam.academicPeriod === selectedAcademicPeriod)
                          .map(exam => ({ name: exam.examName, value: exam.resultSummary }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {studentDetails.examPerformance
                          .filter(exam => exam.academicPeriod === selectedAcademicPeriod)
                          .map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" align="center" gutterBottom>
                    Exam Performance Bar Chart
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={studentDetails.examPerformance
                        .filter(exam => exam.academicPeriod === selectedAcademicPeriod)}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="examName" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="resultSummary" fill={theme.palette.primary.main} />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Assignments & Homeworks Tab */}
          {tabIndex === 3 && (
            <Box>
              <Grid container spacing={2} mb={2} alignItems="center">
                <Grid item>
                  <FormControl>
                    <InputLabel id="assignment-filter-label">Filter</InputLabel>
                    <Select
                      labelId="assignment-filter-label"
                      value={assignmentFilter}
                      label="Filter"
                      onChange={(e) => setAssignmentFilter(e.target.value)}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="assigned">Assigned</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="submitted">Submitted</MenuItem>
                      <MenuItem value="overdue">Overdue</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item>
                  <FormControl>
                    <InputLabel id="month-select-label">Select Month</InputLabel>
                    <Select
                      labelId="month-select-label"
                      value={selectedMonth}
                      label="Select Month"
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                      {months.map((month) => (
                        <MenuItem key={month} value={month}>{month}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <TableContainer component={Paper}>
                <Table size="small" aria-label="assignments table">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                      <TableCell sx={{ color: theme.palette.primary.contrastText }}>Title</TableCell>
                      <TableCell sx={{ color: theme.palette.primary.contrastText }}>Subject</TableCell>
                      <TableCell sx={{ color: theme.palette.primary.contrastText }}>Due Date</TableCell>
                      <TableCell sx={{ color: theme.palette.primary.contrastText }}>Teacher Name</TableCell>
                      <TableCell sx={{ color: theme.palette.primary.contrastText }}>Status</TableCell>
                      <TableCell sx={{ color: theme.palette.primary.contrastText }}>Grade</TableCell>
                      <TableCell sx={{ color: theme.palette.primary.contrastText }}>Submitted Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getFilteredAssignments(monthDetails.assignments).map((record, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{record.title}</TableCell>
                        <TableCell>{record.subject}</TableCell>
                        <TableCell>{record.dueDate}</TableCell>
                        <TableCell>{record.teacherName}</TableCell>
                        <TableCell>{record.status}</TableCell>
                        <TableCell>{record.grade || '-'}</TableCell>
                        <TableCell>{record.submittedDate || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Container sx={{ mt: 4, mb: 4, height: '90vh', overflowY: 'auto', margin: '0' }}>
      <Typography variant="h5" sx={{marginTop:"30px"}} mb={3} >
        Performance Metrics
      </Typography>

      {/* Filter Dropdowns */}
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <FormControl size='small'>
            <InputLabel>Academic Year</InputLabel>
            <Select
              sx={{width:"170px"}}
              value={year}
              label="Academic Year"
              onChange={(e) => setYear(e.target.value)}
              size="small"
            >
              {academicYears.map((yr) => (
                <MenuItem key={yr} value={yr}>
                  {yr}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FormControl size='small'>
            <InputLabel>Academic Period</InputLabel>
            <Select
             sx={{width:"170px"}}
              value={period}
              label="Academic Period"
              onChange={(e) => setPeriod(e.target.value)}
              size="small"
            >
              {academicPeriods.map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FormControl size='small'>
            <InputLabel>Standard</InputLabel>
            <Select
             sx={{width:"150px"}}
              value={standard}
              label="Standard"
              onChange={(e) => setStandard(e.target.value)}
              size="small"
            >
              {standards.map((std) => (
                <MenuItem key={std} value={std}>
                  {std}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FormControl size='small'>
            <InputLabel>Section</InputLabel>
            <Select
             sx={{width:"150px"}}
              value={section}
              label="Section"
              onChange={(e) => setSection(e.target.value)}
              size="small"
            >
              {sections.map((sec) => (
                <MenuItem key={sec} value={sec}>
                  {sec}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleFetchData}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Fetch Data'}
          </Button>
        </Grid>
      </Grid>

      {/* Search Input */}
      {students.length > 0 && (
        <Box mt={3} maxWidth={400}>
          <TextField
            label="Search by Unique ID"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            fullWidth
            size="small"
          />
        </Box>
      )}

      {/* Students Table */}
      <Box mt={3}>
        {loading ? (
          <Typography>Loading students...</Typography>
        ) : filteredStudents.length === 0 ? (
          <Typography>No students found. Please fetch data.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table aria-label="students table">
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                  <TableCell sx={{ color: theme.palette.primary.contrastText, fontWeight: 'bold' }}>Student Name</TableCell>
                  <TableCell sx={{ color: theme.palette.primary.contrastText, fontWeight: 'bold' }}>Standard</TableCell>
                  <TableCell sx={{ color: theme.palette.primary.contrastText }}>Section</TableCell>
                  <TableCell sx={{ color: theme.palette.primary.contrastText }}>Unique ID</TableCell>
                  <TableCell align="center" sx={{ color: theme.palette.primary.contrastText }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.map((stu, idx) => (
                  <TableRow
                    key={stu.id}
                  >
                    <TableCell>{stu.name}</TableCell>
                    <TableCell>{stu.standard}</TableCell>
                    <TableCell>{stu.section}</TableCell>
                    <TableCell>{stu.id}</TableCell>
                    <TableCell align="center">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setSelectedStudent(stu);
                          setTabIndex(0);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        sx={{ color: theme.palette.primary.main, borderColor: theme.palette.primary.main }}
                      >
                        View Performance
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Performance Details Section */}
      {selectedStudent && (
        <Box mt={5}>
          <Divider />
          <Typography variant="h5" mt={3} mb={2} align="center">
            Performance Details for {selectedStudent.name} ({selectedStudent.id})
          </Typography>
          {renderPerformanceDetails()}
        </Box>
      )}
    </Container>
  );
};

export default PerformanceMetrics;
