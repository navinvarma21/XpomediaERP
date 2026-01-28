"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Form, Button, Row, Col, Container, Table, ListGroup, Modal, Image, InputGroup, Card, Badge, Spinner } from "react-bootstrap"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import MainContentPage from "../../components/MainContent/MainContentPage"
import PaymentHistoryModal from "./PaymentHistoryModal"
import BillPreviewModal from "./BillPreviewModals/BillPreviewModal"
import { useAuthContext } from "../../Context/AuthContext"
import { ENDPOINTS } from "../../SpringBoot/config"

// Import the static profile image
import defaultProfileImage from "../../images/StudentProfileIcon/studentProfile.jpeg"

const BillingEntry = () => {
  const navigate = useNavigate()
  const dropdownRef = useRef(null)
  const confirmYesButtonRef = useRef(null)
  // Ref for Concession Input to allow auto-focus
  const concessionInputRef = useRef(null)

  const { getAuthHeaders, schoolId, currentAcademicYear } = useAuthContext()

  // State for school info
  const [schoolInfo, setSchoolInfo] = useState({
    name: "XPOMEDIA MATRIC. HR. SEC. SCHOOL",
    address: "TIRUVANNAMALAI 606601"
  })

  // Bill data state
  const [billData, setBillData] = useState({
    billNumber: "",
    admissionNumber: "",
    studentName: "",
    fatherName: "",
    standard: "",
    section: "",
    boardingPoint: "",
    emisNo: "", // Hidden from UI but stored for backend
    aadharNo: "", // Hidden from UI but stored for backend
    billDate: new Date(),
    totalPaidAmount: "0.00", // Cash Amount
    totalConcessionAmount: "0.00",
    totalNetPaidAmount: "0.00", // Gross Amount Cleared
    paymentMode: "Cash",
    paymentNumber: "",
    operatorName: "XPO ADMIN",
    transactionNarrative: "",
    transactionDate: null,
  })

  // -- STATE VARIABLES --
  const [allPendingFees, setAllPendingFees] = useState([]) 
  const [selectedFeeHeadIndex, setSelectedFeeHeadIndex] = useState("") 
  const [currentInputAmount, setCurrentInputAmount] = useState("") 
      
  // Left Table Data (Staging)
  const [addedFeeRows, setAddedFeeRows] = useState([]) 
      
  // Right Table Data (History/Confirmed Bills)
  const [paidBillRows, setPaidBillRows] = useState([]) 
        
  // Track which row is "Active" for Concession Entry
  const [activeRowIndex, setActiveRowIndex] = useState(-1) 
        
  // Display variables for the boxes (Sum of all rows)
  const [summaryTotals, setSummaryTotals] = useState({
      totalBalanceBefore: "0.00",
      totalPaid: "0.00", 
      totalBalanceAfter: "0.00"
  }) 
        
  // Concession Input State (Linked to active row)
  const [concessionInput, setConcessionInput] = useState("")
  // ------------------------------------------

  const [studentData, setStudentData] = useState(null)
  const [studentImageUrl, setStudentImageUrl] = useState(defaultProfileImage)
      
  // Specific state for Opening Paid Row
  const [openingPaidAmount, setOpeningPaidAmount] = useState(0);
   
  // State to hold the Total History for the Banner
  const [totalHistoryForBanner, setTotalHistoryForBanner] = useState(0);

  // Loading state
  const [isLoading, setIsLoading] = useState(false)
  const [studentLoaded, setStudentLoaded] = useState(false)

  // State for history modal
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState([])

  // State for student search dropdown
  const [studentsList, setStudentsList] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState(null)

  // State for confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // State for bill preview modal
  const [showBillPreviewModal, setShowBillPreviewModal] = useState(false)

  // State to track if bill number is locked
  const [billNumberLocked, setBillNumberLocked] = useState(false)

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
            address: data.schoolAddress || "TIRUVANNAMALAI 606601",
          })
        }
      } catch (error) {
        console.error("Error fetching school information:", error)
      }
    }

    if (schoolId) {
      fetchSchoolInfo()
    }
  }, [schoolId, getAuthHeaders])

  // Generate bill number with 5000 limit and reset
  useEffect(() => {
    const generateBillNumber = async () => {
      if (!schoolId) return

      try {
        const currentDate = new Date()
        const currentYear = currentDate.getFullYear()
        const financialYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`

        const response = await fetch(`${ENDPOINTS.transaction}/daily-fee-collection/last-bill-number?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        })

        let nextNumber = 1

        if (response.ok) {
          const data = await response.json()
          if (data.lastBillNumber) {
            const parts = data.lastBillNumber.split("/")
            if (parts.length === 2) {
              const billNumberPart = Number.parseInt(parts[0])
              
              // Check if bill number reaches 5000, then reset to 1
              if (billNumberPart >= 5000) {
                nextNumber = 1
              } else {
                nextNumber = billNumberPart + 1
              }
              
              const formattedNumber = nextNumber.toString().padStart(4, '0')
              const newBillNumber = `${formattedNumber}/${financialYear}`
              setBillData((prev) => ({ ...prev, billNumber: newBillNumber }))
              setBillNumberLocked(true)
              localStorage.setItem(`lastBillNumber_${schoolId}`, newBillNumber)
              return
            }
          }
        }
        
        // Default case: start from 0001
        const formattedNumber = "0001"
        const newBillNumber = `${formattedNumber}/${financialYear}`
        setBillData((prev) => ({ ...prev, billNumber: newBillNumber }))
        setBillNumberLocked(true)
        localStorage.setItem(`lastBillNumber_${schoolId}`, newBillNumber)

      } catch (error) {
        console.error("Error generating bill number:", error)
        // Fallback to local storage
        const storedBillNumber = localStorage.getItem(`lastBillNumber_${schoolId}`)
        if (storedBillNumber) {
          setBillData((prev) => ({ ...prev, billNumber: storedBillNumber }))
        }
      }
    }

    if (schoolId && !billNumberLocked) {
      generateBillNumber()
    }
  }, [schoolId, billNumberLocked, getAuthHeaders])

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
      console.error("Error fetching students list:", error)
      setStudentsList([])
    }
  }

  // Fetch fee details
  const fetchFeeDetails = async (admissionNumber) => {
    if (!schoolId || !admissionNumber || !currentAcademicYear) {
      return { feeDetails: [], totalFees: 0, totalRemainingBalance: 0 }
    }

    try {
      const response = await fetch(
        `${ENDPOINTS.transaction}/daily-fee-collection/fee-details/${admissionNumber}?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const data = await response.json()
        return data
      } else {
        return { feeDetails: [], totalFees: 0, totalRemainingBalance: 0 }
      }
    } catch (error) {
      console.error("Error fetching fee details:", error)
      return { feeDetails: [], totalFees: 0, totalRemainingBalance: 0 }
    }
  }

  // Handle click outside dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Handle Enter key press for confirmation modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter" && showConfirmModal) {
        e.preventDefault()
        confirmYesButtonRef.current?.click()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [showConfirmModal])

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setBillData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (name === "admissionNumber") {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }

      if (value.trim() === "") {
        setShowDropdown(false)
        return
      }

      const timeoutId = setTimeout(() => {
        searchStudents(value)
      }, 300)

      setSearchTimeout(timeoutId)
    }
  }

  // Handle date changes
  const handleDateChange = (date, name) => {
    setBillData((prev) => ({
      ...prev,
      [name]: date,
    }))
  }

  // Search students
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
    setBillData((prev) => ({
      ...prev,
      admissionNumber,
    }))
    setShowDropdown(false)
    fetchStudentDataByAdmissionNumber(admissionNumber)
  }

  // Fetch student data (EMIS and Aadhar are fetched but not displayed)
  const fetchStudentDataByAdmissionNumber = async (admissionNumber) => {
    if (!admissionNumber || !schoolId) return

    setIsLoading(true)
    setStudentImageUrl(defaultProfileImage)
    // Clear previous entries
    setAddedFeeRows([]) 
    setPaidBillRows([]) 
    setSelectedFeeHeadIndex("")
    setCurrentInputAmount("")
    setActiveRowIndex(-1)
    setSummaryTotals({ totalBalanceBefore: "0.00", totalPaid: "0.00", totalBalanceAfter: "0.00" })
    setConcessionInput("")
    setOpeningPaidAmount(0)
    setTotalHistoryForBanner(0) // Reset banner total

    try {
      // Fetch student details including EMIS and Aadhar
      const studentResponse = await fetch(
        `${ENDPOINTS.admissionmaster}/studentreport/student/${admissionNumber}?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        { headers: getAuthHeaders() }
      )

      if (!studentResponse.ok) {
        toast.error("Failed to fetch student data")
        setIsLoading(false)
        return
      }

      const student = await studentResponse.json()
      if (!student) {
        toast.error("No student found with this admission number")
        setIsLoading(false)
        return
      }

      // Fetch fee details
      const feeData = await fetchFeeDetails(admissionNumber)
      const feeDetailsFromAPI = feeData.feeDetails || []

      // --- ENHANCED PAYMENT HISTORY WITH REFERENCE NUMBER FETCH & GROUPING ---
      try {
        const historyResponse = await fetch(
            `${ENDPOINTS.transaction}/daily-fee-collection/payment-history/${admissionNumber}?schoolId=${schoolId}`,
            { headers: getAuthHeaders() }
        );
        
        if (historyResponse.ok) {
            let historyData = await historyResponse.json();
            
            if(Array.isArray(historyData) && historyData.length > 0) {
                // 1. Group history by bill number
                const groupedByBill = {};
                historyData.forEach(record => {
                    const billNo = record.billNumber || record.bill_number || record.billNumber;
                    if (!groupedByBill[billNo]) {
                        groupedByBill[billNo] = [];
                    }
                    groupedByBill[billNo].push(record);
                });

                // 2. Get all bill numbers sorted by date (latest first)
                const sortedBillNumbers = Object.keys(groupedByBill).sort((a, b) => {
                    const dateA = new Date(groupedByBill[a][0].billDate || groupedByBill[a][0].bill_date || groupedByBill[a][0].billDate);
                    const dateB = new Date(groupedByBill[b][0].billDate || groupedByBill[b][0].bill_date || groupedByBill[b][0].billDate);
                    return dateB - dateA;
                });

                // 3. Separate Latest Bill and Older Bills
                if (sortedBillNumbers.length > 0) {
                    const latestBillNumber = sortedBillNumbers[0];
                    const latestBillTransactions = groupedByBill[latestBillNumber] || [];
                    
                    // 4. Calculate Opening Paid (Sum of all OLDER bills)
                    let openingTotal = 0;
                    sortedBillNumbers.slice(1).forEach(billNo => {
                        const billTransactions = groupedByBill[billNo] || [];
                        const billTotal = billTransactions.reduce((sum, record) => {
                            const paid = Number(record.paidAmount) || Number(record.paid_amount) || Number(record.paidAmount) || 0;
                            // const conc = Number(record.concessionAmount) || Number(record.concession_amount) || Number(record.concessionAmount) || 0;
                            // FIXED: Do NOT add concession to opening total if paid is already gross
                            return sum + paid;
                        }, 0);
                        openingTotal += billTotal;
                    });
                    
                    setOpeningPaidAmount(openingTotal);

                    // 5. Populate Right Side Table with LATEST BILL DATA ONLY (COMBINED ROW)
                    let aggregatedBillRow = null;
                    if (latestBillTransactions.length > 0) {
                        aggregatedBillRow = latestBillTransactions.reduce((acc, curr) => {
                            const paid = Number(curr.paidAmount) || Number(curr.paid_amount) || 0;
                            const conc = Number(curr.concessionAmount) || Number(curr.concession_amount) || 0;
                            
                            if (!acc) {
                                // Initialize with the first record's metadata
                                return {
                                    heading: "Fee Payment", // Unified Heading
                                    description: "Fee Payment",
                                    grossAmount: paid, // FIXED: Start with 'paid' only (Gross)
                                    paidAmount: paid,
                                    concessionAmount: conc,
                                    currentBalance: 0,
                                    transactionNarrative: curr.transactionNarrative || curr.transaction_narrative || '',
                                    billNumber: curr.billNumber || curr.bill_number,
                                    billDate: curr.billDate || curr.bill_date,
                                    paymentNumber: curr.paymentNumber || curr.payment_number || ''
                                };
                            }

                            // Add amounts
                            acc.grossAmount += paid; // FIXED: Add 'paid' (Gross), don't double add concession
                            acc.paidAmount += paid;
                            acc.concessionAmount += conc;
                            return acc;
                        }, null);
                    }

                    if (aggregatedBillRow) {
                        setPaidBillRows([aggregatedBillRow]);
                        // 6. Calculate total history for Banner (Opening + Latest Bill)
                        setTotalHistoryForBanner(openingTotal + aggregatedBillRow.grossAmount);
                    } else {
                        setPaidBillRows([]);
                        setTotalHistoryForBanner(openingTotal);
                    }

                } else {
                    setOpeningPaidAmount(0);
                    setPaidBillRows([]);
                    setTotalHistoryForBanner(0);
                }
            } else {
                setOpeningPaidAmount(0);
                setPaidBillRows([]);
                setTotalHistoryForBanner(0);
            }
        }
      } catch (histError) {
          console.error("Error fetching history for opening balance:", histError);
          setOpeningPaidAmount(0);
      }

      if (feeDetailsFromAPI.length === 0) {
        toast.info("No fee details available for this student")
      }

      // Load student image if available
      if (student.id) {
        try {
          const photoUrl = `${ENDPOINTS.admissionmaster}/admission/${student.id}/photo?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
          const imageResponse = await fetch(photoUrl, { headers: getAuthHeaders() })
          if (imageResponse.ok) {
            setStudentImageUrl(photoUrl)
          }
        } catch (error) {
          console.error("Error fetching student image:", error)
        }
      }

      setStudentData(student)
        
      // Filter only pending fees (with remaining balance > 0)
      const pendingFees = feeDetailsFromAPI
        .map(fee => ({
          ...fee,
          remainingBalance: Number(fee.remainingBalance) || 0,
          originalAmount: Number(fee.originalAmount) || 0
        }))
        .filter(f => f.remainingBalance > 0);
        
      setAllPendingFees(pendingFees)

      // Update bill data (EMIS and Aadhar are fetched but not displayed)
      setBillData((prev) => ({
        ...prev,
        studentName: student.studentName || "",
        fatherName: student.fatherName || "",
        standard: student.standard || "",
        section: student.section || "",
        boardingPoint: student.boardingPoint || "",
        emisNo: student.emis || "", // Stored for backend but not shown in UI
        aadharNo: student.aadharNumber || "", // Stored for backend but not shown in UI
      }))

      setStudentLoaded(true)
      toast.success(`Student data loaded successfully`)

    } catch (error) {
      console.error("Error fetching student data:", error)
      toast.error("Failed to fetch student data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (schoolId && currentAcademicYear) {
      fetchStudentsList()
    }
  }, [schoolId, currentAcademicYear])

  // --- FEE ADDITION & CALCULATION LOGIC ---

  const handleFeeHeadDropdownChange = (e) => {
    const index = e.target.value
    setSelectedFeeHeadIndex(index)
      
    if (index !== "") {
        const fee = allPendingFees[index]
        setCurrentInputAmount(fee.remainingBalance.toFixed(2))
    } else {
        setCurrentInputAmount("")
    }
  }

  const handleAddFeeToBill = (e) => {
      if(e) e.preventDefault();

      if (selectedFeeHeadIndex === "" || !currentInputAmount) {
          toast.error("Please select a fee head and enter amount")
          return;
      }

      const fee = allPendingFees[selectedFeeHeadIndex];
      const amountEntered = parseFloat(currentInputAmount); 

      if (isNaN(amountEntered) || amountEntered <= 0) {
          toast.error("Please enter a valid amount");
          return;
      }

      if (amountEntered > fee.remainingBalance) {
          toast.error(`Amount cannot exceed remaining balance of ${fee.remainingBalance.toFixed(2)}`);
          return;
      }

      const initialStatus = (fee.remainingBalance - amountEntered) <= 0.01 ? "Settled" : "Pending";

      const newRow = {
          ...fee,
          grossAmount: amountEntered, 
          cashAmount: amountEntered,  
          concessionAmount: 0,
          heading: fee.heading || fee.feeHeading || fee.description || "Fee Payment",
          currentBalance: parseFloat((fee.remainingBalance - amountEntered).toFixed(2)),
          originalBalance: fee.remainingBalance,
          status: initialStatus
      };

      const updatedRows = [...addedFeeRows, newRow];
      setAddedFeeRows(updatedRows);

      // Make this NEW row the ACTIVE row
      const newIndex = updatedRows.length - 1;
      setActiveRowIndex(newIndex);
      setConcessionInput(""); 

      // Calculate totals
      calculateGlobalTotals(updatedRows);

      // Remove from pending options
      const updatedPending = allPendingFees.filter((_, idx) => idx !== parseInt(selectedFeeHeadIndex));
      setAllPendingFees(updatedPending);

      // Reset Inputs
      setSelectedFeeHeadIndex("");
      setCurrentInputAmount("");

      setTimeout(() => {
        if(concessionInputRef.current) {
            concessionInputRef.current.focus();
        }
      }, 100);
  }

  const handleConcessionInputChange = (e) => {
      setConcessionInput(e.target.value);
  }

  const applyConcessionToRow = (e) => {
      if (e) e.preventDefault();
      
      const concAmount = parseFloat(concessionInput) || 0; 
      
      if (activeRowIndex >= 0 && activeRowIndex < addedFeeRows.length) {
          const updatedRows = [...addedFeeRows];
          const activeRow = updatedRows[activeRowIndex];
          
          if (concAmount > activeRow.grossAmount) {
              toast.error("Concession cannot exceed the Fee Amount!");
              return; 
          }
          
          activeRow.concessionAmount = parseFloat(concAmount.toFixed(2));
          activeRow.cashAmount = parseFloat((activeRow.grossAmount - concAmount).toFixed(2));
          
          // Update status based on new balance
          const newBalance = parseFloat((activeRow.originalBalance - activeRow.grossAmount).toFixed(2));
          activeRow.currentBalance = newBalance;
          activeRow.status = newBalance <= 0.01 ? "Settled" : "Pending";
          
          setAddedFeeRows(updatedRows);
          calculateGlobalTotals(updatedRows);
          
          toast.success(`Concession added. Cash to pay: ₹${activeRow.cashAmount.toFixed(2)}`, { 
              autoClose: 1000, 
              hideProgressBar: true, 
              position: "bottom-right" 
          });
      }
  }

  const handleConcessionKeyDown = (e) => {
      if (e.key === 'Enter') {
          applyConcessionToRow(e);
      }
  }
      
  const handleRowClick = (index) => {
      setActiveRowIndex(index);
      const row = addedFeeRows[index];
      setConcessionInput(row.concessionAmount > 0 ? row.concessionAmount.toString() : "");
      
      setTimeout(() => {
        concessionInputRef.current?.focus();
      }, 50);
  }

  // Calculate totals for ALL rows 
  const calculateGlobalTotals = (rows) => {
      const totalGross = rows.reduce((sum, row) => sum + row.grossAmount, 0); 
      const totalConc = rows.reduce((sum, row) => sum + row.concessionAmount, 0); 
      const totalCash = rows.reduce((sum, row) => sum + row.cashAmount, 0); 
      
      const sumOriginalBalance = rows.reduce((sum, row) => sum + row.originalBalance, 0);
      const sumCurrentBalance = rows.reduce((sum, row) => sum + row.currentBalance, 0);

      setBillData(prev => ({
          ...prev,
          totalPaidAmount: parseFloat(totalCash).toFixed(2), // CASH
          totalConcessionAmount: parseFloat(totalConc).toFixed(2),
          totalNetPaidAmount: parseFloat(totalGross).toFixed(2), // TOTAL CLEARED (GROSS)
      }));

      // Update the Summary Box
      setSummaryTotals({
          totalBalanceBefore: parseFloat(sumOriginalBalance).toFixed(2),
          totalPaid: parseFloat(totalGross).toFixed(2), // Shows Cleared Amount
          totalBalanceAfter: parseFloat(sumCurrentBalance).toFixed(2)
      });
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!schoolId) {
      toast.error("School ID is not available.")
      return
    }
    if (!studentData || !billData.admissionNumber) {
      toast.error("Please select a student first")
      return
    }

    // --- FIX START: Handle case where user entered amount but forgot to click '+' ---
    if (addedFeeRows.length === 0) {
      // If table is empty, but user has selected a fee and entered an amount
      if (selectedFeeHeadIndex !== "" && currentInputAmount) {
        // Trigger the add logic automatically
        handleAddFeeToBill(e)
        // Notify user
        toast.info("Fee added to list. Please verify and click 'Submit Payment' again to confirm.")
        return
      }
      
      toast.error("Please add at least one fee to pay")
      return
    }
    // --- FIX END ---

    setShowConfirmModal(true)
  }

  const formatDateForBackend = (date) => {
    if (!date) return null;
    const dateObj = new Date(date);
    const offset = dateObj.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(dateObj - offset)).toISOString().slice(0, 19);
    return localISOTime;
  }

  const processPayment = async () => {
    try {
      setShowConfirmModal(false)
      setIsLoading(true)

      // Prepare fee payments with unique IDs to avoid duplicate error
      const feePayments = addedFeeRows.map((fee, index) => ({
          id: `${billData.billNumber}_${index}_${Date.now()}`, // Unique ID for each payment
          feeHeading: fee.heading,
          description: fee.heading,
          accountHead: fee.accountHead || fee.heading,
          feeType: fee.feeType || fee.type || "Academic",
          feeAmount: fee.originalAmount || fee.amount || 0,
          previousPaid: fee.previousPaid || 0,
          previousConcession: fee.previousConcession || 0,
          remainingBalance: fee.remainingBalance || 0,
          paidAmount: fee.cashAmount || 0, 
          concessionAmount: fee.concessionAmount || 0,
          status: fee.status || "Pending"
      }))

      const paymentData = {
        schoolId,
        academicYear: currentAcademicYear,
        billNumber: billData.billNumber,
        admissionNumber: billData.admissionNumber,
        studentName: billData.studentName,
        fatherName: billData.fatherName,
        standard: billData.standard,
        section: billData.section,
        boardingPoint: billData.boardingPoint,
        emisNo: billData.emisNo, // Still sent to backend for records
        aadharNo: billData.aadharNo, // Still sent to backend for records
        billDate: formatDateForBackend(billData.billDate),
        previousBalance: 0,
        paidAmount: parseFloat(billData.totalPaidAmount) || 0,
        concessionAmount: parseFloat(billData.totalConcessionAmount) || 0,
        netPaidAmount: parseFloat(billData.totalNetPaidAmount) || 0,
        newBalance: 0, 
        paymentMode: billData.paymentMode,
        paymentNumber: billData.paymentNumber || "",
        operatorName: billData.operatorName,
        transactionNarrative: billData.transactionNarrative || "",
        transactionDate: formatDateForBackend(billData.transactionDate || billData.billDate),
        routeNumber: studentData?.busRouteNumber || "",
        studentId: studentData?.id || 0,
        feePayments: feePayments,
        totalFeeAmount: feePayments.reduce((sum, fee) => sum + Number.parseFloat(fee.feeAmount || 0), 0),
        status: "active"
      }

      console.log("Sending payment data:", paymentData);

      const response = await fetch(`${ENDPOINTS.transaction}/daily-fee-collection/process-payment?schoolId=${schoolId}`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Payment failed:", errorText)
        throw new Error(errorText || "Payment processing failed")
      }

      const result = await response.json()
      toast.success("Fee payment processed successfully!")
      setIsLoading(false)
      setShowBillPreviewModal(true)
      
      // Update Right Table View to show the payment just made
      // Since we want combined rows, we aggregate the `addedFeeRows` into one entry
      const totalPaid = addedFeeRows.reduce((sum, row) => sum + row.grossAmount, 0);
      const totalConc = addedFeeRows.reduce((sum, row) => sum + row.concessionAmount, 0);
      
      const newPaidRow = {
        billNumber: billData.billNumber,
        billDate: billData.billDate,
        description: "Fee Payment", // Unified description
        grossAmount: totalPaid,
        concessionAmount: totalConc,
        transactionNarrative: billData.transactionNarrative || "", 
        paymentNumber: billData.paymentNumber || "" 
      };

      setPaidBillRows([newPaidRow]);
      
      // Update totalHistoryForBanner with the new payment
      setTotalHistoryForBanner(prev => prev + totalPaid);
      
      localStorage.setItem(`lastBillNumber_${schoolId}`, billData.billNumber)
      
    } catch (error) {
      console.error("Error processing payment:", error)
      toast.error(`Failed to process payment: ${error.message}`)
      setIsLoading(false)
    }
  }

  // Enhanced fetchPaymentHistory function to properly format data for PaymentHistoryModal AND Group Transactions
  const fetchPaymentHistory = async () => {
    if (!schoolId || !billData.admissionNumber) {
      toast.error("Please select a student first")
      return
    }

    if (!billData.admissionNumber.trim()) {
      toast.error("Please enter admission number first")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `${ENDPOINTS.transaction}/daily-fee-collection/payment-history/${billData.admissionNumber}?schoolId=${schoolId}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const history = await response.json()
        
        if (Array.isArray(history)) {
            // Group the raw history data by Bill Number
            const groupedHistoryObj = history.reduce((acc, curr) => {
                const billNo = curr.billNumber || curr.bill_number;
                if (!billNo) return acc; // skip invalid records

                if (!acc[billNo]) {
                    acc[billNo] = {
                        ...curr,
                        billNumber: billNo,
                        billDate: curr.billDate || curr.bill_date,
                        // Initialize amounts
                        paidAmount: 0,
                        concessionAmount: 0,
                        netPaidAmount: 0,
                        // Ensure text fields exist
                        paymentMode: curr.paymentMode || curr.payment_mode,
                        operatorName: curr.operatorName || curr.operator_name,
                        transactionNarrative: curr.transactionNarrative || curr.transaction_narrative,
                        paymentNumber: curr.paymentNumber || curr.payment_number || "",
                        description: "Fee Payment" // Unified description
                    };
                }

                const p = Number(curr.paidAmount || curr.paid_amount || 0);
                const c = Number(curr.concessionAmount || curr.concession_amount || 0);
                const net = Number(curr.netPaidAmount || curr.net_paid_amount) || (p + c);

                acc[billNo].paidAmount += p;
                acc[billNo].concessionAmount += c;
                acc[billNo].netPaidAmount += net;
                
                return acc;
            }, {});

            // Convert back to array and sort by date
            const groupedHistory = Object.values(groupedHistoryObj).sort((a, b) => {
                return new Date(b.billDate) - new Date(a.billDate);
            });

            // Map to the keys expected by the Modal (if it uses snake_case or camelCase)
            // The modal usually expects standardized keys. Let's provide both to be safe.
            const enhancedHistory = groupedHistory.map(payment => ({
                ...payment,
                bill_number: payment.billNumber,
                bill_date: payment.billDate,
                paid_amount: payment.paidAmount,
                concession_amount: payment.concessionAmount,
                net_paid_amount: payment.netPaidAmount,
                payment_mode: payment.paymentMode,
                operator_name: payment.operatorName,
                transaction_narrative: payment.transactionNarrative,
                payment_number: payment.paymentNumber,
            }));

            setPaymentHistory(enhancedHistory)
            setShowHistoryModal(true)
            
            if (enhancedHistory.length === 0) {
                toast.info("No payment history found for this student")
            } else {
                toast.success(`Loaded ${enhancedHistory.length} payment records`)
            }

        } else {
             setPaymentHistory([])
             setShowHistoryModal(true)
        }
      } else {
        toast.info("No payment history found for this student")
        setPaymentHistory([])
        setShowHistoryModal(true)
      }
    } catch (error) {
      console.error("Error fetching payment history:", error)
      toast.error("Failed to fetch payment history. Please try again.")
      setPaymentHistory([])
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setBillNumberLocked(false)
    setBillData({
      billNumber: "",
      admissionNumber: "",
      studentName: "",
      fatherName: "",
      standard: "",
      section: "",
      boardingPoint: "",
      emisNo: "", // Reset but not displayed
      aadharNo: "", // Reset but not displayed
      billDate: new Date(),
      totalPaidAmount: "0.00",
      totalConcessionAmount: "0.00",
      totalNetPaidAmount: "0.00",
      paymentMode: "Cash",
      paymentNumber: "",
      operatorName: "XPO ADMIN",
      transactionNarrative: "",
      transactionDate: null,
    })
    setAddedFeeRows([])
    setPaidBillRows([])
    setAllPendingFees([])
    setActiveRowIndex(-1)
    setSummaryTotals({ totalBalanceBefore: "0.00", totalPaid: "0.00", totalBalanceAfter: "0.00" })
    setStudentData(null)
    setStudentLoaded(false)
    setStudentImageUrl(defaultProfileImage)
    setOpeningPaidAmount(0)
    setTotalHistoryForBanner(0)
    setPaymentHistory([])
    setShowHistoryModal(false)
  }

  const handleBillPreviewClose = () => {
    setShowBillPreviewModal(false)
    resetForm()
  }

  const formatTableDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0 pb-5">
        <Card className="shadow-sm border-0">
          <Card.Header
            style={{ backgroundColor: "#0B3D7B" }}
            className="text-white py-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2"
          >
            <h2 className="mb-0 h4">Daily Fee Collection</h2>
            <div className="text-white d-flex align-items-center gap-2 small">
               <span>School: {schoolInfo.name}</span>
            </div>
          </Card.Header>
          <Card.Body className="p-3">
             <Form onSubmit={handleSubmit} className="billing-form">
                <Row className="g-3">
                    {/* LEFT COLUMN: Student Info & Fee Selection */}
                    <Col lg={5} md={12} className="mb-3">
                        <Card className="border shadow-none h-100">
                            <Card.Header className="bg-light fw-bold py-2">Student Information</Card.Header>
                            <Card.Body className="p-3">
                                <Row className="mb-2">
                                    <Col xs={4} md={4} className="d-flex align-items-center"><Form.Label className="mb-0 fw-semibold text-muted">Bill No</Form.Label></Col>
                                    <Col xs={8} md={8}>
                                      <div className="d-flex">
                                        <Form.Control 
                                          size="sm" 
                                          type="text" 
                                          value={billData.billNumber} 
                                          disabled 
                                          className="bg-light mobile-input" 
                                        />
                                        {isLoading && <Spinner animation="border" size="sm" className="ms-2" />}
                                      </div>
                                    </Col>
                                </Row>

                                <Row className="mb-2">
                                    <Col xs={4} md={4} className="d-flex align-items-center"><Form.Label className="mb-0 fw-semibold text-muted">Admin No</Form.Label></Col>
                                    <Col xs={8} md={8}>
                                        <div className="d-flex position-relative" ref={dropdownRef}>
                                            <Form.Control
                                                size="sm"
                                                type="text"
                                                name="admissionNumber"
                                                value={billData.admissionNumber}
                                                onChange={handleInputChange}
                                                autoComplete="off"
                                                placeholder="Search Admission No"
                                                className="mobile-input"
                                                onFocus={() => { if (billData.admissionNumber && studentsList.length > 0) setShowDropdown(true) }}
                                                disabled={isLoading}
                                            />
                                            <Button 
                                              size="sm" 
                                              variant="outline-primary" 
                                              onClick={() => fetchStudentDataByAdmissionNumber(billData.admissionNumber)} 
                                              disabled={!billData.admissionNumber || isLoading}
                                              className="ms-1"
                                            >
                                                {isLoading ? <Spinner size="sm" /> : "Load"}
                                            </Button>
                                            {showDropdown && studentsList.length > 0 && (
                                                <ListGroup className="position-absolute w-100 shadow-sm" style={{ top: "100%", zIndex: 1000, maxHeight: "200px", overflowY: "auto" }}>
                                                    {studentsList.map((student) => (
                                                        <ListGroup.Item 
                                                          key={student.id} 
                                                          action 
                                                          onClick={() => handleStudentSelect(student.admissionNumber)} 
                                                          className="py-2 small"
                                                        >
                                                            {student.admissionNumber} - {student.studentName}
                                                        </ListGroup.Item>
                                                    ))}
                                                </ListGroup>
                                            )}
                                        </div>
                                    </Col>
                                </Row>

                                <Row className="mb-2">
                                    <Col xs={4} md={4} className="d-flex align-items-center"><Form.Label className="mb-0 fw-semibold text-muted">Name</Form.Label></Col>
                                    <Col xs={8} md={8}><Form.Control size="sm" type="text" value={billData.studentName} disabled className="bg-light mobile-input" /></Col>
                                </Row>

                                <Row className="mb-2">
                                    <Col xs={4} md={4} className="d-flex align-items-center"><Form.Label className="mb-0 fw-semibold text-muted">Father</Form.Label></Col>
                                    <Col xs={8} md={8}><Form.Control size="sm" type="text" value={billData.fatherName} disabled className="bg-light mobile-input" /></Col>
                                </Row>

                                <Row className="mb-2">
                                    <Col xs={4} md={4} className="d-flex align-items-center"><Form.Label className="mb-0 fw-semibold text-muted">Class/Sec</Form.Label></Col>
                                    <Col xs={4} md={4}><Form.Control size="sm" type="text" value={billData.standard} disabled className="bg-light mobile-input" placeholder="Class" /></Col>
                                    <Col xs={4} md={4}><Form.Control size="sm" type="text" value={billData.section} disabled className="bg-light mobile-input" placeholder="Sec" /></Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col xs={4} md={4} className="d-flex align-items-center"><Form.Label className="mb-0 fw-semibold text-muted">Pickup</Form.Label></Col>
                                    <Col xs={8} md={8}><Form.Control size="sm" type="text" value={billData.boardingPoint} disabled className="bg-light mobile-input" /></Col>
                                </Row>

                                <hr className="my-3"/>
                                
                                <h6 className="text-primary fw-bold mb-3">Add Fee to Bill</h6>
                                <Row className="g-2 mb-3">
                                    <Col xs={12} sm={7}>
                                        <Form.Select 
                                          size="sm" 
                                          value={selectedFeeHeadIndex} 
                                          onChange={handleFeeHeadDropdownChange} 
                                          disabled={!studentLoaded || isLoading}
                                          className="mobile-input"
                                        >
                                            <option value="">Select Fee Head</option>
                                            {allPendingFees.map((fee, idx) => (
                                                <option key={idx} value={idx}>
                                                  {fee.heading || fee.feeHeading || fee.description} (Bal: ₹{fee.remainingBalance.toFixed(2)})
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Col>
                                    <Col xs={12} sm={5}>
                                        <InputGroup size="sm">
                                            <InputGroup.Text>₹</InputGroup.Text>
                                            <Form.Control 
                                                type="number" 
                                                value={currentInputAmount} 
                                                onChange={(e) => setCurrentInputAmount(e.target.value)}
                                                onKeyDown={(e) => { if(e.key === 'Enter') handleAddFeeToBill(e) }}
                                                placeholder="Amount"
                                                disabled={selectedFeeHeadIndex === "" || isLoading}
                                                className="mobile-input"
                                                min="0"
                                                step="0.01"
                                            />
                                            <Button 
                                              variant="primary" 
                                              onClick={handleAddFeeToBill} 
                                              disabled={selectedFeeHeadIndex === "" || isLoading}
                                              >
                                                {isLoading ? <Spinner size="sm" /> : "+"}
                                            </Button>
                                        </InputGroup>
                                    </Col>
                                </Row>

                                {/* STAGING TABLE - Height Increased to 300px */}
                                <div className="table-responsive border rounded" style={{ height: "300px", overflowY: "auto", overflowX: "auto" }}>
                                    <Table size="sm" hover className="mb-0 text-center small text-nowrap">
                                            <thead className="bg-light sticky-top">
                                                <tr>
                                                    <th className="fw-semibold">Description</th>
                                                    <th className="fw-semibold">Amount</th>
                                                    <th className="fw-semibold">Bal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {addedFeeRows.map((row, idx) => {
                                                    const rows = []
                                                    rows.push(
                                                        <tr 
                                                          key={`${idx}-fee`} 
                                                          onClick={() => !isLoading && handleRowClick(idx)} 
                                                          style={{ 
                                                            cursor: isLoading ? 'not-allowed' : 'pointer', 
                                                            backgroundColor: activeRowIndex === idx ? '#e8f0fe' : 'inherit',
                                                            opacity: isLoading ? 0.7 : 1
                                                          }}
                                                        >
                                                                <td className="text-start text-truncate" style={{maxWidth: '120px'}} title={row.heading}>
                                                                  {row.heading}
                                                                </td>
                                                                <td className="fw-bold">₹{row.grossAmount.toFixed(2)}</td>
                                                                <td className="text-muted">₹{row.currentBalance.toFixed(2)}</td>
                                                        </tr>
                                                    )
                                                    if (row.concessionAmount > 0) {
                                                        rows.push(
                                                            <tr key={`${idx}-conc`} style={{ backgroundColor: activeRowIndex === idx ? '#e8f0fe' : 'inherit' }}>
                                                                    <td className="text-start text-danger fst-italic">↳ Concession</td>
                                                                    <td className="text-danger">-₹{row.concessionAmount.toFixed(2)}</td>
                                                                    <td></td>
                                                            </tr>
                                                        )
                                                    }
                                                    return rows
                                                })}
                                                {addedFeeRows.length === 0 && (
                                                    <tr><td colSpan="3" className="text-muted py-4">No fees added yet</td></tr>
                                                )}
                                            </tbody>
                                    </Table>
                                </div>
                                <div className="mt-2 text-end">
                                    <span className="text-muted small me-2">Total Entered:</span>
                                    <span className="fw-bold fs-6">₹ {billData.totalPaidAmount}</span>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* RIGHT COLUMN: Summary & Confirmation */}
                    <Col lg={7} md={12}>
                        <Row className="mb-3 g-2">
                            <Col xs={12} md={3} className="order-1 order-md-0 d-flex justify-content-center">
                                <Card className="h-100 shadow-sm border-0 bg-light w-100">
                                    <Card.Body className="d-flex flex-row flex-md-column align-items-center justify-content-center p-2 gap-3">
                                            <div className="bg-white p-1 border rounded" style={{width: '70px', height: '70px'}}>
                                                <Image 
                                                    src={studentImageUrl} 
                                                    alt="Student" 
                                                    className="w-100 h-100 object-fit-cover"
                                                    onError={(e) => { e.target.src = defaultProfileImage }} 
                                                />
                                            </div>
                                            <small className="text-muted fw-bold d-none d-md-block">Student Photo</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col xs={12} md={9} className="order-0 order-md-1">
                                <Card className="h-100 shadow-sm">
                                    <Card.Body className="p-3">
                                            <Row className="g-2 align-items-center mb-2">
                                                <Col xs={3} className="text-end text-muted fw-semibold">Date</Col>
                                                <Col xs={9}>
                                                    <DatePicker 
                                                        selected={billData.billDate} 
                                                        onChange={(date) => handleDateChange(date, "billDate")} 
                                                        dateFormat="dd/MM/yyyy" 
                                                        className="form-control form-control-sm mobile-input" 
                                                        disabled={isLoading}
                                                    />
                                                </Col>
                                            </Row>
                                            <Row className="g-2 text-center">
                                                <Col xs={4} sm={4}>
                                                    <div className="border rounded p-1 p-sm-2 bg-light h-100 d-flex flex-column justify-content-center">
                                                        <small className="d-block text-muted" style={{fontSize: '0.7rem'}}>Bal Before</small>
                                                        <strong className="text-dark small-text-responsive">₹ {summaryTotals.totalBalanceBefore}</strong>
                                                    </div>
                                                </Col>
                                                <Col xs={4} sm={4}>
                                                    <div className="border rounded p-1 p-sm-2 bg-warning-subtle border-warning h-100 d-flex flex-column justify-content-center">
                                                        <small className="d-block text-warning-emphasis fw-bold" style={{fontSize: '0.7rem'}}>Paying</small>
                                                        <strong className="text-warning-emphasis fs-6 fs-sm-5">₹ {summaryTotals.totalPaid}</strong>
                                                    </div>
                                                </Col>
                                                <Col xs={4} sm={4}>
                                                    <div className="border rounded p-1 p-sm-2 bg-light h-100 d-flex flex-column justify-content-center">
                                                        <small className="d-block text-muted" style={{fontSize: '0.7rem'}}>Bal After</small>
                                                        <strong className="text-dark small-text-responsive">₹ {summaryTotals.totalBalanceAfter}</strong>
                                                    </div>
                                                </Col>
                                            </Row>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        {/* RIGHT TABLE (HISTORY) - Height Increased to 450px */}
                        <Card className="shadow-sm mb-3">
                            <Card.Header className="py-2 text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: '#0B3D7B' }}>
                                <span className="small fw-bold">Bill History</span>
                                <span className="small" style={{fontSize: '0.75rem'}}>
                                  Previous Paid Amt : ₹ {studentLoaded ? totalHistoryForBanner.toFixed(2) : "0.00"}
                                </span>
                            </Card.Header>
                            <div className="table-responsive" style={{ height: "450px", overflowY: "auto" }}>
                                <Table size="sm" bordered hover className="mb-0 small history-table" style={{ tableLayout: 'fixed', width: '100%' }}>
                                    <thead className="bg-light sticky-top">
                                            <tr>
                                                <th className="text-center" style={{ width: '10%' }}>Date</th>
                                                <th className="text-center" style={{ width: '12%' }}>Bill No</th>
                                                <th className="text-start ps-2" style={{ width: '28%' }}>Description</th>
                                                <th className="text-end pe-2" style={{ width: '12%' }}>Paid Amt</th>
                                                <th className="text-center" style={{ width: '15%' }}>Ref No</th>
                                                <th className="text-start ps-2" style={{ width: '23%' }}>Narration</th>
                                            </tr>
                                    </thead>
                                    <tbody className="align-middle">
                                        {studentLoaded && openingPaidAmount > 0 && (
                                            <tr className="bg-light text-muted fst-italic">
                                                <td className="text-center">-</td>
                                                <td className="text-center">-</td>
                                                <td className="text-start ps-2">Opening Paid</td>
                                                <td className="text-start pe-1">₹{openingPaidAmount.toFixed(1)}</td>
                                                <td className="text-center">-</td>
                                                <td className="text-center">-</td>
                                            </tr>
                                        )}
                                        {paidBillRows.map((fee, index) => {
                                            const rows = []
                                            rows.push(
                                                <tr key={`${index}-fee`}>
                                                    <td className="text-center text-nowrap" style={{ verticalAlign: 'top' }}>
                                                        {formatTableDate(fee.billDate || billData.billDate)}
                                                    </td>
                                                    <td className="text-center text-nowrap" style={{ verticalAlign: 'top' }}>
                                                        {fee.billNumber}
                                                    </td>
                                                    <td className="ps-2 text-wrap" style={{ wordBreak: 'break-word', verticalAlign: 'top' }}>
                                                      {fee.description || fee.heading}
                                                    </td>
                                                    <td className="fw-bold text-success text-end pe-2" style={{ verticalAlign: 'top' }}>
                                                        ₹{fee.grossAmount.toFixed(1)}
                                                    </td>
                                                    <td className="text-center text-nowrap" style={{ verticalAlign: 'top', fontSize: '0.7rem' }}>
                                                        {fee.paymentNumber || '-'}
                                                    </td>
                                                    <td className="ps-2 text-wrap" style={{ wordBreak: 'break-word', verticalAlign: 'top' }}>
                                                      {fee.transactionNarrative || '-'}
                                                    </td>
                                                </tr>
                                            )
                                            if (fee.concessionAmount > 0) {
                                                rows.push(
                                                    <tr key={`${index}-conc`}>
                                                        <td></td>
                                                        <td></td>
                                                        <td className="text-end text-muted fst-italic pe-2">Concession Applied:</td>
                                                        <td className="text-end text-danger pe-2">-₹{fee.concessionAmount.toFixed(2)}</td>
                                                        <td></td>
                                                        <td></td>
                                                    </tr>
                                                )
                                            }
                                            return rows
                                        })}
                                        {studentLoaded && paidBillRows.length === 0 && openingPaidAmount === 0 && (
                                            <tr><td colSpan="6" className="text-center py-5 text-muted">No payment history found</td></tr>
                                        )}
                                        {!studentLoaded && (
                                            <tr><td colSpan="6" className="text-center py-5 text-muted">Please load student data</td></tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </Card>

                        {/* PAYMENT DETAILS & ACTIONS */}
                        <Card className="shadow-sm bg-light border-0">
                            <Card.Body className="p-3">
                                <Row className="align-items-start g-3">
                                    <Col md={7} xs={12}>
                                        <div className="mb-2">
                                            <Form.Label className="fw-bold small mb-1">Payment Mode</Form.Label>
                                            <div className="d-flex gap-3 overflow-auto pb-1">
                                                {["Cash", "Online", "D.D."].map((mode) => (
                                                    <Form.Check 
                                                        key={mode}
                                                        type="radio" 
                                                        id={`mode-${mode}`}
                                                        label={mode} 
                                                        name="paymentMode" 
                                                        value={mode === "D.D." ? "DD" : mode} 
                                                        checked={billData.paymentMode === (mode === "D.D." ? "DD" : mode)} 
                                                        onChange={handleInputChange} 
                                                        className="custom-radio small text-nowrap"
                                                        disabled={isLoading}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        {billData.paymentMode !== "Cash" && (
                                            <InputGroup size="sm" className="mb-2">
                                                <InputGroup.Text>Ref No</InputGroup.Text>
                                                <Form.Control 
                                                    type="text" 
                                                    name="paymentNumber" 
                                                    value={billData.paymentNumber} 
                                                    onChange={handleInputChange} 
                                                    placeholder="Transaction/DD No" 
                                                    className="mobile-input" 
                                                    disabled={isLoading}
                                                />
                                            </InputGroup>
                                        )}
                                        <InputGroup size="sm" className="mb-2">
                                            <InputGroup.Text>Operator</InputGroup.Text>
                                            <Form.Select 
                                              name="operatorName" 
                                              value={billData.operatorName} 
                                              onChange={handleInputChange} 
                                              className="mobile-input"
                                              disabled={isLoading}
                                            >
                                                <option>XPO ADMIN</option>
                                                <option>STAFF</option>
                                            </Form.Select>
                                        </InputGroup>
                                    </Col>
                                    
                                    <Col md={5} xs={12}>
                                        <div className="border rounded p-2 bg-white mb-2">
                                            <h6 className="small fw-bold text-danger mb-2">
                                                Concession {activeRowIndex !== -1 ? (
                                                  <span className="concession-fee-type" title={addedFeeRows[activeRowIndex]?.heading}>
                                                      (For: {addedFeeRows[activeRowIndex]?.heading})
                                                  </span>
                                                ) : ""}
                                            </h6>
                                            <InputGroup size="sm">
                                                <Form.Control 
                                                    ref={concessionInputRef} 
                                                    placeholder="Amount" 
                                                    value={concessionInput} 
                                                    onChange={handleConcessionInputChange} 
                                                    onKeyDown={handleConcessionKeyDown} 
                                                    disabled={activeRowIndex === -1 || isLoading} 
                                                    className="mobile-input"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                />
                                                <Button 
                                                  variant="outline-danger" 
                                                  onClick={applyConcessionToRow} 
                                                  disabled={activeRowIndex === -1 || isLoading}
                                                >
                                                    {isLoading ? <Spinner size="sm" /> : "+"}
                                                </Button>
                                            </InputGroup>
                                            <div className="d-flex justify-content-between mt-1 small text-muted">
                                                <span>Bal: ₹{activeRowIndex !== -1 ? addedFeeRows[activeRowIndex].originalBalance.toFixed(2) : "0.00"}</span>
                                                <span>New: ₹{activeRowIndex !== -1 ? (addedFeeRows[activeRowIndex].currentBalance + addedFeeRows[activeRowIndex].concessionAmount).toFixed(2) : "0.00"}</span>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>

                                <hr className="my-2" />

                                <Row className="g-2">
                                    <Col md={8} xs={12}>
                                        <InputGroup size="sm">
                                            <InputGroup.Text>Narrative</InputGroup.Text>
                                            <Form.Control 
                                              type="text" 
                                              name="transactionNarrative" 
                                              value={billData.transactionNarrative} 
                                              onChange={handleInputChange} 
                                              placeholder="Remarks..." 
                                              className="mobile-input" 
                                              disabled={isLoading}
                                            />
                                        </InputGroup>
                                    </Col>
                                    <Col md={4} xs={12}>
                                        <DatePicker 
                                            selected={billData.transactionDate} 
                                            onChange={(date) => handleDateChange(date, "transactionDate")} 
                                            dateFormat="dd/MM/yyyy" 
                                            className="form-control form-control-sm mobile-input"
                                            placeholderText="Txn Date"
                                            disabled={isLoading}
                                        />
                                    </Col>
                                </Row>
                                
                                <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-3">
                                    <Button 
                                      variant="outline-secondary" 
                                      onClick={resetForm} 
                                      className="order-2 order-md-1"
                                      disabled={isLoading}
                                    >
                                      Clear
                                    </Button>
                                    <Button 
                                      variant="outline-info" 
                                      onClick={fetchPaymentHistory} 
                                      disabled={!studentLoaded || isLoading}
                                      className="order-3 order-md-2"
                                    >
                                      {isLoading ? <Spinner size="sm" /> : "History"}
                                    </Button>
                                    <Button 
                                      variant="primary" 
                                      type="submit" 
                                      disabled={isLoading || !studentLoaded || (addedFeeRows.length === 0 && (selectedFeeHeadIndex === "" || !currentInputAmount))} 
                                      style={{ backgroundColor: "#0B3D7B" }} 
                                      className="order-1 order-md-3 px-md-4"
                                    >
                                      {isLoading ? (
                                        <>
                                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                          Processing...
                                        </>
                                      ) : "Submit Payment"}
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
             </Form>
          </Card.Body>
        </Card>
      </Container>

      <BillPreviewModal 
        show={showBillPreviewModal} 
        onHide={() => setShowBillPreviewModal(false)} 
        billData={billData} 
        feeTableData={addedFeeRows.map(row => ({
          ...row,
          paidAmount: row.grossAmount,
          concessionAmount: row.concessionAmount,
          netAmount: row.grossAmount
        }))}
        schoolInfo={schoolInfo} 
        onClose={handleBillPreviewClose} 
        className="modal-80w" 
      />
      
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Payment History Modal */}
      <PaymentHistoryModal
        show={showHistoryModal}
        onHide={() => setShowHistoryModal(false)}
        paymentHistory={paymentHistory}
      />
      
      {showConfirmModal && (
        <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Payment</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="mb-3">Are you sure you want to process this payment?</p>
            <div className="p-3 bg-light rounded border">
                <Row className="mb-2">
                    <Col xs={6} className="text-muted">Total Fee Amount:</Col>
                    <Col xs={6} className="text-end fw-bold">₹ {billData.totalNetPaidAmount}</Col>
                </Row>
                <Row className="mb-2">
                    <Col xs={6} className="text-muted">Concession:</Col>
                    <Col xs={6} className="text-end text-danger">₹ {billData.totalConcessionAmount}</Col>
                </Row>
                <hr className="my-2" />
                <Row>
                    <Col xs={6} className="fw-bold align-self-center">Net Paid Amount:</Col>
                    <Col xs={6} className="text-end fw-bold text-success fs-5">₹ {billData.totalPaidAmount}</Col>
                </Row>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={processPayment} 
              ref={confirmYesButtonRef}
              style={{ backgroundColor: "#0B3D7B" }}
            >
              Yes, Process
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      <style>
        {`
          .custom-radio .form-check-input {
            border-radius: 50% !important;
            cursor: pointer;
            width: 1.2em;
            height: 1.2em;
            flex-shrink: 0;
          }
          .custom-radio .form-check-input:checked {
            background-color: #0B3D7B;
            border-color: #0B3D7B;
          }
          .custom-radio .form-check-input:disabled {
            cursor: not-allowed;
            opacity: 0.6;
          }

          /* --- FIX FOR STICKY HEADER OVERLAYING MODALS --- */
          .sticky-top {
            z-index: 1 !important; 
          }

          /* --- CALENDAR Z-INDEX FIX --- */
          .react-datepicker-popper {
            z-index: 9999 !important;
          }

          /* --- UPDATED HISTORY TABLE STYLES --- */
          .history-table th {
            font-size: 0.75rem; 
            vertical-align: middle;
            white-space: nowrap;
          }
          .history-table td {
             font-size: 0.75rem; 
             vertical-align: middle;
             white-space: normal !important; 
          }
          
          .concession-fee-type {
            display: inline-block;
            max-width: 200px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            vertical-align: bottom;
            cursor: help;
          }
          .concession-fee-type:hover {
            overflow: visible;
            white-space: normal;
            background-color: white;
            z-index: 1000;
            position: relative;
            padding: 2px 5px;
            border-radius: 3px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }
          
          @media (max-width: 768px) {
            .mobile-input {
                font-size: 16px !important;
                min-height: 40px;
            }
            .small-text-responsive {
                font-size: 0.8rem;
            }
            .modal-content-mobile {
                width: 95% !important;
                margin: 0 auto;
            }
            .billing-form {
                padding-bottom: 20px;
            }
            .concession-fee-type {
              max-width: 150px;
            }
          }
          
          @media (max-width: 576px) {
            .concession-fee-type {
              max-width: 120px;
            }
          }

          .modal-80w {
            max-width: 80% !important;
            width: 80% !important;
          }
          @media (max-width: 1200px) {
            .modal-80w {
              max-width: 95% !important;
              width: 95% !important;
            }
          }
          
          .table-responsive::-webkit-scrollbar {
            height: 8px;
            width: 8px;
          }
          .table-responsive::-webkit-scrollbar-track {
            background: #f1f1f1;
          }
          .table-responsive::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
          }
          .table-responsive::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}
      </style>
    </MainContentPage>
  )
}

export default BillingEntry