import React, { useState, useRef } from 'react';
import { Grid, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Box, Paper } from '@mui/material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ParticipationCertificateGenerator = () => {
  const [certificateName, setCertificateName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [standard, setStandard] = useState('');
  const [fontStyle, setFontStyle] = useState('Roboto');
  const [template, setTemplate] = useState('template1');
  const [borderColor, setBorderColor] = useState('#1976d2');
  const certificateRef = useRef(null);

  // Sample options - replace with actual data as needed
  const certificateNames = ['Science Fair Participation', 'Sports Day Achievement', 'Debate Competition', 'Art Exhibition Award', 'Math Olympiad Certificate'];
  const studentNames = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown'];
  const academicYears = ['2023-2024', '2024-2025', '2025-2026'];
  const standards = ['1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade'];
  const fontStyles = ['Roboto', 'Times New Roman', 'Arial', 'Georgia'];
  const templates = [
    { id: 'template1', name: 'Classic Blue', bgColor: '#e3f2fd', textAlign: 'center' },
    { id: 'template2', name: 'Elegant Gold', bgColor: '#fff3e0', textAlign: 'left' },
    { id: 'template3', name: 'Modern Green', bgColor: '#e8f5e9', textAlign: 'center' },
  ];
  const borderColors = [
    { name: 'Blue', value: '#1976d2' },
    { name: 'Gold', value: '#ffb300' },
    { name: 'Green', value: '#388e3c' },
    { name: 'Red', value: '#d32f2f' },
  ];

  const handleDownload = () => {
    if (certificateRef.current) {
      html2canvas(certificateRef.current, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 190; // A4 width in mm (210) minus margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        pdf.save(`${certificateName || 'Certificate'}_${studentName || 'Student'}.pdf`);
      });
    }
  };

  return (
    <Grid container spacing={3} direction="column" alignItems="center" justifyContent="center" style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom color="primary">
        Participation Certificate Generator
      </Typography>

      <Paper elevation={3} style={{ padding: '20px', width: '100%', maxWidth: '600px', marginBottom: '20px' }}>
        <Typography variant="h6" gutterBottom>
          Certificate Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" margin="normal">
              <InputLabel id="certificate-name-label">Certificate Name</InputLabel>
              <Select
                labelId="certificate-name-label"
                value={certificateName}
                onChange={(e) => setCertificateName(e.target.value)}
                label="Certificate Name"
              >
                <MenuItem value="">Select Certificate</MenuItem>
                {certificateNames.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" margin="normal">
              <InputLabel id="student-name-label">Student's Name</InputLabel>
              <Select
                labelId="student-name-label"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                label="Student's Name"
              >
                <MenuItem value="">Select Student</MenuItem>
                {studentNames.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" margin="normal">
              <InputLabel id="academic-year-label">Academic Year</InputLabel>
              <Select
                labelId="academic-year-label"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                label="Academic Year"
              >
                <MenuItem value="">Select Year</MenuItem>
                {academicYears.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" margin="normal">
              <InputLabel id="standard-label">Standard/Grade</InputLabel>
              <Select
                labelId="standard-label"
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                label="Standard/Grade"
              >
                <MenuItem value="">Select Standard</MenuItem>
                {standards.map((std) => (
                  <MenuItem key={std} value={std}>
                    {std}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" margin="normal">
              <InputLabel id="font-style-label">Font Style</InputLabel>
              <Select
                labelId="font-style-label"
                value={fontStyle}
                onChange={(e) => setFontStyle(e.target.value)}
                label="Font Style"
              >
                {fontStyles.map((font) => (
                  <MenuItem key={font} value={font}>
                    {font}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" margin="normal">
              <InputLabel id="template-label">Certificate Template</InputLabel>
              <Select
                labelId="template-label"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                label="Certificate Template"
              >
                {templates.map((temp) => (
                  <MenuItem key={temp.id} value={temp.id}>
                    {temp.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" margin="normal">
              <InputLabel id="border-color-label">Border Color</InputLabel>
              <Select
                labelId="border-color-label"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
                label="Border Color"
              >
                {borderColors.map((color) => (
                  <MenuItem key={color.value} value={color.value}>
                    {color.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Button
          variant="contained"
          color="primary"
          onClick={handleDownload}
          style={{ marginTop: '16px' }}
          disabled={!certificateName || !studentName || !academicYear || !standard}
        >
          Download Certificate
        </Button>
      </Paper>

      <Card variant="outlined" style={{ width: '100%', maxWidth: '600px', marginTop: '20px' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Certificate Preview
          </Typography>
          <Box
            ref={certificateRef}
            sx={{
              width: '100%',
              height: '300px',
              backgroundColor: templates.find((t) => t.id === template)?.bgColor || '#fff',
              border: `5px solid ${borderColor}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: templates.find((t) => t.id === template)?.textAlign || 'center',
              justifyContent: 'center',
              padding: '20px',
              fontFamily: fontStyle,
              textAlign: templates.find((t) => t.id === template)?.textAlign || 'center',
            }}
          >
            <Typography variant="h4" gutterBottom>
              {certificateName || 'Certificate of Participation'}
            </Typography>
            <Typography variant="h6">
              Awarded to: {studentName || '[Student Name]'}
            </Typography>
            <Typography variant="body1">
              Standard: {standard || '[Standard]'}
            </Typography>
            <Typography variant="body1">
              Academic Year: {academicYear || '[Academic Year]'}
            </Typography>
            <Typography variant="body2" style={{ marginTop: '16px' }}>
              This certificate is awarded for outstanding participation on {new Date().toLocaleDateString()}.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2} style={{ marginTop: '30px', width: '100%' }}>
        <Typography variant="h6" gutterBottom style={{ marginLeft: '16px' }}>
          Sample Certificate Templates
        </Typography>
        {templates.map((temp) => (
          <Grid item xs={12} sm={6} md={4} key={temp.id}>
            <Card variant="outlined">
              <CardContent>
                <Box
                  sx={{
                    width: '100%',
                    height: '150px',
                    backgroundColor: temp.bgColor,
                    border: `3px solid ${borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: temp.textAlign,
                    fontFamily: fontStyle,
                    padding: '10px',
                  }}
                >
                  <Typography variant="body1">{temp.name}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Grid>
  );
};

export default ParticipationCertificateGenerator;