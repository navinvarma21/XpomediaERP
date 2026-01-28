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

const GroupSetup = () => {
  const { user, currentAcademicYear } = useAuthContext()
  const [groups, setGroups] = useState([])
  const [groupName, setGroupName] = useState("")
  const [showModal, setShowModal] = useState(false)
  
  const GROUPS_URL = `${ENDPOINTS.store}/groups`

  const fetchGroups = async () => {
    if (!user?.uid || !currentAcademicYear) return
    try {
      const res = await axios.get(GROUPS_URL, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      setGroups(res.data || [])
    } catch (err) {
      console.error("Error fetching groups:", err)
      toast.error("Failed to fetch groups")
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [user?.uid, currentAcademicYear])

  const handleAdd = async () => {
    if (!groupName.trim()) {
      toast.error("Group Name is required")
      return
    }
    try {
      await axios.post(GROUPS_URL, { groupName }, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      toast.success("Group added successfully")
      setGroupName("")
      setShowModal(false)
      fetchGroups()
    } catch (err) {
      console.error("Error adding group:", err)
      toast.error("Failed to add group")
    }
  }

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this group?")) return;
    try {
      await axios.delete(`${GROUPS_URL}/${id}`, {
        params: { schoolId: user.uid },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      toast.success("Group deleted successfully")
      fetchGroups()
    } catch (err) {
      console.error("Error deleting group:", err)
      toast.error("Failed to delete group")
    }
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link> <span className="separator">&gt;</span> <span>Store</span> <span className="separator">&gt;</span> <span className="current">Group Setup</span>
        </nav>
        <div className="form-card mt-3">
          <div className="header p-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: "#0B3D7B", color: "white" }}>
            <h2 className="m-0">Group Setup</h2>
            <Button onClick={() => setShowModal(true)} variant="light">+ Add Group</Button>
          </div>
          <div className="p-4">
            <Table bordered hover>
              <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                <tr><th>Group Name</th><th>Action</th></tr>
              </thead>
              <tbody>
                {groups.length === 0 ? <tr><td colSpan="2" className="text-center">No groups found</td></tr> : 
                  groups.map((g) => (
                    <tr key={g.id}>
                      <td>{g.groupName}</td>
                      <td>
                        <Button variant="link" className="text-danger" onClick={() => handleDelete(g.id)}><FaTrash /></Button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </Table>
          </div>
        </div>

        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton><Modal.Title>Add Group</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Group Name</Form.Label>
              <Form.Control type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Stationary" />
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
export default GroupSetup