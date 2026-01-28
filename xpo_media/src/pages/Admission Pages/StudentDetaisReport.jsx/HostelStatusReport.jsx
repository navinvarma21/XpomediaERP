"use client"

import { useState, useEffect } from "react"
import { Container, Table, Button } from "react-bootstrap"
import { useAuthContext } from "../../../Context/AuthContext"
import { ENDPOINTS } from "../../../SpringBoot/config"
import MainContentPage from "../../../components/MainContent/MainContentPage"
import { Link } from "react-router-dom"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { FileText, FileSpreadsheet } from "lucide-react"

const HostelStatusReport = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const { schoolId, currentAcademicYear, getAuthHeaders } = useAuthContext()

  useEffect(() => {
    if (schoolId && currentAcademicYear) {
      fetchHostelStudents()
    }
  }, [schoolId, currentAcademicYear])

  const fetchHostelStudents = async () => {
    try {
      setLoading(true)
      
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
      
      // Filter students who require hostel (hostelFee > 0 or lunchRefresh indicates hostel requirement)
      const hostelStudents = studentsData.filter((student) => 
        (student.hostelFee !== undefined && student.hostelFee !== null && student.hostelFee > 0) ||
        (student.lunchRefresh && student.lunchRefresh.toLowerCase().includes('hostel'))
      )

      setStudents(hostelStudents)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching hostel students:", error)
      toast.error("Failed to fetch hostel student data")
      setLoading(false)
    }
  }

  const exportToPDF = () => {
    try {
      const doc = new jsPDF()

      // Title
      doc.setFontSize(16)
      doc.setTextColor(11, 61, 123)
      doc.text("HOSTEL STATUS REPORT", doc.internal.pageSize.width / 2, 15, { align: "center" })

      // School Info
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text(`School ID: ${schoolId}`, 15, 25)
      doc.text(`Academic Year: ${currentAcademicYear}`, 15, 32)

      let yPos = 45

      // Table headers
      const tableColumn = ["S.No", "Admission No", "Name", "Lunch/Refresh", "Gender", "Standard", "Section", "Hostel Fee"]

      // Table rows - Remove ₹ symbol and use plain numbers
      const tableRows = students.map((student, index) => [
        index + 1,
        student.admissionNumber || "-",
        student.studentName || "-",
        student.lunchRefresh || "N/A",
        student.gender || "N/A",
        student.standard || "N/A",
        student.section || "N/A",
        student.hostelFee ? student.hostelFee.toString() : "0" // Remove ₹ symbol
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
          1: { cellWidth: 25 }, // Admission No
          2: { cellWidth: 30 }, // Name
          3: { cellWidth: 25 }, // Lunch/Refresh
          4: { cellWidth: 15 }, // Gender
          5: { cellWidth: 20 }, // Standard
          6: { cellWidth: 15 }, // Section
          7: { cellWidth: 20, halign: "right" }, // Hostel Fee
        },
        margin: { top: 10 },
        didDrawCell: (data) => {
          // Add INR symbol manually to hostel fee column (column index 7)
          if (data.section === 'body' && data.column.index === 7 && data.cell.raw !== "0") {
            const text = `₹${data.cell.raw}`
            doc.setTextColor(0, 0, 0)
            doc.setFontSize(8)
            doc.text(text, data.cell.x + data.cell.width - 2, data.cell.y + data.cell.height / 2 + 2, {
              align: 'right'
            })
            // Return false to prevent default text rendering
            return false
          }
        },
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

      doc.save("HostelStatusReport.pdf")
      toast.success("PDF report generated successfully")
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      toast.error("Failed to generate PDF report")
    }
  }

  // Alternative PDF export without custom symbol handling
  const exportToPDFAlternative = () => {
    try {
      const doc = new jsPDF()

      // Title
      doc.setFontSize(16)
      doc.setTextColor(11, 61, 123)
      doc.text("HOSTEL STATUS REPORT", doc.internal.pageSize.width / 2, 15, { align: "center" })

      // School Info
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text(`School ID: ${schoolId}`, 15, 25)
      doc.text(`Academic Year: ${currentAcademicYear}`, 15, 32)

      let yPos = 45

      // Table headers - Change "Hostel Fee" to "Fee (INR)"
      const tableColumn = ["S.No", "Admission No", "Name", "Lunch/Refresh", "Gender", "Standard", "Section", "Fee (INR)"]

      // Table rows - Use plain numbers without symbol
      const tableRows = students.map((student, index) => [
        index + 1,
        student.admissionNumber || "-",
        student.studentName || "-",
        student.lunchRefresh || "N/A",
        student.gender || "N/A",
        student.standard || "N/A",
        student.section || "N/A",
        student.hostelFee || 0
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
          1: { cellWidth: 25 }, // Admission No
          2: { cellWidth: 30 }, // Name
          3: { cellWidth: 25 }, // Lunch/Refresh
          4: { cellWidth: 15 }, // Gender
          5: { cellWidth: 20 }, // Standard
          6: { cellWidth: 15 }, // Section
          7: { cellWidth: 20, halign: "right" }, // Fee (INR)
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

      doc.save("HostelStatusReport.pdf")
      toast.success("PDF report generated successfully")
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      toast.error("Failed to generate PDF report")
    }
  }

  const exportToExcel = () => {
    try {
      const exportData = students.map((student, index) => ({
        "S.No": index + 1,
        "Admission No": student.admissionNumber,
        "Name": student.studentName,
        "Lunch/Refresh": student.lunchRefresh || "N/A",
        "Gender": student.gender || "N/A",
        "Standard": student.standard || "N/A",
        "Section": student.section || "N/A",
        "Hostel Fee (₹)": student.hostelFee || 0,
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "HostelStatusReport")

      // Set column widths
      const colWidths = [
        { wch: 6 },  // S.No
        { wch: 15 }, // Admission No
        { wch: 25 }, // Name
        { wch: 20 }, // Lunch/Refresh
        { wch: 12 }, // Gender
        { wch: 15 }, // Standard
        { wch: 12 }, // Section
        { wch: 15 }, // Hostel Fee
      ]
      ws["!cols"] = colWidths

      XLSX.writeFile(wb, "HostelStatusReport.xlsx")
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
            <span>Hostel Status Report</span>
          </nav>
        </div>

        {/* Header */}
        <div
          style={{ backgroundColor: "#0B3D7B" }}
          className="text-white p-3 rounded-top d-flex justify-content-between align-items-center"
        >
          <div className="d-flex align-items-center">
            <h2 className="mb-0">Hostel Status Report</h2>
            <div className="ms-4">
              <small>School: {schoolId} | Year: {currentAcademicYear} | Total: {students.length} students</small>
            </div>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-light" onClick={exportToPDFAlternative} disabled={loading || students.length === 0}>
              <FileText className="me-2" size={18} />
              Export PDF
            </Button>
            <Button variant="outline-light" onClick={exportToExcel} disabled={loading || students.length === 0}>
              <FileSpreadsheet className="me-2" size={18} />
              Export Excel
            </Button>
            <Button variant="light" onClick={fetchHostelStudents} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white p-4 rounded-bottom">
          <div className="table-responsive">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading hostel student data...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-4">
                <h5>No hostel students found</h5>
                <p>No students requiring hostel facilities found for the current academic year.</p>
              </div>
            ) : (
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th className="text-center" style={{ width: "60px" }}>
                      S.No
                    </th>
                    <th>Admission No</th>
                    <th>Name</th>
                    <th>Lunch/Refresh</th>
                    <th>Gender</th>
                    <th>Standard</th>
                    <th>Section</th>
                    <th>Hostel Fee (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr key={student.id || index}>
                      <td className="text-center">{index + 1}</td>
                      <td>{student.admissionNumber}</td>
                      <td>{student.studentName}</td>
                      <td>{student.lunchRefresh || "N/A"}</td>
                      <td>{student.gender || "N/A"}</td>
                      <td>{student.standard || "N/A"}</td>
                      <td>{student.section || "N/A"}</td>
                      <td>₹{student.hostelFee || 0}</td>
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
          }

          .text-primary {
            color: #0B3D7B !important;
          }
        `}
      </style>
      <ToastContainer />
    </MainContentPage>
  )
}

export default HostelStatusReport