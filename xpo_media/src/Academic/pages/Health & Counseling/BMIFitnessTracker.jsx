import React, { useState } from 'react';
import { Grid, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Box, Chip } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const BMIFitnessTracker = () => {
  const [academicYear, setAcademicYear] = useState('');
  const [academicPeriod, setAcademicPeriod] = useState('');
  const [studentName, setStudentName] = useState('');
  const [standard, setStandard] = useState('');
  const [section, setSection] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [fitnessActivity, setFitnessActivity] = useState('');
  const [activityDuration, setActivityDuration] = useState('');
  const [recordDate, setRecordDate] = useState(null);
  const [records, setRecords] = useState([]);

  // Sample options - replace with actual data as needed
  const academicYears = ['2023-2024', '2024-2025', '2025-2026'];
  const academicPeriods = ['Semester 1', 'Semester 2', 'Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'];
  const studentNames = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown'];
  const standards = ['1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade'];
  const sections = ['A', 'B', 'C', 'D'];
  const fitnessActivities = ['Running', 'Yoga', 'Swimming', 'Cycling', 'Strength Training', 'Other'];

  const calculateBMI = (heightCm, weightKg) => {
    if (!heightCm || !weightKg) return { bmi: 0, category: '' };
    const heightM = heightCm / 100;
    const bmi = (weightKg / (heightM * heightM)).toFixed(1);
    let category = '';
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi >= 18.5 && bmi <= 24.9) category = 'Normal';
    else if (bmi >= 25 && bmi <= 29.9) category = 'Overweight';
    else category = 'Obese';
    return { bmi, category };
  };

  const { bmi, category } = calculateBMI(height, weight);

  const handleSubmit = () => {
    if (academicYear && academicPeriod && studentName && standard && section && height && weight && fitnessActivity && recordDate) {
      const newRecord = {
        id: Date.now(),
        academicYear,
        academicPeriod,
        studentName,
        standard,
        section,
        height,
        weight,
        bmi,
        category,
        fitnessActivity,
        activityDuration,
        recordDate
      };
      setRecords([...records, newRecord]);
      // Reset form
      setAcademicYear('');
      setAcademicPeriod('');
      setStudentName('');
      setStandard('');
      setSection('');
      setHeight('');
      setWeight('');
      setFitnessActivity('');
      setActivityDuration('');
      setRecordDate(null);
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Underweight': return 'warning';
      case 'Normal': return 'success';
      case 'Overweight': return 'warning';
      case 'Obese': return 'error';
      default: return 'default';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid container spacing={3} direction="column" alignItems="center" justifyContent="center" style={{ padding: '20px' }}>
        <Typography variant="h4" gutterBottom color="primary">
          BMI & Fitness Tracker
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
            <FormControl fullWidth variant="outlined" margin="normal">
              <TextField
                id="height"
                label="Height (cm)"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                variant="outlined"
                inputProps={{ min: 0 }}
              />
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" margin="normal">
              <TextField
                id="weight"
                label="Weight (kg)"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                variant="outlined"
                inputProps={{ min: 0 }}
              />
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" margin="normal">
              <InputLabel id="fitness-activity-label">Fitness Activity</InputLabel>
              <Select
                labelId="fitness-activity-label"
                value={fitnessActivity}
                onChange={(e) => setFitnessActivity(e.target.value)}
                label="Fitness Activity"
              >
                <MenuItem value="">Select Activity</MenuItem>
                {fitnessActivities.map((activity) => (
                  <MenuItem key={activity} value={activity}>
                    {activity}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" margin="normal">
              <TextField
                id="activity-duration"
                label="Activity Duration (minutes)"
                type="number"
                value={activityDuration}
                onChange={(e) => setActivityDuration(e.target.value)}
                variant="outlined"
                inputProps={{ min: 0 }}
              />
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <DatePicker
                label="Record Date"
                value={recordDate}
                onChange={(newValue) => setRecordDate(newValue)}
                slotProps={{ textField: { variant: 'outlined' } }}
              />
            </FormControl>
          </Grid>
        </Grid>

        <Card variant="outlined" style={{ width: '100%', maxWidth: '600px', marginTop: '20px' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              BMI Result
            </Typography>
            <Typography variant="body1">
              BMI: {bmi || 'N/A'}
            </Typography>
            <Box marginTop={1}>
              <Chip
                label={category || 'N/A'}
                color={getCategoryColor(category)}
                size="small"
              />
            </Box>
          </CardContent>
        </Card>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          style={{ marginTop: '16px' }}
          disabled={!academicYear || !academicPeriod || !studentName || !standard || !section || !height || !weight || !fitnessActivity || !recordDate}
        >
          Add Fitness Record
        </Button>

        <Grid container spacing={2} style={{ marginTop: '30px', width: '100%' }}>
          <Typography variant="h6" gutterBottom style={{ marginLeft: '16px' }}>
            Fitness Records
          </Typography>
          {records.map((record) => (
            <Grid item xs={12} md={6} lg={4} key={record.id}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {record.studentName}
                  </Typography>
                  <Typography color="textSecondary">
                    Academic Year: {record.academicYear}
                  </Typography>
                  <Typography color="textSecondary">
                    Period: {record.academicPeriod}
                  </Typography>
                  <Typography color="textSecondary">
                    Standard: {record.standard}
                  </Typography>
                  <Typography color="textSecondary">
                    Section: {record.section}
                  </Typography>
                  <Typography color="textSecondary">
                    Height: {record.height} cm
                  </Typography>
                  <Typography color="textSecondary">
                    Weight: {record.weight} kg
                  </Typography>
                  <Typography color="textSecondary">
                    BMI: {record.bmi} ({record.category})
                  </Typography>
                  <Typography color="textSecondary">
                    Fitness Activity: {record.fitnessActivity}
                  </Typography>
                  <Typography color="textSecondary">
                    Duration: {record.activityDuration ? `${record.activityDuration} minutes` : 'N/A'}
                  </Typography>
                  <Typography color="textSecondary">
                    Record Date: {record.recordDate ? record.recordDate.toDateString() : 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
};

export default BMIFitnessTracker;