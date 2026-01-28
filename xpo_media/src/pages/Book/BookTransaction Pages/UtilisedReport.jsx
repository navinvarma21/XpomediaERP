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
import { FaFilePdf, FaSearch, FaTimes, FaCalendarAlt, FaUserTag, FaUser } from "react-icons/fa";
import { FiFilter } from "react-icons/fi";

// --- Custom Searchable Dropdown ---
const SearchableSelect = ({ options, value, onChange, placeholder, valueKey, labelKey, icon: Icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef(null);

    // Sync input when value changes externally
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
                        borderRadius: "0.375rem"
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

const UtilisedReport = () => {
    const { user } = useAuthContext();
    
    // Dates & Filter State
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Dropdown Data
    const [customerList, setCustomerList] = useState([]);
    
    // Selected Values (Synced)
    const [selectedCode, setSelectedCode] = useState("");
    const [selectedName, setSelectedName] = useState(""); 

    // Report Data
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [grandTotal, setGrandTotal] = useState(0);
    const [dateGroupedData, setDateGroupedData] = useState([]);

    // 1. Fetch Dropdown Data on Load
    useEffect(() => {
        const fetchCustomers = async () => {
            if (!user) return;
            try {
                const res = await axios.get(`${ENDPOINTS.store}/utilised-report/customers`, {
                    params: { schoolId: user.uid }
                });
                setCustomerList(res.data || []);
            } catch (err) {
                console.error("Error fetching customers:", err);
                toast.error("Failed to load customer list");
            }
        };
        fetchCustomers();
    }, [user]);

    // 2. Handle Dropdown Sync Logic
    const handleCodeChange = (code) => {
        setSelectedCode(code);
        if (!code) {
            setSelectedName(""); 
        } else {
            const customer = customerList.find(c => c.customer_code === code);
            if (customer) setSelectedName(customer.customer_code);
        }
    };

    const handleNameChange = (codeFromValue) => {
        setSelectedName(codeFromValue);
        setSelectedCode(codeFromValue);
    };

    // 3. Group data by date and calculate totals
    const groupDataByDate = (data) => {
        const grouped = {};
        let grandTotalAmount = 0;
        let grandTotalQuantity = 0;

        data.forEach(item => {
            const date = item.issue_date;
            if (!grouped[date]) {
                grouped[date] = {
                    date,
                    items: [],
                    totalAmount: 0,
                    totalQuantity: 0
                };
            }
            
            const quantity = parseFloat(item.quantity) || 0;
            const amount = parseFloat(item.total_amount) || 0;
            
            grouped[date].items.push(item);
            grouped[date].totalAmount += amount;
            grouped[date].totalQuantity += quantity;
            
            grandTotalAmount += amount;
            grandTotalQuantity += quantity;
        });

        const groupedArray = Object.values(grouped);
        return { groupedArray, grandTotalAmount, grandTotalQuantity };
    };

    // 4. Generate Report
    const handleGenerate = async () => {
        if (!user) {
            toast.error("Please login to generate report");
            return;
        }
        
        setLoading(true);

        // Logic: If Start is selected but End is empty, assume Single Date Report
        let finalStart = startDate;
        let finalEnd = endDate;

        if (startDate && !endDate) {
            finalEnd = startDate; // Single Date Mode
        } else if (!startDate && endDate) {
            finalStart = endDate;
        } else if (!startDate && !endDate) {
            // Default to today if nothing selected
            const today = new Date().toISOString().split('T')[0];
            finalStart = today;
            finalEnd = today;
        }

        try {
            const res = await axios.get(`${ENDPOINTS.store}/utilised-report/generate`, {
                params: {
                    schoolId: user.uid,
                    startDate: finalStart,
                    endDate: finalEnd,
                    customerCode: selectedCode 
                }
            });

            const data = res.data || [];
            setReportData(data);
            
            // Group data by date
            const { groupedArray, grandTotalAmount, grandTotalQuantity } = groupDataByDate(data);
            setDateGroupedData(groupedArray);
            setGrandTotal(grandTotalAmount);

            if (data.length === 0) {
                toast.info("No records found for the selected criteria.", {
                    position: "top-right",
                    autoClose: 3000,
                });
            } else {
                toast.success(`Report generated with ${data.length} records`, {
                    position: "top-right",
                    autoClose: 2000,
                });
            }
        } catch (err) {
            console.error("Error generating report:", err);
            toast.error("Failed to generate report. Please try again.", {
                position: "top-right",
                autoClose: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    // 5. Download PDF
    const downloadPDF = () => {
        if (reportData.length === 0) {
            toast.warning("No data available to download", {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }

        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(16);
        doc.setTextColor(11, 61, 123);
        doc.text("Utilised Material Report", 14, 15);
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`From: ${startDate || 'N/A'}  To: ${endDate || startDate || 'N/A'}`, 14, 22);
        if(selectedCode) doc.text(`Customer Code: ${selectedCode}`, 14, 28);

        let startY = 35;
        
        // Create table data with date groupings
        const tableRows = [];
        let overallQuantityTotal = 0;
        let overallAmountTotal = 0;

        dateGroupedData.forEach(group => {
            // Add date header
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text(`Date: ${group.date}`, 14, startY);
            startY += 7;
            
            // Table for this date
            const tableColumn = ["Bill No", "Description (Item)", "Qty", "Customer Name", "Amount"];
            const dateRows = group.items.map(item => [
                item.bill_no,
                item.item_name,
                item.quantity,
                item.customer_name,
                item.total_amount
            ]);
            
            // Add date total row
            dateRows.push([
                "",
                "Date Total",
                group.totalQuantity.toString(),
                "",
                group.totalAmount.toFixed(2)
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: dateRows,
                startY: startY,
                theme: "grid",
                styles: { fontSize: 9 },
                headStyles: { fillColor: [11, 61, 123] },
                margin: { left: 14 }
            });

            startY = doc.lastAutoTable.finalY + 10;
            overallQuantityTotal += group.totalQuantity;
            overallAmountTotal += group.totalAmount;
        });

        // Grand Total
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(`Grand Total Quantity: ${overallQuantityTotal}`, 14, startY);
        doc.text(`Grand Total Amount: ${overallAmountTotal.toFixed(2)}`, 14, startY + 7);
        
        const fileName = `Utilised_Report_${startDate}_${endDate}_${new Date().getTime()}.pdf`;
        doc.save(fileName);
        
        toast.success("PDF downloaded successfully", {
            position: "top-right",
            autoClose: 2000,
        });
    };

    // 6. Reset filters
    const handleReset = () => {
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setEndDate(today);
        setSelectedCode("");
        setSelectedName("");
        setReportData([]);
        setDateGroupedData([]);
        setGrandTotal(0);
        
        toast.info("Filters reset to default", {
            position: "top-right",
            autoClose: 2000,
        });
    };

    return (
        <MainContentPage>
            <Container fluid className="px-0">
                {/* Header Section */}
                <div className="mb-4 px-3">
                    <h4 className="fw-bold mb-2" style={{ color: "#0B3D7B" }}>Utilised Material Report</h4>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item">
                                <a href="/home" className="text-decoration-none" style={{ color: "#0B3D7B" }}>Home</a>
                            </li>
                            <li className="breadcrumb-item text-secondary">Reports</li>
                            <li className="breadcrumb-item active" aria-current="page">Utilised Report</li>
                        </ol>
                    </nav>
                </div>

                {/* Filter Card */}
                <Card className="shadow-sm border-0 mb-4 mx-3" style={{ borderRadius: "12px" }}>
                    <Card.Header className="bg-white py-3 border-bottom" style={{ borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}>
                        <div className="d-flex align-items-center">
                            <FiFilter className="me-2" style={{ color: "#0B3D7B" }} />
                            <h6 className="mb-0 fw-bold" style={{ color: "#0B3D7B" }}>
                                Report Criteria
                            </h6>
                        </div>
                    </Card.Header>
                    <Card.Body className="p-4">
                        <Row className="g-3 align-items-end">
                            {/* Date Filters */}
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-secondary mb-2">
                                        <FaCalendarAlt className="me-1" size={12} /> Start Date
                                    </Form.Label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-end-0">
                                            <FaCalendarAlt className="text-secondary" size={14} />
                                        </span>
                                        <Form.Control 
                                            type="date" 
                                            value={startDate} 
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="shadow-sm border-start-0"
                                        />
                                    </div>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-secondary mb-2">
                                        <FaCalendarAlt className="me-1" size={12} /> End Date
                                    </Form.Label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-end-0">
                                            <FaCalendarAlt className="text-secondary" size={14} />
                                        </span>
                                        <Form.Control 
                                            type="date" 
                                            value={endDate} 
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="shadow-sm border-start-0"
                                        />
                                    </div>
                                </Form.Group>
                            </Col>

                            {/* Dropdowns */}
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-secondary mb-2">
                                        <FaUserTag className="me-1" size={12} /> Customer Code
                                    </Form.Label>
                                    <SearchableSelect 
                                        options={customerList} 
                                        value={selectedCode} 
                                        onChange={handleCodeChange} 
                                        placeholder="Search Code"
                                        valueKey="customer_code"
                                        labelKey="customer_code"
                                        icon={FaUserTag}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-secondary mb-2">
                                        <FaUser className="me-1" size={12} /> Customer Name
                                    </Form.Label>
                                    <SearchableSelect 
                                        options={customerList} 
                                        value={selectedName} 
                                        onChange={handleNameChange} 
                                        placeholder="Search Name"
                                        valueKey="customer_code" 
                                        labelKey="customer_name"
                                        icon={FaUser}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mt-4">
                            <Col className="d-flex justify-content-end gap-2">
                                <Button 
                                    variant="outline-secondary" 
                                    onClick={handleReset}
                                    style={{ padding: "10px 25px", borderRadius: "8px" }}
                                >
                                    Reset
                                </Button>
                                <Button 
                                    variant="primary" 
                                    onClick={handleGenerate} 
                                    style={{ 
                                        backgroundColor: "#0B3D7B", 
                                        border: "none", 
                                        padding: "10px 25px",
                                        borderRadius: "8px",
                                        boxShadow: "0 2px 4px rgba(11, 61, 123, 0.2)"
                                    }}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Spinner as="span" animation="border" size="sm" className="me-2" />
                                            Generating...
                                        </>
                                    ) : "Generate Report"}
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Results Section */}
                {reportData.length > 0 && (
                    <div className="px-3 mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 fw-bold text-dark">
                                Report Results ({dateGroupedData.length} days)
                            </h6>
                            <div className="d-flex gap-2">
                                <span className="badge bg-primary">
                                    Total Items: {reportData.length}
                                </span>
                                <span className="badge bg-success">
                                    Grand Total: ₹{grandTotal.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Results Table */}
                <Card className="shadow-sm border-0 mx-3" style={{ borderRadius: "12px" }}>
                    <Card.Body className="p-0">
                        <div className="table-responsive" style={{ maxHeight: "600px", overflowY: "auto" }}>
                            <Table hover className="align-middle mb-0">
                                <thead className="sticky-top" style={{ 
                                    backgroundColor: "#0B3D7B",
                                    zIndex: 1
                                }}>
                                    <tr>
                                        <th className="py-3 px-4 text-white">Date</th>
                                        <th className="py-3 text-white">Bill No</th>
                                        <th className="py-3 text-white">Description (Item)</th>
                                        <th className="py-3 text-center text-white">Qty</th>
                                        <th className="py-3 text-white">Customer Name</th>
                                        <th className="py-3 text-end text-white">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-5">
                                                <Spinner animation="border" variant="primary" />
                                                <div className="mt-2 text-secondary">Loading report data...</div>
                                            </td>
                                        </tr>
                                    ) : reportData.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-5 text-muted">
                                                <div className="py-4">
                                                    <FiFilter size={48} className="text-light mb-3" style={{ opacity: 0.5 }} />
                                                    <div className="mb-2">No data found</div>
                                                    <div className="text-secondary small">
                                                        Please select criteria and click "Generate Report"
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        dateGroupedData.map((group, groupIndex) => (
                                            <React.Fragment key={groupIndex}>
                                                {/* Date Header */}
                                                <tr style={{ backgroundColor: "#f8fafc" }}>
                                                    <td colSpan="6" className="p-0">
                                                        <div className="px-4 py-2 fw-bold" style={{ 
                                                            backgroundColor: "#e8f4fd",
                                                            borderLeft: "4px solid #0B3D7B"
                                                        }}>
                                                            <FaCalendarAlt className="me-2" size={14} />
                                                            {group.date}
                                                        </div>
                                                    </td>
                                                </tr>
                                                
                                                {/* Items for this date */}
                                                {group.items.map((row, rowIndex) => (
                                                    <tr key={`${groupIndex}-${rowIndex}`} className="hover-bg-light">
                                                        <td className="px-4"></td>
                                                        <td className="fw-bold">{row.bill_no}</td>
                                                        <td>{row.item_name}</td>
                                                        <td className="text-center">{row.quantity}</td>
                                                        <td>{row.customer_name}</td>
                                                        <td className="text-end">{parseFloat(row.total_amount).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                                
                                                {/* Date Total Row */}
                                                <tr style={{ 
                                                    backgroundColor: "#f1f7ff",
                                                    borderTop: "2px solid #dee2e6"
                                                }}>
                                                    <td colSpan="3" className="px-4 fw-bold text-end">
                                                        Date Total:
                                                    </td>
                                                    <td className="text-center fw-bold">
                                                        {group.totalQuantity}
                                                    </td>
                                                    <td></td>
                                                    <td className="text-end fw-bold">
                                                        ₹{group.totalAmount.toFixed(2)}
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>

                    {/* Grand Total Footer */}
                    {reportData.length > 0 && (
                        <div className="bg-light py-3 border-top">
                            <div className="px-4 d-flex justify-content-between align-items-center">
                                <div className="fw-bold text-dark">
                                    Report Period: {startDate} to {endDate}
                                    {selectedCode && ` | Customer: ${selectedCode}`}
                                </div>
                                <div className="d-flex gap-4">
                                    <div className="text-center">
                                        <div className="small text-secondary">Total Quantity</div>
                                        <div className="fw-bold fs-5 text-primary">
                                            {dateGroupedData.reduce((sum, group) => sum + group.totalQuantity, 0)}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="small text-secondary">Grand Total</div>
                                        <div className="fw-bold fs-5 text-success">
                                            ₹{grandTotal.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <Card.Footer className="bg-white py-3 border-top">
                        <div className="d-flex justify-content-center gap-3">
                            <Button 
                                variant="danger" 
                                onClick={downloadPDF} 
                                disabled={reportData.length === 0}
                                style={{ 
                                    padding: "10px 25px",
                                    borderRadius: "8px",
                                    boxShadow: "0 2px 4px rgba(220, 53, 69, 0.2)"
                                }}
                            >
                                <FaFilePdf className="me-2" /> Download PDF
                            </Button>
                            <Button 
                                variant="outline-secondary" 
                                onClick={() => window.history.back()}
                                style={{ 
                                    padding: "10px 25px",
                                    borderRadius: "8px"
                                }}
                            >
                                Close
                            </Button>
                        </div>
                    </Card.Footer>
                </Card>
                
                <ToastContainer 
                    position="top-right" 
                    autoClose={3000}
                    theme="colored"
                />
            </Container>
            
            <style jsx>{`
                .hover-bg-light:hover { 
                    background-color: #f8f9fa !important; 
                    transition: background-color 0.2s;
                }
                .form-control:focus { 
                    box-shadow: 0 0 0 3px rgba(11, 61, 123, 0.1) !important; 
                    border-color: #0B3D7B !important; 
                }
                .input-group-text {
                    background-color: #f8f9fa !important;
                    border-color: #dee2e6 !important;
                }
                .table th {
                    font-weight: 600;
                    font-size: 0.9rem;
                }
                .table td {
                    font-size: 0.875rem;
                    vertical-align: middle;
                }
            `}</style>
        </MainContentPage>
    );
};

export default UtilisedReport;