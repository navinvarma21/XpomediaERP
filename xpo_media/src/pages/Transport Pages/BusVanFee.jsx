"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Form, Button, Row, Col, Container, Table, Spinner, Modal } from "react-bootstrap"
import { FaEdit, FaTrash } from "react-icons/fa"
import axios from "axios"
import { useAuthContext } from "../../Context/AuthContext"
import { ToastContainer, toast } from "react-toastify"
import { ENDPOINTS } from "../../SpringBoot/config"
import "react-toastify/dist/ReactToastify.css"
// import "../Administration/styles/style.css"

const BusVanFeeHeadSetup = () => {
  const { user, currentAcademicYear } = useAuthContext()
  const [feeHeads, setFeeHeads] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Build base URL dynamically
  const BUS_VAN_FEE_HEADS_URL = `${ENDPOINTS.transport}/busVanFeeHeads`

  // Form states
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ feeHead: "", accountHead: "" })

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  // ---------------- Fetch Bus Van Fee Heads ----------------
  const fetchFeeHeads = async () => {
    if (!user?.uid || !currentAcademicYear) return
    setIsLoading(true)
    try {
      const res = await axios.get(BUS_VAN_FEE_HEADS_URL, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      setFeeHeads(res.data || [])
    } catch (err) {
      console.error("Error fetching bus van fee heads:", err)
      toast.error("Failed to fetch bus van fee heads")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user?.uid && currentAcademicYear) fetchFeeHeads()
  }, [user?.uid, currentAcademicYear])

  // ---------------- Form Handlers ----------------
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({ feeHead: "", accountHead: "" })
    setEditingId(null)
  }

  // ---------------- Create / Update ----------------
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.feeHead.trim() || !formData.accountHead.trim()) {
      toast.error("Fee Head and Account Head are required")
      return
    }

    try {
      if (editingId) {
        await axios.put(`${BUS_VAN_FEE_HEADS_URL}/${editingId}`, {
          ...formData,
          schoolId: user.uid,
          year: currentAcademicYear,
        }, {
          params: { schoolId: user.uid, year: currentAcademicYear },
          headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
        })
        toast.success("Bus van fee head updated successfully")
      } else {
        await axios.post(BUS_VAN_FEE_HEADS_URL, {
          ...formData,
          schoolId: user.uid,
          year: currentAcademicYear,
        }, {
          params: { schoolId: user.uid, year: currentAcademicYear },
          headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
        })
        toast.success("Bus van fee head added successfully")
      }
      resetForm()
      fetchFeeHeads()
    } catch (err) {
      console.error("Error saving bus van fee head:", err)
      toast.error("Failed to save bus van fee head")
    }
  }

  // ---------------- Edit ----------------
  const handleEdit = (feeHead) => {
    setEditingId(feeHead.id)
    setFormData({ feeHead: feeHead.feeHead, accountHead: feeHead.accountHead })
  }

  // ---------------- Delete ----------------
  const confirmDelete = (id) => {
    setDeleteId(id)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await axios.delete(`${BUS_VAN_FEE_HEADS_URL}/${deleteId}`, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      toast.success("Bus van fee head deleted successfully")
      fetchFeeHeads()
    } catch (err) {
      console.error("Error deleting bus van fee head:", err)
      toast.error("Failed to delete bus van fee head")
    } finally {
      setShowDeleteModal(false)
      setDeleteId(null)
    }
  }

  const filteredFeeHeads = feeHeads.filter(
    (f) =>
      f.feeHead.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.accountHead.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MainContentPage>
      <Container fluid className="px-0 px-lg-0">
        {/* Breadcrumb Navigation */}
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link>
          <span className="separator">&gt;</span>
          <span>Transport</span>
          <span className="separator">&gt;</span>
          <span className="current col-12">Bus Van Fee Head Setup</span>
        </nav>

        <Row>
          <Col xs={12}>
            <div className="fee-setup-container">
              <div className="form-card mt-3">
                {/* Header */}
                <div className="header p-3 d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="m-0 d-none d-lg-block">Bus Van Fee Head Setup</h2>
                    <h6 className="m-0 d-lg-none">Bus Van Fee Head Setup</h6>
                  </div>
                </div>

                {/* Add/Edit Form */}
                <div className="p-4">
                  <Form onSubmit={handleSubmit} className="mb-3">
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Bus Van Fee Head</Form.Label>
                          <Form.Control
                            type="text"
                            name="feeHead"
                            placeholder="e.g., 1 term"
                            value={formData.feeHead}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Account Head</Form.Label>
                          <Form.Control
                            type="text"
                            name="accountHead"
                            placeholder="Name of the fee account transfer"
                            value={formData.accountHead}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4} className="mb-3 d-flex align-items-end">
                        <Button type="submit" className="me-2">
                          {editingId ? "Update" : "Add"} Bus Van Fee Head
                        </Button>
                        {editingId && (
                          <Button variant="secondary" onClick={resetForm}>
                            Cancel
                          </Button>
                        )}
                      </Col>
                    </Row>
                  </Form>

                  {/* Search Bar */}
                  <div className="position-relative mb-3">
                    <Form.Control
                      type="text"
                      placeholder="Search by Fee Head / Account Head"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="custom-search"
                      disabled={isLoading}
                    />
                    {searchTerm && (
                      <Button
                        variant="light"
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          border: "none",
                          borderRadius: "50%",
                          width: "32px",
                          height: "32px",
                          fontSize: "20px",
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        }}
                        onClick={() => setSearchTerm("")}
                      >
                        ×
                      </Button>
                    )}
                  </div>

                  {/* Loading */}
                  {isLoading && (
                    <div className="text-center my-4">
                      <Spinner animation="border" role="status" variant="primary" />
                      <p className="mt-2">Loading data...</p>
                    </div>
                  )}

                  {/* Table */}
                  {!isLoading && (
                    <div className="table-responsive">
                      <Table bordered hover>
                        <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                          <tr>
                            <th>Bus Van Fee Head</th>
                            <th>Account Head</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredFeeHeads.length === 0 ? (
                            <tr>
                              <td colSpan="3" className="text-center">
                                No data found
                              </td>
                            </tr>
                          ) : (
                            filteredFeeHeads.map((f) => (
                              <tr key={f.id}>
                                <td>{f.feeHead}</td>
                                <td>{f.accountHead}</td>
                                <td>
                                  <Button
                                    variant="link"
                                    className="action-button edit-button me-2"
                                    onClick={() => handleEdit(f)}
                                  >
                                    <FaEdit />
                                  </Button>
                                  <Button
                                    variant="link"
                                    className="action-button delete-button"
                                    onClick={() => confirmDelete(f.id)}
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
                  )}
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Delete Confirmation Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to delete this Bus Van Fee Head?</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
      <ToastContainer />
    </MainContentPage>
  )
}


export default BusVanFeeHeadSetup
