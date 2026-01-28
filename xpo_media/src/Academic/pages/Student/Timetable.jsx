import React, { useState } from "react";
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
  Box,
  Avatar,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";

// Days of the week without Sunday
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Sample timetable data for 4 weeks
const timetableData = {
  1: [
    {
      time: "08:00 - 09:00",
      days: [
        { subject: "Mathematics", teacher: "Dr. Alice Mathur" },
        { subject: "Science", teacher: "Mr. John Smith" },
        { subject: "English", teacher: "Ms. Priya Verma" },
        { subject: "Mathematics", teacher: "Dr. Alice Mathur" },
        { subject: "History", teacher: "Mr. Raj Kumar" },
        { subject: "Physical Education", teacher: "Coach Mike" },
      ],
    },
    {
      time: "09:00 - 10:00",
      days: [
        { subject: "Science", teacher: "Mr. John Smith" },
        { subject: "English", teacher: "Ms. Priya Verma" },
        { subject: "Mathematics", teacher: "Dr. Alice Mathur" },
        { subject: "History", teacher: "Mr. Raj Kumar" },
        { subject: "Science", teacher: "Mr. John Smith" },
        { subject: "Art", teacher: "Ms. Lisa" },
      ],
    },
    {
      time: "10:00 - 11:00",
      days: [
        { subject: "English", teacher: "Ms. Priya Verma" },
        { subject: "Mathematics", teacher: "Dr. Alice Mathur" },
        { subject: "Science", teacher: "Mr. John Smith" },
        { subject: "English", teacher: "Ms. Priya Verma" },
        { subject: "Mathematics", teacher: "Dr. Alice Mathur" },
        { subject: "Music", teacher: "Mr. Paul" },
      ],
    },
  ],
  2: [
    {
      time: "08:00 - 09:00",
      days: [
        { subject: "History", teacher: "Mr. Raj Kumar" },
        { subject: "Science", teacher: "Mr. John Smith" },
        { subject: "English", teacher: "Ms. Priya Verma" },
        { subject: "Mathematics", teacher: "Dr. Alice Mathur" },
        { subject: "Science", teacher: "Mr. John Smith" },
        { subject: "Physical Education", teacher: "Coach Mike" },
      ],
    },
    {
      time: "09:00 - 10:00",
      days: [
        { subject: "Mathematics", teacher: "Dr. Alice Mathur" },
        { subject: "English", teacher: "Ms. Priya Verma" },
        { subject: "History", teacher: "Mr. Raj Kumar" },
        { subject: "Science", teacher: "Mr. John Smith" },
        { subject: "English", teacher: "Ms. Priya Verma" },
        { subject: "Art", teacher: "Ms. Lisa" },
      ],
    },
    {
      time: "10:00 - 11:00",
      days: [
        { subject: "Science", teacher: "Mr. John Smith" },
        { subject: "Mathematics", teacher: "Dr. Alice Mathur" },
        { subject: "English", teacher: "Ms. Priya Verma" },
        { subject: "History", teacher: "Mr. Raj Kumar" },
        { subject: "Mathematics", teacher: "Dr. Alice Mathur" },
        { subject: "Music", teacher: "Mr. Paul" },
      ],
    },
  ],
  3: [
    {
      time: "08:00 - 09:00",
      days: [
        { subject: "English", teacher: "Ms. Priya Verma" },
        { subject: "Mathematics", teacher: "Dr. Alice Mathur" },
        { subject: "Science", teacher: "Mr. John Smith" },
        { subject: "English", teacher: "Ms. Priya Verma" },
        { subject: "Mathematics", teacher: "Dr. Alice Mathur" },
        { subject: "Physical Education", teacher: "Coach Mike" },
      ],
    },
    {
      time: "09:00 - 10:00",
      days: [
        { subject: "History", teacher: "Mr. Raj Kumar" },
        { subject: "Science", teacher: "Mr. John Smith" },
        { subject: "English", teacher: "Ms. Priya Verma" },
        { subject: "Mathematics", teacher: "Dr. Alice Mathur" },
        { subject: "Science", teacher: "Mr. John Smith" },
        { subject: "Art", teacher: "Ms. Lisa" },
      ],
    },
    {
      time: "10:00 - 11:00",
      days: [
        { subject: "Mathematics", teacher: "Dr. Alice Mathur" },
        { subject: "English", teacher: "Ms. Priya Verma" },
        { subject: "History", teacher: "Mr. Raj Kumar" },
        { subject: "Science", teacher: "Mr. John Smith" },
        { subject: "English", teacher: "Ms. Priya Verma" },
        { subject: "Music", teacher: "Mr. Paul" },
      ],
    },
  ],
  4: [
    {
      time: "08:00 - 09:00",
      days: [
        { subject: "Science", teacher: "Mr. John Smith" },
        { subject: "English", teacher: "Ms. Priya Verma" },
        { subject: "Mathematics", teacher: "Dr. Alice Mathur" },
        { subject: "History", teacher: "Mr. Raj Kumar" },
        { subject: "Science", teacher: "Mr. John Smith" },
        { subject: "Physical Education", teacher: "Coach Mike" },
      ],
    },
    {
      time: "09:00 - 10:00",
      days: [
        { subject: "English", teacher: "Ms. Priya Verma" },
        { subject: "Mathematics", teacher: "Dr. Alice Mathur" },
        { subject: "Science", teacher: "Mr. John Smith" },
        { subject: "English", teacher: "Ms. Priya Verma" },
        { subject: "Mathematics", teacher: "Dr. Alice Mathur" },
        { subject: "Art", teacher: "Ms. Lisa" },
      ],
    },
    {
      time: "10:00 - 11:00",
      days: [
        { subject: "History", teacher: "Mr. Raj Kumar" },
        { subject: "Science", teacher: "Mr. John Smith" },
        { subject: "English", teacher: "Ms. Priya Verma" },
        { subject: "Mathematics", teacher: "Dr. Alice Mathur" },
        { subject: "Science", teacher: "Mr. John Smith" },
        { subject: "Music", teacher: "Mr. Paul" },
      ],
    },
  ],
};

