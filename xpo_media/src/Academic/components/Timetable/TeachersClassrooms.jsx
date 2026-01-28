import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Tooltip } from '@mui/material';
import { Delete, SortByAlpha, FileUpload } from '@mui/icons-material';
import { useTheme, useMediaQuery } from '@mui/material';

const TeachersClassrooms = ({ timetableData, setTimetableData, setActiveStep, saveToHistory, showMessage }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [teachers, setTeachers] = useState(timetableData.teachers);
  const [newTeacher, setNewTeacher] = useState(''); // Added state for newTeacher

  const addTeacher = () => {
    if (!newTeacher) {
      showMessage('Please enter a teacher name', 'error');
      return;
    }
    if (teachers.some(t => t.name.toLowerCase() === newTeacher.toLowerCase())) {
      showMessage('Teacher name must be unique', 'error');
      return;
    }
    const availability = {};
    timetableData.days.forEach((day) => {
      availability[day] = Array(timetableData.periods.filter(p => p.type !== 'break').length).fill(true);
    });
    setTeachers([...teachers, { name: newTeacher, availability }]);
    setNewTeacher('');
    showMessage('Teacher added', 'success');
  };

  const handleBulkImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        const newTeachers = [];
        const existingNames = teachers.map(t => t.name.toLowerCase());

        for (let i = 1; i < lines.length; i++) {
          const name = lines[i].split(',')[0].trim();
          if (name && !existingNames.includes(name.toLowerCase())) {
            const availability = {};
            timetableData.days.forEach((day) => {
              availability[day] = Array(timetableData.periods.filter(p => p.type !== 'break').length).fill(true);
            });
            newTeachers.push({ name, availability });
            existingNames.push(name.toLowerCase());
          }
        }

        if (newTeachers.length === 0) {
          showMessage('No new valid teachers found in file', 'warning');
          return;
        }
        setTeachers([...teachers, ...newTeachers]);
        showMessage(`${newTeachers.length} teacher(s) imported`, 'success');
      } catch (error) {
        showMessage('Failed to import teachers', 'error');
      }
    };
    reader.readAsText(file);
  };

  const toggleAvailability = (teacherIndex, day, periodIndex) => {
    const newTeachers = [...teachers];
    newTeachers[teacherIndex].availability[day][periodIndex] = !newTeachers[teacherIndex].availability[day][periodIndex];
    setTeachers(newTeachers);
  };

  const toggleDay = (teacherIndex, day) => {
    const newTeachers = [...teachers];
    const allAvailable = newTeachers[teacherIndex].availability[day].every(v => !v);
    newTeachers[teacherIndex].availability[day] = newTeachers[teacherIndex].availability[day].map(() => allAvailable);
    setTeachers(newTeachers);
  };

  const togglePeriod = (teacherIndex, periodIndex) => {
    const newTeachers = [...teachers];
    timetableData.days.forEach((day) => {
      newTeachers[teacherIndex].availability[day][periodIndex] = !newTeachers[teacherIndex].availability[day][periodIndex];
    });
    setTeachers(newTeachers);
  };

  const sortTeachers = () => {
    const sortedTeachers = [...teachers].sort((a, b) => a.name.localeCompare(b.name));
    setTeachers(sortedTeachers);
    showMessage('Teachers sorted alphabetically', 'success');
  };

  const deleteTeacher = (index) => {
    const removed = teachers[index];
    setTeachers(teachers.filter((_, i) => i !== index));
    showMessage(`${removed.name} removed`, 'info');
  };

  const handleSubmit = () => {
    if (teachers.length === 0) {
      showMessage('Please add at least one teacher', 'error');
      return;
    }
    saveToHistory(timetableData);
    setTimetableData({ ...timetableData, teachers, classrooms: [] });
    setActiveStep(3);
  };

  const nonBreakPeriods = timetableData.periods.filter(p => p.type !== 'break');

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Teachers</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
        <TextField
          label="Teacher Name"
          value={newTeacher}
          onChange={(e) => setNewTeacher(e.target.value)}
          fullWidth
          error={!newTeacher && teachers.length === 0}
          helperText={!newTeacher && teachers.length === 0 ? 'Teacher name is required' : ''}
        />
        <Button variant="contained" onClick={addTeacher} disabled={!newTeacher} sx={{ minWidth: isMobile ? '100%' : 'auto', mt: isMobile ? 1 : 0 }}>Add Teacher</Button>
        <Tooltip title="Import teachers from CSV (format: name)">
          <span>
            <Button
              variant="outlined"
              component="label"
              startIcon={<FileUpload />}
              sx={{ minWidth: isMobile ? '100%' : 'auto', mt: isMobile ? 1 : 0 }}
            >
              Import
              <input type="file" hidden accept=".csv" onChange={handleBulkImport} />
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Sort teachers alphabetically">
          <span>
            <Button
              variant="outlined"
              onClick={sortTeachers}
              disabled={teachers.length === 0}
              startIcon={<SortByAlpha />}
              sx={{ minWidth: isMobile ? '100%' : 'auto', mt: isMobile ? 1 : 0 }}
            >
              Sort
            </Button>
          </span>
        </Tooltip>
      </Box>

      {teachers.length === 0 ? (
        <Typography color="textSecondary" sx={{ mt: 2 }}>
          No teachers added yet. Please add at least one teacher.
        </Typography>
      ) : (
        teachers.map((teacher, index) => (
          <Box key={index} sx={{ mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom>
              {teacher.name}
              <IconButton onClick={() => deleteTeacher(index)} size="small" sx={{ ml: 1 }}>
                <Delete fontSize="small" />
              </IconButton>
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: '80px' }}>Period</TableCell>
                    {timetableData.days.map((day) => (
                      <TableCell
                        key={day}
                        onClick={() => toggleDay(index, day)}
                        sx={{
                          cursor: 'pointer',
                          minWidth: '100px',
                          backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
                          title: teacher.availability[day].every(v => !v) ? 'All periods unavailable' : '',
                        }}
                      >
                        {day}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {nonBreakPeriods.map((_, pIndex) => (
                    <TableRow key={pIndex}>
                      <TableCell
                        onClick={() => togglePeriod(index, pIndex)}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
                          title: timetableData.days.every(day => !teacher.availability[day][pIndex]) ? 'Period unavailable for all days' : '',
                        }}
                      >
                        {`P${pIndex + 1}`}
                      </TableCell>
                      {timetableData.days.map((day) => (
                        <TableCell
                          key={day}
                          onClick={() => toggleAvailability(index, day, pIndex)}
                          sx={{
                            backgroundColor: teacher.availability[day][pIndex]
                              ? theme.palette.success.main
                              : theme.palette.error.main,
                            cursor: 'pointer',
                            '&:hover': {
                              opacity: 0.8,
                              filter: 'brightness(1.1)',
                            },
                            title: !teacher.availability[day][pIndex] ? 'Unavailable' : '',
                          }}
                        />
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <Typography variant="caption" color="textSecondary">
              Green = Available, Red = Unavailable. Click to toggle.
            </Typography>
          </Box>
        ))
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button variant="outlined" onClick={() => setActiveStep(1)}>Back</Button>
        <Button variant="contained" onClick={handleSubmit}>Next</Button>
      </Box>
    </Box>
  );
};

export default TeachersClassrooms;