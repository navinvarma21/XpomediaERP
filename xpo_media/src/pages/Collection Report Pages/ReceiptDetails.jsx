import React, { useState, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Form, Button, Container, Spinner, Table, Card, Row, Col, InputGroup } from "react-bootstrap"
import { useAuthContext } from "../../Context/AuthContext"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { 
  FaPrint, 
  FaFilePdf, 
  FaFileExcel, 
  FaSearch, 
  FaArrowLeft, 
  FaFilter,
  FaRedo
} from "react-icons/fa"
import { ENDPOINTS } from "../../SpringBoot/config"

const ReceiptDetails = () => {
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
  const [selectedHead, setSelectedHead] = useState("")
  const [feeHeads, setFeeHeads] = useState([])
  const [reportData, setReportData] = useState([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const componentRef = useRef(null)
  const navigate = useNavigate()
   
  const { schoolId, currentAcademicYear, getAuthHeaders } = useAuthContext()

  useEffect(() => {
    if (schoolId && currentAcademicYear) {
      fetchSchoolInfo()
      fetchFeeHeads()
    }
  }, [schoolId, currentAcademicYear])

  const fetchSchoolInfo = async () => {
    try {
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
          name: data.schoolName || "School Name",
          address: data.schoolAddress || "School Address",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || ""
        })
      } else {
        setSchoolInfo({
          name: "School Name",
          address: "School Address",
          city: "",
          state: "",
          pincode: ""
        })
      }
    } catch (error) {
      console.error("Error fetching school information:", error)
      setSchoolInfo({
        name: "School Name",
        address: "School Address",
        city: "",
        state: "",
        pincode: ""
      })
    }
  }

  const fetchFeeHeads = async () => {
    try {
      const response = await fetch(`${ENDPOINTS.administration}/receiptsetup/heads`, {
        headers: { 
          ...getAuthHeaders(), 
          "X-School-Id": schoolId, 
          "X-Academic-Year": currentAcademicYear 
        },
      })
      if (response.ok) {
        const data = await response.json()
        setFeeHeads(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error fetching fee heads", error)
      setFeeHeads([])
    }
  }

  const fetchReport = async () => {
    if (!schoolId || !currentAcademicYear) {
      toast.error("School ID or Academic Year not available")
      return
    }

    setLoading(true)
    try {
      const sDate = startDate.toISOString().split('T')[0]
      const eDate = endDate.toISOString().split('T')[0]
       
      let url = `${ENDPOINTS.report}/receipt-payment/receipt-details?schoolId=${schoolId}&academicYear=${currentAcademicYear}&startDate=${sDate}&endDate=${eDate}`
      if (selectedHead && selectedHead !== "All") {
        url += `&feeHead=${encodeURIComponent(selectedHead)}`
      }

      const response = await fetch(url, { 
        headers: getAuthHeaders() 
      })
       
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
       
      const result = await response.json()

      if (result.success) {
        // Format dates properly to avoid "####" issue
        const formattedData = (result.data || []).map(item => ({
          ...item,
          date: formatDateForDisplay(item.date),
          amount: Number(item.amount) || 0
        }))
        
        setReportData(formattedData)
        const total = formattedData.reduce((sum, item) => sum + item.amount, 0)
        setTotalAmount(total)
        
        if (formattedData.length === 0) {
          toast.info("No receipt records found for the selected period")
        } else {
          toast.success(`Found ${formattedData.length} receipt records`)
        }
      } else {
        throw new Error(result.error || "Failed to fetch report")
      }
    } catch (error) {
      console.error("Error fetching report:", error)
      toast.error(error.message || "Failed to fetch report data")
      setReportData([])
      setTotalAmount(0)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to format date properly
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      // If date is in "####" format or invalid, return original
      if (dateString.includes('####') || dateString.includes('NaN')) {
        return 'Invalid Date';
      }
      
      // Try parsing the date
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        // If date is already in DD/MM/YYYY format, return as is
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
          return dateString;
        }
        return 'Invalid Date';
      }
      
      // Format to DD/MM/YYYY
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return dateString || 'N/A';
    }
  }

  // Helper function for PDF date formatting
  const formatDateForPDF = (dateString) => {
    const formatted = formatDateForDisplay(dateString);
    return formatted === 'Invalid Date' ? 'N/A' : formatted;
  }

  const handlePrint = () => {
    const printContent = document.getElementById('report-content')
    if (!printContent) {
      toast.error("No report content to print")
      return
    }

    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) {
      toast.error("Please allow pop-ups for printing")
      return
    }

    const styles = `
      @page {
        size: A4;
        margin: 10mm;
      }
      body { 
        margin: 0; 
        padding: 0; 
        font-family: "Times New Roman", serif; 
        font-size: 11px; 
        background: white;
        width: 100%;
      }
      .print-container { 
        width: 100% !important; 
        margin: 0 auto; 
        padding: 0; 
      }
      .report-header { 
        text-align: center; 
        margin-bottom: 20px; 
        border-bottom: 1px solid #0B3D7B; 
        padding-bottom: 10px; 
      }
      .school-name { 
        font-size: 18px; 
        font-weight: bold; 
        color: #0B3D7B; 
        margin: 0 0 5px 0; 
      }
      .school-address { 
        font-size: 10px; 
        color: #666; 
        margin: 0 0 10px 0; 
      }
      .report-title { 
        font-size: 14px; 
        font-weight: bold; 
        text-decoration: underline; 
        margin: 10px 0; 
      }
      .report-details { 
        display: flex; 
        justify-content: space-between; 
        margin-bottom: 15px; 
        font-size: 10px; 
      }
      .report-table { 
        width: 100%; 
        border-collapse: collapse; 
        font-size: 9px; 
        table-layout: fixed; 
      }
      .report-table th, .report-table td { 
        border: 1px solid #000; 
        padding: 4px; 
        text-align: left; 
        vertical-align: top; 
        word-wrap: break-word; 
      }
      .report-table th { 
        background-color: #0B3D7B !important; 
        color: white !important; 
        font-weight: bold; 
        text-align: center; 
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact; 
      }
      .text-end { text-align: right !important; }
      .text-center { text-align: center !important; }
      .no-print { display: none !important; }
      .total-row td { 
        background-color: #e9ecef !important; 
        font-weight: bold; 
        border-top: 2px solid #000; 
        -webkit-print-color-adjust: exact; 
      }
      .report-footer { 
        margin-top: 20px; 
        padding-top: 10px; 
        border-top: 1px solid #ccc; 
        font-size: 9px; 
        color: #666; 
        display: flex;
        justify-content: space-between;
      }
    `
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt Details Report</title>
          <style>${styles}</style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
                window.close();
              }, 250);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const generatePDF = () => {
    return new Promise((resolve, reject) => {
      try {
        // Set to portrait mode for A4
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        })
        
        const pageWidth = 210 // A4 portrait width in mm
        const pageHeight = 297 // A4 portrait height in mm
        const margin = 10
        const contentWidth = pageWidth - (2 * margin)
        
        const primaryColor = [11, 61, 123]
        const secondaryColor = [241, 241, 241]
        
        // School Header
        doc.setFillColor(...primaryColor)
        doc.rect(0, 0, pageWidth, 15, 'F')
        
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        doc.text(schoolInfo.name, pageWidth / 2, 7, { align: "center" })
        
        doc.setFontSize(7)
        doc.setFont("helvetica", "normal")
        
        const addressParts = [
          schoolInfo.address,
          schoolInfo.city,
          schoolInfo.state,
          schoolInfo.pincode
        ].filter(Boolean)
        
        const fullAddress = addressParts.join(', ')
        
        doc.text(fullAddress, pageWidth / 2, 11, { 
          align: "center", 
          maxWidth: contentWidth - 10 
        })
        
        // Report Title Section
        doc.setFillColor(...secondaryColor)
        doc.rect(0, 15, pageWidth, 8, 'F')
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.text("RECEIPT DETAILS REPORT", pageWidth / 2, 20, { align: "center" })
        
        // Report Details
        doc.setFontSize(7)
        doc.setFont("helvetica", "normal")
        const startY = 28
        
        doc.text(`Report Period: ${startDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')}`, margin, startY)
        doc.text(`Academic Year: ${currentAcademicYear || "N/A"}`, margin, startY + 4)
        doc.text(`Generated On: ${new Date().toLocaleDateString('en-IN')}`, margin, startY + 8)
        doc.text(`Page 1 of 1`, pageWidth - margin - 15, startY + 8)
        
        // Define columns with proper widths for A4 portrait
        // Removed Sub Head
        const tableColumns = [
          "Sl.No",
          "Date",
          "Receipt No", 
          "Person Name",
          "Category",
          "Mode",
          "Ref ID",
          "Amount"
        ]

        // Prepare table data with formatted dates
        const tableRows = reportData.map((item, index) => [
          (index + 1).toString(),
          formatDateForPDF(item.date),
          item.receiptNo || 'N/A',
          item.personName || 'N/A',
          item.feeHead || 'N/A',
          // Removed accountHead
          item.receiptMode || 'N/A',
          item.referenceId || '',
          `Rs ${Number(item.amount || 0).toFixed(2)}`
        ])

        // Add total row
        tableRows.push([
          "",
          "",
          "",
          "",
          "",
          "",
          "Total Collection",
          `Rs ${totalAmount.toFixed(2)}`
        ])

        // Calculate column widths for A4 portrait
        // Removed index 5 (Sub Head) and reindexed
        const columnWidths = {
          0: 10,  // Sl.No
          1: 15,  // Date
          2: 18,  // Receipt No
          3: 25,  // Person Name
          4: 18,  // Category
          5: 12,  // Mode (shifted from 6)
          6: 18,  // Ref ID (shifted from 7)
          7: 15   // Amount (shifted from 8)
        }

        const currentTotalWidth = Object.values(columnWidths).reduce((a, b) => a + b, 0)
        const adjustmentFactor = contentWidth / currentTotalWidth
        
        // Adjust column widths
        const adjustedWidths = {}
        for (let key in columnWidths) {
          adjustedWidths[key] = columnWidths[key] * adjustmentFactor
        }

        // Generate table
        autoTable(doc, {
          head: [tableColumns],
          body: tableRows,
          startY: startY + 12,
          theme: 'grid',
          styles: {
            fontSize: 6,
            cellPadding: 1.5,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            textColor: [0, 0, 0],
            valign: 'middle'
          },
          headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 7,
            valign: 'middle'
          },
          columnStyles: {
            0: { cellWidth: adjustedWidths[0], halign: 'center' },
            1: { cellWidth: adjustedWidths[1], halign: 'center' },
            2: { cellWidth: adjustedWidths[2], halign: 'center' },
            3: { cellWidth: adjustedWidths[3], halign: 'left' },
            4: { cellWidth: adjustedWidths[4], halign: 'left' },
            5: { cellWidth: adjustedWidths[5], halign: 'center' },
            6: { cellWidth: adjustedWidths[6], halign: 'center' },
            7: { cellWidth: adjustedWidths[7], halign: 'right', fontStyle: 'bold' },
          },
          didParseCell: function(data) {
            if (data.row.index === tableRows.length - 1) {
              data.cell.styles.fontStyle = 'bold'
              data.cell.styles.fillColor = [233, 236, 239]
              data.cell.styles.fontSize = 7
              // Center align the "Total Collection" text
              if (data.column.index === 6) { // Adjusted index due to removal
                data.cell.styles.halign = 'center'
              }
            }
          },
          margin: { top: startY + 12, right: margin, left: margin, bottom: 15 },
          tableWidth: 'wrap'
        })
        
        // Add footer
        const finalY = doc.lastAutoTable.finalY + 5
        doc.setFontSize(6)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(100, 100, 100)
        doc.text(`Generated by School ERP System`, pageWidth / 2, finalY, { align: "center" })
        doc.text(`Printed on: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, finalY + 4, { align: "center" })

        resolve(doc)
      } catch (error) {
        console.error("Error in generatePDF:", error)
        reject(error)
      }
    })
  }

  const downloadPDF = async () => {
    if (reportData.length === 0) {
      toast.error("No data available to generate PDF")
      return
    }

    setProcessing(true)
    
    setTimeout(async () => {
      try {
        const doc = await generatePDF()
        const fileName = `Receipt_Details_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.pdf`
        
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

  const exportToExcel = () => {
    if (reportData.length === 0) {
      toast.error("No data to export")
      return
    }
    
    // Removed Sub Head
    const headers = ["Date", "Receipt No", "Person Name", "Category", "Mode", "Ref ID", "Amount"]
    const csvRows = [
      headers.join(","),
      ...reportData.map(item => [
        `"\t${item.date || ''}"`, // Added \t to force text format in Excel to avoid ####
        `"${item.receiptNo || ''}"`,
        `"${item.personName || ''}"`,
        `"${item.feeHead || ''}"`,
        // Removed accountHead
        `"${item.receiptMode || ''}"`,
        `"${item.referenceId || ''}"`,
        Number(item.amount || 0).toFixed(2)
      ].join(",")),
      `"","","","","","Total","${totalAmount.toFixed(2)}"`
    ]
    
    const csvContent = csvRows.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `Receipt_Details_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("CSV exported successfully")
    }
  }

  const resetFilters = () => {
    setStartDate(new Date())
    setEndDate(new Date())
    setSelectedHead("")
    setSearchTerm("")
    setReportData([])
    setTotalAmount(0)
  }

  const filteredData = reportData.filter(item => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (item.receiptNo && item.receiptNo.toLowerCase().includes(term)) ||
      (item.personName && item.personName.toLowerCase().includes(term)) ||
      (item.feeHead && item.feeHead.toLowerCase().includes(term)) ||
      (item.referenceId && item.referenceId.toLowerCase().includes(term))
    )
  })

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
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft className="me-1" /> Back
            </Button>
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <div>Transaction Reports</div>
            <span className="separator mx-2">&gt;</span>
            <span>Receipt Details</span>
          </nav>
        </div>

        <Card className="shadow-sm no-print">
          <Card.Header className="bg-primary text-white py-3 d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0">Receipt Details Report</h2>
            </div>
            <Button variant="outline-light" size="sm" onClick={resetFilters}>
              <FaRedo className="me-1" /> Reset
            </Button>
          </Card.Header>
          <Card.Body className="p-4">
            <Form className="mb-4">
              <Row className="align-items-end">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Start Date</Form.Label>
                    <DatePicker
                      selected={startDate}
                      onChange={setStartDate}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      dateFormat="dd/MM/yyyy"
                      className="form-control"
                      maxDate={new Date()}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>End Date</Form.Label>
                    <DatePicker
                      selected={endDate}
                      onChange={setEndDate}
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
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Category</Form.Label>
                    <Form.Select value={selectedHead} onChange={(e) => setSelectedHead(e.target.value)}>
                      <option value="All">All Categories</option>
                      {feeHeads.map((head, index) => (
                        <option key={head.id || index} value={head.headName}>{head.headName}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Button className="custom-btn-clr w-100" onClick={fetchReport} disabled={loading}>
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
              </Row>
              
              {reportData.length > 0 && (
                <Row className="mt-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Search Records</Form.Label>
                      <InputGroup>
                        <InputGroup.Text><FaFilter /></InputGroup.Text>
                        <Form.Control 
                          type="text" 
                          placeholder="Search by receipt no, name, reference..." 
                          value={searchTerm} 
                          onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>
              )}
              
              <Row className="mt-2">
                <Col>
                  <small className="text-muted">
                    School ID: {schoolId} | Academic Year: {currentAcademicYear || "Not set"}
                  </small>
                </Col>
              </Row>
            </Form>

            {reportData.length > 0 && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3 no-print">
                  <div>
                    <span className="badge bg-primary me-2">
                      {filteredData.length} of {reportData.length} records
                    </span>
                    <span className="badge bg-success">
                      Total: Rs {totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="d-flex">
                    <Button 
                      className="btn custom-btn-clr me-2" 
                      onClick={handlePrint} 
                      disabled={processing}
                    >
                      <FaPrint className="me-2" /> Print
                    </Button>
                    <Button 
                      className="btn custom-btn-clr me-2" 
                      onClick={downloadPDF} 
                      disabled={processing}
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
                    <Button 
                      variant="success"
                      className="me-2"
                      onClick={exportToExcel}
                      disabled={processing}
                    >
                      <FaFileExcel className="me-2" /> Excel
                    </Button>
                  </div>
                </div>
                
                <div id="report-content">
                  <div ref={componentRef} className="report-preview print-container">
                    <div className="report-header">
                      <h3 className="school-name">{schoolInfo.name}</h3>
                      <p className="school-address">
                        {formatSchoolAddress()}
                      </p>
                      <h4 className="report-title">RECEIPT DETAILS REPORT</h4>
                      <div className="report-details">
                        <span>Report Period: {startDate.toLocaleDateString('en-IN')} - {endDate.toLocaleDateString('en-IN')}</span>
                        <span>Academic Year: {currentAcademicYear || "N/A"}</span>
                        <span>Page 1 of 1</span>
                      </div>
                    </div>

                    <div className="table-responsive">
                      <Table bordered hover className="report-table">
                        <thead>
                          <tr>
                            <th className="text-nowrap">Sl.No</th>
                            <th className="text-nowrap">Date</th>
                            <th className="text-nowrap">Receipt No</th>
                            <th className="text-nowrap">Person Name</th>
                            <th className="text-nowrap">Category</th>
                            {/* Removed Sub Head */}
                            <th className="text-nowrap">Mode</th>
                            <th className="text-nowrap">Ref ID</th>
                            <th className="text-end text-nowrap">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData.map((item, idx) => (
                            <tr key={idx}>
                              <td className="text-center">{idx + 1}</td>
                              <td>{item.date || 'N/A'}</td>
                              <td><span className="badge bg-info text-dark">{item.receiptNo || 'N/A'}</span></td>
                              <td>{item.personName || 'N/A'}</td>
                              <td><span className="badge bg-secondary">{item.feeHead || 'N/A'}</span></td>
                              {/* Removed accountHead */}
                              <td>{item.receiptMode || 'N/A'}</td>
                              <td>{item.referenceId || '-'}</td>
                              <td className="text-end fw-bold">Rs {Number(item.amount || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                          <tr className="total-row">
                            <td colSpan="7" className="text-end fw-bold"> {/* Adjusted colSpan to 7 */}
                              TOTAL COLLECTION
                            </td>
                            <td className="text-end fw-bold fs-6 text-primary">
                              Rs {filteredData.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
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
              </>
            )}
          </Card.Body>
        </Card>
      </Container>

      <ToastContainer position="top-right" autoClose={3000} />

      <style>{`
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
          
          .total-row td {
            border-top: 3px double #0B3D7B;
            background-color: #e9ecef;
            font-weight: bold;
          }

          .report-footer {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #dee2e6;
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
        }
      `}</style>
    </MainContentPage>
  )
}

export default ReceiptDetails