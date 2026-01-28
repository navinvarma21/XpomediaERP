import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

// Static data for demonstration (replace with your data source)
const initialReportData = [
  {
    studentName: 'John',
    registerNumber: '123456',
    academicYear: '2024-2025',
    term: 'Quarterly',
    subject: 'Tamil',
    marks: 85,
    pass: true,
  },
  {
    studentName: 'John',
    registerNumber: '123456',
    academicYear: '2024-2025',
    term: 'Quarterly',
    subject: 'English',
    marks: 90,
    pass: true,
  },
  {
    studentName: 'John',
    registerNumber: '123456',
    academicYear: '2024-2025',
    term: 'Quarterly',
    subject: 'Mathematics',
    marks: 78,
    pass: true,
  },
  {
    studentName: 'John',
    registerNumber: '123456',
    academicYear: '2024-2025',
    term: 'Half-Yearly',
    subject: 'Tamil',
    marks: 65,
    pass: true,
  },
  {
    studentName: 'Jane',
    registerNumber: '123457',
    academicYear: '2024-2025',
    term: 'Quarterly',
    subject: 'Tamil',
    marks: 40,
    pass: true,
  },
  {
    studentName: 'Jane',
    registerNumber: '123457',
    academicYear: '2024-2025',
    term: 'Quarterly',
    subject: 'English',
    marks: 30,
    pass: false,
  },
  {
    studentName: 'John',
    registerNumber: '123456',
    academicYear: '2025-2026',
    term: 'Quarterly',
    subject: 'Tamil',
    marks: 92,
    pass: true,
  },
];

// Dropdown options (based on Tamil Nadu school system)
const students = [
  { name: 'John', registerNumber: 'TN123456' },
  { name: 'Jane', registerNumber: 'TN123457' },
  { name: 'Alex', registerNumber: 'TN123458' },
];
const academicYears = ['2023-2024', '2024-2025', '2025-2026'];
const terms = ['Quarterly', 'Half-Yearly', 'Annual'];
const subjects = ['Tamil', 'English', 'Mathematics', 'Science', 'Social Science'];

const ReportCardGenerator = () => {
  // State for dropdowns and report data
  const [selectedStudent, setSelectedStudent] = useState(students[0].name);
  const [selectedRegisterNumber, setSelectedRegisterNumber] = useState(students[0].registerNumber);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(academicYears[1]);
  const [selectedTerm, setSelectedTerm] = useState(terms[0]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [reportData, setReportData] = useState(initialReportData);

  // Handle dropdown changes
  const handleStudentChange = (event) => {
    const studentName = event.target.value;
    const student = students.find((s) => s.name === studentName);
    setSelectedStudent(studentName);
    setSelectedRegisterNumber(student.registerNumber);
  };

  const handleRegisterNumberChange = (event) => {
    const registerNumber = event.target.value;
    const student = students.find((s) => s.registerNumber === registerNumber);
    setSelectedRegisterNumber(registerNumber);
    setSelectedStudent(student.name);
  };

  const handleAcademicYearChange = (event) => {
    setSelectedAcademicYear(event.target.value);
  };

  const handleTermChange = (event) => {
    setSelectedTerm(event.target.value);
  };

  const handleSubjectChange = (event) => {
    setSelectedSubject(event.target.value);
  };

  // Handle generate report
  const handleGenerateReport = () => {
    console.log('Generating report for:', {
      studentName: selectedStudent,
      registerNumber: selectedRegisterNumber,
      academicYear: selectedAcademicYear,
      term: selectedTerm,
      subject: selectedSubject || 'All',
    });
  };

  // Handle save button
  const handleSave = () => {
    console.log('Updated report data:', reportData);
    // Add backend save logic here
  };

  // Filter report data based on selections
  const filteredReportData = reportData.filter(
    (data) =>
      data.studentName === selectedStudent &&
      data.registerNumber === selectedRegisterNumber &&
      data.academicYear === selectedAcademicYear &&
      data.term === selectedTerm &&
      (!selectedSubject || data.subject === selectedSubject)
  );

  // Calculate total and average
  const totalMarks = filteredReportData.reduce((sum, data) => sum + data.marks, 0);
  const averageMarks = filteredReportData.length > 0 ? totalMarks / filteredReportData.length : 0;
  const passStatus = averageMarks >= 35 ? 'Pass' : 'Fail';

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Report Card Generator
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="student-select-label">Student Name</InputLabel>
          <Select
            labelId="student-select-label"
            value={selectedStudent}
            label="Student Name"
            onChange={handleStudentChange}
          >
            {students.map((student) => (
              <MenuItem key={student.name} value={student.name}>
                {student.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="register-number-select-label">Register Number</InputLabel>
          <Select
            labelId="register-number-select-label"
            value={selectedRegisterNumber}
            label="Register Number"
            onChange={handleRegisterNumberChange}
          >
            {students.map((student) => (
              <MenuItem key={student.registerNumber} value={student.registerNumber}>
                {student.registerNumber}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="academic-year-select-label">Academic Year</InputLabel>
          <Select
            labelId="academic-year-select-label"
            value={selectedAcademicYear}
            label="Academic Year"
            onChange={handleAcademicYearChange}
          >
            {academicYears.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="term-select-label">Term</InputLabel>
          <Select
            labelId="term-select-label"
            value={selectedTerm}
            label="Term"
            onChange={handleTermChange}
          >
            {terms.map((term) => (
              <MenuItem key={term} value={term}>
                {term}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="subject-select-label">Subject</InputLabel>
          <Select
            labelId="subject-select-label"
            value={selectedSubject}
            label="Subject"
            onChange={handleSubjectChange}
          >
            <MenuItem value="">All Subjects</MenuItem>
            {subjects.map((subject) => (
              <MenuItem key={subject} value={subject}>
                {subject}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" color="secondary" onClick={handleGenerateReport}>
          Generate Report
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Subject</TableCell>
              <TableCell align="center">Marks</TableCell>
              <TableCell align="center">Pass/Fail</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredReportData.length > 0 ? (
              filteredReportData.map((data, index) => (
                <TableRow key={index}>
                  <TableCell>{data.subject}</TableCell>
                  <TableCell align="center">{data.marks}/100</TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      backgroundColor: data.pass ? '#e0f7fa' : '#ffebee',
                    }}
                  >
                    {data.pass ? 'Pass' : 'Fail'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No data found for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="h6">Summary</Typography>
        <Typography>Total Marks: {totalMarks}</Typography>
        <Typography>Average Marks: {averageMarks.toFixed(2)}</Typography>
        <Typography>Status: {passStatus}</Typography>
      </Box>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" color="primary" onClick={handleSave}>
          Save Changes
        </Button>
      </Box>
    </Box>
  );
};

export default ReportCardGenerator;