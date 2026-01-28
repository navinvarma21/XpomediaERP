"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Button, Container, Table, Form, Alert, Spinner, Row, Col, Card, Badge, Tab, Tabs, Modal, ProgressBar } from "react-bootstrap"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { FaSave, FaEye, FaTimes, FaSync, FaChartBar, FaFileExcel, FaFilePdf, FaUserGraduate } from "react-icons/fa"
import { useAuthContext } from "../../Context/AuthContext"
import { ENDPOINTS } from "../../SpringBoot/config"
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const AttendanceEntry = () => {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState("entry") // 'entry' or 'history'
  
  // Entry Form State - Updated Default to 'All'
  const [formData, setFormData] = useState({
    course: "All", 
    section: "All",
    date: new Date().toISOString().split('T')[0],
  })

  // History/Filter Form State (Updated for Periodical & Admission No)
  const [historyFilter, setHistoryFilter] = useState({
    course: "All",
    section: "All",
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    admissionNo: "" 
  })

  const [students, setStudents] = useState([])
  const [historyRecords, setHistoryRecords] = useState([])
  const [originalStudents, setOriginalStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [sections, setSections] = useState([])
  
  const [loading, setLoading] = useState(false)
  const [fetchingStudents, setFetchingStudents] = useState(false)
  const [fetchingHistory, setFetchingHistory] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [statistics, setStatistics] = useState(null)

  // Student Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedStudentStats, setSelectedStudentStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(false)

  const { schoolId, currentAcademicYear, schoolCode, getAuthHeaders } = useAuthContext()

  // Generate current date for max attribute
  const getCurrentDate = () => new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (schoolId) {
      fetchCourses()
      fetchSections()
    }
  }, [schoolId])

  // --- DROPDOWN FETCHING ---
  const fetchCourses = async () => {
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/courses?schoolId=${schoolId}`,
        { headers: getAuthHeaders() }
      )
      if (response.ok) {
        const data = await response.json()
        setCourses(data.map(c => c.name).filter(Boolean))
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to load courses")
    }
  }

  const fetchSections = async () => {
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/sections?schoolId=${schoolId}`,
        { headers: getAuthHeaders() }
      )
      if (response.ok) {
        const data = await response.json()
        setSections(data.map(s => s.name).filter(Boolean))
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to load sections")
    }
  }

  // --- ENTRY MODE: FETCH LOGIC ---
  const fetchStudentsAndAttendance = async () => {
    if (!formData.course || !formData.section || !formData.date) {
      toast.error("Please select course, section, and date for entry")
      return
    }

    setFetchingStudents(true)
    try {
      const safeCourse = encodeURIComponent(formData.course)
      const safeSection = encodeURIComponent(formData.section)

      const [studentsRes, attendanceRes, statsRes] = await Promise.all([
        fetch(
          `${ENDPOINTS.admissionmaster}/admission/school/${schoolId}?academicYear=${currentAcademicYear}&standard=${safeCourse}&section=${safeSection}`,
          { headers: getAuthHeaders() }
        ),
        fetch(
          `${ENDPOINTS.transaction}/attendanceentry/view?schoolId=${schoolId}&academicYear=${currentAcademicYear}&standard=${safeCourse}&section=${safeSection}&date=${formData.date}`,
          { headers: getAuthHeaders() }
        ),
        fetch(
            `${ENDPOINTS.transaction}/attendanceentry/statistics?schoolId=${schoolId}&academicYear=${currentAcademicYear}&standard=${safeCourse}&section=${safeSection}&date=${formData.date}`,
            { headers: getAuthHeaders() }
        )
      ])

      if (!studentsRes.ok) throw new Error("Failed to fetch students")
      
      let studentsData = await studentsRes.json()

      // Strict Client-Side Filtering (Updated to allow 'All')
      if (Array.isArray(studentsData)) {
        studentsData = studentsData.filter(student => 
            (formData.course === "All" || student.standard === formData.course) && 
            (formData.section === "All" || student.section === formData.section)
        )
      }

      const attendanceData = attendanceRes.ok ? await attendanceRes.json() : []
      const statsData = statsRes.ok ? await statsRes.json() : null

      const attendanceMap = new Map()
      attendanceData.forEach(record => {
        attendanceMap.set(record.studentId, record.attendanceStatus)
      })

      const mergedData = studentsData.map(student => {
        const existingStatus = attendanceMap.get(student.id)
        return {
          id: student.id,
          admissionNumber: student.admissionNumber,
          studentName: student.studentName,
          standard: student.standard,
          section: student.section,
          attendance: existingStatus || "P",
          existingRecord: !!existingStatus
        }
      })

      setStudents(mergedData)
      setOriginalStudents(JSON.parse(JSON.stringify(mergedData)))
      setHasChanges(false)
      setStatistics(statsData)

      toast.success(`Loaded ${mergedData.length} students`)

    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Failed to load data")
    } finally {
      setFetchingStudents(false)
    }
  }

  // --- HISTORY MODE: FETCH LOGIC (Updated) ---
  const fetchHistoryRecords = async () => {
    setFetchingHistory(true)
    try {
        const safeCourse = historyFilter.course === "All" ? "All" : encodeURIComponent(historyFilter.course)
        const safeSection = historyFilter.section === "All" ? "All" : encodeURIComponent(historyFilter.section)
        
        // Build Query String
        let queryUrl = `${ENDPOINTS.transaction}/attendanceentry/view?schoolId=${schoolId}&academicYear=${currentAcademicYear}&standard=${safeCourse}&section=${safeSection}&fromDate=${historyFilter.fromDate}&toDate=${historyFilter.toDate}`
        
        // Add Admission No if present
        if(historyFilter.admissionNo && historyFilter.admissionNo.trim() !== "") {
            queryUrl += `&admissionNumber=${encodeURIComponent(historyFilter.admissionNo.trim())}`
        }

        const response = await fetch(queryUrl, { headers: getAuthHeaders() })
        
        if (response.ok) {
            const data = await response.json()
            setHistoryRecords(data)
            toast.success(`Found ${data.length} records`)
        } else {
            toast.error("Failed to fetch history")
        }
    } catch (error) {
        console.error(error)
        toast.error("Error fetching history")
    } finally {
        setFetchingHistory(false)
    }
  }

  // --- SPECIFIC STUDENT STATS (FOR TC/CERTIFICATE) ---
  const handleStudentClick = async (student) => {
    setLoadingStats(true)
    setShowProfileModal(true)
    setSelectedStudentStats({ ...student, loading: true })

    try {
        const response = await fetch(
            `${ENDPOINTS.transaction}/attendanceentry/student-profile?schoolId=${schoolId}&academicYear=${currentAcademicYear}&studentId=${student.id}`,
            { headers: getAuthHeaders() }
        )
        
        if (response.ok) {
            const data = await response.json()
            setSelectedStudentStats(prev => ({ ...prev, ...data, loading: false }))
        }
    } catch (error) {
        console.error(error)
        toast.error("Could not load student stats")
    } finally {
        setLoadingStats(false)
    }
  }

  // --- EXPORT FUNCTIONS ---
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(historyRecords.map(r => ({
        "Date": r.attendanceDate,
        "Admission No": r.admissionNumber,
        "Student Name": r.studentName,
        "Class": r.standard,
        "Section": r.section,
        "Status": r.attendanceStatus === 'P' ? 'Present' : r.attendanceStatus === 'A' ? 'Absent' : r.attendanceStatus === 'L' ? 'Late' : r.attendanceStatus === 'H' ? 'Half Day' : r.attendanceStatus
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance_History");
    XLSX.writeFile(wb, `Attendance_History.xlsx`);
  }

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.text(`Attendance Report`, 14, 15);
    
    autoTable(doc, {
        head: [['Date', 'Admin No', 'Name', 'Class', 'Sec', 'Status']],
        body: historyRecords.map(r => [
            r.attendanceDate,
            r.admissionNumber,
            r.studentName,
            r.standard,
            r.section,
            r.attendanceStatus === 'P' ? 'Present' : r.attendanceStatus === 'A' ? 'Absent' : r.attendanceStatus === 'L' ? 'Late' : r.attendanceStatus === 'H' ? 'Half Day' : r.attendanceStatus
        ]),
        startY: 20,
    });
    
    doc.save(`Attendance_History.pdf`);
  }

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleHistoryFilterChange = (e) => {
    const { name, value } = e.target
    setHistoryFilter(prev => ({ ...prev, [name]: value }))
  }

  const handleAttendanceChange = (id, value) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, attendance: value } : s))
    setHasChanges(true)
  }

  const handleSubmitAttendance = async () => {
    if (!hasChanges) return toast.info("No changes to save")
    setSubmitting(true)
    try {
      const payload = {
        schoolId,
        academicYear: currentAcademicYear,
        standard: formData.course,
        section: formData.section,
        attendanceDate: formData.date,
        attendanceRecords: students.map(s => ({
            studentId: s.id,
            admissionNumber: s.admissionNumber,
            studentName: s.studentName,
            attendanceStatus: s.attendance,
            standard: s.standard,
            section: s.section
        }))
      }

      const response = await fetch(`${ENDPOINTS.transaction}/attendanceentry/save`, {
        method: "POST",
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()
      if (response.ok && result.success) {
        toast.success(`Saved! ${result.recordsSaved} new, ${result.recordsUpdated} updated`)
        const updatedStudents = students.map(s => ({ ...s, existingRecord: true }))
        setStudents(updatedStudents)
        setOriginalStudents(JSON.parse(JSON.stringify(updatedStudents)))
        setHasChanges(false)
        fetchStatisticsOnly()
      } else {
        throw new Error(result.message || "Save failed")
      }
    } catch (error) {
      console.error(error)
      toast.error(`Save failed: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const fetchStatisticsOnly = async () => {
      try {
        const safeCourse = encodeURIComponent(formData.course)
        const safeSection = encodeURIComponent(formData.section)
        const response = await fetch(
            `${ENDPOINTS.transaction}/attendanceentry/statistics?schoolId=${schoolId}&academicYear=${currentAcademicYear}&standard=${safeCourse}&section=${safeSection}&date=${formData.date}`,
            { headers: getAuthHeaders() }
        )
        if(response.ok) setStatistics(await response.json())
      } catch(e) { console.error(e) }
  }

  const handleClearFilters = () => {
    if(activeTab === "entry") {
        setFormData({ course: "All", section: "All", date: getCurrentDate() })
        setStudents([])
        setOriginalStudents([])
        setHasChanges(false)
        setStatistics(null)
    } else {
        setHistoryRecords([])
        setHistoryFilter(prev => ({ ...prev, admissionNo: "", course: "All", section: "All" }))
    }
  }

  const handleResetChanges = () => {
    setStudents(JSON.parse(JSON.stringify(originalStudents)))
    setHasChanges(false)
    toast.info("Changes reset")
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <div className="mb-4">
          <nav className="d-flex custom-breadcrumb py-1 py-lg-3">
            <Link to="/home">Home</Link> <span className="separator mx-2">&gt;</span>
            <div>Transaction</div> <span className="separator mx-2">&gt;</span>
            <span>Attendance Manager</span>
          </nav>
        </div>

        <Card className="shadow">
          <Card.Header className="bg-primary text-white rounded-top">
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="m-0">Attendance Manager</h2>
              <div className="d-flex align-items-center gap-2">
                {hasChanges && activeTab === "entry" && <Badge bg="warning" text="dark">Unsaved Changes</Badge>}
                <Button variant="outline-light" size="sm" onClick={handleClearFilters}><FaTimes /> Clear</Button>
              </div>
            </div>
          </Card.Header>

          <Card.Body className="p-4">
            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4 custom-tabs">
                
                {/* --- TAB 1: ENTRY --- */}
                <Tab eventKey="entry" title="Daily Entry">
                    <Row className="g-3 mb-4">
                      <Col md={3}>
                        <Form.Label className="fw-semibold">Course</Form.Label>
                        <Form.Select name="course" value={formData.course} onChange={handleInputChange}>
                          <option value="All">All</option>
                          {courses.map(c => <option key={c} value={c}>{c}</option>)}
                        </Form.Select>
                      </Col>
                      <Col md={3}>
                        <Form.Label className="fw-semibold">Section</Form.Label>
                        <Form.Select name="section" value={formData.section} onChange={handleInputChange}>
                          <option value="All">All</option>
                          {sections.map(s => <option key={s} value={s}>{s}</option>)}
                        </Form.Select>
                      </Col>
                      <Col md={3}>
                          <Form.Label className="fw-semibold">Date</Form.Label>
                          <Form.Control type="date" name="date" value={formData.date} onChange={handleInputChange} max={getCurrentDate()} />
                      </Col>
                      <Col md={3} className="d-flex align-items-end">
                          <Button variant="primary" className="w-100" onClick={fetchStudentsAndAttendance} disabled={!formData.course || !formData.section || fetchingStudents}>
                            {fetchingStudents ? <Spinner size="sm" /> : <><FaSync className="me-2" /> Load Class</>}
                          </Button>
                      </Col>
                    </Row>

                    {/* Stats */}
                    {statistics && (
                        <Row className="mb-3">
                          <Col>
                            <Card className="border-0 bg-light">
                              <Card.Body className="py-2 d-flex justify-content-between align-items-center">
                                 <div className="d-flex align-items-center"><FaChartBar className="text-primary me-2" /> <strong>Day Summary</strong></div>
                                 <div className="d-flex gap-4">
                                     <span className="text-success fw-bold">Present: {statistics.present_count || 0}</span>
                                     <span className="text-danger fw-bold">Absent: {statistics.absent_count || 0}</span>
                                     <span className="text-primary fw-bold">Total: {statistics.unique_students || 0}</span>
                                 </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                    )}

                    {/* Table */}
                    {students.length > 0 ? (
                      <div className="table-responsive">
                        <Table bordered hover size="sm" className="align-middle">
                          <thead className="table-dark">
                            <tr>
                              <th width="50">#</th>
                              <th>Admission No</th>
                              <th>Name</th>
                              <th width="150">Attendance</th>
                              <th width="100">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.map((student, index) => (
                              <tr key={student.id} className={student.existingRecord ? "table-warning" : ""}>
                                <td className="text-center">{index + 1}</td>
                                <td>{student.admissionNumber}</td>
                                <td className="cursor-pointer text-primary" onClick={() => handleStudentClick(student)} title="Click for Student History">
                                    {student.studentName} <FaUserGraduate className="ms-1 text-muted" size={12}/>
                                </td>
                                <td>
                                  <Form.Select 
                                    size="sm"
                                    value={student.attendance} 
                                    onChange={(e) => handleAttendanceChange(student.id, e.target.value)}
                                    style={{ fontWeight: 'bold', color: student.attendance === 'A' ? 'red' : student.attendance === 'P' ? 'green' : 'black' }}
                                  >
                                    <option value="P">Present</option>
                                    <option value="A">Absent</option>
                                    <option value="L">Late</option>
                                    <option value="H">Half Day</option>
                                  </Form.Select>
                                </td>
                                <td className="text-center">
                                   {student.existingRecord ? <Badge bg="secondary">Saved</Badge> : <Badge bg="success">New</Badge>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                        
                        <div className="d-flex gap-2 justify-content-end mt-3">
                            <Button variant="success" onClick={handleSubmitAttendance} disabled={!hasChanges || submitting}>
                                {submitting ? <Spinner size="sm" /> : <><FaSave className="me-2" /> Save Attendance</>}
                            </Button>
                            {hasChanges && <Button variant="outline-warning" onClick={handleResetChanges}>Reset</Button>}
                        </div>
                      </div>
                    ) : (
                        !fetchingStudents && <Alert variant="light" className="text-center border">Select class details to mark attendance</Alert>
                    )}
                </Tab>

                {/* --- TAB 2: HISTORY / RECORDS (UPDATED) --- */}
                <Tab eventKey="history" title="Attendance History">
                    <Row className="g-3 mb-4 align-items-end">
                      <Col md={3}>
                        <Form.Label className="fw-semibold">Admission No (Optional)</Form.Label>
                        <Form.Control 
                            type="text" 
                            name="admissionNo" 
                            value={historyFilter.admissionNo} 
                            onChange={handleHistoryFilterChange} 
                            placeholder="Search by Admission No"
                        />
                      </Col>
                      <Col md={2}>
                        <Form.Label className="fw-semibold">Course</Form.Label>
                        <Form.Select name="course" value={historyFilter.course} onChange={handleHistoryFilterChange}>
                          <option value="All">All Courses</option>
                          {courses.map(c => <option key={c} value={c}>{c}</option>)}
                        </Form.Select>
                      </Col>
                      <Col md={2}>
                        <Form.Label className="fw-semibold">Section</Form.Label>
                        <Form.Select name="section" value={historyFilter.section} onChange={handleHistoryFilterChange}>
                          <option value="All">All Sections</option>
                          {sections.map(s => <option key={s} value={s}>{s}</option>)}
                        </Form.Select>
                      </Col>
                      <Col md={2}>
                          <Form.Label className="fw-semibold">From Date</Form.Label>
                          <Form.Control type="date" name="fromDate" value={historyFilter.fromDate} onChange={handleHistoryFilterChange} />
                      </Col>
                      <Col md={2}>
                          <Form.Label className="fw-semibold">To Date</Form.Label>
                          <Form.Control type="date" name="toDate" value={historyFilter.toDate} onChange={handleHistoryFilterChange} />
                      </Col>
                      <Col md={1} className="d-flex gap-2">
                          <Button variant="info" className="text-white w-100" onClick={fetchHistoryRecords}>
                            <FaSync />
                          </Button>
                      </Col>
                    </Row>
                    
                    <Row className="mb-3">
                        <Col className="d-flex justify-content-end gap-2">
                            <Button variant="outline-success" size="sm" onClick={exportToExcel} disabled={historyRecords.length === 0} title="Export Excel">
                                <FaFileExcel /> Export Excel
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={exportToPDF} disabled={historyRecords.length === 0} title="Export PDF">
                                <FaFilePdf /> Export PDF
                            </Button>
                        </Col>
                    </Row>

                    {fetchingHistory ? (
                        <div className="text-center py-4"><Spinner animation="border" /></div>
                    ) : historyRecords.length > 0 ? (
                        <div className="table-responsive">
                            <Table striped bordered hover size="sm">
                                <thead className="bg-light">
                                    <tr>
                                        <th>Date</th>
                                        <th>Admin No</th>
                                        <th>Name</th>
                                        <th>Class</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyRecords.map((r, i) => (
                                        <tr key={i}>
                                            <td>{r.attendanceDate}</td>
                                            <td>{r.admissionNumber}</td>
                                            <td className="text-primary cursor-pointer" onClick={() => handleStudentClick({id: r.studentId, studentName: r.studentName, admissionNumber: r.admissionNumber})}>
                                                {r.studentName}
                                            </td>
                                            <td>{r.standard} - {r.section}</td>
                                            <td className={
                                                r.attendanceStatus === 'A' ? 'text-danger fw-bold' : 
                                                r.attendanceStatus === 'P' ? 'text-success fw-bold' : 
                                                r.attendanceStatus === 'L' ? 'text-warning fw-bold' :
                                                r.attendanceStatus === 'H' ? 'text-info fw-bold' : ''
                                            }>
                                                {r.attendanceStatus === 'P' ? 'Present' : 
                                                 r.attendanceStatus === 'A' ? 'Absent' : 
                                                 r.attendanceStatus === 'L' ? 'Late' :
                                                 r.attendanceStatus === 'H' ? 'Half Day' : r.attendanceStatus}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    ) : (
                        <Alert variant="light" className="text-center border">No records found for the selected criteria</Alert>
                    )}
                </Tab>

            </Tabs>
          </Card.Body>
        </Card>

        {/* --- STUDENT PROFILE MODAL (FOR TC/CERTIFICATE) --- */}
        <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Student Attendance Profile</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {selectedStudentStats ? (
                    <div>
                        <div className="text-center mb-4">
                            <h4>{selectedStudentStats.studentName}</h4>
                            <p className="text-muted mb-0">Admission: {selectedStudentStats.admissionNumber}</p>
                            <small className="text-muted">Academic Year: {currentAcademicYear}</small>
                        </div>

                        {loadingStats ? (
                            <div className="text-center"><Spinner animation="border" size="sm"/> Loading stats...</div>
                        ) : (
                            <>
                                <Row className="text-center mb-4">
                                    <Col xs={12} className="mb-3">
                                        <div className="display-4 text-primary">{selectedStudentStats.totalWorkingDays || 0}</div>
                                        <small className="text-muted text-uppercase fw-bold">Total Working Days</small>
                                    </Col>
                                    <Col xs={6} md={3}>
                                        <div className="h4 text-success">{selectedStudentStats.countPresent || 0}</div>
                                        <small className="text-muted">Present (P)</small>
                                    </Col>
                                    <Col xs={6} md={3}>
                                        <div className="h4 text-warning">{selectedStudentStats.countLate || 0}</div>
                                        <small className="text-muted">Late (L)</small>
                                    </Col>
                                    <Col xs={6} md={3}>
                                        <div className="h4 text-info">{selectedStudentStats.countHalfDay || 0}</div>
                                        <small className="text-muted">Half Day (H)</small>
                                    </Col>
                                    <Col xs={6} md={3}>
                                        <div className="h4 text-danger">{selectedStudentStats.countAbsent || 0}</div>
                                        <small className="text-muted">Absent (A)</small>
                                    </Col>
                                </Row>

                                <div className="mb-3 px-3">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="fw-semibold">Attendance Percentage</span>
                                        <span className="fw-bold">{selectedStudentStats.percentage || 0}%</span>
                                    </div>
                                    <ProgressBar 
                                        now={selectedStudentStats.percentage || 0} 
                                        variant={selectedStudentStats.percentage >= 75 ? "success" : selectedStudentStats.percentage >= 60 ? "warning" : "danger"} 
                                        style={{ height: '20px' }}
                                    />
                                    <div className="text-center mt-1 text-muted small fst-italic">
                                        (P + L + 0.5×H) / Total Days
                                    </div>
                                </div>
                                
                                <Alert variant="info" className="mt-3 py-2 small">
                                    <FaEye className="me-2"/>
                                    This data can be used for Transfer Certificates (TC) or Conduct Certificates.
                                </Alert>
                            </>
                        )}
                    </div>
                ) : <Spinner animation="border" />}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowProfileModal(false)}>Close</Button>
            </Modal.Footer>
        </Modal>

      </Container>
      <ToastContainer position="bottom-right" />
    </MainContentPage>
  )
}

export default AttendanceEntry