import React, { useEffect, useState, useCallback, useReducer, useMemo } from "react";
import {
  Container, Box, Typography, Grid, FormControl, InputLabel, Select, MenuItem, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, CircularProgress,
  Chip, Tooltip, Autocomplete, TextField, Divider, TableSortLabel, TablePagination, Collapse,
  IconButton
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"; // Correct import

import * as XLSX from "xlsx";
import dayjs from "dayjs";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ClearIcon from "@mui/icons-material/Clear";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import debounce from "lodash.debounce";
import Skeleton from "@mui/material/Skeleton";

const statusColors = {
  present: "success",
  absent: "error",
  late: "warning",
  leave: "info",
};

const styles = {
  paper: {
    p: 3,
    mb: 3,
    borderRadius: 3,
    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
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
    "& .MuiTableCell-root": { color: "white", fontWeight: "bold" },
  },
  button: {
    borderRadius: 2,
    fontWeight: 600,
    textTransform: "none",
  },
  filterContainer: {
    p: 2,
    borderRadius: 2,
    background: "linear-gradient(90deg, #e3f2fd 0%, #fff 100%)",
  },
};

const filterReducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_FILTER":
      return { ...state, [action.field]: action.value };
    case "RESET":
      return {
        academicYear: "",
        term: "",
        standard: "",
        section: "",
        status: "",
        date: null,
        search: "",
      };
    default:
      return state;
  }
};

