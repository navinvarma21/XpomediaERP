import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Chip, FormControlLabel, Checkbox, IconButton } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useTheme, useMediaQuery } from '@mui/material';

const to24Hour = (time12) => {
  const [time, period] = time12.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const to12Hour = (time24) => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const GeneralSettings = ({ timetableData, setTimetableData, setActiveStep, saveToHistory, showMessage }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [name, setName] = useState(timetableData.name || '');
  const [numPeriods, setNumPeriods] = useState(timetableData.periods?.filter(p => p.type !== 'break').length || 8);
  const [startTime, setStartTime] = useState(timetableData.periods?.[0]?.startTime ? to24Hour(timetableData.periods[0].startTime) : '08:00');
  const [periods, setPeriods] = useState(timetableData.periods || []);
  const [schoolDays, setSchoolDays] = useState(timetableData.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const generatePeriods = (num, start) => {
    const newPeriods = [];
    let [hours, minutes] = start.split(':').map(Number);

    for (let i = 0; i < num; i++) {
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + 45;
      const startHour = Math.floor(startMinutes / 60) % 24;
      const startMin = startMinutes % 60;
      const endHour = Math.floor(endMinutes / 60) % 24;
      const endMin = endMinutes % 60;

      const startPeriod = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
      const endPeriod = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

      newPeriods.push({
        type: 'period',
        startTime: to12Hour(startPeriod),
        endTime: to12Hour(endPeriod),
        rawStart: startPeriod,
        rawEnd: endPeriod,
        index: i + 1,
      });

      minutes += 45;
      hours += Math.floor(minutes / 60);
      minutes = minutes % 60;
    }

    const existingBreaks = periods.filter(p => p.type === 'break').map(breakItem => ({
      ...breakItem,
      rawStart: breakItem.rawStart || to24Hour(breakItem.startTime),
      rawEnd: breakItem.rawEnd || to24Hour(breakItem.endTime),
    }));

    return [...newPeriods, ...existingBreaks].sort((a, b) => {
      const timeA = new Date(`01/01/2025 ${a.rawStart}`);
      const timeB = new Date(`01/01/2025 ${b.rawStart}`);
      return timeA - timeB;
    });
  };

  const handleNumPeriodsChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setNumPeriods(value);
    const newPeriods = generatePeriods(value, startTime);
    setPeriods(newPeriods);
  };

  const handleStartTimeChange = (e) => {
    const value = e.target.value;
    setStartTime(value);
    const newPeriods = generatePeriods(numPeriods, value);
    setPeriods(newPeriods);
  };

  const adjustPeriodTime = (index, field, time) => {
    if (!time) return;
    const newPeriods = [...periods];
    const isStart = field === 'startTime';
    newPeriods[index] = {
      ...newPeriods[index],
      [field]: to12Hour(time),
      [isStart ? 'rawStart' : 'rawEnd']: time,
    };
    setPeriods(newPeriods.sort((a, b) => {
      const timeA = new Date(`01/01/2025 ${a.rawStart}`);
      const timeB = new Date(`01/01/2025 ${b.rawStart}`);
      return timeA - timeB;
    }));
    showMessage('Time updated', 'success');
  };

  const addBreakAfter = (index) => {
    const currentItem = periods[index];
    const [hours, minutes] = currentItem.rawEnd.split(':').map(Number);
    const breakStartTime = currentItem.rawEnd;
    const breakEndMinutes = (hours * 60 + minutes) + 15;
    const breakEndHour = Math.floor(breakEndMinutes / 60) % 24;
    const breakEndMin = breakEndMinutes % 60;
    const breakEndTime = `${breakEndHour.toString().padStart(2, '0')}:${breakEndMin.toString().padStart(2, '0')}`;

    const newBreak = {
      type: 'break',
      startTime: to12Hour(breakStartTime),
      endTime: to12Hour(breakEndTime),
      rawStart: breakStartTime,
      rawEnd: breakEndTime,
    };

    const newPeriods = [...periods];
    newPeriods.splice(index + 1, 0, newBreak);
    setPeriods(newPeriods);
    showMessage('Break added', 'success');
  };

  const removeItem = (index) => {
    const removed = periods[index];
    setPeriods(periods.filter((_, i) => i !== index));
    showMessage(`${removed.type === 'break' ? 'Break' : 'Period'} removed`, 'info');
  };

  const handleDayChange = (day) => {
    const newDays = schoolDays.includes(day)
      ? schoolDays.filter(d => d !== day)
      : [...schoolDays, day].sort((a, b) => allDays.indexOf(a) - allDays.indexOf(b));
    setSchoolDays(newDays);
  };

  const handleSubmit = () => {
    if (!name || periods.length === 0 || schoolDays.length === 0) {
      showMessage('Please complete all required fields', 'error');
      return;
    }
    saveToHistory(timetableData);
    setTimetableData({
      ...timetableData,
      name,
      periods: periods.map(({ type, startTime, endTime, index }) => ({ type, startTime, endTime, index })),
      days: schoolDays,
    });
    setActiveStep(1);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>General Settings</Typography>
      <TextField
        label="Timetable Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
        margin="normal"
        required
        error={!name}
        helperText={!name ? 'Timetable name is required' : ''}
      />

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Time Settings</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
          <TextField
            label="Number of Periods per Day"
            type="number"
            value={numPeriods}
            onChange={handleNumPeriodsChange}
            inputProps={{ min: 1 }}
            sx={{ width: isMobile ? '100%' : '200px' }}
          />
          <TextField
            label="Start Time"
            type="time"
            value={startTime}
            onChange={handleStartTimeChange}
            InputLabelProps={{ shrink: true }}
            sx={{ width: isMobile ? '100%' : '200px' }}
          />
        </Box>
        {periods.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {periods.map((p, i) => (
              <Box key={i} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                  <Chip label={p.type === 'break' ? 'Break' : `Period ${p.index || i + 1}`} color={p.type === 'break' ? 'default' : 'secondary'} sx={{ minWidth: '80px' }} />
                  <TextField
                    label="Start Time"
                    type="time"
                    value={p.rawStart}
                    onChange={(e) => adjustPeriodTime(i, 'startTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="End Time"
                    type="time"
                    value={p.rawEnd}
                    onChange={(e) => adjustPeriodTime(i, 'endTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ flex: 1 }}
                  />
                  <IconButton onClick={() => removeItem(i)}><Delete /></IconButton>
                </Box>
                {p.type !== 'break' && (
                  <Box sx={{ mt: 1, pl: 10 }}>
                    <Button variant="outlined" size="small" startIcon={<Add />} onClick={() => addBreakAfter(i)}>Add Break After</Button>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>School Days</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {allDays.map((day) => (
            <FormControlLabel
              key={day}
              control={<Checkbox checked={schoolDays.includes(day)} onChange={() => handleDayChange(day)} />}
              label={day}
            />
          ))}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button variant="contained" onClick={handleSubmit}>Next</Button>
      </Box>
    </Box>
  );
};

export default GeneralSettings;