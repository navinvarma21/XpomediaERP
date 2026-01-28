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

const RouteWiseReport = () => {
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRoute, setSelectedRoute] = useState("")
  const [busRoutes, setBusRoutes] = useState([])
  const [busFeesData, setBusFeesData] = useState([])

  const { schoolId, currentAcademicYear, getAuthHeaders } = useAuthContext()

  useEffect(() => {
    if (schoolId) {
      fetchBusRoutes()
      fetchAllStudents()
    }
  }, [schoolId, currentAcademicYear])

  const filterStudents = useCallback(() => {
    if (selectedRoute) {
      const filtered = students.filter((student) => student.busRouteNumber === selectedRoute)
      setFilteredStudents(filtered)
    } else {
      setFilteredStudents([])
    }
  }, [selectedRoute, students])

  useEffect(() => {
    filterStudents()
  }, [filterStudents])

  useEffect(() => {
    if (!selectedRoute) {
      toast.info("Please select a route number to view the report", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    }
  }, [selectedRoute])

  const fetchBusRoutes = async () => {
    try {
      if (!schoolId) {
        toast.error("School ID not available")
        return
      }

      // Fetch bus routes from bus fees endpoint
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/busfees?schoolId=${schoolId}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch bus routes data")
      }

      const busFeesData = await response.json()
      setBusFeesData(busFeesData)
      
      // Extract unique bus routes from bus fees data
      const routes = [...new Set(busFeesData
        .map(item => item.route)
        .filter(route => route && route.trim() !== "")
      )].sort()
      
      setBusRoutes(routes)
    } catch (error) {
      console.error("Error fetching bus routes:", error)
      toast.error("Failed to fetch bus routes")
      
      // Fallback: try to get routes from students data
      fetchRoutesFromStudents()
    }
  }

  const fetchRoutesFromStudents = async () => {
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/studentreport/datas?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch students data for routes")
      }

      const studentsData = await response.json()
      
      // Extract unique bus routes from students data
      const routes = [...new Set(studentsData
        .map(student => student.busRouteNumber)
        .filter(route => route && route.trim() !== "")
      )].sort()
      
      setBusRoutes(routes)
    } catch (error) {
      console.error("Error fetching routes from students:", error)
    }
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
    } catch (error) {
      console.error("Error fetching students:", error)
      toast.error("Failed to fetch student data")
    } finally {
      setLoading(false)
    }
  }

  const handleRouteChange = (e) => {
    const route = e.target.value
    setSelectedRoute(route)
  }

  const getPrimaryAddress = (student) => {
    const addressParts = [student.streetVillage, student.placePincode, student.state, student.district].filter(Boolean)
    return addressParts.join(", ")
  }

  const getCommunicationAddress = (student) => {
    return student.communicationAddress || "Same as Permanent Address"
  }

  // For UI display with Rupee symbol
  const getBusFeeForRouteUI = (route) => {
    const busFeeItem = busFeesData.find(item => item.route === route)
    return busFeeItem ? `₹${busFeeItem.amount}` : "Not set"
  }

  // For PDF export without special characters
  const getBusFeeForRoutePDF = (route) => {
    const busFeeItem = busFeesData.find(item => item.route === route)
    return busFeeItem ? `Rs. ${busFeeItem.amount}` : "Not set"
  }

  // For numeric value only
  const getBusFeeAmount = (route) => {
    const busFeeItem = busFeesData.find(item => item.route === route)
    return busFeeItem ? busFeeItem.amount : null
  }

  const getBoardingPointsForRoute = (route) => {
    const boardingPoints = [...new Set(busFeesData
      .filter(item => item.route === route && item.boardingPoint)
      .map(item => item.boardingPoint)
    )].join(", ")
    return boardingPoints || "Not specified"
  }

  const exportToExcel = () => {
    try {
      const exportData = filteredStudents.map((student, index) => ({
        "S.No": index + 1,
        "Reg No": student.admissionNumber || "",
        "Name": student.studentName || "",
        "Sec": student.section || "",
        "Std": student.standard || "",
        "Route No": student.busRouteNumber || "",
        "Boarding Point": student.boardingPoint || "",
        "Bus Fee": getBusFeeForRoutePDF(student.busRouteNumber),
        "Permanent Address": getPrimaryAddress(student),
        "Communication Address": getCommunicationAddress(student),
        "Phone": student.phoneNumber || "",
        "Father Name": student.fatherName || "",
        "Mother Name": student.motherName || ""
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Route Wise Report")
      
      // Auto-size columns
      const maxWidth = exportData.reduce((w, r) => Math.max(w, r['Permanent Address']?.length || 0), 10)
      if (!ws['!cols']) ws['!cols'] = []
      ws['!cols'][8] = { width: Math.min(maxWidth, 50) }
      
      XLSX.writeFile(wb, `Route_${selectedRoute}_Report_${currentAcademicYear}.xlsx`)
      toast.success("Excel report generated successfully")
    } catch (error) {
      console.error("Error generating Excel:", error)
      toast.error("Failed to generate Excel report")
    }
  }

  const exportToPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      let yPosition = 20

      // Title
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(0, 0, 128)
      doc.text("ROUTE WISE STUDENT REPORT", doc.internal.pageSize.getWidth() / 2, yPosition, { align: "center" })
      yPosition += 10

      // School Info
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(0, 0, 0)
      doc.text(`School ID: ${schoolId}`, 15, yPosition)
      
      // Date and Route
      const today = new Date().toLocaleDateString("en-US", { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      doc.text(`Report Date: ${today}`, doc.internal.pageSize.getWidth() / 2, yPosition, { align: "center" })
      doc.text(`Route Number: ${selectedRoute}`, doc.internal.pageSize.getWidth() - 15, yPosition, { align: "right" })
      yPosition += 5

      // Academic Year and Bus Fee
      doc.text(`Academic Year: ${currentAcademicYear}`, 15, yPosition)
      doc.text(`Bus Fee: ${getBusFeeForRoutePDF(selectedRoute)}`, doc.internal.pageSize.getWidth() / 2, yPosition, { align: "center" })
      yPosition += 10

      // Define table columns
      const tableColumns = [
        { header: "S.No", dataKey: "sno" },
        { header: "Reg No", dataKey: "admissionNumber" },
        { header: "Name", dataKey: "studentName" },
        { header: "Sec", dataKey: "section" },
        { header: "Std", dataKey: "standard" },
        { header: "Route No", dataKey: "busRouteNumber" },
        { header: "Boarding Point", dataKey: "boardingPoint" },
        { header: "Bus Fee", dataKey: "busFee" },
        { header: "Permanent Address", dataKey: "primaryAddress" },
        { header: "Phone", dataKey: "phoneNumber" }
      ]

      // Prepare table data
      const tableData = filteredStudents.map((student, index) => ({
        sno: (index + 1).toString(),
        admissionNumber: student.admissionNumber || "",
        studentName: student.studentName || "",
        section: student.section || "",
        standard: student.standard || "",
        busRouteNumber: student.busRouteNumber || "",
        boardingPoint: student.boardingPoint || "",
        busFee: getBusFeeForRoutePDF(student.busRouteNumber),
        primaryAddress: getPrimaryAddress(student),
        phoneNumber: student.phoneNumber || ""
      }))

      // Generate table using autoTable
      autoTable(doc, {
        head: [tableColumns.map(col => col.header)],
        body: tableData.map(row => tableColumns.map(col => row[col.dataKey])),
        startY: yPosition,
        theme: 'grid',
        styles: {
          fontSize: 7,
          cellPadding: 2,
          overflow: 'linebreak',
          halign: 'left'
        },
        headStyles: {
          fillColor: [11, 61, 123],
          textColor: 255,
          fontSize: 7,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' }, // S.No
          1: { cellWidth: 25 }, // Reg No
          2: { cellWidth: 30 }, // Name
          3: { cellWidth: 15, halign: 'center' }, // Sec
          4: { cellWidth: 20 }, // Std
          5: { cellWidth: 20 }, // Route No
          6: { cellWidth: 25 }, // Boarding Point
          7: { cellWidth: 20, halign: 'center' }, // Bus Fee
          8: { cellWidth: 45 }, // Permanent Address
          9: { cellWidth: 25 } // Phone
        },
        margin: { top: yPosition },
        didDrawPage: function (data) {
          // Footer with page number
          const pageCount = doc.internal.getNumberOfPages()
          doc.setFontSize(8)
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            doc.internal.pageSize.getWidth() - 20,
            doc.internal.pageSize.getHeight() - 10
          )
        }
      })

      // Save the PDF
      doc.save(`Route_${selectedRoute}_Report_${currentAcademicYear}.pdf`)
      toast.success("PDF report generated successfully")
      
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Failed to generate PDF report")
    }
  }

  // Alternative simple PDF export for complex data
  const exportToPDFDetailed = () => {
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4')
      
      let yPosition = 20

      // Title and Header
      doc.setFontSize(16)
      doc.setTextColor(0, 0, 128)
      doc.text("ROUTE WISE STUDENT DETAILED REPORT", 20, yPosition)
      
      yPosition += 8
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text(`School: ${schoolId} | Route: ${selectedRoute} | Academic Year: ${currentAcademicYear}`, 20, yPosition)
      doc.text(`Bus Fee: ${getBusFeeForRoutePDF(selectedRoute)}`, doc.internal.pageSize.width - 20, yPosition, { align: "right" })
      
      yPosition += 5
      doc.text(`Boarding Points: ${getBoardingPointsForRoute(selectedRoute)}`, 20, yPosition)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.width - 20, yPosition, { align: "right" })
      
      yPosition += 15

      // Student data
      filteredStudents.forEach((student, index) => {
        if (yPosition > 180 && index < filteredStudents.length - 1) {
          doc.addPage()
          yPosition = 20
        }

        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.text(`Student ${index + 1}: ${student.studentName}`, 20, yPosition)
        yPosition += 5
        
        doc.setFont("helvetica", "normal")
        doc.text(`Admission No: ${student.admissionNumber}`, 20, yPosition)
        doc.text(`Class: ${student.standard} - ${student.section}`, 80, yPosition)
        doc.text(`Route: ${student.busRouteNumber}`, 140, yPosition)
        yPosition += 5
        
        doc.text(`Boarding Point: ${student.boardingPoint || "Not specified"}`, 20, yPosition)
        doc.text(`Bus Fee: ${getBusFeeForRoutePDF(student.busRouteNumber)}`, 120, yPosition)
        yPosition += 5
        
        doc.text(`Phone: ${student.phoneNumber}`, 20, yPosition)
        yPosition += 5
        
        doc.text(`Permanent Address: ${getPrimaryAddress(student)}`, 20, yPosition)
        yPosition += 5
        
        doc.text(`Communication Address: ${getCommunicationAddress(student)}`, 20, yPosition)
        yPosition += 10
        
        // Separator line
        doc.setDrawColor(200, 200, 200)
        doc.line(20, yPosition, doc.internal.pageSize.width - 20, yPosition)
        yPosition += 5
      })

      doc.save(`Route_${selectedRoute}_Detailed_Report_${currentAcademicYear}.pdf`)
      toast.success("Detailed PDF report generated successfully")
      
    } catch (error) {
      console.error("Error in detailed PDF export:", error)
      toast.error("Failed to generate detailed PDF report")
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
        {/* Breadcrumb Navigation */}
        <div className="mb-4">
          <nav className="custom-breadcrumb py-1 py-lg-3">
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <Link to="/reports">Reports</Link>
            <span className="separator mx-2">&gt;</span>
            <span>Route Wise Report</span>
          </nav>
        </div>

        {/* Header */}
        <div
          style={{ backgroundColor: "#0B3D7B" }}
          className="text-white p-3 rounded-top d-flex justify-content-between align-items-center"
        >
          <div className="d-flex align-items-center">
            <h2 className="mb-0">Route Wise Report</h2>
            <span className="ms-3 badge bg-light text-dark">
              {schoolId} | {currentAcademicYear}
            </span>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-light"
              onClick={exportToExcel}
              disabled={!selectedRoute || filteredStudents.length === 0}
            >
              <FileSpreadsheet className="me-2" size={18} />
              Export Excel
            </Button>
            <Button
              variant="outline-light"
              onClick={exportToPDF}
              disabled={!selectedRoute || filteredStudents.length === 0}
            >
              <FilePdf className="me-2" size={18} />
              Export PDF
            </Button>
            <Button
              variant="outline-light"
              onClick={exportToPDFDetailed}
              disabled={!selectedRoute || filteredStudents.length === 0}
              title="Detailed PDF Report"
            >
              <FilePdf className="me-2" size={18} />
              Detailed PDF
            </Button>
          </div>
        </div>

        {/* Route Selection */}
        <div className="bg-white p-4 border-bottom">
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Route Number :</Form.Label>
                <Form.Select value={selectedRoute} onChange={handleRouteChange} className="form-select-lg">
                  <option value="">Select Route Number</option>
                  {busRoutes.map((route, index) => (
                    <option key={index} value={route}>
                      {route} {getBusFeeForRouteUI(route) !== "Not set" && `- ${getBusFeeForRouteUI(route)}`}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={8} className="d-flex align-items-end">
              <div className="text-muted">
                <small>
                  Showing {filteredStudents.length} students for Route {selectedRoute || "selected route"}
                  {selectedRoute && ` (Bus Fee: ${getBusFeeForRouteUI(selectedRoute)})`}
                  {busRoutes.length > 0 && ` | Total ${busRoutes.length} routes available`}
                </small>
              </div>
            </Col>
          </Row>
        </div>

        {/* Table */}
        <div className="bg-white p-4 rounded-bottom">
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th className="text-center">S.No</th>
                  <th>Reg No</th>
                  <th>Name</th>
                  <th>Sec</th>
                  <th>Std</th>
                  <th>Route No</th>
                  <th>Boarding Point</th>
                  <th>Bus Fee</th>
                  <th>Permanent Address</th>
                  <th>Communication Address</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="11" className="text-center py-4">
                      Loading student data...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center py-4">
                      {selectedRoute ? "No students found for selected route" : "Please select a route number"}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, index) => (
                    <tr key={student.id}>
                      <td className="text-center">{index + 1}</td>
                      <td>{student.admissionNumber}</td>
                      <td>{student.studentName}</td>
                      <td>{student.section}</td>
                      <td>{student.standard}</td>
                      <td>{student.busRouteNumber}</td>
                      <td>{student.boardingPoint || "Not specified"}</td>
                      <td className="text-center">{getBusFeeForRouteUI(student.busRouteNumber)}</td>
                      <td>{getPrimaryAddress(student)}</td>
                      <td>{getCommunicationAddress(student)}</td>
                      <td>{student.phoneNumber}</td>
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
            font-size: 0.9rem;
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
        `}
      </style>
      <ToastContainer />
    </MainContentPage>
  )
}

export default RouteWiseReport