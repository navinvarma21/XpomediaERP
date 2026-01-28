import React, { useState } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Grid, Typography, TextField, Rating, Button } from '@mui/material';

const LessonObservationForm = () => {
  const [academicYear, setAcademicYear] = useState('');
  const [term, setTerm] = useState('');
  const [studentName, setStudentName] = useState('');
  const [participationRating, setParticipationRating] = useState(0);
  const [understandingRating, setUnderstandingRating] = useState(0);
  const [behaviorRating, setBehaviorRating] = useState(0);
  const [comments, setComments] = useState('');

  // Sample options - replace with actual data as needed
  const academicYears = ['2023-2024', '2024-2025', '2025-2026'];
  const terms = ['Term 1', 'Term 2', 'Term 3'];
  const studentNames = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown'];

  const handleSubmit = () => {
    // Handle form submission logic here
    console.log({
      academicYear,
      term,
      studentName,
      participationRating,
      understandingRating,
      behaviorRating,
      comments
    });
  };

  return (
    <Grid container spacing={2} direction="column" alignItems="center" justifyContent="center" style={{ padding: '20px' }}>
      <Typography variant="h5" gutterBottom>
        Lesson Observation & Evaluation
      </Typography>
      
      <FormControl fullWidth variant="outlined" margin="normal">
        <InputLabel id="academic-year-label">Academic Year</InputLabel>
        <Select
          labelId="academic-year-label"
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
          label="Academic Year"
        >
          { academicYears.map((year) => (
            <MenuItem key={year} value={year}>
              {year}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControl fullWidth variant="outlined" margin="normal">
        <InputLabel id="term-label">Term</InputLabel>
        <Select
          labelId="term-label"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          label="Term"
        >
          {terms.map((term) => (
            <MenuItem key={term} value={term}>
              {term}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
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
      
      <FormControl fullWidth margin="normal">
        <Typography component="legend">Participation Level</Typography>
        <Rating
          name="participation-rating"
          value={participationRating}
          onChange={(event, newValue) => setParticipationRating(newValue)}
          precision={0.5}
        />
      </FormControl>
      
      <FormControl fullWidth margin="normal">
        <Typography component="legend">Understanding of Material</Typography>
        <Rating
          name="understanding-rating"
          value={understandingRating}
          onChange={(event, newValue) => setUnderstandingRating(newValue)}
          precision={0.5}
        />
      </FormControl>
      
      <FormControl fullWidth margin="normal">
        <Typography component="legend">Classroom Behavior</Typography>
        <Rating
          name="behavior-rating"
          value={behaviorRating}
          onChange={(event, newValue) => setBehaviorRating(newValue)}
          precision={0.5}
        />
      </FormControl>
      
      <FormControl fullWidth variant="outlined" margin="normal">
        <TextField
          id="comments"
          label="Evaluation Comments"
          multiline
          rows={4}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          variant="outlined"
        />
      </FormControl>
      
      <Button variant="contained" color="primary" onClick={handleSubmit}>
        Submit Evaluation
      </Button>
    </Grid>
  );
};

export default LessonObservationForm;