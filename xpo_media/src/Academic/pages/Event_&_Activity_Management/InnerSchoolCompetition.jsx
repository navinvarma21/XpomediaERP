import React, { useState } from 'react';
import { Grid, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Box } from '@mui/material';
import { DatePicker, TimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const InnerSchoolCompetition = () => {
  const [academicYear, setAcademicYear] = useState('');
  const [academicPeriod, setAcademicPeriod] = useState('');
  const [standard, setStandard] = useState('');
  const [competitionName, setCompetitionName] = useState('');
  const [place, setPlace] = useState('');
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [competitions, setCompetitions] = useState([]);

  // Sample options - replace with actual data as needed
  const academicYears = ['2023-2024', '2024-2025', '2025-2026'];
  const academicPeriods = ['Semester 1', 'Semester 2', 'Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'];
  const standards = ['1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade'];
  const competitionNames = ['Science Fair', 'Sports Day', 'Debate Competition', 'Art Exhibition', 'Math Olympiad'];

  const handleSubmit = () => {
    if (academicYear && academicPeriod && standard && competitionName && place && date && time) {
      const newCompetition = {
        id: Date.now(),
        academicYear,
        academicPeriod,
        standard,
        competitionName,
        place,
        date,
        time
      };
      setCompetitions([...competitions, newCompetition]);
      // Reset form
      setAcademicYear('');
      setAcademicPeriod('');
      setStandard('');
      setCompetitionName('');
      setPlace('');
      setDate(null);
      setTime(null);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid container spacing={2} direction="column" alignItems="center" justifyContent="center" style={{ padding: '20px' }}>
        <Typography variant="h5" gutterBottom>
          Inner School Competition Management
        </Typography>

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
          <InputLabel id="standard-label">Standard/Grade</InputLabel>
          <Select
            labelId="standard-label"
            value={standard}
            onChange={(e) => setStandard(e.target.value)}
            label="Standard/Grade"
          >
            {standards.map((std) => (
              <MenuItem key={std} value={std}>
                {std}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth variant="outlined" margin="normal">
          <InputLabel id="competition-name-label">Competition Name</InputLabel>
          <Select
            labelId="competition-name-label"
            value={competitionName}
            onChange={(e) => setCompetitionName(e.target.value)}
            label="Competition Name"
          >
            {competitionNames.map((name) => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth variant="outlined" margin="normal">
          <TextField
            id="place"
            label="Place"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            variant="outlined"
          />
        </FormControl>

        <FormControl fullWidth margin="normal">
          <DatePicker
            label="Date"
            value={date}
            onChange={(newValue) => setDate(newValue)}
            slotProps={{ textField: { variant: 'outlined' } }}
          />
        </FormControl>

        <FormControl fullWidth margin="normal">
          <TimePicker
            label="Time"
            value={time}
            onChange={(newValue) => setTime(newValue)}
            slotProps={{ textField: { variant: 'outlined' } }}
          />
        </FormControl>

        <Button variant="contained" color="primary" onClick={handleSubmit} style={{ marginTop: '16px' }}>
          Add Competition
        </Button>

        <Grid container spacing={2} style={{ marginTop: '30px', width: '100%' }}>
          <Typography variant="h6" gutterBottom style={{ marginLeft: '16px' }}>
            Scheduled Competitions
          </Typography>
          {competitions.map((comp) => (
            <Grid item xs={12} md={6} lg={4} key={comp.id}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {comp.competitionName}
                  </Typography>
                  <Typography color="textSecondary">
                    Academic Year: {comp.academicYear}
                  </Typography>
                  <Typography color="textSecondary">
                    Period: {comp.academicPeriod}
                  </Typography>
                  <Typography color="textSecondary">
                    Standard: {comp.standard}
                  </Typography>
                  <Typography color="textSecondary">
                    Place: {comp.place}
                  </Typography>
                  <Typography color="textSecondary">
                    Date: {comp.date ? comp.date.toDateString() : 'N/A'}
                  </Typography>
                  <Typography color="textSecondary">
                    Time: {comp.time ? comp.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
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

export default InnerSchoolCompetition;