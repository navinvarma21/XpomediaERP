"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainContentPage from "../../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container, Table, Spinner } from "react-bootstrap";
import { FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";
import { useAuthContext } from "../../../Context/AuthContext";
import { ENDPOINTS } from "../../../SpringBoot/config";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../Styles/style.css";

// ---------------- Add Student Category Modal ----------------
const AddStudentCategoryModal = ({ isOpen, onClose, onConfirm }) => {
  const [categoryName, setCategoryName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    onConfirm(categoryName);
    setCategoryName("");
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Add Students Category</h2>
        <div className="modal-body">
          <Form.Control
            type="text"
            placeholder="Enter Students Category"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="custom-input"
          />
        </div>
        <div className="modal-buttons">
          <Button className="modal-button confirm" onClick={handleSubmit}>
            Add
          </Button>
          <Button className="modal-button cancel" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

// ---------------- Edit Modal ----------------
const EditStudentCategoryModal = ({ isOpen, onClose, onConfirm, category }) => {
  const [categoryName, setCategoryName] = useState(category?.StudentCategoryName || "");

  useEffect(() => {
    if (category) setCategoryName(category.StudentCategoryName);
  }, [category]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onConfirm(category.id, categoryName);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Edit Students Category</h2>
        <div className="modal-body">
          <Form.Control
            type="text"
            placeholder="Enter Students Category"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="custom-input"
          />
        </div>
        <div className="modal-buttons">
          <Button className="modal-button confirm" onClick={handleSubmit}>
            Update
          </Button>
          <Button className="modal-button cancel" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

// ---------------- Delete Modal ----------------
const DeleteStudentCategoryModal = ({ isOpen, onClose, onConfirm, category }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Delete Students Category</h2>
        <div className="modal-body text-center">
          <p>Are you sure you want to delete this student category?</p>
          <p className="fw-bold">{category?.StudentCategoryName}</p>
        </div>
        <div className="modal-buttons">
          <Button className="modal-button delete" onClick={() => onConfirm(category.id)}>
            Delete
          </Button>
          <Button className="modal-button cancel" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

// ---------------- Confirm Edit Modal ----------------
const ConfirmEditModal = ({ isOpen, onClose, onConfirm, currentName, newName }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Confirm Edit</h2>
        <div className="modal-body">
          <p>
            Are you sure you want to edit this student category? This may affect the structure of student data.
          </p>
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
  );
};

// ---------------- Main Component ----------------
const StudentsCategory = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isConfirmEditModalOpen, setIsConfirmEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, currentAcademicYear } = useAuthContext();

  // ---------------- Fetch Categories ----------------
  const fetchCategories = async () => {
    if (!user?.uid || !currentAcademicYear) return;
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(
        `${ENDPOINTS.administration}/studentcategory/${user.uid}/${currentAcademicYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];

      // Normalize data
      const normalizedData = data.map((c) => ({
        id: c.id,
        StudentCategoryName: c.StudentCategoryName || c.studentCategoryName || "",
      }));

      setCategories(normalizedData);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch student categories.");
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid && currentAcademicYear) fetchCategories();
  }, [user?.uid, currentAcademicYear]);

  // ---------------- Add Category ----------------
  const handleAddCategory = async (categoryName) => {
    if (!categoryName.trim()) return toast.error("Category name cannot be empty.");
    if (categories.some((c) => c.StudentCategoryName.toLowerCase() === categoryName.toLowerCase()))
      return toast.error("Category already exists.");

    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      await axios.post(
        `${ENDPOINTS.administration}/studentcategory`,
        { studentCategoryName: categoryName, academicYear: currentAcademicYear },
        { headers: { Authorization: `Bearer ${token}` }, params: { schoolId: user.uid } }
      );
      toast.success("Student category added successfully!");
      setIsAddModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add student category.");
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- Edit Category ----------------
  const handleEditCategory = (id, newName) => {
    if (!newName.trim()) return toast.error("Category name cannot be empty.");
    if (categories.some((c) => c.id !== id && c.StudentCategoryName.toLowerCase() === newName.toLowerCase()))
      return toast.error("Category already exists.");

    setSelectedCategory({ ...selectedCategory, id });
    setNewCategoryName(newName);
    setIsEditModalOpen(false);
    setIsConfirmEditModalOpen(true);
  };

  const confirmEditCategory = async () => {
    if (!newCategoryName.trim()) return toast.error("Category name cannot be empty.");

    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      await axios.put(
        `${ENDPOINTS.administration}/studentcategory/${selectedCategory.id}`,
        { studentCategoryName: newCategoryName, academicYear: currentAcademicYear },
        { headers: { Authorization: `Bearer ${token}` }, params: { schoolId: user.uid } }
      );
      toast.success("Student category updated!");
      setIsConfirmEditModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category.");
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- Delete Category ----------------
  const handleDeleteCategory = async (id) => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      await axios.delete(`${ENDPOINTS.administration}/studentcategory/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { schoolId: user.uid },
      });
      toast.success("Student category deleted!");
      setIsDeleteModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category.");
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- Filtered Categories ----------------
  const filteredCategories = Array.isArray(categories)
    ? categories.filter((c) =>
        (c.StudentCategoryName || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <MainContentPage>
      <Container fluid className="px-0 px-lg-0">
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link>
          <span className="separator">&gt;</span>
          <span>Administration</span>
          <span className="separator">&gt;</span>
          <span className="current col-12">Create Students Category</span>
        </nav>
        <Row>
          <Col xs={12}>
            <div className="category-setup-container">
              <div className="form-card mt-3">
                <div className="header p-3 d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="m-0 d-none d-lg-block">Create Students Category</h2>
                    <h6 className="m-0 d-lg-none">Create Students Category</h6>
                  </div>
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="btn btn-primary text-light"
                    disabled={!currentAcademicYear || isLoading}
                  >
                    + Add Students Category
                  </Button>
                </div>

                <div className="content-wrapper p-4">
                  {!currentAcademicYear ? (
                    <div className="alert alert-warning">
                      Please select an academic year to manage student categories.
                    </div>
                  ) : (
                    <>
                      <div className="position-relative mb-3">
                        <Form.Control
                          type="text"
                          placeholder="Search by Category Name"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="custom-search"
                          disabled={isLoading}
                        />
                        {searchTerm && (
                          <Button
                            variant="light"
                            style={{
                              position: "absolute",
                              right: "10px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              border: "none",
                              borderRadius: "50%",
                              width: "32px",
                              height: "32px",
                              fontSize: "20px",
                              fontWeight: "bold",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                            }}
                            onClick={() => setSearchTerm("")}
                          >
                            ×
                          </Button>
                        )}
                      </div>

                      {isLoading ? (
                        <div className="text-center my-4">
                          <Spinner animation="border" role="status" variant="primary" className="loader">
                            <span className="visually-hidden">Loading...</span>
                          </Spinner>
                          <p className="mt-2">Loading data...</p>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <Table bordered hover>
                            <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                              <tr>
                                <th>Category Name</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredCategories.length === 0 ? (
                                <tr>
                                  <td colSpan="2" className="text-center">No data available</td>
                                </tr>
                              ) : (
                                filteredCategories.map((category) => (
                                  <tr key={category.id}>
                                    <td>{category.StudentCategoryName}</td>
                                    <td>
                                      <Button
                                        variant="link"
                                        className="action-button edit-button me-2"
                                        onClick={() => {
                                          setSelectedCategory(category);
                                          setIsEditModalOpen(true);
                                        }}
                                      >
                                        <FaEdit />
                                      </Button>
                                      <Button
                                        variant="link"
                                        className="action-button delete-button"
                                        onClick={() => {
                                          setSelectedCategory(category);
                                          setIsDeleteModalOpen(true);
                                        }}
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
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Modals */}
      <AddStudentCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={handleAddCategory}
      />
      <EditStudentCategoryModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onConfirm={handleEditCategory}
        category={selectedCategory}
      />
      <DeleteStudentCategoryModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteCategory}
        category={selectedCategory}
      />
      <ConfirmEditModal
        isOpen={isConfirmEditModalOpen}
        onClose={() => setIsConfirmEditModalOpen(false)}
        onConfirm={confirmEditCategory}
        currentName={selectedCategory?.StudentCategoryName}
        newName={newCategoryName}
      />

      <ToastContainer />
    </MainContentPage>
  );
};

export default StudentsCategory;
