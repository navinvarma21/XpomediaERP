"use client"

import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Form, Button, Card, Container, Table, Row, Col, InputGroup, Accordion, Modal } from "react-bootstrap"
import { useAuthContext } from "../../Context/AuthContext"
import { ENDPOINTS } from "../../SpringBoot/config"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { FaSearch, FaFileExport, FaTrash, FaEdit, FaEye, FaFilter, FaChevronRight, FaTimes, FaExclamationTriangle } from "react-icons/fa"
import * as XLSX from "xlsx"

const ArrearFeeUpdating = () => {
  const { schoolId, getAuthHeaders, currentAcademicYear } = useAuthContext()
  
  const [formData, setFormData] = useState({
    admissionNumber: "",
    studentName: "",
    standard: "",
    amount: "",
    feeHead: "",
    inOut: "IN",
    academicYear: ""
  })

  const [students, setStudents] = useState([])
  const [feeHeads, setFeeHeads] = useState([])
  const [arrearFees, setArrearFees] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [showStudentView, setShowStudentView] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedFee, setSelectedFee] = useState(null)
  const [studentArrearFees, setStudentArrearFees] = useState([])
  const [inOutFilter, setInOutFilter] = useState("ALL")
  const [availableAcademicYears, setAvailableAcademicYears] = useState([])
  
  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [feeToDelete, setFeeToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Store account head mapping
  const [accountHeadMapping, setAccountHeadMapping] = useState({})

  // Fetch students data - WITH academic year restriction
  const fetchStudents = useCallback(async () => {
    if (!schoolId || !currentAcademicYear) return
    
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/studentreport/school/${schoolId}?academicYear=${currentAcademicYear}`,
        { headers: getAuthHeaders() }
      )
      
      if (response.ok) {
        const data = await response.json()
        setStudents(data || [])
      } else {
        toast.error("Failed to fetch students")
      }
    } catch (error) {
      toast.error("Error fetching students")
    }
  }, [schoolId, currentAcademicYear, getAuthHeaders])

  // Fetch fee heads - WITH academic year restriction
  const fetchFeeHeads = useCallback(async () => {
    if (!schoolId || !currentAcademicYear) return
    
    try {
      const response = await fetch(
        `${ENDPOINTS.administration}/tutionfeesetup/fee-headings?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        { headers: getAuthHeaders() }
      )
      
      if (response.ok) {
        const data = await response.json()
        setFeeHeads(data || [])
        
        // Create mapping of fee head label to account head
        const mapping = {}
        data.forEach(feeHead => {
          if (feeHead.label && feeHead.account_head) {
            mapping[feeHead.label] = feeHead.account_head
          }
        })
        setAccountHeadMapping(mapping)
      } else {
        toast.error("Failed to fetch fee heads")
      }
    } catch (error) {
      toast.error("Error fetching fee heads")
    }
  }, [schoolId, currentAcademicYear, getAuthHeaders])

  // Fetch all arrear fees - NO academic year restriction
  const fetchArrearFees = useCallback(async () => {
    if (!schoolId) return
    
    try {
      const url = `${ENDPOINTS.admissionmaster}/arrearfee/school/${schoolId}`
      
      const response = await fetch(url, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        setArrearFees(data || [])
        
        // Extract unique academic years from arrear fees for dropdown
        const years = [...new Set(data.map(fee => fee.academicYear).filter(year => year))].sort((a, b) => b.localeCompare(a))
        setAvailableAcademicYears(years)
      } else {
        toast.error("Failed to fetch arrear fees")
      }
    } catch (error) {
      toast.error("Error fetching arrear fees")
    }
  }, [schoolId, getAuthHeaders])

  // Fetch arrear fees for a specific student - NO academic year restriction
  const fetchStudentArrearFees = useCallback(async (admissionNumber) => {
    if (!schoolId || !admissionNumber) return
    
    try {
      const url = `${ENDPOINTS.admissionmaster}/arrearfee/school/${schoolId}?admissionNumber=${admissionNumber}`
      
      const response = await fetch(url, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        setStudentArrearFees(data || [])
      } else {
        setStudentArrearFees([])
      }
    } catch (error) {
      setStudentArrearFees([])
    }
  }, [schoolId, getAuthHeaders])

  // Load initial data
  useEffect(() => {
    fetchStudents()
    fetchFeeHeads()
    fetchArrearFees()
  }, [fetchStudents, fetchFeeHeads, fetchArrearFees])

  // Set default academic year when currentAcademicYear changes
  useEffect(() => {
    if (currentAcademicYear && !formData.academicYear && !editingId) {
      setFormData(prev => ({
        ...prev,
        academicYear: currentAcademicYear
      }))
    }
  }, [currentAcademicYear, editingId])

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Auto-fill student details when admission number is entered
    if (name === "admissionNumber" && value) {
      const student = students.find(s => 
        s.admissionNumber?.toLowerCase() === value.toLowerCase() ||
        s.admissionNumber?.includes(value)
      )
      if (student) {
        setFormData(prev => ({
          ...prev,
          studentName: student.studentName || "",
          standard: student.standard || ""
        }))
      }
    }
  }

  // Handle form submission - WITH editable academic year
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!schoolId) {
      toast.error("School ID not available")
      return
    }

    if (!formData.admissionNumber || !formData.amount || !formData.feeHead || !formData.academicYear) {
      toast.error("Please fill all required fields including Academic Year")
      return
    }

    setLoading(true)

    try {
      // Get account head from mapping based on selected fee head
      const accountHead = accountHeadMapping[formData.feeHead] || ""
      
      // Create proper DTO structure for backend - WITH academic year and account head
      const payload = {
        admissionNumber: formData.admissionNumber,
        studentName: formData.studentName || "",
        standard: formData.standard || "",
        amount: parseFloat(formData.amount),
        feeHead: formData.feeHead,
        accountHead: accountHead, // Auto-filled from mapping, not shown in UI
        inOut: formData.inOut,
        academicYear: formData.academicYear
      }

      let url, method
      
      if (editingId) {
        url = `${ENDPOINTS.admissionmaster}/arrearfee/${editingId}?schoolId=${schoolId}`
        method = "PUT"
      } else {
        url = `${ENDPOINTS.admissionmaster}/arrearfee?schoolId=${schoolId}`
        method = "POST"
      }

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast.success(editingId ? "Arrear fee updated successfully!" : "Arrear fee added successfully!")
        resetForm()
        fetchArrearFees()
      } else {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to save arrear fee")
      }
    } catch (error) {
      toast.error(error.message || "Error saving arrear fee")
    } finally {
      setLoading(false)
    }
  }

  // View single student details - Only show the clicked fee
  const handleViewStudent = async (fee) => {
    const student = students.find(s => s.admissionNumber === fee.admissionNumber)
    setSelectedStudent(student || fee)
    setSelectedFee(fee)
    setStudentArrearFees([fee])
    setShowStudentView(true)
    setInOutFilter("ALL")
  }

  // Edit arrear fee
  const handleEdit = (arrearFee) => {
    setFormData({
      admissionNumber: arrearFee.admissionNumber,
      studentName: arrearFee.studentName,
      standard: arrearFee.standard,
      amount: arrearFee.amount.toString(),
      feeHead: arrearFee.feeHead,
      inOut: arrearFee.inOut || "IN",
      academicYear: arrearFee.academicYear || currentAcademicYear
    })
    setEditingId(arrearFee.id)
  }

  // Show delete confirmation modal
  const handleDeleteClick = (fee) => {
    setFeeToDelete(fee)
    setShowDeleteModal(true)
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!feeToDelete) return

    setDeleteLoading(true)

    try {
      const url = `${ENDPOINTS.admissionmaster}/arrearfee/${feeToDelete.id}?schoolId=${schoolId}`
      
      const response = await fetch(url, {
        method: "DELETE",
        headers: getAuthHeaders()
      })

      if (response.ok) {
        toast.success("Arrear fee deleted successfully!")
        fetchArrearFees()
        setShowDeleteModal(false)
        setFeeToDelete(null)
      } else {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to delete arrear fee")
      }
    } catch (error) {
      toast.error("Error deleting arrear fee")
    } finally {
      setDeleteLoading(false)
    }
  }

  // Handle delete cancellation
  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setFeeToDelete(null)
    setDeleteLoading(false)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      admissionNumber: "",
      studentName: "",
      standard: "",
      amount: "",
      feeHead: "",
      inOut: "IN",
      academicYear: currentAcademicYear || ""
    })
    setEditingId(null)
  }

  // Filter arrear fees based on search term and In/Out filter
  const filteredArrearFees = arrearFees.filter(fee => {
    const matchesSearch = 
      fee.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.standard?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.feeHead?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesInOut = inOutFilter === "ALL" || fee.inOut === inOutFilter
    
    return matchesSearch && matchesInOut
  })

  // Filter student arrear fees based on In/Out filter
  const filteredStudentArrearFees = studentArrearFees.filter(fee => 
    inOutFilter === "ALL" || fee.inOut === inOutFilter
  )

  // Group arrear fees by academic year and then by grade
  const groupedArrearFees = filteredArrearFees.reduce((acc, fee) => {
    const year = fee.academicYear || "No Year";
    const grade = fee.standard || "No Grade";
    
    if (!acc[year]) {
      acc[year] = {};
    }
    if (!acc[year][grade]) {
      acc[year][grade] = [];
    }
    
    acc[year][grade].push(fee);
    return acc;
  }, {});

  // Get sorted academic years
  const academicYears = Object.keys(groupedArrearFees).sort((a, b) => b.localeCompare(a));

  // Export to Excel - All data
  const handleExport = () => {
    if (filteredArrearFees.length === 0) {
      toast.warning("No data to export")
      return
    }

    try {
      const excelData = filteredArrearFees.map(fee => ({
        "Admission Number": fee.admissionNumber,
        "Student Name": fee.studentName,
        "Grade": fee.standard,
        "Fee Head": fee.feeHead,
        "Account Head": fee.accountHead || "", // Still include in export
        "Amount": parseFloat(fee.amount),
        "In/Out": fee.inOut,
        "Academic Year": fee.academicYear
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)

      const colWidths = [
        { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, 
        { wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 15 }
      ]
      ws['!cols'] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, "Arrear Fees")

      const fileName = `arrear-fees-${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)

      toast.success("Excel file exported successfully!")
    } catch (error) {
      toast.error("Failed to export Excel file")
    }
  }

  // Export single student data to Excel
  const handleExportStudent = () => {
    if (!selectedStudent || filteredStudentArrearFees.length === 0) {
      toast.warning("No student data to export")
      return
    }

    try {
      const excelData = filteredStudentArrearFees.map(fee => ({
        "Admission Number": selectedStudent.admissionNumber,
        "Student Name": selectedStudent.studentName,
        "Grade": selectedStudent.standard,
        "Fee Head": fee.feeHead,
        "Account Head": fee.accountHead || "", // Still include in export
        "Amount": parseFloat(fee.amount),
        "In/Out": fee.inOut,
        "Academic Year": fee.academicYear
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)

      const colWidths = [
        { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, 
        { wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 15 }
      ]
      ws['!cols'] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, "Student Arrear Fee")

      const fileName = `student-${selectedStudent.admissionNumber}-arrear-fee.xlsx`
      XLSX.writeFile(wb, fileName)

      toast.success("Student fee details exported successfully!")
    } catch (error) {
      toast.error("Failed to export student details")
    }
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        {/* Header and Breadcrumb */}
        <div className="mb-4">
          <h2 className="mb-2">Arrear / Fee Updating</h2>
          <nav className="d-flex custom-breadcrumb py-1 py-lg-3">
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <div to="/admission">Admission Master</div>
            <span className="separator mx-2">&gt;</span>
            <span>Arrear / Fee Updating</span>
          </nav>
        </div>

        {/* Arrear Fee Form Card */}
        <Card className="mb-4">
          <Card.Header className="p-3 custom-btn-clr">
            <h5 className="m-0">
              {editingId ? "Edit Arrear Fee" : "Add Arrear Fee"}
            </h5>
          </Card.Header>
          <Card.Body className="p-4">
            <Form onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Admission Number *</Form.Label>
                    <Form.Control
                      type="text"
                      name="admissionNumber"
                      value={formData.admissionNumber}
                      onChange={handleInputChange}
                      placeholder="Enter admission number"
                      required
                      list="admissionNumbers"
                    />
                    <datalist id="admissionNumbers">
                      {students.map(student => (
                        <option key={student.id} value={student.admissionNumber}>
                          {student.studentName}
                        </option>
                      ))}
                    </datalist>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Student Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="studentName"
                      value={formData.studentName}
                      onChange={handleInputChange}
                      placeholder="Student name will auto-fill"
                      readOnly
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Grade (Standard)</Form.Label>
                    <Form.Control
                      type="text"
                      name="standard"
                      value={formData.standard}
                      onChange={handleInputChange}
                      placeholder="Grade will auto-fill"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Amount *</Form.Label>
                    <Form.Control
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="Enter amount"
                      min="0"
                      step="0.01"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Fee Head *</Form.Label>
                    <Form.Select
                      name="feeHead"
                      value={formData.feeHead}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Fee Head</option>
                      {feeHeads.map(feeHead => (
                        <option key={feeHead.value} value={feeHead.label}>
                          {feeHead.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>In/Out *</Form.Label>
                    <Form.Select
                      name="inOut"
                      value={formData.inOut}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="IN">In</option>
                      <option value="OUT">Out</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {/* Academic Year Field - EDITABLE */}
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Academic Year *</Form.Label>
                    <Form.Control
                      type="text"
                      name="academicYear"
                      value={formData.academicYear}
                      onChange={handleInputChange}
                      placeholder="Enter academic year (e.g., 2024-2025)"
                      required
                      list="academicYears"
                    />
                    <datalist id="academicYears">
                      {availableAcademicYears.map(year => (
                        <option key={year} value={year} />
                      ))}
                      {currentAcademicYear && !availableAcademicYears.includes(currentAcademicYear) && (
                        <option value={currentAcademicYear} />
                      )}
                    </datalist>
                    <Form.Text className="text-muted">
                      {editingId 
                        ? "You can change the academic year for this fee record" 
                        : `Default: ${currentAcademicYear}. You can change it to any academic year`}
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-center gap-2 mt-4">
                <Button 
                  type="submit" 
                  className="custom-btn-clr"
                  disabled={loading}
                >
                  {loading ? "Saving..." : (editingId ? "Update" : "Save")}
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={resetForm}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>

        {/* Arrear Fees List Card */}
        <Card>
          <Card.Header className="p-3 custom-btn-clr d-flex justify-content-between align-items-center">
            <h5 className="m-0">Arrear Fees List</h5>
            <div className="d-flex gap-2 align-items-center">
              <InputGroup style={{ width: "250px" }}>
                <Form.Control
                  type="text"
                  placeholder="Search by admission no, name, grade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
              </InputGroup>
              <InputGroup style={{ width: "180px" }}>
                <InputGroup.Text>
                  <FaFilter />
                </InputGroup.Text>
                <Form.Select
                  value={inOutFilter}
                  onChange={(e) => setInOutFilter(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="IN">IN Only</option>
                  <option value="OUT">OUT Only</option>
                </Form.Select>
              </InputGroup>
              <Button variant="success" onClick={handleExport}>
                <FaFileExport className="me-2" />
                Export Excel
              </Button>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              {academicYears.length === 0 ? (
                <div className="text-center py-4">
                  {arrearFees.length === 0 ? "No arrear fees found" : "No matching records found"}
                </div>
              ) : (
                <Accordion defaultActiveKey={academicYears[0]} alwaysOpen>
                  {academicYears.map((year) => (
                    <Accordion.Item key={year} eventKey={year}>
                      <Accordion.Header>
                        <strong>{year}</strong>
                        <span className="ms-2 badge bg-secondary">
                          {Object.values(groupedArrearFees[year]).flat().length} records
                        </span>
                      </Accordion.Header>
                      <Accordion.Body className="p-0">
                        {Object.keys(groupedArrearFees[year]).sort().map((grade) => (
                          <div key={grade} className="mb-3">
                            <div className="bg-light p-2 border-bottom">
                              <h6 className="mb-0 d-flex align-items-center">
                                <FaChevronRight className="me-2 text-muted" />
                                Grade: {grade}
                                <span className="ms-2 badge bg-primary">
                                  {groupedArrearFees[year][grade].length} records
                                </span>
                              </h6>
                            </div>
                            <Table striped bordered hover className="mb-0">
                              <thead className="custom-btn-clr">
                                <tr>
                                  <th>Admission No</th>
                                  <th>Student Name</th>
                                  <th>Grade</th>
                                  <th>Fee Head</th>
                                  <th>Amount</th>
                                  <th>In/Out</th>
                                  <th>Academic Year</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {groupedArrearFees[year][grade].map(fee => (
                                  <tr key={fee.id}>
                                    <td>{fee.admissionNumber}</td>
                                    <td>{fee.studentName}</td>
                                    <td>{fee.standard}</td>
                                    <td>{fee.feeHead}</td>
                                    <td>₹{parseFloat(fee.amount).toFixed(2)}</td>
                                    <td>
                                      <span 
                                        className={`badge ${
                                          fee.inOut === 'IN' ? 'bg-success' : 'bg-danger'
                                        }`}
                                      >
                                        {fee.inOut}
                                      </span>
                                    </td>
                                    <td>{fee.academicYear}</td>
                                    <td>
                                      <div className="d-flex gap-1">
                                        <Button
                                          variant="outline-info"
                                          size="sm"
                                          onClick={() => handleViewStudent(fee)}
                                          title="View Student Details"
                                        >
                                          <FaEye />
                                        </Button>
                                        <Button
                                          variant="outline-primary"
                                          size="sm"
                                          onClick={() => handleEdit(fee)}
                                          title="Edit"
                                        >
                                          <FaEdit />
                                        </Button>
                                        <Button
                                          variant="outline-danger"
                                          size="sm"
                                          onClick={() => handleDeleteClick(fee)}
                                          title="Delete"
                                        >
                                          <FaTrash />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                        ))}
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              )}
            </div>
          </Card.Body>
        </Card>
      </Container>

      {/* Popup Student View Overlay */}
      {showStudentView && (
        <div className="student-popup-overlay">
          <div className="student-popup-container">
            <div className="student-popup-header d-flex justify-content-between align-items-center p-3 custom-btn-clr text-white">
              <h5 className="mb-0">
                Student Arrear Fee Details - {selectedStudent?.admissionNumber}
              </h5>
              <Button 
                variant="light" 
                size="sm" 
                onClick={() => setShowStudentView(false)}
                className="d-flex align-items-center"
              >
                <FaTimes className="me-1" />
                Close
              </Button>
            </div>
            
            <div className="student-popup-body p-3">
              {selectedStudent && selectedFee && (
                <>
                  {/* Student Basic Info */}
                  <div className="student-basic-info mb-3 p-3 bg-light rounded">
                    <Row>
                      <Col md={4}>
                        <strong>Admission No:</strong><br />
                        {selectedStudent.admissionNumber}
                      </Col>
                      <Col md={4}>
                        <strong>Student Name:</strong><br />
                        {selectedStudent.studentName}
                      </Col>
                      <Col md={4}>
                        <strong>Grade:</strong><br />
                        {selectedStudent.standard}
                      </Col>
                    </Row>
                  </div>

                  {/* Single Fee Details */}
                  <div className="table-responsive">
                    <Table striped bordered hover size="sm">
                      <thead className="custom-btn-clr">
                        <tr>
                          <th>Fee Head</th>
                          <th>Amount</th>
                          <th>In/Out</th>
                          <th>Academic Year</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudentArrearFees.map(fee => (
                          <tr key={fee.id}>
                            <td>{fee.feeHead}</td>
                            <td>₹{parseFloat(fee.amount).toFixed(2)}</td>
                            <td>
                              <span className={`badge ${fee.inOut === 'IN' ? 'bg-success' : 'bg-danger'}`}>
                                {fee.inOut}
                              </span>
                            </td>
                            <td>{fee.academicYear}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  {/* Export Button */}
                  <div className="mt-3">
                    <Button variant="success" onClick={handleExportStudent}>
                      <FaFileExport className="me-2" />
                      Export to Excel
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleDeleteCancel} centered>
        <Modal.Header closeButton className="bg-warning text-dark">
          <Modal.Title className="d-flex align-items-center">
            <FaExclamationTriangle className="me-2" />
            Confirm Deletion
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <FaExclamationTriangle size={48} className="text-warning mb-3" />
            <h5>Are you sure you want to delete this arrear fee?</h5>
            {feeToDelete && (
              <div className="mt-3 p-3 bg-light rounded">
                <p className="mb-1"><strong>Admission No:</strong> {feeToDelete.admissionNumber}</p>
                <p className="mb-1"><strong>Student:</strong> {feeToDelete.studentName}</p>
                <p className="mb-1"><strong>Fee Head:</strong> {feeToDelete.feeHead}</p>
                <p className="mb-1"><strong>Amount:</strong> ₹{parseFloat(feeToDelete.amount).toFixed(2)}</p>
                <p className="mb-0"><strong>Academic Year:</strong> {feeToDelete.academicYear}</p>
              </div>
            )}
            <p className="text-danger mt-3">
              <strong>Warning:</strong> This action cannot be undone.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={handleDeleteCancel}
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteConfirm}
            disabled={deleteLoading}
          >
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer />

      {/* Custom CSS for popup student view */}
      <style>
        {`
          .student-popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1050;
            padding: 20px;
          }

          .student-popup-container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            width: 90vw;
            max-width: 1200px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          .student-popup-header {
            flex-shrink: 0;
          }

          .student-popup-body {
            flex: 1;
            overflow-y: auto;
            max-height: calc(90vh - 80px);
          }

          .student-basic-info {
            border-left: 4px solid #007bff;
          }

          @media (max-width: 768px) {
            .student-popup-container {
              width: 95vw;
              max-height: 95vh;
            }
            
            .student-popup-body {
              max-height: calc(95vh - 80px);
            }
          }
        `}
      </style>
    </MainContentPage>
  )
}

export default ArrearFeeUpdating