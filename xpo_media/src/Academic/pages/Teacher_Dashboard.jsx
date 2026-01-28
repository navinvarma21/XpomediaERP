import React, { useState } from "react";
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Avatar,
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
  Stack,
  Container,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import SchoolIcon from "@mui/icons-material/School";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AssignmentLateIcon from "@mui/icons-material/AssignmentLate";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PeopleIcon from "@mui/icons-material/People";
import EventNoteIcon from "@mui/icons-material/EventNote";
import DownloadIcon from "@mui/icons-material/Download";
import AssessmentIcon from "@mui/icons-material/Assessment";

// Import MUI X Charts
import { BarChart, PieChart } from "@mui/x-charts";

const periods = [
  { period: "1st", subject: "English", class: "6A", time: "9:00 AM" },
  { period: "2nd", subject: "History", class: "8B", time: "10:00 AM" },
  { period: "3rd", subject: "English", class: "8B", time: "11:00 AM" },
  { period: "4th", subject: "History", class: "6A", time: "12:00 PM" },
  { period: "5th", subject: "English", class: "6A", time: "2:00 PM" },
];

const announcements = [
  { title: "Staff Meeting", content: "Staff meeting at 4 PM in the conference hall." },
  { title: "Exam Schedule", content: "Term 1 exam schedule released." },
];

// Sample data for charts
const classPerformance = [
  { class: "6A", average: 78 },
  { class: "8B", average: 85 },
  { class: "7C", average: 72 },
  { class: "9A", average: 90 },
];

const attendanceData = [
  { label: "Present", value: 140 },
  { label: "Absent", value: 15 },
  { label: "Late", value: 5 },
];

// Dummy data for submissions and evaluations
const submissions = [
  { student: "Anita Sharma", subject: "English", submittedOn: "2025-04-20", status: "Pending" },
  { student: "Ravi Patel", subject: "History", submittedOn: "2025-04-21", status: "Pending" },
  { student: "Sonal Mehta", subject: "English", submittedOn: "2025-04-22", status: "Reviewed" },
];

// Dummy student profiles
const students = [
  { name: "Anita Sharma", class: "6A", progress: 85, remarks: "Good progress" },
  { name: "Ravi Patel", class: "8B", progress: 70, remarks: "Needs improvement in History" },
  { name: "Sonal Mehta", class: "6A", progress: 90, remarks: "Excellent student" },
];

