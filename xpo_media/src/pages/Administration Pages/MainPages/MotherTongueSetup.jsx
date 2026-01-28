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
import { ENDPOINTS } from "../../../SpringBoot/config"
import "../styles/style.css"

// Add Mother Tongue Modal Component
const AddMotherTongueModal = ({ isOpen, onClose, onConfirm }) => {
  const [motherTongueName, setMotherTongueName] = useState("")

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!motherTongueName.trim()) return toast.error("Mother tongue name cannot be empty.")
    onConfirm(motherTongueName.trim())
    setMotherTongueName("")
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Add Mother Tongue</h2>
        <div className="modal-body">
          <Form.Control
            type="text"
            placeholder="Enter Mother Tongue Name"
            value={motherTongueName}
            onChange={(e) => setMotherTongueName(e.target.value)}
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

// Edit Mother Tongue Modal Component
const EditMotherTongueModal = ({ isOpen, onClose, onConfirm, motherTongue }) => {
  const [motherTongueName, setMotherTongueName] = useState(motherTongue?.motherTongue || "")

  useEffect(() => {
    if (motherTongue) {
      setMotherTongueName(motherTongue.motherTongue)
    }
  }, [motherTongue])

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!motherTongueName.trim()) return toast.error("Mother tongue name cannot be empty.")
    onConfirm(motherTongue.id, motherTongueName.trim())
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Edit Mother Tongue</h2>
        <div className="modal-body">
          <Form.Control
            type="text"
            placeholder="Enter Mother Tongue Name"
            value={motherTongueName}
            onChange={(e) => setMotherTongueName(e.target.value)}
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

// Delete Mother Tongue Modal Component
const DeleteMotherTongueModal = ({ isOpen, onClose, onConfirm, motherTongue }) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Delete Mother Tongue</h2>
        <div className="modal-body text-center">
          <p>Are you sure you want to delete this mother tongue?</p>
          <p className="fw-bold">{motherTongue?.motherTongue}</p>
        </div>
        <div className="modal-buttons">
          <Button className="modal-button delete" onClick={() => onConfirm(motherTongue.id)}>
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
          <p>Are you sure you want to edit this mother tongue? This may affect the structure of student data.</p>
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

