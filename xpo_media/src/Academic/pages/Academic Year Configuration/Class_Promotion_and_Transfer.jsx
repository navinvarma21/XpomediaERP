import React, { useEffect, useState } from 'react';
import {
  Container, Box, Typography, Grid, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress
} from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getAcademicYears, getAcademicYearById } from '../../api/academicYearApi';

// Normalize academic year format (e.g., "2025-2026" → "2025 - 2026")
const normalizeAcademicYear = (year) => year.replace('-', ' - ');

export default function ClassPromotionAndTransfer() {
  const [academicYears, setAcademicYears] = useState([]);
  const [currentYear, setCurrentYear] = useState('');
  const [terms, setTerms] = useState([]);
  const [currentTerm, setCurrentTerm] = useState('');
  const [standards, setStandards] = useState([]);
  const [currentStandard, setCurrentStandard] = useState('');
  const [sections, setSections] = useState([]);
  const [currentSection, setCurrentSection] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch academic years (bujji)
  useEffect(() => {
    setLoading(true);
    getAcademicYears()
      .then((years) => {
        console.log('Fetched academic years (raw):', years);
        const normalizedYears = years.map((year) => ({
          ...year,
          id: normalizeAcademicYear(year.id)
        }));
        console.log('Fetched academic years (normalized):', normalizedYears);
        setAcademicYears(normalizedYears);
        if (normalizedYears.length > 0) {
          setCurrentYear(normalizedYears[0].id); // Auto-select first year
        } else {
          toast.warn('No academic years found.');
        }
      })
      .catch((error) => {
        toast.error('Failed to load academic years');
        console.error('Error fetching academic years:', error);
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch terms based on selected academic year (bujji)
  useEffect(() => {
    if (currentYear) {
      setLoading(true);
      getAcademicYearById(currentYear.replace(/ - /g, '-')) // Reverse normalize for API
        .then((year) => {
          console.log('Fetched academic year data:', year);
          if (Array.isArray(year.terms)) {
            const termNames = year.terms.map((term) => (typeof term === 'string' ? term : term.name));
            setTerms(termNames);
            if (termNames.length > 0) {
              setCurrentTerm(termNames[0]); // Auto-select first term
            } else {
              setTerms([]);
              setCurrentTerm('');
              toast.warn('No terms found for selected academic year.');
            }
          } else {
            setTerms([]);
            setCurrentTerm('');
            toast.warn('No terms found for selected academic year.');
          }
        })
        .catch((error) => {
          toast.error('Failed to load terms');
          console.error('Error fetching terms:', error);
        })
        .finally(() => setLoading(false));
    } else {
      setTerms([]);
      setCurrentTerm('');
    }
  }, [currentYear]);

  // Fetch standards (bujji)
  useEffect(() => {
    const fetchStandards = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'students_flat'));
        const uniqueStandards = [...new Set(snapshot.docs.map((doc) => doc.data().standard))].filter(Boolean).sort();
        console.log('Fetched standards:', uniqueStandards);
        setStandards(uniqueStandards);
        if (uniqueStandards.length > 0) {
          setCurrentStandard(uniqueStandards[0]); // Auto-select first standard
        } else {
          setCurrentStandard('');
          toast.warn('No standards found in students data.');
        }
      } catch (error) {
        toast.error('Failed to load standards');
        console.error('Error fetching standards:', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStandards();
  }, []);

  // Fetch sections (bujji)
  useEffect(() => {
    if (!currentStandard) {
      setSections([]);
      setCurrentSection('');
      return;
    }
    const fetchSections = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'students_flat'),
          where('standard', '==', currentStandard)
        );
        const snapshot = await getDocs(q);
        const uniqueSections = [...new Set(snapshot.docs.map((doc) => doc.data().section))].filter(Boolean).sort();
        console.log('Fetched sections for standard', currentStandard, ':', uniqueSections);
        setSections(uniqueSections);
        if (uniqueSections.length > 0) {
          setCurrentSection(uniqueSections[0]); // Auto-select first section
        } else {
          setCurrentSection('');
          toast.warn(`No sections found for standard ${currentStandard}.`);
        }
      } catch (error) {
        toast.error('Failed to load sections');
        console.error('Error fetching sections:', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, [currentStandard]);

  // Fetch students (bujji, with normalized academicYear)
  useEffect(() => {
    if (!currentStandard || !currentSection) {
      setStudents([]);
      console.log('Skipping student fetch: missing standard or section', { currentStandard, currentSection });
      return;
    }
    const fetchStudents = async () => {
      setLoading(true);
      try {
        console.log('Fetching students with:', { currentStandard, currentSection, currentYear, currentTerm });
        let q;
        let studentsArr = [];
        
        // Try full query with normalized academicYear
        if (currentYear && currentTerm) {
          const normalizedYear = normalizeAcademicYear(currentYear);
          q = query(
            collection(db, 'students_flat'),
            where('standard', '==', currentStandard),
            where('section', '==', currentSection),
            where('academicYear', '==', normalizedYear),
            where('term', '==', currentTerm)
          );
          let snapshot = await getDocs(q);
          studentsArr = snapshot.docs.map((doc) => {
            console.log('Document data:', doc.data()); // Debug document fields
            return { id: doc.id, ...doc.data() };
          });
          console.log('Fetched students (full query):', studentsArr);
        }

        // Fallback query if no students found
        if (studentsArr.length === 0) {
          console.log('No students found with full query, trying fallback query...');
          q = query(
            collection(db, 'students_flat'),
            where('standard', '==', currentStandard),
            where('section', '==', currentSection)
          );
          let snapshot = await getDocs(q);
          studentsArr = snapshot.docs.map((doc) => {
            console.log('Document data (fallback):', doc.data()); // Debug document fields
            return { id: doc.id, ...doc.data() };
          });
          console.log('Fetched students (fallback query):', studentsArr);
          if (studentsArr.length === 0) {
            toast.warn(`No students found for Standard ${currentStandard}, Section ${currentSection}. Check Firestore data for matching standard and section.`);
          } else if (currentYear && currentTerm) {
            toast.warn(
              `No students found with Academic Year ${currentYear} and Term ${currentTerm}, but found ${studentsArr.length} students with Standard ${currentStandard} and Section ${currentSection}. Check academicYear format (e.g., "2025 - 2026" vs. "2025-2026") or term value (e.g., "Term One" vs. "Term 1").`
            );
          }
        }
        setStudents(studentsArr);
      } catch (error) {
        toast.error('Failed to load students. Check Firestore rules and data.');
        console.error('Error fetching students:', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [currentStandard, currentSection, currentYear, currentTerm]);

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <ToastContainer position="top-right" autoClose={3000} />
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2', mb: 3 }}>
        Student Roster
      </Typography>

      {/* Dropdowns */}
      <Box mb={3}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Academic Year</InputLabel>
              <Select
                value={currentYear}
                label="Academic Year"
                onChange={(e) => setCurrentYear(e.target.value)}
                disabled={loading}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {academicYears.map((year) => (
                  <MenuItem key={year.id} value={year.id}>{year.id}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" disabled={!terms.length}>
              <InputLabel>Term</InputLabel>
              <Select
                value={currentTerm}
                label="Term"
                onChange={(e) => setCurrentTerm(e.target.value)}
                disabled={loading}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {terms.map((term) => (
                  <MenuItem key={term} value={term}>{term}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Standard</InputLabel>
              <Select
                value={currentStandard}
                label="Standard"
                onChange={(e) => setCurrentStandard(e.target.value)}
                disabled={loading}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {standards.map((std) => (
                  <MenuItem key={std} value={std}>{std}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" disabled={!sections.length}>
              <InputLabel>Section</InputLabel>
              <Select
                value={currentSection}
                label="Section"
                onChange={(e) => setCurrentSection(e.target.value)}
                disabled={loading}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {sections.map((sec) => (
                  <MenuItem key={sec} value={sec}>{sec}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Student Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : students.length > 0 ? (
        <TableContainer component={Paper} sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#e3f2fd' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Student ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Standard</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Section</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.fullName || 'N/A'}</TableCell>
                  <TableCell>{student.studentID || student.id}</TableCell>
                  <TableCell>{student.standard}</TableCell>
                  <TableCell>{student.section}</TableCell>
                  <TableCell>{student.status || 'Active'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 4 }}>
          {currentStandard && currentSection
            ? `No students found for Standard ${currentStandard}, Section ${currentSection}. Check Firestore data for matching standard and section.`
            : 'Please select standard and section to view students.'}
        </Typography>
      )}
    </Container>
  );
}