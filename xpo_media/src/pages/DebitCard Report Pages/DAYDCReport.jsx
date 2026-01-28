import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainContentPage from "../../components/MainContent/MainContentPage";
import { Card, Form, Button, Table, Spinner, Container } from "react-bootstrap";
import { useAuthContext } from "../../Context/AuthContext";
import { ENDPOINTS } from "../../SpringBoot/config";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaPrint, FaFilePdf, FaFileExcel, FaFileAlt, FaRedo } from "react-icons/fa";
import * as XLSX from "xlsx";

const DayDCReport = () => {
  // 1. Get currentAcademicYear from AuthContext
  const { schoolId, getAuthHeaders, currentAcademicYear } = useAuthContext();
   
  const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(getTodayDate());
  const [reportType, setReportType] = useState("ACADEMIC");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
   
  const [showOpening, setShowOpening] = useState(true);
  const [showClosing, setShowClosing] = useState(true);

  // Default empty
  const [schoolInfo, setSchoolInfo] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: ""
  });
    
  useEffect(() => {
    if (schoolId) {
      fetchSchoolInfo();
    }
  }, [schoolId]);

  const fetchSchoolInfo = async () => {
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/school/school-details?schoolId=${schoolId}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSchoolInfo({
          name: data.schoolName || "School Name Not Available",
          address: data.schoolAddress || "",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || "",
          phone: data.phone || "",
          email: data.email || ""
        });
      } else {
        setSchoolInfo(prev => ({ ...prev, name: "School Name Not Available" }));
      }
    } catch (error) {
      console.error("Error fetching school information:", error);
      setSchoolInfo(prev => ({ ...prev, name: "School Name Not Available" }));
    }
  };

  const formatDateForHeader = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
    return `${day}/${month}/${year} (${dayName})`;
  };

  const formatDateForFilename = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const fetchData = async () => {
    if (!schoolId) {
      toast.error("School ID not available");
      return;
    }
    // 2. Validate Academic Year existence
    if (!currentAcademicYear) {
      toast.error("Academic Year not set. Please update settings.");
      return;
    }
    
    setLoading(true);
    try {
      // 3. Pass academicYear to backend
      const response = await fetch(
        `${ENDPOINTS.reports}/debit-credit/day-ledger?schoolId=${schoolId}&date=${date}&type=${reportType}&academicYear=${currentAcademicYear}`,
        { headers: getAuthHeaders() }
      );
      if (response.ok) {
        const result = await response.json();
        setData(result);
        
        if (result.length === 0) {
          toast.info("No transactions found for this date");
        } else {
          toast.success(`Found ${result.length} transactions`);
        }
      } else {
        setData([]);
        toast.error("Failed to fetch day ledger");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const getProcessedData = () => {
    let sNoCounter = 1;
    
    return data.filter(row => {
      if (row.mode === "HEADER") return true;
      if (row.ledger && row.ledger.toLowerCase().includes("opening") && !showOpening) return false;
      if (row.ledger && row.ledger.toLowerCase().includes("closing") && !showClosing) return false;
      return true;
    }).map(row => {
        if (row.mode === "HEADER") {
            return { ...row, displaySNo: "" };
        }
        return { ...row, displaySNo: sNoCounter++ };
    });
  };

  const displayedData = getProcessedData();

  const handlePrint = () => {
    if (displayedData.length === 0) {
      toast.error("No data to print");
      return;
    }

    const printContent = document.getElementById('daybook-report-content');
    if (!printContent) {
      toast.error("Report content not found");
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1123,height=794'); // A4 Pixel approx
    if (!printWindow) {
      toast.error("Please allow pop-ups for printing");
      return;
    }

    const styles = `
      @page { 
        size: 297mm 210mm; /* Strict A4 Landscape */
        margin: 10mm; 
      }
      @media print {
        body { 
          margin: 0; 
          padding: 0; 
          font-family: "Times New Roman", serif; 
          background: white; 
          width: 277mm; /* 297mm - 20mm margins */
        }
      }
      body { 
        margin: 0; 
        padding: 0; 
        font-family: "Times New Roman", serif; 
        background: white; 
      }
      .print-container { 
        width: 100%; 
        margin: 0 auto; 
      }
      .report-header { 
        text-align: center; 
        margin-bottom: 10px; 
        border-bottom: 2px solid #0B3D7B; 
        padding-bottom: 5px; 
      }
      .school-name { 
        font-size: 18px; 
        font-weight: bold; 
        color: #0B3D7B; 
        margin: 0 0 3px 0; 
        letter-spacing: 1px; 
        text-transform: uppercase; 
      }
      .school-address { 
        font-size: 12px; 
        font-weight: bold; 
        margin: 0 0 8px 0; 
      }
      .report-title { 
        font-size: 14px; 
        font-weight: bold; 
        margin: 8px 0; 
        color: #0B3D7B; 
      }
      .report-date { 
        font-size: 12px; 
        font-weight: bold; 
        margin: 3px 0 10px 0; 
      }
      .date-value { 
        color: #dc3545; 
      }
      .report-table { 
        width: 100%; 
        border-collapse: collapse; 
        font-size: 10px; 
        margin-top: 8px;
        table-layout: fixed;
      }
      .report-table th, .report-table td { 
        border: 1px solid #000; 
        padding: 4px; 
        text-align: center; 
        vertical-align: top; 
        word-wrap: break-word;
      }
      .report-table th { 
        background-color: #0B3D7B !important; 
        color: white !important; 
        font-weight: bold; 
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact; 
        font-size: 11px;
      }
      .report-table tbody tr:nth-child(odd) { 
        background-color: #f8f9fa; 
      }
      .text-end { text-align: right !important; }
      .text-center { text-align: center !important; }
      .text-start { text-align: left !important; }
      .horizontal-line { 
        border-top: 2px solid #0B3D7B; 
        margin: 8px auto; 
        width: 80%; 
        opacity: 0.75; 
      }
      .small-text { 
        font-size: 9px; 
        display: block; 
      }
      .header-row td { 
        background-color: #fff !important; 
        font-weight: bold; 
        text-decoration: underline; 
        font-size: 12px; 
        text-align: left !important; 
        padding-top: 10px !important; 
        padding-bottom: 5px !important;
        border-left: 0 !important; 
        border-right: 0 !important; 
        border-top: 0 !important; 
      }
      
      /* Signatures */
      .signatures-container { 
        margin-top: 30px; 
        font-weight: bold; 
        color: blue; 
        width: 100%; 
        page-break-inside: avoid;
      }
      .sig-row-1 { 
        display: flex; 
        justify-content: space-between; 
        padding: 0 30px; 
        font-size: 11px;
      }
      .sig-row-2 { 
        text-align: center; 
        margin-top: 25px; 
        font-size: 11px;
      }
    `;
    
    const signatureHTML = `
      <div class="signatures-container">
        <div class="sig-row-1">
          <span>Treasurer</span>
          <span>Secretary</span>
        </div>
        <div class="sig-row-2">
          <span>Manager/Accountant</span>
        </div>
      </div>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>DayBook Report - ${formatDateForFilename(date)}</title>
          <style>${styles}</style>
        </head>
        <body>
          <div class="print-container">
            ${printContent.innerHTML}
            ${signatureHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { 
                window.focus(); 
                window.print(); 
                setTimeout(function() {
                  window.close();
                }, 100);
              }, 250);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const generatePDF = () => {
    return new Promise((resolve, reject) => {
      try {
        // A4 landscape dimensions: 297mm x 210mm
        const doc = new jsPDF({ 
          orientation: 'landscape', 
          unit: 'mm', 
          format: [297, 210], // Explicitly setting dimensions
          compress: true
        });
        
        const pageWidth = 297; 
        const pageHeight = 210; 
        const margin = 10;
        const primaryColor = [11, 61, 123];
        
        // Set default font
        doc.setFont("helvetica");
        
        // Header
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...primaryColor);
        doc.text(schoolInfo.name, pageWidth / 2, 15, { align: "center" });
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(schoolInfo.address, pageWidth / 2, 22, { align: "center" });
        
        // Report Title
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...primaryColor);
        doc.text("DAY BOOK REPORT", pageWidth / 2, 32, { align: "center" });
        
        // Date
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        const dateStr = formatDateForHeader(date);
        doc.text(`Date: ${dateStr}`, pageWidth / 2, 39, { align: "center" });
        
        // Line separator
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.5);
        doc.line(margin, 44, pageWidth - margin, 44);
        
        // Table columns
        const tableColumns = [
          "SNo", 
          "Particulars-1", 
          "Particulars-2", 
          "Particulars-3", 
          "Bill/V.No.", 
          "Credit", 
          "Debit"
        ];

        // Prepare table data
        const tableRows = [];
        
        displayedData.forEach((row) => {
           if(row.mode === 'HEADER') {
             // Header row with colspan
             tableRows.push([
               { 
                 content: row.ledger, 
                 colSpan: 7, 
                 styles: { 
                   fontStyle: 'bold', 
                   fontSize: 9, 
                   textColor: [0,0,0], 
                   fillColor: [255, 255, 255],
                   cellPadding: { top: 5, bottom: 2 }
                 } 
               }
             ]);
           } else {
             tableRows.push([
               row.displaySNo || '',
               row.ledger || '', 
               `${row.name || ''}\n${row.operatorName || ''}`, 
               `${row.admissionNumber && row.admissionNumber !== "N/A" ? 'Admn.No. ' + row.admissionNumber : ''}\n${row.description || ''}`,
               row.brNumber || '',
               row.credit > 0 ? parseFloat(row.credit).toFixed(2) : "",
               row.debit > 0 ? parseFloat(row.debit).toFixed(2) : ""
             ]);
           }
        });

        // Generate table
        autoTable(doc, {
          head: [tableColumns],
          body: tableRows,
          startY: 48,
          theme: 'grid',
          styles: { 
            fontSize: 8, 
            cellPadding: 1.5, 
            lineColor: [0, 0, 0], 
            lineWidth: 0.1, 
            textColor: [0, 0, 0], 
            valign: 'top',
            overflow: 'linebreak'
          },
          headStyles: { 
            fillColor: primaryColor, 
            textColor: [255, 255, 255], 
            fontStyle: 'bold', 
            halign: 'center',
            fontSize: 9
          },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 45, halign: 'left' },
            2: { cellWidth: 40, halign: 'left' },
            3: { cellWidth: 40, halign: 'left' },
            4: { cellWidth: 25, halign: 'center' },
            5: { cellWidth: 25, halign: 'right' },
            6: { cellWidth: 25, halign: 'right' }
          },
          margin: { left: margin, right: margin },
          pageBreak: 'auto',
          tableWidth: 'wrap'
        });

        // Add Signatures
        const finalY = doc.lastAutoTable.finalY + 15;
        
        if (finalY < pageHeight - 20) {
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 255);
          doc.setFont("helvetica", "bold");
          
          doc.text("Treasurer", margin + 20, finalY);
          doc.text("Secretary", pageWidth - margin - 30, finalY);
          doc.text("Manager/Accountant", pageWidth / 2, finalY + 15, { align: "center" });
        }
        
        resolve(doc);
      } catch (error) {
        console.error("PDF Generation Error:", error);
        reject(error);
      }
    });
  };

  const downloadPDF = async () => {
    if (displayedData.length === 0) return toast.error("No data available");
    setProcessing(true);
    try {
      const doc = await generatePDF();
      doc.save(`DayBook-Report-${formatDateForFilename(date)}.pdf`);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("PDF Download Error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setProcessing(false);
    }
  };

  // *** FIXED EXPORT TO EXCEL FUNCTION ***
  const exportToExcel = () => {
    if (displayedData.length === 0) return toast.error("No data to export");
    
    setProcessing(true);
    
    try {
      const wb = XLSX.utils.book_new();
      wb.Props = {
        Title: "Day Book Report",
        Subject: "Financial Report",
        Author: "School ERP",
        CreatedDate: new Date()
      };

      // 1. Prepare static header rows
      const excelData = [];
      excelData.push([schoolInfo.name.toUpperCase()]); // Row 0
      excelData.push([schoolInfo.address]);             // Row 1
      excelData.push([]);                               // Row 2 (Spacer)
      excelData.push(["DAY BOOK REPORT"]);              // Row 3
      excelData.push([`Date: ${formatDateForHeader(date)}`]); // Row 4
      excelData.push([]);                               // Row 5 (Spacer)
      
      // Row 6: Column Headers
      excelData.push([
        "SNo", 
        "Particulars-1", 
        "Particulars-2", 
        "Particulars-3", 
        "Bill/V.No.", 
        "Credit", 
        "Debit"
      ]);

      // 2. Initialize merge cells with Static Header merges
      // We know exactly where these are.
      const mergeCells = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // School name
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Address
        { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } }, // Report title
        { s: { r: 4, c: 0 }, e: { r: 4, c: 6 } }  // Date
      ];

      // 3. Populate data rows and track dynamic merges
      // Start tracking content from Row 7 (index 7)
      let currentRowIndex = 7;

      displayedData.forEach(row => {
        if (row.mode === "HEADER") {
          // Add spacing row before sub-header
          excelData.push([]); 
          currentRowIndex++; // Increment for spacer

          // Add the Sub-Header Row
          excelData.push([row.ledger, "", "", "", "", "", ""]);
          
          // Push the merge for this specific row only
          mergeCells.push({ 
              s: { r: currentRowIndex, c: 0 }, 
              e: { r: currentRowIndex, c: 6 } 
          });
          
          currentRowIndex++; // Increment for header
        } else {
          // Standard Data Row
          excelData.push([
            row.displaySNo || '',
            row.ledger || '',
            `${row.name || ''}${row.operatorName ? ' - ' + row.operatorName : ''}`,
            `${row.admissionNumber && row.admissionNumber !== "N/A" ? 'Admn.No. ' + row.admissionNumber : ''}${row.description ? '\n' + row.description : ''}`,
            row.brNumber || '',
            row.credit > 0 ? parseFloat(row.credit).toFixed(2) : '',
            row.debit > 0 ? parseFloat(row.debit).toFixed(2) : ''
          ]);
          currentRowIndex++;
        }
      });

      // 4. Create Sheet
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // 5. Apply widths
      const colWidths = [
        { wch: 8 },   // SNo
        { wch: 35 },  // Particulars-1
        { wch: 30 },  // Particulars-2
        { wch: 30 },  // Particulars-3
        { wch: 15 },  // Bill/V.No.
        { wch: 15 },  // Credit
        { wch: 15 }   // Debit
      ];
      ws['!cols'] = colWidths;

      // 6. Apply the clean merge array
      ws['!merges'] = mergeCells;

      // 7. Write and Download
      XLSX.utils.book_append_sheet(wb, ws, "Day Book Report");
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `DayBook-Report-${formatDateForFilename(date)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Excel file exported successfully");
    } catch (error) {
      console.error("Excel Export Error:", error);
      toast.error("Failed to export Excel file");
    } finally {
      setProcessing(false);
    }
  };

  const s2ab = (s) => {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
  };

  const resetFilters = () => {
    setDate(getTodayDate());
    setData([]);
    setShowOpening(true);
    setShowClosing(true);
  };

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <div className="mb-4 d-print-none">
          <nav className="d-flex custom-breadcrumb py-1 py-lg-3 align-items-center">
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <div>Debit / Credit Report</div>
            <span className="separator mx-2">&gt;</span>
            <span>Day Book</span>
          </nav>
        </div>

        <Card className="shadow-sm">
          <Card.Header className="custom-btn-clr text-white d-flex justify-content-between align-items-center d-print-none">
            <h5 className="mb-0">Day Book Report</h5>
            <div className="d-flex gap-2">
              <Button 
                size="sm" 
                variant={reportType === "ACADEMIC" ? "light" : "outline-light"} 
                onClick={() => { setReportType("ACADEMIC"); setData([]); }}
              >
                Academic
              </Button>
              <Button 
                size="sm" 
                variant={reportType === "MISC" ? "light" : "outline-light"} 
                onClick={() => { setReportType("MISC"); setData([]); }}
              >
                Miscellaneous
              </Button>
              <Button size="sm" variant="outline-light" onClick={resetFilters}>
                <FaRedo className="me-1" /> Reset
              </Button>
            </div>
          </Card.Header>
          
          <Card.Body>
            <div className="row g-3 mb-4 d-print-none">
              <div className="col-md-3">
                <Form.Label>Select Date</Form.Label>
                <Form.Control 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  max={new Date().toISOString().split("T")[0]} 
                />
              </div>

              <div className="col-md-4 d-flex align-items-end">
                <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-3 w-100">
                  <div className="d-flex align-items-center">
                    <Form.Check 
                      type="checkbox" 
                      id="check-opening" 
                      className="me-2"
                      checked={showOpening} 
                      onChange={(e) => setShowOpening(e.target.checked)} 
                    />
                    <Form.Label htmlFor="check-opening" className="mb-0 fw-semibold">
                      Opening Balance
                    </Form.Label>
                  </div>
                  <div className="d-flex align-items-center">
                    <Form.Check 
                      type="checkbox" 
                      id="check-closing" 
                      className="me-2"
                      checked={showClosing} 
                      onChange={(e) => setShowClosing(e.target.checked)} 
                    />
                    <Form.Label htmlFor="check-closing" className="mb-0 fw-semibold">
                      Closing Balance
                    </Form.Label>
                  </div>
                </div>
              </div>

              <div className="col-md-2 d-flex align-items-end">
                <Button 
                  className="custom-btn-clr w-100" 
                  onClick={fetchData} 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="me-2" /> Loading...
                    </>
                  ) : (
                    <>
                      <FaFileAlt className="me-2" /> Generate
                    </>
                  )}
                </Button>
              </div>
              
              {displayedData.length > 0 && (
                <div className="col-md-3 d-flex align-items-end justify-content-end gap-2">
                  <Button 
                    variant="outline-primary" 
                    onClick={handlePrint} 
                    disabled={processing}
                    title="Print Report"
                  >
                    <FaPrint />
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    onClick={downloadPDF} 
                    disabled={processing}
                    title="Download PDF"
                  >
                    <FaFilePdf />
                  </Button>
                  <Button 
                    variant="outline-success" 
                    onClick={exportToExcel} 
                    disabled={processing}
                    title="Export to Excel"
                  >
                    <FaFileExcel />
                  </Button>
                </div>
              )}
            </div>

            {/* PRINTABLE AREA */}
            <div id="daybook-report-content" className="p-2 bg-white">
              <div className="text-center mb-3">
                <h5 className="fw-bold text-uppercase mb-1 school-name" style={{ letterSpacing: "1px", color: "#0B3D7B" }}>
                  {schoolInfo.name}
                </h5>
                <h6 className="fw-bold mb-3 school-address" style={{ fontSize: "0.85rem" }}>
                  {schoolInfo.address}
                  {[schoolInfo.city, schoolInfo.state, schoolInfo.pincode].filter(Boolean).join(', ')}
                </h6>
                <div className="d-flex justify-content-center align-items-center">
                  <h6 className="fw-bold text-primary mb-0 report-title" style={{ fontSize: "0.95rem" }}>
                    Day Book on : <span className="text-danger date-value">{formatDateForHeader(date)}</span>
                  </h6>
                </div>
                <div className="horizontal-line"></div>
              </div>

              <div className="table-responsive">
                <Table bordered size="sm" className="align-middle border-dark report-table">
                  <thead className="text-center align-middle" style={{ borderBottom: "2px solid black" }}>
                    <tr>
                      <th style={{ width: "5%", fontSize: "0.85rem" }}>SNo</th>
                      <th style={{ width: "25%", fontSize: "0.85rem" }}>Particulars-1</th>
                      <th style={{ width: "20%", fontSize: "0.85rem" }}>Particulars-2</th>
                      <th style={{ width: "20%", fontSize: "0.85rem" }}>Particulars-3</th>
                      <th style={{ width: "10%", fontSize: "0.85rem" }}>Bill/V.No.</th>
                      <th style={{ width: "10%", fontSize: "0.85rem" }}>Credit</th>
                      <th style={{ width: "10%", fontSize: "0.85rem" }}>Debit</th>
                    </tr>
                  </thead>
                  <tbody className="fw-semibold" style={{ fontSize: "0.8rem" }}>
                    {displayedData.length > 0 ? (
                      displayedData.map((row, idx) => {
                          const isSystem = row.mode === "SYSTEM";
                          const isHeader = row.mode === "HEADER";

                          if (isHeader) {
                            return (
                                <tr key={idx} className="header-row">
                                    <td className="text-center"></td>
                                    <td className="text-start" colSpan={6} style={{ fontSize: "0.9rem" }}>
                                        <strong>{row.ledger}</strong>
                                    </td>
                                </tr>
                            )
                          }

                          return (
                            <tr key={idx} style={isSystem ? { backgroundColor: '#e3f2fd' } : {}}>
                              <td className="text-center">{row.displaySNo}</td>
                              <td className={`text-start ${isSystem ? 'fw-bold' : ''}`}>
                                {row.ledger}
                              </td>
                              <td className="text-start">
                                {row.name && <div>{row.name}</div>}
                                {row.operatorName && <div className="small-text text-muted">{row.operatorName}</div>}
                              </td>
                              <td className="text-start">
                                {row.admissionNumber && row.admissionNumber !== "N/A" && (
                                  <div>Admn.No. {row.admissionNumber}</div>
                                )}
                                {row.description && <div className="small-text">{row.description}</div>}
                              </td>
                              <td className="text-center">{row.brNumber}</td>
                              <td className="text-end fw-bold">
                                {row.credit > 0 ? parseFloat(row.credit).toFixed(2) : ""}
                              </td>
                              <td className="text-end fw-bold">
                                {row.debit > 0 ? parseFloat(row.debit).toFixed(2) : ""}
                              </td>
                            </tr>
                          );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-5 text-muted">
                          No transactions found for this date.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          </Card.Body>
        </Card>
        <ToastContainer position="top-right" autoClose={3000} />
      </Container>
      
      <style>{`
        .small-text { font-size: 0.75em; }
        .header-row td { 
          background-color: #fff !important; 
          font-weight: bold; 
          text-decoration: underline; 
          padding-top: 10px !important; 
          padding-bottom: 5px !important;
        }
        @media screen {
          .custom-btn-clr { 
            background-color: #0B3D7B; 
            border-color: #0B3D7B; 
            color: white; 
          }
          .custom-btn-clr:hover { 
            background-color: #092c5a; 
            border-color: #092c5a; 
          }
          .school-name { color: #0B3D7B !important; }
          .horizontal-line { 
            border-top: 2px solid #0B3D7B; 
            margin: 10px auto; 
            width: 50%; 
            opacity: 0.75; 
          }
          .date-value { color: #dc3545 !important; }
          .report-table th { 
            background-color: #0B3D7B !important; 
            color: white !important; 
          }
          .report-table tbody tr:nth-child(odd) { 
            background-color: #f8f9fa; 
          }
        }
        @media print {
          .d-print-none { display: none !important; }
          body { 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        .form-check-input:checked {
          background-color: #0B3D7B;
          border-color: #0B3D7B;
        }
      `}</style>
    </MainContentPage>
  );
};

export default DayDCReport;