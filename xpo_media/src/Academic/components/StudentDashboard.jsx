import React, { useEffect, useState, useCallback } from "react";
import {
  Container,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Grid,
  Avatar,
  Divider,
  TextField,
  Button,
  Pagination,
  Toolbar,
  IconButton,
  Skeleton,
  Card,
  CardContent,
  Fade,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Book,
  Schedule,
  School,
  Person,
  Refresh,
  Search,
  ChevronRight,
} from "@mui/icons-material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RoomIcon from "@mui/icons-material/Room";
import DateRangeIcon from "@mui/icons-material/DateRange";
import InfoIcon from "@mui/icons-material/Info";
import EventNoteIcon from "@mui/icons-material/EventNote";
import TaskIcon from "@mui/icons-material/Task";
import DescriptionIcon from "@mui/icons-material/Description";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useUserContext } from "../../Context/UserContext";

// --- Utility Functions ---
const normalizeAcademicYear = (year) => (year || "").replace(/\s+/g, "");
const normalizeTerm = (term) => (term || "").trim().replace(/\s+/g, "_");
const getTimetableDocId = (academicYear, term, standard, section) =>
  `${normalizeAcademicYear(academicYear)}-${normalizeTerm(term)}-${standard || ""}-${section || ""}`;

const ITEMS_PER_PAGE = 5;

// Helper component for detail cards
const DetailCard = ({ icon, title, value, color = 'primary' }) => {
  const theme = useTheme();
  return (
    <Fade in={true} timeout={600}>
      <Card
        sx={{
          p: 2,
          borderRadius: 3,
          bgcolor: theme.palette[color].light,
          color: theme.palette.getContrastText(theme.palette[color].light),
          transition: "transform 0.3s, box-shadow 0.3s",
          boxShadow: 3,
          "&:hover": {
            transform: "translateY(-6px)",
            boxShadow: 8,
          },
        }}
      >
        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: theme.palette[color].main, width: 50, height: 50 }}>
              {icon}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: theme.palette.getContrastText(theme.palette[color].main) }}>
                {value || "-"}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
};

