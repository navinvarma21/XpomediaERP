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

// Modal Components (keep the same as before)
const AddBloodGroupModal = ({ isOpen, onClose, onConfirm }) => {
  const [bloodGroupName, setBloodGroupName] = useState("")

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!bloodGroupName.trim()) return toast.error("Blood group name cannot be empty.")
    onConfirm(bloodGroupName.trim())
    setBloodGroupName("")
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Add Blood Group</h2>
        <div className="modal-body">
          <Form.Control
            type="text"
            placeholder="Enter Blood Group Name"
            value={bloodGroupName}
            onChange={(e) => setBloodGroupName(e.target.value)}
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

const EditBloodGroupModal = ({ isOpen, onClose, onConfirm, bloodGroup }) => {
  const [bloodGroupName, setBloodGroupName] = useState(bloodGroup?.bloodGroup || "")

  useEffect(() => {
    if (bloodGroup) {
      setBloodGroupName(bloodGroup.bloodGroup)
    }
  }, [bloodGroup])

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!bloodGroupName.trim()) return toast.error("Blood group name cannot be empty.")
    onConfirm(bloodGroup.id, bloodGroupName.trim())
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Edit Blood Group</h2>
        <div className="modal-body">
          <Form.Control
            type="text"
            placeholder="Enter Blood Group Name"
            value={bloodGroupName}
            onChange={(e) => setBloodGroupName(e.target.value)}
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

const DeleteBloodGroupModal = ({ isOpen, onClose, onConfirm, bloodGroup }) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Delete Blood Group</h2>
        <div className="modal-body text-center">
          <p>Are you sure you want to delete this blood group?</p>
          <p className="fw-bold">{bloodGroup?.bloodGroup}</p>
        </div>
        <div className="modal-buttons">
          <Button className="modal-button delete" onClick={() => onConfirm(bloodGroup.id)}>
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

const ConfirmEditModal = ({ isOpen, onClose, onConfirm, currentName, newName }) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Confirm Edit</h2>
        <div className="modal-body">
          <p>Are you sure you want to edit this blood group? This may affect the structure of student data.</p>
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

