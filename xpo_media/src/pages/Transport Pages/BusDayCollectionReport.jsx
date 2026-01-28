"use client"

import { useState, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Form, Button, Container, Spinner, Table, Card, Row, Col, Modal } from "react-bootstrap"
import { useAuthContext } from "../../Context/AuthContext"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { FaPrint, FaFilePdf, FaUndo, FaSearch, FaArrowLeft, FaBus, FaEye, FaRupeeSign } from "react-icons/fa"
import { ENDPOINTS } from "../../SpringBoot/config"

const BusDayCollectionReport = () => {
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState({ 
    name: "", 
    address: "", 
    city: "", 
    state: "", 
    pincode: "" 
  })
  const [reportDate, setReportDate] = useState(new Date())
  const [collectionData, setCollectionData] = useState([])
  const [totalCollection, setTotalCollection] = useState(0)
  const [totalConcession, setTotalConcession] = useState(0)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const navigate = useNavigate()
  
  const { schoolId, currentAcademicYear, getAuthHeaders, user, admin } = useAuthContext()

  useEffect(() => {
    fetchSchoolInfo()
  }, [])

  const fetchSchoolInfo = async () => {
    try {
      if (!schoolId) return;
      const response = await fetch(`${ENDPOINTS.admissionmaster}/school/school-details?schoolId=${schoolId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        setSchoolInfo({
          name: data.schoolName || user?.name || admin?.name || "School Name",
          address: data.schoolAddress || "School Address",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || ""
        })
      }
    } catch (error) {
      console.error("Error fetching school information:", error)
    }
  }

  // Process raw data to group by student and add subtotals
  const processCollectionData = (rawData) => {
    if (!rawData || rawData.length === 0) {
      return { processedData: [], grandTotal: 0 }
    }

    // Group transactions by Admission Number
    const groupedData = rawData.reduce((acc, item) => {
      const admissionNumber = item.admissionNumber
      if (!acc[admissionNumber]) acc[admissionNumber] = []
      acc[admissionNumber].push(item)
      return acc
    }, {})

    const processedData = []
    let grandTotal = 0
    let grandConcession = 0

    Object.entries(groupedData).forEach(([admissionNumber, items]) => {
      let studentTotal = 0
      let concessionTotal = 0

      items.forEach((item) => {
        // Ensure numeric values
        const paidAmount = Number(item.paidAmount) || 0
        const concessionAmount = Number(item.concession) || 0
        
        processedData.push({ 
            ...item, 
            type: "transaction",
            // Ensure these exist for display
            originalAmount: Number(item.originalAmount) || 0,
            balanceAmount: Number(item.balanceAmount) || 0
        })
        studentTotal += paidAmount
        concessionTotal += concessionAmount
      })

      // Add concession row if applicable
      if (concessionTotal > 0) {
        processedData.push({ 
            type: "concession", 
            admissionNumber, 
            amount: concessionTotal 
        })
      }

      // Add subtotal row for the student
      processedData.push({ 
          type: "subtotal", 
          admissionNumber, 
          amount: studentTotal, 
          studentName: items[0]?.studentName 
      })

      grandTotal += studentTotal
      grandConcession += concessionTotal
    })

    setTotalConcession(grandConcession)
    setTotalCollection(grandTotal)
    return { processedData, grandTotal }
  }

  const fetchDayCollection = async () => {
    if (!schoolId || !currentAcademicYear) {
      toast.error("School ID or Academic Year missing")
      return
    }

    setLoading(true)
    try {
      // Format date as YYYY-MM-DD for backend (LocalDate)
      // Adjust for timezone offset to ensure correct date is sent
      const offset = reportDate.getTimezoneOffset()
      const date = new Date(reportDate.getTime() - (offset*60*1000))
      const formattedDate = date.toISOString().split('T')[0]
      
      const response = await fetch(
        `${ENDPOINTS.transport}/buscollection/day-collection?date=${formattedDate}&schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      )

      if (!response.ok) {
          const err = await response.json()
          throw new Error(err.error || "Failed to fetch data")
      }

      const data = await response.json()
      const rawCollections = data.collections || []
      
      if (rawCollections.length === 0) {
        setCollectionData([])
        setTotalCollection(0)
        setTotalConcession(0)
        toast.info("No collections found for this date")
      } else {
        const { processedData } = processCollectionData(rawCollections)
        setCollectionData(processedData)
        toast.success(`Found ${rawCollections.length} records`)
      }

    } catch (error) {
      console.error("Fetch error:", error)
      toast.error(error.message || "Error loading report")
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (date) => setReportDate(date)
  const handleBack = () => navigate(-1)
  
  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction)
    setShowDetailsModal(true)
  }

  const handlePrint = () => window.print()

  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    
    // Header
    doc.setFontSize(16).setFont("helvetica", "bold").text(schoolInfo.name, 148, 15, { align: "center" })
    doc.setFontSize(12).setFont("helvetica", "normal").text(schoolInfo.address, 148, 22, { align: "center" })
    doc.setFontSize(14).setFont("helvetica", "bold").text("BUS FEE DAY COLLECTION REPORT", 148, 32, { align: "center" })
    doc.setFontSize(10).text(`Date: ${reportDate.toLocaleDateString('en-IN')}`, 14, 40)

    // Table Columns
    const tableColumn = ["Bill No", "Adm No", "Student", "Class", "Route", "Original", "Paid", "Bal", "Conc", "Mode"]
    const tableRows = []

    collectionData.forEach(item => {
      if(item.type === "transaction") {
        tableRows.push([
          item.billNumber,
          item.admissionNumber,
          item.studentName,
          `${item.standard}-${item.section}`,
          item.routeNumber || "-",
          item.originalAmount.toFixed(2),
          item.paidAmount.toFixed(2),
          item.balanceAmount.toFixed(2),
          item.concession.toFixed(2),
          item.paymentMode
        ])
      } else if(item.type === "subtotal") {
        tableRows.push([{ content: `Subtotal: ${item.amount.toFixed(2)}`, colSpan: 10, styles: { fillColor: [255, 243, 205], fontStyle: 'bold', halign: 'right' } }])
      }
    })

    // Grand Total Row
    tableRows.push([{ content: `GRAND TOTAL: ${totalCollection.toFixed(2)}`, colSpan: 10, styles: { fillColor: [25, 135, 84], textColor: 255, fontStyle: 'bold', halign: 'right' } }])

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [11, 61, 123], textColor: 255 }
    })

    doc.save(`Bus_Report_${reportDate.toLocaleDateString('en-CA')}.pdf`)
  }

  // Render the HTML Table Body
  const renderTableBody = () => {
    if (collectionData.length === 0) return <tr><td colSpan="13" className="text-center">No Data</td></tr>

    return collectionData.map((item, idx) => {
      if (item.type === "subtotal") {
        return (
          <tr key={`sub-${idx}`} className="table-warning fw-bold">
            <td colSpan="8" className="text-end">Subtotal for {item.admissionNumber}:</td>
            <td className="text-end">Rs {item.amount.toFixed(2)}</td>
            <td colSpan="4"></td>
          </tr>
        )
      }
      if (item.type === "concession") {
        return (
          <tr key={`conc-${idx}`} className="table-danger fw-bold">
            <td colSpan="10" className="text-end">Concession: -Rs {item.amount.toFixed(2)}</td>
            <td colSpan="3"></td>
          </tr>
        )
      }
      // Transaction Row
      return (
        <tr key={`txn-${idx}`}>
          <td>
             {item.billNumber} 
             <Button size="sm" variant="link" className="p-0 ms-2" onClick={()=>handleViewDetails(item)}>
                <FaEye/>
             </Button>
          </td>
          <td>{item.admissionNumber}</td>
          <td>{item.studentName}</td>
          <td>{item.fatherName}</td>
          <td>{item.standard}-{item.section}</td>
          <td>{item.routeNumber}</td>
          <td>{item.boardingPoint}</td>
          <td className="text-end text-primary fw-bold">{Number(item.originalAmount).toFixed(2)}</td>
          <td className="text-end text-success fw-bold">{Number(item.paidAmount).toFixed(2)}</td>
          <td className="text-end text-warning fw-bold">{Number(item.balanceAmount).toFixed(2)}</td>
          <td className="text-end text-danger fw-bold">{Number(item.concession).toFixed(2)}</td>
          <td>{item.paymentMode}</td>
          <td>{item.paymentNumber || '-'}</td>
        </tr>
      )
    })
  }

  // Modal for details
  const TransactionDetailsModal = () => (
    <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>Transaction Details - {selectedTransaction?.billNumber}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedTransaction && (
          <div className="row g-3">
             <div className="col-md-6">
                <h6 className="text-primary border-bottom pb-2">Student Info</h6>
                <p className="mb-1"><strong>Name:</strong> {selectedTransaction.studentName}</p>
                <p className="mb-1"><strong>Adm No:</strong> {selectedTransaction.admissionNumber}</p>
                <p className="mb-1"><strong>Class:</strong> {selectedTransaction.standard} - {selectedTransaction.section}</p>
                <p className="mb-1"><strong>Father:</strong> {selectedTransaction.fatherName}</p>
                <p className="mb-1"><strong>Route:</strong> {selectedTransaction.routeNumber}</p>
             </div>
             <div className="col-md-6">
                <h6 className="text-primary border-bottom pb-2">Payment Info</h6>
                <div className="d-flex justify-content-between"><span>Original:</span> <strong>₹ {selectedTransaction.originalAmount}</strong></div>
                <div className="d-flex justify-content-between text-success"><span>Paid:</span> <strong>₹ {selectedTransaction.paidAmount}</strong></div>
                <div className="d-flex justify-content-between text-warning"><span>Balance:</span> <strong>₹ {selectedTransaction.balanceAmount}</strong></div>
                <div className="d-flex justify-content-between"><span>Mode:</span> <span>{selectedTransaction.paymentMode}</span></div>
                <div className="d-flex justify-content-between"><span>Ref No:</span> <span>{selectedTransaction.paymentNumber || '-'}</span></div>
             </div>
             <div className="col-12 mt-3">
                <h6 className="text-primary border-bottom pb-2">Fee Breakdown</h6>
                <Table size="sm" bordered>
                    <thead className="table-light"><tr><th>Head</th><th className="text-end">Paid</th><th className="text-end">Remaining</th></tr></thead>
                    <tbody>
                        {selectedTransaction.busFeeDetails?.map((f, i) => (
                            <tr key={i}>
                                <td>{f.feeHead}</td>
                                <td className="text-end">₹ {f.paidAmount}</td>
                                <td className="text-end">₹ {f.remainingBalance}</td>
                            </tr>
                        ))}
                        {(!selectedTransaction.busFeeDetails || selectedTransaction.busFeeDetails.length === 0) && 
                            <tr><td colSpan="3" className="text-center">No breakdown available</td></tr>
                        }
                    </tbody>
                </Table>
             </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>Close</Button>
      </Modal.Footer>
    </Modal>
  )

  return (
    <MainContentPage>
      <Container fluid>
        <div className="mb-4">
          <Button variant="outline-secondary" className="mb-3" onClick={handleBack}><FaArrowLeft className="me-2" /> Back</Button>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white"><h4 className="mb-0"><FaBus className="me-2" /> Bus Fee Day Collection</h4></Card.Header>
            <Card.Body>
              <Row className="align-items-end mb-4">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Select Date</Form.Label>
                    <DatePicker selected={reportDate} onChange={handleDateChange} dateFormat="dd/MM/yyyy" className="form-control" maxDate={new Date()} />
                  </Form.Group>
                </Col>
                <Col md={9}>
                  <div className="d-flex gap-2">
                    <Button variant="primary" onClick={fetchDayCollection} disabled={loading}>
                      {loading ? <Spinner size="sm" /> : <FaSearch className="me-2" />} Fetch Report
                    </Button>
                    <Button variant="success" onClick={handlePrint} disabled={!collectionData.length}><FaPrint className="me-2"/> Print</Button>
                    <Button variant="danger" onClick={downloadPDF} disabled={!collectionData.length}><FaFilePdf className="me-2"/> PDF</Button>
                  </div>
                </Col>
              </Row>

              {(totalCollection > 0) && (
                <Row className="mb-4">
                  <Col md={6}><Card className="bg-success text-white"><Card.Body><h4>Total Collection: <FaRupeeSign/> {totalCollection.toFixed(2)}</h4></Card.Body></Card></Col>
                  <Col md={6}><Card className="bg-danger text-white"><Card.Body><h4>Total Concession: <FaRupeeSign/> {totalConcession.toFixed(2)}</h4></Card.Body></Card></Col>
                </Row>
              )}

              <div className="table-responsive">
                <Table striped bordered hover size="sm">
                  <thead className="table-dark">
                    <tr>
                      <th>Bill No</th><th>Adm No</th><th>Student</th><th>Father</th><th>Class</th><th>Route</th><th>Point</th>
                      <th className="text-end">Original</th><th className="text-end">Paid</th><th className="text-end">Balance</th><th className="text-end">Conc</th>
                      <th>Mode</th><th>Ref No</th>
                    </tr>
                  </thead>
                  <tbody>{renderTableBody()}</tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </div>
        <TransactionDetailsModal />
        <ToastContainer />
      </Container>
    </MainContentPage>
  )
}

export default BusDayCollectionReport