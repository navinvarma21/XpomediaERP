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

const BalanceList5 = () => {
  const navigate = useNavigate()
  const { getAuthHeaders, schoolId, currentAcademicYear } = useAuthContext()
    
  // Data States
  const [reportData, setReportData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [processing, setProcessing] = useState(false)

  // School Info State
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
    totFixed: 0, 
    actPaid: 0, 
    concession: 0,
    totPaid: 0, 
    totBal: 0
  })

  // 1. Initial Data Fetch
  useEffect(() => {
    if (schoolId) fetchSchoolInfo()
    if (schoolId && currentAcademicYear) fetchBasicDropdowns()
  }, [schoolId, currentAcademicYear])

  // 2. Fetch Fee Heads
  useEffect(() => {
    if (schoolId && currentAcademicYear) fetchFeeHeads()
  }, [schoolId, currentAcademicYear, options.includeMisc])

  const fetchSchoolInfo = async () => {
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/school/school-details?schoolId=${schoolId}`,
        { headers: getAuthHeaders() }
      );
      if (response.ok) {
        const data = await response.json();
        setSchoolInfo({
          name: data.schoolName || "SCHOOL NAME",
          address: data.schoolAddress || "Address",
          city: data.city || "", state: data.state || "", pincode: data.pincode || ""
        });
      }
    } catch (error) { console.error("Error fetching school info:", error); }
  };

  const fetchBasicDropdowns = async () => {
    try {
      const [coursesRes, sectionsRes] = await Promise.all([
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/courses?schoolId=${schoolId}`, { headers: getAuthHeaders() }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/sections?schoolId=${schoolId}`, { headers: getAuthHeaders() })
      ])
      const courses = coursesRes.ok ? await coursesRes.json() : []
      const sections = sectionsRes.ok ? await sectionsRes.json() : []
      setSetupData(prev => ({ ...prev, standards: Array.isArray(courses) ? courses : [], sections: Array.isArray(sections) ? sections : [] }))
    } catch (error) { console.error("Error fetching basic dropdowns:", error) }
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
      } catch (error) { console.error("Error fetching fee heads:", error) }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleFeeHeadCheckboxChange = (head) => {
    setFilters(prev => {
        const currentHeads = prev.feeHead;
        if (currentHeads.includes(head)) return { ...prev, feeHead: currentHeads.filter(h => h !== head) };
        else return { ...prev, feeHead: [...currentHeads, head] };
    });
  }

  const handleOptionChange = (e) => {
    const { name, checked } = e.target
    setOptions(prev => ({ ...prev, [name]: checked }))
  }

  // 3. Generate Report (REUSING LIST 3 BACKEND)
  const handleGenerate = async () => {
    if (!schoolId || !currentAcademicYear) return
    setIsLoading(true)
    setHasGenerated(true)

    try {
      let queryParams = `?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      if (filters.feeHead.length > 0) {
        filters.feeHead.forEach(head => queryParams += `&feeHead=${encodeURIComponent(head)}`)
      }
      queryParams += `&includeMisc=${options.includeMisc}` 
        
      const response = await fetch(
        `${ENDPOINTS.reports}/balance-list-3${queryParams}`, 
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        let data = await response.json()
        
        // Filter logic
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

  // --- FIXED: Explicit Calculation of Total Fixed ---
  // Calculates Total Fixed as (Academic Fixed + Transport Fixed) to ensure accuracy
  const getRowTotalFixed = (row) => {
    return (Number(row.academicFixed) || 0) + (Number(row.transportFixed) || 0);
  }

  const calculateGrandTotals = (data) => {
    const newTotals = data.reduce((acc, row) => ({
      totFixed: acc.totFixed + getRowTotalFixed(row), // Using explicit helper
      actPaid: acc.actPaid + (Number(row.actualPaid) || 0),
      concession: acc.concession + (Number(row.concession) || 0),
      totPaid: acc.totPaid + (Number(row.totalPaid) || 0),
      totBal: acc.totBal + (Number(row.totalBalance) || 0),
    }), { totFixed: 0, actPaid: 0, concession: 0, totPaid: 0, totBal: 0 })
    setTotals(newTotals)
  }

  // Helper to combine details
  const getCombinedDetails = (row, type) => {
    let acadDetails = "";
    let transDetails = "";

    if (type === 'fixed') {
        acadDetails = row.academicFixedDetails || "";
        transDetails = row.transportFixedDetails || "";
    } else if (type === 'paid') {
        acadDetails = row.academicPaidDetails || "";
        transDetails = row.transportPaidDetails || "";
    } else if (type === 'bal') {
        acadDetails = row.academicBalanceDetails || "";
        transDetails = row.transportBalanceDetails || "";
    }

    if (acadDetails && transDetails) return `${acadDetails}, ${transDetails}`;
    return acadDetails || transDetails;
  }

  // ---------------------------------------------------------------------------
  // EXPORT: PRINT
  // ---------------------------------------------------------------------------
  const handlePrint = () => {
    if (reportData.length === 0) return toast.error("No data to print");

    const printWindow = window.open('', '_blank', 'width=1123,height=794');
    if (!printWindow) return;

    const styles = `
      @page { size: A4 portrait; margin: 15mm; } 
      body { margin: 0; padding: 0; font-family: "Times New Roman", serif; background: white; font-size: 11pt; }
      .print-container { width: 100%; margin: 0 auto; }
      .text-center { text-align: center; }
      .text-end { text-align: right; }
      .text-start { text-align: left; }
      .school-name { font-size: 16pt; font-weight: bold; color: #0B3D7B; text-transform: uppercase; margin: 0; }
      .school-address { font-size: 10pt; margin: 5px 0; font-weight: bold; }
      .report-title { font-size: 14pt; font-weight: bold; color: #0B3D7B; margin: 15px 0; text-decoration: underline; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt; }
      th, td { border: 1px solid black; padding: 6px; }
      .bg-header { background-color: #0B3D7B !important; color: white !important; -webkit-print-color-adjust: exact; }
      .bg-footer { background-color: #333 !important; color: white !important; font-weight: bold; -webkit-print-color-adjust: exact; }
      tr:nth-child(even) { background-color: #f9f9f9; -webkit-print-color-adjust: exact; }
    `;

    const tableRows = reportData.map(row => `
        <tr>
            <td class="text-start">${row.standard}</td>
            <td class="text-center">${row.section}</td>
            <td class="text-end">${getRowTotalFixed(row)?.toLocaleString()}</td>
            <td class="text-end">${row.actualPaid?.toLocaleString()}</td>
            <td class="text-end">${row.concession?.toLocaleString()}</td>
            <td class="text-end">${row.totalPaid?.toLocaleString()}</td>
            <td class="text-end" style="font-weight:bold;">${row.totalBalance?.toLocaleString()}</td>
        </tr>
    `).join('');

    const footerRow = `
        <tr class="bg-footer">
            <td colspan="2" class="text-end">Grand Total</td>
            <td class="text-end">${totals.totFixed.toLocaleString()}</td>
            <td class="text-end">${totals.actPaid.toLocaleString()}</td>
            <td class="text-end">${totals.concession.toLocaleString()}</td>
            <td class="text-end">${totals.totPaid.toLocaleString()}</td>
            <td class="text-end">${totals.totBal.toLocaleString()}</td>
        </tr>
    `;

    printWindow.document.write(`
      <html>
        <head><title>Balance List 5</title><style>${styles}</style></head>
        <body>
          <div class="print-container">
             <div class="text-center">
                <div class="school-name">${schoolInfo.name}</div>
                <div class="school-address">${schoolInfo.address}</div>
                <div class="report-title">Balance List 5 (Summary) - ${currentAcademicYear}</div>
             </div>
             <table>
                <thead>
                    <tr class="bg-header">
                        <th>Grade</th><th>Sec</th>
                        <th>Total Fixed</th><th>Actual Paid</th><th>Concession</th><th>Total Paid</th><th>Balance</th>
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
  // EXPORT: PDF
  // ---------------------------------------------------------------------------
  const exportPDF = () => {
    if (reportData.length === 0) return toast.error("No data available");
    setProcessing(true);

    try {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
        const pageWidth = 210; 
        const primaryColor = [11, 61, 123];

        doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(...primaryColor);
        doc.text(schoolInfo.name, pageWidth / 2, 15, { align: "center" });
        
        doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
        doc.text(schoolInfo.address, pageWidth / 2, 20, { align: "center" });
        
        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...primaryColor);
        doc.text(`BALANCE LIST 5 (SUMMARY) - ${currentAcademicYear}`, pageWidth / 2, 28, { align: "center" });

        const head = [[ 'Grade', 'Sec', 'Total Fixed', 'Act Paid', 'Conc', 'Tot Paid', 'Balance' ]];

        const body = reportData.map(row => [
            row.standard, row.section,
            getRowTotalFixed(row)?.toLocaleString(), // Using Helper
            row.actualPaid?.toLocaleString(),
            row.concession?.toLocaleString(), 
            row.totalPaid?.toLocaleString(),
            row.totalBalance?.toLocaleString()
        ]);

        body.push([
            { content: 'TOTAL', colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } },
            totals.totFixed?.toLocaleString(), totals.actPaid?.toLocaleString(),
            totals.concession?.toLocaleString(), totals.totPaid?.toLocaleString(),
            totals.totBal?.toLocaleString()
        ]);

        autoTable(doc, {
            head: head,
            body: body,
            startY: 32,
            theme: 'grid',
            styles: { fontSize: 10, halign: 'right', cellPadding: 2, lineColor: [0,0,0], lineWidth: 0.1 },
            columnStyles: { 0: { halign: 'left' }, 1: { halign: 'center' } }, 
            headStyles: { fillColor: primaryColor, textColor: [255,255,255], fontStyle: 'bold', halign: 'center' },
            margin: { top: 10, bottom: 10, left: 15, right: 15 }, 
        });

        doc.save("Balance_List_5_Summary.pdf");
        toast.success("PDF exported");
    } catch (error) {
        console.error("PDF Error", error);
        toast.error("PDF Export Failed");
    } finally {
        setProcessing(false);
    }
  }

  // ---------------------------------------------------------------------------
  // EXPORT: EXCEL
  // ---------------------------------------------------------------------------
  const exportToExcel = () => {
    if (reportData.length === 0) return toast.error("No data to export");
    setProcessing(true);

    try {
        const wb = XLSX.utils.book_new();
        const excelData = [
            [schoolInfo.name],
            [schoolInfo.address],
            [],
            ["BALANCE LIST 5 (SUMMARY ONLY)", "", "", "", "", "", ""],
            [`Academic Year: ${currentAcademicYear}`, "", "", "", "", "", ""],
            [],
            ["Grade", "Sec", "Total Fixed", "Actual Paid", "Concession", "Total Paid", "Balance"] 
        ];

        reportData.forEach(row => {
            excelData.push([
                row.standard, row.section,
                getRowTotalFixed(row), // Using Helper
                row.actualPaid, row.concession, row.totalPaid, row.totalBalance
            ]);
        });

        excelData.push([
            "GRAND TOTAL", "",
            totals.totFixed, totals.actPaid, totals.concession, totals.totPaid, totals.totBal
        ]);

        const ws = XLSX.utils.aoa_to_sheet(excelData);

        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
            { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } },
            { s: { r: 4, c: 0 }, e: { r: 4, c: 6 } },
        ];

        ws['!cols'] = [
            { wch: 10 }, { wch: 6 }, 
            { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, "BalanceList5");
        XLSX.writeFile(wb, `BalanceList_5_Summary_${currentAcademicYear}.xlsx`);
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
  const resetFilters = () => { setFilters({ standard: "", section: "", feeHead: [] }); setReportData([]); setHasGenerated(false); }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <ToastContainer position="top-right" />
        
        {/* Breadcrumb */}
        <div className="mb-4 d-print-none">
          <nav className="d-flex custom-breadcrumb py-1 py-lg-3 align-items-center">
             <Link to="/home">Home</Link> <span className="separator mx-2">&gt;</span>
             <div>Reports</div> <span className="separator mx-2">&gt;</span>
             <span>Balance List 5</span>
          </nav>
        </div>
        
        <div className="d-flex align-items-center mb-3">
            <Button variant="link" className="text-dark p-0 me-3 text-decoration-none" onClick={() => navigate(-1)}>
                <FaArrowLeft size={18} /> Back
            </Button>
            <h4 className="mb-0 fw-bold text-primary">Balance List 5 (Summary Only)</h4>
        </div>

        {/* Filter Card */}
        <Card className="shadow-sm border-0 mb-4 bg-light">
            <Card.Header className="custom-btn-clr text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Report Configuration</h5>
                <Button size="sm" variant="outline-light" onClick={resetFilters}><FaRedo className="me-1" /> Reset</Button>
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
                        <Form.Label className="small fw-bold text-muted mb-1">Fee Heads</Form.Label>
                        <Dropdown>
                            <Dropdown.Toggle variant="white" className="w-100 border text-start d-flex justify-content-between align-items-center bg-white" size="sm">
                                <span className="text-truncate" style={{ fontSize: '0.85rem' }}>
                                    {filters.feeHead.length > 0 ? `${filters.feeHead.length} Selected` : 'All Fee Heads'}
                                </span>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="w-100 p-2 shadow" style={{maxHeight: '300px', overflowY: 'auto'}}>
                                {Object.keys(setupData.feeHeadsGrouped).map((groupKey) => (
                                    setupData.feeHeadsGrouped[groupKey].length > 0 && (
                                    <div key={groupKey}>
                                        <h6 className={`dropdown-header fw-bold small p-1 ${groupKey === 'DayFC' ? 'text-primary' : 'text-success'}`}>
                                            {groupKey}
                                        </h6>
                                        {setupData.feeHeadsGrouped[groupKey].map((head, idx) => (
                                            <div key={`${groupKey}-${idx}`} className="d-flex align-items-center ps-2 py-0">
                                                <Form.Check 
                                                    type="checkbox" id={`check-${groupKey}-${idx}`}
                                                    checked={filters.feeHead.includes(head)}
                                                    onChange={() => handleFeeHeadCheckboxChange(head)}
                                                    style={checkboxStyle} className="m-0"
                                                />
                                                <label htmlFor={`check-${groupKey}-${idx}`} className="small text-dark cursor-pointer mb-0" style={{cursor:'pointer', fontSize: '0.8rem'}}>
                                                    {head}
                                                </label>
                                            </div>
                                        ))}
                                        <Dropdown.Divider />
                                    </div>
                                    )
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>
                    </Col>

                    {/* Actions and Checkboxes */}
                    <Col md={5} sm={12}>
                        <div className="d-flex align-items-center justify-content-between bg-white border rounded p-2">
                             <div className="d-flex gap-3">
                                <div className="d-flex align-items-center">
                                    <Form.Check type="checkbox" id="includeMisc" checked={options.includeMisc} onChange={handleOptionChange} name="includeMisc" style={checkboxStyle} className="m-0" />
                                    <label htmlFor="includeMisc" className="small fw-bold text-primary mb-0" style={{cursor:'pointer', fontSize: '0.8rem'}}>Include Misc</label>
                                </div>
                                <div className="d-flex align-items-center">
                                    <Form.Check type="checkbox" id="showDetails" checked={options.showDetails} onChange={handleOptionChange} name="showDetails" style={checkboxStyle} className="m-0" />
                                    <label htmlFor="showDetails" className="small fw-bold text-success mb-0" style={{cursor:'pointer', fontSize: '0.8rem'}}>Show Details</label>
                                </div>
                             </div>

                             <div className="d-flex gap-1">
                                <Button className="custom-btn-clr" size="sm" onClick={handleGenerate} disabled={isLoading} title="Generate">
                                    {isLoading ? <Spinner size="sm" animation="border"/> : <FaFilter/>}
                                </Button>
                                <Button variant="outline-primary" size="sm" onClick={handlePrint} disabled={!hasGenerated || reportData.length === 0} title="Print"><FaPrint /></Button>
                                <Button variant="outline-danger" size="sm" onClick={exportPDF} disabled={!hasGenerated || reportData.length === 0} title="PDF"><FaFilePdf /></Button>
                                <Button variant="outline-success" size="sm" onClick={exportToExcel} disabled={!hasGenerated || reportData.length === 0} title="Excel"><FaFileExcel /></Button>
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
                <Table bordered hover size="sm" className="text-center align-middle mb-0 report-table" style={{ fontSize: '0.9rem', minWidth: '900px' }}>
                    <thead className="bg-light sticky-top" style={{zIndex: 10, borderBottom: "2px solid black"}}>
                    <tr style={{backgroundColor: '#0B3D7B', color: 'white'}}>
                        <th style={{width: '80px'}}>Grade</th>
                        <th style={{width: '70px'}}>Sec</th>
                        <th>Total Fixed</th>
                        <th>Actual Paid</th>
                        <th>Concession</th>
                        <th>Total Paid</th>
                        <th>Balance</th>
                    </tr>
                    </thead>
                    <tbody>
                    {isLoading ? (
                        <tr><td colSpan="7" className="py-5 text-center"><Spinner animation="border" /></td></tr>
                    ) : reportData.length === 0 ? (
                        <tr><td colSpan="7" className="text-center py-5 text-muted">No data found</td></tr>
                    ) : (
                        <>
                        {reportData.map((row, idx) => (
                            <tr key={idx} style={{backgroundColor: idx % 2 === 0 ? '#fff' : '#f8f9fa'}}>
                                <td className="fw-bold text-start ps-3">{row.standard}</td>
                                <td>{row.section}</td>
                                
                                <td><CellWithDetail amount={getRowTotalFixed(row)} details={getCombinedDetails(row, 'fixed')} /></td>
                                <td><CellWithDetail amount={row.actualPaid} details={getCombinedDetails(row, 'paid')} colorClass="text-success" /></td>
                                <td><CellWithDetail amount={row.concession} details={row.concessionDetails} colorClass="text-primary" /></td>
                                <td className="fw-bold">{row.totalPaid?.toLocaleString()}</td>
                                <td><CellWithDetail amount={row.totalBalance} details={getCombinedDetails(row, 'bal')} colorClass="text-danger fw-bold" /></td>
                            </tr>
                        ))}
                        <tr className="table-dark fw-bold sticky-bottom" style={{bottom: 0, zIndex: 10}}>
                            <td colSpan="2" className="text-end">Grand Total</td>
                            <td className="text-end">{totals.totFixed.toLocaleString()}</td>
                            <td className="text-end">{totals.actPaid.toLocaleString()}</td>
                            <td className="text-end">{totals.concession.toLocaleString()}</td>
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
                    <h5>Generate Balance List 5</h5>
                    <p>Select filters and click generate to view the consolidated report.</p>
                </div>
            )}
          </Card.Body>
        </Card>
      </Container>
      <style>{`
          .custom-btn-clr { background-color: #0B3D7B; border-color: #0B3D7B; color: white; }
          .custom-btn-clr:hover { background-color: #092c5a; border-color: #092c5a; }
          .report-table th { vertical-align: middle; }
      `}</style>
    </MainContentPage>
  )
}

export default BalanceList5