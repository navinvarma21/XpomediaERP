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
  FaSync,
  FaCheck,
  FaInfoCircle,
  FaChevronUp,
  FaChevronDown,
  FaArrowLeft,
  FaFilePdf
} from "react-icons/fa"

/**
 * TenthCertificate Component
 * * A comprehensive Transfer Certificate generation module designed for Tamil Nadu State Board schools.
 */
const TenthCertificate = () => {
  const { schoolId, currentAcademicYear, getAuthHeaders } = useAuthContext()
  const navigate = useNavigate()
    
  // ================= STATE MANAGEMENT =================
    
  // UI Control States
  const [currentPage, setCurrentPage] = useState(1) // 1 or 2
  const [isEditing, setIsEditing] = useState(false) // Toggle View/Edit mode
    
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
    district: "Tiruvannamalai", 
    pincode: "" 
  })

  // Helper to get Today in YYYY-MM-DD
  const getTodayISO = () => {
    return new Date().toISOString().split('T')[0];
  }

  // === MAIN FORM DATA (TN GOVT FORMAT) ===
  const [formData, setFormData] = useState({
    // Header Meta
    tcNumber: "",
    admissionNo: "",
    emisNo: "",
    aadharNo: "",
    serialNo: "",
    section: "", // Added section to state
      
    // School Details
    schoolName: "",
    educationalDistrict: "Tiruvannamalai",
    revenueDistrict: "Tiruvannamalai",
      
    // Student Personal
    studentName: "",
    fatherOrMotherName: "",
    nationality: "Indian",
    religion: "",
    caste: "",
    community: "",
    communityOption: "", // "a", "b", "c", "d" for TN format
    gender: "",
    dateOfBirth: "",
    dateOfBirthWords: "", 
      
    // Admission Details
    dateOfAdmission: "",
    standardOnAdmission: "",
      
    // Academic History
    standardStudied: "", // Point 9
    qualifiedForPromotion: "Refer Marksheet", // Point 10
    feesPaid: "Yes", // Point 11
    scholarship: "Nil", // Point 12
    medicalInspection: "Yes", // Point 13
    dateLeftSchool: getTodayISO(), // Point 14 (Fixed: ISO Format)
    conductAndCharacter: "Good", // Point 15
    applicationDate: getTodayISO(), // Point 16 (Fixed: ISO Format)
    issueDate: getTodayISO(), // Point 17 (Fixed: ISO Format)
    reasonForLeaving: "Completion of Course",
      
    // Identification
    identificationMark1: "",
    identificationMark2: "",
      
    // Course of Study Table (Page 2)
    courseOfStudy: {
      nameOfSchool: "",
      academicYears: currentAcademicYear || "",
      standardsStudied: "",
      firstLanguage: "Tamil",
      mediumOfInstruction: "English",
    }
  })

  // NEW: Community options state for Tamil Nadu TC
  const [communityOptions, setCommunityOptions] = useState({
    a: false, // Adi Dravidar (SC/ST)
    b: false, // Backward Class
    c: false, // Most Backward Class
    d: false  // Converted to Christianity from SC
  })
    
  // NEW: TC Already Generated Block
  const [tcAlreadyGenerated, setTcAlreadyGenerated] = useState(false)
  const [tcBlockMessage, setTcBlockMessage] = useState("")
    
  // NEW: Save and Print control
  const [tcSaved, setTcSaved] = useState(false)
  const [allowPrint, setAllowPrint] = useState(false)

  // Refs for Printing
  const page1Ref = useRef(null)
  const page2Ref = useRef(null)

  // ================= HELPERS & UTILITIES =================

  // Safe String Extractor to prevent Object Rendering Errors
  const extractStringValue = useCallback((item) => {
    if (item === null || item === undefined) return "";
    if (typeof item === 'string') return item;
    if (typeof item === 'number') return String(item);
    // Attempt to extract from object keys common in dropdowns
    return item.standard || item.section || item.name || item.value || item.heading || "";
  }, [])

  // Format Date for Display (dd/MM/yyyy) - Purely Visual
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; 
    // Return standard GB format
    return date.toLocaleDateString('en-GB');
  }

  // Format Date for API (yyyy-MM-dd) - The Fix for the 500 Error
  const formatDateForApi = (dateString) => {
    if (!dateString) return null;
    // If already yyyy-MM-dd
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return dateString;
      
    // If dd/MM/yyyy
    if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
            // Convert to yyyy-MM-dd
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
    }
    return dateString;
  }
    
  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "₹ 0.00";
    return `₹ ${parseFloat(amount).toFixed(2)}`;
  }

  // ================= API EFFECTS =================

  // 1. Initial Data Load (School Info & Standards)
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
          setSchoolInfo({
            schoolName: sData.schoolName || "",
            schoolAddress: sData.schoolAddress || "",
            city: sData.city || "",
            district: sData.district || "Tiruvannamalai",
            pincode: sData.pincode || ""
          });
            
          // Pre-fill School Data into Form
          setFormData(prev => ({
            ...prev,
            schoolName: sData.schoolName || "",
            educationalDistrict: sData.city || "Tiruvannamalai",
            revenueDistrict: sData.city || "Tiruvannamalai",
            courseOfStudy: {
              ...prev.courseOfStudy,
              nameOfSchool: sData.schoolName || ""
            }
          }));
        }

        if (stdRes.ok) {
          const stdData = await stdRes.json();
          const cleanStandards = Array.isArray(stdData) ? stdData.map(extractStringValue) : [];
          setStandards(cleanStandards);
        }

      } catch (e) {
        toast.error("Network Error: Could not load initial school data.");
        console.error("Init Load Error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [schoolId, currentAcademicYear, getAuthHeaders, extractStringValue])

  // 2. Fetch Sections when Standard Changes
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
      } catch (e) {
        console.error("Section Fetch Error:", e);
      }
    };
      
    fetchSections();
  }, [filters.standard, schoolId, getAuthHeaders, extractStringValue])

  // 3. Load Bulk Student Data for Filtering
  useEffect(() => {
    const fetchStudents = async () => {
      if (!schoolId || !currentAcademicYear) return;
      try {
        const res = await fetch(`${ENDPOINTS.admissionmaster}/studentreport/datas?schoolId=${schoolId}&academicYear=${currentAcademicYear}`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setStudentsList(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Student List Fetch Error:", e);
      }
    };
      
    fetchStudents();
  }, [schoolId, currentAcademicYear, getAuthHeaders])

  // 4. Client-Side Filtering Logic
  useEffect(() => {
    let temp = studentsList;
      
    // Filter by Standard
    if (filters.standard) {
      temp = temp.filter(s => 
        extractStringValue(s.standard) === filters.standard || 
        extractStringValue(s.classLastStudied) === filters.standard
      );
    }

    // Filter by Section
    if (filters.section) {
      temp = temp.filter(s => extractStringValue(s.section) === filters.section);
    }

    // Filter by Search Query (Name or Admission No)
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      temp = temp.filter(s => 
        (s.admissionNumber && s.admissionNumber.toLowerCase().includes(q)) || 
        (s.studentName && s.studentName.toLowerCase().includes(q))
      );
    }
      
    // Extract unique admission numbers
    const admList = temp
      .map(s => extractStringValue(s.admissionNumber))
      .filter(a => a);
        
    setFilteredAdmissionNumbers([...new Set(admList)]);
      
    // Auto-select if only one result
    if (admList.length === 1 && !filters.selectedAdmissionNo) {
      setFilters(prev => ({ ...prev, selectedAdmissionNo: admList[0] }));
    }

  }, [filters.standard, filters.section, filters.searchQuery, studentsList, extractStringValue])

  // 5. CHECK TC EXISTENCE when admission number is selected
  useEffect(() => {
    const checkTCExistence = async () => {
      const admNo = filters.selectedAdmissionNo;
      if (!admNo || !schoolId || !currentAcademicYear) {
        setTcAlreadyGenerated(false);
        setTcBlockMessage("");
        setTcSaved(false);
        setAllowPrint(false);
        return;
      }
        
      setIsFetchingTCStatus(true);
      try {
        const res = await fetch(
          `${ENDPOINTS.tc}/check-tc-exists/${admNo}?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
          { headers: getAuthHeaders() }
        );
          
        if (res.ok) {
          const exists = await res.json();
          setTcAlreadyGenerated(exists);
          if (exists) {
            setTcBlockMessage("TC already generated for this student. View mode only.");
            setTcSaved(true); // Consider it saved since TC exists
            setAllowPrint(true); // Allow printing existing TC
            setIsEditing(false); // Default to view mode
          } else {
            setTcBlockMessage("");
            setTcSaved(false);
            setAllowPrint(false);
            setIsEditing(true); // Default to edit mode for new TC
          }
        }
      } catch (e) {
        console.error("Error checking TC existence:", e);
      } finally {
        setIsFetchingTCStatus(false);
      }
    };
      
    checkTCExistence();
  }, [filters.selectedAdmissionNo, schoolId, currentAcademicYear, getAuthHeaders])

  // 6. FETCH INDIVIDUAL PROFILE & MAP TO TN TC FORMAT
  useEffect(() => {
    const loadStudentProfile = async () => {
      const admNo = filters.selectedAdmissionNo;
      if (!admNo) return;

      setIsLoading(true);
      setFeeProfile(null);
      setShowDuesDetails(false); // Reset visibility
        
      try {
        // Fetch Profile with Dues
        const res = await fetch(`${ENDPOINTS.tc}/student-profile/${admNo}?schoolId=${schoolId}&academicYear=${currentAcademicYear}`, { headers: getAuthHeaders() });
          
        if (res.ok) {
          const profile = await res.json();
          setFeeProfile(profile);
          const sData = profile.studentData || {};
            
          // MAP API Data to Form State
          setFormData(prev => ({
            ...prev,
            // Meta
            admissionNo: admNo,
            tcNumber: profile.tcNumber || `TC/${currentAcademicYear.split('-')[1] || '25'}/${admNo}`,
            emisNo: sData.emis_no || sData.emis || profile.emisNo || "",
            aadharNo: profile.aadharNumber || sData.aadhar_no || sData.aadharNumber || "", 
            serialNo: profile.serialNo || `${new Date().getFullYear()}/${admNo}`,
            section: sData.section || "", // Capture section correctly
              
            // Personal
            studentName: sData.student_name || sData.studentName || "",
            fatherOrMotherName: sData.father_name || sData.fatherName || sData.mother_name || "",
            gender: sData.gender || "",
            nationality: sData.nationality || "Indian",
            religion: sData.religion || "Hindu",
            caste: sData.caste || "",
            community: profile.community || sData.community || "",
            communityOption: profile.suggestedCommunityOption || "", // Auto-set if suggested
            dateOfBirth: sData.date_of_birth || sData.dob || "",
              
            // Admission & Academic
            dateOfAdmission: sData.date_of_admission || "",
            standardOnAdmission: sData.standard_on_admission || "I", // Default logic or fetch if available
            standardStudied: sData.standard || sData.classLastStudied || "",
              
            // Identification
            identificationMark1: sData.identification_mark1 || "A Mole on the right hand",
            identificationMark2: sData.identification_mark2 || "A scar on the forehead",
              
            // Fees & Logic
            feesPaid: profile.totalPendingBalance <= 0.01 ? "Yes" : "No",
              
            // Course of Study defaults
            courseOfStudy: {
              ...prev.courseOfStudy,
              academicYears: currentAcademicYear,
              standardsStudied: sData.standard || "",
              firstLanguage: sData.mother_tongue || "Tamil",
              mediumOfInstruction: "English"
            }
          }));

          // Set community options based on suggested option
          if (profile.suggestedCommunityOption) {
            const newOptions = { a: false, b: false, c: false, d: false };
            newOptions[profile.suggestedCommunityOption] = true;
            setCommunityOptions(newOptions);
            // Also sync form data
            setFormData(prev => ({ ...prev, communityOption: profile.suggestedCommunityOption }));
          } else {
            // Reset if no suggestion
            setCommunityOptions({ a: false, b: false, c: false, d: false });
          }

          // Trigger Dues PANEL if pending
          if (profile.totalPendingBalance > 0.01) {
            setShowDuesDetails(true); // Auto expand if dues
          }
            
          // Set TC already generated flag
          if (profile.tcAlreadyGenerated) {
            setTcAlreadyGenerated(true);
            setTcBlockMessage("TC already generated for this student. View mode only.");
          }
        }
      } catch (e) {
        toast.error("Failed to load student details");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    if (filters.selectedAdmissionNo) {
      loadStudentProfile();
    }
  }, [filters.selectedAdmissionNo, schoolId, currentAcademicYear, getAuthHeaders, tcAlreadyGenerated])

  // ================= HANDLERS =================

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }
    
  const handleCommunityOptionChange = (option) => {
    const newOptions = { a: false, b: false, c: false, d: false };
    newOptions[option] = true;
    setCommunityOptions(newOptions);
    setFormData(prev => ({
      ...prev,
      communityOption: option
    }));
  }

  const handleCourseOfStudyChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      courseOfStudy: {
        ...prev.courseOfStudy,
        [name]: value
      }
    }));
  }

  const handleFilterChange = (field, val) => {
    setFilters(prev => ({ ...prev, [field]: val }));
    // Reset selected student if standard changes
    if (field === 'standard') {
       setFilters(prev => ({ ...prev, standard: val, section: "", selectedAdmissionNo: "" }));
    }
  }

  const clearFilters = () => {
    setFilters({
      standard: "",
      section: "",
      searchQuery: "",
      selectedAdmissionNo: ""
    });
    setFormData(prev => ({...prev, admissionNo: ""})); // Clear visual data
    setTcAlreadyGenerated(false);
    setTcBlockMessage("");
    setTcSaved(false);
    setAllowPrint(false);
    setShowDuesDetails(false);
  }

  // --- PDF GENERATION LOGIC ---
  const handlePrint = async () => {
    if (!formData.admissionNo) return toast.warning("Please select a student first.");
      
    // Check if TC is saved (or already exists)
    if (!allowPrint && !tcAlreadyGenerated) {
      return toast.warning("Please save TC before downloading PDF.");
    }
    
    // MODIFIED: Removed the community option warning toast to make it fully optional.

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const a4Width = 210;
    const a4Height = 297;

    try {
      // Capture Page 1
      if (page1Ref.current) {
        const canvas1 = await html2canvas(page1Ref.current, {
          scale: 2, // High resolution
          width: a4Width * 3.78, // Convert mm to pixels roughly
          height: a4Height * 3.78,
          useCORS: true,
          logging: false
        });
        const imgData1 = canvas1.toDataURL("image/png");
        // Calculate strict aspect ratio to fit A4
        const imgHeight1 = (canvas1.height * a4Width) / canvas1.width;
        pdf.addImage(imgData1, "PNG", 0, 0, a4Width, imgHeight1);
      }

      // Add Page 2
      pdf.addPage();

      // Capture Page 2
      if (page2Ref.current) {
        const canvas2 = await html2canvas(page2Ref.current, {
          scale: 2,
          width: a4Width * 3.78,
          height: a4Height * 3.78,
          useCORS: true,
          logging: false
        });
        const imgData2 = canvas2.toDataURL("image/png");
        const imgHeight2 = (canvas2.height * a4Width) / canvas2.width;
        pdf.addImage(imgData2, "PNG", 0, 0, a4Width, imgHeight2);
      }

      pdf.save(`TC_${formData.admissionNo}.pdf`);
      toast.success("PDF Downloaded Successfully");

    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Failed to generate PDF");
    }
  }

  // --- NATIVE PRINT LOGIC ---
  const handleNativePrint = () => {
    if (!formData.admissionNo) return toast.warning("Please select a student first.");
      
    // Check if TC is saved (or already exists)
    if (!allowPrint && !tcAlreadyGenerated) {
      return toast.warning("Please save TC before printing.");
    }

    // Trigger browser print
    // The CSS @media print block below ensures only the certificate is printed
    window.print();
  }

  // --- SAVE LOGIC ---
  const handleSaveTC = async () => {
    // Basic validation
    if (!formData.admissionNo) return toast.warning("No student selected");
      
    // Check if TC already exists
    if (tcAlreadyGenerated) {
      return toast.error("TC already generated for this student. Cannot generate another TC.");
    }
      
    // MODIFIED: Removed the blocking validation window.confirm for community option.
    // Saving is now permitted even if no community option (a,b,c,d) is selected.

    setIsSaving(true);
    try {
      // Construct Payload matching Backend DTO
      // FIXED: Ensure dates are in YYYY-MM-DD format using helper
      const payload = {
        admissionNumber: formData.admissionNo,
        tcNumber: formData.serialNo, // FIX: Use serialNo (e.g. 2026/ADM...) instead of the one with 'TC/' prefix
        serialNo: formData.serialNo,
        emisNo: formData.emisNo,
        aadharNo: formData.aadharNo,
        schoolName: formData.schoolName,
        educationalDistrict: formData.educationalDistrict,
        revenueDistrict: formData.revenueDistrict,
        studentName: formData.studentName,
        fatherName: formData.fatherOrMotherName,
        nationality: formData.nationality,
        religion: formData.religion,
        community: formData.community,
        communityOption: formData.communityOption,
        caste: formData.caste,
        gender: formData.gender,
        dateOfBirth: formatDateForApi(formData.dateOfBirth),
        dateOfAdmission: formatDateForApi(formData.dateOfAdmission),
        standardLeaving: formData.standardStudied,
        promotionStatus: formData.qualifiedForPromotion,
        feesPaid: formData.feesPaid,
        scholarshipDetails: formData.scholarship,
        medicalInspection: formData.medicalInspection,
        dateLeft: formatDateForApi(formData.dateLeftSchool), // FIX: Send yyyy-MM-dd
        conduct: formData.conductAndCharacter,
        applicationDate: formatDateForApi(formData.applicationDate), // FIX: Send yyyy-MM-dd
        issueDate: formatDateForApi(formData.issueDate), // FIX: Send yyyy-MM-dd
        reasonForLeaving: formData.reasonForLeaving,
        idMark1: formData.identificationMark1,
        idMark2: formData.identificationMark2,
        // Course Details
        courseSchool: formData.courseOfStudy.nameOfSchool,
        courseYears: formData.courseOfStudy.academicYears,
        courseStandard: formData.courseOfStudy.standardsStudied,
        courseMedium: formData.courseOfStudy.mediumOfInstruction,
        courseLang: formData.courseOfStudy.firstLanguage,
        // Additional
        standard: formData.standardStudied,
        section: formData.section, // Fixed: Sending section from formData
        dateOfLeaving: formatDateForApi(formData.dateLeftSchool), // FIX: Send yyyy-MM-dd
        schoolId: schoolId,
        academicYear: currentAcademicYear,
        // Pending fees for arrears
        pendingFees: feeProfile?.individualArrears || []
      };

      const res = await fetch(`${ENDPOINTS.tc}/create?schoolId=${schoolId}`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        toast.success("TC Data Saved & Issued Successfully");
        setIsEditing(false); // Switch to view mode
        setTcSaved(true);
        setAllowPrint(true);
          
        // Mark as already generated to prevent duplicate
        setTcAlreadyGenerated(true);
        setTcBlockMessage("TC successfully generated. Download available.");
          
        // Refresh fee profile to update status
        if (filters.selectedAdmissionNo) {
          const refreshRes = await fetch(`${ENDPOINTS.tc}/student-profile/${formData.admissionNo}?schoolId=${schoolId}&academicYear=${currentAcademicYear}`, 
            { headers: getAuthHeaders() });
          if (refreshRes.ok) {
            setFeeProfile(await refreshRes.json());
          }
        }
      } else {
        const errorText = await res.text();
        throw new Error(errorText || "Save failed");
      }
    } catch (e) {
      if (e.message.includes("TC already generated")) {
        toast.error("TC already exists for this student");
        setTcAlreadyGenerated(true);
        setTcBlockMessage(e.message);
        setTcSaved(true);
        setAllowPrint(true);
      } else {
        toast.error("Failed to save TC data: " + e.message);
      }
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  }


  // ================= RENDER SUB-COMPONENTS =================

  // 1. REPLACEMENT: Dues Panel (Collapsible Card instead of Modal)
  const renderDuesPanel = () => {
    if (!feeProfile || feeProfile.totalPendingBalance <= 0) return null;

    return (
        <Collapse in={showDuesDetails}>
            <div className="mb-4">
                <Card className="border-danger shadow-sm">
                    <Card.Header className="bg-danger text-white d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <FaExclamationTriangle className="me-2"/> 
                            <span className="fw-bold">Pending Fees Details</span>
                        </div>
                        <Button 
                            variant="outline-light" 
                            size="sm" 
                            onClick={() => setShowDuesDetails(false)}
                        >
                            <FaChevronUp className="me-1"/> Hide Details
                        </Button>
                    </Card.Header>
                    <Card.Body className="bg-light">
                        <Container fluid className="p-0">
                            <Alert variant="warning" className="d-flex align-items-center mb-4 border-warning bg-warning-subtle">
                                <FaInfoCircle className="me-3 fs-3 text-warning"/>
                                <div>
                                    <h6 className="mb-1 text-dark fw-bold">Action Required</h6>
                                    <span className="small text-dark">
                                        Student <b>{formData.studentName}</b> ({formData.admissionNo}) has outstanding dues. 
                                        These will be recorded as 'Arrears' in the TC system.
                                    </span>
                                </div>
                            </Alert>
                            
                            <Row className="g-4">
                                {/* LEFT COLUMN: SUMMARY TABLE */}
                                <Col lg={6}>
                                    <Card className="h-100 border-0 shadow-sm">
                                        <Card.Header className="bg-white border-bottom">
                                            <h6 className="mb-0 fw-bold text-primary">Fee Summary Overview</h6>
                                        </Card.Header>
                                        <Card.Body className="p-0">
                                            <Table hover responsive className="mb-0 align-middle small">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th className="ps-3 py-2">Category</th>
                                                        <th className="text-end py-2">Fixed</th>
                                                        <th className="text-end py-2">Paid</th>
                                                        <th className="text-end pe-3 py-2">Balance</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td className="ps-3 fw-medium">Academic</td>
                                                        <td className="text-end text-muted">{formatCurrency(feeProfile.academicFixed)}</td>
                                                        <td className="text-end text-success">{formatCurrency(feeProfile.academicPaid)}</td>
                                                        <td className={`text-end pe-3 fw-bold ${feeProfile.academicBalance > 0 ? 'text-danger' : 'text-muted'}`}>
                                                            {formatCurrency(feeProfile.academicBalance)}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="ps-3 fw-medium">Transport</td>
                                                        <td className="text-end text-muted">{formatCurrency(feeProfile.transportFixed)}</td>
                                                        <td className="text-end text-success">{formatCurrency(feeProfile.transportPaid)}</td>
                                                        <td className={`text-end pe-3 fw-bold ${feeProfile.transportBalance > 0 ? 'text-danger' : 'text-muted'}`}>
                                                            {formatCurrency(feeProfile.transportBalance)}
                                                        </td>
                                                    </tr>
                                                    <tr className="bg-danger-subtle border-top border-danger">
                                                        <td className="ps-3 fw-bold text-danger">TOTAL</td>
                                                        <td className="text-end fw-bold">{formatCurrency(feeProfile.totalFixed)}</td>
                                                        <td className="text-end fw-bold">{formatCurrency(feeProfile.totalPaid)}</td>
                                                        <td className="text-end pe-3 fw-bolder text-danger fs-6">
                                                            {formatCurrency(feeProfile.totalPendingBalance)}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                </Col>

                                {/* RIGHT COLUMN: BREAKDOWN LIST */}
                                <Col lg={6}>
                                    <Card className="h-100 border-0 shadow-sm">
                                        <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center">
                                            <h6 className="mb-0 fw-bold text-danger">Arrears Breakdown</h6>
                                            <Badge bg="danger" pill>{feeProfile.individualArrears?.length || 0} Items</Badge>
                                        </Card.Header>
                                        <Card.Body className="p-0" style={{maxHeight: '250px', overflowY: 'auto'}}>
                                            {feeProfile.individualArrears && feeProfile.individualArrears.length > 0 ? (
                                                <ListGroup variant="flush" className="small">
                                                    {feeProfile.individualArrears.map((arrear, i) => (
                                                        <ListGroup.Item key={i} className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom-0 border-top">
                                                            <div>
                                                                <div className="fw-bold text-dark">{arrear.feeHead}</div>
                                                                <small className="text-muted">
                                                                    Year: {arrear.academicYear}
                                                                </small>
                                                            </div>
                                                            <div className="text-end">
                                                                <span className="text-danger fw-bold">{formatCurrency(arrear.amount)}</span>
                                                            </div>
                                                        </ListGroup.Item>
                                                    ))}
                                                </ListGroup>
                                            ) : (
                                                <div className="text-center text-muted py-4">
                                                    <FaCheck className="text-success mb-2"/>
                                                    <p className="mb-0 small">No specific items.</p>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Container>
                    </Card.Body>
                </Card>
            </div>
        </Collapse>
    )
  }

  // 2. Toolbar Component
  const renderToolbar = () => (
    <Card className="mb-4 shadow-sm border-0 bg-white">
        <Card.Body className="p-3 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center">
                <Button variant="outline-secondary" className="me-3" onClick={() => navigate(-1)}>
                    <FaArrowLeft className="me-1"/> Back
                </Button>
                <div>
                    <h4 className="fw-bold text-primary mb-0"><FaUserGraduate className="me-2"/> Transfer Certificate</h4>
                    <small className="text-muted">Govt. of Tamil Nadu Format • A4 Layout</small>
                    {tcBlockMessage && (
                        <Alert variant={tcAlreadyGenerated ? "info" : "warning"} className="mt-2 mb-0 py-1 px-2">
                            <small>{tcBlockMessage}</small>
                        </Alert>
                    )}
                </div>
            </div>
            
            <div className="btn-group">
                <Button 
                   variant={currentPage === 1 ? "primary" : "outline-primary"}
                   onClick={() => setCurrentPage(1)}
                >
                   Page 1
                </Button>
                <Button 
                   variant={currentPage === 2 ? "primary" : "outline-primary"}
                   onClick={() => setCurrentPage(2)}
                >
                   Page 2
                </Button>
            </div>

            <div className="d-flex gap-2">
                <Button variant="outline-info" onClick={clearFilters} title="Clear Filters">
                    <FaEraser/>
                </Button>
                <Button 
                    variant={isEditing ? "success" : "warning"} 
                    onClick={() => setIsEditing(!isEditing)}
                    // FIXED: Allow toggling edit even if TC exists, so users can fix inputs before printing
                    disabled={false} 
                >
                    {isEditing ? <><FaSave className="me-1"/> Done Editing</> : <><FaEdit className="me-1"/> Edit TC</>}
                </Button>
                <Button 
                    variant="primary" 
                    onClick={handleSaveTC} 
                    disabled={!formData.admissionNo || isSaving || tcAlreadyGenerated}
                >
                    {isSaving ? <Spinner size="sm" className="me-1"/> : <FaSave className="me-1"/>}
                    {tcAlreadyGenerated ? "TC Already Generated" : "Save & Issue TC"}
                </Button>
                {/* NEW PRINT BUTTON */}
                <Button 
                    variant="dark" 
                    onClick={handleNativePrint} 
                    disabled={!formData.admissionNo || (!allowPrint && !tcAlreadyGenerated)}
                    title={!allowPrint && !tcAlreadyGenerated ? "Save TC first to Print" : "Print Certificate"}
                >
                    <FaPrint className="me-1"/> Print Certificate
                </Button>
                <Button 
                    variant="secondary" 
                    onClick={handlePrint} 
                    disabled={!formData.admissionNo || (!allowPrint && !tcAlreadyGenerated)}
                    title={!allowPrint && !tcAlreadyGenerated ? "Save TC first to download PDF" : "Download PDF"}
                >
                    <FaFilePdf className="me-1"/> Download PDF
                </Button>
            </div>
        </Card.Body>
    </Card>
  )

  // 3. Filter Bar Component
  const renderFilterBar = () => (
      <Card className="mb-4 shadow-sm border-0">
        <Card.Body className="bg-light">
            <Row className="g-3 align-items-end">
                <Col md={3}>
                    <Form.Label className="small fw-bold text-muted">Standard</Form.Label>
                    <Form.Select 
                        size="sm" 
                        value={filters.standard}
                        onChange={(e) => handleFilterChange('standard', e.target.value)}
                    >
                        <option value="">All Standards</option>
                        {standards.map((s, i) => <option key={i} value={s}>{s}</option>)}
                    </Form.Select>
                </Col>
                <Col md={3}>
                    <Form.Label className="small fw-bold text-muted">Section</Form.Label>
                    <Form.Select 
                        size="sm" 
                        value={filters.section}
                        onChange={(e) => handleFilterChange('section', e.target.value)}
                        disabled={!filters.standard}
                    >
                        <option value="">All Sections</option>
                        {sections.map((s, i) => <option key={i} value={s}>{s}</option>)}
                    </Form.Select>
                </Col>
                <Col md={4}>
                    <Form.Label className="small fw-bold text-muted">Search Student</Form.Label>
                    <div className="input-group input-group-sm">
                        <span className="input-group-text"><FaFilter/></span>
                        <Form.Select 
                            value={filters.selectedAdmissionNo}
                            onChange={(e) => handleFilterChange('selectedAdmissionNo', e.target.value)}
                        >
                            <option value="">Select Student ({filteredAdmissionNumbers.length})</option>
                            {filteredAdmissionNumbers.map((adm, i) => (
                                <option key={i} value={adm}>{adm}</option>
                            ))}
                        </Form.Select>
                    </div>
                </Col>
                <Col md={2}>
                    {isLoading ? <Spinner size="sm" variant="primary"/> : 
                     feeProfile && (
                        <div className="d-flex flex-column align-items-center">
                            <Badge 
                                bg={feeProfile.totalPendingBalance > 0 ? "danger" : "success"} 
                                className="w-100 py-2 mb-1"
                            >
                                {feeProfile.totalPendingBalance > 0 ? 
                                    `Dues: ${formatCurrency(feeProfile.totalPendingBalance)}` : 
                                    "No Dues"}
                            </Badge>
                            <Button 
                                variant={showDuesDetails ? "danger" : "outline-danger"}
                                size="sm" 
                                className="w-100"
                                onClick={() => setShowDuesDetails(!showDuesDetails)}
                                disabled={!feeProfile || feeProfile.totalPendingBalance <= 0}
                            >
                                {showDuesDetails ? <><FaChevronUp className="me-1"/> Hide Dues</> : <><FaChevronDown className="me-1"/> View Dues</>}
                            </Button>
                        </div>
                      )
                    }
                </Col>
            </Row>
            {isFetchingTCStatus && (
                <Row className="mt-2">
                    <Col>
                        <div className="d-flex align-items-center">
                            <Spinner size="sm" className="me-2"/>
                            <small className="text-muted">Checking TC status...</small>
                        </div>
                    </Col>
                </Row>
            )}
        </Card.Body>
      </Card>
  )
    
  // 4. Community Selection Component for Tamil Nadu TC
  const renderCommunitySelection = () => (
    <div className="community-section mb-3">
        <div className="row mb-2">
            <div className="col-7">5. Community</div>
            <div className="col-5 fw-bold">
                : {isEditing ? 
                    <input 
                        name="community" 
                        value={formData.community} 
                        onChange={handleInputChange} 
                        className="form-control form-control-sm"
                        placeholder="Enter community"
                        disabled={!isEditing} // FIXED: Allow edit if isEditing is true
                    /> : 
                    formData.community}
            </div>
        </div>
        <div className="row mb-1">
            <div className="col-12 ps-4 small text-secondary">
                <strong>Tamil Nadu TC Requirement:</strong> Select the appropriate community category (Optional):
            </div>
        </div>
        <div className="row mb-1">
            <div className="col-8 ps-5 small d-flex align-items-center">
                (a) Adi Dravidar (SC/ST)
                {communityOptions.a && <FaCheck className="ms-2 text-success"/>}
            </div>
            <div className="col-4">
                <Button 
                    size="sm" 
                    variant={communityOptions.a ? "success" : "outline-secondary"}
                    onClick={() => handleCommunityOptionChange('a')}
                    // FIXED: Logic to enable selection if editing
                    disabled={!isEditing}
                    className="w-75"
                >
                    {communityOptions.a ? "Selected" : "Select"}
                </Button>
            </div>
        </div>
        <div className="row mb-1">
            <div className="col-8 ps-5 small d-flex align-items-center">
                (b) Backward Class
                {communityOptions.b && <FaCheck className="ms-2 text-success"/>}
            </div>
            <div className="col-4">
                <Button 
                    size="sm" 
                    variant={communityOptions.b ? "success" : "outline-secondary"}
                    onClick={() => handleCommunityOptionChange('b')}
                    disabled={!isEditing}
                    className="w-75"
                >
                    {communityOptions.b ? "Selected" : "Select"}
                </Button>
            </div>
        </div>
        <div className="row mb-1">
            <div className="col-8 ps-5 small d-flex align-items-center">
                (c) Most Backward Class
                {communityOptions.c && <FaCheck className="ms-2 text-success"/>}
            </div>
            <div className="col-4">
                <Button 
                    size="sm" 
                    variant={communityOptions.c ? "success" : "outline-secondary"}
                    onClick={() => handleCommunityOptionChange('c')}
                    disabled={!isEditing}
                    className="w-75"
                >
                    {communityOptions.c ? "Selected" : "Select"}
                </Button>
            </div>
        </div>
        <div className="row mb-1">
            <div className="col-8 ps-5 small d-flex align-items-center">
                (d) Converted to Christianity from SC
                {communityOptions.d && <FaCheck className="ms-2 text-success"/>}
            </div>
            <div className="col-4">
                <Button 
                    size="sm" 
                    variant={communityOptions.d ? "success" : "outline-secondary"}
                    onClick={() => handleCommunityOptionChange('d')}
                    disabled={!isEditing}
                    className="w-75"
                >
                    {communityOptions.d ? "Selected" : "Select"}
                </Button>
            </div>
        </div>
        {/* MODIFIED: Changed alert from warning to info and rephrased for optional selection */}
        {!formData.communityOption && formData.community && (
            <Alert variant="info" className="mt-2 py-1 small">
                <FaInfoCircle className="me-1"/>
                Optional: Select a specific community category for TN format if needed.
            </Alert>
        )}
    </div>
  )

  // ================= MAIN RENDER =================
  return (
    <MainContentPage>
        <Container fluid className="p-0">
            {/* INJECT PRINT STYLES */}
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden;
                            height: 0;
                            overflow: hidden;
                        }
                        #print-section-container, #print-section-container * {
                            visibility: visible;
                            height: auto;
                            overflow: visible;
                        }
                        #print-section-container {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            background: white;
                            z-index: 9999;
                        }
                        .print-page-ref {
                            page-break-after: always;
                            width: 210mm !important;
                            height: 297mm !important;
                            margin: 0 !important;
                            padding: 15mm !important; /* Ensure padding matches */
                        }
                        @page {
                            size: A4 portrait;
                            margin: 0;
                        }
                    }
                `}
            </style>

            <ToastContainer position="top-right" autoClose={3000}/>
            {renderToolbar()}
            {renderFilterBar()}
            {renderDuesPanel()} 
            
            <div className="d-flex justify-content-center bg-secondary-subtle py-4 rounded overflow-auto">
                <div 
                    id="certificate-container"
                    className="bg-white shadow-lg"
                    style={{
                        width: "210mm", 
                        minHeight: "297mm", 
                        padding: "15mm",
                        boxSizing: "border-box",
                        fontFamily: '"Times New Roman", Times, serif',
                        fontSize: "12pt",
                        color: "#000"
                    }}
                >
                    {currentPage === 1 && (
                        <div className="page-content fade-in">
                            <div className="text-center mb-4">
                                <h1 className="fw-bold fs-3 text-uppercase mb-1">Transfer Certificate</h1>
                                <p className="fs-5 fw-bold mb-1">Government of Tamil Nadu</p>
                                <p className="mb-0">Department of School Education</p>
                                <p className="small fst-italic">(Recognized by the Director of School Education)</p>
                            </div>

                            <div className="row mb-4 small fw-bold">
                                <div className="col-6">
                                    Aadhar No: {isEditing ? 
                                        <input 
                                            type="text" 
                                            name="aadharNo" 
                                            value={formData.aadharNo} 
                                            onChange={handleInputChange} 
                                            className="form-control form-control-sm d-inline w-50"
                                            disabled={!isEditing}
                                        /> 
                                        : formData.aadharNo}
                                </div>
                                <div className="col-6 text-end">
                                    EMIS No: {isEditing ? 
                                        <input 
                                            type="text" 
                                            name="emisNo" 
                                            value={formData.emisNo} 
                                            onChange={handleInputChange} 
                                            className="form-control form-control-sm d-inline w-50"
                                            disabled={!isEditing}
                                        /> 
                                        : formData.emisNo}
                                </div>
                            </div>
                            
                            <div className="row mb-4 small fw-bold">
                                <div className="col-6">
                                    Serial No: {isEditing ? 
                                        <input 
                                            type="text" 
                                            name="serialNo" 
                                            value={formData.serialNo} 
                                            onChange={handleInputChange} 
                                            className="form-control form-control-sm d-inline w-50"
                                            disabled={!isEditing}
                                        /> 
                                        : formData.serialNo}
                                </div>
                                <div className="col-6 text-end">
                                    Admission No: {isEditing ? 
                                        <input 
                                            type="text" 
                                            name="admissionNo" 
                                            value={formData.admissionNo} 
                                            onChange={handleInputChange} 
                                            className="form-control form-control-sm d-inline w-50"
                                            disabled={!isEditing}
                                        /> 
                                        : formData.admissionNo}
                                </div>
                            </div>

                            <div className="tc-body">
                                <div className="row mb-2">
                                    <div className="col-7">1. (a) Name of the School</div>
                                    <div className="col-5 fw-bold">
                                        : {isEditing ? 
                                            <input 
                                                name="schoolName" 
                                                value={formData.schoolName} 
                                                onChange={handleInputChange} 
                                                className="form-control form-control-sm"
                                                disabled={!isEditing}
                                            /> 
                                            : formData.schoolName}
                                    </div>
                                </div>

                                <div className="row mb-2">
                                    <div className="col-7 ps-4">(b) Name of the Educational District</div>
                                    <div className="col-5 fw-bold">
                                        : {isEditing ? 
                                            <input 
                                                name="educationalDistrict" 
                                                value={formData.educationalDistrict} 
                                                onChange={handleInputChange} 
                                                className="form-control form-control-sm"
                                                disabled={!isEditing}
                                            /> 
                                            : formData.educationalDistrict}
                                    </div>
                                </div>

                                <div className="row mb-2">
                                    <div className="col-7 ps-4">(c) Name of the Revenue District</div>
                                    <div className="col-5 fw-bold">
                                        : {isEditing ? 
                                            <input 
                                                name="revenueDistrict" 
                                                value={formData.revenueDistrict} 
                                                onChange={handleInputChange} 
                                                className="form-control form-control-sm"
                                                disabled={!isEditing}
                                            /> 
                                            : formData.revenueDistrict}
                                    </div>
                                </div>

                                <div className="row mb-2">
                                    <div className="col-7">2. Name of the Pupil (in Block Letters)</div>
                                    <div className="col-5 fw-bold text-uppercase">
                                        : {isEditing ? 
                                            <input 
                                                name="studentName" 
                                                value={formData.studentName} 
                                                onChange={handleInputChange} 
                                                className="form-control form-control-sm"
                                                disabled={!isEditing}
                                            /> 
                                            : formData.studentName}
                                    </div>
                                </div>

                                <div className="row mb-2">
                                    <div className="col-7">3. Name of the Father or Mother of the Pupil</div>
                                    <div className="col-5 fw-bold">
                                        : {isEditing ? 
                                            <input 
                                                name="fatherOrMotherName" 
                                                value={formData.fatherOrMotherName} 
                                                onChange={handleInputChange} 
                                                className="form-control form-control-sm"
                                                disabled={!isEditing}
                                            /> 
                                            : formData.fatherOrMotherName}
                                    </div>
                                </div>

                                <div className="row mb-2">
                                    <div className="col-7">4. Nationality, Religion & Caste</div>
                                    <div className="col-5 fw-bold">
                                        : {isEditing ? (
                                            <div className="d-flex gap-1">
                                                <input 
                                                    name="nationality" 
                                                    placeholder="Nat." 
                                                    value={formData.nationality} 
                                                    onChange={handleInputChange} 
                                                    className="form-control form-control-sm"
                                                    disabled={!isEditing}
                                                />
                                                <input 
                                                    name="religion" 
                                                    placeholder="Rel." 
                                                    value={formData.religion} 
                                                    onChange={handleInputChange} 
                                                    className="form-control form-control-sm"
                                                    disabled={!isEditing}
                                                />
                                                <input 
                                                    name="caste" 
                                                    placeholder="Caste" 
                                                    value={formData.caste} 
                                                    onChange={handleInputChange} 
                                                    className="form-control form-control-sm"
                                                    disabled={!isEditing}
                                                />
                                            </div>
                                            ) : `${formData.nationality} - ${formData.religion} - ${formData.caste}`}
                                    </div>
                                </div>

                                {renderCommunitySelection()}

                                <div className="row mb-2 mt-2">
                                    <div className="col-7">6. Sex</div>
                                    <div className="col-5 fw-bold">
                                        : {isEditing ? 
                                            <input 
                                                name="gender" 
                                                value={formData.gender} 
                                                onChange={handleInputChange} 
                                                className="form-control form-control-sm"
                                                disabled={!isEditing}
                                            /> 
                                            : formData.gender}
                                    </div>
                                </div>

                                <div className="row mb-2">
                                    <div className="col-7">7. Date of Birth as entered in the Admission Register</div>
                                    <div className="col-5 fw-bold">
                                        : {isEditing ? 
                                            <input 
                                                type="date" 
                                                name="dateOfBirth" 
                                                value={formData.dateOfBirth} 
                                                onChange={handleInputChange} 
                                                className="form-control form-control-sm"
                                                disabled={!isEditing}
                                            /> 
                                            : formatDate(formData.dateOfBirth)}
                                    </div>
                                </div>

                                <div className="row mb-2">
                                    <div className="col-7">8. Date of Admission & Standard in which admitted</div>
                                    <div className="col-5 fw-bold">
                                        : {isEditing ? (
                                            <div className="d-flex gap-1">
                                                <input 
                                                    type="date" 
                                                    name="dateOfAdmission" 
                                                    value={formData.dateOfAdmission} 
                                                    onChange={handleInputChange} 
                                                    className="form-control form-control-sm"
                                                    disabled={!isEditing}
                                                />
                                                <input 
                                                    name="standardOnAdmission" 
                                                    placeholder="Std" 
                                                    value={formData.standardOnAdmission || 'I'} 
                                                    onChange={handleInputChange} 
                                                    className="form-control form-control-sm w-25"
                                                    disabled={!isEditing}
                                                />
                                            </div>
                                            ) : `${formatDate(formData.dateOfAdmission)} (${formData.standardOnAdmission || 'I'})`}
                                    </div>
                                </div>

                                <div className="row mb-2">
                                    <div className="col-7">9. Standard in which the pupil was studying at the time of leaving</div>
                                    <div className="col-5 fw-bold">
                                        : {isEditing ? 
                                            <input 
                                                name="standardStudied" 
                                                value={formData.standardStudied} 
                                                onChange={handleInputChange} 
                                                className="form-control form-control-sm"
                                                disabled={!isEditing}
                                            /> 
                                            : formData.standardStudied}
                                    </div>
                                </div>

                                <div className="row mb-2">
                                    <div className="col-7">10. Whether Qualified for Promotion</div>
                                    <div className="col-5 fw-bold">
                                        : {isEditing ? 
                                            <input 
                                                name="qualifiedForPromotion" 
                                                value={formData.qualifiedForPromotion} 
                                                onChange={handleInputChange} 
                                                className="form-control form-control-sm"
                                                disabled={!isEditing}
                                            /> 
                                            : formData.qualifiedForPromotion}
                                    </div>
                                </div>

                                <div className="row mb-2">
                                    <div className="col-7">11. Whether the pupil has paid all the fees due to the School</div>
                                    <div className="col-5 fw-bold">
                                        : {isEditing ? 
                                            <input 
                                                name="feesPaid" 
                                                value={formData.feesPaid} 
                                                onChange={handleInputChange} 
                                                className="form-control form-control-sm"
                                                disabled={!isEditing}
                                            /> 
                                            : formData.feesPaid}
                                    </div>
                                </div>

                            </div>
                            
                            <div className="mt-5 text-center text-muted small">
                                <em>(Continued on Page 2...)</em>
                            </div>
                        </div>
                    )}


                    {currentPage === 2 && (
                        <div className="page-content fade-in">
                            <div className="row mb-2">
                                <div className="col-7">12. Whether the pupil was in receipt of any scholarship</div>
                                <div className="col-5 fw-bold">
                                    : {isEditing ? 
                                        <input 
                                            name="scholarship" 
                                            value={formData.scholarship} 
                                            onChange={handleInputChange} 
                                            className="form-control form-control-sm"
                                            disabled={!isEditing}
                                        /> 
                                        : formData.scholarship}
                                </div>
                            </div>

                            <div className="row mb-2">
                                <div className="col-7">13. Whether the pupil has undergone Medical Inspection</div>
                                <div className="col-5 fw-bold">
                                    : {isEditing ? 
                                        <input 
                                            name="medicalInspection" 
                                            value={formData.medicalInspection} 
                                            onChange={handleInputChange} 
                                            className="form-control form-control-sm"
                                            disabled={!isEditing}
                                        /> 
                                        : formData.medicalInspection}
                                </div>
                            </div>

                            <div className="row mb-2">
                                <div className="col-7">14. Date on which the pupil actually left the School</div>
                                <div className="col-5 fw-bold">
                                    : {isEditing ? 
                                        <input 
                                            type="date"
                                            name="dateLeftSchool" 
                                            value={formData.dateLeftSchool} 
                                            onChange={handleInputChange} 
                                            className="form-control form-control-sm"
                                            disabled={!isEditing}
                                        /> 
                                        : formatDate(formData.dateLeftSchool)}
                                </div>
                            </div>

                            <div className="row mb-2">
                                <div className="col-7">15. The pupil's Conduct and Character</div>
                                <div className="col-5 fw-bold">
                                    : {isEditing ? 
                                        <input 
                                            name="conductAndCharacter" 
                                            value={formData.conductAndCharacter} 
                                            onChange={handleInputChange} 
                                            className="form-control form-control-sm"
                                            disabled={!isEditing}
                                        /> 
                                        : formData.conductAndCharacter}
                                </div>
                            </div>

                            <div className="row mb-2">
                                <div className="col-7">16. Date on which application for Transfer Certificate was made</div>
                                <div className="col-5 fw-bold">
                                    : {isEditing ? 
                                        <input 
                                            type="date"
                                            name="applicationDate" 
                                            value={formData.applicationDate} 
                                            onChange={handleInputChange} 
                                            className="form-control form-control-sm"
                                            disabled={!isEditing}
                                        /> 
                                        : formatDate(formData.applicationDate)}
                                </div>
                            </div>

                            <div className="row mb-2">
                                <div className="col-7">17. Date of issue of Transfer Certificate</div>
                                <div className="col-5 fw-bold">
                                    : {isEditing ? 
                                        <input 
                                            type="date"
                                            name="issueDate" 
                                            value={formData.issueDate} 
                                            onChange={handleInputChange} 
                                            className="form-control form-control-sm"
                                            disabled={!isEditing}
                                        /> 
                                        : formatDate(formData.issueDate)}
                                </div>
                            </div>

                            <div className="row mt-4 mb-2">
                                <div className="col-12 fw-bold">18. Course of Study:</div>
                            </div>
                            
                            <table className="table table-bordered border-dark text-center" style={{fontSize: '11pt'}}>
                                <thead className="table-light">
                                    <tr>
                                        <th style={{width:'30%'}}>Name of School</th>
                                        <th style={{width:'15%'}}>Academic Year(s)</th>
                                        <th style={{width:'15%'}}>Standard(s)</th>
                                        <th style={{width:'20%'}}>First Language</th>
                                        <th style={{width:'20%'}}>Medium</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            {isEditing ? 
                                                <input 
                                                    name="nameOfSchool" 
                                                    value={formData.courseOfStudy.nameOfSchool} 
                                                    onChange={handleCourseOfStudyChange} 
                                                    className="form-control form-control-sm"
                                                    disabled={!isEditing}
                                                /> 
                                                : formData.courseOfStudy.nameOfSchool}
                                        </td>
                                        <td>
                                            {isEditing ? 
                                                <input 
                                                    name="academicYears" 
                                                    value={formData.courseOfStudy.academicYears} 
                                                    onChange={handleCourseOfStudyChange} 
                                                    className="form-control form-control-sm"
                                                    disabled={!isEditing}
                                                /> 
                                                : formData.courseOfStudy.academicYears}
                                        </td>
                                        <td>
                                            {isEditing ? 
                                                <input 
                                                    name="standardsStudied" 
                                                    value={formData.courseOfStudy.standardsStudied} 
                                                    onChange={handleCourseOfStudyChange} 
                                                    className="form-control form-control-sm"
                                                    disabled={!isEditing}
                                                /> 
                                                : formData.courseOfStudy.standardsStudied}
                                        </td>
                                        <td>
                                            {isEditing ? 
                                                <input 
                                                    name="firstLanguage" 
                                                    value={formData.courseOfStudy.firstLanguage} 
                                                    onChange={handleCourseOfStudyChange} 
                                                    className="form-control form-control-sm"
                                                    disabled={!isEditing}
                                                /> 
                                                : formData.courseOfStudy.firstLanguage}
                                        </td>
                                        <td>
                                            {isEditing ? 
                                                <input 
                                                    name="mediumOfInstruction" 
                                                    value={formData.courseOfStudy.mediumOfInstruction} 
                                                    onChange={handleCourseOfStudyChange} 
                                                    className="form-control form-control-sm"
                                                    disabled={!isEditing}
                                                /> 
                                                : formData.courseOfStudy.mediumOfInstruction}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="row mt-3">
                                <div className="col-12"><strong>19. Identification Marks:</strong></div>
                                <div className="col-12 ps-4 mt-1">
                                    1) {isEditing ? 
                                        <input 
                                            name="identificationMark1" 
                                            value={formData.identificationMark1} 
                                            onChange={handleInputChange} 
                                            className="form-control form-control-sm d-inline w-75"
                                            disabled={!isEditing}
                                        /> 
                                        : formData.identificationMark1}
                                </div>
                                <div className="col-12 ps-4 mt-1">
                                    2) {isEditing ? 
                                        <input 
                                            name="identificationMark2" 
                                            value={formData.identificationMark2} 
                                            onChange={handleInputChange} 
                                            className="form-control form-control-sm d-inline w-75"
                                            disabled={!isEditing}
                                        /> 
                                        : formData.identificationMark2}
                                </div>
                            </div>

                            <div className="row mt-5 pt-5">
                                <div className="col-12 fw-bold text-center">
                                    20. Signature of the Headmaster with Date and School Seal
                                </div>
                            </div>

                            <div className="border-top border-dark border-2 mt-4 pt-4">
                                <div className="fw-bold text-decoration-underline mb-2">Note:</div>
                                <ol className="small ps-4">
                                    <li>Erasures and unauthorized or fraudulent alterations in the Certificate will lead to its cancellation.</li>
                                    <li>Should be signed in ink by the Head of the Institution.</li>
                                </ol>

                                <div className="text-center fw-bold mt-4 border border-dark p-2 bg-light">Declaration by the Parent or Guardian</div>
                                <p className="mt-2 text-justify">
                                    I hereby declare that the particulars recorded against items 2 to 7 are correct and that no change will be demanded by me in future.
                                </p>

                                <div className="row mt-5">
                                    <div className="col-6">Signature of the Candidate</div>
                                    <div className="col-6 text-end">Signature of the Parent / Guardian</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* HIDDEN PRINT SECTION (Matches PDF Generation & Native Print) */}
            <div id="print-section-container" style={{ position: "absolute", left: "-9999px", top: 0 }}>
                {/* PRINT PAGE 1 */}
                <div ref={page1Ref} className="print-page-ref" style={{ width: "210mm", height: "297mm", padding: "15mm", background: "white", fontFamily: '"Times New Roman", Times, serif', fontSize: '13pt', color: '#000' }}>
                    <div className="text-center mb-5">
                        <h1 style={{fontSize: '18pt', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px'}}>Transfer Certificate</h1>
                        <p style={{fontSize: '14pt', fontWeight: 'bold', margin: 0}}>Government of Tamil Nadu</p>
                        <p style={{margin: 0}}>Department of School Education</p>
                        <p style={{fontSize: '10pt', fontStyle: 'italic'}}>(Recognized by the Director of School Education)</p>
                    </div>

                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', fontWeight:'bold', fontSize:'12pt'}}>
                        <span>Aadhar No: {formData.aadharNo}</span>
                        <span>EMIS No: {formData.emisNo}</span>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'30px', fontWeight:'bold', fontSize:'12pt'}}>
                        <span>Serial No: {formData.serialNo}</span>
                        <span>Admission No: {formData.admissionNo}</span>
                    </div>

                    <div style={{lineHeight: '1.8'}}>
                         <div style={{display:'flex', marginBottom:'8px'}}>
                            <div style={{width:'65%'}}>1. (a) Name of the School</div>
                            <div style={{width:'35%', fontWeight:'bold'}}>: {formData.schoolName}</div>
                         </div>
                         <div style={{display:'flex', marginBottom:'8px'}}>
                            <div style={{width:'65%', paddingLeft:'20px'}}>(b) Name of the Educational District</div>
                            <div style={{width:'35%', fontWeight:'bold'}}>: {formData.educationalDistrict}</div>
                         </div>
                         <div style={{display:'flex', marginBottom:'8px'}}>
                            <div style={{width:'65%', paddingLeft:'20px'}}>(c) Name of the Revenue District</div>
                            <div style={{width:'35%', fontWeight:'bold'}}>: {formData.revenueDistrict}</div>
                         </div>
                         <div style={{display:'flex', marginBottom:'8px'}}>
                            <div style={{width:'65%'}}>2. Name of the Pupil (in Block Letters)</div>
                            <div style={{width:'35%', fontWeight:'bold', textTransform:'uppercase'}}>: {formData.studentName}</div>
                         </div>
                         <div style={{display:'flex', marginBottom:'8px'}}>
                            <div style={{width:'65%'}}>3. Name of the Father or Mother</div>
                            <div style={{width:'35%', fontWeight:'bold'}}>: {formData.fatherOrMotherName}</div>
                         </div>
                         <div style={{display:'flex', marginBottom:'8px'}}>
                            <div style={{width:'65%'}}>4. Nationality, Religion & Caste</div>
                            <div style={{width:'35%', fontWeight:'bold'}}>: {formData.nationality} - {formData.religion} - {formData.caste}</div>
                         </div>
                         <div style={{display:'flex', marginBottom:'8px'}}>
                            <div style={{width:'65%'}}>5. Community</div>
                            <div style={{width:'35%', fontWeight:'bold'}}>: {formData.community}</div>
                         </div>
                         <div style={{display:'flex', marginBottom:'2px'}}>
                            <div style={{width:'65%', paddingLeft:'20px'}}>Whether He/She belongs to:</div>
                         </div>
                         <div style={{display:'flex', marginBottom:'2px'}}>
                            <div style={{width:'65%', paddingLeft:'40px'}}>(a) Adi Dravidar (SC/ST)</div>
                            <div style={{width:'35%', fontWeight:'bold'}}>: {communityOptions.a ? "✔ Yes" : "-"}</div>
                         </div>
                         <div style={{display:'flex', marginBottom:'2px'}}>
                            <div style={{width:'65%', paddingLeft:'40px'}}>(b) Backward Class</div>
                            <div style={{width:'35%', fontWeight:'bold'}}>: {communityOptions.b ? "✔ Yes" : "-"}</div>
                         </div>
                         <div style={{display:'flex', marginBottom:'2px'}}>
                            <div style={{width:'65%', paddingLeft:'40px'}}>(c) Most Backward Class</div>
                            <div style={{width:'35%', fontWeight:'bold'}}>: {communityOptions.c ? "✔ Yes" : "-"}</div>
                         </div>
                         <div style={{display:'flex', marginBottom:'8px'}}>
                            <div style={{width:'65%', paddingLeft:'40px'}}>(d) Converted to Christianity from SC</div>
                            <div style={{width:'35%', fontWeight:'bold'}}>: {communityOptions.d ? "✔ Yes" : "-"}</div>
                         </div>
                         <div style={{display:'flex', marginBottom:'8px'}}>
                            <div style={{width:'65%'}}>6. Sex</div>
                            <div style={{width:'35%', fontWeight:'bold'}}>: {formData.gender}</div>
                         </div>
                         <div style={{display:'flex', marginBottom:'8px'}}>
                            <div style={{width:'65%'}}>7. Date of Birth</div>
                            <div style={{width:'35%', fontWeight:'bold'}}>: {formatDate(formData.dateOfBirth)}</div>
                         </div>
                         <div style={{display:'flex', marginBottom:'8px'}}>
                            <div style={{width:'65%'}}>8. Date of Admission & Standard</div>
                            <div style={{width:'35%', fontWeight:'bold'}}>: {formatDate(formData.dateOfAdmission)} ({formData.standardOnAdmission})</div>
                         </div>
                         <div style={{display:'flex', marginBottom:'8px'}}>
                            <div style={{width:'65%'}}>9. Standard in which pupil was studying</div>
                            <div style={{width:'35%', fontWeight:'bold'}}>: {formData.standardStudied}</div>
                         </div>
                         <div style={{display:'flex', marginBottom:'8px'}}>
                            <div style={{width:'65%'}}>10. Whether Qualified for Promotion</div>
                            <div style={{width:'35%', fontWeight:'bold'}}>: {formData.qualifiedForPromotion}</div>
                         </div>
                         <div style={{display:'flex', marginBottom:'8px'}}>
                            <div style={{width:'65%'}}>11. Whether Fees Paid</div>
                            <div style={{width:'35%', fontWeight:'bold'}}>: {formData.feesPaid}</div>
                         </div>
                    </div>
                </div>

                {/* PRINT PAGE 2 */}
                <div ref={page2Ref} className="print-page-ref" style={{ width: "210mm", height: "297mm", padding: "15mm", background: "white", fontFamily: '"Times New Roman", Times, serif', fontSize: '13pt', color: '#000' }}>
                    <div style={{lineHeight: '1.8'}}>
                         <div style={{display:'flex', marginBottom:'8px'}}>
                            <div style={{width:'65%'}}>12. Scholarship Receipt</div>
                            <div style={{width:'35%', fontWeight:'bold'}}>: {formData.scholarship}</div>
                         </div>
                         <div style={{display:'flex', marginBottom:'8px'}}>
                            <div style={{width:'65%'}}>13. Medical Inspection</div>
                            <div style={{width:'35%', fontWeight:'bold'}}>: {formData.medicalInspection}</div>
                         </div>
                         <div style={{display:'flex', marginBottom:'8px'}}>
                            <div style={{width:'65%'}}>14. Date Left School</div>
                            <div style={{width:'35%', fontWeight:'bold'}}>: {formatDate(formData.dateLeftSchool)}</div>
                         </div>
                         <div style={{display:'flex', marginBottom:'8px'}}>
                            <div style={{width:'65%'}}>15. Conduct and Character</div>
                            <div style={{width:'35%', fontWeight:'bold'}}>: {formData.conductAndCharacter}</div>
                         </div>
                         <div style={{display:'flex', marginBottom:'8px'}}>
                            <div style={{width:'65%'}}>16. Application Date</div>
                            <div style={{width:'35%', fontWeight:'bold'}}>: {formatDate(formData.applicationDate)}</div>
                         </div>
                         <div style={{display:'flex', marginBottom:'8px'}}>
                            <div style={{width:'65%'}}>17. Issue Date</div>
                            <div style={{width:'35%', fontWeight:'bold'}}>: {formatDate(formData.issueDate)}</div>
                         </div>

                         <div style={{marginTop:'20px', marginBottom:'10px', fontWeight:'bold'}}>18. Course of Study:</div>
                         <table style={{width:'100%', borderCollapse:'collapse', border:'1px solid black', textAlign:'center', fontSize:'11pt'}}>
                             <thead>
                                 <tr>
                                     <th style={{border:'1px solid black', padding:'5px'}}>School</th>
                                     <th style={{border:'1px solid black', padding:'5px'}}>Year</th>
                                     <th style={{border:'1px solid black', padding:'5px'}}>Standard</th>
                                     <th style={{border:'1px solid black', padding:'5px'}}>Lang</th>
                                     <th style={{border:'1px solid black', padding:'5px'}}>Medium</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 <tr>
                                     <td style={{border:'1px solid black', padding:'5px'}}>{formData.courseOfStudy.nameOfSchool}</td>
                                     <td style={{border:'1px solid black', padding:'5px'}}>{formData.courseOfStudy.academicYears}</td>
                                     <td style={{border:'1px solid black', padding:'5px'}}>{formData.courseOfStudy.standardsStudied}</td>
                                     <td style={{border:'1px solid black', padding:'5px'}}>{formData.courseOfStudy.firstLanguage}</td>
                                     <td style={{border:'1px solid black', padding:'5px'}}>{formData.courseOfStudy.mediumOfInstruction}</td>
                                 </tr>
                             </tbody>
                         </table>

                         <div style={{marginTop:'20px'}}><strong>19. Identification Marks:</strong></div>
                         <div style={{paddingLeft:'20px'}}>1) {formData.identificationMark1}</div>
                         <div style={{paddingLeft:'20px'}}>2) {formData.identificationMark2}</div>
                    </div>

                    <div style={{marginTop:'50px', textAlign:'center', fontWeight:'bold'}}>
                        20. Signature of the Headmaster with Date and School Seal
                    </div>

                    <div style={{marginTop:'50px', borderTop:'2px solid black', paddingTop:'20px'}}>
                         <div style={{fontWeight:'bold', textDecoration:'underline'}}>Declaration by Parent:</div>
                         <p style={{textAlign:'justify'}}>I hereby declare that the particulars recorded against items 2 to 7 are correct and that no change will be demanded by me in future.</p>
                         
                         <div style={{display:'flex', justifyContent:'space-between', marginTop:'60px'}}>
                            <div>Signature of Candidate</div>
                            <div>Signature of Parent/Guardian</div>
                         </div>
                    </div>
                </div>
            </div>

        </Container>
    </MainContentPage>
  )
}

export default TenthCertificate