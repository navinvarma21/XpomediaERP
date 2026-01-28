import React, { useEffect, useState, useCallback, useReducer, useMemo } from "react";
import {
  Container, Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem, Grid,
  Checkbox, ListItemText, OutlinedInput, Box, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Chip,
  TextField, Autocomplete, Divider, CircularProgress, TableSortLabel, TablePagination, Collapse
} from "@mui/material";
import { Edit, Delete, AddCircle, ExpandMore, ExpandLess } from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getAcademicYears, getTermsForYear, getStandardsForYearTerm,
  saveTeacherSubjectAllocation, getAllTeacherAllocations, getTeacherAllocationById,
  updateTeacherAllocation, deleteTeacherAllocation
} from "../../api/teacherAllotmentApi";
import { getTeachers } from "../../api/teacherApi";

import debounce from "lodash.debounce";

const styles = {
  card: {
    mb: 4,
    borderRadius: 3,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    background: "#fff",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    mb: 2,
    cursor: "pointer",
  },
  tableHeader: {
    backgroundColor: (theme) => theme.palette.primary.main,
    "& .MuiTableCell-root": { color: "#fff", fontWeight: "bold" },
  },
  button: {
    borderRadius: 2,
    fontWeight: 600,
    textTransform: "none",
  },
  stickyActions: {
    position: "sticky",
    bottom: 0,
    p: 2,
    background: "#fff",
    zIndex: 1,
    borderTop: "1px solid #e0e0e0",
  },
};

const getFlatDocId = (year, term, standard) =>
  `${year.trim()}-${term.trim().replace(/\s+/g, "_")}-${standard.trim()}`;

// Reducer for form state
const formReducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_FIELD":
      return { ...state, [action.field]: action.value };
    case "RESET":
      return {
        academicYear: "",
        term: "",
        standards: [],
        subjects: [],
        teacherId: "",
      };
    default:
      return state;
  }
};

