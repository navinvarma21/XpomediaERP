"use client";

import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaEye, FaFilter, FaPlus, FaEdit, FaTrash, FaTimes, FaRupeeSign } from "react-icons/fa";
import "./styles/book-management.css";
import MainContentPage from "../../components/MainContent/MainContentPage";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../Context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ENDPOINTS } from "../../SpringBoot/config";
import { Modal, Button, Form } from "react-bootstrap";

const BookManagement = () => {
  const navigate = useNavigate();
  const { schoolId, currentAcademicYear } = useAuthContext();
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Book states
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [editFormData, setEditFormData] = useState({
    bookTitle: "",
    authorName: "",
    isbn: "",
    category: "",
    edition: "",
    publisher: "",
    bookStatus: "available",
    language: "",
    pages: "",
    publishedDate: "",
    description: "",
    purchaseRate: "",
    sellingRate: "",
    mrp: ""
  });
  const [editBookCover, setEditBookCover] = useState(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch all books
  const fetchBooks = async (search = "") => {
    if (!schoolId || !currentAcademicYear) return;
    
    setIsLoading(true);
    try {
      let url = `${ENDPOINTS.library}?schoolId=${schoolId}&academicYear=${currentAcademicYear}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch books");
      
      const data = await response.json(); 
      setBooks(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch books.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [schoolId, currentAcademicYear]);

  // Handle search
  const handleSearch = () => {
    fetchBooks(searchTerm);
  };

  // Handle search on Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Navigate to Add Book page
  const handleAddBook = () => {
    navigate("/library/add-new-book");
  };

  // View book details
  const handleView = (book) => {
    setSelectedBook(book);
    setShowViewModal(true);
  };

  // Edit book
  const handleEdit = (book) => {
    setSelectedBook(book);
    setEditFormData({
      bookTitle: book.bookTitle || "",
      authorName: book.authorName || "",
      isbn: book.isbn || "",
      category: book.category || "",
      edition: book.edition || "",
      publisher: book.publisher || "",
      bookStatus: book.bookStatus || "available",
      language: book.language || "",
      pages: book.pages || "",
      publishedDate: book.publishedDate || "",
      description: book.description || "",
      purchaseRate: book.purchaseRate || "",
      sellingRate: book.sellingRate || "",
      mrp: book.mrp || ""
    });
    setEditPhotoPreview(book.bookCoverPhotoPath || null);
    setEditBookCover(null);
    setValidationErrors({});
    setShowEditModal(true);
  };

  // Handle edit form changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    
    // Clear validation error for this field
    setValidationErrors(prev => ({ ...prev, [name]: null }));
    
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validate pricing fields
  const validatePricing = () => {
    const errors = {};
    
    // Convert to numbers for comparison
    const purchaseRate = parseFloat(editFormData.purchaseRate) || 0;
    const sellingRate = parseFloat(editFormData.sellingRate) || 0;
    const mrp = parseFloat(editFormData.mrp) || 0;
    
    // Only validate if values are entered
    if (editFormData.purchaseRate && editFormData.sellingRate && purchaseRate > sellingRate) {
      errors.sellingRate = "Selling Rate cannot be less than Purchase Rate";
    }
    
    if (editFormData.sellingRate && editFormData.mrp && sellingRate > mrp) {
      errors.mrp = "MRP cannot be less than Selling Rate";
    }
    
    if (editFormData.purchaseRate && editFormData.mrp && purchaseRate > mrp) {
      errors.mrp = "MRP cannot be less than Purchase Rate";
    }
    
    // Validate non-negative values
    if (editFormData.purchaseRate && purchaseRate < 0) {
      errors.purchaseRate = "Purchase Rate cannot be negative";
    }
    
    if (editFormData.sellingRate && sellingRate < 0) {
      errors.sellingRate = "Selling Rate cannot be negative";
    }
    
    if (editFormData.mrp && mrp < 0) {
      errors.mrp = "MRP cannot be negative";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle edit photo change
  const handleEditPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file");
        return;
      }
      
      setEditBookCover(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Calculate profit for display
  const calculateProfit = (purchaseRate, sellingRate) => {
    if (!purchaseRate || !sellingRate) return null;
    const purchase = parseFloat(purchaseRate);
    const selling = parseFloat(sellingRate);
    if (isNaN(purchase) || isNaN(selling) || purchase === 0) return null;
    
    const profit = selling - purchase;
    const profitPercentage = ((profit / purchase) * 100).toFixed(2);
    return { profit, profitPercentage };
  };

  // Submit edited book
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBook) return;
    
    // Validate pricing
    if (!validatePricing()) {
      Object.values(validationErrors).forEach(error => {
        if (error) toast.error(error);
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      
      // Append all form data
      Object.keys(editFormData).forEach(key => {
        if (editFormData[key] !== null && editFormData[key] !== undefined && editFormData[key] !== "") {
          formData.append(key, editFormData[key]);
        }
      });
      
      // Append book cover photo if changed
      if (editBookCover) {
        formData.append("bookCoverPhoto", editBookCover);
      }
      
      // Append required parameters
      formData.append("schoolId", schoolId);
      formData.append("academicYear", currentAcademicYear);
      formData.append("bookId", selectedBook.bookId);

      const response = await fetch(
        `${ENDPOINTS.library}/${selectedBook.id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update book: ${response.status} ${errorText}`);
      }

      const updatedBook = await response.json();
      toast.success("Book updated successfully!");
      
      // Update the books list
      setBooks(prev => prev.map(book => 
        book.id === selectedBook.id ? updatedBook : book
      ));
      
      setShowEditModal(false);
      setSelectedBook(null);
      setEditBookCover(null);
      setEditPhotoPreview(null);
      setValidationErrors({});
      
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.message || "Failed to update book. Please check the console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm delete
  const confirmDelete = (book) => {
    setBookToDelete(book);
    setShowDeleteModal(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!bookToDelete) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${ENDPOINTS.library}/${bookToDelete.id}?schoolId=${schoolId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete book");

      toast.success("Book deleted successfully!");
      
      // Remove from local state
      setBooks(prev => prev.filter(book => book.id !== bookToDelete.id));
      
      setShowDeleteModal(false);
      setBookToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete book.");
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "N/A";
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  // Modal styles
  const modalStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1050
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
      maxWidth: '90%',
      maxHeight: '90%',
      overflow: 'auto',
      position: 'relative'
    },
    header: {
      padding: '20px 25px',
      borderBottom: '1px solid #e9ecef',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
      borderTopLeftRadius: '12px',
      borderTopRightRadius: '12px'
    },
    body: {
      padding: '25px',
      maxHeight: '70vh',
      overflowY: 'auto'
    },
    footer: {
      padding: '20px 25px',
      borderTop: '1px solid #e9ecef',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer',
      color: '#6c757d',
      padding: '5px'
    },
    photoUpload: {
      border: '2px dashed #007bff',
      borderRadius: '8px',
      padding: '20px',
      textAlign: 'center',
      cursor: 'pointer',
      backgroundColor: '#f8f9fa',
      transition: 'all 0.3s ease'
    },
    photoPreview: {
      width: '150px',
      height: '200px',
      objectFit: 'cover',
      borderRadius: '8px',
      margin: '0 auto',
      display: 'block'
    }
  };

  // Custom Modal Component
  const CustomModal = ({ show, onHide, title, children, footer, size = 'md' }) => {
    if (!show) return null;

    const sizeStyles = {
      sm: { width: '400px' },
      md: { width: '600px' },
      lg: { width: '800px' },
      xl: { width: '1140px' }
    };

    return (
      <div style={modalStyles.overlay}>
        <div style={{...modalStyles.modal, ...sizeStyles[size]}}>
          <div style={modalStyles.header}>
            <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#343a40' }}>{title}</h4>
            <button style={modalStyles.closeButton} onClick={onHide}>
              <FaTimes />
            </button>
          </div>
          <div style={modalStyles.body}>
            {children}
          </div>
          {footer && (
            <div style={modalStyles.footer}>
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <MainContentPage>
      <div className="container-fluid p-4">
        {/* Header */}
        <div className="mb-4">
          <h2 className="mb-2 fw-bolder">Library Management</h2>
        </div>

        {/* Breadcrumb */}
        <div className="mb-4">
          <nav className="d-flex custom-breadcrumb py-1 py-lg-3">
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <div to="/library">Library Management</div>
            <span className="separator mx-2">&gt;</span>
            <span>Book Management</span>
          </nav>
        </div>

        {/* Search and Actions */}
        <div className="card mb-4 border-0 shadow-sm">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12 col-md-8">
                <div className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by Book Title, Author, ISBN, Category, Publisher"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button
                    onClick={handleSearch}
                    className="btn text-light px-lg-4 custom-btn-clr"
                    disabled={isLoading}
                  >
                    {isLoading ? "SEARCHING..." : "SEARCH"}
                  </button>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="d-flex gap-2 justify-content-md-end">
                  <button
                    onClick={handleAddBook}
                    className="btn custom-btn-clr custom-btn"
                  >
                    <FaPlus className="me-2" />
                    Add Book
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Books Table */}
        <div className="table-responsive">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No books found.</p>
            </div>
          ) : (
            <table className="table table-bordered table-hover">
              <thead>
                <tr>
                  <th className="custom-btn-clr">Book ID</th>
                  <th className="custom-btn-clr">Cover</th>
                  <th className="custom-btn-clr">Title</th>
                  <th className="custom-btn-clr">Author</th>
                  <th className="custom-btn-clr">ISBN</th>
                  <th className="custom-btn-clr">Category</th>
                  <th className="custom-btn-clr">Status</th>
                  <th className="custom-btn-clr">Purchase Rate</th>
                  <th className="custom-btn-clr">Selling Rate</th>
                  <th className="custom-btn-clr">MRP</th>
                  <th className="custom-btn-clr">Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => {
                  const profitInfo = calculateProfit(book.purchaseRate, book.sellingRate);
                  return (
                    <tr key={book.id}>
                      <td className="book-id">{book.bookId}</td>
                      <td>
                        {book.bookCoverPhotoPath ? (
                          <img
                            src={book.bookCoverPhotoPath}
                            alt={book.bookTitle}
                            style={{
                              width: "50px",
                              height: "50px",
                              objectFit: "cover",
                              borderRadius: "4px",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "50px",
                              height: "50px",
                              backgroundColor: "#f0f0f0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "4px",
                              fontSize: "10px",
                              color: "#999",
                            }}
                          >
                            No Image
                          </div>
                        )}
                      </td>
                      <td>{book.bookTitle}</td>
                      <td>{book.authorName}</td>
                      <td>{book.isbn || "N/A"}</td>
                      <td>{book.category || "N/A"}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            book.bookStatus?.toLowerCase() === "available"
                              ? "available"
                              : book.bookStatus?.toLowerCase() === "issued"
                              ? "issued"
                              : book.bookStatus?.toLowerCase() === "maintenance"
                              ? "maintenance"
                              : book.bookStatus?.toLowerCase() === "reserved"
                              ? "reserved"
                              : "unavailable"
                          }`}
                        >
                          {book.bookStatus || "N/A"}
                        </span>
                      </td>
                      <td>
                        {book.purchaseRate ? (
                          <span className="text-success">
                            <FaRupeeSign size={12} /> {parseFloat(book.purchaseRate).toFixed(2)}
                          </span>
                        ) : "N/A"}
                      </td>
                      <td>
                        {book.sellingRate ? (
                          <span className="text-primary">
                            <FaRupeeSign size={12} /> {parseFloat(book.sellingRate).toFixed(2)}
                          </span>
                        ) : "N/A"}
                      </td>
                      <td>
                        {book.mrp ? (
                          <span className="text-info">
                            <FaRupeeSign size={12} /> {parseFloat(book.mrp).toFixed(2)}
                          </span>
                        ) : "N/A"}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            onClick={() => handleView(book)}
                            className="btn btn-primary btn-sm custom-btn"
                            title="View"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleEdit(book)}
                            className="btn btn-warning btn-sm"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => confirmDelete(book)}
                            className="btn btn-danger btn-sm"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mt-4">
          <div className="text-muted small">
            Showing {books.length} {books.length === 1 ? "entry" : "entries"}
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary" disabled>
              Previous
            </button>
            <button className="btn btn-primary custom-btn">1</button>
            <button className="btn btn-outline-primary custom-outline-btn">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* View Book Modal */}
      <CustomModal 
        show={showViewModal} 
        onHide={() => setShowViewModal(false)} 
        size="xl"
        title="Book Details"
        footer={
          <Button 
            variant="secondary" 
            onClick={() => setShowViewModal(false)}
            style={{ padding: '8px 20px', borderRadius: '6px' }}
          >
            Close
          </Button>
        }
      >
        {selectedBook && (
          <div className="row">
            <div className="col-md-4 text-center mb-4">
              {selectedBook.bookCoverPhotoPath ? (
                <img
                  src={selectedBook.bookCoverPhotoPath}
                  alt={selectedBook.bookTitle}
                  style={modalStyles.photoPreview}
                />
              ) : (
                <div
                  style={{
                    ...modalStyles.photoPreview,
                    backgroundColor: "#f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    color: "#999",
                  }}
                >
                  No Image Available
                </div>
              )}
            </div>
            <div className="col-md-8">
              <div className="row">
                <div className="col-6 mb-3">
                  <strong style={{ color: '#495057' }}>Book ID:</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '15px' }}>{selectedBook.bookId}</p>
                </div>
                <div className="col-6 mb-3">
                  <strong style={{ color: '#495057' }}>Title:</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '15px' }}>{selectedBook.bookTitle}</p>
                </div>
                <div className="col-6 mb-3">
                  <strong style={{ color: '#495057' }}>Author:</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '15px' }}>{selectedBook.authorName}</p>
                </div>
                <div className="col-6 mb-3">
                  <strong style={{ color: '#495057' }}>ISBN:</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '15px' }}>{selectedBook.isbn || "N/A"}</p>
                </div>
                <div className="col-6 mb-3">
                  <strong style={{ color: '#495057' }}>Category:</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '15px' }}>{selectedBook.category || "N/A"}</p>
                </div>
                <div className="col-6 mb-3">
                  <strong style={{ color: '#495057' }}>Edition:</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '15px' }}>{selectedBook.edition || "N/A"}</p>
                </div>
                <div className="col-6 mb-3">
                  <strong style={{ color: '#495057' }}>Publisher:</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '15px' }}>{selectedBook.publisher || "N/A"}</p>
                </div>
                <div className="col-6 mb-3">
                  <strong style={{ color: '#495057' }}>Status:</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '15px' }}>
                    <span
                      className={`status-badge ${
                        selectedBook.bookStatus?.toLowerCase() === "available"
                          ? "available"
                          : selectedBook.bookStatus?.toLowerCase() === "issued"
                          ? "issued"
                          : selectedBook.bookStatus?.toLowerCase() === "maintenance"
                          ? "maintenance"
                          : "unavailable"
                      }`}
                    >
                      {selectedBook.bookStatus || "N/A"}
                    </span>
                  </p>
                </div>
                <div className="col-6 mb-3">
                  <strong style={{ color: '#495057' }}>Language:</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '15px' }}>{selectedBook.language || "N/A"}</p>
                </div>
                <div className="col-6 mb-3">
                  <strong style={{ color: '#495057' }}>Pages:</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '15px' }}>{selectedBook.pages || "N/A"}</p>
                </div>
                <div className="col-6 mb-3">
                  <strong style={{ color: '#495057' }}>Published Date:</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '15px' }}>{selectedBook.publishedDate || "N/A"}</p>
                </div>
                
                {/* New Pricing Fields */}
                <div className="col-6 mb-3">
                  <strong style={{ color: '#495057' }}>Purchase Rate:</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '15px', color: '#28a745' }}>
                    {selectedBook.purchaseRate ? `₹${parseFloat(selectedBook.purchaseRate).toFixed(2)}` : "N/A"}
                  </p>
                </div>
                <div className="col-6 mb-3">
                  <strong style={{ color: '#495057' }}>Selling Rate:</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '15px', color: '#007bff' }}>
                    {selectedBook.sellingRate ? `₹${parseFloat(selectedBook.sellingRate).toFixed(2)}` : "N/A"}
                  </p>
                </div>
                <div className="col-6 mb-3">
                  <strong style={{ color: '#495057' }}>MRP:</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '15px', color: '#17a2b8' }}>
                    {selectedBook.mrp ? `₹${parseFloat(selectedBook.mrp).toFixed(2)}` : "N/A"}
                  </p>
                </div>
                
                {/* Profit Calculation */}
                {selectedBook.purchaseRate && selectedBook.sellingRate && (
                  <>
                    <div className="col-6 mb-3">
                      <strong style={{ color: '#495057' }}>Profit per Copy:</strong>
                      <p style={{ margin: '5px 0 0 0', fontSize: '15px', color: '#20c997' }}>
                        ₹{(parseFloat(selectedBook.sellingRate) - parseFloat(selectedBook.purchaseRate)).toFixed(2)}
                      </p>
                    </div>
                    <div className="col-6 mb-3">
                      <strong style={{ color: '#495057' }}>Profit Margin:</strong>
                      <p style={{ margin: '5px 0 0 0', fontSize: '15px', color: '#20c997' }}>
                        {((parseFloat(selectedBook.sellingRate) - parseFloat(selectedBook.purchaseRate)) / parseFloat(selectedBook.purchaseRate) * 100).toFixed(2)}%
                      </p>
                    </div>
                  </>
                )}
                
                {selectedBook.description && (
                  <div className="col-12 mb-3">
                    <strong style={{ color: '#495057' }}>Description:</strong>
                    <p style={{ margin: '5px 0 0 0', fontSize: '15px', lineHeight: '1.5' }}>{selectedBook.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CustomModal>

      {/* Edit Book Modal */}
      <CustomModal 
        show={showEditModal} 
        onHide={() => setShowEditModal(false)} 
        size="xl"
        title="Edit Book"
        footer={
          <>
            <Button 
              variant="secondary" 
              onClick={() => setShowEditModal(false)}
              style={{ padding: '8px 20px', borderRadius: '6px' }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleEditSubmit}
              style={{ padding: '8px 20px', borderRadius: '6px' }}
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update Book"}
            </Button>
          </>
        }
      >
        <Form onSubmit={handleEditSubmit}>
          <div className="row">
            {/* Photo Upload Section */}
            <div className="col-md-3 mb-4">
              <div style={{ textAlign: 'center' }}>
                <h6 style={{ marginBottom: '15px', color: '#495057' }}>Book Cover Photo</h6>
                <div
                  style={modalStyles.photoUpload}
                  onClick={() => document.getElementById('editBookCover').click()}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                >
                  {editPhotoPreview ? (
                    <img
                      src={editPhotoPreview}
                      alt="Preview"
                      style={modalStyles.photoPreview}
                    />
                  ) : (
                    <div style={{ color: '#007bff', fontSize: '14px' }}>
                      <div>Click to upload</div>
                      <div>or drag and drop</div>
                    </div>
                  )}
                </div>
                <input
                  id="editBookCover"
                  type="file"
                  accept="image/*"
                  onChange={handleEditPhotoChange}
                  style={{ display: 'none' }}
                />
                <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '10px' }}>
                  JPG, PNG, GIF up to 5MB
                </p>
              </div>
            </div>

            {/* Form Fields Section */}
            <div className="col-md-9">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <Form.Group>
                    <Form.Label style={{ fontWeight: '500' }}>Book Title *</Form.Label>
                    <Form.Control
                      type="text"
                      name="bookTitle"
                      value={editFormData.bookTitle}
                      onChange={handleEditChange}
                      required
                      style={{ borderRadius: '6px', padding: '10px' }}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Group>
                    <Form.Label style={{ fontWeight: '500' }}>Author Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="authorName"
                      value={editFormData.authorName}
                      onChange={handleEditChange}
                      required
                      style={{ borderRadius: '6px', padding: '10px' }}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Group>
                    <Form.Label style={{ fontWeight: '500' }}>ISBN</Form.Label>
                    <Form.Control
                      type="text"
                      name="isbn"
                      value={editFormData.isbn}
                      onChange={handleEditChange}
                      style={{ borderRadius: '6px', padding: '10px' }}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Group>
                    <Form.Label style={{ fontWeight: '500' }}>Category</Form.Label>
                    <Form.Control
                      type="text"
                      name="category"
                      value={editFormData.category}
                      onChange={handleEditChange}
                      style={{ borderRadius: '6px', padding: '10px' }}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Group>
                    <Form.Label style={{ fontWeight: '500' }}>Edition</Form.Label>
                    <Form.Control
                      type="text"
                      name="edition"
                      value={editFormData.edition}
                      onChange={handleEditChange}
                      style={{ borderRadius: '6px', padding: '10px' }}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Group>
                    <Form.Label style={{ fontWeight: '500' }}>Publisher</Form.Label>
                    <Form.Control
                      type="text"
                      name="publisher"
                      value={editFormData.publisher}
                      onChange={handleEditChange}
                      style={{ borderRadius: '6px', padding: '10px' }}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Group>
                    <Form.Label style={{ fontWeight: '500' }}>Status</Form.Label>
                    <Form.Select
                      name="bookStatus"
                      value={editFormData.bookStatus}
                      onChange={handleEditChange}
                      style={{ borderRadius: '6px', padding: '10px' }}
                    >
                      <option value="available">Available</option>
                      <option value="unavailable">Unavailable</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="reserved">Reserved</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Group>
                    <Form.Label style={{ fontWeight: '500' }}>Language</Form.Label>
                    <Form.Control
                      type="text"
                      name="language"
                      value={editFormData.language}
                      onChange={handleEditChange}
                      placeholder="e.g., English, Hindi, etc."
                      style={{ borderRadius: '6px', padding: '10px' }}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Group>
                    <Form.Label style={{ fontWeight: '500' }}>Pages</Form.Label>
                    <Form.Control
                      type="number"
                      name="pages"
                      value={editFormData.pages}
                      onChange={handleEditChange}
                      min="1"
                      style={{ borderRadius: '6px', padding: '10px' }}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Group>
                    <Form.Label style={{ fontWeight: '500' }}>Published Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="publishedDate"
                      value={editFormData.publishedDate}
                      onChange={handleEditChange}
                      style={{ borderRadius: '6px', padding: '10px' }}
                    />
                  </Form.Group>
                </div>
                
                {/* New Pricing Fields */}
                <div className="col-md-4 mb-3">
                  <Form.Group>
                    <Form.Label style={{ fontWeight: '500' }}>Purchase Rate (₹)</Form.Label>
                    <Form.Control
                      type="number"
                      name="purchaseRate"
                      value={editFormData.purchaseRate}
                      onChange={handleEditChange}
                      min="0"
                      step="0.01"
                      placeholder="Cost price"
                      style={{ borderRadius: '6px', padding: '10px' }}
                      isInvalid={!!validationErrors.purchaseRate}
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.purchaseRate}
                    </Form.Control.Feedback>
                  </Form.Group>
                </div>
                <div className="col-md-4 mb-3">
                  <Form.Group>
                    <Form.Label style={{ fontWeight: '500' }}>Selling Rate (₹)</Form.Label>
                    <Form.Control
                      type="number"
                      name="sellingRate"
                      value={editFormData.sellingRate}
                      onChange={handleEditChange}
                      min="0"
                      step="0.01"
                      placeholder="Selling price"
                      style={{ borderRadius: '6px', padding: '10px' }}
                      isInvalid={!!validationErrors.sellingRate}
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.sellingRate}
                    </Form.Control.Feedback>
                  </Form.Group>
                </div>
                <div className="col-md-4 mb-3">
                  <Form.Group>
                    <Form.Label style={{ fontWeight: '500' }}>MRP (₹)</Form.Label>
                    <Form.Control
                      type="number"
                      name="mrp"
                      value={editFormData.mrp}
                      onChange={handleEditChange}
                      min="0"
                      step="0.01"
                      placeholder="Maximum Retail Price"
                      style={{ borderRadius: '6px', padding: '10px' }}
                      isInvalid={!!validationErrors.mrp}
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.mrp}
                    </Form.Control.Feedback>
                  </Form.Group>
                </div>
                
                {/* Profit Display */}
                {editFormData.purchaseRate && editFormData.sellingRate && (
                  <div className="col-12 mb-3">
                    <div className="alert alert-info p-3">
                      <div className="row">
                        <div className="col-md-4">
                          <strong>Cost Price:</strong> ₹{parseFloat(editFormData.purchaseRate || 0).toFixed(2)}
                        </div>
                        <div className="col-md-4">
                          <strong>Selling Price:</strong> ₹{parseFloat(editFormData.sellingRate || 0).toFixed(2)}
                        </div>
                        <div className="col-md-4">
                          <strong>Profit:</strong> ₹{(parseFloat(editFormData.sellingRate || 0) - parseFloat(editFormData.purchaseRate || 0)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="col-12 mb-3">
                  <Form.Group>
                    <Form.Label style={{ fontWeight: '500' }}>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="description"
                      value={editFormData.description}
                      onChange={handleEditChange}
                      placeholder="Enter book description..."
                      style={{ borderRadius: '6px', padding: '10px' }}
                    />
                  </Form.Group>
                </div>
              </div>
            </div>
          </div>
        </Form>
      </CustomModal>

      {/* Delete Confirmation Modal */}
      <CustomModal 
        show={showDeleteModal} 
        onHide={() => setShowDeleteModal(false)} 
        size="sm"
        title="Confirm Delete"
        footer={
          <>
            <Button 
              variant="secondary" 
              onClick={() => setShowDeleteModal(false)}
              style={{ padding: '8px 20px', borderRadius: '6px' }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            
            <Button 
              variant="danger" 
              onClick={handleDelete}
              style={{ padding: '8px 20px', borderRadius: '6px' }}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.5' }}>
          Are you sure you want to delete the book{" "}
          <strong style={{ color: '#dc3545' }}>{bookToDelete?.bookTitle}</strong>? 
          This action cannot be undone.
        </p>
      </CustomModal>

      <ToastContainer />
    </MainContentPage>
  );
};

export default BookManagement;