import React, { useState } from 'react';
import { Grid, Typography, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ParentEngagementAnalytics = () => {
  const [academicYear, setAcademicYear] = useState('');
  const [studentName, setStudentName] = useState('');
  const [timetableOption, setTimetableOption] = useState('');
  const [subjectName, setSubjectName] = useState('');

  // Sample options - replace with actual data as needed
  const academicYears = ['2023-2024', '2024-2025', '2025-2026'];
  const studentNames = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown'];
  const timetableOptions = ['Daily', 'Weekly', 'Monthly'];
  const subjects = ['Mathematics', 'Science', 'English', 'History', 'Geography'];

  // Sample data for analytics chart - replace with actual data
  const analyticsData = [
    { task: 'Homework Completion', engagement: 85 },
    { task: 'Meeting Attendance', engagement: 90 },
    { task: 'Communication Response', engagement: 75 },
    { task: 'Event Participation', engagement: 60 },
  ];

  return (
    <Grid container spacing={2} direction="column" alignItems="center" justifyContent="center" style={{ padding: '20px' }}>
      <Typography variant="h5" gutterBottom>
        Parent Engagement Analytics
      </Typography>

      <Grid container spacing={2} style={{ width: '100%', maxWidth: '600px' }}>
        <Grid item xs={12} sm={6}>
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
        </Grid>

        <Grid item xs={12} sm={6}>
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
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth variant="outlined" margin="normal">
            <InputLabel id="timetable-option-label">Timetable Option</InputLabel>
            <Select
              labelId="timetable-option-label"
              value={timetableOption}
              onChange={(e) => setTimetableOption(e.target.value)}
              label="Timetable Option"
            >
              {timetableOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
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
        </Grid>
      </Grid>

      <Card variant="outlined" style={{ width: '100%', maxWidth: '800px', marginTop: '20px' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Engagement Metrics
          </Typography>
          <Box style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="task" />
                <YAxis label={{ value: 'Engagement (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="engagement" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default ParentEngagementAnalytics;