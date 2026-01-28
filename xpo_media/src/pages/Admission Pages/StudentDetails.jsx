"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Button, Container, Table, Form, OverlayTrigger, Tooltip, Row, Col, Card, Modal } from "react-bootstrap"
import { FaEdit, FaTrash, FaEye, FaCopy, FaTable, FaTh, FaQrcode, FaTimes, FaDownload, FaPhone } from "react-icons/fa"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import defaultStudentPhoto from "../../images/StudentProfileIcon/studentProfile.jpeg"
import { QRCodeSVG } from "qrcode.react"
import QRCode from "qrcode"
import { useAuthContext } from "../../Context/AuthContext"
import { ENDPOINTS } from "../../SpringBoot/config"

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName }) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Delete Student</h2>
        <div className="modal-body text-center">
          <p>Are you sure you want to delete this student?</p>
          <p className="fw-bold">{itemName}</p>
        </div>
        <div className="modal-buttons">
          <Button className="modal-button delete" onClick={onConfirm}>
            Delete
          </Button>
          <Button className="modal-button cancel" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

// QR Code Modal Component
const QRCodeModal = ({ isOpen, onClose, student, onDownload }) => {
  if (!isOpen || !student) return null

  const handleDownload = () => {
    onDownload(student)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <h2 className="modal-title">Student QR Code</h2>
        <div className="modal-body text-center">
          <div className="mb-3">
            <QRCodeSVG 
              value={student.qrCode || ""} 
              size={250}
              level="H"
              includeMargin
            />
          </div>
          <div className="student-info mb-3 p-3 bg-light rounded">
            <h5 className="mb-2 fw-bold text-primary">{student.studentName}</h5>
            <p className="mb-1"><strong>Admission No:</strong> {student.admissionNumber}</p>
            <p className="mb-1"><strong>Class:</strong> {student.standard} - {student.section}</p>
            <p className="mb-0"><strong>Father:</strong> {student.fatherName}</p>
          </div>
        </div>
        <div className="modal-buttons">
          <Button className="modal-button confirm" onClick={handleDownload}>
            <FaDownload className="me-2" />
            Download QR
          </Button>
          <Button className="modal-button cancel" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

// Optimized Student Image Component
const StudentImage = ({ student, className }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(true)
  }

  return (
    <div className="student-image-container">
      <img
        src={imageError ? defaultStudentPhoto : student.studentPhoto}
        alt={student.studentName}
        className={`student-profile-image ${className} ${!imageLoaded ? 'loading' : ''}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
      {!imageLoaded && (
        <div className="image-placeholder">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Phone Number Display Component
const PhoneNumberDisplay = ({ phoneNumber, phoneNumber2 }) => {
  const hasBothNumbers = phoneNumber && phoneNumber2;
  const hasOnlyPrimary = phoneNumber && !phoneNumber2;
  const hasOnlySecondary = !phoneNumber && phoneNumber2;

  if (!phoneNumber && !phoneNumber2) {
    return <span className="text-muted">No contact</span>;
  }

  return (
    <div className="phone-numbers-display">
      {hasBothNumbers && (
        <div className="d-flex flex-column gap-1">
          <div className="d-flex align-items-center gap-1">
            <FaPhone size={10} className="text-muted" />
            <span className="phone-number primary-phone">{phoneNumber}</span>
            <span className="badge bg-primary badge-sm">Primary</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <FaPhone size={10} className="text-muted" />
            <span className="phone-number secondary-phone">{phoneNumber2}</span>
            <span className="badge bg-secondary badge-sm">Secondary</span>
          </div>
        </div>
      )}
      {hasOnlyPrimary && (
        <div className="d-flex align-items-center gap-1">
          <FaPhone size={10} className="text-muted" />
          <span className="phone-number">{phoneNumber}</span>
        </div>
      )}
      {hasOnlySecondary && (
        <div className="d-flex align-items-center gap-1">
          <FaPhone size={10} className="text-muted" />
          <span className="phone-number">{phoneNumber2}</span>
          <span className="badge bg-secondary badge-sm">Secondary</span>
        </div>
      )}
    </div>
  );
};

const StudentDetails = () => {
  const [students, setStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [classFilter, setClassFilter] = useState("")
  const [sectionFilter, setSectionFilter] = useState("")
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState(null)
  const [viewType, setViewType] = useState("table")
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const navigate = useNavigate()
  const { schoolId, getAuthHeaders, currentAcademicYear } = useAuthContext()

  // Image cache to prevent re-fetching
  const imageCache = useMemo(() => new Map(), [])

  // Fetch classes from backend
  const fetchClasses = async () => {
    if (!schoolId) return
    
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/courses?schoolId=${schoolId}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const classesData = await response.json()
        setClasses(classesData.map(course => course.name).filter(Boolean))
      }
    } catch (error) {
      console.error("Error fetching classes:", error)
    }
  }

  // Fetch sections from backend
  const fetchSections = async () => {
    if (!schoolId) return
    
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/sections?schoolId=${schoolId}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const sectionsData = await response.json()
        setSections(sectionsData.map(section => section.name).filter(Boolean))
      }
    } catch (error) {
      console.error("Error fetching sections:", error)
    }
  }

  // Preload images for better performance
  const preloadImages = useCallback((studentList) => {
    studentList.forEach(student => {
      if (student.studentPhoto && !imageCache.has(student.studentPhoto)) {
        const img = new Image()
        img.src = student.studentPhoto
        imageCache.set(student.studentPhoto, img)
      }
    })
  }, [imageCache])

  // Generate consistent QR code data with formatted student information
  const generateQRCodeData = (student) => {
    // Format phone numbers for QR code display
    const formattedPhoneNumbers = [student.phoneNumber, student.phoneNumber2]
      .filter(phone => phone && phone.trim() !== "")
      .join(", ");

    const formattedData = `
STUDENT INFORMATION:
━━━━━━━━━━━━━━━━━━━━
🎓 Admission: ${student.admissionNumber}
👤 Name: ${student.studentName}
📚 Class: ${student.standard} - ${student.section}
👨‍👦 Father: ${student.fatherName}
📞 Phone: ${formattedPhoneNumbers}
📅 Year: ${currentAcademicYear}
━━━━━━━━━━━━━━━━━━━━
    `.trim()

    return formattedData
  }

  // Fetch students from SpringBoot backend with full details including photos
  const fetchStudents = async () => {
    if (!schoolId) return
    
    try {
      setLoading(true)
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/admission/school/${schoolId}?academicYear=${currentAcademicYear}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const studentsData = await response.json()
        // Transform data to match frontend expectations with full details
        const transformedStudents = studentsData.map(student => ({
          id: student.id,
          admissionNumber: student.admissionNumber,
          studentName: student.studentName,
          standard: student.standard,
          section: student.section,
          dateOfBirth: student.dateOfBirth,
          gender: student.gender,
          fatherName: student.fatherName,
          phoneNumber: student.phoneNumber,        // Primary phone number
          phoneNumber2: student.phoneNumber2,      // Secondary phone number
          emailId: student.emailId,
          motherName: student.motherName,
          religion: student.religion,
          community: student.community,
          caste: student.caste,
          bloodGroup: student.bloodGroup,
          aadharNumber: student.aadharNumber,
          // Use the correct photo URL format
          studentPhoto: `${ENDPOINTS.admissionmaster}/admission/${student.id}/photo?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
          // Generate consistent QR code data for both display and download
          qrCode: generateQRCodeData(student)
        }))
        setStudents(transformedStudents)
        
        // Preload images after a short delay to not block the main render
        setTimeout(() => {
          preloadImages(transformedStudents)
        }, 100)
      } else {
        toast.error("Failed to fetch students. Please try again.")
      }
    } catch (error) {
      console.error("Error fetching students:", error)
      toast.error("Failed to fetch students. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (schoolId) {
      fetchStudents()
      fetchClasses()
      fetchSections()
    }
  }, [schoolId, currentAcademicYear])

  const handleEdit = (e, studentId) => {
    e.stopPropagation()
    navigate(`/admission/AdmissionForm/${studentId}`)
  }

  const handleDeleteClick = (e, student) => {
    e.stopPropagation()
    setStudentToDelete(student)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (studentToDelete) {
      try {
        const response = await fetch(
          `${ENDPOINTS.admissionmaster}/admission/${studentToDelete.id}?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
          {
            method: "DELETE",
            headers: getAuthHeaders()
          }
        )

        if (response.ok) {
          setStudents(students.filter((student) => student.id !== studentToDelete.id))
          toast.success("Student deleted successfully!")
        } else {
          const errorText = await response.text()
          throw new Error(errorText || "Failed to delete student")
        }
      } catch (error) {
        console.error("Error deleting student:", error)
        toast.error(`Failed to delete student: ${error.message}`)
      }
    }
    setIsDeleteModalOpen(false)
    setStudentToDelete(null)
  }

  const handleView = (studentId) => {
    navigate(`/admission/AdmissionForm/${studentId}?view=true`)
  }

  const handleCopyAdmissionNumber = (admissionNumber) => {
    navigator.clipboard
      .writeText(admissionNumber)
      .then(() => toast.success("Admission Number copied to clipboard!"))
      .catch((error) => toast.error("Failed to copy Admission Number"))
  }

  const handleQRClick = (e, student) => {
    e.stopPropagation()
    setSelectedStudent(student)
    setShowQRModal(true)
  }

 const handleDownloadQR = async (student) => {
  try {
    // Create a canvas with extra space for text
    const qrSize = 300
    const textHeight = 80
    const padding = 20
    const canvasWidth = qrSize + (padding * 2)
    const canvasHeight = qrSize + textHeight + (padding * 2)

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    // Set white background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(student.qrCode || "", {
      width: qrSize,
      height: qrSize,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // Load QR code image
    const qrImage = new Image()
    qrImage.onload = () => {
      // Draw QR code centered
      ctx.drawImage(qrImage, padding, padding, qrSize, qrSize)

      // Draw border around QR code
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 1
      ctx.strokeRect(padding, padding, qrSize, qrSize)

      // Draw student information below QR code
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(student.studentName, canvasWidth / 2, qrSize + padding + 25)

      ctx.font = '14px Arial'
      ctx.fillText(`Admission: ${student.admissionNumber}`, canvasWidth / 2, qrSize + padding + 45)
      ctx.fillText(`Class: ${student.standard} - ${student.section}`, canvasWidth / 2, qrSize + padding + 65)

      // Convert to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = `QR_${student.admissionNumber}_${student.studentName}.png`
        link.href = url
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast.success(`QR code downloaded for ${student.studentName}!`)
      }, 'image/png')
    }

    qrImage.src = qrCodeDataUrl

  } catch (error) {
    console.error('Error downloading QR code:', error)
    toast.error('Failed to download QR code. Please try again.')
  }
}

  const handleClearSearch = () => {
    setSearchTerm("")
    setClassFilter("")
    setSectionFilter("")
    fetchStudents()
  }

  // Apply local filters for class and section
  const filteredStudents = useMemo(() => 
    students
      .filter(
        (student) =>
          student.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.standard?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.section?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.phoneNumber?.includes(searchTerm) ||
          student.phoneNumber2?.includes(searchTerm)
      )
      .filter((student) => (classFilter ? student.standard === classFilter : true))
      .filter((student) => (sectionFilter ? student.section === sectionFilter : true))
      .sort((a, b) => a.admissionNumber?.localeCompare(b.admissionNumber || ''))
  , [students, searchTerm, classFilter, sectionFilter])

  const toggleViewType = (type) => {
    setViewType(type)
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <div className="mb-4">
          <nav className="custom-breadcrumb py-1 py-lg-3">
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <span>Admission</span>
            <span className="separator mx-2">&gt;</span>
            <span>Student Details</span>
          </nav>
        </div>
        <div
          style={{ backgroundColor: "#0B3D7B" }}
          className="text-white p-3 rounded-top d-flex justify-content-between align-items-center"
        >
          <h2 className="mb-0">Student Details</h2>
          <Button onClick={() => navigate("/admission/AdmissionForm")} className="btn btn-primary text-light">
            + Add Student
          </Button>
        </div>

        <div className="bg-white p-4 rounded-bottom shadow">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-3">
            <div className="d-flex flex-column flex-md-row gap-2 mb-3 mb-md-0 w-100 w-md-auto">
              <div className="position-relative flex-grow-1">
                <Form.Control
                  type="text"
                  placeholder="Search by name, class, section, admission number, or phone"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pe-5"
                />
                {searchTerm && (
                  <Button
                    variant="link"
                    className="position-absolute end-0 top-50 translate-middle-y p-0 me-2"
                    onClick={() => setSearchTerm("")}
                    style={{ background: "transparent", border: "none", color: "#6c757d" }}
                  >
                    <FaTimes />
                  </Button>
                )}
              </div>
              <Form.Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="w-auto">
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </Form.Select>
              <Form.Select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="w-auto">
                <option value="">All Sections</option>
                {sections.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </Form.Select>
              {(searchTerm || classFilter || sectionFilter) && (
                <Button 
                  variant="outline-secondary" 
                  className="w-auto w-md-auto"
                  onClick={handleClearSearch}
                >
                  Clear
                </Button>
              )}
            </div>
            <div className="d-flex gap-2 justify-content-lg-end justify-content-center w-100 w-md-auto">
              <Button
                variant={viewType === "table" ? "primary" : "outline-primary"}
                onClick={() => toggleViewType("table")}
                className={`view-toggle-btn d-flex align-items-center gap-2 ${viewType === "table" ? "active" : ""}`}
              >
                <FaTable /> <span className="d-none d-sm-inline">Table View</span>
              </Button>
              <Button
                variant={viewType === "grid" ? "primary" : "outline-primary"}
                onClick={() => toggleViewType("grid")}
                className={`view-toggle-btn d-flex align-items-center gap-2 ${viewType === "grid" ? "active" : ''}`}
              >
                <FaTh /> <span className="d-none d-sm-inline">Card View</span>
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No students found. {searchTerm ? "Try a different search term." : "Add your first student to get started."}</p>
            </div>
          ) : viewType === "grid" ? (
            <Row className="g-3">
              {filteredStudents.map((student) => (
                <Col 
                  key={student.id} 
                  xs={12} 
                  sm={6} 
                  md={4} 
                  lg={4}
                  xl={4}
                >
                  <Card className="student-card h-100 w-100" onClick={() => handleView(student.id)}>
                    <div className="position-relative">
                      <div className="edit-button-wrapper">
                        <Button
                          variant="primary"
                          size="sm"
                          className="edit-icon-button"
                          onClick={(e) => handleEdit(e, student.id)}
                        >
                          <FaEdit />
                        </Button>
                      </div>
                      <StudentImage student={student} />
                    </div>
                    <Card.Body className="text-center">
                      <div className="student-info">
                        <div className="info-row">
                          <span className="info-label">Admission : </span>
                          <span className="info-value">{student.admissionNumber}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Name : </span>
                          <span className="info-value">{student.studentName}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Class : </span>
                          <span className="info-value">{student.standard}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Section : </span>
                          <span className="info-value">{student.section}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Contact : </span>
                          <div className="info-value">
                            <PhoneNumberDisplay 
                              phoneNumber={student.phoneNumber} 
                              phoneNumber2={student.phoneNumber2} 
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 d-flex justify-content-center gap-1 flex-wrap">
                        <Button
                          variant="primary"
                          size="sm"
                          className="d-flex align-items-center gap-1 custom-view-btn action-btn-responsive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleView(student.id)
                          }}
                        >
                          <FaEye /> <span className="d-none d-sm-inline">View</span>
                        </Button>
                        <Button
                          variant="warning"
                          size="sm"
                          className="d-flex align-items-center gap-1 custom-edit-btn action-btn-responsive"
                          onClick={(e) => handleEdit(e, student.id)}
                        >
                          <FaEdit /> <span className="d-none d-sm-inline">Edit</span>
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="d-flex align-items-center gap-1 custom-delete-btn action-btn-responsive"
                          onClick={(e) => handleDeleteClick(e, student)}
                        >
                          <FaTrash /> <span className="d-none d-sm-inline">Delete</span>
                        </Button>
                        <Button
                          variant="info"
                          size="sm"
                          className="d-flex align-items-center gap-1 custom-qr-btn action-btn-responsive"
                          onClick={(e) => handleQRClick(e, student)}
                        >
                          <FaQrcode /> <span className="d-none d-sm-inline">QR</span>
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <div className="table-responsive">
              <Table bordered hover className="compact-table">
                <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                  <tr>
                    <th>Admission Number</th>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Date of Birth</th>
                    <th>Gender</th>
                    <th>Parent Name</th>
                    <th>Contact</th>
                    <th className="action-column">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="compact-row">
                      <td>
                        <div className="d-flex align-items-center">
                          <span className="me-2">{student.admissionNumber}</span>
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip id={`tooltip-${student.id}`}>Copy Admission Number</Tooltip>}
                          >
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              className="copy-button"
                              onClick={() => handleCopyAdmissionNumber(student.admissionNumber)}
                            >
                              <FaCopy />
                            </Button>
                          </OverlayTrigger>
                        </div>
                      </td>
                      <td>{student.studentName}</td>
                      <td>{student.standard}</td>
                      <td>{student.section}</td>
                      <td>{student.dateOfBirth}</td>
                      <td>{student.gender}</td>
                      <td>{student.fatherName}</td>
                      <td>
                        <PhoneNumberDisplay 
                          phoneNumber={student.phoneNumber} 
                          phoneNumber2={student.phoneNumber2} 
                        />
                      </td>
                      <td className="action-column">
                        <div className="d-flex justify-content-center gap-1 action-buttons-horizontal">
                          <OverlayTrigger placement="top" overlay={<Tooltip>View</Tooltip>}>
                            <Button 
                              variant="primary" 
                              size="sm" 
                              className="action-btn-table"
                              onClick={() => handleView(student.id)}
                            >
                              <FaEye />
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger placement="top" overlay={<Tooltip>Edit</Tooltip>}>
                            <Button 
                              variant="warning" 
                              size="sm" 
                              className="action-btn-table"
                              onClick={(e) => handleEdit(e, student.id)}
                            >
                              <FaEdit />
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger placement="top" overlay={<Tooltip>Delete</Tooltip>}>
                            <Button 
                              variant="danger" 
                              size="sm" 
                              className="action-btn-table"
                              onClick={(e) => handleDeleteClick(e, student)}
                            >
                              <FaTrash />
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger placement="top" overlay={<Tooltip>QR Code</Tooltip>}>
                            <Button 
                              variant="info" 
                              size="sm" 
                              className="action-btn-table"
                              onClick={(e) => handleQRClick(e, student)}
                            >
                              <FaQrcode />
                            </Button>
                          </OverlayTrigger>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      </Container>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setStudentToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        itemName={studentToDelete?.studentName}
      />

      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => {
          setShowQRModal(false)
          setSelectedStudent(null)
        }}
        student={selectedStudent}
        onDownload={handleDownloadQR}
      />

      <ToastContainer />

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

          .custom-breadcrumb .current {
            color: #212529;
          }

          .view-toggle-btn {
            padding: 0.5rem 1rem;
            font-weight: 500;
            border-radius: 6px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }

          .view-toggle-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }

          .student-card {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
            background: white;
            cursor: pointer;
            min-height: 420px;
            width: 100%;
          }

          .student-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          }

          .edit-button-wrapper {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 2;
          }

          .edit-icon-button {
            width: 32px;
            height: 32px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: all 0.3s ease;
          }

          .edit-icon-button:hover {
            transform: scale(1.1);
          }

          .student-image-container {
            width: 100%;
            height: 150px;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px 0;
            position: relative;
          }

          .student-profile-image {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid #0B3D7B;
            transition: opacity 0.3s ease;
          }

          .student-profile-image.loading {
            opacity: 0.3;
          }

          .image-placeholder {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1;
          }

          .student-info {
            margin-top: 1rem;
          }

          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
            padding: 0.25rem 0;
            border-bottom: 1px solid #f0f0f0;
          }

          .info-label {
            color: #666;
            font-weight: 500;
            min-width: 80px;
            text-align: left;
          }

          .info-value {
            color: #0B3D7B;
            font-weight: 600;
            text-align: right;
            flex: 1;
          }

          /* Phone Number Display Styles */
          .phone-numbers-display {
            font-size: 0.875rem;
          }

          .phone-number {
            font-family: monospace;
            font-weight: 500;
          }

          .primary-phone {
            color: #0B3D7B;
          }

          .secondary-phone {
            color: #6c757d;
          }

          .badge-sm {
            font-size: 0.6rem;
            padding: 0.2rem 0.4rem;
          }

          .custom-view-btn {
            background-color: #0B3D7B;
            border-color: #0B3D7B;
          }

          .custom-edit-btn {
            background-color: #ffc107;
            border-color: #ffc107;
            color: #212529;
          }

          .custom-delete-btn {
            background-color: #dc3545;
            border-color: #dc3545;
          }

          .custom-qr-btn {
            background-color: #17a2b8;
            border-color: #17a2b8;
          }

          .action-btn-responsive {
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
            min-width: 40px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* Table specific styles */
          .compact-table {
            font-size: 0.875rem;
          }

          .compact-table td {
            padding: 0.4rem 0.5rem;
            vertical-align: middle;
          }

          .compact-table th {
            padding: 0.6rem 0.5rem;
            vertical-align: middle;
          }

          .compact-row {
            height: 45px;
          }

          .action-column {
            width: 180px;
            min-width: 180px;
          }

          .action-buttons-horizontal {
            flex-wrap: nowrap;
            gap: 0.2rem;
          }

          .action-buttons-horizontal .btn {
            flex-shrink: 0;
          }

          .action-btn-table {
            padding: 0.2rem 0.4rem;
            font-size: 0.7rem;
            min-width: 30px;
            height: 26px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .copy-button {
            padding: 0.25rem 0.5rem;
            font-size: 0.875rem;
            line-height: 1.5;
            border-radius: 0.2rem;
            transition: all 0.15s ease-in-out;
          }

          .copy-button:hover {
            background-color: #0B3D7B;
            border-color: #0B3D7B;
            color: white;
          }

          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1100;
          }

          .modal-content {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            width: 90%;
            max-width: 400px;
          }

          .modal-title {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #333;
            text-align: center;
          }

          .modal-body {
            margin-bottom: 1.5rem;
          }

          .modal-buttons {
            display: flex;
            justify-content: center;
            gap: 1rem;
          }

          .modal-button {
            padding: 0.5rem 2rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            transition: opacity 0.2s;
          }

          .modal-button.confirm {
            background-color: #0B3D7B;
            color: white;
          }

          .modal-button.delete {
            background-color: #dc3545;
            color: white;
          }

          .modal-button.cancel {
            background-color: #6c757d;
            color: white;
          }

          /* QR Code Modal specific styles */
          .student-info.bg-light {
            border-radius: 8px;
            border: 1px solid #dee2e6;
          }

          /* Mobile responsiveness */
          @media (max-width: 575.98px) {
            .d-flex.flex-column.flex-md-row {
              flex-direction: column !important;
            }

            .w-100.w-md-auto {
              width: 100% !important;
            }

            .view-toggle-btn {
              width: 50%;
              margin-bottom: 0.5rem;
              padding: 0.5rem;
              font-size: 0.875rem;
            }

            .action-btn-responsive {
              min-width: 35px;
              padding: 0.2rem 0.4rem;
              font-size: 0.7rem;
              height: 28px;
            }

            .action-btn-table {
              min-width: 28px;
              height: 24px;
              padding: 0.15rem 0.3rem;
              font-size: 0.65rem;
            }

            .student-info .info-row {
              flex-direction: column;
              text-align: center;
            }

            .student-info .info-label,
            .student-info .info-value {
              width: 100%;
              text-align: center;
            }

            .action-column {
              width: 150px;
              min-width: 150px;
            }

            .action-buttons-horizontal {
              gap: 0.15rem;
            }

            .compact-table {
              font-size: 0.8rem;
            }

            .compact-table td,
            .compact-table th {
              padding: 0.3rem 0.4rem;
            }

            .phone-numbers-display {
              font-size: 0.8rem;
            }
          }

          @media (max-width: 768px) {
            .table-responsive {
              font-size: 0.875rem;
            }
            
            .action-btn-responsive {
              margin: 0.1rem;
            }

            .action-column {
              width: 160px;
              min-width: 160px;
            }

            .student-card {
              min-height: 440px;
            }
          }

          @media (max-width: 1200px) {
            .student-card {
              min-height: 460px;
            }
          }

          @media (min-width: 1400px) {
            .student-card {
              min-height: 420px;
            }
          }

          /* Toastify custom styles */
          .Toastify__toast-container {
            z-index: 9999;
          }

          .Toastify__toast {
            background-color: #0B3D7B;
            color: white;
          }

          .Toastify__toast--success {
            background-color: #0B3D7B;
          }

          .Toastify__toast--error {
            background-color: #dc3545;
          }

          .Toastify__progress-bar {
            background-color: rgba(255, 255, 255, 0.7);
          }
        `}
      </style>
    </MainContentPage>
  )
}

export default StudentDetails