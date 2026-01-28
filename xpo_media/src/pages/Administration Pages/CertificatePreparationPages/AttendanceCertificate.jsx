import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainContentPage from "../../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Spinner, InputGroup } from "react-bootstrap";
import { useAuthContext } from "../../../Context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import jsPDF for PDF generation
import jsPDF from "jspdf";

// Import ENDPOINTS from config
import { ENDPOINTS } from "../../../SpringBoot/config";

const AttendanceCertificate = () => {
  const [admissionNo, setAdmissionNo] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [workingDays, setWorkingDays] = useState("");
  const [daysAttendance, setDaysAttendance] = useState("");
  const [percentage, setPercentage] = useState("");
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [certifyText, setCertifyText] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [schoolInfo, setSchoolInfo] = useState({
    schoolName: "School Name",
    schoolAddress: "School Address",
    city: "",
    state: "",
    pincode: ""
  });
  
  const { user, admin, currentAcademicYear, schoolId, getAuthHeaders } = useAuthContext();

  // Fetch students data and school details when component mounts
  useEffect(() => {
    const fetchData = async () => {
      if ((!user && !admin) || !currentAcademicYear || !schoolId) return;
      
      setIsLoading(true);
      try {
        // Fetch school details first
        await fetchSchoolDetails();
        // Then fetch students
        await fetchAllStudents();
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, admin, currentAcademicYear, schoolId, getAuthHeaders]);

  // Fetch school details
  const fetchSchoolDetails = async () => {
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/school/school-details?schoolId=${schoolId}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const schoolData = await response.json();
        setSchoolInfo({
          schoolName: schoolData.schoolName || "School Name",
          schoolAddress: schoolData.schoolAddress || "School Address",
          city: schoolData.city || "",
          state: schoolData.state || "",
          pincode: schoolData.pincode || ""
        });
      } else {
        // Fallback to default school info if API fails
        setSchoolInfo({
          schoolName: "Your School Name",
          schoolAddress: "Your School Address",
          city: "City",
          state: "State",
          pincode: "Pincode"
        });
      }
    } catch (error) {
      console.error("Error fetching school details:", error);
      // Fallback to default school info
      setSchoolInfo({
        schoolName: "Your School Name",
        schoolAddress: "Your School Address",
        city: "City",
        state: "State",
        pincode: "Pincode"
      });
    }
  };

  // Fetch all students
  const fetchAllStudents = async () => {
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/studentreport/datas?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch students data");
      }

      const studentsData = await response.json();
      setStudents(Array.isArray(studentsData) ? studentsData : []);
    } catch (error) {
      toast.error("Failed to load students data. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
      setStudents([]);
    }
  };

  // Update certify text when student data changes
  useEffect(() => {
    const defaultText = `This is to certify that [Student Name] (Admission No: [Admission Number]) was a bonafide student of this institution during the academic year ${currentAcademicYear || "[Academic Year]"} and their attendance details are as follows:`;
    setCertifyText(defaultText);
  }, [currentAcademicYear]);

  // Update certify text with bold names when student is selected
  useEffect(() => {
    if (candidateName && admissionNo) {
      const boldText = `This is to certify that ${candidateName} (Admission No: ${admissionNo}) was a bonafide student of this institution during the academic year ${currentAcademicYear || "[Academic Year]"} and their attendance details are as follows:`;
      setCertifyText(boldText);
    }
  }, [candidateName, admissionNo, currentAcademicYear]);

  // Handle admission number change from dropdown
  const handleAdmissionNoChange = (e) => {
    const selectedAdmissionNo = e.target.value;
    setAdmissionNo(selectedAdmissionNo);
    setInputValue(selectedAdmissionNo);
    
    if (selectedAdmissionNo) {
      const student = students.find(s => s.admissionNumber === selectedAdmissionNo);
      if (student) {
        setSelectedStudent(student);
        setCandidateName(student.studentName);
      } else {
        setCandidateName("");
        setSelectedStudent(null);
      }
    } else {
      setCandidateName("");
      setSelectedStudent(null);
    }
  };

  // Handle manual admission number input
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
  };

  // Handle manual admission number input with Enter key
  const handleAdmissionNoInput = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputValue = e.target.value.trim();
      
      if (inputValue) {
        const student = students.find(s => s.admissionNumber === inputValue);
        if (student) {
          setSelectedStudent(student);
          setCandidateName(student.studentName);
          setAdmissionNo(student.admissionNumber);
          setInputValue(student.admissionNumber);
          toast.success(`Student found: ${student.studentName}`, {
            position: "top-right",
            autoClose: 2000,
          });
        } else {
          toast.error("No student found with this admission number", {
            position: "top-right",
            autoClose: 3000,
          });
          setAdmissionNo("");
          setCandidateName("");
          setSelectedStudent(null);
        }
      }
    }
  };

  // Calculate percentage automatically when working days or attendance changes
  useEffect(() => {
    if (workingDays && daysAttendance) {
      const workingDaysNum = parseInt(workingDays);
      const attendanceNum = parseInt(daysAttendance);
      
      if (workingDaysNum > 0 && attendanceNum >= 0 && attendanceNum <= workingDaysNum) {
        const calculatedPercentage = ((attendanceNum / workingDaysNum) * 100).toFixed(2);
        setPercentage(calculatedPercentage);
      }
    }
  }, [workingDays, daysAttendance]);

  const handleReset = () => {
    setAdmissionNo("");
    setCandidateName("");
    setWorkingDays("");
    setDaysAttendance("");
    setPercentage("");
    setSelectedStudent(null);
    setInputValue("");
    setCertifyText(`This is to certify that [Student Name] (Admission No: [Admission Number]) was a bonafide student of this institution during the academic year ${currentAcademicYear || "[Academic Year]"} and their attendance details are as follows:`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if ((!user && !admin) || !currentAcademicYear) {
      toast.error("Please log in and select an academic year to generate certificate.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (!admissionNo || !candidateName || !workingDays || !daysAttendance || !percentage) {
      toast.error("Please fill all required fields.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (parseInt(daysAttendance) > parseInt(workingDays)) {
      toast.error("Attendance days cannot exceed working days.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare certificate data
      const certificateData = {
        admissionNumber: admissionNo,
        studentName: candidateName,
        workingDays: parseInt(workingDays),
        daysAttended: parseInt(daysAttendance),
        attendancePercentage: parseFloat(percentage),
        schoolId: schoolId,
        academicYear: currentAcademicYear,
        certificateType: "ATTENDANCE",
        issuedDate: new Date().toISOString().split('T')[0],
        certificateText: certifyText,
        studentDetails: selectedStudent ? {
          standard: selectedStudent.standard,
          section: selectedStudent.section,
          fatherName: selectedStudent.fatherName,
          dateOfBirth: selectedStudent.dateOfBirth
        } : null,
        schoolInfo: schoolInfo
      };

      // Generate and download PDF certificate
      generateAndDownloadPDF(certificateData);

      toast.success("Attendance certificate generated successfully!", {
        position: "top-right",
        autoClose: 3000,
      });

    } catch (error) {
      toast.error("Failed to generate certificate. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateAndDownloadPDF = (certificateData) => {
    try {
      // Create new PDF document
      const doc = new jsPDF();
      
      // Set initial y position
      let yPosition = 30;
      
      // Add school header with actual school details
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(11, 61, 123);
      doc.text(certificateData.schoolInfo.schoolName.toUpperCase(), 105, 20, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      
      // Add school address
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const addressLines = doc.splitTextToSize(
        `${certificateData.schoolInfo.schoolAddress}, ${certificateData.schoolInfo.city}, ${certificateData.schoolInfo.state} - ${certificateData.schoolInfo.pincode}`,
        150
      );
      addressLines.forEach((line, index) => {
        doc.text(line, 105, 30 + (index * 5), { align: 'center' });
      });
      
      yPosition = 30 + (addressLines.length * 5) + 10;
      
      // Add certificate title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(11, 61, 123);
      doc.text("ATTENDANCE CERTIFICATE", 105, yPosition, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      yPosition += 15;
      

      // Add decorative line
      doc.setLineWidth(0.5);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 20;
      
      // Add certificate text with proper formatting
      doc.setFontSize(12);
      
      // Build the certificate text with proper line breaks
      const fullText = `This is to certify that ${certificateData.studentName} (Admission No: ${certificateData.admissionNumber}) was a bonafide student of this institution during the academic year ${certificateData.academicYear} and their attendance details are as follows:`;
      
      // Split text into lines that fit the page width
      const splitText = doc.splitTextToSize(fullText, 170);
      
      // Calculate starting Y position
      const lineHeight = 7;
      const textBlockHeight = splitText.length * lineHeight;
      const startY = yPosition;
      
      // Render each line with proper formatting
      splitText.forEach((line, index) => {
        let currentX = 20;
        const currentY = startY + (index * lineHeight);
        
        // Check if this line contains the student name
        if (line.includes(certificateData.studentName)) {
          const parts = line.split(certificateData.studentName);
          
          // Render text before name (normal)
          if (parts[0]) {
            doc.setFont("helvetica", "normal");
            doc.text(parts[0], currentX, currentY);
            currentX += doc.getTextWidth(parts[0]);
          }
          
          // Render student name (bold)
          doc.setFont("helvetica", "bold");
          doc.text(certificateData.studentName, currentX, currentY);
          currentX += doc.getTextWidth(certificateData.studentName);
          
          // Render text after name (normal)
          if (parts[1]) {
            doc.setFont("helvetica", "normal");
            
            // Check if the remaining text contains admission number
            if (parts[1].includes(certificateData.admissionNumber)) {
              const subParts = parts[1].split(certificateData.admissionNumber);
              
              // Render text before admission number
              if (subParts[0]) {
                doc.text(subParts[0], currentX, currentY);
                currentX += doc.getTextWidth(subParts[0]);
              }
              
              // Render admission number (bold)
              doc.setFont("helvetica", "bold");
              doc.text(certificateData.admissionNumber, currentX, currentY);
              currentX += doc.getTextWidth(certificateData.admissionNumber);
              
              // Render remaining text
              if (subParts[1]) {
                doc.setFont("helvetica", "normal");
                doc.text(subParts[1], currentX, currentY);
              }
            } else {
              // If no admission number in this part, just render normally
              doc.text(parts[1], currentX, currentY);
            }
          }
        } else if (line.includes(certificateData.admissionNumber)) {
          // If line contains admission number but not student name
          const parts = line.split(certificateData.admissionNumber);
          
          // Render text before admission number (normal)
          if (parts[0]) {
            doc.setFont("helvetica", "normal");
            doc.text(parts[0], currentX, currentY);
            currentX += doc.getTextWidth(parts[0]);
          }
          
          // Render admission number (bold)
          doc.setFont("helvetica", "bold");
          doc.text(certificateData.admissionNumber, currentX, currentY);
          currentX += doc.getTextWidth(certificateData.admissionNumber);
          
          // Render remaining text (normal)
          if (parts[1]) {
            doc.setFont("helvetica", "normal");
            doc.text(parts[1], currentX, currentY);
          }
        } else {
          // Regular line without special formatting
          doc.setFont("helvetica", "normal");
          doc.text(line, currentX, currentY);
        }
      });
      
      yPosition = startY + textBlockHeight + 15;
      
      // Add student details section with bold labels
      doc.setFont("helvetica", "bold");
      doc.text("STUDENT DETAILS:", 20, yPosition);
      yPosition += 10;
      
      doc.setFont("helvetica", "normal");
      doc.text(`Admission No: `, 25, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(certificateData.admissionNumber, 60, yPosition);
      yPosition += 7;
      
      doc.setFont("helvetica", "normal");
      doc.text(`Name: `, 25, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(certificateData.studentName, 45, yPosition);
      yPosition += 7;
      
      doc.setFont("helvetica", "normal");
      if (certificateData.studentDetails) {
        doc.text(`Class: ${certificateData.studentDetails.standard} ${certificateData.studentDetails.section}`, 25, yPosition);
        yPosition += 7;
        doc.text(`Father's Name: ${certificateData.studentDetails.fatherName}`, 25, yPosition);
        yPosition += 7;
        doc.text(`Date of Birth: ${certificateData.studentDetails.dateOfBirth}`, 25, yPosition);
        yPosition += 7;
      }
      doc.text(`Academic Year: ${certificateData.academicYear}`, 25, yPosition);
      yPosition += 15;
      
      // Add attendance details section with bold labels
      doc.setFont("helvetica", "bold");
      doc.text("ATTENDANCE DETAILS:", 20, yPosition);
      yPosition += 10;
      
      doc.setFont("helvetica", "normal");
      doc.text(`Total Working Days: `, 25, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(certificateData.workingDays.toString(), 70, yPosition);
      yPosition += 7;
      
      doc.setFont("helvetica", "normal");
      doc.text(`Days Attended: `, 25, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(certificateData.daysAttended.toString(), 60, yPosition);
      yPosition += 7;
      
      doc.setFont("helvetica", "normal");
      doc.text(`Attendance Percentage: `, 25, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(`${certificateData.attendancePercentage}%`, 75, yPosition);
      yPosition += 20;
      
      // Add footer with date and signature
      doc.setFont("helvetica", "normal");
      doc.text(`Date: ${certificateData.issuedDate}`, 20, yPosition);
      yPosition += 20;
      
      // Add signature line - properly aligned
      const signatureLine = "_________________________";
      const signatureText = "Principal/Authorized Signatory";
      const signatureWidth = doc.getTextWidth(signatureLine);
      const signatureX = 140;
      
      doc.text(signatureLine, signatureX, yPosition);
      yPosition += 7;
      doc.text(signatureText, signatureX + (signatureWidth / 2), yPosition, { align: 'center' });
      
      // Add school seal or stamp area
      yPosition += 20;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.text("(School Seal/Stamp)", 105, yPosition, { align: 'center' });
      
      // Save the PDF
      const fileName = `Attendance_Certificate_${certificateData.admissionNumber}_${certificateData.studentName.replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF certificate. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Filter unique admission numbers for dropdown
  const uniqueAdmissionNumbers = [...new Set(students.map(student => student.admissionNumber))];

  return (
    <MainContentPage>
      <div className="px-lg-3 px-0">
        <Row>
          <Col xs={12}>
            <div className="fee-setup-container">
              {/* Breadcrumb Navigation */}
              <nav className="custom-breadcrumb py-1 py-lg-3">
                <Link to="/home">Home</Link>
                <span className="separator"> &gt; </span>
                <span>Administration</span>
                <span className="separator"> &gt; </span>
                <Link to="/administration/certificate">Certificate Preparation</Link>
                <span className="separator"> &gt; </span>
                <span className="current">Attendance Certificate</span>
              </nav>

              <div className="form-card mt-3">
                {/* Header */}
                <div className="header p-3" style={{ backgroundColor: "#0B3D7B", color: "#fff" }}>
                  <h2 className="m-0">Attendance Certificate</h2>
                </div>

                {/* Form Content */}
                <div className="content-wrapper p-4">
                  {isLoading && (
                    <div className="text-center mb-3">
                      <Spinner animation="border" role="status" variant="primary" />
                      <p className="mt-2">Loading students data...</p>
                    </div>
                  )}

                  <Form onSubmit={handleSubmit}>
                    <Row className="mb-4">
                      <Col xs={12} md={6}>
                        <Form.Group>
                          <Form.Label>
                            <strong>Select or Enter Admission No</strong>
                          </Form.Label>
                          <InputGroup>
                            <Form.Control
                              as="select"
                              value={admissionNo}
                              onChange={handleAdmissionNoChange}
                              className="custom-input"
                              disabled={isLoading}
                              style={{ borderRight: "none" }}
                            >
                              <option value="">Select from dropdown</option>
                              {uniqueAdmissionNumbers.map((admissionNum) => (
                                <option key={admissionNum} value={admissionNum}>
                                  {admissionNum}
                                </option>
                              ))}
                            </Form.Control>
                            <InputGroup.Text style={{ backgroundColor: "#fff", borderLeft: "none", cursor: "pointer" }}>
                              <span style={{ userSelect: "none" }}>▼</span>
                            </InputGroup.Text>
                          </InputGroup>
                          <Form.Text className="text-muted">
                            Select from dropdown OR type below and press Enter
                          </Form.Text>
                          <Form.Control
                            type="text"
                            placeholder="Type admission number and press Enter"
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyPress={handleAdmissionNoInput}
                            className="mt-2"
                            disabled={isLoading}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Group>
                          <Form.Label>
                            <strong>Candidate Name</strong>
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value={candidateName}
                            className="custom-input"
                            disabled={true}
                            style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}
                            placeholder="Name will appear when admission number is selected"
                          />
                          {selectedStudent && (
                            <div className="mt-2 p-2 border rounded" style={{ backgroundColor: '#f0f8ff' }}>
                              <small>
                                <strong>Student Details:</strong><br />
                                Class: {selectedStudent.standard} {selectedStudent.section}<br />
                                Father: {selectedStudent.fatherName}<br />
                                DOB: {selectedStudent.dateOfBirth}
                              </small>
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mb-4">
                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label>This is to certify that</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={4}
                            value={certifyText}
                            onChange={(e) => setCertifyText(e.target.value)}
                            className="custom-input"
                          />
                          <Form.Text className="text-muted">
                            You can edit this text as needed. Student name and admission number will be bold in the certificate.
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mb-4">
                      <Col xs={12} md={4}>
                        <Form.Group>
                          <Form.Label>No.Of.Working Days</Form.Label>
                          <Form.Control
                            type="number"
                            value={workingDays}
                            onChange={(e) => setWorkingDays(e.target.value)}
                            className="custom-input"
                            min="1"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={4}>
                        <Form.Group>
                          <Form.Label>No.Of.Days Attendance</Form.Label>
                          <Form.Control
                            type="number"
                            value={daysAttendance}
                            onChange={(e) => setDaysAttendance(e.target.value)}
                            className="custom-input"
                            min="0"
                            max={workingDays}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={4}>
                        <Form.Group>
                          <Form.Label>Percentage</Form.Label>
                          <Form.Control
                            type="number"
                            value={percentage}
                            onChange={(e) => setPercentage(e.target.value)}
                            className="custom-input"
                            step="0.01"
                            min="0"
                            max="100"
                            required
                            readOnly
                            style={{ backgroundColor: '#e9ecef' }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="button-group mt-4">
                      <Button
                        type="submit"
                        className="px-4 custom-btn-clr py-2"
                        disabled={isLoading || isSubmitting}
                        style={{ backgroundColor: "#0B3D7B", borderColor: "#0B3D7B" }}
                      >
                        {isSubmitting ? "Generating..." : "Generate & Download Certificate"}
                      </Button>
                      <Button
                        variant="danger"
                        type="button"
                        className="px-4 py-2 mx-2"
                        onClick={handleReset}
                        disabled={isLoading || isSubmitting}
                      >
                        Reset
                      </Button>
                      <Button variant="secondary" type="button" className="px-4 py-2" disabled={isLoading || isSubmitting}>
                        Cancel
                      </Button>
                    </div>
                  </Form>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* Toastify Container */}
      <ToastContainer />
    </MainContentPage>
  );
};

export default AttendanceCertificate;