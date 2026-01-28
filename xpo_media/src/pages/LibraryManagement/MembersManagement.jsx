"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Form, Button, Card, Container, Table, Modal } from "react-bootstrap"
import { FaFilter, FaEye } from "react-icons/fa"

const MembersManagement = () => {
  const [showFilter, setShowFilter] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterData, setFilterData] = useState({
    class: "",
    section: "",
    dateOfBirth: "",
    enrollmentDate: "",
    feeStatus: "all",
  })

  const sampleData = [
    {
      admissionNumber: "AFB1246EDF",
      studentName: "A.Ramachandhiran",
      class: "10th",
      section: "A",
      bookTitle: "The Alchemist",
      issuedDate: "02-01-2024",
      submissionDate: "02-02-2024",
      bookId: "016",
      status: "Submitted",
    },
    {
      admissionNumber: "AFB1246EDF",
      studentName: "H.Jayakumar",
      class: "8th",
      section: "F",
      bookTitle: "Atomic Habits",
      issuedDate: "11-04-2024",
      submissionDate: "12-05-2024",
      bookId: "245",
      status: "Unsubmitted",
    },
    {
      admissionNumber: "AFB1246EDF",
      studentName: "D.Ganesh",
      class: "2nd",
      section: "B",
      bookTitle: "Rich Dad Poor Dad",
      issuedDate: "16-09-2024",
      submissionDate: "17-10-2024",
      bookId: "321",
      status: "Submitted",
    },
    {
      admissionNumber: "AFB1246EDF",
      studentName: "K.Kalim",
      class: "4th",
      section: "C",
      bookTitle: "The Psychology of Money",
      issuedDate: "09-02-2024",
      submissionDate: "10-03-2024",
      bookId: "364",
      status: "Submitted",
    },
    {
      admissionNumber: "AFB1246EDF",
      studentName: "M.Yuvashri",
      class: "1st",
      section: "G",
      bookTitle: "Sapiens",
      issuedDate: "15-10-2024",
      submissionDate: "15-11-2024",
      bookId: "245",
      status: "Unsubmitted",
    },
    {
      admissionNumber: "AFB1246EDF",
      studentName: "E.Ellamaran",
      class: "8th",
      section: "D",
      bookTitle: "1984",
      issuedDate: "06-05-2024",
      submissionDate: "07-06-2024",
      bookId: "128",
      status: "Submitted",
    },
    {
      admissionNumber: "AFB1246EDF",
      studentName: "S.Vignesh Kumar",
      class: "12th",
      section: "A",
      bookTitle: "The Lean Startup",
      issuedDate: "14-08-2024",
      submissionDate: "15-09-2024",
      bookId: "452",
      status: "Submitted",
    },
    {
      admissionNumber: "AFB1246EDF",
      studentName: "B.Bharath",
      class: "12th",
      section: "C",
      bookTitle: "The Subtle Art",
      issuedDate: "17-06-2024",
      submissionDate: "16-07-2024",
      bookId: "321",
      status: "Unsubmitted",
    },
  ]

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilterData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFilterSubmit = () => {
    console.log("Applied Filters:", filterData)
    setShowFilter(false)
  }

  const handleFilterReset = () => {
    setFilterData({
      class: "",
      section: "",
      dateOfBirth: "",
      enrollmentDate: "",
      feeStatus: "all",
    })
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        {/* Header and Breadcrumb */}
        <div className="mb-4">
          <h2 className="mb-2">Members Management</h2>
          <nav className="d-flex custom-breadcrumb py-1 py-lg-3">
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <div to="">LibraryManagement</div>
            <span className="separator mx-2">&gt;</span>
            <span>Members Management</span>
          </nav>
        </div>

        {/* Main Card containing Search, Table and Pagination */}
        <Card className="shadow-sm">
          <Card.Body>
            {/* Search and Filter Section */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
              <div className="d-flex flex-column flex-md-row gap-2 mb-3 mb-md-0" style={{ maxWidth: "100%" }}>
                <Form.Control
                  type="text"
                  placeholder="Search by Admission no, Student Name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-2 mb-md-0"
                />
                <Button className="custom-btn-clr">SEARCH</Button>
              </div>
              <div className="d-flex gap-2">
                <Button variant="primary" className="custom-btn-clr" onClick={() => setShowFilter(true)}>
                  <FaFilter className="me-2" />
                  Filter
                </Button>
                <Button className="custom-btn-clr">+</Button>
              </div>
            </div>

            {/* Table */}
            <div className="table-responsive">
              <Table bordered hover className="mb-0 text-center">
                <thead>
                  <tr>
                    <th className="custom-btn-clr">Admission Number</th>
                    <th className="custom-btn-clr">Student Name</th>
                    <th className="custom-btn-clr">Class/Standard</th>
                    <th className="custom-btn-clr">Section / Grade</th>
                    <th className="custom-btn-clr">Book Title</th>
                    <th className="custom-btn-clr">Issued Date</th>
                    <th className="custom-btn-clr">Submission Date</th>
                    <th className="custom-btn-clr">Book ID</th>
                    <th className="custom-btn-clr">Status</th>
                    <th className="custom-btn-clr">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.admissionNumber}</td>
                      <td>{item.studentName}</td>
                      <td>{item.class}</td>
                      <td>{item.section}</td>
                      <td>{item.bookTitle}</td>
                      <td>{item.issuedDate}</td>
                      <td>{item.submissionDate}</td>
                      <td>{item.bookId}</td>
                      <td>
                        <span className={`badge ${item.status === "Submitted" ? "bg-success" : "bg-danger"}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <Button variant="link" className="p-0 text-primary">
                          <FaEye />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="d-flex justify-content-center justify-content-md-end flex-wrap gap-2 mt-4">
              <Button variant="outline-primary" disabled>
                Previous
              </Button>
              <Button className="custom-btn-clr">1</Button>
              <Button variant="outline-primary">2</Button>
              <Button variant="outline-primary">3</Button>
              <Button variant="outline-primary">Next</Button>
            </div>
          </Card.Body>
        </Card>

        {/* Filter Modal */}
        <Modal show={showFilter} onHide={() => setShowFilter(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Filter Options</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Class</Form.Label>
                <Form.Select name="class" value={filterData.class} onChange={handleFilterChange}>
                  <option value="">Select Class</option>
                  <option value="1">Class 1</option>
                  <option value="2">Class 2</option>
                  <option value="3">Class 3</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Section</Form.Label>
                <Form.Select name="section" value={filterData.section} onChange={handleFilterChange}>
                  <option value="">Select Section</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Date of birth</Form.Label>
                <Form.Control
                  type="date"
                  name="dateOfBirth"
                  value={filterData.dateOfBirth}
                  onChange={handleFilterChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Enrollment Date</Form.Label>
                <Form.Control
                  type="date"
                  name="enrollmentDate"
                  value={filterData.enrollmentDate}
                  onChange={handleFilterChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Fees</Form.Label>
                <div className="d-flex gap-3">
                  <Form.Check
                    type="radio"
                    label="Paid"
                    name="feeStatus"
                    value="paid"
                    checked={filterData.feeStatus === "paid"}
                    onChange={handleFilterChange}
                  />
                  <Form.Check
                    type="radio"
                    label="Due"
                    name="feeStatus"
                    value="due"
                    checked={filterData.feeStatus === "due"}
                    onChange={handleFilterChange}
                  />
                </div>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button className="custom-btn-clr" onClick={handleFilterSubmit}>
              Show applied filters
            </Button>
            <Button variant="danger" onClick={handleFilterReset}>
              Reset
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </MainContentPage>
  )
}

export default MembersManagement

