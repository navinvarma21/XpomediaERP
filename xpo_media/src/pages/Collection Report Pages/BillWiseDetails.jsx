"use client"

import { useState, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Form, Button, Container, Spinner, Table, Card, Row, Col, ToggleButton, ButtonGroup } from "react-bootstrap"
import { useAuthContext } from "../../Context/AuthContext"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { FaPrint, FaFilePdf, FaUndo, FaSearch, FaArrowLeft, FaMoneyBillWave, FaReceipt } from "react-icons/fa"
import { ENDPOINTS } from "../../SpringBoot/config"

const BillWiseDetails = () => {
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [feeType, setFeeType] = useState("BILLING_ENTRY") // "BILLING_ENTRY" or "OTHER_FEE"
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
    fetchSchoolInfo()
  }, [])

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

  // --- NEW: Grouping Logic ---
  const groupAndSumBills = (rawData) => {
    const groupedMap = {};

    rawData.forEach(item => {
      const billNo = item.billNumber;

      if (!groupedMap[billNo]) {
        // New Bill Entry
        groupedMap[billNo] = { ...item };
      } else {
        // Existing Bill Entry: Sum Amount
        groupedMap[billNo].amount += Number(item.amount) || 0;

        // Merge Descriptions (avoid duplicates)
        const currentDesc = groupedMap[billNo].description || "";
        const newDesc = item.description || "";
        
        if (newDesc && !currentDesc.includes(newDesc)) {
           groupedMap[billNo].description = currentDesc ? `${currentDesc}, ${newDesc}` : newDesc;
        }
      }
    });

    return Object.values(groupedMap);
  };

  const processCollectionData = (rawData) => {
    const groupedData = rawData.reduce((acc, item) => {
      const date = new Date(item.timestamp).toLocaleDateString('en-IN')
      const paymentMode = item.paymentMode || "Cash"
      const operatorName = item.operatorName || "XPO ADMIN"

      if (!acc[date]) {
        acc[date] = {}
      }
      
      if (!acc[date][paymentMode]) {
        acc[date][paymentMode] = {
          operatorName,
          entries: [],
        }
      }
      
      acc[date][paymentMode].entries.push(item)
      return acc
    }, {})

    const processedData = []
    let grandTotal = 0

    Object.entries(groupedData).forEach(([date, paymentModes]) => {
      // Add date header
      processedData.push({
        type: "date",
        date,
      })

      let dayTotal = 0

      Object.entries(paymentModes).forEach(([paymentMode, { operatorName, entries }]) => {
        // Add payment mode and operator
        processedData.push({
          type: "paymentMode",
          paymentMode,
          operatorName,
        })

        // Add entries for this payment mode
        entries.forEach((entry) => {
          processedData.push({
            type: "entry",
            ...entry,
            date: date,
          })
          dayTotal += Number(entry.amount) || 0
        })
      })

      // Add day total
      processedData.push({
        type: "dayTotal",
        amount: dayTotal,
      })

      grandTotal += dayTotal
    })

    return { processedData, grandTotal }
  }

  const fetchBillWiseDetails = async () => {
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
      let response, data
      let rawList = [];

      if (feeType === "BILLING_ENTRY") {
        // Billing Entry - GET request
        const formattedStartDate = startDate.toISOString().split('T')[0]
        const formattedEndDate = endDate.toISOString().split('T')[0]
        
        response = await fetch(
          `${ENDPOINTS.transaction}/tutionreport/periodical-collection?startDate=${formattedStartDate}&endDate=${formattedEndDate}&schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
          {
            method: "GET",
            headers: getAuthHeaders(),
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Failed to fetch collection data: ${response.statusText}`)
        }

        data = await response.json()
        
        // Process billing entry data
        rawList = (data.collections || []).map(item => {
          // Calculate total paid amount from feeDetails if available, else use item total
          const totalPaidFromDetails = item.feeDetails?.reduce((sum, fee) => sum + (Number(fee.paidAmount) || 0), 0) || 0
          
          return {
            billNumber: item.billNumber,
            admissionNumber: item.admissionNumber,
            studentName: item.studentName,
            standard: item.standard,
            section: item.section,
            description: item.description || (item.feeDetails?.map(fee => fee.feeHead).join(", ") || ""),
            amount: totalPaidFromDetails > 0 ? totalPaidFromDetails : (Number(item.totalPaidAmount) || 0),
            paymentMode: item.paymentMode || "Cash",
            operatorName: item.operatorName || "XPO ADMIN",
            chequeNumber: item.paymentNumber || "-",
            timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
            feeDetails: item.feeDetails || []
          }
        })

      } else {
        // Other Fee - POST request
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)

        const requestBody = {
          schoolId: schoolId,
          academicYear: currentAcademicYear,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          reportType: "PERIODICAL_COLLECTION"
        }

        response = await fetch(`${ENDPOINTS.transaction}/otherreport/periodical-collection`, {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        
        if (result.success && result.data) {
          // Process other fee data
          rawList = result.data.map(item => ({
            billNumber: item.billNumber,
            admissionNumber: item.admissionNumber,
            studentName: item.studentName,
            standard: item.standard,
            section: item.section,
            description: item.feeDetails?.map(fee => fee.feeHead).join(", ") || item.description || "",
            amount: Number.parseFloat(item.totalPaidAmount) || 0,
            paymentMode: item.paymentMode || "Cash",
            operatorName: item.operatorName || "XPO ADMIN",
            chequeNumber: item.paymentNumber || "-",
            timestamp: item.timestamp || item.createdDate || item.billDate ? new Date(item.timestamp || item.createdDate || item.billDate) : new Date()
          }))
        } else {
          throw new Error(result.message || "Failed to fetch collection data")
        }
      }

      // --- APPLY GROUPING LOGIC HERE ---
      const aggregatedList = groupAndSumBills(rawList);

      const { processedData, grandTotal } = processCollectionData(aggregatedList)
      setCollectionData(processedData)
      setTotalCollection(grandTotal)

      if (aggregatedList.length === 0) {
        toast.info(`No ${feeType === 'BILLING_ENTRY' ? 'billing entry' : 'other fee'} data found for the selected date range`)
      } else {
        toast.success(`Successfully loaded ${feeType === 'BILLING_ENTRY' ? 'billing entry' : 'other fee'} records`)
      }

    } catch (error) {
      console.error("Error fetching collection data:", error)
      toast.error(error.message || "Failed to fetch collection data")
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

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast.error("Please allow pop-ups for printing");
      return;
    }

    const printContent = document.getElementById('report-content').innerHTML;
    
    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill Wise Details Report</title>
          <style>
            body {
              margin: 0;
              padding: 10mm;
              font-family: "Times New Roman", serif;
              font-size: 11px;
              background: white;
              width: 210mm;
              height: 297mm;
            }
            .print-container {
              width: 190mm !important;
              margin: 0 auto;
              padding: 0;
              max-width: 190mm;
            }
            .report-header {
              text-align: center;
              margin-bottom: 8mm;
              border-bottom: 1px solid #0B3D7B;
              padding-bottom: 4mm;
            }
            .school-name {
              font-size: 16px;
              font-weight: bold;
              color: #0B3D7B;
              margin-bottom: 2mm;
            }
            .school-address {
              font-size: 10px;
              color: #666;
              margin-bottom: 3mm;
            }
            .report-title {
              font-size: 14px;
              font-weight: bold;
              text-decoration: underline;
              margin: 4mm 0;
            }
            .report-details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 6mm;
              font-size: 9px;
            }
            .report-table {
              width: 100% !important;
              border-collapse: collapse;
              font-size: 8px;
              table-layout: fixed;
            }
            .report-table th,
            .report-table td {
              border: 1px solid #000 !important;
              padding: 2px !important;
              text-align: left;
              vertical-align: top;
              word-wrap: break-word;
              line-height: 1.2;
            }
            .report-table th {
              background-color: #0B3D7B !important;
              color: white !important;
              font-weight: bold;
              text-align: center;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .report-table td {
              text-align: left;
            }
            .amount-column {
              text-align: right !important;
            }
            .date-row td {
              background-color: #f0f0f0 !important;
              font-weight: bold;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .payment-mode-row td {
              background-color: #f8f9fa !important;
              font-style: italic;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .day-total-row td {
              background-color: #e9ecef !important;
              font-weight: bold;
              border-top: 2px solid #000 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .grand-total-row td {
              background-color: #d1ecf1 !important;
              font-weight: bold;
              border-top: 3px double #000 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print {
              display: none !important;
            }
            .report-footer {
              margin-top: 8mm;
              padding-top: 4mm;
              border-top: 1px solid #ccc;
              font-size: 8px;
              color: #666;
            }
            @page {
              margin: 10mm;
              size: A4 portrait;
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 500);
              }, 250);
            };
            
            window.onafterprint = function() {
              setTimeout(function() {
                window.close();
              }, 100);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.focus();
  }

  const generatePDF = () => {
    return new Promise((resolve, reject) => {
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        })
        
        const pageWidth = 210
        const margin = 10
        const contentWidth = pageWidth - (2 * margin)
        
        const primaryColor = [11, 61, 123]
        const secondaryColor = [241, 241, 241]
        
        // Header - identical to print version
        doc.setFillColor(...primaryColor)
        doc.rect(0, 0, pageWidth, 18, 'F')
        
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(16)
        doc.setFont("helvetica", "bold")
        doc.text(schoolInfo.name, pageWidth / 2, 8, { align: "center" })
        
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        
        const addressParts = [
          schoolInfo.address,
          schoolInfo.city,
          schoolInfo.state,
          schoolInfo.pincode
        ].filter(Boolean)
        
        const fullAddress = addressParts.join(', ')
        doc.text(fullAddress, pageWidth / 2, 13, { 
          align: "center", 
          maxWidth: contentWidth - 20 
        })
        
        // Report title - identical to print version
        doc.setFillColor(...secondaryColor)
        doc.rect(0, 18, pageWidth, 8, 'F')
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("BILL WISE DETAILS REPORT", pageWidth / 2, 23, { align: "center" })
        
        // Report details - identical to print version
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        const startY = 35
        doc.text(`Report Period: ${startDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')}`, margin, startY)
        doc.text(`Fee Type: ${feeType === 'BILLING_ENTRY' ? 'Billing Entry' : 'Other Fee'}`, margin, startY + 4)
        doc.text(`Academic Year: ${currentAcademicYear || "N/A"}`, margin, startY + 8)
        doc.text(`Generated On: ${new Date().toLocaleDateString('en-IN')}`, margin, startY + 12)
        doc.text(`Page 1 of 1`, pageWidth - margin - 15, startY + 12)
        
        // Table columns - identical to print version
        const tableColumns = [
          { header: "Bill Date\nAdm No", dataKey: "admissionNumber" },
          { header: "Bill No", dataKey: "billNumber" },
          { header: "Student Name", dataKey: "studentName" },
          { header: "Grade", dataKey: "standard" },
          { header: "Sec", dataKey: "section" },
          { header: "Amount", dataKey: "amount" },
          { header: "DD/Cheque No", dataKey: "chequeNumber" }
        ]

        const tableRows = []
        let currentDate = null
        let currentPaymentMode = null

        // Process data for PDF - identical structure to print version
        collectionData.forEach((item) => {
          if (item.type === "date") {
            // Add date row with colspan
            tableRows.push([
              { 
                content: item.date, 
                colSpan: 7, 
                styles: { 
                  fillColor: [240, 240, 240], 
                  fontStyle: 'bold', 
                  halign: 'center',
                  fontSize: 9,
                  cellPadding: 3
                } 
              }
            ])
            currentDate = item.date
          } else if (item.type === "paymentMode") {
            // Add payment mode row with colspan
            tableRows.push([
              { 
                content: `${item.paymentMode} - ${item.operatorName}`, 
                colSpan: 7, 
                styles: { 
                  fontStyle: 'italic', 
                  fillColor: [248, 249, 250],
                  fontSize: 8,
                  cellPadding: 2
                } 
              }
            ])
            currentPaymentMode = item.paymentMode
          } else if (item.type === "entry") {
            // Add regular entry row
            tableRows.push([
              item.admissionNumber || "",
              item.billNumber || "",
              item.studentName || "",
              item.standard || "",
              item.section || "",
              { content: `Rs ${(item.amount || 0).toFixed(2)}`, styles: { halign: 'right' } },
              item.chequeNumber || "-"
            ])
          } else if (item.type === "dayTotal") {
            // Add day total row
            tableRows.push([
              { content: "Day Total:", colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8 } },
              { content: `Rs ${item.amount.toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8 } },
              ""
            ])
          }
        })

        // Add grand total row - identical to print version
        tableRows.push([
          { content: "Grand Total:", colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', fillColor: [209, 236, 241], fontSize: 9 } },
          { content: `Rs ${totalCollection.toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold', fillColor: [209, 236, 241], fontSize: 9 } },
          { content: "", styles: { fillColor: [209, 236, 241] } }
        ])

        // Calculate optimal column widths for full width usage
        const columnWidths = [
          25, // Bill Date/Adm No (25mm)
          20, // Bill No (20mm)
          contentWidth - (25 + 20 + 20 + 15 + 25 + 25), // Student Name (flexible)
          20, // Grade (20mm)
          15, // Sec (15mm)
          25, // Amount (25mm)
          25  // DD/Cheque No (25mm)
        ]

        // Generate table with full width and identical styling to print
        autoTable(doc, {
          head: [tableColumns.map(col => col.header)],
          body: tableRows,
          startY: startY + 20,
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: 2,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            textColor: [0, 0, 0],
            valign: 'middle',
            font: 'helvetica'
          },
          headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 8,
            valign: 'middle',
            cellPadding: 3
          },
          columnStyles: {
            0: { cellWidth: columnWidths[0], halign: 'center' },
            1: { cellWidth: columnWidths[1], halign: 'center' },
            2: { cellWidth: columnWidths[2], halign: 'left' },
            3: { cellWidth: columnWidths[3], halign: 'center' },
            4: { cellWidth: columnWidths[4], halign: 'center' },
            5: { cellWidth: columnWidths[5], halign: 'right' },
            6: { cellWidth: columnWidths[6], halign: 'center' },
          },
          margin: { top: startY + 20, right: margin, left: margin, bottom: 20 },
          tableWidth: 'wrap'
        })
        
        // Footer - identical to print version
        const finalY = doc.lastAutoTable.finalY + 10
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(100, 100, 100)
        
        const footerText = `Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')} | School ERP System`
        doc.text(footerText, pageWidth / 2, finalY, { align: "center" })

        resolve(doc)
      } catch (error) {
        console.error("Error in generatePDF:", error)
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
    
    setTimeout(async () => {
      try {
        const doc = await generatePDF()
        const fileName = `Bill_Wise_Details_${feeType === 'BILLING_ENTRY' ? 'Billing' : 'OtherFee'}_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.pdf`
        
        const pdfBlob = doc.output('blob')
        const url = URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        toast.success("PDF downloaded successfully")
      } catch (error) {
        console.error("Error generating PDF:", error)
        toast.error("Failed to generate PDF. Please try again.")
      } finally {
        setProcessing(false)
      }
    }, 100)
  }

  const handleReset = () => {
    setStartDate(new Date())
    setEndDate(new Date())
    setCollectionData([])
    setTotalCollection(0)
  }

  const renderTableBody = () => {
    if (collectionData.length === 0) {
      return (
        <tr>
          <td colSpan="7" className="text-center py-4">
            No collection data available for the selected date range.
          </td>
        </tr>
      )
    }

    return collectionData.map((item, index) => {
      if (item.type === "date") {
        return (
          <tr key={`date-${index}`} className="date-row">
            <td colSpan="7" className="fw-bold bg-light text-center">
              {item.date}
            </td>
          </tr>
        )
      }

      if (item.type === "paymentMode") {
        return (
          <tr key={`mode-${index}`} className="payment-mode-row">
            <td colSpan="7" className="fst-italic bg-light">
              {item.paymentMode} - {item.operatorName}
            </td>
          </tr>
        )
      }

      if (item.type === "entry") {
        return (
          <tr key={`entry-${index}`}>
            <td className="text-center">{item.admissionNumber}</td>
            <td className="text-center">{item.billNumber}</td>
            <td>{item.studentName}</td>
            <td className="text-center">{item.standard}</td>
            <td className="text-center">{item.section}</td>
            <td className="text-end fw-medium">Rs {item.amount.toFixed(2)}</td>
            <td className="text-center">{item.chequeNumber}</td>
          </tr>
        )
      }

      if (item.type === "dayTotal") {
        return (
          <tr key={`daytotal-${index}`} className="day-total-row">
            <td colSpan="5" className="text-end fw-bold">
              Day Total:
            </td>
            <td className="text-end fw-bold text-primary">Rs {item.amount.toFixed(2)}</td>
            <td></td>
          </tr>
        )
      }

      return null
    })
  }

  const formatSchoolAddress = () => {
    const parts = [
      schoolInfo.address,
      schoolInfo.city,
      schoolInfo.state,
      schoolInfo.pincode
    ].filter(Boolean)
    
    return parts.join(', ')
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <div className="mb-4 no-print">
          <nav className="d-flex custom-breadcrumb py-1 py-lg-3 align-items-center">
            <Button 
              variant="outline-secondary" 
              size="sm" 
              className="me-3 d-flex align-items-center"
              onClick={handleBack}
            >
              <FaArrowLeft className="me-1" /> Back
            </Button>
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <div>Collection Report</div>
            <span className="separator mx-2">&gt;</span>
            <span>Bill Wise Details</span>
          </nav>
        </div>

        <Card className="shadow-sm no-print">
          <Card.Header className="bg-primary text-white py-3">
            <h2 className="mb-0">Bill Wise Details</h2>
          </Card.Header>
          <Card.Body className="p-4">
            <Form className="mb-4">
              <Row className="align-items-end">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Fee Type</Form.Label>
                    <div>
                      <ButtonGroup className="w-100">
                        <ToggleButton
                          id="billing-entry"
                          type="radio"
                          variant={feeType === "BILLING_ENTRY" ? "primary" : "outline-primary"}
                          name="feeType"
                          value="BILLING_ENTRY"
                          checked={feeType === "BILLING_ENTRY"}
                          onChange={(e) => setFeeType(e.currentTarget.value)}
                          className="d-flex align-items-center justify-content-center"
                        >
                          <FaMoneyBillWave className="me-2" />
                          Billing Entry
                        </ToggleButton>
                        <ToggleButton
                          id="other-fee"
                          type="radio"
                          variant={feeType === "OTHER_FEE" ? "primary" : "outline-primary"}
                          name="feeType"
                          value="OTHER_FEE"
                          checked={feeType === "OTHER_FEE"}
                          onChange={(e) => setFeeType(e.currentTarget.value)}
                          className="d-flex align-items-center justify-content-center"
                        >
                          <FaReceipt className="me-2" />
                          Other Fee
                        </ToggleButton>
                      </ButtonGroup>
                    </div>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Start Date</Form.Label>
                    <DatePicker
                      selected={startDate}
                      onChange={handleStartDateChange}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      dateFormat="dd/MM/yyyy"
                      className="form-control"
                      maxDate={new Date()}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>End Date</Form.Label>
                    <DatePicker
                      selected={endDate}
                      onChange={handleEndDateChange}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate}
                      dateFormat="dd/MM/yyyy"
                      className="form-control"
                      maxDate={new Date()}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Button
                    className="custom-btn-clr w-100"
                    onClick={fetchBillWiseDetails}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <FaSearch className="me-2" /> Fetch Report
                      </>
                    )}
                  </Button>
                </Col>
                
                {/* Increased gap between Fetch Report and action buttons */}
                <Col md={1}></Col>
                
                <Col md={2}>
                  <div className="d-flex justify-content-end gap-2">
                    <Button 
                      className="btn custom-btn-clr"
                      onClick={handlePrint} 
                      disabled={processing || collectionData.length === 0}
                    >
                      <FaPrint className="me-2" /> Print
                    </Button>
                    <Button 
                      className="btn custom-btn-clr"
                      onClick={downloadPDF} 
                      disabled={processing || collectionData.length === 0}
                    >
                      {processing ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FaFilePdf className="me-2" />
                          PDF
                        </>
                      )}
                    </Button>
                  </div>
                </Col>
              </Row>
              
              {/* Reset button on separate row with proper spacing */}
              <Row className="mt-3">
                <Col md={9}>
                  <small className="text-muted">
                    School ID: {schoolId} | Academic Year: {currentAcademicYear || "Not set"} | 
                    Fee Type: {feeType === 'BILLING_ENTRY' ? 'Billing Entry' : 'Other Fee'}
                  </small>
                </Col>
                <Col md={3}>
                  <div className="d-flex justify-content-end">
                    <Button className="btn btn-secondary" onClick={handleReset}>
                      <FaUndo className="me-2" /> Reset
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>

            {collectionData.length > 0 && (
              <div id="report-content">
                <div ref={componentRef} className="report-preview print-container">
                  <div className="report-header">
                    <h3 className="school-name">{schoolInfo.name}</h3>
                    <p className="school-address">
                      {formatSchoolAddress()}
                    </p>
                    <h4 className="report-title">BILL WISE DETAILS REPORT</h4>
                    <div className="report-details">
                      <span>Report Period: {startDate.toLocaleDateString('en-IN')} - {endDate.toLocaleDateString('en-IN')}</span>
                      <span>Fee Type: {feeType === 'BILLING_ENTRY' ? 'Billing Entry' : 'Other Fee'}</span>
                      <span>Page 1 of 1</span>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <Table bordered hover className="report-table">
                      <thead>
                        <tr>
                          <th className="text-nowrap">
                            Bill Date<br />Adm No
                          </th>
                          <th className="text-nowrap">Bill No</th>
                          <th className="text-nowrap">Student Name</th>
                          <th className="text-nowrap">Grade</th>
                          <th className="text-nowrap">Sec</th>
                          <th className="text-end text-nowrap">Amount</th>
                          <th className="text-nowrap">DD/Cheque No</th>
                        </tr>
                      </thead>
                      <tbody>{renderTableBody()}</tbody>
                      <tfoot>
                        <tr className="grand-total-row">
                          <td colSpan="5" className="text-end fw-bold">
                            Grand Total:
                          </td>
                          <td className="text-end fw-bold fs-6 text-primary">
                            Rs {totalCollection.toFixed(2)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </Table>
                  </div>
                  
                  <div className="report-footer">
                    <div className="row">
                      <div className="col-md-6">
                        <small className="text-muted">
                          Generated on: {new Date().toLocaleDateString('en-IN')} at {new Date().toLocaleTimeString('en-IN')}
                        </small>
                      </div>
                      <div className="col-md-6 text-end">
                        <small className="text-muted">
                          School ERP System
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>

      <ToastContainer position="top-right" autoClose={3000} />

      <style>{`
        @media print {
          body * {
            visibility: hidden;
            margin: 0 !important;
            padding: 0 !important;
          }
          #report-content,
          #report-content * {
            visibility: visible;
          }
          #report-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 10mm !important;
            background: white;
            font-size: 11px;
          }
          .print-container {
            width: 190mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            max-width: 190mm !important;
          }
          .report-header {
            text-align: center;
            margin-bottom: 8mm !important;
            border-bottom: 1px solid #0B3D7B;
            padding-bottom: 4mm !important;
          }
          .school-name {
            font-size: 16px !important;
            font-weight: bold;
            color: #0B3D7B !important;
            margin-bottom: 2mm !important;
          }
          .school-address {
            font-size: 10px !important;
            color: #666 !important;
            margin-bottom: 3mm !important;
          }
          .report-title {
            font-size: 14px !important;
            font-weight: bold;
            text-decoration: underline;
            margin: 4mm 0 !important;
          }
          .report-details {
            display: flex !important;
            justify-content: space-between;
            margin-bottom: 6mm !important;
            font-size: 9px !important;
          }
          .report-table {
            width: 100% !important;
            font-size: 8px !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
          }
          .report-table th,
          .report-table td {
            padding: 2px !important;
            border: 1px solid #000 !important;
            word-wrap: break-word !important;
            vertical-align: top !important;
            line-height: 1.2 !important;
          }
          .report-table th {
            background-color: #0B3D7B !important;
            color: white !important;
            font-weight: bold !important;
            text-align: center !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .report-table td {
            text-align: left !important;
          }
          .amount-column {
            text-align: right !important;
          }
          .no-print {
            display: none !important;
          }
          .btn, .breadcrumb, .card-header, .form-group {
            display: none !important;
          }
          .date-row td {
            background-color: #f0f0f0 !important;
            font-weight: bold !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .payment-mode-row td {
            background-color: #f8f9fa !important;
            font-style: italic !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .day-total-row td {
            background-color: #e9ecef !important;
            font-weight: bold !important;
            border-top: 2px solid #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .grand-total-row td {
            background-color: #d1ecf1 !important;
            font-weight: bold !important;
            border-top: 3px double #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .report-footer {
            margin-top: 8mm !important;
            padding-top: 4mm !important;
            border-top: 1px solid #ccc !important;
            font-size: 8px !important;
            color: #666 !important;
          }
          @page {
            margin: 10mm;
            size: A4 portrait;
          }
        }

        @media screen {
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
          }
          .custom-btn-clr:hover {
            background-color: #092c5a;
            border-color: #092c5a;
          }
          
          .report-preview {
            border: 1px solid #dee2e6;
            padding: 20px;
            margin-bottom: 20px;
            background-color: white;
            box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
          }

          .report-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #0B3D7B;
            padding-bottom: 15px;
          }

          .school-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #0B3D7B;
          }

          .school-address {
            font-size: 16px;
            margin-bottom: 16px;
            line-height: 1.4;
            color: #666;
          }

          .report-title {
            font-size: 20px;
            font-weight: bold;
            margin: 16px 0;
            text-decoration: underline;
            color: #0B3D7B;
          }

          .report-details {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
            font-size: 14px;
          }

          .report-table {
            font-size: 14px;
            width: 100%;
            border-collapse: collapse;
          }

          .report-table th, .report-table td {
            border: 1px solid #dee2e6;
            padding: 8px;
            text-align: left;
          }

          .report-table th {
            background-color: #0B3D7B;
            color: white;
            vertical-align: middle;
            text-align: center;
          }
          
          .report-table td {
            vertical-align: middle;
          }
          
          .date-row td {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          
          .payment-mode-row td {
            background-color: #f8f9fa;
            font-style: italic;
          }
          
          .day-total-row td {
            border-top: 2px solid #dee2e6;
            background-color: #f8f9fa;
            font-weight: bold;
          }
          
          .grand-total-row td {
            border-top: 3px double #0B3D7B;
            background-color: #e9ecef;
            font-weight: bold;
          }

          .report-footer {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #dee2e6;
          }
          
          /* Increased gap for action buttons */
          .gap-2 {
            gap: 0.8rem !important;
          }
        }

        @media (max-width: 768px) {
          .btn {
            width: 100%;
            margin-bottom: 10px;
          }
          .report-details {
            flex-direction: column;
            gap: 5px;
          }
          .btn-group .btn {
            width: auto;
          }
          .gap-2 {
            gap: 0.5rem !important;
          }
        }
      `}</style>
    </MainContentPage>
  )
}

export default BillWiseDetails