"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Form, Button, Card, Container } from "react-bootstrap"

const BackupData = () => {
  const [courseWiseData, setCourseWiseData] = useState({
    course: "",
    sex: "",
    feeHead: "",
    amount: "",
    reportDate: "", // Added report date state
  })

  const [individualData, setIndividualData] = useState({
    adminNumber: "",
    name: "",
    feeHead: "",
    amount: "",
  })

  const handleCourseWiseChange = (e) => {
    const { name, value } = e.target
    setCourseWiseData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleIndividualChange = (e) => {
    const { name, value } = e.target
    setIndividualData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCourseWiseSubmit = (e) => {
    e.preventDefault()
    console.log("Course Wise Data:", courseWiseData)
  }

  const handleIndividualSubmit = (e) => {
    e.preventDefault()
    console.log("Individual Data:", individualData)
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        {/* Header and Breadcrumb */}
        <div className="mb-4">
        <h2 className="mb-2">Backup Data</h2>
          <nav className="custom-breadcrumb d-flex py-1 py-lg-3">
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <div to="">Debit/Card Report Pages</div>
            <span className="separator mx-2">&gt;</span>
            <span>Backup Data</span>
          </nav>
        </div>

        {/* Course Wise Fee Setting Card */}
        <Card className="mb-4">
          <Card.Header className="p-3 custom-btn-clr" >
            <h5 className="m-0">Backup Data</h5>
          </Card.Header>
          <Card.Body className="p-4">
            <Form onSubmit={handleCourseWiseSubmit}>
              <div className="row mb-3">
                <div className="col-12 py-2">
                  <Form.Label>Select Bus Route Number</Form.Label>
                </div>
                <div className="col-12 py-2">
                  <Form.Control
                    type="text"
                    name="reportDate"
                    value={courseWiseData.reportDate}
                    onChange={handleCourseWiseChange}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-center gap-2 mt-4">
                <Button type="submit" className="custom-btn-clr">
                  ok
                </Button>
                <Button variant="secondary">Cancel</Button>
              </div>
            </Form>
          </Card.Body>
        </Card>

    
      </Container>
    </MainContentPage>
  )
}

export default BackupData
