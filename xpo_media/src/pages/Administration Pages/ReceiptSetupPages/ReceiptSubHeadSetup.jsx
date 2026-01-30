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

// Add SubHead Modal Component
const AddSubHeadModal = ({ isOpen, onClose, onConfirm, mainHeads }) => {
  const [mainHeadName, setMainHeadName] = useState("")
  const [subHeadName, setSubHeadName] = useState("")

  useEffect(() => {
    // Reset form when modal opens
    if (isOpen) {
      setMainHeadName("")
      setSubHeadName("")
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = () => {
    onConfirm(mainHeadName, subHeadName)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Add Sub Head</h2>
        <div className="modal-body">
          <Form.Group className="mb-3">
            <Form.Label>Select Main Head</Form.Label>
            <Form.Control
              as="select"
              value={mainHeadName}
              onChange={(e) => setMainHeadName(e.target.value)}
              className="custom-input mb-3"
            >
              <option value="">-- Select Main Head --</option>
              {mainHeads && mainHeads.length > 0 ? (
                mainHeads.map((head) => (
                  <option key={head.id} value={head.headName}>
                    {head.headName}
                  </option>
                ))
              ) : (
                <option disabled>No main heads available</option>
              )}
            </Form.Control>
          </Form.Group>
          <Form.Group>
            <Form.Label>Enter Sub Head Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Sub Head Name"
              value={subHeadName}
              onChange={(e) => setSubHeadName(e.target.value)}
              className="custom-input"
            />
          </Form.Group>
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

// Edit SubHead Modal Component
const EditSubHeadModal = ({ isOpen, onClose, onConfirm, subHead, mainHeads }) => {
  const [mainHeadName, setMainHeadName] = useState(subHead?.mainHeadName || "")
  const [subHeadName, setSubHeadName] = useState(subHead?.subHeadName || "")

  useEffect(() => {
    if (subHead) {
      setMainHeadName(subHead.mainHeadName)
      setSubHeadName(subHead.subHeadName)
    }
  }, [subHead])

  if (!isOpen) return null

  const handleSubmit = () => {
    onConfirm(subHead.id, mainHeadName, subHeadName)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Edit Sub Head</h2>
        <div className="modal-body">
          <Form.Group className="mb-3">
            <Form.Label>Select Main Head</Form.Label>
            <Form.Control
              as="select"
              value={mainHeadName}
              onChange={(e) => setMainHeadName(e.target.value)}
              className="custom-input mb-3"
            >
              <option value="">-- Select Main Head --</option>
              {mainHeads && mainHeads.length > 0 ? (
                mainHeads.map((head) => (
                  <option key={head.id} value={head.headName}>
                    {head.headName}
                  </option>
                ))
              ) : (
                <option disabled>No main heads available</option>
              )}
            </Form.Control>
          </Form.Group>
          <Form.Group>
            <Form.Label>Enter Sub Head Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Sub Head Name"
              value={subHeadName}
              onChange={(e) => setSubHeadName(e.target.value)}
              className="custom-input"
            />
          </Form.Group>
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

// Delete SubHead Modal Component
const DeleteSubHeadModal = ({ isOpen, onClose, onConfirm, subHead }) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Delete Sub Head</h2>
        <div className="modal-body text-center">
          <p>Are you sure you want to delete this sub head?</p>
          <p className="fw-bold">{subHead?.subHeadName}</p>
          <p>Main Head: {subHead?.mainHeadName}</p>
        </div>
        <div className="modal-buttons">
          <Button className="modal-button delete" onClick={() => onConfirm(subHead.id)}>
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
const ConfirmEditModal = ({ isOpen, onClose, onConfirm, currentData, newData }) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Confirm Edit</h2>
        <div className="modal-body">
          <p>Are you sure you want to edit this receipt sub head? This may affect the structure of receipt data.</p>
          <p>
            <strong>Current Main Head:</strong> {currentData.mainHeadName}
          </p>
          <p>
            <strong>Current Sub Head:</strong> {currentData.subHeadName}
          </p>
          <p>
            <strong>New Main Head:</strong> {newData.mainHeadName}
          </p>
          <p>
            <strong>New Sub Head:</strong> {newData.subHeadName}
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

const ReceiptSubHeadSetup = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isConfirmEditModalOpen, setIsConfirmEditModalOpen] = useState(false)
  const [selectedSubHead, setSelectedSubHead] = useState(null)
  const [newSubHeadData, setNewSubHeadData] = useState({ mainHeadName: "", subHeadName: "" })
  const [searchTerm, setSearchTerm] = useState("")
  const [subHeads, setSubHeads] = useState([])
  const [mainHeads, setMainHeads] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, admin, currentAcademicYear, schoolId, getAuthHeaders } = useAuthContext()

  // Reset state and fetch data when user or academic year changes
  useEffect(() => {
    const resetState = () => {
      setSubHeads([])
      setMainHeads([])
      setSearchTerm("")
      setSelectedSubHead(null)
      setNewSubHeadData({ mainHeadName: "", subHeadName: "" })
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
          await fetchMainHeads()
          await fetchSubHeads()
        } catch (error) {
          toast.error("An error occurred while loading data.")
        } finally {
          setIsLoading(false)
        }
      } else if (!currentAcademicYear) {
        toast.error("Please select an academic year to view and manage receipt sub heads.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })
      } else {
        toast.error("Please log in to view and manage receipt sub heads.", {
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

  const fetchMainHeads = async () => {
    if ((!user && !admin) || !currentAcademicYear) return

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
        throw new Error("Failed to fetch main receipt heads")
      }

      const headsData = await response.json()
      setMainHeads(headsData)
    } catch (error) {
      toast.error("Failed to fetch main receipt heads. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
      setMainHeads([])
    }
  }

  const fetchSubHeads = async () => {
    if ((!user && !admin) || !currentAcademicYear) return

    try {
      const response = await fetch(`${ENDPOINTS.administration}/receiptsetup/subheads`, {
        method: "GET",
        headers: {
          ...getAuthHeaders(),
          "X-School-Id": schoolId,
          "X-Academic-Year": currentAcademicYear
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch receipt sub heads")
      }

      const subHeadsData = await response.json()
      setSubHeads(subHeadsData)
    } catch (error) {
      toast.error("Failed to fetch receipt sub heads. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
      setSubHeads([])
    }
  }

  const handleAddSubHead = async (mainHeadName, subHeadName) => {
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

    if (!mainHeadName) {
      toast.error("Please select a main head.", {
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

    if (!subHeadName.trim()) {
      toast.error("Sub head name cannot be empty.", {
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

    const isDuplicate = subHeads.some(
      (subHead) =>
        subHead.mainHeadName === mainHeadName && subHead.subHeadName.toLowerCase() === subHeadName.toLowerCase(),
    )
    if (isDuplicate) {
      toast.error("A sub head with this name already exists under the selected main head.", {
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
      const response = await fetch(`${ENDPOINTS.administration}/receiptsetup/subheads`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "X-School-Id": schoolId,
          "X-Academic-Year": currentAcademicYear
        },
        body: JSON.stringify({
          mainHeadName: mainHeadName,
          subHeadName: subHeadName.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add receipt sub head")
      }

      const newSubHead = await response.json()

      setSubHeads((prevSubHeads) => [...prevSubHeads, newSubHead])
      setIsAddModalOpen(false)
      toast.success("Receipt sub head added successfully!", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        style: { background: "#0B3D7B", color: "white" },
      })

      await fetchSubHeads()
    } catch (error) {
      toast.error("Failed to add receipt sub head. Please try again.", {
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

  const handleEditSubHead = async (subHeadId, mainHeadName, newSubHeadName) => {
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

    if (!mainHeadName) {
      toast.error("Please select a main head.", {
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

    if (!newSubHeadName.trim()) {
      toast.error("Sub head name cannot be empty.", {
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

    const isDuplicate = subHeads.some(
      (subHead) =>
        subHead.id !== subHeadId &&
        subHead.mainHeadName === mainHeadName &&
        subHead.subHeadName.toLowerCase() === newSubHeadName.toLowerCase(),
    )
    if (isDuplicate) {
      toast.error("A sub head with this name already exists under the selected main head.", {
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
    setNewSubHeadData({ mainHeadName, subHeadName: newSubHeadName })
    setIsConfirmEditModalOpen(true)
  }

  const confirmEditSubHead = async () => {
    if ((!user && !admin) || !currentAcademicYear || !selectedSubHead) {
      toast.error("User not logged in, no academic year selected, or no sub head selected. Please try again.", {
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
      const response = await fetch(`${ENDPOINTS.administration}/receiptsetup/subheads/${selectedSubHead.id}`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "X-School-Id": schoolId,
          "X-Academic-Year": currentAcademicYear
        },
        body: JSON.stringify({
          mainHeadName: newSubHeadData.mainHeadName,
          subHeadName: newSubHeadData.subHeadName.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update receipt sub head")
      }

      const updatedSubHead = await response.json()

      setSubHeads((prevSubHeads) =>
        prevSubHeads.map((subHead) =>
          subHead.id === selectedSubHead.id ? updatedSubHead : subHead
        ),
      )

      setIsConfirmEditModalOpen(false)
      setSelectedSubHead(null)
      setNewSubHeadData({ mainHeadName: "", subHeadName: "" })
      toast.success("Receipt sub head updated successfully!", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        style: { background: "#0B3D7B", color: "white" },
      })

      await fetchSubHeads()
    } catch (error) {
      toast.error("Failed to update receipt sub head. Please try again.", {
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

  const handleDeleteSubHead = async (subHeadId) => {
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
      const response = await fetch(`${ENDPOINTS.administration}/receiptsetup/subheads/${subHeadId}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(),
          "X-School-Id": schoolId,
          "X-Academic-Year": currentAcademicYear
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete receipt sub head")
      }

      setSubHeads((prevSubHeads) => prevSubHeads.filter((subHead) => subHead.id !== subHeadId))
      setIsDeleteModalOpen(false)
      setSelectedSubHead(null)
      toast.success("Receipt sub head deleted successfully!", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })

      await fetchSubHeads()
    } catch (error) {
      toast.error("Failed to delete receipt sub head. Please try again.", {
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

  const openEditModal = (subHead) => {
    setSelectedSubHead(subHead)
    setIsEditModalOpen(true)
  }

  const openDeleteModal = (subHead) => {
    setSelectedSubHead(subHead)
    setIsDeleteModalOpen(true)
  }

  const filteredSubHeads = subHeads.filter(
    (subHead) =>
      (subHead.subHeadName && subHead.subHeadName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (subHead.mainHeadName && subHead.mainHeadName.toLowerCase().includes(searchTerm.toLowerCase())),
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
          <span className="current">Receipt Sub Head Setup</span>
        </nav>

        <Row>
          <Col xs={12}>
            <div className="course-setup-container">
              <div className="form-card mt-3">
                {/* Header */}
                <div className="header p-3 d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="m-0 d-none d-lg-block">Sub Head Of Account</h2>
                    <h6 className="m-0 d-lg-none">Sub Head Of Account</h6>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Button
                      onClick={() => {
                        if (mainHeads.length === 0) {
                          toast.error("Please add main receipt heads first before adding sub heads.", {
                            position: "top-right",
                            autoClose: 3000,
                          })
                        } else {
                          setIsAddModalOpen(true)
                        }
                      }}
                      className="btn btn-primary text-light"
                      disabled={!currentAcademicYear || isLoading}
                    >
                      + Add Sub Head
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="content-wrapper p-4">
                  {!currentAcademicYear ? (
                    <div className="alert alert-warning">Please select an academic year to manage receipt sub heads.</div>
                  ) : (
                    <>
                      {/* Search Bar with Clear Button */}
                      <div className="position-relative mb-3">
                        <Form.Control
                          type="text"
                          placeholder="Search by Sub Head or Main Head Name"
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

                      {/* Loading Indicator */}
                      {isLoading && (
                        <div className="text-center my-4">
                          <Spinner animation="border" role="status" variant="primary" className="loader">
                            <span className="visually-hidden">Loading...</span>
                          </Spinner>
                          <p className="mt-2">Loading data...</p>
                        </div>
                      )}

                      {/* Sub Heads Table */}
                      {!isLoading && (
                        <div className="table-responsive">
                          <Table bordered hover>
                            <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                              <tr>
                                <th>Main Head Name</th>
                                <th>Sub Head Name</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {subHeads.length === 0 ? (
                                <tr>
                                  <td colSpan="3" className="text-center">
                                    No data available
                                  </td>
                                </tr>
                              ) : filteredSubHeads.length === 0 && searchTerm ? (
                                <tr>
                                  <td colSpan="3" className="text-center">
                                    No matching sub heads found
                                  </td>
                                </tr>
                              ) : (
                                filteredSubHeads.map((subHead) => (
                                  <tr key={subHead.id}>
                                    <td>{subHead.mainHeadName}</td>
                                    <td>{subHead.subHeadName}</td>
                                    <td>
                                      <Button
                                        variant="link"
                                        className="action-button edit-button me-2"
                                        onClick={() => openEditModal(subHead)}
                                      >
                                        <FaEdit />
                                      </Button>
                                      <Button
                                        variant="link"
                                        className="action-button delete-button"
                                        onClick={() => openDeleteModal(subHead)}
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
      <AddSubHeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={handleAddSubHead}
        mainHeads={mainHeads}
      />
      <EditSubHeadModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedSubHead(null)
        }}
        onConfirm={handleEditSubHead}
        subHead={selectedSubHead}
        mainHeads={mainHeads}
      />
      <DeleteSubHeadModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedSubHead(null)
        }}
        onConfirm={handleDeleteSubHead}
        subHead={selectedSubHead}
      />
      <ConfirmEditModal
        isOpen={isConfirmEditModalOpen}
        onClose={() => {
          setIsConfirmEditModalOpen(false)
          setSelectedSubHead(null)
          setNewSubHeadData({ mainHeadName: "", subHeadName: "" })
        }}
        onConfirm={confirmEditSubHead}
        currentData={selectedSubHead || {}}
        newData={newSubHeadData}
      />

      {/* Toastify Container */}
      <ToastContainer />
    </MainContentPage>
  )
}

export default ReceiptSubHeadSetup