// --- Main Component ---
export default function StudentDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const { student, getAuthHeaders, isStudent } = useUserContext();
  const [studentData, setStudentData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examSchedules, setExamSchedules] = useState([]);
  const [examLoading, setExamLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [assignmentLoading, setAssignmentLoading] = useState(true);
  const [term] = useState("Term One");
  const [searchQuery, setSearchQuery] = useState("");
  const [examPage, setExamPage] = useState(1);
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementLoading, setAnnouncementLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // API Call Function
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(endpoint, {
        headers: getAuthHeaders(),
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API call failed:", error);
      throw error;
    }
  };

  // Main Data Fetch
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isStudent || !student) {
      setError("Not authenticated as student. Please log in.");
      setLoading(false);
      return;
    }

    try {
      setStudentData(student);
      const { academicYear, standard, section } = student;

      // Fetch subjects
      try {
        const normalizedYear = normalizeAcademicYear(academicYear);
        const normalizedTerm = normalizeTerm("Term One");
        const subjectDocId = `${normalizedYear}-${normalizedTerm}-${standard || ""}`;
        const subjectsData = await apiCall(`/api/subjectConfigurations/${subjectDocId}`);
        setSubjects(subjectsData?.subjects || []);
      } catch (err) {
        console.warn("Failed to fetch subjects:", err);
        setSubjects([]);
      }

      // Fetch timetable
      try {
        const timetableDocId = getTimetableDocId(academicYear, "Term One", standard, section);
        const timetableData = await apiCall(`/api/timetables/${timetableDocId}`);
        setTimetable(timetableData || null);
      } catch (err) {
        console.warn("Failed to fetch timetable:", err);
        setTimetable(null);
      }

      setError("");
    } catch (err) {
      setError(`Failed to fetch data: ${err.message}`);
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [student, isStudent, getAuthHeaders]);

  // Combined Data Fetch for Dependencies
  const fetchDependentData = useCallback(async () => {
    if (!student) return;
    const { academicYear, standard, section, studentID } = student;
    const normalizedYear = normalizeAcademicYear(academicYear);
    const normalizedTerm = normalizeTerm(term);

    // Exam Schedules
    setExamLoading(true);
    try {
      const examsData = await apiCall(`/api/exams?academicYear=${academicYear}&standard=${standard}`);
      const filteredExams = examsData.filter(
        (exam) =>
          exam.id?.includes(normalizedTerm) &&
          (exam.schedules || []).some(
            (sch) => !sch?.examCategory?.toLowerCase().includes("internal")
          )
      );
      setExamSchedules(filteredExams);
    } catch (err) {
      console.error("Exam Fetch Error:", err);
    } finally {
      setExamLoading(false);
    }

    // Assignments
    setAssignmentLoading(true);
    try {
      const assignmentsData = await apiCall(
        `/api/assignments?academicYear=${normalizedYear}&term=${normalizedTerm}&standard=${standard}&section=${section}&studentId=${studentID}`
      );
      setAssignments(assignmentsData || []);
    } catch (err) {
      console.error("Assignment Fetch Error:", err);
    } finally {
      setAssignmentLoading(false);
    }

    // Announcements
    setAnnouncementLoading(true);
    try {
      const announcementsData = await apiCall("/api/announcements");
      setAnnouncements(announcementsData || []);
    } catch (err) {
      console.error("Announcements Fetch Error:", err);
    } finally {
      setAnnouncementLoading(false);
    }

    // Events
    setEventsLoading(true);
    try {
      const eventsData = await apiCall("/api/events");
      setEvents(eventsData || []);
    } catch (err) {
      console.error("Events Fetch Error:", err);
    } finally {
      setEventsLoading(false);
    }
  }, [student, term, apiCall]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (studentData) {
      fetchDependentData();
    }
  }, [studentData, fetchDependentData]);

  // Filtering and Pagination
  const filteredAssignments = (assignments || []).filter(
    (assignment) =>
      (assignment.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (assignment.subject || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedExams = (examSchedules || []).slice(
    (examPage - 1) * ITEMS_PER_PAGE,
    examPage * ITEMS_PER_PAGE
  );

  const paginatedAssignments = (filteredAssignments || []).slice(
    (assignmentPage - 1) * ITEMS_PER_PAGE,
    assignmentPage * ITEMS_PER_PAGE
  );

  // Presentation Helpers
  const formatDate = (dateStr) => (dateStr ? new Date(dateStr).toLocaleDateString("en-IN") : "-");
  const formatTime = (timeStr) => (timeStr || "-");
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Timetable Renderer
  const renderTimetable = () => {
    if (!timetable)
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          Timetable not available
        </Alert>
      );
    const periods = timetable.periods || [];
    const allocation = timetable.allocation || {};

    const scrollableWidth = isMobile || isTablet ? '100vw' : '100%';

    return (
      <TableContainer
        component={Paper}
        sx={{
          mt: 3,
          borderRadius: 3,
          boxShadow: 6,
          maxHeight: 600,
          overflowX: 'auto',
          maxWidth: scrollableWidth,
        }}
      >
        <Table stickyHeader size={isMobile ? "small" : "medium"} sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "primary.main" }}>
              <TableCell sx={{ color: "white", fontWeight: 700, bgcolor: "primary.dark", borderTopLeftRadius: 1 }}>Day/Period</TableCell>
              {periods.map((period, idx) => (
                <TableCell
                  key={idx}
                  align="center"
                  sx={{ color: "white", fontWeight: 700, bgcolor: "primary.dark" }}
                >
                  <Typography variant="body2">{period?.name || "N/A"}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {formatTime(period.startTime)} - {formatTime(period.endTime)}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
              <TableRow key={day} hover sx={{ '&:hover': { bgcolor: theme.palette.primary.light + '20' } }}>
                <TableCell sx={{ fontWeight: 600, color: theme.palette.primary.main, minWidth: 100 }}>{day}</TableCell>
                {periods.map((period) => {
                  const allocationKey = `${day}-${period?.name || ""}`;
                  const allocationData = allocation[allocationKey];
                  let subject = "";
                  let teacher = "";
                  if (allocationData) {
                    try {
                      const parsed = JSON.parse(allocationData);
                      subject = parsed.subject || "";
                      teacher = parsed.teacher || "";
                    } catch (e) {
                      subject = allocationData || "";
                      teacher = "";
                    }
                  }
                  return (
                    <TableCell key={allocationKey} align="center">
                      {subject ? (
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 1,
                            bgcolor: theme.palette.info.light + '20',
                          }}
                        >
                          <Chip
                            label={subject}
                            color="info"
                            size="small"
                            sx={{ borderRadius: 1, mb: teacher ? 0.5 : 0, fontWeight: 600 }}
                          />
                          {teacher && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              <Person sx={{ fontSize: 10, verticalAlign: 'middle', mr: 0.5 }} />
                              {teacher}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography color="textSecondary" variant="body2">-</Typography>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Loading/Error States
  if (loading)
    return (
      <Container
        sx={{
          py: 4,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          bgcolor: "white",
        }}
      >
        <CircularProgress color="primary" />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Student Dashboard...
        </Typography>
      </Container>
    );
  if (error)
    return (
      <Container sx={{ py: 4, bgcolor: "white" }}>
        <Alert severity="error" sx={{ mx: "auto", maxWidth: "md" }}>
          {error}
        </Alert>
      </Container>
    );

  // Main Render
  return (
    <Fade in={true} timeout={700}>
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: "white" }}>
        {/* Header & Summary Cards */}
        <Card sx={{ p: isMobile ? 2 : 4, mb: 4, borderRadius: 3, boxShadow: 6, bgcolor: theme.palette.primary.light + '20' }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems={isMobile ? "flex-start" : "center"}
            mb={isMobile ? 2 : 4}
            flexDirection={isMobile ? "column" : "row"}
          >
            <Box display="flex" alignItems="center" gap={3}>
              <Avatar
                sx={{
                  width: isMobile ? 60 : 80,
                  height: isMobile ? 60 : 80,
                  bgcolor: "primary.main",
                  boxShadow: 3,
                  transition: 'transform 0.3s',
                  '&:hover': { transform: 'rotate(10deg)' }
                }}
              >
                <Person fontSize={isMobile ? "medium" : "large"} />
              </Avatar>
              <Box>
                <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 800, color: theme.palette.primary.dark }}>
                  Welcome Back, {studentData?.fullName || "Student"}!
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  <Chip label={studentData?.studentID || "N/A"} size="small" sx={{ mr: 1 }} />| {today}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={fetchData}
              color="primary"
              sx={{
                bgcolor: "primary.main",
                color: 'white',
                mt: isMobile ? 2 : 0,
                transition: 'transform 0.3s',
                '&:hover': { bgcolor: 'primary.dark', transform: 'rotate(90deg)' }
              }}
              size="large"
            >
              <Refresh />
            </IconButton>
          </Box>

          <Grid container spacing={isMobile ? 2 : 3} sx={{ width: "100%" }}>
            {[
              { icon: <School />, title: "Standard", value: studentData?.standard, color: "success" },
              { icon: <Book />, title: "Section", value: studentData?.section, color: "info" },
              { icon: <Schedule />, title: "Academic Year", value: studentData?.academicYear, color: "warning" },
              { icon: <Person />, title: "Attendance", value: "92%", color: "secondary" },
            ].map((item, index) => (
              <Grid item key={index} xs={12} sm={6} md={3}>
                <DetailCard {...item} />
              </Grid>
            ))}
          </Grid>
        </Card>

        {/* Subjects */}
        <Fade in={true} timeout={800}>
          <Card sx={{ p: isMobile ? 2 : 4, mb: 4, borderRadius: 3, boxShadow: 6 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: theme.palette.primary.dark }}>
              📚 Enrolled Subjects
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2}>
              {(subjects || []).map((subject, index) => (
                <Chip
                  key={index}
                  label={subject || "N/A"}
                  color="primary"
                  variant="outlined"
                  icon={<Book />}
                  sx={{
                    borderRadius: 2,
                    px: 1,
                    py: 1,
                    fontSize: isMobile ? 12 : 14,
                    fontWeight: 600,
                    transition: 'transform 0.2s, background-color 0.2s',
                    '&:hover': { transform: 'scale(1.05)', bgcolor: theme.palette.primary.light },
                  }}
                />
              ))}
            </Box>
          </Card>
        </Fade>

        {/* Weekly Schedule */}
        <Fade in={true} timeout={900}>
          <Card sx={{ p: isMobile ? 2 : 4, borderRadius: 3, boxShadow: 6, mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: theme.palette.primary.dark }}>
              🗓️ Weekly Schedule
            </Typography>
            {renderTimetable()}
          </Card>
        </Fade>

        {/* Assignments & Exams Side by Side */}
        <Grid container spacing={4} sx={{ mt: 4 }}>
          {/* Assignments */}
          <Grid item xs={12} md={6}>
            <Fade in={true} timeout={1000}>
              <Card sx={{ p: isMobile ? 2 : 4, borderRadius: 3, boxShadow: 6, minHeight: 400 }}>
                <Toolbar sx={{ mb: 2, justifyContent: 'space-between', p: 0, minHeight: 40 }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <TaskIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.dark }}>
                      My Assignments
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    endIcon={<ChevronRight />}
                    sx={{ borderRadius: 2 }}
                    onClick={() => alert("Assignments View Clicked!")}
                  >
                    View All
                  </Button>
                </Toolbar>
                <Divider sx={{ mb: 3 }} />
                {assignmentLoading ? (
                  <Box sx={{ py: 2 }}>
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} variant="rectangular" height={80} sx={{ mb: 2, borderRadius: 2 }} />
                    ))}
                  </Box>
                ) : (paginatedAssignments || []).length === 0 ? (
                  <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                    No pending assignments found.
                  </Alert>
                ) : (
                  <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
                    {(paginatedAssignments || []).map((assignment, idx) => (
                      <Card
                        key={idx}
                        variant="outlined"
                        sx={{
                          mb: 2,
                          p: 2,
                          borderRadius: 2,
                          transition: 'transform 0.2s',
                          '&:hover': { transform: 'translateX(5px)', bgcolor: theme.palette.grey[50] }
                        }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.primary.dark }}>
                          {assignment.title || "Untitled"}
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                          <Box display="flex" gap={1} flexWrap="wrap">
                            <Chip label={assignment.subject || "N/A"} color="info" size="small" icon={<Book sx={{ fontSize: 16 }} />} />
                            <Chip label={`Due: ${formatDate(assignment.dueDate)}`} color="error" size="small" icon={<AccessTimeIcon sx={{ fontSize: 16 }} />} />
                          </Box>
                          <Button size="small" variant="text" color="primary" sx={{ fontWeight: 600 }}>
                            Details
                          </Button>
                        </Box>
                      </Card>
                    ))}
                    <Pagination
                      count={Math.ceil((filteredAssignments || []).length / ITEMS_PER_PAGE)}
                      page={assignmentPage}
                      onChange={(e, value) => setAssignmentPage(value)}
                      sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}
                      color="primary"
                      size={isMobile ? "small" : "medium"}
                    />
                  </Box>
                )}
              </Card>
            </Fade>
          </Grid>
          
          {/* Exams */}
          <Grid item xs={12} md={6}>
            <Fade in={true} timeout={1100}>
              <Card sx={{ p: isMobile ? 2 : 4, borderRadius: 3, boxShadow: 6, minHeight: 400 }}>
                <Toolbar sx={{ mb: 2, justifyContent: 'space-between', p: 0, minHeight: 40 }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <AssignmentIcon color="success" sx={{ fontSize: 32 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.success.dark }}>
                      Exam Schedules
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    endIcon={<ChevronRight />}
                    sx={{ borderRadius: 2 }}
                    onClick={() => alert("Exams View Clicked!")}
                  >
                    View All
                  </Button>
                </Toolbar>
                <Divider sx={{ mb: 3 }} />
                {examLoading ? (
                  <Box sx={{ py: 2 }}>
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} variant="rectangular" height={80} sx={{ mb: 2, borderRadius: 2 }} />
                    ))}
                  </Box>
                ) : paginatedExams.length === 0 ? (
                  <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                    No upcoming exams scheduled.
                  </Alert>
                ) : (
                  <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
                    {(paginatedExams || []).map((exam, idx) => (
                      <Box key={idx} sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.success.dark, mb: 1 }}>
                          {exam.examType?.replace(/_/g, " ") || "N/A"}
                          <Chip label={exam.term?.replace(/_/g, " ") || "N/A"} color="success" size="small" variant="outlined" sx={{ ml: 1 }} />
                        </Typography>
                        {(exam.schedules || [])
                          .filter(sch => !sch?.examCategory?.toLowerCase().includes("internal"))
                          .slice(0, 2)
                          .map((sch, sidx) => (
                            <Card
                              key={sidx}
                              variant="outlined"
                              sx={{
                                mb: 1,
                                p: 1.5,
                                bgcolor: theme.palette.success.light + '10',
                                borderRadius: 2,
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateX(5px)' }
                              }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {sch?.subject || "N/A"}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={2} mt={0.5}>
                                <Chip label={formatDate(sch?.examDate)} size="small" icon={<DateRangeIcon fontSize="small" />} color="primary" />
                                <Chip label={formatTime(sch?.startTime)} size="small" icon={<AccessTimeIcon fontSize="small" />} color="secondary" />
                              </Box>
                            </Card>
                          ))}
                        {(exam.schedules || []).length > 2 && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            + { (exam.schedules.length - 2) } more subjects
                          </Typography>
                        )}
                      </Box>
                    ))}
                    <Pagination
                      count={Math.ceil((examSchedules || []).length / ITEMS_PER_PAGE)}
                      page={examPage}
                      onChange={(e, value) => setExamPage(value)}
                      sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}
                      color="success"
                      size={isMobile ? "small" : "medium"}
                    />
                  </Box>
                )}
              </Card>
            </Fade>
          </Grid>
        </Grid>

        {/* Announcements & Events Side by Side */}
        <Grid container spacing={4} sx={{ mt: 4 }}>
          {/* Announcements */}
          <Grid item xs={12} md={6}>
            <Fade in={true} timeout={1200}>
              <Card sx={{ p: isMobile ? 2 : 4, borderRadius: 3, boxShadow: 6, minHeight: 400 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: theme.palette.warning.dark }}>
                  📢 Announcements
                </Typography>
                <Divider sx={{ mb: 3 }} />
                {announcementLoading ? (
                  <Box sx={{ py: 2 }}>
                    <Skeleton variant="rectangular" height={100} sx={{ mb: 2, borderRadius: 2 }} />
                    <Skeleton variant="rectangular" height={100} sx={{ mb: 2, borderRadius: 2 }} />
                  </Box>
                ) : announcements.length === 0 ? (
                  <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                    No new announcements.
                  </Alert>
                ) : (
                  <Box sx={{ maxHeight: 350, overflowY: 'auto', p: 1, pr: 2 }}>
                    {announcements.map((announcement, idx) => (
                      <Card
                        key={idx}
                        sx={{
                          mb: 2,
                          p: 2,
                          borderLeft: `4px solid ${theme.palette.warning.main}`,
                          borderRadius: 2,
                          transition: 'transform 0.2s',
                          '&:hover': { transform: 'translateX(5px)', bgcolor: theme.palette.warning.light + '10' }
                        }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.warning.dark }}>
                          {announcement.title || "Untitled"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {announcement.description || "No description"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          <DateRangeIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                          {formatDate(announcement.date) || "N/A"}
                        </Typography>
                      </Card>
                    ))}
                  </Box>
                )}
              </Card>
            </Fade>
          </Grid>
          
          {/* Events */}
          <Grid item xs={12} md={6}>
            <Fade in={true} timeout={1300}>
              <Card sx={{ p: isMobile ? 2 : 4, borderRadius: 3, boxShadow: 6, minHeight: 400 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: theme.palette.info.dark }}>
                  🎉 Events
                </Typography>
                <Divider sx={{ mb: 3 }} />
                {eventsLoading ? (
                  <Box sx={{ py: 2 }}>
                    <Skeleton variant="rectangular" height={100} sx={{ mb: 2, borderRadius: 2 }} />
                    <Skeleton variant="rectangular" height={100} sx={{ mb: 2, borderRadius: 2 }} />
                  </Box>
                ) : events.length === 0 ? (
                  <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                    No upcoming school events.
                  </Alert>
                ) : (
                  <Box sx={{ maxHeight: 350, overflowY: 'auto', p: 1, pr: 2 }}>
                    {events.map((event, idx) => (
                      <Card
                        key={idx}
                        sx={{
                          mb: 2,
                          p: 2,
                          borderLeft: `4px solid ${theme.palette.info.main}`,
                          borderRadius: 2,
                          transition: 'transform 0.2s',
                          '&:hover': { transform: 'translateX(5px)', bgcolor: theme.palette.info.light + '10' }
                        }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.info.dark }}>
                          {event.title || "Untitled"}
                        </Typography>
                        <Box display="flex" alignItems="center" mt={1} gap={2}>
                          <Chip label={event.location || "N/A"} size="small" icon={<RoomIcon fontSize="small" />} color="primary" />
                          <Chip label={formatDate(event.date) || "N/A"} size="small" icon={<DateRangeIcon fontSize="small" />} color="secondary" />
                        </Box>
                      </Card>
                    ))}
                  </Box>
                )}
              </Card>
            </Fade>
          </Grid>
        </Grid>

        {/* Detailed Assignments Table */}
        <Fade in={true} timeout={1400}>
          <Card sx={{ p: isMobile ? 2 : 4, mt: 4, borderRadius: 3, boxShadow: 6 }}>
            <Toolbar sx={{ mb: 3, justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row' }}>
              <Box display="flex" alignItems="center" gap={2} mb={isMobile ? 2 : 0}>
                <TaskIcon color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.dark }}>
                  Full Assignment Tracker
                </Typography>
                <Chip label={studentData?.standard || "N/A"} color="success" size="large" />
              </Box>
              <TextField
                size="small"
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search color="action" sx={{ mr: 1 }} />,
                }}
                sx={{ width: isMobile ? '100%' : 250 }}
              />
            </Toolbar>
            <Divider sx={{ mb: 3 }} />
            {assignmentLoading ? (
              <Box sx={{ py: 4 }}>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} variant="rectangular" height={100} sx={{ mb: 2, borderRadius: 2 }} />
                ))}
              </Box>
            ) : (filteredAssignments || []).length === 0 ? (
              <Alert severity="info">
                No assignments match your search criteria or are available for your class.
              </Alert>
            ) : (
              <>
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3, overflowX: 'auto' }}>
                  <Table stickyHeader size={isMobile ? "small" : "medium"} sx={{ minWidth: 900 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'primary.main' }}>
                        <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: 16, minWidth: 160 }}>Title</TableCell>
                        <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Subject</TableCell>
                        <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Type</TableCell>
                        <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: 16 }} align="center">Marks</TableCell>
                        <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Due Date</TableCell>
                        {!isMobile && (
                          <>
                            <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Submission</TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Late</TableCell>
                          </>
                        )}
                        <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(paginatedAssignments || []).map((assignment, idx) => (
                        <TableRow key={idx} hover sx={{ '&:nth-of-type(even)': { bgcolor: 'grey.50' } }}>
                          <TableCell sx={{ fontWeight: 600, color: theme.palette.primary.dark, fontSize: 15 }}>
                            {assignment.title || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Chip label={assignment.subject || "N/A"} color="primary" size="small" />
                          </TableCell>
                          <TableCell>
                            <Chip label={assignment.assignmentType || "N/A"} color="success" size="small" />
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>
                            {assignment.maxMarks || "-"}
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <DateRangeIcon color="error" fontSize="small" />
                              <Typography variant="body2" color="error.main">{formatDate(assignment.dueDate)}</Typography>
                            </Box>
                          </TableCell>
                          {!isMobile && (
                            <>
                              <TableCell>
                                <Typography variant="body2">{assignment.submissionType || "N/A"}</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={assignment.lateSubmissionAllowed ? "Allowed" : "No"}
                                  color={assignment.lateSubmissionAllowed ? "warning" : "default"}
                                  size="small"
                                />
                              </TableCell>
                            </>
                          )}
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<VisibilityIcon />}
                              onClick={() => alert(`Viewing details for: ${assignment.title}`)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Pagination
                  count={Math.ceil((filteredAssignments || []).length / ITEMS_PER_PAGE)}
                  page={assignmentPage}
                  onChange={(e, value) => setAssignmentPage(value)}
                  sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}
                  color="primary"
                  size={isMobile ? "small" : "medium"}
                />
              </>
            )}
          </Card>
        </Fade>
      </Container>
    </Fade>
  );
}