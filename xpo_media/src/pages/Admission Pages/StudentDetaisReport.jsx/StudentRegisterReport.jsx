"use client"

import { useState, useEffect } from "react"
import { Container, Table, Button } from "react-bootstrap"
import { Link } from "react-router-dom"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import { FileSpreadsheet, FileIcon as FilePdf } from 'lucide-react'

import MainContentPage from "../../../components/MainContent/MainContentPage"
import { useAuthContext } from "../../../Context/AuthContext"
import { ENDPOINTS } from "../../../SpringBoot/config"

const StudentRegisterReport = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const { schoolId, currentAcademicYear, getAuthHeaders } = useAuthContext()

  useEffect(() => {
    if (schoolId && currentAcademicYear) {
      fetchStudents()
    }
  }, [schoolId, currentAcademicYear])

  const fetchStudents = async () => {
    try {
      if (!schoolId) {
        toast.error("School ID not found. Please log in again.")
        return
      }

      if (!currentAcademicYear) {
        toast.error("Academic year not found. Please select an academic year.")
        return
      }
      
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/studentreport/school/${schoolId}?academicYear=${currentAcademicYear}`,
        {
          headers: getAuthHeaders()
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to fetch student data")
      }

      const studentsData = await response.json()
      setStudents(studentsData)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching students:", error)
      toast.error(error.message || "Failed to fetch student data")
      setLoading(false)
    }
  }

  const exportToExcel = () => {
    if (students.length === 0) {
      toast.warning("No data available to export")
      return
    }

    try {
      const exportData = students.map((student, index) => ({
        'S.No': index + 1,
        'Admn. No.': student.admissionNumber || 'N/A',
        'DOA': formatDate(student.dateOfAdmission),
        'Student Name': student.studentName || 'N/A',
        'Sex': student.gender || 'N/A',
        'Father name': student.fatherName || 'N/A',
        'Add1': student.placePincode || 'N/A',
        'Place Name': student.streetVillage || 'N/A',
        'Phone No.': student.phoneNumber || 'N/A',
        'Bus. No.': student.busRouteNumber || 'Nil',
        'DOB': formatDate(student.dateOfBirth),
        'Standard': student.standard || 'N/A',
        'Section': student.section || 'N/A',
        'Mother Name': student.motherName || 'N/A',
        'Email': student.emailId || 'N/A'
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Student Register")
      
      // Auto-size columns
      const maxWidth = exportData.reduce((w, r) => Math.max(w, r['Student Name']?.length || 0), 10)
      ws['!cols'] = [
        { wch: 5 },  // S.No
        { wch: 10 }, // Admn. No.
        { wch: 12 }, // DOA
        { wch: Math.max(maxWidth, 15) }, // Student Name
        { wch: 8 },  // Sex
        { wch: 15 }, // Father name
        { wch: 10 }, // Add1
        { wch: 15 }, // Place Name
        { wch: 12 }, // Phone No.
        { wch: 10 }, // Bus. No.
        { wch: 12 }, // DOB
        { wch: 10 }, // Standard
        { wch: 8 },  // Section
        { wch: 15 }, // Mother Name
        { wch: 20 }  // Email
      ]
      
      XLSX.writeFile(wb, `StudentRegister_${currentAcademicYear}.xlsx`)
      toast.success("Excel file exported successfully")
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      toast.error("Failed to export Excel file")
    }
  }

  const exportToPDF = () => {
    if (students.length === 0) {
      toast.warning("No data available to export")
      return
    }

    try {
      const doc = new jsPDF()
      
      // Add title
      doc.setFontSize(16)
      doc.setTextColor(40, 40, 40)
      doc.text(`Student Register Report - ${currentAcademicYear}`, 14, 15)
      
      // Add school info
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`School ID: ${schoolId}`, 14, 22)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28)
      doc.text(`Total Students: ${students.length}`, 14, 34)
      
      // Table configuration
      const startY = 45
      const lineHeight = 8
      const pageHeight = doc.internal.pageSize.height
      let currentY = startY
      
      // Table headers
      doc.setFillColor(11, 61, 123)
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.setFont(undefined, 'bold')
      
      const headers = ['S.No', 'Admn No.', 'Student Name', 'Gender', 'Father Name', 'Phone', 'Standard', 'Section']
      const colWidths = [12, 25, 45, 15, 40, 25, 20, 18]
      let currentX = 14
      
      // Draw header cells
      headers.forEach((header, index) => {
        doc.rect(currentX, currentY, colWidths[index], lineHeight, 'F')
        doc.text(header, currentX + 2, currentY + 5)
        currentX += colWidths[index]
      })
      
      currentY += lineHeight
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'normal')
      
      // Table rows
      students.forEach((student, index) => {
        // Check if we need a new page
        if (currentY > pageHeight - 20) {
          doc.addPage()
          currentY = 20
          
          // Redraw headers on new page
          doc.setFillColor(11, 61, 123)
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(8)
          doc.setFont(undefined, 'bold')
          
          currentX = 14
          headers.forEach((header, headerIndex) => {
            doc.rect(currentX, currentY, colWidths[headerIndex], lineHeight, 'F')
            doc.text(header, currentX + 2, currentY + 5)
            currentX += colWidths[headerIndex]
          })
          
          currentY += lineHeight
          doc.setTextColor(0, 0, 0)
          doc.setFont(undefined, 'normal')
        }
        
        // Add alternating background color BEFORE drawing text
        if (index % 2 === 0) {
          doc.setFillColor(240, 240, 240)
          doc.rect(14, currentY, 200, lineHeight, 'F')
        } else {
          doc.setFillColor(255, 255, 255)
          doc.rect(14, currentY, 200, lineHeight, 'F')
        }
        
        const rowData = [
          (index + 1).toString(),
          student.admissionNumber || 'N/A',
          student.studentName?.substring(0, 18) || 'N/A',
          student.gender || 'N/A',
          student.fatherName?.substring(0, 18) || 'N/A',
          student.phoneNumber || 'N/A',
          student.standard || 'N/A',
          student.section || 'N/A'
        ]
        
        // Draw text on top of background
        currentX = 14
        rowData.forEach((cell, cellIndex) => {
          doc.setTextColor(0, 0, 0) // Ensure text is black
          doc.text(cell, currentX + 2, currentY + 5)
          currentX += colWidths[cellIndex]
        })
        
        currentY += lineHeight
      })
      
      // Add page numbers
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

      doc.save(`StudentRegister_${currentAcademicYear}.pdf`)
      toast.success("PDF file exported successfully")
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      toast.error("Failed to export PDF file")
    }
  }

  // Simple PDF export with basic table (alternative approach)
  const exportToPDFSimple = () => {
    if (students.length === 0) {
      toast.warning("No data available to export")
      return
    }

    try {
      const doc = new jsPDF()
      
      // Add title and info
      doc.setFontSize(16)
      doc.setTextColor(40, 40, 40)
      doc.text(`Student Register Report - ${currentAcademicYear}`, 14, 15)
      
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`School ID: ${schoolId}`, 14, 25)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32)
      doc.text(`Total Students: ${students.length}`, 14, 39)
      
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
      doc.text('Admission No.', 26, yPosition + 5)
      doc.text('Student Name', 56, yPosition + 5)
      doc.text('Gender', 106, yPosition + 5)
      doc.text('Father Name', 126, yPosition + 5)
      doc.text('Phone', 166, yPosition + 5)
      doc.text('Standard', 186, yPosition + 5)
      
      yPosition += lineHeight
      
      // Data rows
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'normal')
      
      students.forEach((student, index) => {
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
          doc.text('Admission No.', 26, yPosition + 5)
          doc.text('Student Name', 56, yPosition + 5)
          doc.text('Gender', 106, yPosition + 5)
          doc.text('Father Name', 126, yPosition + 5)
          doc.text('Phone', 166, yPosition + 5)
          doc.text('Standard', 186, yPosition + 5)
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
        doc.text(student.admissionNumber || 'N/A', 26, yPosition + 5)
        doc.text(student.studentName?.substring(0, 20) || 'N/A', 56, yPosition + 5)
        doc.text(student.gender || 'N/A', 106, yPosition + 5)
        doc.text(student.fatherName?.substring(0, 15) || 'N/A', 126, yPosition + 5)
        doc.text(student.phoneNumber || 'N/A', 166, yPosition + 5)
        doc.text(student.standard || 'N/A', 186, yPosition + 5)
        
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
      
      doc.save(`StudentRegister_${currentAcademicYear}.pdf`)
      toast.success("PDF file exported successfully")
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      toast.error("Failed to export PDF file")
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-IN') // Indian date format
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <MainContentPage>
        <Container fluid className="px-0">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
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
            <span>Student Register Report</span>
          </nav>
        </div>

        {/* Academic Year Info */}
        {currentAcademicYear && (
          <div className="alert alert-info mb-3">
            <strong>Academic Year:</strong> {currentAcademicYear} | 
            <strong> Total Students:</strong> {students.length}
          </div>
        )}

        {/* Header */}
        <div
          style={{ backgroundColor: "#0B3D7B" }}
          className="text-white p-3 rounded-top d-flex justify-content-between align-items-center"
        >
          <div className="d-flex align-items-center">
            <h2 className="mb-0">Student Register Report</h2>
            {currentAcademicYear && (
              <span className="ms-3 badge bg-light text-dark">
                {currentAcademicYear}
              </span>
            )}
          </div>
          <div className="d-flex gap-2">
            <Button 
              variant="outline-light" 
              onClick={exportToExcel}
              disabled={students.length === 0}
            >
              <FileSpreadsheet className="me-2" size={18} />
              Export Excel
            </Button>
            <Button 
              variant="outline-light" 
              onClick={exportToPDFSimple}
              disabled={students.length === 0}
            >
              <FilePdf className="me-2" size={18} />
              Export PDF
            </Button>
            <Button 
              variant="light" 
              onClick={fetchStudents}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white p-4 rounded-bottom">
          {students.length === 0 ? (
            <div className="text-center py-5">
              <h5>No student data found</h5>
              <p className="text-muted">
                {!currentAcademicYear 
                  ? "Please select an academic year to view student data" 
                  : "No admissions found for the selected academic year"
                }
              </p>
              <Button variant="primary" onClick={fetchStudents}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th className="text-center">S.No</th>
                    <th>Admn. No.</th>
                    <th>DOA</th>
                    <th>Student Name</th>
                    <th>Sex</th>
                    <th>Father Name</th>
                    <th>Phone No.</th>
                    <th>Standard</th>
                    <th>Section</th>
                    <th>Address</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr key={student.id}>
                      <td className="text-center">{index + 1}</td>
                      <td className="fw-bold">{student.admissionNumber}</td>
                      <td>{formatDate(student.dateOfAdmission)}</td>
                      <td>
                        <div className="fw-semibold">{student.studentName}</div>
                        {student.motherName && (
                          <small className="text-muted">Mother: {student.motherName}</small>
                        )}
                      </td>
                      <td>{student.gender}</td>
                      <td>{student.fatherName}</td>
                      <td>{student.phoneNumber}</td>
                      <td>
                        <span className="badge bg-primary">{student.standard}</span>
                      </td>
                      <td>
                        {student.section && (
                          <span className="badge bg-secondary">{student.section}</span>
                        )}
                      </td>
                      <td>
                        <small>
                          {student.streetVillage && <div>{student.streetVillage}</div>}
                          {student.district && <div>{student.district}</div>}
                          {student.placePincode && <div>PIN: {student.placePincode}</div>}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
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

          .table thead th {
            background-color: #0B3D7B;
            color: white;
            font-weight: 500;
            border: 1px solid #dee2e6;
            vertical-align: middle;
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
            
            .d-flex.justify-content-between {
              flex-direction: column;
              gap: 1rem;
            }
          }
        `}
      </style>
      <ToastContainer />
    </MainContentPage>
  )
}

export default StudentRegisterReport