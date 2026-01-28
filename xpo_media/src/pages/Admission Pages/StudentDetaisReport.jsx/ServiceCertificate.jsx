"use client"

import React, { useState, useEffect } from "react"
import { Container, Form, Button, Card, Row, Col } from "react-bootstrap"
import MainContentPage from "../../../components/MainContent/MainContentPage"
import { Link } from "react-router-dom"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import jsPDF from "jspdf"
import { useAuthContext } from "../../../Context/AuthContext"
import { ENDPOINTS } from "../../../SpringBoot/config"

const ServiceCertificate = () => {
  const { schoolId, currentAcademicYear, getAuthHeaders } = useAuthContext()
  const [staffData, setStaffData] = useState([])
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [loading, setLoading] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState({ name: "", address: "" })
  const [manualStaffCode, setManualStaffCode] = useState("")

  // Fetch school details
  useEffect(() => {
    const fetchSchoolInfo = async () => {
      try {
        if (!schoolId) return

        const response = await fetch(
          `${ENDPOINTS.admissionmaster}/school/school-details?schoolId=${schoolId}`,
          {
            method: "GET",
            headers: getAuthHeaders(),
          }
        )

        if (!response.ok) {
          throw new Error("Failed to fetch school information")
        }

        const data = await response.json()
        setSchoolInfo({
          name: data.schoolName || "",
          address: `${data.schoolAddress || ""}, ${data.city || ""}, ${data.state || ""} - ${data.pincode || ""}`,
        })
      } catch (error) {
        console.error("Error fetching school information:", error)
        toast.error("Failed to fetch school information")
      }
    }

    fetchSchoolInfo()
  }, [schoolId, getAuthHeaders])

  // Fetch staff data
  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        if (!schoolId || !currentAcademicYear) return

        setLoading(true)
        const response = await fetch(
          `${ENDPOINTS.administration}/staff?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
          {
            method: "GET",
            headers: getAuthHeaders(),
          }
        )

        if (!response.ok) {
          throw new Error("Failed to fetch staff data")
        }

        const data = await response.json()
        setStaffData(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Error fetching staff data:", error)
        toast.error("Failed to fetch staff data")
        setStaffData([])
      } finally {
        setLoading(false)
      }
    }

    fetchStaffData()
  }, [schoolId, currentAcademicYear, getAuthHeaders])

  const handleStaffSelect = (staffCode) => {
    if (!staffCode) {
      setSelectedStaff(null)
      return
    }

    const staff = staffData.find(staff => staff.staffCode === staffCode)
    if (staff) {
      setSelectedStaff(staff)
      setManualStaffCode("") // Clear manual input when selecting from dropdown
      toast.success(`Staff ${staff.name || staff.candidateName} selected`)
    } else {
      toast.error("Staff not found")
      setSelectedStaff(null)
    }
  }

  const handleManualStaffCodeSubmit = () => {
    if (!manualStaffCode.trim()) {
      toast.error("Please enter a staff code")
      return
    }

    const staff = staffData.find(staff => 
      staff.staffCode.toLowerCase() === manualStaffCode.trim().toLowerCase()
    )
    
    if (staff) {
      setSelectedStaff(staff)
      toast.success(`Staff ${staff.name || staff.candidateName} found`)
    } else {
      toast.error("No staff found with this staff code")
      setSelectedStaff(null)
    }
  }

  const handlePrint = () => {
    const printContent = document.getElementById('certificate-content').innerHTML;
    const originalContent = document.body.innerHTML;
    
    // Create a print-specific document
    const printDocument = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Service Certificate - ${selectedStaff.staffCode}</title>
        <style>
          body {
            font-family: 'Times New Roman', Times, serif;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .certificate-print {
            border: 3px double #000;
            padding: 40px 30px;
            max-width: 800px;
            margin: 0 auto;
            background: white;
          }
          .school-header {
            text-align: center;
            margin-bottom: 30px;
          }
          .school-name {
            font-size: 28px;
            font-weight: bold;
            color: #0B3D7B;
            margin-bottom: 10px;
          }
          .school-address {
            font-size: 16px;
            color: #333;
            margin-bottom: 20px;
          }
          .certificate-title {
            font-size: 24px;
            font-weight: bold;
            color: #0B3D7B;
            text-decoration: underline;
            margin-bottom: 30px;
            text-align: center;
          }
          .certificate-body {
            font-size: 18px;
            line-height: 1.8;
            text-align: left;
          }
          .staff-details {
            font-weight: bold;
            color: #000;
          }
          .signature-section {
            margin-top: 60px;
            text-align: right;
          }
          .signature-line {
            border-top: 1px solid #000;
            width: 200px;
            margin-left: auto;
            margin-top: 40px;
          }
          @media print {
            body {
              padding: 0;
              margin: 0;
            }
            .certificate-print {
              border: 3px double #000 !important;
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="certificate-print">
          <div class="school-header">
            <div class="school-name">${schoolInfo.name}</div>
            <div class="school-address">${schoolInfo.address}</div>
          </div>
          
          <div class="certificate-title">SERVICE CERTIFICATE</div>
          
          <div class="certificate-body">
            <p><span class="staff-details">Staff Code: ${selectedStaff.staffCode}</span></p>
            
            <p>This is to certify that <span class="staff-details">${selectedStaff.name || selectedStaff.candidateName}</span></p>
            
            <p>holding the position of <span class="staff-details">${selectedStaff.designation}</span></p>
            
            <p>has been employed with our institution from 
            <span class="staff-details"> ${new Date(selectedStaff.dateOfJoining).toLocaleDateString()}</span> to 
            <span class="staff-details"> ${selectedStaff.dateOfRelieve ? new Date(selectedStaff.dateOfRelieve).toLocaleDateString() : "Present"}</span>
            </p>
            
            <p>His/Her Conduct and Performance are : _____________</p>
          </div>
          
          <div class="signature-section">
            <div class="signature-line"></div>
            <p>Signature of Principal</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printDocument);
    printWindow.document.close();
    
    printWindow.onload = function() {
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = function() {
        printWindow.close();
      };
    };
  }

  const downloadPDF = () => {
    if (!selectedStaff) return

    const doc = new jsPDF()
    
    // Set document properties
    doc.setProperties({
      title: `Service Certificate - ${selectedStaff.staffCode}`,
      subject: 'Service Certificate',
      author: schoolInfo.name,
      creator: schoolInfo.name
    })

    // Add border
    doc.setDrawColor(0, 59, 123) // Blue color
    doc.setLineWidth(1.5)
    doc.rect(10, 10, 190, 277) // A4 size border

    // School Header - Blue color
    doc.setFontSize(22)
    doc.setTextColor(11, 61, 123) // Blue color
    doc.setFont("helvetica", "bold")
    doc.text(schoolInfo.name, 105, 40, { align: "center" })
    
    doc.setFontSize(12)
    doc.setTextColor(51, 51, 51) // Dark gray
    doc.setFont("helvetica", "normal")
    doc.text(schoolInfo.address, 105, 50, { align: "center" })
    
    // Certificate Title - Blue color with underline
    doc.setFontSize(20)
    doc.setTextColor(11, 61, 123) // Blue color
    doc.setFont("helvetica", "bold")
    doc.text("SERVICE CERTIFICATE", 105, 75, { align: "center" })
    
    // Underline
    doc.setDrawColor(11, 61, 123) // Blue color
    doc.setLineWidth(0.5)
    doc.line(70, 78, 140, 78)

    // Certificate Content
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0) // Black color
    
    let yPosition = 100
    
    // Staff Code - Bold Black
    doc.setFont("helvetica", "bold")
    doc.text(`Staff Code: ${selectedStaff.staffCode}`, 20, yPosition)
    yPosition += 20
    
    // Certificate text with staff details in bold
    doc.setFont("helvetica", "normal")
    doc.text("This is to certify that", 20, yPosition)
    const nameWidth = doc.getTextWidth("This is to certify that")
    doc.setFont("helvetica", "bold")
    doc.text(` ${selectedStaff.name || selectedStaff.candidateName}`, 20 + nameWidth, yPosition)
    yPosition += 15
    
    doc.setFont("helvetica", "normal")
    doc.text("holding the position of", 20, yPosition)
    const positionWidth = doc.getTextWidth("holding the position of")
    doc.setFont("helvetica", "bold")
    doc.text(` ${selectedStaff.designation}`, 20 + positionWidth, yPosition)
    yPosition += 15
    
    doc.setFont("helvetica", "normal")
    doc.text("has been employed with our institution from", 20, yPosition)
    yPosition += 15
    
    const joiningDate = new Date(selectedStaff.dateOfJoining).toLocaleDateString()
    const relieveDate = selectedStaff.dateOfRelieve 
      ? new Date(selectedStaff.dateOfRelieve).toLocaleDateString()
      : "Present"
    
    doc.setFont("helvetica", "bold")
    doc.text(`${joiningDate} to ${relieveDate}`, 20, yPosition)
    yPosition += 25
    
    doc.setFont("helvetica", "normal")
    doc.text("His/Her Conduct and Performance are : _____________", 20, yPosition)
    yPosition += 40
    
    // Signature section
    doc.setFont("helvetica", "normal")
    doc.text("Signature of Principal", 150, yPosition)
    
    // Signature line
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.5)
    doc.line(140, yPosition + 5, 190, yPosition + 5)
    
    // School seal/logo area (optional)
    yPosition += 20
    doc.setFontSize(10)
    doc.setTextColor(128, 128, 128)
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, yPosition, { align: "center" })
    
    // Save PDF
    doc.save(`${selectedStaff.staffCode}_service_certificate.pdf`)
  }

  // Get unique staff codes for dropdown
  const staffCodes = [...new Set(staffData.map(staff => staff.staffCode))].filter(Boolean)

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <div className="mb-4">
          <nav className="custom-breadcrumb py-1 py-lg-3">
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <span>Certificates</span>
            <span className="separator mx-2">&gt;</span>
            <span>Service Certificate</span>
          </nav>
        </div>

        <div
          style={{ backgroundColor: "#0B3D7B" }}
          className="text-white p-3 rounded-top d-flex justify-content-between align-items-center"
        >
          <h2 className="mb-0">Service Certificate</h2>
        </div>

        <Card className="border-0">
          <Card.Body className="bg-white p-4">
            {/* Both Input Methods Displayed Simultaneously */}
            <Row className="mb-4 print:hidden">
              {/* Select Staff Code - Dropdown */}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Select Staff Code</Form.Label>
                  <Form.Select
                    onChange={(e) => handleStaffSelect(e.target.value)}
                    disabled={loading || staffCodes.length === 0}
                    className="form-select-lg"
                    value={selectedStaff?.staffCode || ""}
                  >
                    <option value="">Choose from list</option>
                    {staffCodes.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Enter Staff Code - Manual Input */}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Enter Staff Code</Form.Label>
                  <div className="d-flex">
                    <Form.Control
                      type="text"
                      placeholder="Type staff code here..."
                      value={manualStaffCode}
                      onChange={(e) => setManualStaffCode(e.target.value)}
                      disabled={loading}
                      className="form-control-lg me-2"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleManualStaffCodeSubmit()
                        }
                      }}
                    />
                    <Button
                      style={{ backgroundColor: "#0B3D7B", minWidth: "100px" }}
                      onClick={handleManualStaffCodeSubmit}
                      disabled={loading || !manualStaffCode.trim()}
                      className="form-control-lg"
                    >
                      Search
                    </Button>
                  </div>
                </Form.Group>
              </Col>
            </Row>

            {/* Loading and Status Messages */}
            {loading && (
              <div className="text-center text-muted mb-3 print:hidden">
                Loading staff data...
              </div>
            )}
            
            {!loading && staffCodes.length === 0 && (
              <div className="text-center text-muted mb-3 print:hidden">
                No staff data available
              </div>
            )}

            {/* Staff Information Display */}
            {selectedStaff && (
              <div className="staff-info mb-4 p-3 border rounded print:hidden">
                <h5 className="text-primary mb-3">Staff Information</h5>
                <Row>
                  <Col md={6}>
                    <p><strong>Name:</strong> {selectedStaff.name || selectedStaff.candidateName}</p>
                    <p><strong>Designation:</strong> {selectedStaff.designation}</p>
                    <p><strong>Date of Joining:</strong> {new Date(selectedStaff.dateOfJoining).toLocaleDateString()}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Staff Code:</strong> {selectedStaff.staffCode}</p>
                    <p><strong>Status:</strong> {selectedStaff.status || "Active"}</p>
                    {selectedStaff.dateOfRelieve && (
                      <p><strong>Date of Relieve:</strong> {new Date(selectedStaff.dateOfRelieve).toLocaleDateString()}</p>
                    )}
                  </Col>
                </Row>
              </div>
            )}

            {/* Certificate Preview */}
            {selectedStaff && (
              <>
                <div id="certificate-content" className="certificate-content text-center mt-4">
                  <div className="certificate-border p-4">
                    <h1 className="text-3xl font-bold mb-2" style={{ color: "#0B3D7B" }}>{schoolInfo.name}</h1>
                    <h2 className="text-xl mb-4">{schoolInfo.address}</h2>
                    <h3 className="text-2xl font-bold mb-6 underline" style={{ color: "#0B3D7B" }}>SERVICE CERTIFICATE</h3>

                    <div className="flex justify-between mb-6">
                      <p className="text-lg">
                        <strong>Staff Code:</strong> {selectedStaff.staffCode}
                      </p>
                    </div>

                    <p className="text-lg mb-4">
                      This is to certify that <strong>{selectedStaff.name || selectedStaff.candidateName}</strong>
                    </p>

                    <p className="text-lg mb-4">
                      holding the position of <strong>{selectedStaff.designation}</strong>
                    </p>

                    <p className="text-lg mb-4">
                      has been employed with our institution from{" "}
                      <strong>{new Date(selectedStaff.dateOfJoining).toLocaleDateString()}</strong> to{" "}
                      <strong>
                        {selectedStaff.dateOfRelieve 
                          ? new Date(selectedStaff.dateOfRelieve).toLocaleDateString()
                          : "Present"
                        }
                      </strong>
                    </p>

                    <p className="text-lg mb-8">His/Her Conduct and Performance are : _____________</p>

                    <div className="text-right mt-12">
                      <div className="border-top border-dark d-inline-block" style={{ width: "200px" }}></div>
                      <p className="text-lg mt-2">Signature of Principal</p>
                    </div>
                  </div>
                </div>

                <div className="button-container mt-4 print:hidden">
                  <Button
                    style={{ backgroundColor: "#0B3D7B" }}
                    onClick={handlePrint}
                    disabled={loading}
                    className="me-2 mb-2 mb-md-0"
                  >
                    Print Certificate
                  </Button>
                  <Button
                    style={{ backgroundColor: "#28A745" }}
                    onClick={downloadPDF}
                    disabled={loading}
                    className="me-2 mb-2 mb-md-0"
                  >
                    Download PDF
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => {
                      setSelectedStaff(null)
                      setManualStaffCode("")
                    }}
                    className="me-2 mb-2 mb-md-0"
                  >
                    Clear Selection
                  </Button>
                </div>
              </>
            )}

            {/* No Staff Selected Message */}
            {!selectedStaff && !loading && staffCodes.length > 0 && (
              <div className="text-center text-muted mt-4 print:hidden">
                Please select or enter a staff code to generate certificate
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>

      <style>
        {`
          .custom-breadcrumb {
            padding: 0.5rem 1rem;
          }

          .custom-breadcrumb a {
            color: #0B3D7B;
            text-decoration: none;
          }

          .custom-breadcrumb .separator {
            margin: 0 0.5rem;
            color: #6c757d;
          }

          .form-select-lg, .form-control-lg {
            height: 45px;
            font-size: 1rem;
          }

          .certificate-content {
            font-family: 'Times New Roman', Times, serif;
          }

          .certificate-border {
            border: 3px double #000;
            border-radius: 15px;
            padding: 40px 30px;
            max-width: 800px;
            margin: 0 auto;
            background: linear-gradient(white, white 40px, #f0f8ff 40px, #f0f8ff 41px, white 41px);
            background-size: 100% 41px;
          }

          .button-container {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
          }

          .staff-info {
            background-color: #f8f9fa;
            border-left: 4px solid #0B3D7B !important;
          }

          @media print {
            body * {
              visibility: hidden;
            }
            #certificate-content,
            #certificate-content * {
              visibility: visible;
            }
            #certificate-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 20px;
            }
            .certificate-border {
              border: 3px double #000 !important;
              box-shadow: none !important;
              margin: 0 auto;
            }
          }

          @media (max-width: 767px) {
            .button-container {
              flex-direction: column;
            }
            .button-container .btn {
              margin-right: 0 !important;
              margin-bottom: 0.5rem;
              width: 100%;
            }
            .button-container .btn:last-child {
              margin-bottom: 0;
            }
          }
        `}
      </style>
      <ToastContainer />
    </MainContentPage>
  )
}

export default ServiceCertificate