"use client"

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Form, Button, Card, Container, Dropdown, Modal } from "react-bootstrap"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useAuthContext } from "../../Context/AuthContext"
import { ENDPOINTS } from "../../SpringBoot/config"

const SectionReplace = () => {
  const [formData, setFormData] = useState({
    admissionNumber: "",
    studentName: "",
    currentSection: "",
    newSection: "",
  })
  const [sections, setSections] = useState([])
  const [filteredSections, setFilteredSections] = useState([])
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
      fetchSections()
      fetchAdmissionNumbers()
    }
  }, [schoolId, isAuth, currentAcademicYear])

  // Filter sections whenever currentSection changes
  useEffect(() => {
    if (formData.currentSection && sections.length > 0) {
      const filtered = sections.filter(section => 
        section.name !== formData.currentSection && section.name !== formData.currentSection
      )
      setFilteredSections(filtered)
    } else {
      setFilteredSections(sections)
    }
  }, [formData.currentSection, sections])

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

  const fetchSections = async () => {
    if (!schoolId) return

    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/sections?schoolId=${schoolId}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const sectionsData = await response.json()
        setSections(sectionsData || [])
        setFilteredSections(sectionsData || [])
      } else {
        throw new Error("Failed to fetch sections")
      }
    } catch (error) {
      console.error("Error fetching sections:", error)
      toast.error("Failed to fetch sections")
    }
  }

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

    if (name === "newSection" && value === formData.currentSection) {
      toast.warn("Please select a different section than the current one.")
    }
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
        `${ENDPOINTS.admissionmaster}/studentreport/datas?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const studentsData = await response.json()
        const student = studentsData.find(s => s.admissionNumber === admissionNumber)
        
        if (student) {
          setFormData((prev) => ({
            ...prev,
            studentName: student.studentName || "",
            currentSection: student.section || "",
            newSection: "", // Reset new section when fetching new student details
          }))
          toast.success("Student details fetched successfully")
        } else {
          toast.error("No student found with this admission number")
          setFormData((prev) => ({
            ...prev,
            studentName: "",
            currentSection: "",
            newSection: "",
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

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.admissionNumber || !formData.newSection) {
      toast.error("Please fill in all required fields")
      return
    }

    if (formData.newSection === formData.currentSection) {
      toast.warn("Please select a different section than the current one.")
      return
    }

    setShowConfirmModal(true)
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
        section: formData.newSection,
        schoolId: schoolId,
        academicYear: currentAcademicYear
      }

      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/replace/section`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(updatePayload)
        }
      )

      if (response.ok) {
        const result = await response.json()
        toast.success("Section updated successfully")
        
        // Update local state
        setFormData(prev => ({
          ...prev,
          currentSection: formData.newSection,
          newSection: ""
        }))
        
        // Refresh admission numbers list
        fetchAdmissionNumbers()
      } else {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to update section")
      }
    } catch (error) {
      console.error("Error updating section:", error)
      toast.error(error.message || "Failed to update section")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      admissionNumber: "",
      studentName: "",
      currentSection: "",
      newSection: "",
    })
    setShowDropdown(false)
    // Reset filtered sections to show all sections when form is cleared
    setFilteredSections(sections)
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        {/* Header and Breadcrumb */}
        <div className="mb-4">
          <h2 className="mb-2">Section Replace</h2>
          <nav className="custom-breadcrumb py-1 py-lg-3">
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <span>Admission Master</span>
            <span className="separator mx-2">&gt;</span>
            <span>Section Replace</span>
          </nav>
        </div>

        {/* Section Replacement Card */}
        <Card className="mb-4">
          <Card.Header className="p-3 custom-btn-clr">
            <h5 className="m-0 text-white">Section Replacement</h5>
          </Card.Header>
          <Card.Body className="p-4">
            <Form onSubmit={handleSubmit}>
              <div className="row mb-3">
                <div className="col-md-3">
                  <Form.Label className="fw-semibold">Admission Number</Form.Label>
                </div>
                <div className="col-md-9 position-relative" ref={dropdownRef}>
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
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-3">
                  <Form.Label className="fw-semibold">Student Name</Form.Label>
                </div>
                <div className="col-md-9">
                  <Form.Control 
                    type="text" 
                    value={formData.studentName} 
                    readOnly 
                    placeholder="Student Name will appear here"
                    className="form-control-blue"
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-3">
                  <Form.Label className="fw-semibold">Current Section</Form.Label>
                </div>
                <div className="col-md-9">
                  <Form.Control
                    type="text"
                    value={formData.currentSection}
                    readOnly
                    placeholder="Current Section will appear here"
                    className="form-control-blue"
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-3">
                  <Form.Label className="fw-semibold">New Section</Form.Label>
                </div>
                <div className="col-md-9">
                  <Form.Select 
                    name="newSection" 
                    value={formData.newSection} 
                    onChange={handleInputChange}
                    disabled={!formData.admissionNumber || isLoading}
                    className="form-control-blue"
                  >
                    <option value="">Select New Section</option>
                    {filteredSections.length > 0 ? (
                      filteredSections.map((section) => (
                        <option key={section.id || section} value={section.name || section}>
                          {section.name || section}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No other sections available</option>
                    )}
                  </Form.Select>
                  {formData.currentSection && filteredSections.length === 0 && (
                    <Form.Text className="text-warning">
                      No other sections available besides the current section.
                    </Form.Text>
                  )}
                  {formData.currentSection && filteredSections.length > 0 && (
                    <Form.Text className="text-muted">
                      Showing sections other than current section: {formData.currentSection}
                    </Form.Text>
                  )}
                </div>
              </div>

              <div className="d-flex justify-content-center gap-2 mt-4">
                <Button 
                  type="submit" 
                  className="custom-btn-clr" 
                  disabled={isLoading || !formData.admissionNumber || !formData.newSection}
                >
                  {isLoading ? "Updating..." : "Update Section"}
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
            <Modal.Title>Confirm Section Update</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to update the section for:</p>
            <p><strong>Student:</strong> {formData.studentName}</p>
            <p><strong>Admission Number:</strong> {formData.admissionNumber}</p>
            <p><strong>From:</strong> {formData.currentSection}</p>
            <p><strong>To:</strong> {formData.newSection}</p>
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

export default SectionReplace
