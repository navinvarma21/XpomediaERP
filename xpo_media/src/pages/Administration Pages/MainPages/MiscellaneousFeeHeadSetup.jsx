"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../../components/MainContent/MainContentPage"
import { Form, Button, Row, Col, Container, Table, Spinner, InputGroup } from "react-bootstrap"
import { FaEdit, FaTrash, FaTimes } from "react-icons/fa"
import axios from "axios"
import { useAuthContext } from "../../../Context/AuthContext"
import { ToastContainer, toast } from "react-toastify"
import { ENDPOINTS } from "../../../SpringBoot/config"
import "react-toastify/dist/ReactToastify.css"
import "../styles/style.css"
import * as XLSX from "xlsx"

// Add Miscellaneous Fee Head Modal Component
const AddMiscellaneousFeeHeadModal = ({ isOpen, onClose, onConfirm }) => {
  const [feeHead, setFeeHead] = useState("")
  const [accountHead, setAccountHead] = useState("")

  if (!isOpen) return null

  const handleSubmit = () => {
    onConfirm({ feeHead, accountHead })
    setFeeHead("")
    setAccountHead("")
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Add Miscellaneous Fee Head</h2>
        <div className="modal-body">
          <Form.Group className="mb-3">
            <Form.Label>Enter New Miscellaneous Fee Head</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Library Fee, Sports Fee, etc."
              value={feeHead}
              onChange={(e) => setFeeHead(e.target.value)}
              className="custom-input"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Enter Account Head</Form.Label>
            <Form.Control
              type="text"
              placeholder="Name of the miscellaneous fee account transfer"
              value={accountHead}
              onChange={(e) => setAccountHead(e.target.value)}
              className="custom-input"
            />
          </Form.Group>
        </div>
        <div className="modal-buttons">
          <Button className="modal-button confirm" onClick={handleSubmit}>
            Create Miscellaneous Fee Head
          </Button>
          <Button className="modal-button cancel" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

// Edit Miscellaneous Fee Head Modal Component
const EditMiscellaneousFeeHeadModal = ({ isOpen, onClose, onConfirm, feeHeadData }) => {
  const [feeHead, setFeeHead] = useState(feeHeadData?.feeHead || "")
  const [accountHead, setAccountHead] = useState(feeHeadData?.accountHead || "")

  useEffect(() => {
    if (feeHeadData) {
      setFeeHead(feeHeadData.feeHead)
      setAccountHead(feeHeadData.accountHead)
    }
  }, [feeHeadData])

  if (!isOpen) return null

  const handleSubmit = () => {
    onConfirm(feeHeadData.id, { feeHead, accountHead })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Edit Miscellaneous Fee Head</h2>
        <div className="modal-body">
          <Form.Group className="mb-3">
            <Form.Label>Edit Miscellaneous Fee Head</Form.Label>
            <Form.Control
              type="text"
              value={feeHead}
              onChange={(e) => setFeeHead(e.target.value)}
              className="custom-input"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Edit Account Head</Form.Label>
            <Form.Control
              type="text"
              value={accountHead}
              onChange={(e) => setAccountHead(e.target.value)}
              className="custom-input"
            />
          </Form.Group>
        </div>
        <div className="modal-buttons">
          <Button className="modal-button confirm" onClick={handleSubmit}>
            Update Miscellaneous Fee Head
          </Button>
          <Button className="modal-button cancel" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

// Delete Miscellaneous Fee Head Modal Component
const DeleteMiscellaneousFeeHeadModal = ({ isOpen, onClose, onConfirm, feeHeadData }) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Delete Miscellaneous Fee Head</h2>
        <div className="modal-body text-center">
          <p>Are you sure you want to delete this miscellaneous fee head?</p>
          <p className="fw-bold">{feeHeadData?.feeHead}</p>
        </div>
        <div className="modal-buttons">
          <Button className="modal-button delete" onClick={() => onConfirm(feeHeadData.id)}>
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
const ConfirmEditModal = ({ isOpen, onClose, onConfirm, currentFeeHead, newFeeHead }) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Confirm Edit</h2>
        <div className="modal-body">
          <p>Are you sure you want to edit this miscellaneous fee head? This may affect the structure of student miscellaneous fee data.</p>
          <p>
            <strong>Old Fee Head:</strong> {currentFeeHead?.feeHead}
          </p>
          <p>
            <strong>New Fee Head:</strong> {newFeeHead?.feeHead}
          </p>
          <p>
            <strong>Old Account Head:</strong> {currentFeeHead?.accountHead}
          </p>
          <p>
            <strong>New Account Head:</strong> {newFeeHead?.accountHead}
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

const MiscellaneousFeeHeadSetup = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isConfirmEditModalOpen, setIsConfirmEditModalOpen] = useState(false)
  const [selectedFeeHead, setSelectedFeeHead] = useState(null)
  const [newFeeHeadData, setNewFeeHeadData] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [miscFeeHeads, setMiscFeeHeads] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [deletingIds, setDeletingIds] = useState(new Set())
  const { user, isAuthLoading, currentAcademicYear, getAuthHeaders } = useAuthContext()

  // Build base URL dynamically
  const MISC_FEE_HEADS_URL = `${ENDPOINTS.administration}/miscellaneousFeeHeads`

  // Fetch miscellaneous fee heads
  const fetchMiscFeeHeads = useCallback(async () => {
    if (!user?.uid || !currentAcademicYear) return
    
    setIsLoading(true)
    try {
      const response = await axios.get(MISC_FEE_HEADS_URL, {
        params: { 
          schoolId: user.uid, 
          year: currentAcademicYear 
        },
        headers: getAuthHeaders()
      })
      setMiscFeeHeads(response.data || [])
    } catch (error) {
      console.error("Error fetching miscellaneous fee heads:", error)
      toast.error("Failed to fetch miscellaneous fee heads. Please try again.", {
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
  }, [user?.uid, currentAcademicYear, getAuthHeaders])

  // Clear search
  const clearSearch = () => {
    setSearchTerm("")
  }

  // Add miscellaneous fee head with optimistic update
  const handleAddMiscFeeHead = useCallback(
    async (newFeeHead) => {
      if (!user?.uid || !currentAcademicYear) {
        toast.error("User not logged in or no academic year selected.", {
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

      if (!newFeeHead.feeHead.trim() || !newFeeHead.accountHead.trim()) {
        toast.error("Fee head and account head cannot be empty.", {
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

      if (miscFeeHeads.some((fh) => fh.feeHead.toLowerCase() === newFeeHead.feeHead.toLowerCase())) {
        toast.error("A miscellaneous fee head with this name already exists.", {
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
      const tempId = `temp_${Date.now()}`
      const newFeeHeadWithId = { 
        id: tempId, 
        feeHead: newFeeHead.feeHead, 
        accountHead: newFeeHead.accountHead,
        schoolId: user.uid,
        academicYear: currentAcademicYear
      }
      
      try {
        // Optimistic update
        setMiscFeeHeads((prev) => [...prev, newFeeHeadWithId])

        const response = await axios.post(MISC_FEE_HEADS_URL, newFeeHead, {
          params: {
            schoolId: user.uid,
            year: currentAcademicYear
          },
          headers: getAuthHeaders()
        })

        // Replace temp ID with actual ID from backend
        setMiscFeeHeads((prev) => 
          prev.map((fh) => 
            fh.id === tempId ? { ...response.data } : fh
          )
        )
        
        setIsAddModalOpen(false)
        toast.success("Miscellaneous fee head added successfully!", {
          position: "top-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          style: { background: "#0B3D7B", color: "white" },
        })
      } catch (error) {
        console.error("Error adding miscellaneous fee head:", error)
        const errorMessage = error.response?.data?.message || error.message || "Failed to add miscellaneous fee head"
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })
        // Rollback optimistic update
        setMiscFeeHeads((prev) => prev.filter((fh) => fh.id !== tempId))
      } finally {
        setIsLoading(false)
      }
    },
    [user?.uid, currentAcademicYear, miscFeeHeads, getAuthHeaders],
  )

  // Edit miscellaneous fee head with optimistic update
  const handleEditMiscFeeHead = useCallback(
    async (id, updatedFeeHead) => {
      if (!user?.uid || !currentAcademicYear) {
        toast.error("User not logged in or no academic year selected.", {
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

      if (!updatedFeeHead.feeHead.trim() || !updatedFeeHead.accountHead.trim()) {
        toast.error("Fee head and account head cannot be empty.", {
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

      if (miscFeeHeads.some((fh) => fh.id !== id && fh.feeHead.toLowerCase() === updatedFeeHead.feeHead.toLowerCase())) {
        toast.error("A miscellaneous fee head with this name already exists.", {
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
      setNewFeeHeadData(updatedFeeHead)
    },
    [user?.uid, currentAcademicYear, miscFeeHeads],
  )

  const confirmEditMiscFeeHead = useCallback(async () => {
    if (!user?.uid || !currentAcademicYear) {
      toast.error("User not logged in or no academic year selected.", {
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
    const originalFeeHead = miscFeeHeads.find((fh) => fh.id === selectedFeeHead.id)
    
    try {
      // Optimistic update
      setMiscFeeHeads((prev) =>
        prev.map((fh) => (fh.id === selectedFeeHead.id ? { ...fh, ...newFeeHeadData } : fh))
      )

      await axios.put(`${MISC_FEE_HEADS_URL}/${selectedFeeHead.id}`, newFeeHeadData, {
        params: {
          schoolId: user.uid,
          year: currentAcademicYear
        },
        headers: getAuthHeaders()
      })

      setIsConfirmEditModalOpen(false)
      setSelectedFeeHead(null)
      setNewFeeHeadData(null)
      toast.success("Miscellaneous fee head updated successfully!", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        style: { background: "#0B3D7B", color: "white" },
      })
    } catch (error) {
      console.error("Error updating miscellaneous fee head:", error)
      const errorMessage = error.response?.data?.message || error.message || "Failed to update miscellaneous fee head"
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
      // Rollback optimistic update
      setMiscFeeHeads((prev) =>
        prev.map((fh) => (fh.id === selectedFeeHead.id ? { ...fh, ...originalFeeHead } : fh))
      )
    } finally {
      setIsLoading(false)
    }
  }, [user?.uid, currentAcademicYear, miscFeeHeads, selectedFeeHead, newFeeHeadData, getAuthHeaders])

  // Delete miscellaneous fee head with optimistic update
  const handleDeleteMiscFeeHead = useCallback(
    async (id) => {
      if (!user?.uid || !currentAcademicYear) {
        toast.error("User not logged in or no academic year selected.", {
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

      setDeletingIds((prev) => new Set([...prev, id]))
      const deletedFeeHead = miscFeeHeads.find((fh) => fh.id === id)
      
      try {
        // Optimistic update
        setMiscFeeHeads((prev) => prev.filter((fh) => fh.id !== id))

        await axios.delete(`${MISC_FEE_HEADS_URL}/${id}`, {
          params: { 
            schoolId: user.uid
          },
          headers: getAuthHeaders()
        })

        setIsDeleteModalOpen(false)
        setSelectedFeeHead(null)
        toast.success("Miscellaneous fee head deleted successfully!", {
          position: "top-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })
      } catch (error) {
        console.error("Error deleting miscellaneous fee head:", error)
        const errorMessage = error.response?.data?.message || error.message || "Failed to delete miscellaneous fee head"
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })
        // Rollback optimistic update
        setMiscFeeHeads((prev) => {
          const updated = [...prev, deletedFeeHead].sort((a, b) =>
            a.feeHead.localeCompare(b.feeHead, undefined, { numeric: true, sensitivity: "base" })
          )
          return updated
        })
      } finally {
        setDeletingIds((prev) => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      }
    },
    [user?.uid, currentAcademicYear, miscFeeHeads, getAuthHeaders],
  )

  // Import miscellaneous fee heads
  const handleImport = useCallback(
    async (event) => {
      if (!user?.uid || !currentAcademicYear) {
        toast.error("User not logged in or no academic year selected.", {
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

      const file = event.target.files[0]
      if (!file) return

      setIsLoading(true)
      try {
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const data = new Uint8Array(e.target.result)
            const workbook = XLSX.read(data, { type: "array" })
            const sheetName = workbook.SheetNames[0]
            const sheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(sheet)

            if (jsonData.length === 0) {
              toast.error("No data found in the imported file.")
              return
            }

            const importPromises = jsonData
              .map(row => ({
                feeHead: row["Fee Head"]?.toString().trim(),
                accountHead: row["Account Head"]?.toString().trim()
              }))
              .filter(item => item.feeHead && item.accountHead)
              .map(async (item) => {
                try {
                  const response = await axios.post(MISC_FEE_HEADS_URL, item, {
                    params: {
                      schoolId: user.uid,
                      year: currentAcademicYear
                    },
                    headers: getAuthHeaders()
                  })
                  return response.data
                } catch (error) {
                  console.error(`Failed to import miscellaneous fee head: ${item.feeHead}`, error)
                  return null
                }
              })

            const results = await Promise.all(importPromises)
            const successfulImports = results.filter(item => item !== null)

            // Refresh the list
            await fetchMiscFeeHeads()
            
            toast.success(`Successfully imported ${successfulImports.length} miscellaneous fee heads!`, {
              style: { background: "#0B3D7B", color: "white" },
            })
          } catch (error) {
            console.error("Error processing import file:", error)
            toast.error("Failed to process import file. Please try again.")
          }
        }
        reader.readAsArrayBuffer(file)
      } catch (error) {
        console.error("Error importing miscellaneous fee heads:", error)
        toast.error("Failed to import miscellaneous fee heads. Please try again.")
      } finally {
        setIsLoading(false)
      }
    },
    [user?.uid, currentAcademicYear, getAuthHeaders, fetchMiscFeeHeads],
  )

  // Export miscellaneous fee heads
  const handleExport = useCallback(() => {
    if (!user?.uid || !currentAcademicYear) {
      toast.error("User not logged in or no academic year selected.", {
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

    if (miscFeeHeads.length === 0) {
      toast.error("No data available to export.")
      return
    }

    const exportData = miscFeeHeads.map((feeHead) => ({
      "Fee Head": feeHead.feeHead,
      "Account Head": feeHead.accountHead,
    }))
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "MiscellaneousFeeHeads")
    XLSX.writeFile(workbook, `MiscellaneousFeeHeads_Export_${user.uid}_${currentAcademicYear}.xlsx`)
    toast.success("Miscellaneous fee heads exported successfully!", {
      style: { background: "#0B3D7B", color: "white" },
    })
  }, [user?.uid, currentAcademicYear, miscFeeHeads])

  const openEditModal = useCallback((feeHead) => {
    setSelectedFeeHead(feeHead)
    setIsEditModalOpen(true)
  }, [])

  const openDeleteModal = useCallback((feeHead) => {
    setSelectedFeeHead(feeHead)
    setIsDeleteModalOpen(true)
  }, [])

  // Memoize filtered miscellaneous fee heads
  const filteredMiscFeeHeads = useMemo(() => {
    return miscFeeHeads
      .filter(
        (feeHead) =>
          feeHead.feeHead.toLowerCase().includes(searchTerm.toLowerCase()) ||
          feeHead.accountHead.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .sort((a, b) => a.feeHead.localeCompare(b.feeHead, undefined, { numeric: true, sensitivity: "base" }))
  }, [miscFeeHeads, searchTerm])

  // Initialize data on mount
  useEffect(() => {
    if (user?.uid && currentAcademicYear) {
      fetchMiscFeeHeads()
    }
  }, [user?.uid, currentAcademicYear, fetchMiscFeeHeads])

  return (
    <MainContentPage>
      <Container fluid className="px-0 px-lg-0">
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link>
          <span className="separator">&gt;</span>
          <span>Administration</span>
          <span className="separator">&gt;</span>
          <span className="current col-12">Miscellaneous Fee Head Setup</span>
        </nav>
        <Row>
          <Col xs={12}>
            <div className="fee-setup-container">
              <div className="form-card mt-3">
                <div className="header p-3 d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="m-0 d-none d-lg-block">Miscellaneous Fee Head Setup</h2>
                    <h6 className="m-0 d-lg-none">Miscellaneous Fee Head Setup</h6>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleImport}
                      style={{ display: "none" }}
                      id="import-file"
                    />
                    <Button
                      onClick={() => document.getElementById("import-file").click()}
                      className="btn btn-primary text-light"
                      disabled={!currentAcademicYear || isLoading}
                    >
                      Import
                    </Button>
                    <Button
                      onClick={handleExport}
                      className="btn btn-primary text-light"
                      disabled={!currentAcademicYear || miscFeeHeads.length === 0 || isLoading}
                    >
                      Export
                    </Button>
                    <Button
                      onClick={() => setIsAddModalOpen(true)}
                      className="btn btn-primary text-light"
                      disabled={!currentAcademicYear || isLoading}
                    >
                      + Add Miscellaneous Fee Head
                    </Button>
                  </div>
                </div>
                <div className="content-wrapper p-4">
                  {isAuthLoading ? (
                    <div className="text-center my-4">
                      <Spinner animation="border" role="status" variant="primary" className="loader">
                        <span className="visually-hidden">Loading...</span>
                      </Spinner>
                      <p className="mt-2">Loading authentication data...</p>
                    </div>
                  ) : !currentAcademicYear ? (
                    <div className="alert alert-warning">Please select an academic year to manage miscellaneous fee heads.</div>
                  ) : (
                    <>
                      {/* Search with Clear Button */}
                      <InputGroup className="mb-3">
                        <Form.Control
                          type="text"
                          placeholder="Search by Fee Head or Account Head"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="custom-search"
                          disabled={isLoading}
                        />
                        {searchTerm && (
                          <Button
                            variant="outline-secondary"
                            onClick={clearSearch}
                            disabled={isLoading}
                            style={{
                              border: "1px solid #ced4da",
                              borderLeft: "none"
                            }}
                          >
                            <FaTimes />
                          </Button>
                        )}
                      </InputGroup>

                      {isLoading && (
                        <div className="text-center my-4">
                          <Spinner animation="border" role="status" variant="primary" className="loader">
                            <span className="visually-hidden">Loading...</span>
                          </Spinner>
                          <p className="mt-2">Loading data...</p>
                        </div>
                      )}
                      {!isLoading && (
                        <div className="table-responsive">
                          <Table bordered hover>
                            <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                              <tr>
                                <th>Miscellaneous Fee Head</th>
                                <th>Account Head</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {miscFeeHeads.length === 0 ? (
                                <tr>
                                  <td colSpan="3" className="text-center">
                                    No data available
                                  </td>
                                </tr>
                              ) : filteredMiscFeeHeads.length === 0 && searchTerm ? (
                                <tr>
                                  <td colSpan="3" className="text-center">
                                    No matching miscellaneous fee heads found
                                  </td>
                                </tr>
                              ) : (
                                filteredMiscFeeHeads.map((feeHead) => (
                                  <tr key={feeHead.id}>
                                    <td>{feeHead.feeHead}</td>
                                    <td>{feeHead.accountHead}</td>
                                    <td>
                                      <Button
                                        variant="link"
                                        className="action-button edit-button me-2"
                                        onClick={() => openEditModal(feeHead)}
                                        disabled={deletingIds.has(feeHead.id)}
                                      >
                                        <FaEdit />
                                      </Button>
                                      <Button
                                        variant="link"
                                        className="action-button delete-button"
                                        onClick={() => openDeleteModal(feeHead)}
                                        disabled={deletingIds.has(feeHead.id)}
                                      >
                                        {deletingIds.has(feeHead.id) ? (
                                          <Spinner animation="border" size="sm" />
                                        ) : (
                                          <FaTrash />
                                        )}
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
      <AddMiscellaneousFeeHeadModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onConfirm={handleAddMiscFeeHead} 
      />
      <EditMiscellaneousFeeHeadModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedFeeHead(null)
        }}
        onConfirm={handleEditMiscFeeHead}
        feeHeadData={selectedFeeHead}
      />
      <DeleteMiscellaneousFeeHeadModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedFeeHead(null)
        }}
        onConfirm={handleDeleteMiscFeeHead}
        feeHeadData={selectedFeeHead}
      />
      <ConfirmEditModal
        isOpen={isConfirmEditModalOpen}
        onClose={() => {
          setIsConfirmEditModalOpen(false)
          setSelectedFeeHead(null)
          setNewFeeHeadData(null)
        }}
        onConfirm={confirmEditMiscFeeHead}
        currentFeeHead={selectedFeeHead}
        newFeeHead={newFeeHeadData}
      />
      <ToastContainer />
    </MainContentPage>
  )
}

export default MiscellaneousFeeHeadSetup