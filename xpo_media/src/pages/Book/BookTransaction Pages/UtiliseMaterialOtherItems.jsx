"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom"; 
import MainContentPage from "../../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container, Table, Card, Modal, InputGroup, Alert, Spinner } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaTrash, FaSave, FaTimes, FaFilePdf, FaChevronDown, FaPrint, FaCopy, FaUniversity, FaCreditCard } from "react-icons/fa";
import { useAuthContext } from "../../../Context/AuthContext";
import { ENDPOINTS } from "../../../SpringBoot/config";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

const UtiliseMaterialOtherItems = () => {
  const { user, currentAcademicYear } = useAuthContext();

  const [billNo, setBillNo] = useState("Loading...");
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerList, setCustomerList] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);
  
  const [customerDetails, setCustomerDetails] = useState({ id: "", code: "", name: "", address: "", phone: "" });
  const [availableItems, setAvailableItems] = useState([]); 
  const [rows, setRows] = useState([{ id: 1, itemCode: "", itemName: "", stock: 0, rate: 0, quantity: 1, gst: 0, total: 0 }]);
  const [totals, setTotals] = useState({ gross: 0, discountPercent: 0, discountAmount: 0, net: 0, paymentMode: "Cash" });
  const [selectedBankAccount, setSelectedBankAccount] = useState("");
  const [transactionRefNo, setTransactionRefNo] = useState("");

  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Refs for row navigation
  const rowRefs = useRef([]);

  useEffect(() => {
    if (user && currentAcademicYear) {
      fetchInitialData();
      fetchBankAccounts();
    }
  }, [user, currentAcademicYear]);

  const fetchInitialData = async () => {
    try {
      const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
      const billRes = await axios.get(`${ENDPOINTS.store}/utilise/next-bill`, { params: { schoolId: user.uid }, headers });
      setBillNo(billRes.data.billNo);
      const custRes = await axios.get(`${ENDPOINTS.store}/customerstaff`, { params: { schoolId: user.uid, academicYear: currentAcademicYear }, headers });
      setCustomerList(custRes.data || []);
      const itemRes = await axios.get(`${ENDPOINTS.store}/utilise/items-stock`, { params: { schoolId: user.uid }, headers });
      setAvailableItems(itemRes.data || []);
    } catch (err) { 
      console.error("Fetch Error:", err); 
      toast.error("Failed to load initial data");
    }
  };

  const fetchBankAccounts = async () => {
    setLoadingBankAccounts(true);
    try {
      const res = await axios.get(`${ENDPOINTS.store}/bank-accounts`, {
        params: { schoolId: user.uid }
      });
      setBankAccounts(res.data || []);
    } catch (err) {
      console.error("Error fetching bank accounts:", err);
      toast.error("Failed to load bank accounts");
    } finally {
      setLoadingBankAccounts(false);
    }
  };

  const handleCustomerSelect = (val, type) => {
      let found;
      if (type === 'code') found = customerList.find(c => c.customerStaffCode === val);
      else found = customerList.find(c => c.customerStaffName === val);

      if (found) {
          setCustomerDetails({
              id: found.id,
              code: found.customerStaffCode,
              name: found.customerStaffName,
              address: `${found.numberStreetName || ''}, ${found.district || ''}`,
              phone: found.phoneNumber || ''
          });
      } else {
          setCustomerDetails(prev => ({ ...prev, id: "", address: "", phone: "", [type]: val }));
      }
  };

  const handleRowChange = (index, field, value) => {
    const newRows = [...rows];
    
    if (field === "itemName") {
        const itemData = availableItems.find(i => i.name === value);
        if (itemData) {
            newRows[index] = {
                ...newRows[index],
                itemName: itemData.name,
                itemCode: itemData.code,
                stock: itemData.stock || 0,
                rate: itemData.sellPrice || 0,
                gst: itemData.gst || 0
            };
        } else {
            newRows[index].itemName = value;
        }
    } else {
        newRows[index][field] = value;
    }

    // Calculate total
    const qty = Math.max(0, parseFloat(newRows[index].quantity) || 0);
    const rate = Math.max(0, parseFloat(newRows[index].rate) || 0);
    const gstPercent = Math.max(0, parseFloat(newRows[index].gst) || 0);
    
    const baseTotal = qty * rate;
    const gstAmount = (baseTotal * gstPercent) / 100;
    newRows[index].total = parseFloat((baseTotal + gstAmount).toFixed(2));

    setRows(newRows);
  };

  const handleKeyDown = (e, index, field) => {
    if (e.key === "Enter") {
        e.preventDefault();
        
        // Focus on next field or next row
        if (field === 'itemName' && rowRefs.current[index]?.quantity) {
            rowRefs.current[index].quantity.focus();
            rowRefs.current[index].quantity.select();
        } else if (field === 'quantity' && rowRefs.current[index]?.rate) {
            rowRefs.current[index].rate.focus();
            rowRefs.current[index].rate.select();
        } else if (field === 'rate' && rowRefs.current[index]?.gst) {
            rowRefs.current[index].gst.focus();
            rowRefs.current[index].gst.select();
        } else if (field === 'gst') {
            // Move to next row if current row is complete
            if (rows[index].itemName && rows[index].quantity > 0 && rows[index].rate > 0) {
                // Add new row if this is the last row
                if (index === rows.length - 1) {
                    addNewRow();
                    // Focus on itemName of new row after a brief delay
                    setTimeout(() => {
                        if (rowRefs.current[rows.length]?.itemName) {
                            rowRefs.current[rows.length].itemName.focus();
                        }
                    }, 50);
                } else {
                    // Focus on itemName of next row
                    if (rowRefs.current[index + 1]?.itemName) {
                        rowRefs.current[index + 1].itemName.focus();
                    }
                }
            } else {
                toast.warning("Please complete current row with valid data.");
            }
        }
    }
    
    // Tab key handling
    if (e.key === "Tab") {
        e.preventDefault();
        if (field === 'itemName') {
            rowRefs.current[index].quantity.focus();
            rowRefs.current[index].quantity.select();
        } else if (field === 'quantity') {
            rowRefs.current[index].rate.focus();
            rowRefs.current[index].rate.select();
        } else if (field === 'rate') {
            rowRefs.current[index].gst.focus();
            rowRefs.current[index].gst.select();
        } else if (field === 'gst') {
            if (index === rows.length - 1) {
                addNewRow();
                setTimeout(() => {
                    if (rowRefs.current[rows.length]?.itemName) {
                        rowRefs.current[rows.length].itemName.focus();
                    }
                }, 50);
            } else {
                if (rowRefs.current[index + 1]?.itemName) {
                    rowRefs.current[index + 1].itemName.focus();
                }
            }
        }
    }
  };

  const handleDeleteRow = (index) => {
    if (rows.length > 1) {
        setRows(rows.filter((_, i) => i !== index));
        // Update refs
        rowRefs.current = rowRefs.current.filter((_, i) => i !== index);
    }
  };

  const addNewRow = () => {
    const newRowId = Date.now();
    setRows([...rows, { id: newRowId, itemCode: "", itemName: "", stock: 0, rate: 0, quantity: 1, gst: 0, total: 0 }]);
    
    // Focus on new row's item name field
    setTimeout(() => {
        const newIndex = rows.length;
        if (rowRefs.current[newIndex]?.itemName) {
            rowRefs.current[newIndex].itemName.focus();
        }
    }, 100);
  };

  // Calculate totals whenever rows change
  useEffect(() => {
    const gross = parseFloat(rows.reduce((acc, row) => acc + (parseFloat(row.total) || 0), 0).toFixed(2));
    const discPercent = Math.max(0, Math.min(100, parseFloat(totals.discountPercent) || 0));
    const discAmount = parseFloat(((gross * discPercent) / 100).toFixed(2));
    const net = parseFloat(Math.max(0, gross - discAmount).toFixed(2));
    setTotals(prev => ({ ...prev, gross, discountPercent: discPercent, discountAmount: discAmount, net }));
  }, [rows, totals.discountPercent]);

  // Calculate total quantity for delivery challan
  const calculateTotalQuantity = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((total, item) => {
      const qty = parseFloat(item.quantity) || 0;
      return total + qty;
    }, 0);
  };

  const handleSave = async () => {
    if (!customerDetails.name.trim()) {
      toast.warning("Please select or enter customer name");
      return;
    }

    // Validation for payment modes
    if ((totals.paymentMode === "Cheque" || totals.paymentMode === "DD" || totals.paymentMode === "Online") && !transactionRefNo.trim()) {
      toast.error(`Please enter ${totals.paymentMode} reference number`);
      return;
    }

    if (totals.paymentMode === "Bank Transfer" && !selectedBankAccount) {
      toast.error("Please select a bank account for Bank Transfer");
      return;
    }

    const validItems = [];
    for (const r of rows) {
        if (r.itemName && r.quantity > 0 && r.rate > 0) {
            if (r.stock !== undefined && r.quantity > r.stock) {
                toast.error(`Insufficient stock for ${r.itemName}. Available: ${r.stock}`);
                return;
            }
            validItems.push({
                ...r,
                quantity: parseFloat(r.quantity),
                rate: parseFloat(Number(r.rate).toFixed(2)),
                gstPercent: parseFloat(Number(r.gst || 0).toFixed(2)),
                total: parseFloat(Number(r.total).toFixed(2))
            });
        }
    }

    if (validItems.length === 0) {
      toast.warning("Please add at least one item with quantity and rate");
      return;
    }

    // Get selected bank account details
    const selectedBank = bankAccounts.find(acc => acc.id.toString() === selectedBankAccount.toString());

    const payload = {
        billNo, 
        issueDate: billDate,
        customerId: customerDetails.id || null, 
        customerCode: customerDetails.code || "NA",
        customerName: customerDetails.name.trim(),
        address: customerDetails.address || "",
        phoneNumber: customerDetails.phone || "",
        grossAmount: parseFloat(totals.gross.toFixed(2)),
        discount: parseFloat(totals.discountAmount.toFixed(2)),
        netAmount: parseFloat(totals.net.toFixed(2)),
        paidAmount: parseFloat(totals.net.toFixed(2)),
        balanceAmount: 0,
        paymentMode: totals.paymentMode,
        transactionRefNo: (totals.paymentMode === "Cheque" || totals.paymentMode === "DD" || totals.paymentMode === "Online") ? transactionRefNo : "",
        bankAccountDetails: totals.paymentMode === "Bank Transfer" ? {
            bankAccountId: selectedBankAccount,
            bankAccountInfo: selectedBank
        } : null,
        items: validItems
    };

    setIsSaving(true);
    try {
        const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
        const res = await axios.post(`${ENDPOINTS.store}/utilise/save`, payload, {
            params: { schoolId: user.uid, year: currentAcademicYear }, 
            headers
        });

        toast.success("Transaction Saved Successfully!");
        
        // Set receipt data with proper bill number
        const savedBillNo = res.data.billNo || payload.billNo;
        setReceiptData({ 
            ...payload, 
            billNo: savedBillNo,
            items: payload.items.map(item => ({
                ...item,
                gstPercent: parseFloat(item.gstPercent).toFixed(2),
                rate: parseFloat(item.rate).toFixed(2),
                total: parseFloat(item.total).toFixed(2)
            })),
            selectedBankAccount: selectedBank,
            transactionRefNo: payload.transactionRefNo
        });
        
        setShowReceipt(true);
        setRows([{ id: Date.now(), itemCode: "", itemName: "", stock: 0, rate: 0, quantity: 1, gst: 0, total: 0 }]);
        setTotals({ gross: 0, discountPercent: 0, discountAmount: 0, net: 0, paymentMode: "Cash" });
        setCustomerDetails({ id: "", code: "", name: "", address: "", phone: "" });
        setSelectedBankAccount("");
        setTransactionRefNo("");
        
        // Refresh bill number for next transaction
        fetchInitialData();
    } catch (err) {
        console.error("Save Error:", err);
        const msg = err.response?.data?.error || "Failed to save transaction.";
        toast.error(msg);
    } finally {
        setIsSaving(false);
    }
  };

  // --- DELIVERY CHALLAN PDF GENERATION ---
  const generatePDF = () => {
    try {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);

        // Delivery Challan Header
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("DELIVERY CHALLAN", pageWidth / 2, 25, { align: "center" });
        
        // Horizontal line
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(margin, 30, pageWidth - margin, 30);
        
        // Staff Name Section
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Staff Name:", margin, 40);
        doc.setFont("helvetica", "normal");
        doc.text(receiptData?.customerName || "NAVIN", margin + 30, 40);
        
        // Address
        doc.setFont("helvetica", "bold");
        doc.text("Address:", margin, 47);
        doc.setFont("helvetica", "normal");
        // Split address if too long
        const address = receiptData?.address || "Avaluppet Road";
        const addressLines = doc.splitTextToSize(address, contentWidth - 30);
        doc.text(addressLines, margin + 30, 47);
        
        // Bill No and Date
        const billInfoY = 40;
        doc.setFont("helvetica", "bold");
        doc.text("Bill No:", pageWidth - margin - 60, billInfoY);
        doc.setFont("helvetica", "normal");
        doc.text(receiptData?.billNo || "8", pageWidth - margin - 40, billInfoY);
        
        doc.setFont("helvetica", "bold");
        doc.text("Date:", pageWidth - margin - 60, billInfoY + 7);
        doc.setFont("helvetica", "normal");
        doc.text(receiptData?.issueDate || "05/01/2026", pageWidth - margin - 40, billInfoY + 7);
        
        // Table header line - Adjust Y position based on address height
        const tableTop = addressLines.length > 1 ? 60 : 55;
        doc.line(margin, tableTop, pageWidth - margin, tableTop);
        
        // Simple Table Header
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        
        // Column positions
        const col1 = margin + 5;
        const col2 = margin + 20;
        const col3 = pageWidth - margin - 20;
        
        doc.text("No.", col1, tableTop + 8);
        doc.text("Description", col2, tableTop + 8);
        doc.text("Qty(Nos)", col3, tableTop + 8);
        
        doc.line(margin, tableTop + 11, pageWidth - margin, tableTop + 11);
        
        // Table content
        let currentY = tableTop + 18;
        doc.setFont("helvetica", "normal");
        
        (receiptData?.items || []).forEach((item, index) => {
            doc.text(`${index + 1}`, col1, currentY);
            doc.text(item.itemName, col2, currentY);
            doc.text(parseFloat(item.quantity).toString(), col3, currentY, { align: "right" });
            currentY += 7;
        });
        
        // Total row
        currentY += 3;
        doc.line(margin, currentY - 2, pageWidth - margin, currentY - 2);
        
        doc.setFont("helvetica", "bold");
        doc.text("Total", col2, currentY);
        const totalQty = calculateTotalQuantity(receiptData?.items);
        doc.text(totalQty.toString(), col3, currentY, { align: "right" });
        
        // Payment Details
        currentY += 10;
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Payment Details:", margin, currentY);
        currentY += 7;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Payment Mode: ${receiptData?.paymentMode || 'Cash'}`, margin, currentY);
        currentY += 5;
        
        if (receiptData?.transactionRefNo) {
            doc.text(`Reference No: ${receiptData.transactionRefNo}`, margin, currentY);
            currentY += 5;
        }
        
        if (receiptData?.paymentMode === "Bank Transfer" && receiptData?.selectedBankAccount) {
            doc.text(`Bank: ${receiptData.selectedBankAccount.bankName}`, margin, currentY);
            currentY += 4;
            doc.text(`Account: ${receiptData.selectedBankAccount.accountNumber}`, margin, currentY);
            currentY += 4;
            doc.text(`IFSC: ${receiptData.selectedBankAccount.ifscCode}`, margin, currentY);
            currentY += 5;
        }
        
        // Bottom line
        currentY += 7;
        doc.line(margin, currentY, pageWidth - margin, currentY);
        
        // Signatures section
        currentY += 15;
        const signatureY = currentY;
        
        // Issuer Signature
        doc.line(margin + 10, signatureY, margin + 60, signatureY);
        doc.setFontSize(9);
        doc.text("Issuer Signature", margin + 35, signatureY + 5, { align: "center" });
        
        // Receiver Signature
        doc.line(pageWidth - margin - 60, signatureY, pageWidth - margin - 10, signatureY);
        doc.text("Receiver Signature", pageWidth - margin - 35, signatureY + 5, { align: "center" });
        
        // Footer note
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text("This is a computer generated delivery challan.", pageWidth / 2, doc.internal.pageSize.height - 10, { align: "center" });
        
        const fileName = `Delivery-Challan-${receiptData?.billNo || 'challan'}.pdf`;
        doc.save(fileName);
        toast.success("Delivery Challan downloaded successfully!");
    } catch (error) {
        console.error("PDF Generation Error:", error);
        toast.error("Failed to generate PDF. Please try again.");
    }
  };

  // Print Receipt with Delivery Challan style
  const printReceipt = () => {
    const printContent = document.getElementById('receipt-print-content');
    if (!printContent) return;

    const totalQuantity = calculateTotalQuantity(receiptData?.items);

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Delivery Challan - ${receiptData?.billNo}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            body { 
              margin: 25px; 
              background: #fff;
              color: #000;
            }
            .challan-container { 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 25px;
              border: 2px solid #000;
              position: relative;
            }
            .challan-header { 
              text-align: center; 
              margin-bottom: 25px;
              padding-bottom: 15px;
              border-bottom: 2px solid #000;
            }
            .challan-title { 
              font-size: 32px; 
              font-weight: 700; 
              letter-spacing: 1px;
              text-transform: uppercase;
              color: #000;
            }
            .content-section { 
              margin-bottom: 25px; 
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            .info-item {
              margin-bottom: 12px;
            }
            .info-label {
              font-weight: 600;
              font-size: 16px;
              margin-bottom: 4px;
              color: #000;
            }
            .info-value {
              font-size: 15px;
              color: #333;
              padding-left: 10px;
            }
            .bill-info {
              text-align: right;
              margin-bottom: 25px;
            }
            .bill-info-item {
              margin-bottom: 8px;
              font-size: 15px;
            }
            .bill-label {
              font-weight: 600;
              color: #000;
            }
            .items-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 25px 0 30px 0;
              font-size: 14px;
            }
            .items-table th { 
              background: #000;
              color: #fff;
              padding: 12px 10px; 
              text-align: left;
              font-weight: 600;
              font-size: 14px;
            }
            .items-table td { 
              padding: 10px; 
              border-bottom: 1px solid #ddd;
              vertical-align: top;
            }
            .items-table tbody tr:nth-child(even) {
              background: #f9f9f9;
            }
            .items-table .total-row { 
              background: #f0f0f0; 
              font-weight: 600;
              border-top: 2px solid #000;
            }
            .payment-details {
              margin: 20px 0;
              padding: 15px;
              background: #f8f9fa;
              border-radius: 8px;
              border-left: 4px solid #0B3D7B;
            }
            .signatures { 
              margin-top: 50px; 
              padding-top: 25px;
              border-top: 1px solid #000;
              display: flex;
              justify-content: space-between;
            }
            .signature-box { 
              width: 45%; 
              text-align: center; 
            }
            .signature-line { 
              border-top: 1px solid #000; 
              width: 200px; 
              margin: 0 auto 10px;
              height: 1px;
            }
            .signature-label { 
              font-weight: 600;
              font-size: 14px;
              color: #000;
            }
            .footer-note { 
              text-align: center; 
              margin-top: 25px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
            .total-quantity {
              font-size: 16px;
              font-weight: 700;
              color: #000;
            }
            .bank-details {
              margin-top: 10px;
              padding: 10px;
              background: #f0f8ff;
              border-radius: 6px;
              border: 1px solid #cfe2ff;
            }
            @media print { 
              body { margin: 15px; }
              .challan-container { 
                border: 2px solid #000;
                padding: 20px;
              }
              @page {
                size: A4;
                margin: 20mm;
              }
            }
            @media (max-width: 768px) {
              body { margin: 10px; }
              .challan-container { 
                padding: 15px;
                margin: 0;
              }
              .challan-title { font-size: 24px; }
              .info-grid {
                grid-template-columns: 1fr;
              }
              .bill-info {
                text-align: left;
                margin-top: 20px;
              }
              .items-table {
                font-size: 12px;
              }
              .items-table th,
              .items-table td {
                padding: 8px 6px;
              }
              .signature-box {
                width: 48%;
              }
            }
          </style>
        </head>
        <body>
          <div class="challan-container">
            <div class="challan-header">
              <div class="challan-title">DELIVERY CHALLAN</div>
            </div>
            
            <div class="content-section">
              <div class="info-grid">
                <div class="staff-info">
                  <div class="info-item">
                    <div class="info-label">Staff Name:</div>
                    <div class="info-value">${receiptData?.customerName || 'NAVIN'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Address:</div>
                    <div class="info-value">${receiptData?.address || 'Avaluppet Road'}</div>
                  </div>
                </div>
                
                <div class="bill-info">
                  <div class="bill-info-item">
                    <span class="bill-label">Bill No:</span> 
                    <span class="info-value">${receiptData?.billNo || '8'}</span>
                  </div>
                  <div class="bill-info-item">
                    <span class="bill-label">Date:</span> 
                    <span class="info-value">${receiptData?.issueDate || '05/01/2026'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 60px;">No.</th>
                  <th>Description</th>
                  <th style="width: 100px; text-align: right;">Qty(Nos)</th>
                </tr>
              </thead>
              <tbody>
                ${(receiptData?.items || []).map((item, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${item.itemName}</td>
                    <td style="text-align: right;">${parseFloat(item.quantity || 0)}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="2" style="text-align: right; padding-right: 20px;">
                    <strong>Total Quantity:</strong>
                  </td>
                  <td style="text-align: right;" class="total-quantity">
                    <strong>${totalQuantity}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <div class="payment-details">
              <div class="info-label">Payment Details:</div>
              <div class="info-value">
                <div><strong>Payment Mode:</strong> ${receiptData?.paymentMode || 'Cash'}</div>
                ${receiptData?.transactionRefNo ? `<div><strong>Reference No:</strong> ${receiptData.transactionRefNo}</div>` : ''}
                ${receiptData?.paymentMode === "Bank Transfer" && receiptData?.selectedBankAccount ? `
                  <div class="bank-details">
                    <div><strong>Bank:</strong> ${receiptData.selectedBankAccount.bankName}</div>
                    <div><strong>Account No:</strong> ${receiptData.selectedBankAccount.accountNumber}</div>
                    <div><strong>IFSC:</strong> ${receiptData.selectedBankAccount.ifscCode}</div>
                  </div>
                ` : ''}
              </div>
            </div>
            
            <div class="signatures">
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">Issuer Signature</div>
              </div>
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">Receiver Signature</div>
              </div>
            </div>
            
            <div class="footer-note">
              This is a computer generated delivery challan. No signature is required.
            </div>
          </div>
          
          <script>
            window.onload = function() { 
              window.print(); 
              setTimeout(function() { 
                window.close(); 
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const copyReceiptDetails = () => {
    if (!receiptData) return;
    
    const totalQty = calculateTotalQuantity(receiptData.items);
    
    const receiptText = `
DELIVERY CHALLAN
================

Bill No: ${receiptData.billNo}
Date: ${receiptData.issueDate}

Staff Name: ${receiptData.customerName}
Address: ${receiptData.address || 'Avaluppet Road'}

ITEMS:
${receiptData.items.map((item, idx) => `${idx + 1}. ${item.itemName} - Qty: ${parseFloat(item.quantity)}`).join('\n')}

Total Quantity: ${totalQty}

PAYMENT DETAILS:
Payment Mode: ${receiptData.paymentMode}
${receiptData.transactionRefNo ? `Reference No: ${receiptData.transactionRefNo}` : ''}
${receiptData.paymentMode === "Bank Transfer" && receiptData.selectedBankAccount ? `
Bank: ${receiptData.selectedBankAccount.bankName}
Account: ${receiptData.selectedBankAccount.accountNumber}
IFSC: ${receiptData.selectedBankAccount.ifscCode}
` : ''}

---
Issuer Signature: ________________
Receiver Signature: ______________

This is a computer generated delivery challan.
    `.trim();
    
    navigator.clipboard.writeText(receiptText);
    toast.success("Challan details copied to clipboard!");
  };

  return (
    <MainContentPage>
      <Container fluid className="px-3 px-md-4 py-3">
        <ToastContainer position="top-right" autoClose={3000} />
        <Card className="shadow-sm border-0">
          <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
            <h4 className="m-0 fw-bold">
              <i className="fas fa-boxes me-2"></i>
              Utilise Material / Issue to Staff 
            </h4>
            <div className="d-flex align-items-center">
              <span className="badge bg-light text-primary me-3 px-3 py-2">
                <i className="fas fa-calendar-alt me-1"></i>
                Academic Year: {currentAcademicYear}
              </span>
            </div>
          </Card.Header>

          <Card.Body className="p-4">
            {/* Header Section */}
            <Row className="mb-4 g-3">
              <Col md={3}>
                <Card className="border-primary shadow-sm h-100">
                  <Card.Body className="p-3">
                    <h6 className="text-primary mb-3 fw-bold">
                      <i className="fas fa-file-invoice me-2"></i>
                      Bill Information
                    </h6>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold small text-muted">Bill No</Form.Label>
                      <InputGroup>
                        <Form.Control 
                          type="text" 
                          value={billNo} 
                          readOnly 
                          className="fw-bold border-primary bg-light"
                        />
                        <InputGroup.Text className="bg-primary text-white">
                          <i className="fas fa-hashtag"></i>
                        </InputGroup.Text>
                      </InputGroup>
                    </Form.Group>
                    <Form.Group>
                      <Form.Label className="fw-bold small text-muted">Date</Form.Label>
                      <Form.Control 
                        type="date" 
                        value={billDate} 
                        onChange={e => setBillDate(e.target.value)}
                        className="border-primary"
                      />
                    </Form.Group>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={5}>
                <Card className="border-success shadow-sm h-100">
                  <Card.Body className="p-3">
                    <h6 className="text-success mb-3 fw-bold">
                      <i className="fas fa-user-tie me-2"></i>
                      Customer Details
                    </h6>
                    <Row className="g-2 mb-2">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-bold small text-muted">Customer Code</Form.Label>
                          <SearchableSelect 
                            options={customerList} 
                            value={customerDetails.code} 
                            onChange={(v) => handleCustomerSelect(v, 'code')} 
                            placeholder="Search by Code" 
                            valueKey="customerStaffCode" 
                            labelKey="customerStaffCode" 
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-bold small text-muted">Customer Name</Form.Label>
                          <SearchableSelect 
                            options={customerList} 
                            value={customerDetails.name} 
                            onChange={(v) => handleCustomerSelect(v, 'name')} 
                            placeholder="Search by Name" 
                            valueKey="customerStaffName" 
                            labelKey="customerStaffName" 
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    {customerDetails.name && (
                      <div className="border-top pt-2 mt-2">
                        <div className="d-flex align-items-center mb-1">
                          <i className="fas fa-phone text-muted me-2 small"></i>
                          <span className="small">{customerDetails.phone || 'No phone'}</span>
                        </div>
                        <div className="d-flex align-items-center">
                          <i className="fas fa-map-marker-alt text-muted me-2 small"></i>
                          <span className="small">{customerDetails.address || 'No address'}</span>
                        </div>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={4}>
                <Card className="border-warning shadow-sm h-100">
                  <Card.Body className="p-3 d-flex flex-column justify-content-center align-items-center text-center">
                    <div className="display-1 text-warning mb-3">
                      <i className="fas fa-cash-register"></i>
                    </div>
                    <h3 className="text-warning fw-bold mb-2">BILLING SYSTEM</h3>
                    <p className="text-muted small mb-0">
                      Complete the form to generate receipt
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Items Table */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-light d-flex justify-content-between align-items-center py-3">
                <h6 className="m-0 fw-bold text-primary">
                  <i className="fas fa-list-alt me-2"></i>
                  Item Details
                </h6>
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={addNewRow}
                  className="px-3"
                >
                  <i className="fas fa-plus me-1"></i>
                  Add Row
                </Button>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <Table bordered hover className="m-0">
                    <thead className="bg-primary text-white sticky-top">
                      <tr>
                        <th style={{width:'5%'}} className="text-center">#</th>
                        <th style={{width:'30%'}}>Item Name</th>
                        <th style={{width:'10%'}} className="text-center">Stock</th>
                        <th style={{width:'15%'}}>Sell Price</th>
                        <th style={{width:'10%'}}>Qty</th>
                        <th style={{width:'10%'}}>GST %</th>
                        <th style={{width:'15%'}} className="text-end">Total</th>
                        <th style={{width:'5%'}} className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, index) => (
                        <tr key={row.id} className={index % 2 === 0 ? 'bg-light' : ''}>
                          <td className="text-center align-middle">{index + 1}</td>
                          <td className="align-middle">
                            <Form.Control
                              ref={el => {
                                if (!rowRefs.current[index]) rowRefs.current[index] = {};
                                rowRefs.current[index].itemName = el;
                              }}
                              type="text"
                              value={row.itemName}
                              onChange={(e) => handleRowChange(index, 'itemName', e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, index, 'itemName')}
                              placeholder="Type item name or select"
                              className="item-input"
                              list={`item-list-${index}`}
                              autoComplete="off"
                            />
                            <datalist id={`item-list-${index}`}>
                              {availableItems.map((item, idx) => (
                                <option key={idx} value={item.name} />
                              ))}
                            </datalist>
                          </td>
                          <td className={`text-center align-middle fw-bold ${row.stock < row.quantity ? 'bg-danger text-white' : ''}`}>
                            {row.stock}
                            {row.stock < row.quantity && (
                              <div className="small">Insufficient</div>
                            )}
                          </td>
                          <td className="align-middle">
                            <Form.Control 
                              ref={el => {
                                if (!rowRefs.current[index]) rowRefs.current[index] = {};
                                rowRefs.current[index].rate = el;
                              }}
                              type="number" 
                              value={row.rate} 
                              onChange={(e) => handleRowChange(index, 'rate', e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, index, 'rate')}
                              size="sm"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="align-middle">
                            <Form.Control 
                              ref={el => {
                                if (!rowRefs.current[index]) rowRefs.current[index] = {};
                                rowRefs.current[index].quantity = el;
                              }}
                              type="number" 
                              value={row.quantity} 
                              onChange={(e) => handleRowChange(index, 'quantity', e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, index, 'quantity')}
                              size="sm"
                              min="1"
                              step="1"
                            />
                          </td>
                          <td className="align-middle">
                            <Form.Control 
                              ref={el => {
                                if (!rowRefs.current[index]) rowRefs.current[index] = {};
                                rowRefs.current[index].gst = el;
                              }}
                              type="number" 
                              value={row.gst} 
                              onChange={(e) => handleRowChange(index, 'gst', e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, index, 'gst')}
                              size="sm"
                              min="0"
                              max="100"
                              step="0.01"
                            />
                          </td>
                          <td className="align-middle">
                            <Form.Control 
                              type="text" 
                              value={`Rs. ${Number(row.total).toFixed(2)}`} 
                              readOnly 
                              size="sm"
                              className="text-end fw-bold bg-light"
                            />
                          </td>
                          <td className="text-center align-middle">
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDeleteRow(index)}
                              disabled={rows.length === 1}
                              title="Delete Row"
                            >
                              <FaTrash size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                <div className="mt-2 ps-2 small text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  Press <kbd>Enter</kbd> or <kbd>Tab</kbd> to navigate between fields. Press <kbd>Enter</kbd> in GST field to add new row automatically.
                </div>
              </Card.Body>
            </Card>

            {/* Payment Section with Bank Transfer */}
            <Row className="mt-4">
              <Col md={8}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body className="p-4">
                    <h6 className="fw-bold text-primary mb-3">
                      <i className="fas fa-credit-card me-2"></i>
                      Payment Details
                    </h6>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-bold small">Payment Mode</Form.Label>
                          <Form.Select 
                            value={totals.paymentMode} 
                            onChange={e => {
                              setTotals({...totals, paymentMode: e.target.value});
                              if (e.target.value !== "Bank Transfer") {
                                setSelectedBankAccount("");
                              }
                              if (e.target.value === "Cash") {
                                setTransactionRefNo("");
                              }
                            }}
                            className="border-primary"
                          >
                            <option value="Cash">Cash</option>
                            <option value="Cheque">Cheque</option>
                            <option value="DD">DD</option>
                            <option value="Online">Online</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      
                      {/* Reference Number for Cheque, DD, Online */}
                      {(totals.paymentMode === "Cheque" || totals.paymentMode === "DD" || totals.paymentMode === "Online") && (
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-bold small">
                              {totals.paymentMode === "Cheque" ? "Cheque No." : 
                               totals.paymentMode === "DD" ? "DD No." : 
                               "Transaction/UTR No."}
                            </Form.Label>
                            <Form.Control 
                              type="text" 
                              value={transactionRefNo}
                              onChange={e => setTransactionRefNo(e.target.value)}
                              placeholder={`Enter ${totals.paymentMode === "Cheque" ? "Cheque" : 
                                           totals.paymentMode === "DD" ? "DD" : 
                                           "Transaction/UTR"} Number`}
                              className="border-primary"
                            />
                          </Form.Group>
                        </Col>
                      )}

                      {/* Bank Account Selection for Bank Transfer */}
                      {totals.paymentMode === "Bank Transfer" && (
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-bold small">
                              Bank Account 
                              {loadingBankAccounts && <Spinner size="sm" className="ms-2" />}
                            </Form.Label>
                            <Form.Select
                              value={selectedBankAccount}
                              onChange={e => setSelectedBankAccount(e.target.value)}
                              disabled={loadingBankAccounts || bankAccounts.length === 0}
                              className="border-primary"
                            >
                              <option value="">Select Bank Account</option>
                              {bankAccounts.map(account => (
                                <option key={account.id} value={account.id}>
                                  {account.bankName} - {account.accountNumber} ({account.accountType})
                                </option>
                              ))}
                            </Form.Select>
                            {bankAccounts.length === 0 && !loadingBankAccounts && (
                              <Alert variant="warning" className="mt-2 py-2">
                                <FaUniversity className="me-2" />
                                No bank accounts found. Please add bank accounts in <strong>Bank Setup</strong>.
                              </Alert>
                            )}
                          </Form.Group>
                        </Col>
                      )}

                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-bold small">Remarks (Optional)</Form.Label>
                          <Form.Control 
                            type="text" 
                            placeholder="Enter any remarks"
                            className="border-primary"
                          />
                        </Form.Group>
                      </Col>
                      
                      {/* Bank Account Details Display */}
                      {totals.paymentMode === "Bank Transfer" && selectedBankAccount && (
                        <Col md={12}>
                          <Card className="mt-3 border-primary">
                            <Card.Body className="p-2">
                              <Row>
                                <Col md={4}>
                                  <small className="d-block">
                                    <FaUniversity className="me-1 text-primary" />
                                    <strong>Bank: </strong>
                                    {bankAccounts.find(acc => acc.id.toString() === selectedBankAccount.toString())?.bankName}
                                  </small>
                                </Col>
                                <Col md={4}>
                                  <small className="d-block">
                                    <FaCreditCard className="me-1 text-primary" />
                                    <strong>Account: </strong>
                                    {bankAccounts.find(acc => acc.id.toString() === selectedBankAccount.toString())?.accountNumber}
                                  </small>
                                </Col>
                                <Col md={4}>
                                  <small className="d-block">
                                    <strong>IFSC: </strong>
                                    {bankAccounts.find(acc => acc.id.toString() === selectedBankAccount.toString())?.ifscCode}
                                  </small>
                                </Col>
                              </Row>
                            </Card.Body>
                          </Card>
                        </Col>
                      )}
                    </Row>
                    <div className="mt-4">
                      <Button 
                        variant="success" 
                        size="lg" 
                        className="w-100 fw-bold py-3"
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Processing...
                          </>
                        ) : (
                          <>
                            <FaSave className="me-2" />
                            SAVE TRANSACTION
                          </>
                        )}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={4}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body className="p-4">
                    <h6 className="fw-bold text-primary mb-3">
                      <i className="fas fa-calculator me-2"></i>
                      Bill Summary
                    </h6>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Gross Amount:</span>
                        <span className="fw-bold">Rs. {totals.gross.toFixed(2)}</span>
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span>Discount (%):</span>
                        <InputGroup style={{ width: '120px' }}>
                          <Form.Control 
                            type="number" 
                            size="sm"
                            value={totals.discountPercent}
                            onChange={e => setTotals({...totals, discountPercent: e.target.value})}
                            min="0"
                            max="100"
                          />
                          <InputGroup.Text className="bg-light">%</InputGroup.Text>
                        </InputGroup>
                      </div>
                      
                      {totals.discountAmount > 0 && (
                        <div className="d-flex justify-content-between mb-2 small text-danger">
                          <span>Discount Amount:</span>
                          <span>- Rs. {totals.discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <hr className="my-3" />
                      
                      <div className="d-flex justify-content-between h4 mb-0">
                        <span className="fw-bold">Net Amount:</span>
                        <span className="fw-bold text-success">Rs. {totals.net.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 small text-muted border-top pt-3">
                      <div className="d-flex justify-content-between">
                        <span>Items Count:</span>
                        <span className="fw-bold">{rows.filter(r => r.itemName).length}</span>
                      </div>
                      <div className="d-flex justify-content-between mt-1">
                        <span>Payment Mode:</span>
                        <span className="fw-bold">{totals.paymentMode}</span>
                      </div>
                      {totals.paymentMode === "Bank Transfer" && selectedBankAccount && (
                        <div className="mt-2 p-2 bg-light rounded">
                          <small className="d-block">
                            <strong>Bank: </strong>
                            {bankAccounts.find(acc => acc.id.toString() === selectedBankAccount.toString())?.bankName}
                          </small>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Receipt Modal - Updated to include bank details */}
        <Modal 
          show={showReceipt} 
          onHide={() => setShowReceipt(false)} 
          size="lg"
          centered 
          backdrop="static"
          className="delivery-challan-modal"
        >
          <Modal.Header closeButton className="border-bottom-0 py-4">
            <Modal.Title className="w-100 text-center">
              <h2 className="mb-0 fw-bold" style={{ color: '#000', letterSpacing: '1px' }}>DELIVERY CHALLAN</h2>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="px-4 py-0" style={{ maxHeight: 'calc(80vh - 150px)', overflowY: 'auto' }}>
            <div id="receipt-print-content">
              {/* Simple Delivery Challan Design */}
              <div className="delivery-challan-content" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
                
                {/* Staff and Bill Info Grid */}
                <div className="info-grid mb-4">
                  <div className="staff-info">
                    <div className="mb-3">
                      <div className="fw-bold mb-1" style={{ fontSize: '16px', color: '#000' }}>Staff Name:</div>
                      <div style={{ fontSize: '15px', color: '#333', paddingLeft: '10px' }}>
                        {receiptData?.customerName || 'NAVIN'}
                      </div>
                    </div>
                    <div>
                      <div className="fw-bold mb-1" style={{ fontSize: '16px', color: '#000' }}>Address:</div>
                      <div style={{ fontSize: '15px', color: '#333', paddingLeft: '10px' }}>
                        {receiptData?.address || 'Avaluppet Road'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bill-info text-md-end">
                    <div className="mb-2">
                      <span className="fw-bold me-2" style={{ fontSize: '15px', color: '#000' }}>Bill No:</span>
                      <span style={{ fontSize: '15px', color: '#333' }}>{receiptData?.billNo || '8'}</span>
                    </div>
                    <div>
                      <span className="fw-bold me-2" style={{ fontSize: '15px', color: '#000' }}>Date:</span>
                      <span style={{ fontSize: '15px', color: '#333' }}>{receiptData?.issueDate || '05/01/2026'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Items Table */}
                <div className="table-responsive mb-4">
                  <table className="table mb-0" style={{ border: '1px solid #dee2e6' }}>
                    <thead style={{ backgroundColor: '#000', color: '#fff' }}>
                      <tr>
                        <th style={{ width: '10%', padding: '12px', border: 'none' }} className="text-center">No.</th>
                        <th style={{ padding: '12px', border: 'none' }}>Description</th>
                        <th style={{ width: '20%', padding: '12px', border: 'none' }} className="text-end">Qty(Nos)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiptData?.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                          <td className="text-center align-middle" style={{ padding: '10px' }}>{idx + 1}</td>
                          <td className="align-middle" style={{ padding: '10px' }}>{item.itemName}</td>
                          <td className="text-end align-middle fw-medium" style={{ padding: '10px' }}>
                            {parseFloat(item.quantity || 0)}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ backgroundColor: '#f8f9fa', borderTop: '2px solid #000' }}>
                        <td colSpan="2" className="text-end fw-bold" style={{ padding: '12px' }}>
                          Total Quantity:
                        </td>
                        <td className="text-end fw-bold" style={{ padding: '12px', fontSize: '16px', color: '#000' }}>
                          {calculateTotalQuantity(receiptData?.items)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* Payment Details */}
                <div className="payment-details mb-4 p-3 border rounded bg-light">
                  <h6 className="fw-bold mb-3" style={{ color: '#000' }}>Payment Details</h6>
                  <div className="mb-2">
                    <strong>Payment Mode:</strong> {receiptData?.paymentMode || 'Cash'}
                    {receiptData?.transactionRefNo && ` (Ref: ${receiptData.transactionRefNo})`}
                  </div>
                  
                  {receiptData?.paymentMode === "Bank Transfer" && receiptData?.selectedBankAccount && (
                    <div className="mt-3 p-2 border rounded bg-white">
                      <div className="mb-1">
                        <FaUniversity className="me-2 text-primary" />
                        <strong>Bank:</strong> {receiptData.selectedBankAccount.bankName}
                      </div>
                      <div className="mb-1">
                        <FaCreditCard className="me-2 text-primary" />
                        <strong>Account:</strong> {receiptData.selectedBankAccount.accountNumber}
                      </div>
                      <div>
                        <strong>IFSC:</strong> {receiptData.selectedBankAccount.ifscCode}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Signatures */}
                <div className="signatures-section mt-5 pt-4" style={{ borderTop: '1px solid #000' }}>
                  <div className="row">
                    <div className="col-6 text-center">
                      <div className="mb-1" style={{ width: '180px', height: '1px', backgroundColor: '#000', margin: '0 auto' }}></div>
                      <div className="fw-bold" style={{ fontSize: '14px', color: '#000' }}>Issuer Signature</div>
                    </div>
                    <div className="col-6 text-center">
                      <div className="mb-1" style={{ width: '180px', height: '1px', backgroundColor: '#000', margin: '0 auto' }}></div>
                      <div className="fw-bold" style={{ fontSize: '14px', color: '#000' }}>Receiver Signature</div>
                    </div>
                  </div>
                </div>
                
                {/* Footer Note */}
                <div className="footer-note text-center mt-4 pt-3" style={{ borderTop: '1px solid #dee2e6' }}>
                  <small className="text-muted">
                    This is a computer generated delivery challan.
                  </small>
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-top-0 bg-light py-3">
            <Button variant="secondary" onClick={() => setShowReceipt(false)}>
              <FaTimes className="me-2" />
              Close
            </Button>
            <Button variant="outline-primary" onClick={copyReceiptDetails}>
              <FaCopy className="me-2" />
              Copy Details
            </Button>
            <Button variant="outline-success" onClick={printReceipt}>
              <FaPrint className="me-2" />
              Print Challan
            </Button>
            <Button variant="danger" onClick={generatePDF}>
              <FaFilePdf className="me-2" />
              Download PDF
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>

      {/* Custom CSS Styles */}
      <style>
        {`
        /* General Styles */
        .form-card { 
          background: #fff; 
          border: 1px solid #dee2e6; 
          border-radius: 0.5rem; 
          box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
        }
        
        /* Table Styles */
        .table thead th {
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        /* Item input focus */
        .item-input:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
        }
        
        /* Delivery Challan Modal Styles */
        .delivery-challan-modal .modal-dialog {
          max-width: 800px;
        }
        
        .delivery-challan-modal .modal-content {
          border-radius: 8px;
          border: 1px solid #dee2e6;
          overflow: hidden;
        }
        
        .delivery-challan-modal .modal-header {
          background: #fff;
          color: #000;
          border-bottom: 2px solid #000 !important;
          padding-bottom: 1rem;
        }
        
        .delivery-challan-modal .btn-close {
          filter: invert(1) brightness(0.5);
          opacity: 0.7;
        }
        
        .delivery-challan-modal .modal-body {
          padding-top: 0;
        }
        
        /* Info Grid */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }
        
        @media (max-width: 768px) {
          .info-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .bill-info {
            text-align: left !important;
          }
        }
        
        /* Print Styles */
        @media print {
          .delivery-challan-modal .modal-dialog {
            max-width: 100% !important;
            margin: 0 !important;
          }
          
          .delivery-challan-modal .modal-content {
            border: 2px solid #000 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          
          .delivery-challan-modal .modal-header,
          .delivery-challan-modal .modal-footer {
            display: none !important;
          }
          
          .delivery-challan-modal .modal-body {
            padding: 20px !important;
            max-height: none !important;
            overflow: visible !important;
          }
          
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
        
        /* Keyboard shortcut hint */
        kbd {
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 0.25rem;
          padding: 0.15rem 0.3rem;
          font-size: 0.875em;
          font-weight: 600;
          color: #495057;
        }
        
        /* Animation for success */
        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .delivery-challan-modal .modal-content {
          animation: slideIn 0.3s ease-out;
        }
        
        /* Scrollbar styling */
        .table-responsive::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .table-responsive::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        .table-responsive::-webkit-scrollbar-thumb {
          background: #0B3D7B;
          border-radius: 4px;
        }
        
        .table-responsive::-webkit-scrollbar-thumb:hover {
          background: #06316c;
        }
        
        /* Modal body scroll */
        .modal-body::-webkit-scrollbar {
          width: 6px;
        }
        
        .modal-body::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .modal-body::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }
        
        .modal-body::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        
        /* Button hover effects */
        .btn {
          transition: all 0.2s ease;
        }
        
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .delivery-challan-modal .modal-dialog {
            margin: 10px;
            max-width: calc(100% - 20px);
          }
          
          .delivery-challan-modal .modal-footer .btn {
            margin-bottom: 5px;
            width: 100%;
          }
          
          .delivery-challan-modal .modal-footer {
            flex-direction: column;
          }
          
          .delivery-challan-modal .modal-footer .btn {
            margin-right: 0 !important;
          }
          
          .staff-info h5 {
            font-size: 1rem;
          }
          
          .delivery-challan-content table {
            font-size: 14px;
          }
          
          .delivery-challan-content th,
          .delivery-challan-content td {
            padding: 8px 6px !important;
          }
        }
        
        @media (max-width: 576px) {
          .delivery-challan-modal .modal-title h2 {
            font-size: 1.5rem;
          }
          
          .delivery-challan-content .info-grid {
            grid-template-columns: 1fr;
          }
          
          .delivery-challan-content .bill-info {
            text-align: left !important;
          }
        }
        `}
      </style>
    </MainContentPage>
  );
};

export default UtiliseMaterialOtherItems;