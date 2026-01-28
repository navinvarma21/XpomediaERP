import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Table, TableBody, TableCell, TableHead, TableRow, IconButton, FormControl, InputLabel, Select, MenuItem, Chip, Tooltip } from '@mui/material';
import { Delete, SortByAlpha } from '@mui/icons-material';
import { useTheme, useMediaQuery } from '@mui/material';

const Rooms = ({ timetableData, setTimetableData, setActiveStep, saveToHistory, showMessage }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [rooms, setRooms] = useState(timetableData.rooms || []);
  const [newRoom, setNewRoom] = useState('');
  const [selectedHomeClasses, setSelectedHomeClasses] = useState([]);
  const [errors, setErrors] = useState({ roomName: false });
  const [isSorted, setIsSorted] = useState(false);

  const addRoom = () => {
    const newErrors = { roomName: !newRoom };
    setErrors(newErrors);

    if (!newRoom) {
      showMessage('Please enter a room name', 'error');
      return;
    }
    if (rooms.some(room => room.name.toLowerCase() === newRoom.toLowerCase())) {
      showMessage('Room name must be unique', 'error');
      return;
    }

    const availability = {};
    timetableData.days.forEach((day) => {
      availability[day] = Array(timetableData.periods.filter(p => p.type !== 'break').length).fill(true);
    });

    const newRoomObj = { name: newRoom, homeClasses: selectedHomeClasses, availability };
    setRooms([...rooms, newRoomObj]);
    setNewRoom('');
    setSelectedHomeClasses([]);
    setErrors({ roomName: false });
    showMessage('Room added', 'success');
  };

  const toggleAvailability = (roomIndex, day, periodIndex) => {
    const newRooms = [...rooms];
    newRooms[roomIndex].availability[day][periodIndex] = !newRooms[roomIndex].availability[day][periodIndex];
    setRooms(newRooms);
  };

  const toggleDay = (roomIndex, day) => {
    const newRooms = [...rooms];
    const allAvailable = newRooms[roomIndex].availability[day].every(v => !v);
    newRooms[roomIndex].availability[day] = newRooms[roomIndex].availability[day].map(() => allAvailable);
    setRooms(newRooms);
  };

  const togglePeriod = (roomIndex, periodIndex) => {
    const newRooms = [...rooms];
    timetableData.days.forEach((day) => {
      newRooms[roomIndex].availability[day][periodIndex] = !newRooms[roomIndex].availability[day][periodIndex];
    });
    setRooms(newRooms);
  };

  const sortRooms = () => {
    const sortedRooms = [...rooms].sort((a, b) => a.name.localeCompare(b.name));
    setRooms(sortedRooms);
    setIsSorted(true);
    showMessage('Rooms sorted alphabetically', 'success');
  };

  const deleteRoom = (index) => {
    const removed = rooms[index];
    setRooms(rooms.filter((_, i) => i !== index));
    showMessage(`${removed.name} removed`, 'info');
  };

  const handleHomeClassesChange = (event) => {
    const value = event.target.value;
    setSelectedHomeClasses(value);
  };

  const handleSubmit = () => {
    saveToHistory(timetableData);
    setTimetableData({ ...timetableData, rooms });
    setActiveStep(5);
    showMessage('Navigating to Class Lessons', 'info');
  };

  const nonBreakPeriods = timetableData.periods.filter(p => p.type !== 'break');

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Rooms</Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>Add rooms for shared facilities or specific class assignments (optional).</Typography>
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, mb: 2, alignItems: isMobile ? 'stretch' : 'center' }}>
        <TextField
          label="Room Name"
          value={newRoom}
          onChange={(e) => setNewRoom(e.target.value)}
          fullWidth
          error={errors.roomName}
          helperText={errors.roomName ? 'Room name is required' : ''}
        />
        <FormControl fullWidth>
          <InputLabel>Home Rooms For (Optional)</InputLabel>
          <Select multiple value={selectedHomeClasses} onChange={handleHomeClassesChange} label="Home Rooms For (Optional)" renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => <Chip key={value} label={value} size="small" />)}
            </Box>
          )}>
            {timetableData.classes.map((cls) => <MenuItem key={cls.name} value={cls.name}>{cls.name}</MenuItem>)}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
          <Button variant="contained" onClick={addRoom} sx={{ height: '56px', minWidth: isMobile ? '100%' : '120px' }}>Add Room</Button>
          <Tooltip title="Sort rooms alphabetically">
            <span><Button variant="outlined" onClick={sortRooms} disabled={isSorted || rooms.length === 0} startIcon={<SortByAlpha />} sx={{ height: '56px', minWidth: isMobile ? '100%' : '120px' }}>Sort</Button></span>
          </Tooltip>
        </Box>
      </Box>

      {rooms.length === 0 ? (
        <Typography color="textSecondary" sx={{ mt: 2 }}>No rooms added yet. Add rooms if needed for scheduling.</Typography>
      ) : (
        <>
          <Table sx={{ mb: 3 }}>
            <TableHead>
              <TableRow>
                <TableCell>Room Name</TableCell>
                <TableCell>Home Classes</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rooms.map((room, index) => (
                <TableRow key={index}>
                  <TableCell>{room.name}</TableCell>
                  <TableCell>{room.homeClasses.length > 0 ? room.homeClasses.map((cls) => <Chip key={cls} label={cls} size="small" sx={{ m: 0.5 }} />) : 'None'}</TableCell>
                  <TableCell><IconButton onClick={() => deleteRoom(index)}><Delete /></IconButton></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {rooms.map((room, index) => (
            <Box key={index} sx={{ mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>Availability for {room.name}</Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: '80px' }}>Period</TableCell>
                      {timetableData.days.map((day) => (
                        <TableCell
                          key={day}
                          onClick={() => toggleDay(index, day)}
                          sx={{ cursor: 'pointer', minWidth: '100px', backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200], title: room.availability[day].every(v => !v) ? 'All periods unavailable' : '' }}
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
                          sx={{ cursor: 'pointer', backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200], title: timetableData.days.every(day => !room.availability[day][pIndex]) ? 'Period unavailable for all days' : '' }}
                        >
                          {`P${pIndex + 1}`}
                        </TableCell>
                        {timetableData.days.map((day) => (
                          <TableCell
                            key={day}
                            onClick={() => toggleAvailability(index, day, pIndex)}
                            sx={{ backgroundColor: room.availability[day][pIndex] ? theme.palette.success.main : theme.palette.error.main, cursor: 'pointer', '&:hover': { opacity: 0.8, filter: 'brightness(1.1)' }, title: !room.availability[day][pIndex] ? 'Unavailable' : '' }}
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
        <Button variant="outlined" onClick={() => setActiveStep(3)}>Back</Button>
        <Button variant="contained" onClick={handleSubmit}>Next</Button>
      </Box>
    </Box>
  );
};

export default Rooms;