import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, Button, Typography, MenuItem, Select, InputLabel, FormControl, Container
} from '@mui/material';

const mockAssignments = [
  { studentName: 'John Doe', title: 'Math Homework', academicPeriod: '2025', subject: 'Math', standard: '10', section: 'A', dueDate: '2025-04-30', materialLink: 'https://link.com', assignmentType: 'Hardcopy', assignedMarks: '50', teacherName: 'Mr. Smith' },
  { studentName: 'Jane Smith', title: 'Science Project', academicPeriod: '2025', subject: 'Science', standard: '10', section: 'B', dueDate: '2025-05-15', materialLink: 'https://link.com', assignmentType: 'Softcopy', assignedMarks: '40', teacherName: 'Ms. Johnson' }
];

export default function Evaluation_Tools() {
  const [evaluationData, setEvaluationData] = useState([]);
  const [selectedStandard, setSelectedStandard] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const handleChange = (index, field, value) => {
    const updated = [...evaluationData];
    updated[index][field] = value;
    setEvaluationData(updated);
  };

  const handleFetchData = () => {
    const filteredData = mockAssignments.filter(
      (assignment) => assignment.standard === selectedStandard && assignment.section === selectedSection
    );
    setEvaluationData(filteredData);
  };

  const handleSave = () => {
    console.log('Evaluations Saved:', evaluationData);
    // TODO: Send to backend API
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, height: '90vh', overflowY: 'auto', margin: '0' }}>
      <Typography variant="h5" sx={{ color: "black", marginTop:"30px"}} gutterBottom>
        Mark Evaluation 
      </Typography>
      <Paper elevation={3}>

        <FormControl size="small" sx={{ marginBottom: 2, width:"200px" , marginLeft:"15px"}}>
          <InputLabel>Standard</InputLabel>
          <Select
            value={selectedStandard}
            onChange={(e) => setSelectedStandard(e.target.value)}
            label="Standard"
          >
            {['10', '11', '12'].map((standard) => (
              <MenuItem key={standard} value={standard}>{standard}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ marginBottom: 2, width:"200px", marginLeft:"15px" }}>
          <InputLabel>Section</InputLabel>
          <Select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            label="Section"
          >
            {['A', 'B', 'C'].map((section) => (
              <MenuItem key={section} value={section}>{section}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="contained" sx={{ marginBottom: 2,marginLeft:"15px" }} onClick={handleFetchData}>
          Fetch Data
        </Button>

        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ backgroundColor: 'primary.main' }}>
              <TableRow>
                <TableCell>Student Name</TableCell>
                <TableCell>Assignment Title</TableCell>
                <TableCell>Academic Period</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Standard</TableCell>
                <TableCell>Section</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Material Link</TableCell>
                <TableCell>Assignment Type</TableCell>
                <TableCell>Teacher Name</TableCell>
                <TableCell>Marks</TableCell>
                <TableCell>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {evaluationData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.studentName}</TableCell>
                  <TableCell>{row.title}</TableCell>
                  <TableCell>{row.academicPeriod}</TableCell>
                  <TableCell>{row.subject}</TableCell>
                  <TableCell>{row.standard}</TableCell>
                  <TableCell>{row.section}</TableCell>
                  <TableCell>{row.dueDate}</TableCell>
                  <TableCell>
                    <TextField
                      value={row.materialLink}
                      onChange={(e) => handleChange(index, 'materialLink', e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>{row.assignmentType}</TableCell>
                  <TableCell>{row.teacherName}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={row.marks || ''}
                      onChange={(e) => handleChange(index, 'marks', e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={row.remarks || ''}
                      onChange={(e) => handleChange(index, 'remarks', e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Button variant="contained" sx={{ marginTop: 2 }} onClick={handleSave}>
          Save Evaluations
        </Button>

        <TableContainer component={Paper} sx={{ marginTop: 3 }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ backgroundColor: 'primary.main' }}>
              <TableRow>
                <TableCell>Student Name</TableCell>
                <TableCell>Assignment Title</TableCell>
                <TableCell>Assigned Marks</TableCell>
                <TableCell>Marks Entered</TableCell>
                <TableCell>Remarks</TableCell>
                <TableCell>Teacher Name</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {evaluationData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.studentName}</TableCell>
                  <TableCell>{row.title}</TableCell>
                  <TableCell>{row.assignedMarks}</TableCell>
                  <TableCell>{row.marks}</TableCell>
                  <TableCell>{row.remarks}</TableCell>
                  <TableCell>{row.teacherName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}
