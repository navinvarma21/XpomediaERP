"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../../components/MainContent/MainContentPage"
import { Form, Button, Row, Col, Container, Card, Spinner, InputGroup } from "react-bootstrap"
import { FaEdit, FaTrash, FaTimes, FaSearch } from "react-icons/fa"
import { useAuthContext } from "../../../Context/AuthContext"
import { ENDPOINTS } from "../../../SpringBoot/config"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import * as XLSX from "xlsx"
import "../Styles/style.css"

const GenericModal = ({ isOpen, onClose, onConfirm, title, fields, data, category, states = [] }) => {
  const [formData, setFormData] = useState({})
  
  useEffect(() => {
    if (data) {
      // Editing existing data
      setFormData({ 
        [category.toLowerCase()]: data.name || "",
        stateId: data.stateId || ""
      })
    } else {
      // Adding new data - set empty stateId for District
      setFormData({ 
        [category.toLowerCase()]: "",
        stateId: "" // Empty instead of selecting first state
      })
    }
  }, [data, category, isOpen, states])

  if (!isOpen) return null

  const handleSubmit = () => {
    // Validate that a state is selected for District
    if (category === "District" && !formData.stateId) {
      toast.error("Please select a state for the district.")
      return
    }
    
    // Validate that name is not empty
    if (!formData[category.toLowerCase()]?.trim()) {
      toast.error(`${category} name cannot be empty.`)
      return
    }
    
    onConfirm(formData)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">{title}</h2>
        <div className="modal-body">
          {category === "District" && (
            <Form.Group className="mb-3">
              <Form.Label>Select State <span className="text-danger">*</span></Form.Label>
              {states.length === 0 ? (
                <Form.Control as="select" disabled>
                  <option>Loading states...</option>
                </Form.Control>
              ) : (
                <Form.Control
                  as="select"
                  value={formData.stateId || ""}
                  onChange={(e) => setFormData({ ...formData, stateId: e.target.value })}
                  className="custom-input"
                  required
                >
                  <option value="">Select State</option>
                  {states.map((state) => (
                    <option key={state.id} value={state.id}>
                      {state.name}
                    </option>
                  ))}
                </Form.Control>
              )}
            </Form.Group>
          )}
          
          {fields.map((field) => (
            <Form.Group className="mb-3" key={field}>
              <Form.Label>{`Enter ${field}`} <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder={`Enter ${field.toLowerCase()}`}
                value={formData[field.toLowerCase()] || ""}
                onChange={(e) => setFormData({ ...formData, [field.toLowerCase()]: e.target.value })}
                className="custom-input"
                required
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

const StateAndDistrictManagement = () => {
  const { schoolId, user } = useAuthContext()

  const [statesData, setStatesData] = useState({ 
    items: [], 
    searchTerm: "", 
    isLoading: false 
  })
  
  const [district, setDistrict] = useState({ 
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
    if (schoolId) {
      fetchItems("State")
      fetchItems("District")
    }
  }, [schoolId])

  const getBackendType = (category) => {
    const typeMap = {
      "State": "state",
      "District": "district"
    }
    return typeMap[category] || category.toLowerCase()
  }

  const fetchItems = async (category) => {
    if (!schoolId) return
    
    updateLoading(category, true)
    
    try {
      const backendType = getBackendType(category)
      const res = await fetch(
        `${ENDPOINTS.administration}/statedistrict/${backendType}/${schoolId}`
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

  const checkDuplicate = (category, name, stateId = null, id = null) => {
    if (!name || typeof name !== 'string') return false
    
    const items = category === "State" ? statesData.items : district.items
    
    return items.some((item) => {
      const itemValue = item.name
      if (!itemValue || typeof itemValue !== 'string') return false
      
      if (category === "District" && stateId) {
        return item.id !== id && 
               itemValue.toLowerCase().trim() === name.toLowerCase().trim() &&
               item.stateId === stateId
      }
      
      return item.id !== id && itemValue.toLowerCase().trim() === name.toLowerCase().trim()
    })
  }

  const handleAdd = async (category, newItem) => {
    const itemName = newItem[category.toLowerCase()]?.trim()
    
    if (!itemName) {
      toast.error(`${category} name cannot be empty.`)
      return
    }

    if (category === "District" && !newItem.stateId) {
      toast.error("Please select a state for the district.")
      return
    }
    
    if (checkDuplicate(category, itemName, newItem.stateId)) {
      toast.error(`${category} already exists${category === "District" ? " in this state" : ""}.`)
      return
    }
    
    updateLoading(category, true)
    
    try {
      const backendType = getBackendType(category)
      const requestBody = {
        name: itemName,
        type: backendType,
        schoolId: schoolId,
        stateId: category === "District" ? newItem.stateId : null
      }

      const res = await fetch(`${ENDPOINTS.administration}/statedistrict/add`, {
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

      const res = await fetch(`${ENDPOINTS.administration}/statedistrict/update/${id}`, {
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
      const res = await fetch(`${ENDPOINTS.administration}/statedistrict/delete/${id}?schoolId=${schoolId}`, {
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

  const handleImport = async (category, event) => {
    if (!schoolId) {
      toast.error("School ID not available.")
      return
    }

    const file = event.target.files[0]
    if (!file) return

    updateLoading(category, true)

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
          updateLoading(category, false)
          return
        }

        const backendType = getBackendType(category)
        let successCount = 0

        for (const row of jsonData) {
          const name = row[category] || row[category.toLowerCase()] || row.name
          const stateName = row.state || row.stateName
          
          if (name && name.trim()) {
            let stateId = null
            if (category === "District" && stateName) {
              const stateItem = statesData.items.find(s => s.name.toLowerCase() === stateName.toLowerCase())
              stateId = stateItem?.id
              if (!stateId) {
                console.warn(`State "${stateName}" not found, skipping district "${name}"`)
                continue
              }
            }

            if (!checkDuplicate(category, name, stateId)) {
              const requestBody = {
                name: name.trim(),
                type: backendType,
                schoolId: schoolId,
                stateId: stateId
              }

              const res = await fetch(`${ENDPOINTS.administration}/statedistrict/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
              })

              if (res.ok) successCount++
            }
          }
        }

        toast.success(`Imported ${successCount} ${category.toLowerCase()} entries successfully!`)
        fetchItems(category)
        
      } catch (err) {
        console.error(`Error importing ${category}:`, err)
        toast.error(`Failed to import ${category} entries.`)
        updateLoading(category, false)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleExport = (category) => {
    const items = category === "State" ? statesData.items : district.items
    if (items.length === 0) {
      toast.error(`No ${category.toLowerCase()} data available to export.`)
      return
    }

    const exportData = items.map((item) => {
      const data = { [category]: item.name }
      if (category === "District" && item.stateName) {
        data["State"] = item.stateName
      }
      return data
    })

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, category)
    XLSX.writeFile(workbook, `${category}_Export_${schoolId}.xlsx`)
    toast.success(`${category} entries exported successfully!`)
  }

  const updateItems = (category, data) => {
    const backendType = getBackendType(category)
    const filteredData = Array.isArray(data) 
      ? data.filter(item => item.type === backendType)
      : []
    
    // Sort items alphabetically by name
    const sortedData = filteredData.sort((a, b) => a.name.localeCompare(b.name))
    
    if (category === "State") {
      setStatesData((prev) => ({ ...prev, items: sortedData }))
    } else if (category === "District") {
      setDistrict((prev) => ({ ...prev, items: sortedData }))
    }
  }

  const updateLoading = (category, isLoading) => {
    if (category === "State") {
      setStatesData((prev) => ({ ...prev, isLoading }))
    } else if (category === "District") {
      setDistrict((prev) => ({ ...prev, isLoading }))
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

  const getStateName = (stateId) => {
    const stateItem = statesData.items.find(s => s.id === stateId)
    return stateItem ? stateItem.name : "Unknown State"
  }

  // Group districts by state and sort everything alphabetically
  const getGroupedDistricts = (districts) => {
    const grouped = {}
    
    districts.forEach(district => {
      const stateName = getStateName(district.stateId)
      if (!grouped[stateName]) {
        grouped[stateName] = []
      }
      grouped[stateName].push(district)
    })
    
    // Sort states alphabetically
    const sortedStates = Object.keys(grouped).sort()
    
    // Sort districts within each state alphabetically
    sortedStates.forEach(state => {
      grouped[state] = grouped[state].sort((a, b) => a.name.localeCompare(b.name))
    })
    
    return { grouped, sortedStates }
  }

  const renderStateCard = (items, searchTerm, isLoading) => {
    const filtered = items.filter((item) => {
      const itemName = item?.name || ""
      return itemName.toLowerCase().includes(searchTerm.toLowerCase())
    })

    const handleClear = () => {
      setStatesData((prev) => ({ ...prev, searchTerm: "" }))
    }

    const handleSearchChange = (e) => {
      setStatesData((prev) => ({ ...prev, searchTerm: e.target.value }))
    }

    return (
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center header">
          <h5 className="m-0">State Setup</h5>
          <div className="d-flex align-items-center gap-2">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={(e) => handleImport("State", e)}
              style={{ display: "none" }}
              id="import-file-State"
            />
            <Button
              onClick={() => document.getElementById("import-file-State").click()}
              variant="primary"
              size="sm"
              disabled={!schoolId || isLoading}
            >
              Import
            </Button>
            <Button
              onClick={() => handleExport("State")}
              variant="primary"
              size="sm"
              disabled={!schoolId || items.length === 0 || isLoading}
            >
              Export
            </Button>
            <Button
              onClick={() => openModal("State", "add")}
              variant="primary"
              size="sm"
              disabled={!schoolId || isLoading}
            >
              + Add State
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {!schoolId ? (
            <div className="alert alert-warning">
              Please log in to manage state entries.
            </div>
          ) : (
            <>
              <InputGroup className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Search states by name"
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
                  <p className="mt-2">Loading states...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center my-4">
                  {searchTerm ? (
                    <p>No states found matching "{searchTerm}"</p>
                  ) : (
                    <p>No state data available</p>
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
                          className="action-button edit-button p-0 me-2" 
                          onClick={() => openModal("State", "edit", item)}
                          disabled={isLoading}
                        >
                          <FaEdit />
                        </Button>
                        <Button 
                          variant="link" 
                          className="action-button delete-button p-0" 
                          onClick={() => openModal("State", "delete", item)}
                          disabled={isLoading}
                        >
                          <FaTrash  />
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                ))
              )}
            </>
          )}
        </Card.Body>
      </Card>
    )
  }

  const renderDistrictCard = (items, searchTerm, isLoading) => {
  const { grouped, sortedStates } = getGroupedDistricts(items)

  // ✅ Fix: allow search from 1 character instead of 2
  const filteredItems =
    searchTerm.trim().length > 0
      ? items.filter((item) => {
          const itemName = item?.name || ""
          const stateName = getStateName(item.stateId)
          const searchTermLower = searchTerm.toLowerCase()

          return (
            itemName.toLowerCase().includes(searchTermLower) ||
            stateName.toLowerCase().includes(searchTermLower)
          )
        })
      : items

  const { grouped: filteredGrouped, sortedStates: filteredSortedStates } =
    getGroupedDistricts(filteredItems)

  const handleClear = () => {
    setDistrict((prev) => ({ ...prev, searchTerm: "" }))
  }

  const handleSearchChange = (e) => {
    setDistrict((prev) => ({ ...prev, searchTerm: e.target.value }))
  }

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center header">
        <h5 className="m-0">District Setup</h5>
        <div className="d-flex align-items-center gap-2">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => handleImport("District", e)}
            style={{ display: "none" }}
            id="import-file-District"
          />
          <Button
            onClick={() =>
              document.getElementById("import-file-District").click()
            }
            variant="primary"
            size="sm"
            disabled={!schoolId || isLoading || statesData.items.length === 0}
          >
            Import
          </Button>
          <Button
            onClick={() => handleExport("District")}
            variant="primary"
            size="sm"
            disabled={!schoolId || items.length === 0 || isLoading}
          >
            Export
          </Button>
          <Button
            onClick={() => openModal("District", "add")}
            variant="primary"
            size="sm"
            disabled={!schoolId || isLoading || statesData.items.length === 0}
          >
            + Add District
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {!schoolId ? (
          <div className="alert alert-warning">
            Please log in to manage district entries.
          </div>
        ) : statesData.items.length === 0 ? (
          <div className="alert alert-warning">
            Please add states first before adding districts.
          </div>
        ) : (
          <>
            <InputGroup className="mb-3">
              <Form.Control
                type="text"
                placeholder="Search districts by name or state"
                value={searchTerm}
                onChange={handleSearchChange}
                disabled={isLoading}
              />
              {searchTerm && (
                <Button
                  variant="outline-secondary"
                  onClick={handleClear}
                  aria-label="Clear search"
                >
                  <FaTimes />
                </Button>
              )}
            </InputGroup>

            {isLoading ? (
              <div className="text-center my-4">
                <Spinner animation="border" role="status" variant="primary" />
                <p className="mt-2">Loading districts...</p>
              </div>
            ) : filteredSortedStates.length === 0 ? (
              <div className="text-center my-4">
                {searchTerm ? (
                  <p>No districts found matching "{searchTerm}"</p>
                ) : (
                  <p>No district data available</p>
                )}
              </div>
            ) : (
              filteredSortedStates.map((stateName) => (
                <div key={stateName} className="mb-3">
                  <h6 className="text-primary mb-2 border-bottom pb-1">
                    {stateName} ({filteredGrouped[stateName].length} districts)
                  </h6>
                  {filteredGrouped[stateName].map((district) => (
                    <Card key={district.id} className="mb-2">
                      <Card.Body className="d-flex justify-content-between align-items-center">
                        <span>{district.name || "Unnamed"}</span>
                        <div>
                          <Button
                            variant="link"
                            className="action-button edit-button p-0 me-2"
                            onClick={() =>
                              openModal("District", "edit", district)
                            }
                            disabled={isLoading}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="link"
                            className="action-button delete-button p-0"
                            onClick={() =>
                              openModal("District", "delete", district)
                            }
                            disabled={isLoading}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              ))
            )}
          </>
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
          <span className="current col-12">State and District Management</span>
        </nav>
        
        {/* State Container First */}
        <Row>
          <Col xs={12}>
            {renderStateCard(statesData.items, statesData.searchTerm, statesData.isLoading)}
          </Col>
        </Row>
        
        {/* District Container Second */}
        <Row>
          <Col xs={12}>
            {renderDistrictCard(district.items, district.searchTerm, district.isLoading)}
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
          states={modalState.type === "District" ? statesData.items : []}
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

export default StateAndDistrictManagement
