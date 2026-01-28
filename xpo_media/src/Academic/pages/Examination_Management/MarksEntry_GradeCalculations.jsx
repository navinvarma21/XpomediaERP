import React, { useEffect, useState, useCallback } from "react";
import {
  Container, Card, CardContent, Typography, FormControl, InputLabel,
  Select, MenuItem, Grid, Button, Box, Paper, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Accordion, AccordionSummary,
  AccordionDetails, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, LinearProgress, Alert, Snackbar
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  getAcademicYears,
  getTermsForYear,
  getStandardsForYearTerm
} from "../../api/teacherAllotmentApi";


const MAX_THEORY = 100;
const MAX_PRACTICAL = 50;
const MAX_INTERNAL = 25;
const PASS_MARK = 35;

function sanitizeIdPart(str) {
  return String(str).replace(/\s+/g, "_");
}

function MarkTable({ row, students, marksMatrix, handleMarkChange, existingMarks }) {
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2, mb: 2 }}>
      <Table>
        <TableHead sx={{ bgcolor: 'primary.main' }}>
          <TableRow>
            <TableCell sx={{ color: 'white', fontWeight: 700 }}>Student ID - Name</TableCell>
            {row.Theory.enabled && (
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Theory</TableCell>
            )}
            {row.Theory.internal && (
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Theory Internal</TableCell>
            )}
            {row.Practical.enabled && (
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Practical</TableCell>
            )}
            {row.Practical.internal && (
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Practical Internal</TableCell>
            )}
            <TableCell sx={{ color: 'white', fontWeight: 700 }}>Total</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {students.map(student => {
            const marks = marksMatrix[row.subject]?.[student.studentID] || {};
            const hasExistingMarks = existingMarks[row.subject]?.[student.studentID];

            return (
              <TableRow
                key={student.studentID}
                sx={{
                  bgcolor: hasExistingMarks ? '#f5f5f5' : 'inherit',
                  '&:hover': { bgcolor: hasExistingMarks ? '#f0f0f0' : '#f9f9f9' }
                }}
              >
                <TableCell sx={{ fontWeight: 600 }}>
                  {student.studentID} - {student.fullName}
                </TableCell>
                {row.Theory.enabled && (
                  <TableCell>
                    {hasExistingMarks ? (
                      <Typography color="text.secondary">Already Marked</Typography>
                    ) : (
                      <TextField
                        type="number"
                        value={marks.theory || ""}
                        inputProps={{ min: 0, max: MAX_THEORY }}
                        onChange={e => handleMarkChange(row.subject, student.studentID, "theory", e.target.value)}
                        variant="outlined"
                        size="small"
                        error={marks.theory > MAX_THEORY}
                        sx={{ width: 100 }}
                      />
                    )}
                  </TableCell>
                )}
                {row.Theory.internal && (
                  <TableCell>
                    {hasExistingMarks ? (
                      <Typography color="text.secondary">Already Marked</Typography>
                    ) : (
                      <TextField
                        type="number"
                        value={marks.internalTheory || ""}
                        inputProps={{ min: 0, max: MAX_INTERNAL }}
                        onChange={e => handleMarkChange(row.subject, student.studentID, "internalTheory", e.target.value)}
                        variant="outlined"
                        size="small"
                        error={marks.internalTheory > MAX_INTERNAL}
                        sx={{ width: 100 }}
                      />
                    )}
                  </TableCell>
                )}
                {row.Practical.enabled && (
                  <TableCell>
                    {hasExistingMarks ? (
                      <Typography color="text.secondary">Already Marked</Typography>
                    ) : (
                      <TextField
                        type="number"
                        value={marks.practical || ""}
                        inputProps={{ min: 0, max: MAX_PRACTICAL }}
                        onChange={e => handleMarkChange(row.subject, student.studentID, "practical", e.target.value)}
                        variant="outlined"
                        size="small"
                        error={marks.practical > MAX_PRACTICAL}
                        sx={{ width: 100 }}
                      />
                    )}
                  </TableCell>
                )}
                {row.Practical.internal && (
                  <TableCell>
                    {hasExistingMarks ? (
                      <Typography color="text.secondary">Already Marked</Typography>
                    ) : (
                      <TextField
                        type="number"
                        value={marks.internalPractical || ""}
                        inputProps={{ min: 0, max: MAX_INTERNAL }}
                        onChange={e => handleMarkChange(row.subject, student.studentID, "internalPractical", e.target.value)}
                        variant="outlined"
                        size="small"
                        error={marks.internalPractical > MAX_INTERNAL}
                        sx={{ width: 100 }}
                      />
                    )}
                  </TableCell>
                )}
                <TableCell sx={{ fontWeight: 600, fontSize: 16 }}>
                  {marks.total || 0}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {marks.pass ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <CancelIcon color="error" />
                    )}
                    <Typography
                      sx={{ color: marks.pass ? "success.main" : "error.main", fontWeight: 600 }}
                    >
                      {marks.pass ? "Pass" : "Fail"}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function MarkEntry() {
  const [academicYears, setAcademicYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [standards, setStandards] = useState([]);
  const [sections, setSections] = useState([]);
  const [examNames, setExamNames] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedStandard, setSelectedStandard] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedExam, setSelectedExam] = useState("");

  const [students, setStudents] = useState([]);
  const [subjectMatrix, setSubjectMatrix] = useState([]);
  const [marksMatrix, setMarksMatrix] = useState({});
  const [existingMarks, setExistingMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);

  const fetchAcademicYears = useCallback(() => {
    setLoading(true);
    getAcademicYears()
      .then(setAcademicYears)
      .catch(() => {
        toast.error("Failed to load academic years");
        setAcademicYears([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAcademicYears();
  }, [fetchAcademicYears]);

  useEffect(() => {
    if (selectedYear) {
      setLoading(true);
      getTermsForYear(selectedYear)
        .then(setTerms)
        .catch(() => {
          toast.error("Failed to load terms");
          setTerms([]);
        })
        .finally(() => setLoading(false));
    } else setTerms([]);
    setSelectedTerm("");
    setStandards([]);
    setSelectedStandard("");
    setSections([]);
    setSelectedSection("");
    setExamNames([]);
    setSelectedExam("");
    setSubjects([]);
    setStudents([]);
  }, [selectedYear]);

  useEffect(() => {
    if (selectedYear && selectedTerm) {
      setLoading(true);
      getStandardsForYearTerm(selectedYear, selectedTerm)
        .then(setStandards)
        .catch(() => {
          toast.error("Failed to load standards");
          setStandards([]);
        })
        .finally(() => setLoading(false));
    } else setStandards([]);
    setSelectedStandard("");
    setSections([]);
    setSelectedSection("");
    setExamNames([]);
    setSelectedExam("");
    setSubjects([]);
    setStudents([]);
  }, [selectedYear, selectedTerm]);

  useEffect(() => {
    const fetchSections = async () => {
      if (selectedStandard) {
        setLoading(true);
        try {
          const q = query(
            collection(db, "students_flat"),
            where("standard", "==", selectedStandard)
          );
          const snapshot = await getDocs(q);
          const uniqueSections = [...new Set(snapshot.docs.map(doc => doc.data().section))];
          setSections(uniqueSections.filter(Boolean));
        } catch {
          setSections([]);
          toast.error("Failed to load sections");
        } finally {
          setLoading(false);
        }
      } else setSections([]);
      setSelectedSection("");
      setStudents([]);
    };
    fetchSections();
  }, [selectedStandard]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (selectedStandard && selectedSection) {
        setLoading(true);
        try {
          const q = query(
            collection(db, "students_flat"),
            where("standard", "==", selectedStandard),
            where("section", "==", selectedSection)
          );
          const snapshot = await getDocs(q);
          const studentsData = snapshot.docs.map(doc => ({
            studentID: doc.data().studentID,
            fullName: doc.data().fullName,
            section: doc.data().section,
            id: doc.id
          }));
          setStudents(studentsData);
        } catch {
          setStudents([]);
          toast.error("Failed to load students");
        } finally {
          setLoading(false);
        }
      } else setStudents([]);
    };
    fetchStudents();
  }, [selectedStandard, selectedSection]);

  useEffect(() => {
    const fetchExamNames = async () => {
      if (selectedYear && selectedTerm && selectedStandard) {
        setLoading(true);
        try {
          const q = query(
            collection(db, "createdExamFlat"),
            where("academicYear", "==", selectedYear),
            where("term", "==", selectedTerm),
            where("standard", "==", selectedStandard)
          );
          const snapshot = await getDocs(q);
          const uniqueExamNames = [...new Set(snapshot.docs.map(doc => doc.data().examType))];
          setExamNames(uniqueExamNames.filter(Boolean));
        } catch {
          setExamNames([]);
          toast.error("Failed to load exam names");
        } finally {
          setLoading(false);
        }
      } else setExamNames([]);
      setSelectedExam("");
      setSubjects([]);
    };
    fetchExamNames();
  }, [selectedYear, selectedTerm, selectedStandard]);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (selectedYear && selectedTerm && selectedStandard && selectedExam) {
        setLoading(true);
        try {
          const q = query(
            collection(db, "createdExamFlat"),
            where("academicYear", "==", selectedYear),
            where("term", "==", selectedTerm),
            where("standard", "==", selectedStandard),
            where("examType", "==", selectedExam)
          );
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            const allSchedules = [];
            snapshot.docs.forEach(doc => {
              const data = doc.data();
              if (data.schedules && Array.isArray(data.schedules)) {
                allSchedules.push(...data.schedules);
              }
            });

            const grouped = {};
            allSchedules.forEach(schedule => {
              const subject = schedule.subject;
              const category = schedule.examCategory;

              if (!grouped[subject]) {
                grouped[subject] = {
                  Theory: { enabled: false, internal: false },
                  Practical: { enabled: false, internal: false }
                };
              }

              if (category === "Theory") grouped[subject].Theory.enabled = true;
              if (category === "Theory Internal") grouped[subject].Theory.internal = true;
              if (category === "Practical") grouped[subject].Practical.enabled = true;
              if (category === "Practical Internal") grouped[subject].Practical.internal = true;
            });

            setSubjects(Object.keys(grouped));
            setSubjectMatrix(Object.entries(grouped).map(([subject, cats]) => ({
              subject,
              Theory: { ...cats.Theory },
              Practical: { ...cats.Practical }
            })));
          } else {
            setSubjects([]);
            setSubjectMatrix([]);
          }
        } catch {
          setSubjects([]);
          setSubjectMatrix([]);
          toast.error("Failed to load subjects");
        } finally {
          setLoading(false);
        }
      } else {
        setSubjects([]);
        setSubjectMatrix([]);
      }
    };
    fetchSubjects();
  }, [selectedYear, selectedTerm, selectedStandard, selectedExam]);

  useEffect(() => {
    if (students.length > 0 && subjectMatrix.length > 0) {
      const newMatrix = {};
      subjectMatrix.forEach(row => {
        newMatrix[row.subject] = {};
        students.forEach(stu => {
          newMatrix[row.subject][stu.studentID] = {
            theory: "",
            practical: "",
            internalTheory: "",
            internalPractical: "",
            total: 0,
            pass: false,
            fullName: stu.fullName,
            section: stu.section
          };
        });
      });
      setMarksMatrix(newMatrix);
    } else setMarksMatrix({});
  }, [students, subjectMatrix]);

  useEffect(() => {
    const checkExistingMarks = async () => {
      if (students.length > 0 && selectedExam) {
        const existing = {};
        for (const student of students) {
          const docId = [
            sanitizeIdPart(selectedYear),
            sanitizeIdPart(selectedTerm),
            sanitizeIdPart(selectedExam),
            sanitizeIdPart(student.studentID),
            sanitizeIdPart(student.fullName)
          ].join("-");
          try {
            const docRef = doc(db, "marksflat", docId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.subjects) {
                data.subjects.forEach(subj => {
                  if (!existing[subj.subject]) existing[subj.subject] = {};
                  existing[subj.subject][student.studentID] = true;
                });
              }
            }
          } catch {}
        }
        setExistingMarks(existing);
      }
    };
    checkExistingMarks();
  }, [students, selectedExam, selectedYear, selectedTerm]);

  const handleMarkChange = (subject, studentID, field, value) => {
    setMarksMatrix(prev => ({
      ...prev,
      [subject]: {
        ...prev[subject],
        [studentID]: {
          ...prev[subject][studentID],
          [field]: value === "" ? "" : Number(value)
        }
      }
    }));
  };

  const calculateAll = useCallback(() => {
    setMarksMatrix(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(subject => {
        Object.keys(updated[subject]).forEach(studentID => {
          const marks = updated[subject][studentID];
          let total = 0;
          const matrixRow = subjectMatrix.find(r => r.subject === subject);

          if (matrixRow?.Theory.enabled && marks.theory) total += Number(marks.theory);
          if (matrixRow?.Theory.internal && marks.internalTheory) total += Number(marks.internalTheory);
          if (matrixRow?.Practical.enabled && marks.practical) total += Number(marks.practical);
          if (matrixRow?.Practical.internal && marks.internalPractical) total += Number(marks.internalPractical);

          updated[subject][studentID] = {
            ...marks,
            total,
            pass: total >= PASS_MARK
          };
        });
      });
      return updated;
    });
    toast.success("Marks calculated successfully!");
  }, [subjectMatrix]);

  const saveMarks = async () => {
    if (!selectedYear || !selectedTerm || !selectedStandard || !selectedSection || !selectedExam) {
      toast.error("Please select all required fields!");
      return;
    }

    setSaveDialogOpen(true);
    setSaveProgress(0);
    try {
      let savedCount = 0;
      const totalStudents = students.length;

      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const docId = [
          sanitizeIdPart(selectedYear),
          sanitizeIdPart(selectedTerm),
          sanitizeIdPart(selectedExam),
          sanitizeIdPart(student.studentID),
          sanitizeIdPart(student.fullName)
        ].join("-");

        const subjectsArr = [];
        subjectMatrix.forEach(row => {
          if (existingMarks[row.subject]?.[student.studentID]) return;

          const marks = marksMatrix[row.subject]?.[student.studentID];
          if (!marks) return;

          const hasMarks = marks.theory || marks.practical || marks.internalTheory || marks.internalPractical;
          if (!hasMarks) return;

          const entry = {
            subject: row.subject,
            total: marks.total || 0,
            pass: marks.pass || false
          };

          if (row.Theory.enabled && marks.theory) entry.theory = Number(marks.theory);
          if (row.Theory.internal && marks.internalTheory) entry.internalTheory = Number(marks.internalTheory);
          if (row.Practical.enabled && marks.practical) entry.practical = Number(marks.practical);
          if (row.Practical.internal && marks.internalPractical) entry.internalPractical = Number(marks.internalPractical);

          subjectsArr.push(entry);
        });

        if (subjectsArr.length > 0) {
          const studentDocRef = doc(db, "marksflat", docId);
          await setDoc(studentDocRef, {
            academicYear: selectedYear,
            term: selectedTerm,
            examType: selectedExam,
            standard: selectedStandard,
            section: selectedSection,
            studentID: student.studentID,
            studentName: student.fullName,
            subjects: subjectsArr,
            timestamp: new Date().toISOString()
          }, { merge: true });
          savedCount++;
        }

        setSaveProgress(((i + 1) / totalStudents) * 100);
      }

      if (savedCount > 0) {
        toast.success(`Marks saved for ${savedCount} students!`);
        setExistingMarks({});
      } else {
        toast.warning("No new marks to save!");
      }
    } catch (err) {
      toast.error("Failed to save marks: " + err.message);
    } finally {
      setSaveDialogOpen(false);
      setSaveProgress(0);
    }
  };

  return (
    <Container sx={{ mt: 4, mb: 4, height: '90vh', overflowY: 'auto', padding: 0 }}>
      <Typography variant="h4" sx={{ marginTop: "30px", fontWeight: 700, color: "#1976d2", textAlign: 'center' }} gutterBottom>
        Mark Entry System
      </Typography>
      <ToastContainer position="top-right" autoClose={3000} />

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      )}

      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 3, mx: 'auto', maxWidth: '1200px' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Selection Criteria
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2.4}>
              <FormControl size="small" fullWidth>
                <InputLabel>Academic Year</InputLabel>
                <Select
                  value={selectedYear}
                  label="Academic Year"
                  onChange={e => setSelectedYear(e.target.value)}
                  disabled={loading}
                  aria-label="Select academic year"
                >
                  {academicYears.map(year => (
                    <MenuItem key={year.id || year.academicYear || year} value={year.id || year.academicYear || year}>
                      {year.id || year.academicYear || year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <FormControl size="small" fullWidth>
                <InputLabel>Term</InputLabel>
                <Select
                  value={selectedTerm}
                  label="Term"
                  onChange={e => setSelectedTerm(e.target.value)}
                  disabled={!terms.length || loading}
                  aria-label="Select term"
                >
                  {terms.map(term => (
                    <MenuItem key={term} value={term}>{term}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <FormControl size="small" fullWidth>
                <InputLabel>Standard</InputLabel>
                <Select
                  value={selectedStandard}
                  label="Standard"
                  onChange={e => setSelectedStandard(e.target.value)}
                  disabled={!standards.length || loading}
                  aria-label="Select standard"
                >
                  {standards.map(std => (
                    <MenuItem key={std} value={std}>{std}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <FormControl size="small" fullWidth>
                <InputLabel>Section</InputLabel>
                <Select
                  value={selectedSection}
                  label="Section"
                  onChange={e => setSelectedSection(e.target.value)}
                  disabled={!sections.length || loading}
                  aria-label="Select section"
                >
                  {sections.map(sec => (
                    <MenuItem key={sec} value={sec}>{sec}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <FormControl size="small" fullWidth>
                <InputLabel>Exam</InputLabel>
                <Select
                  value={selectedExam}
                  label="Exam"
                  onChange={e => setSelectedExam(e.target.value)}
                  disabled={!examNames.length || loading}
                  aria-label="Select exam"
                >
                  {examNames.map(name => (
                    <MenuItem key={name} value={name}>{name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {students.length > 0 && (
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 2, mx: 'auto', maxWidth: '1200px' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              📚 Students Loaded: {students.length} (Section: {selectedSection})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ready for mark entry
            </Typography>
          </CardContent>
        </Card>
      )}

      {subjectMatrix.length > 0 && students.length > 0 && (
        <Box sx={{ mx: 'auto', maxWidth: '1200px' }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
            📝 Enter Marks for {subjects.length} Subjects
          </Typography>
          {subjectMatrix.map((row) => (
            <Accordion key={row.subject} sx={{ mb: 2, borderRadius: 2, boxShadow: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#f5f5f5' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {row.subject}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <MarkTable
                  row={row}
                  students={students}
                  marksMatrix={marksMatrix}
                  handleMarkChange={handleMarkChange}
                  existingMarks={existingMarks}
                />
              </AccordionDetails>
            </Accordion>
          ))}
          <Box sx={{ mt: 4, display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={calculateAll}
              sx={{ px: 4, py: 1.5, fontWeight: 700, borderRadius: 2 }}
              disabled={loading}
              aria-label="Calculate all totals"
            >
              📊 Calculate All Totals
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => setSaveDialogOpen(true)}
              sx={{ px: 4, py: 1.5, fontWeight: 700, borderRadius: 2 }}
              disabled={loading}
              aria-label="Save all marks"
            >
              💾 Save All Marks
            </Button>
          </Box>
        </Box>
      )}

      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        aria-labelledby="save-dialog-title"
      >
        <DialogTitle id="save-dialog-title" sx={{ fontWeight: 600 }}>
          Confirm Save
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to save marks for {students.length} students? This action cannot be undone.
          </Typography>
          {saveProgress > 0 && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={saveProgress} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Saving... {Math.round(saveProgress)}%
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={saveMarks} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!loading} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="info" sx={{ width: '100%' }}>
          Loading data...
        </Alert>
      </Snackbar>
    </Container>
  );
}