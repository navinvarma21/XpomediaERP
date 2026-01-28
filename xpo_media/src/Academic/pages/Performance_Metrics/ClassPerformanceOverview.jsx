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
const initialPerformanceData = [
  {
    studentName: 'John',
    registerNumber: 'TN123456',
    class: '10th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    subject: 'Tamil',
    marks: 85,
  },
  {
    studentName: 'John',
    registerNumber: 'TN123456',
    class: '10th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    subject: 'English',
    marks: 90,
  },
  {
    studentName: 'John',
    registerNumber: 'TN123456',
    class: '10th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    subject: 'Mathematics',
    marks: 78,
  },
  {
    studentName: 'Jane',
    registerNumber: 'TN123457',
    class: '10th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    subject: 'Tamil',
    marks: 40,
  },
  {
    studentName: 'Jane',
    registerNumber: 'TN123457',
    class: '10th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    subject: 'English',
    marks: 30,
  },
  {
    studentName: 'Alex',
    registerNumber: 'TN123458',
    class: '11th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    subject: 'Tamil',
    marks: 92,
  },
  {
    studentName: 'John',
    registerNumber: 'TN123456',
    class: '10th Standard',
    academicYear: '2024-2025',
    term: 'Half-Yearly',
    subject: 'Tamil',
    marks: 65,
  },
];

// Dropdown options (Tamil Nadu school system)
const classes = ['10th Standard', '11th Standard', '12th Standard'];
const academicYears = ['2023-2024', '2024-2025', '2025-2026'];
const terms = ['Quarterly', 'Half-Yearly', 'Annual'];
const subjects = ['Tamil', 'English', 'Mathematics', 'Science', 'Social Science'];

const ClassPerformanceOverview = () => {
  // State for dropdowns
  const [selectedClass, setSelectedClass] = useState(classes[0]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(academicYears[1]);
  const [selectedTerm, setSelectedTerm] = useState(terms[0]);
  const [selectedSubject, setSelectedSubject] = useState('');

  // Handle dropdown changes
  const handleClassChange = (event) => {
    setSelectedClass(event.target.value);
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

  // Handle generate overview
  const handleGenerateOverview = () => {
    console.log('Generating overview for:', {
      class: selectedClass,
      academicYear: selectedAcademicYear,
      term: selectedTerm,
      subject: selectedSubject || 'All',
    });
  };

  // Filter and process data
  const filteredData = initialPerformanceData.filter(
    (data) =>
      data.class === selectedClass &&
      data.academicYear === selectedAcademicYear &&
      data.term === selectedTerm &&
      (!selectedSubject || data.subject === selectedSubject)
  );

  // Group data by student
  const students = [...new Set(filteredData.map((data) => data.studentName))];
  const studentPerformance = students.map((studentName) => {
    const studentData = filteredData.filter((data) => data.studentName === studentName);
    const marks = subjects.reduce((acc, subject) => {
      const subjectData = studentData.find((data) => data.subject === subject);
      return { ...acc, [subject]: subjectData ? subjectData.marks : '-' };
    }, {});
    const validMarks = studentData.map((data) => data.marks).filter((mark) => typeof mark === 'number');
    const average = validMarks.length > 0 ? validMarks.reduce((sum, mark) => sum + mark, 0) / validMarks.length : 0;
    const pass = average >= 35;
    return {
      studentName,
      registerNumber: studentData[0]?.registerNumber || '',
      marks,
      average: average.toFixed(2),
      pass,
    };
  });

  // Calculate class metrics
  const classAverages = subjects.map((subject) => {
    const subjectMarks = filteredData
      .filter((data) => data.subject === subject)
      .map((data) => data.marks)
      .filter((mark) => typeof mark === 'number');
    return subjectMarks.length > 0
      ? (subjectMarks.reduce((sum, mark) => sum + mark, 0) / subjectMarks.length).toFixed(2)
      : '-';
  });
  const overallMarks = filteredData.map((data) => data.marks).filter((mark) => typeof mark === 'number');
  const classAverage = overallMarks.length > 0
    ? (overallMarks.reduce((sum, mark) => sum + mark, 0) / overallMarks.length).toFixed(2)
    : '-';
  const passCount = studentPerformance.filter((student) => student.pass).length;
  const passPercentage = studentPerformance.length > 0
    ? ((passCount / studentPerformance.length) * 100).toFixed(2)
    : '-';

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Class Performance Overview
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="class-select-label">Class</InputLabel>
          <Select
            labelId="class-select-label"
            value={selectedClass}
            label="Class"
            onChange={handleClassChange}
          >
            {classes.map((cls) => (
              <MenuItem key={cls} value={cls}>
                {cls}
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
        <Button variant="contained" color="secondary" onClick={handleGenerateOverview}>
          Generate Overview
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student Name</TableCell>
              <TableCell>Register Number</TableCell>
              {subjects.map((subject) => (
                <TableCell key={subject} align="center">
                  {subject}
                </TableCell>
              ))}
              <TableCell align="center">Average</TableCell>
              <TableCell align="center">Pass/Fail</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {studentPerformance.length > 0 ? (
              studentPerformance.map((student, index) => (
                <TableRow key={index}>
                  <TableCell>{student.studentName}</TableCell>
                  <TableCell>{student.registerNumber}</TableCell>
                  {subjects.map((subject) => (
                    <TableCell key={subject} align="center">
                      {student.marks[subject]}
                    </TableCell>
                  ))}
                  <TableCell align="center">{student.average}</TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      backgroundColor: student.pass ? '#e0f7fa' : '#ffebee',
                    }}
                  >
                    {student.pass ? 'Pass' : 'Fail'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={subjects.length + 3} align="center">
                  No data found for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="h6">Class Summary</Typography>
        {subjects.map((subject, index) => (
          <Typography key={subject}>
            {subject} Average: {classAverages[index]}
          </Typography>
        ))}
        <Typography>Class Average: {classAverage}</Typography>
        <Typography>Pass Percentage: {passPercentage}%</Typography>
      </Box>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" color="primary" onClick={() => console.log('Saved:', studentPerformance)}>
          Save Changes
        </Button>
      </Box>
    </Box>
  );
};

export default ClassPerformanceOverview;