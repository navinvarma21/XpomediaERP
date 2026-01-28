import { useRef, useState, useEffect } from 'react'
import { Modal, Button, Spinner } from 'react-bootstrap'
import { FaPrint, FaFilePdf } from 'react-icons/fa'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAuthContext } from "../../../Context/AuthContext"
import { ENDPOINTS } from "../../../SpringBoot/config"

const BillPreviewModal = ({ show, onHide, billData, feeTableData, schoolInfo, onClose }) => {
  const billPreviewRef = useRef(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isDuplicate] = useState(false)
  const [schoolPhoto, setSchoolPhoto] = useState(null)
  const [loadingSchoolPhoto, setLoadingSchoolPhoto] = useState(false)
  const { schoolId, getAuthHeaders } = useAuthContext()

  // Fetch school photo from the profile endpoint
  const fetchSchoolPhoto = async () => {
    if (!schoolId) {
      console.log("School ID not available")
      return
    }

    try {
      setLoadingSchoolPhoto(true)
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/school/school-details?schoolId=${schoolId}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const schoolData = await response.json()
        console.log("Received school data for bill:", schoolData)
        
        if (schoolData && schoolData.profileImage) {
          let profileImageBase64 = ""
          
          // Handle both base64 string and byte array formats (same as Settings component)
          if (typeof schoolData.profileImage === 'string') {
            // It's already a base64 string
            const imageType = schoolData.profileImageType || "image/jpeg"
            profileImageBase64 = `data:${imageType};base64,${schoolData.profileImage}`
          } else if (Array.isArray(schoolData.profileImage)) {
            // It's a byte array - convert to base64 (backward compatibility)
            const byteArray = new Uint8Array(schoolData.profileImage)
            const binaryString = String.fromCharCode.apply(null, byteArray)
            const base64 = btoa(binaryString)
            const imageType = schoolData.profileImageType || "image/jpeg"
            profileImageBase64 = `data:${imageType};base64,${base64}`
          }
          
          console.log("Processed school photo for bill:", profileImageBase64 ? "Exists" : "Empty")
          setSchoolPhoto(profileImageBase64)
        } else {
          console.log("No school photo found")
          setSchoolPhoto(null)
        }
      } else if (response.status === 404) {
        console.log("No school details found")
        setSchoolPhoto(null)
      } else {
        throw new Error("Failed to fetch school details")
      }
    } catch (error) {
      console.error("Error fetching school photo for bill:", error)
      setSchoolPhoto(null)
    } finally {
      setLoadingSchoolPhoto(false)
    }
  }

  // Calculate totals
  const totalPaidAmount = feeTableData.reduce((sum, fee) => sum + Number.parseFloat(fee.paidAmount || 0), 0)
  const totalConcession = feeTableData.reduce((sum, fee) => sum + Number.parseFloat(fee.concessionAmount || 0), 0)
  
  // --- CHANGED LOGIC HERE: Subtract concession from total ---
  const netAmount = totalPaidAmount - totalConcession

  // Filter fee table to show only fees with paid amount > 0
  const paidFees = feeTableData.filter(fee => Number.parseFloat(fee.paidAmount || 0) > 0)

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

    if (!num && num !== 0) return "Zero" // Handle undefined/null
    if (num === 0) return "Zero"

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
    return billPreviewRef.current ? billPreviewRef.current.innerHTML : ''
  }

  // Professional print handler - FIXED FOR SINGLE PAGE A4
  const handlePrintBill = () => {
    const printWindow = window.open('', '_blank', 'width=1000,height=700,scrollbars=yes')
    if (!printWindow) {
      alert('Please allow popups for printing')
      return
    }

    // Get the exact HTML from the preview
    const previewContent = getPreviewHTMLContent()
    
    // Create complete HTML document with print styles optimized for single A4 page
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill Receipt - ${billData.billNumber}</title>
        <meta charset="UTF-8">
        <style>
          /* Reset and base styles for print */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          /* A4 size specifications */
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            
            html, body {
              width: 210mm;
              height: 297mm;
              margin: 0 auto;
              padding: 0;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 12px;
              background: white !important;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            .no-print { display: none !important; }
            
            .bill-container {
              width: 190mm !important;
              max-width: 190mm !important;
              min-height: 277mm;
              margin: 0 auto !important;
              padding: 5mm !important;
              box-sizing: border-box;
              border: none !important;
              box-shadow: none !important;
              page-break-inside: avoid;
              page-break-after: avoid;
              overflow: hidden;
            }
            
            /* Compact styles for single page */
            .school-header {
              gap: 10px !important;
              padding-bottom: 8px !important;
              margin-bottom: 10px !important;
            }
            
            .school-logo-container {
              width: 60px !important;
              height: 60px !important;
            }
            
            .school-name {
              font-size: 18px !important;
            }
            
            .school-address {
              font-size: 12px !important;
            }
            
            .bill-title {
              margin: 10px 0 !important;
              padding: 8px !important;
              font-size: 14px !important;
            }
            
            .student-details {
              gap: 10px !important;
              margin-bottom: 12px !important;
              padding: 12px !important;
              grid-template-columns: 1fr 1fr !important;
            }
            
            .detail-group h4 {
              font-size: 12px !important;
              margin-bottom: 8px !important;
            }
            
            .detail-row {
              margin-bottom: 4px !important;
              font-size: 11px !important;
            }
            
            .detail-label {
              min-width: 100px !important;
              font-size: 11px !important;
            }
            
            .detail-value {
              font-size: 11px !important;
            }
            
            .fee-table {
              font-size: 10px !important;
              margin: 12px 0 !important;
            }
            
            .fee-table th,
            .fee-table td {
              padding: 4px 3px !important;
              font-size: 10px !important;
            }
            
            .fee-table th:nth-child(1), .fee-table td:nth-child(1) { width: 8% !important; }
            .fee-table th:nth-child(2), .fee-table td:nth-child(2) { width: 62% !important; }
            .fee-table th:nth-child(3), .fee-table td:nth-child(3) { width: 30% !important; }
            
            .signature-section {
              margin-top: 15px !important;
            }
            
            .notes-section {
              margin-top: 15px !important;
              padding: 8px !important;
              font-size: 10px !important;
            }
            
            .print-info {
              margin-top: 10px !important;
              font-size: 9px !important;
            }
            
            .amount-in-words {
              font-size: 10px !important;
            }
            
            /* Force single page */
            .bill-container {
              page-break-before: avoid;
              page-break-after: avoid;
              page-break-inside: avoid;
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
          .bill-container {
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
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            border-bottom: 2px solid #2c5aa0;
            padding-bottom: 12px;
            margin-bottom: 20px;
            text-align: center;
          }
          .school-logo-container {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            overflow: hidden;
            border: 3px solid #2c5aa0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
            flex-shrink: 0;
          }
          .school-logo {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .school-info {
            flex: 1;
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
            line-height: '1.4';
          }
          .bill-title {
            text-align: 'center';
            background: 'linear-gradient(135deg, #2c5aa0, #1e3a6b)';
            color: 'white';
            padding: '12px';
            margin: '20px 0';
            border-radius: '6px';
            font-size: '16px';
            font-weight: 'bold';
            text-transform: 'uppercase';
            letter-spacing: '1px';
          }
          .student-details {
            display: 'grid';
            grid-template-columns: 'repeat(2, minmax(0, 1fr))';
            gap: '20px';
            margin-bottom: '20px';
            padding: '16px';
            background: '#f8f9fa';
            border-radius: '6px';
            border-left: '4px solid #2c5aa0';
            box-sizing: 'border-box';
          }
          .detail-group h4 {
            margin: '0 0 12px 0';
            font-size: '14px';
            color: '#2c5aa0';
            border-bottom: '1px solid #ddd';
            padding-bottom: '6px';
          }
          .detail-row {
            display: 'flex';
            margin-bottom: '8px';
            align-items: 'flex-start';
            gap: '8px';
            flex-wrap: 'wrap';
          }
          .detail-label {
            font-weight: '600';
            color: '#555';
            min-width: '120px';
            font-size: '13px';
          }
          .detail-value {
            color: '#333';
            font-weight: '500';
            flex: '1';
            font-size: '13px';
            word-break: 'break-word';
          }
          .fee-table {
            width: '100%';
            border-collapse: 'collapse';
            margin: '20px 0';
            font-size: '13px';
            table-layout: 'fixed';
            box-sizing: 'border-box';
          }
          .fee-table th {
            background: '#2c5aa0 !important';
            color: 'white';
            padding: '10px 8px';
            text-align: 'left';
            font-weight: '600';
            border: '1px solid #1e3a6b';
            font-size: '13px';
          }
          .fee-table td {
            padding: '8px 6px';
            border: '1px solid #ddd';
            vertical-align: 'top';
            font-size: '13px';
            word-break: 'break-word';
            white-space: 'normal';
          }
          .fee-table tbody tr:nth-child(even) {
            background: '#f8f9fa';
          }
          .fee-table tfoot {
            background: '#e9ecef';
            font-weight: 'bold';
          }
          .fee-table tfoot td {
            border-top: '2px solid #2c5aa0';
            padding: '12px 8px';
            font-size: '13px';
          }
          .text-right { text-align: 'right'; }
          .text-center { text-align: 'center'; }
          .amount-positive { color: '#28a745'; font-weight: 'bold'; }
          .total-row { background: '#e3f2fd !important'; font-weight: 'bold'; }
          .signature-section { 
            margin-top: '30px'; 
            text-align: 'right'; 
            padding-top: '12px'; 
            border-top: '2px dashed #2c5aa0'; 
          }
          .signature-line { 
            display: 'inline-block'; 
            width: '200px'; 
            border-top: '1px solid #333'; 
            margin-top: '24px'; 
          }
          .signature-label { 
            margin-top: '8px'; 
            font-weight: 'bold'; 
            color: '#2c5aa0'; 
            font-size: '14px'; 
          }
          .notes-section { 
            margin-top: '25px'; 
            padding: '12px'; 
            background: '#fff3cd'; 
            border: '1px solid #ffeaa7'; 
            border-radius: '6px'; 
            font-size: '12px'; 
          }
          .notes-title { 
            font-weight: 'bold'; 
            color: '#856404'; 
            margin-bottom: '8px'; 
            font-size: '13px'; 
          }
          .notes-list { 
            margin: '0'; 
            padding-left: '18px'; 
            color: '#856404'; 
          }
          .notes-list li { 
            margin-bottom: '4px'; 
            line-height: '1.4'; 
          }
          .print-info { 
            text-align: 'center'; 
            margin-top: '15px'; 
            font-size: '11px'; 
            color: '#666'; 
            font-style: 'italic'; 
          }
          .amount-in-words {
            font-size: '12px';
            font-style: 'italic';
            color: '#666';
            line-height: '1.3';
          }

          /* Column widths */
          .fee-table th:nth-child(1), .fee-table td:nth-child(1) { width: '10%'; }
          .fee-table th:nth-child(2), .fee-table td:nth-child(2) { width: '60%'; }
          .fee-table th:nth-child(3), .fee-table td:nth-child(3) { width: '30%'; text-align: 'right'; }
        </style>
      </head>
      <body>
        <div class="bill-container">
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

  // Function to create circular image for PDF
  const createCircularImage = (base64Data, size = 20) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = function() {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = size
        canvas.height = size
        
        // Create circular clipping path
        ctx.beginPath()
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()
        
        // Draw image
        ctx.drawImage(img, 0, 0, size, size)
        
        // Add border
        ctx.beginPath()
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
        ctx.strokeStyle = '#2c5aa0'
        ctx.lineWidth = 1.5
        ctx.stroke()
        
        resolve(canvas.toDataURL('image/png'))
      }
      img.src = base64Data
    })
  }

  // Professional PDF generation with CIRCULAR school photo
  const handleDownloadBill = async () => {
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

      // School Header with Logo
      const schoolName = schoolInfo.name || "SCHOOL NAME"
      const schoolAddress = schoolInfo.address || "SCHOOL ADDRESS"

      // Add circular school logo if available - ENHANCED WITH CIRCULAR FORMAT
      let currentY = 20
      const logoSize = 18 // mm
      
      if (schoolPhoto) {
        try {
          console.log("Creating circular school logo for PDF")
          
          // Create circular version of the logo
          const circularLogo = await createCircularImage(schoolPhoto, 100)
          
          // Extract base64 string without data URL prefix
          const base64String = circularLogo.replace(/^data:image\/(png|jpeg|jpg);base64,/, '')
          
          // Add circular logo to PDF - positioned neatly on the left
          doc.addImage(base64String, 'PNG', 20, currentY, logoSize, logoSize)
          console.log("Circular school logo added successfully to PDF")
          
        } catch (error) {
          console.log("Circular logo creation failed, using regular image:", error)
          try {
            // Fallback to regular image
            const base64String = schoolPhoto.replace(/^data:image\/(png|jpeg|jpg);base64,/, '')
            doc.addImage(base64String, 'JPEG', 20, currentY, logoSize, logoSize)
            
            // Add circular border manually
            doc.setDrawColor(...primaryColor)
            doc.setLineWidth(0.5)
            doc.circle(20 + logoSize/2, currentY + logoSize/2, logoSize/2)
          } catch (fallbackError) {
            console.log("Logo embedding failed completely:", fallbackError)
          }
        }
      }

      // School name and address - positioned to the right of the logo
      const textStartX = 20 + logoSize + 8 // 8mm gap after logo

      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(...primaryColor)

      // School name (centered but starting from textStartX)
      const schoolNameLines = doc.splitTextToSize(schoolName, 180 - textStartX)
      schoolNameLines.forEach((line, index) => {
        doc.text(line, textStartX, currentY + 5 + (index * 6))
      })

      const nameHeight = schoolNameLines.length * 6
      currentY += nameHeight + 2

      // School address
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100, 100, 100)

      const addressLines = doc.splitTextToSize(schoolAddress, 180 - textStartX)
      addressLines.forEach((line, index) => {
        doc.text(line, textStartX, currentY + (index * 4))
      })

      const addressHeight = addressLines.length * 4
      currentY = Math.max(currentY + addressHeight, 20 + logoSize) + 8

      // Bill Title
      doc.setFillColor(...primaryColor)
      doc.rect(15, currentY, 180, 7, 'F')
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(255, 255, 255)
      doc.text(isDuplicate ? 'DUPLICATE FEE RECEIPT' : 'OFFICIAL FEE RECEIPT', 105, currentY + 4, { align: "center" })

      currentY += 15

      // Student Details Section - COMPACT FOR SINGLE PAGE
      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(...primaryColor)
      doc.text("STUDENT INFORMATION", 20, currentY)
      doc.text("BILL INFORMATION", 110, currentY)

      currentY += 6
      doc.setFont("helvetica", "normal")
      doc.setTextColor(0, 0, 0)

      // Student Info - Compact layout
      const studentInfo = [
        `Admission No: ${billData.admissionNumber || 'N/A'}`,
        `Student Name: ${billData.studentName || 'N/A'}`,
        `Father Name: ${billData.fatherName || 'N/A'}`,
        `Class & Section: ${(billData.course || billData.standard || 'N/A')} - ${billData.section || 'N/A'}`
      ]

      studentInfo.forEach((info, index) => {
        const lines = doc.splitTextToSize(info, 80)
        lines.forEach((line, lineIndex) => {
          doc.text(line, 20, currentY + (index * 5) + (lineIndex * 3.5))
        })
      })

      // Bill Info - Compact layout
      const billInfo = [
        `Bill Number: ${billData.billNumber || 'N/A'}`,
        `Bill Date: ${formatDate(billData.billDate) || 'N/A'}`,
        `Payment Mode: ${billData.paymentMode || 'N/A'}`,
        `Reference No: ${billData.paymentNumber || 'N/A'}`
      ]

      billInfo.forEach((info, index) => {
        const lines = doc.splitTextToSize(info, 80)
        lines.forEach((line, lineIndex) => {
          doc.text(line, 110, currentY + (index * 5) + (lineIndex * 3.5))
        })
      })

      currentY += 25

      // Prepare table data with only paid fees
      const tableData = paidFees.map((fee, index) => [
        (index + 1).toString(),
        fee.heading || fee.feeHead || fee.description || 'Fee Item',
        currencySymbol + ' ' + Number.parseFloat(fee.paidAmount || fee.amount || 0).toFixed(2)
      ])

      // Add concession row if applicable
      // --- ADDED MINUS SIGN HERE FOR PDF ---
      if (totalConcession > 0) {
        tableData.push([
          (paidFees.length + 1).toString(),
          'Fee Concession',
          currencySymbol + ' -' + totalConcession.toFixed(2)
        ])
      }

      // Use autoTable for professional table formatting - COMPACT FOR SINGLE PAGE
      autoTable(doc, {
        startY: currentY,
        head: [['S.No', 'Fee Description', 'Amount (' + currencySymbol + ')']],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineColor: [200, 200, 200],
          lineWidth: 0.25,
          valign: 'middle'
        },
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 8
        },
        bodyStyles: {
          halign: 'left',
          fontSize: 8
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 120 },
          2: { cellWidth: 33, halign: 'right' }
        },
        margin: { left: 15, right: 15 },
        didDrawPage: function (data) {
          // Add total row manually relative to the table end
          const finalY = data.cursor ? data.cursor.y + 6 : 160

          // Amount in words
          doc.setFontSize(8)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(...primaryColor)
          doc.text('Total Amount in Words:', 20, finalY)

          doc.setFontSize(7)
          doc.setFont("helvetica", "italic")
          doc.setTextColor(100, 100, 100)

          const amountWords = numberToWords(netAmount) + " only"
          const amountLines = doc.splitTextToSize(amountWords, 120)
          amountLines.forEach((line, index) => {
            doc.text(line, 20, finalY + 3 + (index * 3))
          })

          // Net Amount with proper currency symbol
          doc.setFontSize(9)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(0, 0, 0)
          doc.text('Net Amount: ' + currencySymbol + ' ' + netAmount.toFixed(2), 165, finalY, { align: "right" })
        }
      })

      // Get final Y position after table
      let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 160

      // Signature section - COMPACT
      doc.setDrawColor(0, 0, 0)
      doc.line(120, finalY, 190, finalY)
      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(...primaryColor)
      doc.text('Authorized Signatory', 155, finalY + 4, { align: "center" })

      // Notes section - COMPACT
      const notesY = finalY + 10
      doc.setFillColor(255, 243, 205)
      doc.rect(15, notesY, 180, 20, 'F')
      doc.setDrawColor(255, 234, 167)
      doc.rect(15, notesY, 180, 20)

      doc.setFontSize(7)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(133, 100, 4)
      doc.text('IMPORTANT NOTES:', 20, notesY + 3)

      doc.setFont("helvetica", "normal")
      const notes = [
        '• This is a computer generated receipt',
        '• Preserve this receipt for future reference',
        '• Fee once paid will not be refunded',
        '• Contact accounts within 7 days for discrepancies'
      ]

      notes.forEach((note, index) => {
        doc.text(note, 20, notesY + 6 + (index * 3))
      })

      // Footer
      const footerY = 280
      doc.setFontSize(6)
      doc.setFont("helvetica", "italic")
      doc.setTextColor(100, 100, 100)
      doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')} | Operator: ${billData.operatorName || 'N/A'}`, 105, footerY, { align: "center" })

      // Add duplicate watermark
      if (isDuplicate) {
        doc.setFontSize(50)
        doc.setTextColor(200, 200, 200)
        doc.setFont("helvetica", "bold")
        doc.text("DUPLICATE", 105, 150, {
          align: "center",
          angle: 45,
        })
      }

      // Save the PDF
      doc.save(`Fee_Receipt_${(billData.billNumber || 'receipt').replace(/\//g, '_')}.pdf`)

    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Error generating PDF. Please try again.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Fetch school photo when modal opens
  useEffect(() => {
    if (show && schoolId) {
      fetchSchoolPhoto()
    }
  }, [show, schoolId])

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
          {isDuplicate ? "Duplicate Bill Preview" : "Bill Receipt Preview"}
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
          {/* ENHANCED PREVIEW CONTENT WITH SCHOOL PHOTO */}
          <div
            ref={billPreviewRef}
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

            {/* School Header with Circular Logo */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
                borderBottom: '2px solid #2c5aa0',
                paddingBottom: '12px',
                marginBottom: '20px',
                textAlign: 'center'
              }}
            >
              {loadingSchoolPhoto ? (
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f8f9fa',
                    flexShrink: 0,
                    border: '3px solid #2c5aa0'
                  }}
                >
                  <Spinner animation="border" size="sm" variant="primary" />
                </div>
              ) : schoolPhoto ? (
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '3px solid #2c5aa0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'white',
                    flexShrink: 0
                  }}
                >
                  <img 
                    src={schoolPhoto} 
                    alt="School Logo" 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      console.error("School photo failed to load")
                      e.target.style.display = 'none'
                    }}
                    onLoad={() => console.log("School photo loaded successfully")}
                  />
                </div>
              ) : null}
              <div style={{ flex: 1 }}>
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
            </div>

            {/* Rest of the bill content remains the same */}
            {/* Bill Title */}
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
              {isDuplicate ? 'DUPLICATE FEE RECEIPT' : 'OFFICIAL FEE RECEIPT'}
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
                    {billData.admissionNumber}
                  </span>
                </div>
                <div style={{ display: 'flex', marginBottom: '8px', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '600', color: '#555', minWidth: '120px', fontSize: '13px' }}>Student Name:</span>
                  <span style={{ color: '#333', fontWeight: '500', flex: '1', fontSize: '13px', wordBreak: 'break-word' }}>
                    {billData.studentName}
                  </span>
                </div>
                <div style={{ display: 'flex', marginBottom: '8px', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '600', color: '#555', minWidth: '120px', fontSize: '13px' }}>Father Name:</span>
                  <span style={{ color: '#333', fontWeight: '500', flex: '1', fontSize: '13px', wordBreak: 'break-word' }}>
                    {billData.fatherName}
                  </span>
                </div>
                <div style={{ display: 'flex', marginBottom: '8px', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '600', color: '#555', minWidth: '120px', fontSize: '13px' }}>Class & Section:</span>
                  <span style={{ color: '#333', fontWeight: '500', flex: '1', fontSize: '13px', wordBreak: 'break-word' }}>
                    {billData.course || billData.standard} - {billData.section}
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
                  BILL INFORMATION
                </h4>
                <div style={{ display: 'flex', marginBottom: '8px', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '600', color: '#555', minWidth: '120px', fontSize: '13px' }}>Bill Number:</span>
                  <span style={{ color: '#333', fontWeight: '500', flex: '1', fontSize: '13px', wordBreak: 'break-word' }}>
                    {billData.billNumber}
                  </span>
                </div>
                <div style={{ display: 'flex', marginBottom: '8px', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '600', color: '#555', minWidth: '120px', fontSize: '13px' }}>Bill Date:</span>
                  <span style={{ color: '#333', fontWeight: '500', flex: '1', fontSize: '13px', wordBreak: 'break-word' }}>
                    {formatDate(billData.billDate)}
                  </span>
                </div>
                <div style={{ display: 'flex', marginBottom: '8px', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '600', color: '#555', minWidth: '120px', fontSize: '13px' }}>Payment Mode:</span>
                  <span style={{ color: '#333', fontWeight: '500', flex: '1', fontSize: '13px', wordBreak: 'break-word' }}>
                    {billData.paymentMode}
                  </span>
                </div>
                <div style={{ display: 'flex', marginBottom: '8px', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '600', color: '#555', minWidth: '120px', fontSize: '13px' }}>Reference No:</span>
                  <span style={{ color: '#333', fontWeight: '500', flex: '1', fontSize: '13px', wordBreak: 'break-word' }}>
                    {billData.paymentNumber || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Fee Table - ONLY SHOW PAID FEES */}
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
                    Fee Description
                  </th>
                  <th style={{ background: '#2c5aa0', color: 'white', padding: '10px 8px', textAlign: 'right', fontWeight: '600', border: '1px solid #1e3a6b', fontSize: '13px', width: '30%' }}>
                    Amount (₹)
                  </th>
                </tr>
              </thead>
              <tbody>
                {paidFees.map((fee, index) => (
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
                {totalConcession > 0 && (
                  <tr>
                    <td style={{ padding: '8px 6px', border: '1px solid #ddd', verticalAlign: 'top', fontSize: '13px', textAlign: 'center' }}>
                      {paidFees.length + 1}
                    </td>
                    <td style={{ padding: '8px 6px', border: '1px solid #ddd', verticalAlign: 'top', fontSize: '13px' }}>
                      Fee Concession
                    </td>
                    {/* ADDED MINUS SIGN HERE FOR PREVIEW */}
                    <td style={{ padding: '8px 6px', border: '1px solid #ddd', verticalAlign: 'top', fontSize: '13px', textAlign: 'right', color: '#dc3545', fontWeight: 'bold' }}>
                       - ₹ {totalConcession.toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot style={{ background: '#e9ecef', fontWeight: 'bold' }}>
                <tr style={{ background: '#e3f2fd' }}>
                  <td colSpan="2" style={{ padding: '12px 8px', border: '1px solid #ddd', fontSize: '13px', borderTop: '2px solid #2c5aa0' }}>
                    <strong>Total Amount in Words:</strong><br />
                    <em style={{ fontSize: '12px', fontStyle: 'italic', color: '#666', lineHeight: '1.3' }}>
                      {numberToWords(netAmount)} only
                    </em>
                  </td>
                  <td style={{ padding: '12px 8px', border: '1px solid #ddd', fontSize: '13px', textAlign: 'right', borderTop: '2px solid #2c5aa0' }}>
                    <strong>Net Amount: ₹ {netAmount.toFixed(2)}</strong>
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
                Authorized Signatory
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
                IMPORTANT NOTES:
              </div>
              <ol
                style={{
                  margin: '0',
                  paddingLeft: '18px',
                  color: '#856404'
                }}
              >
                <li style={{ marginBottom: '4px', lineHeight: '1.4' }}>This is a computer generated receipt and does not require signature.</li>
                <li style={{ marginBottom: '4px', lineHeight: '1.4' }}>Please preserve this receipt for future reference.</li>
                <li style={{ marginBottom: '4px', lineHeight: '1.4' }}>Fee once paid will not be refunded or adjusted under any circumstances.</li>
                <li style={{ marginBottom: '4px', lineHeight: '1.4' }}>For any discrepancy, please contact accounts department within 7 days.</li>
                <li style={{ marginBottom: '4px', lineHeight: '1.4' }}>Cheques are subject to realization. Bounced cheques will attract penalty.</li>
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
              Generated on {new Date().toLocaleDateString('en-IN')} at {new Date().toLocaleTimeString('en-IN')} | Operator: {billData.operatorName}
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
              onClick={handlePrintBill}
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
              onClick={handleDownloadBill}
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

export default BillPreviewModal