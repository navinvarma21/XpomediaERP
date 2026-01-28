import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Chip,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Tooltip,
  Fade,
  Alert,
} from "@mui/material";
import { Delete, Edit, Event, Announcement, Visibility } from "@mui/icons-material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Utility: sanitize title for document ID
const sanitizeTitle = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);
};

const defaultEventForm = {
  title: "",
  description: "",
  dateTime: dayjs(),
  location: "",
  category: "Academic",
  participants: [],
};

const defaultAnnouncementForm = {
  title: "",
  content: "",
  audience: "all",
  urgency: "normal",
  expiryDate: null,
};

const EventForm = React.memo(({ onSubmit, onReset, initialData, isEdit, onPreview }) => {
  const theme = useTheme();
  const [formState, setFormState] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormState(initialData);
    setErrors({});
  }, [initialData]);

  const validateForm = () => {
    const newErrors = {};
    if (!formState.title) newErrors.title = "Event title is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm() && !isSubmitting) {
      setIsSubmitting(true);
      onSubmit(formState).finally(() => setIsSubmitting(false));
    }
  };

  return (
    <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 3 }}>
      <CardHeader
        title={isEdit ? "Edit Event" : "Create New Event"}
        sx={{ bgcolor: theme.palette.primary.light, color: theme.palette.primary.contrastText }}
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Event Title"
              value={formState.title}
              onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
              fullWidth
              required
              error={!!errors.title}
              helperText={errors.title}
              disabled={false} // Allow editing even in edit mode
              InputProps={{
                sx: { borderRadius: 1 },
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formState.category}
                onChange={(e) => setFormState((prev) => ({ ...prev, category: e.target.value }))}
                label="Category"
                sx={{ borderRadius: 1 }}
              >
                {["Academic", "Cultural", "Sports", "Meeting"].map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label="Event Date & Time"
                value={formState.dateTime}
                onChange={(newValue) =>
                  setFormState((prev) => ({ ...prev, dateTime: newValue }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    sx={{ borderRadius: 1 }}
                  />
                )}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Location"
              value={formState.location}
              onChange={(e) => setFormState((prev) => ({ ...prev, location: e.target.value }))}
              fullWidth
              InputProps={{
                sx: { borderRadius: 1 },
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Event Description"
              multiline
              rows={4}
              value={formState.description}
              onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
              fullWidth
              InputProps={{
                sx: { borderRadius: 1 },
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={isSubmitting || !formState.title}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              >
                {isEdit ? "Update Event" : "Create Event"}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setFormState(defaultEventForm);
                  if (onReset) onReset();
                }}
                disabled={isSubmitting}
              >
                Reset
              </Button>
              <Button
                variant="outlined"
                color="info"
                onClick={() => onPreview(formState)}
                disabled={isSubmitting || !formState.title}
              >
                Preview
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
});

const AnnouncementForm = React.memo(({ onSubmit, onReset, initialData, isEdit, onPreview }) => {
  const theme = useTheme();
  const [formState, setFormState] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormState(initialData);
    setErrors({});
  }, [initialData]);

  const validateForm = () => {
    const newErrors = {};
    if (!formState.title) newErrors.title = "Title is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm() && !isSubmitting) {
      setIsSubmitting(true);
      onSubmit(formState).finally(() => setIsSubmitting(false));
    }
  };

  return (
    <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 3 }}>
      <CardHeader
        title={isEdit ? "Edit Announcement" : "Create Announcement"}
        sx={{ bgcolor: theme.palette.secondary.light, color: theme.palette.secondary.contrastText }}
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <TextField
              label="Title"
              value={formState.title}
              onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
              fullWidth
              required
              error={!!errors.title}
              helperText={errors.title}
              disabled={false} // Allow editing even in edit mode
              InputProps={{
                sx: { borderRadius: 1 },
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Audience</InputLabel>
              <Select
                value={formState.audience}
                onChange={(e) => setFormState((prev) => ({ ...prev, audience: e.target.value }))}
                label="Audience"
                sx={{ borderRadius: 1 }}
              >
                {["all", "students", "teachers", "parents"].map((aud) => (
                  <MenuItem key={aud} value={aud}>
                    {aud.charAt(0).toUpperCase() + aud.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Content"
              multiline
              rows={4}
              value={formState.content}
              onChange={(e) => setFormState((prev) => ({ ...prev, content: e.target.value }))}
              fullWidth
              InputProps={{
                sx: { borderRadius: 1 },
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label="Expiry Date (optional)"
                value={formState.expiryDate}
                onChange={(newValue) =>
                  setFormState((prev) => ({ ...prev, expiryDate: newValue }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    sx={{ borderRadius: 1 }}
                  />
                )}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleSubmit}
                disabled={isSubmitting || !formState.title}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              >
                {isEdit ? "Update Announcement" : "Publish Announcement"}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  setFormState(defaultAnnouncementForm);
                  if (onReset) onReset();
                }}
                disabled={isSubmitting}
              >
                Reset
              </Button>
              <Button
                variant="outlined"
                color="info"
                onClick={() => onPreview(formState)}
                disabled={isSubmitting || !formState.title}
              >
                Preview
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
});

export default function EventAnnouncementManager() {
  const theme = useTheme();
  const [tabIndex, setTabIndex] = useState(0);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState(""); // "event" or "announcement"
  const [selectedItem, setSelectedItem] = useState(null);
  const [editData, setEditData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);

  // Firestore listeners
  useEffect(() => {
    const eventsUnsub = onSnapshot(collection(db, "events"), (snapshot) => {
      const updatedEvents = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log("Fetched events:", updatedEvents); // Debug log
      setEvents(updatedEvents);
    }, (error) => {
      console.error("Error fetching events:", error);
    });

    const announcementsUnsub = onSnapshot(collection(db, "announcements"), (snapshot) => {
      const updatedAnnouncements = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log("Fetched announcements:", updatedAnnouncements); // Debug log
      setAnnouncements(updatedAnnouncements);
    }, (error) => {
      console.error("Error fetching announcements:", error);
    });

    return () => {
      eventsUnsub();
      announcementsUnsub();
    };
  }, []);

  // Delete Handler
  const handleDeleteConfirm = async () => {
    try {
      if (confirmType === "event") {
        await deleteDoc(doc(db, "events", selectedItem.id));
        toast.success("Event deleted successfully!");
      } else {
        await deleteDoc(doc(db, "announcements", selectedItem.id));
        toast.success("Announcement deleted successfully!");
      }
      setConfirmOpen(false);
      setSelectedItem(null);
      setEditData(null);
      setIsEditing(false);
    } catch (error) {
      toast.error(`Error deleting: ${error.message}`);
    }
  };

  // Edit Handler
  const handleEdit = (item, type) => {
    if (type === "event") {
      setEditData({
        ...item,
        dateTime: dayjs(item.dateTime),
      });
      setIsEditing(true);
      setTabIndex(0);
    } else {
      setEditData({
        ...item,
        expiryDate: item.expiryDate ? dayjs(item.expiryDate) : null,
      });
      setIsEditing(true);
      setTabIndex(1);
    }
  };

  // Event Submission Handler
  const handleEventSubmit = useCallback(
    async (formData) => {
      try {
        const docId = sanitizeTitle(formData.title);
        const ref = doc(db, "events", isEditing ? editData.id : docId);

        if (!isEditing) {
          const snapshot = await getDoc(ref);
          if (snapshot.exists()) {
            toast.error("Event with this title already exists!");
            return;
          }
        }

        const data = {
          ...formData,
          dateTime: formData.dateTime.toISOString(),
          createdAt: isEditing && editData.createdAt ? editData.createdAt : new Date().toISOString(),
        };

        await setDoc(ref, data, { merge: true });
        toast.success(
          isEditing
            ? "Event updated!"
            : `Event created! View it [here](#/events/${docId})`
        );
        setIsEditing(false);
        setEditData(null);
        setSubmitConfirmOpen(false); // Close confirmation dialog after success
      } catch (error) {
        toast.error(`Error creating/updating event: ${error.message}`);
        console.error("Event submission error:", error);
      }
    },
    [isEditing, editData]
  );

  // Announcement Submission Handler
  const handleAnnouncementSubmit = useCallback(
    async (formData) => {
      try {
        const docId = sanitizeTitle(formData.title);
        const ref = doc(db, "announcements", isEditing ? editData.id : docId);

        if (!isEditing) {
          const snapshot = await getDoc(ref);
          if (snapshot.exists()) {
            toast.error("Announcement with this title already exists!");
            return;
          }
        }

        const data = {
          ...formData,
          createdAt: isEditing && editData.createdAt ? editData.createdAt : new Date().toISOString(),
          ...(formData.expiryDate && { expiryDate: formData.expiryDate.toISOString() }),
        };

        await setDoc(ref, data, { merge: true });
        toast.success(
          isEditing
            ? "Announcement updated!"
            : `Announcement published! View it [here](#/announcements/${docId})`
        );
        setIsEditing(false);
        setEditData(null);
        setSubmitConfirmOpen(false); // Close confirmation dialog after success
      } catch (error) {
        toast.error(`Error creating/updating announcement: ${error.message}`);
        console.error("Announcement submission error:", error);
      }
    },
    [isEditing, editData]
  );

  // Reset Handler
  const handleReset = () => {
    setEditData(null);
    setIsEditing(false);
    setPreviewData(null);
    setPreviewOpen(false);
  };

  // Preview Handler
  const handlePreview = (data) => {
    setPreviewData(data);
    setPreviewOpen(true);
  };

  // Submit Confirmation Handler
  const handleSubmitConfirm = async () => {
    setSubmitConfirmOpen(false);
    if (tabIndex === 0) {
      await handleEventSubmit(previewData);
    } else {
      await handleAnnouncementSubmit(previewData);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <ToastContainer position="top-right" autoClose={3000} />
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm {confirmType === "event" ? "Event" : "Announcement"} Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{selectedItem?.title || "this item"}"? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={submitConfirmOpen} onClose={() => setSubmitConfirmOpen(false)}>
        <DialogTitle>Confirm Submission</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to {isEditing ? "update" : "create"} this{" "}
            {tabIndex === 0 ? "event" : "announcement"}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitConfirm} color="primary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)}>
        <DialogTitle>Preview</DialogTitle>
        <DialogContent>
          {tabIndex === 0 ? (
            <>
              <Typography variant="h6">{previewData?.title || "Untitled Event"}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {previewData?.dateTime
                  ? dayjs(previewData.dateTime).format("MMMM D, YYYY h:mm A")
                  : "No date"}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {previewData?.description || "No description"}
              </Typography>
              <Chip
                label={previewData?.category || "N/A"}
                color="primary"
                size="small"
                sx={{ mt: 1 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Location: {previewData?.location || "N/A"}
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h6">{previewData?.title || "Untitled Announcement"}</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {previewData?.content || "No content"}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip
                  label={previewData?.audience || "N/A"}
                  color="primary"
                  size="small"
                />
                {previewData?.expiryDate && (
                  <Chip
                    label={`Expires: ${dayjs(previewData.expiryDate).format("MMM D")}`}
                    color="secondary"
                    size="small"
                  />
                )}
              </Stack>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: theme.palette.primary.dark }}>
        Event & Announcement Management
      </Typography>

      <Tabs
        value={tabIndex}
        onChange={(e, newVal) => {
          setTabIndex(newVal);
          handleReset();
        }}
        sx={{ mb: 3 }}
        TransitionComponent={Fade}
        indicatorColor="primary"
      >
        <Tab label="Events" icon={<Event />} iconPosition="start" />
        <Tab label="Announcements" icon={<Announcement />} iconPosition="start" />
      </Tabs>

      <Box mt={3}>
        {tabIndex === 0 && (
          <Stack spacing={3}>
            <EventForm
              onSubmit={handleEventSubmit}
              onReset={handleReset}
              initialData={editData || defaultEventForm}
              isEdit={isEditing}
              onPreview={handlePreview}
            />
            <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
              <CardHeader
                title="Upcoming Events"
                sx={{ bgcolor: theme.palette.primary.light, color: theme.palette.primary.contrastText }}
              />
              <CardContent>
                {events.length === 0 ? (
                  <Alert severity="info">No events found.</Alert>
                ) : (
                  events.map((event) => (
                    <Paper
                      key={event.id}
                      sx={{
                        p: 2,
                        mb: 2,
                        borderRadius: 2,
                        bgcolor: "white",
                        transition: "transform 0.2s",
                        "&:hover": { transform: "scale(1.01)", boxShadow: 4 },
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {event.title || "Untitled"}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                          >
                            {event.dateTime
                              ? dayjs(event.dateTime).format("MMMM D, YYYY h:mm A")
                              : "No date"}
                          </Typography>
                          <Chip
                            label={event.category || "N/A"}
                            color="primary"
                            size="small"
                            sx={{ mt: 1 }}
                          />
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Location: {event.location || "N/A"}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Edit Event">
                            <IconButton
                              onClick={() => handleEdit(event, "event")}
                              color="primary"
                              aria-label="edit"
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Event">
                            <IconButton
                              onClick={() => {
                                setSelectedItem(event);
                                setConfirmType("event");
                                setConfirmOpen(true);
                              }}
                              color="error"
                              aria-label="delete"
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    </Paper>
                  ))
                )}
                {events.length > 3 && (
                  <Box sx={{ mt: 2, textAlign: "center" }}>
                    <Button variant="outlined" color="primary">
                      View All
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Stack>
        )}

        {tabIndex === 1 && (
          <Stack spacing={3}>
            <AnnouncementForm
              onSubmit={handleAnnouncementSubmit}
              onReset={handleReset}
              initialData={editData || defaultAnnouncementForm}
              isEdit={isEditing}
              onPreview={handlePreview}
            />
            <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
              <CardHeader
                title="Upcoming Announcements"
                sx={{ bgcolor: theme.palette.secondary.light, color: theme.palette.secondary.contrastText }}
              />
              <CardContent>
                {announcements.length === 0 ? (
                  <Alert severity="info">No announcements found.</Alert>
                ) : (
                  announcements.map((announcement) => (
                    <Paper
                      key={announcement.id}
                      sx={{
                        p: 2,
                        mb: 2,
                        borderRadius: 2,
                        bgcolor: "white",
                        transition: "transform 0.2s",
                        "&:hover": { transform: "scale(1.01)", boxShadow: 4 },
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {announcement.title || "Untitled"}
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 1 }}>
                            {announcement.content || "No content"}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip
                              label={announcement.audience || "N/A"}
                              color="primary"
                              size="small"
                            />
                            {announcement.expiryDate && (
                              <Chip
                                label={`Expires: ${dayjs(announcement.expiryDate).format("MMM D")}`}
                                color="secondary"
                                size="small"
                              />
                            )}
                          </Stack>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Edit Announcement">
                            <IconButton
                              onClick={() => handleEdit(announcement, "announcement")}
                              color="primary"
                              aria-label="edit"
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Announcement">
                            <IconButton
                              onClick={() => {
                                setSelectedItem(announcement);
                                setConfirmType("announcement");
                                setConfirmOpen(true);
                              }}
                              color="error"
                              aria-label="delete"
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    </Paper>
                  ))
                )}
                {announcements.length > 3 && (
                  <Box sx={{ mt: 2, textAlign: "center" }}>
                    <Button variant="outlined" color="primary">
                      View All
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Stack>
        )}
      </Box>
    </Container>
  );
}