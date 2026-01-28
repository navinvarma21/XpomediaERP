import React, { useState } from 'react';
import { Grid, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Chip, Box } from '@mui/material';
import { DatePicker, TimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const ParentTeacherMeetingSchedule = () => {
  const [academicYear, setAcademicYear] = useState('');
  const [studentName, setStudentName] = useState('');
  const [meetingDate, setMeetingDate] = useState(null);
  const [meetingTime, setMeetingTime] = useState(null);
  const [duration, setDuration] = useState('30');
  const [teacherName, setTeacherName] = useState('');
  const [status, setStatus] = useState('Scheduled');
  const [notes, setNotes] = useState('');
  const [schedules, setSchedules] = useState([]);

  // Sample options - replace with actual data as needed
  const academicYears = ['2023-2024', '2024-2025', '2025-2026'];
  const studentNames = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown'];
  const teachers = ['Mr. Smith', 'Ms. Johnson', 'Dr. Brown', 'Mrs. Wilson'];
  const durations = ['15', '30', '45', '60'];
  const statuses = ['Scheduled', 'Confirmed', 'Completed', 'Cancelled'];

  const handleSubmit = () => {
    if (studentName && meetingDate && meetingTime && teacherName) {
      const newSchedule = {
        id: Date.now(),
        academicYear,
        studentName,
        meetingDate,
        meetingTime,
        duration,
        teacherName,
        status,
        notes
      };
      setSchedules([...schedules, newSchedule]);
      // Reset form
      setAcademicYear('');
      setStudentName('');
      setMeetingDate(null);
      setMeetingTime(null);
      setDuration('30');
      setTeacherName('');
      setStatus('Scheduled');
      setNotes('');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled': return 'default';
      case 'Confirmed': return 'success';
      case 'Completed': return 'primary';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid container spacing={2} direction="column" alignItems="center" justifyContent="center" style={{ padding: '20px' }}>
        <Typography variant="h5" gutterBottom>
          Parent-Teacher Meeting Schedule
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
          <DatePicker
            label="Meeting Date"
            value={meetingDate}
            onChange={(newValue) => setMeetingDate(newValue)}
            slotProps={{ textField: { variant: 'outlined' } }}
          />
        </FormControl>

        <FormControl fullWidth margin="normal">
          <TimePicker
            label="Meeting Time"
            value={meetingTime}
            onChange={(newValue) => setMeetingTime(newValue)}
            slotProps={{ textField: { variant: 'outlined' } }}
          />
        </FormControl>

        <FormControl fullWidth variant="outlined" margin="normal">
          <InputLabel id="duration-label">Duration (minutes)</InputLabel>
          <Select
            labelId="duration-label"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            label="Duration (minutes)"
          >
            {durations.map((dur) => (
              <MenuItem key={dur} value={dur}>
                {dur} minutes
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth variant="outlined" margin="normal">
          <InputLabel id="teacher-name-label">Teacher's Name</InputLabel>
          <Select
            labelId="teacher-name-label"
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            label="Teacher's Name"
          >
            {teachers.map((teacher) => (
              <MenuItem key={teacher} value={teacher}>
                {teacher}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth variant="outlined" margin="normal">
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            labelId="status-label"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            label="Status"
          >
            {statuses.map((stat) => (
              <MenuItem key={stat} value={stat}>
                {stat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth variant="outlined" margin="normal">
          <TextField
            id="notes"
            label="Additional Notes"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            variant="outlined"
          />
        </FormControl>

        <Button variant="contained" color="primary" onClick={handleSubmit} style={{ marginTop: '16px' }}>
          Schedule Meeting
        </Button>

        <Grid container spacing={2} style={{ marginTop: '30px', width: '100%' }}>
          <Typography variant="h6" gutterBottom style={{ marginLeft: '16px' }}>
            Scheduled Meetings
          </Typography>
          {schedules.map((schedule) => (
            <Grid item xs={12} md={6} lg={4} key={schedule.id}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {schedule.studentName} - {schedule.teacherName}
                  </Typography>
                  <Typography color="textSecondary">
                    Date: {schedule.meetingDate ? schedule.meetingDate.toDateString() : 'N/A'}
                  </Typography>
                  <Typography color="textSecondary">
                    Time: {schedule.meetingTime ? schedule.meetingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </Typography>
                  <Typography color="textSecondary">
                    Duration: {schedule.duration} minutes
                  </Typography>
                  <Typography color="textSecondary">
                    Academic Year: {schedule.academicYear || 'N/A'}
                  </Typography>
                  <Box marginTop={1}>
                    <Chip 
                      label={schedule.status} 
                      color={getStatusColor(schedule.status)} 
                      size="small" 
                    />
                  </Box>
                  {schedule.notes && (
                    <Typography variant="body2" style={{ marginTop: '8px', fontStyle: 'italic' }}>
                      Notes: {schedule.notes}
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

export default ParentTeacherMeetingSchedule;