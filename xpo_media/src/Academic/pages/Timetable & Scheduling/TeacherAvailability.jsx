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
const initialAvailability = [
  { teacher: 'John', day: 'Monday', time: '9:00 AM', available: true, academicYear: '2024-2025', academicPeriod: 'Term 1' },
  { teacher: 'John', day: 'Monday', time: '10:00 AM', available: false, academicYear: '2024-2025', academicPeriod: 'Term 1' },
  { teacher: 'John', day: 'Tuesday', time: '9:00 AM', available: false, academicYear: '2024-2025', academicPeriod: 'Term 1' },
  { teacher: 'John', day: 'Tuesday', time: '10:00 AM', available: true, academicYear: '2024-2025', academicPeriod: 'Term 1' },
  { teacher: 'Jane', day: 'Monday', time: '9:00 AM', available: false, academicYear: '2024-2025', academicPeriod: 'Term 1' },
  { teacher: 'Jane', day: 'Monday', time: '10:00 AM', available: true, academicYear: '2024-2025', academicPeriod: 'Term 1' },
  { teacher: 'Jane', day: 'Tuesday', time: '9:00 AM', available: true, academicYear: '2024-2025', academicPeriod: 'Term 1' },
  { teacher: 'Jane', day: 'Tuesday', time: '10:00 AM', available: false, academicYear: '2024-2025', academicPeriod: 'Term 1' },
  { teacher: 'John', day: 'Monday', time: '9:00 AM', available: false, academicYear: '2024-2025', academicPeriod: 'Term 2' },
  { teacher: 'John', day: 'Monday', time: '10:00 AM', available: true, academicYear:"2024-2025", academicPeriod: 'Term 2' },
  { teacher: 'John', day: 'Monday', time: '9:00 AM', available: true, academicYear: '2025-2026', academicPeriod: 'Term 1' },
  { teacher: 'John', day: 'Monday', time: '10:00 AM', available: false, academicYear: '2025-2026', academicPeriod: 'Term 1' },
];

// Days and time slots for the timetable
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timeSlots = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
];

// List of teachers, academic years, and academic periods for dropdowns
const teachers = ['John', 'Jane', 'Alex'];
const academicYears = ['2023-2024', '2024-2025', '2025-2026'];
const academicPeriods = ['Term 1', 'Term 2', 'Term 3'];

const TeacherAvailability = () => {
  // State for selected teacher, academic year, academic period, and availability
  const [selectedTeacher, setSelectedTeacher] = useState(teachers[0]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(academicYears[1]);
  const [selectedAcademicPeriod, setSelectedAcademicPeriod] = useState(academicPeriods[0]);
  const [availability, setAvailability] = useState(initialAvailability);

  // Handle teacher selection
  const handleTeacherChange = (event) => {
    setSelectedTeacher(event.target.value);
  };

  // Handle academic year selection
  const handleAcademicYearChange = (event) => {
    setSelectedAcademicYear(event.target.value);
  };

  // Handle academic period selection
  const handleAcademicPeriodChange = (event) => {
    setSelectedAcademicPeriod(event.target.value);
  };

  // Handle toggling availability
  const handleToggleAvailability = (teacher, day, time, academicYear, academicPeriod) => {
    setAvailability((prev) => {
      const slotExists = prev.find(
        (item) =>
          item.teacher === teacher &&
          item.day === day &&
          item.time === time &&
          item.academicYear === academicYear &&
          item.academicPeriod === academicPeriod
      );
      if (slotExists) {
        return prev.map((item) =>
          item.teacher === teacher &&
          item.day === day &&
          item.time === time &&
          item.academicYear === academicYear &&
          item.academicPeriod === academicPeriod
            ? { ...item, available: !item.available }
            : item
        );
      } else {
        return [...prev, { teacher, day, time, available: true, academicYear, academicPeriod }];
      }
    });
  };

  // Handle save button click
  const handleSave = () => {
    console.log('Updated availability:', availability);
    // Add logic to save to backend if needed
  };

  // Filter availability based on selected teacher, academic year, and academic period
  const teacherAvailability = availability.filter(
    (item) =>
      item.teacher === selectedTeacher &&
      item.academicYear === selectedAcademicYear &&
      item.academicPeriod === selectedAcademicPeriod
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Teacher Availability
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="teacher-select-label">Teacher</InputLabel>
          <Select
            labelId="teacher-select-label"
            value={selectedTeacher}
            label="Teacher"
            onChange={handleTeacherChange}
          >
            {teachers.map((teacher) => (
              <MenuItem key={teacher} value={teacher}>
                {teacher}
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
          <InputLabel id="academic-period-select-label">Academic Period</InputLabel>
          <Select
            labelId="academic-period-select-label"
            value={selectedAcademicPeriod}
            label="Academic Period"
            onChange={handleAcademicPeriodChange}
          >
            {academicPeriods.map((period) => (
              <MenuItem key={period} value={period}>
                {period}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              {days.map((day) => (
                <TableCell key={day} align="center">
                  {day}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {timeSlots.map((time) => (
              <TableRow key={time}>
                <TableCell>{time}</TableCell>
                {days.map((day) => {
                  const slot = teacherAvailability.find(
                    (item) => item.day === day && item.time === time
                  );
                  const isAvailable = slot ? slot.available : false;
                  return (
                    <TableCell
                      key={`${day}-${time}`}
                      align="center"
                      sx={{
                        backgroundColor: isAvailable ? '#e0f7fa' : '#ffebee',
                        cursor: 'pointer',
                      }}
                      onClick={() =>
                        handleToggleAvailability(
                          selectedTeacher,
                          day,
                          time,
                          selectedAcademicYear,
                          selectedAcademicPeriod
                        )
                      }
                    >
                      {isAvailable ? 'Available' : 'Unavailable'}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" color="primary" onClick={handleSave}>
          Save Changes
        </Button>
      </Box>
    </Box>
  );
};

export default TeacherAvailability;