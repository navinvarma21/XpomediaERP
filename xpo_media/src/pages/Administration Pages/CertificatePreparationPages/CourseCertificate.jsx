import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainContentPage from "../../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Alert, Table, Spinner } from "react-bootstrap";
import { useAuthContext } from "../../../Context/AuthContext";
import { ENDPOINTS } from "../../../SpringBoot/config";
import { jsPDF } from "jspdf";

const StudyCertificate = () => {
  const [admissionNo, setAdmissionNo] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [schoolInfo, setSchoolInfo] = useState({
    schoolName: "School Name",
    schoolAddress: "School Address",
    city: "",
    state: "",
    pincode: ""
  });

  const { user, admin, schoolId, currentAcademicYear, getAuthHeaders } = useAuthContext();

  // Fetch students data and school details from backend
  useEffect(() => {
    const fetchData = async () => {
      if ((!user && !admin) || !schoolId || !currentAcademicYear) return;

      try {
        setLoading(true);
        setError("");
        
        // Fetch school details
        await fetchSchoolDetails();
        
        // Fetch students data
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
        setStudents(studentsData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load students data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, admin, schoolId, currentAcademicYear, getAuthHeaders]);

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
      }
    } catch (error) {
      console.error("Error fetching school details:", error);
    }
  };

  // Handle admission number change
  const handleAdmissionNoChange = (e) => {
    const selectedAdmissionNo = e.target.value;
    setAdmissionNo(selectedAdmissionNo);

    if (selectedAdmissionNo) {
      const student = students.find(
        (s) => s.admissionNumber === selectedAdmissionNo
      );
      if (student) {
        setSelectedStudent(student);
        setCandidateName(student.studentName);
        setDateOfBirth(student.dateOfBirth || "");
        setError("");
      }
    } else {
      setSelectedStudent(null);
      setCandidateName("");
      setDateOfBirth("");
    }
  };

  const handleReset = () => {
    setAdmissionNo("");
    setCandidateName("");
    setDateOfBirth("");
    setSelectedStudent(null);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!admissionNo || !selectedStudent) {
      setError("Please select a valid student");
      return;
    }

    try {
      setIsGenerating(true);
      setError("");
      
      // Generate and download PDF directly without backend call
      generateAndDownloadPDF();
      
    } catch (err) {
      console.error("Error generating certificate:", err);
      setError("Failed to generate study certificate");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAndDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Set initial y position
      let yPosition = 30;
      
      // Add school header with actual school details
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(11, 61, 123);
      doc.text(schoolInfo.schoolName.toUpperCase(), 105, 20, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      
      // Add school address
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const addressLines = doc.splitTextToSize(
        `${schoolInfo.schoolAddress}, ${schoolInfo.city}, ${schoolInfo.state} - ${schoolInfo.pincode}`,
        150
      );
      addressLines.forEach((line, index) => {
        doc.text(line, 105, 30 + (index * 5), { align: 'center' });
      });
      
      yPosition = 30 + (addressLines.length * 5) + 15;
      
      // Add certificate title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(11, 61, 123);
      doc.text("STUDY CERTIFICATE", 105, yPosition, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      yPosition += 15;
      
      // Add decorative line
      doc.setLineWidth(0.5);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 25;
      
      // Student Details Section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("STUDENT DETAILS:", 20, yPosition);
      yPosition += 10;
      
      doc.setFont("helvetica", "normal");
      doc.text(`Admission No: `, 25, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(selectedStudent.admissionNumber, 60, yPosition);
      yPosition += 7;
      
      doc.setFont("helvetica", "normal");
      doc.text(`Name: `, 25, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(selectedStudent.studentName, 45, yPosition);
      yPosition += 7;
      
      doc.setFont("helvetica", "normal");
      doc.text(`Father's Name: `, 25, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(selectedStudent.fatherName, 55, yPosition);
      yPosition += 7;
      
      doc.setFont("helvetica", "normal");
      doc.text(`Mother's Name: `, 25, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(selectedStudent.motherName, 57, yPosition);
      yPosition += 7;
      
      doc.setFont("helvetica", "normal");
      doc.text(`Class: `, 25, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(`${selectedStudent.standard} ${selectedStudent.section}`, 45, yPosition);
      yPosition += 7;
      
      doc.setFont("helvetica", "normal");
      doc.text(`Gender: `, 25, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(selectedStudent.gender, 45, yPosition);
      yPosition += 7;
      
      doc.setFont("helvetica", "normal");
      doc.text(`Date of Birth: `, 25, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(formatDate(selectedStudent.dateOfBirth), 60, yPosition);
      yPosition += 7;
      
      doc.setFont("helvetica", "normal");
      doc.text(`Academic Year: `, 25, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(currentAcademicYear, 60, yPosition);
      yPosition += 20;
      
      // Certificate Content with bold student data
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      
      // First line: "This is to certify that"
      doc.text("This is to certify that", 20, yPosition);
      yPosition += 7;
      
      // Second line: Gender prefix (Selvi/Selvan) in bold
      const genderPrefix = selectedStudent.gender === "Female" ? "Selvi" : "Selvan";
      doc.setFont("helvetica", "bold");
      doc.text(genderPrefix, 20, yPosition);
      let currentX = 20 + doc.getTextWidth(genderPrefix) + 2;
      
      // Student name in bold
      doc.text(selectedStudent.studentName, currentX, yPosition);
      currentX += doc.getTextWidth(selectedStudent.studentName) + 2;
      
      // Rest of the line
      doc.setFont("helvetica", "normal");
      doc.text(", S/O/D/O", currentX, yPosition);
      currentX += doc.getTextWidth(", S/O/D/O") + 2;
      
      // Father's name in bold
      doc.setFont("helvetica", "bold");
      doc.text(selectedStudent.fatherName, currentX, yPosition);
      currentX += doc.getTextWidth(selectedStudent.fatherName) + 2;
      
      // "and" in normal
      doc.setFont("helvetica", "normal");
      doc.text("and", currentX, yPosition);
      currentX += doc.getTextWidth("and") + 2;
      
      // Mother's name in bold
      doc.setFont("helvetica", "bold");
      doc.text(selectedStudent.motherName, currentX, yPosition);
      yPosition += 7;
      
      // Third line
      doc.setFont("helvetica", "normal");
      doc.text("is a bonafide student of this institution.", 20, yPosition);
      yPosition += 7;
      
      // Fourth line: Class details with bold class and section
      doc.text("He/She is studying in", 20, yPosition);
      currentX = 20 + doc.getTextWidth("He/She is studying in") + 2;
      
      doc.setFont("helvetica", "bold");
      doc.text(`${selectedStudent.standard} - ${selectedStudent.section}`, currentX, yPosition);
      currentX += doc.getTextWidth(`${selectedStudent.standard} - ${selectedStudent.section}`) + 2;
      
      doc.setFont("helvetica", "normal");
      doc.text("during the academic year", currentX, yPosition);
      currentX += doc.getTextWidth("during the academic year") + 2;
      
      doc.setFont("helvetica", "bold");
      doc.text(currentAcademicYear, currentX, yPosition);
      yPosition += 7;
      
      // Empty line
      yPosition += 7;
      
      // Fifth line: Date of birth with bold date
      doc.setFont("helvetica", "normal");
      doc.text("His/Her date of birth is", 20, yPosition);
      currentX = 20 + doc.getTextWidth("His/Her date of birth is") + 2;
      
      doc.setFont("helvetica", "bold");
      doc.text(formatDate(selectedStudent.dateOfBirth), currentX, yPosition);
      currentX += doc.getTextWidth(formatDate(selectedStudent.dateOfBirth)) + 2;
      
      doc.setFont("helvetica", "normal");
      doc.text("as per school records.", currentX, yPosition);
      yPosition += 7;
      
      // Empty line
      yPosition += 7;
      
      // Sixth line
      doc.text("His/Her Conduct and Character are: _____________", 20, yPosition);
      yPosition += 20;
      
      // Add footer with date and signature
      doc.setFont("helvetica", "normal");
      doc.text(`Date: ${new Date().toISOString().split('T')[0]}`, 20, yPosition);
      
      // Add signature line
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
      const fileName = `Study_Certificate_${selectedStudent.admissionNumber}_${selectedStudent.studentName.replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);
      
      setSuccess("Study certificate downloaded successfully!");
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Failed to generate PDF certificate");
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
    } catch (error) {
      return "N/A";
    }
  };

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
                <span className="current">Study Certificate</span>
              </nav>

              <div className="form-card mt-3">
                {/* Header */}
                <div className="header p-3" style={{ backgroundColor: "#0B3D7B", color: "#fff" }}>
                  <h2 className="m-0">Course Of Study Certificate</h2>
                </div>

                {/* Form Content */}
                <div className="content-wrapper p-4">
                  {/* Alerts */}
                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && <Alert variant="success">{success}</Alert>}

                  {loading && (
                    <div className="text-center mb-3">
                      <Spinner animation="border" role="status" variant="primary" />
                      <p className="mt-2">Loading students data...</p>
                    </div>
                  )}

                  <Form onSubmit={handleSubmit}>
                    <Row className="mb-4">
                      <Col xs={12} md={6}>
                        <Form.Group>
                          <Form.Label>Enter Admission No</Form.Label>
                          <div className="position-relative">
                            <Form.Control
                              as="select"
                              value={admissionNo}
                              onChange={handleAdmissionNoChange}
                              className="custom-input"
                              disabled={loading}
                            >
                              <option value="">Select Admission Number</option>
                              {students.map((student) => (
                                <option key={student.id} value={student.admissionNumber}>
                                  {student.admissionNumber}
                                </option>
                              ))}
                            </Form.Control>
                            <span
                              className="dropdown-icon position-absolute"
                              style={{
                                right: "10px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                pointerEvents: "none",
                                fontSize: "1.2rem",
                                color: "#495057",
                              }}
                            >
                              ▼
                            </span>
                          </div>
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Group>
                          <Form.Label>Enter Candidate Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={candidateName}
                            readOnly
                            className="custom-input"
                            style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}
                            placeholder="Will be auto-filled from admission number"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Student Details Display */}
                    {selectedStudent && (
                      <div className="student-details mb-4 p-3 border rounded" style={{ backgroundColor: '#f0f8ff' }}>
                        <h5 className="mb-3">Student Details</h5>
                        <Row>
                          <Col md={6}>
                            <Table bordered size="sm">
                              <tbody>
                                <tr>
                                  <td><strong>Father's Name:</strong></td>
                                  <td>{selectedStudent.fatherName}</td>
                                </tr>
                                <tr>
                                  <td><strong>Mother's Name:</strong></td>
                                  <td>{selectedStudent.motherName}</td>
                                </tr>
                                <tr>
                                  <td><strong>Standard:</strong></td>
                                  <td>{selectedStudent.standard}</td>
                                </tr>
                              </tbody>
                            </Table>
                          </Col>
                          <Col md={6}>
                            <Table bordered size="sm">
                              <tbody>
                                <tr>
                                  <td><strong>Section:</strong></td>
                                  <td>{selectedStudent.section}</td>
                                </tr>
                                <tr>
                                  <td><strong>Gender:</strong></td>
                                  <td>{selectedStudent.gender}</td>
                                </tr>
                                <tr>
                                  <td><strong>Date of Birth:</strong></td>
                                  <td>{formatDate(selectedStudent.dateOfBirth)}</td>
                                </tr>
                              </tbody>
                            </Table>
                          </Col>
                        </Row>
                      </div>
                    )}

                    <Row className="mb-4">
                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label>Certificate Preview</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={6}
                            value={
                              selectedStudent
                                ? `This is to certify that ${selectedStudent.gender === "Female" ? "Selvi" : "Selvan"} ${selectedStudent.studentName}, S/O/D/O ${selectedStudent.fatherName} and ${selectedStudent.motherName}, is a bonafide student of this institution. He/She is studying in ${selectedStudent.standard} - ${selectedStudent.section} during the academic year ${currentAcademicYear}. His/Her date of birth is ${formatDate(selectedStudent.dateOfBirth)} as per school records. His/Her Conduct and Character are: _____________`
                                : "Please select a student to preview certificate text."
                            }
                            readOnly
                            className="custom-input"
                            style={{ backgroundColor: '#f8f9fa' }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mb-4">
                      <Col xs={12} md={6}>
                        <Form.Group>
                          <Form.Label>Date of Birth</Form.Label>
                          <Form.Control
                            type="text"
                            value={formatDate(dateOfBirth)}
                            readOnly
                            className="custom-input"
                            placeholder="Auto-filled from student data"
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Group>
                          <Form.Label>Academic Year</Form.Label>
                          <Form.Control
                            type="text"
                            value={currentAcademicYear}
                            readOnly
                            className="custom-input"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="button-group mt-4">
                      <Button
                        type="submit"
                        className="px-4 custom-btn-clr py-2"
                        disabled={loading || isGenerating || !selectedStudent}
                        style={{ backgroundColor: "#0B3D7B", borderColor: "#0B3D7B" }}
                      >
                        {isGenerating ? "Generating PDF..." : "Generate & Download PDF"}
                      </Button>
                      <Button
                        variant="danger"
                        type="button"
                        className="px-4 py-2 mx-2"
                        onClick={handleReset}
                        disabled={loading || isGenerating}
                      >
                        Reset
                      </Button>
                      <Button 
                        variant="secondary" 
                        type="button" 
                        className="px-4 py-2"
                        as={Link}
                        to="/administration/certificate"
                      >
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
    </MainContentPage>
  );
};

export default StudyCertificate;