import React, { useEffect, useState, useCallback } from 'react';
import {
  Container, TextField, Grid, Button, Paper,
  Typography, Table, TableHead, TableRow,
  TableCell, TableBody, IconButton, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { getAcademicYears } from '../../api/academicYearApi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import debounce from 'lodash.debounce';


const initialState = {
  fullName: '',
  academicYear: '',
  standard: '',
  section: '',
  contact: '',
  email: '',
  address: '',
  subject: '',
  qualification: '',
  subjectExperience: '',
  teacherId: '', // auto-filled from user signup
};

const standards = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
const sections = ['A', 'B', 'C', 'D', 'E'];

const getFlatTeacherDocId = (year, standard, section, teacherId) =>
  `${year}-${standard}-${section}-${teacherId}`;

const Teacher_Admission = () => {
  const [formData, setFormData] = useState(initialState);
  const [isEdit, setIsEdit] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [editingID, setEditingID] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [activeAcademicYear, setActiveAcademicYear] = useState('');
  const [searchTeacherID, setSearchTeacherID] = useState('');
  const [searchStandard, setSearchStandard] = useState('');
  const [searchSection, setSearchSection] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [tableVisible, setTableVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch academic years for dropdown
  const fetchAcademicYears = async () => {
    try {
      const years = await getAcademicYears();
      setAcademicYears(years);
      const activeYear = years.find(y => y.status === 'active');
      if (activeYear) {
        setActiveAcademicYear(activeYear.academicYear);
        setFormData(prev => ({
          ...prev,
          academicYear: isEdit ? prev.academicYear : activeYear.academicYear
        }));
      }
    } catch (err) {
      toast.error('Failed to fetch academic years.');
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  // Debounced email lookup for teacherId and name
  const lookupTeacherIdAndName = useCallback(
    debounce(async (email) => {
      if (!email) {
        setFormData((prev) => ({ ...prev, teacherId: "", fullName: "" }));
        return;
      }
      setLoading(true);
      try {
        const trimmedEmail = email.trim().toLowerCase();
        const q = query(
          collection(db, "users"),
          where("email", "==", trimmedEmail),
          where("role", "==", "Teacher")
        );
        const qs = await getDocs(q);
        if (!qs.empty) {
          const userData = qs.docs[0].data();
          setFormData((prev) => ({
            ...prev,
            teacherId: userData.teacherId || "",
            fullName: prev.fullName ? prev.fullName : (userData.name || "")
          }));
          toast.success("Teacher found. ID and Name auto-filled.");
        } else {
          setFormData((prev) => ({ ...prev, teacherId: "", fullName: "" }));
          toast.error("No teacher found with this email. They must sign up first.");
        }
      } catch (err) {
        setFormData((prev) => ({ ...prev, teacherId: "", fullName: "" }));
        toast.error("Error fetching teacher details.");
      }
      setLoading(false);
    }, 600),
    []
  );

  // Handle email change with debounce
  const handleEmailChange = (e) => {
    const email = e.target.value;
    setFormData(prev => ({ ...prev, email }));
    lookupTeacherIdAndName(email);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Search by Teacher ID, Standard, and Section
  const handleSearch = async () => {
    setTableVisible(true);
    if (!searchTeacherID.trim() || !searchStandard.trim() || !searchSection.trim()) {
      setTeachers([]);
      toast.info('Please enter Teacher ID, Standard, and Section to search.');
      return;
    }
    try {
      const flatDocId = getFlatTeacherDocId(
        activeAcademicYear,
        searchStandard,
        searchSection,
        searchTeacherID
      );
      const docRef = doc(db, "teachers_flat", flatDocId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTeachers([docSnap.data()]);
        toast.success('Teacher fetched successfully!');
      } else {
        setTeachers([]);
        toast.info('No teacher found with that Teacher ID, Standard, and Section.');
      }
    } catch (err) {
      setTeachers([]);
      toast.error('Error fetching teacher.');
    }
  };

  const handleResetSearch = () => {
    setSearchTeacherID('');
    setSearchStandard('');
    setSearchSection('');
    setTeachers([]);
    setTableVisible(false);
    toast.info('Table cleared.');
  };

  // Add or update teacher - ONLY store in flat collection with composite ID
  const handleSubmit = async () => {
    try {
      if (!formData.fullName) {
        toast.error('Full Name is required!');
        return;
      }
      if (!formData.academicYear) {
        toast.error('Academic Year is required!');
        return;
      }
      if (!formData.standard) {
        toast.error('Standard is required!');
        return;
      }
      if (!formData.section) {
        toast.error('Section is required!');
        return;
      }
      if (!formData.email) {
        toast.error('Email is required!');
        return;
      }
      if (!formData.teacherId) {
        toast.error('Teacher ID is missing. Enter a valid email (teacher must be signed up).');
        return;
      }

      // ONLY store in flat collection with composite ID
      const flatDocId = getFlatTeacherDocId(
        formData.academicYear,
        formData.standard,
        formData.section,
        formData.teacherId
      );
      const flatDocRef = doc(db, "teachers_flat", flatDocId);

      // Add timestamp and role
      const teacherData = {
        ...formData,
        role: "Teacher",
        timestamp: new Date().toISOString()
      };

      if (isEdit) {
        await setDoc(flatDocRef, teacherData, { merge: true });
        toast.success('Teacher updated successfully!');
      } else {
        // Check if teacher already exists for this combination
        const docSnap = await getDoc(flatDocRef);
        if (docSnap.exists()) {
          toast.error('Teacher already assigned to this standard and section!');
          return;
        }
        await setDoc(flatDocRef, teacherData);
        toast.success('Teacher added successfully!');
      }

      setFormData({ ...initialState, academicYear: activeAcademicYear });
      setIsEdit(false);
      setEditingID(null);
      setTableVisible(false);
      setTeachers([]);
    } catch (err) {
      toast.error('Failed to save teacher: ' + err.message);
    }
  };

  // Dialog handlers
  const handleDialogOpen = (type, teacher) => {
    setDialogType(type);
    setSelectedTeacher(teacher);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogType('');
    setSelectedTeacher(null);
  };

  const handleEditConfirm = () => {
    setFormData(selectedTeacher);
    setIsEdit(true);
    setEditingID(selectedTeacher.teacherId);
    handleDialogClose();
    toast.info('Editing teacher. Make changes and click Update Teacher.');
  };

  const handleDeleteConfirm = async () => {
    try {
      const flatDocId = getFlatTeacherDocId(
        selectedTeacher.academicYear,
        selectedTeacher.standard,
        selectedTeacher.section,
        selectedTeacher.teacherId
      );
      await deleteDoc(doc(db, "teachers_flat", flatDocId));
      setTeachers([]);
      setTableVisible(false);
      toast.success('Teacher deleted successfully!');
    } catch (err) {
      toast.error('Failed to delete teacher: ' + err.message);
    }
    handleDialogClose();
  };

  return (
    <Container sx={{ mt: 4, mb: 4, maxWidth: 1100 }}>
      <ToastContainer position="top-right" autoClose={3000} />
      <Paper sx={{ p: 4, mb: 4, borderRadius: 4, boxShadow: 6 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
          {isEdit ? 'Edit' : 'Add'} Teacher
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Academic Year</InputLabel>
              <Select
                label="Academic Year"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
              >
                {academicYears.map((year) => (
                  <MenuItem
                    key={year.id || year.academicYear}
                    value={year.academicYear}
                  >
                    {year.academicYear}
                    {year.status === 'active' ? ' (Active)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Standard</InputLabel>
              <Select
                label="Standard"
                name="standard"
                value={formData.standard}
                onChange={handleChange}
              >
                {standards.map(std => (
                  <MenuItem key={std} value={std}>{std}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Section</InputLabel>
              <Select
                label="Section"
                name="section"
                value={formData.section}
                onChange={handleChange}
              >
                {sections.map(sec => (
                  <MenuItem key={sec} value={sec}>{sec}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth label="Subject" name="subject" value={formData.subject} onChange={handleChange} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth label="Qualification" name="qualification" value={formData.qualification} onChange={handleChange} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth label="Mobile Number" name="contact" value={formData.contact} onChange={handleChange} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleEmailChange}
              helperText="Teacher must be signed up"
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth label="Subject Experience" name="subjectExperience" value={formData.subjectExperience} onChange={handleChange} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={2} label="Address" name="address" value={formData.address} onChange={handleChange} />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Teacher ID"
              name="teacherId"
              value={formData.teacherId}
              InputProps={{ readOnly: true }}
              helperText="Auto-filled from user signup"
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" color="primary" onClick={handleSubmit} disabled={loading}>
              {isEdit ? 'Update' : 'Add'} Teacher
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 4, mb: 4, borderRadius: 4, boxShadow: 6 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
          Search Teachers
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              label="Search by Teacher ID"
              value={searchTeacherID}
              onChange={e => setSearchTeacherID(e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Standard</InputLabel>
              <Select
                label="Standard"
                value={searchStandard}
                onChange={e => setSearchStandard(e.target.value)}
              >
                {standards.map(std => (
                  <MenuItem key={std} value={std}>{std}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Section</InputLabel>
              <Select
                label="Section"
                value={searchSection}
                onChange={e => setSearchSection(e.target.value)}
              >
                {sections.map(sec => (
                  <MenuItem key={sec} value={sec}>{sec}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button variant="contained" color="primary" onClick={handleSearch} fullWidth>
              Fetch Data
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button variant="outlined" color="secondary" onClick={handleResetSearch} fullWidth>
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {tableVisible && (
        <Paper sx={{ p: 4, borderRadius: 4, boxShadow: 4 }}>
          <Typography variant="h6" gutterBottom>Teacher Details</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Teacher ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Qualification</TableCell>
                <TableCell>Experience</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Standard</TableCell>
                <TableCell>Section</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">No teachers found.</TableCell>
                </TableRow>
              ) : (
                teachers.map((teacher) => (
                  <TableRow key={`${teacher.teacherId}-${teacher.standard}-${teacher.section}`}>
                    <TableCell>{teacher.teacherId}</TableCell>
                    <TableCell>{teacher.fullName}</TableCell>
                    <TableCell>{teacher.subject}</TableCell>
                    <TableCell>{teacher.qualification}</TableCell>
                    <TableCell>{teacher.subjectExperience}</TableCell>
                    <TableCell>{teacher.contact}</TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>{teacher.standard}</TableCell>
                    <TableCell>{teacher.section}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleDialogOpen('edit', teacher)}><Edit /></IconButton>
                      <IconButton onClick={() => handleDialogOpen('delete', teacher)}><Delete /></IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>
          {dialogType === 'edit' ? 'Edit Teacher' : 'Delete Teacher'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogType === 'edit'
              ? 'Do you want to edit this teacher?'
              : 'Are you sure you want to delete this teacher?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} variant='outlined' color="primary">No</Button>
          <Button
            onClick={dialogType === 'edit' ? handleEditConfirm : handleDeleteConfirm}
            color={dialogType === 'edit' ? 'primary' : 'error'}
            autoFocus
            variant='contained'
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Teacher_Admission;
