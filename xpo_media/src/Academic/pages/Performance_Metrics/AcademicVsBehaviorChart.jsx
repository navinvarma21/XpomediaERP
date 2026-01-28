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
import { ScatterChart } from '@mui/x-charts/ScatterChart';

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
    behaviorScore: 90,
    attendance: 95,
  },
  {
    studentName: 'John',
    registerNumber: 'TN123456',
    class: '10th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    subject: 'English',
    marks: 90,
    behaviorScore: 90,
    attendance: 95,
  },
  {
    studentName: 'John',
    registerNumber: 'TN123456',
    class: '10th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    subject: 'Mathematics',
    marks: 78,
    behaviorScore: 90,
    attendance: 95,
  },
  {
    studentName: 'Jane',
    registerNumber: 'TN123457',
    class: '10th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    subject: 'Tamil',
    marks: 40,
    behaviorScore: 75,
    attendance: 80,
  },
  {
    studentName: 'Jane',
    registerNumber: 'TN123457',
    class: '10th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    subject: 'English',
    marks: 30,
    behaviorScore: 75,
    attendance: 80,
  },
  {
    studentName: 'Alex',
    registerNumber: 'TN123458',
    class: '11th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    subject: 'Tamil',
    marks: 92,
    behaviorScore: 85,
    attendance: 90,
  },
  {
    studentName: 'Sarah',
    registerNumber: 'TN123459',
    class: '10th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    subject: 'Tamil',
    marks: 88,
    behaviorScore: 95,
    attendance: 92,
  },
  {
    studentName: 'John',
    registerNumber: 'TN123456',
    class: '10th Standard',
    academicYear: '2024-2025',
    term: 'Half-Yearly',
    subject: 'Tamil',
    marks: 65,
    behaviorScore: 88,
    attendance: 93,
  },
];

// Dropdown options (Tamil Nadu school system)
const classes = ['10th Standard', '11th Standard', '12th Standard'];
const academicYears = ['2023-2024', '2024-2025', '2025-2026'];
const terms = ['Quarterly', 'Half-Yearly', 'Annual'];

const AcademicVsBehaviorChart = () => {
  // State for dropdowns
  const [selectedClass, setSelectedClass] = useState(classes[0]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(academicYears[1]);
  const [selectedTerm, setSelectedTerm] = useState(terms[0]);

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

  // Handle generate chart
  const handleGenerateChart = () => {
    console.log('Generating chart for:', {
      class: selectedClass,
      academicYear: selectedAcademicYear,
      term: selectedTerm,
    });
  };

  // Filter and process data
  const filteredData = initialData.filter(
    (data) =>
      data.class === selectedClass &&
      data.academicYear === selectedAcademicYear &&
      data.term === selectedTerm
  );

  // Group by student
  const students = [...new Set(filteredData.map((data) => data.studentName))];
  const chartData = students.map((studentName) => {
    const studentData = filteredData.filter((data) => data.studentName === studentName);
    const marks = studentData.map((data) => data.marks).filter((mark) => typeof mark === 'number');
    const averageMarks = marks.length > 0 ? marks.reduce((sum, mark) => sum + mark, 0) / marks.length : 0;
    const totalMarks = marks.reduce((sum, mark) => sum + mark, 0, 0);
    const behaviorScore = studentData[0]?.behaviorScore || 0;
    const attendance = studentData[0]?.attendance || 0;
    return {
      id: studentName,
      x: averageMarks,
      y: behaviorScore,
      size: totalMarks,
      registerNumber: studentData[0]?.registerNumber || '',
      attendance,
    };
  });

  // Calculate class averages
  const academicMarks = filteredData.map((data) => data.marks).filter((mark) => typeof mark === 'number');
  const classAcademicAverage = academicMarks.length > 0
    ? (academicMarks.reduce((sum, mark) => sum + mark, 0) / academicMarks.length).toFixed(2)
    : '-';
  const behaviorScores = filteredData.map((data) => data.behaviorScore).filter((score) => typeof score === 'number');
  const classBehaviorAverage = behaviorScores.length > 0
    ? (behaviorScores.reduce((sum, score) => sum + score, 0) / behaviorScores.length).toFixed(2)
    : '-';

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Academic vs Behavior Bubble Chart
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
      </Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" color="secondary" onClick={handleGenerateChart}>
          Generate Chart
        </Button>
      </Box>
      <Box sx={{ width: '100%', height: 400, mb: 3 }}>
        {chartData.length > 0 ? (
          <ScatterChart
            xAxis={[{ label: 'Average Academic Marks', min: 0, max: 100 }]}
            yAxis={[{ label: 'Behavior Score', min: 0, max: 100 }]}
            series={[
              {
                label: 'Students',
                data: chartData.map((student) => ({
                  id: student.id,
                  x: student.x,
                  y: student.y,
                  size: student.size / 10, // Scale size for visualization
                  tooltip: `Student: ${student.id}, Reg: ${student.registerNumber}, Marks: ${student.x.toFixed(2)}, Behavior: ${student.y}, Attendance: ${student.attendance}%`,
                })),
                valueFormatter: (v) => v.tooltip,
              },
            ]}
            sx={{ '& .MuiChartsTooltip-root': { fontSize: '14px' } }}
          />
        ) : (
          <Typography align="center" color="text.secondary">
            No data found for the selected filters.
          </Typography>
        )}
      </Box>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student Name</TableCell>
              <TableCell>Register Number</TableCell>
              <TableCell align="center">Average Marks</TableCell>
              <TableCell align="center">Behavior Score</TableCell>
              <TableCell align="center">Attendance (%)</TableCell>
              <TableCell align="center">Pass/Fail</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {chartData.length > 0 ? (
              chartData.map((student, index) => (
                <TableRow key={index}>
                  <TableCell>{student.id}</TableCell>
                  <TableCell>{student.registerNumber}</TableCell>
                  <TableCell align="center">{student.x.toFixed(2)}</TableCell>
                  <TableCell align="center">{student.y}</TableCell>
                  <TableCell align="center">{student.attendance}</TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      backgroundColor: student.x >= 35 ? '#e0f7fa' : '#ffebee',
                    }}
                  >
                    {student.x >= 35 ? 'Pass' : 'Fail'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No students found for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="h6">Class Summary</Typography>
        <Typography>Academic Average: {classAcademicAverage}</Typography>
        <Typography>Behavior Average: {classBehaviorAverage}</Typography>
      </Box>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" color="primary" onClick={() => console.log('Saved:', chartData)}>
          Save Chart
        </Button>
      </Box>
    </Box>
  );
};

export default AcademicVsBehaviorChart;