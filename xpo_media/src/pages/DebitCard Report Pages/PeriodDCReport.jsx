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
import * as XLSX from "xlsx";
import { FaPrint, FaFilePdf, FaFileExcel, FaFileAlt, FaRedo } from "react-icons/fa";

const PeriodDCReport = () => {
  // 1. Get currentAcademicYear from AuthContext
  const { schoolId, getAuthHeaders, currentAcademicYear } = useAuthContext();
   
  const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [fromDate, setFromDate] = useState(getTodayDate());
  const [toDate, setToDate] = useState(getTodayDate());
  const [reportType, setReportType] = useState("ACADEMIC");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
   
  // School Info for Header
  const [schoolInfo, setSchoolInfo] = useState({
    name: "", address: "", city: "", state: "", pincode: "", phone: "", email: ""
  });
    
  useEffect(() => {
    if (schoolId) fetchSchoolInfo();
  }, [schoolId]);

  const fetchSchoolInfo = async () => {
    try {
      const response = await fetch(`${ENDPOINTS.admissionmaster}/school/school-details?schoolId=${schoolId}`, {
         method: "GET", headers: getAuthHeaders(),
      });
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
      }
    } catch (error) { console.error(error); }
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateForFilename = () => {
    return `${fromDate}_to_${toDate}`;
  };

  const fetchData = async () => {
    if (!schoolId) return toast.error("School ID not available");
    // 2. Validate Academic Year existence
    if (!currentAcademicYear) return toast.error("Academic Year not set. Please check settings.");

    setLoading(true);
    try {
      // 3. Pass academicYear to backend
      const response = await fetch(
        `${ENDPOINTS.reports}/debit-credit/period-ledger?schoolId=${schoolId}&fromDate=${fromDate}&toDate=${toDate}&type=${reportType}&academicYear=${currentAcademicYear}`,
        { headers: getAuthHeaders() }
      );
      if (response.ok) {
        const result = await response.json();
        setData(result);
        if(result.length === 0) toast.info("No records found");
        else toast.success(`Found ${result.length} entries`);
      } else {
        setData([]);
        toast.error("Failed to fetch data");
      }
    } catch (error) { toast.error("Server Error"); } 
    finally { setLoading(false); }
  };

  // Calculate Totals (Logic Preserved)
  const totalReceipts = data.reduce((sum, row) => sum + (row.credit || 0), 0);
  const totalPayments = data.reduce((sum, row) => sum + (row.debit || 0), 0);
  const closingBalance = totalReceipts - totalPayments;

  // --- PRINT FUNCTIONALITY ---
  const handlePrint = () => {
    if (data.length === 0) return toast.error("No data to print");

    const printContent = document.getElementById('period-report-content');
    if (!printContent) return toast.error("Report content not found");

    const printWindow = window.open('', '_blank', 'width=1123,height=794');
    
    const styles = `
      @page { size: A4 landscape; margin: 10mm; }
      @media print {
        body { margin: 0; padding: 0; font-family: "Times New Roman", serif; background: white; }
      }
      body { margin: 0; padding: 0; font-family: "Times New Roman", serif; }
      .print-container { width: 100%; margin: 0 auto; }
       
      .report-header { text-align: center; margin-bottom: 10px; border-bottom: 2px solid #0B3D7B; padding-bottom: 5px; }
      .school-name { font-size: 18px; font-weight: bold; color: #0B3D7B; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
      .school-address { font-size: 12px; font-weight: bold; margin: 0 0 8px 0; }
      .report-title { font-size: 14px; font-weight: bold; margin: 8px 0; color: #0B3D7B; }
      .date-value { color: #dc3545; }
       
      .report-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 10px; table-layout: fixed; }
      .report-table th, .report-table td { border: 1px solid #000; padding: 5px; text-align: center; vertical-align: top; word-wrap: break-word; }
      .report-table th { background-color: #0B3D7B !important; color: white !important; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 11px; }
      .report-table tbody tr:nth-child(odd) { background-color: #f8f9fa; }
       
      .text-end { text-align: right !important; }
      .text-start { text-align: left !important; }
      .text-center { text-align: center !important; }
      .fw-bold { font-weight: bold; }
       
      /* Signatures */
      .signatures-container { margin-top: 30px; font-weight: bold; color: blue; width: 100%; page-break-inside: avoid; }
      .sig-row-1 { display: flex; justify-content: space-between; padding: 0 30px; font-size: 11px; }
      .sig-row-2 { text-align: center; margin-top: 25px; font-size: 11px; }
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
          <title>Period Report - ${formatDateForFilename()}</title>
          <style>${styles}</style>
        </head>
        <body>
          <div class="print-container">
            ${printContent.innerHTML}
            ${signatureHTML}
          </div>
          <script>
            window.onload = function() { 
                setTimeout(function() { window.focus(); window.print(); setTimeout(function() { window.close(); }, 100); }, 250);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // --- PDF GENERATION ---
  const generatePDF = () => {
    return new Promise((resolve, reject) => {
      try {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
        const pageWidth = 297; 
        const pageHeight = 210;
        const margin = 10;
        const primaryColor = [11, 61, 123];
        
        // Header
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...primaryColor);
        doc.text(schoolInfo.name, pageWidth / 2, 15, { align: "center" });
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(schoolInfo.address, pageWidth / 2, 22, { align: "center" });

        // Title & Date
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...primaryColor);
        doc.text("PERIOD TRANSACTION REPORT", pageWidth / 2, 32, { align: "center" });
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`From: ${formatDateForDisplay(fromDate)}  To: ${formatDateForDisplay(toDate)}`, pageWidth / 2, 39, { align: "center" });
        
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.5);
        doc.line(margin, 44, pageWidth - margin, 44);

        // Columns
        const tableColumns = ["Date", "Particulars", "Description", "Student/Staff", "Bill/Rec.No", "Payment (Dr)", "Receipt (Cr)"];
        const tableRows = [];
        let lastPdfDate = "";

        data.forEach(row => {
           const isOpening = row.mode === "OPENING";
           const rowDate = isOpening ? formatDateForDisplay(fromDate) : formatDateForDisplay(row.date);
           const showDate = rowDate !== lastPdfDate;
           if(showDate) lastPdfDate = rowDate;

           tableRows.push([
               showDate ? rowDate : "",
               row.ledger || "",
               row.description || "",
               `${row.name || ""}${row.operatorName ? "\nUser: " + row.operatorName : ""}`,
               row.brNumber === "0" ? "" : row.brNumber,
               row.debit > 0 ? parseFloat(row.debit).toFixed(2) : "",
               row.credit > 0 ? parseFloat(row.credit).toFixed(2) : ""
           ]);
        });

        // Totals Row
        tableRows.push([
           { content: "TOTALS:", colSpan: 5, styles: { fontStyle: 'bold', halign: 'right' } },
           { content: totalPayments.toFixed(2), styles: { fontStyle: 'bold', halign: 'right' } },
           { content: totalReceipts.toFixed(2), styles: { fontStyle: 'bold', halign: 'right' } }
        ]);

        // Closing Balance Row
        tableRows.push([
           { content: "CLOSING BALANCE:", colSpan: 6, styles: { fontStyle: 'bold', halign: 'right', textColor: [0, 0, 0] } },
           { content: closingBalance.toFixed(2), styles: { fontStyle: 'bold', halign: 'right', textColor: [0, 0, 0] } }
        ]);

        autoTable(doc, {
            head: [tableColumns],
            body: tableRows,
            startY: 48,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 1.5, lineColor: [0, 0, 0], lineWidth: 0.1, textColor: [0, 0, 0], valign: 'top' },
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 9 },
            columnStyles: {
                0: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
                1: { cellWidth: 50 },
                2: { cellWidth: 50 },
                3: { cellWidth: 50 },
                4: { cellWidth: 25, halign: 'center' },
                5: { cellWidth: 25, halign: 'right' },
                6: { cellWidth: 25, halign: 'right' }
            },
            margin: { left: margin, right: margin }
        });

        // Signatures
        const finalY = doc.lastAutoTable.finalY + 20;
        if (finalY < pageHeight - 20) {
           doc.setFontSize(9);
           doc.setTextColor(0, 0, 255);
           doc.setFont("helvetica", "bold");
           doc.text("Treasurer", margin + 20, finalY);
           doc.text("Secretary", pageWidth - margin - 30, finalY);
           doc.text("Manager/Accountant", pageWidth / 2, finalY + 15, { align: "center" });
        }

        resolve(doc);
      } catch (error) { reject(error); }
    });
  };

  const downloadPDF = async () => {
    if (data.length === 0) return toast.error("No data");
    setProcessing(true);
    try {
      const doc = await generatePDF();
      doc.save(`PeriodReport_${formatDateForFilename()}.pdf`);
      toast.success("PDF Downloaded");
    } catch (error) { toast.error("PDF Error"); }
    finally { setProcessing(false); }
  };

  // --- EXCEL EXPORT ---
  const exportToExcel = () => {
    if (data.length === 0) return toast.error("No data to export");
    setProcessing(true);
    try {
      const wb = XLSX.utils.book_new();
      const excelData = [];
       
      // Static Header Rows
      excelData.push([schoolInfo.name.toUpperCase()]);
      excelData.push([schoolInfo.address]);
      excelData.push([]);
      excelData.push(["PERIOD TRANSACTION REPORT"]);
      excelData.push([`From: ${formatDateForDisplay(fromDate)} To: ${formatDateForDisplay(toDate)}`]);
      excelData.push([]);

      // Column Headers
      excelData.push(["Date", "Particulars", "Description", "Student/StaffName", "Bill/Rec.No", "Payment (Dr)", "Receipt (Cr)"]);

      // Merge config
      const mergeCells = [
         { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // School Name
         { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Address
         { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } }, // Title
         { s: { r: 4, c: 0 }, e: { r: 4, c: 6 } }  // Date
      ];

      let lastExcelDate = "";

      // Data Rows
      data.forEach(row => {
        const isOpening = row.mode === "OPENING";
        const rowDate = isOpening ? formatDateForDisplay(fromDate) : formatDateForDisplay(row.date);
        const showDate = rowDate !== lastExcelDate;
        if(showDate) lastExcelDate = rowDate;

        excelData.push([
            showDate ? rowDate : "",
            row.ledger,
            row.description,
            `${row.name || ""}${row.operatorName ? " (" + row.operatorName + ")" : ""}`,
            row.brNumber === "0" ? "" : row.brNumber,
            row.debit > 0 ? parseFloat(row.debit).toFixed(2) : "",
            row.credit > 0 ? parseFloat(row.credit).toFixed(2) : ""
        ]);
      });

      // Footer
      excelData.push([]);
      excelData.push(["", "", "", "", "TOTALS:", parseFloat(totalPayments.toFixed(2)), parseFloat(totalReceipts.toFixed(2))]);
      excelData.push(["", "", "", "", "CLOSING BALANCE:", "", parseFloat(closingBalance.toFixed(2))]);

      const ws = XLSX.utils.aoa_to_sheet(excelData);
       
      // Widths
      ws['!cols'] = [{wch:12}, {wch:30}, {wch:30}, {wch:30}, {wch:15}, {wch:15}, {wch:15}];
      ws['!merges'] = mergeCells;

      XLSX.utils.book_append_sheet(wb, ws, "Period Report");
      XLSX.writeFile(wb, `PeriodReport_${formatDateForFilename()}.xlsx`);
      toast.success("Excel Exported");
    } catch (error) { toast.error("Excel Error"); }
    finally { setProcessing(false); }
  };

  const resetFilters = () => {
    setFromDate(getTodayDate());
    setToDate(getTodayDate());
    setData([]);
  };

  // Helper for screen rendering
  let lastDate = "";

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <div className="mb-4 d-print-none">
          <nav className="d-flex custom-breadcrumb py-1 py-lg-3 align-items-center">
             <Link to="/home">Home</Link>
             <span className="separator mx-2">&gt;</span>
             <div>Debit / Credit Report</div>
             <span className="separator mx-2">&gt;</span>
             <span>Period Report</span>
          </nav>
        </div>

        <Card className="shadow-sm">
          <Card.Header className="custom-btn-clr text-white d-flex justify-content-between align-items-center d-print-none">
             <h5 className="mb-0">Period Transaction Report</h5>
             <div className="d-flex gap-2">
                <Button size="sm" variant={reportType==="ACADEMIC"?"light":"outline-light"} onClick={()=>{setReportType("ACADEMIC"); setData([]);}}>Academic</Button>
                <Button size="sm" variant={reportType==="MISC"?"light":"outline-light"} onClick={()=>{setReportType("MISC"); setData([]);}}>Miscellaneous</Button>
                <Button size="sm" variant="outline-light" onClick={resetFilters}><FaRedo className="me-1"/> Reset</Button>
             </div>
          </Card.Header>
          <Card.Body>
             {/* FILTERS */}
             <div className="row g-3 mb-4 d-print-none">
               <div className="col-md-3">
                 <Form.Label>From Date</Form.Label>
                 <Form.Control type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} max={new Date().toISOString().split("T")[0]} />
               </div>
               <div className="col-md-3">
                 <Form.Label>To Date</Form.Label>
                 <Form.Control type="date" value={toDate} onChange={e=>setToDate(e.target.value)} max={new Date().toISOString().split("T")[0]} />
               </div>
               <div className="col-md-2 d-flex align-items-end">
                 <Button className="custom-btn-clr w-100" onClick={fetchData} disabled={loading}>
                    {loading?<Spinner size="sm"/>: <><FaFileAlt className="me-2"/> Generate</>}
                 </Button>
               </div>
               {data.length > 0 && (
                 <div className="col-md-4 d-flex align-items-end justify-content-end gap-2">
                   <Button variant="outline-primary" onClick={handlePrint} disabled={processing} title="Print"><FaPrint/></Button>
                   <Button variant="outline-danger" onClick={downloadPDF} disabled={processing} title="PDF"><FaFilePdf/></Button>
                   <Button variant="outline-success" onClick={exportToExcel} disabled={processing} title="Excel"><FaFileExcel/></Button>
                 </div>
               )}
             </div>

             {/* PRINTABLE AREA */}
             <div id="period-report-content" className="p-2 bg-white">
               <div className="text-center mb-3">
                  <h5 className="fw-bold text-uppercase mb-1 school-name" style={{ letterSpacing: "1px", color: "#0B3D7B" }}>{schoolInfo.name}</h5>
                  <h6 className="fw-bold mb-3 school-address" style={{ fontSize: "0.85rem" }}>
                    {schoolInfo.address}
                    {[schoolInfo.city, schoolInfo.state, schoolInfo.pincode].filter(Boolean).join(', ')}
                  </h6>
                  <div className="d-flex justify-content-center align-items-center">
                    <h6 className="fw-bold text-primary mb-0 report-title" style={{ fontSize: "0.95rem" }}>
                       Period Report From: <span className="text-danger date-value">{formatDateForDisplay(fromDate)}</span> To: <span className="text-danger date-value">{formatDateForDisplay(toDate)}</span>
                    </h6>
                  </div>
                  <div className="horizontal-line"></div>
               </div>

               <div className="table-responsive">
                <Table bordered size="sm" className="align-middle border-dark report-table">
                    <thead className="text-center align-middle" style={{ borderBottom: "2px solid black" }}>
                       <tr>
                          <th style={{ width: "10%" }}>Date</th>
                          <th style={{ width: "20%" }}>Expen Name</th>
                          <th style={{ width: "20%" }}>Description</th>
                          <th style={{ width: "20%" }}>Student/StaffName</th>
                          <th style={{ width: "10%" }}>Bill/Rec.No</th>
                          <th style={{ width: "10%" }}>Payment</th>
                          <th style={{ width: "10%" }}>Receipt</th>
                       </tr>
                    </thead>
                    <tbody className="fw-semibold" style={{ fontSize: "0.8rem" }}>
                       {data.length > 0 ? (
                         <>
                           {data.map((row, idx) => {
                             const isOpening = row.mode === "OPENING";
                             const rowDate = isOpening ? formatDateForDisplay(fromDate) : formatDateForDisplay(row.date);
                             const showDate = rowDate !== lastDate;
                             if(showDate) lastDate = rowDate;

                             return (
                               <tr key={idx} style={isOpening ? { backgroundColor: '#e3f2fd' } : {}}>
                                 <td className="text-center fw-bold">{showDate ? rowDate : ''}</td>
                                 <td className="text-start">{row.ledger}</td>
                                 <td className="text-start">{row.description}</td>
                                 <td className="text-start">
                                    {row.name && <div>{row.name}</div>}
                                    {row.operatorName && <div className="small-text text-muted">User: {row.operatorName}</div>}
                                 </td>
                                 <td className="text-center">{row.brNumber !== "0" ? row.brNumber : ""}</td>
                                 <td className="text-end fw-bold">{row.debit > 0 ? parseFloat(row.debit).toFixed(2) : ""}</td>
                                 <td className="text-end fw-bold">{row.credit > 0 ? parseFloat(row.credit).toFixed(2) : ""}</td>
                               </tr>
                             );
                           })}
                           {/* Totals Row */}
                           <tr className="table-light">
                              <td colSpan={5} className="text-end fw-bold">TOTALS:</td>
                              <td className="text-end fw-bold">{totalPayments.toFixed(2)}</td>
                              <td className="text-end fw-bold">{totalReceipts.toFixed(2)}</td>
                           </tr>
                           {/* Closing Balance Row */}
                           <tr>
                              <td colSpan={6} className="text-end fw-bold text-primary">CLOSING BALANCE:</td>
                              <td className="text-end fw-bold text-primary">{closingBalance.toFixed(2)}</td>
                           </tr>
                         </>
                       ) : (
                         <tr><td colSpan="7" className="text-center py-5 text-muted">No transactions found for this period.</td></tr>
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
        .horizontal-line { border-top: 2px solid #0B3D7B; margin: 10px auto; width: 50%; opacity: 0.75; }
        @media screen {
           .custom-btn-clr { background-color: #0B3D7B; border-color: #0B3D7B; color: white; }
           .custom-btn-clr:hover { background-color: #092c5a; border-color: #092c5a; }
           .school-name { color: #0B3D7B !important; }
           .date-value { color: #dc3545 !important; }
           .report-table th { background-color: #0B3D7B !important; color: white !important; }
           .report-table tbody tr:nth-child(odd) { background-color: #f8f9fa; }
        }
        @media print {
           .d-print-none { display: none !important; }
           body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </MainContentPage>
  );
};

export default PeriodDCReport;