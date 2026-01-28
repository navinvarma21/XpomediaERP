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

const CBSECertificate2 = () => {
  const { schoolId, currentAcademicYear, getAuthHeaders } = useAuthContext()
  const navigate = useNavigate()
  const certificateRef = useRef(null)
  const page1Ref = useRef(null)
    
  // ================= STATE MANAGEMENT =================
    
  // UI Control
  const [isEditing, setIsEditing] = useState(false)
    
  // API & Loading
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isFetchingTCStatus, setIsFetchingTCStatus] = useState(false)
    
  // Fee & Dues
  const [feeProfile, setFeeProfile] = useState(null)
  const [showDuesDetails, setShowDuesDetails] = useState(false) 
    
  // Data
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

  // TC Logic
  const [tcAlreadyGenerated, setTcAlreadyGenerated] = useState(false)
  const [tcBlockMessage, setTcBlockMessage] = useState("")
  const [tcSaved, setTcSaved] = useState(false)
  const [allowPrint, setAllowPrint] = useState(false)

  // === MAIN FORM DATA ===
  const [formData, setFormData] = useState({
    tcNo: "",
    schoolCode: "56216",
    schoolName: "",
    schoolAddress: "",
    studentName: "",
    admissionNo: "",
    motherName: "",
    fatherOrGuardianName: "",
    nationality: "Indian",
    casteOrScheduleTribe: "",
    dateOfFirstAdmission: "",
    dateOfBirth: "",
    classLastStudied: "",
    section: "", // Added section to state
    schoolBoardExam: "Yes. Promoted",
    subjectsStudied: "1.English, 2.Tamil/Hindi/French, 3.Maths, 4. Science, 5.Social Science, 6.Computer Science",
    qualifiedForPromotion: "Yes. Promoted to higher studies",
    higherClass: "Yes",
    feesCleared: "Yes",
    feeConcession: "No",
    totalWorkingDays: "220",
    daysPresent: "200",
    endOfYearResult: "Pass",
    coCurricularActivities: "NIL",
    generalConduct: "Good",
    dateOfApplication: new Date().toISOString().split('T')[0],
    dateOfIssue: new Date().toISOString().split('T')[0],
    reasonForLeaving: "Transfer to another school",
    aadharNumber: "",
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

  // 1. Initial Load
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
            schoolAddress: `${sData.schoolAddress || ""}, ${sData.city || ""}, ${sData.state || ""} - ${sData.pincode || ""}`
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

  // 3. Fetch Student List
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

  // 4. Filtering
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
            tcNo: profile.tcNumber || `${currentAcademicYear.split('-')[1] || '25'}/${filters.selectedAdmissionNo}`,
            admissionNo: filters.selectedAdmissionNo,
            studentName: sData.student_name || sData.studentName || "",
            motherName: sData.mother_name || "",
            fatherOrGuardianName: sData.father_name || sData.fatherName || "",
            nationality: sData.nationality || "Indian",
            casteOrScheduleTribe: sData.caste || sData.community || "",
            dateOfFirstAdmission: sData.date_of_admission || "",
            dateOfBirth: sData.date_of_birth || sData.dob || "",
            classLastStudied: sData.standard || sData.classLastStudied || "",
            section: sData.section || "", // Capture section correctly
            feesCleared: profile.totalPendingBalance <= 0.01 ? "Yes" : "No",
            aadharNumber: profile.aadharNumber || sData.aadhar_no || "",
          }));

          if (profile.totalPendingBalance > 0.01) setShowDuesDetails(true);
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
      // Map CBSE fields to Standard Backend DTO
      const payload = {
        admissionNumber: formData.admissionNo,
        tcNumber: formData.tcNo, 
        studentName: formData.studentName,
        fatherName: formData.fatherOrGuardianName,
        nationality: formData.nationality,
        caste: formData.casteOrScheduleTribe,
        dateOfBirth: formatDateForApi(formData.dateOfBirth),
        dateOfAdmission: formatDateForApi(formData.dateOfFirstAdmission),
        standardLeaving: formData.classLastStudied,
        promotionStatus: formData.qualifiedForPromotion,
        feesPaid: formData.feesCleared,
        dateLeft: formatDateForApi(formData.dateOfIssue), // Using issue date as date left if not specified
        conduct: formData.generalConduct,
        applicationDate: formatDateForApi(formData.dateOfApplication),
        issueDate: formatDateForApi(formData.dateOfIssue),
        reasonForLeaving: formData.reasonForLeaving,
        standard: formData.classLastStudied, // Added standard
        section: formData.section, // Added section
        
        // Custom CBSE fields passed as generic or extra data
        scholarshipDetails: formData.feeConcession,
        aadharNo: formData.aadharNumber,
        
        // These will be saved in JSON
        subjectsStudied: formData.subjectsStudied,
        totalWorkingDays: formData.totalWorkingDays,
        daysPresent: formData.daysPresent,
        
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

  const handlePrint = async () => {
    if (!allowPrint && !tcAlreadyGenerated) return toast.warning("Save TC first.");
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const a4Width = 210;
      const a4Height = 297;
      
      if (page1Ref.current) {
        // Temporarily adjust style for capture to ensure everything fits
        const originalStyle = page1Ref.current.style.cssText;
        page1Ref.current.style.width = "210mm";
        page1Ref.current.style.minHeight = "297mm";
        page1Ref.current.style.height = "auto";
        
        const canvas = await html2canvas(page1Ref.current, { 
            scale: 2, 
            useCORS: true,
            windowWidth: 1200 // Force wider render resolution
        });
        
        // Restore style
        page1Ref.current.style.cssText = originalStyle;

        const imgData = canvas.toDataURL("image/png");
        const imgHeight = (canvas.height * a4Width) / canvas.width;
        
        // If image height > A4, we scale it down slightly to fit on one page
        let finalHeight = imgHeight;
        let finalWidth = a4Width;
        
        if (imgHeight > a4Height) {
            finalHeight = a4Height - 10; // 10mm buffer
            finalWidth = (canvas.width * finalHeight) / canvas.height;
        }

        // Center horizontally if scaled down
        const xPos = (a4Width - finalWidth) / 2;

        pdf.addImage(imgData, "PNG", xPos, 5, finalWidth, finalHeight); // 5mm top margin
      }
      pdf.save(`CBSE_TC2_${formData.admissionNo}.pdf`);
    } catch (error) {
      console.error("PDF Error:", error);
    }
  }

  // --- NATIVE PRINT (BROWSER) ---
  const handleNativePrint = () => {
    if (!formData.admissionNo) return toast.warning("Select a student first");
    if (!allowPrint && !tcAlreadyGenerated) return toast.warning("Save TC first before printing");
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
                    <h5 className="fw-bold text-primary mb-0"><FaUserGraduate className="me-2"/> CBSE Certificate 2</h5>
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

        {/* Visible content for UI Editing */}
        <div className="d-flex justify-content-center bg-secondary-subtle py-4 rounded overflow-auto">
            <div 
            id="certificate-content"
            ref={page1Ref}
            className="certificate-page border bg-white shadow-sm"
            >
            <div className="page-content-wrapper">
                <div className="header-section text-center mb-3">
                    <h1 className="school-name fw-bold">{formData.schoolName}</h1>
                    <p className="school-address">{formData.schoolAddress}</p>
                </div>

                <div className="row meta-row">
                    <div className="col-6">
                        {isEditing ? (
                        <>
                            <span className="fw-bold">T.C. No:</span> <input 
                            type="text" 
                            name="tcNo" 
                            value={formData.tcNo} 
                            onChange={handleInputChange} 
                            className="form-control d-inline-block"
                            style={{ width: "150px" }}
                            />
                        </>
                        ) : (
                        <p><span className="fw-bold">T.C. No:</span> {formData.tcNo}</p>
                        )}
                    </div>
                    <div className="col-6 text-end">
                        {isEditing ? (
                        <>
                             <span className="fw-bold">School Code:</span> <input 
                            type="text" 
                            name="schoolCode" 
                            value={formData.schoolCode} 
                            onChange={handleInputChange} 
                            className="form-control d-inline-block"
                            style={{ width: "150px" }}
                            />
                        </>
                        ) : (
                        <p> <span className="fw-bold">School Code:</span> {formData.schoolCode}</p>
                        )}
                    </div>
                </div>

                <div className="text-center my-3">
                    <h2 className="certificate-title fw-bold">TRANSFER CERTIFICATE</h2>
                </div>

                <div className="content-rows">
                    {[
                        { l: "1. Name of the Pupil", v: formData.studentName, n: "studentName" },
                        { l: "2. Admission No", v: formData.admissionNo, n: "admissionNo" },
                        { l: "3. Mother's Name", v: formData.motherName, n: "motherName" },
                        { l: "4. Father's / Guardian's Name", v: formData.fatherOrGuardianName, n: "fatherOrGuardianName" },
                        { l: "5. Nationality", v: formData.nationality, n: "nationality" },
                        { l: "6. Candidate belongs to SC/ST/OBC", v: formData.casteOrScheduleTribe, n: "casteOrScheduleTribe" },
                        { l: "7. Date of first admission", v: formData.dateOfFirstAdmission, n: "dateOfFirstAdmission", type: "date" },
                        { l: "8. Date of Birth (Admission Register)", v: formData.dateOfBirth, n: "dateOfBirth", type: "date" },
                        { l: "9. Class last studied", v: formData.classLastStudied, n: "classLastStudied" },
                        { l: "10. School / Board Annual Exam", v: formData.schoolBoardExam, n: "schoolBoardExam" },
                        { l: "11. Subject Studied", v: formData.subjectsStudied, n: "subjectsStudied" },
                        { l: "12. Promotion Qualified?", v: formData.qualifiedForPromotion, n: "qualifiedForPromotion" },
                        { l: "    If so, to which class", v: formData.higherClass, n: "higherClass" },
                        { l: "13. Whether all dues cleared?", v: formData.feesCleared, n: "feesCleared" },
                        { l: "14. Any fee concession availed?", v: formData.feeConcession, n: "feeConcession" },
                        { l: "15. Total working days", v: formData.totalWorkingDays, n: "totalWorkingDays" },
                        { l: "16. Total days present", v: formData.daysPresent, n: "daysPresent" },
                        { l: "17. End of Year Result", v: formData.endOfYearResult, n: "endOfYearResult" },
                        { l: "18. Co-curricular activities", v: formData.coCurricularActivities, n: "coCurricularActivities" },
                        { l: "19. General Conduct", v: formData.generalConduct, n: "generalConduct" },
                        { l: "20. Date of application for TC", v: formData.dateOfApplication, n: "dateOfApplication", type: "date" },
                        { l: "21. Date of issue of TC", v: formData.dateOfIssue, n: "dateOfIssue", type: "date" },
                        { l: "22. Reason for leaving", v: formData.reasonForLeaving, n: "reasonForLeaving" },
                        { l: "23. Aadhaar Number", v: formData.aadharNumber, n: "aadharNumber" }
                    ].map((row, idx) => (
                        <div className="data-row" key={idx}>
                            <div className="label-col">{row.l}</div>
                            <div className="value-col">
                                <span className="colon">:</span>
                                {isEditing ? (
                                    <input 
                                        type={row.type || "text"}
                                        name={row.n}
                                        value={row.v}
                                        onChange={handleInputChange}
                                        className="form-control data-input"
                                    />
                                ) : (
                                    <span className="value-text">{row.type === "date" ? formatDate(row.v) : row.v}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="signature-section mt-5">
                    <div className="row">
                        <div className="col-6"><p className="fw-bold">Signature of Parent/Guardian</p></div>
                        <div className="col-6 text-end"><p className="fw-bold">Signature of Principal</p></div>
                    </div>
                </div>
            </div>
            </div>
        </div>

        {/* --- HIDDEN PRINT SECTION (For pure CSS Printing) --- */}
        <div id="printable-area">
            <div className="print-page">
                 <div className="header-section text-center">
                    <h1 className="school-name">{formData.schoolName}</h1>
                    <p className="school-address">{formData.schoolAddress}</p>
                </div>

                <div className="meta-row-print">
                    <div className="left">T.C. No: <strong>{formData.tcNo}</strong></div>
                    <div className="right">School Code: <strong>{formData.schoolCode}</strong></div>
                </div>

                <div className="title-section text-center">
                    <h2 className="certificate-title">TRANSFER CERTIFICATE</h2>
                </div>

                <div className="content-rows-print">
                     {/* Data mapping repeated for print to ensure clean DOM without inputs */}
                     {[
                        { l: "1. Name of the Pupil", v: formData.studentName },
                        { l: "2. Admission No", v: formData.admissionNo },
                        { l: "3. Mother's Name", v: formData.motherName },
                        { l: "4. Father's / Guardian's Name", v: formData.fatherOrGuardianName },
                        { l: "5. Nationality", v: formData.nationality },
                        { l: "6. Candidate belongs to SC/ST/OBC", v: formData.casteOrScheduleTribe },
                        { l: "7. Date of first admission", v: formatDate(formData.dateOfFirstAdmission) },
                        { l: "8. Date of Birth", v: formatDate(formData.dateOfBirth) },
                        { l: "9. Class last studied", v: formData.classLastStudied },
                        { l: "10. School / Board Annual Exam", v: formData.schoolBoardExam },
                        { l: "11. Subject Studied", v: formData.subjectsStudied },
                        { l: "12. Promotion Qualified?", v: formData.qualifiedForPromotion },
                        { l: "    If so, to which class", v: formData.higherClass },
                        { l: "13. Whether all dues cleared?", v: formData.feesCleared },
                        { l: "14. Any fee concession availed?", v: formData.feeConcession },
                        { l: "15. Total working days", v: formData.totalWorkingDays },
                        { l: "16. Total days present", v: formData.daysPresent },
                        { l: "17. End of Year Result", v: formData.endOfYearResult },
                        { l: "18. Co-curricular activities", v: formData.coCurricularActivities },
                        { l: "19. General Conduct", v: formData.generalConduct },
                        { l: "20. Date of application for TC", v: formatDate(formData.dateOfApplication) },
                        { l: "21. Date of issue of TC", v: formatDate(formData.dateOfIssue) },
                        { l: "22. Reason for leaving", v: formData.reasonForLeaving },
                        { l: "23. Aadhaar Number", v: formData.aadharNumber }
                    ].map((row, idx) => (
                        <div className="print-row" key={idx}>
                            <div className="p-label">{row.l}</div>
                            <div className="p-sep">:</div>
                            <div className="p-val">{row.v}</div>
                        </div>
                    ))}
                </div>

                <div className="footer-print">
                    <div className="f-left">Signature of Parent/Guardian</div>
                    <div className="f-right">Signature of Principal</div>
                </div>
            </div>
        </div>

      </Container>

      <style>
        {`
          /* === SHARED STYLES === */
          .certificate-page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm;
            box-sizing: border-box;
            position: relative;
          }
          .school-name {
            font-size: 24px;
            margin-bottom: 2px;
            text-transform: uppercase;
          }
          .school-address {
            font-size: 14px;
            color: #555;
            margin-bottom: 10px;
          }
          .certificate-title {
            font-size: 20px;
            text-decoration: underline;
            margin: 10px 0;
          }
          
          /* === FORM / EDIT MODE STYLES === */
          .data-row {
            display: flex;
            align-items: center;
            padding: 3px 0; /* Tight spacing */
            border-bottom: 1px dotted #eee;
            font-size: 13px; /* Slightly smaller font */
          }
          .label-col {
            width: 60%;
            font-weight: 500;
          }
          .value-col {
            width: 40%;
            display: flex;
            align-items: center;
          }
          .colon {
            margin-right: 8px;
            font-weight: bold;
          }
          .data-input {
            height: 24px;
            font-size: 13px;
            padding: 0 5px;
          }
          .value-text {
            font-weight: 600;
          }
          
          /* === PRINT SPECIFIC STYLES === */
          #printable-area {
            display: none;
          }

          @media print {
            body * {
              visibility: hidden;
              height: 0;
            }
            .print\\:hidden {
               display: none !important;
            }
            #printable-area, #printable-area * {
              visibility: visible;
              height: auto;
            }
            #printable-area {
              display: block;
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
            }
            @page {
                size: A4 portrait;
                margin: 0; /* Remove browser margins */
            }

            .print-page {
                width: 210mm;
                height: 297mm; /* Exact A4 Height */
                padding: 15mm 20mm; /* Standard margins */
                display: flex;
                flex-direction: column;
                justify-content: space-between; /* This forces coverage of whole page */
            }

            .header-section { margin-bottom: 5mm; }
            .school-name { font-size: 22px; font-weight: bold; margin: 0; text-align: center; }
            .school-address { font-size: 12px; margin: 2px 0 0 0; text-align: center; }
            
            .meta-row-print {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                margin-bottom: 5mm;
            }

            .certificate-title {
                font-size: 18px;
                font-weight: bold;
                text-align: center;
                text-decoration: underline;
                margin-bottom: 5mm;
            }

            .content-rows-print {
                flex-grow: 1; /* Takes available space */
                display: flex;
                flex-direction: column;
                justify-content: space-between; /* Distribute rows evenly */
            }

            .print-row {
                display: flex;
                font-size: 13px; /* Optimized font size */
                line-height: 1.2;
            }
            .p-label { width: 60%; }
            .p-sep { width: 5%; text-align: center; }
            .p-val { width: 35%; font-weight: 600; }

            .footer-print {
                margin-top: 10mm;
                display: flex;
                justify-content: space-between;
                font-weight: bold;
                font-size: 14px;
                padding-bottom: 10mm;
            }
          }
        `}
      </style>
    </MainContentPage>
  )
}

export default CBSECertificate2