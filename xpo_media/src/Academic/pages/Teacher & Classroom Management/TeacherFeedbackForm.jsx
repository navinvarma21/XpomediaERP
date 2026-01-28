import React, { useState } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Grid, Typography, TextField, Rating, FormLabel, RadioGroup, FormControlLabel, Radio, Button } from '@mui/material';

const TeacherFeedbackForm = () => {
  const [feedbackFrom, setFeedbackFrom] = useState('Student');
  const [studentName, setStudentName] = useState('');
  const [subject, setSubject] = useState('');
  const [clarityRating, setClarityRating] = useState(0);
  const [engagementRating, setEngagementRating] = useState(0);
  const [effectivenessRating, setEffectivenessRating] = useState(0);
  const [comments, setComments] = useState('');

  // Sample options
  const studentNames = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown'];
  const subjects = ['Mathematics', 'Science', 'English', 'History', 'Geography'];

  const handleSubmit = () => {
    // Handle form submission logic here
    console.log({
      feedbackFrom,
      studentName,
      subject,
      clarityRating,
      engagementRating,
      effectivenessRating,
      comments
    });
  };

  return (
    <Grid container spacing={2} direction="column" alignItems="center" justifyContent="center" style={{ padding: '20px' }}>
      <Typography variant="h5" gutterBottom>
        Teacher Lessons Feedback
      </Typography>
      
      <FormControl component="fieldset" margin="normal">
        <FormLabel component="legend">Feedback From</FormLabel>
        <RadioGroup row value={feedbackFrom} onChange={(e) => setFeedbackFrom(e.target.value)}>
          <FormControlLabel value="Student" control={<Radio />} label="Student" />
          <FormControlLabel value="Parent" control={<Radio />} label="Parent" />
        </RadioGroup>
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
      
      <FormControl fullWidth variant="outlined" margin="normal">
        <InputLabel id="subject-label">Subject/Lesson</InputLabel>
        <Select
          labelId="subject-label"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          label="Subject/Lesson"
        >
          {subjects.map((sub) => (
            <MenuItem key={sub} value={sub}>
              {sub}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControl fullWidth margin="normal">
        <FormLabel component="legend">Clarity of Explanation</FormLabel>
        <Rating
          name="clarity-rating"
          value={clarityRating}
          onChange={(event, newValue) => setClarityRating(newValue)}
          precision={0.5}
        />
      </FormControl>
      
      <FormControl fullWidth margin="normal">
        <FormLabel component="legend">Engagement Level</FormLabel>
        <Rating
          name="engagement-rating"
          value={engagementRating}
          onChange={(event, newValue) => setEngagementRating(newValue)}
          precision={0.5}
        />
      </FormControl>
      
      <FormControl fullWidth margin="normal">
        <FormLabel component="legend">Overall Effectiveness</FormLabel>
        <Rating
          name="effectiveness-rating"
          value={effectivenessRating}
          onChange={(event, newValue) => setEffectivenessRating(newValue)}
          precision={0.5}
        />
      </FormControl>
      
      <FormControl fullWidth variant="outlined" margin="normal">
        <TextField
          id="comments"
          label="Additional Comments"
          multiline
          rows={4}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          variant="outlined"
        />
      </FormControl>
      
      <Button variant="contained" color="primary" onClick={handleSubmit}>
        Submit Feedback
      </Button>
    </Grid>
  );
};

export default TeacherFeedbackForm;