"use client"

import React, { useState, useEffect } from "react"
import { Container, Form, Button, Card, Row, Col } from "react-bootstrap"
import { useAuthContext } from "../../../Context/AuthContext"
import { ENDPOINTS } from "../../../SpringBoot/config"
import MainContentPage from "../../../components/MainContent/MainContentPage"
import { Link } from "react-router-dom"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { jsPDF } from "jspdf"

const StudyCertificate = () => {
  const [students, setStudents] = useState([])
  const [admissionNumbers, setAdmissionNumbers] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState({ 
    schoolName: "School Name", 
    schoolAddress: "School Address, City, State - Pincode" 
  })
  const [manualAdmissionNumber, setManualAdmissionNumber] = useState("")
  const [selectedAdmissionNumber, setSelectedAdmissionNumber] = useState("")

  const { schoolId, currentAcademicYear, getAuthHeaders } = useAuthContext()

  useEffect(() => {
    if (schoolId) {
      fetchAllStudents()
      fetchSchoolDetails()
    }
  }, [schoolId, currentAcademicYear])

  const fetchSchoolDetails = async () => {
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/school/school-details?schoolId=${schoolId}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      )

      if (response.ok) {
        const schoolData = await response.json()
        setSchoolInfo({
          schoolName: schoolData.schoolName || "School Name",
          schoolAddress: formatSchoolAddress(schoolData)
        })
      } else {
        // Fallback to default school info if API fails
        setSchoolInfo({
          schoolName: "Your School Name",
          schoolAddress: "Your School Address, City, State - Pincode"
        })
      }
    } catch (error) {
      console.error("Error fetching school details:", error)
      // Fallback to default school info
      setSchoolInfo({
        schoolName: "Your School Name",
        schoolAddress: "Your School Address, City, State - Pincode"
      })
    }
  }

  const formatSchoolAddress = (schoolData) => {
    const addressParts = []
    if (schoolData.schoolAddress) addressParts.push(schoolData.schoolAddress)
    if (schoolData.city) addressParts.push(schoolData.city)
    if (schoolData.state) addressParts.push(schoolData.state)
    if (schoolData.pincode) addressParts.push(schoolData.pincode)
    
    return addressParts.join(", ") || "School Address"
  }

  const fetchAllStudents = async () => {
    setLoading(true)
    try {
      if (!schoolId || !currentAcademicYear) {
        toast.error("School ID or Academic Year not available")
        setLoading(false)
        return
      }

      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/studentreport/datas?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch students data")
      }

      const studentsData = await response.json()
      setStudents(studentsData)
      
      // Extract admission numbers
      const numbers = studentsData.map(student => student.admissionNumber).filter(Boolean)
      setAdmissionNumbers(numbers)
    } catch (error) {
      console.error("Error fetching students:", error)
      toast.error("Failed to fetch student data")
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentData = async (admissionNumber) => {
    if (!admissionNumber) return

    setLoading(true)
    try {
      // Find student from the already fetched students data
      const student = students.find(student => student.admissionNumber === admissionNumber)

      if (student) {
        setSelectedStudent(student)
        toast.success(`Student ${student.studentName} found!`)
      } else {
        toast.error("No student found with this admission number")
        setSelectedStudent(null)
      }
    } catch (error) {
      console.error("Error fetching student data:", error)
      toast.error("Failed to fetch student data")
      setSelectedStudent(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDropdownChange = (e) => {
    const admissionNumber = e.target.value
    setSelectedAdmissionNumber(admissionNumber)
    setManualAdmissionNumber("") // Clear manual input when dropdown is used
    if (admissionNumber) {
      fetchStudentData(admissionNumber)
    } else {
      setSelectedStudent(null)
    }
  }

  const handleManualInputChange = (e) => {
    setManualAdmissionNumber(e.target.value)
    setSelectedAdmissionNumber("") // Clear dropdown when manual input is used
  }

  const handleManualSearch = () => {
    if (manualAdmissionNumber.trim()) {
      fetchStudentData(manualAdmissionNumber.trim())
    } else {
      toast.error("Please enter an admission number")
    }
  }

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleManualSearch()
    }
  }

  const handleClearSearch = () => {
    setSelectedAdmissionNumber("")
    setManualAdmissionNumber("")
    setSelectedStudent(null)
  }

  const handlePrint = () => {
    if (!selectedStudent) return

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Study Certificate - ${selectedStudent.admissionNumber}</title>
        <style>
          @media print {
            @page {
              margin: 20mm;
              size: A4;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Times New Roman', serif;
              background: white;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 40px;
            background: white;
          }
          .certificate-container {
            border: 3px solid #0B3D7B;
            border-radius: 15px;
            padding: 50px;
            max-width: 800px;
            margin: 0 auto;
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
            page-break-inside: avoid;
          }
          .school-header {
            text-align: center;
            margin-bottom: 30px;
          }
          .school-name {
            color: #0B3D7B;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .school-address {
            color: #000;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .certificate-title {
            color: #0B3D7B;
            font-size: 24px;
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 30px;
          }
          .student-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            font-size: 16px;
          }
          .certificate-content {
            text-align: left;
            font-size: 18px;
            line-height: 1.8;
            margin-bottom: 30px;
          }
          .signature-area {
            text-align: right;
            margin-top: 50px;
            position: relative;
          }
          .principal-signature {
            font-weight: bold;
            font-size: 16px;
          }
          .school-seal {
            border: 2px dashed #000;
            width: 120px;
            height: 60px;
            position: absolute;
            left: 20px;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: #666;
          }
          .student-name {
            font-size: 22px;
            font-weight: bold;
          }
          .highlight {
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <div class="school-header">
            <div class="school-name">${schoolInfo.schoolName}</div>
            <div class="school-address">${schoolInfo.schoolAddress}</div>
            <div class="certificate-title">BONAFIDE CERTIFICATE</div>
          </div>

          <div class="student-details">
            <div><strong>Admission No.:</strong> ${selectedStudent.admissionNumber || "N/A"}</div>
            <div><strong>EMIS No.:</strong> ${selectedStudent.emis || "N/A"}</div>
          </div>

          <div class="certificate-content">
            <p>This is to certify that <strong>${selectedStudent.gender === "Female" ? "Selvi" : "Selvan"}</strong></p>
            
            <p class="student-name">${selectedStudent.studentName}</p>
            
            <p>S/O/D/O <span class="highlight">${selectedStudent.fatherName}</span> is a bonafide student of our school studying in</p>
            
            <p><span class="highlight">${selectedStudent.standard}</span></p>
            
            <p>during the academic year <span class="highlight">${currentAcademicYear}</span>. His/Her Date of Birth is</p>
            
            <p><span class="highlight">${formatDate(selectedStudent.dateOfBirth)}</span> as per school records.</p>
            
            <p style="margin-top: 30px;">His/Her Conduct and Character are: _____________</p>
          </div>

          <div class="signature-area">
            <div class="school-seal">School Seal</div>
            <div class="principal-signature">Signature of Principal</div>
          </div>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    printWindow.document.write(printContent)
    printWindow.document.close()
    
    // Wait for content to load before printing
    printWindow.onload = function() {
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()
        // Don't close immediately to allow user to see print dialog
      }, 500)
    }
  }

  const downloadPDF = () => {
    if (!selectedStudent) return

    try {
      const doc = new jsPDF()
      
      // Set fonts and colors
      doc.setFont("helvetica", "normal")
      
      // School Header
      doc.setFontSize(18)
      doc.setTextColor(0, 0, 128)
      doc.text(schoolInfo.schoolName, 105, 25, { align: "center" })
      
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text(schoolInfo.schoolAddress, 105, 35, { align: "center" })
      
      // Certificate Title
      doc.setFontSize(20)
      doc.setTextColor(0, 0, 128)
      doc.text("BONAFIDE CERTIFICATE", 105, 55, { align: "center" })
      doc.setDrawColor(0, 0, 128)
      doc.line(70, 58, 140, 58) // Underline

      // Student Details
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text(`Admission No.: ${selectedStudent.admissionNumber || "N/A"}`, 20, 75)
      doc.text(`EMIS No.: ${selectedStudent.emis || "N/A"}`, 150, 75)

      // Certificate Content
      const lineHeight = 10
      let yPosition = 95

      doc.text(`This is to certify that ${selectedStudent.gender === "Female" ? "Selvi" : "Selvan"}`, 20, yPosition)
      yPosition += lineHeight
      
      doc.setFont("helvetica", "bold")
      doc.text(`${selectedStudent.studentName}`, 20, yPosition)
      doc.setFont("helvetica", "normal")
      yPosition += lineHeight
      
      doc.text(`S/O/D/O ${selectedStudent.fatherName}`, 20, yPosition)
      yPosition += lineHeight
      
      doc.text(`is a bonafide student of our school studying in`, 20, yPosition)
      yPosition += lineHeight
      
      doc.setFont("helvetica", "bold")
      doc.text(`${selectedStudent.standard}`, 20, yPosition)
      doc.setFont("helvetica", "normal")
      yPosition += lineHeight
      
      doc.text(`during the academic year ${currentAcademicYear}. His/Her Date of Birth is`, 20, yPosition)
      yPosition += lineHeight
      
      const dob = selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : "N/A"
      doc.setFont("helvetica", "bold")
      doc.text(`${dob}`, 20, yPosition)
      doc.setFont("helvetica", "normal")
      yPosition += lineHeight
      
      doc.text(`as per school records.`, 20, yPosition)
      yPosition += lineHeight * 2
      
      doc.text(`His/Her Conduct and Character are: _____________`, 20, yPosition)
      yPosition += lineHeight * 3
      
      // Signature
      doc.text("Signature of Principal", 150, yPosition)
      
      // School Seal/Stamp area
      doc.setDrawColor(200, 200, 200)
      doc.rect(20, yPosition - 10, 40, 20)
      doc.setFontSize(8)
      doc.text("School Seal", 40, yPosition, { align: "center" })

      doc.save(`${selectedStudent.admissionNumber}_Study_Certificate_${currentAcademicYear}.pdf`)
      toast.success("PDF certificate downloaded successfully")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Failed to generate PDF certificate")
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch (error) {
      return "N/A"
    }
  }

  if (!schoolId) {
    return (
      <MainContentPage>
        <Container fluid className="px-0">
          <div className="text-center py-5">
            <h4>School ID not available. Please check your authentication.</h4>
          </div>
        </Container>
      </MainContentPage>
    )
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <div className="mb-4">
          <nav className="custom-breadcrumb py-1 py-lg-3">
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <span>Certificates</span>
            <span className="separator mx-2">&gt;</span>
            <span>Study Certificate</span>
          </nav>
        </div>

        <div
          style={{ backgroundColor: "#0B3D7B" }}
          className="text-white p-3 rounded-top d-flex justify-content-between align-items-center"
        >
          <div className="d-flex align-items-center">
            <h2 className="mb-0">Study Certificate</h2>
            <span className="ms-3 badge bg-light text-dark">
              {schoolId} | {currentAcademicYear}
            </span>
          </div>
        </div>

        <Card className="border-0">
          <Card.Body className="bg-white p-4">
            <Form className="mb-4 d-print-none">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Select Admission Number</Form.Label>
                    <Form.Select
                      value={selectedAdmissionNumber}
                      onChange={handleDropdownChange}
                      disabled={loading || admissionNumbers.length === 0}
                      className="form-select-lg"
                    >
                      <option value="">Select from list</option>
                      {admissionNumbers.map((num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </Form.Select>
                    {admissionNumbers.length === 0 && !loading && (
                      <Form.Text className="text-muted">
                        No students found for the current academic year.
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Enter Admission Number</Form.Label>
                    <div className="d-flex">
                      <Form.Control
                        type="text"
                        value={manualAdmissionNumber}
                        onChange={handleManualInputChange}
                        onKeyDown={handleInputKeyDown}
                        placeholder="Enter admission number manually"
                        disabled={loading}
                        className="form-control-lg me-2"
                      />
                      <Button
                        variant="primary"
                        onClick={handleManualSearch}
                        disabled={loading || !manualAdmissionNumber.trim()}
                        style={{ minWidth: '100px' }}
                      >
                        {loading ? "..." : "Search"}
                      </Button>
                    </div>
                  </Form.Group>
                </Col>
              </Row>
              
              {(selectedAdmissionNumber || manualAdmissionNumber) && (
                <div className="text-center mt-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleClearSearch}
                  >
                    Clear Search
                  </Button>
                </div>
              )}
            </Form>

            {loading && (
              <div className="text-center py-4 d-print-none">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <div className="mt-2">Loading student data...</div>
              </div>
            )}

            {selectedStudent && (
              <>
                {/* Preview Certificate (Hidden in Print) */}
                <div className="certificate-content text-center mt-4 d-print-none">
                  <div className="certificate-border p-4 position-relative">
                    {/* School Header */}
                    <div className="mb-4">
                      <h1 className="text-primary fw-bold mb-2" style={{ fontSize: "2rem" }}>
                        {schoolInfo.schoolName}
                      </h1>
                      <h2 className="text-dark mb-4" style={{ fontSize: "1.2rem" }}>
                        {schoolInfo.schoolAddress}
                      </h2>
                      <h3 className="text-primary fw-bold mb-4" style={{ fontSize: "1.8rem", textDecoration: "underline" }}>
                        BONAFIDE CERTIFICATE
                      </h3>
                    </div>

                    {/* Student Details */}
                    <div className="d-flex justify-content-between mb-4">
                      <p className="text-start fs-5">
                        <strong>Admission No.:</strong> {selectedStudent.admissionNumber || "N/A"}
                      </p>
                      <p className="text-end fs-5">
                        <strong>EMIS No.:</strong> {selectedStudent.emis || "N/A"}
                      </p>
                    </div>

                    {/* Certificate Content */}
                    <div className="text-start fs-5 lh-lg">
                      <p className="mb-3">
                        This is to certify that <strong>{selectedStudent.gender === "Female" ? "Selvi" : "Selvan"}</strong>
                      </p>
                      
                      <p className="mb-3">
                        <strong className="fs-4">{selectedStudent.studentName}</strong>
                      </p>
                      
                      <p className="mb-3">
                        S/O/D/O <strong>{selectedStudent.fatherName}</strong> is a bonafide student of our school studying in
                      </p>
                      
                      <p className="mb-3">
                        <strong className="fs-5">{selectedStudent.standard}</strong>
                      </p>
                      
                      <p className="mb-3">
                        during the academic year <strong>{currentAcademicYear}</strong>. His/Her Date of Birth is
                      </p>
                      
                      <p className="mb-3">
                        <strong>{formatDate(selectedStudent.dateOfBirth)}</strong> as per school records.
                      </p>
                      
                      <p className="mb-3 mt-4">
                        His/Her Conduct and Character are: _____________
                      </p>
                    </div>

                    {/* Signature */}
                    <div className="text-end mt-5 position-relative">
                      <div className="signature-area">
                        <p className="fs-5 fw-bold mb-1">Signature of Principal</p>
                        <div className="school-seal" style={{ 
                          border: "2px dashed #ccc", 
                          width: "120px", 
                          height: "60px", 
                          position: "absolute", 
                          left: "20px", 
                          bottom: "0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.8rem",
                          color: "#666"
                        }}>
                          School Seal
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="button-container mt-4 d-print-none">
                  <Button
                    style={{ backgroundColor: "#0B3D7B", borderColor: "#0B3D7B" }}
                    onClick={handlePrint}
                    size="lg"
                    className="me-3 mb-2"
                  >
                    Print Certificate
                  </Button>
                  <Button
                    style={{ backgroundColor: "#28A745", borderColor: "#28A745" }}
                    onClick={downloadPDF}
                    size="lg"
                    className="mb-2"
                  >
                    Download PDF
                  </Button>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      </Container>

      <ToastContainer />
    </MainContentPage>
  )
}

export default StudyCertificate