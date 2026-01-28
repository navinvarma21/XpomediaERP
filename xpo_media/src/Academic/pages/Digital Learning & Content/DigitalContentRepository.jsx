import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';

// Static data for demonstration (replace with your data source)
const initialMaterials = [
  {
    id: '1',
    fileName: 'Maths_Notes.pdf',
    subject: 'Mathematics',
    class: '10th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    uploadDate: '2025-08-30',
    fileUrl: 'path/to/maths_notes.pdf',
  },
  {
    id: '2',
    fileName: 'Tamil_Grammar.pdf',
    subject: 'Tamil',
    class: '10th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    uploadDate: '2025-08-29',
    fileUrl: 'path/to/tamil_grammar.pdf',
  },
  {
    id: '3',
    fileName: 'Science_Experiment.pdf',
    subject: 'Science',
    class: '11th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    uploadDate: '2025-08-28',
    fileUrl: 'path/to/science_experiment.pdf',
  },
];

// Dropdown options (Tamil Nadu school system)
const classes = ['10th Standard', '11th Standard', '12th Standard'];
const academicYears = ['2023-2024', '2024-2025', '2025-2026'];
const terms = ['Quarterly', 'Half-Yearly', 'Annual'];
const subjects = ['Tamil', 'English', 'Mathematics', 'Science', 'Social Science'];

const DigitalContentRepository = () => {
  // State for dropdowns, file upload, and materials
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [materials, setMaterials] = useState(initialMaterials);
  const [error, setError] = useState('');

  // Handle dropdown changes
  const handleClassChange = (event) => {
    setSelectedClass(event.target.value);
  };

  const handleAcademicYearChange = (event) => {
    setSelectedAcademicYear(event.target.value);
  };

  const handleTermChange = (event) => {
    setSelectedTerm(event.target.value);
  };

  const handleSubjectChange = (event) => {
    setSelectedSubject(event.target.value);
  };

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setError('');
  };

  // Handle file upload
  const handleUpload = () => {
    if (!selectedFile || !selectedClass || !selectedAcademicYear || !selectedTerm || !selectedSubject) {
      setError('Please select a file, class, academic year, term, and subject.');
      return;
    }
    const newMaterial = {
      id: Date.now().toString(), // Unique ID for demo
      fileName: selectedFile.name,
      subject: selectedSubject,
      class: selectedClass,
      academicYear: selectedAcademicYear,
      term: selectedTerm,
      uploadDate: new Date().toISOString().split('T')[0],
      fileUrl: `path/to/${selectedFile.name}`, // Placeholder; replace with actual storage URL
    };
    setMaterials((prev) => [...prev, newMaterial]);
    setSelectedFile(null);
    setError('');
    console.log('Uploaded:', newMaterial);
    // Add backend storage logic (e.g., Firebase) here
  };

  // Handle view file
  const handleView = (fileUrl) => {
    console.log('Viewing file:', fileUrl);
    // Replace with actual file access (e.g., window.open(fileUrl))
  };

  // Handle delete file
  const handleDelete = (id) => {
    setMaterials((prev) => prev.filter((material) => material.id !== id));
    console.log('Deleted material ID:', id);
    // Add backend delete logic here
  };

  // Filter materials
  const filteredMaterials = materials.filter(
    (material) =>
      (!selectedClass || material.class === selectedClass) &&
      (!selectedAcademicYear || material.academicYear === selectedAcademicYear) &&
      (!selectedTerm || material.term === selectedTerm) &&
      (!selectedSubject || material.subject === selectedSubject)
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Digital Content Repository
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="class-select-label">Class</InputLabel>
          <Select
            labelId="class-select-label"
            value={selectedClass}
            label="Class"
            onChange={handleClassChange}
          >
            <MenuItem value="">All Classes</MenuItem>
            {classes.map((cls) => (
              <MenuItem key={cls} value={cls}>
                {cls}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="academic-year-select-label">Academic Year</InputLabel>
          <Select
            labelId="academic-year-select-label"
            value={selectedAcademicYear}
            label="Academic Year"
            onChange={handleAcademicYearChange}
          >
            <MenuItem value="">All Years</MenuItem>
            {academicYears.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="term-select-label">Term</InputLabel>
          <Select
            labelId="term-select-label"
            value={selectedTerm}
            label="Term"
            onChange={handleTermChange}
          >
            <MenuItem value="">All Terms</MenuItem>
            {terms.map((term) => (
              <MenuItem key={term} value={term}>
                {term}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="subject-select-label">Subject</InputLabel>
          <Select
            labelId="subject-select-label"
            value={selectedSubject}
            label="Subject"
            onChange={handleSubjectChange}
          >
            <MenuItem value="">All Subjects</MenuItem>
            {subjects.map((subject) => (
              <MenuItem key={subject} value={subject}>
                {subject}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upload Study Material
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            component="label"
            color="primary"
          >
            Choose File
            <input
              type="file"
              hidden
              accept=".pdf,.doc,.docx,.jpg,.png"
              onChange={handleFileChange}
            />
          </Button>
          <Typography>
            {selectedFile ? selectedFile.name : 'No file selected'}
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleUpload}
            disabled={!selectedFile || !selectedClass || !selectedAcademicYear || !selectedTerm || !selectedSubject}
          >
            Upload
          </Button>
        </Box>
        {error && (
          <Typography color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>File Name</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Term</TableCell>
              <TableCell>Upload Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMaterials.length > 0 ? (
              filteredMaterials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>{material.fileName}</TableCell>
                  <TableCell>{material.subject}</TableCell>
                  <TableCell>{material.class}</TableCell>
                  <TableCell>{material.term}</TableCell>
                  <TableCell>{material.uploadDate}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => handleView(material.fileUrl)}
                      sx={{ mr: 1 }}
                    >
                      View
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDelete(material.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No materials found for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DigitalContentRepository;