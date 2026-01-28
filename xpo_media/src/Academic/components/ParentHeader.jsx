import React from "react";
import { Box, Typography, Stack, Divider } from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import BadgeIcon from "@mui/icons-material/Badge";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";

export default function ParentHeader() {
  // Sample data - replace with dynamic data as needed
  const parentName = "Parent Name";
  const studentName = "Ananya Sharma";
  const classSection = "Class 10A";
  const academicYear = "2024–2025";
  const studentID = "123456";
  const rollNumber = "15";

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        p: 3,
        borderRadius: 1,
        boxShadow: 1,
      }}
    >
      {/* Welcome message for parent */}
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        👋 Welcome, {parentName}!
      </Typography>

      {/* Student info */}
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Student Name: <strong>{studentName}</strong>
      </Typography>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        divider={<Divider orientation="vertical" flexItem />}
        alignItems={{ xs: "flex-start", sm: "center" }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <SchoolIcon color="primary" />
          <Typography variant="body1">{classSection}</Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <CalendarTodayIcon color="action" />
          <Typography variant="body1">{academicYear}</Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <BadgeIcon color="action" />
          <Typography variant="body1">Student ID: {studentID}</Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <AssignmentIndIcon color="action" />
          <Typography variant="body1">Roll No: {rollNumber}</Typography>
        </Box>
      </Stack>
    </Box>
  );
}
