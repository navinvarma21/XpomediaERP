"use client"

import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Form, Button, Row, Col, Container, Table, ListGroup, Card, Image, Badge, Spinner, Nav } from "react-bootstrap"
import "react-datepicker/dist/react-datepicker.css"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { useAuthContext } from "../../Context/AuthContext"
import { ENDPOINTS } from "../../SpringBoot/config"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Import the static profile image
import defaultProfileImage from "../../images/StudentProfileIcon/studentProfile.jpeg"

const IndividualPaid = () => {
  const navigate = useNavigate()
  const dropdownRef = useRef(null)
  const componentRef = useRef(null)
  const { getAuthHeaders, schoolId, currentAcademicYear } = useAuthContext()

  // --- STATE MANAGEMENT ---

  // School Info
  const [schoolInfo, setSchoolInfo] = useState({
    name: "XPOMEDIA MATRIC. HR. SEC. SCHOOL",
    address: "TIRUVANNAMALAIA 606601"
  })

  // Student Data (Input Fields)
  const [studentData, setStudentData] = useState({
    admissionNumber: "",
    studentName: "",
    fatherName: "",
    course: "",
    section: "",
    pickupPoint: "",
    
    // Academic Totals
    fixedAmount: 0,         // Demand
    acadPaid: 0,            // Paid
    acadConcession: 0,      // Concession
    billingEntryBalance: 0, // Balance
    
    // Other Totals
    otherFeeTotal: 0,       // Demand
    otherPaid: 0,           // Paid
    otherConcession: 0,     // Concession
    otherFeeBalance: 0,     // Balance
    
    // Global Totals
    totalPaidAmount: 0,     // Sum of ALL paid
    concessAmount: 0,       // Sum of ALL concessions
    balanceAmount: 0        // Grand Total Balance
  })

  // Table Data States
  const [activeTab, setActiveTab] = useState("billing"); // 'billing' or 'other'
  const [billingHistory, setBillingHistory] = useState([]); // Academic History
  const [otherFeeHistory, setOtherFeeHistory] = useState([]); // Other Fee History
  
  // Search & Loading States
  const [studentsList, setStudentsList] = useState([])
  const [filteredStudentsList, setFilteredStudentsList] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [studentImageUrl, setStudentImageUrl] = useState(defaultProfileImage)

  // --- INITIAL DATA FETCHING ---

  // Fetch school info
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
        console.error("Error fetching school info", error);
      }
    }
    if (schoolId) fetchSchoolInfo()
  }, [schoolId, getAuthHeaders])

  // Fetch students list for dropdown
  const fetchStudentsList = async () => {
    if (!schoolId || !currentAcademicYear) return
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/studentreport/datas?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        { headers: getAuthHeaders() }
      )
      if (response.ok) {
        const studentsData = await response.json()
        setStudentsList(studentsData || [])
      } else {
        setStudentsList([])
      }
    } catch (error) {
      setStudentsList([])
    }
  }

  useEffect(() => {
    if (schoolId && currentAcademicYear) fetchStudentsList()
  }, [schoolId, currentAcademicYear])

  // --- SEARCH LOGIC ---

  // Handle click outside dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setStudentData((prev) => ({ ...prev, [name]: value }))

    if (name === "admissionNumber") {
      if (value.trim() === "") {
        setShowDropdown(false)
        return
      }
      const filtered = studentsList.filter(student =>
        student.admissionNumber?.toLowerCase().includes(value.toLowerCase()) ||
        student.studentName?.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredStudentsList(filtered)
      setShowDropdown(true)
    }
  }

  const handleStudentSelect = (admissionNumber) => {
    setStudentData((prev) => ({ ...prev, admissionNumber }))
    setShowDropdown(false)
    fetchStudentDataByAdmissionNumber(admissionNumber)
  }

  // --- CORE DATA FETCHING LOGIC ---

  // Helper: Group raw transaction rows by Bill Number
  const groupTransactionsByBill = (transactions, type) => {
    if (!Array.isArray(transactions)) return [];

    const grouped = {};

    transactions.forEach(t => {
      const billNo = t.billNumber || t.bill_number;
      if (!billNo) return;

      if (!grouped[billNo]) {
        grouped[billNo] = {
          billNumber: billNo,
          billDate: t.billDate || t.bill_date,
          // Initialize totals
          paidAmount: 0,
          concessionAmount: 0,
          // Metadata
          paymentMode: t.paymentMode || t.payment_mode || "Cash",
          paymentNumber: t.paymentNumber || t.payment_number || "",
          operatorName: t.operatorName || t.operator_name || "Admin",
          // Collect descriptions
          descriptions: [],
          source: type // 'Academic' or 'Other'
        };
      }

      // Aggregate Amounts
      const paid = Number(t.paidAmount || t.paid_amount || 0);
      const conc = Number(t.concessionAmount || t.concession_amount || 0);
      
      grouped[billNo].paidAmount += paid;
      grouped[billNo].concessionAmount += conc;

      // Add description
      const desc = t.feeHeading || t.fee_heading || t.description || t.heading;
      if (desc && !grouped[billNo].descriptions.includes(desc)) {
        grouped[billNo].descriptions.push(desc);
      }
    });

    // Convert to array and sort by date (newest first)
    return Object.values(grouped).sort((a, b) => new Date(b.billDate) - new Date(a.billDate));
  };

  const fetchStudentDataByAdmissionNumber = async (admissionNumber) => {
    if (!admissionNumber || !schoolId) return

    setIsLoading(true)
    setStudentImageUrl(defaultProfileImage)
    setBillingHistory([])
    setOtherFeeHistory([])

    try {
      // 1. Fetch Student Profile
      const studentRes = await fetch(
        `${ENDPOINTS.admissionmaster}/studentreport/datas?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        { headers: getAuthHeaders() }
      )
      
      if (!studentRes.ok) throw new Error("Failed to fetch students");
      
      const allStudents = await studentRes.json()
      const student = allStudents.find(s => s.admissionNumber === admissionNumber)

      if (!student) {
        toast.error("No student found with this admission number")
        setIsLoading(false)
        return
      }

      // 2. Fetch Histories (Using endpoints from BillingEntry and OtherFee)
      
      // A. Academic History (BillingEntry endpoints)
      const academicHistoryRes = await fetch(
        `${ENDPOINTS.transaction}/daily-fee-collection/payment-history/${admissionNumber}?schoolId=${schoolId}`,
        { headers: getAuthHeaders() }
      );
      const rawAcademicHistory = academicHistoryRes.ok ? await academicHistoryRes.json() : [];
      const groupedAcademicHistory = groupTransactionsByBill(rawAcademicHistory, "Academic");
      setBillingHistory(groupedAcademicHistory);

      // B. Other Fee History (OtherFee endpoints)
      const otherHistoryRes = await fetch(
        `${ENDPOINTS.transaction}/otherfee/payment-history/${admissionNumber}?schoolId=${schoolId}`,
        { headers: getAuthHeaders() }
      );
      const rawOtherHistory = otherHistoryRes.ok ? await otherHistoryRes.json() : [];
      const groupedOtherHistory = groupTransactionsByBill(rawOtherHistory, "Other");
      setOtherFeeHistory(groupedOtherHistory);

      // 3. Calculate Totals and Balances

      // --- Academic Calculations ---
      // Get demand from fee-details
      const acadFeeDetailsRes = await fetch(
        `${ENDPOINTS.transaction}/daily-fee-collection/fee-details/${admissionNumber}?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        { headers: getAuthHeaders() }
      );
      const acadData = acadFeeDetailsRes.ok ? await acadFeeDetailsRes.json() : { feeDetails: [], totalFees: 0 };
      
      // Calculate Demand (Fixed Amount)
      const fixedAmount = acadData.totalFees || 0;
      
      // Calculate Paid (Billing Entry)
      const totalAcadPaid = groupedAcademicHistory.reduce((sum, item) => sum + item.paidAmount, 0);
      const totalAcadConc = groupedAcademicHistory.reduce((sum, item) => sum + item.concessionAmount, 0);
      
      const acadBalance = Math.max(0, fixedAmount - totalAcadPaid - totalAcadConc); // Simple balance logic

      // --- Other Fee Calculations ---
      
      let otherFeeDemand = 0;
      
      // Fetch Individual Fees Demand
      try {
        const individualFeesRes = await fetch(
            `${ENDPOINTS.transaction}/otherfee/individual-fees/${admissionNumber}?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
            { headers: getAuthHeaders() }
        );
        if(individualFeesRes.ok) {
            const indData = await individualFeesRes.json();
            if(Array.isArray(indData)) {
                otherFeeDemand = indData.reduce((sum, fee) => sum + (Number(fee.amount) || 0), 0);
            }
        }
      } catch(e) { console.log(e); }

      const totalOtherPaid = groupedOtherHistory.reduce((sum, item) => sum + item.paidAmount, 0);
      const totalOtherConc = groupedOtherHistory.reduce((sum, item) => sum + item.concessionAmount, 0);

      // Recalculate Other Balance based on fetched demand vs paid
      let otherBalanceCalc = 0;
      
      try {
         const otherFeeDetailsRes = await fetch(
            `${ENDPOINTS.transaction}/otherfee/fee-details/${admissionNumber}?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
            { headers: getAuthHeaders() }
         );
         if(otherFeeDetailsRes.ok) {
             const oData = await otherFeeDetailsRes.json();
             // Sum remaining balances
             if(oData.feeDetails) {
                 otherBalanceCalc = oData.feeDetails.reduce((sum, f) => sum + (Number(f.remainingBalance) || 0), 0);
             }
         }
         // Add individual fee remaining balance
         const indFeesRes = await fetch(
            `${ENDPOINTS.transaction}/otherfee/individual-fees/${admissionNumber}?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
            { headers: getAuthHeaders() }
         );
         if(indFeesRes.ok) {
             const iData = await indFeesRes.json();
             if(Array.isArray(iData)) {
                 // Calculate remaining for individual fees
                 const indBal = iData.reduce((sum, f) => {
                     const amt = Number(f.amount) || 0;
                     const pd = Number(f.paid_amount) || 0;
                     const cn = Number(f.concession_amount) || 0;
                     return sum + (amt - pd - cn);
                 }, 0);
                 otherBalanceCalc += Math.max(0, indBal);
             }
         }
      } catch(e) { console.log(e) }

      // Total calculations
      const grandTotalPaid = totalAcadPaid + totalOtherPaid;
      const grandTotalConc = totalAcadConc + totalOtherConc;
      const grandTotalBalance = acadBalance + otherBalanceCalc;
      
      // Demand logic for other fees (Paid + Balance)
      const otherTotalDemand = totalOtherPaid + otherBalanceCalc + totalOtherConc; 

      // 4. Update State
      setStudentData({
        admissionNumber: admissionNumber,
        studentName: student.studentName || "",
        fatherName: student.fatherName || "",
        course: student.standard || "",
        section: student.section || "",
        pickupPoint: student.boardingPoint || "",
        
        // Academic
        fixedAmount: fixedAmount,
        acadPaid: totalAcadPaid,
        acadConcession: totalAcadConc,
        billingEntryBalance: acadBalance,
        
        // Other
        otherFeeTotal: otherTotalDemand,
        otherPaid: totalOtherPaid,
        otherConcession: totalOtherConc,
        otherFeeBalance: otherBalanceCalc,
        
        // Grand
        balanceAmount: grandTotalBalance,
        totalPaidAmount: grandTotalPaid,
        concessAmount: grandTotalConc
      });

      // 5. Fetch Image
      if (student.id) {
        try {
          const photoUrl = `${ENDPOINTS.admissionmaster}/admission/${student.id}/photo?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
          const imageResponse = await fetch(photoUrl, { headers: getAuthHeaders() })
          if (imageResponse.ok) setStudentImageUrl(photoUrl)
          else setStudentImageUrl(defaultProfileImage)
        } catch (error) {
          setStudentImageUrl(defaultProfileImage)
        }
      }

      toast.success("Student details and payment history loaded");

    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch data");
      setStudentImageUrl(defaultProfileImage);
    } finally {
      setIsLoading(false);
    }
  }

  // --- PDF & PRINT LOGIC ---

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    const printContent = generatePrintContent()
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment History - ${studentData.admissionNumber}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; font-size: 12px; }
            .header { background: #0B3D7B; color: white; padding: 10px; text-align: center; margin-bottom: 10px; }
            .school-name { font-size: 16px; font-weight: bold; }
            .section { margin: 10px 0; }
            .section-title { background: #f0f0f0; padding: 5px; font-weight: bold; border-left: 4px solid #0B3D7B; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin: 10px 0; }
            .label { font-weight: bold; margin-right: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
            th { background: #0B3D7B; color: white; padding: 5px; text-align: left; }
            td { border: 1px solid #ddd; padding: 5px; }
            .text-end { text-align: right; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  const generatePrintContent = () => {
    const historyToPrint = activeTab === 'billing' ? billingHistory : otherFeeHistory;
    const title = activeTab === 'billing' ? "ACADEMIC FEE HISTORY" : "OTHER FEE HISTORY";
    
    // Determine which balance label to show based on the active tab
    const balanceLabel = activeTab === 'billing' ? "Academic Balance" : "Other Fee Balance";
    const balanceValue = activeTab === 'billing' ? studentData.billingEntryBalance : studentData.otherFeeBalance;

    return `
      <div class="header">
        <div class="school-name">${schoolInfo.name}</div>
        <div>${schoolInfo.address}</div>
      </div>
      
      <div style="text-align: center; font-weight: bold; margin: 10px;">${title}</div>
      
      <div class="section">
        <div class="section-title">STUDENT DETAILS</div>
        <div class="info-grid">
          <div><span class="label">Name:</span> ${studentData.studentName}</div>
          <div><span class="label">Admin No:</span> ${studentData.admissionNumber}</div>
          <div><span class="label">Class:</span> ${studentData.course} - ${studentData.section}</div>
          <div><span class="label">Father:</span> ${studentData.fatherName}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">SUMMARY</div>
        <div class="info-grid">
          <div><span class="label">Total Paid (All):</span> ₹${Number(studentData.totalPaidAmount).toFixed(2)}</div>
          <div><span class="label">${balanceLabel}:</span> ₹${Number(balanceValue).toFixed(2)}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">TRANSACTIONS (${activeTab === 'billing' ? 'Academic' : 'Other'})</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Bill No</th>
              <th>Description</th>
              <th>Mode</th>
              <th>Ref No</th>
              <th class="text-end">Paid</th>
              <th class="text-end">Conc</th>
            </tr>
          </thead>
          <tbody>
            ${historyToPrint.map(h => `
              <tr>
                <td>${new Date(h.billDate).toLocaleDateString('en-GB')}</td>
                <td>${h.billNumber}</td>
                <td>${h.descriptions.join(', ')}</td>
                <td>${h.paymentMode}</td>
                <td>${h.paymentNumber || '-'}</td>
                <td class="text-end">₹${h.paidAmount.toFixed(2)}</td>
                <td class="text-end">₹${h.concessionAmount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `
  }

  const downloadPDF = () => {
    const doc = new jsPDF()
    const historyToPrint = activeTab === 'billing' ? billingHistory : otherFeeHistory;
    
    doc.setFontSize(14)
    doc.text(schoolInfo.name, 105, 15, { align: 'center' })
    doc.setFontSize(10)
    doc.text(schoolInfo.address, 105, 20, { align: 'center' })
    
    doc.setFontSize(12)
    doc.text(`Payment History - ${activeTab === 'billing' ? 'Academic Fees' : 'Other Fees'}`, 14, 30)
    
    doc.setFontSize(10)
    doc.text(`Name: ${studentData.studentName}`, 14, 40)
    doc.text(`Admin No: ${studentData.admissionNumber}`, 14, 45)
    doc.text(`Class: ${studentData.course} - ${studentData.section}`, 120, 40)
    
    const tableColumn = ["Date", "Bill No", "Description", "Mode", "Ref", "Paid", "Conc"]
    const tableRows = historyToPrint.map(h => [
      new Date(h.billDate).toLocaleDateString('en-GB'),
      h.billNumber,
      h.descriptions.join(', ').substring(0, 30),
      h.paymentMode,
      h.paymentNumber || '-',
      h.paidAmount.toFixed(2),
      h.concessionAmount.toFixed(2)
    ])

    autoTable(doc, {
      startY: 55,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [11, 61, 123] }
    })

    doc.save(`History_${studentData.admissionNumber}.pdf`)
  }

  const handleReset = () => {
    setStudentData({
      admissionNumber: "",
      studentName: "",
      fatherName: "",
      course: "",
      section: "",
      pickupPoint: "",
      fixedAmount: 0,
      acadPaid: 0,
      acadConcession: 0,
      billingEntryBalance: 0,
      otherFeeTotal: 0,
      otherPaid: 0,
      otherConcession: 0,
      otherFeeBalance: 0,
      totalPaidAmount: 0,
      concessAmount: 0,
      balanceAmount: 0
    })
    setBillingHistory([])
    setOtherFeeHistory([])
    setStudentImageUrl(defaultProfileImage)
    setActiveTab('billing')
  }

  // --- RENDER HELPERS ---
  const currentHistory = activeTab === 'billing' ? billingHistory : otherFeeHistory;

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <Card className="shadow-sm">
          <Card.Header
            style={{ backgroundColor: "#0B3D7B" }}
            className="text-white py-3 d-flex justify-content-between align-items-center"
          >
            <h2 className="mb-0 h4">Individual Paid Amount</h2>
            <div className="text-white text-truncate" style={{ maxWidth: '300px' }}>
              School: {schoolInfo.name}
            </div>
          </Card.Header>
          <Card.Body className="p-4">
            <div ref={componentRef} className="no-print">
              
              {/* STUDENT DETAILS FORM (3 Columns) */}
              <Row className="mb-4">
                {/* Column 1 */}
                <Col md={4}>
                  <div className="d-flex justify-content-center mb-3">
                    <Image
                      src={studentImageUrl}
                      alt="Student"
                      roundedCircle
                      style={{ width: "100px", height: "100px", objectFit: "cover", border: "2px solid #eee" }}
                      onError={(e) => { e.target.src = defaultProfileImage }}
                    />
                  </div>
                  
                  <Form.Group className="my-1">
                    <Form.Label className="fw-bold small">Admin. No.</Form.Label>
                    <div className="d-flex position-relative" ref={dropdownRef}>
                      <Form.Control
                        type="text"
                        name="admissionNumber"
                        value={studentData.admissionNumber}
                        onChange={handleInputChange}
                        autoComplete="off"
                        placeholder="Search Admission No"
                        onFocus={() => {
                          if (studentData.admissionNumber && studentsList.length > 0) setShowDropdown(true)
                        }}
                        disabled={isLoading}
                      />
                      <Button
                        variant="outline-primary"
                        onClick={() => fetchStudentDataByAdmissionNumber(studentData.admissionNumber)}
                        disabled={!studentData.admissionNumber || isLoading}
                        className="ms-2"
                      >
                        {isLoading ? <Spinner size="sm"/> : "Load"}
                      </Button>
                      {showDropdown && filteredStudentsList.length > 0 && (
                        <ListGroup className="position-absolute w-100 shadow" style={{ top: "100%", zIndex: 1000, maxHeight: "200px", overflowY: "auto" }}>
                          {filteredStudentsList.map((student) => (
                            <ListGroup.Item
                              key={student.id}
                              action
                              onClick={() => handleStudentSelect(student.admissionNumber)}
                            >
                              {student.admissionNumber} - {student.studentName}
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      )}
                    </div>
                  </Form.Group>

                  <Form.Group className="my-1">
                    <Form.Label className="fw-bold small">Student Name</Form.Label>
                    <Form.Control type="text" value={studentData.studentName} disabled className="bg-light" />
                  </Form.Group>
                </Col>

                {/* Column 2 */}
                <Col md={4}>
                  <Form.Group className="my-1">
                    <Form.Label className="fw-bold small">Father Name</Form.Label>
                    <Form.Control type="text" value={studentData.fatherName} disabled className="bg-light" />
                  </Form.Group>
                  <Form.Group className="my-1">
                    <Form.Label className="fw-bold small">Course</Form.Label>
                    <Form.Control type="text" value={studentData.course} disabled className="bg-light" />
                  </Form.Group>
                  <Form.Group className="my-1">
                    <Form.Label className="fw-bold small">Section</Form.Label>
                    <Form.Control type="text" value={studentData.section} disabled className="bg-light" />
                  </Form.Group>
                </Col>

                {/* Column 3 - Totals */}
                <Col md={4}>
                  <div className="p-3 bg-light border rounded">
                    <h6 className="text-primary border-bottom pb-2 mb-3">
                        Fee Summary {activeTab === 'billing' ? '(Academic)' : '(Other/Misc)'}
                    </h6>
                    
                    {activeTab === 'billing' ? (
                        <>
                            <Row className="mb-2">
                                <Col xs={7} className="small">Academic Demand:</Col>
                                <Col xs={5} className="text-end fw-bold small">₹{Number(studentData.fixedAmount).toFixed(2)}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col xs={7} className="small">Academic Paid:</Col>
                                <Col xs={5} className="text-end fw-bold text-success small">₹{Number(studentData.acadPaid).toFixed(2)}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col xs={7} className="small">Concession:</Col>
                                <Col xs={5} className="text-end fw-bold text-warning small">₹{Number(studentData.acadConcession).toFixed(2)}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col xs={7} className="small">Academic Balance:</Col>
                                <Col xs={5} className="text-end fw-bold text-danger small">₹{Number(studentData.billingEntryBalance).toFixed(2)}</Col>
                            </Row>
                        </>
                    ) : (
                        <>
                            <Row className="mb-2">
                                <Col xs={7} className="small">Other Fee Demand:</Col>
                                <Col xs={5} className="text-end fw-bold small">₹{Number(studentData.otherFeeTotal).toFixed(2)}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col xs={7} className="small">Other Fee Paid:</Col>
                                <Col xs={5} className="text-end fw-bold text-success small">₹{Number(studentData.otherPaid).toFixed(2)}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col xs={7} className="small">Concession:</Col>
                                <Col xs={5} className="text-end fw-bold text-warning small">₹{Number(studentData.otherConcession).toFixed(2)}</Col>
                            </Row>
                            <Row className="mb-2">
                                <Col xs={7} className="small">Other Fee Balance:</Col>
                                <Col xs={5} className="text-end fw-bold text-danger small">₹{Number(studentData.otherFeeBalance).toFixed(2)}</Col>
                            </Row>
                        </>
                    )}

                    <hr className="my-2"/>
                    
                    <Row className="mb-2">
                        <Col xs={7} className="fw-bold small">Net Balance (All):</Col>
                        <Col xs={5} className="text-end fw-bold text-danger small">₹{Number(studentData.balanceAmount).toFixed(2)}</Col>
                    </Row>
                    <Row className="mb-0">
                        <Col xs={7} className="fw-bold small">Net Paid (All):</Col>
                        <Col xs={5} className="text-end fw-bold text-success small">₹{Number(studentData.totalPaidAmount).toFixed(2)}</Col>
                    </Row>
                  </div>
                </Col>
              </Row>

              {/* TABS FOR TOGGLING HISTORY */}
              <div className="mb-3">
                <Nav variant="tabs" defaultActiveKey="billing" onSelect={(k) => setActiveTab(k)}>
                  <Nav.Item>
                    <Nav.Link 
                        eventKey="billing" 
                        active={activeTab === 'billing'}
                        className={activeTab === 'billing' ? 'fw-bold text-primary' : 'text-muted'}
                    >
                        Academic Fees (Billing Entry)
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link 
                        eventKey="other" 
                        active={activeTab === 'other'}
                        className={activeTab === 'other' ? 'fw-bold text-primary' : 'text-muted'}
                    >
                        Other Fees (Individual/Misc)
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </div>

              {/* PAYMENT HISTORY TABLE */}
              <Row className="mb-4">
                <Col>
                  <div className="table-responsive">
                    <Table bordered hover size="sm" className="fee-table mb-0" style={{ minWidth: '1000px' }}>
                      <thead className="bg-light">
                        <tr className="text-center align-middle">
                          <th style={{ width: '5%' }}>S.No</th>
                          <th style={{ width: '10%' }}>Date</th>
                          <th style={{ width: '10%' }}>Bill No</th>
                          <th style={{ width: '25%' }}>Description / Fee Heads</th>
                          <th style={{ width: '10%' }}>Paid Amt</th>
                          <th style={{ width: '8%' }}>Conc.</th>
                          <th style={{ width: '10%' }}>Mode</th>
                          <th style={{ width: '12%' }}>Ref No</th>
                          <th style={{ width: '10%' }}>Operator</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentHistory.length > 0 ? (
                          currentHistory.map((payment, index) => (
                            <tr key={index} className="align-middle">
                              <td className="text-center">{index + 1}</td>
                              <td className="text-center">{new Date(payment.billDate).toLocaleDateString("en-GB")}</td>
                              <td className="text-center fw-bold text-primary">{payment.billNumber}</td>
                              <td>
                                <div className="text-truncate" style={{maxWidth: '300px'}} title={payment.descriptions.join(", ")}>
                                    {payment.descriptions.join(", ")}
                                </div>
                              </td>
                              <td className="text-end fw-bold text-success">
                                ₹ {payment.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="text-end text-danger">
                                {payment.concessionAmount > 0 ? `₹ ${payment.concessionAmount.toFixed(2)}` : '-'}
                              </td>
                              <td className="text-center">
                                <Badge bg={payment.paymentMode === 'Cash' ? 'secondary' : 'info'}>
                                    {payment.paymentMode}
                                </Badge>
                              </td>
                              <td className="text-center small text-muted">
                                {payment.paymentNumber || "-"}
                              </td>
                              <td className="text-center small">{payment.operatorName}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="9" className="text-center text-muted py-5">
                              No {activeTab === 'billing' ? 'Academic' : 'Other'} fee payment history available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Col>
              </Row>

              {/* ACTION BUTTONS */}
              <Row className="mb-4">
                <Col className="d-flex justify-content-center gap-2">
                  <Button
                    variant="primary"
                    onClick={handlePrint}
                    disabled={isLoading || !studentData.admissionNumber}
                    className="px-4"
                  >
                    Print
                  </Button>
                  <Button
                    variant="outline-primary"
                    onClick={downloadPDF}
                    disabled={isLoading || !studentData.admissionNumber}
                    className="px-4"
                  >
                    Download PDF
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={handleReset}
                    className="px-4"
                  >
                    Reset
                  </Button>
                </Col>
              </Row>
            </div>
          </Card.Body>
        </Card>
      </Container>

      <ToastContainer position="top-right" />

      {/* Print Styles */}
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            /* Custom print layout logic would go here if not using window.open method */
          }
          /* Custom Scrollbar for tables */
          .table-responsive::-webkit-scrollbar {
            height: 8px;
          }
          .table-responsive::-webkit-scrollbar-thumb {
            background: #ccc;
            border-radius: 4px;
          }
        `}
      </style>
    </MainContentPage>
  )
}

export default IndividualPaid