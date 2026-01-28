"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Container,
  Grid,
  TextField,
  Button,
  Paper,
  Typography,
  MenuItem,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Box,
  Divider,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  QrCode as QrCodeIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Search as SearchIcon
} from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { QRCodeSVG } from "qrcode.react";
import QRCode from "qrcode";
import { useParams } from "react-router-dom";

// --- CUSTOM IMPORTS ---
import { useUserContext } from "../../../Context/UserContext"; 
import { ENDPOINTS } from "../../../SpringBoot/config"; 
import defaultStudentPhoto from "../../../images/StudentProfileIcon/studentProfile.jpeg"; 

const Student_Admission = () => {
  // --- CONTEXT ---
  const { 
    schoolId, 
    currentAcademicYear, 
    getAuthHeaders, 
    getAuthToken 
  } = useUserContext();

  // --- UI STATES ---
  const [loading, setLoading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  
  // --- DATA STATES ---
  const [setupData, setSetupData] = useState({
    nationalities: [], religions: [], communities: [], castes: [],
    districts: [], states: [], sections: [], motherTongues: [],
    studentCategories: [], courses: [], parentOccupations: [],
    bloodGroups: [], boardingPoints: [], busRoutes: []
  });
  
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [enquiryNumbers, setEnquiryNumbers] = useState([]);

  // --- FEE STATES ---
  const [feeDetails, setFeeDetails] = useState([]);
  const [hostelFeeDetails, setHostelFeeDetails] = useState([]);
  const [busFeeDetails, setBusFeeDetails] = useState(null);
  const [isBusFeeLoading, setIsBusFeeLoading] = useState(false);
  
  // --- TOGGLES ---
  const [isBusRequired, setIsBusRequired] = useState(false);
  const [isHostelRequired, setIsHostelRequired] = useState(false);

  // --- PHOTO & QR ---
  const [photoPreview, setPhotoPreview] = useState(defaultStudentPhoto);
  const [photoFile, setPhotoFile] = useState(null);
  const [qrCodeData, setQRCodeData] = useState("");
  const [hasExistingPhoto, setHasExistingPhoto] = useState(false);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState("");
  
  const fileInputRef = useRef(null);

  // --- FORM DATA INITIAL STATE ---
  // Defined here so we can easily reset to it
  const initialFormState = {
    enquiryKey: "", 
    admissionNumber: "", // We will keep the generated number though
    studentName: "", fatherName: "", motherName: "",
    streetVillage: "", placePincode: "", district: "", state: "",
    phoneNumber: "", phoneNumber2: "", emailId: "",
    communicationAddress: "", 
    nationality: "", religion: "", community: "", caste: "", 
    studentType: "New", studentCategory: "",
    standard: "", section: "", gender: "", dateOfBirth: "",
    emis: "", lunchRefresh: "", bloodGroup: "", 
    dateOfAdmission: new Date().toISOString().split('T')[0],
    motherTongue: "", fatherOccupation: "", motherOccupation: "",
    examNumber: "", 
    busFee: "0.00", hostelFee: "0.00", tutionFees: "0.00",
    studiedYear: "", classLastStudied: "", classToBeAdmitted: "",
    nameOfSchool: "", remarks: "", 
    identificationMark1: "", identificationMark2: "",
    aadharNumber: "", boardingPoint: "", busRouteNumber: ""
  };

  const [formData, setFormData] = useState(initialFormState);

  // --- 1. FETCH SETUP DATA ---
  const fetchSetupData = async () => {
    if (!schoolId) return;
    try {
      const endpoints = [
        "nationalities", "religions", "communities", "castes", 
        "districts", "states", "sections", "mothertongues", 
        "studentcategories", "courses", "parentoccupations", 
        "bloodgroups", "busfees"
      ];

      const promises = endpoints.map(ep => 
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/${ep}?schoolId=${schoolId}`, { 
          headers: getAuthHeaders() 
        }).then(res => res.ok ? res.json() : [])
      );

      const results = await Promise.all(promises);

      const busData = results[12] || [];
      const uniquePoints = [...new Set(busData.map(i => i.boardingPoint))].filter(Boolean);
      const uniqueRoutes = [...new Set(busData.map(i => i.route))].filter(Boolean);

      setSetupData({
        nationalities: results[0], religions: results[1], communities: results[2],
        castes: results[3], districts: results[4], states: results[5],
        sections: results[6], motherTongues: results[7], studentCategories: results[8],
        courses: results[9], parentOccupations: results[10], bloodGroups: results[11],
        boardingPoints: uniquePoints.map(p => ({ placeName: p })),
        busRoutes: uniqueRoutes.map(r => ({ route: r }))
      });

    } catch (error) {
      toast.error("Failed to load dropdown data");
    }
  };

  // --- 2. FETCH ENQUIRY NUMBERS ---
  const fetchEnquiryNumbers = async () => {
    if (!schoolId) return;
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/enquiry/school/${schoolId}?academicYear=${currentAcademicYear || '2024-2025'}`,
        { headers: getAuthHeaders() }
      );
      if (response.ok) {
        const enquiries = await response.json();
        setEnquiryNumbers(enquiries.map(e => e.enquiryKey).filter(Boolean));
      }
    } catch (error) { console.error(error); }
  };

  // --- 3. FETCH ENQUIRY DATA ---
  const fetchEnquiryData = async (enquiryKey) => {
    if (!schoolId || !enquiryKey) return;
    setLoading(true);
    try {
        const response = await fetch(
            `${ENDPOINTS.admissionmaster}/enquiry/school/${schoolId}?academicYear=${currentAcademicYear || '2024-2025'}`,
            { headers: getAuthHeaders() }
        );
        if (response.ok) {
            const enquiries = await response.json();
            const data = enquiries.find(e => e.enquiryKey === enquiryKey);
            if (data) {
                setFormData(prev => ({
                    ...prev,
                    ...initialFormState, 
                    enquiryKey: data.enquiryKey,
                    admissionNumber: prev.admissionNumber, 
                    studentName: data.studentName || "",
                    fatherName: data.fatherName || "",
                    motherName: data.motherName || "",
                    streetVillage: data.streetVillage || "",
                    placePincode: data.placePincode || "",
                    district: data.district || "",
                    state: data.state || "",
                    phoneNumber: data.phoneNumber || "",
                    phoneNumber2: data.phoneNumber2 || "",
                    emailId: data.emailId || "",
                    communicationAddress: data.communicationAddress || "",
                    nationality: data.nationality || "",
                    religion: data.religion || "",
                    community: data.community || "",
                    caste: data.caste || "",
                    studentType: data.studentType || "New",
                    studentCategory: data.studentCategory || "",
                    standard: data.standard || "",
                    section: data.section || "",
                    gender: data.gender || "",
                    dateOfBirth: data.dateOfBirth || "",
                    emis: data.emis || "",
                    bloodGroup: data.bloodGroup || "",
                    motherTongue: data.motherTongue || "",
                    fatherOccupation: data.fatherOccupation || "",
                    motherOccupation: data.motherOccupation || "",
                    examNumber: data.examNumber || "",
                    studiedYear: data.studiedYear || "",
                    classLastStudied: data.classLastStudied || "",
                    classToBeAdmitted: data.classToBeAdmitted || "",
                    nameOfSchool: data.nameOfSchool || "",
                    remarks: data.remarks || "",
                    identificationMark1: data.identificationMark1 || "",
                    identificationMark2: data.identificationMark2 || "",
                    aadharNumber: data.aadharNumber || "",
                    boardingPoint: data.boardingPoint || "",
                    busRouteNumber: data.busRouteNumber || "",
                }));
                
                if (data.studentPhoto) {
                    const photoUrl = `${ENDPOINTS.admissionmaster}/enquiry/${data.id}/photo?schoolId=${schoolId}&t=${Date.now()}`;
                    setPhotoPreview(photoUrl);
                    setHasExistingPhoto(true);
                    setExistingPhotoUrl(photoUrl);
                }

                if(data.boardingPoint && data.busRouteNumber) setIsBusRequired(true);
                if(data.lunchRefresh) setIsHostelRequired(true);

                if(data.state) fetchDistrictsByState(data.state);
                if(data.standard && data.studentCategory) {
                    fetchAllFees(data.standard, data.studentCategory);
                    if(data.lunchRefresh) fetchHostelFees(data.standard, data.studentCategory);
                }
                if(data.boardingPoint && data.busRouteNumber) fetchBusFee(data.boardingPoint, data.busRouteNumber);

                toast.success("Enquiry data loaded");
            }
        }
    } catch(e) { toast.error("Failed to load enquiry"); }
    finally { setLoading(false); }
  };

  const urlToFile = async (url, filename) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new File([blob], filename, { type: blob.type });
    } catch (error) { return null; }
  };

  // --- 4. FETCH DISTRICTS ---
  const fetchDistrictsByState = async (stateName) => {
    if (!schoolId || !stateName) {
      setFilteredDistricts([]);
      return;
    }
    try {
      const stateObj = setupData.states.find(s => s.name === stateName);
      if (!stateObj) return;

      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/districts/bystate?schoolId=${schoolId}&stateId=${stateObj.id}`,
        { headers: getAuthHeaders() }
      );
      if (response.ok) setFilteredDistricts(await response.json());
    } catch (error) { console.error(error); }
  };

  // --- 5. GENERATE ADMISSION NUMBER ---
  const generateAdmissionNumber = useCallback(async () => {
    if (!schoolId) return;
    const num = `ADM${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData(prev => ({ ...prev, admissionNumber: num }));
  }, [schoolId]);

  // --- 6. FEE LOGIC ---
  const fetchAllFees = async (standard, category) => {
    if (!schoolId || !standard || !category) return;
    try {
      const res = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/allfees?schoolId=${schoolId}&standard=${standard}&studentCategory=${category}`,
        { headers: getAuthHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        setFeeDetails(data);
        const total = data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        setFormData(prev => ({ ...prev, tutionFees: total.toFixed(2) }));
      }
    } catch (e) { console.error(e); }
  };

  const fetchHostelFees = async (standard, category) => {
    if (!schoolId || !standard || !category) return;
    try {
      const res = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/hostelfees?schoolId=${schoolId}&standard=${standard}&studentCategory=${category}`,
        { headers: getAuthHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        setHostelFeeDetails(data);
        const total = data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        setFormData(prev => ({ ...prev, hostelFee: total.toFixed(2) }));
      }
    } catch (e) { console.error(e); }
  };

  const fetchBusFee = async (point, route) => {
    if (!schoolId || !point || !route) return;
    setIsBusFeeLoading(true);
    try {
      const res = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/busfee?schoolId=${schoolId}&boardingPoint=${point}&routeNumber=${route}`,
        { headers: getAuthHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        setBusFeeDetails(data);
        setFormData(prev => ({ ...prev, busFee: (data.amount || 0).toFixed(2) }));
      } else {
        setFormData(prev => ({ ...prev, busFee: "0.00" }));
        toast.warning("No fee found for this route");
      }
    } catch (e) { console.error(e); }
    finally { setIsBusFeeLoading(false); }
  };

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "state") {
        setFormData(prev => ({ ...prev, state: value, district: "" }));
        fetchDistrictsByState(value);
        return;
    }
    
    if (name === "enquiryKey" && value) {
        fetchEnquiryData(value);
    }

    if (name === "standard" || name === "studentCategory") {
      const std = name === "standard" ? value : formData.standard;
      const cat = name === "studentCategory" ? value : formData.studentCategory;
      if (std && cat) {
        fetchAllFees(std, cat);
        if (isHostelRequired) fetchHostelFees(std, cat);
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleBus = (e) => {
      const checked = e.target.checked;
      setIsBusRequired(checked);
      if (!checked) {
          setFormData(prev => ({ ...prev, busFee: "0.00", boardingPoint: "", busRouteNumber: "" }));
          setBusFeeDetails(null);
      }
  };

  const handleToggleHostel = (e) => {
      const checked = e.target.checked;
      setIsHostelRequired(checked);
      if (!checked) {
          setFormData(prev => ({ ...prev, hostelFee: "0.00", lunchRefresh: "" }));
          setHostelFeeDetails([]);
      } else if (formData.standard && formData.studentCategory) {
          fetchHostelFees(formData.standard, formData.studentCategory);
      }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error("Max 5MB allowed");
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
      setHasExistingPhoto(false);
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    if (isBusRequired && formData.boardingPoint && formData.busRouteNumber) {
        const timer = setTimeout(() => {
            fetchBusFee(formData.boardingPoint, formData.busRouteNumber);
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [isBusRequired, formData.boardingPoint, formData.busRouteNumber]);

  useEffect(() => {
    if (formData.admissionNumber && formData.studentName && formData.standard) {
      const qrStr = `ID:${formData.admissionNumber}|NAME:${formData.studentName}|CLASS:${formData.standard}-${formData.section}|PHONE:${formData.phoneNumber}`;
      setQRCodeData(qrStr);
    }
  }, [formData.admissionNumber, formData.studentName, formData.standard, formData.section, formData.phoneNumber]);

  useEffect(() => {
    if (schoolId) {
      fetchSetupData();
      fetchEnquiryNumbers();
      generateAdmissionNumber();
    }
  }, [schoolId]);

  // --- ROBUST CLEAR FORM LOGIC ---
  const handleClear = () => {
      // 1. Reset Toggles & UI
      setIsBusRequired(false);
      setIsHostelRequired(false);
      
      // 2. Reset Photo & QR
      setPhotoPreview(defaultStudentPhoto);
      setPhotoFile(null);
      setHasExistingPhoto(false);
      setExistingPhotoUrl("");
      setQRCodeData("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      // 3. Reset Fees & Lists
      setFeeDetails([]);
      setHostelFeeDetails([]);
      setBusFeeDetails(null);
      setFilteredDistricts([]); 

      // 4. Reset All Form Data
      setFormData(initialFormState);

      // 5. Generate NEW Admission Number (Wait a tick to ensure state update)
      setTimeout(() => generateAdmissionNumber(), 50);

      toast.info("Form fully cleared.");
  };

  // --- SUBMIT ---
  const handleSubmit = async () => {
    if (!formData.studentName || !formData.admissionNumber || !formData.standard) {
        return toast.error("Please fill required fields (Name, Standard)");
    }

    setLoading(true);
    const formPayload = new FormData();

    const admissionJson = {
       ...formData,
       schoolId: schoolId,
       academicYear: currentAcademicYear || "2024-2025",
       qrCodeData: qrCodeData,
       lunchRefresh: isHostelRequired ? "Hostel Required" : "",
       busFee: isBusRequired ? formData.busFee : "0.00",
       hostelFee: isHostelRequired ? formData.hostelFee : "0.00",
       boardingPoint: isBusRequired ? formData.boardingPoint : "",
       busRouteNumber: isBusRequired ? formData.busRouteNumber : "",
    };

    formPayload.append("admissionData", JSON.stringify(admissionJson));
    
    if (photoFile) {
        formPayload.append("studentPhoto", photoFile);
    } else if (hasExistingPhoto && existingPhotoUrl) {
        try {
            const photoFileFromUrl = await urlToFile(existingPhotoUrl, `student-photo.jpg`);
            if (photoFileFromUrl) formPayload.append("studentPhoto", photoFileFromUrl);
        } catch(e) { console.error(e); }
    }

    try {
      const url = `${ENDPOINTS.admissionmaster}/admission/with-photo?schoolId=${schoolId}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Authorization": `Bearer ${getAuthToken()}` },
        body: formPayload
      });

      if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Submission Failed");
      }
      
      toast.success("Admission Successful!");
      handleClear(); // RESET FORM
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const t = parseFloat(formData.tutionFees) || 0;
    const h = isHostelRequired ? (parseFloat(formData.hostelFee) || 0) : 0;
    const b = isBusRequired ? (parseFloat(formData.busFee) || 0) : 0;
    return (t + h + b).toFixed(2);
  };

  const handleDownloadQR = async () => {
      try {
          const canvas = document.createElement('canvas');
          const size = 300;
          canvas.width = size;
          canvas.height = size + 50;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0,0, canvas.width, canvas.height);
  
          const qrUrl = await QRCode.toDataURL(qrCodeData, { width: 300, margin: 2 });
          const img = new Image();
          img.src = qrUrl;
          img.onload = () => {
              ctx.drawImage(img, 0, 0);
              ctx.font = 'bold 16px Arial';
              ctx.fillStyle = '#000';
              ctx.textAlign = 'center';
              ctx.fillText(`${formData.studentName}`, size/2, size + 20);
              ctx.font = '14px Arial';
              ctx.fillText(`(${formData.admissionNumber})`, size/2, size + 40);
              
              const link = document.createElement('a');
              link.download = `QR-${formData.admissionNumber}.png`;
              link.href = canvas.toDataURL();
              link.click();
          }
      } catch(e) { toast.error("QR Download Failed"); }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2, borderLeft: '6px solid #1976d2' }}>
        <Typography variant="h4" color="primary" fontWeight="bold">New Student Admission</Typography>
        <Typography variant="body2" color="textSecondary">
            Academic Year: {currentAcademicYear} | School ID: {schoolId}
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        
        {/* LEFT COLUMN: Photo & QR */}
        <Grid item xs={12} md={3}>
           <Paper elevation={3} sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>Student Photo</Typography>
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                <Avatar 
                  src={photoPreview} 
                  sx={{ width: 150, height: 150, margin: '0 auto', border: '4px solid #eee' }} 
                />
                <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handlePhotoChange} />
                <IconButton 
                    sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
                    onClick={() => fileInputRef.current.click()}
                >
                    <UploadIcon />
                </IconButton>
              </Box>
              <Typography variant="caption" display="block" color="textSecondary">Max size: 5MB</Typography>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>QR Preview</Typography>
              <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 2, mb: 2 }}>
                 {qrCodeData ? <QRCodeSVG value={qrCodeData} size={140} /> : <Typography variant="body2">Fill details</Typography>}
              </Box>
              <Button variant="outlined" startIcon={<QrCodeIcon />} fullWidth onClick={() => setShowQRModal(true)} disabled={!qrCodeData}>
                  View / Download
              </Button>
           </Paper>
        </Grid>

        {/* RIGHT COLUMN: Form Data */}
        <Grid item xs={12} md={9}>
           <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
              
              {/* Enquiry Search */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                 <Grid item xs={12}>
                     <TextField
                        select
                        label="Select Enquiry (Auto-fill)"
                        fullWidth
                        name="enquiryKey"
                        value={formData.enquiryKey}
                        onChange={handleInputChange}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
                        }}
                     >
                        <MenuItem value=""><em>None</em></MenuItem>
                        {enquiryNumbers.map(key => <MenuItem key={key} value={key}>{key}</MenuItem>)}
                     </TextField>
                 </Grid>
              </Grid>

              {/* 1. PERSONAL DETAILS */}
              <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 600 }}>1. Personal Details</Typography>
              <Grid container spacing={2}>
                 <Grid item xs={12} sm={4}>
                    <TextField label="Admission No" fullWidth value={formData.admissionNumber} name="admissionNumber" disabled variant="filled" InputLabelProps={{ shrink: true }} />
                 </Grid>
                 <Grid item xs={12} sm={4}>
                    <TextField label="Student Name" fullWidth required name="studentName" value={formData.studentName} onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
                 </Grid>
                 <Grid item xs={12} sm={4}>
                    <TextField label="Gender" select fullWidth name="gender" value={formData.gender} onChange={handleInputChange} InputLabelProps={{ shrink: true }}>
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Transgender">Transgender</MenuItem>
                    </TextField>
                 </Grid>
                 <Grid item xs={12} sm={4}>
                    <TextField label="Date of Birth" type="date" fullWidth name="dateOfBirth" InputLabelProps={{ shrink: true }} value={formData.dateOfBirth} onChange={handleInputChange} />
                 </Grid>
                 <Grid item xs={12} sm={4}>
                    <TextField label="Blood Group" select fullWidth name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} InputLabelProps={{ shrink: true }}>
                        {setupData.bloodGroups.map(bg => <MenuItem key={bg.id} value={bg.name}>{bg.name}</MenuItem>)}
                    </TextField>
                 </Grid>
                 <Grid item xs={12} sm={4}>
                    <TextField label="Aadhar Number" fullWidth name="aadharNumber" value={formData.aadharNumber} onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
                 </Grid>
                 <Grid item xs={12} sm={4}>
                    <TextField label="Mother Tongue" select fullWidth name="motherTongue" value={formData.motherTongue} onChange={handleInputChange} InputLabelProps={{ shrink: true }}>
                        {setupData.motherTongues.map(mt => <MenuItem key={mt.id} value={mt.name}>{mt.name}</MenuItem>)}
                    </TextField>
                 </Grid>
              </Grid>

              {/* 2. FAMILY DETAILS */}
              <Typography variant="h6" sx={{ mt: 4, mb: 2, color: '#1976d2', fontWeight: 600 }}>2. Family Details</Typography>
              <Grid container spacing={2}>
                 <Grid item xs={12} sm={6}>
                    <TextField label="Father's Name" fullWidth name="fatherName" value={formData.fatherName} onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
                 </Grid>
                 <Grid item xs={12} sm={6}>
                    <TextField label="Father's Occupation" select fullWidth name="fatherOccupation" value={formData.fatherOccupation} onChange={handleInputChange} InputLabelProps={{ shrink: true }}>
                       {setupData.parentOccupations.map(p => <MenuItem key={p.id} value={p.name}>{p.name}</MenuItem>)}
                    </TextField>
                 </Grid>
                 <Grid item xs={12} sm={6}>
                    <TextField label="Mother's Name" fullWidth name="motherName" value={formData.motherName} onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
                 </Grid>
                 <Grid item xs={12} sm={6}>
                    <TextField label="Mother's Occupation" select fullWidth name="motherOccupation" value={formData.motherOccupation} onChange={handleInputChange} InputLabelProps={{ shrink: true }}>
                       {setupData.parentOccupations.map(p => <MenuItem key={p.id} value={p.name}>{p.name}</MenuItem>)}
                    </TextField>
                 </Grid>
              </Grid>

              {/* 3. CONTACT & ADDRESS */}
              <Typography variant="h6" sx={{ mt: 4, mb: 2, color: '#1976d2', fontWeight: 600 }}>3. Contact & Address</Typography>
              <Grid container spacing={2}>
                 <Grid item xs={12} sm={4}>
                    <TextField label="Primary Phone" fullWidth name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
                 </Grid>
                 <Grid item xs={12} sm={4}>
                    <TextField label="Secondary Phone" fullWidth name="phoneNumber2" value={formData.phoneNumber2} onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
                 </Grid>
                 <Grid item xs={12} sm={4}>
                    <TextField label="Email ID" fullWidth name="emailId" value={formData.emailId} onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
                 </Grid>
                 <Grid item xs={12} sm={4}>
                    <TextField label="Street / Village" fullWidth name="streetVillage" value={formData.streetVillage} onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
                 </Grid>
                 <Grid item xs={12} sm={4}>
                    <TextField label="Place / Pincode" fullWidth name="placePincode" value={formData.placePincode} onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
                 </Grid>
                 <Grid item xs={12} sm={4}>
                    <TextField label="State" select fullWidth name="state" value={formData.state} onChange={handleInputChange} InputLabelProps={{ shrink: true }}>
                        {setupData.states.map(s => <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>)}
                    </TextField>
                 </Grid>
                 <Grid item xs={12} sm={4}>
                    <TextField label="District" select fullWidth name="district" value={formData.district} onChange={handleInputChange} disabled={!formData.state} InputLabelProps={{ shrink: true }}>
                        {filteredDistricts.map(d => <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>)}
                    </TextField>
                 </Grid>
                 <Grid item xs={12}>
                    <TextField label="Communication Address" fullWidth multiline rows={2} name="communicationAddress" value={formData.communicationAddress} onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
                 </Grid>
              </Grid>

              {/* 4. ACADEMIC DETAILS */}
              <Typography variant="h6" sx={{ mt: 4, mb: 2, color: '#1976d2', fontWeight: 600 }}>4. Academic Details</Typography>
              <Grid container spacing={2}>
                 <Grid item xs={12} sm={4}>
                    <TextField label="Student Type" select fullWidth name="studentType" value={formData.studentType} onChange={handleInputChange} InputLabelProps={{ shrink: true }}>
                        <MenuItem value="New">New</MenuItem>
                        <MenuItem value="Existing">Existing</MenuItem>
                    </TextField>
                 </Grid>
                 <Grid item xs={12} sm={4}>
                    <TextField label="Student Category" select fullWidth name="studentCategory" value={formData.studentCategory} onChange={handleInputChange} InputLabelProps={{ shrink: true }}>
                        {setupData.studentCategories.map(c => <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>)}
                    </TextField>
                 </Grid>
                 <Grid item xs={12} sm={4}>
                    <TextField label="Standard" select fullWidth name="standard" value={formData.standard} onChange={handleInputChange} InputLabelProps={{ shrink: true }}>
                        {setupData.courses.map(c => <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>)}
                    </TextField>
                 </Grid>
                 <Grid item xs={12} sm={4}>
                    <TextField label="Section" select fullWidth name="section" value={formData.section} onChange={handleInputChange} InputLabelProps={{ shrink: true }}>
                        {setupData.sections.map(s => <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>)}
                    </TextField>
                 </Grid>
                 <Grid item xs={12} sm={4}>
                    <TextField label="Date of Admission" type="date" fullWidth name="dateOfAdmission" InputLabelProps={{ shrink: true }} value={formData.dateOfAdmission} onChange={handleInputChange} />
                 </Grid>
                 <Grid item xs={12} sm={4}>
                    <TextField label="EMIS Number" fullWidth name="emis" value={formData.emis} onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
                 </Grid>
                 <Grid item xs={12} sm={4}>
                    <TextField label="Exam Number" fullWidth name="examNumber" value={formData.examNumber} onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
                 </Grid>
              </Grid>

              {/* 5. PREVIOUS HISTORY & REMARKS */}
              <Typography variant="h6" sx={{ mt: 4, mb: 2, color: '#1976d2', fontWeight: 600 }}>5. Previous History & Remarks</Typography>
              <Grid container spacing={2}>
                 <Grid item xs={12} sm={3}>
                    <TextField label="Studied Year" fullWidth name="studiedYear" value={formData.studiedYear} onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
                 </Grid>
                 <Grid item xs={12} sm={3}>
                    <TextField label="Class Last Studied" select fullWidth name="classLastStudied" value={formData.classLastStudied} onChange={handleInputChange} InputLabelProps={{ shrink: true }}>
                        {setupData.courses.map(c => <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>)}
                    </TextField>
                 </Grid>
                 <Grid item xs={12} sm={3}>
                    <TextField label="Class To Be Admitted" select fullWidth name="classToBeAdmitted" value={formData.classToBeAdmitted} onChange={handleInputChange} InputLabelProps={{ shrink: true }}>
                        {setupData.courses.map(c => <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>)}
                    </TextField>
                 </Grid>
                 <Grid item xs={12} sm={3}>
                    <TextField label="Previous School Name" fullWidth name="nameOfSchool" value={formData.nameOfSchool} onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
                 </Grid>
                 <Grid item xs={12} sm={6}>
                    <TextField label="Identification Mark 1" fullWidth name="identificationMark1" value={formData.identificationMark1} onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
                 </Grid>
                 <Grid item xs={12} sm={6}>
                    <TextField label="Identification Mark 2" fullWidth name="identificationMark2" value={formData.identificationMark2} onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
                 </Grid>
                 <Grid item xs={12}>
                    <TextField label="Remarks" fullWidth multiline rows={2} name="remarks" value={formData.remarks} onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
                 </Grid>
              </Grid>

              {/* 6. SOCIOLOGICAL DETAILS */}
              <Typography variant="h6" sx={{ mt: 4, mb: 2, color: '#1976d2', fontWeight: 600 }}>6. Sociological Details</Typography>
              <Grid container spacing={2}>
                 <Grid item xs={12} sm={3}>
                    <TextField label="Religion" select fullWidth name="religion" value={formData.religion} onChange={handleInputChange} InputLabelProps={{ shrink: true }}>
                        {setupData.religions.map(r => <MenuItem key={r.id} value={r.name}>{r.name}</MenuItem>)}
                    </TextField>
                 </Grid>
                 <Grid item xs={12} sm={3}>
                    <TextField label="Community" select fullWidth name="community" value={formData.community} onChange={handleInputChange} InputLabelProps={{ shrink: true }}>
                        {setupData.communities.map(c => <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>)}
                    </TextField>
                 </Grid>
                 <Grid item xs={12} sm={3}>
                    <TextField label="Caste" select fullWidth name="caste" value={formData.caste} onChange={handleInputChange} InputLabelProps={{ shrink: true }}>
                        {setupData.castes.map(c => <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>)}
                    </TextField>
                 </Grid>
                 <Grid item xs={12} sm={3}>
                    <TextField label="Nationality" select fullWidth name="nationality" value={formData.nationality} onChange={handleInputChange} InputLabelProps={{ shrink: true }}>
                        {setupData.nationalities.map(n => <MenuItem key={n.id} value={n.name}>{n.name}</MenuItem>)}
                    </TextField>
                 </Grid>
              </Grid>

              {/* 7. FACILITIES */}
              <Typography variant="h6" sx={{ mt: 4, mb: 2, color: '#1976d2', fontWeight: 600 }}>7. Facilities</Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                          <FormControlLabel 
                            control={<Switch checked={isBusRequired} onChange={handleToggleBus} />} 
                            label="Bus Transport Required" 
                          />
                          {isBusRequired && (
                              <Grid container spacing={2} sx={{ mt: 1 }}>
                                  <Grid item xs={12}>
                                      <TextField label="Boarding Point" select fullWidth name="boardingPoint" value={formData.boardingPoint} onChange={handleInputChange} InputLabelProps={{ shrink: true }}>
                                          {setupData.boardingPoints.map((p,i) => <MenuItem key={i} value={p.placeName}>{p.placeName}</MenuItem>)}
                                      </TextField>
                                  </Grid>
                                  <Grid item xs={12}>
                                      <TextField label="Route Number" select fullWidth name="busRouteNumber" value={formData.busRouteNumber} onChange={handleInputChange} InputLabelProps={{ shrink: true }}>
                                          {setupData.busRoutes.map((r,i) => <MenuItem key={i} value={r.route}>{r.route}</MenuItem>)}
                                      </TextField>
                                  </Grid>
                                  {isBusFeeLoading && <Typography variant="caption" color="primary" sx={{ pl: 2 }}>Fetching Bus Fee...</Typography>}
                              </Grid>
                          )}
                      </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                      <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                          <FormControlLabel 
                            control={<Switch checked={isHostelRequired} onChange={handleToggleHostel} />} 
                            label="Hostel Facility Required" 
                          />
                          {isHostelRequired && <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>Hostel fees applied based on category.</Typography>}
                      </Paper>
                  </Grid>
              </Grid>

              {/* 8. FEE STRUCTURE */}
              <Typography variant="h6" sx={{ mt: 4, mb: 2, color: '#1976d2', fontWeight: 600 }}>8. Fee Structure</Typography>
              <TableContainer component={Paper} variant="outlined">
                 <Table size="small">
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell><strong>Type</strong></TableCell>
                            <TableCell><strong>Description</strong></TableCell>
                            <TableCell align="right"><strong>Amount (₹)</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {/* Tuition Fees */}
                        {feeDetails.map((fee, i) => (
                            <TableRow key={`tf-${i}`}>
                                <TableCell>Tuition</TableCell>
                                <TableCell>{fee.feeHeading}</TableCell>
                                <TableCell align="right">{parseFloat(fee.amount).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                             <TableCell colSpan={2}><strong>Tuition Subtotal</strong></TableCell>
                             <TableCell align="right"><strong>{formData.tutionFees}</strong></TableCell>
                        </TableRow>
                        {/* Bus Fees */}
                        {isBusRequired && (
                             <TableRow>
                                  <TableCell>Transport</TableCell>
                                  <TableCell>Bus Fee ({formData.boardingPoint})</TableCell>
                                  <TableCell align="right">{formData.busFee}</TableCell>
                             </TableRow>
                        )}
                        {/* Hostel Fees */}
                        {isHostelRequired && hostelFeeDetails.map((fee, i) => (
                             <TableRow key={`hf-${i}`}>
                                <TableCell>Hostel</TableCell>
                                <TableCell>{fee.feeHeading}</TableCell>
                                <TableCell align="right">{parseFloat(fee.amount).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                        {/* Grand Total */}
                        <TableRow sx={{ bgcolor: '#1976d2' }}>
                             <TableCell colSpan={2} sx={{ color: 'white', fontSize: '1.1rem' }}><strong>GRAND TOTAL</strong></TableCell>
                             <TableCell align="right" sx={{ color: 'white', fontSize: '1.1rem' }}><strong>₹ {calculateTotal()}</strong></TableCell>
                        </TableRow>
                    </TableBody>
                 </Table>
              </TableContainer>

              {/* Actions */}
              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                 <Button variant="outlined" color="error" startIcon={<ClearIcon />} onClick={handleClear}>Clear Form</Button>
                 <Button variant="contained" size="large" startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />} onClick={handleSubmit} disabled={loading}>
                    {loading ? "Processing..." : "Submit Admission"}
                 </Button>
              </Box>

           </Paper>
        </Grid>
      </Grid>

      {/* QR Modal */}
      <Dialog open={showQRModal} onClose={() => setShowQRModal(false)}>
         <DialogTitle>Student QR Code</DialogTitle>
         <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
             <QRCodeSVG value={qrCodeData} size={250} />
             <Typography variant="h6" sx={{ mt: 2, fontWeight: 'bold' }}>{formData.studentName}</Typography>
             <Typography>{formData.admissionNumber}</Typography>
         </DialogContent>
         <DialogActions>
             <Button onClick={() => setShowQRModal(false)}>Close</Button>
             <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownloadQR}>Download PNG</Button>
         </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Student_Admission;