"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap"
import { Link } from "react-router-dom"
import { useAuthContext } from "../../../Context/AuthContext"
import MainContentPage from "../../../components/MainContent/MainContentPage"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import { Printer, Download, FileSpreadsheet } from "lucide-react"
import defaultStudentPhoto from "../../../images/StudentProfileIcon/studentProfile.jpeg"
import { ENDPOINTS } from "../../../SpringBoot/config"

const IndividualFullView = () => {
  const [studentData, setStudentData] = useState(null)
  const [allStudents, setAllStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [admissionNumbers, setAdmissionNumbers] = useState([])
  const [selectedAdmissionNumber, setSelectedAdmissionNumber] = useState("")
  const [manualAdmissionNumber, setManualAdmissionNumber] = useState("")
  const { schoolId, currentAcademicYear, getAuthHeaders } = useAuthContext()

  // Fetch all students data
  useEffect(() => {
    const fetchAllStudents = async () => {
      if (!schoolId || !currentAcademicYear) return

      try {
        setLoading(true)
        const response = await fetch(
          `${ENDPOINTS.admissionmaster}/admission/school/${schoolId}?academicYear=${currentAcademicYear}`,
          {
            headers: getAuthHeaders()
          }
        )

        if (!response.ok) {
          throw new Error("Failed to fetch students data")
        }

        const students = await response.json()
        setAllStudents(students)
        
        // Extract admission numbers
        const numbers = students.map(student => student.admissionNumber).filter(Boolean)
        setAdmissionNumbers(numbers)
      } catch (error) {
        console.error("Error fetching students:", error)
        toast.error("Failed to fetch students data")
      } finally {
        setLoading(false)
      }
    }

    fetchAllStudents()
  }, [schoolId, currentAcademicYear, getAuthHeaders])

  // Find student by admission number from local data
  const findStudentByAdmissionNumber = (admissionNumber) => {
    return allStudents.find(student => student.admissionNumber === admissionNumber)
  }

  const fetchStudentData = async (admissionNumber) => {
    if (!admissionNumber) return

    setLoading(true)
    try {
      // First try to find in local data
      const student = findStudentByAdmissionNumber(admissionNumber)
      
      if (student) {
        // Fetch photo if available
        if (student.id) {
          try {
            const photoResponse = await fetch(
              `${ENDPOINTS.admissionmaster}/admission/${student.id}/photo?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
              {
                headers: getAuthHeaders()
              }
            )
            
            if (photoResponse.ok) {
              const photoBlob = await photoResponse.blob()
              const photoUrl = URL.createObjectURL(photoBlob)
              setStudentData({
                ...student,
                studentPhoto: photoUrl
              })
            } else {
              setStudentData(student)
            }
          } catch (photoError) {
            console.error("Error fetching student photo:", photoError)
            setStudentData(student)
          }
        } else {
          setStudentData(student)
        }
      } else {
        toast.error("Student not found")
        setStudentData(null)
      }
    } catch (error) {
      console.error("Error fetching student data:", error)
      toast.error("Failed to fetch student data")
      setStudentData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleAdmissionNumberChange = (e) => {
    const admissionNumber = e.target.value
    setSelectedAdmissionNumber(admissionNumber)
    if (admissionNumber) {
      fetchStudentData(admissionNumber)
    }
  }

  const handleManualAdmissionNumberChange = (e) => {
    setManualAdmissionNumber(e.target.value)
  }

  const handleManualSearch = () => {
    if (manualAdmissionNumber) {
      fetchStudentData(manualAdmissionNumber)
    }
  }

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleManualSearch()
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=600')
    
    // Create a clean HTML for printing with image and details in single layout
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student Details - ${studentData.admissionNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              font-family: 'Arial', sans-serif; 
              margin: 0;
              padding: 15px;
              color: #000;
              line-height: 1.4;
              background: white;
            }
            .print-container {
              width: 100%;
              max-width: 100%;
            }
            .print-header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 3px solid #0B3D7B;
              padding-bottom: 10px;
            }
            .print-header h2 {
              color: #0B3D7B;
              margin: 0 0 5px 0;
              font-size: 20px;
            }
            .print-header p {
              color: #666;
              margin: 0;
              font-size: 12px;
            }
            .student-content {
              display: flex;
              gap: 20px;
              margin-bottom: 10px;
            }
            .student-photo-section {
              flex: 0 0 120px;
              text-align: center;
            }
            .student-photo-print {
              width: 100px;
              height: 120px;
              object-fit: cover;
              border: 2px solid #0B3D7B;
              border-radius: 4px;
            }
            .student-details {
              flex: 1;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
            }
            .details-section {
              margin-bottom: 0;
            }
            .detail-item {
              font-size: 11px;
              line-height: 1.3;
              margin-bottom: 4px;
              word-wrap: break-word;
              page-break-inside: avoid;
            }
            .detail-item strong {
              color: #0B3D7B;
              display: inline-block;
              min-width: 100px;
              font-size: 11px;
            }
            .section-title {
              grid-column: 1 / -1;
              color: #0B3D7B;
              font-weight: bold;
              font-size: 12px;
              margin: 8px 0 4px 0;
              border-bottom: 1px solid #ddd;
              padding-bottom: 2px;
            }
            @media print {
              body { 
                margin: 10px;
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .print-header {
                margin-bottom: 15px;
              }
              .student-content {
                page-break-inside: avoid;
              }
            }
            @page {
              margin: 10mm;
              size: A4 portrait;
            }
          </style>
        </head>
        <body onload="window.print();">
          <div class="print-container">
            <div class="print-header">
              <h2>STUDENT DETAILS - ADMISSION NO: ${studentData.admissionNumber}</h2>
              <p>Report Generated on: ${new Date().toLocaleDateString("en-US", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}</p>
            </div>
            <div class="student-content">
              <div class="student-photo-section">
                <img src="${studentData.studentPhoto || defaultStudentPhoto}" alt="Student Photo" class="student-photo-print" 
                  onerror="this.src='${defaultStudentPhoto}'" />
              </div>
              <div class="student-details">
                <div class="section-title">Personal Information</div>
                
                <div class="detail-item"><strong>Admission No:</strong> ${studentData.admissionNumber || 'N/A'}</div>
                <div class="detail-item"><strong>Exam No:</strong> ${studentData.examNumber || 'N/A'}</div>
                <div class="detail-item"><strong>Student Name:</strong> ${studentData.studentName || 'N/A'}</div>
                <div class="detail-item"><strong>Father Name:</strong> ${studentData.fatherName || 'N/A'}</div>
                <div class="detail-item"><strong>Mother Name:</strong> ${studentData.motherName || 'N/A'}</div>
                <div class="detail-item"><strong>Date of Birth:</strong> ${studentData.dateOfBirth || 'N/A'}</div>
                <div class="detail-item"><strong>Gender:</strong> ${studentData.gender || 'N/A'}</div>
                <div class="detail-item"><strong>Blood Group:</strong> ${studentData.bloodGroup || 'N/A'}</div>
                
                <div class="section-title">Academic Information</div>
                
                <div class="detail-item"><strong>Standard:</strong> ${studentData.standard || 'N/A'}</div>
                <div class="detail-item"><strong>Section:</strong> ${studentData.section || 'N/A'}</div>
                <div class="detail-item"><strong>Entry Date:</strong> ${studentData.dateOfAdmission || 'N/A'}</div>
                <div class="detail-item"><strong>Student Type:</strong> ${studentData.studentType || 'N/A'}</div>
                <div class="detail-item"><strong>Student Category:</strong> ${studentData.studentCategory || 'N/A'}</div>
                <div class="detail-item"><strong>EMIS:</strong> ${studentData.emis || 'N/A'}</div>
                
                <div class="section-title">Contact Information</div>
                
                <div class="detail-item"><strong>Address:</strong> ${studentData.streetVillage || ''}, ${studentData.placePincode || ''}</div>
                <div class="detail-item"><strong>District:</strong> ${studentData.district || 'N/A'}</div>
                <div class="detail-item"><strong>State:</strong> ${studentData.state || 'N/A'}</div>
                <div class="detail-item"><strong>Phone/Mobile:</strong> ${studentData.phoneNumber || 'N/A'}</div>
                <div class="detail-item"><strong>Email:</strong> ${studentData.emailId || 'N/A'}</div>
                
                <div class="section-title">Family & Background</div>
                
                <div class="detail-item"><strong>Religion:</strong> ${studentData.religion || 'N/A'}</div>
                <div class="detail-item"><strong>Nationality:</strong> ${studentData.nationality || 'N/A'}</div>
                <div class="detail-item"><strong>Community:</strong> ${studentData.community || 'N/A'}</div>
                <div class="detail-item"><strong>Caste:</strong> ${studentData.caste || 'N/A'}</div>
                <div class="detail-item"><strong>Mother Tongue:</strong> ${studentData.motherTongue || 'N/A'}</div>
                <div class="detail-item"><strong>Father Occupation:</strong> ${studentData.fatherOccupation || 'N/A'}</div>
                <div class="detail-item"><strong>Mother Occupation:</strong> ${studentData.motherOccupation || 'N/A'}</div>
                
                <div class="section-title">Transport & Other Details</div>
                
                <div class="detail-item"><strong>Bus Route No:</strong> ${studentData.busRouteNumber || 'N/A'}</div>
                <div class="detail-item"><strong>Boarding Point:</strong> ${studentData.boardingPoint || 'N/A'}</div>
                <div class="detail-item"><strong>Bus Fee:</strong> ${studentData.busFee || 'N/A'}</div>
                <div class="detail-item"><strong>Lunch/Refresh:</strong> ${studentData.lunchRefresh || 'N/A'}</div>
                <div class="detail-item"><strong>Old School Name:</strong> ${studentData.nameOfSchool || 'N/A'}</div>
                <div class="detail-item"><strong>Old Standard:</strong> ${studentData.classLastStudied || 'N/A'}</div>
                <div class="detail-item"><strong>Admitted Class:</strong> ${studentData.classToBeAdmitted || 'N/A'}</div>
                <div class="detail-item"><strong>Year:</strong> ${studentData.studiedYear || 'N/A'}</div>
                
                <div class="section-title">Additional Information</div>
                
                <div class="detail-item"><strong>Remark I:</strong> ${studentData.identificationMark1 || 'N/A'}</div>
                <div class="detail-item"><strong>Remark II:</strong> ${studentData.identificationMark2 || 'N/A'}</div>
                <div class="detail-item"><strong>Remarks:</strong> ${studentData.remarks || 'N/A'}</div>
                <div class="detail-item"><strong>Aadhar Number:</strong> ${studentData.aadharNumber || 'N/A'}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `)
    
    printWindow.document.close()
    
    // Auto-close after printing
    printWindow.onafterprint = () => {
      printWindow.close()
    }
  }

  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "Anonymous"
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load image from ${url}`))
      img.src = url
    })
  }

  const handleDownloadPDF = async () => {
    if (!studentData) {
      toast.error("No student data available to download")
      return
    }

    try {
      const doc = new jsPDF()

      // Add header
      doc.setFontSize(16)
      doc.setTextColor(0, 0, 139) // Dark blue
      doc.text(
        `Student Details - ${studentData.admissionNumber}`,
        doc.internal.pageSize.width / 2,
        20,
        { align: "center" }
      )

      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      const today = new Date().toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      doc.text(`Report as on Date: ${today}`, 15, 30)

      let startY = 50

      // Add student photo first (larger size)
      try {
        const photoUrl = studentData.studentPhoto || defaultStudentPhoto
        const img = await loadImage(photoUrl)
        const imgProps = doc.getImageProperties(img)
        const maxWidth = 50
        const imgWidth = Math.min(maxWidth, imgProps.width)
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width
        const xPos = (doc.internal.pageSize.width - imgWidth) / 2
        
        doc.addImage(img, "JPEG", xPos, startY, imgWidth, imgHeight)
        startY += imgHeight + 20 // Add space after image
      } catch (error) {
        console.error("Error loading student image for PDF:", error)
        // Continue without image
      }

      // Student details table - FIXED: Use the imported autoTable function
      const detailsData = [
        ["Admission No:", studentData.admissionNumber || "N/A", "Standard:", studentData.standard || "N/A"],
        ["Exam No:", studentData.examNumber || "N/A", "Section:", studentData.section || "N/A"],
        ["Student Name:", studentData.studentName || "N/A", "Birth Date:", studentData.dateOfBirth || "N/A"],
        ["Father Name:", studentData.fatherName || "N/A", "Entry Date:", studentData.dateOfAdmission || "N/A"],
        ["Mother Name:", studentData.motherName || "N/A", "Gender:", studentData.gender || "N/A"],
        ["Address:", `${studentData.streetVillage || ""}, ${studentData.placePincode || ""}`.trim() || "N/A", "Religion:", studentData.religion || "N/A"],
        ["District:", studentData.district || "N/A", "Nationality:", studentData.nationality || "N/A"],
        ["State:", studentData.state || "N/A", "Community:", studentData.community || "N/A"],
        ["Phone/Mobile:", studentData.phoneNumber || "N/A", "Caste:", studentData.caste || "N/A"],
        ["Email:", studentData.emailId || "N/A", "Mother Tongue:", studentData.motherTongue || "N/A"],
        ["Blood Group:", studentData.bloodGroup || "N/A", "Father Occupation:", studentData.fatherOccupation || "N/A"],
        ["Bus Route No:", studentData.busRouteNumber || "N/A", "Mother Occupation:", studentData.motherOccupation || "N/A"],
        ["Boarding Point:", studentData.boardingPoint || "N/A", "Bus Fee:", studentData.busFee || "N/A"],
        ["Old School:", studentData.nameOfSchool || "N/A", "Old Standard:", studentData.classLastStudied || "N/A"],
        ["Admitted Class:", studentData.classToBeAdmitted || "N/A", "Year:", studentData.studiedYear || "N/A"],
        ["EMIS:", studentData.emis || "N/A", "Lunch/Refresh:", studentData.lunchRefresh || "N/A"],
        ["Student Type:", studentData.studentType || "N/A", "Student Category:", studentData.studentCategory || "N/A"],
        ["Remark I:", studentData.identificationMark1 || "N/A", "Remark II:", studentData.identificationMark2 || "N/A"],
        ["Remarks:", studentData.remarks || "N/A", "", ""],
        ["Aadhar Number:", studentData.aadharNumber || "N/A", "", ""],
      ]

      // Create table using the imported autoTable function
      autoTable(doc, {
        startY: startY,
        head: [],
        body: detailsData,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 40 },
          2: { fontStyle: "bold", cellWidth: 40 },
          1: { cellWidth: 'auto' },
          3: { cellWidth: 'auto' }
        },
        margin: { top: 5 },
        tableWidth: 'wrap'
      })

      // Save PDF
      doc.save(`Student_Details_${studentData.admissionNumber || "report"}.pdf`)
      toast.success("PDF downloaded successfully")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Failed to download PDF")
    }
  }

  const handleDownloadExcel = () => {
    if (!studentData) return

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["Admission Number", studentData.admissionNumber],
      ["Exam Number", studentData.examNumber],
      ["Student Name", studentData.studentName],
      ["Father Name", studentData.fatherName],
      ["Mother Name", studentData.motherName],
      ["Address", `${studentData.streetVillage}, ${studentData.placePincode}`],
      ["District", studentData.district],
      ["State", studentData.state],
      ["Phone Number", studentData.phoneNumber],
      ["Email", studentData.emailId],
      ["Standard", studentData.standard],
      ["Section", studentData.section],
      ["Birth Date", studentData.dateOfBirth],
      ["Entry Date", studentData.dateOfAdmission],
      ["Gender", studentData.gender],
      ["Religion", studentData.religion],
      ["Nationality", studentData.nationality],
      ["Community", studentData.community],
      ["Caste", studentData.caste],
      ["Mother Tongue", studentData.motherTongue],
      ["Blood Group", studentData.bloodGroup],
      ["Father Occupation", studentData.fatherOccupation],
      ["Mother Occupation", studentData.motherOccupation],
      ["Bus Route No", studentData.busRouteNumber],
      ["Boarding Point", studentData.boardingPoint],
      ["Bus Fee", studentData.busFee],
      ["Old School Name", studentData.nameOfSchool],
      ["Old Standard", studentData.classLastStudied],
      ["Admitted Class", studentData.classToBeAdmitted],
      ["Year", studentData.studiedYear],
      ["EMIS", studentData.emis],
      ["Lunch/Refresh", studentData.lunchRefresh],
      ["Student Type", studentData.studentType],
      ["Student Category", studentData.studentCategory],
      ["Remark I", studentData.identificationMark1],
      ["Remark II", studentData.identificationMark2],
      ["Remarks", studentData.remarks],
      ["Aadhar Number", studentData.aadharNumber],
    ])

    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Details")
    XLSX.writeFile(workbook, `Student_Details_${studentData.admissionNumber || "report"}.xlsx`)
    toast.success("Excel file downloaded successfully")
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0" style={{ height: "100%", overflow: "hidden" }}>
        {/* Breadcrumb Navigation */}
        <div className="mb-4">
          <nav className="custom-breadcrumb py-1 py-lg-3">
            <Link to="/home">Home</Link>
            <span className="separator mx-2"></span>
            <Link to="/reports">Reports</Link>
            <span className="separator mx-2"></span>
            <span>Student Details</span>
          </nav>
        </div>

        <div className="report-container">
          {/* Header with Actions */}
          <div
            style={{ backgroundColor: "#0B3D7B" }}
            className="text-white p-3 d-flex justify-content-between align-items-center"
          >
            <div className="d-flex align-items-center">
              <h2 className="mb-0">Student Details Report</h2>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-light" onClick={handlePrint} disabled={!studentData}>
                <Printer className="me-2" size={18} />
                Print
              </Button>
              <Button variant="outline-light" onClick={handleDownloadPDF} disabled={!studentData}>
                <Download className="me-2" size={18} />
                Download PDF
              </Button>
              <Button variant="outline-light" onClick={handleDownloadExcel} disabled={!studentData}>
                <FileSpreadsheet className="me-2" size={18} />
                Download Excel
              </Button>
            </div>
          </div>

          {/* Admission Number Selection */}
          <Card>
            <Card.Body className="p-4">
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>
                  Select Admission Number:
                </Form.Label>
                <Col sm={9}>
                  <Form.Control as="select" value={selectedAdmissionNumber} onChange={handleAdmissionNumberChange}>
                    <option value="">Select an admission number</option>
                    {admissionNumbers.map((number) => (
                      <option key={number} value={number}>
                        {number}
                      </option>
                    ))}
                  </Form.Control>
                </Col>
              </Form.Group>
              <div className="text-center mb-3">
                <p>OR</p>
              </div>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>
                  Enter Admission Number:
                </Form.Label>
                <Col sm={7}>
                  <Form.Control
                    type="text"
                    value={manualAdmissionNumber}
                    onChange={handleManualAdmissionNumberChange}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Enter admission number"
                  />
                </Col>
                <Col sm={2}>
                  <Button onClick={handleManualSearch} variant="primary">
                    Search
                  </Button>
                </Col>
              </Form.Group>
            </Card.Body>
          </Card>

          {loading ? (
            <div className="text-center py-5">
              <div>Loading...</div>
            </div>
          ) : !studentData ? (
            <div className="text-center py-5">
              <div>Please select or enter an admission number to view student details.</div>
            </div>
          ) : (
            /* Report Content - Only this part will be printed */
            <Card className="rounded-bottom" style={{ height: "auto", overflow: "visible" }}>
              <Card.Body className="p-4" id="student-details-content">
                {/* Student Photo at the top for print */}
                <div className="text-center mb-4 d-print-block">
                  <img
                    src={studentData.studentPhoto || defaultStudentPhoto}
                    alt="Student"
                    className="student-photo"
                    onError={(e) => {
                      e.target.src = defaultStudentPhoto
                    }}
                  />
                </div>

                {/* Report Header - Only for screen */}
                <div className="text-center mb-4 d-none d-print-none">
                  <h3 className="text-primary">Student Details Admission Number Wise {studentData.admissionNumber}</h3>
                  <p className="text-muted">
                    Report as on Date:{" "}
                    {new Date().toLocaleDateString("en-US", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <Row>
                  {/* Left Column */}
                  <Col md={4}>
                    <div className="details-section">
                      <div className="detail-item">
                        <strong>Adm.No:</strong> {studentData.admissionNumber}
                      </div>
                      <div className="detail-item">
                        <strong>Examno:</strong> {studentData.examNumber}
                      </div>
                      <div className="detail-item">
                        <strong>Student Name:</strong> {studentData.studentName}
                      </div>
                      <div className="detail-item">
                        <strong>Father Name:</strong> {studentData.fatherName}
                      </div>
                      <div className="detail-item">
                        <strong>Mother Name:</strong> {studentData.motherName}
                      </div>
                      <div className="detail-item">
                        <strong>Address:</strong> {studentData.streetVillage}, {studentData.placePincode}
                      </div>
                      <div className="detail-item">
                        <strong>District:</strong> {studentData.district}
                      </div>
                      <div className="detail-item">
                        <strong>State:</strong> {studentData.state}
                      </div>
                      <div className="detail-item">
                        <strong>Ph/MobileNo:</strong> {studentData.phoneNumber}
                      </div>
                      <div className="detail-item">
                        <strong>Email:</strong> {studentData.emailId}
                      </div>
                      <div className="detail-item">
                        <strong>Student Type:</strong> {studentData.studentType}
                      </div>
                      <div className="detail-item">
                        <strong>Student Category:</strong> {studentData.studentCategory}
                      </div>
                      <div className="detail-item">
                        <strong>EMIS:</strong> {studentData.emis}
                      </div>
                      <div className="detail-item">
                        <strong>Aadhar Number:</strong> {studentData.aadharNumber}
                      </div>
                    </div>
                  </Col>

                  {/* Middle Column */}
                  <Col md={4}>
                    <div className="details-section">
                      <div className="detail-item">
                        <strong>Standard:</strong> {studentData.standard}
                      </div>
                      <div className="detail-item">
                        <strong>Section:</strong> {studentData.section}
                      </div>
                      <div className="detail-item">
                        <strong>Birth Date:</strong> {studentData.dateOfBirth}
                      </div>
                      <div className="detail-item">
                        <strong>Entry Date:</strong> {studentData.dateOfAdmission}
                      </div>
                      <div className="detail-item">
                        <strong>Sex:</strong> {studentData.gender}
                      </div>
                      <div className="detail-item">
                        <strong>Religion:</strong> {studentData.religion}
                      </div>
                      <div className="detail-item">
                        <strong>Nationality:</strong> {studentData.nationality}
                      </div>
                      <div className="detail-item">
                        <strong>Community:</strong> {studentData.community}
                      </div>
                      <div className="detail-item">
                        <strong>Caste:</strong> {studentData.caste}
                      </div>
                      <div className="detail-item">
                        <strong>Mother Tongue:</strong> {studentData.motherTongue}
                      </div>
                      <div className="detail-item">
                        <strong>Blood Group:</strong> {studentData.bloodGroup}
                      </div>
                      <div className="detail-item">
                        <strong>Lunch/Refresh:</strong> {studentData.lunchRefresh}
                      </div>
                      <div className="detail-item">
                        <strong>Remark I:</strong> {studentData.identificationMark1}
                      </div>
                      <div className="detail-item">
                        <strong>Remark II:</strong> {studentData.identificationMark2}
                      </div>
                    </div>
                  </Col>

                  {/* Right Column */}
                  <Col md={4}>
                    <div className="details-section">
                      <div className="detail-item">
                        <strong>Father Occupation:</strong> {studentData.fatherOccupation}
                      </div>
                      <div className="detail-item">
                        <strong>Mother Occupation:</strong> {studentData.motherOccupation}
                      </div>
                      <div className="detail-item">
                        <strong>Bus Route No:</strong> {studentData.busRouteNumber}
                      </div>
                      <div className="detail-item">
                        <strong>Boarding Point:</strong> {studentData.boardingPoint}
                      </div>
                      <div className="detail-item">
                        <strong>Bus Fee:</strong> {studentData.busFee}
                      </div>
                      <div className="detail-item">
                        <strong>Old School Name:</strong> {studentData.nameOfSchool}
                      </div>
                      <div className="detail-item">
                        <strong>Old Standard:</strong> {studentData.classLastStudied}
                      </div>
                      <div className="detail-item">
                        <strong>Admitted Class:</strong> {studentData.classToBeAdmitted}
                      </div>
                      <div className="detail-item">
                        <strong>Year:</strong> {studentData.studiedYear}
                      </div>
                      <div className="detail-item">
                        <strong>Remarks:</strong> {studentData.remarks}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </div>
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

          .report-container {
            background: white;
            margin-bottom: 2rem;
            border: 2px solid #0B3D7B;
            border-radius: 8px;
            overflow: hidden;
            height: auto;
          }

          .details-section {
            margin-bottom: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .detail-item {
            font-size: 0.9rem;
            line-height: 1.2;
            word-wrap: break-word;
          }

          .detail-item strong {
            color: #0B3D7B;
            margin-right: 0.5rem;
          }

          .student-photo {
            width: 150px;
            height: 150px;
            object-fit: cover;
            border: 2px solid #0B3D7B;
            border-radius: 4px;
          }

          /* Print Styles */
          @media print {
            body * {
              visibility: hidden;
            }
            #student-details-content,
            #student-details-content * {
              visibility: visible;
            }
            #student-details-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20px;
            }
            .btn, .custom-breadcrumb, .report-container > div:not(#student-details-content) {
              display: none !important;
            }
            .report-container {
              border: none !important;
              box-shadow: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .card {
              border: none !important;
              box-shadow: none !important;
            }
            .student-photo {
              width: 120px;
              height: 120px;
              margin: 0 auto 20px auto;
            }
            .detail-item {
              font-size: 0.85rem;
              line-height: 1.3;
            }
          }

          @media (max-width: 768px) {
            .detail-item {
              font-size: 0.85rem;
            }

            .student-photo {
              width: 120px;
              height: 120px;
            }
          }
        `}
      </style>
      <ToastContainer />
    </MainContentPage>
  )
}

export default IndividualFullView