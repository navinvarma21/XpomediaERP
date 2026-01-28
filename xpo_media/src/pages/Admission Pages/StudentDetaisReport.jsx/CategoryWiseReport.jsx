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

const CommunityWiseReport = () => {
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCommunity, setSelectedCommunity] = useState("")
  const [communities, setCommunities] = useState([])
  
  const { schoolId, currentAcademicYear, getAuthHeaders } = useAuthContext()

  useEffect(() => {
    if (schoolId) {
      fetchCommunities()
      fetchAllStudents()
    }
  }, [schoolId, currentAcademicYear])

  const filterStudents = useCallback(() => {
    if (selectedCommunity) {
      const filtered = students.filter((student) => student.community === selectedCommunity)
      setFilteredStudents(filtered)
    } else {
      setFilteredStudents([])
    }
  }, [selectedCommunity, students])

  useEffect(() => {
    filterStudents()
  }, [filterStudents])

  useEffect(() => {
    if (!selectedCommunity) {
      toast.info("Please select a community to view the report", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    }
  }, [selectedCommunity])

  const fetchCommunities = async () => {
    try {
      if (!schoolId) {
        toast.error("School ID not available")
        return
      }

      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/communities?schoolId=${schoolId}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch communities")
      }

      const communitiesData = await response.json()
      // Assuming the API returns an array of community objects with community property
      const communityNames = communitiesData.map(community => community.community || community.name)
      setCommunities(communityNames)
    } catch (error) {
      console.error("Error fetching communities:", error)
      toast.error("Failed to fetch communities")
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

  const handleCommunityChange = (e) => {
    const community = e.target.value
    setSelectedCommunity(community)
  }

  const getFormattedAddress = (student) => {
    const addressParts = [student.streetVillage, student.placePincode, student.state, student.district].filter(Boolean)
    return addressParts.join(", ")
  }

  const exportToExcel = () => {
    try {
      const exportData = filteredStudents.map((student, index) => ({
        "S.No": index + 1,
        "Student Name": student.studentName || "",
        "Per.Address": getFormattedAddress(student),
        "Religion": student.religion || "",
        "Community": student.community || "",
        "Std": student.standard || "",
        "Sec": student.section || "",
        "Gender": student.gender || "",
        "Caste": student.caste || "Nil",
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Community Wise Report")
      XLSX.writeFile(wb, `${selectedCommunity}_Community_Report_${currentAcademicYear}.xlsx`)
      toast.success("Excel report generated successfully")
    } catch (error) {
      console.error("Error generating Excel:", error)
      toast.error("Failed to generate Excel report")
    }
  }

  const exportToPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      let yPosition = 20

      // Title
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(0, 0, 128)
      doc.text("COMMUNITY WISE STUDENT REPORT", doc.internal.pageSize.getWidth() / 2, yPosition, { align: "center" })
      yPosition += 10

      // School Info
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(0, 0, 0)
      doc.text(`School ID: ${schoolId}`, 15, yPosition)
      
      // Date and Community
      const today = new Date().toLocaleDateString("en-US", { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      doc.text(`Report Date: ${today}`, doc.internal.pageSize.getWidth() / 2, yPosition, { align: "center" })
      doc.text(`Community: ${selectedCommunity}`, doc.internal.pageSize.getWidth() - 15, yPosition, { align: "right" })
      yPosition += 5

      // Academic Year
      doc.text(`Academic Year: ${currentAcademicYear}`, 15, yPosition)
      yPosition += 10

      // Define table columns
      const tableColumns = [
        { header: "S.No", dataKey: "sno" },
        { header: "Student Name", dataKey: "studentName" },
        { header: "Address", dataKey: "address" },
        { header: "Religion", dataKey: "religion" },
        { header: "Community", dataKey: "community" },
        { header: "Std", dataKey: "standard" },
        { header: "Sec", dataKey: "section" },
        { header: "Gender", dataKey: "gender" },
        { header: "Caste", dataKey: "caste" }
      ]

      // Prepare table data
      const tableData = filteredStudents.map((student, index) => ({
        sno: (index + 1).toString(),
        studentName: student.studentName || "",
        address: getFormattedAddress(student),
        religion: student.religion || "",
        community: student.community || "",
        standard: student.standard || "",
        section: student.section || "",
        gender: student.gender || "",
        caste: student.caste || "Nil"
      }))

      // Generate table using autoTable
      autoTable(doc, {
        head: [tableColumns.map(col => col.header)],
        body: tableData.map(row => tableColumns.map(col => row[col.dataKey])),
        startY: yPosition,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
          halign: 'left'
        },
        headStyles: {
          fillColor: [11, 61, 123],
          textColor: 255,
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' }, // S.No
          1: { cellWidth: 30 }, // Student Name
          2: { cellWidth: 40 }, // Address
          3: { cellWidth: 20 }, // Religion
          4: { cellWidth: 25 }, // Community
          5: { cellWidth: 15, halign: 'center' }, // Std
          6: { cellWidth: 15, halign: 'center' }, // Sec
          7: { cellWidth: 15, halign: 'center' }, // Gender
          8: { cellWidth: 20 } // Caste
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
      doc.save(`${selectedCommunity}_Community_Report_${currentAcademicYear}.pdf`)
      toast.success("PDF report generated successfully")
      
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Failed to generate PDF report")
    }
  }

  // Alternative simple PDF export without autoTable
  const exportToPDFSimple = () => {
    try {
      const doc = new jsPDF('portrait', 'mm', 'a4')
      
      // Add title
      doc.setFontSize(16)
      doc.setTextColor(0, 0, 128)
      doc.text("COMMUNITY WISE STUDENT REPORT", 20, 20)
      
      // Add details
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text(`School ID: ${schoolId}`, 20, 30)
      doc.text(`Community: ${selectedCommunity}`, 20, 35)
      doc.text(`Academic Year: ${currentAcademicYear}`, 20, 40)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45)
      
      // Simple table header
      let yPosition = 55
      const headers = ["S.No", "Student Name", "Community", "Std", "Sec", "Gender", "Caste"]
      
      doc.setFillColor(11, 61, 123)
      doc.setTextColor(255, 255, 255)
      doc.rect(20, yPosition, 170, 8, 'F')
      doc.text(headers[0], 22, yPosition + 6)
      doc.text(headers[1], 35, yPosition + 6)
      doc.text(headers[2], 85, yPosition + 6)
      doc.text(headers[3], 120, yPosition + 6)
      doc.text(headers[4], 135, yPosition + 6)
      doc.text(headers[5], 150, yPosition + 6)
      doc.text(headers[6], 165, yPosition + 6)
      
      yPosition += 12
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(8)
      
      // Add student data
      filteredStudents.forEach((student, index) => {
        if (yPosition > 270) {
          doc.addPage()
          yPosition = 20
        }
        
        doc.text((index + 1).toString(), 22, yPosition)
        doc.text(student.studentName || "", 35, yPosition)
        doc.text(student.community || "", 85, yPosition)
        doc.text(student.standard || "", 120, yPosition)
        doc.text(student.section || "", 135, yPosition)
        doc.text(student.gender || "", 150, yPosition)
        doc.text(student.caste || "Nil", 165, yPosition)
        
        yPosition += 6
      })
      
      doc.save(`${selectedCommunity}_Community_Simple_Report.pdf`)
      toast.success("PDF report generated successfully")
      
    } catch (error) {
      console.error("Error in simple PDF export:", error)
      toast.error("Failed to generate PDF report")
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
            <span>Community Wise Report</span>
          </nav>
        </div>

        {/* Header */}
        <div
          style={{ backgroundColor: "#0B3D7B" }}
          className="text-white p-3 rounded-top d-flex justify-content-between align-items-center"
        >
          <div className="d-flex align-items-center">
            <h2 className="mb-0">Community Wise Report</h2>
            <span className="ms-3 badge bg-light text-dark">
              {schoolId} | {currentAcademicYear}
            </span>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-light"
              onClick={exportToExcel}
              disabled={!selectedCommunity || filteredStudents.length === 0}
            >
              <FileSpreadsheet className="me-2" size={18} />
              Export Excel
            </Button>
            <Button
              variant="outline-light"
              onClick={exportToPDF}
              disabled={!selectedCommunity || filteredStudents.length === 0}
            >
              <FilePdf className="me-2" size={18} />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Community Selection */}
        <div className="bg-white p-4 border-bottom">
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Community :</Form.Label>
                <Form.Select value={selectedCommunity} onChange={handleCommunityChange} className="form-select-lg">
                  <option value="">Select Community</option>
                  {communities.map((community, index) => (
                    <option key={index} value={community}>
                      {community}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={8} className="d-flex align-items-end">
              <div className="text-muted">
                <small>
                  Showing {filteredStudents.length} students for {selectedCommunity || "selected community"}
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
                  <th>Student Name</th>
                  <th>Per.Address</th>
                  <th>Religion</th>
                  <th>Community</th>
                  <th>Std</th>
                  <th>Sec</th>
                  <th>Gender</th>
                  <th>Caste</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      Loading student data...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      {selectedCommunity ? "No students found for selected community" : "Please select a community"}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, index) => (
                    <tr key={student.id}>
                      <td className="text-center">{index + 1}</td>
                      <td>{student.studentName}</td>
                      <td>{getFormattedAddress(student)}</td>
                      <td>{student.religion}</td>
                      <td>{student.community}</td>
                      <td>{student.standard}</td>
                      <td>{student.section}</td>
                      <td>{student.gender}</td>
                      <td>{student.caste || "Nil"}</td>
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

export default CommunityWiseReport
