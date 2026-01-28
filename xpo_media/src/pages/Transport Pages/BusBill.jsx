"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Form, Button, Row, Col, Container, Table, ListGroup, Modal, Card, Image } from "react-bootstrap"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import MainContentPage from "../../components/MainContent/MainContentPage"
import BusPaymentHistoryModal from "./BillPreviewModals/BusPaymentHistoryModal"
import BusBillPreviewModal from "./BillPreviewModals/BusBillPreviewModal"
import { useAuthContext } from "../../Context/AuthContext"
import { ENDPOINTS } from "../../SpringBoot/config"
import defaultProfileImage from "../../images/StudentProfileIcon/studentProfile.jpeg"

const BusBillEntry = () => {
  const navigate = useNavigate()
  const dropdownRef = useRef(null)
  const confirmYesButtonRef = useRef(null)
  const { getAuthHeaders, schoolId, currentAcademicYear } = useAuthContext()

  const [schoolInfo, setSchoolInfo] = useState({
    name: "XPOMEDIA MATRIC. HR. SEC. SCHOOL",
    address: "TIRUVANNAMALAIA 606601"
  })

  const [busBillData, setBusBillData] = useState({
    busBillNumber: "",
    admissionNumber: "",
    studentName: "",
    fatherName: "",
    course: "",
    section: "",
    pickupPoint: "",
    busBillDate: new Date(),
    originalBusAmount: "0",
    busPaidAmount: "0",
    remainingBalance: "0", // UPDATED
    paymentMode: "Cash",
    paymentNumber: "",
    operatorName: "XPO ADMIN",
    transactionNarrative: "",
    transactionDate: null,
    routeNumber: "",
    busFeeAmount: "0"
  })

  const [studentData, setStudentData] = useState(null)
  const [busFeeTableData, setBusFeeTableData] = useState([])
  const [totalOriginalBusAmount, setTotalOriginalBusAmount] = useState(0)
  const [studentImageUrl, setStudentImageUrl] = useState(defaultProfileImage)
  const [isLoading, setIsLoading] = useState(false)
  const [studentLoaded, setStudentLoaded] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [busPaymentHistory, setBusPaymentHistory] = useState([])
  const [studentsList, setStudentsList] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showBusBillPreviewModal, setShowBusBillPreviewModal] = useState(false)
  const [busBillNumberLocked, setBusBillNumberLocked] = useState(false)

  useEffect(() => {
    const fetchSchoolInfo = async () => {
      try {
        const response = await fetch(`${ENDPOINTS.admissionmaster}/school/school-details?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        })
        if (response.ok) {
          const data = await response.json()
          setSchoolInfo({
            name: data.schoolName || "XPOMEDIA MATRIC. HR. SEC. SCHOOL",
            address: data.schoolAddress || "TIRUVANNAMALAIA 606601",
          })
        }
      } catch (error) {
        console.error("Error fetching school information:", error)
      }
    }
    if (schoolId) fetchSchoolInfo()
  }, [schoolId, getAuthHeaders])

  useEffect(() => {
    const generateBusBillNumber = async () => {
      if (!schoolId) return
      try {
        const currentDate = new Date()
        const currentYear = currentDate.getFullYear()
        const financialYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
        const response = await fetch(`${ENDPOINTS.transport}/busbillentry/last-bus-bill-number?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        })
        let nextNumber = 1
        if (response.ok) {
          const data = await response.json()
          if (data.lastBusBillNumber) {
            const parts = data.lastBusBillNumber.split("/")
            if (parts.length === 2) {
              const busPrefix = parts[0].split("-")
              if (busPrefix.length === 2 && busPrefix[0] === "BUS") {
                const lastBusBillNumber = Number.parseInt(busPrefix[1])
                nextNumber = lastBusBillNumber + 1
              }
            }
          }
        } else {
          const storedLastBusBill = localStorage.getItem(`lastBusBillNumber_${schoolId}`)
          if (storedLastBusBill) {
            const parts = storedLastBusBill.split("/")
            if (parts.length === 2) {
              const busPrefix = parts[0].split("-")
              if (busPrefix.length === 2 && busPrefix[0] === "BUS") {
                const lastBusBillNumber = Number.parseInt(busPrefix[1])
                nextNumber = lastBusBillNumber + 1
              }
            }
          }
        }
        const newBusBillNumber = `BUS-${nextNumber}/${financialYear}`
        setBusBillData((prev) => ({ ...prev, busBillNumber: newBusBillNumber }))
        setBusBillNumberLocked(true)
        localStorage.setItem(`lastBusBillNumber_${schoolId}`, newBusBillNumber)
      } catch (error) {
        console.error("Error generating bus bill number:", error)
        const currentDate = new Date()
        const currentYear = currentDate.getFullYear()
        const financialYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
        const newBusBillNumber = `BUS-1/${financialYear}`
        setBusBillData((prev) => ({ ...prev, busBillNumber: newBusBillNumber }))
        setBusBillNumberLocked(true)
      }
    }
    if (schoolId && !busBillNumberLocked) generateBusBillNumber()
  }, [schoolId, busBillNumberLocked, getAuthHeaders])

  const fetchStudentsList = async () => {
    if (!schoolId || !currentAcademicYear) return
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/studentreport/datas?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        { headers: getAuthHeaders() }
      )
      if (response.ok) {
        const studentsData = await response.json()
        const busStudents = studentsData.filter(student => student.busFee && Number.parseFloat(student.busFee) > 0)
        setStudentsList(busStudents || [])
      } else {
        setStudentsList([])
      }
    } catch (error) {
      console.error("Error fetching students list:", error)
      setStudentsList([])
    }
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter" && showConfirmModal) {
        e.preventDefault()
        confirmYesButtonRef.current?.click()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [showConfirmModal])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setBusBillData((prev) => ({ ...prev, [name]: value }))
    if (name === "admissionNumber") {
      if (searchTimeout) clearTimeout(searchTimeout)
      if (value.trim() === "") {
        setShowDropdown(false)
        return
      }
      const timeoutId = setTimeout(() => searchStudents(value), 300)
      setSearchTimeout(timeoutId)
    }
  }

  const handleDateChange = (date, name) => {
    setBusBillData((prev) => ({ ...prev, [name]: date }))
  }

  const searchStudents = (searchTerm) => {
    if (searchTerm.trim() === "") {
      setShowDropdown(false)
      return
    }
    const filteredStudents = studentsList.filter(student =>
      student.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    if (filteredStudents.length > 0) {
      setStudentsList(filteredStudents)
      setShowDropdown(true)
    } else {
      setShowDropdown(false)
    }
  }

  const handleStudentSelect = (admissionNumber) => {
    setBusBillData((prev) => ({ ...prev, admissionNumber }))
    setShowDropdown(false)
    fetchStudentDataByAdmissionNumber(admissionNumber)
  }

  const fetchStudentData = async () => {
    if (!busBillData.admissionNumber || !schoolId) return
    fetchStudentDataByAdmissionNumber(busBillData.admissionNumber)
  }

  const fetchBusPaymentHistoryForStudent = async (admissionNumber) => {
    try {
      const response = await fetch(
        `${ENDPOINTS.transport}/busbillentry/bus-payment-history/${admissionNumber}?schoolId=${schoolId}`,
        { headers: getAuthHeaders() }
      )
      if (response.ok) {
        const paymentHistory = await response.json()
        return paymentHistory.map(payment => ({
          ...payment,
          referenceNo: payment.paymentNumber || `BUS-REF-${payment.id || ''}`
        }))
      }
      return []
    } catch (error) {
      console.error("Error fetching bus payment history:", error)
      return []
    }
  }

  const calculateBusRemainingBalance = (busFeeAmount, paymentHistory) => {
    let totalBusPaid = 0
    let totalBusConcession = 0
    paymentHistory.forEach(payment => {
      try {
        const busFeePaymentsJson = payment.bus_fee_payments_json
        if (busFeePaymentsJson) {
          const busFeePayments = JSON.parse(busFeePaymentsJson)
          busFeePayments.forEach(busFeePayment => {
            const feeHead = busFeePayment.feeHead
            if (feeHead === "Bus Fee") {
              const paidAmount = parseFloat(busFeePayment.paidAmount) || 0
              const concessionAmount = parseFloat(busFeePayment.concessionAmount) || 0
              totalBusPaid += paidAmount
              totalBusConcession += concessionAmount
            }
          })
        }
      } catch (error) {
        console.error("Error parsing bus fee payments JSON:", error)
      }
    })
    const originalAmount = parseFloat(busFeeAmount) || 0
    const remainingBalance = originalAmount - totalBusPaid - totalBusConcession
    return {
      originalAmount: originalAmount.toString(),
      previousPaidAmount: totalBusPaid.toString(),
      previousConcessionAmount: totalBusConcession.toString(),
      remainingBalance: Math.max(0, remainingBalance).toFixed(2),
      baseRemainingBalance: Math.max(0, remainingBalance).toFixed(2), // STORE BASE
      status: remainingBalance <= 0 ? "Settled" : "Pending"
    }
  }

  const fetchStudentDataByAdmissionNumber = async (admissionNumber) => {
    if (!admissionNumber || !schoolId) return
    setIsLoading(true)
    setStudentImageUrl(defaultProfileImage)
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/studentreport/datas?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        { headers: getAuthHeaders() }
      )
      if (!response.ok) {
        toast.error("Failed to fetch student data")
        setIsLoading(false)
        return
      }
      const allStudents = await response.json()
      const student = allStudents.find(s => s.admissionNumber === admissionNumber)
      if (!student) {
        toast.error("No student found with this admission number")
        setIsLoading(false)
        return
      }
      if (!student.busFee || Number.parseFloat(student.busFee) <= 0) {
        toast.error("This student does not have bus fee assigned")
        setIsLoading(false)
        return
      }

      const busFeeDetail = {
        heading: "Bus Fee",
        amount: student.busFee.toString(),
        type: "Transport",
        description: "School Bus Transportation Fee"
      }

      const paymentHistory = await fetchBusPaymentHistoryForStudent(admissionNumber)
      const busFeeWithBalance = calculateBusRemainingBalance(student.busFee, paymentHistory)

      if (student.id) {
        try {
          const photoUrl = `${ENDPOINTS.admissionmaster}/admission/${student.id}/photo?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
          const imageResponse = await fetch(photoUrl, { headers: getAuthHeaders() })
          if (imageResponse.ok) setStudentImageUrl(photoUrl)
        } catch (error) {
          console.error("Error fetching student image:", error)
        }
      }

      setStudentData(student)
      setBusFeeTableData([{
        ...busFeeDetail,
        ...busFeeWithBalance,
        selected: false,
        paidAmount: "0",
        concessionAmount: "0",
        baseRemainingBalance: busFeeWithBalance.remainingBalance, // Use base remaining
        remainingBalance: busFeeWithBalance.remainingBalance, // Current dynamic remaining
        status: Number(busFeeWithBalance.remainingBalance) === 0 ? "Settled" : "Pending",
      }])

      setTotalOriginalBusAmount(Number.parseFloat(busFeeWithBalance.originalAmount))

      setBusBillData((prev) => ({
        ...prev,
        studentName: student.studentName || "",
        fatherName: student.fatherName || "",
        course: student.standard || "",
        section: student.section || "",
        pickupPoint: student.boardingPoint || "",
        routeNumber: student.busRouteNumber || "",
        originalBusAmount: busFeeWithBalance.originalAmount,
        busPaidAmount: "0",
        remainingBalance: busFeeWithBalance.remainingBalance, // UPDATED field
        busFeeAmount: student.busFee.toString()
      }))

      setStudentLoaded(true)
      toast.success("Student bus fee data loaded successfully")
    } catch (error) {
      console.error("Error fetching student data:", error)
      toast.error("Failed to fetch student data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (schoolId && currentAcademicYear) fetchStudentsList()
  }, [schoolId, currentAcademicYear])

  const handleBusFeeSelection = (index) => {
    const updatedBusFeeTableData = [...busFeeTableData]
    updatedBusFeeTableData[index].selected = !updatedBusFeeTableData[index].selected
    if (!updatedBusFeeTableData[index].selected) {
      updatedBusFeeTableData[index].paidAmount = "0"
      updatedBusFeeTableData[index].concessionAmount = "0"
    }
    setBusFeeTableData(updatedBusFeeTableData)
    updateBusTotals(updatedBusFeeTableData)
  }

  const handleBusFeeAmountChange = (index, value) => {
    const updatedBusFeeTableData = [...busFeeTableData]
    const busFeeItem = updatedBusFeeTableData[index]
    const paidAmount = Number.parseFloat(value) || 0
    const baseRemaining = Number.parseFloat(busFeeItem.baseRemainingBalance) || 0
    const concessionAmount = Number.parseFloat(busFeeItem.concessionAmount) || 0

    if (paidAmount > baseRemaining - concessionAmount) {
      toast.error(`Paid amount cannot exceed remaining balance`)
      return
    }
    busFeeItem.paidAmount = value
    setBusFeeTableData(updatedBusFeeTableData)
    updateBusTotals(updatedBusFeeTableData)
  }

  const handleBusConcessionChange = (index, value) => {
    const updatedBusFeeTableData = [...busFeeTableData]
    const busFeeItem = updatedBusFeeTableData[index]
    const concessionAmount = Number.parseFloat(value) || 0
    const baseRemaining = Number.parseFloat(busFeeItem.baseRemainingBalance) || 0
    const paidAmount = Number.parseFloat(busFeeItem.paidAmount) || 0

    if (concessionAmount > baseRemaining - paidAmount) {
      toast.error(`Concession amount cannot exceed remaining balance`)
      return
    }
    busFeeItem.concessionAmount = value
    setBusFeeTableData(updatedBusFeeTableData)
    updateBusTotals(updatedBusFeeTableData)
  }

  // Status check helper (no UI column)
  const calculateStatus = (feeItem) => {
    const baseRemaining = Number.parseFloat(feeItem.baseRemainingBalance) || 0
    const paidAmount = Number.parseFloat(feeItem.paidAmount) || 0
    const concessionAmount = Number.parseFloat(feeItem.concessionAmount) || 0
    const newBal = baseRemaining - paidAmount - concessionAmount
    return newBal <= 0 ? "Settled" : "Pending"
  }

  const updateBusTotals = (busFeeTableData) => {
    // Calculate total paid from the input fields
    const totalBusPaid = busFeeTableData.reduce((sum, fee) => sum + Number.parseFloat(fee.paidAmount || 0), 0)
    const totalBusConcession = busFeeTableData.reduce((sum, fee) => sum + Number.parseFloat(fee.concessionAmount || 0), 0)
    
    // Calculate current remaining balance (Base Remaining - Paid - Concession)
    const totalBaseRemaining = busFeeTableData.reduce((sum, fee) => sum + Number.parseFloat(fee.baseRemainingBalance || 0), 0)
    const newBusBalance = totalBaseRemaining - totalBusPaid - totalBusConcession

    setBusBillData((prev) => ({
      ...prev,
      busPaidAmount: totalBusPaid.toFixed(2),
      remainingBalance: Math.max(0, newBusBalance).toFixed(2),
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!schoolId) { toast.error("School ID is not available."); return }
    if (!studentData || !busBillData.admissionNumber) { toast.error("Please select a student first"); return }
    
    const totalBusPaidAmount = busFeeTableData.reduce((sum, fee) => sum + Number.parseFloat(fee.paidAmount || 0), 0)
    const totalBusConcessionAmount = busFeeTableData.reduce((sum, fee) => sum + Number.parseFloat(fee.concessionAmount || 0), 0)

    if (totalBusPaidAmount <= 0 && totalBusConcessionAmount <= 0) {
      toast.error("Total paid amount or concession amount must be greater than zero")
      return
    }
    const selectedBusFeeHeads = busFeeTableData.filter(fee => fee.selected && (Number.parseFloat(fee.paidAmount) > 0 || Number.parseFloat(fee.concessionAmount) > 0))
    if (selectedBusFeeHeads.length === 0) {
      toast.error("Please select bus fee and enter payment amount")
      return
    }
    setShowConfirmModal(true)
  }

  const formatDateForBackend = (date) => {
    if (!date) return null;
    const dateObj = new Date(date);
    return dateObj.toISOString().slice(0, 19);
  }

  const processBusPayment = async () => {
    try {
      setShowConfirmModal(false)
      setIsLoading(true)

      const totalBusPaidAmount = busFeeTableData.reduce((sum, fee) => sum + Number.parseFloat(fee.paidAmount || 0), 0)
      const totalBusConcessionAmount = busFeeTableData.reduce((sum, fee) => sum + Number.parseFloat(fee.concessionAmount || 0), 0)

      const busPaymentData = {
        schoolId,
        academicYear: currentAcademicYear,
        busBillNumber: busBillData.busBillNumber,
        admissionNumber: busBillData.admissionNumber,
        studentName: busBillData.studentName,
        fatherName: busBillData.fatherName,
        standard: busBillData.course,
        section: busBillData.section,
        paymentMode: busBillData.paymentMode,
        paymentNumber: busBillData.paymentNumber,
        operatorName: busBillData.operatorName,
        busBillDate: formatDateForBackend(busBillData.busBillDate),
        transactionDate: formatDateForBackend(busBillData.transactionDate),
        transactionNarrative: busBillData.transactionNarrative,
        boardingPoint: busBillData.pickupPoint,
        routeNumber: busBillData.routeNumber,
        originalBusAmount: busBillData.originalBusAmount,
        totalBusPaidAmount: totalBusPaidAmount.toFixed(2),
        // Send remaining balance
        remainingBalance: Number.parseFloat(busBillData.remainingBalance),
        totalBusConcessionAmount: totalBusConcessionAmount.toFixed(2),
        
        // Calculate per-head remaining balance for JSON
        busFeePayments: busFeeTableData
          .filter((fee) => fee.selected && (Number.parseFloat(fee.paidAmount) > 0 || Number.parseFloat(fee.concessionAmount) > 0))
          .map((fee) => {
             const currentBase = parseFloat(fee.baseRemainingBalance) || 0
             const paid = parseFloat(fee.paidAmount) || 0
             const conc = parseFloat(fee.concessionAmount) || 0
             const remaining = Math.max(0, currentBase - paid - conc)

             return {
                feeHead: fee.heading,
                feeAmount: fee.originalAmount || fee.amount,
                paidAmount: fee.paidAmount,
                concessionAmount: fee.concessionAmount,
                remainingBalance: remaining.toFixed(2), // NEW: Store balance
                type: fee.type || "Transport",
                description: fee.description || "Bus Fee Payment"
             }
          }),
        studentId: studentData?.id,
        busFeeAmount: busBillData.busFeeAmount
      }

      const response = await fetch(`${ENDPOINTS.transport}/busbillentry/process-bus-payment?schoolId=${schoolId}`, {
        method: "POST",
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(busPaymentData)
      })

      if (!response.ok) throw new Error(await response.text() || "Bus payment processing failed")

      toast.success("Bus fee payment processed successfully!")
      setIsLoading(false)
      setShowBusBillPreviewModal(true)
    } catch (error) {
      console.error("Error processing bus payment:", error)
      toast.error(`Failed to process bus payment: ${error.message}`)
      setIsLoading(false)
    }
  }

  const fetchBusPaymentHistory = async () => {
    if (!schoolId || !busBillData.admissionNumber) { toast.error("Please select a student first"); return }
    setIsLoading(true)
    try {
      const response = await fetch(`${ENDPOINTS.transport}/busbillentry/bus-payment-history/${busBillData.admissionNumber}?schoolId=${schoolId}`, { headers: getAuthHeaders() })
      if (response.ok) {
        const history = await response.json()
        setBusPaymentHistory(history.map(payment => ({ ...payment, referenceNo: payment.paymentNumber || `BUS-REF-${payment.id || ''}` })))
      } else {
        toast.info("No bus payment history found")
        setBusPaymentHistory([])
      }
      setShowHistoryModal(true)
    } catch (error) {
      console.error("Error fetching bus payment history:", error)
      toast.error("Failed to fetch bus payment history")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setBusBillNumberLocked(false)
    setBusBillData({
      busBillNumber: "",
      admissionNumber: "",
      studentName: "",
      fatherName: "",
      course: "",
      section: "",
      pickupPoint: "",
      busBillDate: new Date(),
      originalBusAmount: "0",
      busPaidAmount: "0",
      remainingBalance: "0",
      paymentMode: "Cash",
      paymentNumber: "",
      operatorName: "XPO ADMIN",
      transactionNarrative: "",
      transactionDate: null,
      routeNumber: "",
      busFeeAmount: "0"
    })
    setBusFeeDetails([])
    setBusFeeTableData([])
    setTotalOriginalBusAmount(0)
    setStudentData(null)
    setStudentLoaded(false)
    setStudentImageUrl(defaultProfileImage)
  }

  const handleBusBillPreviewClose = () => {
    setShowBusBillPreviewModal(false)
    resetForm()
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <Card className="shadow-sm">
          <Card.Header style={{ backgroundColor: "#0B3D7B" }} className="text-white py-3 d-flex justify-content-between align-items-center">
            <h2 className="mb-0 h4">Bus Fee Billing Dashboard</h2>
            <div className="text-white">School: {schoolInfo.name}</div>
          </Card.Header>
          <Card.Body className="p-4">
            <Form onSubmit={handleSubmit} className="bus-billing-form">
              <Row className="mb-4">
                <Col md={4}>
                  <div className="d-flex justify-content-center mb-3">
                    <Image src={studentImageUrl} alt="Student" roundedCircle style={{ width: "100px", height: "100px", objectFit: "cover" }} onError={(e) => { e.target.src = defaultProfileImage }} />
                  </div>
                  <Form.Group className="my-1">
                    <Form.Label>Bus Bill No.</Form.Label>
                    <Form.Control type="text" name="busBillNumber" value={busBillData.busBillNumber} onChange={handleInputChange} disabled className="form-control-light" />
                  </Form.Group>
                  <Form.Group className="my-1">
                    <Form.Label>Admin. No.</Form.Label>
                    <div className="d-flex position-relative" ref={dropdownRef}>
                      <Form.Control type="text" name="admissionNumber" value={busBillData.admissionNumber} onChange={handleInputChange} className="form-control-light" autoComplete="off" placeholder="Enter admission number" onFocus={() => { if (busBillData.admissionNumber && studentsList.length > 0) setShowDropdown(true) }} />
                      <Button variant="outline-primary" onClick={fetchStudentData} disabled={!busBillData.admissionNumber} className="ms-2">Load</Button>
                      {showDropdown && studentsList.length > 0 && (
                        <ListGroup className="position-absolute dropdown-menu show w-100" style={{ top: "100%", zIndex: 1000, maxHeight: "200px", overflowY: "auto" }}>
                          {studentsList.map((student) => (
                            <ListGroup.Item key={student.id} action onClick={() => handleStudentSelect(student.admissionNumber)} className="dropdown-item">
                              {student.admissionNumber} - {student.studentName} (Bus: ₹{student.busFee})
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      )}
                    </div>
                  </Form.Group>
                  <Form.Group className="my-1">
                    <Form.Label>Student Name</Form.Label>
                    <Form.Control type="text" name="studentName" value={busBillData.studentName} onChange={handleInputChange} disabled className="form-control-light" />
                  </Form.Group>
                  <Form.Group className="my-1">
                    <Form.Label>Route Number</Form.Label>
                    <Form.Control type="text" name="routeNumber" value={busBillData.routeNumber} onChange={handleInputChange} disabled className="form-control-light" />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="my-1">
                    <Form.Label>Father Name</Form.Label>
                    <Form.Control type="text" name="fatherName" value={busBillData.fatherName} onChange={handleInputChange} disabled className="form-control-light" />
                  </Form.Group>
                  <Form.Group className="my-1">
                    <Form.Label>Course</Form.Label>
                    <Form.Control type="text" name="course" value={busBillData.course} onChange={handleInputChange} disabled className="form-control-light" />
                  </Form.Group>
                  <Form.Group className="my-1">
                    <Form.Label>Section</Form.Label>
                    <Form.Control type="text" name="section" value={busBillData.section} onChange={handleInputChange} disabled className="form-control-light" />
                  </Form.Group>
                  <Form.Group className="my-1">
                    <Form.Label>Pickup Point</Form.Label>
                    <Form.Control type="text" name="pickupPoint" value={busBillData.pickupPoint} onChange={handleInputChange} disabled className="form-control-light" />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="my-1">
                    <Form.Label>Bus Bill Date</Form.Label>
                    <DatePicker selected={busBillData.busBillDate} onChange={(date) => handleDateChange(date, "busBillDate")} dateFormat="dd/MM/yyyy" className="form-control form-control-light" />
                  </Form.Group>
                  <Form.Group className="my-1">
                    <Form.Label>Original Bus Amount</Form.Label>
                    <Form.Control type="text" name="originalBusAmount" value={busBillData.originalBusAmount} disabled className="form-control-light" />
                  </Form.Group>
                  <Form.Group className="my-1">
                    <Form.Label>Bus Fee Amount</Form.Label>
                    <Form.Control type="text" name="busFeeAmount" value={busBillData.busFeeAmount} disabled className="form-control-light" />
                  </Form.Group>
                  <Form.Group className="my-1">
                    <Form.Label>Paid amount</Form.Label>
                    <Form.Control type="text" name="busPaidAmount" value={busBillData.busPaidAmount} disabled className="form-control-light" />
                  </Form.Group>
                  <Form.Group className="my-1">
                    <Form.Label>Remaining Balance</Form.Label>
                    <Form.Control type="text" name="remainingBalance" value={busBillData.remainingBalance} disabled className="form-control-light" />
                  </Form.Group>
                  <Form.Group className="my-1">
                    <Form.Label>Pay Mode</Form.Label>
                    <div className="d-flex align-items-center flex-wrap">
                      <div className="form-check form-check-inline">
                        <Form.Check type="radio" id="cash" name="paymentMode" value="Cash" checked={busBillData.paymentMode === "Cash"} onChange={handleInputChange} className="custom-radio" />
                        <Form.Label htmlFor="cash" className="form-check-label ms-1">Cash</Form.Label>
                      </div>
                      <div className="form-check form-check-inline">
                        <Form.Check type="radio" id="online" name="paymentMode" value="Online" checked={busBillData.paymentMode === "Online"} onChange={handleInputChange} className="custom-radio" />
                        <Form.Label htmlFor="online" className="form-check-label ms-1">Online</Form.Label>
                      </div>
                      <div className="form-check form-check-inline">
                        <Form.Check type="radio" id="dd" name="paymentMode" value="DD" checked={busBillData.paymentMode === "DD"} onChange={handleInputChange} className="custom-radio" />
                        <Form.Label htmlFor="dd" className="form-check-label ms-1">DD</Form.Label>
                      </div>
                    </div>
                  </Form.Group>
                  {(busBillData.paymentMode === "Online" || busBillData.paymentMode === "DD") && (
                    <Form.Group className="my-1">
                      <Form.Label>{busBillData.paymentMode === "Online" ? "Transaction No." : "DD No."}</Form.Label>
                      <Form.Control type="text" name="paymentNumber" value={busBillData.paymentNumber} onChange={handleInputChange} className="form-control-light" placeholder={busBillData.paymentMode === "Online" ? "Enter transaction number" : "Enter DD number"} />
                    </Form.Group>
                  )}
                </Col>
              </Row>

              <Row className="mb-4">
                <Col>
                  <div className="bus-fee-table-container" style={{ overflowX: 'auto', width: '100%' }}>
                    <Table bordered hover size="sm" className="bus-fee-table" style={{ minWidth: '1000px', width: '100%', tableLayout: 'fixed' }}>
                      <thead className="table-header" >
                        <tr>
                          <th style={{ width: '8%' }}>Select</th>
                          <th style={{ width: '22%' }}>Description</th>
                          <th style={{ width: '15%' }}>Fee Type</th>
                          <th style={{ width: '15%' }}>Original Amount</th>
                          <th style={{ width: '15%' }}>Remaining Balance</th>
                          <th style={{ width: '15%' }}>Concession</th>
                          <th style={{ width: '15%' }}>Pay Amount</th>
                          <th style={{ width: '10%' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {busFeeTableData.length > 0 ? (
                          busFeeTableData.map((fee, index) => (
                            <tr key={index}>
                              <td className="text-center">
                                <Form.Check type="checkbox" checked={fee.selected || false} onChange={() => handleBusFeeSelection(index)} className="bus-fee-checkbox" disabled={Number(fee.baseRemainingBalance) === 0} />
                              </td>
                              <td className="text-truncate" title={fee.heading}>{fee.heading}</td>
                              <td className="text-truncate" title={fee.type || "Transport"}>{fee.type || "Transport"}</td>
                              <td>
                                <Form.Control type="number" value={fee.originalAmount || fee.amount} disabled className="form-control-light text-end" style={{ backgroundColor: '#f9f9f9' }} />
                              </td>
                              <td className="align-middle text-end">₹ {fee.baseRemainingBalance}</td>
                              <td>
                                <Form.Control type="number" value={fee.concessionAmount} onChange={(e) => handleBusConcessionChange(index, e.target.value)} className="form-control-light text-end" min="0" step="0.01" max={Number(fee.baseRemainingBalance) - Number(fee.paidAmount || 0)} disabled={!fee.selected || Number(fee.baseRemainingBalance) === 0} />
                              </td>
                              <td>
                                <Form.Control type="number" value={fee.paidAmount} onChange={(e) => handleBusFeeAmountChange(index, e.target.value)} className="form-control-light text-end" min="0" step="0.01" max={Number(fee.baseRemainingBalance) - Number(fee.concessionAmount || 0)} disabled={!fee.selected || Number(fee.baseRemainingBalance) === 0} />
                              </td>
                              <td className="text-center align-middle">
                                <span className={`badge ${calculateStatus(fee) === 'Settled' ? 'bg-success' : 'bg-warning'}`}>{calculateStatus(fee)}</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="8" className="text-center text-muted">{studentLoaded ? "No bus fee details available" : "Please load student data first"}</td></tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="6" className="text-end fw-bold">Bus Fee Total:</td>
                          <td className="fw-bold text-end">₹ {busBillData.busPaidAmount}</td>
                          <td className="fw-bold text-end">₹ {busBillData.remainingBalance}</td>
                        </tr>
                      </tfoot>
                    </Table>
                  </div>
                </Col>
              </Row>

              <Row className="mb-4 align-items-center">
                <Col md={4}>
                  <Form.Group className="my-1">
                    <Form.Label>Transaction/Narrat:</Form.Label>
                    <Form.Control type="text" name="transactionNarrative" value={busBillData.transactionNarrative} onChange={handleInputChange} className="form-control-light" placeholder="Enter transaction narrative" />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="my-1">
                    <Form.Label>Transaction Date:</Form.Label>
                    <DatePicker selected={busBillData.transactionDate} onChange={(date) => handleDateChange(date, "transactionDate")} dateFormat="dd/MM/yyyy" className="form-control form-control-light" isClearable placeholderText="Select a date (optional)" />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="my-1">
                    <Form.Label>Operator Name</Form.Label>
                    <Form.Control type="text" name="operatorName" value={busBillData.operatorName} onChange={handleInputChange} className="form-control-light" placeholder="Enter operator name" />
                  </Form.Group>
                </Col>
                <Col md={12} className="d-flex align-items-end justify-content-end mt-3">
                  <Button variant="primary" type="submit" className="px-4 py-2" disabled={isLoading || !studentLoaded}>{isLoading ? "Processing..." : "Submit Bus Bill Entry"}</Button>
                  <Button variant="outline-secondary" onClick={fetchBusPaymentHistory} disabled={!studentLoaded} className="px-4 py-2 ms-2">Bus Payment History</Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
      </Container>
      <BusPaymentHistoryModal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} busPaymentHistory={busPaymentHistory} className="modal-80w" />
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered size="md">
        <Modal.Header className="border-0 pb-0"><Modal.Title className="w-100 text-center">Confirm Bus Bill</Modal.Title></Modal.Header>
        <Modal.Body className="text-center py-4">
          <p>Are you sure you want to confirm this bus bill?</p>
          <p className="fw-bold">Bus Bill No: {busBillData.busBillNumber}</p>
          <p className="fw-bold">Student: {busBillData.studentName}</p>
          <p className="fw-bold">Paid Amount: ₹ {busBillData.busPaidAmount}</p>
          <p className="fw-bold">Operator: {busBillData.operatorName}</p>
        </Modal.Body>
        <Modal.Footer className="border-0 justify-content-center pt-0">
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)} style={{ width: "120px" }}>No</Button>
          <Button variant="primary" onClick={processBusPayment} ref={confirmYesButtonRef} autoFocus style={{ width: "120px", backgroundColor: "#0B3D7B" }} disabled={isLoading}>{isLoading ? "Processing..." : "Yes"}</Button>
        </Modal.Footer>
      </Modal>
      <BusBillPreviewModal show={showBusBillPreviewModal} onHide={handleBusBillPreviewClose} busBillData={busBillData} busFeeTableData={busFeeTableData} schoolInfo={schoolInfo} onClose={handleBusBillPreviewClose} className="modal-80w" />
      <ToastContainer />
      <style>{`
          .custom-radio .form-check-input { border-radius: 50% !important; width: 1.2em; height: 1.2em; }
          .custom-radio .form-check-input:checked { background-color: #0B3D7B; border-color: #0B3D7B; }
          .bus-fee-checkbox .form-check-input:checked { background-color: #0B3D7B; border-color: #0B3D7B; }
          .bus-fee-checkbox .form-check-input:disabled { background-color: #e9ecef; border-color: #dee2e6; }
          .form-control-light:disabled { background-color: #f8f9fa; opacity: 1; }
          .bus-fee-table-container { border: 1px solid #dee2e6; border-radius: 0.375rem; background: white; }
          .table-header th { background-color: #0B3D7B !important; font-weight: 600; border-bottom: 2px solid #dee2e6; color: white !important; }
          .modal-80w { max-width: 80% !important; width: 80% !important; }
          @media (max-width: 1200px) { .modal-80w { max-width: 95% !important; width: 95% !important; } }
          @media (max-width: 768px) { .modal-80w { max-width: 98% !important; width: 98% !important; margin: 10px auto; } }
      `}</style>
    </MainContentPage>
  )
}
export default BusBillEntry