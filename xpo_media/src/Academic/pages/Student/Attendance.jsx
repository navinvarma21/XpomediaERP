import React, { useState } from "react";
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import EventNoteIcon from "@mui/icons-material/EventNote";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from "recharts";

function createData(date, status) {
  return { date, status };
}

// Sample daily attendance data
const dailyRows = [
  createData("2025-04-01", "Present"),
  createData("2025-04-02", "Absent"),
  createData("2025-04-03", "Present"),
  createData("2025-04-04", "Leave"),
  createData("2025-04-05", "Present"),
];

// Sample monthly summary
const monthlySummary = {
  present: 20,
  absent: 2,
  leaves: 1,
  leaveQuota: 5, // Total leaves allowed
};

const COLORS = ["#4caf50", "#f44336", "#ff9800"]; // Green, Red, Orange

const chartData = [
  { name: "Present", value: monthlySummary.present },
  { name: "Absent", value: monthlySummary.absent },
  { name: "Leaves", value: monthlySummary.leaves },
];

// Map status to color for highlighting
const statusColorMap = {
  Present: "#4caf50", // green
  Absent: "#f44336", // red
  Leave: "#ff9800", // orange
};

export default function Attendance() {
  const [tab, setTab] = useState(0);
  const [filterStatus, setFilterStatus] = useState("All");

  const handleTabChange = (e, newValue) => setTab(newValue);

  const handleFilterChange = (event) => setFilterStatus(event.target.value);

  const handleDownload = () => {
    // Implement download logic (CSV, PDF, etc)
    alert("Attendance history download started!");
  };

  // Filtered rows based on selected status
  const filteredRows =
    filterStatus === "All"
      ? dailyRows
      : dailyRows.filter((row) => row.status === filterStatus);

  return (
    <Container maxWidth={false} sx={{ px: 3, py: 3 }}>
      <Typography variant="h5" gutterBottom>
        Attendance
      </Typography>

      {/* Tabs for Daily/Monthly view */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={tab} onChange={handleTabChange}>
          <Tab label="Daily View" />
          <Tab label="Monthly View" />
        </Tabs>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={3}>
          <Card sx={{ display: "flex", alignItems: "center", p: 2 }}>
            <EventAvailableIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
            <CardContent sx={{ p: 0 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Present
              </Typography>
              <Typography variant="h6">{monthlySummary.present}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ display: "flex", alignItems: "center", p: 2 }}>
            <EventBusyIcon color="error" sx={{ fontSize: 40, mr: 2 }} />
            <CardContent sx={{ p: 0 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Absent
              </Typography>
              <Typography variant="h6">{monthlySummary.absent}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ display: "flex", alignItems: "center", p: 2 }}>
            <EventNoteIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
            <CardContent sx={{ p: 0 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Leaves Taken
              </Typography>
              <Typography variant="h6">{monthlySummary.leaves}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ display: "flex", alignItems: "center", p: 2 }}>
            <EventNoteIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
            <CardContent sx={{ p: 0 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Leave Quota Remaining
              </Typography>
              <Typography variant="h6">
                {monthlySummary.leaveQuota - monthlySummary.leaves}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Daily or Monthly View */}
      {tab === 0 ? (
        <>
          {/* Dropdown filter */}
          <Box sx={{ mb: 2, maxWidth: 200 }}>
            <FormControl fullWidth>
              <InputLabel id="attendance-filter-label">Filter Status</InputLabel>
              <Select
                labelId="attendance-filter-label"
                value={filterStatus}
                label="Filter Status"
                onChange={handleFilterChange}
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Present">Present</MenuItem>
                <MenuItem value="Absent">Absent</MenuItem>
                <MenuItem value="Leave">Leave</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Daily View: Table with colored status */}
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.length > 0 ? (
                  filteredRows.map((row) => (
                    <TableRow key={row.date}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          color: statusColorMap[row.status] || "inherit",
                        }}
                      >
                        {row.status}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} align="center">
                      No records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        // Monthly View: Pie Chart
        <Box sx={{ width: "100%", height: 300, mb: 2 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      )}

      {/* Download Button */}
      <Button
        variant="contained"
        startIcon={<DownloadIcon />}
        onClick={handleDownload}
        color="primary"
      >
        Download Attendance History
      </Button>
    </Container>
  );
}
