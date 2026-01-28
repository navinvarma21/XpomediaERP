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

const ExperienceCertificate = () => {
  const [staffCode, setStaffCode] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [designation, setDesignation] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [certifyText, setCertifyText] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [schoolDetails, setSchoolDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  
  const { user, admin, currentAcademicYear, schoolId, getAuthHeaders } = useAuthContext();

  // Fetch school details when component mounts
  useEffect(() => {
    const fetchSchoolDetails = async () => {
      if (!schoolId) return;
      
      try {
        const response = await fetch(
          `${ENDPOINTS.admissionmaster}/school/school-details?schoolId=${schoolId}`,
          {
            method: "GET",
            headers: getAuthHeaders(),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch school details");
        }

        const schoolData = await response.json();
        setSchoolDetails(schoolData);
      } catch (error) {
        console.error("Error fetching school details:", error);
        // Continue without school details - use default
      }
    };

    fetchSchoolDetails();
  }, [schoolId, getAuthHeaders]);

  // Fetch staff data when component mounts or academic year changes
  useEffect(() => {
    const fetchStaff = async () => {
      if ((!user && !admin) || !currentAcademicYear || !schoolId) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(
          `${ENDPOINTS.administration}/staff?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
          {
            method: "GET",
            headers: getAuthHeaders(),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch staff data");
        }

        const staffData = await response.json();
        setStaffList(Array.isArray(staffData) ? staffData : []);
      } catch (error) {
        toast.error("Failed to load staff data. Please try again.", {
          position: "top-right",
          autoClose: 3000,
        });
        setStaffList([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, [user, admin, currentAcademicYear, schoolId, getAuthHeaders]);

  // Update certify text when staff data changes
  useEffect(() => {
    if (candidateName && designation && fromDate && toDate) {
      const defaultText = `This is to certify that ${candidateName} worked as ${designation} in our institution from ${fromDate} to ${toDate}. During the period of service, we found him/her to be sincere, hardworking, dedicated and punctual in his/her duties.`;
      setCertifyText(defaultText);
    } else {
      setCertifyText("This is to certify that [Staff Name] worked as [Designation] in our institution from [From Date] to [To Date]. During the period of service, we found him/her to be sincere, hardworking, dedicated and punctual in his/her duties.");
    }
  }, [candidateName, designation, fromDate, toDate]);

  // Handle staff code change
  const handleStaffCodeChange = (e) => {
    const selectedStaffCode = e.target.value;
    setStaffCode(selectedStaffCode);
    
    if (selectedStaffCode) {
      const staff = staffList.find(s => s.staffCode === selectedStaffCode);
      if (staff) {
        setSelectedStaff(staff);
        setCandidateName(staff.name);
        setDesignation(staff.designation);
        
        // Auto-set from date as date of joining if available
        if (staff.dateOfJoining && !fromDate) {
          setFromDate(staff.dateOfJoining);
        }
        
        // Auto-set to date as current date if staff is still working
        if (!staff.dateOfRelieve && !toDate) {
          const today = new Date().toISOString().split('T')[0];
          setToDate(today);
        } else if (staff.dateOfRelieve && !toDate) {
          setToDate(staff.dateOfRelieve);
        }
      } else {
        setCandidateName("");
        setDesignation("");
        setSelectedStaff(null);
      }
    } else {
      setCandidateName("");
      setDesignation("");
      setSelectedStaff(null);
    }
  };

  const handleReset = () => {
    setStaffCode("");
    setCandidateName("");
    setDesignation("");
    setFromDate("");
    setToDate("");
    setSelectedStaff(null);
    setCertifyText("This is to certify that [Staff Name] worked as [Designation] in our institution from [From Date] to [To Date]. During the period of service, we found him/her to be sincere, hardworking, dedicated and punctual in his/her duties.");
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

    if (!staffCode || !candidateName || !designation || !fromDate || !toDate) {
      toast.error("Please fill all required fields.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      toast.error("From date cannot be after to date.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare certificate data
      const certificateData = {
        staffCode: staffCode,
        staffName: candidateName,
        designation: designation,
        fromDate: fromDate,
        toDate: toDate,
        schoolId: schoolId,
        academicYear: currentAcademicYear,
        certificateType: "EXPERIENCE",
        issuedDate: new Date().toISOString().split('T')[0],
        certificateText: certifyText,
        staffDetails: selectedStaff ? {
          dateOfJoining: selectedStaff.dateOfJoining,
          dateOfRelieve: selectedStaff.dateOfRelieve,
          educationQualification: selectedStaff.educationQualification,
          mobileNumber: selectedStaff.mobileNumber
        } : null,
        schoolDetails: schoolDetails
      };

      // Generate and download PDF certificate
      generateAndDownloadPDF(certificateData);

      toast.success("Experience certificate generated successfully!", {
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
      
      if (certificateData.schoolDetails) {
        // School Name
        doc.setTextColor(11, 61, 123);
        doc.text(certificateData.schoolDetails.schoolName.toUpperCase(), 105, 15, { align: 'center' });
        doc.setTextColor(0, 0, 0);

        // School Address
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const addressLines = certificateData.schoolDetails.schoolAddress.split('\n');
        let addressY = 25;
        
        addressLines.forEach(line => {
          if (line.trim()) {
            doc.text(line.trim(), 105, addressY, { align: 'center' });
            addressY += 5;
          }
        });
        
        // City, State, Pincode
        if (certificateData.schoolDetails.city || certificateData.schoolDetails.state || certificateData.schoolDetails.pincode) {
          const locationInfo = [
            certificateData.schoolDetails.city,
            certificateData.schoolDetails.state,
            certificateData.schoolDetails.pincode
          ].filter(Boolean).join(', ');
          
          if (locationInfo) {
            doc.text(locationInfo, 105, addressY, { align: 'center' });
            addressY += 10;
          }
        }
        
        yPosition = addressY + 5;
      } else {
        // Fallback to generic header if no school details
        doc.setFontSize(20);
        doc.text("SCHOOL MANAGEMENT SYSTEM", 105, 20, { align: 'center' });
        yPosition = 30;
      }
      
      // Add certificate title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(11, 61, 123);
      doc.text("EXPERIENCE CERTIFICATE", 105, yPosition, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      yPosition += 20;
      
      // Add decorative line
      doc.setLineWidth(0.5);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 20;
      
      // Add certificate text
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      
      // Split the certificate text into lines that fit the page width
      const splitText = doc.splitTextToSize(certificateData.certificateText, 170);
      doc.text(splitText, 20, yPosition);
      yPosition += (splitText.length * 7) + 15;
      
      // Add staff details section
      doc.setFont("helvetica", "bold");
      doc.text("STAFF DETAILS:", 20, yPosition);
      yPosition += 10;
      
      doc.setFont("helvetica", "normal");
      doc.text(`Staff Code: `, 25, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(certificateData.staffCode, 55, yPosition);
      yPosition += 7;
      
      doc.setFont("helvetica", "normal");
      doc.text(`Name: `, 25, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(certificateData.staffName, 45, yPosition);
      yPosition += 7;
      
      doc.setFont("helvetica", "normal");
      doc.text(`Designation: `, 25, yPosition);
      doc.setFont("helvetica", "bold");
      doc.text(certificateData.designation, 55, yPosition);
      yPosition += 7;
      
      if (certificateData.staffDetails) {
        doc.setFont("helvetica", "normal");
        doc.text(`Education Qualification: ${certificateData.staffDetails.educationQualification}`, 25, yPosition);
        yPosition += 7;
        doc.text(`Mobile Number: ${certificateData.staffDetails.mobileNumber}`, 25, yPosition);
        yPosition += 7;
      }
      
      doc.text(`Period of Service: ${certificateData.fromDate} to ${certificateData.toDate}`, 25, yPosition);
      yPosition += 7;
      
      doc.text(`Academic Year: ${certificateData.academicYear}`, 25, yPosition);
      yPosition += 15;
      
      // Add performance remarks
      doc.setFont("helvetica", "bold");
      doc.text("PERFORMANCE REMARKS:", 20, yPosition);
      yPosition += 10;
      
      doc.setFont("helvetica", "normal");
      const remarks = "The staff member has shown excellent performance, dedication, and commitment towards their duties. We wish them all the best for their future endeavors.";
      const splitRemarks = doc.splitTextToSize(remarks, 170);
      doc.text(splitRemarks, 25, yPosition);
      yPosition += (splitRemarks.length * 7) + 20;
      
      // Add footer with date and signature
      doc.setFont("helvetica", "normal");
      doc.text(`Date: ${certificateData.issuedDate}`, 20, yPosition);
      yPosition += 20;
      
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
      const fileName = `Experience_Certificate_${certificateData.staffCode}_${certificateData.staffName.replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      toast.error("Failed to generate PDF certificate. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Filter unique staff codes for dropdown
  const uniqueStaffCodes = [...new Set(staffList.map(staff => staff.staffCode))];

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
                <span className="current">Experience Certificate</span>
              </nav>

              <div className="form-card mt-3">
                {/* Header */}
                <div className="header p-3" style={{ backgroundColor: "#0B3D7B", color: "#fff" }}>
                  <h2 className="m-0">Experience Certificate</h2>
                </div>

                {/* Form Content */}
                <div className="content-wrapper p-4">
                  {isLoading && (
                    <div className="text-center mb-3">
                      <Spinner animation="border" role="status" variant="primary" />
                      <p className="mt-2">Loading staff data...</p>
                    </div>
                  )}

                  <Form onSubmit={handleSubmit}>
                    <Row className="mb-4">
                      <Col lg={4} xs={12} md={6}>
                        <Form.Group>
                          <Form.Label>Enter Staff Code</Form.Label>
                          <InputGroup>
                            <Form.Control
                              as="select"
                              value={staffCode}
                              onChange={handleStaffCodeChange}
                              className="custom-input"
                              disabled={isLoading}
                              style={{ borderRight: "none" }}
                            >
                              <option value="">Select Staff Code</option>
                              {uniqueStaffCodes.map((staffCode) => (
                                <option key={staffCode} value={staffCode}>
                                  {staffCode}
                                </option>
                              ))}
                            </Form.Control>
                            <InputGroup.Text style={{ backgroundColor: "#fff", borderLeft: "none", cursor: "pointer" }}>
                              <span style={{ userSelect: "none" }}>▼</span>
                            </InputGroup.Text>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                      <Col lg={4} xs={12} md={6}>
                        <Form.Group>
                          <Form.Label>Candidate Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={candidateName}
                            className="custom-input"
                            disabled={true}
                            style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}
                            placeholder="Name will appear when staff code is selected"
                          />
                        </Form.Group>
                      </Col>
                      <Col lg={4} xs={12} md={6}>
                        <Form.Group>
                          <Form.Label>Designation</Form.Label>
                          <Form.Control
                            type="text"
                            value={designation}
                            className="custom-input"
                            disabled={true}
                            style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}
                            placeholder="Designation will appear when staff code is selected"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mb-4">
                      <Col lg={6} xs={12} md={6}>
                        <Form.Group>
                          <Form.Label>From Date</Form.Label>
                          <Form.Control
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="custom-input"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col lg={6} xs={12} md={6}>
                        <Form.Group>
                          <Form.Label>To Date</Form.Label>
                          <Form.Control
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="custom-input"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {selectedStaff && (
                      <Row className="mb-4">
                        <Col xs={12}>
                          <div className="mt-2 p-2 border rounded" style={{ backgroundColor: '#f0f8ff' }}>
                            <small>
                              <strong>Staff Details:</strong><br />
                              Date of Joining: {selectedStaff.dateOfJoining}<br />
                              Date of Relieve: {selectedStaff.dateOfRelieve || 'Still Working'}<br />
                              Education: {selectedStaff.educationQualification}<br />
                              Mobile: {selectedStaff.mobileNumber}
                            </small>
                          </div>
                        </Col>
                      </Row>
                    )}

                    <Row className="mb-4">
                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label>Certificate Text</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={4}
                            value={certifyText}
                            onChange={(e) => setCertifyText(e.target.value)}
                            className="custom-input"
                          />
                          <Form.Text className="text-muted">
                            You can edit this text as needed
                          </Form.Text>
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

export default ExperienceCertificate;