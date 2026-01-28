"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../../components/MainContent/MainContentPage"
import { Form, Button, Row, Col, Container, Table, Spinner } from "react-bootstrap"
import { FaEdit, FaTrash } from "react-icons/fa"
import { useAuthContext } from "../../../Context/AuthContext"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import * as XLSX from "xlsx"
import "../styles/style.css"
import { ENDPOINTS } from "../../../SpringBoot/config"

// ✅ Add Parent Occupation Modal with validations
const AddParentOccupationModal = ({ isOpen, onClose, onConfirm, existingOccupations }) => {
  const [occupation, setOccupation] = useState("")
  const [error, setError] = useState("")

  if (!isOpen) return null

  const validate = (value) => {
    if (!value.trim()) return "Parent occupation cannot be empty."
    if (value.length < 3) return "Must be at least 3 characters."
    if (value.length > 50) return "Must be less than 50 characters."
    if (!/^[a-zA-Z\s]+$/.test(value)) return "Only letters and spaces are allowed."
    if (existingOccupations?.some((occ) => occ.occupation.toLowerCase() === value.toLowerCase()))
      return "This occupation already exists."
    return ""
  }

  const handleChange = (e) => {
    setOccupation(e.target.value)
    setError(validate(e.target.value))
  }

  const handleSubmit = () => {
    const validationError = validate(occupation)
    if (validationError) {
      setError(validationError)
      return
    }
    onConfirm(occupation)
    setOccupation("")
    setError("")
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Add Parent Occupation</h2>
        <div className="modal-body">
          <Form.Control
            type="text"
            placeholder="Enter Parent Occupation"
            value={occupation}
            onChange={handleChange}
            className={`custom-input ${error ? "is-invalid" : ""}`}
          />
          {error && <small className="text-danger">{error}</small>}
        </div>
        <div className="modal-buttons">
          <Button className="modal-button confirm" onClick={handleSubmit} disabled={!!error || !occupation.trim()}>Add</Button>
          <Button className="modal-button cancel" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

// ✅ Edit Modal with validations
const EditParentOccupationModal = ({ isOpen, onClose, onProceed, occupationData, existingOccupations }) => {
  const [occupation, setOccupation] = useState(occupationData?.occupation || "")
  const [error, setError] = useState("")

  useEffect(() => {
    if (occupationData) setOccupation(occupationData.occupation)
  }, [occupationData])

  if (!isOpen) return null

  const validate = (value) => {
    if (!value.trim()) return "Parent occupation cannot be empty."
    if (value.length < 3) return "Must be at least 3 characters."
    if (value.length > 50) return "Must be less than 50 characters."
    if (!/^[a-zA-Z\s]+$/.test(value)) return "Only letters and spaces are allowed."
    if (existingOccupations?.some((occ) => occ.occupation.toLowerCase() === value.toLowerCase() && occ.id !== occupationData.id))
      return "This occupation already exists."
    return ""
  }

  const handleChange = (e) => {
    setOccupation(e.target.value)
    setError(validate(e.target.value))
  }

  const handleSubmit = () => {
    const validationError = validate(occupation)
    if (validationError) {
      setError(validationError)
      return
    }
    onProceed(occupation)
    setError("")
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Edit Parent Occupation</h2>
        <div className="modal-body">
          <Form.Control
            type="text"
            placeholder="Enter Parent Occupation"
            value={occupation}
            onChange={handleChange}
            className={`custom-input ${error ? "is-invalid" : ""}`}
          />
          {error && <small className="text-danger">{error}</small>}
        </div>
        <div className="modal-buttons">
          <Button className="modal-button confirm" onClick={handleSubmit} disabled={!!error || !occupation.trim()}>Update</Button>
          <Button className="modal-button cancel" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

// ✅ Delete Modal
const DeleteParentOccupationModal = ({ isOpen, onClose, onConfirm, occupationData }) => {
  if (!isOpen) return null
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Delete Parent Occupation</h2>
        <div className="modal-body text-center">
          <p>Are you sure you want to delete this parent occupation?</p>
          <p className="fw-bold">{occupationData?.occupation}</p>
        </div>
        <div className="modal-buttons">
          <Button className="modal-button delete" onClick={() => onConfirm(occupationData.id)}>Delete</Button>
          <Button className="modal-button cancel" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

// ✅ Confirm Edit Modal
const ConfirmEditModal = ({ isOpen, onClose, onConfirm, currentOccupation, newOccupation }) => {
  if (!isOpen) return null
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Confirm Edit</h2>
        <div className="modal-body">
          <p>Are you sure you want to edit this parent occupation? This may affect student data.</p>
          <p><strong>Current:</strong> {currentOccupation}</p>
          <p><strong>New:</strong> {newOccupation}</p>
        </div>
        <div className="modal-buttons">
          <Button className="modal-button confirm" onClick={onConfirm}>Confirm Edit</Button>
          <Button className="modal-button cancel" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

const ParentOccupationSetup = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isConfirmEditModalOpen, setIsConfirmEditModalOpen] = useState(false)
  const [selectedOccupation, setSelectedOccupation] = useState(null)
  const [newOccupation, setNewOccupation] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [occupations, setOccupations] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const { schoolId, currentAcademicYear } = useAuthContext()

  const fetchOccupations = async () => {
    if (!schoolId || !currentAcademicYear) return
    setIsLoading(true)
    try {
      const res = await fetch(`${ENDPOINTS.administration}/parentoccu/getAll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, academicYear: currentAcademicYear })
      })
      if (!res.ok) throw new Error("Failed to fetch occupations")
      const data = await res.json()
      setOccupations(data || [])
    } catch (error) {
      console.error(error)
      toast.error("Failed to fetch parent occupations.")
      setOccupations([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchOccupations() }, [schoolId, currentAcademicYear])

  const handleAddOccupation = async (occupation) => {
    if (!occupation.trim()) return toast.error("Parent occupation cannot be empty.")
    setIsLoading(true)
    try {
      const res = await fetch(`${ENDPOINTS.administration}/parentoccu/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, academicYear: currentAcademicYear, occupation })
      })
      if (!res.ok) throw new Error("Failed to add occupation")
      toast.success("Parent occupation added successfully!")
      fetchOccupations()
      setIsAddModalOpen(false)
    } catch (error) {
      console.error(error)
      toast.error("Failed to add parent occupation.")
    } finally {
      setIsLoading(false)
    }
  }

  const openEditModal = (id, occupation) => {
    setSelectedOccupation({ id, occupation })
    setIsEditModalOpen(true)
  }

  const proceedToConfirmEdit = (updatedOccupation) => {
    setNewOccupation(updatedOccupation)
    setIsEditModalOpen(false)
    setIsConfirmEditModalOpen(true)
  }

  const confirmEditOccupation = async () => {
    if (!selectedOccupation) return
    setIsLoading(true)
    try {
      const res = await fetch(`${ENDPOINTS.administration}/parentoccu/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, id: selectedOccupation.id, occupation: newOccupation })
      })
      if (!res.ok) throw new Error("Failed to update occupation")
      toast.success("Parent occupation updated successfully!")
      setSelectedOccupation(null)
      setNewOccupation("")
      setIsConfirmEditModalOpen(false)
      fetchOccupations()
    } catch (error) {
      console.error(error)
      toast.error("Failed to update parent occupation.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteOccupation = async (id) => {
    setIsLoading(true)
    try {
      const res = await fetch(`${ENDPOINTS.administration}/parentoccu/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, id })
      })
      if (!res.ok) throw new Error("Failed to delete occupation")
      toast.success("Parent occupation deleted successfully!")
      setIsDeleteModalOpen(false)
      setSelectedOccupation(null)
      fetchOccupations()
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete parent occupation.")
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ Batch Excel import
  const handleImport = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    setIsLoading(true)
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: "array" })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(sheet)

        // Extract valid, unique occupations
        const newOccupations = []
        for (const row of jsonData) {
          const occ = row["Parent Occupation"] || row["occupation"]
          if (!occ || !occ.trim()) continue
          const cleanOcc = occ.trim()
          if (occupations.some((o) => o.occupation.toLowerCase() === cleanOcc.toLowerCase()) ||
              newOccupations.some((o) => o.toLowerCase() === cleanOcc.toLowerCase())) continue
          if (cleanOcc.length >=3 && cleanOcc.length <=50 && /^[a-zA-Z\s]+$/.test(cleanOcc)) {
            newOccupations.push(cleanOcc)
          }
        }

        if (!newOccupations.length) return toast.info("No valid new occupations to import.")

        const res = await fetch(`${ENDPOINTS.administration}/parentoccu/batchAdd`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schoolId, academicYear: currentAcademicYear, occupations: newOccupations })
        })

        if (!res.ok) throw new Error("Failed to import occupations")
        toast.success("Parent occupations imported successfully!")
        fetchOccupations()
      } catch (error) {
        console.error(error)
        toast.error("Failed to import occupations.")
      } finally {
        setIsLoading(false)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleExport = () => {
    if (!occupations.length) return toast.error("No data available to export.")
    const exportData = occupations.map((occ) => ({ "Parent Occupation": occ.occupation }))
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "ParentOccupations")
    XLSX.writeFile(workbook, `ParentOccupations_${schoolId}_${currentAcademicYear}.xlsx`)
    toast.success("Parent occupations exported successfully!")
  }

  const filteredOccupations = occupations.filter((occ) =>
    occ.occupation.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MainContentPage>
      <Container fluid className="px-0 px-lg-0">
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link>
          <span className="separator">&gt;</span>
          <span>Administration</span>
          <span className="separator">&gt;</span>
          <span className="current col-12">Parent Occupation Setup</span>
        </nav>
        <Row>
          <Col xs={12}>
            <div className="occupation-setup-container">
              <div className="form-card mt-3">
                <div className="header p-3 d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="m-0 d-none d-lg-block">Create Parent Occupation Setup</h2>
                    <h6 className="m-0 d-lg-none">Create Parent Occupation Setup</h6>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <input type="file" accept=".xlsx, .xls" onChange={handleImport} style={{ display: "none" }} id="import-file"/>
                    <Button onClick={() => document.getElementById("import-file").click()} className="btn btn-primary text-light" disabled={!currentAcademicYear || isLoading}>Import</Button>
                    <Button onClick={handleExport} className="btn btn-primary text-light" disabled={!currentAcademicYear || occupations.length === 0 || isLoading}>Export</Button>
                    <Button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary text-light" disabled={!currentAcademicYear || isLoading}>+ Add Parent Occupation</Button>
                  </div>
                </div>
                <div className="content-wrapper p-4">
                  {!currentAcademicYear ? (
                    <div className="alert alert-warning">Please select an academic year to manage parent occupations.</div>
                  ) : (
                    <>
                      <div className="position-relative mb-3">
                        <Form.Control
                          type="text"
                          placeholder="Search by Course Name"
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
                      {isLoading && <div className="text-center my-4"><Spinner animation="border" variant="primary"/><p className="mt-2">Loading data...</p></div>}
                      {!isLoading && (
                        <div className="table-responsive">
                          <Table bordered hover>
                            <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                              <tr>
                                <th>Parent Occupation</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {occupations.length === 0 ? <tr><td colSpan="2" className="text-center">No data available</td></tr>
                              : filteredOccupations.length === 0 && searchTerm ? <tr><td colSpan="2" className="text-center">No matching occupations found</td></tr>
                              : filteredOccupations.map((occ) => (
                                <tr key={occ.id}>
                                  <td>{occ.occupation}</td>
                                  <td>
                                    <Button variant="link" className="action-button edit-button me-2" onClick={() => openEditModal(occ.id, occ.occupation)}><FaEdit/></Button>
                                    <Button variant="link" className="action-button delete-button" onClick={() => { setSelectedOccupation(occ); setIsDeleteModalOpen(true)}}><FaTrash/></Button>
                                  </td>
                                </tr>
                              ))}
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
      <AddParentOccupationModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onConfirm={handleAddOccupation} existingOccupations={occupations} />
      <EditParentOccupationModal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedOccupation(null) }} onProceed={proceedToConfirmEdit} occupationData={selectedOccupation} existingOccupations={occupations} />
      <DeleteParentOccupationModal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setSelectedOccupation(null)}} onConfirm={handleDeleteOccupation} occupationData={selectedOccupation} />
      <ConfirmEditModal isOpen={isConfirmEditModalOpen} onClose={() => { setIsConfirmEditModalOpen(false); setSelectedOccupation(null); setNewOccupation("")}} onConfirm={confirmEditOccupation} currentOccupation={selectedOccupation?.occupation} newOccupation={newOccupation} />

      <ToastContainer />
    </MainContentPage>
  )
}

export default ParentOccupationSetup
