import { useRef, useState } from 'react'
import { Modal, Button, Spinner } from 'react-bootstrap'
import { FaPrint, FaFilePdf } from 'react-icons/fa'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const BusBillPreviewModal = ({ show, onHide, busBillData, busFeeTableData, schoolInfo, onClose }) => {
  const busBillPreviewRef = useRef(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isDuplicate] = useState(false)

  // Calculate totals
  const totalBusPaidAmount = busFeeTableData.reduce((sum, fee) => sum + Number.parseFloat(fee.paidAmount || 0), 0)
  const totalBusConcession = busFeeTableData.reduce((sum, fee) => sum + Number.parseFloat(fee.concessionAmount || 0), 0)
  const netBusAmount = totalBusPaidAmount - totalBusConcession

  // Format date function
  const formatDate = (date) => {
    if (!date) return "N/A"
    try {
      const dateObj = new Date(date)
      return dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch (error) {
      return "Invalid Date"
    }
  }

  // Enhanced number to words function
  const numberToWords = (num) => {
    const units = [
      "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
      "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ]
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    if (!num) return "Zero"

    // Work with integer part for words
    const intNum = Math.floor(Math.abs(num))

    const convertLessThanThousand = (n) => {
      if (n === 0) return ""
      if (n < 20) return units[n]
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + units[n % 10] : "")
      return units[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " And " + convertLessThanThousand(n % 100) : "")
    }

    let result = ""
    const crore = Math.floor(intNum / 10000000)
    const lakh = Math.floor((intNum % 10000000) / 100000)
    const thousand = Math.floor((intNum % 100000) / 1000)
    const remainder = intNum % 1000

    if (crore > 0) {
      result += convertLessThanThousand(crore) + " Crore "
    }
    if (lakh > 0) {
      result += convertLessThanThousand(lakh) + " Lakh "
    }
    if (thousand > 0) {
      result += convertLessThanThousand(thousand) + " Thousand "
    }
    if (remainder > 0) {
      result += convertLessThanThousand(remainder)
    }

    // Add "Minus" prefix if negative
    if (num < 0) result = "Minus " + result

    return result.trim() || "Zero"
  }

  // Get the exact HTML content from the preview
  const getPreviewHTMLContent = () => {
    return busBillPreviewRef.current ? busBillPreviewRef.current.innerHTML : ''
  }

  // Professional print handler
  const handlePrintBusBill = () => {
    const printWindow = window.open('', '_blank', 'width=1000,height=700,scrollbars=yes')
    if (!printWindow) {
      alert('Please allow popups for printing')
      return
    }

    // Get the exact HTML from the preview
    const previewContent = getPreviewHTMLContent()
    
    // Create complete HTML document with print styles
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bus Fee Receipt - ${busBillData.busBillNumber}</title>
        <meta charset="UTF-8">
        <style>
          /* Print-specific adjustments */
          @media print {
            html, body {
              width: 210mm;
              height: auto;
              margin: 0;
              padding: 0;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: white !important;
            }
            .no-print { display: none !important; }
            .bus-bill-container {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 10mm !important;
              box-sizing: border-box;
              border: none !important;
              box-shadow: none !important;
              page-break-inside: avoid;
            }
            .bus-fee-table {
              font-size: 12px !important;
            }
            .bus-fee-table th, .bus-fee-table td {
              padding: 6px 4px !important;
            }
            .student-details {
              gap: 10px !important;
            }
            .signature-section, .notes-section {
              page-break-inside: avoid;
            }
            /* Ensure all colors print correctly */
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }

          /* Base styles matching the preview */
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background: white;
            color: #333;
            width: 100%;
            height: 100%;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            box-sizing: border-box;
          }
          .bus-bill-container {
            width: 100%;
            margin: 0 auto;
            background: white;
            padding: 20px;
            position: relative;
            font-size: 14px;
            box-sizing: border-box;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 80px;
            font-weight: bold;
            color: rgba(0,0,0,0.06);
            z-index: 100;
            pointer-events: none;
            white-space: nowrap;
            display: ${isDuplicate ? 'block' : 'none'};
          }
          .school-header {
            text-align: center;
            border-bottom: 2px solid #2c5aa0;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .school-name {
            font-size: 22px;
            font-weight: bold;
            color: #2c5aa0;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 1px;
            line-height: 1.2;
          }
          .school-address {
            font-size: 14px;
            color: #666;
            margin: 8px 0 0 0;
            font-weight: 500;
            line-height: 1.4;
          }
          .bus-bill-title {
            text-align: center;
            background: linear-gradient(135deg, #2c5aa0, #1e3a6b);
            color: white;
            padding: 12px;
            margin: 20px 0;
            border-radius: 6px;
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .student-details {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 20px;
            margin-bottom: 20px;
            padding: 16px;
            background: #f8f9fa;
            border-radius: 6px;
            border-left: 4px solid #2c5aa0;
            box-sizing: border-box;
          }
          .detail-group h4 {
            margin: 0 0 12px 0;
            font-size: 14px;
            color: #2c5aa0;
            border-bottom: 1px solid #ddd;
            padding-bottom: 6px;
          }
          .detail-row {
            display: flex;
            margin-bottom: 8px;
            align-items: flex-start;
            gap: 8px;
            flex-wrap: wrap;
          }
          .detail-label {
            font-weight: 600;
            color: #555;
            min-width: 120px;
            font-size: 13px;
          }
          .detail-value {
            color: #333;
            font-weight: 500;
            flex: 1;
            font-size: 13px;
            word-break: break-word;
          }
          .bus-fee-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 13px;
            table-layout: fixed;
            box-sizing: border-box;
          }
          .bus-fee-table th {
            background: #2c5aa0 !important;
            color: white;
            padding: 10px 8px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #1e3a6b;
            font-size: 13px;
          }
          .bus-fee-table td {
            padding: 8px 6px;
            border: 1px solid #ddd;
            vertical-align: top;
            font-size: 13px;
            word-break: break-word;
            white-space: normal;
          }
          .bus-fee-table tbody tr:nth-child(even) {
            background: #f8f9fa;
          }
          .bus-fee-table tfoot {
            background: #e9ecef;
            font-weight: bold;
          }
          .bus-fee-table tfoot td {
            border-top: 2px solid #2c5aa0;
            padding: 12px 8px;
            font-size: 13px;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .amount-negative { color: #dc3545; font-weight: bold; }
          .total-row { background: #e3f2fd !important; font-weight: bold; }
          .signature-section { 
            margin-top: 30px; 
            text-align: right; 
            padding-top: 12px; 
            border-top: 2px dashed #2c5aa0; 
          }
          .signature-line { 
            display: inline-block; 
            width: 200px; 
            border-top: 1px solid #333; 
            margin-top: 24px; 
          }
          .signature-label { 
            margin-top: 8px; 
            font-weight: bold; 
            color: #2c5aa0; 
            font-size: 14px; 
          }
          .notes-section { 
            margin-top: 25px; 
            padding: 12px; 
            background: #fff3cd; 
            border: 1px solid #ffeaa7; 
            border-radius: 6px; 
            font-size: 12px; 
          }
          .notes-title { 
            font-weight: bold; 
            color: #856404; 
            margin-bottom: 8px; 
            font-size: 13px; 
          }
          .notes-list { 
            margin: 0; 
            padding-left: 18px; 
            color: #856404; 
          }
          .notes-list li { 
            margin-bottom: 4px; 
            line-height: 1.4; 
          }
          .print-info { 
            text-align: center; 
            margin-top: 15px; 
            font-size: 11px; 
            color: #666; 
            font-style: italic; 
          }
          .amount-in-words {
            font-size: 12px;
            font-style: italic;
            color: #666;
            line-height: 1.3;
          }

          /* Column widths */
          .bus-fee-table th:nth-child(1), .bus-fee-table td:nth-child(1) { width: 10%; }
          .bus-fee-table th:nth-child(2), .bus-fee-table td:nth-child(2) { width: 60%; }
          .bus-fee-table th:nth-child(3), .bus-fee-table td:nth-child(3) { width: 30%; text-align: right; }
        </style>
      </head>
      <body>
        <div class="bus-bill-container">
          ${previewContent}
        </div>
        <script>
          // Auto-print after content loads
          window.onload = function() {
            setTimeout(function() {
              window.print();
              // Close window after print (optional)
              setTimeout(function() {
                window.close();
              }, 500);
            }, 500);
          };
        </script>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()

    // Focus the window for printing
    printWindow.focus()
  }

  // Professional PDF generation with proper currency symbol
  const handleDownloadBusBill = async () => {
    setIsGeneratingPDF(true)

    try {
      // Create PDF with portrait orientation for A4
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Set professional colors
      const primaryColor = [44, 90, 160] // #2c5aa0
      
      // Use "Rs." instead of Unicode symbol for PDF compatibility
      const currencySymbol = 'Rs.'

      // School Header
      const schoolName = schoolInfo.name || "SCHOOL NAME"
      const schoolAddress = schoolInfo.address || "SCHOOL ADDRESS"

      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(...primaryColor)

      // School name (centered)
      const schoolNameLines = doc.splitTextToSize(schoolName, 180)
      let currentY = 25

      schoolNameLines.forEach((line, index) => {
        doc.text(line, 105, currentY + (index * 7), { align: "center" })
      })

      currentY += (schoolNameLines.length * 7) + 3

      // School address
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100, 100, 100)

      const addressLines = doc.splitTextToSize(schoolAddress, 180)
      addressLines.forEach((line, index) => {
        doc.text(line, 105, currentY + (index * 5), { align: "center" })
      })

      currentY += (addressLines.length * 5) + 12

      // Bus Bill Title
      doc.setFillColor(...primaryColor)
      doc.rect(15, currentY, 180, 8, 'F')
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(255, 255, 255)
      doc.text(isDuplicate ? 'DUPLICATE BUS FEE RECEIPT' : 'OFFICIAL BUS FEE RECEIPT', 105, currentY + 5, { align: "center" })

      currentY += 18

      // Student Details Section
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(...primaryColor)
      doc.text("STUDENT INFORMATION", 20, currentY)
      doc.text("BUS BILL INFORMATION", 110, currentY)

      currentY += 7
      doc.setFont("helvetica", "normal")
      doc.setTextColor(0, 0, 0)

      // Student Info
      const studentInfo = [
        `Admission No: ${busBillData.admissionNumber || 'N/A'}`,
        `Student Name: ${busBillData.studentName || 'N/A'}`,
        `Father Name: ${busBillData.fatherName || 'N/A'}`,
        `Class & Section: ${(busBillData.course || busBillData.standard || 'N/A')} - ${busBillData.section || 'N/A'}`,
        `Route Number: ${busBillData.routeNumber || 'N/A'}`,
        `Pickup Point: ${busBillData.pickupPoint || 'N/A'}`
      ]

      studentInfo.forEach((info, index) => {
        const lines = doc.splitTextToSize(info, 80)
        lines.forEach((line, lineIndex) => {
          doc.text(line, 20, currentY + (index * 6) + (lineIndex * 4))
        })
      })

      // Bus Bill Info
      const busBillInfo = [
        `Bus Bill Number: ${busBillData.busBillNumber || 'N/A'}`,
        `Bus Bill Date: ${formatDate(busBillData.busBillDate) || 'N/A'}`,
        `Payment Mode: ${busBillData.paymentMode || 'N/A'}`,
        `Reference No: ${busBillData.paymentNumber || 'N/A'}`,
        `Bus Fee Amount: ${currencySymbol} ${busBillData.busFeeAmount || '0'}`
      ]

      busBillInfo.forEach((info, index) => {
        const lines = doc.splitTextToSize(info, 80)
        lines.forEach((line, lineIndex) => {
          doc.text(line, 110, currentY + (index * 6) + (lineIndex * 4))
        })
      })

      currentY += 40

      // Prepare table data with proper currency symbol
      const tableData = busFeeTableData.map((fee, index) => [
        (index + 1).toString(),
        fee.heading || fee.feeHead || fee.description || 'Bus Fee Item',
        currencySymbol + ' ' + Number.parseFloat(fee.paidAmount || fee.amount || 0).toFixed(2)
      ])

      // Add concession row if applicable
      if (totalBusConcession > 0) {
        tableData.push([
          (busFeeTableData.length + 1).toString(),
          'Bus Fee Concession',
          '- ' + currencySymbol + ' ' + totalBusConcession.toFixed(2)
        ])
      }

      // Use autoTable for professional table formatting
      autoTable(doc, {
        startY: currentY,
        head: [['S.No', 'Bus Fee Description', 'Amount (' + currencySymbol + ')']],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.25,
          valign: 'middle'
        },
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 9
        },
        bodyStyles: {
          halign: 'left',
          fontSize: 9
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 125 },
          2: { cellWidth: 35, halign: 'right' }
        },
        margin: { left: 15, right: 15 },
        didDrawPage: function (data) {
          // Add total row manually relative to the table end
          const finalY = data.cursor ? data.cursor.y + 8 : 180

          // Amount in words
          doc.setFontSize(9)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(...primaryColor)
          doc.text('Total Amount in Words:', 20, finalY)

          doc.setFontSize(8)
          doc.setFont("helvetica", "italic")
          doc.setTextColor(100, 100, 100)

          const amountWords = numberToWords(netBusAmount) + " only"
          const amountLines = doc.splitTextToSize(amountWords, 120)
          amountLines.forEach((line, index) => {
            doc.text(line, 20, finalY + 4 + (index * 3.5))
          })

          // Net Amount with proper currency symbol
          doc.setFontSize(10)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(0, 0, 0)
          doc.text('Net Amount: ' + currencySymbol + ' ' + netBusAmount.toFixed(2), 165, finalY, { align: "right" })
        }
      })

      // Get final Y position after table
      let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 180

      // Signature section
      doc.setDrawColor(0, 0, 0)
      doc.line(120, finalY, 190, finalY)
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(...primaryColor)
      doc.text('Transport Incharge', 155, finalY + 5, { align: "center" })

      // Notes section
      const notesY = finalY + 12
      doc.setFillColor(255, 243, 205)
      doc.rect(15, notesY, 180, 25, 'F')
      doc.setDrawColor(255, 234, 167)
      doc.rect(15, notesY, 180, 25)

      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(133, 100, 4)
      doc.text('BUS FEE IMPORTANT NOTES:', 20, notesY + 4)

      doc.setFont("helvetica", "normal")
      const notes = [
        '• This is a computer generated bus fee receipt.',
        '• Please preserve this receipt for bus travel.',
        '• Bus fee once paid will not be refunded or adjusted.',
        '• For any bus route changes, contact transport department.',
        '• Bus timings and routes are subject to change.'
      ]

      notes.forEach((note, index) => {
        const noteLines = doc.splitTextToSize(note, 170)
        noteLines.forEach((line, li) => {
          doc.text(line, 20, notesY + 8 + (index * 4) + (li * 3.5))
        })
      })

      // Footer
      const footerY = 280
      doc.setFontSize(7)
      doc.setFont("helvetica", "italic")
      doc.setTextColor(100, 100, 100)
      doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')} | Operator: ${busBillData.operatorName || 'N/A'}`, 105, footerY, { align: "center" })

      // Add duplicate watermark
      if (isDuplicate) {
        doc.setFontSize(60)
        doc.setTextColor(200, 200, 200)
        doc.setFont("helvetica", "bold")
        doc.text("DUPLICATE", 105, 150, {
          align: "center",
          angle: 45,
        })
      }

      // Save the PDF
      doc.save(`Bus_Fee_Receipt_${(busBillData.busBillNumber || 'bus_receipt').replace(/\//g, '_')}.pdf`)

    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Error generating PDF. Please try again.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="xl"
      style={{
        width: '95vw',
        maxWidth: '95vw',
        margin: '0 auto'
      }}
      contentClassName="modal-95vw-content"
    >
      <Modal.Header
        style={{
          backgroundColor: "#0B3D7B",
          borderBottom: "2px solid #dee2e6",
          padding: '15px',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          width: '100%'
        }}
        className="text-white"
      >
        <Modal.Title
          className="text-center w-100 mb-0"
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'white'
          }}
        >
          {isDuplicate ? "Duplicate Bus Bill Preview" : "Bus Fee Receipt Preview"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body
        style={{
          padding: '0',
          width: '100%',
          maxHeight: '70vh',
          overflow: 'auto',
          position: 'relative',
          backgroundColor: '#f8f9fa'
        }}
      >
        <div
          className="table-container"
          style={{
            maxHeight: '100%',
            overflowY: 'auto',
            width: '100%',
            padding: '10px',
          }}
        >
          {/* ENHANCED PREVIEW CONTENT - SAME FORMATTING AS PRINT */}
          <div
            ref={busBillPreviewRef}
            style={{
              width: '100%',
              minHeight: '100%',
              background: 'white',
              padding: '20px',
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              fontSize: '14px',
              color: '#333',
              boxSizing: 'border-box',
              position: 'relative'
            }}
          >
            {/* Watermark */}
            {isDuplicate && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(-45deg)',
                  fontSize: '80px',
                  fontWeight: 'bold',
                  color: 'rgba(0,0,0,0.06)',
                  zIndex: 100,
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                DUPLICATE
              </div>
            )}

            {/* School Header */}
            <div
              style={{
                textAlign: 'center',
                borderBottom: '2px solid #2c5aa0',
                paddingBottom: '12px',
                marginBottom: '20px'
              }}
            >
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#2c5aa0',
                  margin: '0',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  lineHeight: '1.2'
                }}
              >
                {schoolInfo.name}
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: '#666',
                  margin: '8px 0 0 0',
                  fontWeight: '500',
                  lineHeight: '1.4'
                }}
              >
                {schoolInfo.address}
              </div>
            </div>

            {/* Bus Bill Title */}
            <div
              style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #2c5aa0, #1e3a6b)',
                color: 'white',
                padding: '12px',
                margin: '20px 0',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              {isDuplicate ? 'DUPLICATE BUS FEE RECEIPT' : 'OFFICIAL BUS FEE RECEIPT'}
            </div>

            {/* Student Details */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '20px',
                marginBottom: '20px',
                padding: '16px',
                background: '#f8f9fa',
                borderRadius: '6px',
                borderLeft: '4px solid #2c5aa0',
                boxSizing: 'border-box'
              }}
            >
              <div>
                <h4
                  style={{
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    color: '#2c5aa0',
                    borderBottom: '1px solid #ddd',
                    paddingBottom: '6px'
                  }}
                >
                  STUDENT INFORMATION
                </h4>
                <div style={{ display: 'flex', marginBottom: '8px', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '600', color: '#555', minWidth: '120px', fontSize: '13px' }}>Admission No:</span>
                  <span style={{ color: '#333', fontWeight: '500', flex: '1', fontSize: '13px', wordBreak: 'break-word' }}>
                    {busBillData.admissionNumber}
                  </span>
                </div>
                <div style={{ display: 'flex', marginBottom: '8px', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '600', color: '#555', minWidth: '120px', fontSize: '13px' }}>Student Name:</span>
                  <span style={{ color: '#333', fontWeight: '500', flex: '1', fontSize: '13px', wordBreak: 'break-word' }}>
                    {busBillData.studentName}
                  </span>
                </div>
                <div style={{ display: 'flex', marginBottom: '8px', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '600', color: '#555', minWidth: '120px', fontSize: '13px' }}>Father Name:</span>
                  <span style={{ color: '#333', fontWeight: '500', flex: '1', fontSize: '13px', wordBreak: 'break-word' }}>
                    {busBillData.fatherName}
                  </span>
                </div>
                <div style={{ display: 'flex', marginBottom: '8px', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '600', color: '#555', minWidth: '120px', fontSize: '13px' }}>Class & Section:</span>
                  <span style={{ color: '#333', fontWeight: '500', flex: '1', fontSize: '13px', wordBreak: 'break-word' }}>
                    {busBillData.course || busBillData.standard} - {busBillData.section}
                  </span>
                </div>
                <div style={{ display: 'flex', marginBottom: '8px', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '600', color: '#555', minWidth: '120px', fontSize: '13px' }}>Route Number:</span>
                  <span style={{ color: '#333', fontWeight: '500', flex: '1', fontSize: '13px', wordBreak: 'break-word' }}>
                    {busBillData.routeNumber}
                  </span>
                </div>
                <div style={{ display: 'flex', marginBottom: '8px', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '600', color: '#555', minWidth: '120px', fontSize: '13px' }}>Pickup Point:</span>
                  <span style={{ color: '#333', fontWeight: '500', flex: '1', fontSize: '13px', wordBreak: 'break-word' }}>
                    {busBillData.pickupPoint}
                  </span>
                </div>
              </div>

              <div>
                <h4
                  style={{
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    color: '#2c5aa0',
                    borderBottom: '1px solid #ddd',
                    paddingBottom: '6px'
                  }}
                >
                  BUS BILL INFORMATION
                </h4>
                <div style={{ display: 'flex', marginBottom: '8px', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '600', color: '#555', minWidth: '120px', fontSize: '13px' }}>Bus Bill Number:</span>
                  <span style={{ color: '#333', fontWeight: '500', flex: '1', fontSize: '13px', wordBreak: 'break-word' }}>
                    {busBillData.busBillNumber}
                  </span>
                </div>
                <div style={{ display: 'flex', marginBottom: '8px', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '600', color: '#555', minWidth: '120px', fontSize: '13px' }}>Bus Bill Date:</span>
                  <span style={{ color: '#333', fontWeight: '500', flex: '1', fontSize: '13px', wordBreak: 'break-word' }}>
                    {formatDate(busBillData.busBillDate)}
                  </span>
                </div>
                <div style={{ display: 'flex', marginBottom: '8px', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '600', color: '#555', minWidth: '120px', fontSize: '13px' }}>Payment Mode:</span>
                  <span style={{ color: '#333', fontWeight: '500', flex: '1', fontSize: '13px', wordBreak: 'break-word' }}>
                    {busBillData.paymentMode}
                  </span>
                </div>
                <div style={{ display: 'flex', marginBottom: '8px', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '600', color: '#555', minWidth: '120px', fontSize: '13px' }}>Reference No:</span>
                  <span style={{ color: '#333', fontWeight: '500', flex: '1', fontSize: '13px', wordBreak: 'break-word' }}>
                    {busBillData.paymentNumber || 'N/A'}
                  </span>
                </div>
                <div style={{ display: 'flex', marginBottom: '8px', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '600', color: '#555', minWidth: '120px', fontSize: '13px' }}>Bus Fee Amount:</span>
                  <span style={{ color: '#333', fontWeight: '500', flex: '1', fontSize: '13px', wordBreak: 'break-word' }}>
                    ₹ {busBillData.busFeeAmount}
                  </span>
                </div>
              </div>
            </div>

            {/* Bus Fee Table */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                margin: '20px 0',
                fontSize: '13px',
                tableLayout: 'fixed',
                boxSizing: 'border-box'
              }}
            >
              <thead>
                <tr>
                  <th style={{ background: '#2c5aa0', color: 'white', padding: '10px 8px', textAlign: 'left', fontWeight: '600', border: '1px solid #1e3a6b', fontSize: '13px', width: '10%' }}>
                    S.No
                  </th>
                  <th style={{ background: '#2c5aa0', color: 'white', padding: '10px 8px', textAlign: 'left', fontWeight: '600', border: '1px solid #1e3a6b', fontSize: '13px', width: '60%' }}>
                    Bus Fee Description
                  </th>
                  <th style={{ background: '#2c5aa0', color: 'white', padding: '10px 8px', textAlign: 'right', fontWeight: '600', border: '1px solid #1e3a6b', fontSize: '13px', width: '30%' }}>
                    Amount (₹)
                  </th>
                </tr>
              </thead>
              <tbody>
                {busFeeTableData.map((fee, index) => (
                  <tr key={index} style={{ background: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                    <td style={{ padding: '8px 6px', border: '1px solid #ddd', verticalAlign: 'top', fontSize: '13px', textAlign: 'center' }}>
                      {index + 1}
                    </td>
                    <td style={{ padding: '8px 6px', border: '1px solid #ddd', verticalAlign: 'top', fontSize: '13px', wordBreak: 'break-word' }}>
                      {fee.heading || fee.feeHead || fee.description}
                    </td>
                    <td style={{ padding: '8px 6px', border: '1px solid #ddd', verticalAlign: 'top', fontSize: '13px', textAlign: 'right' }}>
                      ₹ {Number.parseFloat(fee.paidAmount || fee.amount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {totalBusConcession > 0 && (
                  <tr>
                    <td style={{ padding: '8px 6px', border: '1px solid #ddd', verticalAlign: 'top', fontSize: '13px', textAlign: 'center' }}>
                      {busFeeTableData.length + 1}
                    </td>
                    <td style={{ padding: '8px 6px', border: '1px solid #ddd', verticalAlign: 'top', fontSize: '13px' }}>
                      Bus Fee Concession
                    </td>
                    <td style={{ padding: '8px 6px', border: '1px solid #ddd', verticalAlign: 'top', fontSize: '13px', textAlign: 'right', color: '#dc3545', fontWeight: 'bold' }}>
                      - ₹ {totalBusConcession.toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot style={{ background: '#e9ecef', fontWeight: 'bold' }}>
                <tr style={{ background: '#e3f2fd' }}>
                  <td colSpan="2" style={{ padding: '12px 8px', border: '1px solid #ddd', fontSize: '13px', borderTop: '2px solid #2c5aa0' }}>
                    <strong>Total Amount in Words:</strong><br />
                    <em style={{ fontSize: '12px', fontStyle: 'italic', color: '#666', lineHeight: '1.3' }}>
                      {numberToWords(netBusAmount)} only
                    </em>
                  </td>
                  <td style={{ padding: '12px 8px', border: '1px solid #ddd', fontSize: '13px', textAlign: 'right', borderTop: '2px solid #2c5aa0' }}>
                    <strong>Net Amount: ₹ {netBusAmount.toFixed(2)}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Signature Section */}
            <div
              style={{
                marginTop: '30px',
                textAlign: 'right',
                paddingTop: '12px',
                borderTop: '2px dashed #2c5aa0'
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  width: '200px',
                  borderTop: '1px solid #333',
                  marginTop: '24px'
                }}
              />
              <div
                style={{
                  marginTop: '8px',
                  fontWeight: 'bold',
                  color: '#2c5aa0',
                  fontSize: '14px'
                }}
              >
                Transport Incharge
              </div>
            </div>

            {/* Notes Section */}
            <div
              style={{
                marginTop: '25px',
                padding: '12px',
                background: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            >
              <div
                style={{
                  fontWeight: 'bold',
                  color: '#856404',
                  marginBottom: '8px',
                  fontSize: '13px'
                }}
              >
                BUS FEE IMPORTANT NOTES:
              </div>
              <ol
                style={{
                  margin: '0',
                  paddingLeft: '18px',
                  color: '#856404'
                }}
              >
                <li style={{ marginBottom: '4px', lineHeight: '1.4' }}>This is a computer generated bus fee receipt.</li>
                <li style={{ marginBottom: '4px', lineHeight: '1.4' }}>Please preserve this receipt for bus travel.</li>
                <li style={{ marginBottom: '4px', lineHeight: '1.4' }}>Bus fee once paid will not be refunded or adjusted.</li>
                <li style={{ marginBottom: '4px', lineHeight: '1.4' }}>For any bus route changes, contact transport department.</li>
                <li style={{ marginBottom: '4px', lineHeight: '1.4' }}>Bus timings and routes are subject to change.</li>
              </ol>
            </div>

            {/* Print Info */}
            <div
              style={{
                textAlign: 'center',
                marginTop: '15px',
                fontSize: '11px',
                color: '#666',
                fontStyle: 'italic'
              }}
            >
              Generated on {new Date().toLocaleDateString('en-IN')} at {new Date().toLocaleTimeString('en-IN')} | Operator: {busBillData.operatorName}
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer
        className="d-flex justify-content-center"
        style={{
          borderTop: '2px solid #dee2e6',
          padding: '15px',
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px',
          backgroundColor: '#f8f9fa',
          width: '100%'
        }}
      >
        <div className="d-flex gap-3 w-100 justify-content-between align-items-center">
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={handlePrintBusBill}
              disabled={isGeneratingPDF}
              size="md"
              style={{
                minWidth: '160px',
                fontSize: '14px',
                padding: '8px 20px'
              }}
            >
              <FaPrint className="me-2" />
              Print Receipt
            </Button>
            <Button
              variant="outline-success"
              onClick={handleDownloadBusBill}
              disabled={isGeneratingPDF}
              size="md"
              style={{
                minWidth: '180px',
                fontSize: '14px',
                padding: '8px 20px'
              }}
            >
              {isGeneratingPDF ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <FaFilePdf className="me-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
          <Button
            variant="secondary"
            onClick={onClose}
            size="md"
            style={{
              minWidth: '140px',
              fontSize: '14px',
              padding: '8px 20px'
            }}
          >
            Close Preview
          </Button>
        </div>
      </Modal.Footer>

      <style>
        {`
          /* Modal container styles */
          .modal-95vw-content {
            width: 95vw !important;
            max-width: 95vw !important;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            border: none;
          }

          /* Custom scrollbar for table container */
          .table-container::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }

          .table-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }

          .table-container::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 4px;
          }

          .table-container::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
          }
        `}
      </style>
    </Modal>
  )
}

export default BusBillPreviewModal