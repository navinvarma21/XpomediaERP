import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import MainContentPage from "../../components/MainContent/MainContentPage";
import { Card, Form, Button, Spinner } from "react-bootstrap";
import { useAuthContext } from "../../Context/AuthContext";
import { ENDPOINTS } from "../../SpringBoot/config";
import { toast, ToastContainer } from "react-toastify";
import { FaPrint } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";

const BankExpenses = () => {
  // 1. Get currentAcademicYear from context
  const { schoolId, getAuthHeaders, currentAcademicYear } = useAuthContext();
  const [fromDate, setFromDate] = useState(new Date().toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Ref for printing the report section
  const printRef = useRef();

  const fetchData = async () => {
    if (!schoolId) return;

    // 2. Validate Academic Year
    if (!currentAcademicYear) {
      toast.error("Academic Year not selected. Please check your settings.");
      return;
    }

    setLoading(true);
    try {
      // 3. Pass academicYear to backend
      const response = await fetch(
        `${ENDPOINTS.reports}/bank-expenses-summary?schoolId=${schoolId}&fromDate=${fromDate}&toDate=${toDate}&academicYear=${currentAcademicYear}`,
        { headers: getAuthHeaders() }
      );
      
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        toast.error("Failed to fetch bank expenses summary");
        setData([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Server error while fetching report");
    } finally {
      setLoading(false);
    }
  };

  // Calculate Grand Total
  const grandTotal = data.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  // Print Functionality to match PDF output
  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '', 'height=800,width=1000');
    
    printWindow.document.write('<html><head><title>Bank Expenses Report</title>');
    printWindow.document.write(`
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
        .red-table { width: 100%; border-collapse: collapse; border: 1px solid red; }
        .red-table th, .red-table td { border: 1px solid red; padding: 6px 8px; }
        .red-table th { color: black; font-weight: bold; text-align: center; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .fw-bold { font-weight: bold; }
        .report-header { display: flex; justify-content: space-between; margin-bottom: 10px; font-weight: bold; font-size: 14px; }
        @media print {
           .no-print { display: none; }
           .red-table { border: 1px solid red !important; }
           .red-table td, .red-table th { border: 1px solid red !important; }
        }
      </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <MainContentPage>
      <div className="container-fluid px-0">
        {/* Navigation Breadcrumb */}
        <div className="mb-4">
          <nav className="d-flex custom-breadcrumb py-1 py-lg-3">
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <div>Reports</div>
            <span className="separator mx-2">&gt;</span>
            <span>Bank Expenses Summary</span>
          </nav>
        </div>

        <Card className="shadow-sm">
          <Card.Header className="custom-btn-clr text-white">
            <h5 className="mb-0">Bank Expenses (Grouped Abstract)</h5>
          </Card.Header>
          <Card.Body>
            {/* Control Panel: Dates & Generate Button */}
            <div className="row g-3 mb-4 align-items-end">
              <div className="col-md-3">
                <Form.Label>From Date</Form.Label>
                <Form.Control 
                  type="date" 
                  value={fromDate} 
                  onChange={e => setFromDate(e.target.value)} 
                />
              </div>
              <div className="col-md-3">
                <Form.Label>To Date</Form.Label>
                <Form.Control 
                  type="date" 
                  value={toDate} 
                  onChange={e => setToDate(e.target.value)} 
                />
              </div>
              <div className="col-md-3">
                <Button 
                  className="w-100 custom-btn-clr" 
                  onClick={fetchData} 
                  disabled={loading}
                >
                  {loading ? <Spinner size="sm" animation="border" /> : "Generate Report"}
                </Button>
              </div>
              <div className="col-md-3">
                <Button 
                  variant="outline-danger" 
                  className="w-100" 
                  onClick={handlePrint}
                  disabled={data.length === 0}
                >
                  <FaPrint className="me-2" /> Print PDF
                </Button>
              </div>
            </div>

            <hr />

            {/* REPORT SECTION: Matches Logic of Image 6.png & 7.png */}
            <div ref={printRef} className="mt-4 p-2 bg-white">
              {data.length > 0 && (
                <>
                  {/* Report Header Info */}
                  <div className="d-flex justify-content-between mb-2 fw-bold" style={{ fontSize: '14px', color: 'black' }}>
                    <div>Report Date On : {new Date().toLocaleDateString('en-GB')}</div>
                    <div>Bank Expenses From : {new Date(fromDate).toLocaleDateString('en-GB')}</div>
                    <div>To : {new Date(toDate).toLocaleDateString('en-GB')}</div>
                  </div>

                  {/* Red Bordered Data Table */}
                  <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid red' }}>
                      <thead>
                        <tr>
                          <th style={{ border: '1px solid red', padding: '8px', width: '10%', textAlign: 'center', color: 'black', fontWeight: 'bold' }}>SI.No</th>
                          <th style={{ border: '1px solid red', padding: '8px', width: '60%', textAlign: 'left', color: 'black', fontWeight: 'bold' }}>Description</th>
                          <th style={{ border: '1px solid red', padding: '8px', width: '30%', textAlign: 'center', color: 'black', fontWeight: 'bold' }}>Payments</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((row, index) => (
                          <tr key={index}>
                            <td style={{ border: '1px solid red', padding: '8px', textAlign: 'center', color: 'black', fontWeight: 'bold' }}>
                              {index + 1}
                            </td>
                            <td style={{ border: '1px solid red', padding: '8px', textAlign: 'left', color: 'black', fontWeight: 'bold', textTransform: 'uppercase' }}>
                              {row.description || "N/A"}
                            </td>
                            <td style={{ border: '1px solid red', padding: '8px', textAlign: 'right', color: 'black', fontWeight: 'bold' }}>
                              {parseFloat(row.totalAmount).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        
                        {/* Grand Total Row */}
                        <tr>
                           <td colSpan="2" style={{ border: '1px solid red', padding: '8px', textAlign: 'center', fontWeight: 'bold', color: 'black' }}>
                             Grand Total :
                           </td>
                           <td style={{ border: '1px solid red', padding: '8px', textAlign: 'right', fontWeight: 'bold', color: 'black' }}>
                             {grandTotal.toFixed(2)}
                           </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Footer (Optional branding) */}
                  <div className="text-center mt-5" style={{ fontSize: '10px', color: '#666' }}>
                     Generated via School ERP System
                  </div>
                </>
              )}

              {/* Empty State */}
              {data.length === 0 && !loading && (
                <div className="text-center text-muted py-5">
                  No bank expenses found for the selected date range.
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </MainContentPage>
  );
};

export default BankExpenses;