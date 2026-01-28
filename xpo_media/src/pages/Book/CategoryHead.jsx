"use client"

import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Form, Button, Row, Col, Container, Table, Modal } from "react-bootstrap"
import { FaEdit, FaTrash, FaSearch } from "react-icons/fa"
import axios from "axios"
import { useAuthContext } from "../../Context/AuthContext"
import { ToastContainer, toast } from "react-toastify"
import { ENDPOINTS } from "../../SpringBoot/config"
import "react-toastify/dist/ReactToastify.css"

const CategoryHead = () => {
  const { user, currentAcademicYear } = useAuthContext()
  const location = useLocation()
  const [categories, setCategories] = useState({ items: [], searchTerm: "" })
  const [showModal, setShowModal] = useState(false)
  const [modalData, setModalData] = useState({
    action: "",
    data: null,
    categoryName: "",
    accountHead: ""
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showConfirmEditModal, setShowConfirmEditModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const CATEGORIES_URL = `${ENDPOINTS.store}/categories`

  const fetchCategories = async () => {
    if (!user?.uid || !currentAcademicYear) return

    try {
      const res = await axios.get(CATEGORIES_URL, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      const categoriesData = res.data || []
      setCategories((prev) => ({ ...prev, items: categoriesData }))
    } catch (err) {
      console.error("Error fetching categories:", err)
      toast.error("Failed to fetch categories")
    }
  }

  useEffect(() => {
    if (user?.uid && currentAcademicYear) {
      fetchCategories()
    }
  }, [user?.uid, currentAcademicYear])

  const handleAdd = async () => {
    const { categoryName, accountHead } = modalData
    if (!categoryName.trim()) {
      toast.error("Category Name is required")
      return
    }

    try {
      await axios.post(CATEGORIES_URL, {
        categoryName,
        accountHead,
        academicYear: currentAcademicYear
      }, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      toast.success("Category added successfully")
      setShowModal(false)
      fetchCategories()
    } catch (err) {
      console.error("Error adding category:", err)
      toast.error("Failed to add category")
    }
  }

  const handleEdit = async () => {
    const { data, categoryName, accountHead } = modalData
    if (!categoryName.trim()) {
      toast.error("Category Name is required")
      return
    }

    setShowModal(false)
    setShowConfirmEditModal(true)
    setSelectedCategory({
      ...data,
      categoryName,
      accountHead
    })
  }

  const handleConfirmEdit = async () => {
    try {
      await axios.put(`${CATEGORIES_URL}/${selectedCategory.id}`, {
        categoryName: selectedCategory.categoryName,
        accountHead: selectedCategory.accountHead,
        academicYear: currentAcademicYear
      }, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      toast.success("Category updated successfully")
      setShowConfirmEditModal(false)
      setSelectedCategory(null)
      fetchCategories()
    } catch (err) {
      console.error("Error updating category:", err)
      toast.error("Failed to update category")
    }
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`${CATEGORIES_URL}/${selectedCategory.id}`, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      toast.success("Category deleted successfully")
      setShowDeleteModal(false)
      setSelectedCategory(null)
      fetchCategories()
    } catch (err) {
      console.error("Error deleting category:", err)
      toast.error("Failed to delete category")
    }
  }

  const openModal = (action, data = null) => {
    let initialData = {
      categoryName: "",
      accountHead: ""
    }
    if (action === "edit" && data) {
      initialData = {
        categoryName: data.categoryName || "",
        accountHead: data.accountHead || ""
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
      categoryName: "",
      accountHead: ""
    })
  }

  const filteredCategories = categories.items.filter(
    (category) =>
      category.categoryName.toLowerCase().includes(categories.searchTerm.toLowerCase())
  )

  return (
    <MainContentPage>
      <Container fluid className="px-0 px-lg-0">
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link>
          <span className="separator">&gt;</span>
          <span>Store</span>
          <span className="separator">&gt;</span>
          <span className="current col-12">Category Head</span>
        </nav>
        <Row>
          <Col xs={12}>
            <div className="category-head-container">
              <div className="form-card mt-3">
                <div className="header p-3 d-flex justify-content-between align-items-center">
                  <h2 className="m-0 d-none d-lg-block text-light">Category Head</h2>
                  <h6 className="m-0 d-lg-none text-light">Category Head</h6>
                  <Button onClick={() => openModal("add")} className="btn btn-light text-dark">
                    + Add Category
                  </Button>
                </div>
                <div className="content-wrapper p-4">
                  <Form.Group className="mb-3">
                    <Form.Control
                      type="text"
                      placeholder="Search by Category Name"
                      value={categories.searchTerm}
                      onChange={(e) => setCategories((prev) => ({ ...prev, searchTerm: e.target.value }))}
                      className="custom-search"
                    />
                  </Form.Group>
                  <div className="table-responsive">
                    <Table bordered hover>
                      <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                        <tr>
                          <th>Category Name</th>
                          <th>Account Head</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCategories.length === 0 ? (
                          <tr>
                            <td colSpan="3" className="text-center text-muted">
                              No categories found
                            </td>
                          </tr>
                        ) : (
                          filteredCategories.map((category) => (
                            <tr key={category.id}>
                              <td>{category.categoryName}</td>
                              <td>{category.accountHead || "N/A"}</td>
                              <td>
                                <Button
                                  variant="link"
                                  className="action-button edit-button me-2"
                                  onClick={() => openModal("edit", category)}
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  variant="link"
                                  className="action-button delete-button"
                                  onClick={() => setShowDeleteModal(true) || setSelectedCategory(category)}
                                >
                                  <FaTrash />
                                </Button>
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
          </Col>
        </Row>
      </Container>

      <Modal show={showModal} onHide={closeModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalData.action === "add" ? "Add" : "Edit"} Category
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Category Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Category Name"
              value={modalData.categoryName}
              onChange={(e) => setModalData({ ...modalData, categoryName: e.target.value })}
              className="custom-input"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Account Head</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Account Head"
              value={modalData.accountHead}
              onChange={(e) => setModalData({ ...modalData, accountHead: e.target.value })}
              className="custom-input"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={modalData.action === "add" ? handleAdd : handleEdit} style={{ backgroundColor: "#0B3D7B" }}>
            {modalData.action === "add" ? "Add" : "Update"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Category</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p>Are you sure you want to delete this category?</p>
          <p className="fw-bold">{selectedCategory?.categoryName}</p>
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

      <Modal show={showConfirmEditModal} onHide={() => setShowConfirmEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Edit</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to edit this category? This may affect related data.</p>
          <p><strong>Current Category:</strong> {selectedCategory?.data?.categoryName || selectedCategory?.categoryName}</p>
          <p><strong>New Category:</strong> {selectedCategory?.categoryName}</p>
          <p><strong>Current Account Head:</strong> {selectedCategory?.data?.accountHead || selectedCategory?.accountHead || "N/A"}</p>
          <p><strong>New Account Head:</strong> {selectedCategory?.accountHead || "N/A"}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirmEdit} style={{ backgroundColor: "#0B3D7B" }}>
            Confirm Edit
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer />

      <style>
        {`
          .category-head-container {
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

          .form-card {
            background-color: #fff;
            border: 1px solid #dee2e6;
            border-radius: 0.25rem;
          }

          .header {
            border-bottom: 1px solid #dee2e6;
            background-color: #0B3D7B;
          }

          .custom-search {
            max-width: 300px;
          }

          .table-responsive {
            margin-bottom: 0;
          }

          .table th {
            font-weight: 500;
          }

          .table td {
            vertical-align: middle;
          }

          .action-button {
            width: 30px;
            height: 30px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            padding: 0;
            color: white;
          }

          .edit-button {
            background-color: #0B3D7B;
          }

          .edit-button:hover {
            background-color: #092a54;
            color: white;
          }

          .delete-button {
            background-color: #dc3545;
          }

          .delete-button:hover {
            background-color: #bb2d3b;
            color: white;
          }

          .custom-input {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #ced4da;
            border-radius: 4px;
          }

          .Toastify__toast--success {
            background-color: #0B3D7B;
          }

          .Toastify__toast--error {
            background-color: #dc3545;
          }
        `}
      </style>
    </MainContentPage>
  )
}

export default CategoryHead