import React, { useState } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Button,
  Box,
  Stack,
  Divider,
  Alert,
  IconButton,
  Input,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import WarningIcon from "@mui/icons-material/Warning";

// Sample assignment data
const initialAssignments = [
  {
    id: 1,
    title: "Math Homework 5",
    subject: "Mathematics",
    dueDate: "2025-04-28",
    status: "Pending",
    description: "Solve all problems from chapter 6.",
    submittedFile: null,
    submissionDate: null,
    feedback: null,
  },
  {
    id: 2,
    title: "Science Lab Report",
    subject: "Science",
    dueDate: "2025-04-30",
    status: "Submitted",
    description: "Complete the experiment and upload your findings.",
    submittedFile: "lab_report_john.pdf",
    submissionDate: "2025-04-29",
    feedback: {
      teacher: "Mr. Smith",
      comment: "Well done! Good analysis of results.",
      grade: "A",
    },
  },
  {
    id: 3,
    title: "History Essay",
    subject: "History",
    dueDate: "2025-04-25",
    status: "Late",
    description: "Write an essay on World War II.",
    submittedFile: null,
    submissionDate: null,
    feedback: null,
  },
];

const statusColor = {
  Submitted: "success",
  Pending: "warning",
  Late: "error",
};

const statusIcon = {
  Submitted: <CheckCircleIcon fontSize="small" />,
  Pending: <PendingActionsIcon fontSize="small" />,
  Late: <WarningIcon fontSize="small" />,
};

export default function Homework_and_Assignments() {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [uploading, setUploading] = useState({}); // Track uploading state per assignment

  // Handle file upload (simulate)
  const handleUpload = (id, file) => {
    setUploading((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: "Submitted",
                submittedFile: file.name,
                submissionDate: new Date().toISOString().slice(0, 10),
              }
            : a
        )
      );
      setUploading((prev) => ({ ...prev, [id]: false }));
    }, 1200);
  };

  // Handle file input change
  const handleFileChange = (e, id) => {
    const file = e.target.files[0];
    if (file) handleUpload(id, file);
  };

  return (
    <Container maxWidth={false} sx={{ px: 3, py: 3 }}>
      <Typography variant="h5" gutterBottom>
        Homework & Assignments
      </Typography>
      <Grid container spacing={3}>
        {assignments.map((a) => {
          const isOverdue =
            a.status === "Pending" &&
            new Date(a.dueDate) < new Date() &&
            !a.submittedFile;

          return (
            <Grid item xs={12} sm={6} key={a.id}>
              <Card
                variant="outlined"
                sx={{
                  borderColor: isOverdue ? "error.main" : "divider",
                  background: isOverdue ? "rgba(255,0,0,0.04)" : "background.paper",
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <Typography variant="h6" fontWeight="bold">
                      {a.title}
                    </Typography>
                    <Chip label={a.subject} size="small" color="primary" />
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <Chip
                      icon={statusIcon[a.status]}
                      label={a.status}
                      color={statusColor[a.status]}
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Due: {a.dueDate}
                    </Typography>
                    {a.submissionDate && (
                      <Typography
                        variant="body2"
                        color="success.main"
                        sx={{ ml: 1 }}
                      >
                        Submitted: {a.submissionDate}
                      </Typography>
                    )}
                  </Stack>
                  <Typography variant="body2" mb={2}>
                    {a.description}
                  </Typography>
                  {a.status === "Pending" && (
                    <Box>
                      <Button
                        variant="contained"
                        component="label"
                        startIcon={<UploadFileIcon />}
                        size="small"
                        disabled={uploading[a.id]}
                      >
                        {uploading[a.id] ? "Uploading..." : "Upload"}
                        <Input
                          type="file"
                          sx={{ display: "none" }}
                          onChange={(e) => handleFileChange(e, a.id)}
                        />
                      </Button>
                      {isOverdue && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ ml: 2 }}
                        >
                          Overdue!
                        </Typography>
                      )}
                    </Box>
                  )}
                  {a.status === "Submitted" && (
                    <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                      <Typography variant="body2">
                        File: {a.submittedFile}
                      </Typography>
                      <IconButton
                        size="small"
                        color="primary"
                        href={`/${a.submittedFile}`}
                        download
                        aria-label="Download"
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Stack>
                  )}
                  {a.status === "Late" && (
                    <Typography variant="body2" color="error" mt={1}>
                      Submission is overdue.
                    </Typography>
                  )}
                  {a.feedback && (
                    <Box mt={2}>
                      <Alert severity="info" icon={false}>
                        <Typography variant="body2" fontWeight="bold">
                          Teacher Feedback
                        </Typography>
                        <Divider sx={{ my: 0.5 }} />
                        <Typography variant="body2">
                          <strong>{a.feedback.teacher}:</strong> {a.feedback.comment}
                        </Typography>
                        {a.feedback.grade && (
                          <Typography variant="body2" color="primary">
                            Grade: {a.feedback.grade}
                          </Typography>
                        )}
                      </Alert>
                    </Box>
                  )}
                </CardContent>
                <CardActions />
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}
