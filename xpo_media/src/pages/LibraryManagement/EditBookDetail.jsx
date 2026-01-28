"use client";

import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import MainContentPage from "../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container } from "react-bootstrap";
import { useAuthContext } from "../../Context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ENDPOINTS } from "../../SpringBoot/config";

const EditBookDetail = () => {
  const { id } = useParams(); // Get book ID from URL
  const navigate = useNavigate();
  const { schoolId, currentAcademicYear } = useAuthContext();
  const [formData, setFormData] = useState({
    bookId: "",
    isbn: "",
    bookCoverPhoto: null,
    bookTitle: "",
    authorName: "",
    category: "",
    edition: "",
    publisher: "",
    totalCopies: "",
    bookStatus: "",
    schoolId: schoolId,
    academicYear: currentAcademicYear,
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [categories, setCategories] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const fileInputRef = useRef(null);

  // Fetch book details
  useEffect(() => {
    const fetchBookDetail = async () => {
      if (!schoolId || !id) return;

      setIsFetching(true);
      try {
        const response = await fetch(
          `${ENDPOINTS.library}/${id}?schoolId=${schoolId}`
        );
        if (!response.ok) throw new Error("Failed to fetch book details");

        const book = await response.json();
        setFormData({
          bookId: book.bookId || "",
          isbn: book.isbn || "",
          bookCoverPhoto: null,
          bookTitle: book.bookTitle || "",
          authorName: book.authorName || "",
          category: book.category || "",
          edition: book.edition || "",
          publisher: book.publisher || "",
          totalCopies: book.totalCopies || "",
          bookStatus: book.bookStatus || "",
          schoolId: schoolId,
          academicYear: book.academicYear || currentAcademicYear,
        });

        // Set existing photo if available
        if (book.bookCoverPhotoPath) {
          setExistingPhoto(book.bookCoverPhotoPath);
          setPhotoPreview(book.bookCoverPhotoPath);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch book details.");
        navigate("/book-management");
      } finally {
        setIsFetching(false);
      }
    };

    fetchBookDetail();
  }, [id, schoolId, currentAcademicYear, navigate]);

  // Fetch categories and publishers
  useEffect(() => {
    const fetchCategories = async () => {
      if (!schoolId || !currentAcademicYear) return;
      try {
        const res = await fetch(
          `${ENDPOINTS.library}/categories?schoolId=${schoolId}&year=${currentAcademicYear}`
        );
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
        const res = await fetch(
          `${ENDPOINTS.library}/publishers?schoolId=${schoolId}&year=${currentAcademicYear}`
        );
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.bookId ||
      !formData.bookTitle ||
      !formData.authorName ||
      !formData.totalCopies
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach((key) => {
        if (key === "bookCoverPhoto" && formData[key]) {
          formDataToSend.append(key, formData[key]);
        } else if (key !== "bookCoverPhoto") {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await fetch(
        `${ENDPOINTS.library}/${id}?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        {
          method: "PUT",
          body: formDataToSend,
        }
      );

      if (!response.ok) throw new Error("Failed to update book detail");

      toast.success("Book detail updated successfully!");
      setTimeout(() => {
        navigate("/book-management");
      }, 1500);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update book detail.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <MainContentPage>
        <Container fluid className="px-0">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading book details...</p>
          </div>
        </Container>
      </MainContentPage>
    );
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <div className="book-form">
          <div className="mb-4">
            <h2 className="mb-2">Library Management</h2>
            <nav className="d-flex custom-breadcrumb py-1 py-lg-3">
              <Link to="/home">Home</Link>
              <span className="separator mx-2">&gt;</span>
              <Link to="/book-management">Library Management</Link>
              <span className="separator mx-2">&gt;</span>
              <span>Edit Book</span>
            </nav>
          </div>

          <div className="form-card mt-3">
            <div className="header p-3 custom-btn-clr">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <span>
                    <b>Edit Book Detail</b>
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
                            src={photoPreview}
                            alt="Preview"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div className="text-center text-muted">
                            <div>Upload Photo</div>
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
                      <small className="text-muted mt-2 d-block">
                        Click to change photo (leave empty to keep existing)
                      </small>
                    </div>
                  </Col>

                  <Col md={12}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Book ID</Form.Label>
                          <Form.Control
                            type="text"
                            name="bookId"
                            value={formData.bookId}
                            onChange={handleInputChange}
                            required
                          />
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
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Book Title</Form.Label>
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
                          <Form.Label>Author Name</Form.Label>
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
                          <Form.Label>Total Copies</Form.Label>
                          <Form.Control
                            type="number"
                            name="totalCopies"
                            value={formData.totalCopies}
                            onChange={handleInputChange}
                            required
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
                            <option value="">Select Status</option>
                            <option value="available">Available</option>
                            <option value="unavailable">Unavailable</option>
                          </Form.Select>
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
                      disabled={isLoading}
                    >
                      {isLoading ? "Updating..." : "Update"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => navigate("/book-management")}
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

export default EditBookDetail;