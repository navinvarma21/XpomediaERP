"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Form, Button, Card, Container, Row, Col } from "react-bootstrap"

const BillCancel = () => {
  const [formData, setFormData] = useState({
    billNumber: "",
    name: "",
    standard: "",
    section: "",
    date: "",
    description: "",
    otp: "",
  })

  const [timer, setTimer] = useState(0)
  const [isOtpSent, setIsOtpSent] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleGenerateOTP = () => {
    setIsOtpSent(true)
    setTimer(60) // Start 60 second timer
  }

  useEffect(() => {
    let interval
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timer])

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Form Data:", formData)
    // Add your form submission logic here
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        {/* Header and Breadcrumb */}
        <div className="mb-4">
          <h2 className="mb-2">Bill Cancel</h2>
          <nav className="custom-breadcrumb py-1 py-lg-3">
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <Link to="/admission">Admission Master</Link>
            <span className="separator mx-2">&gt;</span>
            <span>Bill Cancel</span>
          </nav>
        </div>

        {/* Bill Cancel Form Card */}
        <Card className="mb-4 shadow-sm">
          <Card.Header className="p-3 custom-btn-clr">
            <h5 className="m-0 text-white">Bill Cancel</h5>
          </Card.Header>
          <Card.Body className="p-4">
            <Form onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Col md={3}>
                  <Form.Label>Bill Number</Form.Label>
                </Col>
                <Col md={9}>
                  <Form.Control
                    type="text"
                    name="billNumber"
                    value={formData.billNumber}
                    onChange={handleChange}
                    placeholder="Enter Bill Number"
                  />
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={3}>
                  <Form.Label>Name</Form.Label>
                </Col>
                <Col md={9}>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter Name"
                  />
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={3}>
                  <Form.Label>Standard</Form.Label>
                </Col>
                <Col md={9}>
                  <Form.Control
                    type="text"
                    name="standard"
                    value={formData.standard}
                    onChange={handleChange}
                    placeholder="Enter Standard"
                  />
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={3}>
                  <Form.Label>Section</Form.Label>
                </Col>
                <Col md={9}>
                  <Form.Control
                    type="text"
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    placeholder="Enter Section"
                  />
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={3}>
                  <Form.Label>Date</Form.Label>
                </Col>
                <Col md={9}>
                  <Form.Control type="date" name="date" value={formData.date} onChange={handleChange} />
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={3}>
                  <Form.Label>Description</Form.Label>
                </Col>
                <Col md={9}>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter Description"
                  />
                </Col>
              </Row>

              <Row className="mb-3 align-items-center">
                <Col md={3}>
                  <Button onClick={handleGenerateOTP} className="custom-btn-clr" disabled={isOtpSent && timer > 0}>
                    Generate OTP
                  </Button>
                </Col>
                <Col md={6}>
                  <Form.Control
                    type="text"
                    placeholder="Enter OTP"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    disabled={!isOtpSent}
                  />
                </Col>
                <Col md={3}>{timer > 0 && <span className="align-middle">{formatTime(timer)}</span>}</Col>
              </Row>

              <div className="d-flex justify-content-center gap-2 mt-4">
                <Button type="submit" className="custom-btn-clr">
                  Save
                </Button>
                <Button variant="secondary" onClick={() => window.history.back()}>
                  Cancel
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </MainContentPage>
  )
}

export default BillCancel

