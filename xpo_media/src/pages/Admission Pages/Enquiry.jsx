"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Button, Container, Table, Form, OverlayTrigger, Tooltip, Badge, InputGroup } from "react-bootstrap"
import { FaEdit, FaTrash, FaEye, FaCopy, FaTimes } from "react-icons/fa"
import { useAuthContext } from "../../Context/AuthContext"
import { ENDPOINTS } from "../../SpringBoot/config"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName }) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Delete Enquiry</h2>
        <div className="modal-body text-center">
          <p>Are you sure you want to delete this enquiry?</p>
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

const Enquiry = () => {
  const [enquiries, setEnquiries] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [enquiryToDelete, setEnquiryToDelete] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { schoolId, currentAcademicYear, getAuthToken } = useAuthContext()

  // Fetch enquiries directly without administration ID
  useEffect(() => {
    if (schoolId && currentAcademicYear) {
      fetchEnquiries()
    }
  }, [schoolId, currentAcademicYear])

  const fetchEnquiries = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/enquiry/school/${schoolId}?academicYear=${currentAcademicYear}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          // No enquiries found, set empty array
          setEnquiries([])
          return
        }
        throw new Error(`Failed to fetch enquiries: ${response.status}`)
      }

      const enquiriesData = await response.json()
      setEnquiries(Array.isArray(enquiriesData) ? enquiriesData : [])
    } catch (error) {
      console.error("Error fetching enquiries:", error)
      // Don't show error toast for empty results, just set empty array
      if (!error.message.includes('404')) {
        toast.error("Failed to fetch enquiries. Please try again.")
      }
      setEnquiries([])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (enquiryId) => {
    navigate(`/admission/enquiry-form/${enquiryId}`)
  }

  const handleDeleteClick = (enquiry) => {
    setEnquiryToDelete(enquiry)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (enquiryToDelete) {
      try {
        const token = getAuthToken()
        const response = await fetch(
          `${ENDPOINTS.admissionmaster}/enquiry/${enquiryToDelete.id}?schoolId=${schoolId}`,
          {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to delete enquiry: ${response.status}`)
        }

        toast.success("Enquiry deleted successfully!")
        fetchEnquiries()
      } catch (error) {
        console.error("Error deleting enquiry:", error)
        toast.error(`Failed to delete enquiry: ${error.message}`)
      }
    }
    setIsDeleteModalOpen(false)
    setEnquiryToDelete(null)
  }

  const handleView = (enquiryId) => {
    navigate(`/admission/enquiry-form/${enquiryId}?view=true`)
  }

  const handleCopyEnquiryKey = (enquiryKey) => {
    navigator.clipboard
      .writeText(enquiryKey)
      .then(() => toast.success("Enquiry Key copied to clipboard!"))
      .catch((error) => toast.error("Failed to copy Enquiry Key"))
  }

  const handleClearSearch = () => {
    setSearchTerm("")
    fetchEnquiries() // Reset to show all enquiries when clearing search
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchEnquiries()
      return
    }

    try {
      setLoading(true)
      const token = getAuthToken()
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/enquiry/school/${schoolId}/search?searchTerm=${encodeURIComponent(searchTerm)}&academicYear=${currentAcademicYear}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      )

      if (response.ok) {
        const searchResults = await response.json()
        setEnquiries(Array.isArray(searchResults) ? searchResults : [])
      } else {
        // If search endpoint not available, filter locally
        filterEnquiriesLocally()
      }
    } catch (error) {
      console.error("Error searching enquiries:", error)
      // Fallback to local filtering
      filterEnquiriesLocally()
    } finally {
      setLoading(false)
    }
  }

  const filterEnquiriesLocally = () => {
    const filtered = enquiries.filter(
      (enquiry) =>
        (enquiry.studentName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (enquiry.fatherName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (enquiry.motherName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (enquiry.phoneNumber || "").includes(searchTerm) ||
        (enquiry.enquiryKey?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (enquiry.standard?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )
    setEnquiries(filtered)
  }

  // FIXED: Use the original enquiries array for filtering instead of modifying state
  const filteredEnquiries = searchTerm ? enquiries.filter(
    (enquiry) =>
      (enquiry.studentName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (enquiry.fatherName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (enquiry.motherName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (enquiry.phoneNumber || "").includes(searchTerm) ||
      (enquiry.enquiryKey?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (enquiry.standard?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  ) : enquiries

  const calculateTotalFees = (enquiry) => {
    const tuitionFee = Number.parseFloat(enquiry.tutionFees || enquiry.tuitionFees || 0)
    const busFee = Number.parseFloat(enquiry.busFee || 0)
    const hostelFee = Number.parseFloat(enquiry.hostelFee || 0)
    return (tuitionFee + busFee + hostelFee).toFixed(2)
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <div className="mb-4">
          <nav className="custom-breadcrumb py-1 py-lg-3">
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <span>Admission</span>
            <span className="separator mx-2">&gt;</span>
            <span>Enquiry</span>
          </nav>
        </div>
        <div
          style={{ backgroundColor: "#0B3D7B" }}
          className="text-white p-3 rounded-top d-flex justify-content-between align-items-center"
        >
          <h2 className="mb-0">Enquiry</h2>
          <Button onClick={() => navigate("/admission/enquiry-form")} className="btn btn-primary text-light">
            + Add Enquiry
          </Button>
        </div>

        <div className="bg-white p-4 rounded-bottom shadow">
          <Form className="mb-3">
            <Form.Group>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Search by name, enquiry key, or standard"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="search-input"
                />
                {searchTerm && (
                  <InputGroup.Text 
                    className="clear-search-btn"
                    onClick={handleClearSearch}
                    style={{ cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: '1px solid #dc3545' }}
                  >
                    <FaTimes />
                  </InputGroup.Text>
                )}
              </InputGroup>
            </Form.Group>
          </Form>

          {loading && (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {!loading && (
            <div className="table-responsive">
              <Table bordered hover className="enquiry-table">
                <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                  <tr>
                    <th className="text-center">Enquiry Key</th>
                    <th className="text-center">Student Name</th>
                    <th className="text-center">Father's Name</th>
                    <th className="text-center">Mother's Name</th>
                    <th className="text-center">Phone Number</th>
                    <th className="text-center">Standard</th>
                    <th className="text-center">Total Fees</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnquiries.map((enquiry) => (
                    <tr key={enquiry.id} className="enquiry-row">
                      <td className="text-center">
                        <div className="d-flex align-items-center justify-content-center">
                          <span className="me-2 enquiry-key">{enquiry.enquiryKey}</span>
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip id={`tooltip-${enquiry.id}`}>Copy Enquiry Key</Tooltip>}
                          >
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              className="copy-button"
                              onClick={() => handleCopyEnquiryKey(enquiry.enquiryKey)}
                            >
                              <FaCopy />
                            </Button>
                          </OverlayTrigger>
                        </div>
                      </td>
                      <td className="text-center">{enquiry.studentName}</td>
                      <td className="text-center">{enquiry.fatherName}</td>
                      <td className="text-center">{enquiry.motherName}</td>
                      <td className="text-center">{enquiry.phoneNumber}</td>
                      <td className="text-center">{enquiry.standard}</td>
                      <td className="text-center">
                        <Badge bg="info" className="fee-badge">
                          ₹ {calculateTotalFees(enquiry)}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-2">
                          <OverlayTrigger placement="top" overlay={<Tooltip>View</Tooltip>}>
                            <Button
                              variant="secondary"
                              className="action-button view-button"
                              onClick={() => handleView(enquiry.id)}
                            >
                              <FaEye />
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger placement="top" overlay={<Tooltip>Edit</Tooltip>}>
                            <Button
                              variant="primary"
                              className="action-button edit-button"
                              onClick={() => handleEdit(enquiry.id)}
                            >
                              <FaEdit />
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger placement="top" overlay={<Tooltip>Delete</Tooltip>}>
                            <Button
                              variant="danger"
                              className="action-button delete-button"
                              onClick={() => handleDeleteClick(enquiry)}
                            >
                              <FaTrash />
                            </Button>
                          </OverlayTrigger>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredEnquiries.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-4 no-data">
                        {searchTerm ? "No enquiries match your search" : "No enquiries found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      </Container>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setEnquiryToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        itemName={enquiryToDelete?.studentName}
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
            width: 32px;
            height: 32px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            padding: 0;
            color: white;
            border: none;
          }

          .view-button {
            background-color: #6c757d;
          }

          .view-button:hover {
            background-color: #5a6268;
          }

          .edit-button {
            background-color: #0B3D7B;
          }

          .edit-button:hover {
            background-color: #092a54;
          }

          .delete-button {
            background-color: #dc3545;
          }

          .delete-button:hover {
            background-color: #bb2d3b;
          }

          .copy-button {
            padding: 0.25rem 0.5rem;
            font-size: 0.875rem;
            line-height: 1.5;
            border-radius: 0.2rem;
            transition: all 0.15s ease-in-out;
            border: 1px solid #6c757d;
          }

          .copy-button:hover {
            background-color: #0B3D7B;
            border-color: #0B3D7B;
            color: white;
          }

          .fee-badge {
            font-size: 0.85rem;
            padding: 0.3rem 0.6rem;
            font-weight: 600;
          }

          .search-input {
            border-right: none;
          }

          .search-input:focus {
            border-color: #ced4da;
            box-shadow: none;
          }

          .search-input:focus + .input-group-text {
            border-color: #ced4da;
          }

          .search-btn:hover {
            background-color: #092a54 !important;
          }

          .clear-search-btn:hover {
            background-color: #bb2d3b !important;
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

          /* Table improvements */
          .enquiry-table {
            font-size: 0.9rem;
          }

          .enquiry-table th {
            font-weight: 600;
            padding: 12px 8px;
          }

          .enquiry-table td {
            padding: 10px 8px;
            vertical-align: middle;
          }

          .enquiry-row:hover {
            background-color: #f8f9fa;
          }

          .enquiry-key {
            font-weight: 500;
            color: #0B3D7B;
          }

          .no-data {
            color: #6c757d;
            font-style: italic;
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

export default Enquiry