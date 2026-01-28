"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuthContext } from "../../../Context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ENDPOINTS } from "../../../SpringBoot/config";
import MainContentPage from "../../../components/MainContent/MainContentPage";
import { Container, Form, Button, Row, Col, Card, Spinner, ListGroup, InputGroup, Badge } from "react-bootstrap";
import { 
  FaQrcode, FaBook, FaSave, FaEraser, FaPlus, FaSearch, 
  FaSync, FaTruck, FaDatabase, FaCopy
} from "react-icons/fa";
import QRCode from "qrcode";
import axios from "axios";
import './QRCodeStickers.css';

// --- REUSABLE DROPDOWN ---
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
                    type="text" value={value} 
                    onChange={(e) => { onChange(e.target.value); if (!show) setShow(true); }}
                    onFocus={() => setShow(true)} placeholder={placeholder} 
                    disabled={disabled || isLoading} autoComplete="off" className="bg-white" 
                />
                {isLoading && <InputGroup.Text><Spinner size="sm" /></InputGroup.Text>}
            </InputGroup>
            {show && filteredOptions.length > 0 && !disabled && (
                <ListGroup className="position-absolute w-100 shadow-lg" style={{ zIndex: 9999, maxHeight: "300px", overflowY: "auto", borderRadius: "8px", marginTop: "2px" }}>
                    {filteredOptions.map((opt, idx) => (
                        <ListGroup.Item key={idx} action onClick={() => { onSelect(opt); setShow(false); }} className="py-2 px-3 border-bottom">
                            <div className="fw-bold text-primary">{opt.label}</div>
                            {opt.secondaryLabel && <small className="text-muted d-block mt-1">{opt.secondaryLabel}</small>}
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}
        </div>
    );
};

const QRCodeSetup_Exist = () => {
  const { schoolId, currentAcademicYear } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Data State
  const [existingStocks, setExistingStocks] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  
  const [formData, setFormData] = useState({
    qrCodeNo: "", bookCode: "", bookName: "", mrpRate: "", purchaseRate: "", sellingRate: "",
    departmentName: "", quantity: "", publisherName: "", authorName: "", language: "", supplierName: "", remarks: ""
  });
  
  const [qrImage, setQrImage] = useState(null);
  const [isGeneratingNewIDs, setIsGeneratingNewIDs] = useState(false);

  // Initial Load
  useEffect(() => {
    if (schoolId && currentAcademicYear) {
      loadInitialData();
    }
  }, [schoolId, currentAcademicYear]);

  // QR Image Update
  useEffect(() => {
    if (formData.qrCodeNo) generateQRImage(formData.qrCodeNo);
  }, [formData.qrCodeNo]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
      const params = { schoolId, academicYear: currentAcademicYear };
      
      // 1. Fetch Existing Books for Search
      const stockRes = await axios.get(ENDPOINTS.qrcode.existingBooks, { params, headers });
      setExistingStocks(Array.isArray(stockRes.data) ? stockRes.data : []);

      // 2. Fetch Suppliers
      const supRes = await axios.get(`${ENDPOINTS.library}/booksuppliers`, { 
        params: { schoolId, year: currentAcademicYear }, headers 
      });
      setSuppliersList(Array.isArray(supRes.data) ? supRes.data : []);

    } catch (error) {
      console.error("Data Load Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewIDs = async () => {
    if (!schoolId) return;
    setIsGeneratingNewIDs(true);
    try {
      const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
      const params = { schoolId, academicYear: currentAcademicYear, _t: new Date().getTime() };
      
      // Generate BOTH New QR and New Book Code
      const [qrRes, bkRes] = await Promise.all([
        axios.get(ENDPOINTS.qrcode.generate, { params, headers }),
        axios.get(ENDPOINTS.qrcode.generateBookCode, { params: { schoolId }, headers })
      ]);

      setFormData(prev => ({
        ...prev,
        qrCodeNo: qrRes.data.qrCodeNo,
        bookCode: bkRes.data.bookCode
      }));
      
    } catch (error) {
      toast.error("Failed to generate new IDs");
    } finally {
      setIsGeneratingNewIDs(false);
    }
  };

  const generateQRImage = async (text) => {
    try {
      const url = await QRCode.toDataURL(text, { width: 300, margin: 1 });
      setQrImage(url);
    } catch (err) {
      setQrImage(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`);
    }
  };

  // --- HANDLER: Select Existing Book as Template ---
  const handleExistingBookSelect = async (book) => {
    // 1. Load Data
    setFormData({
      ...formData,
      bookName: book.bookName,
      mrpRate: book.mrpRate,
      purchaseRate: book.purchaseRate,
      sellingRate: book.sellingRate,
      departmentName: book.departmentName,
      publisherName: book.publisherName,
      authorName: book.authorName,
      language: book.language,
      supplierName: book.supplierName,
      remarks: book.remarks,
      quantity: book.quantity // or reset to 1 if preferred
    });
    
    toast.info("Data Loaded. Generating NEW IDs...");

    // 2. Generate New IDs (Book Code & QR)
    await generateNewIDs();
    toast.success("New QR and Book Code Generated!");
  };

  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSupplierSelect = (s) => setFormData(prev => ({ ...prev, supplierName: s.supplierName }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.qrCodeNo || !formData.bookCode || !formData.quantity) return toast.error("Required fields missing");

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
        schoolId, academicYear: currentAcademicYear
      };

      const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}`, 'Content-Type': 'application/json' };
      // Using /save/new because we are creating a fresh record with new IDs
      await axios.post(ENDPOINTS.qrcode.saveNew, payload, { headers });
      
      toast.success("Cloned & Saved Successfully!");
      
      // Reset partially to allow quick next entry? Or full reset.
      setFormData(prev => ({ ...prev, qrCodeNo: "", bookCode: "", quantity: "" }));
      setQrImage(null);
      loadInitialData(); // Refresh list
      
    } catch (error) {
      toast.error("Save Failed: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainContentPage>
      <Container fluid className="p-4">
        <div className="header-section shadow-lg mb-4">
          <h3 className="page-title"><FaCopy className="icon me-2" />QR Code Setup Exist</h3>
        </div>

        <Row>
          <Col lg={12}>
            <Card className="form-card">
              <Card.Header className="bg-warning text-dark py-3">
                <h5 className="form-title mb-0"><FaSearch className="me-2" />Select Template & Clone</h5>
              </Card.Header>
              <Card.Body>
                
                {/* SEARCH SECTION */}
                <Row className="mb-4">
                    <Col md={12}>
                        <Form.Label className="fw-bold text-primary">Search Existing Book</Form.Label>
                        <SearchableDropdown 
                            value={""} // Always clear after selection? Or keep?
                            placeholder="Type Book Name or QR Code..."
                            options={existingStocks.map(b => ({ 
                                label: `${b.bookName} (${b.qrCodeNo})`, 
                                secondaryLabel: `Auth: ${b.authorName} | Pub: ${b.publisherName}`,
                                ...b 
                            }))}
                            onChange={() => {}} // Controlled by component state
                            onSelect={handleExistingBookSelect}
                            isLoading={isLoading}
                        />
                        <Form.Text className="text-muted">
                            Selecting a book will copy its details but generate a <strong>NEW QR Code</strong> and <strong>NEW Book Code</strong>.
                        </Form.Text>
                    </Col>
                </Row>
                
                <hr />

                <Form onSubmit={handleSubmit}>
                  {/* QR Display */}
                  <div className="qr-display-section shadow-sm mb-4">
                    <div className="qr-info">
                      <Form.Label className="qr-label"><FaQrcode className="me-2" />NEW QR Code</Form.Label>
                      <div className="d-flex gap-2 align-items-center">
                        <Form.Control type="text" value={formData.qrCodeNo} readOnly className="qr-input shadow-sm" />
                        <Button variant="outline-primary" onClick={generateNewIDs} disabled={isGeneratingNewIDs}>
                            {isGeneratingNewIDs ? <Spinner size="sm" /> : <FaSync />}
                        </Button>
                      </div>
                    </div>
                    <div className="qr-image-container">
                      {qrImage ? <img src={qrImage} alt="QR" className="qr-preview shadow" /> : <div className="text-muted"><FaQrcode size={30}/></div>}
                    </div>
                  </div>

                  {/* EDITABLE FIELDS */}
                  <Row className="mb-3">
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>NEW Book Code (Auto-Generated)</Form.Label>
                            <Form.Control 
                                type="text" name="bookCode" 
                                value={formData.bookCode} onChange={handleInputChange} 
                                className="fw-bold bg-light"
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>Book Name</Form.Label>
                            <Form.Control type="text" name="bookName" value={formData.bookName} onChange={handleInputChange} />
                        </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col md={4}><Form.Group><Form.Label>MRP (₹)</Form.Label><Form.Control type="number" name="mrpRate" value={formData.mrpRate} onChange={handleInputChange} /></Form.Group></Col>
                    <Col md={4}><Form.Group><Form.Label>Purchase Rate (₹)</Form.Label><Form.Control type="number" name="purchaseRate" value={formData.purchaseRate} onChange={handleInputChange} /></Form.Group></Col>
                    <Col md={4}><Form.Group><Form.Label>Selling Rate (₹)</Form.Label><Form.Control type="number" name="sellingRate" value={formData.sellingRate} onChange={handleInputChange} /></Form.Group></Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}><Form.Group><Form.Label>Department</Form.Label><Form.Control type="text" name="departmentName" value={formData.departmentName} onChange={handleInputChange} /></Form.Group></Col>
                    <Col md={6}><Form.Group><Form.Label>Quantity</Form.Label><Form.Control type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} /></Form.Group></Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}><Form.Group><Form.Label>Publisher</Form.Label><Form.Control type="text" name="publisherName" value={formData.publisherName} onChange={handleInputChange} /></Form.Group></Col>
                    <Col md={6}><Form.Group><Form.Label>Author</Form.Label><Form.Control type="text" name="authorName" value={formData.authorName} onChange={handleInputChange} /></Form.Group></Col>
                  </Row>

                  <Row className="mb-4">
                    <Col md={6}><Form.Group><Form.Label>Language</Form.Label><Form.Control type="text" name="language" value={formData.language} onChange={handleInputChange} /></Form.Group></Col>
                    <Col md={6}>
                        <Form.Group className="mb-3"><Form.Label><FaTruck className="me-2"/>Supplier</Form.Label>
                        <SearchableDropdown value={formData.supplierName} placeholder="Select Supplier" options={suppliersList.map(s => ({ label: s.supplierName, ...s }))} onChange={val => setFormData(p => ({...p, supplierName: val}))} onSelect={handleSupplierSelect} /></Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-4"><Form.Label>Remarks</Form.Label><Form.Control as="textarea" rows={3} name="remarks" value={formData.remarks} onChange={handleInputChange} /></Form.Group>

                  <div className="form-actions">
                    <Button variant="outline-secondary" onClick={() => window.location.reload()}><FaEraser className="me-2" />Reset</Button>
                    <Button variant="success" type="submit" disabled={isSaving}>{isSaving ? <Spinner size="sm" /> : <><FaSave className="me-2" />Save New Record</>}</Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <ToastContainer position="top-right" autoClose={5000} theme="colored" />
    </MainContentPage>
  );
};

export default QRCodeSetup_Exist;