"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainContentPage from "../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container, Table, Spinner } from "react-bootstrap";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useAuthContext } from "../../Context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";
import { ENDPOINTS } from "../../SpringBoot/config";


const AddCategoryModal = ({ isOpen, onClose, onConfirm }) => {
  const [category, setCategory] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!category.trim()) return toast.error("Category name cannot be empty.");
    onConfirm(category.trim());
    setCategory("");
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Add Category</h2>
        <div className="modal-body">
          <Form.Control
            type="text"
            placeholder="Enter Category Name"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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

const EditCategoryModal = ({ isOpen, onClose, onConfirm, categoryItem }) => {
  const [category, setCategory] = useState(categoryItem?.name || "");

  useEffect(() => {
    if (categoryItem) setCategory(categoryItem.name);
  }, [categoryItem]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!category.trim()) return toast.error("Category name cannot be empty.");
    onConfirm(categoryItem.id, category.trim());
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Edit Category</h2>
        <div className="modal-body">
          <Form.Control
            type="text"
            placeholder="Enter Category Name"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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

const DeleteCategoryModal = ({ isOpen, onClose, onConfirm, categoryItem }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Delete Category</h2>
        <div className="modal-body text-center">
          <p>Are you sure you want to delete this category?</p>
          <p className="fw-bold">{categoryItem?.name}</p>
        </div>
        <div className="modal-buttons">
          <Button className="modal-button delete" onClick={() => onConfirm(categoryItem.id)}>
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

const ConfirmEditModal = ({ isOpen, onClose, onConfirm, currentName, newName }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Confirm Edit</h2>
        <div className="modal-body">
          <p>Are you sure you want to edit this category? This may affect book data.</p>
          <p><strong>Current Name:</strong> {currentName}</p>
          <p><strong>New Name:</strong> {newName}</p>
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

const BookCategorySetup = () => {
  const { user, admin, currentAcademicYear, loading, forceLogout, schoolId } = useAuthContext();

  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isConfirmEditModalOpen, setIsConfirmEditModalOpen] = useState(false);

  const fetchCategories = async () => {
    if (!schoolId || schoolId === "-" || !currentAcademicYear) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${ENDPOINTS.library}/categories?schoolId=${schoolId}&year=${currentAcademicYear}`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch categories.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [schoolId, currentAcademicYear]);

  const handleAddCategory = async (category) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${ENDPOINTS.library}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId: schoolId, academicYear: currentAcademicYear, name: category }),
      });
      if (!res.ok) throw new Error("Failed to add category");
      await fetchCategories();
      setIsAddModalOpen(false);
      toast.success("Category added successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add category.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = (id, newName) => {
    setSelectedCategory(categories.find((c) => c.id === id));
    setNewCategory(newName);
    setIsEditModalOpen(false);
    setIsConfirmEditModalOpen(true);
  };

  const confirmEditCategory = async () => {
    if (!selectedCategory) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `${ENDPOINTS.library}/categories/${selectedCategory.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schoolId: schoolId, name: newCategory }),
        }
      );
      if (!res.ok) throw new Error("Failed to update category");
      await fetchCategories();
      setIsConfirmEditModalOpen(false);
      toast.success("Category updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update category.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${ENDPOINTS.library}/categories/${id}?schoolId=${schoolId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete category");
      await fetchCategories();
      setIsDeleteModalOpen(false);
      toast.success("Category deleted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete category.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      for (const row of jsonData) {
        const name = row["Category Name"] || row["name"];
        if (name && !categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
          await handleAddCategory(name);
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExport = () => {
    if (!categories.length) return toast.error("No data to export");
    const exportData = categories.map((c) => ({ "Category Name": c.name }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Categories");
    XLSX.writeFile(workbook, `Categories_Export_${schoolId}_${currentAcademicYear}.xlsx`);
    toast.success("Categories exported successfully!");
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainContentPage>
      <Container fluid className="px-0 px-lg-0">
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link> &gt; <span>Library</span> &gt;{" "}
          <span className="current col-12">Book Category Setup</span>
        </nav>

        <Row>
          <Col xs={12}>
            <div className="category-setup-container">
              <div className="form-card mt-3">
                <div className="header p-3 d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="m-0 d-none d-lg-block">Book Category Setup</h2>
                    <h6 className="m-0 d-lg-none">Book Category Setup</h6>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <input type="file" accept=".xlsx, .xls" onChange={handleImport} style={{ display: "none" }} id="import-file" />
                    <Button onClick={() => document.getElementById("import-file").click()} className="btn btn-primary text-light" disabled={isLoading}>Import</Button>
                    <Button onClick={handleExport} className="btn btn-primary text-light" disabled={isLoading || !categories.length}>Export</Button>
                    <Button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary text-light" disabled={isLoading}>+ Add Category</Button>
                  </div>
                </div>

                <div className="content-wrapper p-4">
                  {!currentAcademicYear ? (
                    <div className="alert alert-warning">Please select an academic year to manage categories.</div>
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

                      {isLoading && <div className="text-center my-4"><Spinner animation="border" /> Loading...</div>}
                      {!isLoading && (
                        <div className="table-responsive">
                          <Table bordered hover>
                            <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                              <tr>
                                <th>Category Name</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {categories.length === 0 ? (
                                <tr><td colSpan="2" className="text-center">No data available</td></tr>
                              ) : filteredCategories.length === 0 && searchTerm ? (
                                <tr><td colSpan="2" className="text-center">No matching categories found</td></tr>
                              ) : (
                                filteredCategories.map((category) => (
                                  <tr key={category.id}>
                                    <td>{category.name}</td>
                                    <td>
                                      <Button variant="link action-button edit-button me-2" onClick={() => { setSelectedCategory(category); setIsEditModalOpen(true) }}><FaEdit /></Button>
                                      <Button variant="link action-button delete-button" onClick={() => { setSelectedCategory(category); setIsDeleteModalOpen(true) }}><FaTrash /></Button>
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

      <AddCategoryModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onConfirm={handleAddCategory} />
      <EditCategoryModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onConfirm={handleEditCategory} categoryItem={selectedCategory} />
      <DeleteCategoryModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteCategory} categoryItem={selectedCategory} />
      <ConfirmEditModal isOpen={isConfirmEditModalOpen} onClose={() => setIsConfirmEditModalOpen(false)} onConfirm={confirmEditCategory} currentName={selectedCategory?.name} newName={newCategory} />

      <ToastContainer />
    </MainContentPage>
  );
};

export default BookCategorySetup;