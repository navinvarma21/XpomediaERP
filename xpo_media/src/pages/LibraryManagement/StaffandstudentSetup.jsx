"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainContentPage from "../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container, Table, Modal } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEdit, FaTrash, FaEye, FaSearch, FaUserGraduate, FaChalkboardTeacher } from "react-icons/fa";
import { useAuthContext } from "../../Context/AuthContext";
import { ENDPOINTS } from "../../SpringBoot/config";
import axios from "axios";

// --- ADD MODAL COMPONENT ---
const AddStaffStudentModal = ({ isOpen, onClose, onConfirm, states, districts, staffList, studentList, existingRecords }) => {
  const [searchType, setSearchType] = useState("none"); // "staff", "student", "none"
  const [searchCode, setSearchCode] = useState("");
  
  // Form Fields
  const [recordCode, setRecordCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [numberStreetName, setNumberStreetName] = useState("");
  const [placePinCode, setPlacePinCode] = useState("");
  const [stateId, setStateId] = useState("");
  const [state, setState] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [district, setDistrict] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [recordType, setRecordType] = useState("STAFF"); // "STAFF" or "STUDENT"
  const [originalId, setOriginalId] = useState(""); // Staff Code or Admission Number

  // Helper to get the next sequence number
  const getNextSequenceNumber = () => {
    if (!existingRecords || existingRecords.length === 0) return 1;

    const nums = existingRecords
      .map(r => {
        const match = r.recordCode.match(/SS-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n));
    
    return nums.length > 0 ? Math.max(...nums) + 1 : 1;
  };

  // Reset form when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      const nextNum = getNextSequenceNumber();
      setRecordCode(`SS-${nextNum}`);
      setSearchType("none");
      setSearchCode("");
      setOriginalId("");
      setRecordType("STAFF");
    } else {
      resetForm();
    }
  }, [isOpen, existingRecords]);

  const resetForm = () => {
    setSearchType("none");
    setSearchCode("");
    setRecordCode("");
    setFullName("");
    setNumberStreetName("");
    setPlacePinCode("");
    setStateId("");
    setState("");
    setDistrictId("");
    setDistrict("");
    setPhoneNumber("");
    setEmail("");
    setContactPerson("");
    setRecordType("STAFF");
    setOriginalId("");
  };

  const handleSearch = () => {
    if (!searchCode.trim() || searchType === "none") return;

    if (searchType === "staff") {
      const matchedStaff = staffList.find(
        (s) => s.staffCode && s.staffCode.toLowerCase() === searchCode.toLowerCase()
      );

      if (matchedStaff) {
        // Auto-fill from staff record
        setFullName(matchedStaff.name || "");
        setNumberStreetName(matchedStaff.numberStreetName || "");
        setPlacePinCode(matchedStaff.placePinCode || "");
        setPhoneNumber(matchedStaff.mobileNumber || "");
        setEmail(matchedStaff.emailBankAcId || "");
        setContactPerson(matchedStaff.familyHeadName || "");
        setRecordType("STAFF");
        setOriginalId(matchedStaff.staffCode);
        
        // Generate code: SS{Num}-STAFF-{StaffCode}
        const nextNum = getNextSequenceNumber();
        setRecordCode(`SS${nextNum}-STAFF-${matchedStaff.staffCode}`);
        
        toast.success("Staff details loaded!");
      } else {
        toast.warning("Staff code not found.");
        const nextNum = getNextSequenceNumber();
        setRecordCode(`SS-${nextNum}`);
      }
    } 
    else if (searchType === "student") {
      const matchedStudent = studentList.find(
        (s) => s.admissionNumber && s.admissionNumber.toLowerCase() === searchCode.toLowerCase()
      );

      if (matchedStudent) {
        // Auto-fill from student record
        setFullName(matchedStudent.studentName || "");
        setNumberStreetName(matchedStudent.address || "");
        setPlacePinCode(matchedStudent.pincode || "");
        setPhoneNumber(matchedStudent.phoneNumber || "");
        setEmail(matchedStudent.emailId || "");
        setContactPerson(matchedStudent.fatherName || "");
        setRecordType("STUDENT");
        setOriginalId(matchedStudent.admissionNumber);
        
        // Generate code: SS{Num}-STU-{AdmissionNumber}
        const nextNum = getNextSequenceNumber();
        setRecordCode(`SS${nextNum}-STU-${matchedStudent.admissionNumber}`);
        
        toast.success("Student details loaded!");
      } else {
        toast.warning("Student admission number not found.");
        const nextNum = getNextSequenceNumber();
        setRecordCode(`SS-${nextNum}`);
      }
    }
  };

  const handleStateSelect = (e) => {
    const selectedStateId = e.target.value;
    const selectedState = states.find(s => String(s.id) === String(selectedStateId));
    setStateId(selectedStateId);
    setState(selectedState ? selectedState.name : "");
    setDistrictId(""); 
    setDistrict("");
  };

  const handleDistrictSelect = (e) => {
    const selectedDistrictId = e.target.value;
    const selectedDistrict = districts.find(d => String(d.id) === String(selectedDistrictId));
    setDistrictId(selectedDistrictId);
    setDistrict(selectedDistrict ? selectedDistrict.name : "");
  };

  const handleSubmit = () => {
    if (!fullName.trim()) {
      toast.error("Full Name is required.");
      return;
    }
    if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
      toast.error("Phone Number must be 10 digits.");
      return;
    }
    
    onConfirm({
      recordCode,
      fullName,
      numberStreetName,
      placePinCode,
      stateId,
      state,
      districtId,
      district,
      phoneNumber,
      email,
      contactPerson,
      recordType,
      originalId,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Add Staff / Student</h2>
        <div className="modal-body">
          {/* Search Type Selection */}
          <Row className="mb-3 pb-3 border-bottom">
            <Col xs={12}>
              <Form.Label className="fw-bold text-primary">
                <FaChalkboardTeacher className="me-2" /> Is this a Staff Member? 
                <FaUserGraduate className="ms-4 me-2" /> Or a Student?
              </Form.Label>
              <div className="d-flex gap-3 mb-2">
                <Button 
                  variant={searchType === "staff" ? "primary" : "outline-primary"}
                  onClick={() => setSearchType("staff")}
                  className="d-flex align-items-center"
                >
                  <FaChalkboardTeacher className="me-2" /> Staff
                </Button>
                <Button 
                  variant={searchType === "student" ? "success" : "outline-success"}
                  onClick={() => setSearchType("student")}
                  className="d-flex align-items-center"
                >
                  <FaUserGraduate className="me-2" /> Student
                </Button>
                <Button 
                  variant={searchType === "none" ? "secondary" : "outline-secondary"}
                  onClick={() => setSearchType("none")}
                >
                  None (Manual Entry)
                </Button>
              </div>
              
              {/* Search Input */}
              {searchType !== "none" && (
                <div className="d-flex gap-2 mt-2">
                  <Form.Control
                    type="text"
                    placeholder={searchType === "staff" ? "Enter Staff Code (e.g. STF-101)" : "Enter Admission Number"}
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="custom-input"
                  />
                  <Button variant="info" onClick={handleSearch} className="text-white d-flex align-items-center">
                    <FaSearch className="me-2" /> Search
                  </Button>
                </div>
              )}
            </Col>
          </Row>

          {/* Record Type Display */}
          <Row className="mb-3">
            <Col xs={12}>
              <div className={`p-2 rounded ${recordType === 'STAFF' ? 'bg-primary text-white' : 'bg-success text-white'}`}>
                <strong>Record Type: </strong>
                {recordType === 'STAFF' ? (
                  <><FaChalkboardTeacher className="me-2" /> STAFF</>
                ) : (
                  <><FaUserGraduate className="me-2" /> STUDENT</>
                )}
                {originalId && (
                  <span className="ms-3">
                    <strong>Original ID: </strong>{originalId}
                  </span>
                )}
              </div>
            </Col>
          </Row>

          <Row>
            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Record Code (Auto)</Form.Label>
                <Form.Control
                  type="text"
                  value={recordCode}
                  readOnly
                  className="custom-input fw-bold bg-light"
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Full Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="custom-input"
                  required
                />
              </Form.Group>
            </Col>
           
            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Phone Number</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter Phone Number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="custom-input"
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="custom-input"
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Number & Street Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter Address"
                  value={numberStreetName}
                  onChange={(e) => setNumberStreetName(e.target.value)}
                  className="custom-input"
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Place/Pin Code</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter Place/Pin Code"
                  value={placePinCode}
                  onChange={(e) => setPlacePinCode(e.target.value)}
                  className="custom-input"
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">State</Form.Label>
                <Form.Select 
                    value={stateId} 
                    onChange={handleStateSelect}
                    className="custom-input"
                >
                    <option value="">Select State</option>
                    {states.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">District</Form.Label>
                <Form.Select 
                    value={districtId} 
                    onChange={handleDistrictSelect}
                    className="custom-input"
                    disabled={!stateId}
                >
                    <option value="">Select District</option>
                    {districts
                        .filter(d => String(d.stateId) === String(stateId))
                        .map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Contact Person</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter Contact Person"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="custom-input"
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Record Type</Form.Label>
                <Form.Select 
                  value={recordType} 
                  onChange={(e) => setRecordType(e.target.value)}
                  className="custom-input"
                >
                  <option value="STAFF">Staff</option>
                  <option value="STUDENT">Student</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </div>
        <div className="modal-footer">
          <Button className="modal-button cancel" onClick={onClose}>
            Cancel
          </Button>
          <Button className="modal-button confirm" onClick={handleSubmit}>
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- EDIT MODAL COMPONENT ---
const EditStaffStudentModal = ({ isOpen, onClose, onConfirm, record, states, districts }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if(record) setFormData(record);
    }, [record]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }

    const handleStateSelect = (e) => {
        const selectedStateId = e.target.value;
        const selectedState = states.find(s => String(s.id) === String(selectedStateId));
        setFormData(prev => ({ 
            ...prev, 
            stateId: selectedStateId, 
            state: selectedState?.name || "", 
            districtId: "", 
            district: "" 
        }));
    };

    const handleDistrictSelect = (e) => {
        const selectedDistrictId = e.target.value;
        const selectedDistrict = districts.find(d => String(d.id) === String(selectedDistrictId));
        setFormData(prev => ({ 
            ...prev, 
            districtId: selectedDistrictId, 
            district: selectedDistrict?.name || "" 
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 className="modal-title">Edit Staff / Student</h2>
                <div className="modal-body">
                    <Row>
                        <Col xs={12} md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Record Code</Form.Label>
                                <Form.Control type="text" value={formData.recordCode || ""} readOnly className="custom-input bg-light" />
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Full Name</Form.Label>
                                <Form.Control type="text" value={formData.fullName || ""} onChange={e => handleChange("fullName", e.target.value)} className="custom-input" />
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Phone</Form.Label>
                                <Form.Control type="text" value={formData.phoneNumber || ""} onChange={e => handleChange("phoneNumber", e.target.value)} className="custom-input" />
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Email</Form.Label>
                                <Form.Control type="email" value={formData.email || ""} onChange={e => handleChange("email", e.target.value)} className="custom-input" />
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Address</Form.Label>
                                <Form.Control type="text" value={formData.numberStreetName || ""} onChange={e => handleChange("numberStreetName", e.target.value)} className="custom-input" />
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Place/Pin</Form.Label>
                                <Form.Control type="text" value={formData.placePinCode || ""} onChange={e => handleChange("placePinCode", e.target.value)} className="custom-input" />
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">State</Form.Label>
                                <Form.Select value={formData.stateId || ""} onChange={handleStateSelect} className="custom-input">
                                    <option value="">Select State</option>
                                    {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">District</Form.Label>
                                <Form.Select value={formData.districtId || ""} onChange={handleDistrictSelect} className="custom-input" disabled={!formData.stateId}>
                                    <option value="">Select District</option>
                                    {districts.filter(d => String(d.stateId) === String(formData.stateId)).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Contact Person</Form.Label>
                                <Form.Control type="text" value={formData.contactPerson || ""} onChange={e => handleChange("contactPerson", e.target.value)} className="custom-input" />
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Record Type</Form.Label>
                                <Form.Select value={formData.recordType || "STAFF"} onChange={e => handleChange("recordType", e.target.value)} className="custom-input">
                                    <option value="STAFF">Staff</option>
                                    <option value="STUDENT">Student</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                </div>
                <div className="modal-footer">
                    <Button className="modal-button cancel" onClick={onClose}>Cancel</Button>
                    <Button className="modal-button confirm" onClick={() => onConfirm(formData)}>Update</Button>
                </div>
            </div>
        </div>
    );
};

// --- VIEW MODAL ---
const ViewStaffStudentModal = ({ isOpen, onClose, record }) => {
  if (!isOpen || !record) return null;
  
  const getTypeBadge = (type) => {
    return type === 'STAFF' ? 
      <span className="badge bg-primary"><FaChalkboardTeacher className="me-1" /> STAFF</span> :
      <span className="badge bg-success"><FaUserGraduate className="me-1" /> STUDENT</span>;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Staff/Student Details</h2>
        <div className="modal-body">
            <Table bordered className="table-sm">
                <tbody>
                    <tr><td className="fw-bold">Record Code</td><td>{record.recordCode}</td></tr>
                    <tr><td className="fw-bold">Type</td><td>{getTypeBadge(record.recordType)}</td></tr>
                    <tr><td className="fw-bold">Full Name</td><td>{record.fullName}</td></tr>
                    <tr><td className="fw-bold">Phone</td><td>{record.phoneNumber}</td></tr>
                    <tr><td className="fw-bold">Email</td><td>{record.email}</td></tr>
                    <tr><td className="fw-bold">Address</td><td>{record.numberStreetName}, {record.placePinCode}</td></tr>
                    <tr><td className="fw-bold">Region</td><td>{record.district}, {record.state}</td></tr>
                    <tr><td className="fw-bold">Contact Person</td><td>{record.contactPerson}</td></tr>
                    {record.originalId && (
                      <tr><td className="fw-bold">Original ID</td><td>{record.originalId}</td></tr>
                    )}
                </tbody>
            </Table>
        </div>
        <div className="modal-footer">
          <Button className="modal-button cancel" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

// --- DELETE MODAL ---
const DeleteStaffStudentModal = ({ isOpen, onClose, onConfirm, record }) => {
  if (!isOpen || !record) return null;
  
  const getTypeIcon = () => {
    return record.recordType === 'STAFF' ? 
      <FaChalkboardTeacher className="me-2" /> : 
      <FaUserGraduate className="me-2" />;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Delete Record</h2>
        <div className="modal-body text-center">
          <p>Are you sure you want to delete this record?</p>
          <p className="fw-bold fs-5">
            {getTypeIcon()}
            {record.fullName} ({record.recordCode})
          </p>
          <p className="text-muted">This action cannot be undone.</p>
        </div>
        <div className="modal-footer">
          <Button className="modal-button cancel" onClick={onClose}>Cancel</Button>
          <Button className="modal-button delete" onClick={() => onConfirm(record.id)}>Delete</Button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
const StaffAndStudentSetup = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [recordList, setRecordList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState("ALL"); // "ALL", "STAFF", "STUDENT"
  
  const { user, currentAcademicYear, schoolId } = useAuthContext();

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
    "X-School-ID": schoolId,
    "X-Academic-Year": currentAcademicYear,
  });

  useEffect(() => {
    if (user && currentAcademicYear && schoolId) {
      fetchRecordList();
      fetchStaffList();
      fetchStudentList();
      fetchStates();
      fetchDistricts();
    }
  }, [user, currentAcademicYear, schoolId]);

  const fetchRecordList = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${ENDPOINTS.administration}/staffstudent?schoolId=${schoolId}&academicYear=${currentAcademicYear}`, { 
        headers: getAuthHeaders() 
      });
      if (response.ok) {
        const data = await response.json();
        setRecordList(data);
      }
    } catch (error) { 
      toast.error("Failed to fetch records");
    } finally { 
      setLoading(false); 
    }
  };

  const fetchStaffList = async () => {
    try {
      const response = await fetch(`${ENDPOINTS.administration}/staff?schoolId=${schoolId}&academicYear=${currentAcademicYear}`, { 
        headers: getAuthHeaders() 
      });
      if (response.ok) {
        const data = await response.json();
        setStaffList(data);
      }
    } catch (error) { 
      console.error("Failed to fetch staff list:", error);
      // For testing - mock data
      setStaffList([
        { staffCode: "STF-101", name: "John Teacher", mobileNumber: "9876543210", emailBankAcId: "john@school.com" },
        { staffCode: "STF-102", name: "Jane Admin", mobileNumber: "9876543211", emailBankAcId: "jane@school.com" }
      ]);
    }
  };

  const fetchStudentList = async () => {
    try {
      const response = await fetch(`${ENDPOINTS.admissionmaster}/studentreport/datas?schoolId=${schoolId}&academicYear=${currentAcademicYear}`, { 
        headers: getAuthHeaders() 
      });
      if (response.ok) {
        const data = await response.json();
        setStudentList(data);
      }
    } catch (error) { 
      console.error("Failed to fetch student list:", error);
      // For testing - mock data
      setStudentList([
        { admissionNumber: "ADM-2024-001", studentName: "Rahul Kumar", phoneNumber: "9876543222", emailId: "rahul@student.com" },
        { admissionNumber: "ADM-2024-002", studentName: "Priya Sharma", phoneNumber: "9876543233", emailId: "priya@student.com" }
      ]);
    }
  };

  const fetchStates = async () => {
    try {
      const res = await axios.get(`${ENDPOINTS.administration}/statedistrict/state/${schoolId}`, {
         headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
      });
      if (res.data && res.data.length > 0) {
        setStates(res.data.map(s => ({ id: s.id, name: s.name })));
      }
    } catch (error) { 
        console.error("Failed to fetch states:", error);
    }
  };

  const fetchDistricts = async () => {
    try {
      const res = await axios.get(`${ENDPOINTS.administration}/statedistrict/district/${schoolId}`, {
         headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
      });
      if (res.data && res.data.length > 0) {
        setDistricts(res.data.map(d => ({ id: d.id, name: d.name, stateId: d.stateId })));
      }
    } catch (error) { 
        console.error("Failed to fetch districts:", error);
    }
  };

  const handleAddRecord = async (data) => {
    try {
      const response = await fetch(`${ENDPOINTS.administration}/staffstudent`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...data, schoolId, academicYear: currentAcademicYear }),
      });
      if (!response.ok) throw new Error("Failed to add");
      setIsAddModalOpen(false);
      toast.success("Record added successfully!");
      fetchRecordList();
    } catch (error) { 
      toast.error("Failed to add record: " + error.message);
    }
  };

  const handleEditRecord = async (data) => {
    try {
      const response = await fetch(`${ENDPOINTS.administration}/staffstudent/${data.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...data, schoolId, academicYear: currentAcademicYear }),
      });
      if (!response.ok) throw new Error("Failed to update");
      setIsEditModalOpen(false);
      toast.success("Record updated successfully!");
      fetchRecordList();
    } catch (error) { 
      toast.error("Failed to update record");
    }
  };

  const handleDeleteRecord = async (id) => {
    try {
      const response = await fetch(`${ENDPOINTS.administration}/staffstudent/${id}?schoolId=${schoolId}`, { 
        method: "DELETE", 
        headers: getAuthHeaders() 
      });
      if (!response.ok) throw new Error("Failed to delete");
      setIsDeleteModalOpen(false);
      toast.success("Record deleted successfully!");
      fetchRecordList();
    } catch (error) { 
      toast.error("Failed to delete record");
    }
  };

  // Filter records based on search term and type
  const filteredList = recordList.filter(record => {
    const matchesSearch = 
      record.recordCode?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      record.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.phoneNumber?.includes(searchTerm) ||
      record.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "ALL" || record.recordType === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Stats
  const staffCount = recordList.filter(r => r.recordType === "STAFF").length;
  const studentCount = recordList.filter(r => r.recordType === "STUDENT").length;

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link> &gt; 
          <span>Administration</span> &gt; 
          <span className="current">Staff & Student Setup</span>
        </nav>
        
        {/* Stats Cards */}
        <Row className="mb-4">
          <Col md={4}>
            <div className="card border-0 shadow-sm text-center">
              <div className="card-body py-4">
                <div className="text-primary display-6 fw-bold">{recordList.length}</div>
                <div className="text-muted">Total Records</div>
              </div>
            </div>
          </Col>
          <Col md={4}>
            <div className="card border-0 shadow-sm text-center">
              <div className="card-body py-4">
                <div className="text-primary display-6 fw-bold">{staffCount}</div>
                <div className="text-muted">Staff Records</div>
              </div>
            </div>
          </Col>
          <Col md={4}>
            <div className="card border-0 shadow-sm text-center">
              <div className="card-body py-4">
                <div className="text-primary display-6 fw-bold">{studentCount}</div>
                <div className="text-muted">Student Records</div>
              </div>
            </div>
          </Col>
        </Row>

        <div className="form-card mt-3 border-0 shadow-sm">
          <div className="header p-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: "#0B3D7B", color: "white" }}>
            <h2 className="m-0">
              <FaChalkboardTeacher className="me-2" />
              <FaUserGraduate className="me-2" />
              Staff & Student Setup
            </h2>
            <Button onClick={() => setIsAddModalOpen(true)} className="btn btn-light text-dark">
              + Add New
            </Button>
          </div>
          
          <div className="content-wrapper p-4">
            {/* Search and Filter Controls */}
            <Row className="mb-4">
              <Col md={6}>
                <div className="d-flex gap-2">
                  <Form.Control 
                    type="text" 
                    placeholder="Search by code, name, phone, or email..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                    className="custom-search"
                  />
                  <Button variant="danger" onClick={() => setSearchTerm("")}>
                    Clear
                  </Button>
                </div>
              </Col>
              <Col md={3}>
                <Form.Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                  <option value="ALL">All Types</option>
                  <option value="STAFF">Staff Only</option>
                  <option value="STUDENT">Student Only</option>
                </Form.Select>
              </Col>
              <Col md={3} className="text-end">
                <Button variant="outline-secondary" onClick={fetchRecordList} disabled={loading}>
                  {loading ? "Refreshing..." : "Refresh"}
                </Button>
              </Col>
            </Row>

            {/* Table */}
            <div className="table-responsive">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading records...</p>
                </div>
              ) : filteredList.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted">No records found</p>
                  <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                    Add Your First Record
                  </Button>
                </div>
              ) : (
                <Table bordered hover className="align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th>Code</th>
                      <th>Type</th>
                      <th>Full Name</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Address</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map(record => (
                      <tr key={record.id}>
                        <td className="fw-bold">{record.recordCode}</td>
                        <td>
                          {record.recordType === "STAFF" ? (
                            <span className="badge bg-primary"><FaChalkboardTeacher className="me-1" /> Staff</span>
                          ) : (
                            <span className="badge bg-success"><FaUserGraduate className="me-1" /> Student</span>
                          )}
                        </td>
                        <td>{record.fullName}</td>
                        <td>{record.phoneNumber}</td>
                        <td>{record.email}</td>
                        <td>
                          <small>
                            {record.numberStreetName && <div>{record.numberStreetName}</div>}
                            {record.placePinCode && <div className="text-muted">{record.placePinCode}</div>}
                          </small>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button 
                              variant="outline-info" 
                              size="sm" 
                              onClick={() => { setSelectedRecord(record); setIsViewModalOpen(true); }}
                              title="View Details"
                            >
                              <FaEye />
                            </Button>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => { setSelectedRecord(record); setIsEditModalOpen(true); }}
                              title="Edit"
                            >
                              <FaEdit />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => { setSelectedRecord(record); setIsDeleteModalOpen(true); }}
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
              )}
            </div>

            {/* Summary */}
            {filteredList.length > 0 && (
              <div className="mt-3 p-3 bg-light rounded">
                <Row>
                  <Col md={6}>
                    <strong>Showing {filteredList.length} of {recordList.length} records</strong>
                    <div className="small text-muted">
                      Staff: {staffCount} | Students: {studentCount}
                    </div>
                  </Col>
                  <Col md={6} className="text-end">
                    <small className="text-muted">
                      Data as of {new Date().toLocaleString()}
                    </small>
                  </Col>
                </Row>
              </div>
            )}
          </div>
        </div>
      </Container>
      
      {/* Modals */}
      <AddStaffStudentModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onConfirm={handleAddRecord} 
        states={states} 
        districts={districts} 
        staffList={staffList} 
        studentList={studentList}
        existingRecords={recordList}
      />
      
      <EditStaffStudentModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onConfirm={handleEditRecord} 
        record={selectedRecord} 
        states={states} 
        districts={districts} 
      />
      
      <ViewStaffStudentModal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        record={selectedRecord} 
      />
      
      <DeleteStaffStudentModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleDeleteRecord} 
        record={selectedRecord} 
      />
      
      <ToastContainer />
      
      <style>{`
        .modal-overlay { 
          position: fixed; 
          top: 0; 
          left: 0; 
          right: 0; 
          bottom: 0; 
          background: rgba(0,0,0,0.5); 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          z-index: 1100; 
        }
        .modal-content { 
          background: white; 
          padding: 25px; 
          border-radius: 10px; 
          width: 90%; 
          max-width: 900px; 
          max-height: 90vh; 
          overflow-y: auto; 
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        .modal-title {
          color: #0B3D7B;
          border-bottom: 2px solid #0B3D7B;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .modal-footer { 
          display: flex; 
          justify-content: flex-end; 
          align-items: center; 
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
        }
        .modal-button { 
          padding: 8px 20px; 
          border-radius: 5px; 
          border: none; 
          margin-left: 10px; 
          font-weight: 500;
          transition: all 0.3s;
        }
        .modal-button.confirm { 
          background: #0B3D7B; 
          color: white;
        }
        .modal-button.confirm:hover {
          background: #0a2d5c;
        }
        .modal-button.cancel { 
          background: #6c757d; 
          color: white;
        }
        .modal-button.cancel:hover {
          background: #5a6268;
        }
        .modal-button.delete { 
          background: #dc3545; 
          color: white;
        }
        .modal-button.delete:hover {
          background: #c82333;
        }
        .custom-input { 
          width: 100%; 
          padding: 10px 12px; 
          border: 1px solid #ced4da; 
          border-radius: 5px; 
          transition: border 0.3s;
        }
        .custom-input:focus {
          border-color: #0B3D7B;
          box-shadow: 0 0 0 0.2rem rgba(11, 61, 123, 0.25);
        }
        .custom-search {
          padding: 10px 15px;
          border-radius: 5px;
          border: 1px solid #ced4da;
        }
        .custom-breadcrumb {
          background-color: #f8f9fa;
          border-radius: 0.375rem;
          padding: 0.75rem 1rem;
          margin-bottom: 1rem;
        }
        .custom-breadcrumb a {
          color: #0B3D7B;
          text-decoration: none;
          font-weight: 500;
        }
        .custom-breadcrumb .separator {
          color: #6c757d;
        }
        .form-card {
          border: 1px solid #dee2e6;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        .form-card .header {
          background-color: #0B3D7B;
          color: white;
        }
      `}</style>
    </MainContentPage>
  );
};

export default StaffAndStudentSetup;