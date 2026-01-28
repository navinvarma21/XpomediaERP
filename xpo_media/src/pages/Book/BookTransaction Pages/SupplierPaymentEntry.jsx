"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import MainContentPage from "../../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container, Card, InputGroup } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaSave, FaChevronDown } from "react-icons/fa";
import { useAuthContext } from "../../../Context/AuthContext";
import { ENDPOINTS } from "../../../SpringBoot/config";
import axios from "axios";

const SearchableSelect = ({ options, value, onChange, placeholder, valueKey, labelKey }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value || "");
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const inputRef = useRef(null);

    useEffect(() => { setSearchTerm(value || ""); }, [value]);

    const toggleDropdown = () => {
        if (!isOpen && inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
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

    const filteredOptions = options.filter(opt => String(opt[labelKey] || "").toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <>
            <div ref={inputRef} style={{ position: 'relative' }}>
                <InputGroup onClick={toggleDropdown}>
                    <Form.Control type="text" placeholder={placeholder} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }} autoComplete="off" style={{ backgroundColor: 'white', cursor: 'text' }} />
                    <InputGroup.Text style={{ backgroundColor: 'white', cursor: 'pointer' }}><FaChevronDown size={10} className="text-muted"/></InputGroup.Text>
                </InputGroup>
            </div>
            {isOpen && ReactDOM.createPortal(
                <div id="dropdown-portal-root" className="shadow-sm border rounded" style={{ position: "absolute", top: coords.top, left: coords.left, width: coords.width, maxHeight: "200px", overflowY: "auto", backgroundColor: "white", zIndex: 99999 }}>
                    {filteredOptions.length > 0 ? (filteredOptions.map((opt, idx) => (
                        <div key={idx} className="p-2 border-bottom" style={{ cursor: "pointer", fontSize: "0.9rem" }} onMouseEnter={(e) => e.target.style.backgroundColor = "#f8f9fa"} onMouseLeave={(e) => e.target.style.backgroundColor = "white"} onClick={() => handleSelect(opt)}>{opt[labelKey]}</div>
                    ))) : (<div className="p-2 text-muted small text-center">No results</div>)}
                </div>, document.body
            )}
        </>
    );
};

