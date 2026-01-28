import React, { useState } from 'react';
import {
  Tabs, Tab, Box, Typography, Container, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Button, MenuItem, Select, InputLabel, FormControl
} from '@mui/material';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

// Mock Data (Replace with your actual data)
const mockAssignments = [
  { studentName: 'John Doe', title: 'Math Homework', academicPeriod: '2025', subject: 'Math', standard: '10', section: 'A', dueDate: '2025-04-30', materialLink: 'https://link.com', assignmentType: 'Hardcopy', assignedMarks: '50', teacherName: 'Mr. Smith', submissionDate: '2025-04-29', remarks: '' },
  { studentName: 'Jane Smith', title: 'Science Project', academicPeriod: '2025', subject: 'Science', standard: '10', section: 'B', dueDate: '2025-05-15', materialLink: 'https://link.com', assignmentType: 'Softcopy', assignedMarks: '40', teacherName: 'Ms. Johnson', submissionDate: '2025-05-14', remarks: '' },
  { studentName: 'Alice Johnson', title: 'English Essay', academicPeriod: '2025', subject: 'English', standard: '11', section: 'A', dueDate: '2025-05-05', materialLink: 'https://example.com', assignmentType: 'Hardcopy', assignedMarks: '60', teacherName: 'Mr. Brown', submissionDate: null, remarks: '' },
  { studentName: 'Bob Williams', title: 'History Report', academicPeriod: '2025', subject: 'History', standard: '11', section: 'B', dueDate: '2025-05-10', materialLink: 'https://example.com', assignmentType: 'Softcopy', assignedMarks: '55', teacherName: 'Ms. Davis', submissionDate: null, remarks: '' },
];

export default function Assignment_Management_Tabs() {
  const [tabValue, setTabValue] = useState(0);
  const [allAssignments, setAllAssignments] = useState(mockAssignments);
  const [selectedFilters, setSelectedFilters] = useState({
    subject: '',
    standard: '',
    section: '',
  });

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFilterChange = (filterType, value) => {
    setSelectedFilters({ ...selectedFilters, [filterType]: value });
  };

  // Filtered Assignments
  const filteredAssignments = allAssignments.filter((assignment) => {
    return (
      (!selectedFilters.subject || assignment.subject === selectedFilters.subject) &&
      (!selectedFilters.standard || assignment.standard === selectedFilters.standard) &&
      (!selectedFilters.section || assignment.section === selectedFilters.section)
    );
  });

  // Pending Assignments
  const pendingAssignments = filteredAssignments.filter(
    (assignment) => !assignment.submissionDate
  );

  // Submitted Assignments
  const submittedAssignments = filteredAssignments.filter(
    (assignment) => assignment.submissionDate
  );

  // Due Dates Summary (basic example)
  const upcomingDueDates = filteredAssignments
    .filter((assignment) => !assignment.submissionDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  // Submission History & Grades (simple display)
  const submissionHistory = filteredAssignments.filter(
    (assignment) => assignment.submissionDate
  );

  // Remarks / Feedback (basic example)
  const remarks = filteredAssignments.filter((assignment) => assignment.remarks);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, height: '90vh', overflowY: 'auto', margin: '0' }}>
      <Typography variant="h5" sx={{ color: "black", marginTop: "30px" }} gutterBottom>
        Assignment Management
      </Typography>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleChangeTab} aria-label="assignment management tabs">
            <Tab label="Assignments & Homework" {...a11yProps(0)} />
            <Tab label="Pending Assignments" {...a11yProps(1)} />
            <Tab label="Submitted Assignments" {...a11yProps(2)} />
            <Tab label="Due Dates Summary" {...a11yProps(3)} />
            <Tab label="Submission History & Grades" {...a11yProps(4)} />
            <Tab label="Remarks / Feedback" {...a11yProps(5)} />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6">All Assignments</Typography>

            {/* Filter Options */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormControl size="small">
                <InputLabel>Subject</InputLabel>
                <Select
                  sx={{width:"200px"}}
                  value={selectedFilters.subject}
                  label="Subject"
                  onChange={(e) => handleFilterChange('subject', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {[...new Set(allAssignments.map((a) => a.subject))].map((subject) => (
                    <MenuItem key={subject} value={subject}>
                      {subject}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small">
                <InputLabel>Standard</InputLabel>
                <Select
                sx={{width:"200px"}}
                  value={selectedFilters.standard}
                  label="Standard"
                  onChange={(e) => handleFilterChange('standard', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {[...new Set(allAssignments.map((a) => a.standard))].map((standard) => (
                    <MenuItem key={standard} value={standard}>
                      {standard}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small">
                <InputLabel>Section</InputLabel>
                <Select
                sx={{width:"200px"}}
                  value={selectedFilters.section}
                  label="Section"
                  onChange={(e) => handleFilterChange('section', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {[...new Set(allAssignments.map((a) => a.section))].map((section) => (
                    <MenuItem key={section} value={section}>
                      {section}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ backgroundColor: '#1976D2' }}>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Standard</TableCell>
                    <TableCell>Section</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Teacher</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAssignments.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.title}</TableCell>
                      <TableCell>{row.subject}</TableCell>
                      <TableCell>{row.standard}</TableCell>
                      <TableCell>{row.section}</TableCell>
                      <TableCell>{row.dueDate}</TableCell>
                      <TableCell>{row.teacherName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6">Pending Assignments</Typography>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ backgroundColor: 'primary.light' }}>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Teacher</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingAssignments.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.title}</TableCell>
                      <TableCell>{row.studentName}</TableCell>
                      <TableCell>{row.dueDate}</TableCell>
                      <TableCell>{row.teacherName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6">Submitted Assignments</Typography>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ backgroundColor: 'primary.light' }}>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Submission Date</TableCell>
                    <TableCell>Teacher</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submittedAssignments.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.title}</TableCell>
                      <TableCell>{row.studentName}</TableCell>
                      <TableCell>{row.submissionDate}</TableCell>
                      <TableCell>{row.teacherName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6">Due Dates Summary</Typography>
            {upcomingDueDates.map((assignment) => (
              <Box key={assignment.title} sx={{ mb: 2 }}>
                <Typography variant="subtitle1">
                  {assignment.title} - {assignment.studentName}
                </Typography>
                <Typography variant="body2">Due Date: {assignment.dueDate}</Typography>
              </Box>
            ))}
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6">Submission History & Grades</Typography>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ backgroundColor: 'primary.light' }}>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Submission Date</TableCell>
                    <TableCell>Marks</TableCell>
                    <TableCell>Teacher</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissionHistory.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.title}</TableCell>
                      <TableCell>{row.studentName}</TableCell>
                      <TableCell>{row.submissionDate}</TableCell>
                      <TableCell>{row.assignedMarks}</TableCell>
                      <TableCell>{row.teacherName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6">Remarks / Feedback</Typography>
            {remarks.map((assignment) => (
              <Box key={assignment.title} sx={{ mb: 2 }}>
                <Typography variant="subtitle1">
                  {assignment.title} - {assignment.studentName}
                </Typography>
                <Typography variant="body2">Remarks: {assignment.remarks}</Typography>
              </Box>
            ))}
          </Paper>
        </TabPanel>
      </Box>
    </Container>
  );
}



