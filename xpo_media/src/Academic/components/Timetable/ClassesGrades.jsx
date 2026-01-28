import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  TableContainer,
} from '@mui/material';
import { Delete, SortByAlpha, FileUpload, Info } from '@mui/icons-material';
import { useMediaQuery } from '@mui/material';

const ClassesGrades = ({ timetableData, setTimetableData, setActiveStep, saveToHistory, showMessage }) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const [classes, setClasses] = useState(timetableData.classes.map(cls => ({
    ...cls,
    availability: cls.availability || Object.fromEntries(
      timetableData.days.map(day => [day, Array(timetableData.periods.filter(p => p.type !== 'break').length).fill(true)])
    ),
  })));
  const [newClass, setNewClass] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [errors, setErrors] = useState({ className: false });
  const [isSorted, setIsSorted] = useState(false);

  const addClass = () => {
    const newErrors = { className: !newClass };
    setErrors(newErrors);

    if (!newClass) {
      showMessage('Please enter a class name', 'error');
      return;
    }
    if (classes.some(cls => cls.name.toLowerCase() === newClass.toLowerCase())) {
      showMessage('Class name must be unique', 'error');
      return;
    }
    if (selectedTeacher && !timetableData.teachers.some(t => t.name === selectedTeacher)) {
      showMessage('Selected teacher does not exist', 'error');
      return;
    }

    const availability = {};
    timetableData.days.forEach((day) => {
      availability[day] = Array(timetableData.periods.filter(p => p.type !== 'break').length).fill(true);
    });

    const newClassObj = { name: newClass, teacher: selectedTeacher || null, availability };
    setClasses([...classes, newClassObj]);
    setNewClass('');
    setSelectedTeacher('');
    setErrors({ className: false });
    showMessage('Class added', 'success');
  };

  const handleBulkImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        const newClasses = [];
        const existingNames = classes.map(cls => cls.name.toLowerCase());
        const validTeachers = timetableData.teachers.map(t => t.name);

        for (let i = 1; i < lines.length; i++) {
          const [name, teacher] = lines[i].split(',').map(item => item.trim());
          if (name && !existingNames.includes(name.toLowerCase())) {
            if (teacher && !validTeachers.includes(teacher)) {
              showMessage(`Invalid teacher "${teacher}" for class "${name}"`, 'warning');
              continue;
            }
            const availability = {};
            timetableData.days.forEach((day) => {
              availability[day] = Array(timetableData.periods.filter(p => p.type !== 'break').length).fill(true);
            });
            newClasses.push({ name, teacher: teacher || null, availability });
            existingNames.push(name.toLowerCase());
          }
        }

        if (newClasses.length === 0) {
          showMessage('No new valid classes found in file', 'warning');
          return;
        }
        setClasses([...classes, ...newClasses]);
        showMessage(`${newClasses.length} class(es) imported`, 'success');
      } catch (error) {
        showMessage('Failed to import classes', 'error');
      }
    };
    reader.readAsText(file);
  };

  const toggleAvailability = (classIndex, day, periodIndex) => {
    const newClasses = [...classes];
    newClasses[classIndex].availability[day][periodIndex] = !newClasses[classIndex].availability[day][periodIndex];
    setClasses(newClasses);
  };

  const toggleDay = (classIndex, day) => {
    const newClasses = [...classes];
    const allAvailable = newClasses[classIndex].availability[day].every(v => !v);
    newClasses[classIndex].availability[day] = newClasses[classIndex].availability[day].map(() => allAvailable);
    setClasses(newClasses);
  };

  const togglePeriod = (classIndex, periodIndex) => {
    const newClasses = [...classes];
    timetableData.days.forEach((day) => {
      newClasses[classIndex].availability[day][periodIndex] = !newClasses[classIndex].availability[day][periodIndex];
    });
    setClasses(newClasses);
  };

  const sortClasses = () => {
    const sortedClasses = [...classes].sort((a, b) => a.name.localeCompare(b.name));
    setClasses(sortedClasses);
    setIsSorted(true);
    showMessage('Classes sorted alphabetically', 'success');
  };

  const deleteClass = (index) => {
    const removed = classes[index];
    setClasses(classes.filter((_, i) => i !== index));
    showMessage(`${removed.name} removed`, 'info');
  };

  const handleSubmit = () => {
    if (classes.length === 0) {
      showMessage('Please add at least one class', 'error');
      return;
    }
    saveToHistory(timetableData);
    setTimetableData({ ...timetableData, classes });
    setActiveStep(4);
    showMessage('Navigating to Rooms', 'info');
  };

  const nonBreakPeriods = timetableData.periods.filter(p => p.type !== 'break');

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Classes/Grades</Typography>
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, mb: 2, alignItems: isMobile ? 'stretch' : 'center' }}>
        <TextField
          label="Class Name"
          value={newClass}
          onChange={(e) => setNewClass(e.target.value)}
          fullWidth
          error={errors.className}
          helperText={errors.className ? 'Class name is required' : ''}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Class Teacher (Optional)</InputLabel>
            <Select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)} label="Class Teacher (Optional)">
              <MenuItem value="">None</MenuItem>
              {timetableData.teachers.map((teacher) => <MenuItem key={teacher.name} value={teacher.name}>{teacher.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Tooltip title={<Typography variant="body2">- Assigning a class teacher schedules them for the first period with this class.<br />- Helps class teachers meet their class in the morning.<br />- Leave empty if no special scheduling is needed.</Typography>}>
            <span><IconButton disabled={false}><Info fontSize="small" /></IconButton></span>
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
          <Button variant="contained" onClick={addClass} sx={{ height: '56px', minWidth: isMobile ? '100%' : '120px' }}>Add Class</Button>
          <Tooltip title="Import classes from CSV (format: name,teacher)">
            <span><Button variant="outlined" component="label" startIcon={<FileUpload />} sx={{ height: '56px', minWidth: isMobile ? '100%' : '120px' }}>
              Import<input type="file" hidden accept=".csv" onChange={handleBulkImport} />
            </Button></span>
          </Tooltip>
          <Tooltip title="Sort classes alphabetically">
            <span><Button variant="outlined" onClick={sortClasses} disabled={isSorted || classes.length === 0} startIcon={<SortByAlpha />} sx={{ height: '56px', minWidth: isMobile ? '100%' : '120px' }}>Sort</Button></span>
          </Tooltip>
        </Box>
      </Box>

      {classes.length === 0 ? (
        <Typography color="textSecondary" sx={{ mt: 2 }}>No classes added yet. Please add at least one class.</Typography>
      ) : (
        <>
          <TableContainer sx={{ maxHeight: 400, mb: 3 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Class Name</TableCell>
                  <TableCell>Class Teacher</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {classes.map((cls, index) => (
                  <TableRow key={index}>
                    <TableCell>{cls.name}</TableCell>
                    <TableCell>{cls.teacher || 'None'}</TableCell>
                    <TableCell><IconButton onClick={() => deleteClass(index)}><Delete /></IconButton></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {classes.map((cls, index) => (
            <Box key={index} sx={{ mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>Availability for {cls.name}</Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: '80px' }}>Period</TableCell>
                      {timetableData.days.map((day) => (
                        <TableCell
                          key={day}
                          onClick={() => toggleDay(index, day)}
                          sx={{ cursor: 'pointer', minWidth: '100px', backgroundColor: theme => theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200], title: cls.availability[day].every(v => !v) ? 'All periods unavailable' : '' }}
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
                          sx={{ cursor: 'pointer', backgroundColor: theme => theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200], title: timetableData.days.every(day => !cls.availability[day][pIndex]) ? 'Period unavailable for all days' : '' }}
                        >
                          {`P${pIndex + 1}`}
                        </TableCell>
                        {timetableData.days.map((day) => (
                          <TableCell
                            key={day}
                            onClick={() => toggleAvailability(index, day, pIndex)}
                            sx={{ backgroundColor: cls.availability[day][pIndex] ? theme => theme.palette.success.main : theme => theme.palette.error.main, cursor: 'pointer', '&:hover': { opacity: 0.8, filter: 'brightness(1.1)' }, title: !cls.availability[day][pIndex] ? 'Unavailable' : '' }}
                          />
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              <Typography variant="caption" color="textSecondary">Green = Available, Red = Unavailable. Click to toggle.</Typography>
            </Box>
          ))}
        </>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button variant="outlined" onClick={() => setActiveStep(2)}>Back</Button>
        <Button variant="contained" onClick={handleSubmit}>Next</Button>
      </Box>
    </Box>
  );
};

export default ClassesGrades;