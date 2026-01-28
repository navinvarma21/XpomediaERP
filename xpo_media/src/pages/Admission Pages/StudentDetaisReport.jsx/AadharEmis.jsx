"use client"

import { useState, useEffect, useCallback } from "react"
import { Container, Table, Button, Form, Row, Col } from "react-bootstrap"
import { useAuthContext } from "../../../Context/AuthContext"
import { ENDPOINTS } from "../../../SpringBoot/config"
import MainContentPage from "../../../components/MainContent/MainContentPage"
import { Link } from "react-router-dom"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import { FileSpreadsheet, FileIcon as FilePdf } from 'lucide-react'

// Import autoTable directly
import autoTable from 'jspdf-autotable'

const AdhaarEmisNumber = () => {
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStandard, setSelectedStandard] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const [standards, setStandards] = useState([])
  const [sections, setSections] = useState([])
  
  const { schoolId, getAuthHeaders, currentAcademicYear } = useAuthContext()

  // Memoized filter function
  const filterStudents = useCallback(() => {
    if (selectedStandard && selectedSection) {
      const filtered = students.filter(
        (student) => student.standard === selectedStandard && student.section === selectedSection
      )
      setFilteredStudents(filtered)
    } else if (selectedStandard) {
      const filtered = students.filter((student) => student.standard === selectedStandard)
      setFilteredStudents(filtered)
    } else {
      setFilteredStudents([])
    }
  }, [selectedStandard, selectedSection, students])

  // Apply filters when dependencies change
  useEffect(() => {
    filterStudents()
  }, [filterStudents])

  // Show info when no standard selected
  useEffect(() => {
    if (!selectedStandard && students.length > 0) {
      toast.info("Please select a standard to view the report", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    }
  }, [selectedStandard, students.length])

  // Helper function to extract string values from objects/arrays
  const extractStringValues = (data) => {
    if (!data) return []
    
    if (Array.isArray(data)) {
      return data.map(item => {
        if (typeof item === 'string') return item
        if (typeof item === 'object' && item !== null) {
          return item.name || item.standard || item.section || item.value || item.label || JSON.stringify(item)
        }
        return String(item)
      }).filter(item => item && item.trim() !== "")
    }
    
    return []
  }

  // Fetch standards
  const fetchStandards = useCallback(async () => {
    if (!schoolId) return
    
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/courses?schoolId=${schoolId}`,
        {
          headers: getAuthHeaders()
        }
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch standards: ${response.status}`)
      }
      
      const standardsData = await response.json()
      
      // Extract string values from the response
      const extractedStandards = extractStringValues(standardsData)
      setStandards(extractedStandards)
    } catch (error) {
      toast.error("Failed to fetch standards")
      setStandards([])
    }
  }, [schoolId, getAuthHeaders])

  // Fetch sections
  const fetchSections = useCallback(async () => {
    if (!schoolId) return
    
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/sections?schoolId=${schoolId}`,
        {
          headers: getAuthHeaders()
        }
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sections: ${response.status}`)
      }
      
      const sectionsData = await response.json()
      
      // Extract string values from the response
      const extractedSections = extractStringValues(sectionsData)
      setSections(extractedSections)
    } catch (error) {
      toast.error("Failed to fetch sections")
      setSections([])
    }
  }, [schoolId, getAuthHeaders])

  // Fetch all students
  const fetchAllStudents = useCallback(async () => {
    if (!schoolId || !currentAcademicYear) return
    
    setLoading(true)
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/studentreport/students?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        {
          headers: getAuthHeaders()
        }
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch students: ${response.status}`)
      }
      
      const studentsData = await response.json()
      setStudents(Array.isArray(studentsData) ? studentsData : [])
    } catch (error) {
      toast.error("Failed to fetch student data")
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [schoolId, currentAcademicYear, getAuthHeaders])

  // Main data fetching effect
  useEffect(() => {
    let mounted = true
    
    const fetchData = async () => {
      if (schoolId && currentAcademicYear && mounted) {
        await Promise.all([
          fetchStandards(),
          fetchSections(),
          fetchAllStudents()
        ])
      }
    }

    fetchData()

    return () => {
      mounted = false
    }
  }, [schoolId, currentAcademicYear, fetchStandards, fetchSections, fetchAllStudents])

  const handleStandardChange = (e) => {
    const standard = e.target.value
    setSelectedStandard(standard)
    setSelectedSection("")
  }

  const handleSectionChange = (e) => {
    const section = e.target.value
    setSelectedSection(section)
  }

  const getFormattedAddress = (student) => {
    if (!student) return "Address not available"
    
    const addressParts = [
      student.streetVillage,
      student.district,
      student.state,
      student.placePincode || student.pincode
    ].filter(part => part && part.trim() !== "")
    
    return addressParts.join(", ") || "Address not available"
  }

  const formatDate = (dateString) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString
      
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch (error) {
      return dateString
    }
  }

  const exportToExcel = () => {
    if (filteredStudents.length === 0) return
    
    try {
      const exportData = filteredStudents.map((student, index) => ({
        "S.No": index + 1,
        "Student Name": student.studentName || "",
        "Admission No.": student.admissionNumber || "",
        "Gender": student.gender || "",
        "Address": getFormattedAddress(student),
        "Phone Number": student.phoneNumber || "",
        "Date of Birth": formatDate(student.dateOfBirth),
        "Date of Admission": formatDate(student.dateOfAdmission),
        "EMIS Number": student.emisNumber || student.emis || "",
        "Aadhaar Number": student.aadhaarNumber || student.aadharNumber || ""
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Aadhaar EMIS Report")
      
      // Set column widths
      const colWidths = [
        { wch: 5 },   // S.No
        { wch: 20 },  // Student Name
        { wch: 15 },  // Admission No.
        { wch: 10 },  // Gender
        { wch: 30 },  // Address
        { wch: 15 },  // Phone Number
        { wch: 12 },  // Date of Birth
        { wch: 15 },  // Date of Admission
        { wch: 15 },  // EMIS Number
        { wch: 15 }   // Aadhaar Number
      ]
      ws['!cols'] = colWidths
      
      const fileName = `${selectedStandard}${selectedSection ? '_' + selectedSection : ''}_Aadhaar_EMIS_Report.xlsx`
      XLSX.writeFile(wb, fileName)
      toast.success("Excel report generated successfully")
    } catch (error) {
      toast.error("Failed to generate Excel report")
    }
  }

  // Fixed PDF export function
  const exportToPDF = () => {
    if (filteredStudents.length === 0) {
      toast.warning("No data available to export")
      return
    }
    
    try {
      const doc = new jsPDF()

      // Title
      doc.setFontSize(16)
      doc.setTextColor(0, 0, 128)
      doc.text("AADHAAR & EMIS NUMBER REPORT", doc.internal.pageSize.width / 2, 15, { align: "center" })

      // Date and Class details
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      const today = new Date().toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      })
      doc.text(`Generated on: ${today}`, 14, 25)
      doc.text(`Academic Year: ${currentAcademicYear}`, 14, 32)
      doc.text(`Class: ${selectedStandard} ${selectedSection ? '- ' + selectedSection : ''}`, doc.internal.pageSize.width / 2, 25, { align: "center" })
      doc.text(`Total Students: ${filteredStudents.length}`, doc.internal.pageSize.width / 2, 32, { align: "center" })

      const tableColumn = [
        "S.No", 
        "Student Name", 
        "Admission No.", 
        "Gender", 
        "Phone Number", 
        "EMIS Number", 
        "Aadhaar Number"
      ]

      const tableRows = filteredStudents.map((student, index) => [
        (index + 1).toString(),
        student.studentName?.substring(0, 25) || "", // Limit length to prevent overflow
        student.admissionNumber || "",
        student.gender || "",
        student.phoneNumber || "",
        student.emisNumber || student.emis || "",
        student.aadhaarNumber || student.aadharNumber || ""
      ])

      // Use autoTable function directly
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak",
          halign: "center"
        },
        headStyles: {
          fillColor: [11, 61, 123],
          textColor: 255,
          fontSize: 8,
          fontStyle: "bold",
          halign: "center"
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        },
        margin: { top: 45 },
        columnStyles: {
          0: { cellWidth: 15 }, // S.No
          1: { cellWidth: 40 }, // Student Name
          2: { cellWidth: 30 }, // Admission No.
          3: { cellWidth: 20 }, // Gender
          4: { cellWidth: 30 }, // Phone Number
          5: { cellWidth: 30 }, // EMIS Number
          6: { cellWidth: 30 }  // Aadhaar Number
        }
      })

      const fileName = `${selectedStandard}${selectedSection ? '_' + selectedSection : ''}_Aadhaar_EMIS_Report.pdf`
      doc.save(fileName)
      toast.success("PDF report generated successfully")
    } catch (error) {
      toast.error("Failed to generate PDF report")
    }
  }

  // Alternative simple PDF export without jspdf-autotable
  const exportToPDFSimple = () => {
    if (filteredStudents.length === 0) {
      toast.warning("No data available to export")
      return
    }
    
    try {
      const doc = new jsPDF()
      
      // Add title
      doc.setFontSize(16)
      doc.setTextColor(40, 40, 40)
      doc.text(`Aadhaar & EMIS Number Report - ${currentAcademicYear}`, 14, 15)
      
      // Add school info
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`School ID: ${schoolId}`, 14, 22)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28)
      doc.text(`Class: ${selectedStandard} ${selectedSection ? '- ' + selectedSection : ''}`, 14, 34)
      doc.text(`Total Students: ${filteredStudents.length}`, 14, 40)
      
      let yPosition = 50
      const lineHeight = 7
      const pageHeight = doc.internal.pageSize.height
      
      // Headers
      doc.setFillColor(11, 61, 123)
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.setFont(undefined, 'bold')
      
      // Header row
      doc.rect(14, yPosition, 185, lineHeight, 'F')
      doc.text('S.No', 16, yPosition + 5)
      doc.text('Student Name', 26, yPosition + 5)
      doc.text('Adm No.', 76, yPosition + 5)
      doc.text('Gender', 106, yPosition + 5)
      doc.text('Phone', 126, yPosition + 5)
      doc.text('EMIS', 156, yPosition + 5)
      doc.text('Aadhaar', 176, yPosition + 5)
      
      yPosition += lineHeight
      
      // Data rows
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'normal')
      
      filteredStudents.forEach((student, index) => {
        // Check for page break
        if (yPosition > pageHeight - 15) {
          doc.addPage()
          yPosition = 20
          
          // Redraw header on new page
          doc.setFillColor(11, 61, 123)
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(8)
          doc.setFont(undefined, 'bold')
          doc.rect(14, yPosition, 185, lineHeight, 'F')
          doc.text('S.No', 16, yPosition + 5)
          doc.text('Student Name', 26, yPosition + 5)
          doc.text('Adm No.', 76, yPosition + 5)
          doc.text('Gender', 106, yPosition + 5)
          doc.text('Phone', 126, yPosition + 5)
          doc.text('EMIS', 156, yPosition + 5)
          doc.text('Aadhaar', 176, yPosition + 5)
          yPosition += lineHeight
          doc.setTextColor(0, 0, 0)
          doc.setFont(undefined, 'normal')
        }
        
        // Alternate row background
        if (index % 2 === 0) {
          doc.setFillColor(245, 245, 245)
          doc.rect(14, yPosition, 185, lineHeight, 'F')
        }
        
        // Row data
        doc.text((index + 1).toString(), 16, yPosition + 5)
        doc.text(student.studentName?.substring(0, 20) || 'N/A', 26, yPosition + 5)
        doc.text(student.admissionNumber || 'N/A', 76, yPosition + 5)
        doc.text(student.gender || 'N/A', 106, yPosition + 5)
        doc.text(student.phoneNumber || 'N/A', 126, yPosition + 5)
        doc.text(student.emisNumber || student.emis || 'N/A', 156, yPosition + 5)
        doc.text(student.aadhaarNumber || student.aadharNumber || 'N/A', 176, yPosition + 5)
        
        yPosition += lineHeight
      })
      
      // Page numbers
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        )
      }
      
      const fileName = `${selectedStandard}${selectedSection ? '_' + selectedSection : ''}_Aadhaar_EMIS_Report.pdf`
      doc.save(fileName)
      toast.success("PDF report generated successfully")
    } catch (error) {
      toast.error("Failed to generate PDF report")
    }
  }

  // Generate unique key for table rows
  const generateStudentKey = (student, index) => {
    return student.id || student.admissionNumber || `student-${index}`
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
            <span>Aadhaar & EMIS Number Report</span>
          </nav>
        </div>

        {/* Header */}
        <div
          style={{ backgroundColor: "#0B3D7B" }}
          className="text-white p-3 rounded-top d-flex justify-content-between align-items-center"
        >
          <div className="d-flex align-items-center flex-wrap gap-2">
            <h2 className="mb-0 me-3">Aadhaar & EMIS Number Report</h2>
            {currentAcademicYear && (
              <span className="badge bg-light text-dark">
                Academic Year: {currentAcademicYear}
              </span>
            )}
            {schoolId && (
              <span className="badge bg-secondary">
                School ID: {schoolId}
              </span>
            )}
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-light"
              onClick={exportToExcel}
              disabled={!selectedStandard || filteredStudents.length === 0}
              className="d-flex align-items-center"
            >
              <FileSpreadsheet className="me-2" size={18} />
              Export Excel
            </Button>
            <Button
              variant="outline-light"
              onClick={exportToPDFSimple} 
              disabled={!selectedStandard || filteredStudents.length === 0}
              className="d-flex align-items-center"
            >
              <FilePdf className="me-2" size={18} />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Standard and Section Selection */}
        <div className="bg-white p-4 border-bottom">
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold">Standard :</Form.Label>
                <Form.Select 
                  value={selectedStandard} 
                  onChange={handleStandardChange} 
                  className="form-select-lg"
                  aria-label="Select standard"
                >
                  <option value="">Select Standard</option>
                  {standards.map((standard, index) => (
                    <option key={`standard-${index}`} value={standard}>
                      {standard}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold">Section :</Form.Label>
                <Form.Select 
                  value={selectedSection} 
                  onChange={handleSectionChange} 
                  className="form-select-lg"
                  disabled={!selectedStandard}
                  aria-label="Select section"
                >
                  <option value="">All Sections</option>
                  {sections.map((section, index) => (
                    <option key={`section-${index}`} value={section}>
                      {section}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold">Academic Year :</Form.Label>
                <Form.Control 
                  type="text" 
                  value={currentAcademicYear || "Not set"} 
                  className="form-control-lg"
                  disabled 
                  readOnly
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mt-2">
            <Col>
              <div className="text-muted small">
                Showing {filteredStudents.length} of {students.length} students
                {selectedStandard && ` for ${selectedStandard}`}
                {selectedSection && ` - ${selectedSection}`}
              </div>
            </Col>
          </Row>
        </div>

        {/* Table */}
        <div className="bg-white p-4 rounded-bottom">
          <div className="table-responsive" style={{ maxHeight: "70vh" }}>
            <Table striped bordered hover className="mb-0">
              <thead className="sticky-top">
                <tr>
                  <th className="text-center" style={{ width: "60px" }}>S.No</th>
                  <th style={{ minWidth: "150px" }}>Student Name</th>
                  <th style={{ minWidth: "120px" }}>Admission No.</th>
                  <th style={{ width: "80px" }}>Gender</th>
                  <th style={{ minWidth: "200px" }}>Address</th>
                  <th style={{ minWidth: "120px" }}>Phone Number</th>
                  <th style={{ minWidth: "100px" }}>Date of Birth</th>
                  <th style={{ minWidth: "120px" }}>Date of Admission</th>
                  <th style={{ minWidth: "120px" }}>EMIS Number</th>
                  <th style={{ minWidth: "120px" }}>Aadhaar Number</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <div className="mt-2">Loading student data...</div>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-4">
                      {selectedStandard 
                        ? "No students found for selected standard and section" 
                        : students.length > 0 
                          ? "Please select a standard to view students"
                          : "No student data available"
                      }
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, index) => (
                    <tr key={generateStudentKey(student, index)}>
                      <td className="text-center fw-semibold">{index + 1}</td>
                      <td className="fw-medium">{student.studentName || "N/A"}</td>
                      <td className="text-nowrap">{student.admissionNumber || "N/A"}</td>
                      <td className="text-center">{student.gender || "N/A"}</td>
                      <td className="small">{getFormattedAddress(student)}</td>
                      <td className="text-nowrap">{student.phoneNumber || "N/A"}</td>
                      <td className="text-nowrap">{formatDate(student.dateOfBirth)}</td>
                      <td className="text-nowrap">{formatDate(student.dateOfAdmission)}</td>
                      <td className="text-nowrap">{student.emisNumber || student.emis || "N/A"}</td>
                      <td className="text-nowrap">{student.aadhaarNumber || student.aadharNumber || "N/A"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </div>
      </Container>

      <style>
        {`
          .custom-breadcrumb {
            padding: 0.5rem 1rem;
            background-color: #f8f9fa;
            border-radius: 0.375rem;
          }

          .custom-breadcrumb a {
            color: #0B3D7B;
            text-decoration: none;
            font-weight: 500;
          }

          .custom-breadcrumb a:hover {
            text-decoration: underline;
          }

          .custom-breadcrumb .separator {
            margin: 0 0.5rem;
            color: #6c757d;
          }

          .form-select-lg {
            height: 45px;
            font-size: 1rem;
          }

          .table thead th {
            background-color: #0B3D7B;
            color: white;
            font-weight: 600;
            border: 1px solid #dee2e6;
            position: sticky;
            top: 0;
            z-index: 10;
          }

          .table tbody td {
            vertical-align: middle;
          }

          .table-responsive {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            border: 1px solid #dee2e6;
            border-radius: 0.375rem;
          }

          @media (max-width: 768px) {
            .table-responsive {
              font-size: 0.875rem;
            }
            
            .form-select-lg {
              font-size: 0.875rem;
            }
          }

          .sticky-top {
            position: sticky;
            top: 0;
          }
        `}
      </style>
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </MainContentPage>
  )
}

export default AdhaarEmisNumber