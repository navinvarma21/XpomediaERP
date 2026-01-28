"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuthContext } from "../../../Context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ENDPOINTS } from "../../../SpringBoot/config";
import MainContentPage from "../../../components/MainContent/MainContentPage";
import { Container, Form, Button, Row, Col, Card, Spinner, ListGroup, InputGroup, Badge, Table } from "react-bootstrap";
import { 
  FaQrcode, FaBook, FaSave, FaEraser, FaPlus, FaSearch, 
  FaPrint, FaFilePdf, FaTruck, FaDatabase, FaList, FaHistory, FaLayerGroup,FaCalendarAlt
} from "react-icons/fa";
import QRCode from "qrcode";
import axios from "axios";
import jsPDF from "jspdf";
import './QRCodeStickers.css';

// --- REUSABLE DROPDOWN COMPONENT ---
const SearchableDropdown = ({ value, options, onChange, onSelect, placeholder, disabled = false, isLoading = false }) => {
    const [show, setShow] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setShow(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => 
        String(opt.label || "").toLowerCase().includes(String(value || "").toLowerCase()) ||
        String(opt.secondaryLabel || "").toLowerCase().includes(String(value || "").toLowerCase())
    );

    return (
        <div ref={wrapperRef} className="position-relative">
            <InputGroup>
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <Form.Control 
                    type="text" 
                    value={value} 
                    onChange={(e) => { onChange(e.target.value); if (!show) setShow(true); }}
                    onFocus={() => setShow(true)} 
                    placeholder={placeholder} 
                    disabled={disabled || isLoading} 
                    autoComplete="off" 
                    className="bg-white" 
                />
                {isLoading && <InputGroup.Text><Spinner size="sm" /></InputGroup.Text>}
            </InputGroup>
            {show && filteredOptions.length > 0 && !disabled && (
                <ListGroup className="position-absolute w-100 shadow-lg" style={{ zIndex: 9999, maxHeight: "300px", overflowY: "auto", borderRadius: "8px", marginTop: "2px" }}>
                    {filteredOptions.map((opt, idx) => (
                        <ListGroup.Item key={idx} action onClick={() => { onSelect(opt); setShow(false); }} className="py-2 px-3 border-bottom">
                            <div className="fw-bold text-primary">{opt.label}</div>
                            {opt.secondaryLabel && <small className="text-muted d-block mt-1">{opt.secondaryLabel}</small>}
                            {opt.stock !== undefined && <small className="text-success d-block mt-1">Stock: <Badge bg="success">{opt.stock}</Badge></small>}
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---
const QRCodeSetup_New = () => {
  const { schoolId, currentAcademicYear } = useAuthContext();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPrintingAll, setIsPrintingAll] = useState(false);
  
  // Data Lists
  const [booksList, setBooksList] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [existingStocks, setExistingStocks] = useState([]); 
  
  const [lastSavedQR, setLastSavedQR] = useState(null); 
  
  const [formData, setFormData] = useState({
    qrCodeNo: "", bookCode: "", bookName: "", mrpRate: "", purchaseRate: "", sellingRate: "",
    departmentName: "", quantity: "", publisherName: "", authorName: "", language: "", supplierName: "", remarks: ""
  });
  
  const [qrImage, setQrImage] = useState(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  
  // 1. Initial Load
  useEffect(() => {
    if (schoolId && currentAcademicYear) {
      fetchInitialData();
      fetchExistingStocks(); 
      generateNextQRCode();
    }
  }, [schoolId, currentAcademicYear]);

  // 2. Dynamic QR Preview
  useEffect(() => {
    if (formData.qrCodeNo) {
        generateQRImage(formData.qrCodeNo);
    }
  }, [formData.qrCodeNo]);

  // --- API FETCHING ---
  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
      const params = { schoolId, academicYear: currentAcademicYear };
      
      const bookRes = await axios.get(`${ENDPOINTS.library}`, { params, headers });
      setBooksList(Array.isArray(bookRes.data) ? bookRes.data : []);
      
      const supRes = await axios.get(`${ENDPOINTS.library}/booksuppliers`, { 
          params: { schoolId, year: currentAcademicYear }, 
          headers 
      });
      setSuppliersList(Array.isArray(supRes.data) ? supRes.data : []);

    } catch (error) {
      console.error("Error fetching master data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExistingStocks = async () => {
    try {
      const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
      const params = { schoolId, academicYear: currentAcademicYear };
      
      const res = await axios.get(ENDPOINTS.qrcode.existingBooks, { params, headers });
      setExistingStocks(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching stocks table:", error);
    }
  };

  const generateNextQRCode = async () => {
    if (!schoolId) return;
    setIsGeneratingQR(true);
    try {
      const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
      const res = await axios.get(ENDPOINTS.qrcode.generate, { 
          params: { schoolId, academicYear: currentAcademicYear, _t: new Date().getTime() }, 
          headers 
      });
      if (res.data?.qrCodeNo) setFormData(prev => ({ ...prev, qrCodeNo: res.data.qrCodeNo }));
    } catch (error) {
      const fallbackQR = `QR${schoolId.substring(0, 3).toUpperCase()}${currentAcademicYear.substring(2,4)}${Date.now().toString().slice(-4)}`;
      setFormData(prev => ({ ...prev, qrCodeNo: fallbackQR }));
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const generateQRImage = async (text) => {
    try {
      const url = await QRCode.toDataURL(text, { width: 300, margin: 1, color: { dark: '#000000', light: '#FFFFFF' } });
      setQrImage(url);
      return url;
    } catch (err) {
      const fallback = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
      setQrImage(fallback);
      return fallback;
    }
  };

  // --- FORM HANDLERS ---
  const handleBookSelect = (book) => {
    setFormData(prev => ({
      ...prev,
      bookCode: book.bookId || book.bookCode, 
      bookName: book.bookTitle || book.bookName,
      mrpRate: book.mrp || book.mrpRate || "", 
      purchaseRate: book.purchaseRate || "", 
      sellingRate: book.sellingRate || "",
      publisherName: book.publisher || book.publisherName || "", 
      authorName: book.authorName || "",
      language: book.language || "", 
      quantity: "", 
      departmentName: prev.departmentName || book.departmentName || ""
    }));
    toast.info(`Selected: ${book.bookTitle || book.bookName}`);
  };

  const handleSupplierSelect = (supplier) => setFormData(prev => ({ ...prev, supplierName: supplier.supplierName }));
  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const resetForm = () => {
    setFormData({ 
        qrCodeNo: "", bookCode: "", bookName: "", mrpRate: "", purchaseRate: "", sellingRate: "", 
        departmentName: "", quantity: "", publisherName: "", authorName: "", language: "", supplierName: "", remarks: "" 
    });
    setQrImage(null); 
    generateNextQRCode();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.qrCodeNo || !formData.bookCode || !formData.quantity) return toast.error("Please fill all required fields");

    setIsSaving(true);
    try {
      let finalQrImage = qrImage || await generateQRImage(formData.qrCodeNo);
      
      const payload = {
        ...formData, 
        qrCodeImage: finalQrImage,
        quantity: parseInt(formData.quantity), 
        mrpRate: parseFloat(formData.mrpRate) || 0,
        purchaseRate: parseFloat(formData.purchaseRate) || 0, 
        sellingRate: parseFloat(formData.sellingRate) || 0,
        schoolId, 
        academicYear: currentAcademicYear
      };

      const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}`, 'Content-Type': 'application/json' };
      await axios.post(ENDPOINTS.qrcode.saveNew, payload, { headers });
      
      toast.success("Book Added & Saved Successfully!");
      setLastSavedQR(formData.qrCodeNo); 
      
      resetForm();
      fetchExistingStocks(); 
      
    } catch (error) {
      toast.error(`Save failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- INDIVIDUAL PDF GENERATION ---
  const generatePDF = (data) => {
    try {
        const qty = parseInt(data.quantity) || 1;
        const bookName = data.bookName || "Book Name";
        const authorName = data.authorName || "Author";
        const publisherName = data.publisherName || "Publisher";
        const qrCodeNumber = data.qrCodeNo || "";
        const qrImgData = data.qrCodeImage; 

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        
        const colWidth = 65; 
        const rowHeight = 35; 
        const cols = 3;
        const rows = 8;
        const startX = 7;
        const startY = 10;
        
        let col = 0;
        let row = 0;

        for (let i = 0; i < qty; i++) {
            if (row >= rows) {
                doc.addPage();
                row = 0;
                col = 0;
            }

            const x = startX + (col * colWidth);
            const y = startY + (row * rowHeight);

            // Border
            doc.setDrawColor(200);
            doc.setLineWidth(0.1);
            doc.rect(x, y, colWidth - 2, rowHeight - 2);

            // 1. TOP: Book Name
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            const title = doc.splitTextToSize(bookName, colWidth - 5);
            doc.text(title[0], x + (colWidth / 2), y + 5, { align: 'center' });

            // 2. CENTER LEFT: QR Image
            if (qrImgData) {
                doc.addImage(qrImgData, 'PNG', x + 2, y + 7, 19, 19);
            }

            // 3. CENTER RIGHT: Author Name
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            const authorX = x + 23; 
            const authorY = y + 15;
            doc.text("Auth:", authorX, authorY);
            doc.setFont("helvetica", "bold");
            const authorText = doc.splitTextToSize(authorName, colWidth - 26);
            doc.text(authorText[0], authorX, authorY + 4);

            // 4. BELOW QR: Publisher Name
            doc.setFontSize(7);
            doc.setFont("helvetica", "italic");
            const pubY = y + 28; 
            doc.text(publisherName.substring(0, 35), x + (colWidth / 2), pubY, { align: 'center' });

            // 5. BOTTOM: QR Number
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.text(qrCodeNumber, x + (colWidth / 2), pubY + 4, { align: 'center' });

            col++;
            if (col >= cols) {
                col = 0;
                row++;
            }
        }

        doc.save(`Stickers_${qrCodeNumber}.pdf`);
        toast.success(`Generated PDF for ${qrCodeNumber}`);
    } catch (err) {
        console.error("PDF Error", err);
        toast.error("Failed to generate PDF");
    }
  };

  // --- OVERALL / BULK PDF GENERATION ---
  const handlePrintOverall = async () => {
    if (!existingStocks || existingStocks.length === 0) {
        return toast.warn("No stocks available to print.");
    }

    setIsPrintingAll(true);
    try {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        
        const colWidth = 65; 
        const rowHeight = 35; 
        const cols = 3;
        const rows = 8;
        const startX = 7;
        const startY = 10;
        
        let col = 0;
        let row = 0;
        let totalStickers = 0;

        // Loop through EVERY batch in existingStocks
        for (let sIndex = 0; sIndex < existingStocks.length; sIndex++) {
            const batch = existingStocks[sIndex];
            const qty = parseInt(batch.quantity) || 1;
            
            // NOTE: Ensure qrCodeImage is present. If fetched from table list it might be there.
            // If missing (due to API optimization), we might need to fetch it. 
            // Assuming getExistingBooks returns it as per backend code.
            const qrImgData = batch.qrCodeImage && !batch.qrCodeImage.startsWith("data:image") 
                ? `data:image/png;base64,${batch.qrCodeImage}` 
                : batch.qrCodeImage;

            for (let i = 0; i < qty; i++) {
                if (row >= rows) {
                    doc.addPage();
                    row = 0;
                    col = 0;
                }

                const x = startX + (col * colWidth);
                const y = startY + (row * rowHeight);

                // Border
                doc.setDrawColor(200);
                doc.setLineWidth(0.1);
                doc.rect(x, y, colWidth - 2, rowHeight - 2);

                // Content
                doc.setFontSize(9);
                doc.setFont("helvetica", "bold");
                const title = doc.splitTextToSize(batch.bookName || "", colWidth - 5);
                doc.text(title[0], x + (colWidth / 2), y + 5, { align: 'center' });

                if (qrImgData) {
                    try {
                        doc.addImage(qrImgData, 'PNG', x + 2, y + 7, 19, 19);
                    } catch (imgErr) {
                        // If image fails, just skip image
                    }
                }

                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                const authorX = x + 23; 
                const authorY = y + 15;
                doc.text("Auth:", authorX, authorY);
                doc.setFont("helvetica", "bold");
                const authorText = doc.splitTextToSize(batch.authorName || "", colWidth - 26);
                doc.text(authorText[0], authorX, authorY + 4);

                doc.setFontSize(7);
                doc.setFont("helvetica", "italic");
                const pubY = y + 28; 
                doc.text((batch.publisherName || "").substring(0, 35), x + (colWidth / 2), pubY, { align: 'center' });

                doc.setFontSize(8);
                doc.setFont("helvetica", "bold");
                doc.text(batch.qrCodeNo || "", x + (colWidth / 2), pubY + 4, { align: 'center' });

                totalStickers++;
                col++;
                if (col >= cols) {
                    col = 0;
                    row++;
                }
            }
        }

        doc.save(`Overall_Library_Stickers_${currentAcademicYear}.pdf`);
        toast.success(`Generated Overall PDF with ${totalStickers} stickers!`);

    } catch (err) {
        console.error("Bulk Print Error:", err);
        toast.error("Failed to generate overall stickers.");
    } finally {
        setIsPrintingAll(false);
    }
  };

  const handlePrintLast = async () => {
      if(!lastSavedQR) return;
      handlePrintFromTable({ qrCodeNo: lastSavedQR });
  };

  const handlePrintFromTable = async (row) => {
      try {
        const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
        const baseUrl = ENDPOINTS.qrcode.generate.substring(0, ENDPOINTS.qrcode.generate.lastIndexOf('/'));
        const response = await axios.get(`${baseUrl}/stock/by-qr`, {
            params: { qrCodeNo: row.qrCodeNo, schoolId },
            headers
        });
        
        if (response.data) {
            generatePDF(response.data);
        }
      } catch (e) {
          toast.error("Could not fetch data for printing");
      }
  };

  return (
    <MainContentPage>
      <Container fluid className="p-4">
        {/* HEADER */}
        <div className="header-section shadow-lg mb-4">
          <h3 className="page-title"><FaQrcode className="icon me-2" />New Book Entry & QR</h3>
          <div className="header-actions">
             {lastSavedQR && (
                <Button variant="warning" onClick={handlePrintLast} className="shadow-sm animate__animated animate__pulse">
                    <FaPrint className="me-2" /> Print Last Saved ({lastSavedQR})
                </Button>
             )}
             <div className="academic-year ms-3 bg-light px-3 py-1 rounded border">
               <FaCalendarAlt className="me-2 text-primary" />
               <strong>{currentAcademicYear}</strong>
             </div>
          </div>
        </div>

        <Row>
          {/* LEFT: FORM */}
          <Col lg={12}>
            <Card className="form-card mb-4">
              <Card.Header className="bg-primary text-white py-3">
                <h5 className="form-title mb-0"><FaPlus className="me-2" />Add New Book</h5>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  {/* QR Display */}
                  <div className="qr-display-section shadow-sm mb-4">
                    <div className="qr-info">
                      <Form.Label className="qr-label"><FaQrcode className="me-2" />QR Code Number</Form.Label>
                      <div className="d-flex gap-2 align-items-center">
                        <Form.Control type="text" value={formData.qrCodeNo} readOnly className="qr-input shadow-sm" />
                        <Button variant="outline-primary" onClick={generateNextQRCode} disabled={isGeneratingQR}>{isGeneratingQR ? <Spinner size="sm" /> : '⟳'}</Button>
                      </div>
                    </div>
                    <div className="qr-image-container">
                      {qrImage ? <img src={qrImage} alt="QR" className="qr-preview shadow" /> : <div className="text-muted"><FaQrcode size={30}/></div>}
                    </div>
                  </div>

                  {/* Fields */}
                  <Row className="mb-3">
                    <Col md={6}>
                        <Form.Group className="mb-3"><Form.Label>Book Code *</Form.Label>
                        {/* PREVIEW: Shows Code and Name in dropdown options */}
                        <SearchableDropdown 
                            value={formData.bookCode} 
                            placeholder="Search Code" 
                            options={booksList.map(b => ({ 
                                label: b.bookId || b.bookCode, 
                                secondaryLabel: b.bookTitle || b.bookName, 
                                ...b 
                            }))} 
                            onChange={val => setFormData(p => ({...p, bookCode: val}))} 
                            onSelect={handleBookSelect} 
                        />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3"><Form.Label>Book Name *</Form.Label>
                        <SearchableDropdown 
                            value={formData.bookName} 
                            placeholder="Search Name" 
                            options={booksList.map(b => ({ 
                                label: b.bookTitle || b.bookName, 
                                secondaryLabel: b.bookId || b.bookCode, 
                                ...b 
                            }))} 
                            onChange={val => setFormData(p => ({...p, bookName: val}))} 
                            onSelect={handleBookSelect} 
                        />
                        </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col md={4}><Form.Group><Form.Label>MRP (₹)</Form.Label><Form.Control type="number" name="mrpRate" value={formData.mrpRate} onChange={handleInputChange} /></Form.Group></Col>
                    <Col md={4}><Form.Group><Form.Label>Purchase Rate (₹) *</Form.Label><Form.Control type="number" name="purchaseRate" value={formData.purchaseRate} onChange={handleInputChange} required /></Form.Group></Col>
                    <Col md={4}><Form.Group><Form.Label>Selling Rate (₹)</Form.Label><Form.Control type="number" name="sellingRate" value={formData.sellingRate} onChange={handleInputChange} /></Form.Group></Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}><Form.Group><Form.Label>Department *</Form.Label><Form.Control type="text" name="departmentName" value={formData.departmentName} onChange={handleInputChange} required /></Form.Group></Col>
                    <Col md={6}><Form.Group><Form.Label>Quantity *</Form.Label><Form.Control type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} required /></Form.Group></Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}><Form.Group><Form.Label>Publisher</Form.Label><Form.Control type="text" name="publisherName" value={formData.publisherName} onChange={handleInputChange} /></Form.Group></Col>
                    <Col md={6}><Form.Group><Form.Label>Author</Form.Label><Form.Control type="text" name="authorName" value={formData.authorName} onChange={handleInputChange} /></Form.Group></Col>
                  </Row>

                  <Row className="mb-4">
                    <Col md={6}><Form.Group><Form.Label>Language</Form.Label><Form.Control type="text" name="language" value={formData.language} onChange={handleInputChange} /></Form.Group></Col>
                    <Col md={6}>
                        <Form.Group className="mb-3"><Form.Label><FaTruck className="me-2"/>Supplier *</Form.Label>
                        <SearchableDropdown value={formData.supplierName} placeholder="Select Supplier" options={suppliersList.map(s => ({ label: s.supplierName, ...s }))} onChange={val => setFormData(p => ({...p, supplierName: val}))} onSelect={handleSupplierSelect} /></Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-4"><Form.Label>Remarks</Form.Label><Form.Control as="textarea" rows={3} name="remarks" value={formData.remarks} onChange={handleInputChange} /></Form.Group>

                  <div className="form-actions">
                    <Button variant="outline-secondary" onClick={resetForm} disabled={isSaving}><FaEraser className="me-2" />Clear</Button>
                    <Button variant="success" type="submit" disabled={isSaving}>{isSaving ? <Spinner size="sm" /> : <><FaSave className="me-2" />Save & Generate</>}</Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* BOTTOM: EXISTING BOOKS TABLE */}
        <Row>
          <Col lg={12}>
            <Card className="shadow-sm">
                <Card.Header className="bg-white py-3 border-bottom">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <h5 className="mb-0 text-primary me-3"><FaList className="me-2"/>Existing Library Batches</h5>
                            <Badge bg="primary">{existingStocks.length} Batches</Badge>
                        </div>
                        {/* NEW OVERALL PRINT BUTTON */}
                        <Button 
                            variant="dark" 
                            onClick={handlePrintOverall} 
                            disabled={isPrintingAll || existingStocks.length === 0}
                            className="shadow-sm"
                        >
                            {isPrintingAll ? <Spinner size="sm" className="me-2"/> : <FaLayerGroup className="me-2"/>}
                            {isPrintingAll ? "Generating All..." : "Print Overall Stickers"}
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body className="p-0">
                    <div className="table-responsive" style={{ maxHeight: '400px' }}>
                        <Table hover striped className="mb-0 align-middle">
                            <thead className="bg-light sticky-top">
                                <tr>
                                    <th>QR Code</th>
                                    <th>Book Name</th>
                                    <th>Author</th>
                                    <th>Publisher</th>
                                    <th className="text-center">Qty</th>
                                    <th>Supplier</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {existingStocks.length > 0 ? (
                                    existingStocks.map((stock, index) => (
                                        <tr key={index}>
                                            <td className="fw-bold text-primary font-monospace">{stock.qrCodeNo}</td>
                                            <td>
                                                <div className="fw-bold">{stock.bookName}</div>
                                                <small className="text-muted">{stock.bookCode}</small>
                                            </td>
                                            <td>{stock.authorName}</td>
                                            <td>{stock.publisherName}</td>
                                            <td className="text-center"><Badge bg="info" pill>{stock.quantity}</Badge></td>
                                            <td>{stock.supplierName}</td>
                                            <td className="text-center">
                                                <Button 
                                                    variant="outline-dark" 
                                                    size="sm" 
                                                    title="Print Stickers"
                                                    onClick={() => handlePrintFromTable(stock)}
                                                >
                                                    <FaPrint /> Print
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4 text-muted">
                                            No library books found. Add one above!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
          </Col>
        </Row>

      </Container>
      <ToastContainer position="top-right" autoClose={5000} theme="colored" />
    </MainContentPage>
  );
};

export default QRCodeSetup_New;