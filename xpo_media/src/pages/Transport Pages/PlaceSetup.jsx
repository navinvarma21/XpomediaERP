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

const PlaceSetup = () => {
  const { user, currentAcademicYear } = useAuthContext()
  const [places, setPlaces] = useState({ items: [], searchTerm: "" })
  const [drivers, setDrivers] = useState([])
  const [conductors, setConductors] = useState([])
  const [routes, setRoutes] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [modalData, setModalData] = useState({
    action: "",
    data: null,
    placeName: "",
    routeNumber: "",
    driverName: "",
    conductorName: ""
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteData, setDeleteData] = useState(null)

  const PLACES_URL = `${ENDPOINTS.transport}/places`
  const DRIVERS_URL = `${ENDPOINTS.transport}/drivers`
  const CONDUCTORS_URL = `${ENDPOINTS.transport}/conductors`
  const ROUTES_URL = `${ENDPOINTS.transport}/routes`

  const fetchItems = async (category) => {
    if (!user?.uid || !currentAcademicYear) return

    let url = ""
    if (category === "Place") url = PLACES_URL
    else if (category === "Driver") url = DRIVERS_URL
    else if (category === "Conductor") url = CONDUCTORS_URL
    else if (category === "Route") url = ROUTES_URL

    try {
      const res = await axios.get(url, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })

      const itemsData = res.data || []
      switch (category) {
        case "Place":
          setPlaces((prev) => ({ ...prev, items: itemsData }))
          break
        case "Driver":
          setDrivers(itemsData)
          break
        case "Conductor":
          setConductors(itemsData)
          break
        case "Route":
          setRoutes(itemsData)
          break
      }
    } catch (err) {
      console.error(`Error fetching ${category}:`, err)
      toast.error(`Failed to fetch ${category} entries`)
    }
  }

  useEffect(() => {
    if (user?.uid && currentAcademicYear) {
      fetchItems("Place")
      fetchItems("Driver")
      fetchItems("Conductor")
      fetchItems("Route")
    }
  }, [user?.uid, currentAcademicYear])

  const handleAdd = async () => {
    const { placeName, routeNumber, driverName, conductorName } = modalData
    if (!placeName.trim()) {
      toast.error("Place name is required")
      return
    }

    try {
      await axios.post(PLACES_URL, {
        placeName,
        routeNumber,
        driverName,
        conductorName,
        academicYear: currentAcademicYear
      }, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      toast.success("Place added successfully")
      closeModal()
      fetchItems("Place")
    } catch (err) {
      console.error("Error adding place:", err)
      toast.error("Failed to add place")
    }
  }

  const handleEdit = async () => {
    const { data, placeName, routeNumber, driverName, conductorName } = modalData
    if (!placeName.trim()) {
      toast.error("Place name is required")
      return
    }

    try {
      await axios.put(`${PLACES_URL}/${data.id}`, {
        placeName,
        routeNumber,
        driverName,
        conductorName,
        academicYear: currentAcademicYear
      }, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      toast.success("Place updated successfully")
      closeModal()
      fetchItems("Place")
    } catch (err) {
      console.error("Error updating place:", err)
      toast.error("Failed to update place")
    }
  }

  const handleDelete = async () => {
    const { id } = deleteData
    try {
      await axios.delete(`${PLACES_URL}/${id}`, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      toast.success("Place deleted successfully")
      setShowDeleteModal(false)
      setDeleteData(null)
      fetchItems("Place")
    } catch (err) {
      console.error("Error deleting place:", err)
      toast.error("Failed to delete place")
    }
  }

  const openModal = (action, data = null) => {
    let initialData = { placeName: "", routeNumber: "", driverName: "", conductorName: "" }
    if (action === "edit" && data) {
      initialData = {
        placeName: data.placeName || "",
        routeNumber: data.routeNumber || "",
        driverName: data.driverName || "",
        conductorName: data.conductorName || ""
      }
    }
    setModalData({ action, data, ...initialData })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setModalData({ action: "", data: null, placeName: "", routeNumber: "", driverName: "", conductorName: "" })
  }

  const handleConfirm = () => {
    if (modalData.action === "add") {
      handleAdd()
    } else if (modalData.action === "edit") {
      handleEdit()
    }
  }

  const openDeleteModal = (item) => {
    setDeleteData({ id: item.id, name: item.placeName || "N/A" })
    setShowDeleteModal(true)
  }

  const filteredPlaces = places.items.filter(
    (place) =>
      place.placeName.toLowerCase().includes(places.searchTerm.toLowerCase()) ||
      place.routeNumber?.toLowerCase().includes(places.searchTerm.toLowerCase())
  )

  return (
    <MainContentPage>
      <Container fluid className="px-0 px-lg-0">
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link>
          <span className="separator">&gt;</span>
          <span>Transport</span>
          <span className="separator">&gt;</span>
          <span className="current col-12">Place Setup</span>
        </nav>
        <Row>
          <Col xs={12}>
            <div className="setup-container">
              <Card className="mb-4">
                <Card.Header
                  className="d-flex justify-content-between align-items-center"
                  style={{ backgroundColor: "#0B3D7B", color: "white" }}
                >
                  <h5 className="m-0">Place Setup</h5>
                  <Button onClick={() => openModal("add")} variant="light" size="sm">
                    + Add Place
                  </Button>
                </Card.Header>
                <Card.Body>
                  <Form className="mb-3">
                    <Form.Group className="d-flex">
                      <Form.Control
                        type="text"
                        placeholder="Search Place or Route Number"
                        value={places.searchTerm}
                        onChange={(e) => setPlaces((prev) => ({ ...prev, searchTerm: e.target.value }))}
                        className="me-2"
                      />
                      <Button variant="outline-secondary">
                        <FaSearch />
                      </Button>
                    </Form.Group>
                  </Form>
                  {filteredPlaces.length === 0 ? (
                    <p className="text-center text-muted">No data found</p>
                  ) : (
                    filteredPlaces.map((place) => (
                      <Card key={place.id} className="mb-2">
                        <Card.Body className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{place.placeName}</strong>
                            <br />
                            <small>
                              Route: {place.routeNumber || "N/A"} | Driver: {place.driverName || "N/A"} | Conductor: {place.conductorName || "N/A"}
                            </small>
                          </div>
                          <div>
                            <Button variant="link" className="p-0 me-2" onClick={() => openModal("edit", place)}>
                              <FaEdit color="#0B3D7B" />
                            </Button>
                            <Button variant="link" className="p-0" onClick={() => openDeleteModal(place)}>
                              <FaTrash color="#dc3545" />
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    ))
                  )}
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>

      <Modal show={showModal} onHide={closeModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalData.action === "add" ? "Add" : "Edit"} Place
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Place Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter place name"
              value={modalData.placeName}
              onChange={(e) => setModalData({ ...modalData, placeName: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Route Number</Form.Label>
            <Form.Select
              value={modalData.routeNumber}
              onChange={(e) => setModalData({ ...modalData, routeNumber: e.target.value })}
            >
              <option value="">Select Route</option>
              {routes.map((route) => (
                <option key={route.id} value={route.route}>
                  {route.route}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Driver Name</Form.Label>
            <Form.Select
              value={modalData.driverName}
              onChange={(e) => setModalData({ ...modalData, driverName: e.target.value })}
            >
              <option value="">Select Driver</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.driver}>
                  {driver.driver}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Conductor Name</Form.Label>
            <Form.Select
              value={modalData.conductorName}
              onChange={(e) => setModalData({ ...modalData, conductorName: e.target.value })}
            >
              <option value="">Select Conductor</option>
              {conductors.map((conductor) => (
                <option key={conductor.id} value={conductor.conductor}>
                  {conductor.conductor}
                </option>
              ))}
            </Form.Select>
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

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Place</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p>Are you sure you want to delete this place?</p>
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

export default PlaceSetup