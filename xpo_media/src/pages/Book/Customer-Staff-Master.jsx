"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainContentPage from "../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container, Table, Modal } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEdit, FaTrash, FaEye, FaSearch } from "react-icons/fa";
import { useAuthContext } from "../../Context/AuthContext";
import { ENDPOINTS } from "../../SpringBoot/config";
import axios from "axios";

// --- ADD MODAL COMPONENT ---
const AddCustomerStaffModal = ({ isOpen, onClose, onConfirm, states, districts, staffList, existingCustomers }) => {
  // Separate field for searching staff
  const [staffSearchCode, setStaffSearchCode] = useState("");
  
  // Form Fields
  const [customerStaffCode, setCustomerStaffCode] = useState("");
  const [customerStaffName, setCustomerStaffName] = useState("");
  const [numberStreetName, setNumberStreetName] = useState("");
  const [placePinCode, setPlacePinCode] = useState("");
  const [stateId, setStateId] = useState("");
  const [state, setState] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [district, setDistrict] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [contactPerson, setContactPerson] = useState("");

  // Helper to get the next sequence number (e.g., 5 for CUST-5)
  const getNextSequenceNumber = () => {
    if (!existingCustomers || existingCustomers.length === 0) return 1;

    const nums = existingCustomers
      .map(c => {
        // Match numbers inside CUST-5 or CUST5-STF1
        const match = c.customerStaffCode.match(/CUST-?(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n));
    
    return nums.length > 0 ? Math.max(...nums) + 1 : 1;
  };

  // Reset form when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      // Generate default code on open
      const nextNum = getNextSequenceNumber();
      setCustomerStaffCode(`CUST-${nextNum}`);
    } else {
      // Clear all fields when closed
      resetForm();
    }
  }, [isOpen, existingCustomers]);

  const resetForm = () => {
    setStaffSearchCode("");
    setCustomerStaffCode("");
    setCustomerStaffName("");
    setNumberStreetName("");
    setPlacePinCode("");
    setStateId("");
    setState("");
    setDistrictId("");
    setDistrict("");
    setPhoneNumber("");
    setEmail("");
    setContactPerson("");
  };

  const handleStaffSearch = () => {
    if (!staffSearchCode.trim()) return;

    const matchedStaff = staffList.find(
      (s) => s.staffCode && s.staffCode.toLowerCase() === staffSearchCode.toLowerCase()
    );

    if (matchedStaff) {
      // 1. Auto-fill details
      setCustomerStaffName(matchedStaff.name || "");
      setNumberStreetName(matchedStaff.numberStreetName || "");
      setPlacePinCode(matchedStaff.placePinCode || "");
      
      // Reset dropdowns to allow user to re-select if needed, 
      // or implement logic to match IDs if available
      setStateId(""); setState(""); setDistrictId(""); setDistrict("");

      setPhoneNumber(matchedStaff.mobileNumber || "");
      setEmail(matchedStaff.emailBankAcId || "");
      setContactPerson(matchedStaff.familyHeadName || "");

      // 2. Update Code Format: CUST{Num}-{StaffCode}
      const nextNum = getNextSequenceNumber();
      setCustomerStaffCode(`CUST${nextNum}-${matchedStaff.staffCode}`);
      
      toast.info("Staff details loaded!");
    } else {
      toast.warning("Staff code not found.");
      // Revert to standard code if search fails
      const nextNum = getNextSequenceNumber();
      setCustomerStaffCode(`CUST-${nextNum}`);
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
    if (!customerStaffName.trim()) {
      toast.error("Customer/Staff Name is required.");
      return;
    }
    if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
      toast.error("Phone Number must be 10 digits.");
      return;
    }
    
    onConfirm({
      customerStaffCode,
      customerStaffName,
      numberStreetName,
      placePinCode,
      stateId,
      state,
      districtId,
      district,
      phoneNumber,
      email,
      contactPerson,
    });
    
    // Note: resetForm is called via useEffect when isOpen becomes false in parent
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Add Customer/Staff</h2>
        <div className="modal-body">
          {/* Dedicated Staff Search Field */}
          <Row className="mb-3 pb-3 border-bottom">
             <Col xs={12}>
                <Form.Label className="fw-bold text-primary">Is this a Staff Member?</Form.Label>
                <div className="d-flex gap-2">
                    <Form.Control
                        type="text"
                        placeholder="Enter Staff Code to Search (e.g. STF-101)"
                        value={staffSearchCode}
                        onChange={(e) => setStaffSearchCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleStaffSearch()}
                        className="custom-input"
                    />
                    <Button variant="info" onClick={handleStaffSearch} className="text-white">
                        <FaSearch /> Search
                    </Button>
                </div>
             </Col>
          </Row>

          <Row>
             <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Customer/Staff Code (Auto)</Form.Label>
                <Form.Control
                  type="text"
                  value={customerStaffCode}
                  readOnly
                  className="custom-input fw-bold bg-light"
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Customer/Staff Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter Name"
                  value={customerStaffName}
                  onChange={(e) => setCustomerStaffName(e.target.value)}
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
                <Form.Label className="fw-bold">Number & Street Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter Number & Street Name"
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
                <Form.Label className="fw-bold">E-Mail</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter E-Mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="custom-input"
                />
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
const EditCustomerStaffModal = ({ isOpen, onClose, onConfirm, customerStaff, states, districts }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if(customerStaff) setFormData(customerStaff);
    }, [customerStaff]);

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
                <h2 className="modal-title">Edit Customer/Staff</h2>
                <div className="modal-body">
                    <Row>
                        <Col xs={12} md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Code</Form.Label>
                                <Form.Control type="text" value={formData.customerStaffCode || ""} readOnly className="custom-input bg-light" />
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Name</Form.Label>
                                <Form.Control type="text" value={formData.customerStaffName || ""} onChange={e => handleChange("customerStaffName", e.target.value)} className="custom-input" />
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
                                <Form.Label className="fw-bold">Email</Form.Label>
                                <Form.Control type="email" value={formData.email || ""} onChange={e => handleChange("email", e.target.value)} className="custom-input" />
                            </Form.Group>
                        </Col>
                         <Col xs={12} md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Contact Person</Form.Label>
                                <Form.Control type="text" value={formData.contactPerson || ""} onChange={e => handleChange("contactPerson", e.target.value)} className="custom-input" />
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
const ViewCustomerStaffModal = ({ isOpen, onClose, customerStaff }) => {
  if (!isOpen || !customerStaff) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Details</h2>
        <div className="modal-body">
            <Table bordered>
                <tbody>
                    <tr><td>Code</td><td>{customerStaff.customerStaffCode}</td></tr>
                    <tr><td>Name</td><td>{customerStaff.customerStaffName}</td></tr>
                    <tr><td>Phone</td><td>{customerStaff.phoneNumber}</td></tr>
                    <tr><td>Email</td><td>{customerStaff.email}</td></tr>
                    <tr><td>Address</td><td>{customerStaff.numberStreetName}, {customerStaff.placePinCode}</td></tr>
                    <tr><td>Region</td><td>{customerStaff.district}, {customerStaff.state}</td></tr>
                </tbody>
            </Table>
        </div>
        <div className="modal-footer"><Button className="modal-button cancel" onClick={onClose}>Close</Button></div>
      </div>
    </div>
  );
};

