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
const initialData = [
  {
    studentName: 'John',
    registerNumber: 'TN123456',
    class: '10th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    subject: 'Tamil',
    marks: 85,
    gender: 'Male',
  },
  {
    studentName: 'John',
    registerNumber: 'TN123456',
    class: '10th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    subject: 'English',
    marks: 90,
    gender: 'Male',
  },
  {
    studentName: 'John',
    registerNumber: 'TN123456',
    class: '10th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    subject: 'Mathematics',
    marks: 78,
    gender: 'Male',
  },
  {
    studentName: 'Jane',
    registerNumber: 'TN123457',
    class: '10th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    subject: 'Tamil',
    marks: 40,
    gender: 'Female',
  },
  {
    studentName: 'Jane',
    registerNumber: 'TN123457',
    class: '10th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    subject: 'English',
    marks: 30,
    gender: 'Female',
  },
  {
    studentName: 'Alex',
    registerNumber: 'TN123458',
    class: '11th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    subject: 'Tamil',
    marks: 92,
    gender: 'Male',
  },
  {
    studentName: 'Sarah',
    registerNumber: 'TN123459',
    class: '10th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    subject: 'Tamil',
    marks: 88,
    gender: 'Female',
  },
  // Add more data as needed
];

// Dropdown options (Tamil Nadu school system)
const classes = ['10th Standard', '11th Standard', '12th Standard'];
const academicYears = ['2023-2024', '2024-2025', '2025-2026'];
const terms = ['Quarterly', 'Half-Yearly', 'Annual'];
const subjects = ['Tamil', 'English', 'Mathematics', 'Science', 'Social Science'];
const genders = ['Male', 'Female', 'Other'];

const GradeAndGenderAnalysis = () => {
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

  // Handle generate analysis
  const handleGenerateAnalysis = () => {
    console.log('Generating analysis for:', {
      class: selectedClass,
      academicYear: selectedAcademicYear,
      term: selectedTerm,
      subject: selectedSubject || 'All',
    });
  };

  // Filter data
  const filteredData = initialData.filter(
    (data) =>
      data.class === selectedClass &&
      data.academicYear === selectedAcademicYear &&
      data.term === selectedTerm &&
      (!selectedSubject || data.subject === selectedSubject)
  );

  // Group by gender
  const genderPerformance = genders.map((gender) => {
    const genderData = filteredData.filter((data) => data.gender === gender);
    const marks = genderData.map((data) => data.marks).filter((mark) => typeof mark === 'number');
    const average = marks.length > 0 ? marks.reduce((sum, mark) => sum + mark, 0) / marks.length : 0;
    const passCount = genderData.filter((data) => data.marks >= 35).length;
    const passPercentage = genderData.length > 0 ? (passCount / genderData.length) * 100 : 0;
    const studentCount = new Set(genderData.map((data) => data.studentName)).size;
    return {
      gender,
      studentCount,
      average: average.toFixed(2),
      passPercentage: passPercentage.toFixed(2),
    };
  }).filter((gp) => gp.studentCount > 0); // Only show genders with data

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Grade and Gender Analysis
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
        <Button variant="contained" color="secondary" onClick={handleGenerateAnalysis}>
          Generate Analysis
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Gender</TableCell>
              <TableCell align="center">Number of Students</TableCell>
              <TableCell align="center">Average Marks</TableCell>
              <TableCell align="center">Pass Percentage</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {genderPerformance.length > 0 ? (
              genderPerformance.map((gp, index) => (
                <TableRow key={index}>
                  <TableCell>{gp.gender}</TableCell>
                  <TableCell align="center">{gp.studentCount}</TableCell>
                  <TableCell align="center">{gp.average}</TableCell>
                  <TableCell align="center">{gp.passPercentage}%</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No data found for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" color="primary" onClick={() => console.log('Saved:', genderPerformance)}>
          Save Analysis
        </Button>
      </Box>
    </Box>
  );
};

export default GradeAndGenderAnalysis;