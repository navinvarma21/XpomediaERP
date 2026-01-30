"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../../components/MainContent/MainContentPage"
import { Form, Button, Row, Col, Container, Table, Spinner } from "react-bootstrap"
import { FaEdit, FaTrash } from "react-icons/fa"
import { useAuthContext } from "../../../Context/AuthContext"
import { ENDPOINTS } from "../../../SpringBoot/config";
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "../Styles/style.css"

// Add Head Modal Component
const AddHeadModal = ({ isOpen, onClose, onConfirm }) => {
  const [headName, setHeadName] = useState("")

  if (!isOpen) return null

  const handleSubmit = () => {
    onConfirm(headName)
    setHeadName("")
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Add Head</h2>
        <div className="modal-body">
          <Form.Control
            type="text"
            placeholder="Enter New Head Name"
            value={headName}
            onChange={(e) => setHeadName(e.target.value)}
            className="custom-input"
          />
        </div>
        <div className="modal-buttons">
          <Button className="modal-button confirm" onClick={handleSubmit}>
            Add
          </Button>
          <Button className="modal-button cancel" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

// Edit Head Modal Component
const EditHeadModal = ({ isOpen, onClose, onConfirm, head }) => {
  const [headName, setHeadName] = useState(head?.headName || "")

  useEffect(() => {
    if (head) {
      setHeadName(head.headName)
    }
  }, [head])

  if (!isOpen) return null

  const handleSubmit = () => {
    onConfirm(head.id, headName)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Edit Head</h2>
        <div className="modal-body">
          <Form.Control
            type="text"
            placeholder="Enter Head Name"
            value={headName}
            onChange={(e) => setHeadName(e.target.value)}
            className="custom-input"
          />
        </div>
        <div className="modal-buttons">
          <Button className="modal-button confirm" onClick={handleSubmit}>
            Update
          </Button>
          <Button className="modal-button cancel" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

// Delete Head Modal Component
const DeleteHeadModal = ({ isOpen, onClose, onConfirm, head }) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Delete Head</h2>
        <div className="modal-body text-center">
          <p>Are you sure you want to delete this head?</p>
          <p className="fw-bold">{head?.headName}</p>
        </div>
        <div className="modal-buttons">
          <Button className="modal-button delete" onClick={() => onConfirm(head.id)}>
            Delete
          </Button>
          <Button className="modal-button cancel" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

// Confirm Edit Modal Component
const ConfirmEditModal = ({ isOpen, onClose, onConfirm, currentName, newName }) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Confirm Edit</h2>
        <div className="modal-body">
          <p>Are you sure you want to edit this receipt head? This may affect the structure of receipt data.</p>
          <p>
            <strong>Current Name:</strong> {currentName}
          </p>
          <p>
            <strong>New Name:</strong> {newName}
          </p>
        </div>
        <div className="modal-buttons">
          <Button className="modal-button confirm" onClick={onConfirm}>
            Confirm Edit
          </Button>
          <Button className="modal-button cancel" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

const ReceiptHeadSetup = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isConfirmEditModalOpen, setIsConfirmEditModalOpen] = useState(false)
  const [selectedHead, setSelectedHead] = useState(null)
  const [newHeadName, setNewHeadName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [heads, setHeads] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const { user, admin, currentAcademicYear, schoolId, getAuthHeaders } = useAuthContext()

  // Reset state and fetch data when user or academic year changes
  useEffect(() => {
    const resetState = () => {
      setHeads([])
      setSearchTerm("")
      setSelectedHead(null)
      setNewHeadName("")
      setIsAddModalOpen(false)
      setIsEditModalOpen(false)
      setIsDeleteModalOpen(false)
      setIsConfirmEditModalOpen(false)
    }

    resetState()

    const checkAuthAndFetchData = async () => {
      if ((user || admin) && currentAcademicYear) {
        setIsLoading(true)
        try {
          await fetchHeads()
        } catch (error) {
          toast.error("An error occurred while loading data.")
        } finally {
          setIsLoading(false)
        }
      } else if (!currentAcademicYear) {
        toast.error("Please select an academic year to view and manage receipt heads.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })
      } else {
        toast.error("Please log in to view and manage receipt heads.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })
      }
    }

    checkAuthAndFetchData()

    return () => resetState()
  }, [user, admin, currentAcademicYear, schoolId])

  const fetchHeads = async () => {
    if ((!user && !admin) || !currentAcademicYear) return

    setIsLoading(true)
    try {
      const response = await fetch(`${ENDPOINTS.administration}/receiptsetup/heads`, {
        method: "GET",
        headers: {
          ...getAuthHeaders(),
          "X-School-Id": schoolId,
          "X-Academic-Year": currentAcademicYear
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch receipt heads")
      }

      const headsData = await response.json()
      setHeads(headsData)
    } catch (error) {
      toast.error("Failed to fetch receipt heads. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
      setHeads([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddHead = async (headName) => {
    if ((!user && !admin) || !currentAcademicYear) {
      toast.error("User not logged in or no academic year selected. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
      return
    }

    if (!headName.trim()) {
      toast.error("Head name cannot be empty.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
      return
    }

    const isDuplicate = heads.some((head) => head.headName.toLowerCase() === headName.toLowerCase())
    if (isDuplicate) {
      toast.error("A head with this name already exists. Please choose a different name.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${ENDPOINTS.administration}/receiptsetup/heads`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "X-School-Id": schoolId,
          "X-Academic-Year": currentAcademicYear
        },
        body: JSON.stringify({
          headName: headName.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add receipt head")
      }

      const newHead = await response.json()

      setHeads((prevHeads) => [...prevHeads, newHead])
      setIsAddModalOpen(false)
      toast.success("Receipt head added successfully!", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        style: { background: "#0B3D7B", color: "white" },
      })

      await fetchHeads()
    } catch (error) {
      toast.error("Failed to add receipt head. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditHead = async (headId, newHeadName) => {
    if ((!user && !admin) || !currentAcademicYear) {
      toast.error("User not logged in or no academic year selected. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
      return
    }

    if (!newHeadName.trim()) {
      toast.error("Head name cannot be empty.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
      return
    }

    const isDuplicate = heads.some(
      (head) => head.id !== headId && head.headName.toLowerCase() === newHeadName.toLowerCase(),
    )
    if (isDuplicate) {
      toast.error("A head with this name already exists. Please choose a different name.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
      return
    }

    setIsEditModalOpen(false)
    setIsConfirmEditModalOpen(true)
    setNewHeadName(newHeadName)
  }

  const confirmEditHead = async () => {
    if ((!user && !admin) || !currentAcademicYear) {
      toast.error("User not logged in or no academic year selected. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${ENDPOINTS.administration}/receiptsetup/heads/${selectedHead.id}`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "X-School-Id": schoolId,
          "X-Academic-Year": currentAcademicYear
        },
        body: JSON.stringify({
          headName: newHeadName.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update receipt head")
      }

      const updatedHead = await response.json()

      setHeads((prevHeads) =>
        prevHeads.map((head) => (head.id === selectedHead.id ? updatedHead : head)),
      )

      setIsConfirmEditModalOpen(false)
      setSelectedHead(null)
      setNewHeadName("")
      toast.success("Receipt head updated successfully!", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        style: { background: "#0B3D7B", color: "white" },
      })

      await fetchHeads()
    } catch (error) {
      toast.error("Failed to update receipt head. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteHead = async (headId) => {
    if ((!user && !admin) || !currentAcademicYear) {
      toast.error("User not logged in or no academic year selected. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${ENDPOINTS.administration}/receiptsetup/heads/${headId}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(),
          "X-School-Id": schoolId,
          "X-Academic-Year": currentAcademicYear
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete receipt head")
      }

      setHeads((prevHeads) => prevHeads.filter((head) => head.id !== headId))
      setIsDeleteModalOpen(false)
      setSelectedHead(null)
      toast.success("Receipt head deleted successfully!", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })

      await fetchHeads()
    } catch (error) {
      toast.error("Failed to delete receipt head. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openEditModal = (head) => {
    setSelectedHead(head)
    setIsEditModalOpen(true)
  }

  const openDeleteModal = (head) => {
    setSelectedHead(head)
    setIsDeleteModalOpen(true)
  }

  const filteredHeads = heads.filter(
    (head) => head.headName && head.headName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <MainContentPage>
      <Container fluid className="px-0 px-lg-0">
        {/* Breadcrumb Navigation */}
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link>
          <span className="separator">&gt;</span>
          <span>Administration</span>
          <span className="separator">&gt;</span>
          <Link to="/administration/receipt-setup">Receipt Setup</Link>
          <span className="separator">&gt;</span>
          <span className="current col-12">Receipt Head Setup</span>
        </nav>

        <Row>
          <Col xs={12}>
            <div className="course-setup-container">
              <div className="form-card mt-3">
                {/* Header */}
                <div className="header p-3 d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="m-0 d-none d-lg-block">Head Of Account</h2>
                    <h6 className="m-0 d-lg-none">Head Of Account</h6>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Button
                      onClick={() => setIsAddModalOpen(true)}
                      className="btn btn-primary text-light"
                      disabled={!currentAcademicYear || isLoading}
                    >
                      + Add Head
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="content-wrapper p-4">
                  {!currentAcademicYear ? (
                    <div className="alert alert-warning">Please select an academic year to manage receipt heads.</div>
                  ) : (
                    <>
                      {/* Search Bar */}
                      <div className="position-relative mb-3">
                        <Form.Control
                          type="text"
                          placeholder="Search by Head Name"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="custom-search mb-3"
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

                      {/* Loading Indicator */}
                      {isLoading && (
                        <div className="text-center my-4">
                          <Spinner animation="border" role="status" variant="primary" className="loader">
                            <span className="visually-hidden">Loading...</span>
                          </Spinner>
                          <p className="mt-2">Loading data...</p>
                        </div>
                      )}

                      {/* Heads Table */}
                      {!isLoading && (
                        <div className="table-responsive">
                          <Table bordered hover>
                            <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                              <tr>
                                <th>Head Name</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {heads.length === 0 ? (
                                <tr>
                                  <td colSpan="2" className="text-center">
                                    No data available
                                  </td>
                                </tr>
                              ) : filteredHeads.length === 0 && searchTerm ? (
                                <tr>
                                  <td colSpan="2" className="text-center">
                                    No matching heads found
                                  </td>
                                </tr>
                              ) : (
                                filteredHeads.map((head) => (
                                  <tr key={head.id}>
                                    <td>{head.headName}</td>
                                    <td>
                                      <Button
                                        variant="link"
                                        className="action-button edit-button me-2"
                                        onClick={() => openEditModal(head)}
                                      >
                                        <FaEdit />
                                      </Button>
                                      <Button
                                        variant="link"
                                        className="action-button delete-button"
                                        onClick={() => openDeleteModal(head)}
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
                    </>
                  )}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Modals */}
      <AddHeadModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onConfirm={handleAddHead} />
      <EditHeadModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedHead(null)
        }}
        onConfirm={handleEditHead}
        head={selectedHead}
      />
      <DeleteHeadModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedHead(null)
        }}
        onConfirm={handleDeleteHead}
        head={selectedHead}
      />
      <ConfirmEditModal
        isOpen={isConfirmEditModalOpen}
        onClose={() => {
          setIsConfirmEditModalOpen(false)
          setSelectedHead(null)
          setNewHeadName("")
        }}
        onConfirm={confirmEditHead}
        currentName={selectedHead?.headName}
        newName={newHeadName}
      />

      {/* Toastify Container */}
      <ToastContainer />
    </MainContentPage>
  )
}

export default ReceiptHeadSetup
