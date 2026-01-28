import React from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Paper,
} from '@mui/material';

export default function Overview() {
  const [tabIndex, setTabIndex] = React.useState(0);

  const subjectDetails = [
    {
      standard: 'Standard 1',
      academicPeriod: 'Term 1',
      subjects: ['Math', 'Science', 'English','Social','Tamil'],
    },
    {
      standard: 'Standard 2',
      academicPeriod: 'Term 2',
      subjects: ['History', 'Biology', 'Tamil','English','Social','Tamil'],
    },
  ];

  const teacherAllotments = [
    { teacher: 'Mr. Arun', subject: 'Math', standard: 'Standard 1', section: 'A' },
    { teacher: 'Ms. Balaji', subject: 'Science', standard: 'Standard 2', section: 'B' },
    { teacher: 'Mr. Charu', subject: 'History', standard: 'Standard 3', section: 'A' },
  ];

  const timetable = {
    'Standard 1': {
      Monday: ['Math', 'Science', 'English','Math','break', 'Science', 'English'],
      Tuesday: ['Science', 'English', 'Math','Math','break', 'Science', 'English'],
      Wednesday: ['Science', 'English', 'Math','Math','break', 'Science', 'English'],
      Thursday: ['Science', 'English', 'Math','Math','break', 'Science', 'English'],
      Friday: ['Science', 'English', 'Math','Math','break', 'Science', 'English'],
      Saturday: ['Science', 'English', 'Math','Math','break', 'Science', 'English'],
    },
    'Standard 2': {
      Monday: ['History', 'Biology', 'Tamil','Math','break', 'Science', 'English'],
      Tuesday: ['Biology', 'History', 'Tamil','Math','break', 'Science', 'English'],
      Wednesday: ['Science', 'English', 'Math','Math','break', 'Science', 'English'],
      Thursday: ['Science', 'English', 'Math','Math','break', 'Science', 'English'],
      Friday: ['Science', 'English', 'Math','Math','break', 'Science', 'English'],
      Saturday: ['Science', 'English', 'Math','Math','break', 'Science', 'English'],
    },
  };

  const teacherStandardMap = {
    'Mr. Arun': ['Standard 1 - A', 'Standard 1 - B'],
    'Ms. Balaji': ['Standard 6 - B'],
    'Mr. Charu': ['Standard 7 - A'],
  };

  return (
    <Container sx={{ mt: 4, py: 4, mb: 4, height: '90vh', overflowY: 'auto', margin: '0' }}>
      <Typography variant="h5" gutterBottom>
        Subject & Teacher Overview
      </Typography>
      <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} sx={{ mb: 3 }}>
        <Tab label="Subjects by Standard" />
        <Tab label="Teacher Allotments" />
        <Tab label="Timetable" />
        <Tab label="Teacher - Standard Map" />
      </Tabs>

      {/* Subjects by Standard */}
      {tabIndex === 0 && (
        <Grid container spacing={2}>
          {subjectDetails.map((item, idx) => (
            <Grid item xs={12} md={6} key={idx}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{item.standard}</Typography>
                  <Typography color="textSecondary">
                    Academic Period Name: {item.academicPeriod}
                  </Typography>
                  <Box mt={2}>
                    {item.subjects.map((subj, index) => (
                      <Chip key={index} label={subj} sx={{ mr: 1, mb: 1 }} />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Teacher Allotments */}
      {tabIndex === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Teacher Allotments
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Teacher Name</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Standard</TableCell>
                <TableCell>Section</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teacherAllotments.map((entry, idx) => (
                <TableRow key={idx}>
                  <TableCell>{entry.teacher}</TableCell>
                  <TableCell>{entry.subject}</TableCell>
                  <TableCell>{entry.standard}</TableCell>
                  <TableCell>{entry.section}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Timetable */}
      {tabIndex === 2 && (
        <Box>
          {Object.keys(timetable).map((standard, idx) => (
            <Box key={idx} mb={3}>
              <Typography variant="h6" gutterBottom>
                {standard}
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Day</TableCell>
                    <TableCell>Periods</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(timetable[standard]).map(([day, periods], i) => (
                    <TableRow key={i}>
                      <TableCell>{day}</TableCell>
                      <TableCell>
                        {periods.map((p, j) => (
                          <Chip key={j} label={p} sx={{ mr: 1, mb: 1 }} />
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ))}
        </Box>
      )}

      {/* Teacher-Standard Mapping */}
      {tabIndex === 3 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Teacher - Standard Mapping
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Teacher</TableCell>
                <TableCell>Standards & Sections</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(teacherStandardMap).map(([teacher, classes], idx) => (
                <TableRow key={idx}>
                  <TableCell>{teacher}</TableCell>
                  <TableCell>
                    {classes.map((c, i) => (
                      <Chip key={i} label={c} sx={{ mr: 1, mb: 1 }} />
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Container>
  );
}
