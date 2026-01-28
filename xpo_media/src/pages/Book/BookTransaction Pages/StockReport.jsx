"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainContentPage from "../../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container, Card, Spinner, Badge, Alert, Dropdown, Tabs, Tab } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuthContext } from "../../../Context/AuthContext";
import { ENDPOINTS } from "../../../SpringBoot/config";
import axios from "axios";
import { 
  Calendar, 
  Filter, 
  Download, 
  Printer, 
  RefreshCw, 
  FileText,
  ChevronRight,
  Package,
  FileSpreadsheet,
  FileType,
  FileDown,
  CalendarRange,
  Grid,
  List,
  Calculator,
  TrendingUp
} from "lucide-react";

const StockReport = () => {
  const { user } = useAuthContext();

  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [itemList, setItemList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [groupedReportData, setGroupedReportData] = useState({});
  const [exporting, setExporting] = useState(false);
  const [viewMode, setViewMode] = useState("grouped"); // grouped or flat
  const [activeTab, setActiveTab] = useState("overall"); // overall or datewise

  // 1. Load Dropdown Items
  useEffect(() => {
    if (user) {
      axios.get(`${ENDPOINTS.store}/report/items`, { 
        params: { schoolId: user.uid }, 
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
      })
      .then(res => {
        setItemList(res.data || []);
      })
      .catch(err => console.error("Error loading items", err));
    }
  }, [user]);

  // 2. Set default dates
  useEffect(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // For date-wise report, default to yesterday's date range
    setStartDate(yesterday.toISOString().split('T')[0]);
    setEndDate(yesterday.toISOString().split('T')[0]);
  }, []);

  // 3. Generate Report
  const handleGenerate = async () => {
    setLoading(true);
    setReportData([]);
    setGroupedReportData({});

    try {
      const params = {
        schoolId: user.uid,
        itemName: selectedItem === "Select Item" || selectedItem === "Select Item (Optional)" ? "" : selectedItem
      };

      // Add date parameters based on active tab
      if (activeTab === "datewise") {
        if (!startDate || !endDate) {
          toast.error("Please select start and end dates for date-wise report");
          setLoading(false);
          return;
        }
        params.startDate = startDate;
        params.endDate = endDate;
      } else {
        // Overall report: no date parameters
        params.startDate = null;
        params.endDate = null;
      }

      // Get grouped report
      const groupedRes = await axios.get(`${ENDPOINTS.store}/report/grouped`, {
        params,
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
      });

      if (groupedRes.data && Object.keys(groupedRes.data).length > 0) {
        setGroupedReportData(groupedRes.data);
        
        // Also get flat report for calculations
        const flatRes = await axios.get(`${ENDPOINTS.store}/report/generate`, {
          params,
          headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
        });
        
        if (flatRes.data && flatRes.data.length > 0) {
          setReportData(flatRes.data);
        }
        
        toast.success(`Stock report generated successfully!`);
      } else {
        toast.info("No stock records found for the selected criteria.");
      }
    } catch (error) {
      console.error("Report Error:", error);
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Calculate Totals
  const calculateTotals = () => {
    if (reportData.length === 0) {
      return { totalOpening: 0, totalPurchase: 0, totalIssued: 0, totalBalance: 0, totalClosing: 0 };
    }
    
    const totalOpening = reportData.reduce((sum, item) => sum + (item.openingBalance || 0), 0);
    const totalPurchase = reportData.reduce((sum, item) => sum + (item.purchaseQty || 0), 0);
    const totalIssued = reportData.reduce((sum, item) => sum + (item.issuedQty || 0), 0);
    const totalBalance = reportData.reduce((sum, item) => sum + (item.balanceQty || 0), 0);
    const totalClosing = reportData.reduce((sum, item) => sum + (item.closingBalance || 0), 0);
    
    return { totalOpening, totalPurchase, totalIssued, totalBalance, totalClosing };
  };

  // 5. Download as PDF
  const downloadPDF = async () => {
    if (Object.keys(groupedReportData).length === 0) {
      toast.error("No report data to export");
      return;
    }

    setExporting(true);
    
    try {
      const { jsPDF } = await import("jspdf");
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(11, 61, 123);
      
      if (activeTab === "overall") {
        doc.text("OVERALL STOCK REPORT", 148, 15, { align: 'center' });
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text("Cumulative Stock Balance (All Time)", 148, 23, { align: 'center' });
      } else {
        doc.text("DATE-WISE STOCK REPORT", 148, 15, { align: 'center' });
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`From: ${startDate} To: ${endDate}`, 148, 23, { align: 'center' });
      }
      
      // Report Info
      doc.setFontSize(10);
      const { totalOpening, totalPurchase, totalIssued, totalBalance, totalClosing } = calculateTotals();
      
      doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, 148, 31, { align: 'center' });
      doc.text(`Total Items: ${reportData.length}`, 148, 37, { align: 'center' });
      
      if (selectedItem && selectedItem !== "Select Item" && selectedItem !== "Select Item (Optional)") {
        doc.text(`Item Filter: ${selectedItem}`, 148, 43, { align: 'center' });
      }
      
      // Prepare table data
      const headers = [["SL", "Description", "Unit", "Opening", "Purchase", "Issued", "Balance", "Closing", "Category", "Std"]];
      let rowIndex = 0;
      let currentY = 50;
      
      Object.entries(groupedReportData).forEach(([standard, items]) => {
        // Add Standard header
        if (currentY > 180) {
          doc.addPage();
          currentY = 20;
        }
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(11, 61, 123);
        doc.text(`Standard: ${standard || "Uncategorized"}`, 10, currentY);
        currentY += 7;
        
        // Draw table header
        doc.setFillColor(11, 61, 123);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        
        const colWidths = [8, 55, 12, 15, 15, 15, 15, 15, 25, 10];
        let xPos = 10;
        headers[0].forEach((header, colIndex) => {
          doc.rect(xPos, currentY, colWidths[colIndex], 6, 'F');
          doc.text(header, xPos + 1, currentY + 3.5);
          xPos += colWidths[colIndex];
        });
        
        currentY += 6;
        
        // Draw items
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        
        items.forEach((item, idx) => {
          if (currentY > 180) {
            doc.addPage();
            currentY = 20;
          }
          
          const yPos = currentY;
          let xPos = 10;
          
          // Alternate row colors
          if (rowIndex % 2 === 0) {
            doc.setFillColor(245, 245, 245);
            doc.rect(10, yPos, 280, 5, 'F');
          }
          
          const row = [
            (rowIndex + 1).toString(),
            item.description.length > 30 ? item.description.substring(0, 30) + "..." : item.description,
            item.unit || "-",
            (item.openingBalance || 0).toString(),
            (item.purchaseQty || 0).toString(),
            (item.issuedQty || 0).toString(),
            (item.balanceQty || 0).toString(),
            (item.closingBalance || 0).toString(),
            item.category || "-",
            standard || "-"
          ];
          
          row.forEach((cell, colIndex) => {
            // Color code balance columns
            if ((colIndex === 6 || colIndex === 7) && rowIndex < items.length) {
              const balance = parseInt(cell);
              if (balance > 0) {
                doc.setTextColor(46, 125, 50);
              } else if (balance < 0) {
                doc.setTextColor(198, 40, 40);
              }
            }
            
            doc.text(cell.toString(), xPos + 1, yPos + 3);
            
            // Reset color
            doc.setTextColor(0, 0, 0);
            xPos += colWidths[colIndex];
          });
          
          currentY += 5;
          rowIndex++;
        });
        
        // Add space between groups
        currentY += 4;
      });
      
      // Add totals row
      if (currentY > 180) {
        doc.addPage();
        currentY = 20;
      }
      
      const totalY = currentY + 3;
      doc.setFillColor(227, 242, 253);
      doc.rect(10, totalY, 280, 6, 'F');
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      
      const totalRow = [
        "",
        "TOTAL",
        "",
        totalOpening.toString(),
        totalPurchase.toString(),
        totalIssued.toString(),
        totalBalance.toString(),
        totalClosing.toString(),
        "",
        ""
      ];
      
      let xPos = 10;
      const colWidths = [8, 55, 12, 15, 15, 15, 15, 15, 25, 10];
      totalRow.forEach((cell, colIndex) => {
        doc.text(cell, xPos + 1, totalY + 3);
        xPos += colWidths[colIndex];
      });
      
      // Add summary
      currentY = totalY + 10;
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text("SUMMARY", 10, currentY);
      currentY += 7;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Opening Balance (${activeTab === "overall" ? "Always 0 for Overall" : `as of ${startDate}`}): ${totalOpening}`, 10, currentY);
      currentY += 5;
      doc.text(`Total Purchase: ${totalPurchase}`, 10, currentY);
      currentY += 5;
      doc.text(`Total Issued: ${totalIssued}`, 10, currentY);
      currentY += 5;
      doc.text(`Period Balance (Purchase - Issued): ${totalBalance}`, 10, currentY);
      currentY += 5;
      doc.text(`Closing Balance (${activeTab === "overall" ? "Cumulative Total" : `as of ${endDate}`}): ${totalClosing}`, 10, currentY);
      
      // Add page border
      doc.setDrawColor(200, 200, 200);
      doc.rect(5, 5, 287, 200);
      
      // Save PDF
      let filename;
      if (activeTab === "datewise") {
        filename = `Stock_Report_${startDate.replace(/-/g, '_')}_to_${endDate.replace(/-/g, '_')}.pdf`;
      } else {
        filename = `Stock_Report_Overall_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.pdf`;
      }
      
      doc.save(filename);
      toast.success("PDF downloaded successfully!");
      
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // 6. Download as Excel
  const downloadExcel = () => {
    if (Object.keys(groupedReportData).length === 0) {
      toast.error("No report data to export");
      return;
    }

    setExporting(true);
    
    try {
      const { totalOpening, totalPurchase, totalIssued, totalBalance, totalClosing } = calculateTotals();
      
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Report header
      if (activeTab === "overall") {
        csvContent += "OVERALL STOCK REPORT\r\n";
        csvContent += "Cumulative Stock Balance (All Time)\r\n";
      } else {
        csvContent += "DATE-WISE STOCK REPORT\r\n";
        csvContent += `From: ${startDate}\r\n`;
        csvContent += `To: ${endDate}\r\n`;
      }
      
      csvContent += `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\r\n`;
      
      if (selectedItem && selectedItem !== "Select Item" && selectedItem !== "Select Item (Optional)") {
        csvContent += `Item Filter: ${selectedItem}\r\n`;
      }
      
      csvContent += `Total Items: ${reportData.length}\r\n`;
      csvContent += "\r\n";
      
      // Column headers
      csvContent += "SL,Description,Unit,Opening Balance,Purchase Qty,Issued Qty,Period Balance,Closing Balance,Category,Std\r\n";
      
      // Data rows grouped by standard
      let slNo = 1;
      Object.entries(groupedReportData).forEach(([standard, items]) => {
        // Add standard header
        csvContent += `Standard: ${standard}\r\n`;
        
        items.forEach(item => {
          const row = [
            slNo++,
            `"${item.description}"`,
            `"${item.unit || ""}"`,
            item.openingBalance || 0,
            item.purchaseQty || 0,
            item.issuedQty || 0,
            item.balanceQty || 0,
            item.closingBalance || 0,
            `"${item.category || ""}"`,
            `"${standard}"`
          ];
          csvContent += row.join(",") + "\r\n";
        });
        
        csvContent += "\r\n";
      });
      
      // Totals row
      csvContent += "\r\n";
      csvContent += `TOTAL,,,,${totalOpening},${totalPurchase},${totalIssued},${totalBalance},${totalClosing},,\r\n`;
      
      // Summary
      csvContent += "\r\n";
      csvContent += "SUMMARY\r\n";
      csvContent += `Report Type:,${activeTab === "overall" ? "Overall Stock Report" : `Date-wise (${startDate} to ${endDate})`}\r\n`;
      csvContent += `Opening Balance:,${totalOpening}\r\n`;
      csvContent += `Total Purchase Quantity:,${totalPurchase}\r\n`;
      csvContent += `Total Issued Quantity:,${totalIssued}\r\n`;
      csvContent += `Period Balance (Purchase - Issued):,${totalBalance}\r\n`;
      csvContent += `Closing Balance:,${totalClosing}\r\n`;
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      
      let filename;
      if (activeTab === "datewise") {
        filename = `Stock_Report_${startDate.replace(/-/g, '_')}_to_${endDate.replace(/-/g, '_')}.csv`;
      } else {
        filename = `Stock_Report_Overall_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}.csv`;
      }
      
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Excel (CSV) file downloaded successfully!");
      
    } catch (error) {
      console.error("Excel Export Error:", error);
      toast.error("Failed to generate Excel file.");
    } finally {
      setExporting(false);
    }
  };

  // 7. Reset Form
  const handleReset = () => {
    setSelectedItem("");
    setReportData([]);
    setGroupedReportData({});
    
    // Reset dates
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    setStartDate(yesterday.toISOString().split('T')[0]);
    setEndDate(yesterday.toISOString().split('T')[0]);
  };

  // 8. Print Report
  const printReport = () => {
    const printWindow = window.open('', '_blank');
    const { totalOpening, totalPurchase, totalIssued, totalBalance, totalClosing } = calculateTotals();
    
    // Build HTML for grouped report
    let reportHTML = '';
    let slNo = 1;
    
    Object.entries(groupedReportData).forEach(([standard, items]) => {
      reportHTML += `
        <tr>
          <td colspan="10" style="background-color: #f0f0f0; font-weight: bold; padding: 8px;">
            Standard: ${standard}
          </td>
        </tr>
      `;
      
      items.forEach(item => {
        const openingBalance = item.openingBalance || 0;
        const closingBalance = item.closingBalance || 0;
        const balanceStyle = item.balanceQty > 0 ? 
          'color: #155724; background-color: #d4edda;' : 
          item.balanceQty < 0 ? 'color: #721c24; background-color: #f8d7da;' : 
          'color: #856404; background-color: #fff3cd;';
        
        reportHTML += `
          <tr>
            <td>${slNo++}</td>
            <td>${item.description}</td>
            <td>${item.unit || "-"}</td>
            <td>${openingBalance}</td>
            <td>${item.purchaseQty || 0}</td>
            <td>${item.issuedQty || 0}</td>
            <td style="${balanceStyle}">${item.balanceQty || 0}</td>
            <td style="${balanceStyle}">${closingBalance}</td>
            <td>${item.category || "-"}</td>
            <td>${standard}</td>
          </tr>
        `;
      });
    });
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Stock Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { color: #0B3D7B; margin: 0; }
            .date-range { margin: 10px 0; font-weight: bold; }
            .info { margin: 15px 0; padding: 10px; background: #f8f9fa; border-left: 4px solid #0B3D7B; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
            th { background-color: #0B3D7B; color: white; padding: 8px; text-align: left; font-weight: bold; }
            td { padding: 6px; border-bottom: 1px solid #ddd; }
            .totals { background-color: #e3f2fd; font-weight: bold; }
            .summary { margin-top: 30px; padding: 15px; background-color: #f8f9fa; border: 1px solid #ddd; }
            .formula { font-style: italic; color: #666; font-size: 11px; margin-top: 5px; }
            @media print { 
              body { margin: 10px; }
              .no-print { display: none; }
              table { font-size: 11px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${activeTab === "overall" ? "OVERALL STOCK REPORT" : "DATE-WISE STOCK REPORT"}</h1>
            ${activeTab === "datewise" ? 
              `<div class="date-range">From: ${startDate} &nbsp;&nbsp; To: ${endDate}</div>` : 
              '<div>Cumulative Stock Balance (All Time)</div>'
            }
            <p>Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            ${selectedItem && selectedItem !== "Select Item" && selectedItem !== "Select Item (Optional)" ? 
              `<p>Item Filter: ${selectedItem}</p>` : ''
            }
          </div>
          
          <div class="info">
            <strong>Report Summary:</strong> Total Items: ${reportData.length} | 
            Opening: ${totalOpening} | Purchase: ${totalPurchase} | Issued: ${totalIssued} | 
            Period Balance: ${totalBalance} | Closing: ${totalClosing}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>SL</th>
                <th>Description</th>
                <th>Unit</th>
                <th>Opening</th>
                <th>Purchase</th>
                <th>Issued</th>
                <th>Period Bal.</th>
                <th>Closing</th>
                <th>Category</th>
                <th>Std</th>
              </tr>
            </thead>
            <tbody>
              ${reportHTML}
              <tr class="totals">
                <td colspan="3" style="text-align: right;">TOTAL</td>
                <td>${totalOpening}</td>
                <td>${totalPurchase}</td>
                <td>${totalIssued}</td>
                <td>${totalBalance}</td>
                <td>${totalClosing}</td>
                <td colspan="2"></td>
              </tr>
            </tbody>
          </table>
          
          <div class="summary">
            <h3>Summary & Formulas</h3>
            <p><strong>Opening Balance:</strong> ${totalOpening} 
              <div class="formula">${activeTab === "overall" ? "Always 0 for Overall Report" : `Balance as of ${startDate} (Previous day's closing)`}</div>
            </p>
            <p><strong>Total Purchase Quantity:</strong> ${totalPurchase}</p>
            <p><strong>Total Issued Quantity:</strong> ${totalIssued}</p>
            <p><strong>Period Balance:</strong> ${totalBalance}
              <div class="formula">Formula: Purchase - Issued (during the period)</div>
            </p>
            <p><strong>Closing Balance:</strong> ${totalClosing}
              <div class="formula">Formula: Opening + Purchase - Issued = ${totalOpening} + ${totalPurchase} - ${totalIssued}</div>
            </p>
            ${activeTab === "datewise" ? 
              `<p><strong>Note:</strong> Today's Closing Balance (${endDate}) = Tomorrow's Opening Balance</p>` : 
              ''
            }
          </div>
          
          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()">Print Report</button>
            <button onclick="window.close()" style="margin-left: 10px;">Close</button>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
  };

  // Calculate totals for display
  const { totalOpening, totalPurchase, totalIssued, totalBalance, totalClosing } = calculateTotals();

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        {/* Breadcrumb */}
        <div className="mb-4">
          <nav className="custom-breadcrumb py-2 py-lg-3 d-flex align-items-center">
            <Link to="/home" className="text-decoration-none text-primary fw-medium">
              Home
            </Link>
            <ChevronRight size={16} className="mx-2 text-muted" />
            <span className="text-muted">Store</span>
            <ChevronRight size={16} className="mx-2 text-muted" />
            <span className="text-dark fw-semibold">Stock Report</span>
          </nav>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-sm overflow-hidden">
          {/* Header */}
          <Card.Header className="py-3" style={{ 
            backgroundColor: '#0B3D7B',
            borderBottom: '3px solid #FFC107'
          }}>
            <div className="d-flex align-items-center">
              <Package size={24} className="text-white me-3" />
              <div>
                <h5 className="mb-0 text-white fw-bold">Stock Report</h5>
                <p className="mb-0 text-white-50 small">
                  View stock with opening/closing balance and period transactions
                </p>
              </div>
              <div className="ms-auto d-flex align-items-center gap-2">
                <Badge bg="light" text="dark" className="px-3 py-2">
                  <Calculator size={14} className="me-2" />
                  Stock Analysis
                </Badge>
                <div className="btn-group btn-group-sm">
                  <Button
                    variant={viewMode === "grouped" ? "light" : "outline-light"}
                    onClick={() => setViewMode("grouped")}
                    size="sm"
                    className="d-flex align-items-center"
                  >
                    <Grid size={14} className="me-1" />
                    Grouped
                  </Button>
                  <Button
                    variant={viewMode === "flat" ? "light" : "outline-light"}
                    onClick={() => setViewMode("flat")}
                    size="sm"
                    className="d-flex align-items-center"
                  >
                    <List size={14} className="me-1" />
                    Flat
                  </Button>
                </div>
              </div>
            </div>
          </Card.Header>

          <Card.Body className="p-4">
            {/* Report Type Tabs */}
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => {
                setActiveTab(k);
                setReportData([]);
                setGroupedReportData({});
              }}
              className="mb-4"
            >
              <Tab eventKey="overall" title={
                <div className="d-flex align-items-center">
                  <TrendingUp size={16} className="me-2" />
                  Overall Report
                </div>
              }>
                <div className="p-3 border rounded mt-3 bg-light">
                  <h6 className="fw-semibold mb-2">Overall Stock Report</h6>
                  <p className="small text-muted mb-0">
                    Shows cumulative stock balance from all time. Opening balance is always 0.
                    Closing balance = Total Purchase (all time) - Total Issued (all time)
                  </p>
                </div>
              </Tab>
              
              <Tab eventKey="datewise" title={
                <div className="d-flex align-items-center">
                  <CalendarRange size={16} className="me-2" />
                  Date-wise Report
                </div>
              }>
                <div className="p-3 border rounded mt-3 bg-light">
                  <h6 className="fw-semibold mb-2">Date-wise Stock Report</h6>
                  <p className="small text-muted mb-0">
                    Shows stock balance for a specific period. Opening balance = Previous day's closing.
                    Closing balance = Opening + Purchase (during period) - Issued (during period)
                  </p>
                </div>
              </Tab>
            </Tabs>

            {/* Filters Section */}
            <div className="border rounded p-4 mb-4 bg-light">
              <Row className="g-3">
                {/* Date Range Filter (Only for Date-wise) */}
                {activeTab === "datewise" && (
                  <>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold text-dark mb-2 d-flex align-items-center">
                          <Calendar size={16} className="me-2 text-primary" />
                          Start Date
                        </Form.Label>
                        <Form.Control 
                          type="date" 
                          value={startDate} 
                          onChange={(e) => setStartDate(e.target.value)} 
                          className="form-control border-2"
                          max={new Date().toISOString().split('T')[0]}
                        />
                        <Form.Text className="text-muted">
                          Opening balance as of this date
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold text-dark mb-2 d-flex align-items-center">
                          <Calendar size={16} className="me-2 text-primary" />
                          End Date
                        </Form.Label>
                        <Form.Control 
                          type="date" 
                          value={endDate} 
                          onChange={(e) => setEndDate(e.target.value)} 
                          className="form-control border-2"
                          max={new Date().toISOString().split('T')[0]}
                          min={startDate}
                        />
                        <Form.Text className="text-muted">
                          Closing balance as of this date
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </>
                )}

                {/* Item Filter */}
                <Col md={activeTab === "datewise" ? 4 : 8}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark mb-2 d-flex align-items-center">
                      <Filter size={16} className="me-2 text-primary" />
                      Filter by Item
                    </Form.Label>
                    <Form.Select 
                      value={selectedItem} 
                      onChange={(e) => setSelectedItem(e.target.value)}
                      className="form-control border-2"
                    >
                      <option>Select Item (Optional)</option>
                      {itemList.map((item, idx) => (
                        <option key={idx} value={item}>{item}</option>
                      ))}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Leave blank to see all items
                    </Form.Text>
                  </Form.Group>
                </Col>

                {/* Action Buttons */}
                <Col md={activeTab === "datewise" ? 4 : 8}>
                  <div className="d-flex gap-2 h-100 align-items-end">
                    <Button 
                      variant="primary" 
                      className="flex-grow-1 d-flex align-items-center justify-content-center fw-semibold"
                      onClick={handleGenerate} 
                      disabled={loading || (activeTab === "datewise" && (!startDate || !endDate))}
                      style={{ 
                        backgroundColor: '#0B3D7B',
                        borderColor: '#0B3D7B',
                        height: '42px'
                      }}
                    >
                      {loading ? (
                        <>
                          <Spinner size="sm" animation="border" className="me-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText size={18} className="me-2" />
                          Generate Report
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      className="d-flex align-items-center justify-content-center fw-semibold"
                      onClick={handleReset}
                      style={{ height: '42px', width: '42px' }}
                      title="Reset"
                    >
                      <RefreshCw size={18} />
                    </Button>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Report Summary */}
            {reportData.length > 0 && (
              <>
                <Alert variant="info" className="border-0 mb-4" style={{ 
                  backgroundColor: '#e3f8ff',
                  borderLeft: '4px solid #0B3D7B'
                }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="fw-semibold mb-1 d-flex align-items-center">
                        <Calculator size={18} className="me-2" />
                        {activeTab === "overall" ? "Overall Stock Report" : `Date-wise Report (${startDate} to ${endDate})`}
                      </h6>
                      <p className="mb-0 small">
                        {activeTab === "overall" 
                          ? "Cumulative stock balance from all transactions" 
                          : `Opening balance as of ${startDate} | Transactions during period | Closing balance as of ${endDate}`
                        }
                      </p>
                    </div>
                    <div className="d-flex gap-2">
                      <Badge bg="primary" className="px-3 py-2">
                        <Package size={14} className="me-2" />
                        {reportData.length} Items
                      </Badge>
                      <Badge bg="success" className="px-3 py-2">
                        Generated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Badge>
                    </div>
                  </div>
                </Alert>

                {/* Report Display */}
                {viewMode === "grouped" ? (
                  // Grouped View
                  Object.entries(groupedReportData).map(([standard, items], groupIndex) => (
                    <div key={groupIndex} className="mb-4">
                      {/* Standard Header */}
                      <div className="bg-light p-3 mb-2 border rounded d-flex align-items-center">
                        <Badge bg="secondary" className="me-3 px-3 py-2">
                          Standard: {standard || "Uncategorized"}
                        </Badge>
                        <span className="text-muted small">
                          {items.length} items in this standard
                        </span>
                      </div>

                      {/* Items Table */}
                      <div className="table-responsive">
                        <table className="table table-hover table-bordered align-middle" style={{ fontSize: '13px' }}>
                          <thead className="text-white" style={{ backgroundColor: '#0B3D7B' }}>
                            <tr>
                              <th className="py-2 ps-3">SL</th>
                              <th className="py-2 ps-3">Description</th>
                              <th className="py-2 text-center">Unit</th>
                              <th className="py-2 text-center">Opening</th>
                              <th className="py-2 text-center">Purchase</th>
                              <th className="py-2 text-center">Issued</th>
                              <th className="py-2 text-center">Period Bal.</th>
                              <th className="py-2 text-center">Closing</th>
                              <th className="py-2 text-center">Category</th>
                              <th className="py-2 text-center">Std</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((row, itemIndex) => (
                              <tr key={`${groupIndex}-${itemIndex}`}>
                                <td className="ps-3 fw-medium">{itemIndex + 1}</td>
                                <td className="ps-3 fw-medium">{row.description}</td>
                                <td className="text-center">{row.unit || "-"}</td>
                                <td className="text-center fw-bold" style={{ color: '#0B3D7B' }}>
                                  {(row.openingBalance || 0).toLocaleString()}
                                </td>
                                <td className="text-center">
                                  <span className="fw-bold text-success">
                                    {(row.purchaseQty || 0).toLocaleString()}
                                  </span>
                                </td>
                                <td className="text-center">
                                  <span className="fw-bold text-danger">
                                    {(row.issuedQty || 0).toLocaleString()}
                                  </span>
                                </td>
                                <td className="text-center fw-bold" style={{ 
                                  backgroundColor: row.balanceQty > 0 ? '#d4edda' : 
                                                  row.balanceQty < 0 ? '#f8d7da' : '#fff3cd',
                                  color: row.balanceQty > 0 ? '#155724' : 
                                         row.balanceQty < 0 ? '#721c24' : '#856404'
                                }}>
                                  {(row.balanceQty || 0).toLocaleString()}
                                </td>
                                <td className="text-center fw-bold" style={{ 
                                  backgroundColor: row.closingBalance > 0 ? '#d4edda' : 
                                                  row.closingBalance < 0 ? '#f8d7da' : '#fff3cd',
                                  color: row.closingBalance > 0 ? '#155724' : 
                                         row.closingBalance < 0 ? '#721c24' : '#856404'
                                }}>
                                  {(row.closingBalance || 0).toLocaleString()}
                                </td>
                                <td className="text-center">
                                  <Badge bg="light" text="dark" className="px-2 py-1">
                                    {row.category || "N/A"}
                                  </Badge>
                                </td>
                                <td className="text-center fw-bold">{standard}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                ) : (
                  // Flat View
                  <div className="table-responsive mb-4">
                    <table className="table table-hover table-bordered align-middle" style={{ fontSize: '13px' }}>
                      <thead className="text-white" style={{ backgroundColor: '#0B3D7B' }}>
                        <tr>
                          <th className="py-3 ps-3">SL</th>
                          <th className="py-3 ps-3">Description</th>
                          <th className="py-3 text-center">Unit</th>
                          <th className="py-3 text-center">Opening</th>
                          <th className="py-3 text-center">Purchase</th>
                          <th className="py-3 text-center">Issued</th>
                          <th className="py-3 text-center">Period Bal.</th>
                          <th className="py-3 text-center">Closing</th>
                          <th className="py-3 text-center">Category</th>
                          <th className="py-3 text-center">Std</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.map((row, index) => (
                          <tr key={index}>
                            <td className="ps-3 fw-medium">{index + 1}</td>
                            <td className="ps-3 fw-medium">{row.description}</td>
                            <td className="text-center">{row.unit || "-"}</td>
                            <td className="text-center fw-bold" style={{ color: '#0B3D7B' }}>
                              {(row.openingBalance || 0).toLocaleString()}
                            </td>
                            <td className="text-center">
                              <span className="fw-bold text-success">
                                {(row.purchaseQty || 0).toLocaleString()}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="fw-bold text-danger">
                                {(row.issuedQty || 0).toLocaleString()}
                              </span>
                            </td>
                            <td className="text-center fw-bold" style={{ 
                              backgroundColor: row.balanceQty > 0 ? '#d4edda' : 
                                              row.balanceQty < 0 ? '#f8d7da' : '#fff3cd',
                              color: row.balanceQty > 0 ? '#155724' : 
                                     row.balanceQty < 0 ? '#721c24' : '#856404'
                            }}>
                              {(row.balanceQty || 0).toLocaleString()}
                            </td>
                            <td className="text-center fw-bold" style={{ 
                              backgroundColor: row.closingBalance > 0 ? '#d4edda' : 
                                              row.closingBalance < 0 ? '#f8d7da' : '#fff3cd',
                              color: row.closingBalance > 0 ? '#155724' : 
                                     row.closingBalance < 0 ? '#721c24' : '#856404'
                            }}>
                              {(row.closingBalance || 0).toLocaleString()}
                            </td>
                            <td className="text-center">
                              <Badge bg="light" text="dark" className="px-2 py-1">
                                {row.category || "N/A"}
                              </Badge>
                            </td>
                            <td className="text-center fw-bold">{row.standard || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ backgroundColor: '#f1f8ff' }}>
                          <th className="ps-3 py-2 text-end" colSpan="3">TOTAL</th>
                          <th className="text-center py-2">
                            <span className="fw-bold" style={{ color: '#0B3D7B' }}>
                              {totalOpening.toLocaleString()}
                            </span>
                          </th>
                          <th className="text-center py-2">
                            <span className="fw-bold text-success">
                              {totalPurchase.toLocaleString()}
                            </span>
                          </th>
                          <th className="text-center py-2">
                            <span className="fw-bold text-danger">
                              {totalIssued.toLocaleString()}
                            </span>
                          </th>
                          <th className="text-center py-2">
                            <span className="fw-bold text-primary">
                              {totalBalance.toLocaleString()}
                            </span>
                          </th>
                          <th className="text-center py-2">
                            <span className="fw-bold text-primary">
                              {totalClosing.toLocaleString()}
                            </span>
                          </th>
                          <th className="text-center py-2" colSpan="2"></th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* Export Buttons */}
                <div className="d-flex justify-content-center gap-3 pt-3 border-top">
                  <Dropdown>
                    <Dropdown.Toggle variant="danger" className="px-4 py-2 fw-semibold d-flex align-items-center">
                      <Download size={20} className="me-2" />
                      Export Report
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={downloadPDF} disabled={exporting}>
                        <FileText size={18} className="me-2" />
                        {exporting ? 'Generating PDF...' : 'Download as PDF'}
                      </Dropdown.Item>
                      <Dropdown.Item onClick={downloadExcel} disabled={exporting}>
                        <FileSpreadsheet size={18} className="me-2" />
                        {exporting ? 'Generating Excel...' : 'Download as Excel (CSV)'}
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                  
                  <Button 
                    variant="outline-primary" 
                    onClick={printReport}
                    className="px-4 py-2 fw-semibold d-flex align-items-center"
                  >
                    <Printer size={20} className="me-2" />
                    Print Report
                  </Button>
                </div>

                {/* Summary Card */}
                <Card className="mt-4 border-0 shadow-sm" style={{ backgroundColor: '#f8fdff' }}>
                  <Card.Body>
                    <h6 className="fw-bold mb-3 d-flex align-items-center">
                      <Calculator size={18} className="me-2" />
                      Report Summary
                    </h6>
                    <Row>
                      <Col md={3}>
                        <div className="text-center p-3 border rounded bg-white">
                          <div className="small text-muted">Opening Balance</div>
                          <div className="h4 fw-bold" style={{ color: '#0B3D7B' }}>
                            {totalOpening.toLocaleString()}
                          </div>
                          <small className="text-muted">
                            {activeTab === "overall" ? "Always 0 for Overall" : `as of ${startDate}`}
                          </small>
                        </div>
                      </Col>
                      <Col md={2}>
                        <div className="text-center p-3 border rounded bg-white">
                          <div className="small text-muted">+ Purchase</div>
                          <div className="h4 fw-bold text-success">
                            {totalPurchase.toLocaleString()}
                          </div>
                        </div>
                      </Col>
                      <Col md={2}>
                        <div className="text-center p-3 border rounded bg-white">
                          <div className="small text-muted">- Issued</div>
                          <div className="h4 fw-bold text-danger">
                            {totalIssued.toLocaleString()}
                          </div>
                        </div>
                      </Col>
                      <Col md={2}>
                        <div className="text-center p-3 border rounded bg-white">
                          <div className="small text-muted">= Period Balance</div>
                          <div className="h4 fw-bold" style={{ 
                            color: totalBalance > 0 ? '#155724' : 
                                   totalBalance < 0 ? '#721c24' : '#856404' 
                          }}>
                            {totalBalance.toLocaleString()}
                          </div>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="text-center p-3 border rounded bg-white">
                          <div className="small text-muted">Closing Balance</div>
                          <div className="h4 fw-bold" style={{ 
                            color: totalClosing > 0 ? '#155724' : 
                                   totalClosing < 0 ? '#721c24' : '#856404' 
                          }}>
                            {totalClosing.toLocaleString()}
                          </div>
                          <small className="text-muted">
                            {activeTab === "overall" ? "Cumulative Total" : `as of ${endDate}`}
                          </small>
                        </div>
                      </Col>
                    </Row>
                    <div className="mt-3 text-center">
                      <small className="text-muted">
                        Formula: Closing = Opening + Purchase - Issued = {totalOpening} + {totalPurchase} - {totalIssued} = {totalClosing}
                      </small>
                      {activeTab === "datewise" && (
                        <div className="mt-1">
                          <small className="text-info">
                            <strong>Note:</strong> Today's Closing Balance ({endDate}) = Tomorrow's Opening Balance
                          </small>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </>
            )}
          </Card.Body>
        </Card>

        <ToastContainer 
          position="top-right" 
          autoClose={3000}
          theme="colored"
        />
      </Container>

      <style>{`
        .custom-breadcrumb {
          font-size: 14px;
        }
        .custom-breadcrumb a:hover {
          color: #0B3D7B !important;
          text-decoration: underline !important;
        }
        .table th {
          font-weight: 600;
          letter-spacing: 0.3px;
        }
        .table tbody tr:hover {
          background-color: #f8f9fa;
          transition: all 0.2s ease;
        }
        .form-control, .form-select {
          border-radius: 6px;
          transition: all 0.3s ease;
        }
        .form-control:focus, .form-select:focus {
          border-color: #0B3D7B;
          box-shadow: 0 0 0 0.2rem rgba(11, 61, 123, 0.25);
        }
        .badge {
          border-radius: 6px;
          font-weight: 500;
        }
        .border-2 {
          border-width: 2px !important;
        }
        .dropdown-menu {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .dropdown-item {
          padding: 10px 15px;
          border-radius: 4px;
          margin: 2px;
        }
        .dropdown-item:hover {
          background-color: #f8f9fa;
        }
        .nav-tabs .nav-link {
          font-weight: 500;
        }
        .nav-tabs .nav-link.active {
          background-color: #e3f2fd !important;
          border-color: #dee2e6 #dee2e6 #e3f2fd !important;
          color: #0B3D7B !important;
          font-weight: 600;
        }
        @media print {
          .card-header, .form-check, .btn, .ToastContainer, 
          .border-top, .bg-light, .d-print-none, .dropdown,
          .btn-group, .nav-tabs, .summary-card, .export-buttons { 
            display: none !important; 
          }
          .table {
            font-size: 11px !important;
            border: 1px solid #dee2e6 !important;
          }
          .table th {
            background-color: #f8f9fa !important;
            color: #000 !important;
            border-bottom: 2px solid #dee2e6 !important;
          }
          .alert {
            background-color: #e3f2fd !important;
            border: 1px solid #0B3D7B !important;
            color: #000 !important;
          }
          body { 
            background: white !important; 
            padding: 20px !important;
          }
          h5, h6 {
            color: #000 !important;
            margin-bottom: 10px !important;
          }
        }
      `}</style>
    </MainContentPage>
  );
};

export default StockReport;