import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Container,
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Alert,
  CircularProgress, // Ensure this is included
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { getAcademicYears, getAcademicYearById } from "../../api/academicYearApi";
import * as XLSX from "xlsx";

// Constants
const ATTENDANCE_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "leave", label: "Leave" },
];

const normalizeForId = (str) => (str ? str.trim().replace(/\s+/g, "_") : "");
const getFlatDocId = (year, term, standard, section, studentId, date) => {
  const normalizedYear = normalizeForId(year);
  const normalizedTerm = normalizeForId(term);
  const normalizedStandard = normalizeForId(standard);
  const normalizedSection = normalizeForId(section);
  const normalizedStudentId = normalizeForId(studentId);
  const normalizedDate = normalizeForId(date);
  return `${normalizedYear}-${normalizedTerm}-${normalizedStandard}-${normalizedSection}-${normalizedStudentId}-${normalizedDate}`;
};

const formatDateForPath = (date) => date; // Keep as YYYY-MM-DD format
const isValidAttendancePath = (...segments) =>
  segments.every((seg) => typeof seg === "string" && seg.trim() !== "");

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default function AttendanceRecord() {
  const [standards, setStandards] = useState([]);
  const [selectedStandard, setSelectedStandard] = useState("");
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [bulkStatus, setBulkStatus] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [markedAttendance, setMarkedAttendance] = useState([]);
  const [editStudentId, setEditStudentId] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [remarks, setRemarks] = useState({});
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [editingRemarks, setEditingRemarks] = useState(null);
  const [editRemarksValue, setEditRemarksValue] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState("");
  const [dialogStudentId, setDialogStudentId] = useState(null);
  const [dialogCurrentStatus, setDialogCurrentStatus] = useState("");

  // Debounced remarks update
  const updateRemarksInDB = useCallback(async (docId, newRemarks) => {
    try {
      await updateDoc(doc(db, "attendance_flat", docId), { remarks: newRemarks });
      setMarkedAttendance((prev) =>
        prev.map((item) =>
          item.id === docId ? { ...item, remarks: newRemarks } : item
        )
      );
      toast.success("Remarks updated successfully!");
    } catch (error) {
      console.error("Error updating remarks:", error);
      toast.error("Failed to update remarks.");
    }
  }, []);

  const debouncedUpdateRemarks = useMemo(
    () => debounce(updateRemarksInDB, 1500),
    [updateRemarksInDB]
  );

  // Fetch academic years
  useEffect(() => {
    setLoading(true);
    getAcademicYears()
      .then((years) => {
        setAcademicYears(years);
        if (years.length > 0) setSelectedYear(years[0].id); // Auto-select first year if available
      })
      .catch((error) => {
        toast.error("Failed to load academic years");
        console.error(error);
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch terms based on selected year
  useEffect(() => {
    if (selectedYear) {
      setLoading(true);
      getAcademicYearById(selectedYear)
        .then((year) => {
          if (Array.isArray(year.terms)) {
            setTerms(year.terms.map((term) => (typeof term === "string" ? term : term.name)));
            if (year.terms.length > 0) setSelectedTerm(year.terms[0].name || year.terms[0]); // Auto-select first term
          } else {
            setTerms([]);
            setSelectedTerm("");
          }
        })
        .catch((error) => {
          toast.error("Failed to load terms");
          console.error(error);
        })
        .finally(() => setLoading(false));
    } else {
      setTerms([]);
      setSelectedTerm("");
    }
  }, [selectedYear]);

  // Fetch standards
  useEffect(() => {
    const fetchStandards = async () => {
      setLoading(true);
      try {
        const studentsQuery = query(collection(db, "students_flat"));
        const snapshot = await getDocs(studentsQuery);
        const uniqueStandards = [...new Set(snapshot.docs.map((doc) => doc.data().standard))];
        setStandards(uniqueStandards.sort());
        if (uniqueStandards.length > 0) setSelectedStandard(uniqueStandards[0]); // Auto-select first standard
      } catch (error) {
        toast.error("Failed to load standards");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStandards();
  }, []);

  // Fetch sessions
  useEffect(() => {
    setSessions([]);
    setSelectedSession("");
    setStudents([]);
    setAttendance({});
    setBulkStatus("");
    if (!selectedStandard) return;

    const fetchSessions = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "students_flat"),
          where("standard", "==", selectedStandard)
        );
        const snapshot = await getDocs(q);
        const uniqueSessions = [...new Set(snapshot.docs.map((doc) => doc.data().section))];
        setSessions(uniqueSessions.sort());
        if (uniqueSessions.length > 0) setSelectedSession(uniqueSessions[0]); // Auto-select first session
      } catch (error) {
        toast.error("Failed to load sessions");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [selectedStandard]);

  // Fetch students
  useEffect(() => {
    setStudents([]);
    setAttendance({});
    setBulkStatus("");
    if (!selectedStandard || !selectedSession) return;

    const fetchStudents = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "students_flat"),
          where("standard", "==", selectedStandard),
          where("section", "==", selectedSession)
        );
        const snapshot = await getDocs(q);
        const studentsArr = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStudents(studentsArr);

        // Default attendance status is "present" for all students
        const initialAttendance = {};
        const initialRemarks = {};
        studentsArr.forEach((s) => {
          initialAttendance[s.id] = "present";
          initialRemarks[s.id] = "";
        });
        setAttendance(initialAttendance);
        setRemarks(initialRemarks);
      } catch (error) {
        toast.error("Failed to load students");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [selectedStandard, selectedSession]);

  // Fetch marked attendance
  useEffect(() => {
    const fetchMarkedAttendance = async () => {
      if (
        !isValidAttendancePath(selectedYear, selectedTerm, selectedStandard, selectedSession, date)
      ) {
        setMarkedAttendance([]);
        setAttendanceMarked(false);
        return;
      }

      setLoading(true);
      try {
        const flatDate = formatDateForPath(date);
        const q = query(
          collection(db, "attendance_flat"),
          where("academicYear", "==", selectedYear),
          where("term", "==", selectedTerm),
          where("standard", "==", selectedStandard),
          where("section", "==", selectedSession),
          where("date", "==", flatDate)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMarkedAttendance(data);
        setAttendanceMarked(data.length > 0);

        // Pre-fill attendance and remarks from marked data
        const initialAttendance = {};
        const initialRemarks = {};
        data.forEach((record) => {
          initialAttendance[record.studentId] = record.status || "present";
          initialRemarks[record.studentId] = record.remarks || "";
        });
        setAttendance((prev) => ({ ...prev, ...initialAttendance }));
        setRemarks((prev) => ({ ...prev, ...initialRemarks }));
      } catch (error) {
        toast.error("Failed to load marked attendance");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMarkedAttendance();
  }, [selectedYear, selectedTerm, date, selectedStandard, selectedSession]);

  // Handle attendance change
  const handleAttendanceChange = useCallback((studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
    if (status === "present") {
      setRemarks((prev) => ({
        ...prev,
        [studentId]: "",
      }));
    }
  }, []);

  // Handle bulk attendance
  const handleBulkAttendance = useCallback((status) => {
    setBulkStatus(status);
    const updatedAttendance = {};
    const updatedRemarks = {};
    students.forEach((student) => {
      updatedAttendance[student.id] = status;
      if (status === "present") {
        updatedRemarks[student.id] = "";
      }
    });
    setAttendance((prev) => ({ ...prev, ...updatedAttendance }));
    if (status === "present") {
      setRemarks((prev) => ({ ...prev, ...updatedRemarks }));
    }
  }, [students]);

  // Save attendance with batch write
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (
      !isValidAttendancePath(selectedYear, selectedTerm, selectedStandard, selectedSession, date)
    ) {
      toast.error("Please select all required fields.");
      return;
    }

    setLoading(true);
    const batch = writeBatch(db);
    const flatDate = formatDateForPath(date);
    let changesMade = false;

    try {
      for (const student of students) {
        const docId = getFlatDocId(
          selectedYear,
          selectedTerm,
          selectedStandard,
          selectedSession,
          student.studentID || student.id,
          flatDate
        );
        const docRef = doc(db, "attendance_flat", docId);
        const existingDoc = await getDoc(docRef);

        const currentStatus = attendance[student.id];
        const currentRemarks = remarks[student.id] || "";

        if (
          !existingDoc.exists() ||
          existingDoc.data().status !== currentStatus ||
          existingDoc.data().remarks !== currentRemarks
        ) {
          batch.set(
            docRef,
            {
              studentId: student.studentID || student.id,
              fullName: student.fullName || "N/A",
              standard: selectedStandard,
              section: selectedSession,
              academicYear: selectedYear,
              term: selectedTerm,
              date: flatDate,
              status: currentStatus,
              remarks: currentStatus === "present" ? "" : currentRemarks,
              markedAt: new Date().toISOString(),
            },
            { merge: true }
          );
          changesMade = true;
        }
      }

      if (!changesMade) {
        toast.info("No changes to save or attendance already marked.");
        setLoading(false);
        return;
      }

      await batch.commit();
      toast.success("Attendance marked successfully!");

      // Refresh marked attendance
      const q = query(
        collection(db, "attendance_flat"),
        where("academicYear", "==", selectedYear),
        where("term", "==", selectedTerm),
        where("standard", "==", selectedStandard),
        where("section", "==", selectedSession),
        where("date", "==", flatDate)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMarkedAttendance(data);
      setAttendanceMarked(true);
    } catch (err) {
      toast.error("Failed to mark attendance.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedTerm, selectedStandard, selectedSession, date, attendance, remarks, students]);

  // Handle remarks change
  const handleRemarksChange = useCallback((studentId, value) => {
    setRemarks((prev) => ({
      ...prev,
      [studentId]: value,
    }));
  }, []);

  // Edit remarks functions
  const handleEditRemarks = (recordId, currentRemarks) => {
    setEditingRemarks(recordId);
    setEditRemarksValue(currentRemarks || "");
  };

  const handleSaveRemarks = async (recordId) => {
    try {
      await updateDoc(doc(db, "attendance_flat", recordId), { remarks: editRemarksValue });
      setMarkedAttendance((prev) =>
        prev.map((item) =>
          item.id === recordId ? { ...item, remarks: editRemarksValue } : item
        )
      );
      setEditingRemarks(null);
      setEditRemarksValue("");
      toast.success("Remarks updated successfully!");
    } catch (error) {
      console.error("Error updating remarks:", error);
      toast.error("Failed to update remarks.");
    }
  };

  const handleCancelEditRemarks = () => {
    setEditingRemarks(null);
    setEditRemarksValue("");
  };

  // Dialog functions
  const openDialog = (type, studentId, currentStatus = "") => {
    setDialogType(type);
    setDialogStudentId(studentId);
    setDialogCurrentStatus(currentStatus);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setDialogStudentId(null);
    setDialogCurrentStatus("");
    setEditStudentId(null);
  };

  const handleEdit = (studentId, currentStatus) => {
    setEditStudentId(studentId);
    setEditStatus(currentStatus);
    openDialog("edit", studentId, currentStatus);
  };

  const handleEditSave = async () => {
    if (!dialogStudentId) {
      toast.error("Missing required information.");
      return;
    }
    try {
      const updateData = { status: editStatus };
      if (editStatus === "present") {
        updateData.remarks = "";
      }
      await updateDoc(doc(db, "attendance_flat", dialogStudentId), updateData);
      toast.success("Attendance updated successfully!");
      setEditStudentId(null);
      closeDialog();

      // Refresh marked attendance
      const flatDate = formatDateForPath(date);
      const q = query(
        collection(db, "attendance_flat"),
        where("academicYear", "==", selectedYear),
        where("term", "==", selectedTerm),
        where("standard", "==", selectedStandard),
        where("section", "==", selectedSession),
        where("date", "==", flatDate)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMarkedAttendance(data);
    } catch (err) {
      toast.error("Failed to update attendance.");
      console.error(err);
    }
  };

  const handleDelete = (studentId) => {
    openDialog("delete", studentId);
  };

  const handleDeleteConfirm = async () => {
    if (!dialogStudentId) {
      toast.error("Missing required information.");
      return;
    }
    try {
      await deleteDoc(doc(db, "attendance_flat", dialogStudentId));
      toast.success("Attendance deleted successfully!");
      closeDialog();

      // Refresh marked attendance
      const flatDate = formatDateForPath(date);
      const q = query(
        collection(db, "attendance_flat"),
        where("academicYear", "==", selectedYear),
        where("term", "==", selectedTerm),
        where("standard", "==", selectedStandard),
        where("section", "==", selectedSession),
        where("date", "==", flatDate)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMarkedAttendance(data);
    } catch (err) {
      toast.error("Failed to delete attendance.");
      console.error(err);
    }
  };

  const downloadExcel = () => {
    const data = markedAttendance.map((record) => ({
      Name: record.fullName || "N/A",
      Status: record.status || "N/A",
      Date: record.date || "N/A",
      Standard: record.standard || "N/A",
      Session: record.section || "N/A",
      Remarks: record.remarks || "",
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(
      wb,
      `Attendance_${selectedStandard}_${selectedSession}_${date}.xlsx`
    );
    toast.success("Excel file downloaded successfully!");
  };

  return (
    <Container sx={{ mt: 4, mb: 4, overflowY: "auto", margin: 0 }}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        limit={5}
      />
      <Typography
        variant="h5"
        sx={{ marginTop: "30px", fontWeight: 700, color: "#1976d2" }}
        gutterBottom
      >
        Attendance Record
      </Typography>
      <Box mb={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" sx={{ borderRadius: 2 }}>
              <InputLabel>Academic Year</InputLabel>
              <Select
                value={selectedYear}
                label="Academic Year"
                onChange={(e) => setSelectedYear(e.target.value)}
                sx={{ borderRadius: 2, width: "150px" }}
                disabled={loading}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {academicYears.map((year) => (
                  <MenuItem key={year.id} value={year.id}>
                    {year.id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl
              fullWidth
              size="small"
              disabled={!terms.length}
              sx={{ borderRadius: 2 }}
            >
              <InputLabel>Term</InputLabel>
              <Select
                value={selectedTerm}
                label="Term"
                onChange={(e) => setSelectedTerm(e.target.value)}
                sx={{ borderRadius: 2, width: "150px" }}
                disabled={loading}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {terms.map((term) => (
                  <MenuItem key={term} value={term}>
                    {term}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: new Date().toISOString().slice(0, 10) }}
              sx={{ borderRadius: 2, width: "150px" }}
              disabled={loading}
            />
          </Grid>
        </Grid>
      </Box>
      <Box mb={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small" sx={{ borderRadius: 2 }}>
              <InputLabel>Standard</InputLabel>
              <Select
                value={selectedStandard}
                label="Standard"
                onChange={(e) => setSelectedStandard(e.target.value)}
                sx={{ borderRadius: 2, width: "150px" }}
                disabled={loading}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {standards.map((std) => (
                  <MenuItem key={std} value={std}>
                    {std}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl
              fullWidth
              size="small"
              disabled={!sessions.length}
              sx={{ borderRadius: 2 }}
            >
              <InputLabel>Session</InputLabel>
              <Select
                value={selectedSession}
                label="Session"
                onChange={(e) => setSelectedSession(e.target.value)}
                sx={{ borderRadius: 2, width: "150px" }}
                disabled={loading}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {sessions.map((sec) => (
                  <MenuItem key={sec} value={sec}>
                    {sec}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Show table with loading state */}
      {loading ? (
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 4 }}>
          Loading attendance data...
        </Typography>
      ) : students.length > 0 ? (
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Box mb={2} display="flex" alignItems="center">
            <FormControl
              size="small"
              sx={{ minWidth: 200, borderRadius: 2 }}
            >
              <InputLabel>Bulk Attendance</InputLabel>
              <Select
                value={bulkStatus}
                label="Bulk Attendance"
                onChange={(e) => handleBulkAttendance(e.target.value)}
                sx={{ borderRadius: 2 }}
                disabled={loading}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {ATTENDANCE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ ml: 2, borderRadius: 2, fontWeight: 600, px: 3 }}
              disabled={loading || !selectedYear || !selectedTerm || !date || !selectedStandard || !selectedSession}
            >
              {loading ? "Marking..." : "Mark Attendance"}
            </Button>
          </Box>
          <TableContainer
            component={Paper}
            sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}
          >
            <Table>
              <TableHead sx={{ bgcolor: "#e3f2fd" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Comments & Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.fullName || "N/A"}</TableCell>
                    <TableCell>
                      <Select
                        value={attendance[student.id] || "present"}
                        onChange={(e) => handleAttendanceChange(student.id, e.target.value)}
                        size="small"
                        sx={{ borderRadius: 2, minWidth: 120 }}
                        disabled={loading}
                        aria-label={`Select attendance status for ${student.fullName}`}
                      >
                        {ATTENDANCE_OPTIONS.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <TextField
                        placeholder="Add comments about attendance (optional)..."
                        multiline
                        rows={2}
                        fullWidth
                        size="small"
                        variant="outlined"
                        disabled={attendance[student.id] === "present" || loading}
                        sx={{
                          borderRadius: 2,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            backgroundColor:
                              attendance[student.id] === "present" ? "#f5f5f5" : "#fafafa",
                            "&:hover": {
                              backgroundColor:
                                attendance[student.id] === "present" ? "#f5f5f5" : "#f5f5f5",
                            },
                            "&.Mui-focused": {
                              backgroundColor: "#fff",
                            },
                            "&.Mui-disabled": {
                              backgroundColor: "#f0f0f0",
                              color: "#999",
                            },
                          },
                        }}
                        value={
                          attendance[student.id] === "present"
                            ? ""
                            : remarks[student.id] || ""
                        }
                        onChange={(e) =>
                          handleRemarksChange(student.id, e.target.value)
                        }
                        aria-label={`Comments for ${student.fullName}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ) : (
        <Typography
          variant="body1"
          color="text.secondary"
          align="center"
          sx={{ mt: 4 }}
        >
          No students available. Please select a standard and session.
        </Typography>
      )}

      {attendanceMarked && (
        <Typography
          variant="subtitle1"
          color="success.main"
          align="center"
          gutterBottom
          sx={{ mt: 2 }}
        >
          Attendance has already been marked for this selection.
        </Typography>
      )}

      {markedAttendance.length > 0 && (
        <Box mt={3}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Marked Attendance
            </Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<FileDownloadIcon />}
              sx={{ borderRadius: 2, fontWeight: 600, px: 3 }}
              onClick={downloadExcel}
              disabled={loading}
            >
              Download Excel
            </Button>
          </Box>
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
            <Table>
              <TableHead sx={{ bgcolor: "#e3f2fd" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Standard</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Session</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Comments & Notes</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {markedAttendance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.fullName || "N/A"}</TableCell>
                    <TableCell>
                      <Chip
                        label={record.status || "N/A"}
                        color={
                          record.status === "present"
                            ? "success"
                            : record.status === "absent"
                            ? "error"
                            : record.status === "late"
                            ? "warning"
                            : "info"
                        }
                        size="small"
                        sx={{ borderRadius: 1, fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>{record.date || "N/A"}</TableCell>
                    <TableCell>{record.standard || "N/A"}</TableCell>
                    <TableCell>{record.section || "N/A"}</TableCell>
                    <TableCell>
                      {editingRemarks === record.id ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <TextField
                            value={editRemarksValue}
                            onChange={(e) => setEditRemarksValue(e.target.value)}
                            size="small"
                            fullWidth
                            multiline
                            rows={2}
                            sx={{ borderRadius: 1 }}
                            disabled={loading}
                          />
                          <IconButton
                            onClick={() => handleSaveRemarks(record.id)}
                            color="success"
                            size="small"
                            disabled={loading}
                          >
                            <SaveIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={handleCancelEditRemarks}
                            color="error"
                            size="small"
                            disabled={loading}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{ flex: 1 }}
                            color={record.status === "present" ? "success.main" : "text.secondary"}
                          >
                            {record.status === "present"
                              ? "Present (No comments needed)"
                              : record.remarks || "No comments"}
                          </Typography>
                          {record.status !== "present" && (
                            <IconButton
                              onClick={() => handleEditRemarks(record.id, record.remarks)}
                              size="small"
                              color="primary"
                              disabled={loading}
                              aria-label={`Edit remarks for ${record.fullName}`}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit Status" arrow>
                        <IconButton
                          onClick={() => handleEdit(record.id, record.status)}
                          size="small"
                          sx={{ borderRadius: 2, mr: 0.5 }}
                          disabled={loading}
                          aria-label={`Edit attendance for ${record.fullName}`}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Record" arrow>
                        <IconButton
                          onClick={() => handleDelete(record.id)}
                          size="small"
                          sx={{ borderRadius: 2 }}
                          disabled={loading}
                          aria-label={`Delete attendance for ${record.fullName}`}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog}>
        <DialogTitle>
          {dialogType === "edit" ? "Edit Attendance" : "Delete Attendance"}
        </DialogTitle>
        <DialogContent>
          {dialogType === "edit" ? (
            <>
              <DialogContentText>
                Change attendance status for{" "}
                {markedAttendance.find((r) => r.id === dialogStudentId)?.fullName ||
                  "this student"}:
              </DialogContentText>
              <FormControl
                fullWidth
                size="small"
                sx={{ mt: 2 }}
              >
                <InputLabel>Status</InputLabel>
                <Select
                  value={editStatus}
                  label="Status"
                  onChange={(e) => setEditStatus(e.target.value)}
                  disabled={loading}
                >
                  {ATTENDANCE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          ) : (
            <DialogContentText>
              Are you sure you want to delete the attendance record for{" "}
              {markedAttendance.find((r) => r.id === dialogStudentId)?.fullName ||
                "this student"}?
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          {dialogType === "edit" ? (
            <Button
              onClick={handleEditSave}
              variant="contained"
              color="primary"
              sx={{ borderRadius: 2 }}
              disabled={loading || !editStatus}
            >
              Save
            </Button>
          ) : (
            <Button
              onClick={handleDeleteConfirm}
              variant="contained"
              color="error"
              sx={{ borderRadius: 2 }}
              disabled={loading}
            >
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}