export default function Teacher_Dashboard() {
  // State to track which view is active
  const [selectedView, setSelectedView] = useState(null);

  // Render functions for each dynamic section

  const renderViewSubmissions = () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Student Submissions
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Submitted On</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissions.map((sub, idx) => (
              <TableRow key={idx}>
                <TableCell>{sub.student}</TableCell>
                <TableCell>{sub.subject}</TableCell>
                <TableCell>{sub.submittedOn}</TableCell>
                <TableCell>
                  <Chip
                    label={sub.status}
                    color={sub.status === "Pending" ? "warning" : "success"}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  const renderEvaluateFeedback = () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Evaluate & Give Feedback
      </Typography>
      <List>
        {submissions
          .filter((s) => s.status === "Pending")
          .map((sub, idx) => (
            <ListItem key={idx} divider>
              <ListItemText
                primary={`${sub.student} - ${sub.subject}`}
                secondary={`Submitted on: ${sub.submittedOn}`}
              />
              <Button variant="contained" color="primary" size="small">
                Evaluate
              </Button>
            </ListItem>
          ))}
        {submissions.filter((s) => s.status === "Pending").length === 0 && (
          <Typography>No submissions pending evaluation.</Typography>
        )}
      </List>
    </Paper>
  );

  const renderMarksEntryResults = () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Marks Entry & Results
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Class Performance (Average %)
      </Typography>
      <BarChart sx={{width:"50%",marginLeft:"20%"}}
        xAxis={[{ scaleType: "band", data: classPerformance.map((c) => c.class) }]}
        series={[{ data: classPerformance.map((c) => c.average), label: "Average (%)" }]}
        height={250}
      />
    </Paper>
  );

  const renderStudentAttendance = () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Student Attendance
      </Typography>
      <Stack direction="column" spacing={1} sx={{ mb: 2 }}>
        <Button variant="contained" color="primary">
          Take Attendance
        </Button>
        <Button variant="outlined" color="primary">
          View Summary
        </Button>
        <Chip label="2 students <75%" color="error" sx={{ mt: 1 }} />
      </Stack>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Attendance Breakdown
      </Typography>
      <PieChart
        series={[
          {
            data: attendanceData.map((item, idx) => ({
              id: idx,
              value: item.value,
              label: item.label,
            })),
          },
        ]}
        width={320}
        height={200}
      />
    </Paper>
  );

  const renderStudentProfiles = () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Student Profiles
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Progress (%)</TableCell>
              <TableCell>Remarks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student, idx) => (
              <TableRow key={idx}>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.class}</TableCell>
                <TableCell>{student.progress}</TableCell>
                <TableCell>{student.remarks}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  // Map view keys to render functions
  const viewComponents = {
    submissions: renderViewSubmissions,
    evaluate: renderEvaluateFeedback,
    marks: renderMarksEntryResults,
    attendance: renderStudentAttendance,
    profiles: renderStudentProfiles,
  };

  return (
    <Container maxWidth="lg"sx={{ mt: 4, mb: 4, height: '90vh', overflowY: 'auto', margin: '0' }}>
      {/* REMOVED: AppBar section - This is now handled by the Header component */}

      {/* Welcome Header Section */}
      <Box sx={{ mb: 3, p: 2, backgroundColor: 'white', borderRadius: 1, boxShadow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="h5" sx={{ flexGrow: 1, mb: { xs: 1, sm: 0 } }}>
            Welcome, Teacher!
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip label="Class 6A" color="primary" variant="outlined" />
            <Chip label="Class 8B" color="primary" variant="outlined" />
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Term 1: Jun–Oct 2025
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Quick Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center">
                <SchoolIcon color="primary" />
                <Typography variant="subtitle2">Subjects Taught</Typography>
              </Stack>
              <Typography variant="h6">English, History</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center">
                <PeopleIcon color="primary" />
                <Typography variant="subtitle2">Total Students</Typography>
              </Stack>
              <Typography variant="h6">160</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center">
                <AccessTimeIcon color="primary" />
                <Typography variant="subtitle2">Today's Periods</Typography>
              </Stack>
              <Typography variant="h6">5</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center">
                <AssignmentLateIcon color="primary" />
                <Typography variant="subtitle2">Pending Marks Entry</Typography>
              </Stack>
              <Typography variant="h6">3 subjects</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center">
                <AssignmentIcon color="primary" />
                <Typography variant="subtitle2">Assignments to Evaluate</Typography>
              </Stack>
              <Typography variant="h6">10 submissions</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Today's Schedule / Timetable */}
          <Paper sx={{ mb: 3, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Schedule
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Period</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {periods.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row.period}</TableCell>
                      <TableCell>{row.subject}</TableCell>
                      <TableCell>{row.class}</TableCell>
                      <TableCell>{row.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Assignments & Homework Buttons */}
          <Paper sx={{ mb: 3, p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <AssignmentTurnedInIcon color="primary" />
              <Typography variant="h6">Assignments & Homework</Typography>
            </Stack>
            <Stack direction="row" spacing={2}>
              <Button
                variant={selectedView === "submissions" ? "contained" : "outlined"}
                color="primary"
                onClick={() => setSelectedView("submissions")}
              >
                View Submissions
              </Button>
              <Button
                variant={selectedView === "evaluate" ? "contained" : "outlined"}
                color="primary"
                onClick={() => setSelectedView("evaluate")}
              >
                Evaluate & Give Feedback
              </Button>
            </Stack>
          </Paper>

          {/* Marks Entry & Results Button */}
          <Paper sx={{ mb: 3, p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <AssessmentIcon color="primary" />
              <Typography variant="h6">Marks Entry & Results</Typography>
            </Stack>
            <Button
              variant={selectedView === "marks" ? "contained" : "outlined"}
              color="primary"
              onClick={() => setSelectedView("marks")}
            >
              View Marks & Analytics
            </Button>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Student Profiles Button */}
          <Paper sx={{ mb: 3, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Student Profiles
            </Typography>
            <Button
              variant={selectedView === "profiles" ? "contained" : "outlined"}
              color="primary"
              fullWidth
              onClick={() => setSelectedView("profiles")}
            >
              View Student Profiles
            </Button>
          </Paper>

          {/* Announcements / Notices */}
          <Paper sx={{ mb: 3, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Announcements
            </Typography>
            <List dense>
              {announcements.map((item, idx) => (
                <ListItem key={idx} alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar>
                      <NotificationsIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={item.title} secondary={item.content} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Dynamic Content Area */}
      <Box sx={{ mt: 4 }}>
        {selectedView ? (
          viewComponents[selectedView]()
        ) : (
          <Typography variant="h6" color="text.secondary" align="center" sx={{ py: 10 }}>
            Please select an option above to view details.
          </Typography>
        )}
      </Box>
    </Container>
  );
}