"use client"

import { useState, useEffect, useRef } from "react"
import MainContentPage from "../../../components/MainContent/MainContentPage"

import jsPDF from "jspdf"
import html2canvas from "html2canvas"

const TwelfthCertificate = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [isEditing, setIsEditing] = useState(false) // State to toggle edit mode
  const certificateRef = useRef(null)
  const page1Ref = useRef(null)
  const page2Ref = useRef(null)
  const [admissionNumbers, setAdmissionNumbers] = useState([])
  const [selectedAdmissionNumber, setSelectedAdmissionNumber] = useState("")
  const [formData, setFormData] = useState({
    aadharNo: "",
    emisNo: "",
    serialNo: "",
    admissionNo: "",
    schoolName: "",
    educationalDistrict: "Tiruvannamalai",
    revenueDistrict: "Tiruvannamalai",
    studentName: "",
    fatherOrMotherName: "",
    nationality: "",
    religion: "",
    caste: "",
    community: "",
    gender: "",
    dateOfBirth: "",
    dateOfAdmission: "",
    standardStudied: "",
    qualifiedForPromotion: "",
    feesPaid: "",
    scholarship: "",
    medicalInspection: "",
    dateLeftSchool: "",
    conductAndCharacter: "",
    applicationDate: "",
    issueDate: "",
    courseOfStudy: {
      nameOfSchool: "",
      academicYears: "",
      standardsStudied: "",
      firstLanguage: "",
      mediumOfInstruction: "",
    },
    identificationMark1: "",
    identificationMark2: "",
    remarks: "",
    groupOfStudy: "", // Added for 12th standard specific field
  })

  const handlePrint = async () => {
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const a4Width = 210 // A4 width in mm
      const a4Height = 297 // A4 height in mm

      // Capture Page 1
      if (page1Ref.current) {
        const canvas1 = await html2canvas(page1Ref.current, {
          scale: 2,
          width: a4Width * 3.78,
          height: a4Height * 3.78,
          useCORS: true,
        })
        const imgData1 = canvas1.toDataURL("image/png")
        const imgHeight1 = (canvas1.height * a4Width) / canvas1.width
        pdf.addImage(imgData1, "PNG", 0, 0, a4Width, imgHeight1)
      }

      // Add a new page for Page 2
      pdf.addPage()

      // Capture Page 2
      if (page2Ref.current) {
        const canvas2 = await html2canvas(page2Ref.current, {
          scale: 2,
          width: a4Width * 3.78,
          height: a4Height * 3.78,
          useCORS: true,
        })
        const imgData2 = canvas2.toDataURL("image/png")
        const imgHeight2 = (canvas2.height * a4Width) / canvas2.width
        pdf.addImage(imgData2, "PNG", 0, 0, a4Width, imgHeight2)
      }

      // Save the PDF
      pdf.save("TransferCertificate_12th.pdf")
    } catch (error) {
      console.error("Error generating PDF:", error)
    }
  }

  // Fetch admission numbers from Firestore
  useEffect(() => {
    const fetchAdmissionNumbers = async () => {
      try {
        const adminRef = collection(db, "Schools", auth.currentUser.uid, "Administration")
        const q = query(adminRef, limit(1))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const administrationId = querySnapshot.docs[0]?.id || ""
          if (administrationId) {
            const admissionsRef = collection(
              db,
              "Schools",
              auth.currentUser.uid,
              "AdmissionMaster",
              administrationId,
              "AdmissionSetup"
            )
            const snapshot = await getDocs(admissionsRef)
            const numbers = snapshot.docs
              .map((doc) => doc.data().admissionNumber)
              .filter((num) => num && num.startsWith("ADM"))
            setAdmissionNumbers(numbers)
          } else {
            console.error("No administration ID found")
          }
        } else {
          console.error("No administration documents found")
        }
      } catch (error) {
        console.error("Error fetching admission numbers:", error)
      }
    }
    fetchAdmissionNumbers()
  }, [])

  // Fetch student data when admission number changes
  useEffect(() => {
    const fetchStudentData = async () => {
      if (selectedAdmissionNumber) {
        try {
          const adminRef = collection(db, "Schools", auth.currentUser.uid, "Administration")
          const q = query(adminRef, limit(1))
          const querySnapshot = await getDocs(q)

          if (!querySnapshot.empty) {
            const administrationId = querySnapshot.docs[0]?.id || ""
            if (administrationId) {
              const admissionsRef = collection(
                db,
                "Schools",
                auth.currentUser.uid,
                "AdmissionMaster",
                administrationId,
                "AdmissionSetup"
              )
              const admissionQuery = query(
                admissionsRef,
                where("admissionNumber", "==", selectedAdmissionNumber)
              )
              const admissionSnapshot = await getDocs(admissionQuery)

              if (!admissionSnapshot.empty) {
                const data = admissionSnapshot.docs[0].data()
                setFormData({
                  aadharNo: data.aadharNumber || "",
                  emisNo: data.emis || "",
                  serialNo: "1/2022",
                  admissionNo: data.admissionNumber || "",
                  schoolName: data.nameOfSchool || "",
                  educationalDistrict: "Tiruvannamalai",
                  revenueDistrict: "Tiruvannamalai",
                  studentName: data.studentName || "",
                  fatherOrMotherName: data.fatherName || data.motherName || "",
                  nationality: data.nationality || "",
                  religion: data.religion || "",
                  caste: data.caste || "",
                  community: data.community || "",
                  gender: data.gender || "",
                  dateOfBirth: data.dateOfBirth || "",
                  dateOfAdmission: data.dateOfAdmission || "",
                  standardStudied: data.classLastStudied || "XII",
                  qualifiedForPromotion: data.qualifiedForPromotion || "Yes. Promoted to higher studies",
                  feesPaid: data.feesPaid || "Yes",
                  scholarship: data.scholarship || "",
                  medicalInspection: data.medicalInspection || "Repeat",
                  dateLeftSchool: "19/03/2022",
                  conductAndCharacter: "",
                  applicationDate: "19/03/2022",
                  issueDate: "19/03/2022",
                  courseOfStudy: {
                    nameOfSchool: data.nameOfSchool || "",
                    academicYears: data.studiedYear || "220",
                    standardsStudied: data.classLastStudied || "XII",
                    firstLanguage: "Tamil",
                    mediumOfInstruction: "English",
                  },
                  identificationMark1: data.identificationMark1 || "",
                  identificationMark2: data.identificationMark2 || "",
                  remarks: data.remarks || "",
                  groupOfStudy: data.groupOfStudy || "Science",
                })
              } else {
                console.error("No admission document found for admission number:", selectedAdmissionNumber)
              }
            } else {
              console.error("No administration ID found")
            }
          } else {
            console.error("No administration documents found")
          }
        } catch (error) {
          console.error("Error fetching student data:", error)
        }
      }
    }
    fetchStudentData()
  }, [selectedAdmissionNumber])

  const handleAdmissionNumberChange = (e) => {
    setSelectedAdmissionNumber(e.target.value)
    setIsEditing(false) // Reset edit mode when changing admission number
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleCourseOfStudyChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      courseOfStudy: {
        ...prevData.courseOfStudy,
        [name]: value,
      },
    }))
  }

  const toggleEditMode = () => {
    setIsEditing(!isEditing)
  }

  return (
    <MainContentPage>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div className="btn-group border">
                <button
                  className={`btn ${currentPage === 1 ? "bg-white" : "bg-light"} `}
                  onClick={() => setCurrentPage(1)}
                >
                  Page 1
                </button>
                <button
                  className={`btn border-start ${currentPage === 2 ? "bg-white" : "bg-light"} `}
                  onClick={() => setCurrentPage(2)}
                >
                  Page 2
                </button>
              </div>
              <div className="d-flex align-items-center">
                <select
                  value={selectedAdmissionNumber}
                  onChange={handleAdmissionNumberChange}
                  className="form-select custom-select me-2"
                >
                  <option value="">Select Admission Number</option>
                  {admissionNumbers.map((number) => (
                    <option key={number} value={number}>
                      {number}
                    </option>
                  ))}
                </select>
                <button onClick={toggleEditMode} className="btn btn-warning custom-btn me-2">
                  {isEditing ? "Cancel" : "Edit"}
                </button>
                {isEditing && (
                  <button onClick={toggleEditMode} className="btn btn-success custom-btn me-2">
                    Save
                  </button>
                )}
                <button onClick={handlePrint} className="btn btn-primary custom-btn">
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden div for PDF generation, positioned off-screen */}
        <div style={{ position: "absolute", left: "-9999px" }}>
          {/* Page 1 */}
          <div ref={page1Ref} className="page">
            <div className="p-4">
              <div className="text-center mb-4">
                <h1 className="fw-bold fs-1">TRANSFER CERTIFICATE</h1>
                <p className="fs-4 mt-1">Government of Tamil Nadu</p>
                <p className="mt-1">Department of School Education</p>
                <p className="small">(Recognized by the Director of School Education)</p>
              </div>

              <div className="row mt-4">
                <div className="col-6">
                  <p>Aadhar No: {formData.aadharNo}</p>
                </div>
                <div className="col-6 text-end">
                  <p>EMIS No: {formData.emisNo}</p>
                </div>
              </div>

              <div className="row mt-2">
                <div className="col-6">
                  <p>Serial No: {formData.serialNo}</p>
                </div>
                <div className="col-6 text-end">
                  <p>Admission No: {formData.admissionNo}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="row mb-2">
                  <div className="col-8">1. (a) Name of the School</div>
                  <div className="col-4">: {formData.schoolName}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">(b) Name of the Educational District</div>
                  <div className="col-4">: {formData.educationalDistrict}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">(c) Name of the Revenue District</div>
                  <div className="col-4">: {formData.revenueDistrict}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">2. Name of the Pupil (in block letters)</div>
                  <div className="col-4">: {formData.studentName}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">3. Name of the Father or Mother of the Pupil</div>
                  <div className="col-4">: {formData.fatherOrMotherName}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">4. Nationality, Religion & Caste</div>
                  <div className="col-4">: {formData.nationality} - {formData.religion} - {formData.caste}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">5. Community</div>
                  <div className="col-4">: {formData.community}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-4">Whether He/She belongs to</div>
                  <div className="col-4"></div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-5">(a) Adi Dravidar (S. C.) or (S. T.)</div>
                  <div className="col-4">: -</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-5">(b) Backward Class</div>
                  <div className="col-4">: -</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-5">(c) Most Backward Class</div>
                  <div className="col-4">: {formData.community === "MBC" ? "MBC" : "-"}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-5">(d) Converted to Christianity from Scheduled Caste</div>
                  <div className="col-4">: -</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-5">(e) Denotified Communities</div>
                  <div className="col-4">: -</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-5">(f) Other Caste</div>
                  <div className="col-4">: -</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">6. Sex</div>
                  <div className="col-4">: {formData.gender}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">7. Date of Birth as entered in the Admission Register</div>
                  <div className="col-4">: {formData.dateOfBirth}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-4">(in figures and words)</div>
                  <div className="col-4"></div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">8. Date of admission and standard in which admitted</div>
                  <div className="col-4">: {formData.dateOfAdmission}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-4">(the year to be entered in words)</div>
                  <div className="col-4"></div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">9. Standard in which the pupil was studying at the time of</div>
                  <div className="col-4">: {formData.standardStudied}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-4">leaving (in words)</div>
                  <div className="col-4"></div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">10. Whether Qualified for Promotion</div>
                  <div className="col-4">: {formData.qualifiedForPromotion}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">11. Whether the Pupil has paid all the fees due to the School</div>
                  <div className="col-4">: {formData.feesPaid}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Page 2 */}
          <div ref={page2Ref} className="page">
            <div className="p-4">
              <div className="mb-4">
                <div className="row mb-2">
                  <div className="col-8">12. Whether the pupil was in receipt of any scholarship</div>
                  <div className="col-4">: {formData.scholarship}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-4">(Nature of the scholarship to be specified)</div>
                  <div className="col-4"></div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">13. Whether the pupil has undergone Medical Inspection during</div>
                  <div className="col-4">: {formData.medicalInspection}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-4">the last academic year? (First or Repeat to be specified)</div>
                  <div className="col-4"></div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">14. Date on which the pupil actually left the School</div>
                  <div className="col-4">: {formData.dateLeftSchool}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">15. The pupil's Conduct and Character</div>
                  <div className="col-4">: {formData.conductAndCharacter}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">16. Date on which application for Transfer Certificate</div>
                  <div className="col-4">: {formData.applicationDate}</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-4">was made on behalf of the pupil by the parent or guardian</div>
                  <div className="col-4"></div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">17. Date of issue of Transfer Certificate</div>
                  <div className="col-4">: {formData.issueDate}</div>
                </div>

                <div className="row mt-3">
                  <div className="col-12">18. Course of Study :-</div>
                </div>

                <div className="row mt-2">
                  <div className="col-12">
                    <div style={{ maxWidth: "100%", overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead>
                          <tr>
                            <th style={{ border: "1px solid #000", padding: "5px", textAlign: "center", width: "25%" }}>
                              Name of the School
                            </th>
                            <th style={{ border: "1px solid #000", padding: "5px", textAlign: "center", width: "15%" }}>
                              Academic Year(s)
                            </th>
                            <th style={{ border: "1px solid #000", padding: "5px", textAlign: "center", width: "20%" }}>
                              Standard(s) Studied
                            </th>
                            <th style={{ border: "1px solid #000", padding: "5px", textAlign: "center", width: "20%" }}>
                              First Language
                            </th>
                            <th style={{ border: "1px solid #000", padding: "5px", textAlign: "center", width: "20%" }}>
                              Medium of Instruction
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>
                              {formData.courseOfStudy.nameOfSchool}
                            </td>
                            <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>
                              {formData.courseOfStudy.academicYears}
                            </td>
                            <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>
                              {formData.courseOfStudy.standardsStudied}
                            </td>
                            <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>
                              {formData.courseOfStudy.firstLanguage}
                            </td>
                            <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>
                              {formData.courseOfStudy.mediumOfInstruction}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="row mt-2">
                  <div className="col-8">19. Group of Study</div>
                  <div className="col-4">: {formData.groupOfStudy}</div>
                </div>

                <div className="row mt-3">
                  <div className="col-12">20. Signature of the H.M. with date and school seal</div>
                </div>

                <div className="border-top border-dark my-4 pt-4">
                  <div className="fw-bold">Note :</div>
                  <ol className="ms-4 mt-2">
                    <li className="mb-2">
                      Erasures and unauthorized or Fraudulent alterations in the Certificate will lead to its
                      Cancellation.
                    </li>
                    <li className="mb-2">
                      Should be signed in ink by the Head of the institution, who will be held responsible for the
                      correctness of the entries.
                    </li>
                  </ol>

                  <div className="text-center fw-bold mt-4">Declaration by the Parent or Guardian</div>
                  <p className="mt-2">
                    I hereby declare that the particulars recorded against items 2 to 7 are correct and that no change
                    will be demanded by me in future.
                  </p>

                  <div className="row mt-5">
                    <div className="col-6">Signature of the Candidate</div>
                    <div className="col-6 text-end">Signature of the Parent/Guardian</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          id="certificate-content"
          ref={certificateRef}
          className="border bg-white shadow-sm"
          style={{ width: "210mm", height: "297mm", overflow: "hidden" }}
        >
          {currentPage === 1 ? (
            <div className="p-4">
              <div className="text-center mb-4">
                <h1 className="fw-bold fs-1">TRANSFER CERTIFICATE</h1>
                <p className="fs-4 mt-1">Government of Tamil Nadu</p>
                <p className="mt-1">Department of School Education</p>
                <p className="small">(Recognized by the Director of School Education)</p>
              </div>

              <div className="row mt-4">
                <div className="col-6">
                  {isEditing ? (
                    <>
                      Aadhar No: <input
                        type="text"
                        name="aadharNo"
                        value={formData.aadharNo}
                        onChange={handleInputChange}
                        className="form-control d-inline-block"
                        style={{ width: "150px" }}
                      />
                    </>
                  ) : (
                    <p>Aadhar No: {formData.aadharNo}</p>
                  )}
                </div>
                <div className="col-6 text-end">
                  {isEditing ? (
                    <>
                      EMIS No: <input
                        type="text"
                        name="emisNo"
                        value={formData.emisNo}
                        onChange={handleInputChange}
                        className="form-control d-inline-block"
                        style={{ width: "150px" }}
                      />
                    </>
                  ) : (
                    <p>EMIS No: {formData.emisNo}</p>
                  )}
                </div>
              </div>

              <div className="row mt-2">
                <div className="col-6">
                  {isEditing ? (
                    <>
                      Serial No: <input
                        type="text"
                        name="serialNo"
                        value={formData.serialNo}
                        onChange={handleInputChange}
                        className="form-control d-inline-block"
                        style={{ width: "150px" }}
                      />
                    </>
                  ) : (
                    <p>Serial No: {formData.serialNo}</p>
                  )}
                </div>
                <div className="col-6 text-end">
                  {isEditing ? (
                    <>
                      Admission No: <input
                        type="text"
                        name="admissionNo"
                        value={formData.admissionNo}
                        onChange={handleInputChange}
                        className="form-control d-inline-block"
                        style={{ width: "150px" }}
                      />
                    </>
                  ) : (
                    <p>Admission No: {formData.admissionNo}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <div className="row mb-2">
                  <div className="col-8">1. (a) Name of the School</div>
                  <div className="col-4">
                    {isEditing ? (
                      <input
                        type="text"
                        name="schoolName"
                        value={formData.schoolName}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      `: ${formData.schoolName}`
                    )}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">(b) Name of the Educational District</div>
                  <div className="col-4">
                    {isEditing ? (
                      <input
                        type="text"
                        name="educationalDistrict"
                        value={formData.educationalDistrict}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      `: ${formData.educationalDistrict}`
                    )}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">(c) Name of the Revenue District</div>
                  <div className="col-4">
                    {isEditing ? (
                      <input
                        type="text"
                        name="revenueDistrict"
                        value={formData.revenueDistrict}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      `: ${formData.revenueDistrict}`
                    )}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">2. Name of the Pupil (in block letters)</div>
                  <div className="col-4">
                    {isEditing ? (
                      <input
                        type="text"
                        name="studentName"
                        value={formData.studentName}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      `: ${formData.studentName}`
                    )}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">3. Name of the Father or Mother of the Pupil</div>
                  <div className="col-4">
                    {isEditing ? (
                      <input
                        type="text"
                        name="fatherOrMotherName"
                        value={formData.fatherOrMotherName}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      `: ${formData.fatherOrMotherName}`
                    )}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">4. Nationality, Religion & Caste</div>
                  <div className="col-4">
                    {isEditing ? (
                      <div className="d-flex flex-column">
                        <input
                          type="text"
                          name="nationality"
                          value={formData.nationality}
                          onChange={handleInputChange}
                          className="form-control mb-1"
                          placeholder="Nationality"
                        />
                        <input
                          type="text"
                          name="religion"
                          value={formData.religion}
                          onChange={handleInputChange}
                          className="form-control mb-1"
                          placeholder="Religion"
                        />
                        <input
                          type="text"
                          name="caste"
                          value={formData.caste}
                          onChange={handleInputChange}
                          className="form-control"
                          placeholder="Caste"
                        />
                      </div>
                    ) : (
                      `: ${formData.nationality} - ${formData.religion} - ${formData.caste}`
                    )}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">5. Community</div>
                  <div className="col-4">
                    {isEditing ? (
                      <input
                        type="text"
                        name="community"
                        value={formData.community}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      `: ${formData.community}`
                    )}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-4">Whether He/She belongs to</div>
                  <div className="col-4"></div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-5">(a) Adi Dravidar (S. C.) or (S. T.)</div>
                  <div className="col-4">: -</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-5">(b) Backward Class</div>
                  <div className="col-4">: -</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-5">(c) Most Backward Class</div>
                  <div className="col-4">
                    {isEditing ? (
                      <input
                        type="text"
                        name="community"
                        value={formData.community === "MBC" ? "MBC" : "-"}
                        onChange={(e) => setFormData({ ...formData, community: e.target.value === "MBC" ? "MBC" : formData.community })}
                        className="form-control"
                      />
                    ) : (
                      `: ${formData.community === "MBC" ? "MBC" : "-"}`
                    )}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-5">(d) Converted to Christianity from Scheduled Caste</div>
                  <div className="col-4">: -</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-5">(e) Denotified Communities</div>
                  <div className="col-4">: -</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-5">(f) Other Caste</div>
                  <div className="col-4">: -</div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">6. Sex</div>
                  <div className="col-4">
                    {isEditing ? (
                      <input
                        type="text"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      `: ${formData.gender}`
                    )}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">7. Date of Birth as entered in the Admission Register</div>
                  <div className="col-4">
                    {isEditing ? (
                      <input
                        type="text"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      `: ${formData.dateOfBirth}`
                    )}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-4">(in figures and words)</div>
                  <div className="col-4"></div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">8. Date of admission and standard in which admitted</div>
                  <div className="col-4">
                    {isEditing ? (
                      <input
                        type="text"
                        name="dateOfAdmission"
                        value={formData.dateOfAdmission}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      `: ${formData.dateOfAdmission}`
                    )}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-4">(the year to be entered in words)</div>
                  <div className="col-4"></div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">9. Standard in which the pupil was studying at the time of</div>
                  <div className="col-4">
                    {isEditing ? (
                      <input
                        type="text"
                        name="standardStudied"
                        value={formData.standardStudied}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      `: ${formData.standardStudied}`
                    )}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-4">leaving (in words)</div>
                  <div className="col-4"></div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">10. Whether Qualified for Promotion</div>
                  <div className="col-4">
                    {isEditing ? (
                      <input
                        type="text"
                        name="qualifiedForPromotion"
                        value={formData.qualifiedForPromotion}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      `: ${formData.qualifiedForPromotion}`
                    )}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">11. Whether the Pupil has paid all the fees due to the School</div>
                  <div className="col-4">
                    {isEditing ? (
                      <input
                        type="text"
                        name="feesPaid"
                        value={formData.feesPaid}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      `: ${formData.feesPaid}`
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="mb-4">
                <div className="row mb-2">
                  <div className="col-8">12. Whether the pupil was in receipt of any scholarship</div>
                  <div className="col-4">
                    {isEditing ? (
                      <input
                        type="text"
                        name="scholarship"
                        value={formData.scholarship}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      `: ${formData.scholarship}`
                    )}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-4">(Nature of the scholarship to be specified)</div>
                  <div className="col-4"></div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">13. Whether the pupil has undergone Medical Inspection during</div>
                  <div className="col-4">
                    {isEditing ? (
                      <input
                        type="text"
                        name="medicalInspection"
                        value={formData.medicalInspection}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      `: ${formData.medicalInspection}`
                    )}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-4">the last academic year? (First or Repeat to be specified)</div>
                  <div className="col-4"></div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">14. Date on which the pupil actually left the School</div>
                  <div className="col-4">
                    {isEditing ? (
                      <input
                        type="text"
                        name="dateLeftSchool"
                        value={formData.dateLeftSchool}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      `: ${formData.dateLeftSchool}`
                    )}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">15. The pupil's Conduct and Character</div>
                  <div className="col-4">
                    {isEditing ? (
                      <input
                        type="text"
                        name="conductAndCharacter"
                        value={formData.conductAndCharacter}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      `: ${formData.conductAndCharacter}`
                    )}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">16. Date on which application for Transfer Certificate</div>
                  <div className="col-4">
                    {isEditing ? (
                      <input
                        type="text"
                        name="applicationDate"
                        value={formData.applicationDate}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      `: ${formData.applicationDate}`
                    )}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-8 ps-4">was made on behalf of the pupil by the parent or guardian</div>
                  <div className="col-4"></div>
                </div>

                <div className="row mb-2">
                  <div className="col-8">17. Date of issue of Transfer Certificate</div>
                  <div className="col-4">
                    {isEditing ? (
                      <input
                        type="text"
                        name="issueDate"
                        value={formData.issueDate}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      `: ${formData.issueDate}`
                    )}
                  </div>
                </div>

                <div className="row mt-3">
                  <div className="col-12">18. Course of Study :-</div>
                </div>

                <div className="row mt-2">
                  <div className="col-12">
                    <div style={{ maxWidth: "100%", overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead>
                          <tr>
                            <th style={{ border: "1px solid #000", padding: "5px", textAlign: "center", width: "25%" }}>
                              Name of the School
                            </th>
                            <th style={{ border: "1px solid #000", padding: "5px", textAlign: "center", width: "15%" }}>
                              Academic Year(s)
                            </th>
                            <th style={{ border: "1px solid #000", padding: "5px", textAlign: "center", width: "20%" }}>
                              Standard(s) Studied
                            </th>
                            <th style={{ border: "1px solid #000", padding: "5px", textAlign: "center", width: "20%" }}>
                              First Language
                            </th>
                            <th style={{ border: "1px solid #000", padding: "5px", textAlign: "center", width: "20%" }}>
                              Medium of Instruction
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>
                              {isEditing ? (
                                <input
                                  type="text"
                                  name="nameOfSchool"
                                  value={formData.courseOfStudy.nameOfSchool}
                                  onChange={handleCourseOfStudyChange}
                                  className="form-control"
                                />
                              ) : (
                                formData.courseOfStudy.nameOfSchool
                              )}
                            </td>
                            <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>
                              {isEditing ? (
                                <input
                                  type="text"
                                  name="academicYears"
                                  value={formData.courseOfStudy.academicYears}
                                  onChange={handleCourseOfStudyChange}
                                  className="form-control"
                                />
                              ) : (
                                formData.courseOfStudy.academicYears
                              )}
                            </td>
                            <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>
                              {isEditing ? (
                                <input
                                  type="text"
                                  name="standardsStudied"
                                  value={formData.courseOfStudy.standardsStudied}
                                  onChange={handleCourseOfStudyChange}
                                  className="form-control"
                                />
                              ) : (
                                formData.courseOfStudy.standardsStudied
                              )}
                            </td>
                            <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>
                              {isEditing ? (
                                <input
                                  type="text"
                                  name="firstLanguage"
                                  value={formData.courseOfStudy.firstLanguage}
                                  onChange={handleCourseOfStudyChange}
                                  className="form-control"
                                />
                              ) : (
                                formData.courseOfStudy.firstLanguage
                              )}
                            </td>
                            <td style={{ border: "1px solid #000", padding: "5px", textAlign: "center" }}>
                              {isEditing ? (
                                <input
                                  type="text"
                                  name="mediumOfInstruction"
                                  value={formData.courseOfStudy.mediumOfInstruction}
                                  onChange={handleCourseOfStudyChange}
                                  className="form-control"
                                />
                              ) : (
                                formData.courseOfStudy.mediumOfInstruction
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="row mt-2">
                  <div className="col-8">19. Group of Study</div>
                  <div className="col-4">
                    {isEditing ? (
                      <input
                        type="text"
                        name="groupOfStudy"
                        value={formData.groupOfStudy}
                        onChange={handleInputChange}
                        className="form-control"
                      />
                    ) : (
                      `: ${formData.groupOfStudy}`
                    )}
                  </div>
                </div>

                <div className="row mt-3">
                  <div className="col-12">20. Signature of the H.M. with date and school seal</div>
                </div>

                <div className="border-top border-dark my-4 pt-4">
                  <div className="fw-bold">Note :</div>
                  <ol className="ms-4 mt-2">
                    <li className="mb-2">
                      Erasures and unauthorized or Fraudulent alterations in the Certificate will lead to its
                      Cancellation.
                    </li>
                    <li className="mb-2">
                      Should be signed in ink by the Head of the institution, who will be held responsible for the
                      correctness of the entries.
                    </li>
                  </ol>

                  <div className="text-center fw-bold mt-4">Declaration by the Parent or Guardian</div>
                  <p className="mt-2">
                    I hereby declare that the particulars recorded against items 2 to 7 are correct and that no change
                    will be demanded by me in future.
                  </p>

                  <div className="row mt-5">
                    <div className="col-6">Signature of the Candidate</div>
                    <div className="col-6 text-end">Signature of the Parent/Guardian</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>
        {`
          .custom-btn {
            padding: 5px 10px;
            font-size: 14px;
            color:white;
          }
          .custom-select {
            width: 200px;
            padding: 5px;
            font-size: 14px;
          }
          .page {
            width: 210mm;
            height: 297mm;
            box-sizing: border-box;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .header h1 {
            font-size: 24px;
            margin-bottom: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background-color: white;
          }
          table, th, td {
            border: 1px solid #000;
          }
          th, td {
            padding: 5px;
            text-align: center;
            font-size: 12px;
          }
          .row {
            display: flex;
            margin-bottom: 10px;
          }
          .label {
            width: 60%;
          }
          .value {
            width: 40%;
          }
          .indent {
            margin-left: 20px;
          }
          .double-indent {
            margin-left: 40px;
          }
          .footer {
            margin-top: 30px;
            border-top: 1px solid #000;
            padding-top: 20px;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
          }
          p {
            margin: 0;
          }
          .text-center {
            text-align: center;
          }
          .fw-bold {
            font-weight: bold;
          }
          .fs-1 {
            font-size: 24px;
          }
          .fs-4 {
            font-size: 18px;
          }
          .small {
            font-size: 12px;
          }
          .mt-1 {
            margin-top: 4px;
          }
          .mt-2 {
            margin-top: 8px;
          }
          .mt-3 {
            margin-top: 12px;
          }
          .mt-4 {
            margin-top: 16px;
          }
          .mt-5 {
            margin-top: 20px;
          }
          .mb-1 {
            margin-bottom: 4px;
          }
          .mb-2 {
            margin-bottom: 8px;
          }
          .mb-4 {
            margin-bottom: 16px;
          }
          .my-4 {
            margin-top: 16px;
            margin-bottom: 16px;
          }
          .ps-4 {
            padding-left: 16px;
          }
          .ps-5 {
            padding-left: 20px;
          }
          .ms-4 {
            margin-left: 16px;
          }
          .col-6 {
            width: 50%;
          }
          .col-8 {
            width: 66.67%;
          }
          .col-4 {
            width: 33.33%;
          }
          .text-end {
            text-align: right;
          }
          .border-top {
            border-top: 1px solid #000;
          }
          .border-dark {
            border-color: #000;
          }
          .pt-4 {
            padding-top: 16px;
          }
          .form-control {
            font-size: 14px;
            padding: 2px 5px;
          }
        `}
      </style>
    </MainContentPage>
  )
}

export default TwelfthCertificate