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
import autoTable from "jspdf-autotable"
import { FileSpreadsheet, FileIcon as FilePdf } from "lucide-react"

const ReligionWiseReport = () => {
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReligion, setSelectedReligion] = useState("")
  const [religions, setReligions] = useState([])
  
  const { schoolId, getAuthHeaders, currentAcademicYear } = useAuthContext()

  const filterStudents = useCallback(() => {
    if (selectedReligion) {
      const filtered = students.filter((student) => student.religion === selectedReligion)
      setFilteredStudents(filtered)
    } else {
      setFilteredStudents([])
    }
  }, [selectedReligion, students])

  useEffect(() => {
    filterStudents()
  }, [filterStudents])

  useEffect(() => {
    if (!selectedReligion && students.length > 0) {
      toast.info("Please select a religion to view the report", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    }
  }, [selectedReligion, students.length])

  const fetchReligions = useCallback(async () => {
    if (!schoolId) return
    
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/religions?schoolId=${schoolId}`,
        {
          headers: getAuthHeaders()
        }
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch religions: ${response.status}`)
      }
      
      const religionsData = await response.json()
      
      // Handle the specific API response format
      let religionsList = []
      if (Array.isArray(religionsData)) {
        // If it's an array of religion objects with name/religion properties
        religionsList = religionsData.map(item => {
          // Extract religion name from the object
          if (item && typeof item === 'object') {
            return item.religion || item.name || JSON.stringify(item)
          }
          return String(item)
        })
      } else if (religionsData && typeof religionsData === 'object') {
        // If it's a single object or wrapped response
        if (religionsData.religion) {
          religionsList = [religionsData.religion]
        } else if (religionsData.name) {
          religionsList = [religionsData.name]
        } else {
          // Try to extract all values
          religionsList = Object.values(religionsData)
            .filter(value => value !== null && value !== undefined)
            .map(value => {
              if (typeof value === 'object' && value.religion) {
                return value.religion
              }
              return String(value)
            })
        }
      }
      
      // Clean and deduplicate the list
      religionsList = [...new Set(religionsList
        .map(religion => String(religion).trim())
        .filter(religion => religion && religion !== 'undefined' && religion !== 'null' && religion !== '')
      )].sort()
      
      setReligions(religionsList)
    } catch (error) {
      toast.error("Failed to fetch religions")
      setReligions([])
    }
  }, [schoolId, getAuthHeaders])

  const fetchAllStudents = useCallback(async () => {
    if (!schoolId || !currentAcademicYear) return
    
    setLoading(true)
    try {
      // Using the new endpoint: /api/admissionmaster/studentreport/datas
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/studentreport/datas?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        {
          headers: getAuthHeaders()
        }
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch students: ${response.status}`)
      }
      
      const studentsData = await response.json()
      
      // Handle different response formats for students
      let studentsList = []
      if (Array.isArray(studentsData)) {
        studentsList = studentsData
      } else if (studentsData && typeof studentsData === 'object') {
        if (studentsData.data && Array.isArray(studentsData.data)) {
          studentsList = studentsData.data
        } else if (studentsData.students && Array.isArray(studentsData.students)) {
          studentsList = studentsData.students
        } else {
          studentsList = Object.values(studentsData)
        }
      }
      
      // Normalize student data with proper fallbacks using the new data structure
      studentsList = studentsList.map((student, index) => ({
        id: student.id || student.admissionNumber || `student-${index}`,
        studentName: String(student.studentName || student.name || student.fullName || "").trim() || "N/A",
        admissionNumber: String(student.admissionNumber || student.admissionNo || student.rollNumber || "").trim() || "N/A",
        religion: String(student.religion || student.religionName || "").trim() || "Not specified",
        community: String(student.community || student.communityName || "").trim() || "",
        caste: String(student.caste || student.casteName || "").trim() || "Nil",
        standard: String(student.standard || student.grade || student.class || "").trim() || "N/A",
        section: String(student.section || student.division || "").trim() || "N/A",
        gender: String(student.gender || student.sex || "").trim() || "N/A",
        streetVillage: String(student.streetVillage || student.address || student.residentialAddress || "").trim(),
        district: String(student.district || student.districtName || "").trim(),
        state: String(student.state || student.stateName || "").trim(),
        pincode: String(student.placePincode || student.pincode || student.zipCode || student.postalCode || "").trim(),
        dateOfBirth: student.dateOfBirth || student.dob || student.birthDate || "",
        dateOfAdmission: student.dateOfAdmission || student.admissionDate || student.joiningDate || "",
        // Additional fields from the new endpoint
        fatherName: String(student.fatherName || "").trim() || "N/A",
        motherName: String(student.motherName || "").trim() || "N/A",
        phoneNumber: String(student.phoneNumber || "").trim() || "N/A",
        emailId: String(student.emailId || "").trim() || "N/A",
        studentType: String(student.studentType || "").trim() || "N/A",
        studentCategory: String(student.studentCategory || "").trim() || "N/A"
      }))
      
      setStudents(studentsList)
    } catch (error) {
      toast.error("Failed to fetch student data")
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [schoolId, currentAcademicYear, getAuthHeaders])

  useEffect(() => {
    let mounted = true
    
    const fetchData = async () => {
      if (schoolId && currentAcademicYear && mounted) {
        try {
          await Promise.all([
            fetchReligions(),
            fetchAllStudents()
          ])
        } catch (error) {
          // Error handling is done in individual functions
        }
      }
    }

    fetchData()

    return () => {
      mounted = false
    }
  }, [schoolId, currentAcademicYear, fetchReligions, fetchAllStudents])

  const handleReligionChange = (e) => {
    const religion = e.target.value
    setSelectedReligion(religion)
  }

  const getFormattedAddress = (student) => {
    if (!student) return "Address not available"
    
    const addressParts = [
      student.streetVillage,
      student.district,
      student.state,
      student.pincode
    ].filter(part => part && part.trim() !== "")
    
    return addressParts.join(", ") || "Address not available"
  }

  const formatDate = (dateString) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return dateString
      }
      
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
        "Student Name": student.studentName,
        "Admission No": student.admissionNumber,
        "Religion": student.religion,
        "Community": student.community,
        "Caste": student.caste,
        "Standard": student.standard,
        "Section": student.section,
        "Gender": student.gender,
        "Address": getFormattedAddress(student),
        "Father Name": student.fatherName,
        "Mother Name": student.motherName,
        "Phone Number": student.phoneNumber,
        "Date of Birth": formatDate(student.dateOfBirth),
        "Date of Admission": formatDate(student.dateOfAdmission)
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Religion Wise Report")
      
      // Set column widths for better Excel formatting
      const colWidths = [
        { wch: 6 },   // S.No
        { wch: 25 },  // Student Name
        { wch: 15 },  // Admission No
        { wch: 15 },  // Religion
        { wch: 15 },  // Community
        { wch: 15 },  // Caste
        { wch: 10 },  // Standard
        { wch: 8 },   // Section
        { wch: 10 },  // Gender
        { wch: 40 },  // Address
        { wch: 20 },  // Father Name
        { wch: 20 },  // Mother Name
        { wch: 15 },  // Phone Number
        { wch: 12 },  // Date of Birth
        { wch: 15 }   // Date of Admission
      ]
      ws['!cols'] = colWidths
      
      const fileName = `Religion_Wise_Report_${selectedReligion}_${currentAcademicYear}.xlsx`
      XLSX.writeFile(wb, fileName)
      toast.success("Excel report generated successfully")
    } catch (error) {
      toast.error("Failed to generate Excel report")
    }
  }

  const exportToPDF = () => {
    if (filteredStudents.length === 0) {
      toast.warning("No data available to generate PDF")
      return
    }
    
    try {
      // Create new PDF document with landscape orientation for better table layout
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      // Title
      doc.setFontSize(18)
      doc.setTextColor(0, 0, 128)
      doc.text("RELIGION WISE STUDENT REPORT", doc.internal.pageSize.width / 2, 20, { align: "center" })

      // Report details
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      const today = new Date().toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      })
      
      doc.text(`Generated on: ${today}`, 20, 35)
      doc.text(`Academic Year: ${currentAcademicYear}`, 20, 42)
      doc.text(`Religion: ${selectedReligion}`, doc.internal.pageSize.width / 2, 35, { align: "center" })
      doc.text(`Total Students: ${filteredStudents.length}`, doc.internal.pageSize.width / 2, 42, { align: "center" })
      doc.text(`School ID: ${schoolId}`, doc.internal.pageSize.width - 20, 35, { align: "right" })

      // Prepare table data using the traditional array format for autoTable
      const tableColumns = [
        "S.No", 
        "Student Name", 
        "Admission No", 
        "Standard", 
        "Section", 
        "Gender", 
        "Community", 
        "Caste"
      ]

      const tableRows = filteredStudents.map((student, index) => [
        (index + 1).toString(),
        student.studentName || "N/A",
        student.admissionNumber || "N/A",
        student.standard || "N/A",
        student.section || "N/A",
        student.gender || "N/A",
        student.community || "N/A",
        student.caste || "N/A"
      ])

      // Generate autoTable with traditional configuration
      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 55,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 3,
          overflow: 'linebreak',
          halign: 'left',
        },
        headStyles: {
          fillColor: [11, 61, 123],
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 8
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { top: 55 }
      })

      // Add page numbers if multiple pages
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(100)
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width - 20,
          doc.internal.pageSize.height - 10
        )
      }

      const fileName = `Religion_Wise_Report_${selectedReligion}_${currentAcademicYear}.pdf`
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
            <span>Religion Wise Report</span>
          </nav>
        </div>

        {/* Header */}
        <div
          style={{ backgroundColor: "#0B3D7B" }}
          className="text-white p-3 rounded-top d-flex justify-content-between align-items-center flex-wrap gap-3"
        >
          <div className="d-flex align-items-center flex-wrap gap-2">
            <h2 className="mb-0 me-3">Religion Wise Report</h2>
            {currentAcademicYear && (
              <span className="badge bg-light text-dark">
                Academic Year: {currentAcademicYear}
              </span>
            )}
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-light"
              onClick={exportToExcel}
              disabled={!selectedReligion || filteredStudents.length === 0}
              className="d-flex align-items-center"
            >
              <FileSpreadsheet className="me-2" size={18} />
              Export Excel
            </Button>
            <Button
              variant="outline-light"
              onClick={exportToPDF}
              disabled={!selectedReligion || filteredStudents.length === 0}
              className="d-flex align-items-center"
            >
              <FilePdf className="me-2" size={18} />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Religion Selection */}
        <div className="bg-white p-4 border-bottom">
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold">Religion :</Form.Label>
                <Form.Select 
                  value={selectedReligion} 
                  onChange={handleReligionChange} 
                  className="form-select-lg"
                  aria-label="Select religion"
                >
                  <option value="">Select Religion</option>
                  {religions.map((religion, index) => (
                    <option key={`religion-${index}`} value={religion}>
                      {religion}
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
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold">School ID :</Form.Label>
                <Form.Control 
                  type="text" 
                  value={schoolId || "Not available"} 
                  className="form-control-lg"
                  disabled 
                  readOnly
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col>
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-muted small">
                  Showing {filteredStudents.length} of {students.length} students
                  {selectedReligion && ` for ${selectedReligion}`}
                </div>
                {selectedReligion && filteredStudents.length > 0 && (
                  <div className="text-success fw-semibold">
                    {((filteredStudents.length / students.length) * 100).toFixed(1)}% of total students
                  </div>
                )}
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
                  <th style={{ minWidth: "180px" }}>Student Name</th>
                  <th style={{ minWidth: "120px" }}>Admission No</th>
                  <th style={{ minWidth: "100px" }}>Religion</th>
                  <th style={{ minWidth: "120px" }}>Community</th>
                  <th style={{ minWidth: "120px" }}>Caste</th>
                  <th style={{ width: "80px" }}>Standard</th>
                  <th style={{ width: "70px" }}>Section</th>
                  <th style={{ width: "80px" }}>Gender</th>
                  <th style={{ minWidth: "200px" }}>Address</th>
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
                      {selectedReligion 
                        ? "No students found for selected religion" 
                        : students.length > 0 
                          ? "Please select a religion to view students"
                          : "No student data available"
                      }
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, index) => (
                    <tr key={generateStudentKey(student, index)}>
                      <td className="text-center fw-semibold">{index + 1}</td>
                      <td className="fw-medium">{student.studentName}</td>
                      <td className="text-nowrap">{student.admissionNumber}</td>
                      <td>{student.religion}</td>
                      <td>{student.community || "N/A"}</td>
                      <td>{student.caste}</td>
                      <td className="text-center">{student.standard}</td>
                      <td className="text-center">{student.section}</td>
                      <td className="text-center">{student.gender}</td>
                      <td className="small">{getFormattedAddress(student)}</td>
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
            
            .d-flex.flex-wrap {
              flex-direction: column;
              align-items: start !important;
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

export default ReligionWiseReport