"use client";

import React, { useState } from "react";
import MainContentPage from "../../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container, Card, Table, Spinner } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuthContext } from "../../../Context/AuthContext";
import { ENDPOINTS } from "../../../SpringBoot/config";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaFilePdf, FaSearch, FaTimes } from "react-icons/fa";

const BookDistributeReport = () => {
    const { user } = useAuthContext();
    
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [isOverall, setIsOverall] = useState(false);

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalQuantity, setTotalQuantity] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [totalItemAmount, setTotalItemAmount] = useState(0);

    const handleGenerate = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await axios.get(`${ENDPOINTS.store}/distribute-report/generate`, {
                params: {
                    schoolId: user.uid,
                    startDate: startDate,
                    endDate: endDate,
                    isOverall: isOverall
                }
            });
            
            setReportData(res.data);
            
            const qtySum = res.data.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
            const itemAmtSum = res.data.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
            const totalAmtSum = res.data.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);
            
            setTotalQuantity(qtySum);
            setTotalItemAmount(itemAmtSum);
            setTotalAmount(totalAmtSum);

            if(res.data.length === 0) toast.info("No records found.");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate report");
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = () => {
        if (reportData.length === 0) {
            toast.warning("No data to download");
            return;
        }

        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.setTextColor(11, 61, 123);
        doc.text("Book Distribution Report (Detailed)", 14, 15);
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        if (isOverall) {
            doc.text(`Report Type: Overall History`, 14, 22);
        } else {
            doc.text(`Period: ${startDate} to ${endDate}`, 14, 22);
        }

        const tableColumn = ["Date", "Bill No", "Student Name", "Class", "Item Name", "Qty", "Item Amount", "Total Amount"];
        const tableRows = [];

        reportData.forEach(row => {
            const rowData = [
                row.fee_date,
                row.bill_no,
                row.student_name,
                `${row.standard}-${row.section}`,
                row.description_name,
                row.quantity,
                parseFloat(row.amount || 0).toFixed(2),
                parseFloat(row.total_amount || 0).toFixed(2)
            ];
            tableRows.push(rowData);
        });

        tableRows.push(["", "", "", "", "TOTAL:", totalQuantity, totalItemAmount.toFixed(2), totalAmount.toFixed(2)]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: [11, 61, 123] },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 20 },
                2: { cellWidth: 35 },
                3: { cellWidth: 15 },
                4: { cellWidth: 35 },
                5: { cellWidth: 12, halign: 'center' },
                6: { cellWidth: 22, halign: 'right' },
                7: { cellWidth: 25, halign: 'right' }
            },
            didParseCell: function (data) {
                if (data.row.index === tableRows.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [240, 240, 240];
                }
            }
        });

        doc.save(`Book_Distribution_Detailed.pdf`);
    };

    const handleClear = () => {
        setReportData([]);
        setTotalQuantity(0);
        setTotalItemAmount(0);
        setTotalAmount(0);
        setIsOverall(false);
    };

    return (
        <MainContentPage>
            <Container fluid className="px-0">
                <div className="row mb-4">
                    <div className="col-12">
                        <h4 className="fw-bold">Book Distribute Report (Detailed)</h4>
                    </div>
                </div>

                <Card className="shadow-sm mb-4">
                    <Card.Header className="bg-white py-3">
                        <Row className="g-3 align-items-end">
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">From Date</Form.Label>
                                    <Form.Control 
                                        type="date" 
                                        value={startDate} 
                                        onChange={(e) => setStartDate(e.target.value)} 
                                        disabled={isOverall}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">To Date</Form.Label>
                                    <Form.Control 
                                        type="date" 
                                        value={endDate} 
                                        onChange={(e) => setEndDate(e.target.value)} 
                                        disabled={isOverall}
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={3} className="d-flex align-items-center mb-2">
                                <Form.Check 
                                    type="checkbox"
                                    id="overall-check"
                                    label="Overall (All History)"
                                    className="fw-bold text-primary"
                                    style={{ fontSize: '1.05rem' }}
                                    checked={isOverall}
                                    onChange={(e) => setIsOverall(e.target.checked)}
                                />
                            </Col>

                            <Col md={5} className="d-flex gap-2 justify-content-end">
                                <Button 
                                    variant="primary" 
                                    className="fw-bold px-4" 
                                    onClick={handleGenerate}
                                    style={{ backgroundColor: "#0B3D7B" }}
                                    disabled={loading}
                                >
                                    {loading ? <Spinner size="sm" /> : <><FaSearch className="me-2"/> View</>}
                                </Button>
                                <Button variant="outline-secondary" onClick={handleClear}>
                                    <FaTimes /> Clear
                                </Button>
                            </Col>
                        </Row>
                    </Card.Header>

                    <Card.Body className="p-0">
                        <div className="table-responsive" style={{ maxHeight: '500px' }}>
                            <Table hover bordered className="mb-0">
                                <thead className="bg-light sticky-top" style={{ zIndex: 1 }}>
                                    <tr>
                                        <th>Date</th>
                                        <th>Bill No</th>
                                        <th>Student Name</th>
                                        <th>Class</th>
                                        <th>Item Description</th>
                                        <th className="text-center">Qty</th>
                                        <th className="text-end">Item Amount</th>
                                        <th className="text-end">Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.length > 0 ? (
                                        reportData.map((row, index) => (
                                            <tr key={index}>
                                                <td>{row.fee_date}</td>
                                                <td className="fw-bold text-primary">{row.bill_no}</td>
                                                <td>{row.student_name}</td>
                                                <td>{row.standard} - {row.section}</td>
                                                <td>{row.description_name}</td>
                                                <td className="text-center">{row.quantity}</td>
                                                <td className="text-end fw-bold text-primary">
                                                    {parseFloat(row.amount || 0).toFixed(2)}
                                                </td>
                                                <td className="text-end fw-bold text-success">
                                                    {parseFloat(row.total_amount || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="text-center py-5 text-muted">
                                                No records found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                {reportData.length > 0 && (
                                    <tfoot className="bg-light sticky-bottom" style={{ bottom: 0 }}>
                                        <tr className="fw-bold" style={{ borderTop: "2px solid #000" }}>
                                            <td colSpan="5" className="text-end">GRAND TOTAL:</td>
                                            <td className="text-center" style={{ fontSize: "1.1em" }}>{totalQuantity}</td>
                                            <td className="text-end" style={{ color: "#0B3D7B", fontSize: "1.1em" }}>
                                                {totalItemAmount.toFixed(2)}
                                            </td>
                                            <td className="text-end" style={{ color: "#28a745", fontSize: "1.1em" }}>
                                                {totalAmount.toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </Table>
                        </div>
                    </Card.Body>

                    <Card.Footer className="bg-white py-3 border-top">
                         <div className="d-flex justify-content-center gap-3">
                             <Button variant="danger" onClick={downloadPDF} disabled={reportData.length === 0}>
                                 <FaFilePdf className="me-2" /> Download PDF
                             </Button>
                             <Button variant="secondary" onClick={() => window.history.back()}>
                                 Close
                             </Button>
                         </div>
                    </Card.Footer>
                </Card>
                <ToastContainer position="top-right" autoClose={3000} />
            </Container>
            
            <style>{`
                .form-control:focus { box-shadow: none; border-color: #0B3D7B; }
                .form-check-input:checked { background-color: #0B3D7B; border-color: #0B3D7B; }
                .text-primary { color: #0B3D7B !important; }
                .text-success { color: #28a745 !important; }
            `}</style>
        </MainContentPage>
    );
};

export default BookDistributeReport;