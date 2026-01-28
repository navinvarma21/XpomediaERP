"use client"

import { useState, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import MainContentPage from "../../../components/MainContent/MainContentPage"
import { Form, Button, Container, Spinner, Table, Card, Row, Col } from "react-bootstrap"
import { useAuthContext } from "../../../Context/AuthContext"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { FaPrint, FaFilePdf, FaUndo, FaSearch, FaArrowLeft } from "react-icons/fa"
import { ENDPOINTS } from "../../../SpringBoot/config"

const PeriodicalCollectionReport = () => {
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

  const processCollectionData = (rawData) => {
    const groupedData = rawData.reduce((acc, item) => {
      const date = new Date(item.timestamp).toLocaleDateString('en-IN')
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(item)
      return acc
    }, {})

    const processedData = []
    let grandTotal = 0

    Object.entries(groupedData).forEach(([date, items]) => {
      processedData.push({ type: "date", date })

      const admissionGroups = items.reduce((acc, item) => {
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

        admissionItems.forEach((item, index) => {
          // Use paidAmount from feeDetails instead of totalPaidAmount
          const paidAmount = Number(item.paidAmount) || 0
          const concessionAmount = Number(item.concession) || 0

          processedData.push({
            ...item,
            date: date,
            isFirstInGroup: index === 0,
            isLastInGroup: index === admissionItems.length - 1,
            rowSpan: admissionItems.length,
            paidAmount: paidAmount,
            concessionAmount: concessionAmount,
          })

          studentTotal += paidAmount
          concessionTotal += concessionAmount
        })

        // Add concession row if there's any concession
        if (concessionTotal > 0) {
          processedData.push({
            type: "concession",
            admissionNumber,
            amount: -concessionTotal,
            description: "Concession",
          })
        }

        // Calculate net total without subtracting concession (assuming paidAmount is already net)
        const netTotal = studentTotal

        processedData.push({
          type: "subtotal",
          admissionNumber,
          amount: netTotal,
        })

        grandTotal += netTotal
      })
    })

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
      const formattedStartDate = startDate.toISOString().split('T')[0]
      const formattedEndDate = endDate.toISOString().split('T')[0]
      
      const response = await fetch(
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

      const data = await response.json()
      
      // Update school info if available in response
      if (data.schoolInfo) {
        setSchoolInfo(prev => ({
          ...prev,
          ...data.schoolInfo
        }))
      }

      // 1. First Pass: Map raw data to a standardized structure
      const initialCollections = data.collections.map(item => {
        // Calculate total paid amount from feeDetails
        const totalPaidFromDetails = item.feeDetails?.reduce((sum, fee) => sum + (Number(fee.paidAmount) || 0), 0) || 0
        
        return {
          billNumber: item.billNumber,
          admissionNumber: item.admissionNumber,
          studentName: item.studentName,
          standard: item.standard,
          section: item.section,
          description: item.description || (item.feeDetails?.map(fee => fee.feeHead).join(", ") || ""),
          amount: totalPaidFromDetails, // Use calculated amount from feeDetails
          paidAmount: totalPaidFromDetails, // Store for individual row display
          concession: Number.parseFloat(item.totalConcessionAmount) || 0,
          timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
          feeDetails: item.feeDetails || []
        }
      })

      // 2. Second Pass: Group by Bill Number to merge split rows
      const mergedCollections = initialCollections.reduce((acc, current) => {
        const existingBill = acc.find(item => item.billNumber === current.billNumber);

        if (existingBill) {
          // Merge Amounts
          existingBill.amount += current.amount;
          existingBill.paidAmount += current.paidAmount;
          existingBill.concession += current.concession;

          // Merge Descriptions (avoiding duplicates)
          const currentDescs = current.description.split(',').map(s => s.trim());
          const existingDescs = existingBill.description.split(',').map(s => s.trim());
          
          currentDescs.forEach(desc => {
            if (desc && !existingDescs.includes(desc)) {
              existingBill.description += `, ${desc}`;
            }
          });

          // Merge Fee Details array if needed
          if (current.feeDetails && current.feeDetails.length > 0) {
             existingBill.feeDetails = [...existingBill.feeDetails, ...current.feeDetails];
          }

        } else {
          // New bill encountered
          acc.push(current);
        }
        return acc;
      }, []);

      // 3. Process the merged data for the UI
      const { processedData, grandTotal } = processCollectionData(mergedCollections)
      setCollectionData(processedData)
      setTotalCollection(data.totalCollection || grandTotal)

      if (processedData.length === 0) {
        toast.info("No fee collection data found for the selected date range")
      } else {
        toast.success(`Successfully loaded collection records`)
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
    navigate(-1) // Go back to previous page
  }

  const handlePrint = () => {
    // Store the original body content and styles
    const originalBody = document.body.innerHTML;
    const originalTitle = document.title;
    
    // Create a print-specific window
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast.error("Please allow pop-ups for printing");
      return;
    }

    // Get the report content
    const printContent = document.getElementById('report-content').innerHTML;
    
    // Create print-specific HTML with proper styles
    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Periodical Collection Report</title>
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
            .subtotal-row td {
              background-color: #f8f9fa !important;
              font-weight: bold;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .concession-row td {
              background-color: #fff5f5 !important;
              color: #dc3545;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .total-row td {
              background-color: #e9ecef !important;
              font-weight: bold;
              border-top: 2px solid #000 !important;
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
            body, .print-container {
              transform: none !important;
              transform-origin: none !important;
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            // Auto-print and close after printing
            window.onload = function() {
              setTimeout(function() {
                window.print();
                // Don't close immediately - wait for print dialog to complete
                setTimeout(function() {
                  window.close();
                }, 500);
              }, 250);
            };
            
            // Also allow manual closing
            window.onafterprint = function() {
              setTimeout(function() {
                window.close();
              }, 100);
            };
          </script>
        </body>
      </html>
    `;

    // Write the content to the new window
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();

    // Focus on the print window
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
        
        // A4 dimensions: 210mm x 297mm
        const pageWidth = 210
        const pageHeight = 297
        const margin = 10
        const contentWidth = pageWidth - (2 * margin)
        
        // Set professional colors
        const primaryColor = [11, 61, 123]
        const secondaryColor = [241, 241, 241]
        
        // Add header with school info - Improved formatting
        doc.setFillColor(...primaryColor)
        doc.rect(0, 0, pageWidth, 18, 'F')
        
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text(schoolInfo.name, pageWidth / 2, 8, { align: "center" })
        
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        
        // Build single line address with proper formatting
        const addressParts = [
          schoolInfo.address,
          schoolInfo.city,
          schoolInfo.state,
          schoolInfo.pincode
        ].filter(Boolean)
        
        const fullAddress = addressParts.join(', ')
        
        // Add address in single line with responsive width
        doc.text(fullAddress, pageWidth / 2, 13, { 
          align: "center", 
          maxWidth: contentWidth - 20 
        })
        
        // Add report title
        doc.setFillColor(...secondaryColor)
        doc.rect(0, 18, pageWidth, 8, 'F')
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        doc.text("PERIODICAL FEES COLLECTION REPORT", pageWidth / 2, 23, { align: "center" })
        
        // Add report details
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.text(`Report Period: ${startDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')}`, margin, 35)
        doc.text(`Academic Year: ${currentAcademicYear || "N/A"}`, margin, 39)
        doc.text(`Generated On: ${new Date().toLocaleDateString('en-IN')}`, margin, 43)
        doc.text(`Page 1 of 1`, pageWidth - margin - 15, 43)
        
        // Prepare table data for A4 portrait with full width
        const tableColumns = [
          "Date",
          "Bill No",
          "Adm No", 
          "Student Name",
          "Std",
          "Sec",
          "Description",
          "Amount"
        ]

        const tableRows = []
        let currentDate = null

        // Process data for PDF
        collectionData.forEach((item) => {
          if (item.type === "date") {
            tableRows.push([
              { content: item.date, colSpan: 8, styles: { fillColor: [240, 240, 240], fontStyle: 'bold', halign: 'center' } }
            ])
            currentDate = item.date
          } else if (item.type === "subtotal") {
            tableRows.push([
              "",
              "",
              "",
              "",
              "",
              "",
              "Subtotal",
              `Rs ${item.amount.toFixed(2)}`
            ])
          } else if (item.type === "concession") {
            tableRows.push([
              "",
              "",
              "",
              "",
              "",
              "",
              "Concession",
              `-Rs ${Math.abs(item.amount).toFixed(2)}`
            ])
          } else {
            tableRows.push([
              currentDate,
              item.billNumber || "",
              item.admissionNumber || "",
              item.studentName || "",
              item.standard || "",
              item.section || "",
              item.description || "",
              `Rs ${(item.paidAmount || 0).toFixed(2)}`
            ])
          }
        })

        // Add total row
        tableRows.push([
          "",
          "",
          "",
          "",
          "",
          "",
          "Total Collection",
          `Rs ${totalCollection.toFixed(2)}`
        ])

        // Calculate optimal column widths for full A4 width
        const totalAvailableWidth = contentWidth
        const columnWidths = {
          0: 15, // Date
          1: 15, // Bill No
          2: 15, // Adm No
          3: 30, // Student Name
          4: 10, // Std
          5: 10, // Sec
          6: totalAvailableWidth - (15 + 15 + 15 + 30 + 10 + 10 + 25), // Description (flexible)
          7: 25  // Amount
        }

        // Adjust description column if needed to fit full width
        const currentTotalWidth = Object.values(columnWidths).reduce((a, b) => a + b, 0)
        if (currentTotalWidth < totalAvailableWidth) {
          columnWidths[6] += totalAvailableWidth - currentTotalWidth
        }

        // Generate table using autoTable with full width
        autoTable(doc, {
          head: [tableColumns],
          body: tableRows,
          startY: 48,
          theme: 'grid',
          styles: {
            fontSize: 7,
            cellPadding: 2,
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
            fontSize: 8,
            valign: 'middle'
          },
          columnStyles: {
            0: { cellWidth: columnWidths[0], halign: 'center' }, // Date
            1: { cellWidth: columnWidths[1], halign: 'center' }, // Bill No
            2: { cellWidth: columnWidths[2], halign: 'center' }, // Adm No
            3: { cellWidth: columnWidths[3], halign: 'left' },   // Student Name
            4: { cellWidth: columnWidths[4], halign: 'center' }, // Std
            5: { cellWidth: columnWidths[5], halign: 'center' }, // Sec
            6: { cellWidth: columnWidths[6], halign: 'left' },   // Description
            7: { cellWidth: columnWidths[7], halign: 'right' },  // Amount
          },
          didParseCell: function(data) {
            // Apply styling based on row content
            if (data.row.index > 0 && data.row.index < tableRows.length) {
              const rowData = tableRows[data.row.index]
              
              // Handle date header rows
              if (rowData[0] && typeof rowData[0] === 'object' && rowData[0].colSpan) {
                if (data.column.index === 0) {
                  data.cell.colSpan = 8
                  data.cell.styles = rowData[0].styles
                } else if (data.column.index > 0 && data.column.index <= 7) {
                  data.cell = null // Hide other cells in the spanned row
                }
              }
              
              // Style regular rows
              else {
                const description = rowData[6]
                
                if (description === "Subtotal") {
                  data.cell.styles.fontStyle = 'bold'
                  data.cell.styles.fillColor = [248, 249, 250]
                } else if (description === "Concession") {
                  data.cell.styles.textColor = [220, 53, 69]
                  data.cell.styles.fillColor = [255, 245, 245]
                } else if (description === "Total Collection") {
                  data.cell.styles.fontStyle = 'bold'
                  data.cell.styles.fillColor = [233, 236, 239]
                  data.cell.styles.fontSize = 8
                }
              }
            }
          },
          margin: { top: 48, right: margin, left: margin, bottom: 20 },
          tableWidth: 'auto'
        })
        
        // Add footer
        const finalY = doc.lastAutoTable.finalY + 10
        doc.setFontSize(7)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(100, 100, 100)
        doc.text(`Generated by School ERP System`, pageWidth / 2, finalY, { align: "center" })

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
    
    // Use setTimeout to prevent UI freezing and allow state update
    setTimeout(async () => {
      try {
        const doc = await generatePDF()
        const fileName = `Periodical_Collection_Report_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.pdf`
        
        // Use blob creation to ensure proper download
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
          <td colSpan="8" className="text-center py-4">
            No fee collection data available for the selected date range.
          </td>
        </tr>
      )
    }

    return collectionData.map((item, index) => {
      if (item.type === "date") {
        return (
          <tr key={`date-${index}`} className="date-row">
            <td colSpan="8" className="fw-bold bg-light">
              {item.date}
            </td>
          </tr>
        )
      }

      if (item.type === "subtotal") {
        return (
          <tr key={`subtotal-${item.admissionNumber}-${index}`} className="subtotal-row">
            <td colSpan="7" className="text-end fw-bold">
              Subtotal
            </td>
            <td className="text-end fw-bold text-primary">Rs {item.amount.toFixed(2)}</td>
          </tr>
        )
      }

      if (item.type === "concession") {
        return (
          <tr key={`concession-${item.admissionNumber}-${index}`} className="concession-row">
            <td colSpan="7" className="text-end text-danger">
              Concession
            </td>
            <td className="text-end text-danger">-Rs {Math.abs(item.amount).toFixed(2)}</td>
          </tr>
        )
      }

      return (
        <tr key={`${item.admissionNumber}-${item.billNumber}-${index}`}>
          <td className="text-nowrap">{item.date}</td>
          <td className="fw-medium text-nowrap">{item.billNumber}</td>
          {item.isFirstInGroup ? (
            <>
              <td rowSpan={item.rowSpan} className="align-middle text-center fw-medium text-nowrap">
                {item.admissionNumber}
              </td>
              <td rowSpan={item.rowSpan} className="align-middle fw-medium text-nowrap">
                {item.studentName}
              </td>
              <td rowSpan={item.rowSpan} className="align-middle text-center text-nowrap">
                {item.standard}
              </td>
              <td rowSpan={item.rowSpan} className="align-middle text-center text-nowrap">
                {item.section}
              </td>
            </>
          ) : null}
          <td className="text-break">{item.description}</td>
          <td className="text-end fw-medium text-nowrap">Rs {item.paidAmount.toFixed(2)}</td>
        </tr>
      )
    })
  }

  // Format school address for display
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
            <div>Fee Collection Report</div>
            <span className="separator mx-2">&gt;</span>
            <span>Periodical Collection Report</span>
          </nav>
        </div>

        <Card className="shadow-sm no-print">
          <Card.Header className="bg-primary text-white py-3">
            <h2 className="mb-0">Periodical Fee Collection Report</h2>
          </Card.Header>
          <Card.Body className="p-4">
            <Form className="mb-4">
              <Row className="align-items-end">
                <Col md={3}>
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
                <Col md={3}>
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
                    onClick={fetchPeriodicalCollection}
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
                <Col md={4}>
                  <div className="d-flex justify-content-end">
                    <Button 
                      className="btn custom-btn-clr me-2" 
                      onClick={handlePrint} 
                      disabled={processing || collectionData.length === 0}
                    >
                      <FaPrint className="me-2" /> Print
                    </Button>
                    <Button 
                      className="btn custom-btn-clr me-2" 
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
                          Download PDF
                        </>
                      )}
                    </Button>
                    <Button className="btn btn-secondary" onClick={handleReset}>
                      <FaUndo className="me-2" /> Reset
                    </Button>
                  </div>
                </Col>
              </Row>
              <Row className="mt-2">
                <Col>
                  <small className="text-muted">
                    School ID: {schoolId} | Academic Year: {currentAcademicYear || "Not set"}
                  </small>
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
                    <h4 className="report-title">PERIODICAL FEES COLLECTION REPORT</h4>
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
                          <th className="text-nowrap">Date</th>
                          <th className="text-nowrap">Bill No</th>
                          <th className="text-nowrap">Adm No</th>
                          <th className="text-nowrap">Name of the Student</th>
                          <th className="text-nowrap">Std</th>
                          <th className="text-nowrap">Sec</th>
                          <th className="text-nowrap">Description</th>
                          <th className="text-end text-nowrap">Amount</th>
                        </tr>
                      </thead>
                      <tbody>{renderTableBody()}</tbody>
                      <tfoot>
                        <tr className="total-row">
                          <td colSpan="7" className="text-end fw-bold">
                            Total Collection
                          </td>
                          <td className="text-end fw-bold fs-6 text-primary">
                            Rs {totalCollection.toFixed(2)}
                          </td>
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
          .subtotal-row td {
            background-color: #f8f9fa !important;
            font-weight: bold !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .total-row td {
            background-color: #e9ecef !important;
            font-weight: bold !important;
            border-top: 2px solid #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .concession-row td {
            background-color: #fff5f5 !important;
            color: #dc3545 !important;
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
          
          .concession-row td {
            background-color: #f8f9fa;
          }
          
          .subtotal-row td {
            border-top: 2px solid #dee2e6;
            background-color: #f8f9fa;
            font-weight: bold;
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

export default PeriodicalCollectionReport