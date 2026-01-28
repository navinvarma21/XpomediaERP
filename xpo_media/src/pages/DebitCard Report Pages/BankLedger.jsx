import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainContentPage from "../../components/MainContent/MainContentPage";
import { Card, Form, Button, Table, Spinner, Container, Badge } from "react-bootstrap";
import { useAuthContext } from "../../Context/AuthContext";
import { ENDPOINTS } from "../../SpringBoot/config";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { FaFilePdf, FaFileExcel, FaPrint, FaSearch, FaRedo } from "react-icons/fa";

const BankLedger = () => {
  // 1. Get currentAcademicYear from AuthContext
  const { schoolId, getAuthHeaders, currentAcademicYear } = useAuthContext();
  
  const getTodayDate = () => new Date().toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(getTodayDate());
  const [toDate, setToDate] = useState(getTodayDate());
  const [reportType, setReportType] = useState("ACADEMIC");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // School Info state expanded to match the Print UI requirements
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
    } catch (error) { 
        console.error(error); 
        setSchoolInfo(prev => ({ ...prev, name: "School Name Not Available" }));
    }
  };

  const fetchData = async () => {
    if (!schoolId) return toast.error("School ID missing");
    
    // 2. Validate Academic Year
    if (!currentAcademicYear) {
      toast.error("Academic Year not set. Please check settings.");
      return;
    }

    setLoading(true);
    try {
      // 3. Pass academicYear to backend
      const response = await fetch(
        `${ENDPOINTS.reports}/debit-credit/bank-ledger?schoolId=${schoolId}&fromDate=${fromDate}&toDate=${toDate}&type=${reportType}&academicYear=${currentAcademicYear}`,
        { headers: getAuthHeaders() }
      );
      if (response.ok) {
        const result = await response.json();
        setData(result);
        if(result.length === 0) toast.info("No bank transactions found");
        else toast.success(`Found ${result.length} transactions`);
      } else {
        toast.error("Failed to fetch bank ledger");
      }
    } catch (error) { 
      console.error(error);
      toast.error("Server error"); 
    } finally { 
      setLoading(false); 
    }
  };

  // --- Logic Preserved: Calculations for Display ---
  let runningBalance = 0;
  if (data.length > 0 && data[0].mode === "OPENING") {
      runningBalance = (data[0].credit || 0) - (data[0].debit || 0);
  }

  const processedData = data.map((row, index) => {
      if (index > 0 || row.mode !== "OPENING") {
          runningBalance += (row.credit || 0) - (row.debit || 0);
      }
      return { ...row, balance: runningBalance };
  });

  const totals = data.reduce((acc, curr) => {
    if (curr.mode === "OPENING") return acc; 
    return {
      credit: acc.credit + (curr.credit || 0),
      debit: acc.debit + (curr.debit || 0),
    };
  }, { credit: 0, debit: 0 });

  // --- Helpers for Formatting ---
  const formatDateForHeader = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateForFilename = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  };

  // --- PRINT FUNCTIONALITY (Updated UI) ---
  const handlePrint = () => {
    if (processedData.length === 0) {
      toast.error("No data to print");
      return;
    }

    const printContent = document.getElementById('bank-ledger-report-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=1123,height=794');
    if (!printWindow) return toast.error("Please allow pop-ups");

    const styles = `
      @page { size: 297mm 210mm; margin: 10mm; }
      @media print {
        body { margin: 0; padding: 0; font-family: "Times New Roman", serif; background: white; width: 277mm; }
      }
      body { margin: 0; padding: 0; font-family: "Times New Roman", serif; background: white; }
      .print-container { width: 100%; margin: 0 auto; }
      .school-name { font-size: 18px; font-weight: bold; color: #0B3D7B; margin: 0 0 3px 0; text-transform: uppercase; text-align: center; letter-spacing: 1px; }
      .school-address { font-size: 12px; font-weight: bold; margin: 0 0 8px 0; text-align: center; }
      .report-title { font-size: 14px; font-weight: bold; margin: 8px 0; color: #0B3D7B; text-align: center; }
      .date-range { font-size: 12px; font-weight: bold; color: #dc3545; text-align: center; margin-bottom: 10px; }
      .horizontal-line { border-top: 2px solid #0B3D7B; margin: 8px auto; width: 80%; opacity: 0.75; }
      
      .report-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 8px; table-layout: fixed; }
      .report-table th, .report-table td { border: 1px solid #000; padding: 4px; vertical-align: middle; word-wrap: break-word; }
      .report-table th { background-color: #0B3D7B !important; color: white !important; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact; text-align: center; }
      .report-table tbody tr:nth-child(odd) { background-color: #f8f9fa; }
      .report-table tfoot { font-weight: bold; background-color: #f8f9fa; }
      
      .text-end { text-align: right !important; }
      .text-center { text-align: center !important; }
      .text-start { text-align: left !important; }
      
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
          <title>Bank Ledger - ${formatDateForFilename(fromDate)}</title>
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

  // --- PDF EXPORT (jsPDF + AutoTable) ---
  const generatePDF = () => {
    return new Promise((resolve, reject) => {
      try {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [297, 210], compress: true });
        const pageWidth = 297;
        const pageHeight = 210;
        const margin = 10;
        const primaryColor = [11, 61, 123];

        doc.setFont("helvetica");
        
        // Header
        doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(...primaryColor);
        doc.text(schoolInfo.name, pageWidth / 2, 15, { align: "center" });
        
        doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
        doc.text(schoolInfo.address, pageWidth / 2, 22, { align: "center" });
        
        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...primaryColor);
        doc.text("BANK LEDGER REPORT", pageWidth / 2, 32, { align: "center" });
        
        doc.setFontSize(10); doc.setTextColor(0, 0, 0);
        doc.text(`From: ${formatDateForHeader(fromDate)}   To: ${formatDateForHeader(toDate)}`, pageWidth / 2, 39, { align: "center" });
        
        doc.setDrawColor(...primaryColor); doc.setLineWidth(0.5);
        doc.line(margin, 44, pageWidth - margin, 44);

        const tableColumns = ["Date", "Ref/Chq No", "Particulars", "Mode", "Credit", "Debit", "Balance"];
        const tableRows = processedData.map(row => [
          row.mode === "OPENING" ? "" : formatDateForHeader(row.date),
          row.brNumber === "0" ? "-" : row.brNumber,
          row.ledger === "Opening Balance" ? "Opening Balance" : `${row.name || ""}\n${row.description || ""}`,
          row.mode,
          row.credit > 0 ? row.credit.toFixed(2) : "",
          row.debit > 0 ? row.debit.toFixed(2) : "",
          row.balance.toFixed(2)
        ]);

        // Add Totals Row
        tableRows.push([
            { content: "Period Totals:", colSpan: 4, styles: { fontStyle: 'bold', halign: 'right' } },
            { content: totals.credit.toFixed(2), styles: { fontStyle: 'bold', textColor: [25, 135, 84] } }, // success color
            { content: totals.debit.toFixed(2), styles: { fontStyle: 'bold', textColor: [220, 53, 69] } },  // danger color
            ""
        ]);

        autoTable(doc, {
          head: [tableColumns],
          body: tableRows,
          startY: 48,
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 1.5, lineColor: [0,0,0], lineWidth: 0.1, textColor: [0,0,0], valign: 'middle' },
          headStyles: { fillColor: primaryColor, textColor: [255,255,255], fontStyle: 'bold', halign: 'center', fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 25, halign: 'center' },
            1: { cellWidth: 25, halign: 'center' },
            2: { cellWidth: 100, halign: 'left' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 30, halign: 'right' },
            5: { cellWidth: 30, halign: 'right' },
            6: { cellWidth: 35, halign: 'right' }
          },
          margin: { left: margin, right: margin }
        });

        // Signatures
        const finalY = doc.lastAutoTable.finalY + 15;
        if (finalY < pageHeight - 20) {
            doc.setFontSize(9); doc.setTextColor(0, 0, 255); doc.setFont("helvetica", "bold");
            doc.text("Treasurer", margin + 20, finalY);
            doc.text("Secretary", pageWidth - margin - 30, finalY);
            doc.text("Manager/Accountant", pageWidth / 2, finalY + 15, { align: "center" });
        }
        resolve(doc);
      } catch (error) { reject(error); }
    });
  };

  const downloadPDF = async () => {
    if (processedData.length === 0) return toast.error("No data available");
    setProcessing(true);
    try {
      const doc = await generatePDF();
      doc.save(`BankLedger-${formatDateForFilename(fromDate)}-to-${formatDateForFilename(toDate)}.pdf`);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF");
    } finally { setProcessing(false); }
  };

  // --- EXCEL EXPORT ---
  const exportToExcel = () => {
    if (processedData.length === 0) return toast.error("No data to export");
    setProcessing(true);
    try {
      const wb = XLSX.utils.book_new();
      const excelData = [];
      
      // Static Header
      excelData.push([schoolInfo.name.toUpperCase()]);
      excelData.push([schoolInfo.address]);
      excelData.push([]);
      excelData.push(["BANK LEDGER REPORT"]);
      excelData.push([`From: ${formatDateForHeader(fromDate)}   To: ${formatDateForHeader(toDate)}`]);
      excelData.push([]);
      excelData.push(["Date", "Ref/Chq No", "Particulars", "Mode", "Credit", "Debit", "Balance"]);

      // Data Rows
      processedData.forEach(row => {
        excelData.push([
          row.mode === "OPENING" ? "" : row.date,
          row.brNumber === "0" ? "-" : row.brNumber,
          row.ledger === "Opening Balance" ? "Opening Balance" : `${row.name || ""} ${row.description || ""}`,
          row.mode,
          row.credit > 0 ? parseFloat(row.credit).toFixed(2) : "",
          row.debit > 0 ? parseFloat(row.debit).toFixed(2) : "",
          parseFloat(row.balance).toFixed(2)
        ]);
      });

      // Totals Row
      excelData.push(["", "", "", "TOTALS:", parseFloat(totals.credit).toFixed(2), parseFloat(totals.debit).toFixed(2), ""]);

      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // Widths
      ws['!cols'] = [
        { wch: 12 }, { wch: 15 }, { wch: 50 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
      ];

      // Merges
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Name
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Address
        { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } }, // Title
        { s: { r: 4, c: 0 }, e: { r: 4, c: 6 } }  // Date
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Bank Ledger");
      XLSX.writeFile(wb, `BankLedger-${formatDateForFilename(fromDate)}.xlsx`);
      toast.success("Excel file exported successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export Excel");
    } finally { setProcessing(false); }
  };

  const resetFilters = () => {
    setFromDate(getTodayDate());
    setToDate(getTodayDate());
    setData([]);
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
            <span>Bank Ledger</span>
          </nav>
        </div>

        <Card className="shadow-sm">
          <Card.Header className="custom-btn-clr text-white d-flex justify-content-between align-items-center d-print-none">
            <h5 className="mb-0">Bank Ledger (Non-Cash)</h5>
            <div className="d-flex gap-2">
              <Button size="sm" variant={reportType === "ACADEMIC" ? "light" : "outline-light"} onClick={() => { setReportType("ACADEMIC"); setData([]); }}>Academic</Button>
              <Button size="sm" variant={reportType === "MISC" ? "light" : "outline-light"} onClick={() => { setReportType("MISC"); setData([]); }}>Miscellaneous</Button>
              <Button size="sm" variant="outline-light" onClick={resetFilters}><FaRedo className="me-1" /> Reset</Button>
            </div>
          </Card.Header>

          <Card.Body>
            <div className="row g-3 mb-4 d-print-none">
              <div className="col-md-3">
                <Form.Label>From Date</Form.Label>
                <Form.Control type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} max={getTodayDate()} />
              </div>
              <div className="col-md-3">
                <Form.Label>To Date</Form.Label>
                <Form.Control type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} max={getTodayDate()} />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <Button className="custom-btn-clr w-100" onClick={fetchData} disabled={loading}>
                  {loading ? <Spinner size="sm" className="me-2"/> : <FaSearch className="me-2"/>} Generate
                </Button>
              </div>
              
              {processedData.length > 0 && (
                <div className="col-md-4 d-flex align-items-end justify-content-end gap-2">
                   <Button variant="outline-primary" onClick={handlePrint} disabled={processing} title="Print"><FaPrint /></Button>
                   <Button variant="outline-danger" onClick={downloadPDF} disabled={processing} title="PDF"><FaFilePdf /></Button>
                   <Button variant="outline-success" onClick={exportToExcel} disabled={processing} title="Excel"><FaFileExcel /></Button>
                </div>
              )}
            </div>

            {/* PRINTABLE AREA / WEB VIEW */}
            <div id="bank-ledger-report-content" className="p-2 bg-white">
                <div className="text-center mb-3">
                    <h5 className="fw-bold text-uppercase mb-1 school-name" style={{ letterSpacing: "1px", color: "#0B3D7B" }}>
                        {schoolInfo.name}
                    </h5>
                    <h6 className="fw-bold mb-3 school-address" style={{ fontSize: "0.85rem" }}>
                        {schoolInfo.address}
                        {[schoolInfo.city, schoolInfo.state, schoolInfo.pincode].filter(Boolean).join(', ')}
                    </h6>
                    <div className="d-flex justify-content-center align-items-center flex-column">
                        <h6 className="fw-bold text-primary mb-1 report-title" style={{ fontSize: "0.95rem" }}>
                            BANK LEDGER REPORT
                        </h6>
                        <div className="date-range fw-bold text-danger" style={{ fontSize: "0.85rem" }}>
                            From: {formatDateForHeader(fromDate)} &nbsp; To: {formatDateForHeader(toDate)}
                        </div>
                    </div>
                    <div className="horizontal-line"></div>
                </div>

                <div className="table-responsive">
                    <Table bordered size="sm" className="align-middle border-dark report-table">
                        <thead className="text-center align-middle" style={{ borderBottom: "2px solid black" }}>
                            <tr>
                                <th style={{width: '9%', fontSize: "0.85rem"}}>Date</th>
                                <th style={{width: '9%', fontSize: "0.85rem"}}>Ref/Chq</th>
                                <th style={{width: '37%', fontSize: "0.85rem"}}>Particulars</th>
                                <th style={{width: '9%', fontSize: "0.85rem"}}>Mode</th>
                                <th style={{width: '12%', fontSize: "0.85rem"}}>Credit</th>
                                <th style={{width: '12%', fontSize: "0.85rem"}}>Debit</th>
                                <th style={{width: '12%', fontSize: "0.85rem"}}>Balance</th>
                            </tr>
                        </thead>
                        <tbody className="fw-semibold" style={{ fontSize: "0.8rem" }}>
                            {processedData.length > 0 ? processedData.map((row, idx) => (
                                <tr key={idx} className={row.mode === "OPENING" ? "table-warning fw-bold" : ""}>
                                    <td className="text-center">
                                        {row.mode === "OPENING" ? "" : formatDateForHeader(row.date)}
                                    </td>
                                    <td className="text-center">
                                        {row.brNumber === "0" ? "-" : row.brNumber}
                                    </td>
                                    <td className="text-start">
                                        {row.ledger === "Opening Balance" ? "Opening Balance" : (
                                            <>
                                                <div>{row.name}</div>
                                                {row.description && <div className="small text-muted" style={{fontSize: '0.75em'}}>{row.description}</div>}
                                            </>
                                        )}
                                    </td>
                                    <td className="text-center">
                                        {row.mode === "OPENING" ? "-" : row.mode}
                                    </td>
                                    <td className="text-end text-success">
                                        {row.credit > 0 ? row.credit.toFixed(2) : ""}
                                    </td>
                                    <td className="text-end text-danger">
                                        {row.debit > 0 ? row.debit.toFixed(2) : ""}
                                    </td>
                                    <td className="text-end fw-bold">
                                        {row.balance.toFixed(2)}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="7" className="text-center text-muted py-5">No transactions found.</td></tr>
                            )}
                        </tbody>
                        {processedData.length > 0 && (
                            <tfoot className="table-light fw-bold" style={{ fontSize: "0.8rem" }}>
                                <tr>
                                    <td colSpan="4" className="text-end">Period Totals:</td>
                                    <td className="text-end text-success">{totals.credit.toFixed(2)}</td>
                                    <td className="text-end text-danger">{totals.debit.toFixed(2)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </Table>
                </div>
            </div>
          </Card.Body>
        </Card>
        <ToastContainer position="top-right" autoClose={3000}/>
        
        <style>{`
          .custom-btn-clr { background-color: #0B3D7B; border-color: #0B3D7B; color: white; }
          .custom-btn-clr:hover { background-color: #092c5a; border-color: #092c5a; }
          .school-name { color: #0B3D7B !important; }
          .horizontal-line { border-top: 2px solid #0B3D7B; margin: 10px auto; width: 50%; opacity: 0.75; }
          .report-table th { background-color: #0B3D7B !important; color: white !important; }
          .report-table tbody tr:nth-child(odd) { background-color: #f8f9fa; }
          
          @media print {
            .d-print-none { display: none !important; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        `}</style>
      </Container>
    </MainContentPage>
  );
};

export default BankLedger;