const MotherTongueSetup = () => {
  const { user, admin, currentAcademicYear, loading, forceLogout } = useAuthContext()
  const schoolId = user?.uid || admin?.adminId || "-"

  const [motherTongues, setMotherTongues] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMotherTongue, setSelectedMotherTongue] = useState(null)
  const [newMotherTongueName, setNewMotherTongueName] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isConfirmEditModalOpen, setIsConfirmEditModalOpen] = useState(false)

  // --------------------- Fetch Mother Tongues ---------------------
  const fetchMotherTongues = async () => {
    if (!schoolId || schoolId === "-" || !currentAcademicYear) return
    setIsLoading(true)
    try {
      const url = `${ENDPOINTS.administration}/mothertongues?schoolId=${schoolId}&year=${currentAcademicYear}`
      
      const res = await fetch(url)
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Failed to fetch mother tongues: ${res.status}`)
      }
      const data = await res.json()
      setMotherTongues(data)
    } catch (error) {
      console.error("Fetch error:", error)
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMotherTongues()
  }, [schoolId, currentAcademicYear])

  // --------------------- Add Mother Tongue ---------------------
  const handleAddMotherTongue = async (motherTongue) => {
    setIsLoading(true)
    try {
      const url = `${ENDPOINTS.administration}/mothertongues`
      
      const payload = {
        schoolId: schoolId,
        academicYear: currentAcademicYear,
        motherTongue: motherTongue,
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Failed to add mother tongue: ${res.status}`)
      }
      
      await res.json()
      await fetchMotherTongues() // refresh from backend
      setIsAddModalOpen(false)
      toast.success("Mother tongue added successfully!", {
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
      console.error("Add error:", error)
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // --------------------- Edit Mother Tongue ---------------------
  const handleEditMotherTongue = (id, newName) => {
    setSelectedMotherTongue(motherTongues.find((mt) => mt.id === id))
    setNewMotherTongueName(newName)
    setIsEditModalOpen(false)
    setIsConfirmEditModalOpen(true)
  }

  const confirmEditMotherTongue = async () => {
    if (!selectedMotherTongue) return
    setIsLoading(true)
    try {
      const url = `${ENDPOINTS.administration}/mothertongues/${selectedMotherTongue.id}`
      
      const payload = { 
        schoolId: schoolId, 
        motherTongue: newMotherTongueName,
        academicYear: currentAcademicYear
      }

      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Failed to update mother tongue: ${res.status}`)
      }
      
      await fetchMotherTongues()
      setIsConfirmEditModalOpen(false)
      toast.success("Mother tongue updated successfully!", {
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
      console.error("Update error:", error)
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // --------------------- Delete Mother Tongue ---------------------
  const handleDeleteMotherTongue = async (id) => {
    setIsLoading(true)
    try {
      const url = `${ENDPOINTS.administration}/mothertongues/${id}?schoolId=${schoolId}`

      const res = await fetch(url, { method: "DELETE" })
      
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Failed to delete mother tongue: ${res.status}`)
      }
      
      await fetchMotherTongues()
      setIsDeleteModalOpen(false)
      toast.success("Mother tongue deleted successfully!")
    } catch (error) {
      console.error("Delete error:", error)
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // --------------------- Import / Export ---------------------
  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result)
      const workbook = XLSX.read(data, { type: "array" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(sheet)
      for (const row of jsonData) {
        const motherTongue = row["Mother Tongue Name"] || row["motherTongue"]
        if (
          motherTongue &&
          !motherTongues.some(
            (mt) => mt.motherTongue.toLowerCase() === motherTongue.toLowerCase()
          )
        ) {
          await handleAddMotherTongue(motherTongue)
        }
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleExport = () => {
    if (!motherTongues.length) return toast.error("No data to export")
    const exportData = motherTongues.map((mt) => ({ "Mother Tongue Name": mt.motherTongue }))
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "MotherTongues")
    XLSX.writeFile(
      workbook,
      `MotherTongues_Export_${schoolId}_${currentAcademicYear}.xlsx`
    )
    toast.success("Mother tongues exported successfully!", {
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

  const filteredMotherTongues = motherTongues.filter((motherTongue) =>
    motherTongue.motherTongue.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MainContentPage>
      <Container fluid className="px-0 px-lg-0">
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link>
          <span className="separator">&gt;</span>
          <span>Administration</span>
          <span className="separator">&gt;</span>
          <span className="current col-12">Mother Tongue Setup</span>
        </nav>
        <Row>
          <Col xs={12}>
            <div className="mother-tongue-setup-container">
              <div className="form-card mt-3">
                <div className="header p-3 d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="m-0 d-none d-lg-block">Mother Tongue Setup</h2>
                    <h6 className="m-0 d-lg-none">Mother Tongue Setup</h6>
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
                      disabled={!currentAcademicYear || motherTongues.length === 0 || isLoading}
                    >
                      Export
                    </Button>
                    <Button
                      onClick={() => setIsAddModalOpen(true)}
                      className="btn btn-primary text-light"
                      disabled={!currentAcademicYear || isLoading}
                    >
                      + Add Mother Tongue
                    </Button>
                  </div>
                </div>
                <div className="content-wrapper p-4">
                  {!currentAcademicYear ? (
                    <div className="alert alert-warning">Please select an academic year to manage mother tongues.</div>
                  ) : (
                    <>
                      <div className="position-relative mb-3">
                        <Form.Control
                          type="text"
                          placeholder="Search by Mother Tongue Name"
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
                                <th>Mother Tongue Name</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {motherTongues.length === 0 ? (
                                <tr>
                                  <td colSpan="2" className="text-center">
                                    No data available
                                  </td>
                                </tr>
                              ) : filteredMotherTongues.length === 0 && searchTerm ? (
                                <tr>
                                  <td colSpan="2" className="text-center">
                                    No matching mother tongues found
                                  </td>
                                </tr>
                              ) : (
                                filteredMotherTongues.map((motherTongue) => (
                                  <tr key={motherTongue.id}>
                                    <td>{motherTongue.motherTongue}</td>
                                    <td>
                                      <Button
                                        variant="link"
                                        className="action-button edit-button me-2"
                                        onClick={() => {
                                          setSelectedMotherTongue(motherTongue)
                                          setIsEditModalOpen(true)
                                        }}
                                      >
                                        <FaEdit />
                                      </Button>
                                      <Button
                                        variant="link"
                                        className="action-button delete-button"
                                        onClick={() => {
                                          setSelectedMotherTongue(motherTongue)
                                          setIsDeleteModalOpen(true)
                                        }}
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

      <AddMotherTongueModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={handleAddMotherTongue}
      />
      <EditMotherTongueModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedMotherTongue(null)
        }}
        onConfirm={handleEditMotherTongue}
        motherTongue={selectedMotherTongue}
      />
      <DeleteMotherTongueModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedMotherTongue(null)
        }}
        onConfirm={handleDeleteMotherTongue}
        motherTongue={selectedMotherTongue}
      />
      <ConfirmEditModal
        isOpen={isConfirmEditModalOpen}
        onClose={() => {
          setIsConfirmEditModalOpen(false)
          setSelectedMotherTongue(null)
          setNewMotherTongueName("")
        }}
        onConfirm={confirmEditMotherTongue}
        currentName={selectedMotherTongue?.motherTongue}
        newName={newMotherTongueName}
      />

      <ToastContainer />
    </MainContentPage>
  )
}

export default MotherTongueSetup