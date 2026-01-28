"use client"

import { useState, useEffect } from "react"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Link } from "react-router-dom"
import { FaPrint, FaSearch } from "react-icons/fa"
import { Form, Button, Card, Row, Col, Spinner, ToggleButton, ToggleButtonGroup, Table } from "react-bootstrap"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import DuplicateBillPreviewModal from "./BillPreviewModals/DuplicateBillPreviewModal"
import { useAuthContext } from "../../Context/AuthContext"
import { ENDPOINTS } from "../../SpringBoot/config"

const DuplicateBill = () => {
  const { getAuthHeaders, schoolId, currentAcademicYear } = useAuthContext()

  const [loading, setLoading] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState({ 
    name: "XPO Media", 
    address: "Kodairoad, Dindigul" 
  })
  const [showBillPreviewModal, setShowBillPreviewModal] = useState(false)
  const [billType, setBillType] = useState("daily-fee") // "daily-fee" or "other-fee"

  // Form state
  const [billNumber, setBillNumber] = useState("")
  const [billData, setBillData] = useState({
    billNumber: "",
    admissionNumber: "",
    studentName: "",
    fatherName: "",
    standard: "",
    course: "",
    section: "",
    billDate: "",
    paymentMode: "",
    paidAmount: 0,
    concessionAmount: 0,
    netPaidAmount: 0,
    previousBalance: 0,
    newBalance: 0,
    paymentNumber: "",
    operatorName: "",
    transactionNarrative: "",
    transactionDate: ""
  })

  const [feeTableData, setFeeTableData] = useState([])
  const [totals, setTotals] = useState({
    grossAmount: 0,
    totalConcession: 0,
    netPaid: 0
  })

  // Function to format date from ISO string to DD/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return ""
    
    try {
      const date = new Date(dateString)
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString // Return original if parsing fails
      }
      
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      
      return `${day}/${month}/${year}`
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }

  // Function to get current date in DD/MM/YYYY format for empty dates
  const getCurrentDateFormatted = () => {
    const today = new Date()
    const day = String(today.getDate()).padStart(2, '0')
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const year = today.getFullYear()
    return `${day}/${month}/${year}`
  }

  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchSchoolInfo()
    }

    fetchInitialData()
  }, [])

  const fetchSchoolInfo = async () => {
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/school/school-details?schoolId=${schoolId}`,
        {
          headers: getAuthHeaders()
        }
      )

      if (response.ok) {
        const result = await response.json()
        
        if (result && result.schoolName) {
          const cleanAddress = result.schoolAddress ? 
            result.schoolAddress.split('\n')[0] : 
            "Kodairoad, Dindigul"
          
          setSchoolInfo({
            name: result.schoolName || "XPO Media",
            address: cleanAddress,
            city: result.city,
            state: result.state,
            pincode: result.pincode
          })
        }
      } 
    } catch (error) {
      console.error("Error fetching school information:", error)
    }
  }

  const handleBillNumberChange = (e) => {
    setBillNumber(e.target.value)
  }

  const handleBillTypeChange = (value) => {
    setBillType(value)
    setBillNumber("")
    // Reset Data
    setBillData({
      billNumber: "",
      admissionNumber: "",
      studentName: "",
      fatherName: "",
      standard: "",
      course: "",
      section: "",
      billDate: "",
      paymentMode: "",
      paidAmount: 0,
      concessionAmount: 0,
      netPaidAmount: 0,
      previousBalance: 0,
      newBalance: 0,
      paymentNumber: "",
      operatorName: "",
      transactionNarrative: "",
      transactionDate: ""
    })
    setFeeTableData([])
    setTotals({
      grossAmount: 0,
      totalConcession: 0,
      netPaid: 0
    })
  }

  const fetchBillData = async () => {
    if (!billNumber.trim()) {
      toast.error("Please enter a bill number")
      return
    }

    if (!schoolId || !currentAcademicYear) {
      toast.error("School information not available")
      return
    }

    setLoading(true)
    try {
      // Build the request body
      const requestBody = {
        schoolId: schoolId,
        academicYear: currentAcademicYear,
        billNumber: billNumber,
        billType: billType === "daily-fee" ? "DailyFeeCollection" : "MiscellaneousFee"
      }

      console.log("Fetching bill data with:", requestBody)

      const response = await fetch(
        `${ENDPOINTS.transaction}/duplicatebill/search`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch bill data`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        const billDataResponse = result.data
        console.log("Fetched bill data:", billDataResponse)

        // FIX: Ensure the date is passed through formatDate function
        const formattedBillDate = billDataResponse.billDate 
          ? formatDate(billDataResponse.billDate) 
          : getCurrentDateFormatted()
          
        const formattedTransactionDate = billDataResponse.transactionDate 
          ? formatDate(billDataResponse.transactionDate) 
          : formattedBillDate

        // Normalize Fee Details
        let rawFeeList = []
        if (billDataResponse.feeDetails && billDataResponse.feeDetails.length > 0) {
          rawFeeList = billDataResponse.feeDetails
        } else if (billDataResponse.feePayments && billDataResponse.feePayments.length > 0) {
          rawFeeList = billDataResponse.feePayments
        }

        // Process Fees
        let totalGrossAmount = 0
        let totalConcessionCalc = 0
        let totalPaidCalc = 0

        const processedFees = rawFeeList.map(fee => {
          const paid = Number.parseFloat(fee.paidAmount || fee.amount || 0)
          const concession = Number.parseFloat(fee.concessionAmount || 0)
          // Gross amount = paid + concession
          const grossAmount = paid + concession 

          totalGrossAmount += grossAmount
          totalConcessionCalc += concession
          totalPaidCalc += paid

          return {
            description: fee.feeHeading || fee.description || "Fee Payment",
            feeHead: fee.feeHeading || fee.feeHead || "Fee Payment",
            accountHead: fee.accountHead || "",
            grossAmount: grossAmount,
            isConcession: false,
            concessionAmount: concession,
            paidAmount: paid
          }
        })

        // If no fees found but we have bill totals, create a dummy entry
        if (processedFees.length === 0) {
          const paid = Number.parseFloat(billDataResponse.paidAmount) || 0
          const concession = Number.parseFloat(billDataResponse.concessionAmount) || 0
          const grossAmount = paid + concession
          processedFees.push({
            description: billType === "daily-fee" ? "Fee Payment" : "Miscellaneous Fee",
            feeHead: "Fee Payment",
            grossAmount: grossAmount,
            concessionAmount: concession,
            paidAmount: paid,
            isConcession: false
          })
          totalGrossAmount = grossAmount
          totalConcessionCalc = concession
          totalPaidCalc = paid
        }

        setFeeTableData(processedFees)
        
        // Calculate totals for preview modal
        setTotals({
          grossAmount: totalGrossAmount,
          totalConcession: totalConcessionCalc,
          netPaid: totalPaidCalc
        })

        // Update Bill Data State
        setBillData({
          billNumber: billDataResponse.billNumber || billNumber,
          admissionNumber: billDataResponse.admissionNumber || "",
          studentName: billDataResponse.studentName || "",
          fatherName: billDataResponse.fatherName || "",
          standard: billDataResponse.standard || "",
          course: billDataResponse.course || billDataResponse.standard || "",
          section: billDataResponse.section || "",
          billDate: formattedBillDate, // Use the formatted date here
          paymentMode: billDataResponse.paymentMode || "",
          paidAmount: totalPaidCalc, 
          concessionAmount: totalConcessionCalc,
          netPaidAmount: billDataResponse.netPaidAmount || totalPaidCalc, 
          previousBalance: Number.parseFloat(billDataResponse.previousBalance) || 0,
          newBalance: Number.parseFloat(billDataResponse.newBalance) || 0,
          paymentNumber: billDataResponse.paymentNumber || "",
          operatorName: billDataResponse.operatorName || "",
          transactionNarrative: billDataResponse.transactionNarrative || "",
          transactionDate: formattedTransactionDate
        })
        
        toast.success(`${billType === "daily-fee" ? "Daily Fee" : "Other Fee"} bill data loaded successfully`)
      } else {
        throw new Error(result.message || `No ${billType === "daily-fee" ? "daily fee" : "other fee"} found with this number`)
      }
    } catch (error) {
      console.error("Error fetching bill data:", error)
      toast.error(error.message || "Failed to fetch bill data. Please check bill number.")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateClick = () => {
    if (!billData.billNumber) {
      toast.error("Please fetch bill data first")
      return
    }
    setShowBillPreviewModal(true)
  }

  const handleCancel = () => {
    setBillNumber("")
    setBillData({
      billNumber: "",
      admissionNumber: "",
      studentName: "",
      fatherName: "",
      standard: "",
      course: "",
      section: "",
      billDate: "",
      paymentMode: "",
      paidAmount: 0,
      concessionAmount: 0,
      netPaidAmount: 0,
      previousBalance: 0,
      newBalance: 0,
      paymentNumber: "",
      operatorName: "",
      transactionNarrative: "",
      transactionDate: ""
    })
    setFeeTableData([])
    setTotals({
      grossAmount: 0,
      totalConcession: 0,
      netPaid: 0
    })
  }

  const handleBillPreviewClose = () => {
    setShowBillPreviewModal(false)
  }

  return (
    <MainContentPage>
      <div className="mb-4">
        <nav className="d-flex custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link>
          <span className="separator mx-2">&gt;</span>
          <div>Transaction</div>
          <span className="separator mx-2">&gt;</span>
          <span>Duplicate Bill</span>
        </nav>
      </div>

      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white p-3">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="m-0">Duplicate Bill</h2>
            <div className="bill-type-toggle">
              <ToggleButtonGroup
                type="radio"
                name="billType"
                value={billType}
                onChange={handleBillTypeChange}
              >
                <ToggleButton
                  id="daily-fee-toggle"
                  value="daily-fee"
                  variant={billType === "daily-fee" ? "light" : "outline-light"}
                  size="sm"
                >
                  Daily Fee
                </ToggleButton>
                <ToggleButton
                  id="other-fee-toggle"
                  value="other-fee"
                  variant={billType === "other-fee" ? "light" : "outline-light"}
                  size="sm"
                >
                  Other Fee
                </ToggleButton>
              </ToggleButtonGroup>
            </div>
          </div>
        </Card.Header>

        <Card.Body className="p-4">
          <Form>
            <Row className="g-3 mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Bill Number *</Form.Label>
                  <div className="d-flex">
                    <Form.Control
                      type="text"
                      value={billNumber}
                      onChange={handleBillNumberChange}
                      placeholder={`Enter ${billType === "daily-fee" ? "daily fee" : "other fee"} bill number`}
                      onKeyDown={(e) => e.key === 'Enter' && fetchBillData()}
                    />
                    <Button variant="primary" className="ms-2" onClick={fetchBillData} disabled={loading}>
                      {loading ? <Spinner size="sm" animation="border" /> : <><FaSearch className="me-1" /> Search</>}
                    </Button>
                  </div>
                  <Form.Text className="text-muted">
                    {billType === "daily-fee"
                      ? "Search for regular fee payments (Tuition, Hostel, Transport)"
                      : "Search for other fee payments (Miscellaneous, Individual)"
                    }
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Bill Date</Form.Label>
                  <Form.Control type="text" value={billData.billDate || ""} readOnly className="bg-light" />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Student Name</Form.Label>
                  <Form.Control type="text" value={billData.studentName || ""} readOnly className="bg-light" />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Admission Number</Form.Label>
                  <Form.Control type="text" value={billData.admissionNumber || ""} readOnly className="bg-light" />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Father's Name</Form.Label>
                  <Form.Control type="text" value={billData.fatherName || ""} readOnly className="bg-light" />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Payment Mode</Form.Label>
                  <Form.Control type="text" value={billData.paymentMode || ""} readOnly className="bg-light" />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Standard</Form.Label>
                  <Form.Control type="text" value={billData.standard || ""} readOnly className="bg-light" />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Section</Form.Label>
                  <Form.Control type="text" value={billData.section || ""} readOnly className="bg-light" />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Transaction Ref</Form.Label>
                  <Form.Control type="text" value={billData.paymentNumber || ""} readOnly className="bg-light" />
                </Form.Group>
              </Col>
            </Row>

            {/* Fee Details Table (Preview in Main Page) */}
            {feeTableData.length > 0 && (
              <div className="mb-4">
                <h5 className="mb-3">Fee Details</h5>
                <div className="table-responsive">
                  <Table striped bordered hover size="sm">
                    <thead className="bg-light">
                      <tr>
                        <th>#</th>
                        <th>Fee Head</th>
                        <th>Description</th>
                        <th className="text-end">Gross Amount (₹)</th>
                        <th className="text-end">Concession (₹)</th>
                        <th className="text-end">Net Paid (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feeTableData.map((fee, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{fee.feeHead}</td>
                          <td>{fee.description}</td>
                          <td className="text-end">{fee.grossAmount?.toFixed(2) || "0.00"}</td>
                          <td className="text-end text-danger">
                            {fee.concessionAmount > 0 ? `-${fee.concessionAmount.toFixed(2)}` : "0.00"}
                          </td>
                          <td className="text-end text-success fw-bold">
                            {fee.paidAmount?.toFixed(2) || "0.00"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="d-flex flex-wrap justify-content-center gap-3 p-3">
              <Button
                className="btn custom-btn-clr flex-grow-1 flex-md-grow-0"
                onClick={handleGenerateClick}
                disabled={!billData.billNumber || loading}
                size="lg"
              >
                <FaPrint className="me-2" /> Generate Duplicate Bill
              </Button>
              <Button 
                className="btn btn-secondary flex-grow-1 flex-md-grow-0" 
                onClick={handleCancel}
                size="lg"
              >
                Clear
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Duplicate Bill Preview Modal */}
      <DuplicateBillPreviewModal
        show={showBillPreviewModal}
        onHide={handleBillPreviewClose}
        billData={billData}
        feeTableData={feeTableData}
        totals={totals}  
        schoolInfo={schoolInfo}
        billType={billType === "daily-fee" ? "BillingEntry" : "OtherFee"} 
        onClose={handleBillPreviewClose}
      />

      <ToastContainer position="top-right" autoClose={3000} />

      <style>{`
        .bg-primary {
          background-color: #0B3D7B !important;
        }
        .text-primary {
          color: #0B3D7B !important;
        }
        .custom-btn-clr {
          background-color: #0B3D7B;
          border-color: #0B3D7B;
          color: white;
          min-width: 200px;
        }
        .custom-btn-clr:hover {
          background-color: #092c5a;
          border-color: #092c5a;
        }
        .custom-btn-clr:disabled {
          background-color: #6c757d;
          border-color: #6c757d;
        }
        .form-control {
          border-radius: 4px;
          border: 1px solid #ced4da;
        }
        .form-control:read-only {
          background-color: #f8f9fa;
        }
        .form-label {
          font-weight: 500;
        }
        .gap-3 {
          gap: 1rem;
        }
        .btn {
          padding: 0.5rem 2rem;
        }
        .bill-type-toggle .btn {
          padding: 0.375rem 1rem;
          font-weight: 500;
        }
        .bill-type-toggle .btn-light {
          background-color: white;
          color: #0B3D7B;
        }
        .bill-type-toggle .btn-outline-light {
          background-color: transparent;
          color: white;
          border-color: white;
        }
        .bill-type-toggle .btn-outline-light:hover {
          background-color: rgba(255,255,255,0.1);
        }
        @media (max-width: 768px) {
          .btn {
            width: 100%;
          }
          .bill-type-toggle {
            margin-top: 10px;
            width: 100%;
          }
          .bill-type-toggle .btn {
            width: 50%;
          }
          .card-header .d-flex {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </MainContentPage>
  )
}

export default DuplicateBill