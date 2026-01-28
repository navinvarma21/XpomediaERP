import { useState, useRef } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Form, Button, Row, Col, Container } from "react-bootstrap"

const EditStudentDetails = () => {
  const [formData, setFormData] = useState({
    admissionNumber: "",
    studentPhoto: null,
    studentName: "",
    fatherName: "",
    motherName: "",
    streetVillage: "",
    placePincode: "",
    district: "",
    phoneNumber: "",
    boardingPoint: "",
    busRouteNumber: "",
    emailId: "",
    communicationAddress: "",
    nationality: "",
    religion: "",
    state: "",
    community: "",
    caste: "",
    studentType: "",
    studentCategory: "",
    standard: "",
    section: "",
    gender: "",
    dateOfBirth: "",
    emis: "",
    lunchRefresh: "",
    bloodGroup: "",
    dateOfAdmission: "",
    motherTongue: "",
    fatherOccupation: "",
    motherOccupation: "",
    examNumber: "",
    busFee: "",
    studiedYear: "",
    classLastStudied: "",
    classToBeAdmitted: "",
    nameOfSchool: "",
    remarks: "",
    identificationMark1: "",
    identificationMark2: "",
  })

  const [photoPreview, setPhotoPreview] = useState(null)
  const fileInputRef = useRef(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData((prev) => ({
        ...prev,
        studentPhoto: file,
      }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePhotoClick = () => {
    fileInputRef.current.click()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Form Data:", formData)
    // Add your form submission logic here
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <div className="admission-form">
          {/* Header and Breadcrumb */}
          <div className="mb-4">
            <h2 className="mb-2">Edit Student Detail</h2>
            <nav className="custom-breadcrumb py-1 py-lg-3">
              <Link to="/home">Home</Link>
              <span className="separator mx-2">&gt;</span>
              <span>Admission Master</span>
              <span className="separator mx-2">&gt;</span>
              <Link to="/admission/EditStudentDetails">Edit Student Detail</Link>
            </nav>
          </div>

          {/* Main Form Card */}
          <div className="form-card mt-3">
            {/* Card Header */}
            <div className="header p-3" style={{ backgroundColor: "#0B3D7B", color: "white" }}>
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <span>
                    <b>Edit Student Detail</b>
                  </span>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="content-wrapper p-4">
              <Form onSubmit={handleSubmit}>
                <Row>
                  {/* Left Column */}
                  <Col md={4}>
                    <div className="text-center mb-4">
                      <h6>Student Photo</h6>
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
                            <div>Upload Photo Here</div>
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
                    </div>

                    {/* Left Column Fields */}
                    <Form.Group className="mb-3">
                      <Form.Label>Student name</Form.Label>
                      <Form.Control
                        type="text"
                        name="studentName"
                        value={formData.studentName}
                        onChange={handleInputChange}
                        placeholder="Enter student full name"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Father's name</Form.Label>
                      <Form.Control
                        type="text"
                        name="fatherName"
                        value={formData.fatherName}
                        onChange={handleInputChange}
                        placeholder="Enter father's name"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Mother's name</Form.Label>
                      <Form.Control
                        type="text"
                        name="motherName"
                        value={formData.motherName}
                        onChange={handleInputChange}
                        placeholder="Enter mother's name"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Street/Village</Form.Label>
                      <Form.Control
                        type="text"
                        name="streetVillage"
                        value={formData.streetVillage}
                        onChange={handleInputChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Place/Pincode</Form.Label>
                      <Form.Control
                        type="text"
                        name="placePincode"
                        value={formData.placePincode}
                        onChange={handleInputChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>District</Form.Label>
                      <Form.Select name="district" value={formData.district} onChange={handleInputChange}>
                        <option value="">Select District</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>No.Boarding Point</Form.Label>
                      <Form.Select name="boardingPoint" value={formData.boardingPoint} onChange={handleInputChange}>
                        <option value="">Select Boarding Point</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Bus Route Number</Form.Label>
                      <Form.Select name="busRouteNumber" value={formData.busRouteNumber} onChange={handleInputChange}>
                        <option value="">Select Route Number</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Email Id</Form.Label>
                      <Form.Select name="emailId" value={formData.emailId} onChange={handleInputChange}>
                        <option value="">Select Email</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Communication Address</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="communicationAddress"
                        value={formData.communicationAddress}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>

                  {/* Middle Column */}
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nationality</Form.Label>
                      <Form.Control
                        type="text"
                        name="nationality"
                        value={formData.nationality}
                        onChange={handleInputChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Religion</Form.Label>
                      <Form.Select name="religion" value={formData.religion} onChange={handleInputChange}>
                        <option value="">Select Religion</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>State</Form.Label>
                      <Form.Select name="state" value={formData.state} onChange={handleInputChange}>
                        <option value="">Select State</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Community</Form.Label>
                      <Form.Select name="community" value={formData.community} onChange={handleInputChange}>
                        <option value="">Select Community</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Caste</Form.Label>
                      <Form.Select name="caste" value={formData.caste} onChange={handleInputChange}>
                        <option value="">Select Caste</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Student Type</Form.Label>
                      <Form.Select name="studentType" value={formData.studentType} onChange={handleInputChange}>
                        <option value="">Select Student Type</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Student Category</Form.Label>
                      <Form.Select name="studentCategory" value={formData.studentCategory} onChange={handleInputChange}>
                        <option value="">Select Category</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Standard</Form.Label>
                      <Form.Select name="standard" value={formData.standard} onChange={handleInputChange}>
                        <option value="">Select Standard</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Section</Form.Label>
                      <Form.Select name="section" value={formData.section} onChange={handleInputChange}>
                        <option value="">Select Section</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Gender</Form.Label>
                      <Form.Select name="gender" value={formData.gender} onChange={handleInputChange}>
                        <option value="">Select Gender</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Date Of Birth</Form.Label>
                      <Form.Select name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange}>
                        <option value="">Select Date</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>EMIS</Form.Label>
                      <Form.Control type="text" name="emis" value={formData.emis} onChange={handleInputChange} />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Lunch / Refresh</Form.Label>
                      <Form.Select name="lunchRefresh" value={formData.lunchRefresh} onChange={handleInputChange}>
                        <option value="">Select Option</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Blood Group</Form.Label>
                      <Form.Select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange}>
                        <option value="">Select Blood Group</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Date Of Admission</Form.Label>
                      <Form.Select name="dateOfAdmission" value={formData.dateOfAdmission} onChange={handleInputChange}>
                        <option value="">Select Date</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* Right Column */}
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mother Tongue</Form.Label>
                      <Form.Select name="motherTongue" value={formData.motherTongue} onChange={handleInputChange}>
                        <option value="">Select Mother Tongue</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Father's Occupation</Form.Label>
                      <Form.Control
                        type="text"
                        name="fatherOccupation"
                        value={formData.fatherOccupation}
                        onChange={handleInputChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Mother's Occupation</Form.Label>
                      <Form.Control
                        type="text"
                        name="motherOccupation"
                        value={formData.motherOccupation}
                        onChange={handleInputChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Exam Number</Form.Label>
                      <Form.Control
                        type="text"
                        name="examNumber"
                        value={formData.examNumber}
                        onChange={handleInputChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Bus Fee</Form.Label>
                      <Form.Control type="text" name="busFee" value={formData.busFee} onChange={handleInputChange} />
                    </Form.Group>

                    <div className="mb-3">
                      <h6 className="mb-3">Previous Studied Details</h6>

                      <Form.Group className="mb-3">
                        <Form.Label>Studied Year</Form.Label>
                        <Form.Control
                          type="text"
                          name="studiedYear"
                          value={formData.studiedYear}
                          onChange={handleInputChange}
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Class Last Studied</Form.Label>
                        <Form.Select
                          name="classLastStudied"
                          value={formData.classLastStudied}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Class</option>
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Class to be Admitted</Form.Label>
                        <Form.Select
                          name="classToBeAdmitted"
                          value={formData.classToBeAdmitted}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Class</option>
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Name of the school</Form.Label>
                        <Form.Control
                          type="text"
                          name="nameOfSchool"
                          value={formData.nameOfSchool}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                    </div>

                    <Form.Group className="mb-3">
                      <Form.Label>Remarks</Form.Label>
                      <Form.Control type="text" name="remarks" value={formData.remarks} onChange={handleInputChange} />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Student Identification Marks 1</Form.Label>
                      <Form.Control
                        type="text"
                        name="identificationMark1"
                        value={formData.identificationMark1}
                        onChange={handleInputChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Student Identification Marks 2</Form.Label>
                      <Form.Control
                        type="text"
                        name="identificationMark2"
                        value={formData.identificationMark2}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Form Actions */}
                <Row className="mt-4">
                  <Col className="d-flex justify-content-center gap-3">
                    <Button type="submit" style={{ backgroundColor: "#0B3D7B", borderColor: "#0B3D7B" }}>
                      Save
                    </Button>
                    <Button variant="secondary">Cancel</Button>
                  </Col>
                </Row>
              </Form>
            </div>
          </div>
        </div>
      </Container>
    </MainContentPage>
  )
}

export default EditStudentDetails

