"use client"

import { useState, useEffect } from "react"
import { Container, Form, Button, Table, Spinner } from "react-bootstrap"
import MainContentPage from "../../../components/MainContent/MainContentPage"
import { Link, useNavigate } from "react-router-dom"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { FaEdit, FaTrash, FaEye } from "react-icons/fa"
import { useAuthContext } from "../../../Context/AuthContext"
import { ENDPOINTS } from "../../../SpringBoot/config"

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName }) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Delete Staff Member</h2>
        <div className="modal-body text-center">
          <p>Are you sure you want to delete this staff member?</p>
          <p className="fw-bold">{itemName}</p>
        </div>
        <div className="modal-buttons">
          <Button className="modal-button delete" onClick={onConfirm}>
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

const StaffMaster = () => {
  const [staffMembers, setStaffMembers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [staffToDelete, setStaffToDelete] = useState(null)
  const [isLoading, setIsLoading] = useState({
    staffMembers: false,
    delete: false,
    init: true,
  })
  const navigate = useNavigate()
  const { user, currentAcademicYear, schoolId, getAuthHeaders } = useAuthContext()

  useEffect(() => {
    if (user && currentAcademicYear) {
      fetchStaffMembers()
    }
  }, [user, currentAcademicYear, schoolId])

  const fetchStaffMembers = async () => {
    if (!currentAcademicYear) {
      toast.error("Please select an academic year first")
      return
    }

    if (!schoolId) {
      toast.error("School ID not found")
      return
    }

    try {
      setIsLoading((prev) => ({ ...prev, staffMembers: true }))

      const response = await fetch(
        `${ENDPOINTS.administration}/staff?schoolId=${schoolId}&academicYear=${currentAcademicYear}`, 
        {
          method: "GET",
          headers: getAuthHeaders()
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          // Staff master not initialized yet, this is normal for first time
          setStaffMembers([])
          setIsLoading((prev) => ({ ...prev, staffMembers: false, init: false }))
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const staffData = await response.json()
      setStaffMembers(staffData)

      setIsLoading((prev) => ({ ...prev, staffMembers: false, init: false }))
    } catch (error) {
      console.error("Error fetching staff members:", error)
      toast.error("Failed to fetch staff members. Please try again.")
      setIsLoading((prev) => ({ ...prev, staffMembers: false, init: false }))
    }
  }

  const handleDelete = async () => {
    if (!currentAcademicYear || !schoolId) {
      toast.error("Please select an academic year first")
      return
    }

    if (!staffToDelete) {
      toast.error("No staff member selected for deletion")
      return
    }

    try {
      setIsLoading((prev) => ({ ...prev, delete: true }))

      // FIXED: Add schoolId and academicYear as query parameters
      const response = await fetch(
        `${ENDPOINTS.administration}/staff/${staffToDelete.id}?schoolId=${schoolId}&academicYear=${currentAcademicYear}`, 
        {
          method: "DELETE",
          headers: getAuthHeaders()
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `HTTP error! status: ${response.status}`)
      }

      toast.success("Staff member deleted successfully!")
      await fetchStaffMembers()

      setIsDeleteModalOpen(false)
      setStaffToDelete(null)
      setIsLoading((prev) => ({ ...prev, delete: false }))
    } catch (error) {
      console.error("Error deleting staff member:", error)
      toast.error(`Failed to delete staff member: ${error.message}`)
      setIsLoading((prev) => ({ ...prev, delete: false }))
    }
  }

  const filteredStaffMembers = staffMembers.filter(
    (staff) =>
      staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.staffCode?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const isAnyLoading = Object.values(isLoading).some(Boolean)

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <div className="mb-4">
          <nav className="custom-breadcrumb py-1 py-lg-3">
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <span>Administration</span>
            <span className="separator mx-2">&gt;</span>
            <span>Staff Master</span>
          </nav>
        </div>

        <div
          style={{ backgroundColor: "#0B3D7B" }}
          className="text-white p-3 rounded-top d-flex justify-content-between align-items-center"
        >
          <h2 className="mb-0">Staff Master</h2>
          <Button
            onClick={() => navigate("/administration/staff-form")}
            className="btn btn-primary text-light"
            disabled={isAnyLoading || !currentAcademicYear}
          >
            + Add Staff
          </Button>
        </div>

        <div className="bg-white p-4 rounded-bottom shadow">
          {!currentAcademicYear ? (
            <div className="alert alert-warning">Please select an academic year to manage staff members.</div>
          ) : isLoading.init ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" style={{ color: "#0B3D7B" }}>
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-2">Initializing...</p>
            </div>
          ) : (
            <>
              <Form className="mb-3">
                <Form.Group style={{ position: "relative" }}>
                  <Form.Control
                    type="text"
                    placeholder="Search by name or staff code"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={isLoading.staffMembers}
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
                </Form.Group>
              </Form>

              {isLoading.staffMembers ? (
                <div className="text-center py-5">
                  <Spinner animation="border" role="status" style={{ color: "#0B3D7B" }}>
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <p className="mt-2">Loading staff members...</p>
                </div>
              ) : filteredStaffMembers.length > 0 ? (
                <div className="table-responsive">
                  <Table bordered hover>
                    <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                      <tr>
                        <th>Staff Code</th>
                        <th>Name</th>
                        <th>Designation</th>
                        <th>Mobile Number</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaffMembers.map((staff) => (
                        <tr key={staff.id}>
                          <td>{staff.staffCode}</td>
                          <td>{staff.name}</td>
                          <td>{staff.designation}</td>
                          <td>{staff.mobileNumber}</td>
                          <td>
                            <Button
                              variant="secondary"
                              className="action-button view-button me-2"
                              onClick={() => navigate(`/administration/staff-form/${staff.id}?mode=view`)}
                              disabled={isAnyLoading}
                            >
                              <FaEye />
                            </Button>
                            <Button
                              variant="link"
                              className="action-button edit-button me-2"
                              onClick={() => navigate(`/administration/staff-form/${staff.id}`)}
                              disabled={isAnyLoading}
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="link"
                              className="action-button delete-button"
                              onClick={() => {
                                setStaffToDelete(staff)
                                setIsDeleteModalOpen(true)
                              }}
                              disabled={isAnyLoading}
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="alert alert-info">No staff members found. Add a new staff member to get started.</div>
              )}
            </>
          )}
        </div>
      </Container>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setStaffToDelete(null)
        }}
        onConfirm={handleDelete}
        itemName={staffToDelete?.name}
      />

      <ToastContainer />

      <style>
        {`
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
            background-color: #6c757d;
          }

          .view-button:hover {
            background-color: #5a6268;
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

          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1100;
          }

          .modal-content {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            width: 90%;
            max-width: 400px;
          }

          .modal-title {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #333;
            text-align: center;
          }

          .modal-body {
            margin-bottom: 1.5rem;
          }

          .modal-buttons {
            display: flex;
            justify-content: center;
            gap: 1rem;
          }

          .modal-button {
            padding: 0.5rem 2rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            transition: opacity 0.2s;
          }

          .modal-button.delete {
            background-color: #dc3545;
            color: white;
          }

          .modal-button.cancel {
            background-color: #6c757d;
            color: white;
          }

          /* Toastify custom styles */
          .Toastify__toast-container {
            z-index: 9999;
          }

          .Toastify__toast {
            background-color: #0B3D7B;
            color: white;
          }

          .Toastify__toast--success {
            background-color: #0B3D7B;
          }

          .Toastify__toast--error {
            background-color: #dc3545;
          }

          .Toastify__progress-bar {
            background-color: rgba(255, 255, 255, 0.7);
          }
        `}
      </style>
    </MainContentPage>
  )
}

export default StaffMaster