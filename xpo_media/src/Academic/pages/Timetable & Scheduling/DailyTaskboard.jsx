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

// Static data for tasks (replace with your data source)
const initialTasks = [
  {
    teacher: 'John',
    day: 'Monday',
    time: '9:00 AM',
    subject: 'Math',
    task: 'Teach Algebra',
    status: 'Incomplete',
    academicYear: '2024-2025',
    academicPeriod: 'Term 1',
  },
  {
    teacher: 'John',
    day: 'Monday',
    time: '10:00 AM',
    subject: 'Science',
    task: 'Conduct Lab Experiment',
    status: 'Completed',
    academicYear: '2024-2025',
    academicPeriod: 'Term 1',
  },
  {
    teacher: 'Jane',
    day: 'Tuesday',
    time: '9:00 AM',
    subject: 'English',
    task: 'Review Essays',
    status: 'Incomplete',
    academicYear: '2024-2025',
    academicPeriod: 'Term 1',
  },
  {
    teacher: 'Jane',
    day: 'Tuesday',
    time: '10:00 AM',
    subject: 'Math',
    task: 'Grade Homework',
    status: 'Completed',
    academicYear: '2024-2025',
    academicPeriod: 'Term 1',
  },
  {
    teacher: 'John',
    day: 'Monday',
    time: '9:00 AM',
    subject: 'Math',
    task: 'Teach Geometry',
    status: 'Incomplete',
    academicYear: '2024-2025',
    academicPeriod: 'Term 2',
  },
];

// Static availability data to ensure tasks align with availability
const availabilityData = [
  { teacher: 'John', day: 'Monday', time: '9:00 AM', available: true, academicYear: '2024-2025', academicPeriod: 'Term 1' },
  { teacher: 'John', day: 'Monday', time: '10:00 AM', available: true, academicYear: '2024-2025', academicPeriod: 'Term 1' },
  { teacher: 'Jane', day: 'Tuesday', time: '9:00 AM', available: true, academicYear: '2024-2025', academicPeriod: 'Term 1' },
  { teacher: 'Jane', day: 'Tuesday', time: '10:00 AM', available: true, academicYear: '2024-2025', academicPeriod: 'Term 1' },
  { teacher: 'John', day: 'Monday', time: '9:00 AM', available: true, academicYear: '2024-2025', academicPeriod: 'Term 2' },
];

// Dropdown options
const teachers = ['John', 'Jane', 'Alex'];
const academicYears = ['2023-2024', '2024-2025', '2025-2026'];
const academicPeriods = ['Term 1', 'Term 2', 'Term 3'];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const subjects = ['Math', 'Science', 'English', 'History'];

const DailyTaskboard = () => {
  // State for dropdowns and tasks
  const [selectedTeacher, setSelectedTeacher] = useState(teachers[0]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(academicYears[1]);
  const [selectedAcademicPeriod, setSelectedAcademicPeriod] = useState(academicPeriods[0]);
  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [tasks, setTasks] = useState(initialTasks);

  // Handle dropdown changes
  const handleTeacherChange = (event) => {
    setSelectedTeacher(event.target.value);
  };

  const handleAcademicYearChange = (event) => {
    setSelectedAcademicYear(event.target.value);
  };

  const handleAcademicPeriodChange = (event) => {
    setSelectedAcademicPeriod(event.target.value);
  };

  const handleDayChange = (event) => {
    setSelectedDay(event.target.value);
  };

  const handleSubjectChange = (event) => {
    setSelectedSubject(event.target.value);
  };

  // Handle toggling task status
  const handleToggleStatus = (taskIndex) => {
    setTasks((prev) =>
      prev.map((task, index) =>
        index === taskIndex ? { ...task, status: task.status === 'Completed' ? 'Incomplete' : 'Completed' } : task
      )
    );
  };

  // Handle adding a new task (simple example)
  const handleAddTask = () => {
    const newTask = {
      teacher: selectedTeacher,
      day: selectedDay,
      time: '9:00 AM', // Default time; adjust as needed
      subject: selectedSubject || subjects[0],
      task: `New Task for ${selectedSubject || 'General'}`,
      status: 'Incomplete',
      academicYear: selectedAcademicYear,
      academicPeriod: selectedAcademicPeriod,
    };
    setTasks((prev) => [...prev, newTask]);
  };

  // Handle save button click
  const handleSave = () => {
    console.log('Updated tasks:', tasks);
    // Add logic to save to backend if needed
  };

  // Filter tasks based on selections
  const filteredTasks = tasks.filter(
    (task) =>
      task.teacher === selectedTeacher &&
      task.academicYear === selectedAcademicYear &&
      task.academicPeriod === selectedAcademicPeriod &&
      task.day === selectedDay &&
      (!selectedSubject || task.subject === selectedSubject) &&
      availabilityData.some(
        (avail) =>
          avail.teacher === task.teacher &&
          avail.day === task.day &&
          avail.time === task.time &&
          avail.academicYear === task.academicYear &&
          avail.academicPeriod === task.academicPeriod &&
          avail.available
      )
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Daily Taskboard for Teachers
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
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
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="day-select-label">Day</InputLabel>
          <Select
            labelId="day-select-label"
            value={selectedDay}
            label="Day"
            onChange={handleDayChange}
          >
            {days.map((day) => (
              <MenuItem key={day} value={day}>
                {day}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="subject-select-label">Subject</InputLabel>
          <Select
            labelId="subject-select-label"
            value={selectedSubject}
            label="Subject"
            onChange={handleSubjectChange}
          >
            <MenuItem value="">All Subjects</MenuItem>
            {subjects.map((subject) => (
              <MenuItem key={subject} value={subject}>
                {subject}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" color="secondary" onClick={handleAddTask} disabled={!selectedSubject}>
          Add Task
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Task</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task, index) => (
                <TableRow key={index}>
                  <TableCell>{task.time}</TableCell>
                  <TableCell>{task.subject}</TableCell>
                  <TableCell>{task.task}</TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: task.status === 'Completed' ? '#e0f7fa' : '#ffebee',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleToggleStatus(index)}
                  >
                    {task.status}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No tasks found for the selected filters.
                </TableCell>
              </TableRow>
            )}
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

export default DailyTaskboard;