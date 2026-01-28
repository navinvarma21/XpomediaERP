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

const DayCollectionReport = () => {
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
  const componentRef = useRef(null)
  const navigate = useNavigate()
  
  const { 
    user, 
    admin, 
    schoolId, 
    currentAcademicYear, 
    getAuthHeaders
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
        // Fallback to auth context if school info not available
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
      const admissionNumber = item.admissionNumber
      if (!acc[admissionNumber]) {
        acc[admissionNumber] = []
      }
      acc[admissionNumber].push(item)
      return acc
    }, {})

    const processedData = []
    let grandTotal = 0

    Object.entries(groupedData).forEach(([admissionNumber, items]) => {
      let studentTotal = 0
      let concessionTotal = 0

      items.forEach((item, index) => {
        const paidAmount = Number(item.amount) || 0
        const concessionAmount = Number(item.concession) || 0

        processedData.push({
          ...item,
          isFirstInGroup: index === 0,
          isLastInGroup: index === items.length - 1,
          rowSpan: items.length,
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

      // Calculate net total after applying concession
      const netTotal = studentTotal

      processedData.push({
        type: "subtotal",
        admissionNumber,
        amount: netTotal,
      })

      grandTotal += netTotal
    })

    return { processedData, grandTotal }
  }

  const fetchDayCollection = async () => {
    if (!schoolId) {
      toast.error("School ID not found")
      return
    }

    setLoading(true)
    try {
      const startDate = new Date(reportDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(reportDate)
      endDate.setHours(23, 59, 59, 999)

      const requestBody = {
        schoolId: schoolId,
        academicYear: currentAcademicYear,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reportType: "DAY_COLLECTION"
      }

      const response = await fetch(`${ENDPOINTS.transaction}/otherreport/day-collection`, {
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
        const rawCollections = result.data.map(item => ({
          billNumber: item.billNumber,
          admissionNumber: item.admissionNumber,
          studentName: item.studentName,
          standard: item.standard,
          section: item.section,
          description: item.feeDetails?.map(fee => fee.feeHead).join(", ") || item.description || "",
          amount: Number.parseFloat(item.totalPaidAmount) || 0,
          concession: Number.parseFloat(item.totalConcessionAmount) || 0,
          timestamp: item.timestamp || item.createdDate
        }))

        const { processedData, grandTotal } = processCollectionData(rawCollections)
        setCollectionData(processedData)
        setTotalCollection(grandTotal)

        if (processedData.length === 0) {
          toast.info("No collection data found for the selected date")
        } else {
          toast.success(`Successfully loaded ${rawCollections.length} collection records`)
        }
      } else {
        toast.error(result.message || "Failed to fetch collection data")
      }
    } catch (error) {
      console.error("Error fetching collection data:", error)
      toast.error("Failed to fetch collection data")
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (date) => {
    setReportDate(date)
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handlePrint = () => {
    setProcessing(true)
    
    // Create a hidden iframe for printing
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const printDocument = printFrame.contentWindow?.document || printFrame.contentDocument;
    
    if (!printDocument) {
      toast.error("Print failed: Could not create print frame");
      setProcessing(false);
      return;
    }

    // Get the report content
    const reportContent = document.getElementById('report-content');
    if (!reportContent) {
      toast.error("No report content to print");
      setProcessing(false);
      return;
    }

    // Write the print content to the iframe
    printDocument.open();
    printDocument.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Day Collection Report</title>
          <style>
            @media print {
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
            }
            
            @media screen {
              body {
                padding: 20px;
                font-family: Arial, sans-serif;
              }
            }
          </style>
        </head>
        <body>
          ${reportContent.innerHTML}
        </body>
      </html>
    `);
    printDocument.close();

    // Wait for iframe to load and then print
    printFrame.onload = () => {
      try {
        // Trigger print
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        
        // Clean up after printing
        const cleanup = () => {
          document.body.removeChild(printFrame);
          setProcessing(false);
        };

        // Different browsers handle print events differently
        if (printFrame.contentWindow) {
          printFrame.contentWindow.onafterprint = cleanup;
          // Fallback: if onafterprint doesn't fire, clean up after a timeout
          setTimeout(cleanup, 1000);
        } else {
          cleanup();
        }
      } catch (error) {
        console.error("Print error:", error);
        toast.error("Print failed");
        document.body.removeChild(printFrame);
        setProcessing(false);
      }
    };
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
        
        doc.setFillColor(...primaryColor)
        doc.rect(0, 0, pageWidth, 18, 'F')
        
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text(schoolInfo.name, pageWidth / 2, 8, { align: "center" })
        
        doc.setFontSize(8)
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
        
        doc.setFillColor(...secondaryColor)
        doc.rect(0, 18, pageWidth, 8, 'F')
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        doc.text("DAY COLLECTION REPORT", pageWidth / 2, 23, { align: "center" })
        
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.text(`Report Date: ${reportDate.toLocaleDateString('en-IN')}`, margin, 35)
        doc.text(`Academic Year: ${currentAcademicYear || "N/A"}`, margin, 39)
        doc.text(`Generated On: ${new Date().toLocaleDateString('en-IN')}`, margin, 43)
        doc.text(`Page 1 of 1`, pageWidth - margin - 15, 43)
        
        const tableColumns = [
          "Bill No",
          "Adm No", 
          "Student Name",
          "Std",
          "Sec",
          "Description",
          "Amount"
        ]

        const tableRows = []

        collectionData.forEach((item) => {
          if (item.type === "subtotal") {
            tableRows.push([
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
              "Concession",
              `-Rs ${Math.abs(item.amount).toFixed(2)}`
            ])
          } else {
            tableRows.push([
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

        tableRows.push([
          "",
          "",
          "",
          "",
          "",
          "Total Collection",
          `Rs ${totalCollection.toFixed(2)}`
        ])

        const totalAvailableWidth = contentWidth
        const columnWidths = {
          0: 18,
          1: 18,
          2: 35,
          3: 12,
          4: 12,
          5: totalAvailableWidth - (18 + 18 + 35 + 12 + 12 + 25),
          6: 25
        }

        const currentTotalWidth = Object.values(columnWidths).reduce((a, b) => a + b, 0)
        if (currentTotalWidth < totalAvailableWidth) {
          columnWidths[5] += totalAvailableWidth - currentTotalWidth
        }

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
            0: { cellWidth: columnWidths[0], halign: 'center' },
            1: { cellWidth: columnWidths[1], halign: 'center' },
            2: { cellWidth: columnWidths[2], halign: 'left' },
            3: { cellWidth: columnWidths[3], halign: 'center' },
            4: { cellWidth: columnWidths[4], halign: 'center' },
            5: { cellWidth: columnWidths[5], halign: 'left' },
            6: { cellWidth: columnWidths[6], halign: 'right' },
          },
          didParseCell: function(data) {
            if (data.row.index > 0 && data.row.index < tableRows.length) {
              const rowData = tableRows[data.row.index]
              const description = rowData[5]
              
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
          },
          margin: { top: 48, right: margin, left: margin, bottom: 20 },
          tableWidth: 'auto'
        })
        
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
    
    setTimeout(async () => {
      try {
        const doc = await generatePDF()
        const fileName = `Day_Collection_Report_${reportDate.toISOString().split('T')[0]}.pdf`
        
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
    setReportDate(new Date())
    setCollectionData([])
    setTotalCollection(0)
  }

  const renderTableBody = () => {
    if (collectionData.length === 0) {
      return (
        <tr>
          <td colSpan="7" className="text-center py-4">
            No collection data available for the selected date.
          </td>
        </tr>
      )
    }

    return collectionData.map((item, index) => {
      if (item.type === "subtotal") {
        return (
          <tr key={`subtotal-${item.admissionNumber}-${index}`} className="subtotal-row">
            <td colSpan="6" className="text-end fw-bold">
              Subtotal
            </td>
            <td className="text-end fw-bold text-primary">Rs {item.amount.toFixed(2)}</td>
          </tr>
        )
      }

      if (item.type === "concession") {
        return (
          <tr key={`concession-${item.admissionNumber}-${index}`} className="concession-row">
            <td colSpan="6" className="text-end text-danger">
              Concession
            </td>
            <td className="text-end text-danger">-Rs {Math.abs(item.amount).toFixed(2)}</td>
          </tr>
        )
      }

      return (
        <tr key={`${item.admissionNumber}-${item.billNumber}-${index}`}>
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
            <span>Day Collection Report</span>
          </nav>
        </div>

        <Card className="shadow-sm no-print">
          <Card.Header className="bg-primary text-white py-3">
            <h2 className="mb-0">Day Collection Report</h2>
          </Card.Header>
          <Card.Body className="p-4">
            <Form className="mb-4">
              <Row className="align-items-end">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Select Your Report Date</Form.Label>
                    <DatePicker
                      selected={reportDate}
                      onChange={handleDateChange}
                      dateFormat="dd/MM/yyyy"
                      className="form-control"
                      maxDate={new Date()}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Button className="custom-btn-clr w-100" onClick={fetchDayCollection} disabled={loading}>
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
                <Col md={6}>
                  <div className="d-flex justify-content-end">
                    <Button 
                      className="btn custom-btn-clr me-2" 
                      onClick={handlePrint} 
                      disabled={processing || collectionData.length === 0}
                    >
                      {processing ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Printing...
                        </>
                      ) : (
                        <>
                          <FaPrint className="me-2" /> Print
                        </>
                      )}
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
                    <h4 className="report-title">DAY COLLECTION REPORT</h4>
                    <div className="report-details">
                      <span>Report As on: {reportDate.toLocaleDateString('en-IN')}</span>
                      <span>Academic Year: {currentAcademicYear || "N/A"}</span>
                      <span>Page 1 of 1</span>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <Table bordered hover className="report-table">
                      <thead>
                        <tr>
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
                          <td colSpan="6" className="text-end fw-bold">
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

export default DayCollectionReport