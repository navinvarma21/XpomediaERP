"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainContentPage from "../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container, Table, Modal } from "react-bootstrap";
import { FaEdit, FaTrash, FaEye, FaSearch, FaBook } from "react-icons/fa";
import { useAuthContext } from "../../Context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ENDPOINTS } from "../../SpringBoot/config";
import axios from "axios";

const BookSupplierMaster = () => {
  const { user, currentAcademicYear, schoolId } = useAuthContext();
  const [bookSuppliers, setBookSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [nextSupplierCode, setNextSupplierCode] = useState("BKS-1");
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConfirmEditModal, setShowConfirmEditModal] = useState(false);
  
  // Form Data
  const [formData, setFormData] = useState({
    supplierCode: "",
    supplierName: "",
    address: "",
    phoneNumber: "",
    email: "",
    contactPerson: "",
    gstNumber: "",
    bookCategories: "",  // Specialized for books
    paymentTerms: "",    // 30 days, 60 days, etc.
    deliveryTerms: "",   // FOB, COD, etc.
    remarks: ""
  });
  
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL = `${ENDPOINTS.library}/booksuppliers`;

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
    "X-School-ID": schoolId,
    "X-Academic-Year": currentAcademicYear,
  });

  // Fetch all book suppliers
  const fetchBookSuppliers = async () => {
    if (!schoolId || !currentAcademicYear) return;
    
    setLoading(true);
    try {
      const response = await axios.get(API_URL, {
        params: { 
          schoolId: schoolId, 
          year: currentAcademicYear 
        },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
      });
      
      const suppliersData = response.data || [];
      setBookSuppliers(suppliersData);
      generateNextSupplierCode(suppliersData);
    } catch (err) {
      console.error("Error fetching book suppliers:", err);
      toast.error("Failed to fetch book suppliers");
    } finally {
      setLoading(false);
    }
  };

  // Generate next supplier code
  const generateNextSupplierCode = (suppliersData) => {
    if (!suppliersData || suppliersData.length === 0) {
      setNextSupplierCode("BKS-1");
      return;
    }
    
    const supplierNumbers = suppliersData.map((supplier) => {
      const match = supplier.supplierCode?.match(/BKS-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    }).filter(num => !isNaN(num));
    
    const nextNumber = supplierNumbers.length > 0 ? Math.max(...supplierNumbers) + 1 : 1;
    setNextSupplierCode(`BKS-${nextNumber}`);
  };

  useEffect(() => {
    if (schoolId && currentAcademicYear) {
      fetchBookSuppliers();
    }
  }, [schoolId, currentAcademicYear]);

  // Handle Add Supplier
  const handleAddSupplier = async () => {
    if (!formData.supplierName.trim()) {
      toast.error("Supplier Name is required");
      return;
    }

    try {
      const payload = {
        ...formData,
        academicYear: currentAcademicYear
      };

      const response = await axios.post(API_URL, payload, {
        params: { 
          schoolId: schoolId, 
          year: currentAcademicYear 
        },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
      });

      toast.success("Book supplier added successfully!");
      setShowAddModal(false);
      resetForm();
      fetchBookSuppliers();
    } catch (err) {
      console.error("Error adding book supplier:", err);
      toast.error(err.response?.data || "Failed to add book supplier");
    }
  };

  // Handle Edit Supplier
  const handleEditSupplier = async () => {
    if (!formData.supplierName.trim()) {
      toast.error("Supplier Name is required");
      return;
    }

    setShowEditModal(false);
    setShowConfirmEditModal(true);
    setSelectedSupplier({
      ...selectedSupplier,
      ...formData
    });
  };

  const handleConfirmEdit = async () => {
    try {
      const payload = {
        ...selectedSupplier,
        academicYear: currentAcademicYear
      };

      await axios.put(`${API_URL}/${selectedSupplier.id}`, payload, {
        params: { 
          schoolId: schoolId, 
          year: currentAcademicYear 
        },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
      });

      toast.success("Book supplier updated successfully!");
      setShowConfirmEditModal(false);
      setSelectedSupplier(null);
      resetForm();
      fetchBookSuppliers();
    } catch (err) {
      console.error("Error updating book supplier:", err);
      toast.error("Failed to update book supplier");
    }
  };

  // Handle Delete Supplier
  const handleDeleteSupplier = async () => {
    try {
      await axios.delete(`${API_URL}/${selectedSupplier.id}`, {
        params: { schoolId: schoolId },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
      });

      toast.success("Book supplier deleted successfully!");
      setShowDeleteModal(false);
      setSelectedSupplier(null);
      fetchBookSuppliers();
    } catch (err) {
      console.error("Error deleting book supplier:", err);
      toast.error("Failed to delete book supplier");
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    resetForm();
    setFormData(prev => ({ ...prev, supplierCode: nextSupplierCode }));
    setShowAddModal(true);
  };

  // Open Edit Modal
  const openEditModal = (supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      supplierCode: supplier.supplierCode || "",
      supplierName: supplier.supplierName || "",
      address: supplier.address || "",
      phoneNumber: supplier.phoneNumber || "",
      email: supplier.email || "",
      contactPerson: supplier.contactPerson || "",
      gstNumber: supplier.gstNumber || "",
      bookCategories: supplier.bookCategories || "",
      paymentTerms: supplier.paymentTerms || "",
      deliveryTerms: supplier.deliveryTerms || "",
      remarks: supplier.remarks || ""
    });
    setShowEditModal(true);
  };

  // Open View Modal
  const openViewModal = (supplier) => {
    setSelectedSupplier(supplier);
    setShowViewModal(true);
  };

  // Open Delete Modal
  const openDeleteModal = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDeleteModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      supplierCode: "",
      supplierName: "",
      address: "",
      phoneNumber: "",
      email: "",
      contactPerson: "",
      gstNumber: "",
      bookCategories: "",
      paymentTerms: "",
      deliveryTerms: "",
      remarks: ""
    });
  };

  // Filter suppliers based on search
  const filteredSuppliers = bookSuppliers.filter(supplier =>
    supplier.supplierCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phoneNumber?.includes(searchTerm)
  );

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        {/* Breadcrumb */}
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link>
          <span className="separator mx-2">&gt;</span>
          <Link to="/library">Library</Link>
          <span className="separator mx-2">&gt;</span>
          <span className="current">Book Supplier Master</span>
        </nav>

        {/* Main Card */}
        <div className="form-card mt-3 border-0 shadow-sm">
          <div className="header p-3 d-flex justify-content-between align-items-center custom-btn-clr">
            <h2 className="m-0 text-white">
              <FaBook className="me-2" />
              Book Supplier Master
            </h2>
            <Button onClick={openAddModal} className="btn btn-light text-dark">
              + Add Book Supplier
            </Button>
          </div>

          <div className="content-wrapper p-4">
            {/* Search Bar */}
            <Row className="mb-4">
              <Col md={6}>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="text"
                    placeholder="Search by code, name, contact person, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="custom-search"
                  />
                  {searchTerm && (
                    <Button variant="danger" onClick={() => setSearchTerm("")}>
                      Clear
                    </Button>
                  )}
                </div>
              </Col>
              <Col md={6} className="text-end">
                <Button 
                  variant="outline-secondary" 
                  onClick={fetchBookSuppliers}
                  disabled={loading}
                >
                  {loading ? "Refreshing..." : "Refresh"}
                </Button>
              </Col>
            </Row>

            {/* Suppliers Table */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading book suppliers...</p>
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">
                  {searchTerm ? "No matching book suppliers found" : "No book suppliers found"}
                </p>
                {!searchTerm && (
                  <Button variant="primary" onClick={openAddModal}>
                    Add Your First Book Supplier
                  </Button>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <Table bordered hover className="align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th>Supplier Code</th>
                      <th>Supplier Name</th>
                      <th>Contact Person</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Book Categories</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.map((supplier) => (
                      <tr key={supplier.id}>
                        <td className="fw-bold">{supplier.supplierCode}</td>
                        <td>{supplier.supplierName}</td>
                        <td>{supplier.contactPerson || "N/A"}</td>
                        <td>{supplier.phoneNumber || "N/A"}</td>
                        <td>{supplier.email || "N/A"}</td>
                        <td>
                          <small className="text-muted">
                            {supplier.bookCategories || "General"}
                          </small>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => openViewModal(supplier)}
                              title="View Details"
                            >
                              <FaEye />
                            </Button>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => openEditModal(supplier)}
                              title="Edit"
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => openDeleteModal(supplier)}
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
              </div>
            )}

            {/* Summary */}
            {filteredSuppliers.length > 0 && (
              <div className="mt-3 p-3 bg-light rounded">
                <Row>
                  <Col md={6}>
                    <strong>Showing {filteredSuppliers.length} of {bookSuppliers.length} book suppliers</strong>
                  </Col>
                  <Col md={6} className="text-end">
                    <small className="text-muted">
                      Last updated: {new Date().toLocaleString()}
                    </small>
                  </Col>
                </Row>
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* Add Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <FaBook className="me-2" />
            Add Book Supplier
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Supplier Code</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.supplierCode}
                  readOnly
                  className="bg-light"
                />
                <Form.Text className="text-muted">Auto-generated</Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Supplier Name *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter supplier name"
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Contact Person</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter contact person"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Phone Number</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter phone number"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>GST Number</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter GST number"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Enter full address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Book Categories</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Textbooks, Novels, Reference"
                  value={formData.bookCategories}
                  onChange={(e) => setFormData({ ...formData, bookCategories: e.target.value })}
                />
                <Form.Text className="text-muted">Types of books supplied</Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Payment Terms</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., 30 days, 60 days"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Delivery Terms</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., FOB, COD"
                  value={formData.deliveryTerms}
                  onChange={(e) => setFormData({ ...formData, deliveryTerms: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Remarks</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Any additional remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddSupplier}>
            Add Supplier
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton className="bg-warning text-dark">
          <Modal.Title>
            <FaBook className="me-2" />
            Edit Book Supplier
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Supplier Code</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.supplierCode}
                  readOnly
                  className="bg-light"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Supplier Name *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Contact Person</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Phone Number</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>GST Number</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Book Categories</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.bookCategories}
                  onChange={(e) => setFormData({ ...formData, bookCategories: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Payment Terms</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Delivery Terms</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.deliveryTerms}
                  onChange={(e) => setFormData({ ...formData, deliveryTerms: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Remarks</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="warning" onClick={handleEditSupplier}>
            Update
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)}>
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>
            <FaBook className="me-2" />
            Book Supplier Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSupplier && (
            <div className="supplier-details">
              <table className="table table-sm table-borderless">
                <tbody>
                  <tr><th>Supplier Code:</th><td>{selectedSupplier.supplierCode}</td></tr>
                  <tr><th>Supplier Name:</th><td>{selectedSupplier.supplierName}</td></tr>
                  <tr><th>Contact Person:</th><td>{selectedSupplier.contactPerson || "N/A"}</td></tr>
                  <tr><th>Phone Number:</th><td>{selectedSupplier.phoneNumber || "N/A"}</td></tr>
                  <tr><th>Email:</th><td>{selectedSupplier.email || "N/A"}</td></tr>
                  <tr><th>GST Number:</th><td>{selectedSupplier.gstNumber || "N/A"}</td></tr>
                  <tr><th>Address:</th><td>{selectedSupplier.address || "N/A"}</td></tr>
                  <tr><th>Book Categories:</th><td>{selectedSupplier.bookCategories || "General"}</td></tr>
                  <tr><th>Payment Terms:</th><td>{selectedSupplier.paymentTerms || "N/A"}</td></tr>
                  <tr><th>Delivery Terms:</th><td>{selectedSupplier.deliveryTerms || "N/A"}</td></tr>
                  <tr><th>Remarks:</th><td>{selectedSupplier.remarks || "N/A"}</td></tr>
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Delete Book Supplier</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p>Are you sure you want to delete this book supplier?</p>
          <p className="fw-bold fs-5">{selectedSupplier?.supplierName}</p>
          <p className="text-muted">({selectedSupplier?.supplierCode})</p>
          <p className="text-danger small">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteSupplier}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirm Edit Modal */}
      <Modal show={showConfirmEditModal} onHide={() => setShowConfirmEditModal(false)} centered>
        <Modal.Header closeButton className="bg-warning text-dark">
          <Modal.Title>Confirm Edit</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to update this book supplier?</p>
          <div className="p-3 bg-light rounded">
            <p><strong>Supplier Code:</strong> {selectedSupplier?.supplierCode}</p>
            <p><strong>Current Name:</strong> {bookSuppliers.find(s => s.id === selectedSupplier?.id)?.supplierName}</p>
            <p><strong>New Name:</strong> {selectedSupplier?.supplierName}</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmEditModal(false)}>
            Cancel
          </Button>
          <Button variant="warning" onClick={handleConfirmEdit}>
            Confirm Update
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer />

      <style>
        {`
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
          .custom-search {
            padding: 10px 15px;
            border-radius: 5px;
            border: 1px solid #ced4da;
          }
          .supplier-details tr th {
            width: 40%;
            color: #666;
          }
          .supplier-details tr td {
            font-weight: 500;
          }
        `}
      </style>
    </MainContentPage>
  );
};

export default BookSupplierMaster;