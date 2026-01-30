"use client"

import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import MainContentPage from "../../../components/MainContent/MainContentPage"
import { Form, Button, Row, Col, Container, Table, Spinner, InputGroup } from "react-bootstrap"
import { FaEdit, FaTrash, FaTimes } from "react-icons/fa"
import { useAuthContext } from "../../../Context/AuthContext"
import { ENDPOINTS } from "../../../SpringBoot/config"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import * as XLSX from "xlsx" // For import/export functionality
import "../Styles/style.css"

// Add Payment Sub Head Modal Component
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
        <h2 className="modal-title">Add Payment Sub Head</h2>
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
                  <option key={head.id} value={head.name}>
                    {head.name}
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

// Edit Payment Sub Head Modal Component
const EditSubHeadModal = ({ isOpen, onClose, onConfirm, subHead, mainHeads }) => {
  const [mainHeadName, setMainHeadName] = useState(subHead?.paymentMainHead || "")
  const [subHeadName, setSubHeadName] = useState(subHead?.paymentSubHead || "")

  useEffect(() => {
    if (subHead) {
      setMainHeadName(subHead.paymentMainHead)
      setSubHeadName(subHead.paymentSubHead)
    }
  }, [subHead])

  if (!isOpen) return null

  const handleSubmit = () => {
    onConfirm(subHead.id, mainHeadName, subHeadName)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Edit Payment Sub Head</h2>
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
                  <option key={head.id} value={head.name}>
                    {head.name}
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

// Delete Payment Sub Head Modal Component
const DeleteSubHeadModal = ({ isOpen, onClose, onConfirm, subHead }) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Delete Payment Sub Head</h2>
        <div className="modal-body text-center">
          <p>Are you sure you want to delete this payment sub head?</p>
          <p className="fw-bold">{subHead?.paymentSubHead}</p>
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
const ConfirmEditModal = ({ isOpen, onClose, onConfirm, currentData, newData, mainHeads }) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Confirm Edit</h2>
        <div className="modal-body">
          <p>Are you sure you want to edit this payment sub head? This may affect the structure of payment data.</p>
          <p>
            <strong>Current Main Head:</strong> {currentData.paymentMainHead}
          </p>
          <p>
            <strong>Current Sub Head:</strong> {currentData.paymentSubHead}
          </p>
          <p>
            <strong>New Main Head:</strong> {newData.paymentMainHead}
          </p>
          <p>
            <strong>New Sub Head:</strong> {newData.paymentSubHead}
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

const PaymentSubHeadSetup = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isConfirmEditModalOpen, setIsConfirmEditModalOpen] = useState(false)
  const [selectedSubHead, setSelectedSubHead] = useState(null)
  const [newSubHeadData, setNewSubHeadData] = useState({ paymentMainHead: "", paymentSubHead: "" })
  const [searchTerm, setSearchTerm] = useState("")
  const [mainHeads, setMainHeads] = useState([])
  const [subHeads, setSubHeads] = useState([])
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const { 
    user, 
    admin, 
    currentAcademicYear, 
    schoolId, 
    getAuthHeaders, 
    isAuth 
  } = useAuthContext()
  const location = useLocation()

  // Reset state and fetch data when user or academic year changes
  useEffect(() => {
    const resetState = () => {
      setMainHeads([])
      setSubHeads([])
      setSearchTerm("")
      setSelectedSubHead(null)
      setNewSubHeadData({ paymentMainHead: "", paymentSubHead: "" })
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
          await fetchMainHeads()
          await fetchSubHeads()
        } catch (error) {
          toast.error("An error occurred while loading data.")
        } finally {
          setIsLoading(false)
        }
      } else if (!currentAcademicYear) {
        setIsLoading(false)
        toast.error("Please select an academic year to view and manage payment sub heads.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })
      } else if (!isAuth) {
        setIsLoading(false)
        toast.error("Please log in to view and manage payment sub heads.", {
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

  const fetchMainHeads = async () => {
    if (!isAuth || !currentAcademicYear || !schoolId) return

    try {
      const response = await fetch(`${ENDPOINTS.administration}/paymenthead?schoolId=${schoolId}&academicYear=${currentAcademicYear}`, {
        method: "GET",
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch main payment heads")
      }

      const mainHeadsData = await response.json()
      setMainHeads(mainHeadsData)
    } catch (error) {
      toast.error("Failed to fetch main payment heads. Please try again.", {
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
    if (!isAuth || !currentAcademicYear || !schoolId) return

    setError(null)
    try {
      const response = await fetch(`${ENDPOINTS.administration}/paymentsubhead?schoolId=${schoolId}&academicYear=${currentAcademicYear}`, {
        method: "GET",
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch payment sub heads")
      }

      const subHeadsData = await response.json()
      setSubHeads(subHeadsData)
    } catch (error) {
      toast.error("Failed to fetch payment sub heads. Please try again.", {
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

    if (!mainHeadName) {
      toast.error("Please select a main payment head.", {
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

    // Check for duplicate sub head name under the same main head
    const isDuplicate = subHeads.some(
      (subHead) => subHead.paymentMainHead === mainHeadName && subHead.paymentSubHead.toLowerCase() === subHeadName.toLowerCase(),
    )

    if (isDuplicate) {
      toast.error(
        "A sub head with this name already exists under the selected main head. Please choose a different name.",
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        },
      )
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${ENDPOINTS.administration}/paymentsubhead?schoolId=${schoolId}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          paymentMainHead: mainHeadName,
          paymentSubHead: subHeadName.trim(),
          academicYear: currentAcademicYear
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to add payment sub head")
      }

      const newSubHead = await response.json()

      // Immediately update UI
      setSubHeads((prevSubHeads) => [...prevSubHeads, newSubHead])

      setIsAddModalOpen(false)
      toast.success("Payment sub head added successfully!", {
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
      await fetchSubHeads()
    } catch (error) {
      toast.error(error.message || "Failed to add payment sub head. Please try again.", {
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

  const handleEditSubHead = async (subHeadId, mainHeadName, subHeadName) => {
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

    if (!mainHeadName) {
      toast.error("Please select a main payment head.", {
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

    // Check for duplicate sub head name under the same main head (excluding the current one)
    const isDuplicate = subHeads.some(
      (subHead) =>
        subHead.id !== subHeadId &&
        subHead.paymentMainHead === mainHeadName &&
        subHead.paymentSubHead.toLowerCase() === subHeadName.toLowerCase(),
    )

    if (isDuplicate) {
      toast.error(
        "A sub head with this name already exists under the selected main head. Please choose a different name.",
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        },
      )
      return
    }

    setIsEditModalOpen(false)
    setNewSubHeadData({ paymentMainHead: mainHeadName, paymentSubHead: subHeadName })
    setIsConfirmEditModalOpen(true)
  }

  const confirmEditSubHead = async () => {
    if (!isAuth || !currentAcademicYear || !schoolId || !selectedSubHead) {
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
      const response = await fetch(`${ENDPOINTS.administration}/paymentsubhead/${selectedSubHead.id}?schoolId=${schoolId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          paymentMainHead: newSubHeadData.paymentMainHead,
          paymentSubHead: newSubHeadData.paymentSubHead.trim(),
          academicYear: currentAcademicYear
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to update payment sub head")
      }

      const updatedSubHead = await response.json()

      // Immediately update UI
      setSubHeads((prevSubHeads) =>
        prevSubHeads.map((subHead) =>
          subHead.id === selectedSubHead.id ? updatedSubHead : subHead,
        ),
      )

      setIsConfirmEditModalOpen(false)
      setSelectedSubHead(null)
      setNewSubHeadData({ paymentMainHead: "", paymentSubHead: "" })
      toast.success("Payment sub head updated successfully!", {
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
      await fetchSubHeads()
    } catch (error) {
      toast.error(error.message || "Failed to update payment sub head. Please try again.", {
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
      const response = await fetch(`${ENDPOINTS.administration}/paymentsubhead/${subHeadId}?schoolId=${schoolId}&academicYear=${currentAcademicYear}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to delete payment sub head")
      }

      // Immediately update UI
      setSubHeads((prevSubHeads) => prevSubHeads.filter((subHead) => subHead.id !== subHeadId))

      setIsDeleteModalOpen(false)
      setSelectedSubHead(null)
      toast.success("Payment sub head deleted successfully!", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })

      // Fetch fresh data
      await fetchSubHeads()
    } catch (error) {
      toast.error(error.message || "Failed to delete payment sub head. Please try again.", {
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

  // Clear search function
  const handleClearSearch = () => {
    setSearchTerm("")
  }

  // Import function - Uses individual API calls for each sub head
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
        const newSubHeads = []

        // Process each row individually
        for (const row of jsonData) {
          const mainHeadName = row["Main Head"] || row["paymentMainHead"]
          const subHeadName = row["Sub Head"] || row["paymentSubHead"]
          
          if (mainHeadName && subHeadName && subHeadName.trim()) {
            // Check if main head exists
            const mainHeadExists = mainHeads.some((head) => head.name === mainHeadName)

            if (mainHeadExists) {
              // Check for duplicate in existing data
              const isDuplicate = subHeads.some(
                (subHead) =>
                  subHead.paymentMainHead === mainHeadName && subHead.paymentSubHead.toLowerCase() === subHeadName.toLowerCase(),
              )

              if (!isDuplicate) {
                try {
                  // Use the same handleAddSubHead logic for each import
                  const response = await fetch(`${ENDPOINTS.administration}/paymentsubhead?schoolId=${schoolId}`, {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                      paymentMainHead: mainHeadName,
                      paymentSubHead: subHeadName.trim(),
                      academicYear: currentAcademicYear
                    }),
                  })

                  if (response.ok) {
                    const newSubHead = await response.json()
                    newSubHeads.push(newSubHead)
                    successCount++
                  } else {
                    const errorText = await response.text()
                    errorCount++
                  }
                } catch (error) {
                  errorCount++
                }
              }
            } else {
              errorCount++
            }
          }
        }

        // Update UI with imported sub heads
        if (newSubHeads.length > 0) {
          setSubHeads((prevSubHeads) => [...prevSubHeads, ...newSubHeads])
        }

        // Show import results
        if (successCount > 0) {
          toast.success(`${successCount} payment sub heads imported successfully!`, {
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
          toast.warning(`${errorCount} entries could not be imported due to errors or missing main heads.`, {
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
        await fetchSubHeads()
      } catch (error) {
        toast.error("Failed to import payment sub heads. Please try again.", {
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

  // Export function
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

    if (subHeads.length === 0) {
      toast.error("No data available to export.")
      return
    }

    const exportData = subHeads.map((subHead) => ({
      "Main Head": subHead.paymentMainHead,
      "Sub Head": subHead.paymentSubHead,
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "PaymentSubHeads")
    XLSX.writeFile(workbook, `PaymentSubHeads_Export_${schoolId}_${currentAcademicYear}.xlsx`)

    toast.success("Payment sub heads exported successfully!", {
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

  const openEditModal = (subHead) => {
    setSelectedSubHead(subHead)
    setIsEditModalOpen(true)
  }

  const openDeleteModal = (subHead) => {
    setSelectedSubHead(subHead)
    setIsDeleteModalOpen(true)
  }

  const filteredSubHeads = subHeads.filter((subHead) => {
    return (
      subHead.paymentSubHead.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subHead.paymentMainHead.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  return (
    <MainContentPage>
      <Container fluid className="px-0 px-lg-0">
        <Row>
          <Col xs={12}>
            <div className="payment-sub-head-setup-container">
              {/* Breadcrumb Navigation */}
              <nav className="custom-breadcrumb py-1 py-lg-3">
                <Link to="/home">Home</Link>
                <span className="separator">&gt;</span>
                <span>Administration</span>
                <span className="separator">&gt;</span>
                <Link to="/administration/payment-setup">Payment Setup</Link>
                <span className="separator">&gt;</span>
                <span className="current">Sub Head Setup</span>
              </nav>

              <div className="form-card mt-3">
                {/* Header */}
                <div className="header p-3 d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="m-0 d-none d-lg-block">Payment Sub Head Setup</h2>
                    <h6 className="m-0 d-lg-none">Payment Sub Head Setup</h6>
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
                      disabled={!currentAcademicYear || subHeads.length === 0 || isLoading}
                    >
                      Export
                    </Button>
                    <Button
                      onClick={() => {
                        if (mainHeads.length === 0) {
                          toast.error("Please add main payment heads first before adding sub heads.", {
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
                    <div className="alert alert-warning">
                      Please select an academic year to manage payment sub heads.
                    </div>
                  ) : (
                    <>
                      {/* Search Bar with Clear Button */}
                      <InputGroup className="mb-3">
                        <Form.Control
                          type="text"
                          placeholder="Search by Main Head or Sub Head Name"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="custom-search"
                          disabled={isLoading}
                        />
                        {searchTerm && (
                          <Button
                            variant="outline-secondary"
                            onClick={handleClearSearch}
                            disabled={isLoading}
                            title="Clear search"
                          >
                            <FaTimes />
                          </Button>
                        )}
                      </InputGroup>

                      {/* Loading Indicator */}
                      {isLoading && (
                        <div className="text-center my-4">
                          <Spinner animation="border" role="status" variant="primary" className="loader">
                            <span className="visually-hidden">Loading...</span>
                          </Spinner>
                          <p className="mt-2">Loading data...</p>
                        </div>
                      )}

                      {/* Payment Sub Heads Table */}
                      {!isLoading && (
                        <div className="table-responsive">
                          <Table bordered hover>
                            <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                              <tr>
                                <th>Main Head</th>
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
                                    No matching payment sub heads found
                                  </td>
                                </tr>
                              ) : (
                                filteredSubHeads.map((subHead) => (
                                  <tr key={subHead.id}>
                                    <td>{subHead.paymentMainHead}</td>
                                    <td>{subHead.paymentSubHead}</td>
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
          setNewSubHeadData({ paymentMainHead: "", paymentSubHead: "" })
        }}
        onConfirm={confirmEditSubHead}
        currentData={selectedSubHead || {}}
        newData={newSubHeadData}
        mainHeads={mainHeads}
      />

      {/* Toastify Container */}
      <ToastContainer />
    </MainContentPage>
  )
}

export default PaymentSubHeadSetup
