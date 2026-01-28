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
  Chip,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import { Delete, FileUpload, Add } from '@mui/icons-material';
import { useMediaQuery } from '@mui/material';

const ClassLessons = ({ timetableData, setTimetableData, setActiveStep, saveToHistory, showMessage }) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const [lessons, setLessons] = useState(timetableData.lessons);
  const [newLesson, setNewLesson] = useState({
    classNames: [],
    teacherNames: [],
    subjectNames: [],
    periodsPerWeek: '',
    lessonLength: 1,
    splitGroups: null,
  });
  const [splitGroupsEnabled, setSplitGroupsEnabled] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', teachers: [], subjects: [], room: '' });
  const [groups, setGroups] = useState([]);
  const [errors, setErrors] = useState({
    classNames: false,
    teacherNames: false,
    subjectNames: false,
    periodsPerWeek: false,
    groupName: false,
    groupTeachers: false,
    groupSubjects: false,
  });
  const [viewMode, setViewMode] = useState('classWise');

  const validateLesson = () => {
    const newErrors = {
      classNames: newLesson.classNames.length === 0,
      teacherNames: newLesson.teacherNames.length === 0,
      subjectNames: newLesson.subjectNames.length === 0,
      periodsPerWeek: !newLesson.periodsPerWeek || newLesson.periodsPerWeek <= 0,
      groupName: splitGroupsEnabled && groups.some(g => !g.name),
      groupTeachers: splitGroupsEnabled && groups.some(g => g.teachers.length === 0),
      groupSubjects: splitGroupsEnabled && groups.some(g => g.subjects.length === 0),
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const addGroup = () => {
    if (!newGroup.name || newGroup.teachers.length === 0 || newGroup.subjects.length === 0) {
      setErrors({
        ...errors,
        groupName: !newGroup.name,
        groupTeachers: newGroup.teachers.length === 0,
        groupSubjects: newGroup.subjects.length === 0,
      });
      showMessage('Please fill all group details', 'error');
      return;
    }
    setGroups([...groups, newGroup]);
    setNewGroup({ name: '', teachers: [], subjects: [], room: '' });
    showMessage('Group added to lesson', 'success');
  };

  const addLesson = () => {
    if (!validateLesson()) {
      showMessage('Please fill all lesson details correctly', 'error');
      return;
    }
    if (!newLesson.classNames.every(cls => timetableData.classes.some(c => c.name === cls))) {
      showMessage('Invalid class selected', 'error');
      return;
    }
    if (!newLesson.teacherNames.every(tch => timetableData.teachers.some(t => t.name === tch))) {
      showMessage('Invalid teacher selected', 'error');
      return;
    }
    if (!newLesson.subjectNames.every(sub => timetableData.subjects.some(s => s.name === sub))) {
      showMessage('Invalid subject selected', 'error');
      return;
    }
    if (groups.some(g => g.room && !timetableData.rooms.some(r => r.name === g.room))) {
      showMessage('Invalid room selected', 'error');
      return;
    }

    const lesson = {
      ...newLesson,
      periodsPerWeek: parseInt(newLesson.periodsPerWeek),
      splitGroups: splitGroupsEnabled && groups.length > 0 ? groups : null,
    };
    setLessons([...lessons, lesson]);
    setNewLesson({ classNames: [], teacherNames: [], subjectNames: [], periodsPerWeek: '', lessonLength: 1, splitGroups: null });
    setSplitGroupsEnabled(false);
    setGroups([]);
    setErrors({
      classNames: false,
      teacherNames: false,
      subjectNames: false,
      periodsPerWeek: false,
      groupName: false,
      groupTeachers: false,
      groupSubjects: false,
    });
    showMessage('Lesson added successfully', 'success');
  };

  const handleBulkImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        const newLessons = [];
        const validClasses = timetableData.classes.map(c => c.name);
        const validTeachers = timetableData.teachers.map(t => t.name);
        const validSubjects = timetableData.subjects.map(s => s.name);

        for (let i = 1; i < lines.length; i++) {
          const [teachers, classes, subjects, periods] = lines[i].split(',').map(item => item.trim());
          const teacherNames = teachers.split(';').filter(t => t && validTeachers.includes(t));
          const classNames = classes.split(';').filter(c => c && validClasses.includes(c));
          const subjectNames = subjects.split(';').filter(s => s && validSubjects.includes(s));
          const periodsPerWeek = parseInt(periods);

          if (teacherNames.length > 0 && classNames.length > 0 && subjectNames.length > 0 && periodsPerWeek > 0) {
            newLessons.push({
              classNames,
              teacherNames,
              subjectNames,
              periodsPerWeek,
              lessonLength: 1,
              splitGroups: null,
            });
          } else {
            showMessage(`Invalid data in line ${i + 1}`, 'warning');
          }
        }

        if (newLessons.length === 0) {
          showMessage('No valid lessons found in file', 'warning');
          return;
        }
        setLessons([...lessons, ...newLessons]);
        showMessage(`${newLessons.length} lesson(s) imported`, 'success');
      } catch (error) {
        showMessage('Failed to import lessons', 'error');
      }
    };
    reader.readAsText(file);
  };

  const removeLesson = (index) => {
    setLessons(lessons.filter((_, i) => i !== index));
    showMessage('Lesson removed', 'info');
  };

  const handleViewChange = (event, newValue) => {
    setViewMode(newValue);
  };

  const groupedLessons = viewMode === 'classWise'
    ? timetableData.classes.reduce((acc, cls) => {
        const classLessons = lessons.filter(l => l.classNames.includes(cls.name));
        if (classLessons.length > 0) acc[cls.name] = classLessons;
        return acc;
      }, {})
    : timetableData.teachers.reduce((acc, tch) => {
        const teacherLessons = lessons.filter(l => l.teacherNames.includes(tch.name));
        if (teacherLessons.length > 0) acc[tch.name] = teacherLessons;
        return acc;
      }, {});

  const handleSubmit = () => {
    if (lessons.length === 0) {
      showMessage('Please add at least one lesson', 'error');
      return;
    }
    saveToHistory(timetableData);
    setTimetableData({ ...timetableData, lessons });
    setActiveStep(6);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Class Lessons</Typography>
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, mb: 3, alignItems: isMobile ? 'stretch' : 'start' }}>
        <FormControl fullWidth error={errors.classNames}>
          <InputLabel>Classes</InputLabel>
          <Select multiple value={newLesson.classNames} onChange={(e) => setNewLesson({ ...newLesson, classNames: e.target.value })} label="Classes" renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => <Chip key={value} label={value} size="small" />)}
            </Box>
          )}>
            {timetableData.classes.map((cls) => <MenuItem key={cls.name} value={cls.name}>{cls.name}</MenuItem>)}
          </Select>
          {errors.classNames && <Typography variant="caption" color="error">Please select at least one class</Typography>}
        </FormControl>
        <FormControl fullWidth error={errors.teacherNames}>
          <InputLabel>Teachers</InputLabel>
          <Select multiple value={newLesson.teacherNames} onChange={(e) => setNewLesson({ ...newLesson, teacherNames: e.target.value })} label="Teachers" renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => <Chip key={value} label={value} size="small" />)}
            </Box>
          )}>
            {timetableData.teachers.map((teacher) => <MenuItem key={teacher.name} value={teacher.name}>{teacher.name}</MenuItem>)}
          </Select>
          {errors.teacherNames && <Typography variant="caption" color="error">Please select at least one teacher</Typography>}
        </FormControl>
        <FormControl fullWidth error={errors.subjectNames}>
          <InputLabel>Subjects</InputLabel>
          <Select multiple value={newLesson.subjectNames} onChange={(e) => setNewLesson({ ...newLesson, subjectNames: e.target.value })} label="Subjects" renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => <Chip key={value} label={value} size="small" />)}
            </Box>
          )}>
            {timetableData.subjects.map((sub) => <MenuItem key={sub.name} value={sub.name}>{sub.name}</MenuItem>)}
          </Select>
          {errors.subjectNames && <Typography variant="caption" color="error">Please select at least one subject</Typography>}
        </FormControl>
        <TextField
          label="Periods/Week"
          type="number"
          value={newLesson.periodsPerWeek}
          onChange={(e) => setNewLesson({ ...newLesson, periodsPerWeek: e.target.value })}
          fullWidth
          inputProps={{ min: 1 }}
          error={errors.periodsPerWeek}
          helperText={errors.periodsPerWeek ? 'Enter a valid number of periods' : ''}
        />
        <FormControl fullWidth>
          <InputLabel>Lesson Length</InputLabel>
          <Select value={newLesson.lessonLength} onChange={(e) => setNewLesson({ ...newLesson, lessonLength: parseInt(e.target.value) })} label="Lesson Length">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((length) => (
              <MenuItem key={length} value={length}>{length === 1 ? 'Single Period' : `${length} Periods`}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <FormControlLabel
        control={<Checkbox checked={splitGroupsEnabled} onChange={(e) => setSplitGroupsEnabled(e.target.checked)} />}
        label="Split classes into groups"
      />

      {splitGroupsEnabled && (
        <Box sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>Add Group</Typography>
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, mb: 2, alignItems: isMobile ? 'stretch' : 'center' }}>
            <TextField
              label="Group Name"
              value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
              fullWidth
              error={errors.groupName}
              helperText={errors.groupName ? 'Group name is required' : ''}
            />
            <FormControl fullWidth error={errors.groupTeachers}>
              <InputLabel>Teachers</InputLabel>
              <Select multiple value={newGroup.teachers} onChange={(e) => setNewGroup({ ...newGroup, teachers: e.target.value })} label="Teachers" renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => <Chip key={value} label={value} size="small" />)}
                </Box>
              )}>
                {timetableData.teachers.map((teacher) => <MenuItem key={teacher.name} value={teacher.name}>{teacher.name}</MenuItem>)}
              </Select>
              {errors.groupTeachers && <Typography variant="caption" color="error">Please select at least one teacher</Typography>}
            </FormControl>
            <FormControl fullWidth error={errors.groupSubjects}>
              <InputLabel>Subjects</InputLabel>
              <Select multiple value={newGroup.subjects} onChange={(e) => setNewGroup({ ...newGroup, subjects: e.target.value })} label="Subjects" renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => <Chip key={value} label={value} size="small" />)}
                </Box>
              )}>
                {timetableData.subjects.map((sub) => <MenuItem key={sub.name} value={sub.name}>{sub.name}</MenuItem>)}
              </Select>
              {errors.groupSubjects && <Typography variant="caption" color="error">Please select at least one subject</Typography>}
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Room (Optional)</InputLabel>
              <Select value={newGroup.room} onChange={(e) => setNewGroup({ ...newGroup, room: e.target.value })} label="Room (Optional)">
                <MenuItem value="">None</MenuItem>
                {timetableData.rooms.map((room) => <MenuItem key={room.name} value={room.name}>{room.name}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="contained" onClick={addGroup} sx={{ height: '56px', minWidth: isMobile ? '100%' : '120px' }} startIcon={<Add />}>Add Group</Button>
          </Box>
          {groups.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Added Groups</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Group Name</TableCell>
                    <TableCell>Teachers</TableCell>
                    <TableCell>Subjects</TableCell>
                    <TableCell>Room</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groups.map((group, index) => (
                    <TableRow key={index}>
                      <TableCell>{group.name}</TableCell>
                      <TableCell>{group.teachers.join(', ')}</TableCell>
                      <TableCell>{group.subjects.join(', ')}</TableCell>
                      <TableCell>{group.room || 'None'}</TableCell>
                      <TableCell><IconButton onClick={() => setGroups(groups.filter((_, i) => i !== index))}><Delete /></IconButton></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, mt: 2, mb: 3, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
        <Button variant="contained" onClick={addLesson} sx={{ height: '56px', minWidth: isMobile ? '100%' : '120px' }}>Add Lesson</Button>
        <Tooltip title="Import lessons from CSV (format: teachers;classes;subjects;periods)">
          <span><Button variant="outlined" component="label" startIcon={<FileUpload />} sx={{ height: '56px', minWidth: isMobile ? '100%' : '120px' }}>
            Import<input type="file" hidden accept=".csv" onChange={handleBulkImport} />
          </Button></span>
        </Tooltip>
      </Box>

      <Tabs value={viewMode} onChange={handleViewChange} sx={{ mb: 2 }}>
        <Tab label="Class-Wise View" value="classWise" />
        <Tab label="Teacher-Wise View" value="teacherWise" />
      </Tabs>

      {Object.keys(groupedLessons).length === 0 ? (
        <Typography color="textSecondary" sx={{ mt: 2 }}>No lessons added yet. Please add at least one lesson.</Typography>
      ) : (
        Object.entries(groupedLessons).map(([key, lessons]) => (
          <Box key={key} sx={{ mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom>{viewMode === 'classWise' ? `Class: ${key}` : `Teacher: ${key}`}</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Classes</TableCell>
                  <TableCell>Teachers</TableCell>
                  <TableCell>Subjects</TableCell>
                  <TableCell>Periods/Week</TableCell>
                  <TableCell>Lesson Length</TableCell>
                  <TableCell>Split Groups</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lessons.map((lesson, index) => (
                  <TableRow key={index}>
                    <TableCell>{lesson.classNames.join(', ')}</TableCell>
                    <TableCell>{lesson.teacherNames.join(', ')}</TableCell>
                    <TableCell>{lesson.subjectNames.join(', ')}</TableCell>
                    <TableCell>{lesson.periodsPerWeek}</TableCell>
                    <TableCell>{lesson.lessonLength === 1 ? 'Single' : `${lesson.lessonLength} Periods`}</TableCell>
                    <TableCell>
                      {lesson.splitGroups ? lesson.splitGroups.map((g) => (
                        <Chip key={g.name} label={`${g.name}: ${g.teachers.join(', ')} (${g.subjects.join(', ')}${g.room ? `, ${g.room}` : ''})`} size="small" sx={{ m: 0.5 }} />
                      )) : 'None'}
                    </TableCell>
                    <TableCell><IconButton onClick={() => removeLesson(lessons.indexOf(lesson))}><Delete /></IconButton></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        ))
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" onClick={() => setActiveStep(4)}>Back</Button>
        <Button variant="contained" onClick={handleSubmit}>Next</Button>
      </Box>
    </Box>
  );
};

export default ClassLessons;