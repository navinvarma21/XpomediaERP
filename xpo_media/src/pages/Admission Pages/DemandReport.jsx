"use client"

import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Form, Button, Card, Container, Table, Row, Col, InputGroup, Modal } from "react-bootstrap"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useAuthContext } from "../../Context/AuthContext"
import { ENDPOINTS } from "../../SpringBoot/config"
import * as XLSX from "xlsx"
import { FaEdit, FaTrash, FaTimes, FaFileExcel } from "react-icons/fa"

const DemandReport = () => {
  const { schoolId, getAuthHeaders, currentAcademicYear } = useAuthContext()

  const [courseWiseData, setCourseWiseData] = useState({
    course: "",
    sex: "",
    feeHead: "",
    accountHead: "", // Added
    amount: "",
  })

  const [individualData, setIndividualData] = useState({
    adminNumber: "",
    name: "",
    feeHead: "",
    accountHead: "", // Added
    amount: "",
  })

  const [courses, setCourses] = useState([])
  const [feeHeads, setFeeHeads] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [courseWiseFees, setCourseWiseFees] = useState([])
  const [individualFees, setIndividualFees] = useState([])

  // New state for aggregated data
  const [courseWiseSummary, setCourseWiseSummary] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [studentSearch, setStudentSearch] = useState("")

  // State for edit functionality
  const [editingCourseFee, setEditingCourseFee] = useState(null)
  const [editingIndividualFee, setEditingIndividualFee] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [feeToDelete, setFeeToDelete] = useState(null)
  const [deleteType, setDeleteType] = useState("") // "course" or "individual"

  // Fetch courses
  const fetchCourses = async () => {
    if (!schoolId) return

    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/courses?schoolId=${schoolId}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const coursesData = await response.json()
        setCourses(coursesData || [])
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast.error("Failed to fetch courses")
    }
  }

  // Fetch fee heads from administration endpoint
  const fetchFeeHeads = async () => {
    if (!schoolId || !currentAcademicYear) return

    try {
      const response = await fetch(
        `${ENDPOINTS.administration}/feeHeads?schoolId=${schoolId}&year=${currentAcademicYear}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const feeHeadsData = await response.json()
        // Response format is like: [{ feeHead: "Term 1", accountHead: "Accounts", ... }, ...]
        setFeeHeads(feeHeadsData || [])
      }
    } catch (error) {
      console.error("Error fetching fee heads:", error)
      toast.error("Failed to fetch fee heads")
    }
  }

  // Fetch students
  const fetchStudents = async () => {
    if (!schoolId || !currentAcademicYear) return

    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/studentreport/school/${schoolId}?academicYear=${currentAcademicYear}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const studentsData = await response.json()
        setStudents(studentsData || [])
        setFilteredStudents(studentsData || [])
      }
    } catch (error) {
      console.error("Error fetching students:", error)
      toast.error("Failed to fetch students")
    }
  }

  // Fetch course-wise fees from demandreport endpoint
  const fetchCourseWiseFees = async () => {
    if (!schoolId) return

    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/demandreoprt/coursewise?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const feesData = await response.json()
        setCourseWiseFees(feesData || [])
        processCourseWiseSummary(feesData)
      }
    } catch (error) {
      console.error("Error fetching course-wise fees:", error)
    }
  }

  // Fetch individual fees from demandreport endpoint
  const fetchIndividualFees = async () => {
    if (!schoolId) return

    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/demandreoprt/individual?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const feesData = await response.json()
        setIndividualFees(feesData || [])
      }
    } catch (error) {
      console.error("Error fetching individual fees:", error)
    }
  }

  // Process fees data to create course-wise summary with individual fee heads
  const processCourseWiseSummary = (feesData) => {
    const courseSummary = {}

    // Group fees by course
    feesData.forEach(fee => {
      const courseName = fee.course
      const feeHead = fee.feeHead
      const feeAmount = parseFloat(fee.amount) || 0

      if (!courseSummary[courseName]) {
        courseSummary[courseName] = {
          course: courseName,
          totalFee: 0,
          feeHeads: [], // Array to store individual fee heads with amounts
          feeDetails: []
        }
      }

      // Add to total course fee
      courseSummary[courseName].totalFee += feeAmount

      // Add individual fee head with amount
      courseSummary[courseName].feeHeads.push({
        feeHead: feeHead,
        amount: feeAmount
      })

      courseSummary[courseName].feeDetails.push({
        feeHead: fee.feeHead,
        amount: feeAmount
      })
    })

    // Convert to array and calculate student counts
    const summaryArray = Object.values(courseSummary).map(course => {
      const studentsInCourse = students.filter(student =>
        student.standard === course.course
      ).length

      const totalRevenue = studentsInCourse * course.totalFee

      return {
        ...course,
        numberOfStudents: studentsInCourse,
        totalRevenue: totalRevenue
      }
    })

    setCourseWiseSummary(summaryArray)
  }

  useEffect(() => {
    if (schoolId) {
      fetchCourses()
      fetchFeeHeads()
      fetchStudents()
      fetchCourseWiseFees()
      fetchIndividualFees()
    }
  }, [schoolId, currentAcademicYear])

  useEffect(() => {
    if (courseWiseFees.length > 0 && students.length > 0) {
      processCourseWiseSummary(courseWiseFees)
    }
  }, [courseWiseFees, students])

  // Filter students based on search input
  useEffect(() => {
    if (studentSearch.trim() === "") {
      setFilteredStudents(students)
    } else {
      const filtered = students.filter(student =>
        student.admissionNumber?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.studentName?.toLowerCase().includes(studentSearch.toLowerCase())
      )
      setFilteredStudents(filtered)
    }
  }, [studentSearch, students])

  // Updated Change Handler for Course Wise
  const handleCourseWiseChange = (e) => {
    const { name, value } = e.target
    
    if (name === "feeHead") {
      // Find the selected fee head object to get the accountHead
      const selectedHead = feeHeads.find(f => f.feeHead === value)
      setCourseWiseData((prev) => ({
        ...prev,
        feeHead: value,
        accountHead: selectedHead ? selectedHead.accountHead : ""
      }))
    } else {
      setCourseWiseData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  // Updated Change Handler for Individual
  const handleIndividualChange = (e) => {
    const { name, value } = e.target
    
    if (name === "feeHead") {
      // Find the selected fee head object to get the accountHead
      const selectedHead = feeHeads.find(f => f.feeHead === value)
      setIndividualData((prev) => ({
        ...prev,
        feeHead: value,
        accountHead: selectedHead ? selectedHead.accountHead : ""
      }))
    } else {
      setIndividualData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleStudentSearchChange = (e) => {
    setStudentSearch(e.target.value)
  }

  const handleStudentSelection = (admissionNumber) => {
    const student = students.find(s => s.admissionNumber === admissionNumber)
    if (student) {
      setIndividualData(prev => ({
        ...prev,
        adminNumber: admissionNumber,
        name: student.studentName
      }))
    }
  }

  // Course-wise fee CRUD operations
  const handleCourseWiseSubmit = async (e) => {
    e.preventDefault()

    if (!schoolId) {
      toast.error("School ID not available")
      return
    }

    if (!courseWiseData.course || !courseWiseData.feeHead || !courseWiseData.amount) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setLoading(true)

      const feeData = {
        course: courseWiseData.course,
        sex: courseWiseData.sex || "All",
        feeHead: courseWiseData.feeHead,
        accountHead: courseWiseData.accountHead, // Sending accountHead
        amount: parseFloat(courseWiseData.amount),
        schoolId: schoolId,
        academicYear: currentAcademicYear || '2024-2025'
      }

      const url = editingCourseFee
        ? `${ENDPOINTS.admissionmaster}/demandreoprt/coursewise/${editingCourseFee.id}?schoolId=${schoolId}`
        : `${ENDPOINTS.admissionmaster}/demandreoprt/coursewise?schoolId=${schoolId}`

      const method = editingCourseFee ? "PUT" : "POST"

      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(feeData)
      })

      if (response.ok) {
        toast.success(`Course-wise fee ${editingCourseFee ? 'updated' : 'saved'} successfully!`)
        setCourseWiseData({
          course: "",
          sex: "",
          feeHead: "",
          accountHead: "",
          amount: "",
        })
        setEditingCourseFee(null)
        fetchCourseWiseFees()
      } else {
        const errorText = await response.text()
        throw new Error(errorText || `Failed to ${editingCourseFee ? 'update' : 'save'} course-wise fee`)
      }
    } catch (error) {
      console.error("Error saving course-wise fee:", error)
      toast.error(`Failed to ${editingCourseFee ? 'update' : 'save'} course-wise fee: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEditCourseFee = (fee) => {
    setEditingCourseFee(fee)
    setCourseWiseData({
      course: fee.course,
      sex: fee.sex || "",
      feeHead: fee.feeHead,
      accountHead: fee.accountHead || "", // Retrieve accountHead from row
      amount: fee.amount,
    })
  }

  const handleCancelEditCourse = () => {
    setEditingCourseFee(null)
    setCourseWiseData({
      course: "",
      sex: "",
      feeHead: "",
      accountHead: "",
      amount: "",
    })
  }

  // Individual fee CRUD operations
  const handleIndividualSubmit = async (e) => {
    e.preventDefault()

    if (!schoolId) {
      toast.error("School ID not available")
      return
    }

    if (!individualData.adminNumber || !individualData.feeHead || !individualData.amount) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setLoading(true)

      // Find student details
      const student = students.find(s => s.admissionNumber === individualData.adminNumber)
      if (!student) {
        toast.error("Student not found")
        return
      }

      const feeData = {
        admissionNumber: individualData.adminNumber,
        studentName: student.studentName,
        feeHead: individualData.feeHead,
        accountHead: individualData.accountHead, // Sending accountHead
        amount: parseFloat(individualData.amount),
        schoolId: schoolId,
        academicYear: currentAcademicYear || '2024-2025',
        // studentId removed
      }

      const url = editingIndividualFee
        ? `${ENDPOINTS.admissionmaster}/demandreoprt/individual/${editingIndividualFee.id}?schoolId=${schoolId}`
        : `${ENDPOINTS.admissionmaster}/demandreoprt/individual?schoolId=${schoolId}`

      const method = editingIndividualFee ? "PUT" : "POST"

      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(feeData)
      }
      )

      if (response.ok) {
        toast.success(`Individual fee ${editingIndividualFee ? 'updated' : 'saved'} successfully!`)
        setIndividualData({
          adminNumber: "",
          name: "",
          feeHead: "",
          accountHead: "",
          amount: "",
        })
        setEditingIndividualFee(null)
        fetchIndividualFees()
      } else {
        const errorText = await response.text()
        throw new Error(errorText || `Failed to ${editingIndividualFee ? 'update' : 'save'} individual fee`)
      }
    } catch (error) {
      console.error("Error saving individual fee:", error)
      toast.error(`Failed to ${editingIndividualFee ? 'update' : 'save'} individual fee: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEditIndividualFee = (fee) => {
    setEditingIndividualFee(fee)
    setIndividualData({
      adminNumber: fee.admissionNumber,
      name: fee.studentName,
      feeHead: fee.feeHead,
      accountHead: fee.accountHead || "", // Retrieve accountHead from row
      amount: fee.amount,
    })
  }

  const handleCancelEditIndividual = () => {
    setEditingIndividualFee(null)
    setIndividualData({
      adminNumber: "",
      name: "",
      feeHead: "",
      accountHead: "",
      amount: "",
    })
  }

  // Delete operations
  const handleDeleteClick = (fee, type) => {
    setFeeToDelete(fee)
    setDeleteType(type)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!feeToDelete) return

    try {
      setLoading(true)

      const url = deleteType === "course"
        ? `${ENDPOINTS.admissionmaster}/demandreoprt/coursewise/${feeToDelete.id}?schoolId=${schoolId}`
        : `${ENDPOINTS.admissionmaster}/demandreoprt/individual/${feeToDelete.id}?schoolId=${schoolId}`

      const response = await fetch(url, {
        method: "DELETE",
        headers: getAuthHeaders()
      }
      )

      if (response.ok) {
        toast.success("Fee deleted successfully!")
        if (deleteType === "course") {
          fetchCourseWiseFees()
        } else {
          fetchIndividualFees()
        }
      } else {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to delete fee")
      }
    } catch (error) {
      console.error("Error deleting fee:", error)
      toast.error(`Failed to delete fee: ${error.message}`)
    } finally {
      setLoading(false)
      setShowDeleteModal(false)
      setFeeToDelete(null)
      setDeleteType("")
    }
  }

  // Export to Excel functions
  const exportCourseWiseToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(courseWiseSummary.flatMap(course =>
      course.feeHeads.map(feeHead => ({
        "Course": course.course,
        "Fee Head": feeHead.feeHead,
        // It's helpful to include Account Head in export even if not in UI logic explicitly
        "Amount": feeHead.amount,
        "Number of Students": course.numberOfStudents,
        "Total Revenue": course.totalRevenue
      }))
    ))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Course Wise Fees")
    XLSX.writeFile(workbook, `Course_Wise_Fees_${currentAcademicYear}.xlsx`)
    toast.success("Course-wise fees exported successfully!")
  }

  const exportIndividualFeesToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(individualFees.map(fee => ({
      "Admission Number": fee.admissionNumber,
      "Student Name": fee.studentName,
      "Fee Head": fee.feeHead,
      "Account Head": fee.accountHead, // Added to export
      "Amount": fee.amount
    })))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Individual Fees")
    XLSX.writeFile(workbook, `Individual_Fees_${currentAcademicYear}.xlsx`)
    toast.success("Individual fees exported successfully!")
  }

  // NEW: Export Course Wise Summary to Excel
  const exportCourseWiseSummaryToExcel = () => {
    if (courseWiseSummary.length === 0) {
      toast.warning("No data available to export")
      return
    }

    try {
      // Create detailed data for export
      const exportData = courseWiseSummary.flatMap(course => {
        // Create a row for each fee head in the course
        const feeHeadRows = course.feeHeads.map((feeHead, index) => ({
          "Course": index === 0 ? course.course : "", // Only show course name in first row
          "Fee Head": feeHead.feeHead,
          "Fee Head Amount": `₹${parseFloat(feeHead.amount).toFixed(2)}`,
          "Total Course Fee": index === 0 ? `₹${course.totalFee?.toFixed(2)}` : "",
          "Number of Students": index === 0 ? course.numberOfStudents : "",
          "Total Revenue": index === 0 ? `₹${course.totalRevenue?.toFixed(2)}` : ""
        }))

        // Add an empty row between courses for better readability
        if (courseWiseSummary.indexOf(course) < courseWiseSummary.length - 1) {
          feeHeadRows.push({
            "Course": "",
            "Fee Head": "",
            "Fee Head Amount": "",
            "Total Course Fee": "",
            "Number of Students": "",
            "Total Revenue": ""
          })
        }

        return feeHeadRows
      })

      // Add grand totals row
      const grandTotals = {
        "Course": "GRAND TOTALS",
        "Fee Head": "",
        "Fee Head Amount": "",
        "Total Course Fee": `₹${courseWiseSummary.reduce((total, course) => total + (course.totalFee || 0), 0).toFixed(2)}`,
        "Number of Students": courseWiseSummary.reduce((total, course) => total + (course.numberOfStudents || 0), 0),
        "Total Revenue": `₹${calculateOverallRevenue().toFixed(2)}`
      }

      exportData.push(grandTotals)

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData)

      // Set column widths for better formatting
      const colWidths = [
        { wch: 20 }, // Course
        { wch: 25 }, // Fee Head
        { wch: 15 }, // Fee Head Amount
        { wch: 15 }, // Total Course Fee
        { wch: 18 }, // Number of Students
        { wch: 15 }  // Total Revenue
      ]
      worksheet['!cols'] = colWidths

      // Create workbook and add worksheet
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Course Wise Summary")

      // Generate file name with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      const fileName = `Course_Wise_Summary_${currentAcademicYear}_${timestamp}.xlsx`

      // Save the file
      XLSX.writeFile(workbook, fileName)
      toast.success("Course Wise Summary exported successfully!")
    } catch (error) {
      console.error("Error exporting course wise summary:", error)
      toast.error("Failed to export Course Wise Summary")
    }
  }

  // Calculate totals for display
  const calculateOverallRevenue = () => {
    return courseWiseSummary.reduce((total, course) => total + (course.totalRevenue || 0), 0)
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        {/* Header and Breadcrumb */}
        <div className="mb-4">
          <h2 className="mb-2">Demand Report</h2>
          <nav className="d-flex custom-breadcrumb py-1 py-lg-3">
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <div to="/admission">Admission Master</div>
            <span className="separator mx-2">&gt;</span>
            <span>Demand Report</span>
          </nav>
        </div>

        {/* Forms First */}
        <Row>
          {/* Course Wise Fee Setting Form */}
          <Col md={6}>
            <Card className="mb-4">
              <Card.Header className="p-3 custom-btn-clr">
                <h5 className="m-0">
                  {editingCourseFee ? 'Edit Course Wise Fee' : 'Course Wise Fee Setting'}
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                <Form onSubmit={handleCourseWiseSubmit}>
                  <Row className="mb-3">
                    <Col md={12}>
                      <Form.Label>Course</Form.Label>
                      <Form.Select
                        name="course"
                        value={courseWiseData.course}
                        onChange={handleCourseWiseChange}
                        required
                      >
                        <option value="">Select Course</option>
                        {courses.map((course) => (
                          <option key={course.id} value={course.name}>
                            {course.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={12}>
                      <Form.Label>Sex</Form.Label>
                      <Form.Select name="sex" value={courseWiseData.sex} onChange={handleCourseWiseChange}>
                        <option value="All">All</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Transgender">Transgender</option>
                      </Form.Select>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={12}>
                      <Form.Label>Fee Head</Form.Label>
                      <Form.Select
                        name="feeHead"
                        value={courseWiseData.feeHead}
                        onChange={handleCourseWiseChange}
                        required
                      >
                        <option value="">Select Fee Head</option>
                        {feeHeads.map((feeHead) => (
                          <option key={feeHead.id} value={feeHead.feeHead}>
                            {feeHead.feeHead}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={12}>
                      <Form.Label>Amount</Form.Label>
                      <Form.Control
                        type="number"
                        name="amount"
                        value={courseWiseData.amount}
                        onChange={handleCourseWiseChange}
                        placeholder="Enter amount"
                        step="0.01"
                        min="0"
                        required
                      />
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-center gap-2 mt-4">
                    <Button
                      type="submit"
                      className="custom-btn-clr"
                      disabled={loading}
                    >
                      {loading ? "Saving..." : (editingCourseFee ? "Update Demand" : "Save Demand")}
                    </Button>
                    {editingCourseFee && (
                      <Button variant="secondary" onClick={handleCancelEditCourse}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Individual Fee Setting Form */}
          <Col md={6}>
            <Card className="mb-4">
              <Card.Header className="p-3 custom-btn-clr">
                <h5 className="m-0">
                  {editingIndividualFee ? 'Edit Individual Fee' : 'Individual Fee Setting'}
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                <Form onSubmit={handleIndividualSubmit}>
                  <Row className="mb-3">
                    <Col md={12}>
                      <Form.Label>Admission Number</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type="text"
                          placeholder="Type admission number or name"
                          value={studentSearch}
                          onChange={handleStudentSearchChange}
                        />
                      </InputGroup>
                      <Form.Select
                        name="adminNumber"
                        value={individualData.adminNumber}
                        onChange={(e) => {
                          handleIndividualChange(e)
                          handleStudentSelection(e.target.value)
                        }}
                        required
                        className="mt-2"
                      >
                        <option value="">Select Admission Number</option>
                        {filteredStudents.map((student) => (
                          <option key={student.id} value={student.admissionNumber}>
                            {student.admissionNumber} - {student.studentName}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={12}>
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={individualData.name}
                        onChange={handleIndividualChange}
                        placeholder="Student name will auto-fill"
                        readOnly
                      />
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={12}>
                      <Form.Label>Fee Head</Form.Label>
                      <Form.Select
                        name="feeHead"
                        value={individualData.feeHead}
                        onChange={handleIndividualChange}
                        required
                      >
                        <option value="">Select Fee Head</option>
                        {feeHeads.map((feeHead) => (
                          <option key={feeHead.id} value={feeHead.feeHead}>
                            {feeHead.feeHead}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={12}>
                      <Form.Label>Amount</Form.Label>
                      <Form.Control
                        type="number"
                        name="amount"
                        value={individualData.amount}
                        onChange={handleIndividualChange}
                        placeholder="Enter amount"
                        step="0.01"
                        min="0"
                        required
                      />
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-center gap-2 mt-4">
                    <Button
                      type="submit"
                      className="custom-btn-clr"
                      disabled={loading}
                    >
                      {loading ? "Saving..." : (editingIndividualFee ? "Update Demand" : "Save Demand")}
                    </Button>
                    {editingIndividualFee && (
                      <Button variant="secondary" onClick={handleCancelEditIndividual}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Tables Second */}
        {/* Course Wise Fees Summary Table */}
        <Card className="mb-4">
          <Card.Header className="p-3 custom-btn-clr d-flex justify-content-between align-items-center">
            <h5 className="m-0">Course Wise Fees</h5>
            <Button
              variant="success"
              size="sm"
              onClick={exportCourseWiseToExcel}
              disabled={courseWiseSummary.length === 0}
            >
              <FaFileExcel className="me-1" />
              Export to Excel
            </Button>
          </Card.Header>
          <Card.Body className="p-4">
            {courseWiseFees.length > 0 ? (
              <Table striped bordered hover responsive>
                <thead className="table-dark">
                  <tr>
                    <th>Course</th>
                    <th>Sex</th>
                    <th>Fee Head</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courseWiseFees.map((fee, index) => (
                    <tr key={index}>
                      <td>{fee.course}</td>
                      <td>{fee.sex || "All"}</td>
                      <td>{fee.feeHead}</td>
                      <td>₹{parseFloat(fee.amount).toFixed(2)}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => handleEditCourseFee(fee)}
                            disabled={loading}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteClick(fee, "course")}
                            disabled={loading}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="text-center text-muted py-4">
                <p>No course-wise fee data available</p>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Individual Fees Table */}
        <Card className="mb-4">
          <Card.Header className="p-3 custom-btn-clr d-flex justify-content-between align-items-center">
            <h5 className="m-0">Individual Fees</h5>
            <Button
              variant="success"
              size="sm"
              onClick={exportIndividualFeesToExcel}
              disabled={individualFees.length === 0}
            >
              <FaFileExcel className="me-1" />
              Export to Excel
            </Button>
          </Card.Header>
          <Card.Body className="p-4">
            {individualFees.length > 0 ? (
              <Table striped bordered hover responsive>
                <thead className="table-dark">
                  <tr>
                    <th>Admission Number</th>
                    <th>Student Name</th>
                    <th>Fee Head</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {individualFees.map((fee, index) => (
                    <tr key={index}>
                      <td>{fee.admissionNumber}</td>
                      <td>{fee.studentName}</td>
                      <td>{fee.feeHead}</td>
                      <td>₹{parseFloat(fee.amount).toFixed(2)}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => handleEditIndividualFee(fee)}
                            disabled={loading}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteClick(fee, "individual")}
                            disabled={loading}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="text-center text-muted py-4">
                <p>No individual fee data available</p>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Course Wise Summary Table */}
        <Card className="mb-4">
          <Card.Header className="p-3 custom-btn-clr d-flex justify-content-between align-items-center">
            <h5 className="m-0">Course Wise Summary</h5>
            <Button
              variant="success"
              size="sm"
              onClick={exportCourseWiseSummaryToExcel}
              disabled={courseWiseSummary.length === 0}
            >
              <FaFileExcel className="me-1" />
              Export to Excel
            </Button>
          </Card.Header>
          <Card.Body className="p-4">
            {courseWiseSummary.length > 0 ? (
              <Table striped bordered hover responsive>
                <thead className="table-dark">
                  <tr>
                    <th>Course</th>
                    <th>Fee Heads & Amounts</th>
                    <th>Total Course Fee</th>
                    <th>Number of Students</th>
                    <th>Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {courseWiseSummary.map((course, index) => (
                    <React.Fragment key={index}>
                      {/* Main course row */}
                      <tr style={{ backgroundColor: '#e3f2fd' }}>
                        <td className="fw-bold">{course.course}</td>
                        <td>
                          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                            {course.feeHeads.map((feeHead, idx) => (
                              <div key={idx} className="d-flex justify-content-between align-items-center mb-1">
                                <span style={{ fontWeight: '500', color: '#333' }}>{feeHead.feeHead}</span>
                                <span style={{ fontWeight: '600', color: '#0B3D7B' }}>₹{parseFloat(feeHead.amount).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="fw-bold">₹{course.totalFee?.toFixed(2)}</td>
                        <td className="fw-bold">{course.numberOfStudents}</td>
                        <td className="fw-bold text-success">₹{course.totalRevenue?.toFixed(2)}</td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
                <tfoot style={{ backgroundColor: '#d1ecf1' }}>
                  <tr>
                    <td colSpan="2" className="text-end fw-bold">Grand Totals:</td>
                    <td className="fw-bold">
                      ₹{courseWiseSummary.reduce((total, course) => total + (course.totalFee || 0), 0).toFixed(2)}
                    </td>
                    <td className="fw-bold">
                      {courseWiseSummary.reduce((total, course) => total + (course.numberOfStudents || 0), 0)}
                    </td>
                    <td className="fw-bold text-success">
                      ₹{calculateOverallRevenue().toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </Table>
            ) : (
              <div className="text-center text-muted py-4">
                <p>No course-wise summary data available</p>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this fee entry?
          {feeToDelete && (
            <div className="mt-2 p-2 bg-light rounded">
              {deleteType === "course" ? (
                <>
                  <strong>Course:</strong> {feeToDelete.course}<br />
                  <strong>Fee Head:</strong> {feeToDelete.feeHead}<br />
                  <strong>Amount:</strong> ₹{parseFloat(feeToDelete.amount).toFixed(2)}
                </>
              ) : (
                <>
                  <strong>Student:</strong> {feeToDelete.studentName}<br />
                  <strong>Fee Head:</strong> {feeToDelete.feeHead}<br />
                  <strong>Amount:</strong> ₹{parseFloat(feeToDelete.amount).toFixed(2)}
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer />
    </MainContentPage>
  )
}

export default DemandReport