export default function Teacher_Allotment() {
  const [formState, dispatch] = useReducer(formReducer, {
    academicYear: "",
    term: "",
    standards: [],
    subjects: [],
    teacherId: "",
  });
  const [academicYears, setAcademicYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [standards, setStandards] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [teacherAllocations, setTeacherAllocations] = useState([]);
  const [alreadyAllocatedSubjects, setAlreadyAllocatedSubjects] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editAlloc, setEditAlloc] = useState(null);
  const [editSubjects, setEditSubjects] = useState([]);
  const [editDialogSubjects, setEditDialogSubjects] = useState([]);
  const [addSubjectValue, setAddSubjectValue] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAlloc, setDeleteAlloc] = useState(null);
  const [searchTeacherName, setSearchTeacherName] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState({ fetch: false, save: false });
  const [errors, setErrors] = useState({});
  const [showForm, setShowForm] = useState(true);
  const [showAllocations, setShowAllocations] = useState(true);
  const [selectedTeacherName, setSelectedTeacherName] = useState("");
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("teacherName");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Validation
  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formState.academicYear) newErrors.academicYear = "Academic Year is required";
    if (!formState.term) newErrors.term = "Term is required";
    if (!formState.standards.length) newErrors.standards = "At least one standard is required";
    if (!formState.subjects.length) newErrors.subjects = "At least one subject is required";
    if (!formState.teacherId) newErrors.teacherId = "Teacher is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState]);

  // Load initial data
  useEffect(() => {
    setLoading((prev) => ({ ...prev, fetch: true }));
    Promise.all([
      getAcademicYears().then(setAcademicYears),
      getTeachers().then(setTeachers),
      getAllTeacherAllocations().then(setTeacherAllocations),
    ]).finally(() => setLoading((prev) => ({ ...prev, fetch: false })));
  }, []);

  // Load terms when year changes
  useEffect(() => {
    if (formState.academicYear) {
      getTermsForYear(formState.academicYear).then((termsList) => {
        setTerms(termsList);
        dispatch({ type: "UPDATE_FIELD", field: "term", value: "" });
        setStandards([]);
        dispatch({ type: "UPDATE_FIELD", field: "standards", value: [] });
        setSubjects([]);
        dispatch({ type: "UPDATE_FIELD", field: "subjects", value: [] });
      });
    } else {
      setTerms([]);
      dispatch({ type: "UPDATE_FIELD", field: "term", value: "" });
      setStandards([]);
      dispatch({ type: "UPDATE_FIELD", field: "standards", value: [] });
      setSubjects([]);
      dispatch({ type: "UPDATE_FIELD", field: "subjects", value: [] });
    }
  }, [formState.academicYear]);

  // Load standards when term changes
  useEffect(() => {
    if (formState.academicYear && formState.term) {
      getStandardsForYearTerm(formState.academicYear, formState.term).then((standardsList) => {
        setStandards(standardsList);
        dispatch({ type: "UPDATE_FIELD", field: "standards", value: [] });
        setSubjects([]);
        dispatch({ type: "UPDATE_FIELD", field: "subjects", value: [] });
      });
    } else {
      setStandards([]);
      dispatch({ type: "UPDATE_FIELD", field: "standards", value: [] });
      setSubjects([]);
      dispatch({ type: "UPDATE_FIELD", field: "subjects", value: [] });
    }
  }, [formState.academicYear, formState.term]);

  // Load subjects when standards change
  useEffect(() => {
    const loadSubjects = async () => {
      if (formState.academicYear && formState.term && formState.standards.length > 0) {
        let allSubjects = [];
        for (const std of formState.standards) {
          const docId = getFlatDocId(formState.academicYear, formState.term, std);
          const docRef = doc(db, "subjectConfigurations", docId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && Array.isArray(docSnap.data().subjects)) {
            allSubjects = [...allSubjects, ...docSnap.data().subjects];
          }
        }
        setSubjects([...new Set(allSubjects)]);
      } else {
        setSubjects([]);
      }
    };
    loadSubjects();
  }, [formState.academicYear, formState.term, formState.standards]);

  // Fetch already allocated subjects
  useEffect(() => {
    const fetchAllocatedSubjects = async () => {
      if (
        formState.academicYear &&
        formState.term &&
        formState.standards.length === 1 &&
        formState.teacherId
      ) {
        const docId = `${formState.teacherId}_${formState.academicYear}_${formState.term}_${formState.standards[0]}`;
        const alloc = await getTeacherAllocationById(docId);
        setAlreadyAllocatedSubjects(alloc?.subjects || []);
      } else {
        setAlreadyAllocatedSubjects([]);
      }
    };
    fetchAllocatedSubjects();
  }, [formState.academicYear, formState.term, formState.standards, formState.teacherId]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value) => {
      const results = teacherAllocations.filter((alloc) =>
        alloc.teacherName?.toLowerCase().includes(value.toLowerCase())
      );
      setSearchResults(results.length ? results : []);
    }, 300),
    [teacherAllocations]
  );

  useEffect(() => {
    debouncedSearch(searchTeacherName);
    return () => debouncedSearch.cancel();
  }, [searchTeacherName, debouncedSearch]);

  // Save handler
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    setLoading((prev) => ({ ...prev, save: true }));
    try {
      for (const std of formState.standards) {
        const docId = `${formState.teacherId}_${formState.academicYear}_${formState.term}_${std}`;
        const existingAlloc = await getTeacherAllocationById(docId);
        const mergedSubjects = existingAlloc?.subjects
          ? [...new Set([...existingAlloc.subjects, ...formState.subjects])]
          : formState.subjects;
        await saveTeacherSubjectAllocation({
          academicYear: formState.academicYear,
          term: formState.term,
          standards: [std],
          subjects: mergedSubjects,
          teacherId: formState.teacherId,
          teacherName: selectedTeacherName,
        });

        const flatDocId = `${formState.teacherId}-${formState.academicYear}-${formState.term}-${std}`;
        await setDoc(doc(db, "teacher_allocations_flat", flatDocId), {
          teacherId: formState.teacherId,
          teacherName: selectedTeacherName,
          academicYear: formState.academicYear,
          term: formState.term,
          standard: std,
          subjects: mergedSubjects,
          timestamp: new Date().toISOString(),
        });
      }
      toast.success("Allocation saved/updated!");
      getAllTeacherAllocations().then(setTeacherAllocations);
      dispatch({ type: "RESET" });
      setSelectedTeacherName("");
    } catch (err) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setLoading((prev) => ({ ...prev, save: false }));
    }
  };

  // Edit handler
  const handleEditSave = async () => {
    try {
      await updateTeacherAllocation(editAlloc.id, { ...editAlloc, subjects: editSubjects });
      toast.success("Subjects updated!");
      getAllTeacherAllocations().then(setTeacherAllocations);
      setEditDialogOpen(false);
    } catch (err) {
      toast.error(`Update failed: ${err.message}`);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    try {
      await deleteTeacherAllocation(deleteAlloc.id);
      const flatDocId = `${deleteAlloc.teacherId}-${deleteAlloc.academicYear}-${deleteAlloc.term}-${deleteAlloc.standards[0]}`;
      await deleteDoc(doc(db, "teacher_allocations_flat", flatDocId));
      toast.success("Allocation deleted!");
      getAllTeacherAllocations().then(setTeacherAllocations);
      setDeleteDialogOpen(false);
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  // Table sorting
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedAllocations = useMemo(() => {
    const comparator = (a, b) => {
      if (b[orderBy] < a[orderBy]) return order === "asc" ? 1 : -1;
      if (b[orderBy] > a[orderBy]) return order === "asc" ? -1 : 1;
      return 0;
    };
    return [...(searchResults.length ? searchResults : teacherAllocations)].sort(comparator);
  }, [searchResults, teacherAllocations, order, orderBy]);

  const paginatedAllocations = sortedAllocations.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container sx={{ mt: 4, mb: 4, maxWidth: 960 }}>
      <Typography variant="h5" fontWeight="bold" color="primary" mb={3}>
        Teacher Subject Allocation
      </Typography>
      <ToastContainer />

      <Paper sx={styles.card}>
        {/* Allocation Form Section */}
        <Box sx={styles.sectionHeader} onClick={() => setShowForm(!showForm)}>
          <Typography variant="h6" fontWeight={600}>
            Create Allocation
          </Typography>
          <IconButton>{showForm ? <ExpandLess /> : <ExpandMore />}</IconButton>
        </Box>
        <Collapse in={showForm}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small" error={!!errors.academicYear}>
                  <InputLabel>Academic Year</InputLabel>
                  <Select
                    value={formState.academicYear}
                    onChange={(e) =>
                      dispatch({ type: "UPDATE_FIELD", field: "academicYear", value: e.target.value })
                    }
                    label="Academic Year"
                    sx={{ bgcolor: "#fff" }}
                    aria-label="Academic Year"
                  >
                    {academicYears.map((year) => (
                      <MenuItem key={year.id} value={year.id}>
                        {year.id}
                      </MenuItem>
                    ))}
                  </Select>
                  {!!errors.academicYear && (
                    <Typography color="error" variant="caption">{errors.academicYear}</Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small" error={!!errors.term}>
                  <InputLabel>Term</InputLabel>
                  <Select
                    value={formState.term}
                    onChange={(e) =>
                      dispatch({ type: "UPDATE_FIELD", field: "term", value: e.target.value })
                    }
                    label="Term"
                    disabled={!formState.academicYear}
                    sx={{ bgcolor: "#fff" }}
                    aria-label="Term"
                  >
                    {terms.map((term) => (
                      <MenuItem key={term} value={term}>{term}</MenuItem>
                    ))}
                  </Select>
                  {!!errors.term && (
                    <Typography color="error" variant="caption">{errors.term}</Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small" error={!!errors.standards}>
                  <InputLabel>Standards</InputLabel>
                  <Select
                    multiple
                    value={formState.standards}
                    onChange={(e) =>
                      dispatch({ type: "UPDATE_FIELD", field: "standards", value: e.target.value })
                    }
                    input={<OutlinedInput label="Standards" />}
                    renderValue={(selected) => selected.join(", ")}
                    disabled={!formState.term}
                    sx={{ bgcolor: "#fff" }}
                    aria-label="Standards"
                  >
                    {standards.map((std) => (
                      <MenuItem key={std} value={std}>
                        <Checkbox checked={formState.standards.includes(std)} />
                        <ListItemText primary={std} />
                      </MenuItem>
                    ))}
                  </Select>
                  {!!errors.standards && (
                    <Typography color="error" variant="caption">{errors.standards}</Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small" error={!!errors.subjects}>
                  <InputLabel>Subjects</InputLabel>
                  <Select
                    multiple
                    value={formState.subjects}
                    onChange={(e) =>
                      dispatch({ type: "UPDATE_FIELD", field: "subjects", value: e.target.value })
                    }
                    input={<OutlinedInput label="Subjects" />}
                    renderValue={(selected) => selected.join(", ")}
                    disabled={!formState.standards.length}
                    sx={{ bgcolor: "#fff" }}
                    aria-label="Subjects"
                  >
                    {subjects.map((subject) => {
                      const isAllocated = alreadyAllocatedSubjects.includes(subject);
                      return (
                        <MenuItem key={subject} value={subject} disabled={isAllocated}>
                          <Checkbox
                            checked={formState.subjects.includes(subject) || isAllocated}
                            sx={{
                              color: isAllocated ? "text.disabled" : "primary.main",
                              "&.Mui-checked": { color: isAllocated ? "text.disabled" : "primary.main" },
                            }}
                          />
                          <ListItemText
                            primary={subject}
                            sx={{ color: isAllocated ? "text.disabled" : "inherit" }}
                          />
                        </MenuItem>
                      );
                    })}
                  </Select>
                  {!!errors.subjects && (
                    <Typography color="error" variant="caption">{errors.subjects}</Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={teachers}
                  getOptionLabel={(option) => `${option.fullName} (${option.teacherId})`}
                  value={teachers.find((t) => t.teacherId === formState.teacherId) || null}
                  onChange={(e, newValue) => {
                    dispatch({
                      type: "UPDATE_FIELD",
                      field: "teacherId",
                      value: newValue?.teacherId || "",
                    });
                    setSelectedTeacherName(newValue?.fullName || "");
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Teacher"
                      size="small"
                      error={!!errors.teacherId}
                      helperText={errors.teacherId}
                      sx={{ bgcolor: "#fff" }}
                      aria-label="Select Teacher"
                    />
                  )}
                  isOptionEqualToValue={(option, value) => option.teacherId === value.teacherId}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                {formState.teacherId && (
                  <TextField
                    fullWidth
                    size="small"
                    label="Teacher ID"
                    value={formState.teacherId}
                    InputProps={{ readOnly: true }}
                    sx={{ bgcolor: "#fff" }}
                    aria-label="Teacher ID"
                  />
                )}
              </Grid>
              <Grid item xs={12}>
                <Box sx={styles.stickyActions}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading.save}
                    sx={styles.button}
                    startIcon={loading.save ? <CircularProgress size={20} /> : null}
                    aria-label="Save Allocation"
                  >
                    Save Allocation
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Collapse>
        <Divider sx={{ my: 2 }} />

        {/* Allocations Section */}
        <Box sx={styles.sectionHeader} onClick={() => setShowAllocations(!showAllocations)}>
          <Typography variant="h6" fontWeight={600}>
            Manage Allocations
          </Typography>
          <IconButton>{showAllocations ? <ExpandLess /> : <ExpandMore />}</IconButton>
        </Box>
        <Collapse in={showAllocations}>
          <CardContent>
            <Box display="flex" gap={2} mb={3}>
              <TextField
                size="small"
                label="Search by Teacher Name"
                value={searchTeacherName}
                onChange={(e) => setSearchTeacherName(e.target.value)}
                sx={{ bgcolor: "#fff" }}
                aria-label="Search by Teacher Name"
              />
              <Button variant="outlined" onClick={() => debouncedSearch(searchTeacherName)} sx={styles.button}>
                Search
              </Button>
            </Box>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead sx={styles.tableHeader}>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === "teacherName"}
                        direction={orderBy === "teacherName" ? order : "asc"}
                        onClick={() => handleRequestSort("teacherName")}
                      >
                        Teacher
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === "academicYear"}
                        direction={orderBy === "academicYear" ? order : "asc"}
                        onClick={() => handleRequestSort("academicYear")}
                      >
                        Year
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === "term"}
                        direction={orderBy === "term" ? order : "asc"}
                        onClick={() => handleRequestSort("term")}
                      >
                        Term
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Standards</TableCell>
                    <TableCell>Subjects</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading.fetch ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : paginatedAllocations.length ? (
                    paginatedAllocations.map((alloc) => (
                      <TableRow key={alloc.id}>
                        <TableCell>{alloc.teacherName}</TableCell>
                        <TableCell>{alloc.academicYear}</TableCell>
                        <TableCell>{alloc.term}</TableCell>
                        <TableCell>{alloc.standards?.join(", ")}</TableCell>
                        <TableCell>{alloc.subjects?.join(", ")}</TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => {
                              setEditAlloc(alloc);
                              setEditSubjects(alloc.subjects);
                              setEditDialogSubjects(subjects);
                              setEditDialogOpen(true);
                            }}
                            aria-label={`Edit allocation for ${alloc.teacherName}`}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            onClick={() => {
                              setDeleteAlloc(alloc);
                              setDeleteDialogOpen(true);
                            }}
                            aria-label={`Delete allocation for ${alloc.teacherName}`}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No allocations found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={sortedAllocations.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </CardContent>
        </Collapse>
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} aria-labelledby="edit-dialog-title">
        <DialogTitle id="edit-dialog-title">Edit Subjects</DialogTitle>
        <DialogContent>
          <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
            {editSubjects.map((sub) => (
              <Chip
                key={sub}
                label={sub}
                onDelete={() => setEditSubjects((prev) => prev.filter((s) => s !== sub))}
                color="primary"
              />
            ))}
          </Box>
          <Box display="flex" gap={1}>
            <FormControl fullWidth size="small">
              <InputLabel>Add Subject</InputLabel>
              <Select
                value={addSubjectValue}
                onChange={(e) => setAddSubjectValue(e.target.value)}
                sx={{ bgcolor: "#fff" }}
                aria-label="Add Subject"
              >
                {editDialogSubjects.map((sub) => (
                  <MenuItem
                    key={sub}
                    value={sub}
                    disabled={editSubjects.includes(sub)}
                    sx={{
                      backgroundColor: editSubjects.includes(sub) ? "action.selected" : "inherit",
                      fontStyle: editSubjects.includes(sub) ? "italic" : "normal",
                    }}
                  >
                    {sub}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              onClick={() => {
                if (addSubjectValue) {
                  setEditSubjects((prev) => [...new Set([...prev, addSubjectValue])]);
                  setAddSubjectValue("");
                }
              }}
              sx={styles.button}
              startIcon={<AddCircle />}
              aria-label="Add Subject"
            >
              Add
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} sx={styles.button} aria-label="Cancel">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEditSave}
            sx={styles.button}
            aria-label="Save"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} aria-labelledby="delete-dialog-title">
        <DialogTitle id="delete-dialog-title">Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this allocation?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={styles.button} aria-label="Cancel">
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            sx={styles.button}
            aria-label="Delete"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}