const BloodGroupSetup = () => {
  const { user, admin, currentAcademicYear } = useAuthContext()
  const schoolId = user?.uid || admin?.adminId || "-"

  const [bloodGroups, setBloodGroups] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedBloodGroup, setSelectedBloodGroup] = useState(null)
  const [newBloodGroupName, setNewBloodGroupName] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isConfirmEditModalOpen, setIsConfirmEditModalOpen] = useState(false)

  // Get auth token
  const getAuthToken = () => {
    return sessionStorage.getItem("token") || sessionStorage.getItem("adminToken")
  }

  // FIXED: Enhanced API request helper with timeout and error handling
  const apiRequest = async (endpoint, options = {}) => {
    const token = getAuthToken()
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    // Enhanced fetch options to prevent extension interference
    const fetchOptions = {
      ...options,
      headers,
      cache: 'no-cache',
      credentials: 'same-origin'
    }

    try {
      // Use AbortController for timeout handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
      
      const response = await fetch(endpoint, {
        ...fetchOptions,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      // Handle empty responses
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        return response.json()
      } else {
        return null
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your network connection or try again')
      }
      console.error("API request failed:", error)
      throw error
    }
  }

  // --------------------- Fetch Blood Groups ---------------------
  const fetchBloodGroups = async () => {
    if (!schoolId || schoolId === "-" || !currentAcademicYear) return
    setIsLoading(true)
    try {
      const data = await apiRequest(
        `${ENDPOINTS.administration}/bloodgroups?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      )
      setBloodGroups(data || [])
    } catch (error) {
      console.error("Error fetching blood groups:", error)
      toast.error(error.message || "Failed to fetch blood groups.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBloodGroups()
  }, [schoolId, currentAcademicYear])

  // --------------------- Add Blood Group ---------------------
  const handleAddBloodGroup = async (bloodGroup) => {
    setIsLoading(true)
    try {
      await apiRequest(`${ENDPOINTS.administration}/bloodgroups`, {
        method: "POST",
        body: JSON.stringify({
          schoolId: schoolId,
          academicYear: currentAcademicYear,
          bloodGroup,
        }),
      })
      
      await fetchBloodGroups()
      setIsAddModalOpen(false)
      toast.success("Blood group added successfully!")
    } catch (error) {
      console.error("Error adding blood group:", error)
      toast.error(error.message || "Failed to add blood group.")
    } finally {
      setIsLoading(false)
    }
  }

  // --------------------- Edit Blood Group ---------------------
  const handleEditBloodGroup = (id, newName) => {
    setSelectedBloodGroup(bloodGroups.find((bg) => bg.id === id))
    setNewBloodGroupName(newName)
    setIsEditModalOpen(false)
    setIsConfirmEditModalOpen(true)
  }

  const confirmEditBloodGroup = async () => {
    if (!selectedBloodGroup) return
    setIsLoading(true)
    try {
      await apiRequest(
        `${ENDPOINTS.administration}/bloodgroups/${selectedBloodGroup.id}`,
        {
          method: "PUT",
          body: JSON.stringify({ 
            schoolId: schoolId, 
            bloodGroup: newBloodGroupName,
            academicYear: currentAcademicYear
          }),
        }
      )
      
      await fetchBloodGroups()
      setIsConfirmEditModalOpen(false)
      toast.success("Blood group updated successfully!")
    } catch (error) {
      console.error("Error updating blood group:", error)
      toast.error(error.message || "Failed to update blood group.")
    } finally {
      setIsLoading(false)
    }
  }

  // --------------------- Delete Blood Group ---------------------
  const handleDeleteBloodGroup = async (id) => {
    setIsLoading(true)
    try {
      await apiRequest(
        `${ENDPOINTS.administration}/bloodgroups/${id}?schoolId=${schoolId}`,
        { method: "DELETE" }
      )
      
      await fetchBloodGroups()
      setIsDeleteModalOpen(false)
      toast.success("Blood group deleted successfully!")
    } catch (error) {
      console.error("Error deleting blood group:", error)
      toast.error(error.message || "Failed to delete blood group.")
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
        const bloodGroup = row["Blood Group Name"] || row["bloodGroup"]
        if (
          bloodGroup &&
          !bloodGroups.some(
            (bg) => bg.bloodGroup.toLowerCase() === bloodGroup.toLowerCase()
          )
        ) {
          await handleAddBloodGroup(bloodGroup)
        }
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleExport = () => {
    if (!bloodGroups.length) return toast.error("No data to export")
    const exportData = bloodGroups.map((bg) => ({ "Blood Group Name": bg.bloodGroup }))
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "BloodGroups")
    XLSX.writeFile(
      workbook,
      `BloodGroups_Export_${schoolId}_${currentAcademicYear}.xlsx`
    )
    toast.success("Blood groups exported successfully!")
  }

  const filteredBloodGroups = bloodGroups.filter((bloodGroup) =>
    bloodGroup.bloodGroup.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MainContentPage>
      <Container fluid className="px-0 px-lg-0">
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link>
          <span className="separator">&gt;</span>
          <span>Administration</span>
          <span className="separator">&gt;</span>
          <span className="current col-12">Blood Group Setup</span>
        </nav>
        <Row>
          <Col xs={12}>
            <div className="blood-group-setup-container">
              <div className="form-card mt-3">
                <div className="header p-3 d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="m-0 d-none d-lg-block">Blood Group Setup</h2>
                    <h6 className="m-0 d-lg-none">Blood Group Setup</h6>
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
                      disabled={!currentAcademicYear || bloodGroups.length === 0 || isLoading}
                    >
                      Export
                    </Button>
                    <Button
                      onClick={() => setIsAddModalOpen(true)}
                      className="btn btn-primary text-light"
                      disabled={!currentAcademicYear || isLoading}
                    >
                      + Add Blood Group
                    </Button>
                  </div>
                </div>
                <div className="content-wrapper p-4">
                  {!currentAcademicYear ? (
                    <div className="alert alert-warning">Please select an academic year to manage blood groups.</div>
                  ) : (
                    <>
                      <div className="position-relative mb-3">
                        <Form.Control
                          type="text"
                          placeholder="Search by Blood Group Name"
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
                                <th>Blood Group Name</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bloodGroups.length === 0 ? (
                                <tr>
                                  <td colSpan="2" className="text-center">
                                    No data available
                                  </td>
                                </tr>
                              ) : filteredBloodGroups.length === 0 && searchTerm ? (
                                <tr>
                                  <td colSpan="2" className="text-center">
                                    No matching blood groups found
                                  </td>
                                </tr>
                              ) : (
                                filteredBloodGroups.map((bloodGroup) => (
                                  <tr key={bloodGroup.id}>
                                    <td>{bloodGroup.bloodGroup}</td>
                                    <td>
                                      <Button
                                        variant="link"
                                        className="action-button edit-button me-2"
                                        onClick={() => {
                                          setSelectedBloodGroup(bloodGroup)
                                          setIsEditModalOpen(true)
                                        }}
                                      >
                                        <FaEdit />
                                      </Button>
                                      <Button
                                        variant="link"
                                        className="action-button delete-button"
                                        onClick={() => {
                                          setSelectedBloodGroup(bloodGroup)
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

      <AddBloodGroupModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={handleAddBloodGroup}
      />
      <EditBloodGroupModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedBloodGroup(null)
        }}
        onConfirm={handleEditBloodGroup}
        bloodGroup={selectedBloodGroup}
      />
      <DeleteBloodGroupModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedBloodGroup(null)
        }}
        onConfirm={handleDeleteBloodGroup}
        bloodGroup={selectedBloodGroup}
      />
      <ConfirmEditModal
        isOpen={isConfirmEditModalOpen}
        onClose={() => {
          setIsConfirmEditModalOpen(false)
          setSelectedBloodGroup(null)
          setNewBloodGroupName("")
        }}
        onConfirm={confirmEditBloodGroup}
        currentName={selectedBloodGroup?.bloodGroup}
        newName={newBloodGroupName}
      />

      <ToastContainer />
    </MainContentPage>
  )
}

export default BloodGroupSetup