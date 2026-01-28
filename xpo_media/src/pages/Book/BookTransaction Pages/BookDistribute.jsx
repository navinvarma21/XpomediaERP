"use client";

import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import MainContentPage from "../../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container, Table, Card, Spinner, InputGroup, Modal, Alert } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaSearch, FaTrash, FaFilePdf, FaTimes, FaExclamationTriangle, FaUniversity, FaCreditCard, FaPrint } from "react-icons/fa";
import { useAuthContext } from "../../../Context/AuthContext";
import { ENDPOINTS } from "../../../SpringBoot/config";
import axios from "axios";
import jsPDF from "jspdf";

const BookDistribute = () => {
  const { user, currentAcademicYear } = useAuthContext();

  const [feeDate, setFeeDate] = useState(new Date().toISOString().split('T')[0]);
  const [admissionNoSearch, setAdmissionNoSearch] = useState("");
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);

  const [studentDetails, setStudentDetails] = useState({
    admissionNo: "",
    studentName: "",
    standard: "",
    section: ""
  });

  const [gridItems, setGridItems] = useState([]);
  const [distributeHistory, setDistributeHistory] = useState([]);
  const [currentBillNumber, setCurrentBillNumber] = useState("");

  const [showAmount, setShowAmount] = useState(true);
  const [paymode, setPaymode] = useState("Cash");
  const [ddCheckNo, setDdCheckNo] = useState("");
  const [concessionAmount, setConcessionAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState("");

  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const receiptRef = useRef();

  useEffect(() => {
    generateBillNumber();
    if (user) {
      fetchBankAccounts();
    }
  }, [user]);

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

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString + "T00:00:00");
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const generateBillNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    
    const billNo = `NB-${year}${month}${day}-${timestamp}`;
    setCurrentBillNumber(billNo);
    return billNo;
  };

  const handleSearchStudent = async (e) => {
    if (e.key !== 'Enter' || !admissionNoSearch.trim()) return;
    e.preventDefault();
    setLoadingStudent(true);
    
    setStudentDetails({ admissionNo: "", studentName: "", standard: "", section: "" });
    setDistributeHistory([]);
    setGridItems([]);
    setConcessionAmount("");
    setSelectedBankAccount("");
    setDdCheckNo("");

    try {
      const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
      const res = await axios.get(`${ENDPOINTS.admissionmaster}/studentreport/datas`, {
        params: { schoolId: user.uid, academicYear: currentAcademicYear },
        headers
      });

      const foundStudent = res.data.find(s =>
        s.admissionNumber && s.admissionNumber.toString().toLowerCase() === admissionNoSearch.trim().toLowerCase()
      );

      if (foundStudent) {
        const newStudentDetails = {
          admissionNo: foundStudent.admissionNumber,
          studentName: foundStudent.studentName,
          standard: foundStudent.standard,
          section: foundStudent.section
        };
        
        setStudentDetails(newStudentDetails);
        toast.success("Student Found");
        generateBillNumber();
        await loadStudentData(newStudentDetails.admissionNo, newStudentDetails.standard);
      } else {
        toast.error("Student not found.");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Error searching student.");
    } finally {
      setLoadingStudent(false);
    }
  };

  const loadStudentData = async (admissionNo, standard) => {
    try {
      const historyData = await fetchDistributeHistory(admissionNo);
      const setupData = await fetchSetupItems(standard);
      calculatePendingItems(setupData, historyData);
    } catch (error) {
      console.error("Error loading student data:", error);
      toast.error("Failed to load student data.");
    }
  };

  const fetchDistributeHistory = async (admissionNo) => {
    try {
      const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
      const res = await axios.get(`${ENDPOINTS.store}/distribute/student-history`, {
        params: {
          schoolId: user.uid,
          academicYear: currentAcademicYear,
          admissionNo: admissionNo
        },
        headers
      });

      const history = Array.isArray(res.data) ? res.data.map(item => ({
        feeDate: item.feeDate || item.fee_date,
        billNo: item.billNo || item.bill_no,
        descriptionName: item.descriptionName || item.description_name,
        quantity: parseInt(item.quantity) || 0,
        paymode: item.paymode || "",
        ddcheckNo: item.ddcheck_no || "",
        bankName: item.bank_name || "",
        accountNumber: item.account_number || ""
      })) : [];

      setDistributeHistory(history);
      return history;
    } catch (err) {
      console.error("History fetch error:", err);
      setDistributeHistory([]);
      return [];
    }
  };

  const fetchSetupItems = async (standard) => {
    try {
      const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
      const res = await axios.get(`${ENDPOINTS.store}/distribute/setup-items`, {
        params: { schoolId: user.uid, academicYear: currentAcademicYear, standard: standard },
        headers
      });

      if (!res.data || res.data.length === 0) {
        toast.info("No book setup found for this class.");
        return [];
      }

      return Array.isArray(res.data) ? res.data.map(item => ({
        descriptionName: item.descriptionName || item.book_id,
        requiredQty: parseInt(item.requiredQty) || parseInt(item.quantity) || 1,
        amount: parseFloat(item.amount) || 0,
        currentStock: parseInt(item.currentStock) || 0
      })) : [];
    } catch (err) {
      console.error("Setup items fetch error:", err);
      toast.error("Failed to load setup items.");
      return [];
    }
  };

  const calculatePendingItems = (setupData, historyData) => {
    if (!setupData || setupData.length === 0) {
      setGridItems([]);
      return;
    }

    const distributedMap = {};
    historyData.forEach(h => {
      if (h.descriptionName && h.quantity > 0) {
        const key = h.descriptionName.toString().trim().toLowerCase();
        distributedMap[key] = (distributedMap[key] || 0) + h.quantity;
      }
    });

    const pendingItems = setupData
      .map((item, idx) => {
        if (!item.descriptionName) return null;
        
        const setupKey = item.descriptionName.toString().trim().toLowerCase();
        const requiredQty = item.requiredQty || 1;
        const distributedQty = distributedMap[setupKey] || 0;
        const remainingQty = requiredQty - distributedQty;

        if (remainingQty <= 0) return null;

        const currentStock = item.currentStock || 0;
        const issueQty = Math.min(remainingQty, currentStock);
        const isOutOfStock = issueQty === 0;

        return {
          id: Date.now() + idx,
          descriptionName: item.descriptionName,
          quantity: issueQty,
          amount: item.amount || 0,
          total: issueQty * (item.amount || 0),
          isOutOfStock,
          currentStock,
          originalSetupQty: requiredQty,
          distributedSoFar: distributedQty,
          remainingQty: remainingQty
        };
      })
      .filter(Boolean);

    setGridItems(pendingItems);

    if (pendingItems.length === 0 && setupData.length > 0) {
      toast.success("All books have been successfully distributed!");
    }
  };

  const grossTotal = showAmount ? gridItems.reduce((sum, item) => sum + item.total, 0) : 0;
  const concession = parseFloat(concessionAmount) || 0;
  const netPayable = grossTotal - concession;

  const handleRemoveItem = (id) => {
    setGridItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    const itemsToSave = gridItems.filter(item => item.quantity > 0);
    if (itemsToSave.length === 0) {
      toast.warning("No items to distribute.");
      return;
    }

    if (paymode === "Bank Transfer" && !selectedBankAccount) {
      toast.error("Please select a bank account for Bank Transfer");
      return;
    }

    if ((paymode === "Cheque" || paymode === "DD" || paymode === "Online") && !ddCheckNo.trim()) {
      toast.error(`Please enter ${paymode} reference number`);
      return;
    }

    setIsSaving(true);

    const finalItems = itemsToSave.map(item => ({
      descriptionName: item.descriptionName,
      quantity: item.quantity,
      amount: showAmount ? item.amount : 0
    }));

    const selectedBank = bankAccounts.find(acc => acc.id.toString() === selectedBankAccount.toString());
    
    const payload = {
      admissionNo: studentDetails.admissionNo,
      studentName: studentDetails.studentName,
      standard: studentDetails.standard,
      section: studentDetails.section,
      feeDate: feeDate,
      paymode: paymode,
      ddcheckNo: ddCheckNo,
      concessionAmount: showAmount ? concession : 0,
      operatorNo: user.username || "Admin",
      items: finalItems,
      bankAccountDetails: paymode === "Bank Transfer" ? {
        bankAccountId: selectedBankAccount,
        bankAccountInfo: selectedBank
      } : null
    };

    try {
      const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
      const res = await axios.post(`${ENDPOINTS.store}/distribute/save`, payload, {
        params: { schoolId: user.uid, academicYear: currentAcademicYear },
        headers
      });

      const savedBillNo = res.data.billNo || currentBillNumber;
      
      toast.success("Distribution saved successfully!");
      setReceiptData({
        billNo: savedBillNo,
        ...payload,
        grossTotal,
        netPayable,
        billTime: new Date().toLocaleTimeString('en-IN', { hour12: true }),
        showAmount,
        selectedBankAccount: selectedBank
      });
      setShowReceipt(true);
      setConcessionAmount("");
      setSelectedBankAccount("");
      setDdCheckNo("");

      await loadStudentData(studentDetails.admissionNo, studentDetails.standard);
      generateBillNumber();
      
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setAdmissionNoSearch("");
    setStudentDetails({ admissionNo: "", studentName: "", standard: "", section: "" });
    setDistributeHistory([]);
    setGridItems([]);
    setPaymode("Cash");
    setDdCheckNo("");
    setConcessionAmount("");
    setSelectedBankAccount("");
    generateBillNumber();
  };

  // Convert number to words (Indian Rupees)
  const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if ((num = num.toString()).length > 9) return 'Overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    
    let str = '';
    str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only ' : '';
    return str.trim() + ' Only';
  };

  // Generate professional PDF receipt
  const downloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 150] // Small receipt size like thermal printer
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 5;
      const contentWidth = pageWidth - (margin * 2);

      // School Header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("YOUR SCHOOL NAME", pageWidth / 2, 10, { align: "center" });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("School Address Line 1", pageWidth / 2, 15, { align: "center" });
      doc.text("City, State - PINCODE", pageWidth / 2, 19, { align: "center" });
      
      // Title
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("BOOK RECEIPT", pageWidth / 2, 25, { align: "center" });
      
      // Divider line
      doc.setDrawColor(0);
      doc.setLineWidth(0.2);
      doc.line(margin, 27, pageWidth - margin, 27);
      
      // Receipt details
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      let yPos = 32;
      
      // Bill No and Date
      doc.text(`Bill No: ${receiptData?.billNo || 'N/A'}`, margin, yPos);
      doc.text(`Date: ${formatDate(receiptData?.feeDate)}`, pageWidth - margin, yPos, { align: "right" });
      yPos += 6;
      
      // Student Details
      doc.text(`Student: ${receiptData?.studentName || 'N/A'}`, margin, yPos);
      yPos += 4;
      doc.text(`Adm No: ${receiptData?.admissionNo || 'N/A'}`, margin, yPos);
      doc.text(`Class: ${receiptData?.standard || 'N/A'} - ${receiptData?.section || 'N/A'}`, pageWidth - margin, yPos, { align: "right" });
      yPos += 6;
      
      // Items table header
      doc.setFont("helvetica", "bold");
      doc.text("Description", margin, yPos);
      doc.text("Amount", pageWidth - margin, yPos, { align: "right" });
      yPos += 4;
      
      doc.setDrawColor(0);
      doc.setLineWidth(0.1);
      doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
      
      // Items
      doc.setFont("helvetica", "normal");
      (receiptData?.items || []).forEach((item, index) => {
        if (yPos > 120) {
          doc.addPage();
          yPos = 20;
        }
        
        const itemName = item.descriptionName.length > 25 ? 
          item.descriptionName.substring(0, 25) + '...' : item.descriptionName;
        
        doc.text(`${index + 1}. ${itemName}`, margin, yPos);
        doc.text(`Rs. ${parseFloat(item.amount || 0).toFixed(2)}`, pageWidth - margin, yPos, { align: "right" });
        yPos += 4;
      });
      
      // Total line
      yPos += 2;
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 4;
      
      doc.setFont("helvetica", "bold");
      doc.text("Total:", margin, yPos);
      doc.text(`Rs. ${grossTotal.toFixed(2)}`, pageWidth - margin, yPos, { align: "right" });
      
      if (concession > 0) {
        yPos += 4;
        doc.setFont("helvetica", "normal");
        doc.text("Less Concession:", margin, yPos);
        doc.text(`- Rs. ${concession.toFixed(2)}`, pageWidth - margin, yPos, { align: "right" });
      }
      
      yPos += 4;
      doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
      
      // Net Payable
      doc.setFont("helvetica", "bold");
      doc.text("Net Payable:", margin, yPos);
      doc.text(`Rs. ${netPayable.toFixed(2)}`, pageWidth - margin, yPos, { align: "right" });
      yPos += 6;
      
      // Amount in Words
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      const amountInWords = numberToWords(Math.floor(netPayable));
      const wordsLines = doc.splitTextToSize(`Rupees ${amountInWords}`, contentWidth);
      doc.text(wordsLines, margin, yPos);
      yPos += (wordsLines.length * 3) + 4;
      
      // Payment Mode
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      let paymentInfo = `Payment Mode: ${receiptData?.paymode || 'Cash'}`;
      if (receiptData?.ddcheckNo) {
        paymentInfo += ` (Ref No: ${receiptData.ddcheckNo})`;
      }
      doc.text(paymentInfo, margin, yPos);
      yPos += 4;
      
      // Bank Details if Bank Transfer
      if (receiptData?.paymode === "Bank Transfer" && receiptData?.selectedBankAccount) {
        doc.text(`Bank: ${receiptData.selectedBankAccount.bankName}`, margin, yPos);
        yPos += 3;
        doc.text(`A/c: ${receiptData.selectedBankAccount.accountNumber}`, margin, yPos);
        yPos += 3;
      }
      
      // Time stamp
      yPos += 6;
      doc.setFontSize(8);
      doc.text(`Time: ${receiptData?.billTime || ''}`, margin, yPos);
      
      // Footer
      yPos += 10;
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.text("Signature of the Accountant", pageWidth / 2, yPos, { align: "center" });
      yPos += 4;
      doc.text("Software Developed & Maintained by XPO MEDIA", pageWidth / 2, yPos, { align: "center" });
      
      const fileName = `Book-Receipt-${receiptData?.billNo || 'receipt'}.pdf`;
      doc.save(fileName);
      toast.success("Receipt downloaded successfully!");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  // Print receipt
  const printReceipt = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Book Receipt - ${receiptData?.billNo}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', Arial, sans-serif; }
          body { padding: 15px; background: #fff; color: #000; font-size: 12px; }
          .receipt { max-width: 300px; margin: 0 auto; border: 1px solid #000; padding: 15px; }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .school-name { font-size: 16px; font-weight: bold; margin-bottom: 3px; }
          .school-address { font-size: 10px; color: #666; margin-bottom: 5px; }
          .receipt-title { font-size: 14px; font-weight: bold; text-transform: uppercase; }
          .details { margin: 15px 0; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .detail-label { font-weight: bold; }
          .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .items-table th { text-align: left; border-bottom: 1px solid #000; padding: 5px 0; }
          .items-table td { padding: 4px 0; border-bottom: 1px solid #eee; }
          .total-row { border-top: 2px solid #000; font-weight: bold; }
          .amount-in-words { font-style: italic; margin: 10px 0; padding: 8px; background: #f5f5f5; border-radius: 4px; font-size: 10px; }
          .payment-info { margin: 10px 0; padding: 8px; background: #f0f8ff; border-radius: 4px; }
          .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
          .signature { margin-top: 25px; text-align: center; }
          .signature-line { border-top: 1px solid #000; width: 200px; margin: 0 auto 5px; }
          @media print { 
            body { padding: 0; margin: 0; } 
            .receipt { border: none; max-width: 100%; }
            @page { margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="school-name">YOUR SCHOOL NAME</div>
            <div class="school-address">School Address, City - PINCODE</div>
            <div class="receipt-title">BOOK RECEIPT</div>
          </div>
          
          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Bill No:</span>
              <span>${receiptData?.billNo || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span>${formatDate(receiptData?.feeDate)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Student Name:</span>
              <span>${receiptData?.studentName || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Admission No:</span>
              <span>${receiptData?.admissionNo || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Class & Section:</span>
              <span>${receiptData?.standard || 'N/A'} - ${receiptData?.section || 'N/A'}</span>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              ${(receiptData?.items || []).map((item, idx) => `
                <tr>
                  <td>${idx + 1}. ${item.descriptionName}</td>
                  <td style="text-align: right;">${parseFloat(item.amount || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td>Total</td>
                <td style="text-align: right;">${grossTotal.toFixed(2)}</td>
              </tr>
              ${concession > 0 ? `
                <tr>
                  <td>Less Concession</td>
                  <td style="text-align: right; color: #dc3545;">- ${concession.toFixed(2)}</td>
                </tr>
              ` : ''}
              <tr class="total-row">
                <td>Net Payable</td>
                <td style="text-align: right; font-size: 14px;">Rs. ${netPayable.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="amount-in-words">
            <strong>Amount in Words:</strong><br>
            Rupees ${numberToWords(Math.floor(netPayable))}
          </div>
          
          <div class="payment-info">
            <strong>Payment Mode:</strong> ${receiptData?.paymode || 'Cash'}
            ${receiptData?.ddcheckNo ? `<br><strong>Reference No:</strong> ${receiptData.ddcheckNo}` : ''}
            ${receiptData?.paymode === "Bank Transfer" && receiptData?.selectedBankAccount ? `
              <br><strong>Bank:</strong> ${receiptData.selectedBankAccount.bankName}
              <br><strong>Account:</strong> ${receiptData.selectedBankAccount.accountNumber}
            ` : ''}
          </div>
          
          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span>${receiptData?.billTime || ''}</span>
            </div>
          </div>
          
          <div class="signature">
            <div class="signature-line"></div>
            <div>Signature of the Accountant</div>
          </div>
          
          <div class="footer">
            Software Developed & Maintained by XPO MEDIA<br>
            Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </div>
        </div>
        
        <script>
          window.onload = function() { 
            setTimeout(function() { 
              window.print(); 
              setTimeout(function() { window.close(); }, 500);
            }, 100);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <ToastContainer />
        
        <div className="form-card mt-3">
          <div className="header p-3 text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: "#0B3D7B" }}>
            <h4 className="m-0 fw-bold">
              <FaUniversity className="me-2" />
              Book Distribution
            </h4>
            <div className="d-flex align-items-center gap-3">
              <div className="bg-white text-dark p-2 rounded shadow">
                <span className="fw-bold me-2">Bill No:</span>
                <span className="text-primary fw-bold">{currentBillNumber}</span>
              </div>
              <Form.Check 
                type="switch" 
                label="Show Amount" 
                checked={showAmount} 
                onChange={e => setShowAmount(e.target.checked)} 
                className="text-white" 
              />
            </div>
          </div>

          <div className="p-4">
            <Row className="mb-3 g-3">
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="fw-bold">Date</Form.Label>
                  <Form.Control type="date" value={feeDate} onChange={e => setFeeDate(e.target.value)} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-bold">Admission No.</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Type & Press Enter"
                      value={admissionNoSearch}
                      onChange={e => setAdmissionNoSearch(e.target.value)}
                      onKeyDown={handleSearchStudent}
                      disabled={loadingStudent}
                    />
                    <InputGroup.Text>{loadingStudent ? <Spinner size="sm" /> : <FaSearch />}</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-bold">Student Name</Form.Label>
                  <Form.Control value={studentDetails.studentName} readOnly className="bg-light" />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="fw-bold">Standard</Form.Label>
                  <Form.Control value={studentDetails.standard} readOnly className="bg-light" />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="fw-bold">Section</Form.Label>
                  <Form.Control value={studentDetails.section} readOnly className="bg-light" />
                </Form.Group>
              </Col>
            </Row>

            <hr />

            {/* History Table */}
            <h6 className="fw-bold text-primary mb-3">
              <FaUniversity className="me-2" />
              Distribution History
            </h6>
            <div className="table-responsive mb-4" style={{ maxHeight: "200px", overflowY: "auto" }}>
              <Table hover size="sm" className="table-bordered">
                <thead className="bg-light">
                  <tr>
                    <th>Date</th>
                    <th>Bill No</th>
                    <th>Item</th>
                    <th className="text-center">Qty</th>
                    <th>Payment Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {distributeHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-3">
                        No distribution history found.
                      </td>
                    </tr>
                  ) : (
                    distributeHistory.map((item, i) => (
                      <tr key={i}>
                        <td>{formatDate(item.feeDate)}</td>
                        <td className="fw-bold text-primary">{item.billNo}</td>
                        <td className="small">{item.descriptionName}</td>
                        <td className="text-center">{item.quantity}</td>
                        <td>
                          <span className="badge bg-info">{item.paymode || "Cash"}</span>
                          {item.ddcheckNo && <small className="d-block">Ref: {item.ddcheckNo}</small>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>

            {/* Items to Issue */}
            <h6 className="fw-bold text-primary mb-3">
              Items to Issue (Pending)
            </h6>
            <div className="table-responsive mb-4">
              <Table hover className="table-bordered">
                <thead className="bg-light">
                  <tr>
                    <th width="5%">#</th>
                    <th width="45%">Description</th>
                    <th width="10%" className="text-center">Stock</th>
                    <th width="10%" className="text-center">Qty</th>
                    {showAmount && <th width="15%" className="text-end">Rate (Rs.)</th>}
                    {showAmount && <th width="15%" className="text-end">Total (Rs.)</th>}
                    <th width="5%" className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {gridItems.length === 0 ? (
                    <tr>
                      <td colSpan={showAmount ? 7 : 5} className="text-center text-muted py-4">
                        {studentDetails.admissionNo ? "All books distributed or no pending items." : "Search a student to load items."}
                      </td>
                    </tr>
                  ) : (
                    gridItems.map((item, i) => (
                      <tr key={item.id} className={item.isOutOfStock ? "table-danger" : ""}>
                        <td className="text-center">{i + 1}</td>
                        <td>
                          <div>{item.descriptionName}</div>
                          {item.distributedSoFar > 0 && (
                            <small className="text-muted">
                              Already distributed: {item.distributedSoFar}, Pending: {item.remainingQty}
                            </small>
                          )}
                        </td>
                        <td className={`text-center fw-bold ${item.currentStock < item.quantity ? 'text-danger' : ''}`}>
                          {item.currentStock}
                        </td>
                        <td className="text-center fw-bold">{item.quantity}</td>
                        {showAmount && <td className="text-end">Rs. {item.amount.toFixed(2)}</td>}
                        {showAmount && <td className="text-end fw-bold">Rs. {item.total.toFixed(2)}</td>}
                        <td className="text-center">
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={gridItems.length === 1}
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>

            {/* Payment Section */}
            {showAmount && (
              <Row className="mt-4">
                <Col md={8}>
                  <Card className="shadow-sm">
                    <Card.Body>
                      <h6 className="fw-bold text-primary mb-3">Payment Details</h6>
                      <Row className="g-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-bold">Payment Mode</Form.Label>
                            <Form.Select 
                              value={paymode} 
                              onChange={e => {
                                setPaymode(e.target.value);
                                if (e.target.value !== "Bank Transfer") setSelectedBankAccount("");
                                if (e.target.value === "Cash") setDdCheckNo("");
                              }}
                            >
                              <option value="Cash">Cash</option>
                              <option value="Cheque">Cheque</option>
                              <option value="DD">DD</option>
                              <option value="Online">Online</option>
                              <option value="Bank Transfer">Bank Transfer</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        
                        {/* Show reference number field for Cheque, DD, and Online */}
                        {(paymode === "Cheque" || paymode === "DD" || paymode === "Online") && (
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="fw-bold">
                                {paymode === "Cheque" ? "Cheque No." : 
                                 paymode === "DD" ? "DD No." : 
                                 "Transaction/UTR No."}
                              </Form.Label>
                              <Form.Control 
                                type="text" 
                                value={ddCheckNo} 
                                onChange={e => setDdCheckNo(e.target.value)}
                                placeholder={`Enter ${paymode === "Cheque" ? "Cheque" : 
                                             paymode === "DD" ? "DD" : 
                                             "Transaction/UTR"} Number`}
                                required
                              />
                            </Form.Group>
                          </Col>
                        )}

                        {paymode === "Bank Transfer" && (
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="fw-bold">
                                Bank Account 
                                {loadingBankAccounts && <Spinner size="sm" className="ms-2" />}
                              </Form.Label>
                              <Form.Select
                                value={selectedBankAccount}
                                onChange={e => setSelectedBankAccount(e.target.value)}
                                disabled={loadingBankAccounts || bankAccounts.length === 0}
                                required
                              >
                                <option value="">Select Bank Account</option>
                                {bankAccounts.map(account => (
                                  <option key={account.id} value={account.id}>
                                    {account.bankName} - {account.accountNumber}
                                  </option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        )}

                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-bold">Concession Amount (Rs.)</Form.Label>
                            <Form.Control 
                              type="number" 
                              value={concessionAmount} 
                              onChange={e => setConcessionAmount(e.target.value)} 
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                            />
                          </Form.Group>
                        </Col>

                        {paymode === "Bank Transfer" && selectedBankAccount && (
                          <Col md={12}>
                            <Alert variant="info" className="py-2 mb-0">
                              <Row>
                                <Col md={4}>
                                  <small><strong>Bank:</strong> {bankAccounts.find(acc => acc.id.toString() === selectedBankAccount.toString())?.bankName}</small>
                                </Col>
                                <Col md={4}>
                                  <small><strong>Account:</strong> {bankAccounts.find(acc => acc.id.toString() === selectedBankAccount.toString())?.accountNumber}</small>
                                </Col>
                                <Col md={4}>
                                  <small><strong>IFSC:</strong> {bankAccounts.find(acc => acc.id.toString() === selectedBankAccount.toString())?.ifscCode}</small>
                                </Col>
                              </Row>
                            </Alert>
                          </Col>
                        )}
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={4}>
                  <Card className="shadow-sm border-success">
                    <Card.Body>
                      <h6 className="fw-bold text-success mb-3">Bill Summary</h6>
                      <div className="mb-2">
                        <div className="d-flex justify-content-between mb-1">
                          <span>Gross Total:</span>
                          <span className="fw-bold">Rs. {grossTotal.toFixed(2)}</span>
                        </div>
                        {concession > 0 && (
                          <div className="d-flex justify-content-between mb-1 text-danger">
                            <span>Less Concession:</span>
                            <span>- Rs. {concession.toFixed(2)}</span>
                          </div>
                        )}
                        <hr className="my-2" />
                        <div className="d-flex justify-content-between h5 mb-0">
                          <span>Net Payable:</span>
                          <span className="fw-bold text-success">Rs. {netPayable.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-top">
                        <small className="text-muted d-block">
                          <strong>Payment Mode:</strong> {paymode}
                          {ddCheckNo && <span className="ms-2">(Ref: {ddCheckNo})</span>}
                        </small>
                        <small className="text-muted d-block mt-1">
                          <strong>Items:</strong> {gridItems.length}
                        </small>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Action Buttons */}
            <Row className="mt-4">
              <Col className="text-end">
                <Button
                  variant="success"
                  size="lg"
                  className="px-5 fw-bold"
                  onClick={handleSave}
                  disabled={isSaving || gridItems.reduce((sum, item) => sum + item.quantity, 0) === 0}
                >
                  {isSaving ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      SAVING...
                    </>
                  ) : (
                    "SAVE & GENERATE RECEIPT"
                  )}
                </Button>
                <Button
                  variant="outline-secondary"
                  size="lg"
                  className="px-5 ms-3"
                  onClick={resetForm}
                >
                  RESET
                </Button>
              </Col>
            </Row>
          </div>
        </div>

        {/* Professional Receipt Modal */}
        <Modal show={showReceipt} onHide={() => setShowReceipt(false)} size="md" centered backdrop="static">
          <Modal.Header closeButton className="bg-primary text-white border-0">
            <Modal.Title className="fw-bold">
              <FaUniversity className="me-2" />
              Book Receipt
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-0">
            <div className="receipt-print p-4" ref={receiptRef}>
              {/* Professional Receipt Design */}
              <div className="text-center mb-3">
                <h4 className="fw-bold mb-1" style={{ color: "#0B3D7B" }}>YOUR SCHOOL NAME</h4>
                <p className="small text-muted mb-2">School Address, City - PINCODE</p>
                <h5 className="fw-bold border-top border-bottom py-2">BOOK RECEIPT</h5>
              </div>
              
              <div className="receipt-details mb-3">
                <Row>
                  <Col xs={6}><strong>Bill No:</strong></Col>
                  <Col xs={6} className="text-end fw-bold text-primary">{receiptData?.billNo}</Col>
                </Row>
                <Row>
                  <Col xs={6}><strong>Date:</strong></Col>
                  <Col xs={6} className="text-end">{formatDate(receiptData?.feeDate)}</Col>
                </Row>
                <Row>
                  <Col xs={6}><strong>Student Name:</strong></Col>
                  <Col xs={6} className="text-end">{receiptData?.studentName}</Col>
                </Row>
                <Row>
                  <Col xs={6}><strong>Admission No:</strong></Col>
                  <Col xs={6} className="text-end">{receiptData?.admissionNo}</Col>
                </Row>
                <Row>
                  <Col xs={6}><strong>Class & Section:</strong></Col>
                  <Col xs={6} className="text-end">{receiptData?.standard} - {receiptData?.section}</Col>
                </Row>
              </div>
              
              <table className="table table-sm table-bordered mb-3">
                <thead className="bg-light">
                  <tr>
                    <th width="5%">#</th>
                    <th>Description</th>
                    <th width="25%" className="text-end">Amount (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  {(receiptData?.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="text-center">{idx + 1}</td>
                      <td className="small">{item.descriptionName}</td>
                      <td className="text-end">{parseFloat(item.amount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="table-light">
                    <td colSpan="2" className="text-end fw-bold">Total:</td>
                    <td className="text-end fw-bold">Rs. {grossTotal.toFixed(2)}</td>
                  </tr>
                  {concession > 0 && (
                    <tr>
                      <td colSpan="2" className="text-end text-danger">Less Concession:</td>
                      <td className="text-end text-danger">- Rs. {concession.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="table-success">
                    <td colSpan="2" className="text-end fw-bold">Net Payable:</td>
                    <td className="text-end fw-bold">Rs. {netPayable.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              
              <div className="amount-in-words mb-3 p-2 bg-light rounded">
                <small className="fw-bold">Amount in Words:</small>
                <div className="small" style={{ fontStyle: 'italic' }}>
                  Rupees {numberToWords(Math.floor(netPayable))}
                </div>
              </div>
              
              <div className="payment-details mb-3 p-2 border rounded">
                <div className="mb-1">
                  <strong>Payment Mode:</strong> {receiptData?.paymode || 'Cash'}
                  {receiptData?.ddcheckNo && ` (Ref: ${receiptData.ddcheckNo})`}
                </div>
                {receiptData?.paymode === "Bank Transfer" && receiptData?.selectedBankAccount && (
                  <div className="mt-2">
                    <div><strong>Bank:</strong> {receiptData.selectedBankAccount.bankName}</div>
                    <div><strong>Account No:</strong> {receiptData.selectedBankAccount.accountNumber}</div>
                    <div><strong>IFSC:</strong> {receiptData.selectedBankAccount.ifscCode}</div>
                  </div>
                )}
                <div className="mt-2 text-muted">
                  <small><strong>Time:</strong> {receiptData?.billTime}</small>
                </div>
              </div>
              
              <div className="signature-section text-center mt-4 pt-3 border-top">
                <div className="signature-line mb-1" style={{ borderTop: '1px solid #000', width: '200px', margin: '0 auto' }}></div>
                <div className="small fw-bold">Signature of the Accountant</div>
              </div>
              
              <div className="footer text-center mt-3 pt-2 border-top">
                <small className="text-muted">
                  Software Developed & Maintained by XPO MEDIA<br/>
                  Generated on {new Date().toLocaleDateString()}
                </small>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-top-0 bg-light">
            <Button variant="outline-secondary" onClick={() => setShowReceipt(false)}>
              <FaTimes className="me-2" />
              Close
            </Button>
            <Button variant="outline-primary" onClick={printReceipt}>
              <FaPrint className="me-2" />
              Print Receipt
            </Button>
            <Button variant="success" onClick={downloadPDF}>
              <FaFilePdf className="me-2" />
              Download PDF
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>

      <style>
        {`
        .form-card {
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header {
          background: linear-gradient(135deg, #0B3D7B 0%, #1059b0 100%);
        }
        
        .receipt-print {
          background: #fff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .receipt-details {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #dee2e6;
        }
        
        .amount-in-words {
          background: #f8f9fa;
          border-left: 4px solid #0B3D7B;
        }
        
        .payment-details {
          background: #f0f8ff;
          border: 1px solid #cfe2ff;
        }
        
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-print, .receipt-print * {
            visibility: visible;
          }
          .receipt-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
        }
        
        .table-sm th, .table-sm td {
          padding: 8px 10px;
        }
        
        .btn {
          border-radius: 6px;
          font-weight: 500;
        }
        
        .btn-success {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          border: none;
        }
        
        .btn-success:hover {
          background: linear-gradient(135deg, #218838 0%, #1ba87e 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(40, 167, 69, 0.2);
        }
        
        .modal-content {
          border-radius: 12px;
          overflow: hidden;
        }
        
        .modal-header {
          padding: 15px 20px;
        }
        
        .modal-body {
          padding: 0;
        }
        
        .modal-footer {
          padding: 15px 20px;
        }
        `}
      </style>
    </MainContentPage>
  );
};

export default BookDistribute;