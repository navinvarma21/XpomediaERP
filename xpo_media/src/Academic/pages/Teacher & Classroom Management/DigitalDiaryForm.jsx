import React, { useState } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Grid, Typography, TextField } from '@mui/material';

const DigitalDiaryForm = () => {
  const [studentName, setStudentName] = useState('');
  const [section1, setSection1] = useState('');
  const [section2, setSection2] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [academicPeriod, setAcademicPeriod] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [homework, setHomework] = useState('');

  // Sample options - you can replace these with actual data
  const studentNames = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown'];
  const sections = ['A', 'B', 'C', 'D'];
  const academicYears = ['2023-2024', '2024-2025', '2025-2026'];
  const academicPeriods = ['Semester 1', 'Semester 2', 'Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'];
  const subjects = ['Mathematics', 'Science', 'English', 'History', 'Geography'];

  return (
    <Grid container spacing={2} direction="column" alignItems="center" justifyContent="center">
      <Typography variant="h5" gutterBottom>
        Digital Diary Selection
      </Typography>
      
      <FormControl fullWidth variant="outlined" margin="normal">
        <InputLabel id="student-name-label">Student's Name</InputLabel>
        <Select
          labelId="student-name-label"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          label="Student's Name"
        >
          {studentNames.map((name) => (
            <MenuItem key={name} value={name}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControl fullWidth variant="outlined" margin="normal">
        <InputLabel id="section1-label">Section 1</InputLabel>
        <Select
          labelId="section1-label"
          value={section1}
          onChange={(e) => setSection1(e.target.value)}
          label="Section 1"
        >
          {sections.map((sec) => (
            <MenuItem key={sec} value={sec}>
              {sec}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControl fullWidth variant="outlined" margin="normal">
        <InputLabel id="section2-label">Section 2</InputLabel>
        <Select
          labelId="section2-label"
          value={section2}
          onChange={(e) => setSection2(e.target.value)}
          label="Section 2"
        >
          {sections.map((sec) => (
            <MenuItem key={sec} value={sec}>
              {sec}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControl fullWidth variant="outlined" margin="normal">
        <InputLabel id="academic-year-label">Academic Year</InputLabel>
        <Select
          labelId="academic-year-label"
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
          label="Academic Year"
        >
          {academicYears.map((year) => (
            <MenuItem key={year} value={year}>
              {year}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControl fullWidth variant="outlined" margin="normal">
        <InputLabel id="academic-period-label">Academic Period</InputLabel>
        <Select
          labelId="academic-period-label"
          value={academicPeriod}
          onChange={(e) => setAcademicPeriod(e.target.value)}
          label="Academic Period"
        >
          {academicPeriods.map((period) => (
            <MenuItem key={period} value={period}>
              {period}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControl fullWidth variant="outlined" margin="normal">
        <InputLabel id="subject-name-label">Subject Name</InputLabel>
        <Select
          labelId="subject-name-label"
          value={subjectName}
          onChange={(e) => setSubjectName(e.target.value)}
          label="Subject Name"
        >
          {subjects.map((subject) => (
            <MenuItem key={subject} value={subject}>
              {subject}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControl fullWidth variant="outlined" margin="normal">
        <TextField
          id="homework"
          label="Subject Homework"
          multiline
          rows={4}
          value={homework}
          onChange={(e) => setHomework(e.target.value)}
          variant="outlined"
        />
      </FormControl>
    </Grid>
  );
};

export default DigitalDiaryForm;