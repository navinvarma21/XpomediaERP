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

const BalanceList4 = () => {
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
    acadFixed: 0, acadPaid: 0, acadBal: 0,
    transFixed: 0, transPaid: 0, transBal: 0,
    conc: 0, totFixed: 0, actPaid: 0, totPaid: 0, totBal: 0
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

  // --- API Functions ---
  const fetchSchoolInfo = async () => {
    try {
      const response = await fetch(`${ENDPOINTS.admissionmaster}/school/school-details?schoolId=${schoolId}`, { headers: getAuthHeaders() });
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
    } catch (error) { console.error("Error fetching dropdowns:", error) }
  }

  const fetchFeeHeads = async () => {
      try {
        const response = await fetch(`${ENDPOINTS.reports}/balance-list-4/heads?schoolId=${schoolId}&academicYear=${currentAcademicYear}&includeMisc=${options.includeMisc}`, { headers: getAuthHeaders() })
        if (response.ok) {
            const data = await response.json()
            setSetupData(prev => ({ ...prev, feeHeadsGrouped: data }))
        }
      } catch (error) { console.error("Error fetching fee heads:", error) }
  }

  // --- Handlers ---
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleFeeHeadCheckboxChange = (head) => {
    setFilters(prev => {
        const currentHeads = prev.feeHead;
        return currentHeads.includes(head) 
            ? { ...prev, feeHead: currentHeads.filter(h => h !== head) } 
            : { ...prev, feeHead: [...currentHeads, head] };
    });
  }

  const handleOptionChange = (e) => setOptions(prev => ({ ...prev, [e.target.name]: e.target.checked }))

  // --- Generate Logic ---
  const handleGenerate = async () => {
    if (!schoolId || !currentAcademicYear) return toast.error("School ID or Academic Year is missing");
    
    setIsLoading(true)
    setHasGenerated(true)

    try {
      let queryParams = `?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      if (filters.feeHead.length > 0) queryParams += `&feeHead=${filters.feeHead.map(head => encodeURIComponent(head)).join('&feeHead=')}`
      queryParams += `&includeMisc=${options.includeMisc}` 
        
      const response = await fetch(`${ENDPOINTS.reports}/balance-list-4${queryParams}`, { headers: getAuthHeaders() })

      if (response.ok) {
        let data = await response.json()
        // Client-side filtering
        if (filters.standard) data = data.filter(row => row.standard === filters.standard);
        if (filters.section) data = data.filter(row => row.section === filters.section);

        setReportData(data)
        calculateGrandTotals(data)
        if(data.length === 0) toast.info("No records found")
      } else {
        toast.error("Failed to fetch data");
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
      acadFixed: acc.acadFixed + (parseFloat(row.academicFixed) || 0),
      acadPaid: acc.acadPaid + (parseFloat(row.academicPaid) || 0),
      acadBal: acc.acadBal + (parseFloat(row.academicBalance) || 0),
      transFixed: acc.transFixed + (parseFloat(row.transportFixed) || 0),
      transPaid: acc.transPaid + (parseFloat(row.transportPaid) || 0),
      transBal: acc.transBal + (parseFloat(row.transportBalance) || 0),
      conc: acc.conc + (parseFloat(row.concession) || 0),
      totFixed: acc.totFixed + (parseFloat(row.totalFixed) || 0),
      actPaid: acc.actPaid + (parseFloat(row.actualPaid) || 0),
      totPaid: acc.totPaid + (parseFloat(row.totalPaid) || 0),
      totBal: acc.totBal + (parseFloat(row.totalBalance) || 0),
    }), { acadFixed: 0, acadPaid: 0, acadBal: 0, transFixed: 0, transPaid: 0, transBal: 0, conc: 0, totFixed: 0, actPaid: 0, totPaid: 0, totBal: 0 })
    setTotals(newTotals)
  }

  // --- Exports ---
  
  // 1. PRINT
  const handlePrint = () => {
    if (reportData.length === 0) return toast.error("No data to print");
    const printWindow = window.open('', '_blank', 'width=1123,height=794');
    if (!printWindow) return;

    const styles = `
      @page { size: 297mm 210mm; margin: 10mm; }
      body { margin: 0; padding: 0; font-family: "Times New Roman", serif; background: white; font-size: 9pt; }
      .print-container { width: 100%; margin: 0 auto; }
      .text-center { text-align: center; } .text-end { text-align: right; } .text-start { text-align: left; }
      .school-name { font-size: 16pt; font-weight: bold; color: #0B3D7B; text-transform: uppercase; margin: 0; }
      .school-address { font-size: 10pt; margin: 5px 0; font-weight: bold; }
      .report-title { font-size: 12pt; font-weight: bold; color: #0B3D7B; margin: 10px 0; text-decoration: underline; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 8pt; }
      th, td { border: 1px solid black; padding: 4px; }
      /* Exact UI Theme Matches */
      .bg-acad { background-color: #cfe2ff !important; -webkit-print-color-adjust: exact; }
      .bg-trans { background-color: #cff4fc !important; -webkit-print-color-adjust: exact; }
      .bg-summ { background-color: #fff3cd !important; -webkit-print-color-adjust: exact; }
      .bg-dark { background-color: #0B3D7B !important; color: white !important; -webkit-print-color-adjust: exact; }
      .bg-footer { background-color: #333 !important; color: white !important; font-weight: bold; -webkit-print-color-adjust: exact; }
      tr:nth-child(even) { background-color: #f9f9f9; -webkit-print-color-adjust: exact; }
      .detail-text { font-size: 7pt; font-style: italic; display: block; white-space: pre-wrap; margin-top: 2px; }
    `;

    const showD = options.showDetails;
    const det = (txt) => showD && txt ? `<span class="detail-text">${txt}</span>` : '';
    const fmt = (v) => (parseFloat(v) || 0).toLocaleString();

    const tableRows = reportData.map((row, i) => `
        <tr>
            <td class="text-center">${i + 1}</td>
            <td class="text-center">${row.admissionNumber || ''}</td>
            <td class="text-start">${row.studentName || ''}</td>
            <td class="text-start">${row.fatherName || ''}</td>
            <td class="text-center">${row.grade || ''}</td>
            <td class="text-start">${row.boardingPoint || ''}</td>
            <td class="text-end">${fmt(row.academicFixed)} ${det(row.academicFixedDetails)}</td>
            <td class="text-end">${fmt(row.academicPaid)} ${det(row.academicPaidDetails)}</td>
            <td class="text-end">${fmt(row.academicBalance)}</td>
            <td class="text-end">${fmt(row.transportFixed)} ${det(row.transportFixedDetails)}</td>
            <td class="text-end">${fmt(row.transportPaid)} ${det(row.transportPaidDetails)}</td>
            <td class="text-end">${fmt(row.transportBalance)}</td>
            <td class="text-end">${fmt(row.concession)} ${det(row.concessionDetails)}</td>
            <td class="text-start">${row.narrative || ''}</td>
            <td class="text-end">${fmt(row.totalFixed)}</td>
            <td class="text-end">${fmt(row.actualPaid)}</td>
            <td class="text-end">${fmt(row.totalPaid)}</td>
            <td class="text-end">${fmt(row.totalBalance)}</td>
        </tr>`).join('');

    const footer = `
        <tr class="bg-footer">
            <td colspan="6" class="text-end">Grand Total</td>
            <td class="text-end">${fmt(totals.acadFixed)}</td>
            <td class="text-end">${fmt(totals.acadPaid)}</td>
            <td class="text-end">${fmt(totals.acadBal)}</td>
            <td class="text-end">${fmt(totals.transFixed)}</td>
            <td class="text-end">${fmt(totals.transPaid)}</td>
            <td class="text-end">${fmt(totals.transBal)}</td>
            <td class="text-end">${fmt(totals.conc)}</td>
            <td></td>
            <td class="text-end">${fmt(totals.totFixed)}</td>
            <td class="text-end">${fmt(totals.actPaid)}</td>
            <td class="text-end">${fmt(totals.totPaid)}</td>
            <td class="text-end">${fmt(totals.totBal)}</td>
        </tr>`;

    printWindow.document.write(`<html><head><title>Balance List 4</title><style>${styles}</style></head>
        <body><div class="print-container">
             <div class="text-center">
                <div class="school-name">${schoolInfo.name}</div>
                <div class="school-address">${schoolInfo.address}</div>
                <div class="report-title">Balance List 4 - ${currentAcademicYear}</div>
             </div>
             <table>
                <thead>
                    <tr>
                        <th colspan="6" style="border:none;"></th>
                        <th colspan="3" class="bg-acad text-center">ACADEMIC</th>
                        <th colspan="3" class="bg-trans text-center">TRANSPORT</th>
                        <th colspan="2" class="bg-summ text-center">REMARKS</th>
                        <th colspan="4" class="bg-summ text-center">SUMMARY</th>
                    </tr>
                    <tr class="bg-dark">
                        <th>Sl</th><th>Adm No</th><th>Student Name</th><th>Father Name</th><th>Grade</th><th>Point</th>
                        <th>Fixed</th><th>Paid</th><th>Bal</th>
                        <th>Fixed</th><th>Paid</th><th>Bal</th>
                        <th>Conc</th><th>Narrat</th>
                        <th>Tot Fix</th><th>Act Paid</th><th>Tot Paid</th><th>Tot Bal</th>
                    </tr>
                </thead>
                <tbody>${tableRows}${footer}</tbody>
             </table>
        </div><script>window.onload=function(){window.focus();window.print();window.close();}</script></body></html>`);
    printWindow.document.close();
  };

  // 2. PDF
  const exportPDF = () => {
    if (reportData.length === 0) return toast.error("No data available");
    setProcessing(true);
    try {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
        const pageWidth = doc.internal.pageSize.getWidth();
        const primaryColor = [11, 61, 123];

        doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(...primaryColor);
        doc.text(schoolInfo.name, pageWidth / 2, 12, { align: "center" });
        doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(0);
        doc.text(schoolInfo.address, pageWidth / 2, 17, { align: "center" });
        doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(...primaryColor);
        doc.text(`BALANCE LIST 4 - ${currentAcademicYear}`, pageWidth / 2, 24, { align: "center" });

        const head = [
            [
                { content: '', colSpan: 6, styles: { fillColor: [255, 255, 255] } },
                { content: 'ACADEMIC', colSpan: 3, styles: { halign: 'center', fillColor: [207, 226, 255], textColor: 0 } }, 
                { content: 'TRANSPORT', colSpan: 3, styles: { halign: 'center', fillColor: [207, 244, 252], textColor: 0 } }, 
                { content: 'REMARKS', colSpan: 2, styles: { halign: 'center', fillColor: [255, 243, 205], textColor: 0 } },
                { content: 'SUMMARY', colSpan: 4, styles: { halign: 'center', fillColor: [255, 243, 205], textColor: 0 } }   
            ],
            ['Sl', 'Adm', 'Name', 'Father', 'Grd', 'Point', 'Fix', 'Paid', 'Bal', 'Fix', 'Paid', 'Bal', 'Conc', 'Narr', 'T.Fix', 'A.Paid', 'T.Paid', 'T.Bal']
        ];

        const fmt = (v) => (parseFloat(v)||0).toLocaleString();
        const body = reportData.map((row, i) => [
            i + 1, row.admissionNumber, row.studentName, row.fatherName, row.grade, row.boardingPoint,
            fmt(row.academicFixed), fmt(row.academicPaid), fmt(row.academicBalance),
            fmt(row.transportFixed), fmt(row.transportPaid), fmt(row.transportBalance),
            fmt(row.concession), row.narrative,
            fmt(row.totalFixed), fmt(row.actualPaid), fmt(row.totalPaid), fmt(row.totalBalance)
        ]);

        body.push([{ content: 'TOTAL', colSpan: 6, styles: { fontStyle: 'bold', halign: 'right' } },
            fmt(totals.acadFixed), fmt(totals.acadPaid), fmt(totals.acadBal),
            fmt(totals.transFixed), fmt(totals.transPaid), fmt(totals.transBal),
            fmt(totals.conc), '',
            fmt(totals.totFixed), fmt(totals.actPaid), fmt(totals.totPaid), fmt(totals.totBal)
        ]);

        autoTable(doc, {
            head: head, body: body, startY: 28, theme: 'grid',
            styles: { fontSize: 7, halign: 'right', cellPadding: 1, lineColor: [0,0,0], lineWidth: 0.1 },
            columnStyles: { 0: {halign:'center'}, 1: {halign:'center'}, 2: {halign:'left'}, 3: {halign:'left'}, 4: {halign:'center'}, 5: {halign:'left'}, 13: {halign:'left'} },
            headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold', halign: 'center' },
            margin: { top: 10, bottom: 10, left: 5, right: 5 }, 
        });
        doc.save(`BalanceList4.pdf`);
        toast.success("PDF exported");
    } catch (e) { toast.error("PDF Failed"); } finally { setProcessing(false); }
  }

  // 3. EXCEL
  const exportToExcel = () => {
    if (reportData.length === 0) return toast.error("No data");
    setProcessing(true);
    try {
        const wb = XLSX.utils.book_new();
        const head = ["Sl","Adm","Name","Father","Grd","Point","Fixed","Paid","Bal","Fixed","Paid","Bal","Conc","Narrat","Tot Fix","Act Paid","Tot Paid","Tot Bal"];
        const excelData = [
            [schoolInfo.name], [schoolInfo.address], [], ["BALANCE LIST 4"], [`Year: ${currentAcademicYear}`], [],
            ["","","","","","", "ACADEMIC","","","TRANSPORT","","","REMARKS","","SUMMARY","","",""], // Group Row
            head
        ];

        reportData.forEach((row, i) => {
            excelData.push([
                i + 1, row.admissionNumber, row.studentName, row.fatherName, row.grade, row.boardingPoint,
                row.academicFixed, row.academicPaid, row.academicBalance,
                row.transportFixed, row.transportPaid, row.transportBalance,
                row.concession, row.narrative,
                row.totalFixed, row.actualPaid, row.totalPaid, row.totalBalance
            ]);
        });
        excelData.push(["TOTAL","","","","","",totals.acadFixed,totals.acadPaid,totals.acadBal,totals.transFixed,totals.transPaid,totals.transBal,totals.conc,"",totals.totFixed,totals.actPaid,totals.totPaid,totals.totBal]);

        const ws = XLSX.utils.aoa_to_sheet(excelData);
        ws['!merges'] = [
            { s: {r:0,c:0}, e: {r:0,c:17} }, { s: {r:1,c:0}, e: {r:1,c:17} }, { s: {r:3,c:0}, e: {r:3,c:17} }, { s: {r:4,c:0}, e: {r:4,c:17} },
            { s: {r:6,c:6}, e: {r:6,c:8} }, { s: {r:6,c:9}, e: {r:6,c:11} }, { s: {r:6,c:12}, e: {r:6,c:13} }, { s: {r:6,c:14}, e: {r:6,c:17} }
        ];
        ws['!cols'] = [{wch:5}, {wch:10}, {wch:25}, {wch:20}, {wch:8}, {wch:15}, {wch:10}, {wch:10}, {wch:10}, {wch:10}, {wch:10}, {wch:10}, {wch:8}, {wch:15}, {wch:12}, {wch:12}, {wch:12}, {wch:12}];

        XLSX.utils.book_append_sheet(wb, ws, "BalanceList4");
        XLSX.writeFile(wb, `BalanceList4.xlsx`);
        toast.success("Excel exported");
    } catch (e) { toast.error("Excel Failed"); } finally { setProcessing(false); }
  }

  // --- Helpers ---
  const resetFilters = () => { setFilters({ standard: "", section: "", feeHead: [] }); setReportData([]); setHasGenerated(false); }
  const CellWithDetail = ({ amount, details, colorClass = "" }) => (
    <div className={`d-flex flex-column align-items-end ${colorClass}`}>
        <span className="fw-bold">{amount ? parseFloat(amount).toLocaleString() : '0'}</span>
        {options.showDetails && details && <span className="text-muted fst-italic" style={{fontSize: '0.65rem', textAlign: 'right', whiteSpace:'pre-wrap'}}>{details}</span>}
    </div>
  )
  const fmt = (val) => val ? parseFloat(val).toLocaleString('en-IN', {maximumFractionDigits: 0}) : '0';
  const checkboxStyle = { transform: 'scale(0.9)', transformOrigin: 'left center', marginRight: '5px' }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <ToastContainer position="top-right" />
        
        {/* Navigation */}
        <div className="mb-4 d-print-none">
          <nav className="d-flex custom-breadcrumb py-1 py-lg-3 align-items-center">
             <Link to="/home">Home</Link><span className="separator mx-2">&gt;</span>
             <div>Reports</div><span className="separator mx-2">&gt;</span><span>Balance List 4</span>
          </nav>
        </div>
        <div className="d-flex align-items-center mb-3">
            <Button variant="link" className="text-dark p-0 me-3 text-decoration-none" onClick={() => navigate(-1)}><FaArrowLeft size={18} /> Back</Button>
            <h4 className="mb-0 fw-bold text-primary">Balance List 4 (Individual Report)</h4>
        </div>

        {/* Filter Card */}
        <Card className="shadow-sm border-0 mb-4 bg-light">
            <Card.Header className="custom-btn-clr text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Configuration</h5>
                <Button size="sm" variant="outline-light" onClick={resetFilters}><FaRedo className="me-1" /> Reset</Button>
            </Card.Header>
            <Card.Body className="p-3">
                <Row className="g-3 align-items-end">
                    <Col md={2} sm={6}>
                        <Form.Label className="small fw-bold text-muted mb-1">Standard</Form.Label>
                        <Form.Select size="sm" name="standard" value={filters.standard} onChange={handleFilterChange}>
                            <option value="">All Standards</option>
                            {setupData.standards.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </Form.Select>
                    </Col>
                    <Col md={2} sm={6}>
                        <Form.Label className="small fw-bold text-muted mb-1">Section</Form.Label>
                        <Form.Select size="sm" name="section" value={filters.section} onChange={handleFilterChange}>
                            <option value="">All Sections</option>
                            {setupData.sections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </Form.Select>
                    </Col>
                    <Col md={3} sm={6}>
                        <Form.Label className="small fw-bold text-muted mb-1">Fee Heads</Form.Label>
                        <Dropdown>
                            <Dropdown.Toggle variant="white" className="w-100 border text-start d-flex justify-content-between align-items-center bg-white" size="sm">
                                <span className="text-truncate" style={{fontSize: '0.85rem'}}>{filters.feeHead.length > 0 ? `${filters.feeHead.length} Selected` : 'All Fee Heads'}</span>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="w-100 p-2 shadow" style={{maxHeight: '300px', overflowY: 'auto'}}>
                                {setupData.feeHeadsGrouped.DayFC?.length > 0 && <><h6 className="dropdown-header text-primary fw-bold small p-1">DayFC</h6>{setupData.feeHeadsGrouped.DayFC.map((h,i) => <div key={'d'+i} className="d-flex align-items-center ps-2"><Form.Check type="checkbox" checked={filters.feeHead.includes(h)} onChange={()=>handleFeeHeadCheckboxChange(h)} style={checkboxStyle}/><label className="small mb-0" style={{cursor:'pointer'}} onClick={()=>handleFeeHeadCheckboxChange(h)}>{h}</label></div>)}<Dropdown.Divider/></>}
                                {setupData.feeHeadsGrouped.MissOth?.length > 0 && <><h6 className="dropdown-header text-success fw-bold small p-1">Miss/Oth</h6>{setupData.feeHeadsGrouped.MissOth.map((h,i) => <div key={'m'+i} className="d-flex align-items-center ps-2"><Form.Check type="checkbox" checked={filters.feeHead.includes(h)} onChange={()=>handleFeeHeadCheckboxChange(h)} style={checkboxStyle}/><label className="small mb-0" style={{cursor:'pointer'}} onClick={()=>handleFeeHeadCheckboxChange(h)}>{h}</label></div>)}</>}
                            </Dropdown.Menu>
                        </Dropdown>
                    </Col>
                    <Col md={5} sm={12}>
                        <div className="d-flex align-items-center justify-content-between bg-white border rounded p-2">
                             <div className="d-flex gap-3">
                                <Form.Check type="checkbox" id="includeMisc" name="includeMisc" checked={options.includeMisc} onChange={handleOptionChange} label={<span className="small fw-bold text-primary" style={{fontSize:'0.8rem'}}>Include Misc</span>} style={checkboxStyle} />
                                <Form.Check type="checkbox" id="showDetails" name="showDetails" checked={options.showDetails} onChange={handleOptionChange} label={<span className="small fw-bold text-success" style={{fontSize:'0.8rem'}}>Show Details</span>} style={checkboxStyle} />
                             </div>
                             <div className="d-flex gap-1">
                                <Button className="custom-btn-clr" size="sm" onClick={handleGenerate} disabled={isLoading} title="Generate">{isLoading ? <Spinner size="sm"/> : <FaFilter/>}</Button>
                                <Button variant="outline-primary" size="sm" onClick={handlePrint} disabled={!hasGenerated} title="Print"><FaPrint/></Button>
                                <Button variant="outline-danger" size="sm" onClick={exportPDF} disabled={!hasGenerated} title="PDF"><FaFilePdf/></Button>
                                <Button variant="outline-success" size="sm" onClick={exportToExcel} disabled={!hasGenerated} title="Excel"><FaFileExcel/></Button>
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
                <Table bordered hover size="sm" className="text-center align-middle mb-0 report-table" style={{ fontSize: '0.8rem', minWidth: '1600px' }}>
                    <thead className="bg-light sticky-top" style={{zIndex: 10, borderBottom: "2px solid black"}}>
                    <tr>
                        <th colSpan="6" className="bg-white border-bottom-0">Student Information</th>
                        <th colSpan="3" className="table-primary border-bottom text-primary text-uppercase" style={{backgroundColor:'#e3f2fd'}}>Academic</th>
                        <th colSpan="3" className="table-info border-bottom text-info text-uppercase" style={{backgroundColor:'#e0f7fa'}}>Transport</th>
                        <th colSpan="2" className="bg-white border-bottom-0">Remarks</th>
                        <th colSpan="4" className="table-warning border-bottom text-dark text-uppercase" style={{backgroundColor:'#fff3cd'}}>Summary</th>
                    </tr>
                    <tr>
                        {['Sl','Adm No','Stud Name','Father Name','Grade','Point'].map((h,i) => <th key={i} style={{backgroundColor: '#0B3D7B', color: 'white'}}>{h}</th>)}
                        <th className="table-primary">Fixed</th><th className="table-primary">Paid</th><th className="table-primary">Bal</th>
                        <th className="table-info">Fixed</th><th className="table-info">Paid</th><th className="table-info">Bal</th>
                        <th style={{backgroundColor: '#0B3D7B', color: 'white'}}>Conc</th><th style={{backgroundColor: '#0B3D7B', color: 'white'}}>Narrat</th>
                        <th className="table-warning">Tot Fix</th><th className="table-warning">Act Paid</th><th className="table-warning">Tot Paid</th><th className="table-warning">Tot Bal</th>
                    </tr>
                    </thead>
                    <tbody>
                    {isLoading ? <tr><td colSpan="18" className="py-5"><Spinner animation="border"/></td></tr> : reportData.length === 0 ? <tr><td colSpan="18" className="py-5 text-muted">No Data</td></tr> : (
                        <>
                        {reportData.map((row, idx) => (
                            <tr key={idx} style={{backgroundColor: idx % 2 === 0 ? '#fff' : '#f8f9fa'}}>
                                <td>{idx + 1}</td><td className="fw-bold">{row.admissionNumber}</td><td className="text-start fw-bold">{row.studentName}</td><td className="text-start">{row.fatherName}</td>
                                <td>{row.grade}</td><td className="text-start text-truncate" style={{maxWidth:'100px'}} title={row.boardingPoint}>{row.boardingPoint}</td>
                                <td className="table-primary-subtle text-end"><CellWithDetail amount={row.academicFixed} details={row.academicFixedDetails}/></td>
                                <td className="table-primary-subtle text-end"><CellWithDetail amount={row.academicPaid} details={row.academicPaidDetails} colorClass="text-success"/></td>
                                <td className="table-primary-subtle text-end fw-bold text-danger">{fmt(row.academicBalance)}</td>
                                <td className="table-info-subtle text-end"><CellWithDetail amount={row.transportFixed} details={row.transportFixedDetails}/></td>
                                <td className="table-info-subtle text-end"><CellWithDetail amount={row.transportPaid} details={row.transportPaidDetails} colorClass="text-success"/></td>
                                <td className="table-info-subtle text-end fw-bold text-danger">{fmt(row.transportBalance)}</td>
                                <td className="text-end text-primary"><CellWithDetail amount={row.concession} details={row.concessionDetails} colorClass="text-primary"/></td>
                                <td className="text-start text-truncate" style={{maxWidth:'100px'}} title={row.narrative}>{row.narrative}</td>
                                <td className="table-warning-subtle text-end fw-bold">{fmt(row.totalFixed)}</td>
                                <td className="table-warning-subtle text-end">{fmt(row.actualPaid)}</td>
                                <td className="table-warning-subtle text-end fw-bold">{fmt(row.totalPaid)}</td>
                                <td className="bg-danger text-white text-end fw-bold">{fmt(row.totalBalance)}</td>
                            </tr>
                        ))}
                        <tr className="table-dark fw-bold sticky-bottom" style={{bottom: 0, zIndex: 10}}>
                            <td colSpan="6" className="text-end">GRAND TOTAL</td>
                            <td className="text-end">{fmt(totals.acadFixed)}</td><td className="text-end">{fmt(totals.acadPaid)}</td><td className="text-end">{fmt(totals.acadBal)}</td>
                            <td className="text-end">{fmt(totals.transFixed)}</td><td className="text-end">{fmt(totals.transPaid)}</td><td className="text-end">{fmt(totals.transBal)}</td>
                            <td className="text-end">{fmt(totals.conc)}</td><td></td>
                            <td className="text-end">{fmt(totals.totFixed)}</td><td className="text-end">{fmt(totals.actPaid)}</td><td className="text-end">{fmt(totals.totPaid)}</td><td className="text-end">{fmt(totals.totBal)}</td>
                        </tr>
                        </>
                    )}
                    </tbody>
                </Table>
                </div>
            ) : (
                <div className="text-center py-5 text-muted bg-light"><FaFilter size={40} className="mb-3 text-secondary"/><h5>Generate Report</h5></div>
            )}
          </Card.Body>
        </Card>
      </Container>
      <style>{`
          .custom-btn-clr { background-color: #0B3D7B !important; border-color: #0B3D7B !important; color: white !important; }
          .custom-btn-clr:hover { background-color: #092c5a !important; border-color: #092c5a !important; }
          .table-primary { background-color: #cfe2ff !important; } .table-info { background-color: #cff4fc !important; } .table-warning { background-color: #fff3cd !important; }
          .table-primary-subtle { background-color: #e3f2fd !important; } .table-info-subtle { background-color: #e0f7fa !important; } .table-warning-subtle { background-color: #fff3cd !important; }
          .report-table th, .report-table td { vertical-align: middle !important; }
          .sticky-bottom { position: sticky; bottom: 0; } .sticky-top { position: sticky; top: 0; }
      `}</style>
    </MainContentPage>
  )
}

export default BalanceList4