"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../../components/MainContent/MainContentPage"
import { Form, Button, Row, Col, Container, Card, Spinner, InputGroup } from "react-bootstrap"
import { FaEdit, FaTrash, FaTimes } from "react-icons/fa"
import { useAuthContext } from "../../../Context/AuthContext"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import * as XLSX from "xlsx"
import axios from "axios"
import { ENDPOINTS } from "../../../SpringBoot/config"
import "../Styles/style.css"

const BASE = `${ENDPOINTS.administration}/communityandcastesetup`
const ADMIN_DOC_ID = "admin_doc"

const getAuthHeaders = () => {
  const token = sessionStorage.getItem("token") || sessionStorage.getItem("adminToken")
  const headers = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`
  return headers
}

const pluralFor = (category) => {
  switch (category) {
    case "Caste":
      return "castes"
    case "Community":
      return "communities"
    case "Religion":
      return "religions"
    case "Nationality":
      return "nationalities"
    default:
      return category.toLowerCase() + "s"
  }
}

const GenericModal = ({ isOpen, onClose, onConfirm, title, fields, data }) => {
  const [formData, setFormData] = useState(() => {
    if (!data) return {}
    return { ...data }
  })

  useEffect(() => {
    if (isOpen) setFormData(data ? { ...data } : {})
  }, [isOpen, data])

  if (!isOpen) return null

  const [error, setError] = useState("")

  const handleSubmit = () => {
    const value = formData.name || formData[fields[0].toLowerCase()] || ""
    if (!value.trim()) {
      setError(`${fields[0]} name cannot be empty.`)
      return
    }
    if (!/^[A-Za-z0-9_\- .]+$/.test(value.trim())) {
      setError("Only letters, numbers, spaces, hyphens, underscores, and dots are allowed.")
      return
    }
    onConfirm({ name: value.trim() })
    setFormData({})
    setError("")
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
                value={formData.name || formData[field.toLowerCase()] || ""}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  setError("")
                }}
                className="custom-input"
                maxLength={64}
                autoFocus
              />
              {error && <Form.Text className="text-danger">{error}</Form.Text>}
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
          <Button className="modal-button delete" onClick={onConfirm}>Delete</Button>
          <Button className="modal-button cancel" onClick={onClose}>Cancel</Button>
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
          <p>Are you sure you want to edit this {category.toLowerCase()} entry? This may affect related data.</p>
          <p><strong>Current Name:</strong> {currentName}</p>
          <p><strong>New Name:</strong> {newName}</p>
        </div>
        <div className="modal-buttons">
          <Button className="modal-button confirm" onClick={onConfirm}>Confirm Edit</Button>
          <Button className="modal-button cancel" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

const CommunityAndCasteSetup = () => {
  const { user, currentAcademicYear, schoolId } = useAuthContext()
  const [caste, setCaste] = useState({ items: [], searchTerm: "", isLoading: false })
  const [community, setCommunity] = useState({ items: [], searchTerm: "", isLoading: false })
  const [religion, setReligion] = useState({ items: [], searchTerm: "", isLoading: false })
  const [nationality, setNationality] = useState({ items: [], searchTerm: "", isLoading: false })
  const [modalState, setModalState] = useState({ isOpen: false, type: "", action: "", data: null })
  const [confirmEditModalState, setConfirmEditModalState] = useState({
    isOpen: false, category: "", currentName: "", newName: "", id: "",
  })

  useEffect(() => {
    const resetState = () => {
      setCaste({ items: [], searchTerm: "", isLoading: false })
      setCommunity({ items: [], searchTerm: "", isLoading: false })
      setReligion({ items: [], searchTerm: "", isLoading: false })
      setNationality({ items: [], searchTerm: "", isLoading: false })
      setModalState({ isOpen: false, type: "", action: "", data: null })
      setConfirmEditModalState({ isOpen: false, category: "", currentName: "", newName: "", id: "" })
    }
    resetState()
    const checkAuthAndFetchData = async () => {
      if (schoolId && currentAcademicYear) {
        try {
          await ensureBackendTenant()
          await fetchItems("Caste")
          await fetchItems("Community")
          await fetchItems("Religion")
          await fetchItems("Nationality")
        } catch (error) {
          toast.error("An error occurred while loading data.")
        }
      } else if (!currentAcademicYear) {
        toast.error("Please select an academic year to view and manage entries.", { position: "top-right", autoClose: 3000 })
      } else {
        toast.error("Please log in to view and manage entries.", { position: "top-right", autoClose: 3000 })
      }
    }
    checkAuthAndFetchData()
    return () => resetState()
  }, [schoolId, currentAcademicYear])

  const ensureBackendTenant = async () => {
    try {
      const headers = getAuthHeaders()
      await axios.post(`${BASE}/ensure`, { schoolId, academicYear: currentAcademicYear, adminDocId: ADMIN_DOC_ID }, { headers })
    } catch (err) {}
  }

  const fetchItems = async (category) => {
    if (!schoolId || !currentAcademicYear) return
    const setLoadingFor = (val) => {
      switch (category) {
        case "Caste": setCaste((prev) => ({ ...prev, isLoading: val })); break
        case "Community": setCommunity((prev) => ({ ...prev, isLoading: val })); break
        case "Religion": setReligion((prev) => ({ ...prev, isLoading: val })); break
        case "Nationality": setNationality((prev) => ({ ...prev, isLoading: val })); break
      }
    }
    setLoadingFor(true)
    try {
      const headers = getAuthHeaders()
      const plural = pluralFor(category)
      const res = await axios.get(`${BASE}/${plural}`, { headers, params: { schoolId, academicYear: currentAcademicYear } })
      const itemsData = Array.isArray(res.data) ? res.data : []
      switch (category) {
        case "Caste": setCaste((prev) => ({ ...prev, items: itemsData, isLoading: false })); break
        case "Community": setCommunity((prev) => ({ ...prev, items: itemsData, isLoading: false })); break
        case "Religion": setReligion((prev) => ({ ...prev, items: itemsData, isLoading: false })); break
        case "Nationality": setNationality((prev) => ({ ...prev, items: itemsData, isLoading: false })); break
      }
    } catch (error) {
      switch (category) {
        case "Caste": setCaste((prev) => ({ ...prev, items: [], isLoading: false })); break
        case "Community": setCommunity((prev) => ({ ...prev, items: [], isLoading: false })); break
        case "Religion": setReligion((prev) => ({ ...prev, items: [], isLoading: false })); break
        case "Nationality": setNationality((prev) => ({ ...prev, items: [], isLoading: false })); break
      }
    }
  }

  const handleAdd = async (category, newItem) => {
    if (!schoolId || !currentAcademicYear) {
      toast.error("User not logged in or no academic year selected. Please try again.", { position: "top-right", autoClose: 3000 })
      return
    }
    const name = (newItem.name || "").trim()
    if (!name) {
      toast.error(`${category} name cannot be empty.`, { position: "top-right", autoClose: 3000 })
      return
    }
    if (!/^[A-Za-z0-9_\- .]+$/.test(name)) {
      toast.error("Only letters, numbers, spaces, hyphens, underscores, and dots are allowed.", { position: "top-right", autoClose: 3000 })
      return
    }
    if (name.length > 64) {
      toast.error("Name must be under 64 characters.", { position: "top-right", autoClose: 3000 })
      return
    }
    const isDuplicate = checkDuplicate(category, name)
    if (isDuplicate) {
      toast.error(`A ${category.toLowerCase()} with this name already exists. Please choose a different name.`, {
        position: "top-right", autoClose: 3000,
      })
      return
    }
    switch (category) {
      case "Caste": setCaste((prev) => ({ ...prev, isLoading: true })); break
      case "Community": setCommunity((prev) => ({ ...prev, isLoading: true })); break
      case "Religion": setReligion((prev) => ({ ...prev, isLoading: true })); break
      case "Nationality": setNationality((prev) => ({ ...prev, isLoading: true })); break
    }
    try {
      await ensureBackendTenant()
      const headers = getAuthHeaders()
      const plural = pluralFor(category)
      const payload = { name, type: category, schoolId, academicYear: currentAcademicYear, adminDocId: ADMIN_DOC_ID }
      const res = await axios.post(`${BASE}/${plural}`, payload, { headers })
      const created = res?.data || { id: Math.random().toString(36).slice(2), name, type: category }
      switch (category) {
        case "Caste": setCaste((prev) => ({ ...prev, items: [...prev.items, created], isLoading: false })); break
        case "Community": setCommunity((prev) => ({ ...prev, items: [...prev.items, created], isLoading: false })); break
        case "Religion": setReligion((prev) => ({ ...prev, items: [...prev.items, created], isLoading: false })); break
        case "Nationality": setNationality((prev) => ({ ...prev, items: [...prev.items, created], isLoading: false })); break
      }
      setModalState({ isOpen: false, type: "", action: "", data: null })
      toast.success(`${category} entry added successfully!`, { position: "top-right", autoClose: 1000 })
      await fetchItems(category)
    } catch (error) {
      switch (category) {
        case "Caste": setCaste((prev) => ({ ...prev, isLoading: false })); break
        case "Community": setCommunity((prev) => ({ ...prev, isLoading: false })); break
        case "Religion": setReligion((prev) => ({ ...prev, isLoading: false })); break
        case "Nationality": setNationality((prev) => ({ ...prev, isLoading: false })); break
      }
    }
  }

  const handleEdit = async (category, id, updatedItem) => {
    if (!schoolId || !currentAcademicYear) {
      toast.error("User not logged in or no academic year selected. Please try again.", { position: "top-right", autoClose: 3000 })
      return
    }
    const newName = (updatedItem.name || "").trim()
    if (!newName) {
      toast.error(`${category} name cannot be empty.`, { position: "top-right", autoClose: 3000 })
      return
    }
    if (!/^[A-Za-z0-9_\- .]+$/.test(newName)) {
      toast.error("Only letters, numbers, spaces, hyphens, underscores, and dots are allowed.", { position: "top-right", autoClose: 3000 })
      return
    }
    if (newName.length > 64) {
      toast.error("Name must be under 64 characters.", { position: "top-right", autoClose: 3000 })
      return
    }
    const isDuplicate = checkDuplicate(category, newName, id)
    if (isDuplicate) {
      toast.error(`A ${category.toLowerCase()} with this name already exists. Please choose a different name.`, {
        position: "top-right", autoClose: 3000,
      })
      return
    }
    setModalState({ isOpen: false, type: "", action: "", data: null })
    setConfirmEditModalState({
      isOpen: true,
      category,
      currentName: modalState.data ? modalState.data.name : "",
      newName,
      id,
    })
  }

  const confirmEdit = async () => {
    const { category, id, newName } = confirmEditModalState
    if (!schoolId || !currentAcademicYear) {
      toast.error("User not logged in or no academic year selected. Please try again.", { position: "top-right", autoClose: 3000 })
      return
    }
    switch (category) {
      case "Caste": setCaste((prev) => ({ ...prev, isLoading: true })); break
      case "Community": setCommunity((prev) => ({ ...prev, isLoading: true })); break
      case "Religion": setReligion((prev) => ({ ...prev, isLoading: true })); break
      case "Nationality": setNationality((prev) => ({ ...prev, isLoading: true })); break
    }
    try {
      const headers = getAuthHeaders()
      const plural = pluralFor(category)
      const payload = { name: newName, type: category, schoolId, academicYear: currentAcademicYear }
      await axios.put(`${BASE}/${plural}/${encodeURIComponent(id)}`, payload, { headers })
      switch (category) {
        case "Caste": setCaste((prev) => ({
          ...prev, items: prev.items.map((item) => (item.id === id ? { ...item, name: newName } : item)), isLoading: false
        })); break
        case "Community": setCommunity((prev) => ({
          ...prev, items: prev.items.map((item) => (item.id === id ? { ...item, name: newName } : item)), isLoading: false
        })); break
        case "Religion": setReligion((prev) => ({
          ...prev, items: prev.items.map((item) => (item.id === id ? { ...item, name: newName } : item)), isLoading: false
        })); break
        case "Nationality": setNationality((prev) => ({
          ...prev, items: prev.items.map((item) => (item.id === id ? { ...item, name: newName } : item)), isLoading: false
        })); break
      }
      setConfirmEditModalState({ isOpen: false, category: "", currentName: "", newName: "", id: "" })
      toast.success(`${category} entry updated successfully!`, { position: "top-right", autoClose: 1000 })
      await fetchItems(category)
    } catch (error) {
      switch (category) {
        case "Caste": setCaste((prev) => ({ ...prev, isLoading: false })); break
        case "Community": setCommunity((prev) => ({ ...prev, isLoading: false })); break
        case "Religion": setReligion((prev) => ({ ...prev, isLoading: false })); break
        case "Nationality": setNationality((prev) => ({ ...prev, isLoading: false })); break
      }
    }
  }

  const handleDelete = async (category, id) => {
    if (!schoolId || !currentAcademicYear) {
      toast.error("User not logged in or no academic year selected. Please try again.", { position: "top-right", autoClose: 3000 })
      return
    }
    switch (category) {
      case "Caste": setCaste((prev) => ({ ...prev, isLoading: true })); break
      case "Community": setCommunity((prev) => ({ ...prev, isLoading: true })); break
      case "Religion": setReligion((prev) => ({ ...prev, isLoading: true })); break
      case "Nationality": setNationality((prev) => ({ ...prev, isLoading: true })); break
    }
    try {
      const headers = getAuthHeaders()
      const plural = pluralFor(category)
      await axios.delete(`${BASE}/${plural}/${encodeURIComponent(id)}`, {
        headers, params: { schoolId, academicYear: currentAcademicYear },
      })
      switch (category) {
        case "Caste": setCaste((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id), isLoading: false })); break
        case "Community": setCommunity((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id), isLoading: false })); break
        case "Religion": setReligion((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id), isLoading: false })); break
        case "Nationality": setNationality((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id), isLoading: false })); break
      }
      setModalState({ isOpen: false, type: "", action: "", data: null })
      toast.success(`${category} entry deleted successfully!`, { position: "top-right", autoClose: 1000 })
      await fetchItems(category)
    } catch (error) {
      switch (category) {
        case "Caste": setCaste((prev) => ({ ...prev, isLoading: false })); break
        case "Community": setCommunity((prev) => ({ ...prev, isLoading: false })); break
        case "Religion": setReligion((prev) => ({ ...prev, isLoading: false })); break
        case "Nationality": setNationality((prev) => ({ ...prev, isLoading: false })); break
      }
    }
  }

  const handleImport = async (category, event) => {
    if (!schoolId || !currentAcademicYear) {
      toast.error("User not logged in or no academic year selected. Please try again.", { position: "top-right", autoClose: 3000 })
      return
    }
    const file = event.target.files[0]
    if (!file) return
    switch (category) {
      case "Caste": setCaste((prev) => ({ ...prev, isLoading: true })); break
      case "Community": setCommunity((prev) => ({ ...prev, isLoading: true })); break
      case "Religion": setReligion((prev) => ({ ...prev, isLoading: true })); break
      case "Nationality": setNationality((prev) => ({ ...prev, isLoading: true })); break
    }
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
          switch (category) {
            case "Caste": setCaste((prev) => ({ ...prev, isLoading: false })); break
            case "Community": setCommunity((prev) => ({ ...prev, isLoading: false })); break
            case "Religion": setReligion((prev) => ({ ...prev, isLoading: false })); break
            case "Nationality": setNationality((prev) => ({ ...prev, isLoading: false })); break
          }
          return
        }
        await ensureBackendTenant()
        const headers = getAuthHeaders()
        const plural = pluralFor(category)
        const newItems = []
        for (const row of jsonData) {
          const name = row.name || row[category] || row[category.toLowerCase()]
          if (name && String(name).trim()) {
            const trimmed = String(name).trim()
            if (!/^[A-Za-z0-9_\- .]+$/.test(trimmed) || trimmed.length > 64) continue
            const isDuplicate = checkDuplicate(category, trimmed)
            if (!isDuplicate) {
              try {
                const res = await axios.post(
                  `${BASE}/${plural}`,
                  { name: trimmed, type: category, schoolId, academicYear: currentAcademicYear },
                  { headers },
                )
                newItems.push(res?.data || { id: Math.random().toString(36).slice(2), name: trimmed, type: category })
              } catch (err) {}
            }
          }
        }
        switch (category) {
          case "Caste": setCaste((prev) => ({ ...prev, items: [...prev.items, ...newItems], isLoading: false })); break
          case "Community": setCommunity((prev) => ({ ...prev, items: [...prev.items, ...newItems], isLoading: false })); break
          case "Religion": setReligion((prev) => ({ ...prev, items: [...prev.items, ...newItems], isLoading: false })); break
          case "Nationality": setNationality((prev) => ({ ...prev, items: [...prev.items, ...newItems], isLoading: false })); break
        }
        toast.success(`${category} entries imported successfully!`, { position: "top-right", autoClose: 1000 })
        await fetchItems(category)
      } catch (err) {
        switch (category) {
          case "Caste": setCaste((prev) => ({ ...prev, isLoading: false })); break
          case "Community": setCommunity((prev) => ({ ...prev, isLoading: false })); break
          case "Religion": setReligion((prev) => ({ ...prev, isLoading: false })); break
          case "Nationality": setNationality((prev) => ({ ...prev, isLoading: false })); break
        }
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleExport = (category) => {
    if (!schoolId || !currentAcademicYear) {
      toast.error("User not logged in or no academic year selected. Please try again.", { position: "top-right", autoClose: 3000 })
      return
    }
    const items = { Caste: caste.items, Community: community.items, Religion: religion.items, Nationality: nationality.items }[category]
    if (!items || items.length === 0) {
      toast.error(`No ${category.toLowerCase()} data available to export.`)
      return
    }
    const exportData = items.map((item) => ({ [category]: item.name || "" }))
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, category)
    XLSX.writeFile(workbook, `${category}_Export_${schoolId || "unknown"}_${currentAcademicYear}.xlsx`)
    toast.success(`${category} entries exported successfully!`, { position: "top-right", autoClose: 1000 })
  }

  const openModal = (type, action, data = null) => {
    setModalState({ isOpen: true, type, action, data })
  }
  const closeModal = () => {
    setModalState({ isOpen: false, type: "", action: "", data: null })
  }
  const handleConfirm = (formData) => {
    const { type, action, data } = modalState
    if (action === "add") {
      handleAdd(type, formData)
    } else if (action === "edit") {
      handleEdit(type, data.id, formData)
    }
  }
  const handleConfirmDelete = () => {
    const { type, data } = modalState
    handleDelete(type, data.id)
  }
  const checkDuplicate = (category, name, id = null) => {
    let items
    switch (category) {
      case "Caste": items = caste.items; break
      case "Community": items = community.items; break
      case "Religion": items = religion.items; break
      case "Nationality": items = nationality.items; break
      default: items = []
    }
    return items.some((item) => item.id !== id && String((item.name || "")).toLowerCase() === String(name).toLowerCase())
  }
  const renderCard = (category, items, searchTerm, isLoading) => {
    const filteredItems = (items || []).filter((item) =>
      typeof item.name === "string" && item.name.toLowerCase().includes((searchTerm || "").toLowerCase())
    )
    return (
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center header">
          <h5 className="m-0">{category} Setup</h5>
          <div className="d-flex align-items-center gap-2">
            <input type="file" accept=".xlsx, .xls" onChange={(e) => handleImport(category, e)} style={{ display: "none" }} id={`import-file-${category}`} />
            <Button onClick={() => document.getElementById(`import-file-${category}`).click()} variant="primary" size="sm" disabled={!currentAcademicYear || isLoading}>Import</Button>
            <Button onClick={() => handleExport(category)} variant="primary" size="sm" disabled={!currentAcademicYear || items.length === 0 || isLoading}>Export</Button>
            <Button onClick={() => openModal(category, "add")} variant="primary" size="sm" disabled={!currentAcademicYear || isLoading}>+ Add {category}</Button>
          </div>
        </Card.Header>
        <Card.Body>
          {!currentAcademicYear ? (
            <div className="alert alert-warning">Please select an academic year to manage {category.toLowerCase()} entries.</div>
          ) : (
            <>
              <Form className="mb-3">
                <Form.Group className="d-flex align-items-center">
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder={`Search ${category}`}
                      value={searchTerm}
                      onChange={(e) => {
                        const v = e.target.value
                        switch (category) {
                          case "Caste": setCaste((prev) => ({ ...prev, searchTerm: v })); break
                          case "Community": setCommunity((prev) => ({ ...prev, searchTerm: v })); break
                          case "Religion": setReligion((prev) => ({ ...prev, searchTerm: v })); break
                          case "Nationality": setNationality((prev) => ({ ...prev, searchTerm: v })); break
                        }
                      }}
                      className="me-2"
                      disabled={isLoading}
                      maxLength={64}
                      autoComplete="off"
                    />
                    
                    {searchTerm && (
                      <Button
                        variant="outline-secondary"
                        onClick={() => {
                          switch (category) {
                            case "Caste": setCaste((prev) => ({ ...prev, searchTerm: "" })); break
                            case "Community": setCommunity((prev) => ({ ...prev, searchTerm: "" })); break
                            case "Religion": setReligion((prev) => ({ ...prev, searchTerm: "" })); break
                            case "Nationality": setNationality((prev) => ({ ...prev, searchTerm: "" })); break
                          }
                        }}
                        aria-label="Clear search"
                        tabIndex={0}
                      >
                        <FaTimes />
                      </Button>
                    )}
                  </InputGroup>
                </Form.Group>
              </Form>
              {isLoading && (
                <div className="text-center my-4">
                  <Spinner animation="border" role="status" variant="primary" className="loader">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <p className="mt-2">Loading {category.toLowerCase()} data...</p>
                </div>
              )}
              {!isLoading && (
                <>
                  {filteredItems.length === 0 && items.length === 0 ? (
                    <p className="text-center">No data available</p>
                  ) : filteredItems.length === 0 && (searchTerm || "") ? (
                    <p className="text-center">No matching {category.toLowerCase()} found</p>
                  ) : (
                    filteredItems.map((item) => (
                      <Card key={item.id} className="mb-2">
                        <Card.Body className="d-flex justify-content-between align-items-center">
                          <span>{item.name || "N/A"}</span>
                          <div>
                            <Button variant="link" className="action-button edit-button p-0 me-2" onClick={() => openModal(category, "edit", item)}><FaEdit/></Button>
                            <Button variant="link" className="action-button delete-button p-0" onClick={() => openModal(category, "delete", item)}><FaTrash/></Button>
                          </div>
                        </Card.Body>
                      </Card>
                    ))
                  )}
                </>
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
          <Link to="/home">Home</Link>
          <span className="separator">&gt;</span>
          <span>Administration</span>
          <span className="separator">&gt;</span>
          <span className="current col-12">Community and Caste Setup</span>
        </nav>
        <Row>
          <Col xs={12}>
            <div className="setup-container">
              <Row>
                <Col xs={12} md={6} className="mb-3">{renderCard("Caste", caste.items, caste.searchTerm, caste.isLoading)}</Col>
                <Col xs={12} md={6} className="mb-3">{renderCard("Community", community.items, community.searchTerm, community.isLoading)}</Col>
              </Row>
              <Row>
                <Col xs={12} md={6} className="mb-3">{renderCard("Religion", religion.items, religion.searchTerm, religion.isLoading)}</Col>
                <Col xs={12} md={6} className="mb-3">{renderCard("Nationality", nationality.items, nationality.searchTerm, nationality.isLoading)}</Col>
              </Row>
            </div>
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
        />
      )}
      {modalState.isOpen && modalState.action === "delete" && (
        <DeleteModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          onConfirm={handleConfirmDelete}
          title={modalState.type}
          itemName={modalState.data ? (modalState.data.name || "N/A") : "N/A"}
        />
      )}
      <ConfirmEditModal
        isOpen={confirmEditModalState.isOpen}
        onClose={() => setConfirmEditModalState({ isOpen: false, category: "", currentName: "", newName: "", id: "" })}
        onConfirm={confirmEdit}
        category={confirmEditModalState.category}
        currentName={confirmEditModalState.currentName}
        newName={confirmEditModalState.newName}
      />
      <ToastContainer />
    </MainContentPage>
  )
}

export default CommunityAndCasteSetup