// --- DELETE MODAL ---
const DeleteCustomerStaffModal = ({ isOpen, onClose, onConfirm, customerStaff }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Delete</h2>
        <div className="modal-body text-center"><p>Delete <strong>{customerStaff?.customerStaffName}</strong>?</p></div>
        <div className="modal-footer">
          <Button className="modal-button cancel" onClick={onClose}>Cancel</Button>
          <Button className="modal-button delete" onClick={() => onConfirm(customerStaff.id)}>Delete</Button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
const CustomerStaffMaster = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCustomerStaff, setSelectedCustomerStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerStaffList, setCustomerStaffList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  
  // State for Dynamic Dropdowns
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const { user, currentAcademicYear, schoolId } = useAuthContext();

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
    "X-School-ID": schoolId,
    "X-Academic-Year": currentAcademicYear,
  });

  useEffect(() => {
    if (user && currentAcademicYear && schoolId) {
      fetchCustomerStaffList();
      fetchStaffList();
      fetchStates();
      fetchDistricts();
    }
  }, [user, currentAcademicYear, schoolId]);

  const fetchCustomerStaffList = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${ENDPOINTS.store}/customerstaff?schoolId=${schoolId}&academicYear=${currentAcademicYear}`, { headers: getAuthHeaders() });
      if (response.ok) setCustomerStaffList(await response.json());
    } catch (error) { toast.error("Failed to fetch customer list"); }
    finally { setLoading(false); }
  };

  const fetchStaffList = async () => {
    try {
      const response = await fetch(`${ENDPOINTS.administration}/staff?schoolId=${schoolId}&academicYear=${currentAcademicYear}`, { headers: getAuthHeaders() });
      if (response.ok) setStaffList(await response.json());
    } catch (error) { console.error("Failed to fetch staff list"); }
  };

  // Dynamic Fetch for States
  const fetchStates = async () => {
    try {
      const res = await axios.get(`${ENDPOINTS.administration}/statedistrict/state/${schoolId}`, {
         headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
      });
      if (res.data && res.data.length > 0) {
        setStates(res.data.map(s => ({ id: s.id, name: s.name })));
      } else {
        setStates([]);
      }
    } catch (error) { 
        console.error("Failed to fetch states:", error);
    }
  };

  // Dynamic Fetch for Districts
  const fetchDistricts = async () => {
    try {
      const res = await axios.get(`${ENDPOINTS.administration}/statedistrict/district/${schoolId}`, {
         headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
      });
      if (res.data && res.data.length > 0) {
        setDistricts(res.data.map(d => ({ id: d.id, name: d.name, stateId: d.stateId })));
      } else {
        setDistricts([]);
      }
    } catch (error) { 
        console.error("Failed to fetch districts:", error);
    }
  };

  const handleAddCustomerStaff = async (data) => {
    try {
      const response = await fetch(`${ENDPOINTS.store}/customerstaff`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...data, schoolId, academicYear: currentAcademicYear }),
      });
      if (!response.ok) throw new Error("Failed");
      setIsAddModalOpen(false);
      toast.success("Added successfully!");
      fetchCustomerStaffList();
    } catch (error) { toast.error("Failed to add customer"); }
  };

  const handleEditCustomerStaff = async (data) => {
    try {
      const response = await fetch(`${ENDPOINTS.store}/customerstaff/${data.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...data, schoolId, academicYear: currentAcademicYear }),
      });
      if (!response.ok) throw new Error("Failed");
      setIsEditModalOpen(false);
      toast.success("Updated successfully!");
      fetchCustomerStaffList();
    } catch (error) { toast.error("Failed to update customer"); }
  };

  const handleDeleteCustomerStaff = async (id) => {
    try {
      const response = await fetch(`${ENDPOINTS.store}/customerstaff/${id}?schoolId=${schoolId}`, { method: "DELETE", headers: getAuthHeaders() });
      if (!response.ok) throw new Error("Failed");
      setIsDeleteModalOpen(false);
      toast.success("Deleted successfully!");
      fetchCustomerStaffList();
    } catch (error) { toast.error("Failed to delete customer"); }
  };

  const filteredList = customerStaffList.filter(cs => 
    cs.customerStaffCode?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    cs.customerStaffName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link> &gt; <span>Store</span> &gt; <span className="current">Customer / Staff Master</span>
        </nav>
        <div className="form-card mt-3">
          <div className="header p-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: "#0B3D7B", color: "white" }}>
            <h2 className="m-0">Customer / Staff Master</h2>
            <Button onClick={() => setIsAddModalOpen(true)} className="btn btn-light text-dark">+ Add</Button>
          </div>
          <div className="content-wrapper p-4">
            <div className="d-flex mb-3">
              <Form.Control type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="custom-search me-2" />
              <Button variant="danger" onClick={() => setSearchTerm("")}>Reset</Button>
            </div>
            <div className="table-responsive">
              <Table bordered hover>
                <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                  <tr><th>Code</th><th>Name</th><th>Phone</th><th>Email</th><th>Contact Person</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {filteredList.length === 0 ? <tr><td colSpan="6" className="text-center">No records found</td></tr> : 
                    filteredList.map(cs => (
                      <tr key={cs.id}>
                        <td>{cs.customerStaffCode}</td>
                        <td>{cs.customerStaffName}</td>
                        <td>{cs.phoneNumber}</td>
                        <td>{cs.email}</td>
                        <td>{cs.contactPerson}</td>
                        <td>
                          <Button variant="link" className="text-success" onClick={() => { setSelectedCustomerStaff(cs); setIsViewModalOpen(true); }}><FaEye /></Button>
                          <Button variant="link" className="text-primary" onClick={() => { setSelectedCustomerStaff(cs); setIsEditModalOpen(true); }}><FaEdit /></Button>
                          <Button variant="link" className="text-danger" onClick={() => { setSelectedCustomerStaff(cs); setIsDeleteModalOpen(true); }}><FaTrash /></Button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </Table>
            </div>
          </div>
        </div>
      </Container>
      
      <AddCustomerStaffModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onConfirm={handleAddCustomerStaff} 
        states={states} districts={districts} staffList={staffList} 
        existingCustomers={customerStaffList}
      />
      <EditCustomerStaffModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onConfirm={handleEditCustomerStaff} 
        customerStaff={selectedCustomerStaff} 
        states={states} districts={districts} 
      />
      <ViewCustomerStaffModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} customerStaff={selectedCustomerStaff} />
      <DeleteCustomerStaffModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteCustomerStaff} customerStaff={selectedCustomerStaff} />
      <ToastContainer />
      <style>{`
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1100; }
        .modal-content { background: white; padding: 20px; border-radius: 8px; width: 90%; max-width: 800px; max-height: 90vh; overflow-y: auto; }
        .modal-header, .modal-footer { display: flex; justify-content: space-between; align-items: center; }
        .modal-button { padding: 5px 15px; border-radius: 4px; border: none; margin-left: 10px; color: white; }
        .modal-button.confirm { background: #0B3D7B; }
        .modal-button.cancel { background: #6c757d; }
        .modal-button.delete { background: #dc3545; }
        .custom-input { width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; }
      `}</style>
    </MainContentPage>
  );
};

export default CustomerStaffMaster;