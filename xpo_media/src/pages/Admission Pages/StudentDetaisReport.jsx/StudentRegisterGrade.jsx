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

const StudentsRegisterGrade = () => {
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStandard, setSelectedStandard] = useState("")
  const [standards, setStandards] = useState([])
  
  const { schoolId, currentAcademicYear, getAuthHeaders } = useAuthContext()

  useEffect(() => {
    if (schoolId) {
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
      toast.info("Please select a standard to view the report", {
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
      if (!schoolId) {
        toast.error("School ID not available")
        return
      }

      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/courses?schoolId=${schoolId}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch standards")
      }

      const standardsData = await response.json()
      const standardNames = standardsData.map(course => course.standard || course.name)
      setStandards(standardNames)
    } catch (error) {
      console.error("Error fetching standards:", error)
      toast.error("Failed to fetch standards")
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

  const handleStandardChange = (e) => {
    const standard = e.target.value
    setSelectedStandard(standard)
  }

  const getFormattedAddress = (student) => {
    return `${student.streetVillage || ""}, ${student.placePincode || ""}, ${student.state || ""}, ${student.district || ""}`
  }

  const getBoardingPoint = (student) => {
    return student.boardingPoint || "Nil"
  }

  const getParentOccupation = (student) => {
    return student.fatherOccupation || student.motherOccupation || "Nil"
  }

  const exportToExcel = () => {
    const exportData = filteredStudents.map((student, index) => ({
      "S.No": index + 1,
      "Admission No.": student.admissionNumber || "",
      "Student Name": student.studentName || "",
      "Date of Admission": student.dateOfAdmission || "",
      "Father's Name": student.fatherName || "",
      "Mother's Name": student.motherName || "",
      Gender: student.gender || "",
      "Aadhar Number": student.aadharNumber || "",
      Religion: student.religion || "",
      Caste: student.caste || "",
      Address: getFormattedAddress(student),
      "Phone Number": student.phoneNumber || "",
      "Boarding Point": getBoardingPoint(student),
      "Date of Birth": student.dateOfBirth || "",
      Occupation: getParentOccupation(student),
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Standard Wise Report")
    XLSX.writeFile(wb, `${selectedStandard}_Students_Report.xlsx`)
    toast.success("Excel report generated successfully")
  }

  const exportToPDF = () => {
    try {
      // Create new PDF document in landscape mode
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      // Set initial y position
      let yPosition = 20

      // Title
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(0, 0, 128)
      doc.text("STANDARD WISE STUDENT REPORT", doc.internal.pageSize.getWidth() / 2, yPosition, { align: "center" })
      yPosition += 10

      // School Info
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(0, 0, 0)
      doc.text(`School ID: ${schoolId}`, 15, yPosition)
      
      // Date and Standard
      const today = new Date().toLocaleDateString("en-US", { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      doc.text(`Generated on: ${today}`, doc.internal.pageSize.getWidth() / 2, yPosition, { align: "center" })
      doc.text(`Standard: ${selectedStandard}`, doc.internal.pageSize.getWidth() - 15, yPosition, { align: "right" })
      yPosition += 5

      // Academic Year
      doc.text(`Academic Year: ${currentAcademicYear}`, 15, yPosition)
      yPosition += 10

      // Define table columns
      const tableColumns = [
        { header: "S.No", dataKey: "sno" },
        { header: "Adm No.", dataKey: "admissionNumber" },
        { header: "Student Name", dataKey: "studentName" },
        { header: "Date of Adm", dataKey: "dateOfAdmission" },
        { header: "Father's Name", dataKey: "fatherName" },
        { header: "Mother's Name", dataKey: "motherName" },
        { header: "Gender", dataKey: "gender" },
        { header: "Aadhar No.", dataKey: "aadharNumber" },
        { header: "Religion", dataKey: "religion" },
        { header: "Caste", dataKey: "caste" },
        { header: "Address", dataKey: "address" }
      ]

      // Prepare table data
      const tableData = filteredStudents.map((student, index) => ({
        sno: (index + 1).toString(),
        admissionNumber: student.admissionNumber || "",
        studentName: student.studentName || "",
        dateOfAdmission: student.dateOfAdmission || "",
        fatherName: student.fatherName || "",
        motherName: student.motherName || "",
        gender: student.gender || "",
        aadharNumber: student.aadharNumber || "",
        religion: student.religion || "",
        caste: student.caste || "",
        address: getFormattedAddress(student)
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
          1: { cellWidth: 20 }, // Adm No.
          2: { cellWidth: 25 }, // Student Name
          3: { cellWidth: 20 }, // Date of Adm
          4: { cellWidth: 25 }, // Father's Name
          5: { cellWidth: 25 }, // Mother's Name
          6: { cellWidth: 15, halign: 'center' }, // Gender
          7: { cellWidth: 25 }, // Aadhar No.
          8: { cellWidth: 18 }, // Religion
          9: { cellWidth: 18 }, // Caste
          10: { cellWidth: 40 } // Address
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
      doc.save(`${selectedStandard}_Students_Report_${currentAcademicYear}.pdf`)
      toast.success("PDF report generated successfully")
      
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Failed to generate PDF report")
    }
  }

  // Alternative simple PDF export without autoTable
  const exportToPDFSimple = () => {
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4')
      
      // Add title
      doc.setFontSize(16)
      doc.setTextColor(0, 0, 128)
      doc.text("STANDARD WISE STUDENT REPORT", 20, 20)
      
      // Add details
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text(`School ID: ${schoolId}`, 20, 30)
      doc.text(`Standard: ${selectedStandard}`, 20, 35)
      doc.text(`Academic Year: ${currentAcademicYear}`, 20, 40)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45)
      
      // Simple table header
      let yPosition = 55
      const headers = ["S.No", "Adm No", "Student Name", "Father Name", "Gender", "Phone"]
      
      doc.setFillColor(11, 61, 123)
      doc.setTextColor(255, 255, 255)
      doc.rect(20, yPosition, 250, 8, 'F')
      doc.text(headers[0], 22, yPosition + 6)
      doc.text(headers[1], 35, yPosition + 6)
      doc.text(headers[2], 65, yPosition + 6)
      doc.text(headers[3], 120, yPosition + 6)
      doc.text(headers[4], 170, yPosition + 6)
      doc.text(headers[5], 190, yPosition + 6)
      
      yPosition += 12
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(8)
      
      // Add student data
      filteredStudents.forEach((student, index) => {
        if (yPosition > 180) {
          doc.addPage()
          yPosition = 20
        }
        
        doc.text((index + 1).toString(), 22, yPosition)
        doc.text(student.admissionNumber || "", 35, yPosition)
        doc.text(student.studentName || "", 65, yPosition)
        doc.text(student.fatherName || "", 120, yPosition)
        doc.text(student.gender || "", 170, yPosition)
        doc.text(student.phoneNumber || "", 190, yPosition)
        
        yPosition += 6
      })
      
      doc.save(`${selectedStandard}_Students_Simple_Report.pdf`)
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
            <span>Reports</span>
            <span className="separator mx-2">&gt;</span>
            <span>Standard Wise Report</span>
          </nav>
        </div>

        {/* Header */}
        <div
          style={{ backgroundColor: "#0B3D7B" }}
          className="text-white p-3 rounded-top d-flex justify-content-between align-items-center"
        >
          <div className="d-flex align-items-center">
            <h2 className="mb-0">Standard Wise Report</h2>
            <span className="ms-3 badge bg-light text-dark">
              {schoolId} | {currentAcademicYear}
            </span>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-light"
              onClick={exportToExcel}
              disabled={!selectedStandard || filteredStudents.length === 0}
            >
              <FileSpreadsheet className="me-2" size={18} />
              Export Excel
            </Button>
            <Button
              variant="outline-light"
              onClick={exportToPDF}
              disabled={!selectedStandard || filteredStudents.length === 0}
            >
              <FilePdf className="me-2" size={18} />
              Export PDF
            </Button>
            {/* Uncomment below if you want to try the simple version */}
            {/* <Button
              variant="outline-light"
              onClick={exportToPDFSimple}
              disabled={!selectedStandard || filteredStudents.length === 0}
            >
              <FilePdf className="me-2" size={18} />
              Simple PDF
            </Button> */}
          </div>
        </div>

        {/* Standard Selection */}
        <div className="bg-white p-4 border-bottom">
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Standard :</Form.Label>
                <Form.Select value={selectedStandard} onChange={handleStandardChange} className="form-select-lg">
                  <option value="">Select Standard</option>
                  {standards.map((standard, index) => (
                    <option key={index} value={standard}>
                      {standard}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={8} className="d-flex align-items-end">
              <div className="text-muted">
                <small>
                  Showing {filteredStudents.length} students for {selectedStandard || "selected standard"}
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
                  <th>Adm No.</th>
                  <th>Student Name</th>
                  <th>Date of Adm</th>
                  <th>Father's Name</th>
                  <th>Mother's Name</th>
                  <th>Gender</th>
                  <th>Aadhar No.</th>
                  <th>Religion</th>
                  <th>Caste</th>
                  <th>Address</th>
                  <th>Phone</th>
                  <th>Boarding Point</th>
                  <th>DOB</th>
                  <th>Occupation</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="15" className="text-center py-4">
                      Loading student data...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="15" className="text-center py-4">
                      {selectedStandard ? "No students found for selected standard" : "Please select a standard"}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, index) => (
                    <tr key={student.id}>
                      <td className="text-center">{index + 1}</td>
                      <td>{student.admissionNumber}</td>
                      <td>{student.studentName}</td>
                      <td>{student.dateOfAdmission}</td>
                      <td>{student.fatherName}</td>
                      <td>{student.motherName}</td>
                      <td>{student.gender}</td>
                      <td>{student.aadharNumber}</td>
                      <td>{student.religion}</td>
                      <td>{student.caste}</td>
                      <td>{getFormattedAddress(student)}</td>
                      <td>{student.phoneNumber}</td>
                      <td>{getBoardingPoint(student)}</td>
                      <td>{student.dateOfBirth}</td>
                      <td>{getParentOccupation(student)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </div>
      </Container>

      <ToastContainer />
    </MainContentPage>
  )
}

export default StudentsRegisterGrade