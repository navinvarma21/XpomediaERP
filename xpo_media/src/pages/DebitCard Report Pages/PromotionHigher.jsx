"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Form, Button, Card, Container, Row, Col, Table, Badge, Spinner, Alert, Modal } from "react-bootstrap"
import { useAuthContext } from "../../Context/AuthContext"
import { ENDPOINTS } from "../../SpringBoot/config"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { FaExchangeAlt, FaCheckCircle, FaSearch, FaExclamationTriangle } from "react-icons/fa"

const PromotionHigher = () => {
  const { schoolId, currentAcademicYear, getAuthHeaders } = useAuthContext()

  const [setupData, setSetupData] = useState({
    courses: [],
    sections: [],
    academicYears: []
  })

  const [selections, setSelections] = useState({
    sourceStandard: "",
    sourceSection: "",
    targetAcademicYear: "",
    targetStandard: "",
    targetSection: ""
  })

  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [promoting, setPromoting] = useState(false)
  
  const [selectedStudents, setSelectedStudents] = useState(new Set())
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  useEffect(() => {
    if (schoolId) {
      fetchSetupData()
    }
  }, [schoolId])

  const fetchSetupData = async () => {
    try {
      const [coursesRes, sectionsRes, yearsRes] = await Promise.all([
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/courses?schoolId=${schoolId}`, { headers: getAuthHeaders() }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/sections?schoolId=${schoolId}`, { headers: getAuthHeaders() }),
        fetch(`${ENDPOINTS.promotion}/academic-years?schoolId=${schoolId}`, { headers: getAuthHeaders() })
      ])

      setSetupData({
        courses: await coursesRes.json(),
        sections: await sectionsRes.json(),
        academicYears: await yearsRes.json()
      })
    } catch (e) {
      console.error(e)
      toast.error("Failed to load dropdown data")
    }
  }

  const fetchStudents = async () => {
    if (!selections.sourceStandard || !selections.sourceSection) {
      toast.warning("Please select Source Standard and Section")
      return
    }

    setLoading(true)
    try {
      // Pass targetAcademicYear so backend can check if they are already promoted there
      let url = `${ENDPOINTS.promotion}/candidates?schoolId=${schoolId}&academicYear=${currentAcademicYear}&standard=${selections.sourceStandard}&section=${selections.sourceSection}`
      
      if (selections.targetAcademicYear) {
        url += `&targetAcademicYear=${selections.targetAcademicYear}`
      }

      const res = await fetch(url, { headers: getAuthHeaders() })
      
      if (res.ok) {
        const data = await res.json()
        setStudents(data)
        // Select active students who are NOT already promoted
        const eligibleIds = new Set(data.filter(s => s.status === 'Active' && !s.promoted).map(s => s.admissionNumber))
        setSelectedStudents(eligibleIds)
      }
    } catch (e) {
      toast.error("Failed to fetch students")
    } finally {
      setLoading(false)
    }
  }

  const toggleStudent = (admissionNumber) => {
    // Find the student to check if promoted
    const student = students.find(s => s.admissionNumber === admissionNumber)
    
    if (student && student.promoted) {
      toast.warning(`Student ${student.studentName} is already promoted to the selected year!`)
      return
    }

    const newSet = new Set(selectedStudents)
    if (newSet.has(admissionNumber)) {
      newSet.delete(admissionNumber)
    } else {
      newSet.add(admissionNumber)
    }
    setSelectedStudents(newSet)
  }

  const toggleAll = (e) => {
    if (e.target.checked) {
      // Filter active AND non-promoted students
      const allActive = students
        .filter(s => s.status === 'Active' && !s.promoted)
        .map(s => s.admissionNumber)
      setSelectedStudents(new Set(allActive))
    } else {
      setSelectedStudents(new Set())
    }
  }

  const handlePromoteClick = (e) => {
    e.preventDefault()
    
    if (selectedStudents.size === 0) return toast.warning("No students selected")
    if (!selections.targetAcademicYear) return toast.warning("Select Target Academic Year")
    if (selections.targetAcademicYear === currentAcademicYear) return toast.error("Target Year cannot be same as Current Year")
    if (!selections.targetStandard || !selections.targetSection) return toast.warning("Select Target Class details")

    // Show Custom Modal instead of window.confirm
    setShowConfirmModal(true)
  }

  const executePromotion = async () => {
    setShowConfirmModal(false)
    setPromoting(true)
    try {
      const payload = {
        schoolId,
        sourceAcademicYear: currentAcademicYear,
        targetAcademicYear: selections.targetAcademicYear,
        targetStandard: selections.targetStandard,
        targetSection: selections.targetSection,
        studentAdmissionNumbers: Array.from(selectedStudents)
      }

      const res = await fetch(`${ENDPOINTS.promotion}/execute`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const result = await res.json()
        toast.success(`Success! ${result.promotedCount} students promoted.`)
        // Refresh the list to update status
        fetchStudents()
      } else {
        const err = await res.text()
        throw new Error(err)
      }
    } catch (e) {
      toast.error("Promotion Failed: " + e.message)
    } finally {
      setPromoting(false)
    }
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <ToastContainer position="top-right" theme="colored" />
        
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-2">Promotion Higher</h2>
              <nav className="custom-breadcrumb">
                <Link to="/home">Home</Link>
                <span className="separator mx-2">&gt;</span>
                <span>Promotion</span>
              </nav>
            </div>
            <div className="text-end">
              <Badge bg="info" className="fs-6">Current Year: {currentAcademicYear}</Badge>
            </div>
          </div>
        </div>

        <Card className="mb-4 shadow-sm border-0">
          <Card.Header className="bg-white border-bottom py-3">
            <h5 className="m-0 fw-bold text-primary">Promotion Configuration</h5>
          </Card.Header>
          <Card.Body className="p-4">
            <Form>
              <Row className="g-3 align-items-end">
                <Col md={3}>
                  <Form.Label className="small text-muted fw-bold">From Class</Form.Label>
                  <div className="input-group">
                    <Form.Select 
                      value={selections.sourceStandard}
                      onChange={(e) => setSelections({...selections, sourceStandard: e.target.value})}
                    >
                      <option value="">Standard</option>
                      {setupData.courses.map((c, i) => (
                        <option key={i} value={c.name || c}>{c.name || c}</option>
                      ))}
                    </Form.Select>
                    <Form.Select 
                      value={selections.sourceSection}
                      onChange={(e) => setSelections({...selections, sourceSection: e.target.value})}
                      style={{maxWidth: '80px'}}
                    >
                      <option value="">Sec</option>
                      {setupData.sections.map((s, i) => (
                        <option key={i} value={s.name || s}>{s.name || s}</option>
                      ))}
                    </Form.Select>
                  </div>
                </Col>

                <Col md={1} className="text-center pb-2">
                  <FaExchangeAlt className="text-muted" />
                </Col>

                <Col md={2}>
                  <Form.Label className="small text-muted fw-bold">To Year</Form.Label>
                  <Form.Select
                    value={selections.targetAcademicYear}
                    onChange={(e) => setSelections({...selections, targetAcademicYear: e.target.value})}
                    className="border-primary"
                  >
                    <option value="">Select Year</option>
                    {setupData.academicYears.length > 0 ? (
                        setupData.academicYears.map(year => <option key={year} value={year}>{year}</option>)
                    ) : (
                        <option disabled>No Years Found</option>
                    )}
                  </Form.Select>
                </Col>

                <Col md={3}>
                  <Form.Label className="small text-muted fw-bold">To Class</Form.Label>
                  <div className="input-group">
                    <Form.Select 
                      value={selections.targetStandard}
                      onChange={(e) => setSelections({...selections, targetStandard: e.target.value})}
                    >
                      <option value="">Standard</option>
                      {setupData.courses.map((c, i) => (
                        <option key={i} value={c.name || c}>{c.name || c}</option>
                      ))}
                    </Form.Select>
                    <Form.Select 
                      value={selections.targetSection}
                      onChange={(e) => setSelections({...selections, targetSection: e.target.value})}
                      style={{maxWidth: '80px'}}
                    >
                      <option value="">Sec</option>
                      {setupData.sections.map((s, i) => (
                        <option key={i} value={s.name || s}>{s.name || s}</option>
                      ))}
                    </Form.Select>
                  </div>
                </Col>

                <Col md={3}>
                  <Button 
                    variant="primary" 
                    className="w-100" 
                    onClick={fetchStudents}
                    disabled={loading}
                  >
                    {loading ? <Spinner size="sm" /> : <><FaSearch className="me-2"/> Load Students</>}
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>

        {students.length > 0 && (
            <Card className="mb-4 shadow-sm border-0">
                <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                    <h6 className="m-0">Student List ({students.length} Found)</h6>
                    <Badge bg="info">Selected: {selectedStudents.size}</Badge>
                </Card.Header>
                <Card.Body className="p-0">
                    <Table hover responsive className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="ps-4" style={{width: '50px'}}>
                                    <Form.Check 
                                        type="checkbox" 
                                        onChange={toggleAll}
                                        checked={
                                          selectedStudents.size > 0 && 
                                          selectedStudents.size === students.filter(s => s.status === 'Active' && !s.promoted).length
                                        }
                                    />
                                </th>
                                <th>Admission No</th>
                                <th>Student Name</th>
                                <th>Status</th>
                                <th className="text-end pe-4">Pending Dues (Current Year)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => (
                                <tr key={student.admissionNumber} className={student.status !== 'Active' || student.promoted ? 'bg-secondary-subtle opacity-75' : ''}>
                                    <td className="ps-4" onClick={() => student.promoted && toast.warning("Already Promoted!")}>
                                        <Form.Check 
                                            type="checkbox" 
                                            checked={selectedStudents.has(student.admissionNumber)}
                                            onChange={() => toggleStudent(student.admissionNumber)}
                                            disabled={student.status !== 'Active' || student.promoted}
                                        />
                                    </td>
                                    <td className="fw-bold text-primary">{student.admissionNumber}</td>
                                    <td>{student.studentName}</td>
                                    <td>
                                        {student.status === 'Active' ? 
                                            (student.promoted ? 
                                              <Badge bg="warning" text="dark">Already Promoted</Badge> : 
                                              <Badge bg="success">In School</Badge>
                                            ) : 
                                            <Badge bg="danger">TC Issued</Badge>
                                        }
                                    </td>
                                    <td className="text-end pe-4">
                                        {student.pendingAmount > 0 ? (
                                            <span className="text-danger fw-bold">₹ {student.pendingAmount.toFixed(2)}</span>
                                        ) : (
                                            <span className="text-success"><FaCheckCircle/> Cleared</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
                <Card.Footer className="bg-white p-3 text-end">
                    <Button 
                        variant="success" 
                        size="lg" 
                        onClick={handlePromoteClick}
                        disabled={promoting || selectedStudents.size === 0}
                    >
                        {promoting ? <Spinner size="sm" className="me-2"/> : <FaExchangeAlt className="me-2"/>}
                        Promote {selectedStudents.size} Students
                    </Button>
                </Card.Footer>
            </Card>
        )}

        <Alert variant="warning" className="mt-4 border-warning">
            <h6 className="alert-heading fw-bold d-flex align-items-center">
                <FaExclamationTriangle className="me-2"/> Promotion Summary:
            </h6>
            <ul className="mb-0 small">
                <li><strong>Pending Fees:</strong> Will be shifted to the new year as Arrears with the tag "{currentAcademicYear}" (e.g., "Book Fee 2025-2026").</li>
                <li><strong>New Fees:</strong> Students will be assigned the standard fee structure for the Target Class.</li>
            </ul>
        </Alert>

        {/* Custom Confirmation Modal */}
        <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered backdrop="static">
          <Modal.Header closeButton className="bg-light">
            <Modal.Title className="fw-bold text-primary">Confirm Promotion</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="mb-3">Are you sure you want to promote the selected students?</p>
            <Card className="bg-light border-0">
              <Card.Body>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Total Students:</span>
                  <span className="fw-bold">{selectedStudents.size}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">From Class:</span>
                  <span className="fw-bold">{selections.sourceStandard} ({currentAcademicYear})</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">To Class:</span>
                  <span className="fw-bold text-success">{selections.targetStandard} ({selections.targetAcademicYear})</span>
                </div>
              </Card.Body>
            </Card>
            <Alert variant="info" className="mt-3 mb-0 small">
              <FaExclamationTriangle className="me-1"/> This action will shift pending fees and assign new class fees.
            </Alert>
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={executePromotion} disabled={promoting}>
              {promoting ? <Spinner size="sm" /> : "Yes, Promote Students"}
            </Button>
          </Modal.Footer>
        </Modal>

      </Container>
    </MainContentPage>
  )
}

export default PromotionHigher