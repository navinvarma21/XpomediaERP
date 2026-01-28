"use client"

import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Form, Button, Row, Col, Container, Table, Modal } from "react-bootstrap"
import { FaEdit, FaTrash, FaEye, FaSearch } from "react-icons/fa"
import axios from "axios"
import { useAuthContext } from "../../Context/AuthContext"
import { ToastContainer, toast } from "react-toastify"
import { ENDPOINTS } from "../../SpringBoot/config"
import "react-toastify/dist/ReactToastify.css"

const SupplierSetup = () => {
  const { user, currentAcademicYear } = useAuthContext()
  const location = useLocation()
  const [suppliers, setSuppliers] = useState({ items: [], searchTerm: "" })
  const [nextSupplierCode, setNextSupplierCode] = useState("SUP-1")
  const [showModal, setShowModal] = useState(false)
  const [modalData, setModalData] = useState({
    action: "",
    data: null,
    supplierCode: "",
    supplierName: "",
    address: "",
    phoneNumber: "",
    email: "",
    contactPerson: "",
    gst: "",
    otherDetails: ""
  })
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showConfirmEditModal, setShowConfirmEditModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const SUPPLIERS_URL = `${ENDPOINTS.store}/suppliers`

  const fetchSuppliers = async () => {
    if (!user?.uid || !currentAcademicYear) return

    try {
      const res = await axios.get(SUPPLIERS_URL, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      const suppliersData = res.data || []
      setSuppliers((prev) => ({ ...prev, items: suppliersData }))
      generateNextSupplierCode(suppliersData)
    } catch (err) {
      console.error("Error fetching suppliers:", err)
      toast.error("Failed to fetch suppliers")
    }
  }

  const generateNextSupplierCode = (suppliersData) => {
    if (!suppliersData || suppliersData.length === 0) {
      setNextSupplierCode("SUP-1")
      return
    }
    const supplierNumbers = suppliersData.map((supplier) => {
      const match = supplier.supplierCode.match(/SUP-(\d+)/)
      return match ? Number.parseInt(match[1], 10) : 0
    })
    const nextNumber = Math.max(...supplierNumbers) + 1
    setNextSupplierCode(`SUP-${nextNumber}`)
  }

  useEffect(() => {
    if (user?.uid && currentAcademicYear) {
      fetchSuppliers()
    }
  }, [user?.uid, currentAcademicYear])

  const handleAdd = async () => {
    const { supplierCode, supplierName, address, phoneNumber, email, contactPerson, gst, otherDetails } = modalData
    if (!supplierName.trim()) {
      toast.error("Supplier Name is required")
      return
    }

    try {
      await axios.post(SUPPLIERS_URL, {
        supplierCode,
        supplierName,
        address,
        phoneNumber,
        email,
        contactPerson,
        gst,
        otherDetails,
        academicYear: currentAcademicYear
      }, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      toast.success("Supplier added successfully")
      setShowModal(false)
      fetchSuppliers()
    } catch (err) {
      console.error("Error adding supplier:", err)
      toast.error("Failed to add supplier")
    }
  }

  const handleEdit = async () => {
    const { data, supplierName, address, phoneNumber, email, contactPerson, gst, otherDetails } = modalData
    if (!supplierName.trim()) {
      toast.error("Supplier Name is required")
      return
    }

    setShowModal(false)
    setShowConfirmEditModal(true)
    setSelectedSupplier({
      ...data,
      supplierName,
      address,
      phoneNumber,
      email,
      contactPerson,
      gst,
      otherDetails
    })
  }

  const handleConfirmEdit = async () => {
    try {
      await axios.put(`${SUPPLIERS_URL}/${selectedSupplier.id}`, {
        supplierCode: selectedSupplier.supplierCode,
        supplierName: selectedSupplier.supplierName,
        address: selectedSupplier.address,
        phoneNumber: selectedSupplier.phoneNumber,
        email: selectedSupplier.email,
        contactPerson: selectedSupplier.contactPerson,
        gst: selectedSupplier.gst,
        otherDetails: selectedSupplier.otherDetails,
        academicYear: currentAcademicYear
      }, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      toast.success("Supplier updated successfully")
      setShowConfirmEditModal(false)
      setSelectedSupplier(null)
      fetchSuppliers()
    } catch (err) {
      console.error("Error updating supplier:", err)
      toast.error("Failed to update supplier")
    }
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`${SUPPLIERS_URL}/${selectedSupplier.id}`, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      toast.success("Supplier deleted successfully")
      setShowDeleteModal(false)
      setSelectedSupplier(null)
      fetchSuppliers()
    } catch (err) {
      console.error("Error deleting supplier:", err)
      toast.error("Failed to delete supplier")
    }
  }

  const openModal = (action, data = null) => {
    let initialData = {
      supplierCode: nextSupplierCode,
      supplierName: "",
      address: "",
      phoneNumber: "",
      email: "",
      contactPerson: "",
      gst: "",
      otherDetails: ""
    }
    if (action === "edit" && data) {
      initialData = {
        supplierCode: data.supplierCode || "",
        supplierName: data.supplierName || "",
        address: data.address || "",
        phoneNumber: data.phoneNumber || "",
        email: data.email || "",
        contactPerson: data.contactPerson || "",
        gst: data.gst || "",
        otherDetails: data.otherDetails || ""
      }
    }
    setModalData({ action, data, ...initialData })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setModalData({
      action: "",
      data: null,
      supplierCode: "",
      supplierName: "",
      address: "",
      phoneNumber: "",
      email: "",
      contactPerson: "",
      gst: "",
      otherDetails: ""
    })
  }

  const filteredSuppliers = suppliers.items.filter(
    (supplier) =>
      supplier.supplierCode.toLowerCase().includes(suppliers.searchTerm.toLowerCase()) ||
      supplier.supplierName.toLowerCase().includes(suppliers.searchTerm.toLowerCase())
  )

  return (
    <MainContentPage>
      <Container fluid className="px-0 px-lg-0">
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link>
          <span className="separator">&gt;</span>
          <span>Store</span>
          <span className="separator">&gt;</span>
          <span className="current col-12">Supplier Setup</span>
        </nav>
        <Row>
          <Col xs={12}>
            <div className="supplier-setup-container">
              <div className="form-card mt-3">
                <div className="header p-3 d-flex justify-content-between align-items-center">
                  <h2 className="m-0 d-none d-lg-block text-light">Supplier Setup</h2>
                  <h6 className="m-0 d-lg-none text-light">Supplier Setup</h6>
                  <Button onClick={() => openModal("add")} className="btn btn-light text-dark">
                    + Add Supplier
                  </Button>
                </div>
                <div className="content-wrapper p-4">
                  <Form.Group className="mb-3">
                    <Form.Control
                      type="text"
                      placeholder="Search by Supplier Code or Name"
                      value={suppliers.searchTerm}
                      onChange={(e) => setSuppliers((prev) => ({ ...prev, searchTerm: e.target.value }))}
                      className="custom-search"
                    />
                  </Form.Group>
                  <div className="table-responsive">
                    <Table bordered hover>
                      <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                        <tr>
                          <th>Supplier Code</th>
                          <th>Supplier Name</th>
                          <th>Phone Number</th>
                          <th>Email</th>
                          <th>Contact Person</th>
                          <th>GST Number</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSuppliers.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="text-center text-muted">
                              No suppliers found
                            </td>
                          </tr>
                        ) : (
                          filteredSuppliers.map((supplier) => (
                            <tr key={supplier.id}>
                              <td>{supplier.supplierCode}</td>
                              <td>{supplier.supplierName}</td>
                              <td>{supplier.phoneNumber || "N/A"}</td>
                              <td>{supplier.email || "N/A"}</td>
                              <td>{supplier.contactPerson || "N/A"}</td>
                              <td>{supplier.gst || "N/A"}</td>
                              <td>
                                <Button
                                  variant="link"
                                  className="action-button view-button me-2"
                                  onClick={() => setShowViewModal(true) || setSelectedSupplier(supplier)}
                                >
                                  <FaEye />
                                </Button>
                                <Button
                                  variant="link"
                                  className="action-button edit-button me-2"
                                  onClick={() => openModal("edit", supplier)}
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  variant="link"
                                  className="action-button delete-button"
                                  onClick={() => setShowDeleteModal(true) || setSelectedSupplier(supplier)}
                                >
                                  <FaTrash />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      <Modal show={showModal} onHide={closeModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalData.action === "add" ? "Add" : "Edit"} Supplier
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Supplier Code</Form.Label>
            <Form.Control
              type="text"
              value={modalData.supplierCode}
              readOnly
              className="custom-input bg-light"
            />
            <Form.Text className="text-muted">Supplier code is auto-generated</Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Supplier Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Supplier Name"
              value={modalData.supplierName}
              onChange={(e) => setModalData({ ...modalData, supplierName: e.target.value })}
              className="custom-input"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Address</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Address"
              value={modalData.address}
              onChange={(e) => setModalData({ ...modalData, address: e.target.value })}
              className="custom-input"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Phone Number"
              value={modalData.phoneNumber}
              onChange={(e) => setModalData({ ...modalData, phoneNumber: e.target.value })}
              className="custom-input"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter Email"
              value={modalData.email}
              onChange={(e) => setModalData({ ...modalData, email: e.target.value })}
              className="custom-input"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Contact Person</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Contact Person"
              value={modalData.contactPerson}
              onChange={(e) => setModalData({ ...modalData, contactPerson: e.target.value })}
              className="custom-input"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>GST Number</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter GST Number"
              value={modalData.gst}
              onChange={(e) => setModalData({ ...modalData, gst: e.target.value })}
              className="custom-input"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Other Details</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Other Details"
              value={modalData.otherDetails}
              onChange={(e) => setModalData({ ...modalData, otherDetails: e.target.value })}
              className="custom-input"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={modalData.action === "add" ? handleAdd : handleEdit} style={{ backgroundColor: "#0B3D7B" }}>
            {modalData.action === "add" ? "Add" : "Update"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Supplier Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSupplier && (
            <>
              <div className="supplier-detail"><strong>Supplier Code:</strong> {selectedSupplier.supplierCode}</div>
              <div className="supplier-detail"><strong>Supplier Name:</strong> {selectedSupplier.supplierName}</div>
              <div className="supplier-detail"><strong>Address:</strong> {selectedSupplier.address || "N/A"}</div>
              <div className="supplier-detail"><strong>Phone Number:</strong> {selectedSupplier.phoneNumber || "N/A"}</div>
              <div className="supplier-detail"><strong>Email:</strong> {selectedSupplier.email || "N/A"}</div>
              <div className="supplier-detail"><strong>Contact Person:</strong> {selectedSupplier.contactPerson || "N/A"}</div>
              <div className="supplier-detail"><strong>GST Number:</strong> {selectedSupplier.gst || "N/A"}</div>
              <div className="supplier-detail"><strong>Other Details:</strong> {selectedSupplier.otherDetails || "N/A"}</div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Supplier</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p>Are you sure you want to delete this supplier?</p>
          <p className="fw-bold">{selectedSupplier?.supplierName}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showConfirmEditModal} onHide={() => setShowConfirmEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Edit</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to edit this supplier? This may affect related data.</p>
          <p><strong>Supplier Code:</strong> {selectedSupplier?.supplierCode}</p>
          <p><strong>Current Supplier Name:</strong> {selectedSupplier?.data?.supplierName || selectedSupplier?.supplierName}</p>
          <p><strong>New Supplier Name:</strong> {selectedSupplier?.supplierName}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirmEdit} style={{ backgroundColor: "#0B3D7B" }}>
            Confirm Edit
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer />

      <style>
        {`
          .supplier-setup-container {
            background-color: #fff;
          }

          .custom-breadcrumb {
            padding: 0.5rem 1rem;
          }

          .custom-breadcrumb a {
            color: #0B3D7B;
            text-decoration: none;
          }

          .custom-breadcrumb .separator {
            margin: 0 0.5rem;
            color: #6c757d;
          }

          .custom-breadcrumb .current {
            color: #212529;
          }

          .form-card {
            background-color: #fff;
            border: 1px solid #dee2e6;
            border-radius: 0.25rem;
          }

          .header {
            border-bottom: 1px solid #dee2e6;
            background-color: #0B3D7B;
          }

          .custom-search {
            max-width: 300px;
          }

          .table-responsive {
            margin-bottom: 0;
          }

          .table th {
            font-weight: 500;
          }

          .table td {
            vertical-align: middle;
          }

          .action-button {
            width: 30px;
            height: 30px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            padding: 0;
            color: white;
          }

          .view-button {
            background-color: #28a745;
          }

          .view-button:hover {
            background-color: #218838;
            color: white;
          }

          .edit-button {
            background-color: #0B3D7B;
          }

          .edit-button:hover {
            background-color: #092a54;
            color: white;
          }

          .delete-button {
            background-color: #dc3545;
          }

          .delete-button:hover {
            background-color: #bb2d3b;
            color: white;
          }

          .supplier-detail {
            margin-bottom: 0.5rem;
            padding: 0.5rem;
            border-bottom: 1px solid #eee;
          }

          .custom-input {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #ced4da;
            border-radius: 4px;
          }

          .Toastify__toast--success {
            background-color: #0B3D7B;
          }

          .Toastify__toast--error {
            background-color: #dc3545;
          }
        `}
      </style>
    </MainContentPage>
  )
}

export default SupplierSetup