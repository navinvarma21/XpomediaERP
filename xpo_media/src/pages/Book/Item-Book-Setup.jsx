"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Form, Button, Row, Col, Container, Table, Modal } from "react-bootstrap"
import { FaEdit, FaTrash, FaEye } from "react-icons/fa"
import axios from "axios"
import { useAuthContext } from "../../Context/AuthContext"
import { ToastContainer, toast } from "react-toastify"
import { ENDPOINTS } from "../../SpringBoot/config"
import "react-toastify/dist/ReactToastify.css"

const ItemBookMaster = () => {
  const { user, currentAcademicYear } = useAuthContext()
  const [items, setItems] = useState({ items: [], searchTerm: "" })
  
  // State for Dropdown Data
  const [availableUnits, setAvailableUnits] = useState([])
  const [availableGroups, setAvailableGroups] = useState([])

  const [nextItemCode, setNextItemCode] = useState("ITEM-1")
  const [showModal, setShowModal] = useState(false)
  const [modalData, setModalData] = useState({
    action: "",
    data: null,
    itemCode: "",
    itemName: "",
    purchaseRate: "",
    group: "", // This will hold the group name
    unit: "",  // This will hold the unit name
    gstType: ""
  })
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showConfirmEditModal, setShowConfirmEditModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  
  const ITEMS_URL = `${ENDPOINTS.store}/items`
  const UNITS_URL = `${ENDPOINTS.store}/units`
  const GROUPS_URL = `${ENDPOINTS.store}/groups`

  const fetchDependencies = async () => {
    if (!user?.uid || !currentAcademicYear) return
    try {
      const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
      const params = { schoolId: user.uid, year: currentAcademicYear }

      // Fetch Items
      const itemsRes = await axios.get(ITEMS_URL, { params, headers })
      const itemsData = itemsRes.data || []
      setItems((prev) => ({ ...prev, items: itemsData }))
      generateNextItemCode(itemsData)

      // Fetch Units
      const unitsRes = await axios.get(UNITS_URL, { params, headers })
      setAvailableUnits(unitsRes.data || [])

      // Fetch Groups
      const groupsRes = await axios.get(GROUPS_URL, { params, headers })
      setAvailableGroups(groupsRes.data || [])

    } catch (err) {
      console.error("Error fetching data:", err)
      toast.error("Failed to load items or settings")
    }
  }

  const generateNextItemCode = (itemsData) => {
    if (!itemsData || itemsData.length === 0) {
      setNextItemCode("ITEM-1")
      return
    }
    const itemNumbers = itemsData.map((item) => {
      const match = item.itemCode.match(/ITEM-(\d+)/)
      return match ? Number.parseInt(match[1], 10) : 0
    })
    const nextNumber = Math.max(...itemNumbers) + 1
    setNextItemCode(`ITEM-${nextNumber}`)
  }

  useEffect(() => {
    fetchDependencies()
  }, [user?.uid, currentAcademicYear])

  const handleAdd = async () => {
    const { itemCode, itemName, purchaseRate, group, unit, gstType } = modalData
    if (!itemName.trim()) {
      toast.error("Item Name is required")
      return
    }

    try {
      await axios.post(ITEMS_URL, {
        itemCode,
        itemName,
        purchaseRate,
        group,
        unit,
        gstType,
        academicYear: currentAcademicYear
      }, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      toast.success("Item added successfully")
      setShowModal(false)
      fetchDependencies()
    } catch (err) {
      console.error("Error adding item:", err)
      toast.error("Failed to add item")
    }
  }

  const handleEdit = async () => {
    const { data, itemName, purchaseRate, group, unit, gstType } = modalData
    if (!itemName.trim()) {
      toast.error("Item Name is required")
      return
    }

    setShowModal(false)
    setShowConfirmEditModal(true)
    setSelectedItem({
      ...data,
      itemName,
      purchaseRate,
      group,
      unit,
      gstType
    })
  }

  const handleConfirmEdit = async () => {
    try {
      await axios.put(`${ITEMS_URL}/${selectedItem.id}`, {
        itemCode: selectedItem.itemCode,
        itemName: selectedItem.itemName,
        purchaseRate: selectedItem.purchaseRate,
        group: selectedItem.group,
        unit: selectedItem.unit,
        gstType: selectedItem.gstType,
        academicYear: currentAcademicYear
      }, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      toast.success("Item updated successfully")
      setShowConfirmEditModal(false)
      setSelectedItem(null)
      fetchDependencies()
    } catch (err) {
      console.error("Error updating item:", err)
      toast.error("Failed to update item")
    }
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`${ITEMS_URL}/${selectedItem.id}`, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      toast.success("Item deleted successfully")
      setShowDeleteModal(false)
      setSelectedItem(null)
      fetchDependencies()
    } catch (err) {
      console.error("Error deleting item:", err)
      toast.error("Failed to delete item")
    }
  }

  const openModal = (action, data = null) => {
    let initialData = {
      itemCode: nextItemCode,
      itemName: "",
      purchaseRate: "",
      group: "",
      unit: "",
      gstType: ""
    }
    if (action === "edit" && data) {
      initialData = {
        itemCode: data.itemCode || "",
        itemName: data.itemName || "",
        purchaseRate: data.purchaseRate || "",
        group: data.group || "",
        unit: data.unit || "",
        gstType: data.gstType || ""
      }
    }
    setModalData({ action, data, ...initialData })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setModalData({
      action: "",
      data: null,
      itemCode: "",
      itemName: "",
      purchaseRate: "",
      group: "",
      unit: "",
      gstType: ""
    })
  }

  const filteredItems = items.items.filter(
    (item) =>
      item.itemCode.toLowerCase().includes(items.searchTerm.toLowerCase()) ||
      item.itemName.toLowerCase().includes(items.searchTerm.toLowerCase())
  )

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link> <span className="separator">&gt;</span> <span>Store</span> <span className="separator">&gt;</span> <span className="current">Item / Book Master</span>
        </nav>
        <div className="item-book-container">
          <div className="form-card mt-3">
            <div className="header p-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: "#0B3D7B", color: "white" }}>
              <h2 className="m-0">Item / Book Master</h2>
              <Button onClick={() => openModal("add")} className="btn btn-light text-dark">+ Add Item</Button>
            </div>
            <div className="content-wrapper p-4">
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Search by Item Code or Name"
                  value={items.searchTerm}
                  onChange={(e) => setItems((prev) => ({ ...prev, searchTerm: e.target.value }))}
                  className="custom-search"
                />
              </Form.Group>
              <div className="table-responsive">
                <Table bordered hover>
                  <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                    <tr>
                      <th>Item Code</th><th>Item Name</th><th>Purchase Rate</th><th>Group</th><th>Unit</th><th>GST Type</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.length === 0 ? (
                      <tr><td colSpan="7" className="text-center text-muted">No items found</td></tr>
                    ) : (
                      filteredItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.itemCode}</td>
                          <td>{item.itemName}</td>
                          <td>{item.purchaseRate || "N/A"}</td>
                          <td>{item.group || "N/A"}</td>
                          <td>{item.unit || "N/A"}</td>
                          <td>{item.gstType || "N/A"}</td>
                          <td>
                            <Button variant="link" className="text-success me-2" onClick={() => setShowViewModal(true) || setSelectedItem(item)}><FaEye /></Button>
                            <Button variant="link" className="text-primary me-2" onClick={() => openModal("edit", item)}><FaEdit /></Button>
                            <Button variant="link" className="text-danger" onClick={() => setShowDeleteModal(true) || setSelectedItem(item)}><FaTrash /></Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={closeModal} centered>
        <Modal.Header closeButton><Modal.Title>{modalData.action === "add" ? "Add" : "Edit"} Item / Book</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Item Code</Form.Label>
            <Form.Control type="text" value={modalData.itemCode} readOnly className="bg-light" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Item Name</Form.Label>
            <Form.Control type="text" placeholder="Enter Item Name" value={modalData.itemName} onChange={(e) => setModalData({ ...modalData, itemName: e.target.value })} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Purchase Rate</Form.Label>
            <Form.Control type="number" placeholder="Enter Purchase Rate" value={modalData.purchaseRate} onChange={(e) => setModalData({ ...modalData, purchaseRate: e.target.value })} />
          </Form.Group>
          
          {/* Group Dropdown */}
          <Form.Group className="mb-3">
            <Form.Label>Group</Form.Label>
            <Form.Select value={modalData.group} onChange={(e) => setModalData({ ...modalData, group: e.target.value })}>
              <option value="">Select Group</option>
              {availableGroups.map(g => <option key={g.id} value={g.groupName}>{g.groupName}</option>)}
            </Form.Select>
          </Form.Group>

          {/* Unit Dropdown */}
          <Form.Group className="mb-3">
            <Form.Label>Unit</Form.Label>
            <Form.Select value={modalData.unit} onChange={(e) => setModalData({ ...modalData, unit: e.target.value })}>
              <option value="">Select Unit</option>
              {availableUnits.map(u => <option key={u.id} value={u.unitName}>{u.unitName}</option>)}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>GST Type</Form.Label>
            <Form.Control type="text" placeholder="Enter GST Type" value={modalData.gstType} onChange={(e) => setModalData({ ...modalData, gstType: e.target.value })} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>Cancel</Button>
          <Button variant="primary" onClick={modalData.action === "add" ? handleAdd : handleEdit} style={{ backgroundColor: "#0B3D7B" }}>{modalData.action === "add" ? "Add" : "Update"}</Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Delete Item</Modal.Title></Modal.Header>
        <Modal.Body className="text-center">Are you sure you want to delete <strong>{selectedItem?.itemName}</strong>?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </Modal.Footer>
      </Modal>

      {/* Confirm Edit Modal */}
      <Modal show={showConfirmEditModal} onHide={() => setShowConfirmEditModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Confirm Edit</Modal.Title></Modal.Header>
        <Modal.Body>
           <p>Are you sure you want to update <strong>{selectedItem?.itemCode}</strong>?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmEditModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirmEdit} style={{ backgroundColor: "#0B3D7B" }}>Confirm</Button>
        </Modal.Footer>
      </Modal>
      
      <ToastContainer />
      <style>{`
        .custom-breadcrumb a { color: #0B3D7B; text-decoration: none; }
        .custom-breadcrumb .separator { margin: 0 0.5rem; color: #6c757d; }
        .form-card { background: #fff; border: 1px solid #dee2e6; border-radius: 0.25rem; }
      `}</style>
    </MainContentPage>
  )
}

export default ItemBookMaster