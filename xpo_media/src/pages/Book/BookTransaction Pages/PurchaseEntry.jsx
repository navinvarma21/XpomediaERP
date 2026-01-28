"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import MainContentPage from "../../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container, Card, InputGroup } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaSave, FaChevronDown, FaEraser } from "react-icons/fa";
import { useAuthContext } from "../../../Context/AuthContext";
import { ENDPOINTS } from "../../../SpringBoot/config";
import axios from "axios";

// --- CUSTOM PORTAL DROPDOWN ---
const SearchableSelect = ({ options, value, onChange, placeholder, valueKey, labelKey }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value || "");
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const inputRef = useRef(null);

    useEffect(() => { setSearchTerm(value || ""); }, [value]);

    const toggleDropdown = () => {
        if (!isOpen && inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (inputRef.current && !inputRef.current.contains(e.target)) {
                const portal = document.getElementById("dropdown-portal-root");
                if (portal && !portal.contains(e.target)) {
                    setIsOpen(false);
                    if (value !== searchTerm) setSearchTerm(value || "");
                }
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, value, searchTerm]);

    const handleSelect = (opt) => {
        onChange(opt[valueKey] || opt[labelKey]); 
        setSearchTerm(opt[labelKey]); 
        setIsOpen(false);
    };

    const filteredOptions = options.filter(opt => 
        String(opt[labelKey] || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <div ref={inputRef} style={{ position: 'relative' }}>
                <InputGroup onClick={toggleDropdown}>
                    <Form.Control
                        type="text"
                        placeholder={placeholder}
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }}
                        autoComplete="off"
                        style={{ backgroundColor: 'white', cursor: 'text' }}
                    />
                    <InputGroup.Text style={{ backgroundColor: 'white', cursor: 'pointer' }}>
                        <FaChevronDown size={10} className="text-muted"/>
                    </InputGroup.Text>
                </InputGroup>
            </div>
            {isOpen && ReactDOM.createPortal(
                <div 
                    id="dropdown-portal-root"
                    className="shadow-sm border rounded"
                    style={{
                        position: "absolute", top: coords.top, left: coords.left, width: coords.width,
                        maxHeight: "200px", overflowY: "auto", backgroundColor: "white", zIndex: 99999,
                    }}
                >
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt, idx) => (
                            <div 
                                key={idx} 
                                className="p-2 border-bottom"
                                style={{ cursor: "pointer", fontSize: "0.9rem" }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = "#f8f9fa"}
                                onMouseLeave={(e) => e.target.style.backgroundColor = "white"}
                                onClick={() => handleSelect(opt)}
                            >
                                {opt[labelKey]}
                            </div>
                        ))
                    ) : (
                        <div className="p-2 text-muted small text-center">No results</div>
                    )}
                </div>,
                document.body
            )}
        </>
    );
};

