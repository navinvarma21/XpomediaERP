import React, { useState } from 'react';
import { Box, Typography, Grid, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { toast } from 'react-toastify';

export default function TeacherManagement({ teachers, setTeachers, saveToFirebase, setAvailDialog }) {
  const [newTeacher, setNewTeacher] = useState({ name: '', availability: {} });
  const [bulkInput, setBulkInput] = useState('');

  const addTeacher = () => {
    if (!newTeacher.name.trim()) {
      toast.error("Teacher name is required!");
      return;
    }
    const id = `tch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setTeachers([...teachers, { id, ...newTeacher }]);
    saveToFirebase('teachers', newTeacher, id);
    setNewTeacher({ name: '', availability: {} });
  };

  const addBulkTeachers = () => {
    const newTeachers = bulkInput.split('\n').filter(name => name.trim()).map(name => ({
      id: `tch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      availability: {}
    }));
    if (newTeachers.length === 0) {
      toast.error("No valid teachers entered!");
      return;
    }
    setTeachers([...teachers, ...newTeachers]);
    newTeachers.forEach(tch => saveToFirebase('teachers', tch, tch.id));
    setBulkInput('');
  };

  const openAvailDialog = (teacherId) => setAvailDialog({ open: true, type: 'teacher', id: teacherId });

  return (
    <Box p={2}>
      <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>Add Teachers</Typography>
      <Grid container spacing={2}>
        <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
          <TextField
            fullWidth
            label="Teacher Name"
            value={newTeacher.name}
            onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
            sx={{ minWidth: 200, borderRadius: 2 }}
          />
        </Grid>
        <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
          <Button variant="contained" onClick={addTeacher} sx={{ borderRadius: 2, fontWeight: 600, bgcolor: '#388e3c', '&:hover': { bgcolor: '#2e7d32' } }}>
            Add Teacher
          </Button>
        </Grid>
        <Grid sx={{ width: '100%' }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Bulk Teachers (one per line)"
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            sx={{ minWidth: 200, borderRadius: 2 }}
          />
        </Grid>
        <Grid sx={{ width: '100%' }}>
          <Button variant="contained" onClick={addBulkTeachers} sx={{ borderRadius: 2, fontWeight: 600, bgcolor: '#388e3c', '&:hover': { bgcolor: '#2e7d32' } }}>
            Add Bulk Teachers
          </Button>
        </Grid>
      </Grid>
      <Table sx={{ mt: 2, borderRadius: 2, bgcolor: '#fff' }}>
        <TableHead>
          <TableRow sx={{ bgcolor: '#e3f2fd' }}>
            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {teachers.map(teacher => (
            <TableRow key={teacher.id}>
              <TableCell>{teacher.name}</TableCell>
              <TableCell>
                <Button onClick={() => openAvailDialog(teacher.id)} sx={{ borderRadius: 2, color: '#1976d2' }}>
                  Edit Availability
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
