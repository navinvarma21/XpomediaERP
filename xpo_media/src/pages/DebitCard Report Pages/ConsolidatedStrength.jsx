import React, { useState, useEffect } from 'react';
import MainContentPage from '../../components/MainContent/MainContentPage';
import { Link } from "react-router-dom";
import { useAuthContext } from "../../Context/AuthContext";
import { ENDPOINTS } from "../../SpringBoot/config";
import { Spinner, Table, Button, Form, Row, Col } from 'react-bootstrap';
import { FaFileExcel, FaFilePdf } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ConsolidatedStrength = () => {
  const { schoolId, currentAcademicYear, getAuthHeaders } = useAuthContext();
  
  // -- State --
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [standards, setStandards] = useState([]);
  const [sections, setSections] = useState([]);
  
  // -- Filters --
  const [filters, setFilters] = useState({ standard: '', section: '' });

  // 1. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      if (!schoolId || !currentAcademicYear) return;
      
      setLoading(true);
      try {
        const response = await fetch(
          `${ENDPOINTS.reports}/consolidated-strength?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
          { headers: getAuthHeaders() }
        );
        if (response.ok) {
          const data = await response.json();
          setReportData(data);
          setFilteredData(data);

          // Unique dropdown options
          setStandards([...new Set(data.map(item => item.grade))]);
          setSections([...new Set(data.map(item => item.section))]);
        }
      } catch (error) {
        console.error("Error fetching report:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [schoolId, currentAcademicYear, getAuthHeaders]);

  // 2. Filter Logic
  useEffect(() => {
    let result = reportData;
    if (filters.standard) result = result.filter(item => item.grade === filters.standard);
    if (filters.section) result = result.filter(item => item.section === filters.section);
    setFilteredData(result);
  }, [filters, reportData]);

  // -- Helper: Centralized Data Processing --
  const getProcessedData = () => {
    let totalOld = 0, totalNew = 0, totalNet = 0, totalTC = 0, totalNoTC = 0, totalAct = 0;

    const rows = filteredData.map((row, index) => {
        const netTotal = row.oldNos + row.newNos;
        const actTotal = netTotal - (row.leftWithTc + row.leftWithoutTc);

        // Accumulate
        totalOld += row.oldNos;
        totalNew += row.newNos;
        totalNet += netTotal;
        totalTC += row.leftWithTc;
        totalNoTC += row.leftWithoutTc;
        totalAct += actTotal;

        return {
            slNo: index + 1,
            grade: row.grade,
            section: row.section,
            oldNos: row.oldNos,
            newNos: row.newNos,
            netTotal: netTotal,
            leftWithTc: row.leftWithTc,
            leftWithoutTc: row.leftWithoutTc,
            actTotal: actTotal
        };
    });

    const footer = {
        slNo: '', grade: '', section: 'TOTAL:',
        oldNos: totalOld, newNos: totalNew, netTotal: totalNet,
        leftWithTc: totalTC, leftWithoutTc: totalNoTC, actTotal: totalAct
    };

    return { rows, footer };
  };

  const { rows, footer } = getProcessedData();

  // 3. Export to Excel
  const exportToExcel = () => {
    const excelData = rows.map(row => ({
        "SI.No": row.slNo,
        "Grade": row.grade,
        "Section": row.section,
        "OLD NOS": row.oldNos,
        "NEW NOS": row.newNos,
        "NET TOTAL": row.netTotal,
        "LEFT WITH TC": row.leftWithTc,
        "LEFT WITHOUT TC": row.leftWithoutTc,
        "ACT TOTAL": row.actTotal
    }));

    // Add Footer
    excelData.push({
        "SI.No": "", "Grade": "", "Section": "TOTAL",
        "OLD NOS": footer.oldNos, "NEW NOS": footer.newNos,
        "NET TOTAL": footer.netTotal, "LEFT WITH TC": footer.leftWithTc,
        "LEFT WITHOUT TC": footer.leftWithoutTc, "ACT TOTAL": footer.actTotal
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const wscols = [{wch: 6}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 12}, {wch: 15}, {wch: 15}, {wch: 12}];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Consolidated Strength");
    XLSX.writeFile(workbook, `Consolidated_Strength_${currentAcademicYear}.xlsx`);
  };

  // 4. Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text(`Consolidated Strength Report - ${currentAcademicYear}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 14, 22);

    const tableColumn = ["SI.No", "Grade", "Section", "OLD NOS", "NEW NOS", "NET TOTAL", "LEFT WITH TC", "LEFT WITHOUT TC", "ACT TOTAL"];
    
    const tableRows = rows.map(row => [
        row.slNo, row.grade, row.section, row.oldNos, row.newNos, row.netTotal, row.leftWithTc, row.leftWithoutTc, row.actTotal
    ]);

    const tableFooter = [
        ['', '', 'TOTAL', footer.oldNos, footer.newNos, footer.netTotal, footer.leftWithTc, footer.leftWithoutTc, footer.actTotal]
    ];

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        foot: tableFooter,
        startY: 25,
        theme: 'grid',
        headStyles: { fillColor: [11, 61, 123], textColor: 255, halign: 'center', fontSize: 8 }, 
        footStyles: { fillColor: [233, 236, 239], textColor: 0, fontStyle: 'bold', halign: 'center', fontSize: 8 },
        columnStyles: {
            0: { halign: 'center' },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'center', fontStyle: 'bold', fillColor: [248, 249, 250] },
            6: { halign: 'center' },
            7: { halign: 'center' },
            8: { halign: 'center', fontStyle: 'bold', fillColor: [240, 248, 255] }
        },
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' }
    });

    doc.save(`Consolidated_Strength_${currentAcademicYear}.pdf`);
  };

  return (
    <MainContentPage>
      <div className="container-fluid px-3 py-3">
        
        {/* Header */}
        <div className="mb-3 d-flex justify-content-between align-items-center">
            <h3 className="mb-0 fw-bold text-dark fs-5">Consolidated Report</h3>
            <div className="d-flex gap-2">
                <Button variant="success" size="sm" onClick={exportToExcel} disabled={loading || rows.length === 0}>
                   <FaFileExcel className="me-1" /> Excel
                </Button>
                <Button variant="danger" size="sm" onClick={exportToPDF} disabled={loading || rows.length === 0}>
                   <FaFilePdf className="me-1" /> PDF
                </Button>
            </div>
        </div>

        {/* Filters */}
        <div className="card shadow-sm mb-3 border-0 bg-light">
          <div className="card-body p-3">
            <Row className="g-2">
              <Col md={3}>
                <Form.Select size="sm" value={filters.standard} onChange={(e) => setFilters({...filters, standard: e.target.value})}>
                  <option value="">All Standards</option>
                  {standards.map((std, i) => <option key={i} value={std}>{std}</option>)}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Select size="sm" value={filters.section} onChange={(e) => setFilters({...filters, section: e.target.value})}>
                  <option value="">All Sections</option>
                  {sections.map((sec, i) => <option key={i} value={sec}>{sec}</option>)}
                </Form.Select>
              </Col>
            </Row>
          </div>
        </div>

        {/* Report Table Area */}
        <div className="bg-white p-3 shadow-sm rounded border">
          
          <div className="text-center mb-3">
            <h5 className="fw-bold text-uppercase text-dark mb-1">Consolidated Strength Report</h5>
            <div className="text-muted" style={{fontSize: '12px'}}>
                <span className="me-3"><strong>Year:</strong> {currentAcademicYear}</span>
                <span><strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
                <Spinner animation="border" size="sm" variant="primary" />
                <p className="mt-2 small text-muted">Loading...</p>
            </div>
          ) : (
            <div className="table-responsive">
                <Table bordered hover size="sm" className="text-center align-middle mb-0" style={{fontSize: '12px', borderColor: '#dee2e6'}}>
                <thead className="bg-light">
                    <tr style={{borderBottom: '2px solid #333'}}>
                        <th className="py-2 bg-secondary text-white" style={{width: '40px'}}>SI.No</th>
                        <th className="py-2 bg-secondary text-white" style={{width: '80px'}}>Grade</th>
                        <th className="py-2 bg-secondary text-white" style={{width: '60px'}}>Section</th>
                        <th className="py-2 bg-secondary text-white" style={{width: '70px'}}>OLD NOS</th>
                        <th className="py-2 bg-secondary text-white" style={{width: '70px'}}>NEW NOS</th>
                        <th className="py-2 text-dark bg-light" style={{width: '80px', borderLeft: '2px solid #ccc'}}>NET TOTAL</th>
                        <th className="py-2 bg-secondary text-white" style={{width: '80px'}}>LEFT WITH TC</th>
                        <th className="py-2 bg-secondary text-white" style={{width: '80px'}}>LEFT WITHOUT TC</th>
                        <th className="py-2 text-white" style={{width: '80px', backgroundColor: '#0d6efd', borderLeft: '2px solid #ccc'}}>ACT TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.length > 0 ? (
                    rows.map((row, index) => (
                        <tr key={index}>
                            <td className="text-muted">{row.slNo}</td>
                            <td className="fw-bold">{row.grade}</td>
                            <td>{row.section}</td>
                            <td>{row.oldNos}</td>
                            <td>{row.newNos}</td>
                            <td className="fw-bold bg-light" style={{borderLeft: '2px solid #dee2e6'}}>{row.netTotal}</td>
                            <td className={row.leftWithTc > 0 ? "text-danger fw-bold" : "text-muted"}>{row.leftWithTc}</td>
                            <td className={row.leftWithoutTc > 0 ? "text-warning fw-bold" : "text-muted"}>{row.leftWithoutTc}</td>
                            <td className="fw-bold text-primary" style={{backgroundColor: '#f0f8ff', borderLeft: '2px solid #dee2e6'}}>{row.actTotal}</td>
                        </tr>
                    ))
                    ) : (
                    <tr><td colSpan="9" className="text-center text-muted py-3">No records found.</td></tr>
                    )}
                </tbody>
                
                {rows.length > 0 && (
                    <tfoot className="fw-bold small" style={{backgroundColor: '#e9ecef', borderTop: '2px solid #333'}}>
                    <tr>
                        <td colSpan="3" className="text-end pe-2">TOTAL:</td>
                        <td>{footer.oldNos}</td>
                        <td>{footer.newNos}</td>
                        <td style={{borderLeft: '2px solid #ccc'}}>{footer.netTotal}</td>
                        <td className="text-danger">{footer.leftWithTc}</td>
                        <td className="text-warning">{footer.leftWithoutTc}</td>
                        <td className="bg-primary text-white" style={{borderLeft: '2px solid #ccc'}}>{footer.actTotal}</td>
                    </tr>
                    </tfoot>
                )}
                </Table>
            </div>
          )}
        </div>

      </div>
    </MainContentPage>
  );
};

export default ConsolidatedStrength;