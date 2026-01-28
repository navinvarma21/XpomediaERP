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
const initialEntries = [
  {
    id: '1',
    term: 'Pythagorean Theorem',
    description: 'In a right triangle, a² + b² = c²',
    subject: 'Mathematics',
    class: '10th Standard',
    academicYear: '2024-2025',
    termPeriod: 'Quarterly',
    creationDate: '2025-08-30',
  },
  {
    id: '2',
    term: 'Photosynthesis',
    description: 'Process by which plants convert light energy into chemical energy: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂',
    subject: 'Science',
    class: '10th Standard',
    academicYear: '2024-2025',
    termPeriod: 'Quarterly',
    creationDate: '2025-08-29',
  },
  {
    id: '3',
    term: 'Alliteration',
    description: 'Repetition of initial consonant sounds in a series of words',
    subject: 'English',
    class: '11th Standard',
    academicYear: '2024-2025',
    termPeriod: 'Quarterly',
    creationDate: '2025-08-28',
  },
];

// Dropdown options (Tamil Nadu school system)
const classes = ['10th Standard', '11th Standard', '12th Standard'];
const academicYears = ['2023-2024', '2024-2025', '2025-2026'];
const terms = ['Quarterly', 'Half-Yearly', 'Annual'];
const subjects = ['Tamil', 'English', 'Mathematics', 'Science', 'Social Science'];

const GlossaryAndFormulaVault = () => {
  // State for dropdowns, form, and entries
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [term, setTerm] = useState('');
  const [description, setDescription] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [entries, setEntries] = useState(initialEntries);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);

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

  // Handle form subject change
  const handleFormSubjectChange = (event) => {
    setFormSubject(event.target.value);
  };

  // Handle form submission (add or update)
  const handleSubmit = () => {
    if (!term || !description || !formSubject || !selectedClass || !selectedAcademicYear || !selectedTerm) {
      setError('Please fill in all fields: term/formula, description, subject, class, academic year, and term.');
      return;
    }

    const newEntry = {
      id: editId || Date.now().toString(),
      term,
      description,
      subject: formSubject,
      class: selectedClass,
      academicYear: selectedAcademicYear,
      termPeriod: selectedTerm,
      creationDate: new Date().toISOString().split('T')[0],
    };

    if (editId) {
      setEntries((prev) => prev.map((entry) => (entry.id === editId ? newEntry : entry)));
      console.log('Updated:', newEntry);
    } else {
      setEntries((prev) => [...prev, newEntry]);
      console.log('Added:', newEntry);
    }

    // Reset form
    setTerm('');
    setDescription('');
    setFormSubject('');
    setEditId(null);
    setError('');
    // Add backend save logic (e.g., Firebase) here
  };

  // Handle edit
  const handleEdit = (entry) => {
    setTerm(entry.term);
    setDescription(entry.description);
    setFormSubject(entry.subject);
    setSelectedClass(entry.class);
    setSelectedAcademicYear(entry.academicYear);
    setSelectedTerm(entry.termPeriod);
    setEditId(entry.id);
  };

  // Handle delete
  const handleDelete = (id) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    console.log('Deleted entry ID:', id);
    // Add backend delete logic here
  };

  // Filter entries
  const filteredEntries = entries.filter(
    (entry) =>
      (!selectedClass || entry.class === selectedClass) &&
      (!selectedAcademicYear || entry.academicYear === selectedAcademicYear) &&
      (!selectedTerm || entry.termPeriod === selectedTerm) &&
      (!selectedSubject || entry.subject === selectedSubject)
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Glossary & Formula Vault
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
          {editId ? 'Edit Entry' : 'Add New Glossary Term or Formula'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Term or Formula"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={2}
            sx={{ minWidth: 200 }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="form-subject-select-label">Subject</InputLabel>
            <Select
              labelId="form-subject-select-label"
              value={formSubject}
              label="Subject"
              onChange={handleFormSubjectChange}
            >
              <MenuItem value="">Select Subject</MenuItem>
              {subjects.map((subject) => (
                <MenuItem key={subject} value={subject}>
                  {subject}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={!term || !description || !formSubject || !selectedClass || !selectedAcademicYear || !selectedTerm}
          >
            {editId ? 'Update Entry' : 'Add Entry'}
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
              <TableCell>Term/Formula</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Term</TableCell>
              <TableCell>Creation Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.term}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell>{entry.subject}</TableCell>
                  <TableCell>{entry.class}</TableCell>
                  <TableCell>{entry.termPeriod}</TableCell>
                  <TableCell>{entry.creationDate}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => handleEdit(entry)}
                      sx={{ mr: 1 }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDelete(entry.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No entries found for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default GlossaryAndFormulaVault;