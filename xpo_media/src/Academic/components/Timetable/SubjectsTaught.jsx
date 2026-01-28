import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Tooltip } from '@mui/material';
import { Delete, SortByAlpha, FileUpload } from '@mui/icons-material';
import { useTheme, useMediaQuery } from '@mui/material';

const generateUniqueColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
  return color;
};

const SubjectsTaught = ({ timetableData, setTimetableData, setActiveStep, saveToHistory, showMessage }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [subjects, setSubjects] = useState(timetableData.subjects.map(sub => ({
    ...sub,
    color: sub.color || generateUniqueColor(),
  })));
  const [newSubject, setNewSubject] = useState('');

  const addSubject = () => {
    if (!newSubject) {
      showMessage('Please enter a subject name', 'error');
      return;
    }
    if (subjects.some(sub => sub.name.toLowerCase() === newSubject.toLowerCase())) {
      showMessage('Subject name must be unique', 'error');
      return;
    }
    const availability = {};
    timetableData.days.forEach((day) => {
      availability[day] = Array(timetableData.periods.filter(p => p.type !== 'break').length).fill(true);
    });
    const newSub = { name: newSubject, availability, color: generateUniqueColor() };
    setSubjects([...subjects, newSub]);
    setNewSubject('');
    showMessage('Subject added', 'success');
  };

  const handleBulkImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        const newSubjects = [];
        const existingNames = subjects.map(sub => sub.name.toLowerCase());

        for (let i = 1; i < lines.length; i++) {
          const name = lines[i].split(',')[0].trim();
          if (name && !existingNames.includes(name.toLowerCase())) {
            const availability = {};
            timetableData.days.forEach((day) => {
              availability[day] = Array(timetableData.periods.filter(p => p.type !== 'break').length).fill(true);
            });
            newSubjects.push({ name, availability, color: generateUniqueColor() });
            existingNames.push(name.toLowerCase());
          }
        }

        if (newSubjects.length === 0) {
          showMessage('No new valid subjects found in file', 'warning');
          return;
        }
        setSubjects([...subjects, ...newSubjects]);
        showMessage(`${newSubjects.length} subject(s) imported`, 'success');
      } catch (error) {
        showMessage('Failed to import subjects', 'error');
      }
    };
    reader.readAsText(file);
  };

  const toggleAvailability = (subjectIndex, day, periodIndex) => {
    const newSubjects = [...subjects];
    newSubjects[subjectIndex].availability[day][periodIndex] = !newSubjects[subjectIndex].availability[day][periodIndex];
    setSubjects(newSubjects);
  };

  const toggleDay = (subjectIndex, day) => {
    const newSubjects = [...subjects];
    const allAvailable = newSubjects[subjectIndex].availability[day].every(v => !v);
    newSubjects[subjectIndex].availability[day] = newSubjects[subjectIndex].availability[day].map(() => allAvailable);
    setSubjects(newSubjects);
  };

  const togglePeriod = (subjectIndex, periodIndex) => {
    const newSubjects = [...subjects];
    timetableData.days.forEach((day) => {
      newSubjects[subjectIndex].availability[day][periodIndex] = !newSubjects[subjectIndex].availability[day][periodIndex];
    });
    setSubjects(newSubjects);
  };

  const sortSubjects = () => {
    const sortedSubjects = [...subjects].sort((a, b) => a.name.localeCompare(b.name));
    setSubjects(sortedSubjects);
    showMessage('Subjects sorted alphabetically', 'success');
  };

  const deleteSubject = (index) => {
    const removed = subjects[index];
    setSubjects(subjects.filter((_, i) => i !== index));
    showMessage(`${removed.name} removed`, 'info');
  };

  const handleSubmit = () => {
    if (subjects.length === 0) {
      showMessage('Please add at least one subject', 'error');
      return;
    }
    saveToHistory(timetableData);
    setTimetableData({ ...timetableData, subjects });
    setActiveStep(2);
  };

  const nonBreakPeriods = timetableData.periods.filter(p => p.type !== 'break');

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Subjects Taught</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
        <TextField
          label="Subject Name"
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          fullWidth
          error={!newSubject && subjects.length === 0}
          helperText={!newSubject && subjects.length === 0 ? 'Subject name is required' : ''}
        />
        <Button variant="contained" onClick={addSubject} disabled={!newSubject} sx={{ minWidth: isMobile ? '100%' : 'auto', mt: isMobile ? 1 : 0 }}>Add Subject</Button>
        <Tooltip title="Import subjects from CSV (format: name)">
          <span><Button variant="outlined" component="label" startIcon={<FileUpload />} sx={{ minWidth: isMobile ? '100%' : 'auto', mt: isMobile ? 1 : 0 }}>
            Import<input type="file" hidden accept=".csv" onChange={handleBulkImport} />
          </Button></span>
        </Tooltip>
        <Tooltip title="Sort subjects alphabetically">
          <span><Button variant="outlined" onClick={sortSubjects} disabled={subjects.length === 0} startIcon={<SortByAlpha />} sx={{ minWidth: isMobile ? '100%' : 'auto', mt: isMobile ? 1 : 0 }}>Sort</Button></span>
        </Tooltip>
      </Box>

      {subjects.length === 0 ? (
        <Typography color="textSecondary" sx={{ mt: 2 }}>No subjects added yet. Please add at least one subject.</Typography>
      ) : (
        subjects.map((subject, index) => (
          <Box key={index} sx={{ mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 16, height: 16, backgroundColor: subject.color, mr: 1, borderRadius: '50%' }} />
              {subject.name}
              <IconButton onClick={() => deleteSubject(index)} size="small" sx={{ ml: 1 }}><Delete fontSize="small" /></IconButton>
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
                        sx={{ cursor: 'pointer', minWidth: '100px', backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200], title: subject.availability[day].every(v => !v) ? 'All periods unavailable' : '' }}
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
                        sx={{ cursor: 'pointer', backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200], title: timetableData.days.every(day => !subject.availability[day][pIndex]) ? 'Period unavailable for all days' : '' }}
                      >
                        {`P${pIndex + 1}`}
                      </TableCell>
                      {timetableData.days.map((day) => (
                        <TableCell
                          key={day}
                          onClick={() => toggleAvailability(index, day, pIndex)}
                          sx={{ backgroundColor: subject.availability[day][pIndex] ? theme.palette.success.main : theme.palette.error.main, cursor: 'pointer', '&:hover': { opacity: 0.8, filter: 'brightness(1.1)' }, title: !subject.availability[day][pIndex] ? 'Unavailable' : '' }}
                        />
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <Typography variant="caption" color="textSecondary">Green = Available, Red = Unavailable. Click to toggle.</Typography>
          </Box>
        ))
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button variant="outlined" onClick={() => setActiveStep(0)}>Back</Button>
        <Button variant="contained" onClick={handleSubmit}>Next</Button>
      </Box>
    </Box>
  );
};

export default SubjectsTaught;