const PurchaseEntry = () => {
  const { user, currentAcademicYear } = useAuthContext();

  // --- State ---
  const [entryNo, setEntryNo] = useState("Loading...");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [supplierList, setSupplierList] = useState([]);
  const [formData, setFormData] = useState({
    supplierCode: "",
    supplierName: "",
    invoiceNo: "",
    purchaseAmount: 0,
    gstPercent: 0,
    discountPercent: 0,
    narrative: "",
    paymentMode: "Cash"
  });

  const [totals, setTotals] = useState({
    taxable: 0,
    gstAmount: 0,
    netAmount: 0
  });

  // --- Initial Load ---
  useEffect(() => {
    if (user && currentAcademicYear) {
        fetchInitialData();
    }
  }, [user, currentAcademicYear]);

  const fetchInitialData = async () => {
    try {
        const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
        // Get Entry No
        const entryRes = await axios.get(`${ENDPOINTS.store}/purchase-entry/next-entry`, { params: { schoolId: user.uid }, headers });
        setEntryNo(entryRes.data.entryNo);

        // Get Suppliers
        const supRes = await axios.get(`${ENDPOINTS.store}/suppliers`, { params: { schoolId: user.uid, year: currentAcademicYear }, headers });
        setSupplierList(supRes.data || []);
    } catch (err) {
        console.error("Fetch Error:", err);
    }
  };

  // --- Handlers ---
  const handleSupplierSelect = (val, type) => {
      let found;
      if (type === 'code') found = supplierList.find(s => s.supplierCode === val);
      else found = supplierList.find(s => s.supplierName === val);

      if (found) {
          setFormData(prev => ({
              ...prev,
              supplierCode: found.supplierCode,
              supplierName: found.supplierName
          }));
      } else {
          setFormData(prev => ({ ...prev, [type === 'code' ? 'supplierCode' : 'supplierName']: val }));
      }
  };

  const handleInputChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- Calculations ---
  useEffect(() => {
      const base = Number(formData.purchaseAmount) || 0;
      const discPercent = Number(formData.discountPercent) || 0;
      const gstPercent = Number(formData.gstPercent) || 0;

      // 1. Calculate Discount
      const discountAmt = (base * discPercent) / 100;
      const taxable = base - discountAmt;

      // 2. Calculate GST
      const gstAmt = (taxable * gstPercent) / 100;

      // 3. Net Total
      const net = taxable + gstAmt;

      setTotals({
          taxable: taxable,
          gstAmount: gstAmt,
          netAmount: net
      });
  }, [formData.purchaseAmount, formData.discountPercent, formData.gstPercent]);

  // --- Save ---
  const handleSave = async () => {
      if (!formData.supplierName) return toast.warning("Please select a Supplier");
      if (!formData.invoiceNo) return toast.warning("Invoice Number is required");

      const payload = {
          entryNo,
          purchaseDate,
          invoiceDate,
          supplierCode: formData.supplierCode,
          supplierName: formData.supplierName,
          invoiceNo: formData.invoiceNo,
          purchaseAmount: Number(formData.purchaseAmount),
          discountPercent: Number(formData.discountPercent),
          gstPercent: Number(formData.gstPercent),
          narrative: formData.narrative,
          paymentMode: formData.paymentMode
      };

      try {
          const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
          const res = await axios.post(`${ENDPOINTS.store}/purchase-entry/save`, payload, {
              params: { schoolId: user.uid, year: currentAcademicYear }, headers
          });

          toast.success(`Entry Saved: ${res.data.entryNo}`);
          resetForm();
          fetchInitialData();
      } catch (err) {
          console.error("Save Error", err);
          toast.error("Failed to save entry");
      }
  };

  const resetForm = () => {
      setFormData({
        supplierCode: "", supplierName: "", invoiceNo: "",
        purchaseAmount: 0, gstPercent: 0, discountPercent: 0,
        narrative: "", paymentMode: "Cash"
      });
  };

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <ToastContainer />
        <div className="form-card mt-3">
          <div className="header p-3 text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: "#0B3D7B" }}>
            <h4 className="m-0 fw-bold">Purchase Entry (Journal Entry)</h4>
          </div>

          <div className="p-4">
            {/* Row 1: Entry Details */}
            <Row className="mb-3">
                <Col md={3}>
                    <Form.Group>
                        <Form.Label className="fw-bold small">Entry No (Auto)</Form.Label>
                        <Form.Control type="text" value={entryNo} readOnly className="fw-bold text-danger bg-light" />
                    </Form.Group>
                </Col>
                <Col md={3}>
                    <Form.Group>
                        <Form.Label className="fw-bold small">Purchase Date</Form.Label>
                        <Form.Control type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
                    </Form.Group>
                </Col>
            </Row>

            <hr/>

            {/* Row 2: Supplier Selection */}
            <Row className="mb-3">
                <Col md={4}>
                    <Form.Group>
                        <Form.Label className="fw-bold small">Supplier Code</Form.Label>
                        <SearchableSelect 
                            options={supplierList} 
                            value={formData.supplierCode} 
                            onChange={(v) => handleSupplierSelect(v, 'code')} 
                            placeholder="Search Code" 
                            valueKey="supplierCode" 
                            labelKey="supplierCode" 
                        />
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <Form.Group>
                        <Form.Label className="fw-bold small">Supplier Name</Form.Label>
                        <SearchableSelect 
                            options={supplierList} 
                            value={formData.supplierName} 
                            onChange={(v) => handleSupplierSelect(v, 'name')} 
                            placeholder="Search Name" 
                            valueKey="supplierName" 
                            labelKey="supplierName" 
                        />
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <Form.Group>
                        <Form.Label className="fw-bold small">Supplier Address</Form.Label>
                        <Form.Control 
                            type="text" 
                            readOnly 
                            className="bg-light"
                            value={supplierList.find(s => s.supplierCode === formData.supplierCode)?.address || ''} 
                        />
                    </Form.Group>
                </Col>
            </Row>

            {/* Row 3: Invoice Details & Amounts */}
            <Row className="mb-4">
                <Col md={3}>
                    <Form.Group className="mb-2">
                        <Form.Label className="fw-bold small">Invoice No</Form.Label>
                        <Form.Control type="text" value={formData.invoiceNo} onChange={e => handleInputChange('invoiceNo', e.target.value)} />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label className="fw-bold small">Invoice Date</Form.Label>
                        <Form.Control type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                    </Form.Group>
                </Col>

                <Col md={9}>
                    <Card className="p-3 bg-light border-0">
                        <Row>
                            <Col md={3}>
                                <Form.Label className="small fw-bold">Purchase Amt</Form.Label>
                                <Form.Control type="number" value={formData.purchaseAmount} onChange={e => handleInputChange('purchaseAmount', e.target.value)} />
                            </Col>
                            <Col md={2}>
                                <Form.Label className="small fw-bold">Disc %</Form.Label>
                                <Form.Control type="number" value={formData.discountPercent} onChange={e => handleInputChange('discountPercent', e.target.value)} />
                            </Col>
                            <Col md={3}>
                                <Form.Label className="small fw-bold">Taxable (Others)</Form.Label>
                                <Form.Control type="text" readOnly className="bg-white fw-bold" value={totals.taxable.toFixed(2)} />
                            </Col>
                            <Col md={2}>
                                <Form.Label className="small fw-bold">GST %</Form.Label>
                                <Form.Control type="number" value={formData.gstPercent} onChange={e => handleInputChange('gstPercent', e.target.value)} />
                            </Col>
                            <Col md={2}>
                                <Form.Label className="small fw-bold text-success">Net Amount</Form.Label>
                                <Form.Control type="text" readOnly className="bg-success text-white fw-bold" value={totals.netAmount.toFixed(2)} />
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>

            {/* Row 4: Narrative & Payment */}
            <Row className="mb-3">
                <Col md={6}>
                    <Form.Group>
                        <Form.Label className="fw-bold small">Narrative</Form.Label>
                        <Form.Control as="textarea" rows={2} value={formData.narrative} onChange={e => handleInputChange('narrative', e.target.value)} />
                    </Form.Group>
                </Col>
                <Col md={3}>
                    <Form.Group>
                        <Form.Label className="fw-bold small">Payment Mode</Form.Label>
                        <Form.Select value={formData.paymentMode} onChange={e => handleInputChange('paymentMode', e.target.value)}>
                            <option>Cash</option>
                            <option>Credit</option>
                            <option>Bank Transfer</option>
                            <option>UPI</option>
                        </Form.Select>
                    </Form.Group>
                </Col>
                <Col md={3} className="d-flex align-items-end justify-content-end gap-2">
                    <Button variant="secondary" onClick={resetForm}><FaEraser /> Reset</Button>
                    <Button variant="primary" onClick={handleSave} style={{width: '120px'}}><FaSave /> Save</Button>
                </Col>
            </Row>

          </div>
        </div>
      </Container>
      <style>{`
        .form-card { background: #fff; border: 1px solid #dee2e6; border-radius: 0.25rem; }
      `}</style>
    </MainContentPage>
  );
};

export default PurchaseEntry;