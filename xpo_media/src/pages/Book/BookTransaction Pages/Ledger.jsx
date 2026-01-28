"use client";

import React, { useState, useEffect, useRef } from "react";
import MainContentPage from "../../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container, Card, Table, Spinner } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuthContext } from "../../../Context/AuthContext";
import { ENDPOINTS } from "../../../SpringBoot/config";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { 
  FaFilePdf, 
  FaSearch, 
  FaTimes, 
  FaCalendarAlt, 
  FaUserTag, 
  FaUser, 
  FaDownload,
  FaFilter,
  FaPrint
} from "react-icons/fa";

// --- Custom Searchable Dropdown ---
const SearchableSelect = ({ options, value, onChange, placeholder, valueKey, labelKey, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    const selectedOption = options.find(opt => opt[valueKey] === value);
    if (selectedOption) {
      setSearchTerm(selectedOption[labelKey]);
    } else if (!value) {
      setSearchTerm("");
    }
  }, [value, options, valueKey, labelKey]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    String(opt[labelKey] || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={wrapperRef} className="position-relative">
      <div className="input-group">
        <span className="input-group-text bg-light border-end-0">
          <Icon className="text-secondary" size={14} />
        </span>
        <Form.Control
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (e.target.value === "") onChange("");
          }}
          onClick={() => setIsOpen(true)}
          className="border-start-0"
          style={{ paddingLeft: "0.5rem" }}
        />
        <Button
          variant="light"
          className="border border-start-0"
          onClick={() => {
            setSearchTerm("");
            onChange("");
          }}
        >
          <FaTimes className="text-secondary" />
        </Button>
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <ul className="list-group position-absolute w-100 mt-1 border"
          style={{
            maxHeight: "200px",
            overflowY: "auto",
            zIndex: 1000,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            borderRadius: "0.375rem",
            backgroundColor: "white"
          }}>
          {filteredOptions.map((opt, idx) => (
            <li
              key={idx}
              className="list-group-item list-group-item-action border-0"
              style={{
                cursor: "pointer",
                padding: "0.5rem 1rem",
                fontSize: "0.875rem"
              }}
              onClick={() => {
                onChange(opt[valueKey]);
                setIsOpen(false);
              }}
            >
              {opt[labelKey]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Helper function to format numbers in Indian style
const formatIndianNumber = (num) => {
  if (num === null || num === undefined) return "0.00";
  const numValue = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
  
  if (isNaN(numValue)) return "0.00";
  if (numValue === 0) return "0.00";
  
  // Format with 2 decimal places
  const formatted = numValue.toFixed(2);
  
  // Add commas for thousands (Indian style)
  const parts = formatted.split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1] || '00';
  
  // Indian numbering system
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  
  const result = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  
  return result + '.' + decimalPart;
};

export default function Ledger() {
  const { user } = useAuthContext();
  
  // State for filters
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  // State for suppliers
  const [supplierList, setSupplierList] = useState([]);
  
  // Selected values
  const [selectedCode, setSelectedCode] = useState("");
  const [selectedName, setSelectedName] = useState("");
  
  // Report data
  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  
  // Fetch Suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
        if (!user) return;
        try {
            const res = await axios.get(`${ENDPOINTS.store}/ledger/suppliers`, {
                params: { schoolId: user.uid }
            });
            setSupplierList(res.data || []);
        } catch (err) {
            console.error("Error fetching suppliers:", err);
        }
    };
    fetchSuppliers();
  }, [user]);

  // Calculate grand totals
  const calculateGrandTotals = () => {
    let totalPaid = 0;
    let totalPurchase = 0;
    let totalBalance = 0;
    
    ledgerData.forEach(supplier => {
      // Parse totals from formatted strings
      const paid = parseFloat(String(supplier.total_paid).replace(/,/g, ''));
      const purchase = parseFloat(String(supplier.total_purchase).replace(/,/g, ''));
      const balance = parseFloat(String(supplier.total_balance).replace(/,/g, ''));
      
      totalPaid += isNaN(paid) ? 0 : paid;
      totalPurchase += isNaN(purchase) ? 0 : purchase;
      totalBalance += isNaN(balance) ? 0 : balance;
    });
    
    return {
      paid: totalPaid,
      purchase: totalPurchase,
      balance: totalBalance
    };
  };

  const grandTotals = calculateGrandTotals();

  // Handlers
  const handleCodeChange = (code) => {
    setSelectedCode(code);
    if (!code) {
      setSelectedName("");
    } else {
      const supplier = supplierList.find(s => s.supplier_code === code);
      if (supplier) setSelectedName(supplier.supplier_name);
    }
  };

  const handleNameChange = (codeFromValue) => {
    setSelectedName(supplierList.find(s => s.supplier_code === codeFromValue)?.supplier_name || "");
    setSelectedCode(codeFromValue);
  };

  // Generate Report
  const handleGenerate = async () => {
    if(!user) return;
    setLoading(true);
    
    try {
        const res = await axios.get(`${ENDPOINTS.store}/ledger/generate`, {
            params: {
                schoolId: user.uid,
                startDate,
                endDate,
                supplierCode: selectedCode
            }
        });
        
        setLedgerData(res.data || []);
        setShowReport(true);
        
        if(res.data.length > 0) {
            toast.success(`Ledger generated with ${res.data.length} suppliers`);
        } else {
            toast.info("No records found.");
        }
    } catch (err) {
        console.error("Error generating ledger:", err);
        toast.error("Failed to generate ledger report");
    } finally {
        setLoading(false);
    }
  };

  const handleReset = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
    setSelectedCode("");
    setSelectedName("");
    setLedgerData([]);
    setShowReport(false);
    toast.info("Filters reset to default");
  };

  // --- PDF DOWNLOAD ---
  const handleDownloadPDF = () => {
    const doc = new jsPDF('landscape');
    
    // Title and Header
    doc.setFontSize(16);
    doc.text("Supplier Ledger Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`From: ${startDate}  To: ${endDate}`, 14, 22);
    doc.text(`Page 1 of 1`, 250, 22);
    
    let finalY = 30;

    // Table columns
    const headers = [
      ["SLNo.", "Date", "Desc", "Paid_amt", "Pur_amt", "Bal. Amt", "Inv.No.", "Day"]
    ];

    const tableBody = [];

    ledgerData.forEach((supplier, supplierIndex) => {
      // Supplier Header Row
      const supplierInfo = `${supplier.supplier_code} | ${supplier.supplier_name} | ${supplier.address}`;
      tableBody.push([{ 
        content: supplierInfo, 
        colSpan: 8, 
        styles: { 
          fillColor: [240, 240, 240],
          fontStyle: 'bold',
          textColor: [0, 0, 0],
          fontSize: 10
        } 
      }]);
      
      // Transactions
      supplier.transactions.forEach((tx, txIndex) => {
        tableBody.push([
          (txIndex + 1).toString(),
          tx.date,
          tx.description || "-",
          formatIndianNumber(tx.paid_amount),
          formatIndianNumber(tx.purchase_amount),
          formatIndianNumber(tx.balance),
          tx.invoice_no || "-",
          tx.day.toString()
        ]);
      });
      
      // Supplier Total Row
      tableBody.push([
        { content: "", colSpan: 3 },
        supplier.total_paid,
        supplier.total_purchase,
        supplier.total_balance,
        { content: "", colSpan: 3 }
      ]);
      
      // Empty row for spacing
      tableBody.push([
        { content: "", colSpan: 8, styles: { minCellHeight: 5 } }
      ]);
    });
    
    // Grand Total Row
    tableBody.push([
      { content: "GRAND TOTAL", colSpan: 3, styles: { fontStyle: 'bold' } },
      { content: formatIndianNumber(grandTotals.paid), styles: { fontStyle: 'bold' } },
      { content: formatIndianNumber(grandTotals.purchase), styles: { fontStyle: 'bold' } },
      { content: formatIndianNumber(grandTotals.balance), styles: { fontStyle: 'bold' } },
      { content: "", colSpan: 3 }
    ]);

    autoTable(doc, {
      head: headers,
      body: tableBody,
      startY: finalY,
      theme: 'grid',
      styles: { 
        fontSize: 9,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      headStyles: { 
        fillColor: [11, 61, 123],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' }, // SLNo
        1: { cellWidth: 30, halign: 'center' }, // Date
        2: { cellWidth: 60 }, // Desc
        3: { cellWidth: 40, halign: 'right' }, // Paid_amt
        4: { cellWidth: 40, halign: 'right' }, // Pur_amt
        5: { cellWidth: 40, halign: 'right' }, // Bal. Amt
        6: { cellWidth: 40, halign: 'center' }, // Inv.No.
        7: { cellWidth: 20, halign: 'center' } // Day
      },
      margin: { left: 10, right: 10 },
      tableWidth: 'wrap'
    });

    doc.save(`Ledger_Report_${startDate}_${endDate}.pdf`);
  };

  // --- EXCEL DOWNLOAD ---
  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Prepare data array
    const excelData = [];
    
    // Header
    excelData.push(["Supplier Ledger Report"]);
    excelData.push([`From: ${startDate}`, `To: ${endDate}`]);
    excelData.push([]); // Blank row
    
    ledgerData.forEach((supplier, supplierIndex) => {
      // Supplier header
      excelData.push([
        supplier.supplier_code,
        supplier.supplier_name,
        supplier.address,
        "", "", "", "", ""
      ]);
      
      // Column headers
      excelData.push(["SLNo.", "Date", "Desc", "Paid_amt", "Pur_amt", "Bal. Amt", "Inv.No.", "Day"]);
      
      // Transactions
      supplier.transactions.forEach((tx, txIndex) => {
        excelData.push([
          txIndex + 1,
          tx.date,
          tx.description || "-",
          tx.paid_amount,
          tx.purchase_amount,
          tx.balance,
          tx.invoice_no || "-",
          tx.day
        ]);
      });
      
      // Supplier total
      excelData.push([
        "", "", "Total:",
        supplier.total_paid,
        supplier.total_purchase,
        supplier.total_balance,
        "", ""
      ]);
      
      // Blank row
      excelData.push([]);
    });
    
    // Grand total
    excelData.push([
      "", "", "GRAND TOTAL:",
      formatIndianNumber(grandTotals.paid),
      formatIndianNumber(grandTotals.purchase),
      formatIndianNumber(grandTotals.balance),
      "", ""
    ]);

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // Set column widths
    const wscols = [
      { wch: 8 },   // SLNo
      { wch: 12 },  // Date
      { wch: 25 },  // Desc
      { wch: 15 },  // Paid_amt
      { wch: 15 },  // Pur_amt
      { wch: 15 },  // Bal. Amt
      { wch: 15 },  // Inv.No.
      { wch: 8 }    // Day
    ];
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Ledger Report");
    XLSX.writeFile(wb, `Ledger_${startDate}_${endDate}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper to format date display
  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <MainContentPage>
    <Container fluid className="px-0">
      <div className="mb-4 px-3 no-print">
        <h4 className="fw-bold mb-2" style={{ color: "#0B3D7B" }}>Supplier Ledger Report</h4>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <a href="/home" className="text-decoration-none" style={{ color: "#0B3D7B" }}>Home</a>
            </li>
            <li className="breadcrumb-item text-secondary">Reports</li>
            <li className="breadcrumb-item active" aria-current="page">Ledger Report</li>
          </ol>
        </nav>
      </div>

      <Card className="shadow-sm border-0 mb-4 mx-3 no-print" style={{ borderRadius: "12px" }}>
        <Card.Header className="bg-white py-3 border-bottom" style={{ borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}>
          <div className="d-flex align-items-center">
            <FaFilter className="me-2" style={{ color: "#0B3D7B" }} />
            <h6 className="mb-0 fw-bold" style={{ color: "#0B3D7B" }}>
              Report Criteria
            </h6>
          </div>
        </Card.Header>
        <Card.Body className="p-4">
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary mb-2">
                  <FaCalendarAlt className="me-1" size={12} /> From Date
                </Form.Label>
                <Form.Control
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="shadow-sm"
                  />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary mb-2">
                  <FaCalendarAlt className="me-1" size={12} /> To Date
                </Form.Label>
                <Form.Control
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="shadow-sm"
                  />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary mb-2">
                  <FaUserTag className="me-1" size={12} /> Supplier Code
                </Form.Label>
                <SearchableSelect
                  options={supplierList}
                  value={selectedCode}
                  onChange={handleCodeChange}
                  placeholder="Search Code"
                  valueKey="supplier_code"
                  labelKey="supplier_code"
                  icon={FaUserTag}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-bold text-secondary mb-2">
                  <FaUser className="me-1" size={12} /> Supplier Name
                </Form.Label>
                <SearchableSelect
                  options={supplierList}
                  value={selectedCode}
                  onChange={handleNameChange}
                  placeholder="Search Name"
                  valueKey="supplier_code"
                  labelKey="supplier_name"
                  icon={FaUser}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mt-4">
            <Col className="d-flex justify-content-end gap-2">
              <Button variant="outline-secondary" onClick={handleReset}>Reset</Button>
              <Button
                variant="primary"
                onClick={handleGenerate}
                style={{ backgroundColor: "#0B3D7B", border: "none" }}
                disabled={loading}
              >
                {loading ? <Spinner as="span" animation="border" size="sm" /> : "Generate Ledger"}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Report Table */}
      {showReport && (
        <Card className="shadow-sm border-0 mx-3 mb-4" style={{ borderRadius: "12px" }}>
          <Card.Body className="p-0">
            <div className="table-responsive" style={{ maxHeight: "600px", overflowY: "auto" }}>
              <Table bordered hover className="align-middle mb-0" style={{ fontSize: "0.9rem" }}>
                <thead className="sticky-top" style={{ backgroundColor: "#0B3D7B", zIndex: 1 }}>
                  <tr>
                    <th colSpan="8" className="text-center text-white py-2">
                      <div className="d-flex justify-content-between align-items-center px-3">
                        <div className="fw-bold">Supplier Ledger</div>
                        <div className="d-flex align-items-center">
                          <div className="me-4">From: {formatDateDisplay(startDate)}</div>
                          <div>To: {formatDateDisplay(endDate)}</div>
                        </div>
                      </div>
                    </th>
                  </tr>
                  <tr>
                    <th className="py-2 text-white text-center" style={{ width: "5%" }}>SLNo.</th>
                    <th className="py-2 text-white text-center" style={{ width: "10%" }}>Date</th>
                    <th className="py-2 text-white text-center" style={{ width: "25%" }}>Desc</th>
                    <th className="py-2 text-white text-center" style={{ width: "12%" }}>Paid_amt</th>
                    <th className="py-2 text-white text-center" style={{ width: "12%" }}>Pur_amt</th>
                    <th className="py-2 text-white text-center" style={{ width: "12%" }}>Bal. Amt</th>
                    <th className="py-2 text-white text-center" style={{ width: "14%" }}>Inv.No.</th>
                    <th className="py-2 text-white text-center" style={{ width: "5%" }}>Day</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.map((supplier, supplierIndex) => (
                    <React.Fragment key={supplierIndex}>
                      {/* Supplier Header Row */}
                      <tr style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}>
                        <td colSpan="8" className="p-2">
                          <div className="d-flex flex-wrap align-items-center">
                            <span className="me-3">{supplier.supplier_code}</span>
                            <span className="me-3">{supplier.supplier_name}</span>
                            <span className="text-secondary small">{supplier.address}</span>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Transaction Rows */}
                      {supplier.transactions.map((transaction, transIndex) => (
                        <tr key={transIndex} className="hover-bg-light">
                          <td className="text-center">{transIndex + 1}</td>
                          <td className="text-center">{transaction.date}</td>
                          <td>{transaction.description || "-"}</td>
                          <td className="text-end">{formatIndianNumber(transaction.paid_amount)}</td>
                          <td className="text-end">{formatIndianNumber(transaction.purchase_amount)}</td>
                          <td className="text-end fw-bold">{formatIndianNumber(transaction.balance)}</td>
                          <td className="text-center">{transaction.invoice_no || "-"}</td>
                          <td className="text-center">{transaction.day}</td>
                        </tr>
                      ))}
                      
                      {/* Supplier Total Row */}
                      <tr style={{ backgroundColor: "#e8f4fd", borderTop: "2px solid #dee2e6", fontWeight: "bold" }}>
                        <td colSpan="3" className="text-end">Supplier Total:</td>
                        <td className="text-end">{supplier.total_paid}</td>
                        <td className="text-end">{supplier.total_purchase}</td>
                        <td className="text-end">{supplier.total_balance}</td>
                        <td colSpan="2"></td>
                      </tr>
                      <tr><td colSpan="8" style={{ height: "15px" }}></td></tr>
                    </React.Fragment>
                  ))}
                  
                  {/* Grand Total Row */}
                  <tr style={{ backgroundColor: "#0B3D7B", color: "white", fontWeight: "bold" }}>
                    <td colSpan="3" className="text-end py-2">GRAND TOTAL:</td>
                    <td className="text-end py-2">{formatIndianNumber(grandTotals.paid)}</td>
                    <td className="text-end py-2">{formatIndianNumber(grandTotals.purchase)}</td>
                    <td className="text-end py-2">{formatIndianNumber(grandTotals.balance)}</td>
                    <td colSpan="2" className="py-2"></td>
                  </tr>
                </tbody>
              </Table>
            </div>
          </Card.Body>

          <Card.Footer className="bg-white py-3 border-top no-print">
            <div className="d-flex justify-content-center gap-3">
              <Button variant="danger" onClick={handleDownloadPDF} disabled={!showReport}>
                <FaFilePdf className="me-2" /> Download PDF
              </Button>
              <Button variant="success" onClick={handleDownloadExcel} disabled={!showReport}>
                <FaDownload className="me-2" /> Download Excel
              </Button>
              <Button variant="info" onClick={handlePrint} disabled={!showReport}>
                <FaPrint className="me-2" /> Print Report
              </Button>
              <Button variant="outline-secondary" onClick={() => setShowReport(false)}>Close Report</Button>
            </div>
          </Card.Footer>
        </Card>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
      
      <style>{`
        .hover-bg-light:hover { background-color: #f8f9fa; }
        .form-control:focus { box-shadow: none; border-color: #0B3D7B; }
        .input-group-text { background-color: #f8f9fa; }
        @media print {
          .no-print { display: none !important; }
          .card, .card-body, .table { border: none !important; box-shadow: none !important; }
          .table-responsive { overflow: visible !important; max-height: none !important; }
          .table th, .table td { padding: 4px 8px !important; }
          body { font-size: 11px !important; }
        }
      `}</style>
    </Container>
    </MainContentPage>
  );
}