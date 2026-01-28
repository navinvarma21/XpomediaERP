import React, { useState, useEffect } from 'react'
import { Container, Card, Table, Button, Spinner, Row, Col, Form, Dropdown } from 'react-bootstrap'
import { useNavigate, Link } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import "react-toastify/dist/ReactToastify.css"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from 'xlsx' 
import MainContentPage from "../../../components/MainContent/MainContentPage"
import { useAuthContext } from "../../../Context/AuthContext"
import { ENDPOINTS } from "../../../SpringBoot/config"
import { FaArrowLeft, FaFilter, FaFilePdf, FaPrint, FaFileExcel, FaRedo } from "react-icons/fa"

const BalanceList3 = () => {
  const navigate = useNavigate()
  const { getAuthHeaders, schoolId, currentAcademicYear } = useAuthContext()
    
  // Data States
  const [reportData, setReportData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [processing, setProcessing] = useState(false)

  // School Info State (Default empty)
  const [schoolInfo, setSchoolInfo] = useState({ 
      name: "SCHOOL NAME", 
      address: "School Address",
      city: "", state: "", pincode: "" 
  })

  // Filter States
  const [filters, setFilters] = useState({
    standard: "", 
    section: "",  
    feeHead: []   
  })

  // Checkbox States
  const [options, setOptions] = useState({
    includeMisc: false,
    showDetails: false
  })

  // Dropdown Data States
  const [setupData, setSetupData] = useState({
    standards: [],
    sections: [],
    feeHeadsGrouped: { DayFC: [], MissOth: [] } 
  })

  // Totals State
  const [totals, setTotals] = useState({
    acadFixed: 0, acadPaid: 0, acadBal: 0,
    transFixed: 0, transPaid: 0, transBal: 0,
    concession: 0, totFixed: 0, actPaid: 0, totPaid: 0, totBal: 0
  })

  // 1. Initial Data Fetch (School Info & Dropdowns)
  useEffect(() => {
    if (schoolId) {
      fetchSchoolInfo()
    }
    if (schoolId && currentAcademicYear) {
      fetchBasicDropdowns()
    }
  }, [schoolId, currentAcademicYear])

  // 2. Fetch Fee Heads
  useEffect(() => {
    if (schoolId && currentAcademicYear) {
        fetchFeeHeads()
    }
  }, [schoolId, currentAcademicYear, options.includeMisc])

  // --- Fetch School Info (Fix for Point 1) ---
  const fetchSchoolInfo = async () => {
    try {
      // Attempting to fetch from Admission Master endpoints or School Master
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/school/school-details?schoolId=${schoolId}`,
        { headers: getAuthHeaders() }
      );

      if (response.ok) {
        const data = await response.json();
        setSchoolInfo({
          name: data.schoolName || "SCHOOL NAME",
          address: data.schoolAddress || "Address",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || ""
        });
      }
    } catch (error) {
      console.error("Error fetching school info:", error);
    }
  };

  const fetchBasicDropdowns = async () => {
    try {
      const [coursesRes, sectionsRes] = await Promise.all([
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/courses?schoolId=${schoolId}`, { headers: getAuthHeaders() }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/sections?schoolId=${schoolId}`, { headers: getAuthHeaders() })
      ])
        
      const courses = coursesRes.ok ? await coursesRes.json() : []
      const sections = sectionsRes.ok ? await sectionsRes.json() : []

      setSetupData(prev => ({
        ...prev,
        standards: Array.isArray(courses) ? courses : [],
        sections: Array.isArray(sections) ? sections : []
      }))
    } catch (error) {
      console.error("Error fetching basic dropdowns:", error)
    }
  }

  const fetchFeeHeads = async () => {
      try {
        const response = await fetch(
            `${ENDPOINTS.reports}/balance-list-3/heads?schoolId=${schoolId}&academicYear=${currentAcademicYear}&includeMisc=${options.includeMisc}`, 
            { headers: getAuthHeaders() }
        )
        if (response.ok) {
            const data = await response.json()
            setSetupData(prev => ({ ...prev, feeHeadsGrouped: data }))
        }
      } catch (error) {
          console.error("Error fetching fee heads:", error)
      }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleFeeHeadCheckboxChange = (head) => {
    setFilters(prev => {
        const currentHeads = prev.feeHead;
        if (currentHeads.includes(head)) {
            return { ...prev, feeHead: currentHeads.filter(h => h !== head) };
        } else {
            return { ...prev, feeHead: [...currentHeads, head] };
        }
    });
  }

  const handleOptionChange = (e) => {
    const { name, checked } = e.target
    setOptions(prev => ({ ...prev, [name]: checked }))
  }

  // 3. Generate Report
  const handleGenerate = async () => {
    if (!schoolId || !currentAcademicYear) return
    setIsLoading(true)
    setHasGenerated(true)

    try {
      let queryParams = `?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
        
      if (filters.feeHead.length > 0) {
        filters.feeHead.forEach(head => {
            queryParams += `&feeHead=${encodeURIComponent(head)}`
        })
      }
        
      queryParams += `&includeMisc=${options.includeMisc}` 
        
      const response = await fetch(
        `${ENDPOINTS.reports}/balance-list-3${queryParams}`, 
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        let data = await response.json()

        if (filters.standard) data = data.filter(row => row.standard === filters.standard)
        if (filters.section) data = data.filter(row => row.section === filters.section)

        setReportData(data)
        calculateGrandTotals(data)
        if(data.length === 0) toast.info("No records found")
      } else {
        toast.error("Failed to fetch balance list")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error loading report data")
    } finally {
      setIsLoading(false)
    }
  }

  const calculateGrandTotals = (data) => {
    const newTotals = data.reduce((acc, row) => ({
      acadFixed: acc.acadFixed + (row.academicFixed || 0),
      acadPaid: acc.acadPaid + (row.academicPaid || 0),
      acadBal: acc.acadBal + (row.academicBalance || 0),
      transFixed: acc.transFixed + (row.transportFixed || 0),
      transPaid: acc.transPaid + (row.transportPaid || 0),
      transBal: acc.transBal + (row.transportBalance || 0),
      concession: acc.concession + (row.concession || 0),
      totFixed: acc.totFixed + (row.totalFixed || 0),
      actPaid: acc.actPaid + (row.actualPaid || 0),
      totPaid: acc.totPaid + (row.totalPaid || 0),
      totBal: acc.totBal + (row.totalBalance || 0),
    }), {
      acadFixed: 0, acadPaid: 0, acadBal: 0,
      transFixed: 0, transPaid: 0, transBal: 0,
      concession: 0, totFixed: 0, actPaid: 0, totPaid: 0, totBal: 0
    })
    setTotals(newTotals)
  }

  // ---------------------------------------------------------------------------
  // EXPORT: PRINT (Point 2 & 3: No Signatures, A4 Landscape, Grouped Headers)
  // ---------------------------------------------------------------------------
  const handlePrint = () => {
    if (reportData.length === 0) {
      toast.error("No data to print");
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1123,height=794');
    if (!printWindow) return;

    const styles = `
      @page { size: 297mm 210mm; margin: 10mm; } /* Point 3: Strict A4 Landscape */
      body { margin: 0; padding: 0; font-family: "Times New Roman", serif; background: white; font-size: 10pt; }
      .print-container { width: 100%; margin: 0 auto; }
      .text-center { text-align: center; }
      .text-end { text-align: right; }
      .text-start { text-align: left; }
      .school-name { font-size: 16pt; font-weight: bold; color: #0B3D7B; text-transform: uppercase; margin: 0; }
      .school-address { font-size: 10pt; margin: 5px 0; font-weight: bold; }
      .report-title { font-size: 12pt; font-weight: bold; color: #0B3D7B; margin: 10px 0; text-decoration: underline; }
      
      table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9pt; }
      th, td { border: 1px solid black; padding: 4px; }
      
      /* Header Colors match UI */
      .bg-acad { background-color: #cfe2ff !important; -webkit-print-color-adjust: exact; }
      .bg-trans { background-color: #cff4fc !important; -webkit-print-color-adjust: exact; }
      .bg-summ { background-color: #fff3cd !important; -webkit-print-color-adjust: exact; }
      .bg-dark { background-color: #0B3D7B !important; color: white !important; -webkit-print-color-adjust: exact; }
      .bg-footer { background-color: #333 !important; color: white !important; font-weight: bold; -webkit-print-color-adjust: exact; }
      
      tr:nth-child(even) { background-color: #f9f9f9; -webkit-print-color-adjust: exact; }
    `;

    const tableRows = reportData.map(row => `
        <tr>
            <td class="text-start">${row.standard}</td>
            <td class="text-center">${row.section}</td>
            <td class="text-end">${row.academicFixed?.toLocaleString()}</td>
            <td class="text-end">${row.academicPaid?.toLocaleString()}</td>
            <td class="text-end">${row.academicBalance?.toLocaleString()}</td>
            <td class="text-end">${row.transportFixed?.toLocaleString()}</td>
            <td class="text-end">${row.transportPaid?.toLocaleString()}</td>
            <td class="text-end">${row.transportBalance?.toLocaleString()}</td>
            <td class="text-end">${row.concession?.toLocaleString()}</td>
            <td class="text-end">${row.totalFixed?.toLocaleString()}</td>
            <td class="text-end">${row.actualPaid?.toLocaleString()}</td>
            <td class="text-end">${row.totalPaid?.toLocaleString()}</td>
            <td class="text-end">${row.totalBalance?.toLocaleString()}</td>
        </tr>
    `).join('');

    const footerRow = `
        <tr class="bg-footer">
            <td colspan="2" class="text-end">Grand Total</td>
            <td class="text-end">${totals.acadFixed.toLocaleString()}</td>
            <td class="text-end">${totals.acadPaid.toLocaleString()}</td>
            <td class="text-end">${totals.acadBal.toLocaleString()}</td>
            <td class="text-end">${totals.transFixed.toLocaleString()}</td>
            <td class="text-end">${totals.transPaid.toLocaleString()}</td>
            <td class="text-end">${totals.transBal.toLocaleString()}</td>
            <td class="text-end">${totals.concession.toLocaleString()}</td>
            <td class="text-end">${totals.totFixed.toLocaleString()}</td>
            <td class="text-end">${totals.actPaid.toLocaleString()}</td>
            <td class="text-end">${totals.totPaid.toLocaleString()}</td>
            <td class="text-end">${totals.totBal.toLocaleString()}</td>
        </tr>
    `;

    printWindow.document.write(`
      <html>
        <head><title>Balance List</title><style>${styles}</style></head>
        <body>
          <div class="print-container">
             <div class="text-center">
                <div class="school-name">${schoolInfo.name}</div>
                <div class="school-address">${schoolInfo.address}</div>
                <div class="report-title">Balance List (Academic + Misc) - ${currentAcademicYear}</div>
             </div>
             <table>
                <thead>
                    <tr>
                        <th colspan="2" style="border:none;"></th>
                        <th colspan="3" class="bg-acad text-center">ACADEMIC</th>
                        <th colspan="3" class="bg-trans text-center">TRANSPORT</th>
                        <th colspan="5" class="bg-summ text-center">SUMMARY</th>
                    </tr>
                    <tr class="bg-dark">
                        <th>Grade</th><th>Sec</th>
                        <th>Fixed</th><th>Paid</th><th>Bal</th>
                        <th>Fixed</th><th>Paid</th><th>Bal</th>
                        <th>Conc</th><th>Tot Fix</th><th>Act Paid</th><th>Tot Paid</th><th>Tot Bal</th>
                    </tr>
                </thead>
                <tbody>${tableRows}${footerRow}</tbody>
             </table>
             </div>
          <script>window.onload = function() { window.focus(); window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ---------------------------------------------------------------------------
  // EXPORT: PDF (Point 2 & 3: No Signatures, Grouped Headers)
  // ---------------------------------------------------------------------------
  const exportPDF = () => {
    if (reportData.length === 0) return toast.error("No data available");
    setProcessing(true);

    try {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
        const pageWidth = 297; 
        const primaryColor = [11, 61, 123];

        // Header
        doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(...primaryColor);
        doc.text(schoolInfo.name, pageWidth / 2, 12, { align: "center" });
        
        doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
        doc.text(schoolInfo.address, pageWidth / 2, 17, { align: "center" });
        
        doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(...primaryColor);
        doc.text(`BALANCE LIST - ${currentAcademicYear}`, pageWidth / 2, 24, { align: "center" });

        // Point 3: Complex Table Structure matching Screen/Print
        const head = [
            [
                { content: '', colSpan: 2, styles: { fillColor: [255, 255, 255] } },
                { content: 'ACADEMIC', colSpan: 3, styles: { halign: 'center', fillColor: [207, 226, 255], textColor: [0,0,0] } }, 
                { content: 'TRANSPORT', colSpan: 3, styles: { halign: 'center', fillColor: [207, 244, 252], textColor: [0,0,0] } }, 
                { content: 'SUMMARY', colSpan: 5, styles: { halign: 'center', fillColor: [255, 243, 205], textColor: [0,0,0] } }   
            ],
            [
                'Grade', 'Sec',
                'Fixed', 'Paid', 'Bal',
                'Fixed', 'Paid', 'Bal',
                'Conc', 'Tot Fix', 'Act Paid', 'Tot Paid', 'Tot Bal'
            ]
        ];

        const body = reportData.map(row => [
            row.standard, row.section,
            row.academicFixed?.toLocaleString(), row.academicPaid?.toLocaleString(), row.academicBalance?.toLocaleString(),
            row.transportFixed?.toLocaleString(), row.transportPaid?.toLocaleString(), row.transportBalance?.toLocaleString(),
            row.concession?.toLocaleString(), row.totalFixed?.toLocaleString(), row.actualPaid?.toLocaleString(), row.totalPaid?.toLocaleString(), row.totalBalance?.toLocaleString()
        ]);

        // Footer Row
        body.push([
            { content: 'TOTAL', colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } },
            totals.acadFixed?.toLocaleString(), totals.acadPaid?.toLocaleString(), totals.acadBal?.toLocaleString(),
            totals.transFixed?.toLocaleString(), totals.transPaid?.toLocaleString(), totals.transBal?.toLocaleString(),
            totals.concession?.toLocaleString(), totals.totFixed?.toLocaleString(), totals.actPaid?.toLocaleString(), totals.totPaid?.toLocaleString(), totals.totBal?.toLocaleString()
        ]);

        autoTable(doc, {
            head: head,
            body: body,
            startY: 28,
            theme: 'grid',
            styles: { fontSize: 8, halign: 'right', cellPadding: 1.5, lineColor: [0,0,0], lineWidth: 0.1 },
            columnStyles: { 0: { halign: 'left' }, 1: { halign: 'center' } }, 
            headStyles: { fillColor: primaryColor, textColor: [255,255,255], fontStyle: 'bold', halign: 'center' },
            margin: { top: 10, bottom: 10, left: 10, right: 10 }, 
        });

        // Point 2: No Signatures appended here

        doc.save("Balance_List.pdf");
        toast.success("PDF exported");
    } catch (error) {
        console.error("PDF Error", error);
        toast.error("PDF Export Failed");
    } finally {
        setProcessing(false);
    }
  }

  // ---------------------------------------------------------------------------
  // EXPORT: EXCEL (Point 3: Same Structure with Groups)
  // ---------------------------------------------------------------------------
  const exportToExcel = () => {
    if (reportData.length === 0) return toast.error("No data to export");
    setProcessing(true);

    try {
        const wb = XLSX.utils.book_new();
        
        // Headers matching logic
        const excelData = [
            [schoolInfo.name],
            [schoolInfo.address],
            [],
            ["BALANCE LIST REPORT", "", "", "", "", "", "", "", "", "", "", "", ""],
            [`Academic Year: ${currentAcademicYear}`, "", "", "", "", "", "", "", "", "", "", "", ""],
            [],
            ["", "", "ACADEMIC", "", "", "TRANSPORT", "", "", "SUMMARY", "", "", "", ""], // Group Row
            ["Grade", "Sec", "Fixed", "Paid", "Bal", "Fixed", "Paid", "Bal", "Conc", "Tot Fix", "Act Paid", "Tot Paid", "Tot Bal"] // Col Row
        ];

        // Data
        reportData.forEach(row => {
            excelData.push([
                row.standard, row.section,
                row.academicFixed, row.academicPaid, row.academicBalance,
                row.transportFixed, row.transportPaid, row.transportBalance,
                row.concession, row.totalFixed, row.actualPaid, row.totalPaid, row.totalBalance
            ]);
        });

        // Totals
        excelData.push([
            "GRAND TOTAL", "",
            totals.acadFixed, totals.acadPaid, totals.acadBal,
            totals.transFixed, totals.transPaid, totals.transBal,
            totals.concession, totals.totFixed, totals.actPaid, totals.totPaid, totals.totBal
        ]);

        const ws = XLSX.utils.aoa_to_sheet(excelData);

        // Merges for Headers
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }, // School Name
            { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } }, // Address
            { s: { r: 3, c: 0 }, e: { r: 3, c: 12 } }, // Title
            { s: { r: 4, c: 0 }, e: { r: 4, c: 12 } }, // Year
            // Table Group Headers
            { s: { r: 6, c: 2 }, e: { r: 6, c: 4 } }, // Academic (Cols 2,3,4)
            { s: { r: 6, c: 5 }, e: { r: 6, c: 7 } }, // Transport (Cols 5,6,7)
            { s: { r: 6, c: 8 }, e: { r: 6, c: 12 } } // Summary (Cols 8-12)
        ];

        // Column Widths
        ws['!cols'] = [
            { wch: 10 }, { wch: 6 }, // Grd, Sec
            { wch: 12 }, { wch: 12 }, { wch: 12 }, // Acad
            { wch: 12 }, { wch: 12 }, { wch: 12 }, // Trans
            { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 } // Summary
        ];

        XLSX.utils.book_append_sheet(wb, ws, "BalanceList");
        XLSX.writeFile(wb, `BalanceList_${currentAcademicYear}.xlsx`);
        toast.success("Excel exported");

    } catch (error) {
        console.error("Excel Error", error);
        toast.error("Excel Export Failed");
    } finally {
        setProcessing(false);
    }
  }

  const CellWithDetail = ({ amount, details, colorClass = "" }) => (
    <div className={`d-flex flex-column align-items-end ${colorClass}`}>
        <span className="fw-bold">{amount?.toLocaleString()}</span>
        {options.showDetails && details && (
            <span className="text-muted fst-italic" style={{fontSize: '0.65rem', whiteSpace: 'pre-wrap', textAlign: 'right'}}>
                {details}
            </span>
        )}
    </div>
  )

  const checkboxStyle = { transform: 'scale(0.9)', transformOrigin: 'left center', marginRight: '5px' }

  const resetFilters = () => {
      setFilters({ standard: "", section: "", feeHead: [] });
      setReportData([]);
      setHasGenerated(false);
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <ToastContainer position="top-right" />
        
        {/* Breadcrumb & Navigation */}
        <div className="mb-4 d-print-none">
          <nav className="d-flex custom-breadcrumb py-1 py-lg-3 align-items-center">
             <Link to="/home">Home</Link>
             <span className="separator mx-2">&gt;</span>
             <div>Reports</div>
             <span className="separator mx-2">&gt;</span>
             <span>Balance List 3</span>
          </nav>
        </div>
        
        <div className="d-flex align-items-center mb-3">
            <Button variant="link" className="text-dark p-0 me-3 text-decoration-none" onClick={() => navigate(-1)}>
                <FaArrowLeft size={18} /> Back
            </Button>
            <h4 className="mb-0 fw-bold text-primary">Balance List 3 (Academic + Misc)</h4>
        </div>

        {/* Filter Card */}
        <Card className="shadow-sm border-0 mb-4 bg-light">
            <Card.Header className="custom-btn-clr text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Balance List Configuration</h5>
                <Button size="sm" variant="outline-light" onClick={resetFilters}>
                    <FaRedo className="me-1" /> Reset
                </Button>
            </Card.Header>

            <Card.Body className="p-3">
                <Row className="g-3 align-items-end">
                    {/* Standard */}
                    <Col md={2} sm={6}>
                        <Form.Label className="small fw-bold text-muted mb-1">Standard</Form.Label>
                        <Form.Select size="sm" name="standard" value={filters.standard} onChange={handleFilterChange}>
                            <option value="">All Standards</option>
                            {setupData.standards.map(std => <option key={std.id} value={std.name}>{std.name}</option>)}
                        </Form.Select>
                    </Col>
                    {/* Section */}
                    <Col md={2} sm={6}>
                        <Form.Label className="small fw-bold text-muted mb-1">Section</Form.Label>
                        <Form.Select size="sm" name="section" value={filters.section} onChange={handleFilterChange}>
                            <option value="">All Sections</option>
                            {setupData.sections.map(sec => <option key={sec.id} value={sec.name}>{sec.name}</option>)}
                        </Form.Select>
                    </Col>
                      
                    {/* Fee Heads */}
                    <Col md={3} sm={6}>
                        <Form.Label className="small fw-bold text-muted mb-1">
                            Fee Heads
                        </Form.Label>
                        <Dropdown>
                            <Dropdown.Toggle variant="white" className="w-100 border text-start d-flex justify-content-between align-items-center bg-white" size="sm">
                                <span className="text-truncate" style={{ fontSize: '0.85rem' }}>
                                    {filters.feeHead.length > 0 ? `${filters.feeHead.length} Selected` : 'All Fee Heads'}
                                </span>
                            </Dropdown.Toggle>

                            <Dropdown.Menu className="w-100 p-2 shadow" style={{maxHeight: '300px', overflowY: 'auto'}}>
                                {setupData.feeHeadsGrouped.DayFC && setupData.feeHeadsGrouped.DayFC.length > 0 && (
                                    <>
                                        <h6 className="dropdown-header text-primary fw-bold small p-1">DayFC</h6>
                                        {setupData.feeHeadsGrouped.DayFC.map((head, idx) => (
                                            <div key={`d-${idx}`} className="d-flex align-items-center ps-2 py-0">
                                                <Form.Check 
                                                    type="checkbox"
                                                    id={`check-d-${idx}`}
                                                    checked={filters.feeHead.includes(head)}
                                                    onChange={() => handleFeeHeadCheckboxChange(head)}
                                                    style={checkboxStyle}
                                                    className="m-0"
                                                />
                                                <label htmlFor={`check-d-${idx}`} className="small text-dark cursor-pointer mb-0" style={{cursor:'pointer', fontSize: '0.8rem'}}>
                                                    {head}
                                                </label>
                                            </div>
                                        ))}
                                        <Dropdown.Divider />
                                    </>
                                )}

                                {setupData.feeHeadsGrouped.MissOth && setupData.feeHeadsGrouped.MissOth.length > 0 && (
                                    <>
                                        <h6 className="dropdown-header text-success fw-bold small p-1">Miss/Oth/Ind</h6>
                                        {setupData.feeHeadsGrouped.MissOth.map((head, idx) => (
                                            <div key={`m-${idx}`} className="d-flex align-items-center ps-2 py-0">
                                                <Form.Check 
                                                    type="checkbox"
                                                    id={`check-m-${idx}`}
                                                    checked={filters.feeHead.includes(head)}
                                                    onChange={() => handleFeeHeadCheckboxChange(head)}
                                                    style={checkboxStyle}
                                                    className="m-0"
                                                />
                                                <label htmlFor={`check-m-${idx}`} className="small text-dark cursor-pointer mb-0" style={{cursor:'pointer', fontSize: '0.8rem'}}>
                                                    {head}
                                                </label>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </Dropdown.Menu>
                        </Dropdown>
                    </Col>

                    {/* Actions and Checkboxes */}
                    <Col md={5} sm={12}>
                        <div className="d-flex align-items-center justify-content-between bg-white border rounded p-2">
                             <div className="d-flex gap-3">
                                <div className="d-flex align-items-center">
                                    <Form.Check 
                                        type="checkbox" 
                                        id="includeMisc"
                                        checked={options.includeMisc}
                                        onChange={handleOptionChange}
                                        name="includeMisc"
                                        style={checkboxStyle}
                                        className="m-0"
                                    />
                                    <label htmlFor="includeMisc" className="small fw-bold text-primary mb-0" style={{cursor:'pointer', fontSize: '0.8rem'}}>
                                        Include Misc
                                    </label>
                                </div>
                                <div className="d-flex align-items-center">
                                    <Form.Check 
                                        type="checkbox" 
                                        id="showDetails"
                                        checked={options.showDetails}
                                        onChange={handleOptionChange}
                                        name="showDetails"
                                        style={checkboxStyle}
                                        className="m-0"
                                    />
                                    <label htmlFor="showDetails" className="small fw-bold text-success mb-0" style={{cursor:'pointer', fontSize: '0.8rem'}}>
                                        Show Details
                                    </label>
                                </div>
                             </div>

                             {/* Action Buttons */}
                             <div className="d-flex gap-1">
                                <Button className="custom-btn-clr" size="sm" onClick={handleGenerate} disabled={isLoading} title="Generate">
                                    {isLoading ? <Spinner size="sm" animation="border"/> : <FaFilter/>}
                                </Button>
                                <Button variant="outline-primary" size="sm" onClick={handlePrint} disabled={!hasGenerated || reportData.length === 0} title="Print">
                                    <FaPrint />
                                </Button>
                                <Button variant="outline-danger" size="sm" onClick={exportPDF} disabled={!hasGenerated || reportData.length === 0} title="PDF">
                                    <FaFilePdf />
                                </Button>
                                <Button variant="outline-success" size="sm" onClick={exportToExcel} disabled={!hasGenerated || reportData.length === 0} title="Excel">
                                    <FaFileExcel />
                                </Button>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>

        {/* Report Table */}
        <Card className="shadow-sm border-0 mb-4">
          <Card.Body className="p-0">
            {hasGenerated ? (
                <div className="table-responsive" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <Table bordered hover size="sm" className="text-center align-middle mb-0 report-table" style={{ fontSize: '0.85rem', minWidth: '1300px' }}>
                    <thead className="bg-light sticky-top" style={{zIndex: 10, borderBottom: "2px solid black"}}>
                    {/* Header Group Row */}
                    <tr>
                        <th colSpan="2" className="bg-white border-bottom-0"></th>
                        <th colSpan="3" className="table-primary border-bottom text-primary text-uppercase" style={{backgroundColor:'#e3f2fd'}}>
                            Academic
                        </th>
                        <th colSpan="3" className="table-info border-bottom text-info text-uppercase" style={{backgroundColor:'#e0f7fa'}}>
                            Transport
                        </th>
                        <th colSpan="5" className="table-warning border-bottom text-dark text-uppercase" style={{backgroundColor:'#fff3cd'}}>
                            Summary
                        </th>
                    </tr>
                    {/* Header Column Row */}
                    <tr>
                        <th style={{width: '60px', backgroundColor: '#0B3D7B', color: 'white'}}>Grade</th>
                        <th style={{width: '50px', backgroundColor: '#0B3D7B', color: 'white'}}>Sec</th>
                          
                        <th style={{minWidth: '100px', backgroundColor: '#0B3D7B', color: 'white'}}>Fixed</th>
                        <th style={{minWidth: '100px', backgroundColor: '#0B3D7B', color: 'white'}}>Paid</th>
                        <th style={{minWidth: '100px', backgroundColor: '#0B3D7B', color: 'white'}}>Bal</th>

                        <th style={{minWidth: '100px', backgroundColor: '#0B3D7B', color: 'white'}}>Fixed</th>
                        <th style={{minWidth: '100px', backgroundColor: '#0B3D7B', color: 'white'}}>Paid</th>
                        <th style={{minWidth: '100px', backgroundColor: '#0B3D7B', color: 'white'}}>Bal</th>

                        <th style={{minWidth: '80px', backgroundColor: '#0B3D7B', color: 'white'}}>Conc</th>
                        <th style={{backgroundColor: '#0B3D7B', color: 'white'}}>Tot Fix</th>
                        <th style={{backgroundColor: '#0B3D7B', color: 'white'}}>Act Paid</th>
                        <th style={{backgroundColor: '#0B3D7B', color: 'white'}}>Tot Paid</th>
                        <th style={{backgroundColor: '#0B3D7B', color: 'white'}}>Tot Bal</th>
                    </tr>
                    </thead>
                    <tbody>
                    {isLoading ? (
                        <tr><td colSpan="13" className="py-5 text-center"><Spinner animation="border" /></td></tr>
                    ) : reportData.length === 0 ? (
                        <tr><td colSpan="13" className="text-center py-5 text-muted">No data found</td></tr>
                    ) : (
                        <>
                        {reportData.map((row, idx) => (
                            <tr key={idx} style={{backgroundColor: idx % 2 === 0 ? '#fff' : '#f8f9fa'}}>
                            <td className="fw-bold text-start ps-3">{row.standard}</td>
                            <td>{row.section}</td>
                             
                            <td><CellWithDetail amount={row.academicFixed} details={row.academicFixedDetails} /></td>
                            <td><CellWithDetail amount={row.academicPaid} details={row.academicPaidDetails} colorClass="text-success" /></td>
                            <td><CellWithDetail amount={row.academicBalance} details={row.academicBalanceDetails} colorClass="text-danger" /></td>

                            <td><CellWithDetail amount={row.transportFixed} details={row.transportFixedDetails} /></td>
                            <td><CellWithDetail amount={row.transportPaid} details={row.transportPaidDetails} colorClass="text-success" /></td>
                            <td><CellWithDetail amount={row.transportBalance} details={row.transportBalanceDetails} colorClass="text-danger" /></td>

                            <td><CellWithDetail amount={row.concession} details={row.concessionDetails} colorClass="text-primary" /></td>

                            <td className="text-end fw-bold">{row.totalFixed?.toLocaleString()}</td>
                            <td className="text-end fw-bold">{row.actualPaid?.toLocaleString()}</td>
                            <td className="text-end fw-bold">{row.totalPaid?.toLocaleString()}</td>
                            <td className="text-end fw-bold bg-light">{row.totalBalance?.toLocaleString()}</td>
                            </tr>
                        ))}
                        
                        <tr className="table-dark fw-bold sticky-bottom" style={{bottom: 0, zIndex: 10}}>
                            <td colSpan="2" className="text-end">Grand Total</td>
                            <td className="text-end">{totals.acadFixed.toLocaleString()}</td>
                            <td className="text-end">{totals.acadPaid.toLocaleString()}</td>
                            <td className="text-end">{totals.acadBal.toLocaleString()}</td>
                            <td className="text-end">{totals.transFixed.toLocaleString()}</td>
                            <td className="text-end">{totals.transPaid.toLocaleString()}</td>
                            <td className="text-end">{totals.transBal.toLocaleString()}</td>
                            <td className="text-end">{totals.concession.toLocaleString()}</td>
                            <td className="text-end">{totals.totFixed.toLocaleString()}</td>
                            <td className="text-end">{totals.actPaid.toLocaleString()}</td>
                            <td className="text-end">{totals.totPaid.toLocaleString()}</td>
                            <td className="text-end">{totals.totBal.toLocaleString()}</td>
                        </tr>
                        </>
                    )}
                    </tbody>
                </Table>
                </div>
            ) : (
                <div className="text-center py-5 text-muted bg-light">
                    <FaFilter size={40} className="mb-3 text-secondary"/>
                    <h5>Generate Report</h5>
                    <p>Select "Include Misc" to see Miscellaneous fees in the Academic column.</p>
                </div>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* Styles injected for theme consistency */}
      <style>{`
          .custom-btn-clr { background-color: #0B3D7B; border-color: #0B3D7B; color: white; }
          .custom-btn-clr:hover { background-color: #092c5a; border-color: #092c5a; }
          .table-primary { background-color: #cfe2ff !important; }
          .table-info { background-color: #cff4fc !important; }
          .table-warning { background-color: #fff3cd !important; }
          .report-table th { vertical-align: middle; }
      `}</style>
    </MainContentPage>
  )
}

export default BalanceList3