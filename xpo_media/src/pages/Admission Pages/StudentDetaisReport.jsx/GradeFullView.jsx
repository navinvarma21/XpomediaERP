"use client"

import { useState, useEffect, useCallback } from "react"
import { Container, Table, Button, Form, Row, Col, Spinner } from "react-bootstrap"
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

const GradeWiseReport = () => {
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [standardsLoading, setStandardsLoading] = useState(true)
  const [selectedStandard, setSelectedStandard] = useState("")
  const [standards, setStandards] = useState([])
  const { schoolId, currentAcademicYear, getAuthHeaders } = useAuthContext()

  useEffect(() => {
    if (schoolId && currentAcademicYear) {
      fetchStandards()
      fetchAllStudents()
    }
  }, [schoolId, currentAcademicYear])

  const filterStudents = useCallback(() => {
    if (selectedStandard) {
      const filtered = students.filter((student) => student.standard === selectedStandard)
      setFilteredStudents(filtered)
    } else {
      setFilteredStudents([])
    }
  }, [selectedStandard, students])

  useEffect(() => {
    filterStudents()
  }, [filterStudents])

  useEffect(() => {
    if (!selectedStandard) {
      toast.info("Please select a grade to view the report", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    }
  }, [selectedStandard])

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
      toast.error("Failed to fetch grades")
    } finally {
      setStandardsLoading(false)
    }
  }

  const fetchAllStudents = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/studentreport/datas?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch students: ${response.status}`)
      }

      const studentsData = await response.json()
      setStudents(studentsData)
    } catch (error) {
      console.error("Error fetching students:", error)
      toast.error("Failed to fetch student data")
    } finally {
      setLoading(false)
    }
  }

  const handleStandardChange = (e) => {
    const standard = e.target.value
    setSelectedStandard(standard)
  }

  const getFormattedAddress = (student) => {
    const parts = [
      student.streetVillage,
      student.placePincode,
      student.district,
      student.state
    ].filter(Boolean)
    return parts.join(", ")
  }

  const exportToExcel = () => {
    try {
      const exportData = filteredStudents.map((student, index) => ({
        "S.No": index + 1,
        "Name": student.studentName || "",
        "Admission No": student.admissionNumber || "",
        "Communication Address": getFormattedAddress(student),
        "Religion": student.religion || "",
        "Community": student.community || "",
        "Section": student.section || "",
        "Gender": student.gender || "",
        "Phone Number": student.phoneNumber || "",
        "Email": student.emailId || "",
        "Father Name": student.fatherName || "",
        "Mother Name": student.motherName || "",
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, `Grade ${selectedStandard} Report`)

      // Set column widths
      const colWidths = [
        { wch: 6 },   // S.No
        { wch: 25 },  // Name
        { wch: 15 },  // Admission No
        { wch: 40 },  // Communication Address
        { wch: 15 },  // Religion
        { wch: 15 },  // Community
        { wch: 10 },  // Section
        { wch: 10 },  // Gender
        { wch: 15 },  // Phone Number
        { wch: 25 },  // Email
        { wch: 20 },  // Father Name
        { wch: 20 },  // Mother Name
      ]
      ws["!cols"] = colWidths

      XLSX.writeFile(wb, `Grade_${selectedStandard}_Report.xlsx`)
      toast.success("Excel report generated successfully")
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      toast.error("Failed to generate Excel report")
    }
  }

  const exportToPDF = () => {
    try {
      const doc = new jsPDF()

      // Title
      doc.setFontSize(16)
      doc.setTextColor(11, 61, 123)
      doc.text("GRADE WISE REPORT", doc.internal.pageSize.width / 2, 15, { align: "center" })

      // School Info and Date
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      const today = new Date().toLocaleDateString("en-US", { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      doc.text(`School: ${schoolId}`, 15, 25)
      doc.text(`Grade: ${selectedStandard}`, doc.internal.pageSize.width / 2, 25, { align: "center" })
      doc.text(`Date: ${today}`, doc.internal.pageSize.width - 15, 25, { align: "right" })

      let yPos = 35
      let pageNumber = 1

      const tableColumn = ["S.No", "Name", "Admi.No.", "Address", "Religion", "Community", "Sec", "Gender", "Phone"]

      const tableRows = filteredStudents.map((student, index) => [
        index + 1,
        student.studentName || "-",
        student.admissionNumber || "-",
        getFormattedAddress(student) || "-",
        student.religion || "-",
        student.community || "-",
        student.section || "-",
        student.gender || "-",
        student.phoneNumber || "-",
      ])

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: yPos,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak",
          halign: "left",
        },
        headStyles: {
          fillColor: [11, 61, 123],
          textColor: 255,
          fontSize: 8,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 10 }, // S.No
          1: { cellWidth: 25 }, // Name
          2: { cellWidth: 20 }, // Admi.No.
          3: { cellWidth: 35 }, // Address
          4: { cellWidth: 20 }, // Religion
          5: { cellWidth: 20 }, // Community
          6: { cellWidth: 10 }, // Sec
          7: { cellWidth: 15 }, // Gender
          8: { cellWidth: 20 }, // Phone
        },
        margin: { top: 10 },
      })

      // Add page numbers
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(100)
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        )
      }

      doc.save(`Grade_${selectedStandard}_Report.pdf`)
      toast.success("PDF report generated successfully")
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      toast.error("Failed to generate PDF report")
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
            <span>Grade Wise Report</span>
          </nav>
        </div>

        {/* Header */}
        <div
          style={{ backgroundColor: "#0B3D7B" }}
          className="text-white p-3 rounded-top d-flex justify-content-between align-items-center"
        >
          <div className="d-flex align-items-center">
            <h2 className="mb-0">Grade Wise Report</h2>
            <div className="ms-4">
              <small>School: {schoolId} | Year: {currentAcademicYear}</small>
            </div>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-light"
              onClick={exportToExcel}
              disabled={!selectedStandard || filteredStudents.length === 0 || loading}
            >
              <FileSpreadsheet className="me-2" size={18} />
              Export Excel
            </Button>
            <Button
              variant="outline-light"
              onClick={exportToPDF}
              disabled={!selectedStandard || filteredStudents.length === 0 || loading}
            >
              <FilePdf className="me-2" size={18} />
              Export PDF
            </Button>
            <Button variant="light" onClick={fetchAllStudents} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Grade Selection */}
        <div className="bg-white p-4 border-bottom">
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">Select Grade:</Form.Label>
                <Form.Select 
                  value={selectedStandard} 
                  onChange={handleStandardChange} 
                  className="form-select-lg"
                  disabled={standardsLoading}
                >
                  <option value="">Select Grade</option>
                  {standardsLoading ? (
                    <option value="" disabled>Loading grades...</option>
                  ) : (
                    standards.map((standard, index) => (
                      <option key={index} value={standard}>
                        {standard}
                      </option>
                    ))
                  )}
                </Form.Select>
                {standardsLoading && (
                  <div className="mt-2">
                    <Spinner animation="border" size="sm" className="me-2" />
                    <small>Loading grades...</small>
                  </div>
                )}
              </Form.Group>
            </Col>
            <Col md={6} className="d-flex align-items-end">
              <div>
                <small className="text-muted">
                  {selectedStandard && `Showing ${filteredStudents.length} students in ${selectedStandard}`}
                </small>
              </div>
            </Col>
          </Row>
        </div>

        {/* Table */}
        <div className="bg-white p-4 rounded-bottom">
          <div className="table-responsive">
            {loading ? (
              <div className="text-center py-4">
                <Spinner animation="border" role="status" variant="primary">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-2">Loading student data...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-4">
                {selectedStandard ? (
                  <div>
                    <h5>No students found</h5>
                    <p>No students found for grade {selectedStandard} in the current academic year.</p>
                  </div>
                ) : (
                  <div>
                    <h5>Select a Grade</h5>
                    <p>Please select a grade from the dropdown to view the report.</p>
                  </div>
                )}
              </div>
            ) : (
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th className="text-center" style={{ width: "60px" }}>S.No</th>
                    <th>Name</th>
                    <th>Admi.No.</th>
                    <th>Communication Address</th>
                    <th>Religion</th>
                    <th>Community</th>
                    <th>Section</th>
                    <th>Gender</th>
                    <th>Phone No.</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <tr key={student.id || index}>
                      <td className="text-center">{index + 1}</td>
                      <td>{student.studentName || "-"}</td>
                      <td>{student.admissionNumber || "-"}</td>
                      <td>{getFormattedAddress(student) || "-"}</td>
                      <td>{student.religion || "-"}</td>
                      <td>{student.community || "-"}</td>
                      <td>{student.section || "-"}</td>
                      <td>{student.gender || "-"}</td>
                      <td>{student.phoneNumber || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
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

          .form-select-lg {
            height: 45px;
            font-size: 1rem;
          }

          .table thead th {
            background-color: #0B3D7B;
            color: white;
            font-weight: 500;
            border: 1px solid #dee2e6;
          }

          .table tbody td {
            vertical-align: middle;
          }

          .table-responsive {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          @media (max-width: 768px) {
            .table-responsive {
              max-height: 500px;
            }
            
            .table thead th,
            .table tbody td {
              font-size: 0.875rem;
              padding: 0.5rem;
            }
          }
        `}
      </style>
      <ToastContainer />
    </MainContentPage>
  )
}

export default GradeWiseReport