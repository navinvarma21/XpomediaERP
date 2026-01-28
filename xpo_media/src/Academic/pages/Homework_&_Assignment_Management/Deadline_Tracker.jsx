import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Alert, FormControl, InputLabel, Select, MenuItem, Button, Chip, Container
} from '@mui/material';
import dayjs from 'dayjs';

const mockAssignments = [
  {
    studentName: 'John Doe',
    title: 'Math HW',
    assignedMarks: 20,
    dueDate: '2025-04-25',
    standard: '10',
    section: 'A',
    teacherName: 'Mr. Alan',
    academicPeriod: '2024-2025'
  },
  {
    studentName: 'Jane Smith',
    title: 'Science Project',
    assignedMarks: 30,
    dueDate: '2025-04-28',
    standard: '10',
    section: 'B',
    teacherName: 'Ms. Priya',
    academicPeriod: '2024-2025'
  },
  {
    studentName: 'Alex Ray',
    title: 'History Essay',
    assignedMarks: 25,
    dueDate: '2025-04-22',
    standard: '10',
    section: 'A',
    teacherName: 'Mr. Thomas',
    academicPeriod: '2024-2025'
  }
];

export default function Deadline_Tracker() {
  const [assignments, setAssignments] = useState([]);
  const [standard, setStandard] = useState('');
  const [section, setSection] = useState('');
  const [summary, setSummary] = useState({ upcoming: 0, overdue: 0 });

  useEffect(() => {
    const today = dayjs();
    let upcoming = 0;
    let overdue = 0;

    assignments.forEach(item => {
      const due = dayjs(item.dueDate);
      if (due.isBefore(today, 'day')) {
        overdue++;
      } else if (due.diff(today, 'day') <= 3) {
        upcoming++;
      }
    });

    setSummary({ upcoming, overdue });
  }, [assignments]);

  const handleFetch = () => {
    const filtered = mockAssignments.filter(a => a.standard === standard && a.section === section);
    setAssignments(filtered);
  };

  const getStatusChip = (dueDate) => {
    const due = dayjs(dueDate);
    const today = dayjs();
    if (due.isBefore(today, 'day')) {
      return <Chip label="Overdue" color="error" />;
    } else if (due.diff(today, 'day') <= 3) {
      return <Chip label="Upcoming" color="warning" />;
    } else {
      return <Chip label="On Track" color="success" />;
    }
  };

  return (
    <Container sx={{ mt: 4, mb: 4, height: '90vh', overflowY: 'auto', margin: '0' }}>
       <Typography variant="h5" sx={{color:"black", marginTop:"30px"}} gutterBottom>
          Deadline Tracker
        </Typography>
      <Paper elevation={3}>
       

        <Box mb={2}>
          {summary.overdue > 0 && (
            <Alert severity="error">🚨 {summary.overdue} overdue assignment(s)</Alert>
          )}
          {summary.upcoming > 0 && (
            <Alert severity="warning">⏰ {summary.upcoming} assignment(s) due soon!</Alert>
          )}
        </Box>

        <Box display="flex" gap={2} mb={2}>
          <FormControl size="small">
            <InputLabel>Standard</InputLabel>
            <Select sx={{width:"200px"}}  value={standard} onChange={(e) => setStandard(e.target.value)} label="Standard">
              {['10', '11', '12'].map(std => (
                <MenuItem key={std} value={std}>{std}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Section</InputLabel>
            <Select  sx={{width:"200px"}} value={section} onChange={(e) => setSection(e.target.value)} label="Section">
              {['A', 'B', 'C'].map(sec => (
                <MenuItem key={sec} value={sec}>{sec}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button variant="contained" onClick={handleFetch}>Fetch</Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: '#fff' }}>Student Name</TableCell>
                <TableCell sx={{ color: '#fff' }}>Assignment Title</TableCell>
                <TableCell sx={{ color: '#fff' }}>Assigned Marks</TableCell>
                <TableCell sx={{ color: '#fff' }}>Due Date</TableCell>
                <TableCell sx={{ color: '#fff' }}>Status</TableCell>
                <TableCell sx={{ color: '#fff' }}>Teacher Name</TableCell>
                <TableCell sx={{ color: '#fff' }}>Academic Period</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.map((item, idx) => {
                const due = dayjs(item.dueDate);
                const isOverdue = due.isBefore(dayjs(), 'day');
                const isUpcoming = due.diff(dayjs(), 'day') <= 3;

                let rowColor = '';
                if (isOverdue) rowColor = '#ffebee';
                else if (isUpcoming) rowColor = '#fffde7';

                return (
                  <TableRow key={idx} sx={{ backgroundColor: rowColor }}>
                    <TableCell>{item.studentName}</TableCell>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{item.assignedMarks}</TableCell>
                    <TableCell>{item.dueDate}</TableCell>
                    <TableCell>{getStatusChip(item.dueDate)}</TableCell>
                    <TableCell>{item.teacherName}</TableCell>
                    <TableCell>{item.academicPeriod}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}
