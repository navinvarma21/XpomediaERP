"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import MainContentPage from "../../../components/MainContent/MainContentPage"
import { useAuthContext } from "../../../Context/AuthContext"
import { ENDPOINTS } from "../../../SpringBoot/config"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { 
  Spinner, 
  Collapse, 
  Button, 
  Alert, 
  Card, 
  Row, 
  Col, 
  Table, 
  Badge, 
  Form, 
  Container, 
  ListGroup 
} from "react-bootstrap"
import { 
  FaPrint, 
  FaSave, 
  FaEdit, 
  FaExclamationTriangle, 
  FaUserGraduate, 
  FaFilter,
  FaEraser,
  FaArrowLeft,
  FaCheck,
  FaInfoCircle,
  FaChevronUp,
  FaChevronDown,
  FaFilePdf
} from "react-icons/fa"

const CBSECertificate1 = () => {
  const { schoolId, currentAcademicYear, getAuthHeaders } = useAuthContext()
  const navigate = useNavigate()
  const certificateRef = useRef(null)
  const page1Ref = useRef(null)
   
  // ================= STATE MANAGEMENT =================
   
  // UI Control States
  const [isEditing, setIsEditing] = useState(false)
   
  // API & Loading States
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isFetchingTCStatus, setIsFetchingTCStatus] = useState(false)
   
  // Fee & Dues Logic
  const [feeProfile, setFeeProfile] = useState(null)
  const [showDuesDetails, setShowDuesDetails] = useState(false) 
   
  // Dropdown Data
  const [standards, setStandards] = useState([])
  const [sections, setSections] = useState([])
  const [studentsList, setStudentsList] = useState([])
   
  // Filtering
  const [filteredAdmissionNumbers, setFilteredAdmissionNumbers] = useState([])
  const [filters, setFilters] = useState({
    standard: "",
    section: "",
    searchQuery: "",
    selectedAdmissionNo: ""
  })

  // School Metadata
  const [schoolInfo, setSchoolInfo] = useState({ 
    schoolName: "", 
    schoolAddress: "", 
    city: "", 
    state: "", 
    pincode: "" 
  })

  // TC Status
  const [tcAlreadyGenerated, setTcAlreadyGenerated] = useState(false)
  const [tcBlockMessage, setTcBlockMessage] = useState("")
  const [tcSaved, setTcSaved] = useState(false)
  const [allowPrint, setAllowPrint] = useState(false)

  // === MAIN FORM DATA ===
  const [formData, setFormData] = useState({
    serialNo: "",
    admissionNo: "",
    schoolName: "",
    schoolAddress: "",
    recognizedBy: "",
    studentName: "",
    fatherOrMotherName: "",
    nationality: "Indian",
    religion: "",
    caste: "",
    sex: "",
    dateOfBirth: "",
    dateOfAdmission: "",
    standardStudied: "",
    section: "", // Added section to state
    qualifiedForPromotion: "Yes. Promoted to higher studies",
    feesPaid: "Yes",
    dateLeftSchool: new Date().toISOString().split('T')[0],
    conductAndCharacter: "Good",
    applicationDate: new Date().toISOString().split('T')[0],
    issueDate: new Date().toISOString().split('T')[0],
  })

  // ================= HELPERS =================

  const extractStringValue = useCallback((item) => {
    if (item === null || item === undefined) return "";
    if (typeof item === 'string') return item;
    if (typeof item === 'number') return String(item);
    return item.standard || item.section || item.name || item.value || "";
  }, [])

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; 
    return date.toLocaleDateString('en-GB');
  }

  const formatDateForApi = (dateString) => {
    if (!dateString) return null;
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return dateString;
    if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  }

  const formatCurrency = (amount) => {
    if (!amount) return "₹ 0.00";
    return `₹ ${parseFloat(amount).toFixed(2)}`;
  }

  // ================= API EFFECTS =================

  // 1. Initial Data Load
  useEffect(() => {
    const loadInitialData = async () => {
      if (!schoolId || !currentAcademicYear) return;
      setIsLoading(true);
      try {
        const [schoolRes, stdRes] = await Promise.all([
          fetch(`${ENDPOINTS.admissionmaster}/school/school-details?schoolId=${schoolId}`, { headers: getAuthHeaders() }),
          fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/courses?schoolId=${schoolId}`, { headers: getAuthHeaders() })
        ]);

        if (schoolRes.ok) {
          const sData = await schoolRes.json();
          setSchoolInfo(sData);
          setFormData(prev => ({
            ...prev,
            schoolName: sData.schoolName || "",
            schoolAddress: `${sData.schoolAddress || ""}, ${sData.city || ""}, ${sData.state || ""} - ${sData.pincode || ""}`,
            recognizedBy: `Recognised by the Government of ${sData.state || "Tamil Nadu"}`
          }));
        }

        if (stdRes.ok) {
          const stdData = await stdRes.json();
          setStandards(Array.isArray(stdData) ? stdData.map(extractStringValue) : []);
        }
      } catch (e) {
        console.error("Init Load Error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [schoolId, currentAcademicYear, getAuthHeaders, extractStringValue])

  // 2. Fetch Sections
  useEffect(() => {
    const fetchSections = async () => {
      if (!filters.standard) {
        setSections([]);
        return;
      }
      try {
        const res = await fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/sections?schoolId=${schoolId}`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setSections(Array.isArray(data) ? data.map(extractStringValue) : []);
        }
      } catch (e) { console.error(e); }
    };
    fetchSections();
  }, [filters.standard, schoolId, getAuthHeaders, extractStringValue])

  // 3. Fetch Student List for Filter
  useEffect(() => {
    const fetchStudents = async () => {
      if (!schoolId || !currentAcademicYear) return;
      try {
        const res = await fetch(`${ENDPOINTS.admissionmaster}/studentreport/datas?schoolId=${schoolId}&academicYear=${currentAcademicYear}`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setStudentsList(Array.isArray(data) ? data : []);
        }
      } catch (e) { console.error(e); }
    };
    fetchStudents();
  }, [schoolId, currentAcademicYear, getAuthHeaders])

  // 4. Filtering Logic
  useEffect(() => {
    let temp = studentsList;
    if (filters.standard) temp = temp.filter(s => extractStringValue(s.standard) === filters.standard || extractStringValue(s.classLastStudied) === filters.standard);
    if (filters.section) temp = temp.filter(s => extractStringValue(s.section) === filters.section);
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      temp = temp.filter(s => (s.admissionNumber && s.admissionNumber.toLowerCase().includes(q)) || (s.studentName && s.studentName.toLowerCase().includes(q)));
    }
    const admList = temp.map(s => extractStringValue(s.admissionNumber)).filter(a => a);
    setFilteredAdmissionNumbers([...new Set(admList)]);
  }, [filters.standard, filters.section, filters.searchQuery, studentsList, extractStringValue])

  // 5. Check TC Existence
  useEffect(() => {
    const checkTC = async () => {
      if (!filters.selectedAdmissionNo) {
        setTcAlreadyGenerated(false);
        setTcBlockMessage("");
        return;
      }
      setIsFetchingTCStatus(true);
      try {
        const res = await fetch(`${ENDPOINTS.tc}/check-tc-exists/${filters.selectedAdmissionNo}?schoolId=${schoolId}&academicYear=${currentAcademicYear}`, { headers: getAuthHeaders() });
        if (res.ok) {
          const exists = await res.json();
          setTcAlreadyGenerated(exists);
          if (exists) {
            setTcBlockMessage("TC already generated. View mode only.");
            setTcSaved(true);
            setAllowPrint(true);
            setIsEditing(false);
          } else {
            setTcBlockMessage("");
            setTcSaved(false);
            setAllowPrint(false);
            setIsEditing(true);
          }
        }
      } catch (e) { console.error(e); } 
      finally { setIsFetchingTCStatus(false); }
    };
    checkTC();
  }, [filters.selectedAdmissionNo, schoolId, currentAcademicYear, getAuthHeaders])

  // 6. Fetch Student Profile & Fees
  useEffect(() => {
    const loadProfile = async () => {
      if (!filters.selectedAdmissionNo) return;
      setIsLoading(true);
      setFeeProfile(null);
      setShowDuesDetails(false);
      try {
        const res = await fetch(`${ENDPOINTS.tc}/student-profile/${filters.selectedAdmissionNo}?schoolId=${schoolId}&academicYear=${currentAcademicYear}`, { headers: getAuthHeaders() });
        if (res.ok) {
          const profile = await res.json();
          setFeeProfile(profile);
          const sData = profile.studentData || {};

          // Map API Data to Form
          setFormData(prev => ({
            ...prev,
            serialNo: profile.tcNumber || `${currentAcademicYear.split('-')[1] || '25'}/${filters.selectedAdmissionNo}`,
            admissionNo: filters.selectedAdmissionNo,
            studentName: sData.student_name || sData.studentName || "",
            fatherOrMotherName: sData.father_name || sData.fatherName || sData.mother_name || "",
            nationality: sData.nationality || "Indian",
            religion: sData.religion || "",
            caste: sData.caste || sData.community || "",
            sex: sData.gender || "",
            dateOfBirth: sData.date_of_birth || sData.dob || "",
            dateOfAdmission: sData.date_of_admission || "",
            standardStudied: sData.standard || sData.classLastStudied || "",
            section: sData.section || "", // Capture section correctly
            feesPaid: profile.totalPendingBalance <= 0.01 ? "Yes" : "No",
          }));

          if (profile.totalPendingBalance > 0.01) setShowDuesDetails(true);
          
          // If TC already exists, we might need to load saved data if the endpoint provides it (omitted for brevity, relying on profile gen)
        }
      } catch (e) {
        toast.error("Failed to load student details");
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [filters.selectedAdmissionNo, schoolId, currentAcademicYear, getAuthHeaders])

  // ================= HANDLERS =================

  const handleFilterChange = (field, val) => {
    setFilters(prev => ({ ...prev, [field]: val }));
    if (field === 'standard') setFilters(prev => ({ ...prev, standard: val, section: "", selectedAdmissionNo: "" }));
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveTC = async () => {
    if (!formData.admissionNo) return toast.warning("No student selected");
    if (tcAlreadyGenerated) return toast.error("TC already generated.");

    setIsSaving(true);
    try {
      const payload = {
        admissionNumber: formData.admissionNo,
        tcNumber: formData.serialNo, // Serial No mapped to TC Number
        studentName: formData.studentName,
        fatherName: formData.fatherOrMotherName,
        nationality: formData.nationality,
        religion: formData.religion,
        caste: formData.caste,
        gender: formData.sex,
        dateOfBirth: formatDateForApi(formData.dateOfBirth),
        dateOfAdmission: formatDateForApi(formData.dateOfAdmission),
        standardLeaving: formData.standardStudied,
        promotionStatus: formData.qualifiedForPromotion,
        feesPaid: formData.feesPaid,
        dateLeft: formatDateForApi(formData.dateLeftSchool),
        conduct: formData.conductAndCharacter,
        applicationDate: formatDateForApi(formData.applicationDate),
        issueDate: formatDateForApi(formData.issueDate),
        standard: formData.standardStudied, // Added standard
        section: formData.section, // Added section
        schoolId: schoolId,
        academicYear: currentAcademicYear,
        pendingFees: feeProfile?.individualArrears || []
      };

      const res = await fetch(`${ENDPOINTS.tc}/create?schoolId=${schoolId}`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("CBSE Certificate Saved & Issued");
        setIsEditing(false);
        setTcSaved(true);
        setAllowPrint(true);
        setTcAlreadyGenerated(true);
        setTcBlockMessage("TC Generated Successfully.");
      } else {
        const txt = await res.text();
        throw new Error(txt);
      }
    } catch (e) {
      toast.error("Save failed: " + e.message);
    } finally {
      setIsSaving(false);
    }
  }

  // --- PDF EXPORT ---
  const handlePrint = async () => {
    if (!allowPrint && !tcAlreadyGenerated) return toast.warning("Save TC first.");
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const a4Width = 210;
      const a4Height = 297;

      if (page1Ref.current) {
        const canvas = await html2canvas(page1Ref.current, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL("image/png");
        const imgHeight = (canvas.height * a4Width) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, a4Width, imgHeight);
      }
      pdf.save(`CBSE_TC_${formData.admissionNo}.pdf`);
    } catch (error) {
      console.error("PDF Error:", error);
    }
  }

  // --- NATIVE PRINT (BROWSER) ---
  const handleNativePrint = () => {
    if (!formData.admissionNo) return toast.warning("Select a student first");
    if (!allowPrint && !tcAlreadyGenerated) return toast.warning("Save TC first before printing");
    // Trigger browser print
    window.print();
  }

  const clearFilters = () => {
    setFilters({ standard: "", section: "", searchQuery: "", selectedAdmissionNo: "" });
    setFormData(prev => ({...prev, admissionNo: ""}));
    setTcAlreadyGenerated(false);
    setTcSaved(false);
    setAllowPrint(false);
    setFeeProfile(null);
  }

  // ================= SUB-COMPONENTS =================

  const renderDuesPanel = () => {
    if (!feeProfile || feeProfile.totalPendingBalance <= 0) return null;
    return (
        <Collapse in={showDuesDetails}>
            <div className="mb-4">
                <Card className="border-danger shadow-sm">
                    <Card.Header className="bg-danger text-white d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center"><FaExclamationTriangle className="me-2"/> <span className="fw-bold">Pending Fees</span></div>
                        <Button variant="outline-light" size="sm" onClick={() => setShowDuesDetails(false)}><FaChevronUp/> Hide</Button>
                    </Card.Header>
                    <Card.Body className="bg-light">
                        <Alert variant="warning" className="d-flex align-items-center py-2"><FaInfoCircle className="me-2"/><span>Outstanding dues will be recorded as arrears upon TC generation.</span></Alert>
                        <Row>
                            <Col md={6}>
                                <Table size="sm" bordered>
                                    <tbody>
                                        <tr><td>Academic Balance</td><td className="text-danger text-end">{formatCurrency(feeProfile.academicBalance)}</td></tr>
                                        <tr><td>Transport Balance</td><td className="text-danger text-end">{formatCurrency(feeProfile.transportBalance)}</td></tr>
                                        <tr className="fw-bold bg-white"><td>TOTAL PENDING</td><td className="text-danger text-end">{formatCurrency(feeProfile.totalPendingBalance)}</td></tr>
                                    </tbody>
                                </Table>
                            </Col>
                            <Col md={6}>
                                <ListGroup variant="flush" className="small" style={{maxHeight: '150px', overflowY: 'auto'}}>
                                    {feeProfile.individualArrears?.map((arrear, i) => (
                                        <ListGroup.Item key={i} className="d-flex justify-content-between px-0 py-1 bg-transparent">
                                            <span>{arrear.feeHead}</span><span className="fw-bold">{formatCurrency(arrear.amount)}</span>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            </div>
        </Collapse>
    )
  }

  const renderFilterBar = () => (
      <Card className="mb-4 shadow-sm border-0 print:hidden">
        <Card.Body className="bg-light py-3">
            <Row className="g-3 align-items-end">
                <Col md={3}>
                    <Form.Label className="small fw-bold text-muted">Standard</Form.Label>
                    <Form.Select size="sm" value={filters.standard} onChange={(e) => handleFilterChange('standard', e.target.value)}>
                        <option value="">All Standards</option>
                        {standards.map((s, i) => <option key={i} value={s}>{s}</option>)}
                    </Form.Select>
                </Col>
                <Col md={3}>
                    <Form.Label className="small fw-bold text-muted">Section</Form.Label>
                    <Form.Select size="sm" value={filters.section} onChange={(e) => handleFilterChange('section', e.target.value)} disabled={!filters.standard}>
                        <option value="">All Sections</option>
                        {sections.map((s, i) => <option key={i} value={s}>{s}</option>)}
                    </Form.Select>
                </Col>
                <Col md={4}>
                    <Form.Label className="small fw-bold text-muted">Search Student</Form.Label>
                    <div className="input-group input-group-sm">
                        <span className="input-group-text"><FaFilter/></span>
                        <Form.Select value={filters.selectedAdmissionNo} onChange={(e) => handleFilterChange('selectedAdmissionNo', e.target.value)}>
                            <option value="">Select Student ({filteredAdmissionNumbers.length})</option>
                            {filteredAdmissionNumbers.map((adm, i) => <option key={i} value={adm}>{adm}</option>)}
                        </Form.Select>
                    </div>
                </Col>
                <Col md={2}>
                      {isLoading && <Spinner size="sm" animation="border"/>}
                      {feeProfile && !isLoading && (
                        <Button 
                            variant={feeProfile.totalPendingBalance > 0 ? "outline-danger" : "outline-success"} 
                            size="sm" 
                            className="w-100"
                            onClick={() => setShowDuesDetails(!showDuesDetails)}
                            disabled={feeProfile.totalPendingBalance <= 0}
                        >
                            {feeProfile.totalPendingBalance > 0 ? "View Dues" : "No Dues"}
                        </Button>
                      )}
                </Col>
            </Row>
        </Card.Body>
      </Card>
  )

  const renderToolbar = () => (
    <Card className="mb-4 shadow-sm border-0 bg-white print:hidden">
        <Card.Body className="p-3 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
                <Button variant="outline-secondary" className="me-3" onClick={() => navigate(-1)}><FaArrowLeft/> Back</Button>
                <div>
                    <h5 className="fw-bold text-primary mb-0"><FaUserGraduate className="me-2"/> CBSE Certificate 1</h5>
                    {tcBlockMessage && <Badge bg={tcAlreadyGenerated ? "info" : "warning"}>{tcBlockMessage}</Badge>}
                </div>
            </div>
            <div className="d-flex gap-2">
                <Button variant="outline-info" onClick={clearFilters}><FaEraser/></Button>
                <Button variant={isEditing ? "success" : "warning"} onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? "Done Editing" : <><FaEdit/> Edit</>}
                </Button>
                <Button variant="primary" onClick={handleSaveTC} disabled={!formData.admissionNo || isSaving || tcAlreadyGenerated}>
                    {isSaving ? <Spinner size="sm"/> : <FaSave/>} Save & Issue
                </Button>
                {/* NEW PRINT BUTTON */}
                <Button variant="dark" onClick={handleNativePrint} disabled={!formData.admissionNo || (!allowPrint && !tcAlreadyGenerated)}>
                    <FaPrint/> Print
                </Button>
                <Button variant="secondary" onClick={handlePrint} disabled={!formData.admissionNo || (!allowPrint && !tcAlreadyGenerated)}>
                    <FaFilePdf/> PDF
                </Button>
            </div>
        </Card.Body>
    </Card>
  )

  // ================= RENDER =================

  return (
    <MainContentPage>
      <Container fluid className="p-0">
        <ToastContainer position="top-right" autoClose={3000}/>
        
        {renderToolbar()}
        {renderFilterBar()}
        {renderDuesPanel()}

        {/* Visible content for UI (and used by html2canvas for PDF) */}
        <div className="d-flex justify-content-center bg-secondary-subtle py-4 rounded overflow-auto">
            <div 
            id="certificate-content"
            ref={page1Ref}
            className="border bg-white shadow-sm"
            style={{ width: "210mm", height: "297mm", overflow: "hidden", position: "relative" }}
            >
            <div className="p-4">
                <div className="text-center mb-4">
                <h1 className="fw-bold fs-1">{formData.schoolName}</h1>
                <p className="fs-4 mt-1">{formData.schoolAddress}</p>
                <p className="mt-1">{formData.recognizedBy}</p>
                </div>

                <div className="text-center mb-4">
                <h2 className="fw-bold fs-2">TRANSFER CERTIFICATE</h2>
                </div>

                <div className="row mt-4">
                <div className="col-6">
                    {isEditing ? (
                    <>
                        Serial No: <input 
                        type="text" 
                        name="serialNo" 
                        value={formData.serialNo} 
                        onChange={handleInputChange} 
                        className="form-control d-inline-block"
                        style={{ width: "150px" }}
                        />
                    </>
                    ) : (
                    <p>Serial No: {formData.serialNo}</p>
                    )}
                </div>
                <div className="col-6 text-end">
                    {isEditing ? (
                    <>
                        Admission No: <input 
                        type="text" 
                        name="admissionNo" 
                        value={formData.admissionNo} 
                        onChange={handleInputChange} 
                        className="form-control d-inline-block"
                        style={{ width: "150px" }}
                        />
                    </>
                    ) : (
                    <p>Admission No: {formData.admissionNo}</p>
                    )}
                </div>
                </div>

                <div className="mt-4">
                <div className="row mb-2">
                    <div className="col-8">1. Name of the Pupil (in block letters)</div>
                    <div className="col-4">
                    {isEditing ? (
                        <input 
                        type="text" 
                        name="studentName" 
                        value={formData.studentName} 
                        onChange={handleInputChange} 
                        className="form-control"
                        />
                    ) : (
                        `: ${formData.studentName}`
                    )}
                    </div>
                </div>

                <div className="row mb-2">
                    <div className="col-8">2. Name of the Father or Mother of the Pupil</div>
                    <div className="col-4">
                    {isEditing ? (
                        <input 
                        type="text" 
                        name="fatherOrMotherName" 
                        value={formData.fatherOrMotherName} 
                        onChange={handleInputChange} 
                        className="form-control"
                        />
                    ) : (
                        `: ${formData.fatherOrMotherName}`
                    )}
                    </div>
                </div>

                <div className="row mb-2">
                    <div className="col-8">3. Nationality, Religion</div>
                    <div className="col-4">
                    {isEditing ? (
                        <div className="d-flex flex-column">
                        <input 
                            type="text" 
                            name="nationality" 
                            value={formData.nationality} 
                            onChange={handleInputChange} 
                            className="form-control mb-1"
                            placeholder="Nationality"
                        />
                        <input 
                            type="text" 
                            name="religion" 
                            value={formData.religion} 
                            onChange={handleInputChange} 
                            className="form-control"
                            placeholder="Religion"
                        />
                        </div>
                    ) : (
                        `: ${formData.nationality} - ${formData.religion}`
                    )}
                    </div>
                </div>

                <div className="row mb-2">
                    <div className="col-8">4. Community and Caste</div>
                    <div className="col-4">
                    {isEditing ? (
                        <input 
                        type="text" 
                        name="caste" 
                        value={formData.caste} 
                        onChange={handleInputChange} 
                        className="form-control"
                        />
                    ) : (
                        `: ${formData.caste}`
                    )}
                    </div>
                </div>

                <div className="row mb-2">
                    <div className="col-8">5. Sex</div>
                    <div className="col-4">
                    {isEditing ? (
                        <input 
                        type="text" 
                        name="sex" 
                        value={formData.sex} 
                        onChange={handleInputChange} 
                        className="form-control"
                        />
                    ) : (
                        `: ${formData.sex}`
                    )}
                    </div>
                </div>

                <div className="row mb-2">
                    <div className="col-8">6. Date of Birth as entered in the Admission Register (in figures and words)</div>
                    <div className="col-4">
                    {isEditing ? (
                        <input 
                        type="date" 
                        name="dateOfBirth" 
                        value={formData.dateOfBirth} 
                        onChange={handleInputChange} 
                        className="form-control"
                        />
                    ) : (
                        `: ${formatDate(formData.dateOfBirth)}`
                    )}
                    </div>
                </div>

                <div className="row mb-2">
                    <div className="col-8">7. Date of admission and standard in which admitted (the year to be entered in words)</div>
                    <div className="col-4">
                    {isEditing ? (
                        <input 
                        type="date" 
                        name="dateOfAdmission" 
                        value={formData.dateOfAdmission} 
                        onChange={handleInputChange} 
                        className="form-control"
                        />
                    ) : (
                        `: ${formatDate(formData.dateOfAdmission)}`
                    )}
                    </div>
                </div>

                <div className="row mb-2">
                    <div className="col-8">8. Standard in which the pupil was studying at the time of leaving (in words)</div>
                    <div className="col-4">
                    {isEditing ? (
                        <input 
                        type="text" 
                        name="standardStudied" 
                        value={formData.standardStudied} 
                        onChange={handleInputChange} 
                        className="form-control"
                        />
                    ) : (
                        `: ${formData.standardStudied}`
                    )}
                    </div>
                </div>

                <div className="row mb-2">
                    <div className="col-8">9. Whether Qualified for Promotion to the Higher Standard</div>
                    <div className="col-4">
                    {isEditing ? (
                        <input 
                        type="text" 
                        name="qualifiedForPromotion" 
                        value={formData.qualifiedForPromotion} 
                        onChange={handleInputChange} 
                        className="form-control"
                        />
                    ) : (
                        `: ${formData.qualifiedForPromotion}`
                    )}
                    </div>
                </div>

                <div className="row mb-2">
                    <div className="col-8">10. Whether the Pupil has paid all the fees due to the School?</div>
                    <div className="col-4">
                    {isEditing ? (
                        <input 
                        type="text" 
                        name="feesPaid" 
                        value={formData.feesPaid} 
                        onChange={handleInputChange} 
                        className="form-control"
                        />
                    ) : (
                        `: ${formData.feesPaid}`
                    )}
                    </div>
                </div>

                <div className="row mb-2">
                    <div className="col-8">11. Date on which the pupil actually left the School</div>
                    <div className="col-4">
                    {isEditing ? (
                        <input 
                        type="date" 
                        name="dateLeftSchool" 
                        value={formData.dateLeftSchool} 
                        onChange={handleInputChange} 
                        className="form-control"
                        />
                    ) : (
                        `: ${formatDate(formData.dateLeftSchool)}`
                    )}
                    </div>
                </div>

                <div className="row mb-2">
                    <div className="col-8">12. The pupil's Conduct and Character</div>
                    <div className="col-4">
                    {isEditing ? (
                        <input 
                        type="text" 
                        name="conductAndCharacter" 
                        value={formData.conductAndCharacter} 
                        onChange={handleInputChange} 
                        className="form-control"
                        />
                    ) : (
                        `: ${formData.conductAndCharacter}`
                    )}
                    </div>
                </div>

                <div className="row mb-2">
                    <div className="col-8">13. Date on which application for Transfer Certificate was made on behalf of the pupil by the parent/guardian</div>
                    <div className="col-4">
                    {isEditing ? (
                        <input 
                        type="date" 
                        name="applicationDate" 
                        value={formData.applicationDate} 
                        onChange={handleInputChange} 
                        className="form-control"
                        />
                    ) : (
                        `: ${formatDate(formData.applicationDate)}`
                    )}
                    </div>
                </div>

                <div className="row mb-2">
                    <div className="col-8">14. Date of the Transfer Certificate</div>
                    <div className="col-4">
                    {isEditing ? (
                        <input 
                        type="date" 
                        name="issueDate" 
                        value={formData.issueDate} 
                        onChange={handleInputChange} 
                        className="form-control"
                        />
                    ) : (
                        `: ${formatDate(formData.issueDate)}`
                    )}
                    </div>
                </div>

                <div className="row mb-2">
                    <div className="col-8">15. Signature of the Parent/Guardian</div>
                    <div className="col-4">: </div>
                </div>

                <div className="row mt-5">
                    <div className="col-12 text-end">
                    <p>Signature of the Principal</p>
                    </div>
                </div>
                </div>
            </div>
            </div>
        </div>

        {/* --- HIDDEN PRINT SECTION --- */}
        {/* This section is hidden on screen but visible when printing to ensure WYSIWYG without inputs */}
        <div id="printable-area" style={{ position: "absolute", left: "-9999px", top: 0 }}>
            <div 
            style={{ width: "210mm", height: "297mm", overflow: "hidden", position: "relative", padding: "1.5rem", fontFamily: "sans-serif" }}
            >
                <div className="text-center mb-4" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h1 className="fw-bold fs-1" style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{formData.schoolName}</h1>
                    <p className="fs-4 mt-1" style={{ fontSize: '18px', margin: '4px 0 0 0' }}>{formData.schoolAddress}</p>
                    <p className="mt-1" style={{ margin: '4px 0 0 0' }}>{formData.recognizedBy}</p>
                </div>

                <div className="text-center mb-4" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h2 className="fw-bold fs-2" style={{ fontSize: '20px', fontWeight: 'bold' }}>TRANSFER CERTIFICATE</h2>
                </div>

                <div className="row mt-4" style={{ display: 'flex', marginTop: '1.5rem' }}>
                    <div className="col-6" style={{ width: '50%' }}>
                        <p>Serial No: {formData.serialNo}</p>
                    </div>
                    <div className="col-6 text-end" style={{ width: '50%', textAlign: 'right' }}>
                        <p>Admission No: {formData.admissionNo}</p>
                    </div>
                </div>

                <div className="mt-4" style={{ marginTop: '1.5rem' }}>
                    {/* Rows */}
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <div style={{ width: '66%' }}>1. Name of the Pupil (in block letters)</div>
                        <div style={{ width: '33%' }}>: {formData.studentName}</div>
                    </div>
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <div style={{ width: '66%' }}>2. Name of the Father or Mother of the Pupil</div>
                        <div style={{ width: '33%' }}>: {formData.fatherOrMotherName}</div>
                    </div>
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <div style={{ width: '66%' }}>3. Nationality, Religion</div>
                        <div style={{ width: '33%' }}>: {formData.nationality} - {formData.religion}</div>
                    </div>
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <div style={{ width: '66%' }}>4. Community and Caste</div>
                        <div style={{ width: '33%' }}>: {formData.caste}</div>
                    </div>
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <div style={{ width: '66%' }}>5. Sex</div>
                        <div style={{ width: '33%' }}>: {formData.sex}</div>
                    </div>
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <div style={{ width: '66%' }}>6. Date of Birth as entered in the Admission Register (in figures and words)</div>
                        <div style={{ width: '33%' }}>: {formatDate(formData.dateOfBirth)}</div>
                    </div>
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <div style={{ width: '66%' }}>7. Date of admission and standard in which admitted (the year to be entered in words)</div>
                        <div style={{ width: '33%' }}>: {formatDate(formData.dateOfAdmission)}</div>
                    </div>
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <div style={{ width: '66%' }}>8. Standard in which the pupil was studying at the time of leaving (in words)</div>
                        <div style={{ width: '33%' }}>: {formData.standardStudied}</div>
                    </div>
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <div style={{ width: '66%' }}>9. Whether Qualified for Promotion to the Higher Standard</div>
                        <div style={{ width: '33%' }}>: {formData.qualifiedForPromotion}</div>
                    </div>
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <div style={{ width: '66%' }}>10. Whether the Pupil has paid all the fees due to the School?</div>
                        <div style={{ width: '33%' }}>: {formData.feesPaid}</div>
                    </div>
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <div style={{ width: '66%' }}>11. Date on which the pupil actually left the School</div>
                        <div style={{ width: '33%' }}>: {formatDate(formData.dateLeftSchool)}</div>
                    </div>
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <div style={{ width: '66%' }}>12. The pupil's Conduct and Character</div>
                        <div style={{ width: '33%' }}>: {formData.conductAndCharacter}</div>
                    </div>
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <div style={{ width: '66%' }}>13. Date on which application for Transfer Certificate was made on behalf of the pupil by the parent/guardian</div>
                        <div style={{ width: '33%' }}>: {formatDate(formData.applicationDate)}</div>
                    </div>
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <div style={{ width: '66%' }}>14. Date of the Transfer Certificate</div>
                        <div style={{ width: '33%' }}>: {formatDate(formData.issueDate)}</div>
                    </div>
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <div style={{ width: '66%' }}>15. Signature of the Parent/Guardian</div>
                        <div style={{ width: '33%' }}>: </div>
                    </div>

                    <div className="row mt-5" style={{ marginTop: '3rem', textAlign: 'right' }}>
                        <div className="col-12 text-end">
                            <p>Signature of the Principal</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

      </Container>

      <style>
        {`
          .custom-btn {
            padding: 5px 10px;
            font-size: 14px;
            color:white;
          }
          .page {
            width: 210mm;
            height: 297mm;
            box-sizing: border-box;
          }
          .row {
            display: flex;
            margin-bottom: 10px;
          }
          p {
            margin: 0;
          }
          .text-center {
            text-align: center;
          }
          .text-end {
            text-align: right;
          }
          .fw-bold {
            font-weight: bold;
          }
          .fs-1 {
            font-size: 24px;
          }
          .fs-2 {
            font-size: 20px;
          }
          .fs-4 {
            font-size: 18px;
          }
          .mt-1 {
            margin-top: 4px;
          }
          .mt-4 {
            margin-top: 16px;
          }
          .mt-5 {
            margin-top: 20px;
          }
          .mb-2 {
            margin-bottom: 8px;
          }
          .mb-4 {
            margin-bottom: 16px;
          }
          .col-6 {
            width: 50%;
          }
          .col-8 {
            width: 66.67%;
          }
          .col-4 {
            width: 33.33%;
          }
          .form-control {
            font-size: 14px;
            padding: 2px 5px;
          }
          .mb-1 {
            margin-bottom: 4px;
          }
          
          /* PRINT STYLES */
          @media print {
            body * {
              visibility: hidden;
              height: 0;
              overflow: hidden;
            }
            #printable-area, #printable-area * {
              visibility: visible;
              height: auto;
              overflow: visible;
            }
            #printable-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              z-index: 9999;
              background: white;
            }
            .print\\:hidden { 
                display: none !important; 
            }
            @page {
                size: A4;
                margin: 0;
            }
          }
        `}
      </style>
    </MainContentPage>
  )
}

export default CBSECertificate1;