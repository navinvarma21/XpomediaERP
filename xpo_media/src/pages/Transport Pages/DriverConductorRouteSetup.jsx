"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Form, Button, Row, Col, Container, Card, Modal } from "react-bootstrap"
import { FaEdit, FaTrash, FaSearch } from "react-icons/fa"
import axios from "axios"
import { useAuthContext } from "../../Context/AuthContext"
import { ToastContainer, toast } from "react-toastify"
import { ENDPOINTS } from "../../SpringBoot/config"
import "react-toastify/dist/ReactToastify.css"

const DriverConductorRouteSetup = () => {
  const { user, currentAcademicYear } = useAuthContext()

  // State for each category
  const [driver, setDriver] = useState({ items: [], searchTerm: "" })
  const [conductor, setConductor] = useState({ items: [], searchTerm: "" })
  const [route, setRoute] = useState({ items: [], searchTerm: "" })

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalData, setModalData] = useState({
    type: "",
    action: "",
    data: null,
    value: ""
  })

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteData, setDeleteData] = useState(null)

  // Build base URLs dynamically
  const DRIVERS_URL = `${ENDPOINTS.transport}/drivers`
  const CONDUCTORS_URL = `${ENDPOINTS.transport}/conductors`
  const ROUTES_URL = `${ENDPOINTS.transport}/routes`

  // ---------------- Fetch Items ----------------
  const fetchItems = async (category) => {
    if (!user?.uid || !currentAcademicYear) return
    
    let url = ""
    if (category === "Driver") url = DRIVERS_URL
    else if (category === "Conductor") url = CONDUCTORS_URL
    else if (category === "Route") url = ROUTES_URL

    try {
      const res = await axios.get(url, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      
      const itemsData = res.data || []
      
      switch (category) {
        case "Driver":
          setDriver((prev) => ({ ...prev, items: itemsData }))
          break
        case "Conductor":
          setConductor((prev) => ({ ...prev, items: itemsData }))
          break
        case "Route":
          setRoute((prev) => ({ ...prev, items: itemsData }))
          break
      }
    } catch (err) {
      console.error(`Error fetching ${category}:`, err)
      toast.error(`Failed to fetch ${category} entries`)
    }
  }

  useEffect(() => {
    if (user?.uid && currentAcademicYear) {
      fetchItems("Driver")
      fetchItems("Conductor")
      fetchItems("Route")
    }
  }, [user?.uid, currentAcademicYear])

  // ---------------- Handle Add ----------------
  const handleAdd = async () => {
    const { type, value } = modalData
    if (!value.trim()) {
      toast.error(`${type} name is required`)
      return
    }

    let url = ""
    let payload = { academicYear: currentAcademicYear }
    
    if (type === "Driver") {
      url = DRIVERS_URL
      payload.driver = value
    } else if (type === "Conductor") {
      url = CONDUCTORS_URL
      payload.conductor = value
    } else if (type === "Route") {
      url = ROUTES_URL
      payload.route = value
    }

    try {
      await axios.post(url, payload, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      toast.success(`${type} entry added successfully`)
      closeModal()
      fetchItems(type)
    } catch (err) {
      console.error(`Error adding ${type}:`, err)
      toast.error(`Failed to add ${type} entry`)
    }
  }

  // ---------------- Handle Edit ----------------
  const handleEdit = async () => {
    const { type, data, value } = modalData
    if (!value.trim()) {
      toast.error(`${type} name is required`)
      return
    }

    let url = ""
    let payload = { academicYear: currentAcademicYear }
    
    if (type === "Driver") {
      url = `${DRIVERS_URL}/${data.id}`
      payload.driver = value
    } else if (type === "Conductor") {
      url = `${CONDUCTORS_URL}/${data.id}`
      payload.conductor = value
    } else if (type === "Route") {
      url = `${ROUTES_URL}/${data.id}`
      payload.route = value
    }

    try {
      await axios.put(url, payload, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      toast.success(`${type} entry updated successfully`)
      closeModal()
      fetchItems(type)
    } catch (err) {
      console.error(`Error updating ${type}:`, err)
      toast.error(`Failed to update ${type} entry`)
    }
  }

  // ---------------- Handle Delete ----------------
  const handleDelete = async () => {
    const { type, id } = deleteData
    
    let url = ""
    if (type === "Driver") url = `${DRIVERS_URL}/${id}`
    else if (type === "Conductor") url = `${CONDUCTORS_URL}/${id}`
    else if (type === "Route") url = `${ROUTES_URL}/${id}`

    try {
      await axios.delete(url, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      toast.success(`${type} entry deleted successfully`)
      setShowDeleteModal(false)
      setDeleteData(null)
      fetchItems(type)
    } catch (err) {
      console.error(`Error deleting ${type}:`, err)
      toast.error(`Failed to delete ${type} entry`)
    }
  }

  // ---------------- Modal Handlers ----------------
  const openModal = (type, action, data = null) => {
    let initialValue = ""
    if (action === "edit" && data) {
      if (type === "Driver") initialValue = data.driver
      else if (type === "Conductor") initialValue = data.conductor
      else if (type === "Route") initialValue = data.route
    }
    setModalData({ type, action, data, value: initialValue })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setModalData({ type: "", action: "", data: null, value: "" })
  }

  const handleConfirm = () => {
    if (modalData.action === "add") {
      handleAdd()
    } else if (modalData.action === "edit") {
      handleEdit()
    }
  }

  const openDeleteModal = (type, item) => {
    setDeleteData({ type, id: item.id, name: item[type.toLowerCase()] || "N/A" })
    setShowDeleteModal(true)
  }

  // ---------------- Render Card ----------------
  const renderCard = (category, items, searchTerm) => {
    const filteredItems = items.filter((item) => {
      const value = item[category.toLowerCase()] || ""
      return value.toLowerCase().includes(searchTerm.toLowerCase())
    })

    return (
      <Card className="mb-4">
        <Card.Header
          className="d-flex justify-content-between align-items-center"
          style={{ backgroundColor: "#0B3D7B", color: "white" }}
        >
          <h5 className="m-0">{category} Setup</h5>
          <Button onClick={() => openModal(category, "add")} variant="light" size="sm">
            + Add {category}
          </Button>
        </Card.Header>
        <Card.Body>
          <Form className="mb-3">
            <Form.Group className="d-flex">
              <Form.Control
                type="text"
                placeholder={`Search ${category}`}
                value={searchTerm}
                onChange={(e) => {
                  switch (category) {
                    case "Driver":
                      setDriver((prev) => ({ ...prev, searchTerm: e.target.value }))
                      break
                    case "Conductor":
                      setConductor((prev) => ({ ...prev, searchTerm: e.target.value }))
                      break
                    case "Route":
                      setRoute((prev) => ({ ...prev, searchTerm: e.target.value }))
                      break
                  }
                }}
                className="me-2"
              />
              <Button variant="outline-secondary">
                <FaSearch />
              </Button>
            </Form.Group>
          </Form>
          {filteredItems.length === 0 ? (
            <p className="text-center text-muted">No data found</p>
          ) : (
            filteredItems.map((item) => (
              <Card key={item.id} className="mb-2">
                <Card.Body className="d-flex justify-content-between align-items-center">
                  <span>{item[category.toLowerCase()] || "N/A"}</span>
                  <div>
                    <Button variant="link" className="p-0 me-2" onClick={() => openModal(category, "edit", item)}>
                      <FaEdit color="#0B3D7B" />
                    </Button>
                    <Button variant="link" className="p-0" onClick={() => openDeleteModal(category, item)}>
                      <FaTrash color="#dc3545" />
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
        {/* Breadcrumb Navigation */}
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link>
          <span className="separator">&gt;</span>
          <span>Transport</span>
          <span className="separator">&gt;</span>
          <span className="current col-12">Driver, Conductor, and Route Management</span>
        </nav>
        <Row>
          <Col xs={12}>
            <div className="setup-container">
              <Row>
                <Col xs={12} md={4} className="mb-3">
                  {renderCard("Driver", driver.items, driver.searchTerm)}
                </Col>
                <Col xs={12} md={4} className="mb-3">
                  {renderCard("Conductor", conductor.items, conductor.searchTerm)}
                </Col>
                <Col xs={12} md={4} className="mb-3">
                  {renderCard("Route", route.items, route.searchTerm)}
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={closeModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalData.action === "add" ? "Add" : "Edit"} {modalData.type}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Enter {modalData.type}</Form.Label>
            <Form.Control
              type="text"
              placeholder={`Enter ${modalData.type.toLowerCase()}`}
              value={modalData.value}
              onChange={(e) => setModalData({ ...modalData, value: e.target.value })}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} style={{ backgroundColor: "#0B3D7B" }}>
            {modalData.action === "add" ? "Add" : "Update"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete {deleteData?.type}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p>Are you sure you want to delete this entry?</p>
          <p className="fw-bold">{deleteData?.name}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer />

      <style>
        {`
          .setup-container {
            background-color: #fff;
          }

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
        `}
      </style>
    </MainContentPage>
  )
}

export default DriverConductorRouteSetup