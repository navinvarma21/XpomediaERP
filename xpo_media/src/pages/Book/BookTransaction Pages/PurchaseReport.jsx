"use client";

import React, { useState, useEffect, useRef } from "react";
import MainContentPage from "../../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container, Card, Table, Spinner, Dropdown, ToggleButton, ToggleButtonGroup } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuthContext } from "../../../Context/AuthContext";
import { ENDPOINTS } from "../../../SpringBoot/config";
import axios from "axios";
import { FaFilePdf, FaSearch, FaTimes, FaFileExcel, FaFileAlt, FaDownload, FaCalendarAlt, FaFilter, FaEye } from "react-icons/fa";

// --- Custom Searchable Dropdown ---
const SearchableSelect = ({ options, value, onChange, placeholder, valueKey, labelKey }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef(null);

    useEffect(() => {
        const selectedOption = options.find(opt => opt[valueKey] === value);
        if (selectedOption) {
            setSearchTerm(selectedOption[labelKey]);
        } else if (value === "") {
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
        String(opt[labelKey]).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div ref={wrapperRef} className="position-relative">
            <Form.Control
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsOpen(true);
                    if(e.target.value === "") onChange(""); 
                }}
                onClick={() => setIsOpen(true)}
            />
            {isOpen && filteredOptions.length > 0 && (
                <div className="position-absolute w-100 bg-white border rounded shadow-sm" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                    {filteredOptions.map((opt, idx) => (
                        <div 
                            key={idx} 
                            className="p-2 cursor-pointer hover-bg-light"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                onChange(opt[valueKey]);
                                setIsOpen(false);
                            }}
                        >
                            {opt[labelKey]}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const PurchaseReport = () => {
    const { user } = useAuthContext();
    
    // Dates
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Report Type Selection
    const [reportType, setReportType] = useState("dateRange"); // "dateRange", "supplierOnly", "all"

    // Supplier Data & Selection
    const [supplierList, setSupplierList] = useState([]);
    const [selectedSupplierCode, setSelectedSupplierCode] = useState("");
    
    // Report Data
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [grandTotal, setGrandTotal] = useState(0);
    const [exporting, setExporting] = useState(false);

    // 1. Fetch Suppliers on Load
    useEffect(() => {
        if (user) {
            axios.get(`${ENDPOINTS.store}/purchase-report/suppliers`, { 
                params: { schoolId: user.uid },
                headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
            })
            .then(res => setSupplierList(res.data || []))
            .catch(err => console.error("Error fetching suppliers", err));
        }
    }, [user]);

    // 2. Handle Supplier Sync Logic
    const handleCodeChange = (code) => {
        setSelectedSupplierCode(code);
    };

    const handleNameChange = (code) => {
        setSelectedSupplierCode(code);
    };

    // 3. Generate Report Based on Type
    const handleGenerate = async () => {
        if (!user) return;
        setLoading(true);
        
        try {
            let res;
            
            switch(reportType) {
                case "dateRange":
                    // Original: Date range with optional supplier
                    res = await axios.get(`${ENDPOINTS.store}/purchase-report/generate`, {
                        params: {
                            schoolId: user.uid,
                            startDate,
                            endDate,
                            supplierCode: selectedSupplierCode || null
                        },
                        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
                    });
                    break;
                    
                case "supplierOnly":
                    // NEW: All purchases for selected supplier (no date range)
                    if (!selectedSupplierCode) {
                        toast.error("Please select a supplier for this report type");
                        setLoading(false);
                        return;
                    }
                    res = await axios.get(`${ENDPOINTS.store}/purchase-report/supplier/all`, {
                        params: {
                            schoolId: user.uid,
                            supplierCode: selectedSupplierCode
                        },
                        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
                    });
                    break;
                    
                case "all":
                    // NEW: All purchases without any filters
                    res = await axios.get(`${ENDPOINTS.store}/purchase-report/all`, {
                        params: {
                            schoolId: user.uid
                        },
                        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
                    });
                    break;
                    
                default:
                    toast.error("Invalid report type");
                    setLoading(false);
                    return;
            }
            
            const data = res.data || [];
            setReportData(data);
            
            // Calculate Total using grossAmount
            const total = data.reduce((sum, item) => sum + (parseFloat(item.grossAmount) || 0), 0);
            setGrandTotal(total);

            if(data.length === 0) {
                toast.info("No Purchase records found.");
            } else {
                let message = "";
                switch(reportType) {
                    case "dateRange":
                        message = `Date Range Report: ${data.length} records found (${startDate} to ${endDate})`;
                        break;
                    case "supplierOnly":
                        const sup = supplierList.find(s => s.supplier_code === selectedSupplierCode);
                        message = `Supplier Report: ${data.length} records found for ${sup?.supplier_name || selectedSupplierCode}`;
                        break;
                    case "all":
                        message = `All Purchases Report: ${data.length} records found`;
                        break;
                }
                toast.success(message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate report");
        } finally {
            setLoading(false);
        }
    };

    // 4. Download as PDF
    const downloadPDF = async () => {
        if (reportData.length === 0) {
            toast.warning("No data to download");
            return;
        }

        setExporting(true);
        
        try {
            // Dynamic import to avoid SSR issues
            const { jsPDF } = await import("jspdf");
            
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            // Header
            doc.setFontSize(18);
            doc.setTextColor(11, 61, 123);
            
            // Report title based on type
            let reportTitle = "PURCHASE REPORT";
            switch(reportType) {
                case "dateRange":
                    reportTitle = "PURCHASE REPORT (Date Range)";
                    break;
                case "supplierOnly":
                    reportTitle = "SUPPLIER PURCHASE REPORT";
                    break;
                case "all":
                    reportTitle = "ALL PURCHASES REPORT";
                    break;
            }
            doc.text(reportTitle, 148, 15, { align: 'center' });
            
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            
            // Report info based on type
            let yPos = 23;
            
            switch(reportType) {
                case "dateRange":
                    doc.text(`Period: ${startDate} to ${endDate}`, 148, yPos, { align: 'center' });
                    yPos += 6;
                    break;
                case "supplierOnly":
                    const sup = supplierList.find(s => s.supplier_code === selectedSupplierCode);
                    if (sup) {
                        doc.text(`Supplier: ${selectedSupplierCode} - ${sup.supplier_name}`, 148, yPos, { align: 'center' });
                        yPos += 6;
                    }
                    doc.text(`All Purchase Records for Selected Supplier`, 148, yPos, { align: 'center' });
                    yPos += 6;
                    break;
                case "all":
                    doc.text(`All Purchase Records (No Filters)`, 148, yPos, { align: 'center' });
                    yPos += 6;
                    break;
            }
            
            if (reportType === "dateRange") {
                doc.text(`Total Records: ${reportData.length} | Grand Total: ${grandTotal.toFixed(2)}`, 148, yPos, { align: 'center' });
                yPos += 6;
            }
            
            doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, 148, yPos, { align: 'center' });
            
            // Prepare table data
            const headers = [["S.No", "Purchase Date", "Entry No", "Supplier Code", "Supplier Name", "Invoice No", "Gross Amount"]];
            const rows = reportData.map((row, index) => [
                (index + 1).toString(),
                row.purchaseDate || "-",
                row.entryNo || "-",
                row.supplierCode || "-",
                row.supplierName || "-",
                row.invoiceNo || "-",
                parseFloat(row.grossAmount || 0).toFixed(2)
            ]);
            
            // Add totals row
            rows.push([
                "",
                "",
                "",
                "",
                "",
                "GRAND TOTAL",
                grandTotal.toFixed(2)
            ]);
            
            // Create table manually
            const startY = 50;
            const cellHeight = 8;
            const colWidths = [10, 25, 25, 25, 40, 25, 25];
            
            // Draw header
            doc.setFillColor(11, 61, 123);
            doc.setTextColor(255, 255, 255);
            doc.setFont(undefined, 'bold');
            
            let xPos = 10;
            headers[0].forEach((header, colIndex) => {
                doc.rect(xPos, startY, colWidths[colIndex], cellHeight, 'F');
                doc.text(header, xPos + 2, startY + 5);
                xPos += colWidths[colIndex];
            });
            
            // Draw rows
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
            
            rows.forEach((row, rowIndex) => {
                const yPos = startY + (rowIndex + 1) * cellHeight;
                let xPos = 10;
                
                // Alternate row colors
                if (rowIndex % 2 === 0 && rowIndex < rows.length - 1) {
                    doc.setFillColor(245, 245, 245);
                    doc.rect(10, yPos, 195, cellHeight, 'F');
                }
                
                // Highlight totals row
                if (rowIndex === rows.length - 1) {
                    doc.setFillColor(227, 242, 253);
                    doc.rect(10, yPos, 195, cellHeight, 'F');
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(11, 61, 123);
                }
                
                row.forEach((cell, colIndex) => {
                    // Right align amount column
                    if (colIndex === 6) {
                        const textWidth = doc.getTextWidth(cell);
                        doc.text(cell, xPos + colWidths[colIndex] - textWidth - 2, yPos + 5);
                    } else {
                        doc.text(cell.toString(), xPos + 2, yPos + 5);
                    }
                    xPos += colWidths[colIndex];
                });
                
                // Reset styles for next row
                doc.setFont(undefined, 'normal');
                doc.setTextColor(0, 0, 0);
            });
            
            // Add border
            doc.setDrawColor(200, 200, 200);
            doc.rect(5, 5, 287, 200);
            
            // Save PDF
            let filename = "";
            switch(reportType) {
                case "dateRange":
                    filename = `Purchase_Report_${startDate}_to_${endDate}_${new Date().getTime()}.pdf`;
                    break;
                case "supplierOnly":
                    filename = `Supplier_Purchase_Report_${selectedSupplierCode}_${new Date().getTime()}.pdf`;
                    break;
                case "all":
                    filename = `All_Purchases_Report_${new Date().getTime()}.pdf`;
                    break;
            }
            doc.save(filename);
            toast.success("PDF downloaded successfully!");
            
        } catch (error) {
            console.error("PDF Generation Error:", error);
            toast.error("Failed to generate PDF");
        } finally {
            setExporting(false);
        }
    };

    // 5. Download as Excel (CSV)
    const downloadExcel = () => {
        if (reportData.length === 0) {
            toast.warning("No data to download");
            return;
        }

        setExporting(true);
        
        try {
            // Create CSV content
            let csvContent = "data:text/csv;charset=utf-8,";
            
            // Add header info
            let reportTitle = "PURCHASE REPORT";
            switch(reportType) {
                case "dateRange":
                    reportTitle = "PURCHASE REPORT (Date Range)";
                    break;
                case "supplierOnly":
                    reportTitle = "SUPPLIER PURCHASE REPORT";
                    break;
                case "all":
                    reportTitle = "ALL PURCHASES REPORT";
                    break;
            }
            csvContent += reportTitle + "\r\n";
            
            switch(reportType) {
                case "dateRange":
                    csvContent += `Period: ${startDate} to ${endDate}\r\n`;
                    break;
                case "supplierOnly":
                    const sup = supplierList.find(s => s.supplier_code === selectedSupplierCode);
                    if (sup) {
                        csvContent += `Supplier: ${selectedSupplierCode} - ${sup.supplier_name}\r\n`;
                    }
                    csvContent += `All Purchase Records for Selected Supplier\r\n`;
                    break;
                case "all":
                    csvContent += `All Purchase Records (No Filters)\r\n`;
                    break;
            }
            
            csvContent += `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\r\n`;
            csvContent += `Total Records: ${reportData.length}\r\n\r\n`;
            
            // Column headers
            csvContent += "S.No,Purchase Date,Entry No,Supplier Code,Supplier Name,Invoice No,Gross Amount\r\n";
            
            // Data rows
            reportData.forEach((row, index) => {
                const rowData = [
                    index + 1,
                    `"${row.purchaseDate || ""}"`,
                    `"${row.entryNo || ""}"`,
                    `"${row.supplierCode || ""}"`,
                    `"${row.supplierName || ""}"`,
                    `"${row.invoiceNo || ""}"`,
                    parseFloat(row.grossAmount || 0).toFixed(2)
                ];
                csvContent += rowData.join(",") + "\r\n";
            });
            
            // Totals row
            csvContent += `,,,,,GRAND TOTAL,${grandTotal.toFixed(2)}\r\n`;
            
            // Create download link
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            
            let filename = "";
            switch(reportType) {
                case "dateRange":
                    filename = `Purchase_Report_${startDate}_to_${endDate}.csv`;
                    break;
                case "supplierOnly":
                    filename = `Supplier_Purchase_Report_${selectedSupplierCode}.csv`;
                    break;
                case "all":
                    filename = `All_Purchases_Report.csv`;
                    break;
            }
            
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success("Excel (CSV) file downloaded successfully!");
            
        } catch (error) {
            console.error("Excel Export Error:", error);
            toast.error("Failed to generate Excel file");
        } finally {
            setExporting(false);
        }
    };

    // 6. Download as Text
    const downloadText = () => {
        if (reportData.length === 0) {
            toast.warning("No data to download");
            return;
        }

        setExporting(true);
        
        try {
            let reportTitle = "PURCHASE REPORT";
            switch(reportType) {
                case "dateRange":
                    reportTitle = "PURCHASE REPORT (Date Range)";
                    break;
                case "supplierOnly":
                    reportTitle = "SUPPLIER PURCHASE REPORT";
                    break;
                case "all":
                    reportTitle = "ALL PURCHASES REPORT";
                    break;
            }
            
            let textContent = reportTitle + "\n";
            textContent += "=".repeat(60) + "\n\n";
            
            switch(reportType) {
                case "dateRange":
                    textContent += `Period         : ${startDate} to ${endDate}\n`;
                    break;
                case "supplierOnly":
                    const sup = supplierList.find(s => s.supplier_code === selectedSupplierCode);
                    if (sup) {
                        textContent += `Supplier       : ${selectedSupplierCode} - ${sup.supplier_name}\n`;
                    }
                    textContent += `Report Type    : All Purchase Records for Selected Supplier\n`;
                    break;
                case "all":
                    textContent += `Report Type    : All Purchase Records (No Filters)\n`;
                    break;
            }
            
            textContent += `Generated      : ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\n`;
            textContent += `Total Records  : ${reportData.length}\n`;
            textContent += `Grand Total    : ${grandTotal.toFixed(2)}\n\n`;
            textContent += "-".repeat(90) + "\n\n";
            
            // Table header
            textContent += "S.No  Date        Entry No   Sup Code  Supplier Name                Invoice No  Gross Amount\n";
            textContent += "-".repeat(90) + "\n";
            
            // Data rows
            reportData.forEach((row, index) => {
                const sno = (index + 1).toString().padEnd(5);
                const date = (row.purchaseDate || "").padEnd(12);
                const entryNo = (row.entryNo || "").padEnd(10);
                const supCode = (row.supplierCode || "").padEnd(9);
                const supName = (row.supplierName || "").padEnd(30).substring(0, 30);
                const invNo = (row.invoiceNo || "").padEnd(11);
                const amount = parseFloat(row.grossAmount || 0).toFixed(2).padStart(12);
                
                textContent += `${sno}${date}${entryNo}${supCode}${supName}${invNo}${amount}\n`;
            });
            
            textContent += "-".repeat(90) + "\n";
            
            // Totals row
            const totalLabel = "GRAND TOTAL".padEnd(69);
            const totalAmount = grandTotal.toFixed(2).padStart(12);
            textContent += `${totalLabel}${totalAmount}\n`;
            
            // Create download link
            const blob = new Blob([textContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            
            let filename = "";
            switch(reportType) {
                case "dateRange":
                    filename = `Purchase_Report_${startDate}_to_${endDate}.txt`;
                    break;
                case "supplierOnly":
                    filename = `Supplier_Purchase_Report_${selectedSupplierCode}.txt`;
                    break;
                case "all":
                    filename = `All_Purchases_Report.txt`;
                    break;
            }
            
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toast.success("Text file downloaded successfully!");
            
        } catch (error) {
            console.error("Text Export Error:", error);
            toast.error("Failed to generate text file");
        } finally {
            setExporting(false);
        }
    };

    // 7. Print Report
    const printReport = () => {
        if (reportData.length === 0) {
            toast.warning("No data to print");
            return;
        }

        const printWindow = window.open('', '_blank');
        const supName = selectedSupplierCode ? 
            supplierList.find(s => s.supplier_code === selectedSupplierCode)?.supplier_name || "" : "";
        
        let reportTitle = "PURCHASE REPORT";
        let reportSubtitle = `${startDate} to ${endDate}`;
        let reportDescription = "";
        
        switch(reportType) {
            case "dateRange":
                reportTitle = "PURCHASE REPORT";
                reportSubtitle = `${startDate} to ${endDate}`;
                break;
            case "supplierOnly":
                reportTitle = "SUPPLIER PURCHASE REPORT";
                reportSubtitle = `All Records for ${selectedSupplierCode} - ${supName}`;
                reportDescription = "All purchase records for selected supplier (no date filter)";
                break;
            case "all":
                reportTitle = "ALL PURCHASES REPORT";
                reportSubtitle = "All Purchase Records";
                reportDescription = "All purchase records (no date or supplier filter)";
                break;
        }
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Purchase Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0B3D7B; padding-bottom: 15px; }
                        .header h1 { color: #0B3D7B; margin: 0; font-size: 24px; }
                        .header h3 { color: #333; margin: 10px 0; font-size: 16px; }
                        .info { margin: 20px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #0B3D7B; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th { background-color: #0B3D7B; color: white; padding: 12px; text-align: left; font-weight: bold; }
                        td { padding: 10px; border-bottom: 1px solid #ddd; }
                        .totals { background-color: #e3f2fd; font-weight: bold; border-top: 2px solid #0B3D7B; }
                        .summary { margin-top: 30px; padding: 20px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 5px; }
                        .summary h3 { margin-top: 0; color: #0B3D7B; }
                        @media print { 
                            body { margin: 10px; }
                            .no-print { display: none; }
                            table { font-size: 12px; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${reportTitle}</h1>
                        <h3>${reportSubtitle}</h3>
                        ${reportDescription ? `<p>${reportDescription}</p>` : ''}
                        ${reportType === "dateRange" && selectedSupplierCode ? `<p><strong>Supplier:</strong> ${selectedSupplierCode} - ${supName}</p>` : ''}
                        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                    
                    <div class="info">
                        <strong>Report Summary:</strong> Total Records: ${reportData.length} | Grand Total: ${grandTotal.toFixed(2)}
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Purchase Date</th>
                                <th>Entry No</th>
                                <th>Supplier Code</th>
                                <th>Supplier Name</th>
                                <th>Invoice No</th>
                                <th>Gross Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reportData.map((row, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${row.purchaseDate || "-"}</td>
                                    <td>${row.entryNo || "-"}</td>
                                    <td>${row.supplierCode || "-"}</td>
                                    <td>${row.supplierName || "-"}</td>
                                    <td>${row.invoiceNo || "-"}</td>
                                    <td style="text-align: right;">${parseFloat(row.grossAmount || 0).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                            <tr class="totals">
                                <td colspan="6" style="text-align: right;"><strong>GRAND TOTAL:</strong></td>
                                <td style="text-align: right; color: #0B3D7B;"><strong>${grandTotal.toFixed(2)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="summary">
                        <h3>Summary</h3>
                        <p><strong>Total Purchase Records:</strong> ${reportData.length}</p>
                        <p><strong>Total Gross Amount:</strong> ${grandTotal.toFixed(2)}</p>
                        ${reportType === "dateRange" ? `<p><strong>Report Period:</strong> ${startDate} to ${endDate}</p>` : ''}
                        ${reportType === "supplierOnly" ? `<p><strong>Supplier:</strong> ${selectedSupplierCode} - ${supName}</p>` : ''}
                    </div>
                    
                    <div class="no-print" style="margin-top: 30px; text-align: center;">
                        <button onclick="window.print()" style="padding: 10px 20px; background: #0B3D7B; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                            Print Report
                        </button>
                        <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Close
                        </button>
                    </div>
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
    };

    const handleClear = () => {
        setSelectedSupplierCode("");
        setReportData([]);
        setGrandTotal(0);
        setReportType("dateRange");
    };

    const handleReportTypeChange = (type) => {
        setReportType(type);
        // Clear report data when switching types
        setReportData([]);
        setGrandTotal(0);
    };

    return (
        <MainContentPage>
            <Container fluid className="px-0">
                <div className="row mb-4">
                    <div className="col-12">
                        <h4 className="fw-bold" style={{ color: "#0B3D7B" }}>Purchase Report</h4>
                        <p className="text-muted">View and analyze purchase transactions with multiple report options</p>
                    </div>
                </div>

                <Card className="shadow-sm mb-4 border-0">
                    <Card.Header className="py-3" style={{ 
                        backgroundColor: '#0B3D7B',
                        borderBottom: '3px solid #FFC107',
                        color: 'white'
                    }}>
                        <div className="d-flex align-items-center">
                            <FaFilter className="me-3" size={20} />
                            <div>
                                <h5 className="mb-0 fw-bold">Report Type Selection</h5>
                                <p className="mb-0 small opacity-75">Choose report type and set filters</p>
                            </div>
                        </div>
                    </Card.Header>

                    <Card.Body className="p-4">
                        {/* Report Type Selection */}
                        <div className="mb-4">
                            <Row className="align-items-center mb-3">
                                <Col md={3}>
                                    <h6 className="fw-bold mb-0">Select Report Type:</h6>
                                </Col>
                                <Col md={9}>
                                    <ToggleButtonGroup 
                                        type="radio" 
                                        name="reportType"
                                        value={reportType}
                                        onChange={handleReportTypeChange}
                                        className="w-100"
                                    >
                                        <ToggleButton 
                                            id="dateRange" 
                                            value="dateRange"
                                            variant={reportType === "dateRange" ? "primary" : "outline-primary"}
                                            className="d-flex align-items-center justify-content-center"
                                        >
                                            <FaCalendarAlt className="me-2" /> Date Range Report
                                        </ToggleButton>
                                        <ToggleButton 
                                            id="supplierOnly" 
                                            value="supplierOnly"
                                            variant={reportType === "supplierOnly" ? "primary" : "outline-primary"}
                                            className="d-flex align-items-center justify-content-center"
                                        >
                                            <FaFilter className="me-2" /> Supplier Report (All Records)
                                        </ToggleButton>
                                        <ToggleButton 
                                            id="all" 
                                            value="all"
                                            variant={reportType === "all" ? "primary" : "outline-primary"}
                                            className="d-flex align-items-center justify-content-center"
                                        >
                                            <FaEye className="me-2" /> All Purchases Report
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                </Col>
                            </Row>

                            {/* Help Text */}
                            <div className="alert alert-info py-2 mb-0">
                                <small>
                                    <strong>{reportType === "dateRange" ? "Date Range Report:" : reportType === "supplierOnly" ? "Supplier Report:" : "All Purchases Report:"}</strong>
                                    {reportType === "dateRange" ? " View purchases within a specific date range with optional supplier filter." : ""}
                                    {reportType === "supplierOnly" ? " View ALL purchase records for a selected supplier (no date restriction)." : ""}
                                    {reportType === "all" ? " View ALL purchase records without any filters." : ""}
                                </small>
                            </div>
                        </div>

                        {/* Filters Section */}
                        <div className="p-4 mb-4 border rounded bg-light">
                            <Row className="g-3 align-items-end">
                                {/* Date Selection (Only for dateRange type) */}
                                {reportType === "dateRange" && (
                                    <>
                                        <Col md={2}>
                                            <Form.Group>
                                                <Form.Label className="fw-bold small text-dark">From Date</Form.Label>
                                                <Form.Control 
                                                    type="date" 
                                                    value={startDate} 
                                                    onChange={(e) => setStartDate(e.target.value)} 
                                                    className="border-2"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={2}>
                                            <Form.Group>
                                                <Form.Label className="fw-bold small text-dark">To Date</Form.Label>
                                                <Form.Control 
                                                    type="date" 
                                                    value={endDate} 
                                                    onChange={(e) => setEndDate(e.target.value)} 
                                                    className="border-2"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </>
                                )}

                                {/* Supplier Selection (for dateRange and supplierOnly types) */}
                                {(reportType === "dateRange" || reportType === "supplierOnly") && (
                                    <>
                                        <Col md={reportType === "dateRange" ? 3 : 5}>
                                            <Form.Group>
                                                <Form.Label className="fw-bold small text-dark">
                                                    {reportType === "supplierOnly" ? "Select Supplier *" : "Supplier Code"}
                                                </Form.Label>
                                                <SearchableSelect 
                                                    options={supplierList}
                                                    value={selectedSupplierCode}
                                                    onChange={handleCodeChange}
                                                    valueKey="supplier_code"
                                                    labelKey="supplier_code"
                                                    placeholder="Type to search code..."
                                                />
                                            </Form.Group>
                                        </Col>

                                        {/* Supplier Name Dropdown (Synced) */}
                                        <Col md={reportType === "dateRange" ? 3 : 5}>
                                            <Form.Group>
                                                <Form.Label className="fw-bold small text-dark">Supplier Name</Form.Label>
                                                <SearchableSelect 
                                                    options={supplierList}
                                                    value={selectedSupplierCode}
                                                    onChange={handleNameChange}
                                                    valueKey="supplier_code"
                                                    labelKey="supplier_name"
                                                    placeholder="Type to search name..."
                                                />
                                            </Form.Group>
                                        </Col>
                                    </>
                                )}

                                {/* Info for All Report type */}
                                {reportType === "all" && (
                                    <Col md={8}>
                                        <div className="alert alert-warning mb-0 py-2">
                                            <FaEye className="me-2" />
                                            <strong>All Purchases Report:</strong> This will show ALL purchase records without any date or supplier filters.
                                        </div>
                                    </Col>
                                )}

                                {/* Actions */}
                                <Col md={reportType === "all" ? 4 : 2} className="d-flex gap-2">
                                    <Button 
                                        variant="primary" 
                                        className="w-100 fw-bold d-flex align-items-center justify-content-center"
                                        onClick={handleGenerate}
                                        style={{ 
                                            backgroundColor: "#0B3D7B",
                                            borderColor: "#0B3D7B",
                                            height: '42px'
                                        }}
                                        disabled={loading || (reportType === "supplierOnly" && !selectedSupplierCode)}
                                    >
                                        {loading ? (
                                            <Spinner size="sm" animation="border" className="me-2" />
                                        ) : (
                                            <FaSearch className="me-2" />
                                        )}
                                        {loading ? "Generating..." : "View Report"}
                                    </Button>
                                    <Button 
                                        variant="outline-secondary" 
                                        className="d-flex align-items-center justify-content-center"
                                        onClick={handleClear}
                                        style={{ height: '42px', width: '42px' }}
                                        title="Clear All"
                                    >
                                        <FaTimes />
                                    </Button>
                                </Col>
                            </Row>
                        </div>

                        {/* Report Summary */}
                        {reportData.length > 0 && (
                            <div className="alert alert-info border-0 mb-4" style={{ 
                                backgroundColor: '#e3f2fd',
                                borderLeft: '4px solid #0B3D7B'
                            }}>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="fw-bold mb-1 text-dark">
                                            {reportType === "dateRange" ? `Purchase Report: ${startDate} to ${endDate}` : 
                                             reportType === "supplierOnly" ? `Supplier Report: ${selectedSupplierCode}` : 
                                             "All Purchases Report"}
                                        </h6>
                                        <p className="mb-0 small">
                                            {reportType === "dateRange" && selectedSupplierCode ? 
                                                `Supplier: ${selectedSupplierCode} - ${supplierList.find(s => s.supplier_code === selectedSupplierCode)?.supplier_name || ""}` :
                                                reportType === "supplierOnly" ? 
                                                `All records for: ${supplierList.find(s => s.supplier_code === selectedSupplierCode)?.supplier_name || selectedSupplierCode}` :
                                                'All suppliers | All dates'
                                            }
                                        </p>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <span className="badge bg-primary px-3 py-2">
                                            Records: {reportData.length}
                                        </span>
                                        <span className="badge bg-success px-3 py-2">
                                            Total: ${grandTotal.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Report Table */}
                        <div className="table-responsive" style={{ maxHeight: '500px' }}>
                            <Table hover bordered className="mb-0">
                                <thead className="text-white" style={{ 
                                    backgroundColor: '#0B3D7B',
                                    position: 'sticky',
                                    top: 0
                                }}>
                                    <tr>
                                        <th>S.No</th>
                                        <th>Purchase Date</th>
                                        <th>Entry No</th>
                                        <th>Supplier Code</th>
                                        <th>Supplier Name</th>
                                        <th>Invoice No</th>
                                        <th className="text-end">Gross Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.length > 0 ? (
                                        reportData.map((row, index) => (
                                            <tr key={index}>
                                                <td className="fw-medium">{index + 1}</td>
                                                <td>{row.purchaseDate || "-"}</td>
                                                <td>{row.entryNo || "-"}</td>
                                                <td>
                                                    <span className="badge bg-light text-dark">
                                                        {row.supplierCode || "-"}
                                                    </span>
                                                </td>
                                                <td className="fw-medium">{row.supplierName || "-"}</td>
                                                <td>{row.invoiceNo || "-"}</td>
                                                <td className="text-end fw-bold text-success">
                                                    {parseFloat(row.grossAmount || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="text-center py-5 text-muted">
                                                {reportType === "dateRange" ? "No purchase records found for the selected criteria" :
                                                 reportType === "supplierOnly" ? "Select a supplier and click 'View Report' to see all purchase records" :
                                                 "Click 'View Report' to see all purchase records"}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                {reportData.length > 0 && (
                                    <tfoot style={{ 
                                        backgroundColor: '#f1f8ff',
                                        position: 'sticky',
                                        bottom: 0
                                    }}>
                                        <tr className="fw-bold">
                                            <td colSpan="6" className="text-end">GRAND TOTAL:</td>
                                            <td className="text-end" style={{ 
                                                color: "#0B3D7B", 
                                                fontSize: "1.1em",
                                                borderTop: "2px solid #0B3D7B"
                                            }}>
                                                {grandTotal.toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </Table>
                        </div>
                    </Card.Body>

                    {/* Footer Buttons */}
                    {reportData.length > 0 && (
                        <Card.Footer className="bg-white py-3 border-top">
                            <div className="d-flex justify-content-center gap-3">
                                <Dropdown>
                                    <Dropdown.Toggle variant="danger" className="px-4 py-2 fw-bold d-flex align-items-center">
                                        <FaDownload className="me-2" /> Export Report
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        <Dropdown.Item onClick={downloadPDF} disabled={exporting}>
                                            <FaFilePdf className="me-2" />
                                            {exporting ? 'Generating PDF...' : 'Download as PDF'}
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={downloadExcel} disabled={exporting}>
                                            <FaFileExcel className="me-2" />
                                            {exporting ? 'Generating Excel...' : 'Download as Excel (CSV)'}
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={downloadText} disabled={exporting}>
                                            <FaFileAlt className="me-2" />
                                            {exporting ? 'Generating Text...' : 'Download as Text'}
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                                
                                <Button 
                                    variant="outline-primary" 
                                    onClick={printReport}
                                    className="px-4 py-2 fw-bold d-flex align-items-center"
                                >
                                    <FaFileAlt className="me-2" /> Print Report
                                </Button>
                                
                                <Button 
                                    variant="secondary" 
                                    onClick={() => window.history.back()}
                                    className="px-4 py-2 fw-bold"
                                >
                                    Close
                                </Button>
                            </div>
                        </Card.Footer>
                    )}
                </Card>
                <ToastContainer position="top-right" autoClose={3000} />
            </Container>
            
            <style>{`
                .hover-bg-light:hover { background-color: #f8f9fa; }
                .form-control:focus, .form-select:focus { 
                    box-shadow: 0 0 0 0.2rem rgba(11, 61, 123, 0.25); 
                    border-color: #0B3D7B; 
                }
                .border-2 { border-width: 2px !important; }
                .dropdown-menu { border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .dropdown-item { padding: 10px 15px; border-radius: 4px; margin: 2px; }
                .dropdown-item:hover { background-color: #f8f9fa; }
                .table thead th { font-weight: 600; }
                .table tbody tr:hover { background-color: rgba(11, 61, 123, 0.05); }
                .btn-toggle {
                    border-radius: 6px !important;
                    margin: 0 2px;
                }
                .btn-toggle.active {
                    box-shadow: 0 0 0 2px rgba(11, 61, 123, 0.25);
                }
                @media print {
                    .card-header, .form-check, .btn, .ToastContainer, 
                    .border-top, .bg-light, .dropdown, .alert,
                    .btn-toggle, .toggle-button-group { 
                        display: none !important; 
                    }
                    .table {
                        font-size: 11px !important;
                        border: 1px solid #dee2e6 !important;
                    }
                    .table thead th {
                        background-color: #f8f9fa !important;
                        color: #000 !important;
                        border-bottom: 2px solid #dee2e6 !important;
                    }
                    body { 
                        background: white !important; 
                        padding: 20px !important;
                    }
                }
            `}</style>
        </MainContentPage>
    );
};

export default PurchaseReport;