const SupplierPaymentEntry = () => {
  const { user, currentAcademicYear } = useAuthContext();

  const [entryNo, setEntryNo] = useState("Loading...");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [supplierList, setSupplierList] = useState([]);
  const [invoiceList, setInvoiceList] = useState([]); 

  const [formData, setFormData] = useState({
    supplierCode: "",
    supplierName: "",
    invoiceNo: "",
    purchaseNarrative: "", 
    paidNarrative: "",     
    paymentMode: "Cash",
    originalGross: 0,
    balanceAmount: 0, 
    
    settlementAmount: 0, 
    discountPercent: 0,
    discountAmount: 0,
    netCashPaid: 0
  });

  useEffect(() => {
    if (user && currentAcademicYear) fetchInitialData();
  }, [user, currentAcademicYear]);

  const fetchInitialData = async () => {
    try {
        const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
        const entryRes = await axios.get(`${ENDPOINTS.store}/supplier-payment/next-entry`, { params: { schoolId: user.uid }, headers });
        setEntryNo(entryRes.data.entryNo);

        const supRes = await axios.get(`${ENDPOINTS.store}/supplier-payment/pending-suppliers`, { params: { schoolId: user.uid }, headers });
        setSupplierList(supRes.data || []);
    } catch (err) { console.error("Fetch Error:", err); }
  };

  const handleSupplierSelect = async (val, type) => {
      let found;
      if (type === 'code') found = supplierList.find(s => s.supplier_code === val);
      else found = supplierList.find(s => s.supplier_name === val);

      if (found) {
          setFormData(prev => ({ ...prev, supplierCode: found.supplier_code, supplierName: found.supplier_name, invoiceNo: "", purchaseNarrative: "", paidNarrative: "", balanceAmount: 0, settlementAmount: 0, discountPercent: 0, discountAmount: 0, netCashPaid: 0 }));
          try {
            const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
            const res = await axios.get(`${ENDPOINTS.store}/supplier-payment/pending-invoices`, { 
                params: { schoolId: user.uid, supplierCode: found.supplier_code }, headers 
            });
            setInvoiceList(res.data || []);
          } catch (err) { console.error(err); }
      }
  };

  const handleInvoiceChange = (e) => {
      const invNo = e.target.value;
      const foundInv = invoiceList.find(i => i.invoice_number === invNo);
      
      if (foundInv) {
          setFormData(prev => ({
              ...prev,
              invoiceNo: invNo,
              purchaseNarrative: foundInv.narrative || "Purchase Entry",
              paidNarrative: `Paid for Inv: ${invNo}`, 
              balanceAmount: foundInv.balance_amount,
              originalGross: foundInv.original_gross,
              settlementAmount: foundInv.balance_amount, 
              discountPercent: 0,
              discountAmount: 0,
              netCashPaid: foundInv.balance_amount
          }));
      } else {
          setFormData(prev => ({ ...prev, invoiceNo: "", purchaseNarrative: "", paidNarrative: "", balanceAmount: 0, settlementAmount: 0, netCashPaid: 0 }));
      }
  };

  const handleAmountChange = (field, value) => {
      let newVal = Number(value) || 0;
      let newSettlement = field === 'settlementAmount' ? newVal : formData.settlementAmount;
      let newDiscPercent = field === 'discountPercent' ? newVal : formData.discountPercent;

      const discAmt = (newSettlement * newDiscPercent) / 100;
      const cashOut = newSettlement - discAmt;

      setFormData(prev => ({
          ...prev,
          [field]: value,
          settlementAmount: newSettlement,
          discountPercent: newDiscPercent,
          discountAmount: discAmt,
          netCashPaid: cashOut
      }));
  };

  const handleSave = async () => {
      if (!formData.supplierName) return toast.warning("Select Supplier");
      if (!formData.invoiceNo) return toast.warning("Select Invoice");
      
      if (Number(formData.settlementAmount) <= 0) return toast.warning("Enter Amount to Clear");
      if (Number(formData.settlementAmount) > Number(formData.balanceAmount)) return toast.error(`Amount exceeds Pending Balance: ${formData.balanceAmount}`);

      const payload = {
          entryNo,
          paymentDate,
          supplierCode: formData.supplierCode,
          supplierName: formData.supplierName,
          invoiceNo: formData.invoiceNo,
          originalGrossAmount: Number(formData.originalGross), // Ensure number
          
          settlementAmount: Number(formData.settlementAmount),
          discountPercent: Number(formData.discountPercent),
          discountAmount: Number(formData.discountAmount),
          netCashPaid: Number(formData.netCashPaid),
          
          paymentMode: formData.paymentMode,
          purchaseNarrative: formData.purchaseNarrative,
          paidNarrative: formData.paidNarrative
      };

      try {
          const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
          const res = await axios.post(`${ENDPOINTS.store}/supplier-payment/save`, payload, {
              params: { schoolId: user.uid, year: currentAcademicYear }, headers
          });

          toast.success("Payment Saved!");
          
          setFormData({ supplierCode: "", supplierName: "", invoiceNo: "", purchaseNarrative: "", paidNarrative: "", paymentMode: "Cash", balanceAmount: 0, settlementAmount: 0, discountPercent: 0, discountAmount: 0, netCashPaid: 0, originalGross: 0 });
          setInvoiceList([]);
          fetchInitialData(); 
      } catch (err) {
          console.error("Save Error", err);
          toast.error("Failed to save payment");
      }
  };

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <ToastContainer />
        <div className="form-card mt-3">
          <div className="header p-3 text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: "#0B3D7B" }}>
            <h4 className="m-0 fw-bold">Supplier Payment Entry</h4>
          </div>

          <div className="p-4">
            <Row className="mb-3">
                <Col md={3}><Form.Group><Form.Label className="fw-bold small">Entry No (Auto)</Form.Label><Form.Control type="text" value={entryNo} readOnly className="fw-bold text-danger bg-light" /></Form.Group></Col>
                <Col md={3}><Form.Group><Form.Label className="fw-bold small">Payment Date</Form.Label><Form.Control type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} /></Form.Group></Col>
            </Row>

            <hr/>

            <Row className="mb-3">
                <Col md={4}><Form.Group><Form.Label className="fw-bold small">Supplier Code</Form.Label><SearchableSelect options={supplierList} value={formData.supplierCode} onChange={(v) => handleSupplierSelect(v, 'code')} placeholder="Select Code" valueKey="supplier_code" labelKey="supplier_code" /></Form.Group></Col>
                <Col md={4}><Form.Group><Form.Label className="fw-bold small">Supplier Name</Form.Label><SearchableSelect options={supplierList} value={formData.supplierName} onChange={(v) => handleSupplierSelect(v, 'name')} placeholder="Select Name" valueKey="supplier_name" labelKey="supplier_name" /></Form.Group></Col>
                <Col md={4}><Form.Group><Form.Label className="fw-bold small">Invoice Number</Form.Label><Form.Select value={formData.invoiceNo} onChange={handleInvoiceChange}><option value="">-- Select Invoice --</option>{invoiceList.map((inv, idx) => (<option key={idx} value={inv.invoice_number}>{inv.invoice_number} (Bal: {inv.balance_amount})</option>))}</Form.Select></Form.Group></Col>
            </Row>

            <div className="p-3 mb-3 bg-light rounded border">
                <h6 className="text-primary fw-bold mb-2">Invoice Details</h6>
                <Row>
                    <Col md={6}><Form.Group><Form.Label className="small text-muted">Purchase Narrative (Read Only)</Form.Label><Form.Control as="textarea" rows={1} value={formData.purchaseNarrative} readOnly className="bg-white border-0" /></Form.Group></Col>
                    <Col md={3}><Form.Group><Form.Label className="small text-muted">Original Bill Amt</Form.Label><Form.Control type="text" value={formData.originalGross} readOnly className="bg-white border-0 fw-bold" /></Form.Group></Col>
                    <Col md={3}><Form.Group><Form.Label className="small text-danger fw-bold">Pending Balance</Form.Label><Form.Control type="text" value={formData.balanceAmount} readOnly className="bg-white border-danger text-danger fw-bold fs-5" /></Form.Group></Col>
                </Row>
            </div>

            <Card className="p-3 border-secondary shadow-sm">
                <h6 className="fw-bold mb-3">Payment Calculations</h6>
                <Row className="mb-3">
                    <Col md={6}>
                        <Form.Group><Form.Label className="small fw-bold">Paid Narrative / Remarks</Form.Label><Form.Control type="text" value={formData.paidNarrative} onChange={e => setFormData({...formData, paidNarrative: e.target.value})} placeholder="Enter payment details" /></Form.Group>
                    </Col>
                    <Col md={2}><Form.Group><Form.Label className="small fw-bold">Payment Mode</Form.Label><Form.Select value={formData.paymentMode} onChange={e => setFormData({...formData, paymentMode: e.target.value})}><option>Cash</option><option>Cheque</option><option>Online</option></Form.Select></Form.Group></Col>
                </Row>
                <Row className="align-items-end">
                    <Col md={3}><Form.Group><Form.Label className="small fw-bold">Bill Amount to Clear</Form.Label><Form.Control type="number" value={formData.settlementAmount} onChange={e => handleAmountChange('settlementAmount', e.target.value)} className="border-primary" /></Form.Group></Col>
                    <Col md={2}><Form.Group><Form.Label className="small fw-bold">Discount %</Form.Label><Form.Control type="number" value={formData.discountPercent} onChange={e => handleAmountChange('discountPercent', e.target.value)} /></Form.Group></Col>
                    <Col md={2}><Form.Group><Form.Label className="small text-muted">Discount Amt</Form.Label><Form.Control type="text" value={formData.discountAmount.toFixed(2)} readOnly className="bg-light" /></Form.Group></Col>
                    <Col md={3}><Form.Group><Form.Label className="small fw-bold text-success">Net Cash to Pay</Form.Label><Form.Control type="text" value={formData.netCashPaid.toFixed(2)} readOnly className="bg-success text-white fw-bold fs-5" /></Form.Group></Col>
                    <Col md={2}><Button variant="success" className="w-100 fw-bold" onClick={handleSave}><FaSave className="me-2"/> CONFIRM</Button></Col>
                </Row>
            </Card>

          </div>
        </div>
      </Container>
      <style>{` .form-card { background: #fff; border: 1px solid #dee2e6; border-radius: 0.25rem; } `}</style>
    </MainContentPage>
  );
};

export default SupplierPaymentEntry;