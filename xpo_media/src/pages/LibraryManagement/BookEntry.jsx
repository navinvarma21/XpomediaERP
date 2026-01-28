"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainContentPage from "../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container, Card, Modal, Table, Badge, Alert } from "react-bootstrap";
import { useAuthContext } from "../../Context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ENDPOINTS } from "../../SpringBoot/config";
import { FaSearch, FaBook, FaUser, FaCalendar, FaIdCard, FaCheck, FaTimes, FaExclamationTriangle, FaHistory } from "react-icons/fa";

const BookEntry = () => {
  const { user, admin, currentAcademicYear, schoolId } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showMemberSearch, setShowMemberSearch] = useState(false);
  const [showBookSearch, setShowBookSearch] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [bookSearchTerm, setBookSearchTerm] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    admissionNumber: "",
    studentName: "",
    standard: "",
    section: "",
    membershipId: "",
    bookId: "",
    bookTitle: "",
    authorName: "",
    isbn: "",
    issuedDate: new Date().toISOString().split('T')[0],
    dueDate: "",
    status: "ISSUED",
    academicYear: currentAcademicYear
  });

  // Fetch library members
  const fetchLibraryMembers = async () => {
    if (!schoolId || !currentAcademicYear) return;
    
    try {
      const response = await fetch(
        `${ENDPOINTS.library}/members?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error("Error fetching library members:", error);
    }
  };

  // Fetch books
  const fetchBooks = async () => {
    if (!schoolId || !currentAcademicYear) return;
    
    try {
      const response = await fetch(
        `${ENDPOINTS.library}?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setBooks(data);
      }
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

  // Fetch issued books
  const fetchIssuedBooks = async () => {
    if (!schoolId || !currentAcademicYear) return;
    
    try {
      const response = await fetch(
        `${ENDPOINTS.library}/issues/issued?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setIssuedBooks(data);
      }
    } catch (error) {
      console.error("Error fetching issued books:", error);
    }
  };

  useEffect(() => {
    if (schoolId && currentAcademicYear) {
      fetchLibraryMembers();
      fetchBooks();
      fetchIssuedBooks();
    }
  }, [schoolId, currentAcademicYear]);

  // Filter members based on search
  const filteredMembers = members.filter(member => 
    member.admissionNumber?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    member.studentName?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    member.membershipId?.toLowerCase().includes(memberSearchTerm.toLowerCase())
  );

  // Filter books based on search
  const filteredBooks = books.filter(book => 
    book.bookId?.toLowerCase().includes(bookSearchTerm.toLowerCase()) ||
    book.bookTitle?.toLowerCase().includes(bookSearchTerm.toLowerCase()) ||
    book.authorName?.toLowerCase().includes(bookSearchTerm.toLowerCase()) ||
    book.isbn?.toLowerCase().includes(bookSearchTerm.toLowerCase())
  ).filter(book => book.availableCopies > 0); // Only show available books

  // Handle member selection
  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    setFormData(prev => ({
      ...prev,
      admissionNumber: member.admissionNumber,
      studentName: member.studentName,
      standard: member.standard,
      section: member.section,
      membershipId: member.membershipId
    }));
    setShowMemberSearch(false);
    setMemberSearchTerm("");
  };

  // Handle book selection
  const handleBookSelect = (book) => {
    setSelectedBook(book);
    setFormData(prev => ({
      ...prev,
      bookId: book.bookId,
      bookTitle: book.bookTitle,
      authorName: book.authorName,
      isbn: book.isbn || ""
    }));
    setShowBookSearch(false);
    setBookSearchTerm("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-calculate due date (14 days from issued date)
    if (name === "issuedDate" && value) {
      const dueDate = calculateDueDate(value, 14);
      setFormData(prev => ({ ...prev, dueDate }));
    }
  };

  const handleIssueBook = async (e) => {
    e.preventDefault();
    
    if (!formData.admissionNumber || !formData.bookId || !formData.issuedDate || !formData.dueDate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Check if member is active
    if (selectedMember && selectedMember.membershipStatus !== "ACTIVE") {
      toast.error("Cannot issue book. Member membership is expired.");
      return;
    }

    // Check if book is available
    if (selectedBook && selectedBook.availableCopies <= 0) {
      toast.error("Book is not available for issue.");
      return;
    }

    setIsLoading(true);
    try {
      const issueData = {
        ...formData,
        academicYear: currentAcademicYear
      };

      console.log("Issuing book with data:", issueData);

      const response = await fetch(
        `${ENDPOINTS.library}/issues?schoolId=${schoolId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(issueData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to issue book");
      }

      const newIssue = await response.json();
      toast.success("Book issued successfully!");
      
      // Reset form and refresh data
      resetForm();
      await fetchBooks(); // Refresh books to update available copies
      await fetchIssuedBooks(); // Refresh issued books list
      
      console.log("Book issued successfully:", newIssue);
    } catch (error) {
      console.error("Error issuing book:", error);
      toast.error(error.message || "Failed to issue book.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturnBook = async (issueId) => {
    if (!window.confirm("Are you sure you want to return this book?")) {
      return;
    }

    setIsLoading(true);
    try {
      console.log("Returning book with issue ID:", issueId);

      const response = await fetch(
        `${ENDPOINTS.library}/issues/${issueId}/return?schoolId=${schoolId}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to return book");
      }

      const returnedIssue = await response.json();
      toast.success("Book returned successfully!");
      
      // Refresh data
      await fetchBooks(); // Refresh books to update available copies
      await fetchIssuedBooks(); // Refresh issued books list
      
      console.log("Book returned successfully:", returnedIssue);
    } catch (error) {
      console.error("Error returning book:", error);
      toast.error(error.message || "Failed to return book.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      admissionNumber: "",
      studentName: "",
      standard: "",
      section: "",
      membershipId: "",
      bookId: "",
      bookTitle: "",
      authorName: "",
      isbn: "",
      issuedDate: new Date().toISOString().split('T')[0],
      dueDate: "",
      status: "ISSUED",
      academicYear: currentAcademicYear
    });
    setSelectedMember(null);
    setSelectedBook(null);
    setMemberSearchTerm("");
    setBookSearchTerm("");
  };

  const calculateDueDate = (issuedDate, days = 14) => {
    if (!issuedDate) return "";
    const date = new Date(issuedDate);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "ISSUED": return "warning";
      case "RETURNED": return "success";
      case "OVERDUE": return "danger";
      default: return "secondary";
    }
  };

  const isMemberSelected = selectedMember && selectedMember.membershipStatus === "ACTIVE";
  const isBookSelected = selectedBook && selectedBook.availableCopies > 0;

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <div className="mb-4">
          <h2 className="mb-2">Library Management</h2>
          <nav className="d-flex custom-breadcrumb py-1 py-lg-3">
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <Link to="/library">Library Management</Link>
            <span className="separator mx-2">&gt;</span>
            <span>Book Entry</span>
          </nav>
        </div>

        {/* Stats Cards */}
        <Row className="mb-4">
          <Col md={4}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body className="py-4">
                <Card.Title className="text-primary display-6 fw-bold">
                  {issuedBooks.filter(b => b.status === "ISSUED").length}
                </Card.Title>
                <Card.Text className="text-muted">Currently Issued</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body className="py-4">
                <Card.Title className="text-warning display-6 fw-bold">
                  {issuedBooks.filter(b => b.status === "OVERDUE").length}
                </Card.Title>
                <Card.Text className="text-muted">Overdue Books</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body className="py-4">
                <Card.Title className="text-success display-6 fw-bold">
                  {members.filter(m => m.membershipStatus === "ACTIVE").length}
                </Card.Title>
                <Card.Text className="text-muted">Active Members</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          {/* Book Issue Form */}
          <Col md={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="p-3 custom-btn-clr">
                <h5 className="m-0 text-white">Issue Book</h5>
              </Card.Header>
              <Card.Body className="p-4">
                <Form onSubmit={handleIssueBook}>
                  {/* Member Selection */}
                  <Form.Group className="mb-3">
                    <Form.Label>Select Library Member *</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type="text"
                        placeholder="Click to search library members..."
                        value={formData.admissionNumber ? `${formData.admissionNumber} - ${formData.studentName}` : ""}
                        onClick={() => setShowMemberSearch(true)}
                        readOnly
                        className="cursor-pointer"
                      />
                      <FaSearch className="position-absolute top-50 end-0 translate-middle-y me-3 text-muted" />
                    </div>
                  </Form.Group>

                  {selectedMember && (
                    <Alert variant={selectedMember.membershipStatus === "ACTIVE" ? "success" : "danger"} className="py-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{selectedMember.studentName}</strong>
                          <div className="small">
                            {selectedMember.admissionNumber} • {selectedMember.standard}-{selectedMember.section}
                          </div>
                          <div className="small">
                            Membership: <Badge bg={selectedMember.membershipStatus === "ACTIVE" ? "success" : "danger"}>
                              {selectedMember.membershipStatus}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(null);
                            setFormData(prev => ({
                              ...prev,
                              admissionNumber: "",
                              studentName: "",
                              standard: "",
                              section: "",
                              membershipId: ""
                            }));
                          }}
                        >
                          <FaTimes />
                        </Button>
                      </div>
                    </Alert>
                  )}

                  {/* Book Selection */}
                  <Form.Group className="mb-3">
                    <Form.Label>Select Book *</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type="text"
                        placeholder="Click to search available books..."
                        value={formData.bookTitle || ""}
                        onClick={() => setShowBookSearch(true)}
                        readOnly
                        className="cursor-pointer"
                      />
                      <FaSearch className="position-absolute top-50 end-0 translate-middle-y me-3 text-muted" />
                    </div>
                  </Form.Group>

                  {selectedBook && (
                    <Alert variant="info" className="py-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{selectedBook.bookTitle}</strong>
                          <div className="small">
                            by {selectedBook.authorName} • ID: {selectedBook.bookId}
                          </div>
                          <div className="small">
                            Available: <Badge bg="success">{selectedBook.availableCopies} copies</Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => {
                            setSelectedBook(null);
                            setFormData(prev => ({
                              ...prev,
                              bookId: "",
                              bookTitle: "",
                              authorName: "",
                              isbn: ""
                            }));
                          }}
                        >
                          <FaTimes />
                        </Button>
                      </div>
                    </Alert>
                  )}

                  {/* Dates */}
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Issued Date *</Form.Label>
                        <Form.Control
                          type="date"
                          name="issuedDate"
                          value={formData.issuedDate}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Due Date *</Form.Label>
                        <Form.Control
                          type="date"
                          name="dueDate"
                          value={formData.dueDate}
                          onChange={handleInputChange}
                          required
                          min={formData.issuedDate}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Action Buttons */}
                  <div className="d-flex gap-2">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isLoading || !isMemberSelected || !isBookSelected}
                      className="d-flex align-items-center gap-2 flex-grow-1"
                    >
                      {isLoading ? (
                        <>
                          <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          Issuing...
                        </>
                      ) : (
                        <>
                          <FaBook />
                          Issue Book
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={resetForm}
                      disabled={isLoading}
                    >
                      Reset
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Currently Issued Books */}
          <Col md={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="p-3 custom-btn-clr d-flex justify-content-between align-items-center">
                <h5 className="m-0 text-white">Currently Issued Books</h5>
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={fetchIssuedBooks}
                  disabled={isLoading}
                >
                  <FaSearch />
                </Button>
              </Card.Header>
              <Card.Body className="p-0">
                {issuedBooks.filter(b => b.status === "ISSUED" || b.status === "OVERDUE").length === 0 ? (
                  <div className="text-center p-4 text-muted">
                    No books currently issued
                  </div>
                ) : (
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <Table bordered hover className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Student</th>
                          <th>Book</th>
                          <th>Due Date</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {issuedBooks
                          .filter(b => b.status === "ISSUED" || b.status === "OVERDUE")
                          .map((issue) => (
                            <tr key={issue.id} className={issue.status === "OVERDUE" ? "table-danger" : ""}>
                              <td>
                                <div className="small">
                                  <strong>{issue.studentName}</strong>
                                  <div>{issue.admissionNumber}</div>
                                </div>
                              </td>
                              <td>
                                <div className="small">
                                  <strong>{issue.bookTitle}</strong>
                                  <div>ID: {issue.bookId}</div>
                                </div>
                              </td>
                              <td>
                                <div className="small">
                                  {new Date(issue.dueDate).toLocaleDateString()}
                                  {issue.isOverdue && (
                                    <div className="text-danger">
                                      <FaExclamationTriangle className="me-1" />
                                      {issue.daysOverdue} days overdue
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <Badge bg={getStatusVariant(issue.status)}>
                                  {issue.status}
                                </Badge>
                              </td>
                              <td>
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => handleReturnBook(issue.id)}
                                  disabled={isLoading}
                                >
                                  <FaCheck />
                                </Button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Member Search Modal */}
      <Modal show={showMemberSearch} onHide={() => setShowMemberSearch(false)} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Search Library Members</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              placeholder="Search by admission number, name, or membership ID..."
              value={memberSearchTerm}
              onChange={(e) => setMemberSearchTerm(e.target.value)}
              autoFocus
            />
          </Form.Group>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {filteredMembers.length === 0 ? (
              <div className="text-center p-4 text-muted">
                {memberSearchTerm ? `No members found matching "${memberSearchTerm}"` : "No library members available"}
              </div>
            ) : (
              <Table bordered hover>
                <thead>
                  <tr>
                    <th>Admission No.</th>
                    <th>Student Name</th>
                    <th>Class/Section</th>
                    <th>Membership ID</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id}>
                      <td>{member.admissionNumber}</td>
                      <td>{member.studentName}</td>
                      <td>{member.standard} - {member.section}</td>
                      <td>
                        <small className="text-muted">{member.membershipId}</small>
                      </td>
                      <td>
                        <Badge bg={member.membershipStatus === "ACTIVE" ? "success" : "danger"}>
                          {member.membershipStatus}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleMemberSelect(member)}
                          disabled={member.membershipStatus !== "ACTIVE"}
                        >
                          Select
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </Modal.Body>
      </Modal>

      {/* Book Search Modal */}
      <Modal show={showBookSearch} onHide={() => setShowBookSearch(false)} size="lg">
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>Search Available Books</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              placeholder="Search by book ID, title, author, or ISBN..."
              value={bookSearchTerm}
              onChange={(e) => setBookSearchTerm(e.target.value)}
              autoFocus
            />
          </Form.Group>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {filteredBooks.length === 0 ? (
              <div className="text-center p-4 text-muted">
                {bookSearchTerm ? `No available books found matching "${bookSearchTerm}"` : "No books available"}
              </div>
            ) : (
              <Table bordered hover>
                <thead>
                  <tr>
                    <th>Book ID</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Available</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((book) => (
                    <tr key={book.id}>
                      <td>{book.bookId}</td>
                      <td>{book.bookTitle}</td>
                      <td>{book.authorName}</td>
                      <td>
                        <Badge bg="success">
                          {book.availableCopies} copies
                        </Badge>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleBookSelect(book)}
                        >
                          Select
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </Modal.Body>
      </Modal>

      <ToastContainer />

      <style>
        {`
          .custom-btn-clr {
            background-color: #0B3D7B;
            color: white;
          }
          .custom-breadcrumb {
            background-color: #f8f9fa;
            border-radius: 0.375rem;
            padding: 0.75rem 1rem;
          }
          .custom-breadcrumb a {
            color: #0B3D7B;
            text-decoration: none;
            font-weight: 500;
          }
          .custom-breadcrumb .separator {
            color: #6c757d;
          }
          .cursor-pointer {
            cursor: pointer;
          }
        `}
      </style>
    </MainContentPage>
  );
};

export default BookEntry;