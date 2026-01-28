import React, { useState, useEffect } from "react"
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
import { FaPrint, FaFilePdf, FaFileExcel, FaSearch, FaArrowLeft, FaFilter, FaRedo, FaCalendarAlt } from "react-icons/fa"
import { ENDPOINTS } from "../../SpringBoot/config"

const PeriodExpensesReport = () => {
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [schoolInfo, setSchoolInfo] = useState({ 
    name: "", 
    address: "", 
    city: "", 
    state: "", 
    pincode: "" 
  })
  const [expenses, setExpenses] = useState([])
  const [totalExpense, setTotalExpense] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const navigate = useNavigate()
  
  const { schoolId, currentAcademicYear, getAuthHeaders } = useAuthContext()

  useEffect(() => { 
    if (schoolId) fetchSchoolInfo() 
  }, [schoolId])

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

  const fetchReport = async () => {
    if (!schoolId || !currentAcademicYear) { 
      toast.error("School ID or Academic Year not available"); 
      return 
    }
    
    if (startDate > endDate) { 
      toast.error("Start date cannot be after end date"); 
      return 
    }
    
    setLoading(true)
    try {
      const sDate = startDate.toISOString().split('T')[0]
      const eDate = endDate.toISOString().split('T')[0]
      const response = await fetch(
        `${ENDPOINTS.report}/receipt-payment/period-expenses?schoolId=${schoolId}&academicYear=${currentAcademicYear}&startDate=${sDate}&endDate=${eDate}`, 
        { headers: getAuthHeaders() }
      )
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      if (result.success) {
        setExpenses(result.data || [])
        setTotalExpense(result.totalExpense || 0)
        
        if ((result.data || []).length === 0) {
          toast.info("No expense records found for the selected period")
        } else {
          toast.success(`Found ${result.data.length} expense records`)
        }
      } else {
        throw new Error(result.error || "Failed to fetch report")
      }
    } catch (error) { 
      console.error("Error fetching period expenses:", error)
      toast.error(error.message || "Failed to fetch expense data")
      setExpenses([])
      setTotalExpense(0)
    } finally { 
      setLoading(false) 
    }
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
        border-bottom: 1px solid #6f42c1; 
        padding-bottom: 10px; 
      }
      .school-name { 
        font-size: 18px; 
        font-weight: bold; 
        color: #6f42c1; 
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
        background-color: #6f42c1 !important; 
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
          <title>Period Expenses Report</title>
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
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        })
        
        const pageWidth = 210
        const pageHeight = 297
        const margin = 10
        const contentWidth = pageWidth - (2 * margin)
        
        const primaryColor = [111, 66, 193]
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
        doc.text("PERIOD EXPENSES REPORT", pageWidth / 2, 23, { align: "center" })
        
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.text(`Report Period: ${startDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')}`, margin, 35)
        doc.text(`Academic Year: ${currentAcademicYear || "N/A"}`, margin, 39)
        doc.text(`Generated On: ${new Date().toLocaleDateString('en-IN')}`, margin, 43)
        doc.text(`Page 1 of 1`, pageWidth - margin - 15, 43)
        
        // Removed Sub Head, Renamed Main Head to Description
        const tableColumns = [
          "Sl.No",
          "Date",
          "Entry No", 
          "Description",
          "Receiver",
          "Mode",
          "Ref ID",
          "Amount"
        ]

        const tableRows = expenses.map((item, index) => [
          (index + 1).toString(),
          item.date || 'N/A',
          item.entryNo || 'N/A',
          item.mainHead || 'N/A', // Using mainHead for Description
          item.receiverName || 'N/A',
          item.paymentMode || 'N/A',
          item.referenceId || '',
          `Rs ${Number(item.amount || 0).toFixed(2)}`
        ])

        tableRows.push([
          "",
          "",
          "",
          "",
          "",
          "",
          "Total Expenses",
          `Rs ${totalExpense.toFixed(2)}`
        ])

        const totalAvailableWidth = contentWidth
        // Adjusted widths after removing Sub Head
        const columnWidths = {
          0: 8,  // Sl.No
          1: 15, // Date
          2: 15, // Entry No
          3: 40, // Description (Expanded)
          4: 25, // Receiver
          5: 15, // Mode
          6: 20, // Ref ID
          7: 20  // Amount
        }

        const currentTotalWidth = Object.values(columnWidths).reduce((a, b) => a + b, 0)
        const adjustmentFactor = totalAvailableWidth / currentTotalWidth
        
        for (let key in columnWidths) {
          columnWidths[key] = columnWidths[key] * adjustmentFactor
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
            2: { cellWidth: columnWidths[2], halign: 'center' },
            3: { cellWidth: columnWidths[3], halign: 'left' },
            4: { cellWidth: columnWidths[4], halign: 'left' },
            5: { cellWidth: columnWidths[5], halign: 'center' },
            6: { cellWidth: columnWidths[6], halign: 'center' },
            7: { cellWidth: columnWidths[7], halign: 'right' },
          },
          didParseCell: function(data) {
            if (data.row.index === tableRows.length - 1) {
              data.cell.styles.fontStyle = 'bold'
              data.cell.styles.fillColor = [233, 236, 239]
              data.cell.styles.fontSize = 8
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
    if (expenses.length === 0) {
      toast.error("No data available to generate PDF")
      return
    }

    setProcessing(true)
    
    setTimeout(async () => {
      try {
        const doc = await generatePDF()
        const fileName = `Period_Expenses_Report_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.pdf`
        
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
    if (expenses.length === 0) {
      toast.error("No data to export")
      return
    }
    
    // Removed Sub Head, Renamed Main Head to Description
    const headers = ["Date", "Entry No", "Description", "Receiver", "Mode", "Ref ID", "Amount"]
    const rows = [
      headers.join(","), 
      ...expenses.map(i => [
        `"\t${i.date}"`,    // Added \t for Date
        `"\t${i.entryNo}"`, // Added \t for Entry No
        `"${i.mainHead}"`,  // Using mainHead for Description
        `"${i.receiverName}"`, 
        `"${i.paymentMode}"`, 
        `"${i.referenceId || ''}"`, 
        i.amount
      ].join(",")),
      `"","","","","","Total","${totalExpense.toFixed(2)}"`
    ]
    
    const link = document.createElement("a")
    link.href = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" }))
    link.download = `Period_Expenses_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("CSV exported successfully")
  }

  const resetFilters = () => { 
    setStartDate(new Date())
    setEndDate(new Date())
    setSearchTerm("")
    setExpenses([])
    setTotalExpense(0)
  }

  const filteredData = expenses.filter(i => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      i.entryNo?.toString().toLowerCase().includes(term) || 
      i.mainHead?.toLowerCase().includes(term) || 
      (i.referenceId && i.referenceId.toLowerCase().includes(term))
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
            <div>Reports</div>
            <span className="separator mx-2">&gt;</span>
            <span>Period Expenses</span>
          </nav>
        </div>

        <Card className="shadow-sm no-print">
          <Card.Header className="bg-purple text-white py-3 d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0">Period Expenses Report</h2>
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
                    <Form.Label>
                      <FaCalendarAlt className="me-2" /> Start Date
                    </Form.Label>
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
                    <Form.Label>
                      <FaCalendarAlt className="me-2" /> End Date
                    </Form.Label>
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
                <Col md={2}>
                  <Button className="custom-btn-purple w-100" onClick={fetchReport} disabled={loading}>
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
                      className="btn custom-btn-purple me-2" 
                      onClick={handlePrint} 
                      disabled={processing || expenses.length === 0}
                    >
                      <FaPrint className="me-2" /> Print
                    </Button>
                    <Button 
                      className="btn custom-btn-purple me-2" 
                      onClick={downloadPDF} 
                      disabled={processing || expenses.length === 0}
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
                      disabled={processing || expenses.length === 0}
                    >
                      <FaFileExcel className="me-2" /> Excel
                    </Button>
                  </div>
                </Col>
              </Row>
              
              {expenses.length > 0 && (
                <Row className="mt-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Search Records</Form.Label>
                      <InputGroup>
                        <InputGroup.Text><FaFilter /></InputGroup.Text>
                        <Form.Control 
                          type="text" 
                          placeholder="Search by entry no, head, reference..." 
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

            {expenses.length > 0 && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3 no-print">
                  <div>
                    <span className="badge bg-purple me-2">
                      {filteredData.length} of {expenses.length} records
                    </span>
                    <span className="badge bg-dark">
                      Total: Rs {totalExpense.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div id="report-content">
                  <div className="report-preview print-container">
                    <div className="report-header">
                      <h3 className="school-name">{schoolInfo.name}</h3>
                      <p className="school-address">
                        {formatSchoolAddress()}
                      </p>
                      <h4 className="report-title">PERIOD EXPENSES REPORT</h4>
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
                            <th className="text-nowrap">Entry No</th>
                            <th className="text-nowrap">Description</th> {/* Renamed */}
                            {/* Removed Sub Head */}
                            <th className="text-nowrap">Receiver</th>
                            <th className="text-nowrap">Mode</th>
                            <th className="text-nowrap">Ref ID</th>
                            <th className="text-end text-nowrap">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData.map((item, idx) => (
                            <tr key={idx}>
                              <td className="text-center">{idx + 1}</td>
                              <td>{item.date}</td>
                              <td>{item.entryNo}</td>
                              <td>{item.mainHead}</td>
                              {/* Removed Sub Head */}
                              <td>{item.receiverName}</td>
                              <td>{item.paymentMode}</td>
                              <td>{item.referenceId || '-'}</td>
                              <td className="text-end fw-bold text-purple">Rs {Number(item.amount).toFixed(2)}</td>
                            </tr>
                          ))}
                          <tr className="total-row">
                            <td colSpan="7" className="text-end fw-bold"> {/* Colspan reduced */}
                              TOTAL EXPENSES
                            </td>
                            <td className="text-end fw-bold fs-6 text-purple">
                              Rs {filteredData.reduce((sum, item) => sum + Number(item.amount), 0).toFixed(2)}
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
          .bg-purple {
            background-color: #6f42c1 !important;
          }
          .text-purple {
            color: #6f42c1 !important;
          }
          .custom-btn-purple {
            background-color: #6f42c1;
            border-color: #6f42c1;
            color: white;
          }
          .custom-btn-purple:hover {
            background-color: #5a32a3;
            border-color: #5a32a3;
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
            border-bottom: 2px solid #6f42c1;
            padding-bottom: 15px;
          }

          .school-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #6f42c1;
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
            color: #6f42c1;
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
            background-color: #6f42c1;
            color: white;
            vertical-align: middle;
            text-align: center;
          }
          
          .report-table td {
            vertical-align: middle;
          }
          
          .total-row td {
            border-top: 3px double #6f42c1;
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

export default PeriodExpensesReport