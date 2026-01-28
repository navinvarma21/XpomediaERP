import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  IconButton,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

// Dummy data
const dummyStudents = [
  { id: "S101", name: "Arun Kumar", standard: "1", section: "A" },
  { id: "S102", name: "Divya R", standard: "1", section: "B" },
  { id: "S103", name: "Rahul M", standard: "1", section: "A" },
];

export default function Disciplinary_Record() {
  const [standard, setStandard] = useState("");
  const [section, setSection] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [filteredStudents, setFilteredStudents] = useState(dummyStudents);
  const [student, setStudent] = useState(null);

  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [document, setDocument] = useState(null);
  const [incidentHistory, setIncidentHistory] = useState([]);
  const [editId, setEditId] = useState(null);

  const handleFileChange = (e) => {
    setDocument(e.target.files[0]);
  };

  const handleSearch = () => {
    const filtered = dummyStudents.filter(
      (stu) =>
        stu.standard === standard &&
        stu.section === section &&
        stu.name.toLowerCase().includes(studentSearch.toLowerCase())
    );
    setFilteredStudents(filtered);
    setStudent(null);
    setIncidentHistory([]);
  };

  const handleSelectStudent = (stu) => {
    setStudent(stu);
    setIncidentHistory([]); // Simulate loading from backend
    setEditId(null);
    setCategory("");
    setSeverity("");
    setActionTaken("");
    setDocument(null);
  };

  const handleAddIncident = () => {
    if (!student || !category || !severity || !actionTaken) return;

    const newIncident = {
      id: editId || Date.now(),
      studentName: student.name,
      studentId: student.id,
      category,
      severity,
      actionTaken,
      documentName: document?.name || "None",
    };

    if (editId) {
      setIncidentHistory((prev) =>
        prev.map((inc) => (inc.id === editId ? newIncident : inc))
      );
    } else {
      setIncidentHistory((prev) => [...prev, newIncident]);
    }

    setCategory("");
    setSeverity("");
    setActionTaken("");
    setDocument(null);
    setEditId(null);
  };

  const handleEdit = (incident) => {
    setEditId(incident.id);
    setCategory(incident.category);
    setSeverity(incident.severity);
    setActionTaken(incident.actionTaken);
    setDocument({ name: incident.documentName });
  };

  const handleDelete = (id) => {
    setIncidentHistory((prev) => prev.filter((inc) => inc.id !== id));
  };

  const handleFinalSave = () => {
    console.log("Saving all incidents:", incidentHistory);
    alert("Incidents saved (check console for output)!");
  };

  return (
    <Container
      sx={{ mt: 4, mb: 4, height: "90vh", overflowY: "auto", margin: "0" }}
    >
      <Typography variant="h5" sx={{ marginTop: "30px" }} gutterBottom>
        Disciplinary Records
      </Typography>

      {/* Filters */}
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Standard</InputLabel>
              <Select
                value={standard}
                sx={{ width: "200px" }}
                label="Standard"
                onChange={(e) => setStandard(e.target.value)}
              >
                {[...Array(12)].map((_, i) => (
                  <MenuItem key={i + 1} value={String(i + 1)}>
                    {i + 1}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Section</InputLabel>
              <Select
                sx={{ width: "200px" }}
                value={section}
                label="Section"
                onChange={(e) => setSection(e.target.value)}
              >
                {["A", "B", "C"].map((sec) => (
                  <MenuItem key={sec} value={sec}>
                    {sec}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleSearch}
              sx={{ height: "100%" }}
            >
              Fetch data
            </Button>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Search Student"
              size="small"
              fullWidth
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={2}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleSearch}
              sx={{ height: "100%" }}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Matching Students Table */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6">Students</Typography>
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#1976d2" }}>
                <TableCell sx={{ color: "white" }}>ID</TableCell>
                <TableCell sx={{ color: "white" }}>Name</TableCell>
                <TableCell sx={{ color: "white" }}>Standard</TableCell>
                <TableCell sx={{ color: "white" }}>Section</TableCell>
                <TableCell sx={{ color: "white" }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.map((stu) => (
                <TableRow key={stu.id}>
                  <TableCell>{stu.id}</TableCell>
                  <TableCell>{stu.name}</TableCell>
                  <TableCell>{stu.standard}</TableCell>
                  <TableCell>{stu.section}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleSelectStudent(stu)}
                    >
                      Select
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Selected Student Info */}
      {student && (
        <>
          <Typography sx={{ mt: 2, mb: 2 }}>
            <strong>Selected Student:</strong> {student.name} ({student.id})
          </Typography>

          {/* Incident Form */}
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Misconduct Category</InputLabel>
                  <Select
                  sx={{width:"200px"}}
                    value={category}
                    label="Misconduct Category"
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {[
                      "Bullying",
                      "Cheating",
                      "Dress Code Violation",
                      "Vandalism",
                    ].map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Severity</InputLabel>
                  <Select
                  sx={{width:"200px"}}
                    value={severity}
                    label="Severity"
                    onChange={(e) => setSeverity(e.target.value)}
                  >
                    {["Minor", "Moderate", "Severe"].map((sev) => (
                      <MenuItem key={sev} value={sev}>
                        {sev}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Action Taken"
                  variant="outlined"
                  fullWidth
                  size="small"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadFileIcon />}
                  fullWidth
                  sx={{ height: "40px" }}
                >
                  {document ? document.name : "Upload Document"}
                  <input type="file" hidden onChange={handleFileChange} />
                </Button>
              </Grid>

              <Grid item xs={12}>
                <Button variant="contained" onClick={handleAddIncident}>
                  {editId ? "Update Incident" : "Add Incident"}
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Incident History */}
          <Typography variant="h6" gutterBottom>
            Incident History
          </Typography>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#1976d2" }}>
                  <TableCell sx={{ color: "white" }}>Student Name</TableCell>
                  <TableCell sx={{ color: "white" }}>Student ID</TableCell>
                  <TableCell sx={{ color: "white" }}>Category</TableCell>
                  <TableCell sx={{ color: "white" }}>Severity</TableCell>
                  <TableCell sx={{ color: "white" }}>Action Taken</TableCell>
                  <TableCell sx={{ color: "white" }}>Document</TableCell>
                  <TableCell sx={{ color: "white" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {incidentHistory.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell>{incident.studentName}</TableCell>
                    <TableCell>{incident.studentId}</TableCell>
                    <TableCell>{incident.category}</TableCell>
                    <TableCell>{incident.severity}</TableCell>
                    <TableCell>{incident.actionTaken}</TableCell>
                    <TableCell>{incident.documentName}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(incident)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(incident.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ textAlign: "right", mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleFinalSave}
            >
              Save All Incidents
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
}
