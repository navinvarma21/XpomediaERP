import React, { useState } from 'react';
import { Grid, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Box, Rating } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const WellbeingSurveys = () => {
  const [academicYear, setAcademicYear] = useState('');
  const [academicPeriod, setAcademicPeriod] = useState('');
  const [studentName, setStudentName] = useState('');
  const [standard, setStandard] = useState('');
  const [section, setSection] = useState('');
  const [mentalHealthRating, setMentalHealthRating] = useState(0);
  const [physicalWellbeingRating, setPhysicalWellbeingRating] = useState(0);
  const [socialEngagementRating, setSocialEngagementRating] = useState(0);
  const [surveyDate, setSurveyDate] = useState(null);
  const [comments, setComments] = useState('');
  const [surveys, setSurveys] = useState([]);

  // Sample options - replace with actual data as needed
  const academicYears = ['2023-2024', '2024-2025', '2025-2026'];
  const academicPeriods = ['Semester 1', 'Semester 2', 'Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'];
  const studentNames = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown'];
  const standards = ['1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade'];
  const sections = ['A', 'B', 'C', 'D'];

  const handleSubmit = () => {
    if (academicYear && academicPeriod && studentName && standard && section && mentalHealthRating && physicalWellbeingRating && socialEngagementRating && surveyDate) {
      const newSurvey = {
        id: Date.now(),
        academicYear,
        academicPeriod,
        studentName,
        standard,
        section,
        mentalHealthRating,
        physicalWellbeingRating,
        socialEngagementRating,
        surveyDate,
        comments
      };
      setSurveys([...surveys, newSurvey]);
      // Reset form
      setAcademicYear('');
      setAcademicPeriod('');
      setStudentName('');
      setStandard('');
      setSection('');
      setMentalHealthRating(0);
      setPhysicalWellbeingRating(0);
      setSocialEngagementRating(0);
      setSurveyDate(null);
      setComments('');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid container spacing={3} direction="column" alignItems="center" justifyContent="center" style={{ padding: '20px' }}>
        <Typography variant="h4" gutterBottom color="primary">
          Student Wellbeing Surveys
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
                <MenuItem value="">Select Year</MenuItem>
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
              <InputLabel id="academic-period-label">Academic Period</InputLabel>
              <Select
                labelId="academic-period-label"
                value={academicPeriod}
                onChange={(e) => setAcademicPeriod(e.target.value)}
                label="Academic Period"
              >
                <MenuItem value="">Select Period</MenuItem>
                {academicPeriods.map((period) => (
                  <MenuItem key={period} value={period}>
                    {period}
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
                <MenuItem value="">Select Student</MenuItem>
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
              <InputLabel id="standard-label">Standard/Grade</InputLabel>
              <Select
                labelId="standard-label"
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                label="Standard/Grade"
              >
                <MenuItem value="">Select Standard</MenuItem>
                {standards.map((std) => (
                  <MenuItem key={std} value={std}>
                    {std}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" margin="normal">
              <InputLabel id="section-label">Section</InputLabel>
              <Select
                labelId="section-label"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                label="Section"
              >
                <MenuItem value="">Select Section</MenuItem>
                {sections.map((sec) => (
                  <MenuItem key={sec} value={sec}>
                    {sec}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <Typography component="legend">Mental Health Rating</Typography>
              <Rating
                name="mental-health-rating"
                value={mentalHealthRating}
                onChange={(event, newValue) => setMentalHealthRating(newValue)}
                precision={0.5}
              />
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <Typography component="legend">Physical Wellbeing Rating</Typography>
              <Rating
                name="physical-wellbeing-rating"
                value={physicalWellbeingRating}
                onChange={(event, newValue) => setPhysicalWellbeingRating(newValue)}
                precision={0.5}
              />
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <Typography component="legend">Social Engagement Rating</Typography>
              <Rating
                name="social-engagement-rating"
                value={socialEngagementRating}
                onChange={(event, newValue) => setSocialEngagementRating(newValue)}
                precision={0.5}
              />
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <DatePicker
                label="Survey Date"
                value={surveyDate}
                onChange={(newValue) => setSurveyDate(newValue)}
                slotProps={{ textField: { variant: 'outlined' } }}
              />
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth variant="outlined" margin="normal">
              <TextField
                id="comments"
                label="Additional Comments"
                multiline
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                variant="outlined"
              />
            </FormControl>
          </Grid>
        </Grid>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          style={{ marginTop: '16px' }}
          disabled={!academicYear || !academicPeriod || !studentName || !standard || !section || !mentalHealthRating || !physicalWellbeingRating || !socialEngagementRating || !surveyDate}
        >
          Submit Survey
        </Button>

        <Grid container spacing={2} style={{ marginTop: '30px', width: '100%' }}>
          <Typography variant="h6" gutterBottom style={{ marginLeft: '16px' }}>
            Survey Responses
          </Typography>
          {surveys.map((survey) => (
            <Grid item xs={12} md={6} lg={4} key={survey.id}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {survey.studentName}
                  </Typography>
                  <Typography color="textSecondary">
                    Academic Year: {survey.academicYear}
                  </Typography>
                  <Typography color="textSecondary">
                    Period: {survey.academicPeriod}
                  </Typography>
                  <Typography color="textSecondary">
                    Standard: {survey.standard}
                  </Typography>
                  <Typography color="textSecondary">
                    Section: {survey.section}
                  </Typography>
                  <Typography color="textSecondary">
                    Mental Health: {survey.mentalHealthRating}/5
                  </Typography>
                  <Typography color="textSecondary">
                    Physical Wellbeing: {survey.physicalWellbeingRating}/5
                  </Typography>
                  <Typography color="textSecondary">
                    Social Engagement: {survey.socialEngagementRating}/5
                  </Typography>
                  <Typography color="textSecondary">
                    Survey Date: {survey.surveyDate ? survey.surveyDate.toDateString() : 'N/A'}
                  </Typography>
                  {survey.comments && (
                    <Typography variant="body2" style={{ marginTop: '8px', fontStyle: 'italic' }}>
                      Comments: {survey.comments}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
};

export default WellbeingSurveys;