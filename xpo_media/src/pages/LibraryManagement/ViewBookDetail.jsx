"use client";

import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import MainContentPage from "../../components/MainContent/MainContentPage";
import { Button, Row, Col, Container, Card } from "react-bootstrap";
import { useAuthContext } from "../../Context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ENDPOINTS } from "../../SpringBoot/config";
import { FaEdit, FaArrowLeft } from "react-icons/fa";

const ViewBookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { schoolId } = useAuthContext();
  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookDetail = async () => {
      if (!schoolId || !id) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          `${ENDPOINTS.library}/${id}?schoolId=${schoolId}`
        );
        if (!response.ok) throw new Error("Failed to fetch book details");

        const data = await response.json();
        setBook(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch book details.");
        navigate("/book-management");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookDetail();
  }, [id, schoolId, navigate]);

  if (isLoading) {
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

  if (!book) {
    return (
      <MainContentPage>
        <Container fluid className="px-0">
          <div className="text-center py-5">
            <p className="text-muted">Book not found.</p>
            <Button onClick={() => navigate("/book-management")}>
              Back to Book Management
            </Button>
          </div>
        </Container>
      </MainContentPage>
    );
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <div className="book-details-view">
          <div className="mb-4">
            <h2 className="mb-2">Library Management</h2>
            <nav className="d-flex custom-breadcrumb py-1 py-lg-3">
              <Link to="/home">Home</Link>
              <span className="separator mx-2">&gt;</span>
              <Link to="/book-management">Library Management</Link>
              <span className="separator mx-2">&gt;</span>
              <span>View Book</span>
            </nav>
          </div>

          <Card className="border-0 shadow-sm">
            <Card.Header className="custom-btn-clr p-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 text-white">
                  <strong>Book Details</strong>
                </h5>
                <div className="d-flex gap-2">
                  <Button
                    variant="light"
                    size="sm"
                    onClick={() => navigate("/book-management")}
                  >
                    <FaArrowLeft className="me-2" />
                    Back
                  </Button>
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={() => navigate(`/edit-book/${id}`)}
                  >
                    <FaEdit className="me-2" />
                    Edit
                  </Button>
                </div>
              </div>
            </Card.Header>

            <Card.Body className="p-4">
              <Row>
                <Col md={4} className="text-center mb-4 mb-md-0">
                  {book.bookCoverPhotoPath ? (
                    <img
                      src={book.bookCoverPhotoPath}
                      alt={book.bookTitle}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "400px",
                        objectFit: "contain",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "400px",
                        backgroundColor: "#f0f0f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "8px",
                        color: "#999",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "48px" }}>📚</div>
                        <div className="mt-2">No Cover Image</div>
                      </div>
                    </div>
                  )}
                </Col>

                <Col md={8}>
                  <Row className="mb-3">
                    <Col md={6}>
                      <div className="mb-3">
                        <label className="text-muted small">Book ID</label>
                        <div className="fw-bold">{book.bookId}</div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <label className="text-muted small">ISBN</label>
                        <div className="fw-bold">{book.isbn || "N/A"}</div>
                      </div>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={12}>
                      <div className="mb-3">
                        <label className="text-muted small">Book Title</label>
                        <div className="fw-bold fs-5">{book.bookTitle}</div>
                      </div>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <div className="mb-3">
                        <label className="text-muted small">Author Name</label>
                        <div className="fw-bold">{book.authorName}</div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <label className="text-muted small">Category</label>
                        <div className="fw-bold">{book.category || "N/A"}</div>
                      </div>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <div className="mb-3">
                        <label className="text-muted small">Edition</label>
                        <div className="fw-bold">{book.edition || "N/A"}</div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <label className="text-muted small">Publisher</label>
                        <div className="fw-bold">{book.publisher || "N/A"}</div>
                      </div>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <div className="mb-3">
                        <label className="text-muted small">Total Copies</label>
                        <div className="fw-bold">{book.totalCopies}</div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <label className="text-muted small">Status</label>
                        <div>
                          <span
                            className={`status-badge ${
                              book.bookStatus?.toLowerCase() === "available"
                                ? "available"
                                : "issued"
                            }`}
                            style={{
                              padding: "6px 16px",
                              borderRadius: "20px",
                              fontSize: "14px",
                            }}
                          >
                            {book.bookStatus || "N/A"}
                          </span>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <div className="mb-3">
                        <label className="text-muted small">School ID</label>
                        <div className="fw-bold">{book.schoolId}</div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <label className="text-muted small">Academic Year</label>
                        <div className="fw-bold">{book.academicYear}</div>
                      </div>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </div>
      </Container>
      <ToastContainer />
    </MainContentPage>
  );
};

export default ViewBookDetail;