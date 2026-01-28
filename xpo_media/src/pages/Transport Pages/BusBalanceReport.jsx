"use client"

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Form, Button, Row, Col, Container, Table, Card, Spinner } from "react-bootstrap"
import { FaPrint, FaFilePdf, FaSearch } from "react-icons/fa"

import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import jsPDF from "jspdf"
import "jspdf-autotable"
import html2canvas from "html2canvas"

const BusBalanceReport = () => {
  const [formData, setFormData] = useState({
    standard: false,
    standardSelect: "",
    term: false,
    termSelect: "",
    route: false,
    routeSelect: "",
    status: "",
  })

  const [transportId, setTransportId] = useState(null)
  const [administrationId, setAdministrationId] = useState(null)
  const [standards, setStandards] = useState([])
  const [feeHeads, setFeeHeads] = useState([])
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [reportData, setReportData] = useState([])
  const [showReport, setShowReport] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState({ name: "", address: "" })
  const [reportTotals, setReportTotals] = useState({
    subTotal: 0,
    grandTotal: 0,
  })

  const reportRef = useRef(null)

  // Fetch school info
  useEffect(() => {
    const fetchSchoolInfo = async () => {
      try {
        const schoolDoc = doc(db, "Schools", auth.currentUser.uid)
        const schoolSnapshot = await getDoc(schoolDoc)
        if (schoolSnapshot.exists()) {
          const data = schoolSnapshot.data()
          setSchoolInfo({
            name: data.SchoolName || "XPOMEDIA MATRIC. HR. SEC. SCHOOL",
            address: data.SchoolAddres || "TIRUVANNAMALAIA 606601",
          })
        }
      } catch (error) {
        console.error("Error fetching school information:", error)
      }
    }

    fetchSchoolInfo()
  }, [])

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (auth.currentUser) {
        console.log("User is authenticated:", auth.currentUser.uid)
        await fetchTransportId()
        await fetchAdministrationId()
      } else {
        console.log("User is not authenticated")
        toast.error("Please log in to view bus balance report.", {
          position: "top-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })
        setInitialLoading(false)
      }
    }

    checkAuthAndFetchData()
  }, [])

  useEffect(() => {
    if (transportId) {
      fetchFeeHeads()
      fetchRoutes()
    }
  }, [transportId])

  useEffect(() => {
    if (administrationId) {
      fetchStandards()
    }
  }, [administrationId])

  useEffect(() => {
    if ((transportId || administrationId) && standards.length >= 0 && feeHeads.length >= 0 && routes.length >= 0) {
      setInitialLoading(false)
    }
  }, [transportId, administrationId, standards, feeHeads, routes])

  const fetchTransportId = async () => {
    try {
      const transportRef = collection(db, "Schools", auth.currentUser.uid, "Transport")
      const q = query(transportRef, limit(1))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        toast.error("Transport data not found. Please set up transport first.", {
          position: "top-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })
      } else {
        setTransportId(querySnapshot.docs[0].id)
      }
    } catch (error) {
      console.error("Error fetching Transport ID:", error)
      toast.error("Failed to initialize transport data. Please try again.", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
    }
  }

  const fetchAdministrationId = async () => {
    try {
      const adminRef = collection(db, "Schools", auth.currentUser.uid, "Administration")
      const q = query(adminRef, limit(1))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        toast.error("Administration data not found. Please set up administration first.", {
          position: "top-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })
      } else {
        setAdministrationId(querySnapshot.docs[0].id)
      }
    } catch (error) {
      console.error("Error fetching Administration ID:", error)
      toast.error("Failed to initialize administration data. Please try again.", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
    }
  }

  const fetchStandards = async () => {
    if (!administrationId) return

    try {
      // Fetch standards from Courses collection as in CourseSetup.jsx
      const coursesRef = collection(db, "Schools", auth.currentUser.uid, "Administration", administrationId, "Courses")
      const querySnapshot = await getDocs(coursesRef)
      const standardsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      console.log("Fetched standards from Courses:", standardsData)
      setStandards(standardsData)
    } catch (error) {
      console.error("Error fetching standards:", error)
      toast.error("Failed to fetch standards. Please try again.", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
    }
  }

  const fetchFeeHeads = async () => {
    if (!transportId) return

    try {
      // Fetch fee heads from BusVanFeeHeadSetup collection as in BusFeeSetup.jsx
      const feeHeadsRef = collection(
        db,
        "Schools",
        auth.currentUser.uid,
        "Transport",
        transportId,
        "BusVanFeeHeadSetup",
      )
      const querySnapshot = await getDocs(feeHeadsRef)
      const feeHeadsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      console.log("Fetched fee heads:", feeHeadsData)
      setFeeHeads(feeHeadsData)
    } catch (error) {
      console.error("Error fetching fee heads:", error)
      toast.error("Failed to fetch terms/months. Please try again.", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
    }
  }

  const fetchRoutes = async () => {
    if (!transportId) return

    try {
      const routesRef = collection(db, "Schools", auth.currentUser.uid, "Transport", transportId, "RouteSetup")
      const querySnapshot = await getDocs(routesRef)
      const routesData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      console.log("Fetched routes:", routesData)
      setRoutes(routesData)
    } catch (error) {
      console.error("Error fetching routes:", error)
      toast.error("Failed to fetch routes. Please try again.", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
    }
  }

  // Helper function to check if a fee is a bus fee
  const isBusFee = (fee) => {
    return (
      fee.type === "Bus Fee" ||
      fee.category === "Bus Fee" ||
      (fee.heading && fee.heading.toLowerCase().includes("bus")) ||
      (fee.heading && fee.heading.toLowerCase().includes("transport"))
    )
  }

  // Fetch student bus fee data
  const fetchStudentBusFeeData = async () => {
    if (!administrationId) return []

    try {
      // First, get all students
      const admissionRef = collection(
        db,
        "Schools",
        auth.currentUser.uid,
        "AdmissionMaster",
        administrationId,
        "AdmissionSetup",
      )

      // Apply standard filter if selected
      let studentQuery = query(admissionRef)
      if (formData.standard && formData.standardSelect) {
        studentQuery = query(admissionRef, where("standard", "==", formData.standardSelect))
      }

      const studentSnapshot = await getDocs(studentQuery)

      if (studentSnapshot.empty) {
        return []
      }

      // For each student, get their fee details
      const studentData = []

      for (const studentDoc of studentSnapshot.docs) {
        const student = studentDoc.data()

        // Get student fee details
        const studentFeeRef = doc(
          db,
          "Schools",
          auth.currentUser.uid,
          "AdmissionMaster",
          administrationId,
          "StudentFeeDetails",
          studentDoc.id,
        )

        const feeSnapshot = await getDoc(studentFeeRef)

        if (feeSnapshot.exists()) {
          const feeData = feeSnapshot.data()
          const allFeeDetails = feeData.feeDetails || []

          // Filter to only include Bus Fee types
          let busFeeDetails = allFeeDetails.filter((fee) => isBusFee(fee))

          // Apply term/month filter if selected
          if (formData.term && formData.termSelect) {
            busFeeDetails = busFeeDetails.filter(
              (fee) => fee.heading === formData.termSelect || fee.feeHead === formData.termSelect,
            )
          }

          // Apply status filter if selected
          if (formData.status) {
            busFeeDetails = busFeeDetails.filter(
              (fee) => fee.status && fee.status.toLowerCase() === formData.status.toLowerCase(),
            )
          }

          // If there are bus fees after filtering
          if (busFeeDetails.length > 0) {
            // Calculate total bus fee amount for this student
            const totalBusFee = busFeeDetails.reduce((sum, fee) => {
              return sum + (Number.parseFloat(fee.amount) || 0)
            }, 0)

            // Get route information
            const routeInfo = student.busRouteNumber || ""
            const boardingPoint = student.boardingPoint || ""

            // Apply route filter if selected
            if (formData.route && formData.routeSelect) {
              if (routeInfo !== formData.routeSelect) {
                continue // Skip this student if route doesn't match
              }
            }

            // Add student to the report data
            studentData.push({
              studentName: student.studentName || "",
              fatherName: student.fatherName || "",
              address: student.address || "",
              admissionNumber: student.admissionNumber || "",
              standard: student.standard || "",
              section: student.section || "",
              month: formData.termSelect || "All",
              placeName: boardingPoint,
              routeNo: routeInfo,
              busFee: totalBusFee.toFixed(2),
            })
          }
        }
      }

      // Calculate totals
      const subTotal = studentData.reduce((sum, student) => sum + Number.parseFloat(student.busFee), 0)

      setReportTotals({
        subTotal: subTotal.toFixed(2),
        grandTotal: subTotal.toFixed(2), // Same as subTotal for now
      })

      return studentData
    } catch (error) {
      console.error("Error fetching student bus fee data:", error)
      toast.error("Failed to fetch student bus fee data. Please try again.")
      return []
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log("Form Data:", formData)

    setLoading(true)
    setShowReport(false)

    // Fetch student bus fee data based on filters
    const data = await fetchStudentBusFeeData()

    setLoading(false)

    if (data.length === 0) {
      toast.info("No data found for the selected filters.")
      return
    }

    setReportData(data)
    setShowReport(true)

    toast.success("Report generated successfully!", {
      position: "top-right",
      autoClose: 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      style: { background: "#0B3D7B", color: "white" },
    })
  }

  const handleReset = () => {
    setFormData({
      standard: false,
      standardSelect: "",
      term: false,
      termSelect: "",
      route: false,
      routeSelect: "",
      status: "",
    })
    setShowReport(false)
    setReportData([])
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    // Create a copy of the current form data
    const updatedFormData = { ...formData }

    // Update the specific field
    if (type === "checkbox") {
      updatedFormData[name] = checked

      // If checkbox is unchecked, also clear the corresponding select field
      if (!checked) {
        if (name === "standard") updatedFormData.standardSelect = ""
        if (name === "term") updatedFormData.termSelect = ""
        if (name === "route") updatedFormData.routeSelect = ""
      }
    } else {
      updatedFormData[name] = value
    }

    // Update the state with the new form data
    setFormData(updatedFormData)
  }

  // Print report
  const handlePrintReport = () => {
    const printContent = document.getElementById("reportToPrint")
    const originalContents = document.body.innerHTML

    document.body.innerHTML = printContent.innerHTML
    window.print()
    document.body.innerHTML = originalContents

    // Reload the page to restore React functionality
    window.location.reload()
  }

  // Download report as PDF
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true)

    try {
      const reportElement = reportRef.current

      if (!reportElement) {
        toast.error("Report element not found")
        setIsGeneratingPDF(false)
        return
      }

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      })

      const imgData = canvas.toDataURL("image/png")

      // Create PDF
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      const imgWidth = canvas.width
      const imgHeight = canvas.height

      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)

      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 20

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio)

      // Save PDF
      pdf.save(`BusFeeReport_${new Date().toISOString().slice(0, 10)}.pdf`)

      toast.success("PDF downloaded successfully!")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Failed to generate PDF. Please try again.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Generate PDF using jsPDF and autoTable
  const generateStructuredPDF = () => {
    setIsGeneratingPDF(true)

    try {
      const doc = new jsPDF()

      // Add title
      doc.setFontSize(16)
      doc.setTextColor(255, 0, 255) // Pink color for title
      doc.text(`BusFees Report On: ${new Date().toLocaleDateString()}`, 14, 20)

      // Add school info
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 255) // Blue color for "Report"
      doc.text("Report", 105, 30, { align: "center" })

      // Define table columns
      const columns = [
        { header: "Student Name", dataKey: "studentName" },
        { header: "Father Name", dataKey: "fatherName" },
        { header: "Address", dataKey: "address" },
        { header: "AdminNo", dataKey: "admissionNumber" },
        { header: "Month", dataKey: "month" },
        { header: "PlaceName", dataKey: "placeName" },
        { header: "RouteNo", dataKey: "routeNo" },
        { header: "Bus Fee", dataKey: "busFee" },
      ]

      // Prepare data for autoTable
      const tableData = reportData.map((item) => ({
        studentName: item.studentName,
        fatherName: item.fatherName,
        address: item.address,
        admissionNumber: item.admissionNumber,
        month: item.month,
        placeName: item.placeName,
        routeNo: item.routeNo,
        busFee: item.busFee,
      }))

      // Add standard and section info
      const standardInfo = formData.standard ? formData.standardSelect : "All"
      const sectionInfo = reportData.length > 0 ? reportData[0].section : ""

      // Add standard and section as a row before the table
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text(`Standard: ${standardInfo}`, 20, 40)
      doc.text(`Section: ${sectionInfo}`, 80, 40)

      // Generate table
      doc.autoTable({
        startY: 45,
        head: [columns.map((col) => col.header)],
        body: tableData.map((item) => columns.map((col) => item[col.dataKey])),
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 15 },
          4: { cellWidth: 15 },
          5: { cellWidth: 25 },
          6: { cellWidth: 15 },
          7: { cellWidth: 15, halign: "right" },
        },
        didDrawPage: (data) => {
          // Add footer with totals
          const pageHeight = doc.internal.pageSize.height
          doc.setFontSize(10)
          doc.text(`Sub Total: ${reportTotals.subTotal}`, 160, pageHeight - 20, { align: "right" })
          doc.text(`Grand Total: ${reportTotals.grandTotal}`, 160, pageHeight - 15, { align: "right" })
        },
      })

      // Save PDF
      doc.save(`BusFeeReport_${new Date().toISOString().slice(0, 10)}.pdf`)

      toast.success("PDF downloaded successfully!")
    } catch (error) {
      console.error("Error generating structured PDF:", error)
      toast.error("Failed to generate PDF. Please try again.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  if (initialLoading) {
    return (
      <MainContentPage>
        <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </MainContentPage>
    )
  }

  return (
    <MainContentPage>
      <div className="mb-4">
        <nav className="d-flex custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link>
          <span className="separator mx-2">&gt;</span>
          <div>Transaction</div>
          <span className="separator mx-2">&gt;</span>
          <span>Bus Balance Report</span>
        </nav>
      </div>

      <Container fluid className="px-0 px-lg-0">
        <Row>
          <Col xs={12}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="custom-btn-clr text-white py-3">
                <h2 className="mb-0">Bus Balance Report</h2>
              </Card.Header>

              <Card.Body className="p-4">
                <Form onSubmit={handleSubmit}>
                  <Row>
                    {/* Left Column */}
                    <Col lg={6}>
                      {/* Standard Field */}
                      <Row className="mb-4 align-items-center">
                        <Col md={4} className="d-flex align-items-center">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="standardCheck"
                              name="standard"
                              checked={formData.standard}
                              onChange={handleChange}
                            />
                            <label
                              className="form-check-label fw-bold"
                              htmlFor="standardCheck"
                              style={{ fontSize: "1.1rem" }}
                            >
                              Standard
                            </label>
                          </div>
                        </Col>
                        <Col md={8}>
                          {formData.standard && (
                            <Form.Select
                              name="standardSelect"
                              value={formData.standardSelect}
                              onChange={handleChange}
                              style={{ borderColor: "#0B3D7B", borderRadius: "5px", height: "45px" }}
                            >
                              <option value="">Select Standard</option>
                              {standards.map((standard) => (
                                <option key={standard.id} value={standard.standard}>
                                  {standard.standard}
                                </option>
                              ))}
                            </Form.Select>
                          )}
                        </Col>
                      </Row>

                      {/* Term / Month Field */}
                      <Row className="mb-4 align-items-center">
                        <Col md={4} className="d-flex align-items-center">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="termCheck"
                              name="term"
                              checked={formData.term}
                              onChange={handleChange}
                            />
                            <label
                              className="form-check-label fw-bold"
                              htmlFor="termCheck"
                              style={{ fontSize: "1.1rem" }}
                            >
                              Term / Month
                            </label>
                          </div>
                        </Col>
                        <Col md={8}>
                          {formData.term && (
                            <Form.Select
                              name="termSelect"
                              value={formData.termSelect}
                              onChange={handleChange}
                              style={{ borderColor: "#0B3D7B", borderRadius: "5px", height: "45px" }}
                            >
                              <option value="">Select Term / Month</option>
                              {feeHeads.map((feeHead) => (
                                <option key={feeHead.id} value={feeHead.feeHead}>
                                  {feeHead.feeHead}
                                </option>
                              ))}
                            </Form.Select>
                          )}
                        </Col>
                      </Row>
                    </Col>

                    {/* Right Column */}
                    <Col lg={6}>
                      {/* Routewise Field */}
                      <Row className="mb-4 align-items-center">
                        <Col md={4} className="d-flex align-items-center">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="routeCheck"
                              name="route"
                              checked={formData.route}
                              onChange={handleChange}
                            />
                            <label
                              className="form-check-label fw-bold"
                              htmlFor="routeCheck"
                              style={{ fontSize: "1.1rem" }}
                            >
                              Routewise
                            </label>
                          </div>
                        </Col>
                        <Col md={8}>
                          {formData.route && (
                            <Form.Select
                              name="routeSelect"
                              value={formData.routeSelect}
                              onChange={handleChange}
                              style={{ borderColor: "#0B3D7B", borderRadius: "5px", height: "45px" }}
                            >
                              <option value="">Select Route</option>
                              {routes.map((route) => (
                                <option key={route.id} value={route.route}>
                                  {route.route}
                                </option>
                              ))}
                            </Form.Select>
                          )}
                        </Col>
                      </Row>

                      {/* Status Field */}
                      <Row className="mb-4 align-items-center">
                        <Col md={4} className="d-flex align-items-center">
                          <div className="me-3" style={{ width: "20px", height: "20px" }}></div>
                          <Form.Label className="mb-0 fw-bold" style={{ fontSize: "1.1rem" }}>
                            Status
                          </Form.Label>
                        </Col>
                        <Col md={8}>
                          <Form.Select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            style={{ borderColor: "#0B3D7B", borderRadius: "5px", height: "45px" }}
                          >
                            <option value="">Select Status</option>
                            <option value="pending">Pending</option>
                            <option value="settled">Settled</option>
                          </Form.Select>
                        </Col>
                      </Row>
                    </Col>
                  </Row>

                  {/* Buttons */}
                  <Row className="justify-content-center gap-3 mt-4">
                    <Button
                      className="custom-btn-clr"
                      type="submit"
                      style={{
                        width: "150px",
                        fontSize: "1.1rem",
                      }}
                      disabled={loading}
                    >
                      {loading ? (
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      ) : (
                        <FaSearch className="me-2" />
                      )}
                      {loading ? " Loading..." : " Generate"}
                    </Button>
                    <Button
                      onClick={handleReset}
                      style={{
                        backgroundColor: "#808080",
                        border: "none",
                        width: "150px",
                        fontSize: "1.1rem",
                      }}
                      disabled={loading}
                    >
                      Reset
                    </Button>
                  </Row>
                </Form>
              </Card.Body>
            </Card>

            {/* Report Display */}
            {showReport && (
              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center py-3">
                  <h3 className="mb-0">Bus Fee Balance Report</h3>
                  <div>
                    <Button variant="primary" className="me-2" onClick={handlePrintReport} disabled={isGeneratingPDF}>
                      <FaPrint className="me-2" /> Print
                    </Button>
                    <Button variant="success" onClick={generateStructuredPDF} disabled={isGeneratingPDF}>
                      {isGeneratingPDF ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FaFilePdf className="me-2" /> Download PDF
                        </>
                      )}
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  <div id="reportToPrint">
                    <div ref={reportRef} className="report-container p-4">
                      <div className="report-header text-center mb-4">
                        <h2 style={{ color: "#FF00FF" }}>BusFees Report On: {new Date().toLocaleDateString()}</h2>
                        <h3 style={{ color: "#0000FF", marginTop: "10px" }}>Report</h3>
                      </div>

                      <Table bordered className="report-table">
                        <thead>
                          <tr>
                            <th>Student Name</th>
                            <th>Father Name</th>
                            <th>Address</th>
                            <th>AdminNo</th>
                            <th>Month</th>
                            <th>PlaceName</th>
                            <th>RouteNo</th>
                            <th>Bus Fee</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td colSpan="2">
                              <strong>Standard: </strong>
                              {formData.standard ? formData.standardSelect : "All"}
                            </td>
                            <td colSpan="6">
                              <strong>Section: </strong>
                              {reportData.length > 0 ? reportData[0].section : ""}
                            </td>
                          </tr>
                          {reportData.length > 0 ? (
                            reportData.map((item, index) => (
                              <tr key={index}>
                                <td>{item.studentName}</td>
                                <td>{item.fatherName}</td>
                                <td>{item.address}</td>
                                <td>{item.admissionNumber}</td>
                                <td>{item.month}</td>
                                <td>{item.placeName}</td>
                                <td>{item.routeNo}</td>
                                <td className="text-end">{item.busFee}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="8" className="text-center">
                                No data available
                              </td>
                            </tr>
                          )}
                          <tr>
                            <td colSpan="6"></td>
                            <td className="text-end">
                              <strong>Sub Total:</strong>
                            </td>
                            <td className="text-end">{reportTotals.subTotal}</td>
                          </tr>
                          <tr>
                            <td colSpan="6"></td>
                            <td className="text-end">
                              <strong>Grand Total:</strong>
                            </td>
                            <td className="text-end">{reportTotals.grandTotal}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Loading indicator below the table */}
            {loading && (
              <div className="text-center my-4">
                <Spinner animation="border" role="status" variant="primary">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-2">Generating report, please wait...</p>
              </div>
            )}
          </Col>
        </Row>
      </Container>

      {/* Toastify Container */}
      <ToastContainer />

      <style jsx>{`
        .custom-btn-clr {
          background-color: #0B3D7B;
          color: white;
          border: none;
        }
        
        .custom-breadcrumb a {
          color: #0B3D7B;
          text-decoration: none;
        }
        
        .custom-breadcrumb .separator {
          color: #6c757d;
        }
        
        /* Toastify custom styles */
        .Toastify__toast-container {
          z-index: 9999;
        }
        
        .Toastify__toast {
          background-color: #0B3D7B;
          color: white;
        }
        
        .Toastify__toast--success {
          background-color: #0B3D7B;
        }
        
        .Toastify__toast--error {
          background-color: #dc3545;
        }
        
        .Toastify__progress-bar {
          background-color: rgba(255, 255, 255, 0.7);
        }

        @media (max-width: 991.98px) {
          .form-label {
            font-size: 1rem !important;
          }
        }
        
        /* Report styles */
        .report-container {
          background-color: white;
          border: 1px solid #ddd;
        }
        
        .report-table {
          border-collapse: collapse;
          width: 100%;
        }
        
        .report-table th, .report-table td {
          border: 1px solid #000;
          padding: 8px;
        }
        
        .report-table th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        
        @media print {
          body * {
            visibility: hidden;
          }
          #reportToPrint, #reportToPrint * {
            visibility: visible;
          }
          #reportToPrint {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .report-container {
            border: none;
          }
        }

        /* Fix for checkbox styling */
        .form-check-input {
          width: 1rem;
          height: 1rem;
          margin-top: 0.25rem;
          vertical-align: top;
          border-radius: 0.25rem;
        }

        .form-check {
          display: flex;
          align-items: center;
        }

        .form-check-label {
          margin-left: 0.5rem;
        }
      `}</style>
    </MainContentPage>
  )
}

export default BusBalanceReport

