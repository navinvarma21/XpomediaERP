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

const BusFeeSetup = () => {
  const { user, currentAcademicYear } = useAuthContext()
  const [fees, setFees] = useState({ items: [], searchTerm: "" })
  const [places, setPlaces] = useState([])
  const [routes, setRoutes] = useState([])
  const [feeHeads, setFeeHeads] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [modalData, setModalData] = useState({
    action: "",
    data: null,
    boardingPoint: "",
    routeNumber: "",
    feeHeading: "",
    fee: ""
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteData, setDeleteData] = useState(null)

  const BUS_FEES_URL = `${ENDPOINTS.transport}/busFees`
  const PLACES_URL = `${ENDPOINTS.transport}/places`
  const ROUTES_URL = `${ENDPOINTS.transport}/routes`
  const FEE_HEADS_URL = `${ENDPOINTS.transport}/busVanFeeHeads`

  const fetchItems = async (category) => {
    if (!user?.uid || !currentAcademicYear) return

    let url = ""
    if (category === "BusFee") url = BUS_FEES_URL
    else if (category === "Place") url = PLACES_URL
    else if (category === "Route") url = ROUTES_URL
    else if (category === "FeeHead") url = FEE_HEADS_URL

    try {
      const res = await axios.get(url, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })

      const itemsData = res.data || []
      switch (category) {
        case "BusFee":
          setFees((prev) => ({ ...prev, items: itemsData }))
          break
        case "Place":
          setPlaces(itemsData)
          break
        case "Route":
          setRoutes(itemsData)
          break
        case "FeeHead":
          setFeeHeads(itemsData)
          break
      }
    } catch (err) {
      console.error(`Error fetching ${category}:`, err)
      toast.error(`Failed to fetch ${category} entries`)
    }
  }

  useEffect(() => {
    if (user?.uid && currentAcademicYear) {
      fetchItems("BusFee")
      fetchItems("Place")
      fetchItems("Route")
      fetchItems("FeeHead")
    }
  }, [user?.uid, currentAcademicYear])

  const handleAdd = async () => {
    const { boardingPoint, routeNumber, feeHeading, fee } = modalData
    if (!boardingPoint.trim() || !feeHeading.trim() || !fee) {
      toast.error("Boarding Point, Fee Heading, and Fee are required")
      return
    }

    try {
      await axios.post(BUS_FEES_URL, {
        boardingPoint,
        routeNumber,
        feeHeading,
        fee: parseFloat(fee),
        academicYear: currentAcademicYear
      }, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      toast.success("Bus fee added successfully")
      closeModal()
      fetchItems("BusFee")
    } catch (err) {
      console.error("Error adding bus fee:", err)
      toast.error("Failed to add bus fee")
    }
  }

  const handleEdit = async () => {
    const { data, boardingPoint, routeNumber, feeHeading, fee } = modalData
    if (!boardingPoint.trim() || !feeHeading.trim() || !fee) {
      toast.error("Boarding Point, Fee Heading, and Fee are required")
      return
    }

    try {
      await axios.put(`${BUS_FEES_URL}/${data.id}`, {
        boardingPoint,
        routeNumber,
        feeHeading,
        fee: parseFloat(fee),
        academicYear: currentAcademicYear
      }, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      toast.success("Bus fee updated successfully")
      closeModal()
      fetchItems("BusFee")
    } catch (err) {
      console.error("Error updating bus fee:", err)
      toast.error("Failed to update bus fee")
    }
  }

  const handleDelete = async () => {
    const { id } = deleteData
    try {
      await axios.delete(`${BUS_FEES_URL}/${id}`, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      toast.success("Bus fee deleted successfully")
      setShowDeleteModal(false)
      setDeleteData(null)
      fetchItems("BusFee")
    } catch (err) {
      console.error("Error deleting bus fee:", err)
      toast.error("Failed to delete bus fee")
    }
  }

  const openModal = (action, data = null) => {
    let initialData = { boardingPoint: "", routeNumber: "", feeHeading: "", fee: "" }
    if (action === "edit" && data) {
      initialData = {
        boardingPoint: data.boardingPoint || "",
        routeNumber: data.routeNumber || "",
        feeHeading: data.feeHeading || "",
        fee: data.fee || ""
      }
    }
    setModalData({ action, data, ...initialData })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setModalData({ action: "", data: null, boardingPoint: "", routeNumber: "", feeHeading: "", fee: "" })
  }

  const handleConfirm = () => {
    if (modalData.action === "add") {
      handleAdd()
    } else if (modalData.action === "edit") {
      handleEdit()
    }
  }

  const openDeleteModal = (item) => {
    setDeleteData({ id: item.id, name: `${item.boardingPoint} - ${item.routeNumber}` || "N/A" })
    setShowDeleteModal(true)
  }

  const filteredFees = fees.items.filter(
    (fee) =>
      fee.boardingPoint.toLowerCase().includes(fees.searchTerm.toLowerCase()) ||
      fee.routeNumber?.toLowerCase().includes(fees.searchTerm.toLowerCase())
  )

  const calculateTotalFee = () => {
    return filteredFees.reduce((total, fee) => total + Number.parseFloat(fee.fee || 0), 0).toFixed(2)
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0 px-lg-0">
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link>
          <span className="separator">&gt;</span>
          <span>Transport</span>
          <span className="separator">&gt;</span>
          <span className="current col-12">Bus Fee Setup</span>
        </nav>
        <Row>
          <Col xs={12}>
            <div className="setup-container">
              <Card className="mb-4">
                <Card.Header
                  className="d-flex justify-content-between align-items-center"
                  style={{ backgroundColor: "#0B3D7B", color: "white" }}
                >
                  <h5 className="m-0">Bus Fee Setup</h5>
                  <Button onClick={() => openModal("add")} variant="light" size="sm">
                    + Add Fee
                  </Button>
                </Card.Header>
                <Card.Body>
                  <Form className="mb-3">
                    <Form.Group className="d-flex">
                      <Form.Control
                        type="text"
                        placeholder="Search Boarding Point or Route Number"
                        value={fees.searchTerm}
                        onChange={(e) => setFees((prev) => ({ ...prev, searchTerm: e.target.value }))}
                        className="me-2"
                      />
                      <Button variant="outline-secondary">
                        <FaSearch />
                      </Button>
                    </Form.Group>
                  </Form>
                  {filteredFees.length === 0 ? (
                    <p className="text-center text-muted">No data found</p>
                  ) : (
                    <>
                      {filteredFees.map((fee) => (
                        <Card key={fee.id} className="mb-2">
                          <Card.Body className="d-flex justify-content-between align-items-center">
                            <div>
                              <strong>{fee.boardingPoint}</strong>
                              <br />
                              <small>
                                Route: {fee.routeNumber || "N/A"} | Fee Heading: {fee.feeHeading || "N/A"} | Fee: {fee.fee || "N/A"}
                              </small>
                            </div>
                            <div>
                              <Button variant="link" className="p-0 me-2" onClick={() => openModal("edit", fee)}>
                                <FaEdit color="#0B3D7B" />
                              </Button>
                              <Button variant="link" className="p-0" onClick={() => openDeleteModal(fee)}>
                                <FaTrash color="#dc3545" />
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                      <Card className="mt-3">
                        <Card.Body className="text-end fw-bold">
                          Total Fee: {calculateTotalFee()}
                        </Card.Body>
                      </Card>
                    </>
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
            {modalData.action === "add" ? "Add" : "Edit"} Bus Fee
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Boarding Point</Form.Label>
            <Form.Select
              value={modalData.boardingPoint}
              onChange={(e) => setModalData({ ...modalData, boardingPoint: e.target.value })}
            >
              <option value="">Select Boarding Point</option>
              {places.map((place) => (
                <option key={place.id} value={place.placeName}>
                  {place.placeName}
                </option>
              ))}
            </Form.Select>
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
            <Form.Label>Fee Heading</Form.Label>
            <Form.Select
              value={modalData.feeHeading}
              onChange={(e) => setModalData({ ...modalData, feeHeading: e.target.value })}
            >
              <option value="">Select Fee Heading</option>
              {feeHeads.map((feeHead) => (
                <option key={feeHead.id} value={feeHead.feeHead}>
                  {feeHead.feeHead}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Fee Amount</Form.Label>
            <Form.Control
              type="number"
              placeholder="Enter fee amount"
              value={modalData.fee}
              onChange={(e) => setModalData({ ...modalData, fee: e.target.value })}
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

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Bus Fee</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p>Are you sure you want to delete this bus fee?</p>
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

export default BusFeeSetup