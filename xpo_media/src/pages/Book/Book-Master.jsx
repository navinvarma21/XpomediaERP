"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainContentPage from "../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container, Table, Spinner, Modal } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useAuthContext } from "../../Context/AuthContext";
import { ENDPOINTS } from "../../SpringBoot/config";
import axios from "axios";

// Add/Edit Modal Component
const AddBookModal = ({ isOpen, onClose, onConfirm, book, nextCode }) => {
  const [bookCode, setBookCode] = useState("");
  const [bookName, setBookName] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (book) {
        // Edit Mode
        setBookCode(book.bookCode || "");
        setBookName(book.bookName || "");
      } else {
        // Add Mode - Use fetched next code
        setBookCode(nextCode || "Loading...");
        setBookName("");
      }
    }
  }, [book, isOpen, nextCode]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!bookName.trim()) {
      toast.error("Subject / Item Name is required");
      return;
    }
    // We only send the name, backend confirms code logic
    onConfirm({ bookName });
  };

  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{book ? "Edit Subject / Item" : "Add Subject / Item"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Item Code (Auto Generated)</Form.Label>
          <Form.Control
            type="text"
            value={bookCode}
            disabled // ✅ READ ONLY
            className="custom-input bg-light"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Subject / Item Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter Name"
            value={bookName}
            onChange={(e) => setBookName(e.target.value)}
            className="custom-input"
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} className="modal-button cancel">
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} className="modal-button confirm" style={{backgroundColor: "#0B3D7B"}}>
          {book ? "Update" : "Save"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, bookName }) => {
  if (!isOpen) return null;

  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Confirm Deletion</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to delete <strong>{bookName}</strong>?
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} className="modal-button cancel">
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} className="modal-button delete">
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Main Component
const BookMaster = () => {
  const { user, currentAcademicYear } = useAuthContext();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [nextCode, setNextCode] = useState(""); // Store next code
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  const BOOKS_URL = `${ENDPOINTS.store}/books`;

  useEffect(() => {
    fetchBooks();
  }, [user, currentAcademicYear]);

  const fetchBooks = async () => {
    if (!user || !currentAcademicYear) return;
    setLoading(true);
    try {
      const response = await axios.get(BOOKS_URL, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
      });
      setBooks(response.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch Next Code when opening Add Modal
  const fetchNextCode = async () => {
    try {
      const res = await axios.get(`${BOOKS_URL}/next-code`, {
        params: { schoolId: user.uid },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
      });
      setNextCode(res.data.nextCode);
    } catch (err) {
      console.error("Error fetching next code:", err);
      setNextCode("BK-???");
    }
  };

  const handleAddBook = async ({ bookName }) => {
    try {
      await axios.post(BOOKS_URL, {
        bookName,
        academicYear: currentAcademicYear
      }, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
      });
      toast.success("Added successfully");
      setIsAddModalOpen(false);
      fetchBooks();
    } catch (error) {
      console.error("Error adding:", error);
      toast.error(error.response?.data?.message || "Failed to add");
    }
  };

  const handleEditBook = async ({ bookName }) => {
    try {
      await axios.put(`${BOOKS_URL}/${selectedBook.id}`, {
        bookName,
        academicYear: currentAcademicYear
      }, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
      });
      toast.success("Updated successfully");
      setIsAddModalOpen(false);
      setSelectedBook(null);
      fetchBooks();
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Failed to update");
    }
  };

  const handleDeleteBook = async () => {
    try {
      await axios.delete(`${BOOKS_URL}/${selectedBook.id}`, {
        params: { schoolId: user.uid },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
      });
      toast.success("Deleted successfully");
      setIsDeleteModalOpen(false);
      setSelectedBook(null);
      fetchBooks();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete");
    }
  };

  const openAddModal = () => {
    setSelectedBook(null);
    fetchNextCode(); // ✅ Get fresh code
    setIsAddModalOpen(true);
  };

  const openEditModal = (book) => {
    setSelectedBook(book);
    setIsAddModalOpen(true);
  };

  const openDeleteModal = (book) => {
    setSelectedBook(book);
    setIsDeleteModalOpen(true);
  };

  const filteredBooks = books.filter(book =>
    (book.bookName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (book.bookCode || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link> <span className="separator">&gt;</span> <span>Store</span> <span className="separator">&gt;</span> <span className="current">Book Master</span>
        </nav>

        <div className="form-card mt-3">
          <div className="header p-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: "#0B3D7B", color: "white" }}>
            <h2 className="m-0">Book Master</h2>
            <Button onClick={openAddModal} className="btn btn-light text-dark">+ Add New</Button>
          </div>

          <div className="content-wrapper p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Form.Control
                type="text"
                placeholder="Search Item Code or Name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="custom-search"
                style={{ maxWidth: "300px" }}
              />
            </div>

            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : (
              <div className="table-responsive">
                <Table bordered hover>
                  <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                    <tr>
                      <th style={{ width: "20%" }}>Item Code</th>
                      <th>Subject / Item Name</th>
                      <th style={{ width: "150px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBooks.length === 0 ? (
                      <tr><td colSpan="3" className="text-center">No records found</td></tr>
                    ) : (
                      filteredBooks.map((book) => (
                        <tr key={book.id}>
                          <td>{book.bookCode}</td>
                          <td>{book.bookName}</td>
                          <td>
                            <Button variant="link" className="text-primary me-2" onClick={() => openEditModal(book)}>
                              <FaEdit />
                            </Button>
                            <Button variant="link" className="text-danger" onClick={() => openDeleteModal(book)}>
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
          </div>
        </div>
      </Container>

      {/* Modals */}
      <AddBookModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={selectedBook ? handleEditBook : handleAddBook}
        book={selectedBook}
        nextCode={nextCode} // ✅ Pass Next Code
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteBook}
        bookName={selectedBook?.bookName}
      />

      <ToastContainer position="top-right" autoClose={3000} />
      
      <style>{`
        .custom-breadcrumb a { color: #0B3D7B; text-decoration: none; }
        .form-card { background: #fff; border: 1px solid #dee2e6; border-radius: 0.25rem; }
      `}</style>
    </MainContentPage>
  );
};

export default BookMaster;