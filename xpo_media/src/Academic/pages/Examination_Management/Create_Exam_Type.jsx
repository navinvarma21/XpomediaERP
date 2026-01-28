import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  addExamType,
  getExamTypes,
  updateExamType,
  deleteExamType,
} from "../../api/examTypeApi"; // adjust path as needed

export default function Create_Exam_Type() {
  const [examTypes, setExamTypes] = useState([]);
  const [newType, setNewType] = useState("");
  const [error, setError] = useState("");
  const [editDialog, setEditDialog] = useState({
    open: false,
    id: null,
    label: "",
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    id: null,
    label: "",
  });

  useEffect(() => {
    fetchExamTypes();
    // eslint-disable-next-line
  }, []);

  const fetchExamTypes = async () => {
    try {
      const types = await getExamTypes();
      setExamTypes(types);
    } catch (err) {
      toast.error("Failed to fetch exam types.");
    }
  };

  // Add new type
  const handleAddType = async () => {
    const trimmed = newType.trim();
    if (!trimmed) {
      setError("Please enter a type to add.");
      return;
    }
    if (
      examTypes.some((t) => t.label.toLowerCase() === trimmed.toLowerCase())
    ) {
      setError("This type already exists.");
      return;
    }
    try {
      await addExamType(trimmed);
      setNewType("");
      setError("");
      fetchExamTypes();
      toast.success("Exam type added successfully!");
    } catch (err) {
      console.error("Add exam type error:", err);
      toast.error("Failed to add exam type.");
    }
  };

  // Delete type with confirmation
  const handleDelete = (id, label) => {
    setConfirmDialog({ open: true, id, label });
  };

  const confirmDelete = async () => {
    try {
      await deleteExamType(confirmDialog.id);
      fetchExamTypes();
      toast.success("Exam type deleted.");
    } catch (err) {
      console.error("Delete exam type error:", err);
      toast.error("Failed to delete exam type.");
    }
    setConfirmDialog({ open: false, id: null, label: "" });
  };

  // Open edit dialog
  const openEditDialog = (id, label) => {
    setEditDialog({ open: true, id, label });
  };

  // Handle edit
  const handleEditSave = async () => {
    const trimmed = editDialog.label.trim();
    if (!trimmed) {
      setError("Type cannot be empty.");
      return;
    }
    try {
      await updateExamType(editDialog.id, trimmed);
      setEditDialog({ open: false, id: null, label: "" });
      fetchExamTypes();
      toast.success("Exam type updated!");
    } catch (err) {
      console.error("Update exam type error:", err);
      toast.error("Failed to update exam type.");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, height: '90vh', overflowY: 'auto', margin: '0' }}>
      <Typography variant="h5" sx={{ marginTop: "30px", fontWeight: 700, color: "#1976d2" }} gutterBottom>
        Exam Types Management
      </Typography>
      <Card sx={{ maxWidth: 900, mx: "auto", boxShadow: 4, borderRadius: 3, bgcolor: "#fff" }}>
        <CardContent>
          <ToastContainer position="top-right" autoClose={2000} />
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <TextField
              label="Add New Exam Type"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              size="small"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddType();
                }
              }}
              error={!!error}
              helperText={error}
              sx={{
                borderRadius: 2,
                bgcolor: "#fafafa",
                boxShadow: 1,
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={handleAddType}
              sx={{
                minWidth: 160,
                height: 40,
                borderRadius: 2,
                fontWeight: 700,
                boxShadow: 2,
                bgcolor: "#1976d2",
                ":hover": { bgcolor: "#115293" },
              }}
            >
              Add Exam Type
            </Button>
          </Box>
          {/* Center the table horizontally */}
          <Box display="flex" justifyContent="center" width="100%">
            <TableContainer
              component={Paper}
              sx={{
                mt: 2,
                maxWidth: 700,
                width: "100%",
                margin: "0 auto",
                boxShadow: 2,
                borderRadius: 2,
                bgcolor: "#f5f5f5",
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "#f0f0f0" }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "#f0f0f0" }}>Exam Type</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "#f0f0f0" }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {examTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No exam types found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    examTypes.map((type, idx) => (
                      <TableRow key={type.id} hover sx={{ transition: "background 0.2s", "&:hover": { background: "#e3f2fd" } }}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{type.label}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton onClick={() => openEditDialog(type.id, type.label)}>
                              <EditIcon color="primary" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton onClick={() => handleDelete(type.id, type.label)}>
                              <DeleteIcon color="error" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          {/* Edit Dialog */}
          <Dialog
            open={editDialog.open}
            onClose={() => setEditDialog({ open: false, id: null, label: "" })}
            PaperProps={{ sx: { borderRadius: 3, minWidth: 350 } }}
          >
            <DialogTitle>Edit Exam Type</DialogTitle>
            <DialogContent>
              <TextField
                label="Exam Type"
                value={editDialog.label}
                onChange={(e) => setEditDialog({ ...editDialog, label: e.target.value })}
                fullWidth
                autoFocus
                margin="dense"
                sx={{ borderRadius: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialog({ open: false, id: null, label: "" })} sx={{ borderRadius: 2 }}>
                Cancel
              </Button>
              <Button onClick={handleEditSave} variant="contained" sx={{ borderRadius: 2 }}>
                Save
              </Button>
            </DialogActions>
          </Dialog>
          {/* Delete Confirmation Dialog */}
          <Dialog
            open={confirmDialog.open}
            onClose={() => setConfirmDialog({ open: false, id: null, label: "" })}
            PaperProps={{ sx: { borderRadius: 3, minWidth: 350 } }}
          >
            <DialogTitle>Delete Exam Type</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete "<b>{confirmDialog.label}</b>"? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmDialog({ open: false, id: null, label: "" })} sx={{ borderRadius: 2 }}>
                Cancel
              </Button>
              <Button onClick={confirmDelete} color="error" variant="contained" sx={{ borderRadius: 2 }}>
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </CardContent>
      </Card>
    </Container>
  );
}
