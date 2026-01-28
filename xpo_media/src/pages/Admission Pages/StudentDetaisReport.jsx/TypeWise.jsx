"use client"

import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import { Form, Button, Row, Col, Container, Table } from "react-bootstrap"
import { useAuthContext } from "../../../Context/AuthContext"
import { ENDPOINTS } from "../../../SpringBoot/config"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import MainContentPage from "../../../components/MainContent/MainContentPage"
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { FileText, FileSpreadsheet } from 'lucide-react'

const TypeWise = () => {
  const [studentType, setStudentType] = useState("New")
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState("")

  const { schoolId, currentAcademicYear, getAuthHeaders } = useAuthContext()

  useEffect(() => {
    const today = new Date()
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`
    setCurrentDate(formattedDate)
    
    if (schoolId) {
      fetchAllStudents()
    }
  }, [schoolId, currentAcademicYear])

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
    } catch (error) {
      console.error("Error fetching students:", error)
      toast.error("Failed to fetch student data")
    } finally {
      setLoading(false)
    }
  }

  // Filter students by studentType
  useEffect(() => {
    if (students.length > 0) {
      const filtered = students.filter(student => student.studentType === studentType)
      setFilteredStudents(filtered)
    } else {
      setFilteredStudents([])
    }
  }, [students, studentType])

  const handleTypeChange = (e) => {
    setStudentType(e.target.value)
  }

  const formatAddress = (student) => {
    const addressParts = []
    
    if (student.streetVillage) addressParts.push(student.streetVillage)
    if (student.placePincode) addressParts.push(student.placePincode)
    if (student.district) addressParts.push(student.district)
    if (student.state) addressParts.push(student.state)
    if (student.communicationAddress) addressParts.push(student.communicationAddress)
    
    return addressParts.join(", ")
  }

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${studentType} Students Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            font-size: 12pt;
          }
          .print-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #0B3D7B;
            padding-bottom: 10px;
          }
          .print-title {
            color: #0B3D7B;
            font-size: 18pt;
            font-weight: bold;
            margin: 0;
          }
          .print-subtitle {
            color: #555;
            font-size: 12pt;
            margin: 5px 0;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          .print-table th {
            background-color: #0B3D7B !important;
            color: white !important;
            padding: 8px;
            text-align: left;
            border: 1px solid #ddd;
            font-weight: bold;
          }
          .print-table td {
            padding: 8px;
            border: 1px solid #ddd;
          }
          .print-footer {
            margin-top: 20px;
            text-align: center;
            font-weight: bold;
            color: #0B3D7B;
          }
          @media print {
            body { margin: 0; }
            .print-table th { background-color: #0B3D7B !important; color: white !important; }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1 class="print-title">${studentType.toUpperCase()} STUDENTS REPORT</h1>
          <div class="print-subtitle">School: ${schoolId} | Academic Year: ${currentAcademicYear}</div>
          <div class="print-subtitle">Date: ${currentDate}</div>
        </div>
        
        <table class="print-table">
          <thead>
            <tr>
              <th width="5%">S.No</th>
              <th width="25%">Student Name</th>
              <th width="50%">Address</th>
              <th width="20%">Phone Number</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStudents.map((student, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${student.studentName || "-"}</td>
                <td>${formatAddress(student) || "-"}</td>
                <td>${student.phoneNumber || "-"}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="print-footer">
          Total ${studentType} Students: ${filteredStudents.length}
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    
    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const handlePDFDownload = () => {
    try {
      const doc = new jsPDF()
      
      // Title and Header
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(0, 0, 128)
      doc.text(`${studentType.toUpperCase()} STUDENTS REPORT`, doc.internal.pageSize.getWidth() / 2, 15, { align: "center" })
      
      // School Info
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(0, 0, 0)
      doc.text(`School ID: ${schoolId}`, 15, 25)
      doc.text(`Academic Year: ${currentAcademicYear}`, doc.internal.pageSize.getWidth() / 2, 25, { align: "center" })
      doc.text(`Date: ${currentDate}`, doc.internal.pageSize.getWidth() - 15, 25, { align: "right" })

      // Define table columns
      const tableColumns = [
        { header: "S.No", dataKey: "sno" },
        { header: "Student Name", dataKey: "studentName" },
        { header: "Address", dataKey: "address" },
        { header: "Phone Number", dataKey: "phoneNumber" }
      ]

      // Prepare table data
      const tableData = filteredStudents.map((student, index) => ({
        sno: (index + 1).toString(),
        studentName: student.studentName || "-",
        address: formatAddress(student) || "-",
        phoneNumber: student.phoneNumber || "-"
      }))

      // Generate table using autoTable
      autoTable(doc, {
        head: [tableColumns.map(col => col.header)],
        body: tableData.map(row => tableColumns.map(col => row[col.dataKey])),
        startY: 35,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
          overflow: 'linebreak',
          halign: 'left'
        },
        headStyles: {
          fillColor: [11, 61, 123],
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' }, // S.No
          1: { cellWidth: 40 }, // Student Name
          2: { cellWidth: 100 }, // Address
          3: { cellWidth: 35 } // Phone Number
        },
        margin: { top: 35 },
        didDrawPage: function (data) {
          // Footer with page number and total count
          const pageCount = doc.internal.getNumberOfPages()
          doc.setFontSize(8)
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            doc.internal.pageSize.getWidth() - 20,
            doc.internal.pageSize.getHeight() - 10
          )
          
          // Add total count on first page
          if (data.pageNumber === 1) {
            doc.text(
              `Total ${studentType} Students: ${filteredStudents.length}`,
              15,
              doc.internal.pageSize.getHeight() - 10
            )
          }
        }
      })

      doc.save(`${studentType}_Students_Report_${currentAcademicYear}.pdf`)
      toast.success("PDF report generated successfully")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Failed to generate PDF report")
    }
  }

  const handleExcelDownload = () => {
    try {
      const exportData = filteredStudents.map((student, index) => ({
        "S.No": index + 1,
        "Student Name": student.studentName || "-",
        "Address": formatAddress(student) || "-",
        "Phone Number": student.phoneNumber || "-",
        "Admission Number": student.admissionNumber || "-",
        "Class": student.standard || "-",
        "Section": student.section || "-",
        "Gender": student.gender || "-",
        "Father Name": student.fatherName || "-"
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, `${studentType} Students`)
      
      // Auto-size columns
      const maxWidthAddress = exportData.reduce((w, r) => Math.max(w, r['Address']?.length || 0), 10)
      if (!ws['!cols']) ws['!cols'] = []
      ws['!cols'][2] = { width: Math.min(maxWidthAddress, 50) }
      
      XLSX.writeFile(wb, `${studentType}_Students_Report_${currentAcademicYear}.xlsx`)
      toast.success("Excel report generated successfully")
    } catch (error) {
      console.error("Error generating Excel:", error)
      toast.error("Failed to generate Excel report")
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
            <Link to="/admission">Admission</Link>
            <span className="separator mx-2">&gt;</span>
            <span>Type Wise Report</span>
          </nav>
        </div>

        <div
          style={{ backgroundColor: "#0B3D7B" }}
          className="text-white p-3 rounded-top d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center"
        >
          <div className="d-flex align-items-center mb-3 mb-md-0">
            <h2 className="mb-0">Student Type Wise Report</h2>
            <span className="ms-3 badge bg-light text-dark">
              {schoolId} | {currentAcademicYear}
            </span>
          </div>
          <div className="d-flex flex-column flex-md-row">
            <Button 
              variant="outline-light" 
              size="sm" 
              onClick={handlePDFDownload}
              disabled={filteredStudents.length === 0}
              className="d-print-none me-md-2 mb-2 mb-md-0"
            >
              <FileText size={18} className="me-1" />
              Download PDF
            </Button>
            <Button 
              variant="outline-light" 
              size="sm" 
              onClick={handleExcelDownload}
              disabled={filteredStudents.length === 0}
              className="d-print-none me-md-2 mb-2 mb-md-0"
            >
              <FileSpreadsheet size={18} className="me-1" />
              Download Excel
            </Button>
            <Button 
              variant="outline-light" 
              size="sm" 
              onClick={handlePrint}
              disabled={filteredStudents.length === 0}
              className="d-print-none"
            >
              Print Report
            </Button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-bottom shadow">
          <div className="d-print-none mb-4">
            <Row>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Select Student Type</Form.Label>
                  <Form.Select
                    value={studentType}
                    onChange={handleTypeChange}
                    className="form-control-blue"
                  >
                    <option value="New">New</option>
                    <option value="Existing">Existing</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={8} className="d-flex align-items-end">
                <div className="text-muted">
                  <small>
                    Showing {filteredStudents.length} {studentType.toLowerCase()} students out of {students.length} total students
                  </small>
                </div>
              </Col>
            </Row>
          </div>

          {/* Print-only header - hidden on screen, visible in print */}
          <div className="d-none d-print-block">
            <div className="text-center mb-3">
              <h3 className="text-primary">${studentType.toUpperCase()} STUDENTS REPORT</h3>
              <p className="text-muted">
                School: {schoolId} | Academic Year: {currentAcademicYear} | Date: {currentDate}
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <Table bordered hover className="student-table">
              <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                <tr>
                  <th width="5%">S.No</th>
                  <th width="25%">Student Name</th>
                  <th width="50%">Address</th>
                  <th width="20%">Phone Number</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <div className="mt-2">Loading student data...</div>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      No {studentType.toLowerCase()} students found for the current academic year
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, index) => (
                    <tr key={student.id}>
                      <td className="text-center">{index + 1}</td>
                      <td>
                        <div>
                          <strong>{student.studentName || "-"}</strong>
                          {student.admissionNumber && (
                            <div className="text-muted small d-print-none">Adm No: {student.admissionNumber}</div>
                          )}
                        </div>
                      </td>
                      <td>{formatAddress(student) || "-"}</td>
                      <td>{student.phoneNumber || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          {!loading && filteredStudents.length > 0 && (
            <div className="report-footer mt-4 text-center">
              <p className="fw-bold text-primary">Total {studentType} Students: {filteredStudents.length}</p>
              <p className="text-muted small d-print-none">
                School: {schoolId} | Academic Year: {currentAcademicYear} | Generated on: {currentDate}
              </p>
              {/* Print-only footer */}
              <p className="fw-bold text-primary d-none d-print-block">
                Total {studentType} Students: {filteredStudents.length}
              </p>
            </div>
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

          .form-control-blue {
            background-color: #F0F4FF !important;
            border: 1px solid #E2E8F0;
            border-radius: 4px;
            padding: 0.5rem;
          }

          .form-control-blue:focus {
            border-color: #0B3D7B;
            box-shadow: 0 0 0 0.2rem rgba(11, 61, 123, 0.25);
          }

          .report-title {
            color: #0B3D7B;
            font-size: 1.2rem;
            font-weight: 600;
          }

          .report-date {
            font-weight: 500;
            color: #555;
          }

          .student-table th {
            vertical-align: middle;
            font-weight: 600;
          }

          .student-table td {
            vertical-align: middle;
          }

          .report-footer {
            font-weight: 500;
            color: #0B3D7B;
          }

          @media (max-width: 767px) {
            .d-flex.flex-column.flex-md-row {
              width: 100%;
            }
            
            .student-table {
              font-size: 0.875rem;
            }
          }

          @media print {
            body * {
              visibility: hidden;
            }
            .bg-white, .bg-white * {
              visibility: visible;
            }
            .bg-white {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              border: none !important;
              box-shadow: none !important;
            }
            .d-print-none {
              display: none !important;
            }
            .d-print-block {
              display: block !important;
            }
            .d-none.d-print-block {
              display: block !important;
            }
            .student-table {
              width: 100%;
              border-collapse: collapse;
            }
            .student-table th {
              background-color: #0B3D7B !important;
              color: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .table-responsive {
              overflow: visible !important;
            }
            .container-fluid {
              padding: 0 !important;
            }
            .rounded-bottom {
              border-radius: 0 !important;
            }
            .shadow {
              box-shadow: none !important;
            }
          }
        `}
      </style>
      <ToastContainer />
    </MainContentPage>
  )
}

export default TypeWise