"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Form, Button, Container, Table, Modal } from "react-bootstrap"
import { FaTrash } from "react-icons/fa"
import axios from "axios"
import { useAuthContext } from "../../Context/AuthContext"
import { ToastContainer, toast } from "react-toastify"
import { ENDPOINTS } from "../../SpringBoot/config"
import "react-toastify/dist/ReactToastify.css"

const UnitsSetup = () => {
  const { user, currentAcademicYear } = useAuthContext()
  const [units, setUnits] = useState([])
  const [unitName, setUnitName] = useState("")
  const [showModal, setShowModal] = useState(false)
  
  // Define endpoint directly since it might not be in config yet
  const UNITS_URL = `${ENDPOINTS.store}/units`

  const fetchUnits = async () => {
    if (!user?.uid || !currentAcademicYear) return
    try {
      const res = await axios.get(UNITS_URL, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      setUnits(res.data || [])
    } catch (err) {
      console.error("Error fetching units:", err)
      toast.error("Failed to fetch units")
    }
  }

  useEffect(() => {
    fetchUnits()
  }, [user?.uid, currentAcademicYear])

  const handleAdd = async () => {
    if (!unitName.trim()) {
      toast.error("Unit Name is required")
      return
    }
    try {
      await axios.post(UNITS_URL, { unitName }, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      toast.success("Unit added successfully")
      setUnitName("")
      setShowModal(false)
      fetchUnits()
    } catch (err) {
      console.error("Error adding unit:", err)
      toast.error("Failed to add unit")
    }
  }

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this unit?")) return;
    try {
      await axios.delete(`${UNITS_URL}/${id}`, {
        params: { schoolId: user.uid },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      toast.success("Unit deleted successfully")
      fetchUnits()
    } catch (err) {
      console.error("Error deleting unit:", err)
      toast.error("Failed to delete unit")
    }
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link> <span className="separator">&gt;</span> <span>Store</span> <span className="separator">&gt;</span> <span className="current">Units Setup</span>
        </nav>
        <div className="form-card mt-3">
          <div className="header p-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: "#0B3D7B", color: "white" }}>
            <h2 className="m-0">Units Setup</h2>
            <Button onClick={() => setShowModal(true)} variant="light">+ Add Unit</Button>
          </div>
          <div className="p-4">
            <Table bordered hover>
              <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                <tr><th>Unit Name</th><th>Action</th></tr>
              </thead>
              <tbody>
                {units.length === 0 ? <tr><td colSpan="2" className="text-center">No units found</td></tr> : 
                  units.map((u) => (
                    <tr key={u.id}>
                      <td>{u.unitName}</td>
                      <td>
                        <Button variant="link" className="text-danger" onClick={() => handleDelete(u.id)}><FaTrash /></Button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </Table>
          </div>
        </div>

        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton><Modal.Title>Add Unit</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Unit Name</Form.Label>
              <Form.Control type="text" value={unitName} onChange={(e) => setUnitName(e.target.value)} placeholder="e.g. Kg, Pcs" />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAdd} style={{ backgroundColor: "#0B3D7B" }}>Add</Button>
          </Modal.Footer>
        </Modal>
        <ToastContainer />
      </Container>
    </MainContentPage>
  )
}
export default UnitsSetup