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

const BusPeriodicalCollectionReport = () => {
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState({ 
    name: "", 
    address: "", 
    city: "", 
    state: "", 
    pincode: "" 
  })
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [collectionData, setCollectionData] = useState([])
  const [totalCollection, setTotalCollection] = useState(0)
  const [totalConcession, setTotalConcession] = useState(0)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const componentRef = useRef(null)
  const navigate = useNavigate()
  
  const { 
    schoolId, 
    currentAcademicYear, 
    getAuthHeaders,
    user,
    admin 
  } = useAuthContext()

  useEffect(() => {
    if (schoolId) {
        fetchSchoolInfo()
    }
  }, [schoolId])

  const fetchSchoolInfo = async () => {
    try {
      if (!schoolId) return;
      
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/school/school-details?schoolId=${schoolId}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      )

      if (response.ok) {
        const data = await response.json()
        setSchoolInfo({
          name: data.schoolName || user?.name || admin?.name || "School Name",
          address: data.schoolAddress || "School Address",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || ""
        })
      } else {
        setSchoolInfo({
          name: user?.name || admin?.name || "School Name",
          address: "School Address",
          city: "",
          state: "",
          pincode: ""
        })
      }
    } catch (error) {
      console.error("Error fetching school information:", error)
      setSchoolInfo({
        name: user?.name || admin?.name || "School Name",
        address: "School Address",
        city: "",
        state: "",
        pincode: ""
      })
    }
  }

  const processCollectionData = (rawData) => {
    if (!rawData || rawData.length === 0) {
      return { processedData: [], grandTotal: 0 }
    }

    const processedData = []
    let grandTotal = 0
    let grandConcession = 0

    // Group by date first
    const dateGroups = rawData.reduce((acc, item) => {
      // Convert ISO string to local date string
      const dateObj = new Date(item.timestamp || item.busBillDate);
      const date = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-IN') : "Unknown Date";
      
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(item)
      return acc
    }, {})

    // Sort dates
    const sortedDates = Object.keys(dateGroups).sort((a, b) => {
        const dateA = new Date(a.split('/').reverse().join('-'));
        const dateB = new Date(b.split('/').reverse().join('-'));
        return dateA - dateB;
    });

    sortedDates.forEach((date) => {
      const dateItems = dateGroups[date];
      // Add date header
      processedData.push({ type: "date", date })

      // Group by admission number within each date
      const admissionGroups = dateItems.reduce((acc, item) => {
        const admissionNumber = item.admissionNumber
        if (!acc[admissionNumber]) {
          acc[admissionNumber] = []
        }
        acc[admissionNumber].push(item)
        return acc
      }, {})

      Object.entries(admissionGroups).forEach(([admissionNumber, admissionItems]) => {
        let studentTotal = 0
        let concessionTotal = 0
        const firstItem = admissionItems[0];

        // Add all transactions for this student
        admissionItems.forEach((item, index) => {
          const paidAmount = Number(item.paidAmount) || Number(item.totalPaidAmount) || 0
          const concessionAmount = Number(item.concession) || 0
          const originalAmount = Number(item.originalAmount) || Number(item.totalAmount) || (paidAmount + concessionAmount + (Number(item.balanceAmount) || 0))
          const balanceAmount = Number(item.balanceAmount) || 0

          const processedItem = {
            ...item,
            date: date,
            paidAmount: paidAmount,
            concessionAmount: concessionAmount,
            originalAmount: originalAmount,
            balanceAmount: balanceAmount,
            type: "transaction"
          }

          processedData.push(processedItem)
          studentTotal += paidAmount
          concessionTotal += concessionAmount
        })

        // Add concession row if there's any concession
        if (concessionTotal > 0) {
          processedData.push({
            type: "concession",
            admissionNumber,
            amount: concessionTotal,
            description: "Bus Fee Concession",
          })
          grandConcession += concessionTotal
        }

        // Add subtotal row for this student
        processedData.push({
          type: "subtotal",
          admissionNumber,
          amount: studentTotal,
          studentName: firstItem?.studentName || ""
        })

        grandTotal += studentTotal
      })
    })

    setTotalConcession(grandConcession)
    setTotalCollection(grandTotal)
    return { processedData, grandTotal }
  }

  const fetchPeriodicalCollection = async () => {
    if (!schoolId) {
      toast.error("School ID not available")
      return
    }

    if (!currentAcademicYear) {
      toast.error("Academic Year not set")
      return
    }

    setLoading(true)
    try {
      const startAdjusted = new Date(startDate.getTime() - (startDate.getTimezoneOffset() * 60000));
      const endAdjusted = new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000));
      
      const start = startAdjusted.toISOString().split('T')[0];
      const end = endAdjusted.toISOString().split('T')[0];
      
      const url = `${ENDPOINTS.transport}/buscollection/periodical-collection?startDate=${start}&endDate=${end}&schoolId=${schoolId}&academicYear=${currentAcademicYear}`;
      console.log("Fetching URL:", url);

      const response = await fetch(url, {
          method: "GET",
          headers: getAuthHeaders(),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch bus collection data: ${response.statusText}`)
      }

      const data = await response.json()
      
      console.log("API Response:", data)

      const rawCollections = Array.isArray(data.collections) ? data.collections : (Array.isArray(data) ? data : [])
      
      if (rawCollections.length === 0) {
        setCollectionData([])
        setTotalCollection(0)
        setTotalConcession(0)
        toast.info("No bus fee collection data found for the selected date range")
        return
      }

      const processedCollections = rawCollections.map(item => {
        const paidAmount = Number(item.totalPaidAmount) || Number(item.paidAmount) || 0
        const concession = Number(item.concession) || Number(item.totalConcessionAmount) || 0
        const balanceAmount = Number(item.balanceAmount) || Number(item.remainingBalance) || 0
        const originalAmount = Number(item.originalAmount) || Number(item.totalAmount) || (paidAmount + concession + balanceAmount)

        return {
          billNumber: item.billNumber || item.busBillNumber || "N/A",
          admissionNumber: item.admissionNumber || "N/A",
          studentName: item.studentName || "N/A",
          fatherName: item.fatherName || "N/A",
          standard: item.standard || "N/A",
          section: item.section || "N/A",
          boardingPoint: item.boardingPoint || "N/A",
          routeNumber: item.routeNumber || "N/A",
          description: item.description || "Bus Fee Payment",
          amount: paidAmount,
          paidAmount: paidAmount,
          concession: concession,
          originalAmount: originalAmount,
          balanceAmount: balanceAmount,
          paymentMode: item.paymentMode || "N/A",
          paymentNumber: item.paymentNumber || "N/A",
          operatorName: item.operatorName || "N/A",
          transactionNarrative: item.transactionNarrative || "",
          timestamp: item.timestamp || item.busBillDate || new Date(),
          busFeeDetails: item.busFeeDetails || []
        }
      })

      console.log("Processed Collections:", processedCollections)

      const { processedData } = processCollectionData(processedCollections)
      setCollectionData(processedData)

      toast.success(`Successfully loaded ${rawCollections.length} bus fee collection records`)

    } catch (error) {
      console.error("Error fetching bus collection data:", error)
      toast.error(error.message || "Failed to fetch bus collection data")
      setCollectionData([]);
    } finally {
      setLoading(false)
    }
  }

  const handleStartDateChange = (date) => {
    setStartDate(date)
  }

  const handleEndDateChange = (date) => {
    setEndDate(date)
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction)
    setShowDetailsModal(true)
  }

  const handlePrint = () => {
    window.print()
  }

  const generatePDF = () => {
    return new Promise((resolve, reject) => {
      try {
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        })
        
        const pageWidth = doc.internal.pageSize.getWidth()
        const margin = 10
        
        // Header
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text(schoolInfo.name || "SCHOOL NAME", pageWidth / 2, 12, { align: "center" })
        
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        const address = [schoolInfo.address, schoolInfo.city, schoolInfo.state, schoolInfo.pincode].filter(Boolean).join(', ')
        doc.text(address || "Address", pageWidth / 2, 18, { align: "center" })
        
        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        doc.text("BUS FEE PERIODICAL COLLECTION REPORT", pageWidth / 2, 28, { align: "center" })
        
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        doc.text(`Report Period: ${startDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')}`, margin, 38)
        doc.text(`Academic Year: ${currentAcademicYear || "N/A"}`, pageWidth - margin - 40, 38)
        
        // Table data
        const tableColumns = [
          "Date",
          "Bill No",
          "Adm No", 
          "Student Name",
          "Class",
          "Route",
          "Boarding Point",
          "Paid Amt", 
          "Balance Amt",  // ADDED
          "Concession",
          "Payment Mode",
          "Ref No"        // ADDED
        ]

        const tableRows = []
        let currentDate = ""

        collectionData.forEach((item) => {
          if (item.type === "date") {
            currentDate = item.date
          } else if (item.type === "transaction") {
            tableRows.push([
              currentDate,
              item.billNumber,
              item.admissionNumber,
              item.studentName,
              `${item.standard}-${item.section}`,
              item.routeNumber,
              item.boardingPoint,
              `Rs ${(item.paidAmount || 0).toFixed(2)}`,
              `Rs ${(item.balanceAmount || 0).toFixed(2)}`, // ADDED
              `Rs ${(item.concessionAmount || 0).toFixed(2)}`,
              item.paymentMode,
              item.paymentNumber || "-"                     // ADDED
            ])
          } else if (item.type === "subtotal") {
            tableRows.push([{ content: `Subtotal for ${item.admissionNumber}: Rs ${(item.amount || 0).toFixed(2)}`, colSpan: 12, styles: { fillColor: [255, 243, 205], fontStyle: 'bold', halign: 'right' } }])
          } else if (item.type === "concession") {
            tableRows.push([{ content: `Concession for ${item.admissionNumber}: -Rs ${(item.amount || 0).toFixed(2)}`, colSpan: 12, styles: { textColor: [220, 53, 69], fontStyle: 'bold', halign: 'right' } }])
          }
        })

        // Add grand total
        tableRows.push([{ content: `GRAND TOTAL: Rs ${totalCollection.toFixed(2)}`, colSpan: 12, styles: { fillColor: [25, 135, 84], textColor: 255, fontStyle: 'bold', halign: 'right' } }])

        autoTable(doc, {
          head: [tableColumns],
          body: tableRows,
          startY: 44,
          styles: { 
            fontSize: 7,
            cellPadding: 1.5
          },
          headStyles: { 
            fillColor: [11, 61, 123],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8
          },
          alternateRowStyles: {
            fillColor: [240, 240, 240]
          },
          margin: { top: 44 }
        })

        // Footer
        const finalY = doc.lastAutoTable.finalY + 8
        doc.setFontSize(7)
        doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, margin, finalY)
        doc.text(`Page 1 of 1`, pageWidth - margin - 15, finalY)

        resolve(doc)
      } catch (error) {
        reject(error)
      }
    })
  }

  const downloadPDF = async () => {
    if (collectionData.length === 0) {
      toast.error("No data available to generate PDF")
      return
    }

    setProcessing(true)
    try {
      const doc = await generatePDF()
      const fileName = `Bus_Periodical_Collection_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
      toast.success("PDF downloaded successfully")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Failed to generate PDF")
    } finally {
      setProcessing(false)
    }
  }

  const handleReset = () => {
    setStartDate(new Date())
    setEndDate(new Date())
    setCollectionData([])
    setTotalCollection(0)
    setTotalConcession(0)
  }

  const renderTableBody = () => {
    if (collectionData.length === 0) {
      return (
        <tr>
          <td colSpan="12" className="text-center py-4">
            No bus fee collection data available for the selected date range.
          </td>
        </tr>
      )
    }

    return collectionData.map((item, index) => {
      if (item.type === "date") {
        return (
          <tr key={`date-${index}`} className="table-primary fw-bold">
            <td colSpan="12" className="text-center small">
              {item.date}
            </td>
          </tr>
        )
      }

      if (item.type === "subtotal") {
        return (
          <tr key={`subtotal-${item.admissionNumber}-${index}`} className="table-warning fw-bold small">
            <td colSpan="7"></td>
            <td colSpan="1" className="text-end">Subtotal:</td>
            <td className="text-end text-success">Rs {item.amount?.toFixed(2) || '0.00'}</td>
            <td colSpan="3"></td>
          </tr>
        )
      }

      if (item.type === "concession") {
        return (
          <tr key={`concession-${item.admissionNumber}-${index}`} className="table-danger fw-bold small">
            <td colSpan="9"></td>
            <td colSpan="1" className="text-end">Concession:</td>
            <td className="text-end text-danger">-Rs {item.amount?.toFixed(2) || '0.00'}</td>
            <td></td>
          </tr>
        )
      }

      // Regular transaction row
      return (
        <tr key={`${item.admissionNumber}-${item.billNumber}-${index}`} className="small">
          <td className="text-nowrap">{item.date}</td>
          <td>
            <div className="d-flex align-items-center">
              <span className="fw-medium">{item.billNumber}</span>
              <Button 
                variant="outline-info" 
                size="sm" 
                className="ms-1 p-1"
                onClick={() => handleViewDetails(item)}
                title="View Details"
              >
                <FaEye size={10} />
              </Button>
            </div>
          </td>
          <td className="fw-medium">{item.admissionNumber}</td>
          <td className="fw-medium">{item.studentName}</td>
          <td className="text-center">{item.standard}-{item.section}</td>
          <td className="text-center">{item.routeNumber}</td>
          <td>{item.boardingPoint}</td>
          <td className="text-end text-success fw-bold">Rs {item.paidAmount?.toFixed(2) || '0.00'}</td>
          <td className="text-end text-warning fw-bold">Rs {item.balanceAmount?.toFixed(2) || '0.00'}</td>
          <td className="text-end text-danger fw-bold">Rs {item.concessionAmount?.toFixed(2) || '0.00'}</td>
          <td className="text-center">{item.paymentMode}</td>
          <td className="text-center">{item.paymentNumber || '-'}</td>
        </tr>
      )
    })
  }

  const TransactionDetailsModal = () => (
    <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
      <Modal.Header closeButton className="py-2">
        <Modal.Title className="fs-6">Transaction Details - {selectedTransaction?.billNumber}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-2">
        {selectedTransaction ? (
          <div className="row">
            <div className="col-md-6">
              <h6 className="text-primary mb-2 fs-6">Student Information</h6>
              <p className="mb-1 small"><strong>Bus Bill No:</strong> {selectedTransaction.billNumber}</p>
              <p className="mb-1 small"><strong>Admission No:</strong> {selectedTransaction.admissionNumber}</p>
              <p className="mb-1 small"><strong>Student Name:</strong> {selectedTransaction.studentName}</p>
              <p className="mb-1 small"><strong>Father Name:</strong> {selectedTransaction.fatherName}</p>
              <p className="mb-1 small"><strong>Class:</strong> {selectedTransaction.standard} - {selectedTransaction.section}</p>
              <p className="mb-1 small"><strong>Route:</strong> {selectedTransaction.routeNumber}</p>
              <p className="mb-1 small"><strong>Boarding Point:</strong> {selectedTransaction.boardingPoint}</p>
              <p className="mb-1 small"><strong>Date:</strong> {selectedTransaction.date}</p>
            </div>
            <div className="col-md-6">
              <h6 className="text-primary mb-2 fs-6">Payment Summary</h6>
              <div className="border rounded p-2 bg-light small">
                <div className="d-flex justify-content-between mb-1">
                  <strong>Original Amount:</strong>
                  <span className="text-primary fw-bold">Rs {selectedTransaction.originalAmount?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <strong>Paid Amount:</strong>
                  <span className="text-success fw-bold">Rs {selectedTransaction.paidAmount?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <strong>Balance Amount:</strong>
                  <span className="text-warning fw-bold">Rs {selectedTransaction.balanceAmount?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <strong>Concession:</strong>
                  <span className="text-danger fw-bold">Rs {selectedTransaction.concessionAmount?.toFixed(2) || '0.00'}</span>
                </div>
                <hr className="my-1" />
                <div className="d-flex justify-content-between">
                  <strong>Payment Mode:</strong>
                  <span>{selectedTransaction.paymentMode}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <strong>Payment Number:</strong>
                  <span>{selectedTransaction.paymentNumber || 'N/A'}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <strong>Operator:</strong>
                  <span>{selectedTransaction.operatorName}</span>
                </div>
                {selectedTransaction.transactionNarrative && (
                  <div className="mt-1">
                    <strong>Narrative:</strong>
                    <p className="mb-0 small">{selectedTransaction.transactionNarrative}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Fee Breakdown */}
            {selectedTransaction.busFeeDetails && selectedTransaction.busFeeDetails.length > 0 && (
              <div className="col-12 mt-3">
                <h6 className="text-primary mb-2 fs-6">Fee Breakdown</h6>
                <Table size="sm" bordered striped className="small">
                  <thead className="table-primary">
                    <tr>
                      <th>Fee Head</th>
                      <th className="text-end">Original Amount</th>
                      <th className="text-end">Paid Amount</th>
                      <th className="text-end">Concession</th>
                      <th className="text-end">Balance Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTransaction.busFeeDetails.map((fee, idx) => (
                      <tr key={idx}>
                        <td>{fee.feeHead || 'Bus Fee'}</td>
                        <td className="text-end">Rs {((fee.originalAmount || fee.feeAmount || 0)).toFixed(2)}</td>
                        <td className="text-end">Rs {((fee.paidAmount || 0)).toFixed(2)}</td>
                        <td className="text-end">Rs {((fee.concessionAmount || 0)).toFixed(2)}</td>
                        <td className="text-end">Rs {((fee.balanceAmount || fee.remainingBalance || 0)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-3">
            <p className="small">No transaction details available.</p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="py-2">
        <Button variant="secondary" size="sm" onClick={() => setShowDetailsModal(false)}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  )

  return (
    <MainContentPage>
      <Container fluid>
        <div className="mb-3">
          <Button 
            variant="outline-secondary" 
            size="sm"
            className="mb-2"
            onClick={handleBack}
          >
            <FaArrowLeft className="me-1" /> Back
          </Button>
          
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white py-2">
              <h5 className="mb-0 d-flex align-items-center">
                <FaBus className="me-2" /> Bus Fee Periodical Collection Report
              </h5>
            </Card.Header>
            <Card.Body className="p-3">
              <Row className="align-items-end mb-3">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small">Start Date</Form.Label>
                    <DatePicker
                      selected={startDate}
                      onChange={handleStartDateChange}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      dateFormat="dd/MM/yyyy"
                      className="form-control form-control-sm"
                      maxDate={new Date()}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small">End Date</Form.Label>
                    <DatePicker
                      selected={endDate}
                      onChange={handleEndDateChange}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate}
                      dateFormat="dd/MM/yyyy"
                      className="form-control form-control-sm"
                      maxDate={new Date()}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={fetchPeriodicalCollection} 
                      disabled={loading}
                    >
                      {loading ? <Spinner size="sm" /> : <FaSearch className="me-1" />}
                      {loading ? 'Loading...' : 'Fetch Report'}
                    </Button>
                    
                    <Button 
                      variant="success" 
                      size="sm"
                      onClick={handlePrint}
                      disabled={collectionData.length === 0}
                    >
                      <FaPrint className="me-1" /> Print
                    </Button>
                    
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={downloadPDF}
                      disabled={processing || collectionData.length === 0}
                    >
                      {processing ? <Spinner size="sm" /> : <FaFilePdf className="me-1" />}
                      {processing ? 'Generating...' : 'PDF'}
                    </Button>
                    
                    <Button variant="secondary" size="sm" onClick={handleReset}>
                      <FaUndo className="me-1" /> Reset
                    </Button>
                  </div>
                </Col>
              </Row>

              {/* Summary Cards */}
              {collectionData.length > 0 && (
                <Row className="mb-3">
                  <Col md={6}>
                    <Card className="bg-success text-white">
                      <Card.Body className="py-2">
                        <h6 className="mb-1 small">Total Collection</h6>
                        <h5 className="mb-0">
                          <FaRupeeSign className="me-1" />
                          {totalCollection.toFixed(2)}
                        </h5>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="bg-danger text-white">
                      <Card.Body className="py-2">
                        <h6 className="mb-1 small">Total Concession</h6>
                        <h5 className="mb-0">
                          <FaRupeeSign className="me-1" />
                          {totalConcession.toFixed(2)}
                        </h5>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              {/* Main Table */}
              <div id="report-content">
                <div className="table-responsive">
                  <Table striped bordered hover size="sm">
                    <thead className="table-dark">
                      <tr>
                        <th className="text-nowrap small">Date</th>
                        <th className="text-nowrap small">Bus Bill No</th>
                        <th className="text-nowrap small">Adm No</th>
                        <th className="text-nowrap small">Student Name</th>
                        <th className="text-nowrap small">Class</th>
                        <th className="text-nowrap small">Route</th>
                        <th className="text-nowrap small">Boarding Point</th>
                        <th className="text-end text-nowrap small">Paid Amount</th>
                        <th className="text-end text-nowrap small">Balance Amount</th>
                        <th className="text-end text-nowrap small">Concession</th>
                        <th className="text-nowrap small">Payment Mode</th>
                        <th className="text-nowrap small">Ref No</th>
                      </tr>
                    </thead>
                    <tbody>
                      {renderTableBody()}
                    </tbody>
                  </Table>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        <TransactionDetailsModal />
        <ToastContainer position="top-right" autoClose={3000} />
      </Container>
    </MainContentPage>
  )
}

export default BusPeriodicalCollectionReport