"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../../components/MainContent/MainContentPage"
import { Form, Button, Row, Col, Container, Table, Spinner } from "react-bootstrap"
import { FaEdit, FaTrash } from "react-icons/fa"
import { useAuthContext } from "../../../Context/AuthContext"
import { ENDPOINTS } from "../../../SpringBoot/config"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import * as XLSX from "xlsx"
import "../Styles/style.css"

// Add Payment Head Modal Component
const AddPaymentHeadModal = ({ isOpen, onClose, onConfirm }) => {
  const [headName, setHeadName] = useState("")

  if (!isOpen) return null

  const handleSubmit = () => {
    onConfirm(headName)
    setHeadName("")
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Add Payment Head</h2>
        <div className="modal-body">
          <Form.Control
            type="text"
            placeholder="Enter Payment Head Name"
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

// Edit Payment Head Modal Component
const EditPaymentHeadModal = ({ isOpen, onClose, onConfirm, paymentHead }) => {
  const [headName, setHeadName] = useState(paymentHead?.name || "")

  useEffect(() => {
    if (paymentHead) {
      setHeadName(paymentHead.name)
    }
  }, [paymentHead])

  if (!isOpen) return null

  const handleSubmit = () => {
    onConfirm(paymentHead.id, headName)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Edit Payment Head</h2>
        <div className="modal-body">
          <Form.Control
            type="text"
            placeholder="Enter Payment Head Name"
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

// Delete Payment Head Modal Component
const DeletePaymentHeadModal = ({ isOpen, onClose, onConfirm, paymentHead }) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Delete Payment Head</h2>
        <div className="modal-body text-center">
          <p>Are you sure you want to delete this payment head?</p>
          <p className="fw-bold">{paymentHead?.name}</p>
        </div>
        <div className="modal-buttons">
          <Button className="modal-button delete" onClick={() => onConfirm(paymentHead.id)}>
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
          <p>Are you sure you want to edit this payment head? This may affect the structure of payment data.</p>
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

const PaymentHeadSetup = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isConfirmEditModalOpen, setIsConfirmEditModalOpen] = useState(false)
  const [selectedPaymentHead, setSelectedPaymentHead] = useState(null)
  const [newHeadName, setNewHeadName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentHeads, setPaymentHeads] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const {
    user,
    admin,
    currentAcademicYear,
    schoolId,
    getAuthHeaders,
    isAuth
  } = useAuthContext()

  // Reset state and fetch data when user or academic year changes
  useEffect(() => {
    const resetState = () => {
      setPaymentHeads([])
      setSearchTerm("")
      setSelectedPaymentHead(null)
      setNewHeadName("")
      setIsAddModalOpen(false)
      setIsEditModalOpen(false)
      setIsDeleteModalOpen(false)
      setIsConfirmEditModalOpen(false)
    }

    resetState()

    const checkAuthAndFetchData = async () => {
      if (isAuth && currentAcademicYear && schoolId) {
        setIsLoading(true)
        try {
          await fetchPaymentHeads()
        } catch (error) {
          toast.error("An error occurred while loading data.")
        } finally {
          setIsLoading(false)
        }
      } else if (!currentAcademicYear) {
        toast.error("Please select an academic year to view and manage payment heads.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })
      } else if (!isAuth) {
        toast.error("Please log in to view and manage payment heads.", {
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
  }, [isAuth, currentAcademicYear, schoolId])

  const fetchPaymentHeads = async () => {
    if (!isAuth || !currentAcademicYear || !schoolId) return

    setIsLoading(true)
    try {
      const response = await fetch(`${ENDPOINTS.administration}/paymenthead?schoolId=${schoolId}&academicYear=${currentAcademicYear}`, {
        method: "GET",
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch payment heads")
      }

      const data = await response.json()
      setPaymentHeads(data)
    } catch (error) {
      toast.error("Failed to fetch payment heads. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
      setPaymentHeads([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPaymentHead = async (name) => {
    if (!isAuth || !currentAcademicYear || !schoolId) {
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

    if (!name.trim()) {
      toast.error("Payment head name cannot be empty.", {
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

    const isDuplicate = paymentHeads.some((head) => head.name.toLowerCase() === name.toLowerCase())
    if (isDuplicate) {
      toast.error("A payment head with this name already exists. Please choose a different name.", {
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
      const response = await fetch(`${ENDPOINTS.administration}/paymenthead?schoolId=${schoolId}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          academicYear: currentAcademicYear
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to add payment head")
      }

      const newPaymentHead = await response.json()

      // Immediately update UI
      setPaymentHeads((prevHeads) => [...prevHeads, newPaymentHead])

      setIsAddModalOpen(false)
      toast.success("Payment head added successfully!", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        style: { background: "#0B3D7B", color: "white" },
      })

      // Fetch fresh data to ensure consistency
      await fetchPaymentHeads()
    } catch (error) {
      toast.error(error.message || "Failed to add payment head. Please try again.", {
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

  const handleEditPaymentHead = async (headId, newName) => {
    if (!isAuth || !currentAcademicYear || !schoolId) {
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

    if (!newName.trim()) {
      toast.error("Payment head name cannot be empty.", {
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

    const isDuplicate = paymentHeads.some(
      (head) => head.id !== headId && head.name.toLowerCase() === newName.toLowerCase(),
    )
    if (isDuplicate) {
      toast.error("A payment head with this name already exists. Please choose a different name.", {
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
    setNewHeadName(newName)
  }

  const confirmEditPaymentHead = async () => {
    if (!isAuth || !currentAcademicYear || !schoolId) {
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
      const response = await fetch(`${ENDPOINTS.administration}/paymenthead/${selectedPaymentHead.id}?schoolId=${schoolId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newHeadName.trim(),
          academicYear: currentAcademicYear
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to update payment head")
      }

      const updatedPaymentHead = await response.json()

      // Immediately update UI
      setPaymentHeads((prevHeads) =>
        prevHeads.map((head) => (head.id === selectedPaymentHead.id ? updatedPaymentHead : head)),
      )

      setIsConfirmEditModalOpen(false)
      setSelectedPaymentHead(null)
      setNewHeadName("")
      toast.success("Payment head updated successfully!", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        style: { background: "#0B3D7B", color: "white" },
      })

      // Fetch fresh data
      await fetchPaymentHeads()
    } catch (error) {
      toast.error(error.message || "Failed to update payment head. Please try again.", {
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

  const handleDeletePaymentHead = async (headId) => {
    if (!isAuth || !currentAcademicYear || !schoolId) {
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
      const response = await fetch(`${ENDPOINTS.administration}/paymenthead/${headId}?schoolId=${schoolId}&academicYear=${currentAcademicYear}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to delete payment head")
      }

      // Immediately update UI
      setPaymentHeads((prevHeads) => prevHeads.filter((head) => head.id !== headId))

      setIsDeleteModalOpen(false)
      setSelectedPaymentHead(null)
      toast.success("Payment head deleted successfully!", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })

      // Fetch fresh data
      await fetchPaymentHeads()
    } catch (error) {
      toast.error(error.message || "Failed to delete payment head. Please try again.", {
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

  // Import function - Uses individual API calls for each payment head
  const handleImport = async (event) => {
    if (!isAuth || !currentAcademicYear || !schoolId) {
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

    const file = event.target.files[0]
    if (!file) return

    setIsLoading(true)
    const reader = new FileReader()
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(sheet)

      if (jsonData.length === 0) {
        toast.error("No data found in the imported file.")
        setIsLoading(false)
        return
      }

      try {
        let successCount = 0
        let errorCount = 0
        const newPaymentHeads = []

        // Process each row individually
        for (const row of jsonData) {
          const name = row["Payment Head"] || row["name"]

          if (name && name.trim()) {
            // Check for duplicate in existing data
            const isDuplicate = paymentHeads.some(
              (head) => head.name.toLowerCase() === name.toLowerCase()
            )

            if (!isDuplicate) {
              try {
                // Use the same handleAddPaymentHead logic for each import
                const response = await fetch(`${ENDPOINTS.administration}/paymenthead?schoolId=${schoolId}`, {
                  method: "POST",
                  headers: getAuthHeaders(),
                  body: JSON.stringify({
                    name: name.trim(),
                    academicYear: currentAcademicYear
                  }),
                })

                if (response.ok) {
                  const newPaymentHead = await response.json()
                  newPaymentHeads.push(newPaymentHead)
                  successCount++
                } else {
                  const errorText = await response.text()
                  errorCount++
                }
              } catch (error) {
                errorCount++
              }
            }
          }
        }

        // Update UI with imported payment heads
        if (newPaymentHeads.length > 0) {
          setPaymentHeads((prevHeads) => [...prevHeads, ...newPaymentHeads])
        }

        // Show import results
        if (successCount > 0) {
          toast.success(`${successCount} payment heads imported successfully!`, {
            position: "top-right",
            autoClose: 1000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            style: { background: "#0B3D7B", color: "white" },
          })
        }

        if (errorCount > 0) {
          toast.warning(`${errorCount} entries could not be imported due to errors or duplicates.`, {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          })
        }

        // Fetch fresh data to ensure consistency
        await fetchPaymentHeads()
      } catch (error) {
        toast.error("Failed to import payment heads. Please try again.", {
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
    reader.readAsArrayBuffer(file)
  }

  const handleExport = () => {
    if (!isAuth || !currentAcademicYear || !schoolId) {
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

    if (paymentHeads.length === 0) {
      toast.error("No data available to export.")
      return
    }

    const exportData = paymentHeads.map((head) => ({
      "Payment Head": head.name,
    }))
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "PaymentHeads")
    XLSX.writeFile(workbook, `PaymentHeads_Export_${schoolId}_${currentAcademicYear}.xlsx`)
    toast.success("Payment heads exported successfully!", {
      position: "top-right",
      autoClose: 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      style: { background: "#0B3D7B", color: "white" },
    })
  }

  const openEditModal = (head) => {
    setSelectedPaymentHead(head)
    setIsEditModalOpen(true)
  }

  const openDeleteModal = (head) => {
    setSelectedPaymentHead(head)
    setIsDeleteModalOpen(true)
  }

  const filteredPaymentHeads = paymentHeads.filter((head) => head.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <MainContentPage>
      <Container fluid className="px-0 px-lg-0">
        {/* Breadcrumb Navigation */}
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link>
          <span className="separator">&gt;</span>
          <span>Administration</span>
          <span className="separator">&gt;</span>
          <Link to="/administration/payment-setup">Payment Setup</Link>
          <span className="separator">&gt;</span>
          <span className="current col-12">Head Setup</span>
        </nav>

        <Row>
          <Col xs={12}>
            <div className="payment-head-setup-container">
              <div className="form-card mt-3">
                {/* Header */}
                <div className="header p-3 d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="m-0 d-none d-lg-block">Payment Head Setup</h2>
                    <h6 className="m-0 d-lg-none">Payment Head Setup</h6>
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
                      disabled={!currentAcademicYear || paymentHeads.length === 0 || isLoading}
                    >
                      Export
                    </Button>
                    <Button
                      onClick={() => setIsAddModalOpen(true)}
                      className="btn btn-primary text-light"
                      disabled={!currentAcademicYear || isLoading}
                    >
                      + Add Payment Head
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="content-wrapper p-4">
                  {!currentAcademicYear ? (
                    <div className="alert alert-warning">Please select an academic year to manage payment heads.</div>
                  ) : (
                    <>
                      {/* Search Bar */}
                      <div className="position-relative mb-3">
                        <Form.Control
                          type="text"
                          placeholder="Search by Payment Head Name"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="custom-search mb-3"
                          disabled={isLoading}
                        />{searchTerm && (
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

                      {/* Payment Heads Table */}
                      {!isLoading && (
                        <div className="table-responsive">
                          <Table bordered hover>
                            <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                              <tr>
                                <th>Payment Head Name</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paymentHeads.length === 0 ? (
                                <tr>
                                  <td colSpan="2" className="text-center">
                                    No data available
                                  </td>
                                </tr>
                              ) : filteredPaymentHeads.length === 0 && searchTerm ? (
                                <tr>
                                  <td colSpan="2" className="text-center">
                                    No matching payment heads found
                                  </td>
                                </tr>
                              ) : (
                                filteredPaymentHeads.map((head) => (
                                  <tr key={head.id}>
                                    <td>{head.name}</td>
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
      <AddPaymentHeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={handleAddPaymentHead}
      />
      <EditPaymentHeadModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedPaymentHead(null)
        }}
        onConfirm={handleEditPaymentHead}
        paymentHead={selectedPaymentHead}
      />
      <DeletePaymentHeadModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedPaymentHead(null)
        }}
        onConfirm={handleDeletePaymentHead}
        paymentHead={selectedPaymentHead}
      />
      <ConfirmEditModal
        isOpen={isConfirmEditModalOpen}
        onClose={() => {
          setIsConfirmEditModalOpen(false)
          setSelectedPaymentHead(null)
          setNewHeadName("")
        }}
        onConfirm={confirmEditPaymentHead}
        currentName={selectedPaymentHead?.name}
        newName={newHeadName}
      />

      {/* Toastify Container */}
      <ToastContainer />
    </MainContentPage>
  )
}

export default PaymentHeadSetup
