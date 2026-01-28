"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainContentPage from "../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container, Table, Card, Badge, Modal, InputGroup } from "react-bootstrap";
import { useAuthContext } from "../../Context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ENDPOINTS } from "../../SpringBoot/config";
import { FaSearch, FaBook, FaUser, FaCalendar, FaEye, FaPrint, FaFileExport, FaSync, FaFilter, FaTimes } from "react-icons/fa";

const BookIssueDetails = () => {
  const { user, admin, currentAcademicYear, schoolId } = useAuthContext();
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Date range filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch all book issues
  const fetchBookIssues = async () => {
    if (!schoolId || !currentAcademicYear) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `${ENDPOINTS.library}/issues?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      );
      
      if (!response.ok) throw new Error("Failed to fetch book issues");
      
      const data = await response.json();
      setIssues(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch book issues.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId && currentAcademicYear) {
      fetchBookIssues();
    }
  }, [schoolId, currentAcademicYear]);

  // Filter issues based on search and filters
  const filteredIssues = issues.filter(issue => {
    // Search filter
    const matchesSearch = 
      issue.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.bookTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.bookId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.membershipId?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter;

    // Date filter
    let matchesDate = true;
    if (dateFilter === "today") {
      const today = new Date().toISOString().split('T')[0];
      matchesDate = issue.issuedDate === today;
    } else if (dateFilter === "thisWeek") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      matchesDate = new Date(issue.issuedDate) >= oneWeekAgo;
    } else if (dateFilter === "thisMonth") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      matchesDate = new Date(issue.issuedDate) >= oneMonthAgo;
    } else if (dateFilter === "custom" && startDate && endDate) {
      matchesDate = issue.issuedDate >= startDate && issue.issuedDate <= endDate;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleViewDetails = (issue) => {
    setSelectedIssue(issue);
    setShowDetailsModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Simple CSV export without fine
    const headers = ["Issue ID", "Admission No", "Student Name", "Class/Section", "Book ID", "Book Title", "Author", "Issued Date", "Due Date", "Returned Date", "Status"];
    const csvData = filteredIssues.map(issue => [
      issue.id,
      issue.admissionNumber,
      issue.studentName,
      `${issue.standard}-${issue.section}`,
      issue.bookId,
      issue.bookTitle,
      issue.authorName,
      issue.issuedDate,
      issue.dueDate,
      issue.returnedDate || "Not Returned",
      issue.status
    ]);

    const csvContent = [headers, ...csvData].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `book-issues-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Data exported successfully!");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter("all");
    setStartDate("");
    setEndDate("");
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "ISSUED": return "warning";
      case "RETURNED": return "success";
      case "OVERDUE": return "danger";
      default: return "secondary";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "ISSUED": return "Issued";
      case "RETURNED": return "Returned";
      case "OVERDUE": return "Overdue";
      default: return status;
    }
  };

  // Statistics without fine
  const totalIssues = issues.length;
  const issuedCount = issues.filter(i => i.status === "ISSUED").length;
  const returnedCount = issues.filter(i => i.status === "RETURNED").length;
  const overdueCount = issues.filter(i => i.status === "OVERDUE").length;

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
            <span>Book Issue Details</span>
          </nav>
        </div>

        {/* Statistics Cards - Removed Fine Card */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body className="py-3">
                <Card.Title className="text-primary display-6 fw-bold">
                  {totalIssues}
                </Card.Title>
                <Card.Text className="text-muted small">Total Issues</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body className="py-3">
                <Card.Title className="text-warning display-6 fw-bold">
                  {issuedCount}
                </Card.Title>
                <Card.Text className="text-muted small">Currently Issued</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body className="py-3">
                <Card.Title className="text-success display-6 fw-bold">
                  {returnedCount}
                </Card.Title>
                <Card.Text className="text-muted small">Returned</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body className="py-3">
                <Card.Title className="text-danger display-6 fw-bold">
                  {overdueCount}
                </Card.Title>
                <Card.Text className="text-muted small">Overdue</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card className="border-0 shadow-sm">
          <Card.Header className="p-3 custom-btn-clr d-flex justify-content-between align-items-center">
            <h5 className="m-0 text-white">Book Issue Details</h5>
            <div className="d-flex gap-2">
              <Button
                variant="outline-light"
                size="sm"
                onClick={fetchBookIssues}
                disabled={isLoading}
                title="Refresh"
              >
                <FaSync className={isLoading ? "spinning" : ""} />
              </Button>
              <Button
                variant="outline-light"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                title="Show Filters"
              >
                <FaFilter />
              </Button>
              <Button
                variant="outline-light"
                size="sm"
                onClick={handlePrint}
                title="Print"
              >
                <FaPrint />
              </Button>
              <Button
                variant="outline-light"
                size="sm"
                onClick={handleExport}
                title="Export to CSV"
              >
                <FaFileExport />
              </Button>
            </div>
          </Card.Header>

          <Card.Body className="p-4">
            {/* Search and Filters */}
            <Row className="mb-3">
              <Col md={6}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by admission number, student name, book title, or book ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="ISSUED">Issued</option>
                  <option value="RETURNED">Returned</option>
                  <option value="OVERDUE">Overdue</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="thisWeek">This Week</option>
                  <option value="thisMonth">This Month</option>
                  <option value="custom">Custom Range</option>
                </Form.Select>
              </Col>
            </Row>

            {/* Custom Date Range */}
            {dateFilter === "custom" && (
              <Row className="mb-3">
                <Col md={3}>
                  <Form.Label>From Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </Col>
                <Col md={3}>
                  <Form.Label>To Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                  />
                </Col>
                <Col md={6} className="d-flex align-items-end">
                  <Button variant="outline-secondary" onClick={clearFilters}>
                    <FaTimes className="me-2" />
                    Clear Filters
                  </Button>
                </Col>
              </Row>
            )}

            {/* Advanced Filters - Removed Fine Filter */}
            {showFilters && (
              <Row className="mb-3 p-3 bg-light rounded">
                <Col md={12}>
                  <h6 className="mb-3">Advanced Filters</h6>
                  <Row>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Class</Form.Label>
                        <Form.Select>
                          <option value="">All Classes</option>
                          <option value="1">Class 1</option>
                          <option value="2">Class 2</option>
                          {/* Add more classes as needed */}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Section</Form.Label>
                        <Form.Select>
                          <option value="">All Sections</option>
                          <option value="A">Section A</option>
                          <option value="B">Section B</option>
                          {/* Add more sections as needed */}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </Col>
              </Row>
            )}

            {/* Issues Table - Removed Fine Column */}
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading book issues...</p>
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">No book issues found.</p>
                {(searchTerm || statusFilter !== "all" || dateFilter !== "all") && (
                  <Button variant="outline-primary" onClick={clearFilters}>
                    Clear filters to see all issues
                  </Button>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <Table bordered hover className="align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th>Issue ID</th>
                      <th>Student Details</th>
                      <th>Book Details</th>
                      <th>Issue Date</th>
                      <th>Due Date</th>
                      <th>Return Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssues.map((issue) => (
                      <tr key={issue.id} className={issue.status === "OVERDUE" ? "table-danger" : ""}>
                        <td>
                          <small className="text-muted">#{issue.id}</small>
                        </td>
                        <td>
                          <div>
                            <strong>{issue.studentName}</strong>
                            <div className="small text-muted">
                              {issue.admissionNumber} • {issue.standard}-{issue.section}
                            </div>
                            <div className="small">
                              <Badge bg="info" className="me-1">{issue.membershipId}</Badge>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{issue.bookTitle}</strong>
                            <div className="small text-muted">
                              by {issue.authorName}
                            </div>
                            <div className="small">
                              ID: {issue.bookId} {issue.isbn && `• ISBN: ${issue.isbn}`}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="small">
                            {new Date(issue.issuedDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <div className="small">
                            {new Date(issue.dueDate).toLocaleDateString()}
                            {issue.isOverdue && (
                              <div className="text-danger small">
                                {issue.daysOverdue} days overdue
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="small">
                            {issue.returnedDate 
                              ? new Date(issue.returnedDate).toLocaleDateString()
                              : "-"
                            }
                          </div>
                        </td>
                        <td>
                          <Badge bg={getStatusVariant(issue.status)}>
                            {getStatusText(issue.status)}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => handleViewDetails(issue)}
                            title="View Details"
                          >
                            <FaEye />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            {/* Summary */}
            {filteredIssues.length > 0 && (
              <div className="mt-3 p-3 bg-light rounded">
                <Row>
                  <Col md={6}>
                    <strong>Showing {filteredIssues.length} of {totalIssues} issues</strong>
                  </Col>
                  <Col md={6} className="text-end">
                    <small className="text-muted">
                      Last updated: {new Date().toLocaleString()}
                    </small>
                  </Col>
                </Row>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* Issue Details Modal - Removed Fine Information */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Book Issue Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedIssue && (
            <Row>
              <Col md={6}>
                <Card className="mb-3">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">Student Information</h6>
                  </Card.Header>
                  <Card.Body>
                    <table className="table table-sm table-borderless">
                      <tbody>
                        <tr>
                          <td><strong>Admission Number:</strong></td>
                          <td>{selectedIssue.admissionNumber}</td>
                        </tr>
                        <tr>
                          <td><strong>Student Name:</strong></td>
                          <td>{selectedIssue.studentName}</td>
                        </tr>
                        <tr>
                          <td><strong>Class/Section:</strong></td>
                          <td>{selectedIssue.standard} - {selectedIssue.section}</td>
                        </tr>
                        <tr>
                          <td><strong>Membership ID:</strong></td>
                          <td><Badge bg="info">{selectedIssue.membershipId}</Badge></td>
                        </tr>
                      </tbody>
                    </table>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="mb-3">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">Book Information</h6>
                  </Card.Header>
                  <Card.Body>
                    <table className="table table-sm table-borderless">
                      <tbody>
                        <tr>
                          <td><strong>Book ID:</strong></td>
                          <td>{selectedIssue.bookId}</td>
                        </tr>
                        <tr>
                          <td><strong>Title:</strong></td>
                          <td>{selectedIssue.bookTitle}</td>
                        </tr>
                        <tr>
                          <td><strong>Author:</strong></td>
                          <td>{selectedIssue.authorName}</td>
                        </tr>
                        <tr>
                          <td><strong>ISBN:</strong></td>
                          <td>{selectedIssue.isbn || "N/A"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={12}>
                <Card className="mb-3">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">Transaction Details</h6>
                  </Card.Header>
                  <Card.Body>
                    <table className="table table-sm table-borderless">
                      <tbody>
                        <tr>
                          <td><strong>Issue Date:</strong></td>
                          <td>{new Date(selectedIssue.issuedDate).toLocaleDateString()}</td>
                        </tr>
                        <tr>
                          <td><strong>Due Date:</strong></td>
                          <td>{new Date(selectedIssue.dueDate).toLocaleDateString()}</td>
                        </tr>
                        <tr>
                          <td><strong>Return Date:</strong></td>
                          <td>
                            {selectedIssue.returnedDate 
                              ? new Date(selectedIssue.returnedDate).toLocaleDateString()
                              : "Not Returned"
                            }
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Status:</strong></td>
                          <td>
                            <Badge bg={getStatusVariant(selectedIssue.status)}>
                              {getStatusText(selectedIssue.status)}
                            </Badge>
                          </td>
                        </tr>
                        {selectedIssue.remarks && (
                          <tr>
                            <td><strong>Remarks:</strong></td>
                            <td>{selectedIssue.remarks}</td>
                          </tr>
                        )}
                        {selectedIssue.isOverdue && (
                          <tr>
                            <td><strong>Days Overdue:</strong></td>
                            <td className="text-danger">{selectedIssue.daysOverdue} days</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            <FaPrint className="me-2" />
            Print Details
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer />

      {/* Print Styles */}
      <style>
        {`
          @media print {
            .custom-btn-clr, .btn, .modal-footer, .breadcrumb, .card-header.bg-light {
              display: none !important;
            }
            .table-responsive {
              overflow: visible !important;
            }
            .card {
              border: 1px solid #000 !important;
            }
            .badge {
              border: 1px solid #000 !important;
              color: #000 !important;
              background: none !important;
            }
          }
          .spinning {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
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
        `}
      </style>
    </MainContentPage>
  );
};

export default BookIssueDetails;