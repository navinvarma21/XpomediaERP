import React from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Button,
  Stack,
  Divider,
  Tooltip,
  IconButton,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";

// Sample admit card data
const admitCard = {
  available: true,
  exam: "Final Term Examination 2025",
  studentName: "Ananya Sharma",
  rollNumber: "23MA101",
  regNumber: "REG2025001",
  examDate: "2025-05-10",
  venue: "Main Hall, Block A",
  downloadUrl: "/docs/admit_card_ananya.pdf",
};

export default function Admit_Card() {
  const handlePrint = (url) => {
    // Open the PDF in a new window for printing
    window.open(url, "_blank");
  };

  return (
    <Container  maxWidth={false} sx={{ px: 3, py: 3 }}>
      <Typography variant="h5" gutterBottom>
        Admit Card
      </Typography>

      <Card variant="outlined">
        <CardHeader
          avatar={<AssignmentIndIcon color="primary" />}
          title="Exam Admit Card"
          subheader={admitCard.exam}
          action={
            admitCard.available ? (
              <Typography
                variant="body2"
                color="success.main"
                sx={{ fontWeight: "bold", mt: 1, mr: 2 }}
              >
                Available
              </Typography>
            ) : (
              <Typography
                variant="body2"
                color="warning.main"
                sx={{ fontWeight: "bold", mt: 1, mr: 2 }}
              >
                Not Released
              </Typography>
            )
          }
        />
        <Divider />
        <CardContent>
          {admitCard.available ? (
            <Stack spacing={1}>
              <Typography variant="body1">
                <strong>Name:</strong> {admitCard.studentName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Roll No:</strong> {admitCard.rollNumber} &nbsp; | &nbsp;
                <strong>Reg No:</strong> {admitCard.regNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Exam Date:</strong> {admitCard.examDate}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Venue:</strong> {admitCard.venue}
              </Typography>
            </Stack>
          ) : (
            <Typography color="text.secondary">
              Admit card is not yet released. Please check back later.
            </Typography>
          )}
        </CardContent>
        <CardActions>
          {admitCard.available && (
            <>
              <Button
                variant="contained"
                color="primary"
                startIcon={<DownloadIcon />}
                href={admitCard.downloadUrl}
                download
              >
                Download
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<PrintIcon />}
                onClick={() => handlePrint(admitCard.downloadUrl)}
              >
                Print
              </Button>
              <Tooltip title="PDF Preview">
                <IconButton
                  color="info"
                  href={admitCard.downloadUrl}
                  target="_blank"
                  rel="noopener"
                >
                  <PictureAsPdfIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </CardActions>
      </Card>
    </Container>
  );
}
