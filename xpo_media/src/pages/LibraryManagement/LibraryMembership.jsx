"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainContentPage from "../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container, Table, Card, Badge, Modal } from "react-bootstrap";
import { useAuthContext } from "../../Context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ENDPOINTS } from "../../SpringBoot/config";
import { FaPlus, FaEdit, FaTrash, FaSync, FaExclamationTriangle, FaSearch, FaUserPlus, FaBook } from "react-icons/fa";

const LibraryMembership = () => {
  const { user, admin, currentAcademicYear, schoolId } = useAuthContext();
  const [members, setMembers] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [studentSearchTerm, setStudentSearchTerm] = useState("");

  // Form data for new member
  const [formData, setFormData] = useState({
    admissionNumber: "",
    studentName: "",
    standard: "",
    section: "",
    fatherName: "",
    phoneNumber: "",
    email: "",
    membershipStartDate: new Date().toISOString().split('T')[0],
    membershipEndDate: "",
    maxBooksAllowed: 3,
    academicYear: currentAcademicYear
  });

  // Renew form data
  const [renewFormData, setRenewFormData] = useState({
    endDate: ""
  });

  // Fetch all library members
  const fetchLibraryMembers = async () => {
    if (!schoolId || !currentAcademicYear) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `${ENDPOINTS.library}/members?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      );
      
      if (!response.ok) throw new Error("Failed to fetch library members");
      
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch library members.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch students for dropdown
  const fetchStudents = async () => {
    if (!schoolId || !currentAcademicYear) return;
    
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/studentreport/datas?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      );
      
      if (response.ok) {
        const studentsData = await response.json();
        setStudents(studentsData);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  useEffect(() => {
    if (schoolId && currentAcademicYear) {
      fetchLibraryMembers();
      fetchStudents();
    }
  }, [schoolId, currentAcademicYear]);

  // Filter students based on search
  const filteredStudents = students.filter(student => 
    student.admissionNumber?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    student.studentName?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    student.standard?.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  // Auto-fill student details when admission number is selected
  const handleStudentSelect = (student) => {
    setFormData(prev => ({
      ...prev,
      admissionNumber: student.admissionNumber,
      studentName: student.studentName || "",
      standard: student.standard || "",
      section: student.section || "",
      fatherName: student.fatherName || "",
      phoneNumber: student.phoneNumber || "",
      email: student.emailId || ""
    }));
    setStudentSearchTerm(""); // Clear search after selection
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRenewInputChange = (e) => {
    const { name, value } = e.target;
    setRenewFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    
    if (!formData.admissionNumber || !formData.membershipStartDate || !formData.membershipEndDate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (new Date(formData.membershipEndDate) <= new Date(formData.membershipStartDate)) {
      toast.error("End date must be after start date.");
      return;
    }

    setIsLoading(true);
    try {
      const memberData = {
        ...formData,
        academicYear: currentAcademicYear,
        maxBooksAllowed: parseInt(formData.maxBooksAllowed) || 3
      };

      const response = await fetch(
        `${ENDPOINTS.library}/members?schoolId=${schoolId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(memberData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to add library member");
      }

      const newMember = await response.json();
      toast.success("Library member added successfully!");
      setShowAddModal(false);
      resetForm();
      fetchLibraryMembers();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to add library member.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenewMembership = async () => {
    if (!renewFormData.endDate) {
      toast.error("Please select an end date.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${ENDPOINTS.library}/members/${selectedMember.id}/renew?schoolId=${schoolId}&endDate=${renewFormData.endDate}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) throw new Error("Failed to renew membership");

      toast.success("Membership renewed successfully!");
      setShowRenewModal(false);
      setSelectedMember(null);
      resetRenewForm();
      fetchLibraryMembers();
    } catch (error) {
      console.error(error);
      toast.error("Failed to renew membership.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to delete this library member?")) {
      return;
    }

    try {
      const response = await fetch(
        `${ENDPOINTS.library}/members/${memberId}?schoolId=${schoolId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete library member");

      toast.success("Library member deleted successfully!");
      fetchLibraryMembers();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete library member.");
    }
  };

  const openRenewModal = (member) => {
    setSelectedMember(member);
    // Set default renewal to 1 year from today
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    setRenewFormData({
      endDate: oneYearFromNow.toISOString().split('T')[0]
    });
    setShowRenewModal(true);
  };

  const resetForm = () => {
    setFormData({
      admissionNumber: "",
      studentName: "",
      standard: "",
      section: "",
      fatherName: "",
      phoneNumber: "",
      email: "",
      membershipStartDate: new Date().toISOString().split('T')[0],
      membershipEndDate: "",
      maxBooksAllowed: 3,
      academicYear: currentAcademicYear
    });
    setStudentSearchTerm("");
  };

  const resetRenewForm = () => {
    setRenewFormData({
      endDate: ""
    });
  };

  // Calculate default end date (1 year from start date)
  const calculateDefaultEndDate = (startDate) => {
    if (!startDate) return "";
    const date = new Date(startDate);
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split('T')[0];
  };

  // Filter members based on search and status
  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.standard?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.membershipId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || member.membershipStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (status) => {
    switch (status) {
      case "ACTIVE": return "success";
      case "EXPIRED": return "danger";
      default: return "secondary";
    }
  };

  const getDaysUntilExpiryColor = (days) => {
    if (days <= 0) return "text-danger fw-bold";
    if (days <= 7) return "text-warning fw-bold";
    return "text-success";
  };

  const getExpiryBadge = (member) => {
    if (member.isExpired) {
      return <Badge bg="danger">EXPIRED</Badge>;
    } else if (member.daysUntilExpiry <= 7) {
      return <Badge bg="warning" text="dark">EXPIRING SOON</Badge>;
    } else {
      return <Badge bg="success">ACTIVE</Badge>;
    }
  };

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <div className="book-form">
          <div className="mb-4">
            <h2 className="mb-2">Library Management</h2>
            <nav className="d-flex custom-breadcrumb py-1 py-lg-3">
              <Link to="/home">Home</Link>
              <span className="separator mx-2">&gt;</span>
              <Link to="/library">Library Management</Link>
              <span className="separator mx-2">&gt;</span>
              <span>Library Membership</span>
            </nav>
          </div>

          {/* Stats Cards */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center border-0 shadow-sm">
                <Card.Body className="py-4">
                  <Card.Title className="text-primary display-6 fw-bold">
                    {members.filter(m => m.membershipStatus === "ACTIVE").length}
                  </Card.Title>
                  <Card.Text className="text-muted">Active Members</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center border-0 shadow-sm">
                <Card.Body className="py-4">
                  <Card.Title className="text-warning display-6 fw-bold">
                    {members.filter(m => m.daysUntilExpiry <= 7 && m.daysUntilExpiry > 0).length}
                  </Card.Title>
                  <Card.Text className="text-muted">Expiring Soon</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center border-0 shadow-sm">
                <Card.Body className="py-4">
                  <Card.Title className="text-danger display-6 fw-bold">
                    {members.filter(m => m.membershipStatus === "EXPIRED").length}
                  </Card.Title>
                  <Card.Text className="text-muted">Expired</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center border-0 shadow-sm">
                <Card.Body className="py-4">
                  <Card.Title className="text-success display-6 fw-bold">
                    {members.length}
                  </Card.Title>
                  <Card.Text className="text-muted">Total Members</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <div className="form-card mt-3">
            <div className="header p-3 custom-btn-clr">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <span><b>Library Members Management</b></span>
                  <Badge bg="info" className="ms-2">Free Membership</Badge>
                </div>
                <div className="d-flex gap-2">
                  <Button 
                    variant="outline-light" 
                    onClick={fetchLibraryMembers}
                    disabled={isLoading}
                    title="Refresh"
                  >
                    <FaSync className={isLoading ? "spinning" : ""} />
                  </Button>
                  <Button 
                    variant="light" 
                    onClick={() => setShowAddModal(true)}
                    className="d-flex align-items-center gap-2"
                  >
                    <FaUserPlus />
                    Add Member
                  </Button>
                </div>
              </div>
            </div>

            <div className="content-wrapper p-4">
              {/* Search and Filter */}
              <Row className="mb-3">
                <Col md={6}>
                  <div className="d-flex gap-2">
                    <div className="position-relative flex-grow-1">
                      <Form.Control
                        type="text"
                        placeholder="Search by admission number, name, class, or membership ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="ps-4"
                      />
                      <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                    </div>
                  </div>
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="EXPIRED">Expired</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Link to="/library/book-entry">
                    <Button 
                      variant="success" 
                      className="w-100 d-flex align-items-center justify-content-center gap-2"
                    >
                      <FaBook />
                      Book Entry
                    </Button>
                  </Link>
                </Col>
              </Row>

              {/* Members Table */}
              {isLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading library members...</p>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted mb-3">No library members found.</p>
                  <Button 
                    variant="primary" 
                    onClick={() => setShowAddModal(true)}
                    className="d-flex align-items-center gap-2 mx-auto"
                  >
                    <FaUserPlus />
                    Add Your First Member
                  </Button>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table bordered hover className="align-middle">
                    <thead className="table-dark">
                      <tr>
                        <th>Membership ID</th>
                        <th>Admission No.</th>
                        <th>Student Name</th>
                        <th>Class/Section</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Days Left</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((member) => (
                        <tr key={member.id} className={member.isExpired ? "table-danger" : ""}>
                          <td>
                            <small className="text-muted font-monospace">{member.membershipId}</small>
                          </td>
                          <td className="fw-semibold">{member.admissionNumber}</td>
                          <td>{member.studentName}</td>
                          <td>{member.standard} - {member.section}</td>
                          <td>{new Date(member.membershipStartDate).toLocaleDateString()}</td>
                          <td>{new Date(member.membershipEndDate).toLocaleDateString()}</td>
                          <td>
                            <span className={getDaysUntilExpiryColor(member.daysUntilExpiry)}>
                              {member.isExpired ? "Expired" : `${member.daysUntilExpiry} days`}
                            </span>
                          </td>
                          <td>
                            {getExpiryBadge(member)}
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              {member.membershipStatus === "EXPIRED" && (
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => openRenewModal(member)}
                                  title="Renew Membership"
                                >
                                  Renew
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => handleDeleteMember(member.id)}
                                title="Delete Member"
                              >
                                <FaTrash />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>

      {/* Add Member Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Add Library Member</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddMember}>
            {/* Student Search */}
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Search Student *</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type="text"
                      placeholder="Search by admission number, name, or class..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="ps-4"
                    />
                    <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                  </div>
                  <Form.Text className="text-muted">
                    Type to search for students. Select a student from the list below.
                  </Form.Text>
                </Form.Group>

                {/* Student Search Results */}
                {studentSearchTerm && (
                  <div className="mb-3">
                    <div className="border rounded" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {filteredStudents.length === 0 ? (
                        <div className="p-3 text-center text-muted">
                          No students found matching "{studentSearchTerm}"
                        </div>
                      ) : (
                        filteredStudents.map((student) => (
                          <div
                            key={student.admissionNumber}
                            className="p-3 border-bottom cursor-pointer hover-bg"
                            onClick={() => handleStudentSelect(student)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>{student.admissionNumber}</strong> - {student.studentName}
                              </div>
                              <div className="text-muted small">
                                {student.standard} - {student.section}
                              </div>
                            </div>
                            {student.fatherName && (
                              <div className="text-muted small">Father: {student.fatherName}</div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </Col>
            </Row>

            {/* Student Details (Auto-filled) */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Admission Number *</Form.Label>
                  <Form.Control
                    type="text"
                    name="admissionNumber"
                    value={formData.admissionNumber}
                    onChange={handleInputChange}
                    required
                    readOnly
                    className="bg-light"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Student Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleInputChange}
                    required
                    readOnly
                    className="bg-light"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Class *</Form.Label>
                  <Form.Control
                    type="text"
                    name="standard"
                    value={formData.standard}
                    onChange={handleInputChange}
                    required
                    readOnly
                    className="bg-light"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Section *</Form.Label>
                  <Form.Control
                    type="text"
                    name="section"
                    value={formData.section}
                    onChange={handleInputChange}
                    required
                    readOnly
                    className="bg-light"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Membership Start Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="membershipStartDate"
                    value={formData.membershipStartDate}
                    onChange={(e) => {
                      handleInputChange(e);
                      // Auto-set end date to 1 year from start date
                      const endDate = calculateDefaultEndDate(e.target.value);
                      setFormData(prev => ({ ...prev, membershipEndDate: endDate }));
                    }}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Membership End Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="membershipEndDate"
                    value={formData.membershipEndDate}
                    onChange={handleInputChange}
                    required
                    min={formData.membershipStartDate}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Books Allowed</Form.Label>
                  <Form.Control
                    type="number"
                    name="maxBooksAllowed"
                    value={formData.maxBooksAllowed}
                    onChange={handleInputChange}
                    min="1"
                    max="10"
                  />
                  <Form.Text className="text-muted">
                    Maximum number of books the student can borrow at once
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <div className="alert alert-info mt-3">
              <strong>Free Membership:</strong> Library membership is completely free for all students.
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddMember}
            disabled={isLoading || !formData.admissionNumber}
            className="d-flex align-items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                Adding...
              </>
            ) : (
              <>
                <FaUserPlus />
                Add Member
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Renew Membership Modal */}
      <Modal show={showRenewModal} onHide={() => setShowRenewModal(false)}>
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>Renew Membership</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMember && (
            <div className="mb-3 p-3 bg-light rounded">
              <p><strong>Student:</strong> {selectedMember.studentName}</p>
              <p><strong>Admission No:</strong> {selectedMember.admissionNumber}</p>
              <p><strong>Class:</strong> {selectedMember.standard} - {selectedMember.section}</p>
              <p><strong>Current End Date:</strong> {new Date(selectedMember.membershipEndDate).toLocaleDateString()}</p>
            </div>
          )}
          <Form.Group className="mb-3">
            <Form.Label>New End Date *</Form.Label>
            <Form.Control
              type="date"
              name="endDate"
              value={renewFormData.endDate}
              onChange={handleRenewInputChange}
              required
              min={new Date().toISOString().split('T')[0]}
            />
            <Form.Text className="text-muted">
              Select the new membership end date
            </Form.Text>
          </Form.Group>
          <div className="alert alert-success">
            <strong>Free Renewal:</strong> Membership renewal is completely free.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRenewModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={handleRenewMembership}
            disabled={isLoading}
            className="d-flex align-items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                Renewing...
              </>
            ) : (
              "Renew Membership"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer />
      
      <style>
        {`
          .spinning {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .custom-btn-clr {
            background-color: #0B3D7B;
            color: white;
          }
          .custom-breadcrumb {
            background-color: #f8f9fa;
            border-radius: 0.375rem;
            padding: 0.75rem 1rem;
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
          .hover-bg:hover {
            background-color: #f8f9fa;
          }
          .cursor-pointer {
            cursor: pointer;
          }
        `}
      </style>
    </MainContentPage>
  );
};

export default LibraryMembership;