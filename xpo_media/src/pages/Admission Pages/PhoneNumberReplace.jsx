"use client"

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Form, Button, Card, Container, Dropdown, Modal, Row, Col } from "react-bootstrap"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useAuthContext } from "../../Context/AuthContext"
import { ENDPOINTS } from "../../SpringBoot/config"

const PhoneNumberReplace = () => {
  const [formData, setFormData] = useState({
    admissionNumber: "",
    studentName: "",
    currentPhoneNumber1: "",
    currentPhoneNumber2: "",
    newPhoneNumber1: "",
    newPhoneNumber2: "",
    phoneNumberToUpdate: "phone1" // "phone1" or "phone2"
  })
  const [isLoading, setIsLoading] = useState(false)
  const [admissionNumbers, setAdmissionNumbers] = useState([])
  const [filteredAdmissionNumbers, setFilteredAdmissionNumbers] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  const { schoolId, getAuthHeaders, currentAcademicYear, isAuth } = useAuthContext()

  useEffect(() => {
    if (schoolId && isAuth) {
      fetchAdmissionNumbers()
    }
  }, [schoolId, isAuth, currentAcademicYear])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const fetchAdmissionNumbers = async () => {
    if (!schoolId || !currentAcademicYear) return

    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/studentreport/datas?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const studentsData = await response.json()
        const admissionNumbersData = studentsData
          .map(student => student.admissionNumber)
          .filter(Boolean)
          .sort()
        
        setAdmissionNumbers(admissionNumbersData)
        setFilteredAdmissionNumbers(admissionNumbersData)
      } else {
        throw new Error("Failed to fetch admission numbers")
      }
    } catch (error) {
      console.error("Error fetching admission numbers:", error)
      toast.error("Failed to fetch admission numbers")
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (name === "admissionNumber") {
      const filtered = admissionNumbers.filter((num) => 
        num.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredAdmissionNumbers(filtered)
      setShowDropdown(true)
    }

    // Validate new phone numbers are different from current ones
    if (name === "newPhoneNumber1" && value === formData.currentPhoneNumber1) {
      toast.warn("Please enter a different phone number than the current Phone Number 1.")
    }
    if (name === "newPhoneNumber2" && value === formData.currentPhoneNumber2) {
      toast.warn("Please enter a different phone number than the current Phone Number 2.")
    }
  }

  const handlePhoneNumberToUpdateChange = (e) => {
    const { value } = e.target
    setFormData((prev) => ({
      ...prev,
      phoneNumberToUpdate: value,
      newPhoneNumber1: "",
      newPhoneNumber2: ""
    }))
  }

  const handleInputFocus = () => {
    setShowDropdown(true)
  }

  const handleAdmissionNumberSelect = (admissionNumber) => {
    setFormData((prev) => ({
      ...prev,
      admissionNumber: admissionNumber,
    }))
    setShowDropdown(false)
    fetchStudentDetails(admissionNumber)
  }

  const fetchStudentDetails = async (admissionNumber) => {
    if (!schoolId || !currentAcademicYear) return

    setIsLoading(true)
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/admission/admission-number/${admissionNumber}?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const student = await response.json()
        
        if (student) {
          setFormData((prev) => ({
            ...prev,
            studentName: student.studentName || "",
            currentPhoneNumber1: student.phoneNumber || "",
            currentPhoneNumber2: student.phoneNumber2 || "",
            newPhoneNumber1: "", // Reset new phone numbers when fetching new student details
            newPhoneNumber2: "",
            phoneNumberToUpdate: "phone1" // Reset to phone1 by default
          }))
          toast.success("Student details fetched successfully")
        } else {
          toast.error("No student found with this admission number")
          setFormData((prev) => ({
            ...prev,
            studentName: "",
            currentPhoneNumber1: "",
            currentPhoneNumber2: "",
            newPhoneNumber1: "",
            newPhoneNumber2: "",
          }))
        }
      } else {
        throw new Error("Failed to fetch student details")
      }
    } catch (error) {
      console.error("Error fetching student details:", error)
      toast.error("Failed to fetch student details")
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    if (!formData.admissionNumber) {
      toast.error("Please select an admission number")
      return false
    }

    if (formData.phoneNumberToUpdate === "phone1") {
      if (!formData.newPhoneNumber1) {
        toast.error("Please enter a new phone number for Phone Number 1")
        return false
      }
      if (formData.newPhoneNumber1 === formData.currentPhoneNumber1) {
        toast.warn("Please enter a different phone number than the current Phone Number 1.")
        return false
      }
      // Validate phone number format (10 digits)
      const phoneRegex = /^\d{10}$/
      if (!phoneRegex.test(formData.newPhoneNumber1)) {
        toast.error("Please enter a valid 10-digit phone number for Phone Number 1")
        return false
      }
    } else if (formData.phoneNumberToUpdate === "phone2") {
      if (!formData.newPhoneNumber2) {
        toast.error("Please enter a new phone number for Phone Number 2")
        return false
      }
      if (formData.newPhoneNumber2 === formData.currentPhoneNumber2) {
        toast.warn("Please enter a different phone number than the current Phone Number 2.")
        return false
      }
      // Validate phone number format (10 digits)
      const phoneRegex = /^\d{10}$/
      if (!phoneRegex.test(formData.newPhoneNumber2)) {
        toast.error("Please enter a valid 10-digit phone number for Phone Number 2")
        return false
      }
    }

    return true
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      setShowConfirmModal(true)
    }
  }

  const handleConfirmUpdate = async () => {
    setShowConfirmModal(false)
    setIsLoading(true)
    
    if (!schoolId || !currentAcademicYear) {
      toast.error("School ID or Academic Year not available")
      setIsLoading(false)
      return
    }

    try {
      const updatePayload = {
        admissionNumber: formData.admissionNumber,
        phoneNumberToUpdate: formData.phoneNumberToUpdate,
        newPhoneNumber: formData.phoneNumberToUpdate === "phone1" ? formData.newPhoneNumber1 : formData.newPhoneNumber2,
        schoolId: schoolId,
        academicYear: currentAcademicYear
      }

      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/replace/phone`,
        {
          method: "PUT",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json"
          },
          body: JSON.stringify(updatePayload)
        }
      )

      if (response.ok) {
        const result = await response.json()
        toast.success("Phone number updated successfully")
        
        // Update local state with the new phone number
        if (formData.phoneNumberToUpdate === "phone1") {
          setFormData(prev => ({
            ...prev,
            currentPhoneNumber1: formData.newPhoneNumber1,
            newPhoneNumber1: ""
          }))
        } else {
          setFormData(prev => ({
            ...prev,
            currentPhoneNumber2: formData.newPhoneNumber2,
            newPhoneNumber2: ""
          }))
        }
        
        // Refresh admission numbers list
        fetchAdmissionNumbers()
      } else {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to update phone number")
      }
    } catch (error) {
      console.error("Error updating phone number:", error)
      toast.error(error.message || "Failed to update phone number")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      admissionNumber: "",
      studentName: "",
      currentPhoneNumber1: "",
      currentPhoneNumber2: "",
      newPhoneNumber1: "",
      newPhoneNumber2: "",
      phoneNumberToUpdate: "phone1"
    })
    setShowDropdown(false)
  }

  const getCurrentPhoneNumberDisplay = () => {
    if (formData.phoneNumberToUpdate === "phone1") {
      return formData.currentPhoneNumber1
    } else {
      return formData.currentPhoneNumber2
    }
  }

  const getNewPhoneNumberDisplay = () => {
    if (formData.phoneNumberToUpdate === "phone1") {
      return formData.newPhoneNumber1
    } else {
      return formData.newPhoneNumber2
    }
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        {/* Header and Breadcrumb */}
        <div className="mb-4">
          <h2 className="mb-2">Phone Number Replace</h2>
          <nav className="custom-breadcrumb py-1 py-lg-3">
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <span>Admission Master</span>
            <span className="separator mx-2">&gt;</span>
            <span>Phone Number Replace</span>
          </nav>
        </div>

        {/* Phone Number Replacement Card */}
        <Card className="mb-4">
          <Card.Header className="p-3 custom-btn-clr">
            <h5 className="m-0 text-white">Phone Number Replacement</h5>
          </Card.Header>
          <Card.Body className="p-4">
            <Form onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Col md={3}>
                  <Form.Label className="fw-semibold">Admission Number</Form.Label>
                </Col>
                <Col md={9} className="position-relative" ref={dropdownRef}>
                  <Form.Control
                    type="text"
                    name="admissionNumber"
                    value={formData.admissionNumber}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    placeholder="Enter or Select Admission Number"
                    autoComplete="off"
                    ref={inputRef}
                    disabled={isLoading}
                    className="form-control-blue"
                  />
                  {showDropdown && filteredAdmissionNumbers.length > 0 && (
                    <Dropdown.Menu
                      show
                      style={{
                        width: "100%",
                        maxHeight: "200px",
                        overflowY: "auto",
                        position: "absolute",
                        zIndex: 1000,
                      }}
                    >
                      {filteredAdmissionNumbers.map((num, index) => (
                        <Dropdown.Item 
                          key={index} 
                          onClick={() => handleAdmissionNumberSelect(num)}
                          style={{ cursor: "pointer" }}
                        >
                          {num}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  )}
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={3}>
                  <Form.Label className="fw-semibold">Student Name</Form.Label>
                </Col>
                <Col md={9}>
                  <Form.Control 
                    type="text" 
                    value={formData.studentName} 
                    readOnly 
                    placeholder="Student Name will appear here"
                    className="form-control-blue"
                  />
                </Col>
              </Row>

              {/* Current Phone Numbers Display */}
              <Row className="mb-3">
                <Col md={3}>
                  <Form.Label className="fw-semibold">Current Phone Numbers</Form.Label>
                </Col>
                <Col md={9}>
                  <Row>
                    <Col md={6}>
                      <Form.Label className="small text-muted">Phone Number 1</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.currentPhoneNumber1}
                        readOnly
                        placeholder="No phone number 1"
                        className="form-control-blue"
                      />
                    </Col>
                    <Col md={6}>
                      <Form.Label className="small text-muted">Phone Number 2</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.currentPhoneNumber2}
                        readOnly
                        placeholder="No phone number 2"
                        className="form-control-blue"
                      />
                    </Col>
                  </Row>
                </Col>
              </Row>

              {/* Phone Number Selection */}
              <Row className="mb-3">
                <Col md={3}>
                  <Form.Label className="fw-semibold">Update Phone Number</Form.Label>
                </Col>
                <Col md={9}>
                  <Form.Select
                    name="phoneNumberToUpdate"
                    value={formData.phoneNumberToUpdate}
                    onChange={handlePhoneNumberToUpdateChange}
                    disabled={!formData.admissionNumber || isLoading}
                    className="form-control-blue"
                  >
                    <option value="phone1">Phone Number 1</option>
                    <option value="phone2">Phone Number 2</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Select which phone number you want to update
                  </Form.Text>
                </Col>
              </Row>

              {/* New Phone Number Input */}
              <Row className="mb-3">
                <Col md={3}>
                  <Form.Label className="fw-semibold">
                    New {formData.phoneNumberToUpdate === "phone1" ? "Phone Number 1" : "Phone Number 2"}
                  </Form.Label>
                </Col>
                <Col md={9}>
                  {formData.phoneNumberToUpdate === "phone1" ? (
                    <Form.Control
                      type="tel"
                      name="newPhoneNumber1"
                      value={formData.newPhoneNumber1}
                      onChange={handleInputChange}
                      placeholder="Enter New 10-digit Phone Number 1"
                      disabled={!formData.admissionNumber || isLoading}
                      className="form-control-blue"
                      maxLength={10}
                    />
                  ) : (
                    <Form.Control
                      type="tel"
                      name="newPhoneNumber2"
                      value={formData.newPhoneNumber2}
                      onChange={handleInputChange}
                      placeholder="Enter New 10-digit Phone Number 2"
                      disabled={!formData.admissionNumber || isLoading}
                      className="form-control-blue"
                      maxLength={10}
                    />
                  )}
                  <Form.Text className="text-muted">
                    Enter 10-digit phone number without country code
                  </Form.Text>
                </Col>
              </Row>

              <div className="d-flex justify-content-center gap-2 mt-4">
                <Button 
                  type="submit" 
                  className="custom-btn-clr" 
                  disabled={isLoading || !formData.admissionNumber || 
                    (formData.phoneNumberToUpdate === "phone1" ? !formData.newPhoneNumber1 : !formData.newPhoneNumber2)}
                >
                  {isLoading ? "Updating..." : "Update Phone Number"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>

        {/* Confirmation Modal */}
        <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Phone Number Update</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to update the phone number for:</p>
            <p><strong>Student:</strong> {formData.studentName}</p>
            <p><strong>Admission Number:</strong> {formData.admissionNumber}</p>
            <p><strong>Phone Number to Update:</strong> {formData.phoneNumberToUpdate === "phone1" ? "Phone Number 1" : "Phone Number 2"}</p>
            <p><strong>From:</strong> {getCurrentPhoneNumberDisplay() || "Not set"}</p>
            <p><strong>To:</strong> {getNewPhoneNumberDisplay()}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmUpdate}>
              Confirm Update
            </Button>
          </Modal.Footer>
        </Modal>
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

          .custom-btn-clr {
            background-color: #0B3D7B;
            border-color: #0B3D7B;
            color: white;
          }

          .custom-btn-clr:hover {
            background-color: #082b56;
            border-color: #082b56;
            color: white;
          }

          .custom-btn-clr:disabled {
            background-color: #6c757d;
            border-color: #6c757d;
          }

          .form-control-blue {
            background-color: #F0F4FF !important;
            border: 1px solid #E2E8F0;
            border-radius: 4px;
          }

          .form-control-blue:focus {
            border-color: #0B3D7B;
            box-shadow: 0 0 0 0.2rem rgba(11, 61, 123, 0.25);
          }

          .dropdown-menu {
            max-height: 200px;
            overflow-y: auto;
          }
        `}
      </style>
      <ToastContainer />
    </MainContentPage>
  )
}

export default PhoneNumberReplace