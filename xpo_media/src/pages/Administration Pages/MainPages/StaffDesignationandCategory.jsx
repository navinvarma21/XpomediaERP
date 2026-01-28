"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../../components/MainContent/MainContentPage"
import { Form, Button, Row, Col, Container, Card, Spinner, InputGroup } from "react-bootstrap"
import { FaEdit, FaTrash, FaTimes } from "react-icons/fa"
import { useAuthContext } from "../../../Context/AuthContext"
import { ENDPOINTS } from "../../../SpringBoot/config"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "../styles/style.css"

const GenericModal = ({ isOpen, onClose, onConfirm, title, fields, data, category }) => {
  const [formData, setFormData] = useState({})
  
  // Initialize formData when modal opens or data changes
  useEffect(() => {
    if (data) {
      // For edit mode, set the current name value
      setFormData({ [category.toLowerCase()]: data.name || "" })
    } else {
      // For add mode, clear the form
      setFormData({ [category.toLowerCase()]: "" })
    }
  }, [data, category, isOpen])

  if (!isOpen) return null

  const handleSubmit = () => {
    onConfirm(formData)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">{title}</h2>
        <div className="modal-body">
          {fields.map((field) => (
            <Form.Group className="mb-3" key={field}>
              <Form.Label>{`Enter ${field}`}</Form.Label>
              <Form.Control
                type="text"
                placeholder={`Enter ${field.toLowerCase()}`}
                value={formData[field.toLowerCase()] || ""}
                onChange={(e) => setFormData({ ...formData, [field.toLowerCase()]: e.target.value })}
                className="custom-input"
              />
            </Form.Group>
          ))}
        </div>
        <div className="modal-buttons">
          <Button className="modal-button confirm" onClick={handleSubmit}>
            {data ? "Update" : "Add"}
          </Button>
          <Button className="modal-button cancel" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

const DeleteModal = ({ isOpen, onClose, onConfirm, title, itemName }) => {
  if (!isOpen) return null
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Delete {title}</h2>
        <div className="modal-body text-center">
          <p>Are you sure you want to delete this entry?</p>
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

const ConfirmEditModal = ({ isOpen, onClose, onConfirm, category, currentName, newName }) => {
  if (!isOpen) return null
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Confirm Edit</h2>
        <div className="modal-body">
          <p>Are you sure you want to edit this {category.toLowerCase()} entry?</p>
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

const StaffDesignationandCategory = () => {
  const { schoolId, currentAcademicYear, user } = useAuthContext()

  const [staffDesignation, setStaffDesignation] = useState({ 
    items: [], 
    searchTerm: "", 
    isLoading: false 
  })
  
  const [staffCategory, setStaffCategory] = useState({ 
    items: [], 
    searchTerm: "", 
    isLoading: false 
  })

  const [modalState, setModalState] = useState({ 
    isOpen: false, 
    type: "", 
    action: "", 
    data: null 
  })
  
  const [confirmEditModalState, setConfirmEditModalState] = useState({
    isOpen: false,
    category: "",
    currentName: "",
    newName: "",
    id: "",
  })

  useEffect(() => {
    if (schoolId && currentAcademicYear) {
      fetchItems("StaffDesignation")
      fetchItems("StaffCategory")
    }
  }, [schoolId, currentAcademicYear])

  // Map frontend category names to backend type values
  const getBackendType = (category) => {
    const typeMap = {
      "StaffDesignation": "StaffDesignation",
      "StaffCategory": "StaffCategory"
    }
    return typeMap[category] || category.toLowerCase()
  }

  const fetchItems = async (category) => {
    if (!schoolId || !currentAcademicYear) return
    
    updateLoading(category, true)
    
    try {
      const backendType = getBackendType(category)
      const res = await fetch(
        `${ENDPOINTS.administration}/staffdac/${backendType}/${schoolId}/${currentAcademicYear}`
      )
      
      if (!res.ok) throw new Error(`Failed to fetch ${category}`)
      
      const data = await res.json()
      updateItems(category, data)
    } catch (err) {
      console.error(`Error fetching ${category}:`, err)
      toast.error(`Failed to fetch ${category} entries.`)
      updateItems(category, [])
    } finally {
      updateLoading(category, false)
    }
  }

  const checkDuplicate = (category, name) => {
    if (!name || typeof name !== 'string') return false
    
    const items = category === "StaffDesignation" ? staffDesignation.items : staffCategory.items
    
    return items.some((item) => {
      const itemValue = item.name
      if (!itemValue || typeof itemValue !== 'string') return false
      return itemValue.toLowerCase().trim() === name.toLowerCase().trim()
    })
  }

  const handleAdd = async (category, newItem) => {
    const itemName = newItem[category.toLowerCase()]?.trim()
    
    if (!itemName) {
      toast.error(`${category} name cannot be empty.`)
      return
    }
    
    if (checkDuplicate(category, itemName)) {
      toast.error(`${category} already exists.`)
      return
    }
    
    updateLoading(category, true)
    
    try {
      const backendType = getBackendType(category)
      const requestBody = {
        name: itemName,
        type: backendType,
        schoolId: schoolId,
        academicYear: currentAcademicYear
      }

      const res = await fetch(`${ENDPOINTS.administration}/staffdac/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || "Failed to add")
      }
      
      const result = await res.json()
      toast.success(`${category} added successfully!`)
      fetchItems(category)
    } catch (err) {
      console.error(`Error adding ${category}:`, err)
      toast.error(err.message || `Failed to add ${category}.`)
    } finally {
      setModalState({ isOpen: false, type: "", action: "", data: null })
      updateLoading(category, false)
    }
  }

  const confirmEdit = async () => {
    const { category, id, newName } = confirmEditModalState
    
    if (!newName.trim()) {
      toast.error(`${category} name cannot be empty.`)
      return
    }
    
    updateLoading(category, true)
    
    try {
      const requestBody = {
        name: newName,
        schoolId: schoolId
      }

      const res = await fetch(`${ENDPOINTS.administration}/staffdac/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || "Failed to update")
      }
      
      const result = await res.json()
      toast.success(`${category} updated successfully!`)
      fetchItems(category)
      
      // Close both modals after successful update
      setConfirmEditModalState({ 
        isOpen: false, 
        category: "", 
        currentName: "", 
        newName: "", 
        id: "" 
      })
      setModalState({ isOpen: false, type: "", action: "", data: null })
      
    } catch (err) {
      console.error(`Error updating ${category}:`, err)
      toast.error(err.message || `Failed to update ${category}.`)
    } finally {
      updateLoading(category, false)
    }
  }

  const handleDelete = async (category, id) => {
    updateLoading(category, true)
    
    try {
      const res = await fetch(`${ENDPOINTS.administration}/staffdac/delete/${id}?schoolId=${schoolId}`, {
        method: "DELETE",
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || "Failed to delete")
      }
      
      toast.success(`${category} deleted successfully!`)
      fetchItems(category)
    } catch (err) {
      console.error(`Error deleting ${category}:`, err)
      toast.error(err.message || `Failed to delete ${category}.`)
    } finally {
      setModalState({ isOpen: false, type: "", action: "", data: null })
      updateLoading(category, false)
    }
  }

  const updateItems = (category, data) => {
    // Filter data to only show items of the correct type
    const backendType = getBackendType(category)
    const filteredData = Array.isArray(data) 
      ? data.filter(item => item.type === backendType)
      : []
    
    if (category === "StaffDesignation") {
      setStaffDesignation((prev) => ({ ...prev, items: filteredData }))
    } else if (category === "StaffCategory") {
      setStaffCategory((prev) => ({ ...prev, items: filteredData }))
    }
  }

  const updateLoading = (category, isLoading) => {
    if (category === "StaffDesignation") {
      setStaffDesignation((prev) => ({ ...prev, isLoading }))
    } else if (category === "StaffCategory") {
      setStaffCategory((prev) => ({ ...prev, isLoading }))
    }
  }

  const openModal = (type, action, data = null) => {
    setModalState({ isOpen: true, type, action, data })
  }

  const closeModal = () => {
    setModalState({ isOpen: false, type: "", action: "", data: null })
  }

  const handleConfirm = (formData) => {
    if (modalState.action === "add") {
      handleAdd(modalState.type, formData)
    } else if (modalState.action === "edit") {
      setConfirmEditModalState({
        isOpen: true,
        category: modalState.type,
        currentName: modalState.data.name || "",
        newName: formData[modalState.type.toLowerCase()] || "",
        id: modalState.data.id,
      })
    }
  }

  const handleConfirmDelete = () => {
    handleDelete(modalState.type, modalState.data.id)
  }

  const renderCard = (category, items, searchTerm, isLoading) => {
  // Improved search: only search by name field with proper null checking
  const filtered = items.filter((item) => {
    const itemName = item?.name || ""
    return itemName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleClear = () => {
    if (category === "StaffDesignation") {
      setStaffDesignation((prev) => ({ ...prev, searchTerm: "" }))
    } else {
      setStaffCategory((prev) => ({ ...prev, searchTerm: "" }))
    }
  }

  const handleSearchChange = (e) => {
    const value = e.target.value
    if (category === "StaffDesignation") {
      setStaffDesignation((prev) => ({ ...prev, searchTerm: value }))
    } else {
      setStaffCategory((prev) => ({ ...prev, searchTerm: value }))
    }
  }

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center header">
        <h5 className="m-0">{category} Setup</h5>
        <Button 
          onClick={() => openModal(category, "add")} 
          variant="primary" 
          size="sm" 
          disabled={isLoading}
        >
          + Add {category}
        </Button>
      </Card.Header>
      <Card.Body>
        <InputGroup className="mb-3">
          <Form.Control
            type="text"
            placeholder={`Search ${category} by name`}
            value={searchTerm}
            onChange={handleSearchChange}
            disabled={isLoading}
          />
          {searchTerm && (
            <Button variant="outline-secondary" onClick={handleClear} aria-label="Clear search">
              <FaTimes />
            </Button>
          )}
        </InputGroup>

        {isLoading ? (
          <div className="text-center my-4">
            <Spinner animation="border" role="status" variant="primary" />
            <p className="mt-2">Loading {category.toLowerCase()}...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center my-4">
            {searchTerm ? (
              <p>No {category.toLowerCase()} found matching "{searchTerm}"</p>
            ) : (
              <p>No {category.toLowerCase()} data available</p>
            )}
          </div>
        ) : (
          filtered.map((item) => (
            <Card key={item.id} className="mb-2">
              <Card.Body className="d-flex justify-content-between align-items-center">
                <span>{item.name || "Unnamed"}</span>
                <div>
                  <Button 
                    variant="link" 
                    className="action-button edit-button light p-0 me-2" 
                    onClick={() => openModal(category, "edit", item)}
                    disabled={isLoading}
                  >
                    <FaEdit/>
                  </Button>
                  <Button 
                    variant="link" 
                    className="action-button delete-button light p-0" 
                    onClick={() => openModal(category, "delete", item)}
                    disabled={isLoading}
                  >
                    <FaTrash/>
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ))
        )}
      </Card.Body>
    </Card>
  )
}

  return (
    <MainContentPage>
      <Container fluid className="px-0 px-lg-0">
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link> <span className="separator">&gt;</span> <span>Administration</span>
          <span className="separator">&gt;</span>
          <span className="current col-12">Staff Designation and Category</span>
        </nav>
        <Row>
          <Col xs={12}>
            <Row>
              <Col xs={12} md={6}>
                {renderCard(
                  "StaffDesignation",
                  staffDesignation.items,
                  staffDesignation.searchTerm,
                  staffDesignation.isLoading
                )}
              </Col>

              <Col xs={12} md={6}>
                {renderCard(
                  "StaffCategory",
                  staffCategory.items,
                  staffCategory.searchTerm,
                  staffCategory.isLoading
                )}
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>

      {modalState.isOpen && modalState.action !== "delete" && (
        <GenericModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          onConfirm={handleConfirm}
          title={`${modalState.action === "add" ? "Add" : "Edit"} ${modalState.type}`}
          fields={[modalState.type]}
          data={modalState.data}
          category={modalState.type}
        />
      )}
      
      {modalState.isOpen && modalState.action === "delete" && (
        <DeleteModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          onConfirm={handleConfirmDelete}
          title={modalState.type}
          itemName={modalState.data?.name || "Unnamed"}
        />
      )}
      
      <ConfirmEditModal
        isOpen={confirmEditModalState.isOpen}
        onClose={() => setConfirmEditModalState({ 
          isOpen: false, 
          category: "", 
          currentName: "", 
          newName: "", 
          id: "" 
        })}
        onConfirm={confirmEdit}
        category={confirmEditModalState.category}
        currentName={confirmEditModalState.currentName}
        newName={confirmEditModalState.newName}
      />
      
      <ToastContainer />
    </MainContentPage>
  )
}

export default StaffDesignationandCategory