// Get today's index (0 = Monday, 5 = Saturday)
const todayRaw = new Date().getDay(); // Sunday=0, Monday=1,...
const todayIdx = todayRaw === 0 ? -1 : todayRaw - 1; // Sunday excluded, so -1 means no highlight

export default function Timetable() {
  const [week, setWeek] = React.useState(1);

  const handleWeekChange = (event) => {
    setWeek(event.target.value);
  };

  const timetable = timetableData[week];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>
        Weekly Timetable
      </Typography>

      {/* Week Selector */}
      <Box sx={{ mb: 3, maxWidth: 150 }}>
        <FormControl fullWidth>
          <InputLabel id="week-select-label">Select Week</InputLabel>
          <Select
            labelId="week-select-label"
            value={week}
            label="Select Week"
            onChange={handleWeekChange}
          >
            {[1, 2, 3, 4].map((w) => (
              <MenuItem key={w} value={w}>
                Week {w}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", background: "#f5f5f5" }}>Time</TableCell>
              {days.map((day, idx) => (
                <TableCell
                  key={day}
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    background: idx === todayIdx ? "rgba(33, 150, 243, 0.12)" : "#f5f5f5",
                    color: idx === todayIdx ? "primary.main" : "inherit",
                  }}
                >
                  {day}
                  {idx === todayIdx && (
                    <Box component="span" sx={{ ml: 1, fontSize: 12, fontWeight: "bold" }}>
                      (Today)
                    </Box>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {timetable.map((slot) => (
              <TableRow key={slot.time}>
                <TableCell sx={{ fontWeight: "bold" }}>{slot.time}</TableCell>
                {slot.days.map((cell, idx) => (
                  <TableCell
                    key={idx}
                    align="center"
                    sx={{
                      background: idx === todayIdx ? "rgba(33, 150, 243, 0.07)" : "inherit",
                      borderLeft: idx === todayIdx ? "2px solid #2196f3" : "none",
                      minWidth: 120,
                      px: 1,
                    }}
                  >
                    {cell.subject ? (
                      <Stack direction="column" alignItems="center" spacing={0.5}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: "primary.light", mb: 0.5 }}>
                          <SchoolIcon fontSize="small" />
                        </Avatar>
                        <Typography variant="body2" fontWeight="bold">
                          {cell.subject}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {cell.teacher}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {slot.time}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="caption" color="text.disabled">
                        -
                      </Typography>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          * Today's classes are highlighted in blue.
        </Typography>
      </Box>
    </Container>
  );
}
