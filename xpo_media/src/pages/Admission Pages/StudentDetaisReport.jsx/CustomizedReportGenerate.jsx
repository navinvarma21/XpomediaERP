"use client"

import { useState, useEffect } from "react"
import { Container, Form, Button, Table, Row, Col } from "react-bootstrap"
import MainContentPage from "../../../components/MainContent/MainContentPage"
import { Link } from "react-router-dom"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { FileSpreadsheet, FileIcon as FilePdf, Printer } from "lucide-react"
import { useAuthContext } from "../../../Context/AuthContext"
import { ENDPOINTS } from "../../../SpringBoot/config"

const CustomizedReportGenerate = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCriteria, setSelectedCriteria] = useState("community")
  const [criteriaValue, setCriteriaValue] = useState("")
  const [generatedReport, setGeneratedReport] = useState(null)
  const [availableCriteria, setAvailableCriteria] = useState([])
  const [criteriaOptions, setCriteriaOptions] = useState({})
  const [selectedFields, setSelectedFields] = useState([])
  const [step, setStep] = useState(1)
  
  // Setup data states
  const [communities, setCommunities] = useState([])
  const [courses, setCourses] = useState([])
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [religions, setReligions] = useState([])
  const [sections, setSections] = useState([])
  const [studentCategories, setStudentCategories] = useState([])
  const [nationalities, setNationalities] = useState([])
  const [castes, setCastes] = useState([])
  const [bloodGroups, setBloodGroups] = useState([])
  const [motherTongues, setMotherTongues] = useState([])
  
  const { schoolId, getAuthHeaders, currentAcademicYear, isAuth } = useAuthContext()

  // Static options
  const studentTypeOptions = ["New", "Existing"]
  const genderOptions = ["Male", "Female", "Transgender"]

  const allFields = [
    "admissionNumber",
    "studentName",
    "fatherName",
    "motherName",
    "dateOfBirth",
    "gender",
    "phoneNumber",
    "emailId",
    "streetVillage",
    "placePincode",
    "district",
    "state",
    "nationality",
    "religion",
    "community",
    "caste",
    "motherTongue",
    "bloodGroup",
    "studentType",
    "studentCategory",
    "standard",
    "section",
    "dateOfAdmission",
    "examNumber",
    "emis",
    "aadharNumber",
    "busRouteNumber",
    "boardingPoint",
    "busFee",
    "fatherOccupation",
    "motherOccupation",
    "classLastStudied",
    "classToBeAdmitted",
    "nameOfSchool",
    "studiedYear",
    "identificationMark1",
    "identificationMark2",
    "remarks",
    "communicationAddress",
    "lunchRefresh",
    "hostelFee",
    "tutionFees",
  ]

  const fieldNameMapping = {
    admissionNumber: "Admission Number",
    studentName: "Student Name",
    fatherName: "Father's Name",
    motherName: "Mother's Name",
    dateOfBirth: "Date of Birth",
    gender: "Gender",
    phoneNumber: "Phone Number",
    emailId: "Email ID",
    streetVillage: "Street/Village",
    placePincode: "Place/Pincode",
    district: "District",
    state: "State",
    nationality: "Nationality",
    religion: "Religion",
    community: "Community",
    caste: "Caste",
    motherTongue: "Mother Tongue",
    bloodGroup: "Blood Group",
    studentType: "Student Type",
    studentCategory: "Student Category",
    standard: "Standard",
    section: "Section",
    dateOfAdmission: "Date of Admission",
    examNumber: "Exam Number",
    emis: "EMIS",
    aadharNumber: "Aadhar Number",
    busRouteNumber: "Bus Route Number",
    boardingPoint: "Boarding Point",
    busFee: "Bus Fee",
    fatherOccupation: "Father's Occupation",
    motherOccupation: "Mother's Occupation",
    classLastStudied: "Class Last Studied",
    classToBeAdmitted: "Class to be Admitted",
    nameOfSchool: "Name of School",
    studiedYear: "Studied Year",
    identificationMark1: "Identification Mark 1",
    identificationMark2: "Identification Mark 2",
    remarks: "Remarks",
    communicationAddress: "Communication Address",
    lunchRefresh: "Lunch/Refresh",
    hostelFee: "Hostel Fee",
    tutionFees: "Tuition Fees",
  }

  // Fetch setup data for dropdowns
  const fetchSetupData = async () => {
    if (!schoolId || !isAuth) return

    try {
      setLoading(true)
      
      const [
        communitiesRes, 
        coursesRes, 
        statesRes, 
        districtsRes,
        religionsRes,
        sectionsRes,
        studentCategoriesRes,
        nationalitiesRes,
        castesRes,
        bloodGroupsRes,
        motherTonguesRes
      ] = await Promise.all([
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/communities?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/courses?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/states?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/districts?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/religions?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/sections?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/studentcategories?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/nationalities?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/castes?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/bloodgroups?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/mothertongues?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        })
      ])

      const [
        communitiesData, 
        coursesData, 
        statesData, 
        districtsData,
        religionsData,
        sectionsData,
        studentCategoriesData,
        nationalitiesData,
        castesData,
        bloodGroupsData,
        motherTonguesData
      ] = await Promise.all([
        communitiesRes.ok ? communitiesRes.json() : [],
        coursesRes.ok ? coursesRes.json() : [],
        statesRes.ok ? statesRes.json() : [],
        districtsRes.ok ? districtsRes.json() : [],
        religionsRes.ok ? religionsRes.json() : [],
        sectionsRes.ok ? sectionsRes.json() : [],
        studentCategoriesRes.ok ? studentCategoriesRes.json() : [],
        nationalitiesRes.ok ? nationalitiesRes.json() : [],
        castesRes.ok ? castesRes.json() : [],
        bloodGroupsRes.ok ? bloodGroupsRes.json() : [],
        motherTonguesRes.ok ? motherTonguesRes.json() : []
      ])

      setCommunities(communitiesData || [])
      setCourses(coursesData || [])
      setStates(statesData || [])
      setDistricts(districtsData || [])
      setReligions(religionsData || [])
      setSections(sectionsData || [])
      setStudentCategories(studentCategoriesData || [])
      setNationalities(nationalitiesData || [])
      setCastes(castesData || [])
      setBloodGroups(bloodGroupsData || [])
      setMotherTongues(motherTonguesData || [])

    } catch (error) {
      console.error("Error fetching setup data:", error)
      toast.error("Failed to fetch setup data")
    } finally {
      setLoading(false)
    }
  }

  // Fetch students data
  const fetchStudents = async () => {
    if (!schoolId || !currentAcademicYear) return

    try {
      setLoading(true)
      
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/studentreport/datas?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const studentsData = await response.json()
        setStudents(studentsData || [])
        
        // Extract available criteria and their unique values
        const criteria = {}
        allFields.forEach((field) => {
          criteria[field] = new Set()
        })

        studentsData.forEach((student) => {
          allFields.forEach((field) => {
            if (student[field]) criteria[field].add(student[field])
          })
        })

        setAvailableCriteria(allFields)
        setCriteriaOptions(
          Object.fromEntries(Object.entries(criteria).map(([key, value]) => [key, Array.from(value).sort()])),
        )
        
        toast.success("Student data loaded successfully")
      } else {
        throw new Error("Failed to fetch student data")
      }
    } catch (error) {
      console.error("Error fetching students:", error)
      toast.error("Failed to fetch student data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (schoolId && isAuth) {
      fetchSetupData()
      fetchStudents()
    }
  }, [schoolId, isAuth, currentAcademicYear])

  const handleCriteriaChange = (e) => {
    setSelectedCriteria(e.target.value)
    setCriteriaValue("")
    setGeneratedReport(null)
  }

  const handleCriteriaValueChange = (e) => {
    setCriteriaValue(e.target.value)
    setGeneratedReport(null)
  }

  const handleFieldSelection = (field) => {
    setSelectedFields((prevFields) =>
      prevFields.includes(field) ? prevFields.filter((f) => f !== field) : [...prevFields, field],
    )
  }

  const generateReport = () => {
    if (!criteriaValue) {
      toast.error(`Please select a ${fieldNameMapping[selectedCriteria]}`)
      return
    }

    if (selectedFields.length === 0) {
      toast.error("Please select at least one field for the report")
      return
    }

    const filteredStudents = students.filter((student) => {
      const studentValue = student[selectedCriteria]
      return studentValue && studentValue.toString() === criteriaValue.toString()
    })

    if (filteredStudents.length === 0) {
      toast.error(`No students found for the selected ${fieldNameMapping[selectedCriteria]}`)
      setGeneratedReport(null)
      return
    }

    const report = filteredStudents.map((student) => {
      const reportItem = {}
      selectedFields.forEach((field) => {
        reportItem[fieldNameMapping[field]] = student[field] || "N/A"
      })
      return reportItem
    })

    setGeneratedReport(report)
    toast.success("Report generated successfully")
    setStep(3)
  }

  const exportToExcel = () => {
    if (!generatedReport) {
      toast.error("Please generate a report first")
      return
    }

    try {
      const ws = XLSX.utils.json_to_sheet(generatedReport)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Customized Report")
      XLSX.writeFile(wb, `CustomizedReport_${fieldNameMapping[selectedCriteria]}_${criteriaValue}.xlsx`)
      toast.success("Excel file exported successfully")
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      toast.error("Failed to export Excel file")
    }
  }

  const exportToPDF = () => {
    if (!generatedReport) {
      toast.error("Please generate a report first")
      return
    }

    if (selectedFields.length > 12) {
      toast.error("PDF generation is not available for more than 12 fields. Please use Excel export instead.")
      return
    }

    try {
      const orientation = selectedFields.length > 6 ? "landscape" : "portrait"
      const doc = new jsPDF(orientation, "mm", "a4")

      // Add header with school info
      doc.setFontSize(16)
      doc.setTextColor(11, 61, 123)
      doc.text("Student Customized Report", 14, 15)
      
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text(`Criteria: ${fieldNameMapping[selectedCriteria]} - ${criteriaValue}`, 14, 22)
      doc.text(`Total Students: ${generatedReport.length}`, 14, 28)
      doc.text(`Academic Year: ${currentAcademicYear || 'N/A'}`, 14, 34)

      doc.autoTable({
        startY: 40,
        head: [Object.keys(generatedReport[0])],
        body: generatedReport.map(Object.values),
        theme: "grid",
        styles: { 
          fontSize: 8, 
          cellPadding: 2,
          overflow: 'linebreak'
        },
        headStyles: { 
          fillColor: [11, 61, 123], 
          textColor: 255,
          fontSize: 9
        },
        margin: { top: 40 },
      })

      doc.save(`CustomizedReport_${fieldNameMapping[selectedCriteria]}_${criteriaValue}.pdf`)
      toast.success("PDF file exported successfully")
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      toast.error("Failed to export PDF file")
    }
  }

  const handlePrint = () => {
    if (!generatedReport) {
      toast.error("Please generate a report first")
      return
    }
    
    // Create a print-friendly version of the table
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Customized Report - ${fieldNameMapping[selectedCriteria]}: ${criteriaValue}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px;
              color: #333;
            }
            .print-header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #0B3D7B;
              padding-bottom: 10px;
            }
            .print-header h1 {
              color: #0B3D7B;
              margin: 0 0 10px 0;
              font-size: 24px;
            }
            .print-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
              font-size: 14px;
            }
            .print-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .print-table th {
              background-color: #0B3D7B;
              color: white;
              padding: 8px;
              text-align: left;
              border: 1px solid #ddd;
              font-weight: bold;
            }
            .print-table td {
              padding: 6px;
              border: 1px solid #ddd;
              font-size: 12px;
            }
            .print-table tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .print-footer {
              margin-top: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body { margin: 0; }
              .print-header { margin-top: 0; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>Student Customized Report</h1>
            <div class="print-info">
              <div><strong>Criteria:</strong> ${fieldNameMapping[selectedCriteria]} - ${criteriaValue}</div>
              <div><strong>Total Students:</strong> ${generatedReport.length}</div>
              <div><strong>Academic Year:</strong> ${currentAcademicYear || 'N/A'}</div>
            </div>
          </div>
          <table class="print-table">
            <thead>
              <tr>
                ${Object.keys(generatedReport[0]).map(key => `<th>${key}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${generatedReport.map(student => `
                <tr>
                  ${Object.values(student).map(value => `<td>${value}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="print-footer">
            Generated on: ${new Date().toLocaleDateString()} | School ID: ${schoolId || 'N/A'}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // Get criteria options based on selected criteria
  const getCriteriaOptions = () => {
    switch (selectedCriteria) {
      case 'community':
        return communities.map(comm => comm.name)
      case 'standard':
        return courses.map(course => course.name)
      case 'state':
        return states.map(state => state.name)
      case 'district':
        return districts.map(district => district.name)
      case 'religion':
        return religions.map(religion => religion.name)
      case 'section':
        return sections.map(section => section.name)
      case 'studentCategory':
        return studentCategories.map(category => category.name)
      case 'studentType':
        return studentTypeOptions
      case 'gender':
        return genderOptions
      case 'nationality':
        return nationalities.map(nationality => nationality.name)
      case 'caste':
        return castes.map(caste => caste.name)
      case 'bloodGroup':
        return bloodGroups.map(bloodGroup => bloodGroup.name)
      case 'motherTongue':
        return motherTongues.map(motherTongue => motherTongue.name)
      default:
        return criteriaOptions[selectedCriteria] || []
    }
  }

  const renderStep1 = () => (
    <Row className="mb-4">
      <Col md={6}>
        <Form.Group>
          <Form.Label>Select Criteria</Form.Label>
          <Form.Select 
            value={selectedCriteria} 
            onChange={handleCriteriaChange} 
            className="form-control-blue"
            disabled={loading}
          >
            <option value="community">Community</option>
            <option value="standard">Standard</option>
            <option value="state">State</option>
            <option value="district">District</option>
            <option value="gender">Gender</option>
            <option value="religion">Religion</option>
            <option value="studentCategory">Student Category</option>
            <option value="studentType">Student Type</option>
            <option value="section">Section</option>
            <option value="nationality">Nationality</option>
            <option value="caste">Caste</option>
            <option value="bloodGroup">Blood Group</option>
            <option value="motherTongue">Mother Tongue</option>
          </Form.Select>
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group>
          <Form.Label>Select {fieldNameMapping[selectedCriteria]}</Form.Label>
          <Form.Select 
            value={criteriaValue} 
            onChange={handleCriteriaValueChange} 
            className="form-control-blue"
            disabled={loading}
          >
            <option value="">Select a {fieldNameMapping[selectedCriteria]}</option>
            {getCriteriaOptions().map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Form.Select>
          {loading && (
            <Form.Text className="text-muted">
              Loading options...
            </Form.Text>
          )}
        </Form.Group>
      </Col>
    </Row>
  )

  const renderStep2 = () => (
    <div>
      <h4>Select Fields for the Report</h4>
      <div className="mb-3">
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => setSelectedFields([...allFields])}
          className="me-2 mb-2"
        >
          Select All
        </Button>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => setSelectedFields([])}
          className="mb-2"
        >
          Clear All
        </Button>
      </div>
      <Row className="mb-4">
        {allFields.map((field) => (
          <Col md={4} key={field}>
            <Form.Check
              type="checkbox"
              id={`field-${field}`}
              label={fieldNameMapping[field]}
              checked={selectedFields.includes(field)}
              onChange={() => handleFieldSelection(field)}
              disabled={loading}
            />
          </Col>
        ))}
      </Row>
      <div className="text-muted">
        Selected: {selectedFields.length} of {allFields.length} fields
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Generated Report</h3>
        <div className="text-muted">
          Total Students: {generatedReport?.length || 0}
        </div>
      </div>
      {generatedReport && generatedReport.length > 0 ? (
        <div className="table-responsive">
          <Table striped bordered hover className="report-table">
            <thead>
              <tr>
                {Object.keys(generatedReport[0]).map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {generatedReport.map((student, index) => (
                <tr key={index}>
                  {Object.values(student).map((value, idx) => (
                    <td key={idx}>{value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-4">
          <p>No data available for the selected criteria.</p>
        </div>
      )}
    </div>
  )

  if (loading && students.length === 0) {
    return (
      <MainContentPage>
        <Container fluid className="px-0">
          <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading report data...</p>
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
            <span>Customized Report Generator</span>
          </nav>
        </div>

        {/* Header */}
        <div
          style={{ backgroundColor: "#0B3D7B" }}
          className="text-white p-3 rounded-top d-flex justify-content-between align-items-center"
        >
          <div className="d-flex align-items-center">
            <h2 className="mb-0">Customized Report Generator</h2>
          </div>
          <div className="text-end">
            <small>Academic Year: {currentAcademicYear || 'Not Set'}</small>
            <br />
            <small>School ID: {schoolId || 'Not Available'}</small>
          </div>
        </div>

        {/* Report Configuration */}
        <div className="bg-white p-4 rounded-bottom">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* Navigation Buttons */}
          <div className="d-flex justify-content-center mt-4 flex-wrap gap-2">
            {step > 1 && (
              <Button onClick={() => setStep(step - 1)} className="me-2">
                Previous
              </Button>
            )}
            {step < 3 && (
              <Button 
                onClick={() => setStep(step + 1)} 
                className="me-2" 
                disabled={step === 1 && !criteriaValue}
              >
                Next
              </Button>
            )}
            {step === 2 && (
              <Button 
                onClick={generateReport} 
                className="generate-btn me-2"
                disabled={selectedFields.length === 0}
              >
                Generate Report
              </Button>
            )}
            {step === 3 && generatedReport && generatedReport.length > 0 && (
              <>
                <Button variant="outline-primary" onClick={exportToExcel} className="me-2">
                  <FileSpreadsheet className="me-2" size={18} />
                  Export Excel
                </Button>
                <Button variant="outline-primary" onClick={exportToPDF} className="me-2">
                  <FilePdf className="me-2" size={18} />
                  Export PDF
                </Button>
                <Button variant="outline-primary" onClick={handlePrint}>
                  <Printer className="me-2" size={18} />
                  Print
                </Button>
              </>
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

          .generate-btn {
            background: linear-gradient(to bottom, #1565C0, #0B3D7B);
            border: none;
            padding: 0.75rem 2rem;
            font-weight: 600;
            letter-spacing: 0.5px;
            color: white;
          }

          .generate-btn:hover {
            background: linear-gradient(to bottom, #1976D2, #1565C0);
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            color: white;
          }

          .generate-btn:disabled {
            background: #6c757d;
            transform: none;
            box-shadow: none;
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

          @media print {
            body * {
              visibility: hidden;
            }
            .report-table, .report-table * {
              visibility: visible;
            }
            .report-table {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }

          @media (max-width: 768px) {
            .table-responsive {
              max-height: 500px;
            }
            
            .d-flex.justify-content-center {
              flex-direction: column;
              align-items: center;
            }
            
            .d-flex.justify-content-center .btn {
              margin-bottom: 0.5rem;
              width: 100%;
              max-width: 300px;
            }
          }
        `}
      </style>
      <ToastContainer limit={3} />
    </MainContentPage>
  )
}

export default CustomizedReportGenerate