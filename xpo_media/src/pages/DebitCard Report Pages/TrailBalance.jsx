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

const TrialBalance = () => {
  const { schoolId, getAuthHeaders, currentAcademicYear } = useAuthContext();
  
  // --- UTILS ---
  const getCurrentYearStart = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    // Assuming Financial Year starts April 1st
    const startYear = today.getMonth() < 3 ? currentYear - 1 : currentYear;
    return `${startYear}-04-01`;
  };

  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  // --- STATE ---
  const [fromDate, setFromDate] = useState(getCurrentYearStart());
  const [toDate, setToDate] = useState(getTodayDate());
  const [reportType, setReportType] = useState("ACADEMIC");
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // School Info for Headers
  const [schoolInfo, setSchoolInfo] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: ""
  });

  // --- EFFECT: Fetch School Details ---
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
      }
    } catch (error) {
      console.error("Error fetching school information:", error);
    }
  };

  // --- API: Fetch Report Data ---
  const fetchData = async () => {
    if (!schoolId) {
      toast.error("School ID not available");
      return;
    }

    if (!currentAcademicYear) {
      toast.error("Academic Year not set. Please check settings.");
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(
        `${ENDPOINTS.reports}/debit-credit/trial-balance?schoolId=${schoolId}&fromDate=${fromDate}&toDate=${toDate}&type=${reportType}&academicYear=${currentAcademicYear}`,
        { headers: getAuthHeaders() }
      );
      if (response.ok) {
        const result = await response.json();
        setData(result);
        
        if (result.length === 0) {
          toast.info("No records found for this period");
        } else {
          toast.success(`Generated successfully`);
        }
      } else {
        setData([]);
        toast.error("Failed to fetch Trial Balance");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  // --- FORMATTERS ---
  const formatDateForHeader = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateForFilename = (dateString) => {
    return dateString;
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return "";
    return parseFloat(amount).toFixed(2);
  };

  // Helper to allow display of "By" and "To" in table but maybe clean for specific exports if needed
  // Current requirement: show grouped. We will display name as received from backend.
  const displayLedgerName = (name) => {
    if (!name) return "";
    return name.startsWith("x") ? name.substring(1) : name;
  };

  // Calculate Totals for Footer
  const totalDebit = data.reduce((sum, row) => sum + (row.totalPayment || 0), 0);
  const totalCredit = data.reduce((sum, row) => sum + (row.totalReceipt || 0), 0);

  const resetFilters = () => {
    setFromDate(getCurrentYearStart());
    setToDate(getTodayDate());
    setData([]);
  };

  // --- PRINT FUNCTION ---
  const handlePrint = () => {
    if (data.length === 0) {
      toast.error("No data to print");
      return;
    }

    const printContent = document.getElementById('trial-balance-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=1123,height=794');
    
    const styles = `
      @page { size: 210mm 297mm; margin: 10mm; }
      @media print {
        body { margin: 0; padding: 0; font-family: "Times New Roman", serif; background: white; }
      }
      body { margin: 0; padding: 0; font-family: "Times New Roman", serif; }
      .print-container { width: 100%; margin: 0 auto; }
      .school-name { font-size: 18px; font-weight: bold; color: #0B3D7B; margin: 0 0 3px 0; letter-spacing: 1px; text-transform: uppercase; text-align: center; }
      .school-address { font-size: 12px; font-weight: bold; margin: 0 0 8px 0; text-align: center; }
      .report-title { font-size: 14px; font-weight: bold; margin: 8px 0; color: #0B3D7B; text-align: center; }
      .date-value { color: #dc3545; }
      .horizontal-line { border-top: 2px solid #0B3D7B; margin: 8px auto; width: 80%; opacity: 0.75; }
      .report-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 15px; }
      .report-table th, .report-table td { border: 1px solid #000; padding: 6px; vertical-align: middle; }
      .report-table th { background-color: #0B3D7B !important; color: white !important; font-weight: bold; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .report-table tbody tr:nth-child(odd) { background-color: #f8f9fa; }
      .text-end { text-align: right !important; }
      .text-center { text-align: center !important; }
      .text-start { text-align: left !important; }
      .fw-bold { font-weight: bold; }
      .signatures-container { margin-top: 40px; font-weight: bold; color: blue; width: 100%; page-break-inside: avoid; }
      .sig-row-1 { display: flex; justify-content: space-between; padding: 0 30px; font-size: 11px; }
      .sig-row-2 { text-align: center; margin-top: 25px; font-size: 11px; }
    `;

    const signatureHTML = `
      <div class="signatures-container">
        <div class="sig-row-1"><span>Treasurer</span><span>Secretary</span></div>
        <div class="sig-row-2"><span>Manager/Accountant</span></div>
      </div>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Trial Balance - ${formatDateForFilename(toDate)}</title>
          <style>${styles}</style>
        </head>
        <body>
          <div class="print-container">
            ${printContent.innerHTML}
            ${signatureHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.focus(); window.print(); window.close(); }, 250);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // --- PDF EXPORT ---
  const generatePDF = () => {
    return new Promise((resolve, reject) => {
      try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 10;
        const primaryColor = [11, 61, 123];

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...primaryColor);
        doc.text(schoolInfo.name, pageWidth / 2, 15, { align: "center" });
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(schoolInfo.address, pageWidth / 2, 22, { align: "center" });

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...primaryColor);
        doc.text("TRIAL BALANCE REPORT", pageWidth / 2, 32, { align: "center" });

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const dateRange = `From: ${formatDateForHeader(fromDate)}   To: ${formatDateForHeader(toDate)}`;
        doc.text(dateRange, pageWidth / 2, 39, { align: "center" });

        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.5);
        doc.line(margin, 43, pageWidth - margin, 43);

        const tableColumns = ["SNo", "Ledger Name", "Debit (Payment)", "Credit (Receipt)"];
        const tableRows = data.map((row, idx) => [
          idx + 1,
          displayLedgerName(row.ledgerName),
          row.totalPayment > 0 ? parseFloat(row.totalPayment).toFixed(2) : "",
          row.totalReceipt > 0 ? parseFloat(row.totalReceipt).toFixed(2) : ""
        ]);

        tableRows.push(["", "GRAND TOTAL", totalDebit.toFixed(2), totalCredit.toFixed(2)]);

        autoTable(doc, {
          head: [tableColumns],
          body: tableRows,
          startY: 48,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.1, textColor: [0, 0, 0] },
          headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
          columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            1: { halign: 'left' },
            2: { halign: 'right', fontStyle: 'bold' },
            3: { halign: 'right', fontStyle: 'bold' }
          },
          didParseCell: (data) => {
            if (data.row.index === tableRows.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [240, 240, 240];
            }
          }
        });

        const finalY = doc.lastAutoTable.finalY + 20;
        if (finalY < pageHeight - 30) {
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 255);
          doc.setFont("helvetica", "bold");
          doc.text("Treasurer", margin + 10, finalY);
          doc.text("Secretary", pageWidth - margin - 30, finalY);
          doc.text("Manager/Accountant", pageWidth / 2, finalY + 15, { align: "center" });
        }

        resolve(doc);
      } catch (error) {
        reject(error);
      }
    });
  };

  const downloadPDF = async () => {
    if (data.length === 0) return toast.error("No data available");
    setProcessing(true);
    try {
      const doc = await generatePDF();
      doc.save(`TrialBalance-${formatDateForFilename(toDate)}.pdf`);
      toast.success("PDF downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF");
    } finally {
      setProcessing(false);
    }
  };

  // --- EXCEL EXPORT ---
  const exportToExcel = () => {
    if (data.length === 0) return toast.error("No data to export");
    setProcessing(true);
    try {
      const wb = XLSX.utils.book_new();
      const excelData = [];
      excelData.push([schoolInfo.name.toUpperCase()]);
      excelData.push([schoolInfo.address]);
      excelData.push([]);
      excelData.push(["TRIAL BALANCE REPORT"]);
      excelData.push([`From: ${formatDateForHeader(fromDate)} To: ${formatDateForHeader(toDate)}`]);
      excelData.push([]);
      
      excelData.push(["SNo", "Ledger Name", "Debit (Payment)", "Credit (Receipt)"]);

      data.forEach((row, idx) => {
        excelData.push([
          idx + 1,
          displayLedgerName(row.ledgerName),
          row.totalPayment > 0 ? parseFloat(row.totalPayment) : "",
          row.totalReceipt > 0 ? parseFloat(row.totalReceipt) : ""
        ]);
      });

      excelData.push(["", "GRAND TOTAL", parseFloat(totalDebit), parseFloat(totalCredit)]);

      const ws = XLSX.utils.aoa_to_sheet(excelData);
      ws['!merges'] = [
        { s: {r:0, c:0}, e: {r:0, c:3} },
        { s: {r:1, c:0}, e: {r:1, c:3} },
        { s: {r:3, c:0}, e: {r:3, c:3} },
        { s: {r:4, c:0}, e: {r:4, c:3} }
      ];
      ws['!cols'] = [{ wch: 8 }, { wch: 40 }, { wch: 15 }, { wch: 15 }];

      XLSX.utils.book_append_sheet(wb, ws, "Trial Balance");
      XLSX.writeFile(wb, `TrialBalance-${formatDateForFilename(toDate)}.xlsx`);
      toast.success("Excel exported successfully");
    } catch (error) {
      console.error(error);
      toast.error("Excel export failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <div className="mb-4 d-print-none">
          <nav className="d-flex custom-breadcrumb py-1 py-lg-3 align-items-center">
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <div>Reports</div>
            <span className="separator mx-2">&gt;</span>
            <span>Trial Balance</span>
          </nav>
        </div>

        <Card className="shadow-sm">
          <Card.Header className="custom-btn-clr text-white d-flex justify-content-between align-items-center d-print-none">
            <h5 className="mb-0">Trial Balance Report</h5>
            <div className="d-flex gap-2">
              <Button size="sm" variant={reportType === "ACADEMIC" ? "light" : "outline-light"} onClick={() => { setReportType("ACADEMIC"); setData([]); }}>Academic</Button>
              <Button size="sm" variant={reportType === "MISC" ? "light" : "outline-light"} onClick={() => { setReportType("MISC"); setData([]); }}>Miscellaneous</Button>
              <Button size="sm" variant="outline-light" onClick={resetFilters}><FaRedo className="me-1" /> Reset</Button>
            </div>
          </Card.Header>

          <Card.Body>
            <div className="row g-3 mb-4 d-print-none align-items-end">
              <div className="col-md-3">
                <Form.Label>From Date</Form.Label>
                <Form.Control type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className="col-md-3">
                <Form.Label>To Date</Form.Label>
                <Form.Control type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
              <div className="col-md-3">
                <Button className="custom-btn-clr w-100" onClick={fetchData} disabled={loading}>
                  {loading ? <><Spinner size="sm" className="me-2" /> Loading...</> : <><FaFileAlt className="me-2" /> Generate Report</>}
                </Button>
              </div>
              <div className="col-md-3 d-flex gap-2 justify-content-end">
                {data.length > 0 && (
                  <>
                    <Button variant="outline-primary" onClick={handlePrint} disabled={processing}><FaPrint /></Button>
                    <Button variant="outline-danger" onClick={downloadPDF} disabled={processing}><FaFilePdf /></Button>
                    <Button variant="outline-success" onClick={exportToExcel} disabled={processing}><FaFileExcel /></Button>
                  </>
                )}
              </div>
            </div>

            <div id="trial-balance-content" className="p-2 bg-white">
              {data.length > 0 && (
                <div className="text-center mb-3">
                  <h5 className="fw-bold text-uppercase mb-1 school-name" style={{ letterSpacing: "1px", color: "#0B3D7B" }}>{schoolInfo.name}</h5>
                  <h6 className="fw-bold mb-3 school-address" style={{ fontSize: "0.85rem" }}>{schoolInfo.address} {[schoolInfo.city, schoolInfo.state].filter(Boolean).join(', ')}</h6>
                  <h6 className="fw-bold text-primary mb-0 report-title" style={{ fontSize: "0.95rem" }}>Trial Balance ({formatDateForHeader(fromDate)} - <span className="text-danger date-value">{formatDateForHeader(toDate)}</span>)</h6>
                  <div className="horizontal-line"></div>
                </div>
              )}

              <div className="table-responsive">
                <Table bordered size="sm" className="align-middle border-dark report-table">
                  <thead className="text-center align-middle" style={{ borderBottom: "2px solid black" }}>
                    <tr>
                      <th style={{ width: "8%" }}>SNo</th>
                      <th style={{ width: "52%" }} className="text-start ps-3">Ledger Name</th>
                      <th style={{ width: "20%" }}>Debit (Payment)</th>
                      <th style={{ width: "20%" }}>Credit (Receipt)</th>
                    </tr>
                  </thead>
                  <tbody className="fw-semibold" style={{ fontSize: "0.85rem" }}>
                    {data.length > 0 ? (
                      <>
                        {data.map((row, idx) => (
                          <tr key={idx} style={row.isSystemRow ? { backgroundColor: '#e3f2fd' } : {}}>
                            <td className="text-center">{idx + 1}</td>
                            <td className="text-start ps-3">{displayLedgerName(row.ledgerName)}</td>
                            <td className="text-end fw-bold">{formatCurrency(row.totalPayment)}</td>
                            <td className="text-end fw-bold">{formatCurrency(row.totalReceipt)}</td>
                          </tr>
                        ))}
                        <tr className="bg-light" style={{ borderTop: "2px solid black" }}>
                            <td colSpan={2} className="text-end fw-bold pe-3">GRAND TOTAL:</td>
                            <td className="text-end fw-bold text-danger">{formatCurrency(totalDebit)}</td>
                            <td className="text-end fw-bold text-success">{formatCurrency(totalCredit)}</td>
                        </tr>
                      </>
                    ) : (
                      <tr><td colSpan="4" className="text-center py-5 text-muted">No transactions found for the selected period.</td></tr>
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
        .custom-btn-clr { background-color: #0B3D7B; border-color: #0B3D7B; color: white; }
        .custom-btn-clr:hover { background-color: #092c5a; border-color: #092c5a; }
        .school-name { color: #0B3D7B !important; }
        .horizontal-line { border-top: 2px solid #0B3D7B; margin: 10px auto; width: 50%; opacity: 0.75; }
        .date-value { color: #dc3545 !important; }
        .report-table th { background-color: #0B3D7B !important; color: white !important; }
        .report-table tbody tr:nth-child(odd) { background-color: #f8f9fa; }
        @media print { .d-print-none { display: none !important; } body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
      `}</style>
    </MainContentPage>
  );
};

export default TrialBalance;