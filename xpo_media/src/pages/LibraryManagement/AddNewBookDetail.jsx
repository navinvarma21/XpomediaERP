"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import MainContentPage from "../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container } from "react-bootstrap";
import { useAuthContext } from "../../Context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ENDPOINTS } from "../../SpringBoot/config";

const AddNewBookDetail = () => {
  const { user, admin, currentAcademicYear, schoolId } = useAuthContext();
  const [formData, setFormData] = useState({
    bookId: "", // Will be auto-generated
    isbn: "",
    bookCoverPhoto: null,
    bookTitle: "",
    authorName: "",
    category: "",
    edition: "",
    publisher: "",
    totalCopies: "",
    availableCopies: "",
    bookStatus: "available",
    language: "",
    pages: "",
    publishedDate: "",
    description: "",
    purchaseRate: "",
    sellingRate: "",
    mrp: "",
    schoolId: schoolId,
    academicYear: currentAcademicYear,
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const [categories, setCategories] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const fileInputRef = useRef(null);

  // Generate auto Book ID
  const generateBookId = async () => {
    if (!schoolId || !currentAcademicYear) {
      toast.error("School ID and Academic Year are required to generate Book ID");
      return;
    }
    
    setIsGeneratingId(true);
    try {
      const response = await fetch(
        `${ENDPOINTS.library}/generate-book-id?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to generate Book ID");
      }
      
      const data = await response.json();
      
      // Check if bookId contains XPO and regenerate if needed
      let bookId = data.bookId;
      if (bookId.includes("XPO")) {
        // Generate alternative ID
        const timestamp = Date.now().toString().slice(-6);
        const schoolCode = schoolId.substring(0, 4).toUpperCase();
        const yearCode = currentAcademicYear.substring(2, 4);
        bookId = `BK-${schoolCode}-${yearCode}-${timestamp}`;
      }
      
      setFormData(prev => ({
        ...prev,
        bookId: bookId
      }));
      toast.success("Book ID generated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate Book ID. Please try again.");
      // Fallback: Generate a simple ID without XPO
      const timestamp = Date.now().toString().slice(-6);
      const schoolCode = schoolId.length >= 4 ? schoolId.substring(0, 4).toUpperCase() : "SCHL";
      const yearCode = currentAcademicYear ? currentAcademicYear.substring(2, 4) : "24";
      const fallbackId = `BK-${schoolCode}-${yearCode}-${timestamp}`;
      setFormData(prev => ({
        ...prev,
        bookId: fallbackId
      }));
    } finally {
      setIsGeneratingId(false);
    }
  };

  // Auto-generate Book ID on component mount
  useEffect(() => {
    if (schoolId && currentAcademicYear && !formData.bookId) {
      generateBookId();
    }
  }, [schoolId, currentAcademicYear]);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!schoolId || !currentAcademicYear) return;
      try {
        const res = await fetch(`${ENDPOINTS.library}/categories?schoolId=${schoolId}&year=${currentAcademicYear}`);
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch categories.");
      }
    };

    const fetchPublishers = async () => {
      if (!schoolId || !currentAcademicYear) return;
      try {
        const res = await fetch(`${ENDPOINTS.library}/publishers?schoolId=${schoolId}&year=${currentAcademicYear}`);
        if (!res.ok) throw new Error("Failed to fetch publishers");
        const data = await res.json();
        setPublishers(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch publishers.");
      }
    };

    fetchCategories();
    fetchPublishers();
  }, [schoolId, currentAcademicYear]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear validation error for this field
    setValidationErrors(prev => ({ ...prev, [name]: null }));
    
    // Update form data
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validate pricing fields
  const validatePricing = () => {
    const errors = {};
    
    // Convert to numbers for comparison
    const purchaseRate = parseFloat(formData.purchaseRate) || 0;
    const sellingRate = parseFloat(formData.sellingRate) || 0;
    const mrp = parseFloat(formData.mrp) || 0;
    
    // Only validate if values are entered
    if (formData.purchaseRate && formData.sellingRate && purchaseRate > sellingRate) {
      errors.sellingRate = "Selling Rate cannot be less than Purchase Rate";
    }
    
    if (formData.sellingRate && formData.mrp && sellingRate > mrp) {
      errors.mrp = "MRP cannot be less than Selling Rate";
    }
    
    if (formData.purchaseRate && formData.mrp && purchaseRate > mrp) {
      errors.mrp = "MRP cannot be less than Purchase Rate";
    }
    
    // Validate non-negative values
    if (formData.purchaseRate && purchaseRate < 0) {
      errors.purchaseRate = "Purchase Rate cannot be negative";
    }
    
    if (formData.sellingRate && sellingRate < 0) {
      errors.sellingRate = "Selling Rate cannot be negative";
    }
    
    if (formData.mrp && mrp < 0) {
      errors.mrp = "MRP cannot be negative";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePhotoChange = (e) => {
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
      
      setFormData((prev) => ({
        ...prev,
        bookCoverPhoto: file,
      }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current.click();
  };

  const handleRegenerateId = () => {
    generateBookId();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous validation errors
    setValidationErrors({});
    
    // Validation
    if (!formData.bookId || !formData.bookTitle || !formData.authorName || !formData.totalCopies) {
      toast.error("Please fill in all required fields.");
      return;
    }
    
    if (formData.availableCopies && Number(formData.availableCopies) > Number(formData.totalCopies)) {
      toast.error("Available copies cannot exceed total copies.");
      return;
    }
    
    // Validate pricing
    if (!validatePricing()) {
      Object.values(validationErrors).forEach(error => {
        if (error) toast.error(error);
      });
      return;
    }
    
    // Validate Book ID doesn't contain XPO
    if (formData.bookId.toUpperCase().includes("XPO")) {
      toast.error("Book ID cannot contain 'XPO'. Please regenerate Book ID.");
      return;
    }

    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "bookCoverPhoto" && formData[key]) {
          formDataToSend.append(key, formData[key]);
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await fetch(ENDPOINTS.library, {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add book detail");
      }
      
      toast.success("Book detail added successfully!");
      
      // Reset form
      setFormData({
        bookId: "",
        isbn: "",
        bookCoverPhoto: null,
        bookTitle: "",
        authorName: "",
        category: "",
        edition: "",
        publisher: "",
        totalCopies: "",
        availableCopies: "",
        bookStatus: "available",
        language: "",
        pages: "",
        publishedDate: "",
        description: "",
        purchaseRate: "",
        sellingRate: "",
        mrp: "",
        schoolId: schoolId,
        academicYear: currentAcademicYear,
      });
      setPhotoPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
      
      // Generate new Book ID for next entry
      generateBookId();
      
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to add book detail.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProfit = () => {
    if (!formData.purchaseRate || !formData.sellingRate) return null;
    const purchase = parseFloat(formData.purchaseRate);
    const selling = parseFloat(formData.sellingRate);
    if (isNaN(purchase) || isNaN(selling) || purchase === 0) return null;
    
    const profit = selling - purchase;
    const profitPercentage = ((profit / purchase) * 100).toFixed(2);
    return { profit, profitPercentage };
  };

  const profitInfo = calculateProfit();

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <div className="book-form">
          <div className="mb-4">
            <h2 className="mb-2">Library Management</h2>
            <nav className="d-flex custom-breadcrumb py-1 py-lg-3">
              <Link to="/home">Home</Link>
              <span className="separator mx-2">&gt;</span>
              <div to="/library">Library Management</div>
              <span className="separator mx-2">&gt;</span>
              <span>Add Book</span>
            </nav>
          </div>

          <div className="form-card mt-3">
            <div className="header p-3 custom-btn-clr">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <span>
                    <b>Add New Book Detail</b>
                  </span>
                </div>
              </div>
            </div>

            <div className="content-wrapper p-4">
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={12}>
                    <div className="text-center mb-4">
                      <h6>Book Cover Photo</h6>
                      <div
                        className="photo-upload-circle mx-auto"
                        onClick={handlePhotoClick}
                        style={{
                          width: "150px",
                          height: "150px",
                          border: "2px dashed #ccc",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          overflow: "hidden",
                          backgroundColor: "#f8f9fa",
                        }}
                      >
                        {photoPreview ? (
                          <img
                            src={photoPreview || "/placeholder.svg"}
                            alt="Preview"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div className="text-center text-muted">
                            <div>Upload Photo</div>
                            <small>Max 5MB</small>
                          </div>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        style={{ display: "none" }}
                      />
                      <small className="text-muted d-block mt-2">Supported: JPG, PNG, JPEG (Max 5MB)</small>
                    </div>
                  </Col>

                  <Col md={12}>
                    <Row>
                      {/* Book ID Section */}
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Book ID *</Form.Label>
                          <div className="d-flex gap-2">
                            <Form.Control
                              type="text"
                              name="bookId"
                              value={formData.bookId}
                              onChange={handleInputChange}
                              required
                              readOnly
                              placeholder="Auto-generated"
                              className={formData.bookId.toUpperCase().includes("XPO") ? "is-invalid" : ""}
                            />
                            <Button
                              variant="outline-secondary"
                              onClick={handleRegenerateId}
                              disabled={isGeneratingId}
                              title="Regenerate Book ID"
                            >
                              {isGeneratingId ? (
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                              ) : "🔄"}
                            </Button>
                          </div>
                          <small className="text-muted">Auto-generated unique identifier</small>
                          {formData.bookId.toUpperCase().includes("XPO") && (
                            <div className="text-danger small">
                              Book ID contains "XPO". Please regenerate.
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>ISBN</Form.Label>
                          <Form.Control
                            type="text"
                            name="isbn"
                            value={formData.isbn}
                            onChange={handleInputChange}
                            placeholder="e.g., 978-3-16-148410-0"
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Book Title *</Form.Label>
                          <Form.Control
                            type="text"
                            name="bookTitle"
                            value={formData.bookTitle}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Author Name *</Form.Label>
                          <Form.Control
                            type="text"
                            name="authorName"
                            value={formData.authorName}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Category</Form.Label>
                          <Form.Select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                          >
                            <option value="">Select Category</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.name}>
                                {cat.name}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Edition</Form.Label>
                          <Form.Control
                            type="text"
                            name="edition"
                            value={formData.edition}
                            onChange={handleInputChange}
                            placeholder="e.g., 1st, 2nd, Revised"
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Publisher</Form.Label>
                          <Form.Select
                            name="publisher"
                            value={formData.publisher}
                            onChange={handleInputChange}
                          >
                            <option value="">Select Publisher</option>
                            {publishers.map((pub) => (
                              <option key={pub.id} value={pub.name}>
                                {pub.name}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Total Copies *</Form.Label>
                          <Form.Control
                            type="number"
                            name="totalCopies"
                            value={formData.totalCopies}
                            onChange={handleInputChange}
                            min="1"
                            required
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Available Copies</Form.Label>
                          <Form.Control
                            type="number"
                            name="availableCopies"
                            value={formData.availableCopies}
                            onChange={handleInputChange}
                            min="0"
                            placeholder="Defaults to Total Copies"
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Book Status</Form.Label>
                          <Form.Select
                            name="bookStatus"
                            value={formData.bookStatus}
                            onChange={handleInputChange}
                          >
                            <option value="available">Available</option>
                            <option value="unavailable">Unavailable</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="reserved">Reserved</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Language</Form.Label>
                          <Form.Control
                            type="text"
                            name="language"
                            value={formData.language}
                            onChange={handleInputChange}
                            placeholder="e.g., English, Hindi, etc."
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Pages</Form.Label>
                          <Form.Control
                            type="number"
                            name="pages"
                            value={formData.pages}
                            onChange={handleInputChange}
                            min="1"
                            placeholder="e.g., 250"
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Published Date</Form.Label>
                          <Form.Control
                            type="date"
                            name="publishedDate"
                            value={formData.publishedDate}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                      
                      {/* New Pricing Fields */}
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Purchase Rate (₹)</Form.Label>
                          <Form.Control
                            type="number"
                            name="purchaseRate"
                            value={formData.purchaseRate}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            placeholder="e.g., 150.00"
                            isInvalid={!!validationErrors.purchaseRate}
                          />
                          <Form.Control.Feedback type="invalid">
                            {validationErrors.purchaseRate}
                          </Form.Control.Feedback>
                          <small className="text-muted">Cost price per copy</small>
                        </Form.Group>
                      </Col>
                      
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Selling Rate (₹)</Form.Label>
                          <Form.Control
                            type="number"
                            name="sellingRate"
                            value={formData.sellingRate}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            placeholder="e.g., 200.00"
                            isInvalid={!!validationErrors.sellingRate}
                          />
                          <Form.Control.Feedback type="invalid">
                            {validationErrors.sellingRate}
                          </Form.Control.Feedback>
                          <small className="text-muted">Selling price per copy</small>
                        </Form.Group>
                      </Col>
                      
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>MRP (₹)</Form.Label>
                          <Form.Control
                            type="number"
                            name="mrp"
                            value={formData.mrp}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            placeholder="e.g., 250.00"
                            isInvalid={!!validationErrors.mrp}
                          />
                          <Form.Control.Feedback type="invalid">
                            {validationErrors.mrp}
                          </Form.Control.Feedback>
                          <small className="text-muted">Maximum Retail Price</small>
                        </Form.Group>
                      </Col>
                      
                      {/* Profit Display */}
                      {profitInfo && (
                        <Col md={12}>
                          <div className="alert alert-info p-2 mb-3">
                            <div className="d-flex justify-content-between">
                              <span><strong>Profit per Copy:</strong> ₹{profitInfo.profit.toFixed(2)}</span>
                              <span><strong>Profit Margin:</strong> {profitInfo.profitPercentage}%</span>
                            </div>
                          </div>
                        </Col>
                      )}
                      
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Description</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Enter book description..."
                            maxLength={1000}
                          />
                          <small className="text-muted">{formData.description.length}/1000 characters</small>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Col>
                </Row>

                <Row className="mt-4">
                  <Col className="d-flex justify-content-center gap-3">
                    <Button 
                      type="submit" 
                      className="custom-btn-clr" 
                      disabled={isLoading || isGeneratingId || formData.bookId.toUpperCase().includes("XPO")}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : "Save Book"}
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => {
                        if (window.confirm("Are you sure you want to cancel? All unsaved changes will be lost.")) {
                          window.history.back();
                        }
                      }}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </Col>
                </Row>
              </Form>
            </div>
          </div>
        </div>
      </Container>
      <ToastContainer />
    </MainContentPage>
  );
};

export default AddNewBookDetail;