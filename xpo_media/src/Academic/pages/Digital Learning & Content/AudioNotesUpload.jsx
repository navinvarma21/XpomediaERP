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
} from '@mui/material';

// Static data for demonstration (replace with your data source)
const initialAudioNotes = [
  {
    id: '1',
    fileName: 'Maths_Lesson.mp3',
    subject: 'Mathematics',
    class: '10th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    uploadDate: '2025-08-30',
    fileUrl: 'path/to/maths_lesson.mp3',
  },
  {
    id: '2',
    fileName: 'Tamil_Poetry.mp3',
    subject: 'Tamil',
    class: '10th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    uploadDate: '2025-08-29',
    fileUrl: 'path/to/tamil_poetry.mp3',
  },
  {
    id: '3',
    fileName: 'Science_Explanation.wav',
    subject: 'Science',
    class: '11th Standard',
    academicYear: '2024-2025',
    term: 'Quarterly',
    uploadDate: '2025-08-28',
    fileUrl: 'path/to/science_explanation.wav',
  },
];

// Dropdown options (Tamil Nadu school system)
const classes = ['10th Standard', '11th Standard', '12th Standard'];
const academicYears = ['2023-2024', '2024-2025', '2025-2026'];
const terms = ['Quarterly', 'Half-Yearly', 'Annual'];
const subjects = ['Tamil', 'English', 'Mathematics', 'Science', 'Social Science'];

const AudioNotesUpload = () => {
  // State for dropdowns, file upload, and audio notes
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioNotes, setAudioNotes] = useState(initialAudioNotes);
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
    const newAudioNote = {
      id: Date.now().toString(), // Unique ID for demo
      fileName: selectedFile.name,
      subject: selectedSubject,
      class: selectedClass,
      academicYear: selectedAcademicYear,
      term: selectedTerm,
      uploadDate: new Date().toISOString().split('T')[0],
      fileUrl: `path/to/${selectedFile.name}`, // Placeholder; replace with actual storage URL
    };
    setAudioNotes((prev) => [...prev, newAudioNote]);
    setSelectedFile(null);
    setError('');
    console.log('Uploaded:', newAudioNote);
    // Add backend storage logic (e.g., Firebase) here
  };

  // Handle play audio
  const handlePlay = (fileUrl) => {
    console.log('Playing audio:', fileUrl);
    // Replace with actual audio playback (e.g., new Audio(fileUrl).play())
  };

  // Handle delete audio
  const handleDelete = (id) => {
    setAudioNotes((prev) => prev.filter((note) => note.id !== id));
    console.log('Deleted audio note ID:', id);
    // Add backend delete logic here
  };

  // Filter audio notes
  const filteredAudioNotes = audioNotes.filter(
    (note) =>
      (!selectedClass || note.class === selectedClass) &&
      (!selectedAcademicYear || note.academicYear === selectedAcademicYear) &&
      (!selectedTerm || note.term === selectedTerm) &&
      (!selectedSubject || note.subject === selectedSubject)
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Audio Notes Upload
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
          Upload Audio Note
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            component="label"
            color="primary"
          >
            Choose Audio File
            <input
              type="file"
              hidden
              accept=".mp3,.wav"
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
            {filteredAudioNotes.length > 0 ? (
              filteredAudioNotes.map((note) => (
                <TableRow key={note.id}>
                  <TableCell>{note.fileName}</TableCell>
                  <TableCell>{note.subject}</TableCell>
                  <TableCell>{note.class}</TableCell>
                  <TableCell>{note.term}</TableCell>
                  <TableCell>{note.uploadDate}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => handlePlay(note.fileUrl)}
                      sx={{ mr: 1 }}
                    >
                      Play
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDelete(note.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No audio notes found for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AudioNotesUpload;