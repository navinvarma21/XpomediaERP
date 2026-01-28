import React from "react";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Box,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  Grid,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import EventIcon from "@mui/icons-material/Event";
import GradeIcon from "@mui/icons-material/Grade";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from "recharts";

// Sample data
const upcomingExams = [
  {
    subject: "Mathematics",
    date: "2025-05-05",
    time: "09:00 AM - 12:00 PM",
    venue: "Room 101",
    instructions: "Bring calculator",
  },
  {
    subject: "Science",
    date: "2025-05-07",
    time: "01:00 PM - 04:00 PM",
    venue: "Lab 3",
    instructions: "Lab coat required",
  },
  {
    subject: "English",
    date: "2025-05-10",
    time: "10:00 AM - 12:00 PM",
    venue: "Room 102",
    instructions: "",
  },
];

const examResults = [
  {
    subject: "Mathematics",
    examType: "Midterm",
    marks: 88,
    maxMarks: 100,
    grade: "B+",
    remarks: "Good work",
    published: "2025-03-20",
  },
  {
    subject: "Science",
    examType: "Midterm",
    marks: 92,
    maxMarks: 100,
    grade: "A",
    remarks: "Excellent",
    published: "2025-03-20",
  },
  {
    subject: "English",
    examType: "Midterm",
    marks: 85,
    maxMarks: 100,
    grade: "B",
    remarks: "Well done",
    published: "2025-03-20",
  },
];

const resultPDFs = [
  {
    title: "Midterm Results - March 2025",
    url: "/results/midterm_results_march_2025.pdf",
    issued: "2025-03-22",
  },
  {
    title: "Previous Year Final Results",
    url: "/results/final_results_2024.pdf",
    issued: "2024-12-10",
  },
];

// Function to calculate grade distribution for the pie chart
const calculateGradeDistribution = () => {
  const gradeCounts = {};
  examResults.forEach((result) => {
    const grade = result.grade;
    gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
  });

  const gradeData = Object.entries(gradeCounts).map(([grade, count]) => ({
    name: grade,
    value: count,
  }));

  return gradeData;
};

// Grade distribution data
const gradeDistributionData = calculateGradeDistribution();

// Colors for the pie chart
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#a4de6c"];

export default function Exams_and_Results() {
  return (
    <Container maxWidth={false} sx={{ px: 3, py: 3 }}>
      <Typography variant="h5" gutterBottom>
        Exams & Results
      </Typography>

      {/* Upcoming Exams Schedule */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <EventIcon color="primary" />
          <Typography variant="h6">Upcoming Exams</Typography>
        </Stack>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Venue</TableCell>
                <TableCell>Instructions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {upcomingExams.map((exam) => (
                <TableRow key={exam.subject + exam.date}>
                  <TableCell>{exam.subject}</TableCell>
                  <TableCell>{exam.date}</TableCell>
                  <TableCell>{exam.time}</TableCell>
                  <TableCell>{exam.venue}</TableCell>
                  <TableCell>
                    {exam.instructions ? (
                      <Chip label={exam.instructions} size="small" color="info" />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Marks & Grades by Subject */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <GradeIcon color="secondary" />
          <Typography variant="h6">Marks & Grades</Typography>
        </Stack>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell>Exam</TableCell>
                    <TableCell>Marks</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Remarks</TableCell>
                    <TableCell>Published</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {examResults.map((res) => (
                    <TableRow key={res.subject + res.examType}>
                      <TableCell>{res.subject}</TableCell>
                      <TableCell>{res.examType}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${res.marks} / ${res.maxMarks}`}
                          color={res.marks >= 90 ? "success" : res.marks >= 75 ? "primary" : "warning"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={res.grade}
                          color={res.grade === "A" ? "success" : res.grade === "B+" ? "primary" : "warning"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{res.remarks}</TableCell>
                      <TableCell>{res.published}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item xs={12} md={4}  sx={{ p: 2,marginLeft:"10%",width:"70%" }}>
            {/* Pie Chart */}
            {/* <Paper variant="outlined" sx={{ p: 2,marginLeft:"10%",width:"70%" }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Grade Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={gradeDistributionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {gradeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend layout="vertical" align="right" verticalAlign="middle" />
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper> */}
          </Grid>
        </Grid>
      </Box>

      {/* Result PDFs Download */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <PictureAsPdfIcon color="error" />
          <Typography variant="h6">Result PDFs</Typography>
        </Stack>
        <Grid container spacing={2}>
          {resultPDFs.map((pdf) => (
            <Grid item xs={12} sm={6} key={pdf.title}>
              <Paper variant="outlined" sx={{ p: 2, display: "flex", alignItems: "center" }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {pdf.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Issued: {pdf.issued}
                  </Typography>
                </Box>
                <Tooltip title="Preview PDF">
                  <IconButton
                    color="info"
                    href={pdf.url}
                    target="_blank"
                    rel="noopener"
                    sx={{ mr: 1 }}
                  >
                    <PictureAsPdfIcon />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<DownloadIcon />}
                  href={pdf.url}
                  download
                >
                  Download
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}