export default function AttendanceHistory() {
  const [filterState, dispatchFilters] = useReducer(filterReducer, {
    academicYear: "",
    term: "",
    standard: "",
    section: "",
    status: "",
    date: null,
    search: "",
  });
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [standards, setStandards] = useState([]);
  const [sections, setSections] = useState([]);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("fullName");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const statusOptions = ["present", "absent", "late", "leave"];

  // Load filter state from localStorage
  useEffect(() => {
    const savedFilters = JSON.parse(localStorage.getItem("attendanceFilters")) || {};
    dispatchFilters({ type: "UPDATE_FILTER", field: "academicYear", value: savedFilters.academicYear || "" });
    dispatchFilters({ type: "UPDATE_FILTER", field: "term", value: savedFilters.term || "" });
    dispatchFilters({ type: "UPDATE_FILTER", field: "standard", value: savedFilters.standard || "" });
    dispatchFilters({ type: "UPDATE_FILTER", field: "section", value: savedFilters.section || "" });
    dispatchFilters({ type: "UPDATE_FILTER", field: "status", value: savedFilters.status || "" });
    dispatchFilters({ type: "UPDATE_FILTER", field: "date", value: savedFilters.date ? dayjs(savedFilters.date) : null });
  }, []);

  // Save filter state to localStorage
  useEffect(() => {
    localStorage.setItem("attendanceFilters", JSON.stringify(filterState));
  }, [filterState]);

  // Fetch filter options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        const yearsSnapshot = await getDocs(collection(db, "attendance_flat"));
        const years = [...new Set(yearsSnapshot.docs.map((doc) => doc.data().academicYear))];
        setAcademicYears(years);

        const standardsSnapshot = await getDocs(collection(db, "students_flat"));
        const standards = [...new Set(standardsSnapshot.docs.map((doc) => doc.data().standard))];
        setStandards(standards);
      } catch (err) {
        setError("Failed to load filter options: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, []);

  // Fetch terms
  useEffect(() => {
    if (filterState.academicYear) {
      const fetchTerms = async () => {
        try {
          const q = query(
            collection(db, "attendance_flat"),
            where("academicYear", "==", filterState.academicYear)
          );
          const snapshot = await getDocs(q);
          const terms = [...new Set(snapshot.docs.map((doc) => doc.data().term))];
          setTerms(terms);
        } catch (err) {
          setError("Failed to load terms: " + err.message);
        }
      };
      fetchTerms();
    } else {
      setTerms([]);
      dispatchFilters({ type: "UPDATE_FILTER", field: "term", value: "" });
    }
  }, [filterState.academicYear]);

  // Fetch sections
  useEffect(() => {
    if (filterState.standard) {
      const fetchSections = async () => {
        try {
          const q = query(
            collection(db, "students_flat"),
            where("standard", "==", filterState.standard)
          );
          const snapshot = await getDocs(q);
          const sections = [...new Set(snapshot.docs.map((doc) => doc.data().section))];
          setSections(sections);
        } catch (err) {
          setError("Failed to load sections: " + err.message);
        }
      };
      fetchSections();
    } else {
      setSections([]);
      dispatchFilters({ type: "UPDATE_FILTER", field: "section", value: "" });
    }
  }, [filterState.standard]);

  // Fetch attendance data with debounced filters
  const fetchAttendanceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = collection(db, "attendance_flat");
      let qArr = [];
      if (filterState.academicYear) qArr.push(where("academicYear", "==", filterState.academicYear));
      if (filterState.term) qArr.push(where("term", "==", filterState.term));
      if (filterState.standard) qArr.push(where("standard", "==", filterState.standard));
      if (filterState.section) qArr.push(where("section", "==", filterState.section));
      if (filterState.status) qArr.push(where("status", "==", filterState.status));
      if (filterState.date) {
        const dateString = dayjs(filterState.date).format("YYYY-MM-DD");
        qArr.push(where("date", "==", dateString));
      }
      const finalQuery = qArr.length ? query(q, ...qArr) : q;
      const snapshot = await getDocs(finalQuery);
      let data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      if (filterState.search) {
        data = data.filter((record) =>
          record.fullName?.toLowerCase().includes(filterState.search.toLowerCase())
        );
      }
      setAttendanceData(data);
    } catch (err) {
      setError("Failed to fetch attendance data: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [filterState]);

  useEffect(() => {
    const debouncedFetch = debounce(fetchAttendanceData, 300);
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [fetchAttendanceData]);

  const handleFilterChange = (field, value) => {
    dispatchFilters({ type: "UPDATE_FILTER", field, value });
  };

  const handleClearFilters = () => {
    dispatchFilters({ type: "RESET" });
    setAttendanceData([]);
  };

  const exportToExcel = () => {
    if (!attendanceData.length) {
      return;
    }
    const formattedData = attendanceData.map((record) => ({
      "Student Name": record.fullName,
      Standard: record.standard,
      Section: record.section,
      Status: record.status,
      Date: record.date ? dayjs(record.date).format("DD/MM/YYYY") : "",
      "Academic Year": record.academicYear,
      Term: record.term,
      Remarks: record.remarks || "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance History");
    XLSX.writeFile(workbook, "Attendance_History.xlsx");
  };

  // Table sorting
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedData = useMemo(() => {
    const comparator = (a, b) => {
      const valueA = a[orderBy] || "";
      const valueB = b[orderBy] || "";
      if (valueB < valueA) return order === "asc" ? 1 : -1;
      if (valueB > valueA) return order === "asc" ? -1 : 1;
      return 0;
    };
    return [...attendanceData].sort(comparator);
  }, [attendanceData, order, orderBy]);

  const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" color="primary" mb={3}>
          Attendance History
        </Typography>

        {error && (
          <Box sx={{ mb: 2, p: 2, bgcolor: "error.light", borderRadius: 2 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        <Paper sx={styles.paper}>
          {/* Filters Section */}
          <Box sx={styles.sectionHeader} onClick={() => setShowFilters(!showFilters)}>
            <Typography variant="h6" fontWeight={600}>
              Filters
            </Typography>
            <IconButton>{showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
          </Box>
          <Collapse in={showFilters}>
            <Box sx={styles.filterContainer}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={2}>
                  <Autocomplete
                    options={academicYears}
                    value={filterState.academicYear || null}
                    onChange={(e, newValue) => handleFilterChange("academicYear", newValue || "")}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Academic Year"
                        size="small"
                        sx={{ bgcolor: "#fff" }}
                        aria-label="Academic Year"
                      />
                    )}
                    isOptionEqualToValue={(option, value) => option === value}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Autocomplete
                    options={terms}
                    value={filterState.term || null}
                    onChange={(e, newValue) => handleFilterChange("term", newValue || "")}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Term"
                        size="small"
                        sx={{ bgcolor: "#fff" }}
                        aria-label="Term"
                      />
                    )}
                    isOptionEqualToValue={(option, value) => option === value}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Autocomplete
                    options={standards}
                    value={filterState.standard || null}
                    onChange={(e, newValue) => handleFilterChange("standard", newValue || "")}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Standard"
                        size="small"
                        sx={{ bgcolor: "#fff" }}
                        aria-label="Standard"
                      />
                    )}
                    isOptionEqualToValue={(option, value) => option === value}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Autocomplete
                    options={sections}
                    value={filterState.section || null}
                    onChange={(e, newValue) => handleFilterChange("section", newValue || "")}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Section"
                        size="small"
                        sx={{ bgcolor: "#fff" }}
                        aria-label="Section"
                      />
                    )}
                    isOptionEqualToValue={(option, value) => option === value}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Autocomplete
                    options={statusOptions}
                    value={filterState.status || null}
                    onChange={(e, newValue) => handleFilterChange("status", newValue || "")}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Status"
                        size="small"
                        sx={{ bgcolor: "#fff" }}
                        aria-label="Status"
                      />
                    )}
                    isOptionEqualToValue={(option, value) => option === value}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <DatePicker
                    label="Date"
                    value={filterState.date}
                    onChange={(newValue) => handleFilterChange("date", newValue)}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small",
                        sx: { bgcolor: "#fff" },
                      },
                    }}
                    disableFuture={false}
                    clearable
                    aria-label="Date"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    label="Search Student"
                    value={filterState.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    size="small"
                    fullWidth
                    sx={{ bgcolor: "#fff" }}
                    aria-label="Search Student"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={handleClearFilters}
                    fullWidth
                    sx={{ ...styles.button, height: 40 }}
                    aria-label="Clear Filters"
                  >
                    Clear Filters
                  </Button>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    variant="contained"
                    startIcon={<FileDownloadIcon />}
                    onClick={exportToExcel}
                    fullWidth
                    disabled={attendanceData.length === 0}
                    sx={{ ...styles.button, height: 40 }}
                    aria-label="Export to Excel"
                  >
                    Export
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </Paper>

        {/* Results */}
        {loading ? (
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead sx={styles.tableHeader}>
                <TableRow>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Standard</TableCell>
                  <TableCell>Section</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Academic Year</TableCell>
                  <TableCell>Term</TableCell>
                  <TableCell>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
            <Table stickyHeader>
              <TableHead sx={styles.tableHeader}>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "fullName"}
                      direction={orderBy === "fullName" ? order : "asc"}
                      onClick={() => handleRequestSort("fullName")}
                    >
                      Student Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Standard</TableCell>
                  <TableCell>Section</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "date"}
                      direction={orderBy === "date" ? order : "asc"}
                      onClick={() => handleRequestSort("date")}
                    >
                      Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Academic Year</TableCell>
                  <TableCell>Term</TableCell>
                  <TableCell>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      No records found. Try adjusting your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((record) => (
                    <TableRow
                      key={record.id}
                      hover
                      sx={{ "&:hover": { background: "#f5faff" } }}
                    >
                      <TableCell>{record.fullName}</TableCell>
                      <TableCell>{record.standard}</TableCell>
                      <TableCell>{record.section}</TableCell>
                      <TableCell>
                        <Chip
                          label={record.status}
                          color={statusColors[record.status] || "default"}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>{record.date ? dayjs(record.date).format("DD/MM/YYYY") : ""}</TableCell>
                      <TableCell>{record.academicYear}</TableCell>
                      <TableCell>{record.term}</TableCell>
                      <TableCell>
                        <Tooltip title={record.remarks || "No remarks"}>
                          <span>{record.remarks || <em style={{ color: "#aaa" }}>No remarks</em>}</span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={sortedData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </TableContainer>
        )}
      </Container>
    </LocalizationProvider>
  );
}