"use client"

import { useState, useEffect, useCallback } from "react"
import { Container, Row, Col, Card, Form, InputGroup, Dropdown, Spinner, Button } from "react-bootstrap"
import { Link } from "react-router-dom"
import { useAuthContext } from "../../../Context/AuthContext"
import { ENDPOINTS } from "../../../SpringBoot/config"
import MainContentPage from "../../../components/MainContent/MainContentPage"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { X, FileText, FileSpreadsheet } from "lucide-react"
import defaultStudentPhoto from "../../../images/StudentProfileIcon/studentProfile.jpeg"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

const FullView = () => {
  const [studentsData, setStudentsData] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [standardsLoading, setStandardsLoading] = useState(true)
  const [sectionsLoading, setSectionsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [standardFilter, setStandardFilter] = useState("")
  const [sectionFilter, setSectionFilter] = useState("")
  const [standards, setStandards] = useState([])
  const [sections, setSections] = useState([])
  const [studentPhotos, setStudentPhotos] = useState({})

  const { schoolId, currentAcademicYear, getAuthHeaders } = useAuthContext()

  useEffect(() => {
    if (schoolId && currentAcademicYear) {
      fetchStandards()
      fetchSections()
      fetchStudentsData()
    }
  }, [schoolId, currentAcademicYear])

  const filterStudents = useCallback(() => {
    let filtered = studentsData

    if (searchTerm) {
      filtered = filtered.filter((student) => 
        student.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.fatherName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (standardFilter) {
      filtered = filtered.filter((student) => student.standard === standardFilter)
    }

    if (sectionFilter) {
      filtered = filtered.filter((student) => student.section === sectionFilter)
    }

    setFilteredStudents(filtered)
  }, [studentsData, searchTerm, standardFilter, sectionFilter])

  useEffect(() => {
    filterStudents()
  }, [filterStudents])

  const clearSearch = () => {
    setSearchTerm("")
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStandardFilter("")
    setSectionFilter("")
  }

  const fetchStandards = async () => {
    try {
      setStandardsLoading(true)
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/courses?schoolId=${schoolId}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch standards: ${response.status}`)
      }

      const standardsData = await response.json()
      // Extract unique standards from the response
      const uniqueStandards = [...new Set(standardsData.map(item => item.standard || item.courseName))].filter(Boolean)
      setStandards(uniqueStandards.sort())
    } catch (error) {
      console.error("Error fetching standards:", error)
      toast.error("Failed to fetch standards")
    } finally {
      setStandardsLoading(false)
    }
  }

  const fetchSections = async () => {
    try {
      setSectionsLoading(true)
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/sections?schoolId=${schoolId}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch sections: ${response.status}`)
      }

      const sectionsData = await response.json()
      // Extract unique sections from the response
      const uniqueSections = [...new Set(sectionsData.map(item => item.section || item.sectionName))].filter(Boolean)
      setSections(uniqueSections.sort())
    } catch (error) {
      console.error("Error fetching sections:", error)
      toast.error("Failed to fetch sections")
    } finally {
      setSectionsLoading(false)
    }
  }

  const fetchStudentsData = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/admission/school/${schoolId}?academicYear=${currentAcademicYear}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch students: ${response.status}`)
      }

      const students = await response.json()
      
      // Sort students by admission number
      const sortedStudents = students.sort((a, b) => {
        const aNum = parseInt(a.admissionNumber?.replace("ADM", "") || 0)
        const bNum = parseInt(b.admissionNumber?.replace("ADM", "") || 0)
        return aNum - bNum
      })
      
      setStudentsData(sortedStudents)
      setFilteredStudents(sortedStudents)

      // Fetch photos for all students
      fetchStudentPhotos(sortedStudents)
    } catch (error) {
      console.error("Error fetching students data:", error)
      toast.error("Failed to fetch students data")
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentPhotos = async (students) => {
    const photos = {}
    
    for (const student of students) {
      if (student.id) {
        try {
          const photoResponse = await fetch(
            `${ENDPOINTS.admissionmaster}/admission/${student.id}/photo?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
            {
              method: "GET",
              headers: getAuthHeaders(),
            }
          )
          
          if (photoResponse.ok) {
            const photoBlob = await photoResponse.blob()
            const photoUrl = URL.createObjectURL(photoBlob)
            photos[student.id] = photoUrl
          }
        } catch (error) {
          console.error(`Error fetching photo for student ${student.id}:`, error)
        }
      }
    }
    
    setStudentPhotos(photos)
  }

  const getStudentPhoto = (student) => {
    if (student.id && studentPhotos[student.id]) {
      return studentPhotos[student.id]
    }
    return defaultStudentPhoto
  }

  const renderStudentCards = () => {
    const cards = filteredStudents.map((student) => (
      <Col md={6} key={student.id || student.admissionNumber} className="mb-4">
        <Card className="student-card h-100">
          <Card.Header style={{ backgroundColor: "#0B3D7B" }} className="text-white py-2">
            <h5 className="mb-0">Student Details - {student.admissionNumber}</h5>
          </Card.Header>
          <Card.Body className="p-3">
            <Row className="g-0">
              <Col md={3} className="text-center mb-3 mb-md-0">
                <div className="photo-container">
                  <img 
                    src={getStudentPhoto(student)} 
                    alt="Student" 
                    className="student-photo"
                    onError={(e) => {
                      e.target.src = defaultStudentPhoto
                    }}
                  />
                </div>
              </Col>
              <Col md={9}>
                <Row className="g-0">
                  <Col md={6}>
                    <div className="details-grid left-column">
                      <div className="detail-item">
                        <strong>Adm.No:</strong> {student.admissionNumber || "-"}
                      </div>
                      <div className="detail-item">
                        <strong>Examno:</strong> {student.examNumber || "-"}
                      </div>
                      <div className="detail-item">
                        <strong>Student Name:</strong> {student.studentName || "-"}
                      </div>
                      <div className="detail-item">
                        <strong>Father Name:</strong> {student.fatherName || "-"}
                      </div>
                      <div className="detail-item">
                        <strong>Mother Name:</strong> {student.motherName || "-"}
                      </div>
                      <div className="detail-item">
                        <strong>Address:</strong> {student.streetVillage || ""}, {student.placePincode || ""}
                      </div>
                      <div className="detail-item">
                        <strong>District:</strong> {student.district || "-"}
                      </div>
                      <div className="detail-item">
                        <strong>State:</strong> {student.state || "-"}
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="details-grid right-column">
                      <div className="detail-item">
                        <strong>Sex:</strong> {student.gender || "-"}
                      </div>
                      <div className="detail-item">
                        <strong>Birth Date:</strong> {student.dateOfBirth || "-"}
                      </div>
                      <div className="detail-item">
                        <strong>Religion:</strong> {student.religion || "-"}
                      </div>
                      <div className="detail-item">
                        <strong>Nationality:</strong> {student.nationality || "-"}
                      </div>
                      <div className="detail-item">
                        <strong>Community:</strong> {student.community || "-"}
                      </div>
                      <div className="detail-item">
                        <strong>Caste:</strong> {student.caste || "-"}
                      </div>
                      <div className="detail-item">
                        <strong>Blood Group:</strong> {student.bloodGroup || "-"}
                      </div>
                      <div className="detail-item">
                        <strong>Ph/MobileNo:</strong> {student.phoneNumber || "-"}
                      </div>
                      <div className="detail-item">
                        <strong>Standard:</strong> {student.standard || "-"}
                      </div>
                      <div className="detail-item">
                        <strong>Section:</strong> {student.section || "-"}
                      </div>
                      <div className="detail-item">
                        <strong>Parent Occupation:</strong>{" "}
                        {student.fatherOccupation || student.motherOccupation || "N/A"}
                      </div>
                      <div className="detail-item">
                        <strong>Entry Date:</strong> {student.dateOfAdmission || "-"}
                      </div>
                      <div className="detail-item">
                        <strong>Year:</strong> {student.studiedYear || student.academicYear || "N/A"}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
    ))

    const rows = []
    for (let i = 0; i < cards.length; i += 2) {
      rows.push(
        <Row key={i}>
          {cards[i]}
          {cards[i + 1] || <Col md={6}></Col>}
        </Row>,
      )
    }

    return rows
  }

  const exportToPDF = async () => {
    try {
      const doc = new jsPDF()
      
      for (let index = 0; index < filteredStudents.length; index++) {
        const student = filteredStudents[index]
        
        if (index > 0) {
          doc.addPage()
        }

        let yOffset = 15

        // Title
        doc.setFontSize(16)
        doc.setTextColor(11, 61, 123)
        doc.text(`Student Details - ${student.admissionNumber}`, 105, yOffset, { align: "center" })
        yOffset += 10

        // School Info
        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0)
        doc.text(`School: ${schoolId}`, 15, yOffset)
        doc.text(`Academic Year: ${currentAcademicYear}`, 15, yOffset + 5)
        yOffset += 15

        // Add student photo first (larger and centered at top)
        try {
          const photoUrl = getStudentPhoto(student)
          if (photoUrl) {
            const imgData = await getImageData(photoUrl)
            if (imgData) {
              // Add photo centered at the top
              const pageWidth = doc.internal.pageSize.width
              const photoWidth = 50
              const photoHeight = 50
              const photoX = (pageWidth - photoWidth) / 2
              
              doc.addImage(imgData, 'JPEG', photoX, yOffset, photoWidth, photoHeight)
              yOffset += photoHeight + 15 // Space after photo
            }
          }
        } catch (error) {
          console.error("Error adding photo to PDF:", error)
        }

        // Student details in two columns below the photo
        const leftColumnData = [
          ["Admission Number:", student.admissionNumber || "-"],
          ["Exam Number:", student.examNumber || "-"],
          ["Student Name:", student.studentName || "-"],
          ["Father Name:", student.fatherName || "-"],
          ["Mother Name:", student.motherName || "-"],
          ["Address:", `${student.streetVillage || ""}, ${student.placePincode || ""}`],
          ["District:", student.district || "-"],
          ["State:", student.state || "-"],
        ]

        const rightColumnData = [
          ["Gender:", student.gender || "-"],
          ["Date of Birth:", student.dateOfBirth || "-"],
          ["Religion:", student.religion || "-"],
          ["Nationality:", student.nationality || "-"],
          ["Community:", student.community || "-"],
          ["Caste:", student.caste || "-"],
          ["Blood Group:", student.bloodGroup || "-"],
          ["Phone Number:", student.phoneNumber || "-"],
          ["Standard:", student.standard || "-"],
          ["Section:", student.section || "-"],
          ["Parent Occupation:", student.fatherOccupation || student.motherOccupation || "N/A"],
          ["Date of Admission:", student.dateOfAdmission || "-"],
          ["Academic Year:", student.studiedYear || student.academicYear || "N/A"],
        ]

        // Left column table
        autoTable(doc, {
          startY: yOffset,
          head: [],
          body: leftColumnData,
          theme: "plain",
          styles: { 
            fontSize: 9, 
            cellPadding: 3,
            overflow: 'linebreak',
            lineColor: [200, 200, 200],
            lineWidth: 0.1
          },
          columnStyles: { 
            0: { 
              fontStyle: "bold", 
              cellWidth: 45,
              fillColor: [245, 245, 245]
            },
            1: { 
              cellWidth: 50,
            }
          },
          margin: { left: 15 },
          tableLineWidth: 0.1,
          tableLineColor: [200, 200, 200]
        })

        // Right column table
        const leftTableHeight = doc.lastAutoTable.finalY || yOffset
        autoTable(doc, {
          startY: yOffset,
          head: [],
          body: rightColumnData,
          theme: "plain",
          styles: { 
            fontSize: 9, 
            cellPadding: 3,
            overflow: 'linebreak',
            lineColor: [200, 200, 200],
            lineWidth: 0.1
          },
          columnStyles: { 
            0: { 
              fontStyle: "bold", 
              cellWidth: 45,
              fillColor: [245, 245, 245]
            },
            1: { 
              cellWidth: 50,
            }
          },
          margin: { left: 125 },
          tableLineWidth: 0.1,
          tableLineColor: [200, 200, 200]
        })

        // Additional info in full width below the two columns
        const finalY = Math.max(doc.lastAutoTable.finalY, leftTableHeight) + 10
        
        // Add border around the entire student details section
        doc.setDrawColor(11, 61, 123)
        doc.setLineWidth(0.5)
        doc.rect(10, 10, doc.internal.pageSize.width - 20, finalY - 5)

        // Add page number at the bottom
        doc.setFontSize(8)
        doc.setTextColor(100)
        doc.text(
          `Page ${index + 1} of ${filteredStudents.length}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        )
      }

      doc.save("student_details_report.pdf")
      toast.success("PDF report generated successfully")
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      toast.error("Failed to generate PDF report")
    }
  }

  // Helper function to convert image to base64 for PDF
  const getImageData = (url) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = "Anonymous"
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        const dataURL = canvas.toDataURL('image/jpeg')
        resolve(dataURL)
      }
      img.onerror = () => resolve(null)
      img.src = url
    })
  }

  const exportToExcel = () => {
    try {
      const exportData = filteredStudents.map((student) => ({
        "Admission Number": student.admissionNumber,
        "Exam Number": student.examNumber,
        "Student Name": student.studentName,
        "Father Name": student.fatherName,
        "Mother Name": student.motherName,
        "Address": `${student.streetVillage || ""}, ${student.placePincode || ""}`,
        "District": student.district,
        "State": student.state,
        "Gender": student.gender,
        "Date of Birth": student.dateOfBirth,
        "Religion": student.religion,
        "Nationality": student.nationality,
        "Community": student.community,
        "Caste": student.caste,
        "Blood Group": student.bloodGroup,
        "Phone Number": student.phoneNumber,
        "Standard": student.standard,
        "Section": student.section,
        "Parent Occupation": student.fatherOccupation || student.motherOccupation || "N/A",
        "Date of Admission": student.dateOfAdmission,
        "Academic Year": student.studiedYear || student.academicYear,
        "Email": student.emailId,
        "Aadhar Number": student.aadharNumber
      }))

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Student Details")

      // Set column widths
      const colWidths = [
        { wch: 18 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 20 },
        { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 12 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
        { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 25 }, { wch: 15 },
        { wch: 15 }, { wch: 25 }, { wch: 18 }
      ]
      worksheet['!cols'] = colWidths

      XLSX.writeFile(workbook, "student_details_report.xlsx")
      toast.success("Excel report generated successfully")
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      toast.error("Failed to generate Excel report")
    }
  }

  if (!schoolId) {
    return (
      <MainContentPage>
        <Container fluid className="px-0">
          <div className="text-center py-4">
            <h4>School ID not available. Please login again.</h4>
          </div>
        </Container>
      </MainContentPage>
    )
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        {/* Breadcrumb Navigation */}
        <div className="mb-4">
          <nav className="custom-breadcrumb py-1 py-lg-3">
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <Link to="/reports">Reports</Link>
            <span className="separator mx-2">&gt;</span>
            <span>Student Details - Full View</span>
          </nav>
        </div>

        {/* Main Content */}
        <div className="report-container">
          {/* Header with Search and Filters */}
          <Card className="mb-4">
            <Card.Header style={{ backgroundColor: "#0B3D7B" }} className="text-white py-3">
              <Row className="align-items-center">
                <Col>
                  <h2 className="mb-0">Student Details Report</h2>
                  <small>School: {schoolId} | Year: {currentAcademicYear}</small>
                </Col>
                <Col md={8}>
                  <Row>
                    <Col md={3}>
                      <InputGroup>
                        <Form.Control
                          type="text"
                          placeholder="Search students..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                          <Button 
                            variant="outline-secondary" 
                            onClick={clearSearch}
                            style={{ border: '1px solid #ced4da' }}
                          >
                            <X size={16} />
                          </Button>
                        )}
                      </InputGroup>
                    </Col>
                    <Col md={2}>
                      <Form.Select 
                        value={standardFilter} 
                        onChange={(e) => setStandardFilter(e.target.value)}
                        disabled={standardsLoading}
                      >
                        <option value="">All Standards</option>
                        {standards.map((standard) => (
                          <option key={standard} value={standard}>
                            {standard}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={2}>
                      <Form.Select 
                        value={sectionFilter} 
                        onChange={(e) => setSectionFilter(e.target.value)}
                        disabled={sectionsLoading}
                      >
                        <option value="">All Sections</option>
                        {sections.map((section) => (
                          <option key={section} value={section}>
                            {section}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={3}>
                      <div className="d-flex gap-2">
                        <Button 
                          variant="outline-light" 
                          size="sm" 
                          onClick={clearFilters}
                          disabled={!searchTerm && !standardFilter && !sectionFilter}
                        >
                          Clear Filters
                        </Button>
                        <Dropdown>
                          <Dropdown.Toggle variant="light" id="dropdown-export" disabled={filteredStudents.length === 0}>
                            Export
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={exportToPDF} disabled={filteredStudents.length === 0}>
                              <FileText className="me-2" size={18} />
                              Export to PDF
                            </Dropdown.Item>
                            <Dropdown.Item onClick={exportToExcel} disabled={filteredStudents.length === 0}>
                              <FileSpreadsheet className="me-2" size={18} />
                              Export to Excel
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </Col>
                  </Row>
                  {(standardsLoading || sectionsLoading) && (
                    <Row className="mt-2">
                      <Col>
                        <small className="text-light">
                          {standardsLoading && "Loading standards... "}
                          {sectionsLoading && "Loading sections..."}
                        </small>
                      </Col>
                    </Row>
                  )}
                </Col>
              </Row>
            </Card.Header>
          </Card>

          {/* Student Count */}
          <div className="mb-3">
            <small className="text-muted">
              Showing {filteredStudents.length} of {studentsData.length} students
              {standardFilter && ` in ${standardFilter}`}
              {sectionFilter && `, Section ${sectionFilter}`}
              {(searchTerm || standardFilter || sectionFilter) && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 ms-2"
                  onClick={clearFilters}
                >
                  Clear all
                </Button>
              )}
            </small>
          </div>

          {/* Student Cards */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-3">Loading student data...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-5">
              <p>No students found matching the search criteria.</p>
              {(searchTerm || standardFilter || sectionFilter) && (
                <Button variant="primary" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            renderStudentCards()
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
            border-radius: 8px;
            height: auto;
          }

          .student-card {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            height: 100%;
          }

          .details-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 0.25rem;
          }

          .left-column, .right-column {
            padding: 0 0.5rem;
          }

          .detail-item {
            font-size: 0.75rem;
            line-height: 1.2;
            color: #333;
          }

          .detail-item strong {
            color: #0B3D7B;
            font-weight: 600;
            margin-right: 0.25rem;
          }

          .photo-container {
            border: 2px solid #0B3D7B;
            padding: 2px;
            background: #fff;
            display: inline-block;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .student-photo {
            width: 100px;
            height: 100px;
            object-fit: cover;
          }

          @media print {
            .custom-breadcrumb, .search-container {
              display: none !important;
            }

            .report-container {
              margin: 0;
              padding: 0;
              border: none;
            }

            .card {
              border: none !important;
              box-shadow: none !important;
            }

            .student-card:not(:first-child) {
              page-break-before: always;
            }
          }

          @media (max-width: 768px) {
            .left-column, .right-column {
              padding: 0;
            }

            .details-grid {
              grid-template-columns: 1fr;
            }

            .student-photo {
              width: 80px;
              height: 80px;
            }

            .detail-item {
              font-size: 0.7rem;
            }
          }
        `}
      </style>
      <ToastContainer />
    </MainContentPage>
  )
}

export default FullView