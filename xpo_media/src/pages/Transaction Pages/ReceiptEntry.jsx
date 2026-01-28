"use client"

import React, { useState, useEffect, useRef } from 'react';
import MainContentPage from '../../components/MainContent/MainContentPage';
import { Link } from "react-router-dom";
import { useAuthContext } from '../../Context/AuthContext';
import { ENDPOINTS } from '../../SpringBoot/config';
import { Modal, Button, Spinner, Table } from 'react-bootstrap';
import { FaPrint, FaSearch, FaEye, FaPlus, FaTimes, FaPaperPlane } from 'react-icons/fa';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ReceiptEntry = () => {
  const { 
    schoolId, 
    currentAcademicYear, 
    getAuthHeaders,
    isAuth,
    user,
    admin
  } = useAuthContext();
  
  const [receiptMode, setReceiptMode] = useState('cash');
  const [receiptNo, setReceiptNo] = useState('');
  const [receiptMainHeads, setReceiptMainHeads] = useState([]);
  const [selectedMainHead, setSelectedMainHead] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    personName: '',
    description: '',
    receiptMode: 'cash',
    referenceId: '',
    amount: ''
  });
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [schoolInfo, setSchoolInfo] = useState({});
  const [schoolPhoto, setSchoolPhoto] = useState(null);
  
  // Search functionality states
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchReceiptNo, setSearchReceiptNo] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Loading state specifically for the dropdown
  const [isHeadsLoading, setIsHeadsLoading] = useState(false);

  // --- 1. FETCH CATEGORIES (Heads) ---
  const fetchReceiptMainHeads = async () => {
    if (!schoolId || !currentAcademicYear) return;
    
    setIsHeadsLoading(true);
    try {
      const response = await fetch(
        `${ENDPOINTS.administration}/receiptsetup/heads`,
        { 
            headers: {
                ...getAuthHeaders(),
                "X-School-Id": schoolId,
                "X-Academic-Year": currentAcademicYear
            }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
            setReceiptMainHeads(data);
        } else {
            console.error("API returned unexpected format for heads:", data);
            setReceiptMainHeads([]);
        }
      } else {
        throw new Error("Failed to load categories");
      }
    } catch (error) {
      console.error('Error fetching receipt main heads:', error);
      toast.error("Failed to load categories. Please check network.");
      setReceiptMainHeads([]);
    } finally {
      setIsHeadsLoading(false);
    }
  };

  // --- 2. GENERATE RECEIPT NO ---
  const generateReceiptNo = async () => {
    try {
      const response = await fetch(
        `${ENDPOINTS.transaction}/receiptentry/last-receipt?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        { headers: getAuthHeaders() }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.lastReceiptNo) {
          // Parse the last receipt number (In0001 format)
          let lastNumber = 0;
          if (data.lastReceiptNo && data.lastReceiptNo.startsWith('In')) {
            const numericPart = data.lastReceiptNo.substring(2);
            lastNumber = parseInt(numericPart) || 0;
          }
          
          let nextNumber = lastNumber + 1;
          
          if (nextNumber > 5000) {
            nextNumber = 1; // Reset logic
          }
          
          setReceiptNo(`In${nextNumber.toString().padStart(4, '0')}`);
        } else {
          setReceiptNo('In0001');
        }
      } else {
        setReceiptNo('In0001');
      }
    } catch (error) {
      console.error('Error generating receipt number:', error);
      // Fallback method via count
      try {
        const countResponse = await fetch(
          `${ENDPOINTS.transaction}/receiptentry/count?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
          { headers: getAuthHeaders() }
        );
        if (countResponse.ok) {
          const countData = await countResponse.json();
          const nextNumber = ((countData.count || 0) % 5000) + 1;
          setReceiptNo(`In${nextNumber.toString().padStart(4, '0')}`);
        } else {
          setReceiptNo('In0001');
        }
      } catch {
        setReceiptNo('In0001');
      }
    }
  };

  // --- 3. FETCH SCHOOL INFO ---
  const fetchSchoolInfo = async () => {
    if (!schoolId) return;
    
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/school/school-details?schoolId=${schoolId}`,
        { headers: getAuthHeaders() }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSchoolInfo({
          name: data.schoolName || data.name || "School Name",
          address: data.address || data.schoolAddress || "School Address"
        });
        
        if (data.profileImage) {
          let profileImageBase64 = "";
          
          if (typeof data.profileImage === 'string') {
            const imageType = data.profileImageType || "image/jpeg";
            profileImageBase64 = `data:${imageType};base64,${data.profileImage}`;
          } else if (Array.isArray(data.profileImage)) {
            const byteArray = new Uint8Array(data.profileImage);
            const binaryString = String.fromCharCode.apply(null, byteArray);
            const base64 = btoa(binaryString);
            const imageType = data.profileImageType || "image/jpeg";
            profileImageBase64 = `data:${imageType};base64,${base64}`;
          }
          
          setSchoolPhoto(profileImageBase64);
        }
      }
    } catch (error) {
      console.error('Error fetching school info:', error);
      setSchoolInfo({
        name: "School Name",
        address: "School Address"
      });
    }
  };

  // --- 4. SEARCH LOGIC ---
  const searchReceiptByReceiptNo = async () => {
  if (!schoolId || !currentAcademicYear || !searchReceiptNo) return;
  
  setSearchLoading(true);
  try {
    // Ensure receipt number is in correct format
    let receiptNoToSearch = searchReceiptNo.trim();
    if (!receiptNoToSearch.toUpperCase().startsWith('IN')) {
      receiptNoToSearch = 'In' + receiptNoToSearch.replace(/[^0-9]/g, '');
    }
    
    const response = await fetch(
      `${ENDPOINTS.transaction}/receiptentry/search-by-receiptno?schoolId=${schoolId}&academicYear=${currentAcademicYear}&receiptNo=${receiptNoToSearch}`,
      { headers: getAuthHeaders() }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.success === false || !data.receipt) {
        toast.error(data.message || "Receipt entry not found");
        setSearchResult(null);
      } else {
        // Ensure receipt number is formatted correctly
        const receipt = data.receipt;
        if (receipt.receiptNo && !receipt.receiptNo.toString().toLowerCase().includes('in')) {
          receipt.receiptNo = `In${receipt.receiptNo.toString().padStart(4, '0')}`;
        }
        setSearchResult(receipt);
      }
    } else {
      const errorData = await response.json();
      setSearchResult(null);
      toast.error(errorData.error || 'Receipt not found');
    }
  } catch (error) {
    console.error('Error searching receipt:', error);
    setSearchResult(null);
    toast.error('Error searching receipt');
  } finally {
    setSearchLoading(false);
  }
};

  const clearSearch = () => {
    setSearchReceiptNo('');
    setSearchResult(null);
    setIsSearchMode(false);
  };

  const switchToSearchMode = () => {
    setIsSearchMode(true);
    setSearchResult(null);
    setSearchReceiptNo('');
  };

  const switchToEntryMode = () => {
    setIsSearchMode(false);
    setSearchResult(null);
    setSearchReceiptNo('');
    generateReceiptNo();
  };

  useEffect(() => {
    if (isAuth && schoolId && currentAcademicYear) {
      generateReceiptNo();
      fetchReceiptMainHeads();
      fetchSchoolInfo();
    }
  }, [isAuth, schoolId, currentAcademicYear, user, admin]);

  const handleReceiptModeChange = (e) => {
    const mode = e.target.value;
    setReceiptMode(mode);
    setFormData(prev => ({
      ...prev,
      receiptMode: mode,
      referenceId: mode === 'cash' ? '' : prev.referenceId
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // --- 5. HANDLE CATEGORY SELECTION ---
  const handleMainHeadChange = (e) => {
    const selectedValue = e.target.value;
    setSelectedMainHead(selectedValue);
    
    setFormData(prev => ({
      ...prev,
      category: selectedValue
    }));
  };

  // --- 6. SUBMIT LOGIC ---
  const handleSubmit = async () => {
    if (!schoolId || !currentAcademicYear) {
      toast.error('School ID or Academic Year not available.');
      return;
    }

    if (!formData.amount || !formData.personName || !selectedMainHead) {
      toast.error('Please fill all required fields: Amount, Person Name, and Category');
      return;
    }

    // Send receiptNo as string in "In0001" format
    const payload = {
      receiptNo: receiptNo, // Send as string "In0001"
      date: formData.date,
      category: selectedMainHead,
      personName: formData.personName,
      description: formData.description,
      receiptMode: formData.receiptMode,
      referenceId: formData.referenceId,
      amount: parseFloat(formData.amount),
      schoolId: schoolId,
      academicYear: currentAcademicYear
    };

    setLoading(true);
    try {
      const response = await fetch(`${ENDPOINTS.transaction}/receiptentry/save`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        setReceiptData({
          ...payload,
          receiptNo: receiptNo, // Keep In0001 format for display
          transactionId: result.transactionId || `TXN-${Date.now()}`
        });
        
        setShowReceipt(true);
        
        // Reset Form
        setFormData({
          date: new Date().toISOString().split('T')[0],
          category: '',
          personName: '',
          description: '',
          receiptMode: 'cash',
          referenceId: '',
          amount: ''
        });
        setSelectedMainHead('');
        generateReceiptNo();
        
        toast.success("Receipt saved successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        
      } else {
        throw new Error(result.error || 'Receipt submission failed');
      }
    } catch (error) {
      console.error('Error submitting receipt:', error);
      toast.error(`Error: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: '',
      personName: '',
      description: '',
      receiptMode: 'cash',
      referenceId: '',
      amount: ''
    });
    setSelectedMainHead('');
    setReceiptMode('cash');
  };

  const handleViewReceipt = (receipt) => {
    // Determine Receipt No format (handle both int and string)
    let displayNo = receipt.receiptNo;
    if(!displayNo.toString().toLowerCase().includes('in')) {
        displayNo = `In${receipt.receiptNo.toString().padStart(4, '0')}`;
    }

    setReceiptData({
      ...receipt,
      receiptNo: displayNo,
      transactionId: receipt.transactionId || `RCPT-${receipt.receiptNo}`
    });
    setShowReceipt(true);
  };

  // --- UTILS: NUM TO WORDS ---
  const numberToWords = (num) => {
    const units = [
      "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
      "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    if (!num) return "Zero";

    const intNum = Math.floor(Math.abs(num));

    const convertLessThanThousand = (n) => {
      if (n === 0) return "";
      if (n < 20) return units[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + units[n % 10] : "");
      return units[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " And " + convertLessThanThousand(n % 100) : "");
    };

    let result = "";
    const crore = Math.floor(intNum / 10000000);
    const lakh = Math.floor((intNum % 10000000) / 100000);
    const thousand = Math.floor((intNum % 100000) / 1000);
    const remainder = intNum % 1000;

    if (crore > 0) result += convertLessThanThousand(crore) + " Crore ";
    if (lakh > 0) result += convertLessThanThousand(lakh) + " Lakh ";
    if (thousand > 0) result += convertLessThanThousand(thousand) + " Thousand ";
    if (remainder > 0) result += convertLessThanThousand(remainder);

    return result.trim() || "Zero";
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  // --- PRINT LOGIC ---
  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    if (!printWindow) {
      alert('Please allow popups for printing');
      return;
    }

    const showReferenceNo = receiptData?.receiptMode && receiptData.receiptMode !== 'cash';
    const referenceNoSection = showReferenceNo ? `
      <div class="detail-box">
        <span class="detail-label">Reference No:</span>
        <span class="detail-value">${receiptData?.referenceId || 'N/A'}</span>
      </div>
    ` : '';

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receiptData?.receiptNo || 'receipt'}</title>
        <meta charset="UTF-8">
        <style>
          @media print {
            @page { 
              size: 210mm 148mm; 
              margin: 5mm;
            }
            body { 
              width: 200mm; 
              height: 138mm;
              margin: 0 auto; 
              font-family: 'Arial', sans-serif; 
              font-size: 12px;
              background: white;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            .receipt-container {
              width: 200mm !important;
              height: 138mm !important;
              margin: 0 auto !important;
              padding: 5mm !important;
              box-sizing: border-box;
              border: none !important;
              box-shadow: none !important;
              page-break-inside: avoid;
              page-break-after: avoid;
              overflow: hidden;
            }
          }
          
          .receipt-container { 
            width: 200mm; 
            height: 138mm;
            padding: 5mm;
            background: white;
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            color: #333;
            box-sizing: border-box;
            position: relative;
            margin: 0 auto;
            border: 1px solid #ddd;
          }
          .school-header { 
            text-align: center; 
            border-bottom: 2px solid #2c5aa0; 
            padding-bottom: 4px; 
            margin-bottom: 8px; 
          }
          .school-logo-container {
            width: 30px; 
            height: 30px; 
            border-radius: 50%; 
            border: 2px solid #2c5aa0;
            overflow: hidden;
            display: inline-block;
            vertical-align: middle;
            margin-right: 8px;
          }
          .school-logo { 
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .school-name { 
            font-size: 14px; 
            font-weight: bold; 
            color: #2c5aa0; 
            margin: 0;
            text-transform: uppercase;
            display: inline-block;
            vertical-align: middle;
          }
          .school-address { 
            font-size: 9px; 
            color: #666; 
            margin: 2px 0 0 0;
            font-weight: 500;
            line-height: 1.2;
          }
          .receipt-header-box {
            border: 1px solid #ddd;
            padding: 6px;
            margin-bottom: 8px;
            position: relative;
            height: 35px;
          }
          .receipt-no {
            position: absolute;
            left: 8px;
            top: 6px;
            font-weight: bold;
            color: #2c5aa0;
            font-size: 10px;
          }
          .receipt-no-value {
            position: absolute;
            left: 8px;
            top: 18px;
            font-size: 10px;
          }
          .receipt-title {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            font-size: 16px;
            font-weight: bold;
            color: #2c5aa0;
          }
          .receipt-date {
            position: absolute;
            right: 8px;
            top: 6px;
            font-weight: bold;
            color: #2c5aa0;
            font-size: 10px;
          }
          .receipt-date-value {
            position: absolute;
            right: 8px;
            top: 18px;
            font-size: 10px;
          }
          .detail-box {
            border: 1px solid #ddd;
            padding: 6px;
            margin-bottom: 6px;
            min-height: 28px;
            display: flex;
            align-items: flex-start;
          }
          .detail-label {
            font-weight: bold;
            color: #2c5aa0;
            width: 70px;
            flex-shrink: 0;
            font-size: 10px;
            line-height: 1.2;
          }
          .detail-value {
            flex: 1;
            font-size: 10px;
            line-height: 1.2;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          .amount-number {
            font-size: 12px;
            font-weight: bold;
            color: #28a745;
            margin-bottom: 2px;
          }
          .amount-words {
            font-style: italic;
            color: #666;
            font-size: 9px;
            line-height: 1.2;
          }
          .signature-section {
            margin-top: 15px;
            display: flex;
            justify-content: space-between;
          }
          .signature-box {
            text-align: center;
            width: 45%;
          }
          .signature-line {
            border-top: 1px solid #333;
            margin: 25px auto 3px auto;
            width: 80%;
          }
          .signature-label {
            font-weight: bold;
            color: #2c5aa0;
            font-size: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 10px;
            font-size: 8px;
            color: #666;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="school-header">
            <div style="margin-bottom: 4px;">
              ${schoolPhoto ? `<div class="school-logo-container">
                <img src="${schoolPhoto}" alt="School Logo" class="school-logo" />
              </div>` : ''}
              <div class="school-name">${schoolInfo?.name || "School Name"}</div>
            </div>
            <div class="school-address">${schoolInfo?.address || "School Address"}</div>
          </div>

          <div class="receipt-header-box">
            <div class="receipt-no">R.No:</div>
            <div class="receipt-no-value">${receiptData?.receiptNo || 'N/A'}</div>
            <div class="receipt-title">RECEIPT</div>
            <div class="receipt-date">Date:</div>
            <div class="receipt-date-value">${formatDate(receiptData?.date)}</div>
          </div>

          <div class="detail-box">
            <span class="detail-label">Category:</span>
            <span class="detail-value">${receiptData?.category || 'N/A'}</span>
          </div>

          <div class="detail-box">
            <span class="detail-label">Amount:</span>
            <span class="detail-value">
              <div class="amount-number">Rs ${parseFloat(receiptData?.amount || 0).toFixed(2)}</div>
              <div class="amount-words">
                <strong>In Words:</strong> ${numberToWords(parseFloat(receiptData?.amount || 0))} Only
              </div>
            </span>
          </div>

          ${referenceNoSection}

          ${receiptData?.description ? `
          <div class="detail-box">
            <span class="detail-label">Description:</span>
            <span class="detail-value">${receiptData.description}</span>
          </div>
          ` : ''}

          <div class="detail-box">
            <span class="detail-label">Received From:</span>
            <span class="detail-value">${receiptData?.personName || 'N/A'}</span>
          </div>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Accountant Signature</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Payer's Signature</div>
            </div>
          </div>

          <div class="footer">
            Computer Generated Receipt | Generated on ${new Date().toLocaleDateString('en-IN')}
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
  };

  const ReceiptModal = ({ show, onHide, receiptData, schoolInfo, schoolPhoto }) => {
    const receiptRef = useRef(null);

    if (!receiptData) {
      return null;
    }

    const showReferenceNo = receiptData?.receiptMode && receiptData.receiptMode !== 'cash';

    return (
      <Modal
        show={show}
        onHide={onHide}
        centered
        size="xl"
        style={{
          width: '210mm',
          maxWidth: '210mm',
          margin: '0 auto'
        }}
        contentClassName="modal-receipt-content"
      >
        <Modal.Header
          style={{
            backgroundColor: "#0B3D7B",
            borderBottom: "2px solid #dee2e6",
            padding: '12px',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            width: '100%'
          }}
          className="text-white"
        >
          <Modal.Title
            className="text-center w-100 mb-0"
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'white'
            }}
          >
            Receipt Preview
          </Modal.Title>
        </Modal.Header>

        <Modal.Body
          style={{
            padding: '0',
            width: '100%',
            maxHeight: '70vh',
            overflow: 'auto',
            position: 'relative',
            backgroundColor: '#f8f9fa',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start'
          }}
        >
          <div
            ref={receiptRef}
            style={{
              width: '210mm',
              minHeight: '148mm',
              background: 'white',
              padding: '10mm',
              fontFamily: "'Arial', sans-serif",
              fontSize: '12px',
              color: '#333',
              boxSizing: 'border-box',
              position: 'relative',
              margin: '20px auto',
              border: '1px solid #ddd',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ 
              textAlign: 'center', 
              borderBottom: '2px solid #2c5aa0', 
              paddingBottom: '4px', 
              marginBottom: '8px' 
            }}>
              <div style={{ marginBottom: '4px' }}>
                {schoolPhoto && (
                  <div style={{
                    width: '30px', 
                    height: '30px', 
                    borderRadius: '50%', 
                    border: '2px solid #2c5aa0',
                    overflow: 'hidden',
                    display: 'inline-block',
                    verticalAlign: 'middle',
                    marginRight: '8px'
                  }}>
                    <img 
                      src={schoolPhoto} 
                      alt="School Logo" 
                      style={{ 
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        console.error("School photo failed to load")
                        e.target.style.display = 'none'
                      }}
                    />
                  </div>
                )}
                <div style={{
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: '#2c5aa0', 
                  margin: 0,
                  textTransform: 'uppercase',
                  display: 'inline-block',
                  verticalAlign: 'middle'
                }}>
                  {schoolInfo?.name || "School Name"}
                </div>
              </div>
              <div style={{
                fontSize: '9px', 
                color: '#666', 
                margin: '2px 0 0 0',
                fontWeight: 500,
                lineHeight: '1.2'
              }}>
                {schoolInfo?.address || "School Address"}
              </div>
            </div>

            <div style={{
              border: '1px solid #ddd',
              padding: '6px',
              marginBottom: '8px',
              position: 'relative',
              height: '35px'
            }}>
              <div style={{
                position: 'absolute',
                left: '8px',
                top: '6px',
                fontWeight: 'bold',
                color: '#2c5aa0',
                fontSize: '10px'
              }}>R.No:</div>
              <div style={{
                position: 'absolute',
                left: '8px',
                top: '18px',
                fontSize: '10px'
              }}>{receiptData.receiptNo}</div>
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#2c5aa0'
              }}>RECEIPT</div>
              <div style={{
                position: 'absolute',
                right: '8px',
                top: '6px',
                fontWeight: 'bold',
                color: '#2c5aa0',
                fontSize: '10px'
              }}>Date:</div>
              <div style={{
                position: 'absolute',
                right: '8px',
                top: '18px',
                fontSize: '10px'
              }}>{formatDate(receiptData.date)}</div>
            </div>

            <div style={{
              border: '1px solid #ddd',
              padding: '6px',
              marginBottom: '6px',
              minHeight: '28px',
              display: 'flex',
              alignItems: 'flex-start'
            }}>
              <span style={{
                fontWeight: 'bold',
                color: '#2c5aa0',
                width: '70px',
                flexShrink: 0,
                fontSize: '10px',
                lineHeight: '1.2'
              }}>Category:</span>
              <span style={{
                flex: 1,
                fontSize: '10px',
                lineHeight: '1.2',
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}>{receiptData.category}</span>
            </div>

            <div style={{
              border: '1px solid #ddd',
              padding: '6px',
              marginBottom: '6px',
              minHeight: '28px',
              display: 'flex',
              alignItems: 'flex-start'
            }}>
              <span style={{
                fontWeight: 'bold',
                color: '#2c5aa0',
                width: '70px',
                flexShrink: 0,
                fontSize: '10px',
                lineHeight: '1.2'
              }}>Amount:</span>
              <span style={{
                flex: 1,
                fontSize: '10px',
                lineHeight: '1.2',
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#28a745',
                  marginBottom: '2px'
                }}>Rs {parseFloat(receiptData.amount).toFixed(2)}</div>
                <div style={{
                  fontStyle: 'italic',
                  color: '#666',
                  fontSize: '9px',
                  lineHeight: '1.2'
                }}>
                  <strong>In Words:</strong> {numberToWords(parseFloat(receiptData.amount))} Only
                </div>
              </span>
            </div>

            {showReferenceNo && (
              <div style={{
                border: '1px solid #ddd',
                padding: '6px',
                marginBottom: '6px',
                minHeight: '28px',
                display: 'flex',
                alignItems: 'flex-start'
              }}>
                <span style={{
                  fontWeight: 'bold',
                  color: '#2c5aa0',
                  width: '70px',
                  flexShrink: 0,
                  fontSize: '10px',
                  lineHeight: '1.2'
                }}>Reference No:</span>
                <span style={{
                  flex: 1,
                  fontSize: '10px',
                  lineHeight: '1.2',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}>{receiptData.referenceId || 'N/A'}</span>
              </div>
            )}

            {receiptData.description && (
              <div style={{
                border: '1px solid #ddd',
                padding: '6px',
                marginBottom: '6px',
                minHeight: '28px',
                display: 'flex',
                alignItems: 'flex-start'
              }}>
                <span style={{
                  fontWeight: 'bold',
                  color: '#2c5aa0',
                  width: '70px',
                  flexShrink: 0,
                  fontSize: '10px',
                  lineHeight: '1.2'
                }}>Description:</span>
                <span style={{
                  flex: 1,
                  fontSize: '10px',
                  lineHeight: '1.2',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}>{receiptData.description}</span>
              </div>
            )}

            <div style={{
              border: '1px solid #ddd',
              padding: '6px',
              marginBottom: '6px',
              minHeight: '28px',
              display: 'flex',
              alignItems: 'flex-start'
            }}>
              <span style={{
                fontWeight: 'bold',
                color: '#2c5aa0',
                width: '70px',
                flexShrink: 0,
                fontSize: '10px',
                lineHeight: '1.2'
              }}>Received From:</span>
              <span style={{
                flex: 1,
                fontSize: '10px',
                lineHeight: '1.2',
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}>{receiptData.personName}</span>
            </div>

            <div style={{
              marginTop: '15px',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <div style={{ textAlign: 'center', width: '45%' }}>
                <div style={{
                  borderTop: '1px solid #333',
                  margin: '25px auto 3px auto',
                  width: '80%'
                }}></div>
                <div style={{
                  fontWeight: 'bold',
                  color: '#2c5aa0',
                  fontSize: '10px'
                }}>Accountant Signature</div>
              </div>
              <div style={{ textAlign: 'center', width: '45%' }}>
                <div style={{
                  borderTop: '1px solid #333',
                  margin: '25px auto 3px auto',
                  width: '80%'
                }}></div>
                <div style={{
                  fontWeight: 'bold',
                  color: '#2c5aa0',
                  fontSize: '10px'
                }}>Payer's Signature</div>
              </div>
            </div>

            <div style={{
              textAlign: 'center',
              marginTop: '10px',
              fontSize: '8px',
              color: '#666',
              fontStyle: 'italic'
            }}>
              Computer Generated Receipt | Generated on {new Date().toLocaleDateString('en-IN')}
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer
          className="d-flex justify-content-center"
          style={{
            borderTop: '2px solid #dee2e6',
            padding: '12px',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
            backgroundColor: '#f8f9fa',
            width: '100%'
          }}
        >
          <div className="d-flex gap-3 w-100 justify-content-between align-items-center">
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                onClick={handlePrintReceipt}
                size="md"
                style={{
                  minWidth: '160px',
                  fontSize: '14px',
                  padding: '8px 20px'
                }}
              >
                <FaPrint className="me-2" />
                Print Receipt
              </Button>
            </div>
            <Button
              variant="secondary"
              onClick={onHide}
              size="md"
              style={{
                minWidth: '140px',
                fontSize: '14px',
                padding: '8px 20px'
              }}
            >
              Close Preview
            </Button>
          </div>
        </Modal.Footer>

        <style>
          {`
            .modal-receipt-content {
              width: 210mm !important;
              max-width: 210mm !important;
              border-radius: 8px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.15);
              border: none;
            }
            @media (max-width: 230mm) {
              .modal-receipt-content {
                width: 95vw !important;
                max-width: 95vw !important;
              }
              .modal-body > div {
                width: 100% !important;
                min-height: auto !important;
                transform: scale(0.9);
                transform-origin: top center;
              }
            }
          `}
        </style>
      </Modal>
    );
  };

  return (
    <MainContentPage>
      <div className="mb-4">
        <nav className="custom-breadcrumb d-flex py-1 py-lg-3">
          <Link to="/home">Home</Link>
          <span className="separator mx-2">&gt;</span>
          <div>Transaction</div>
          <span className="separator mx-2">&gt;</span>
          <span>Receipt Entry</span>
        </nav>
      </div>
      
      <div className="bg-white rounded shadow">
        {/* Header */}
        <div className="bg-primary text-white p-3 mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="m-0">{isSearchMode ? 'Search Receipts' : 'Receipt Entry'}</h2>
              <small>School: {schoolId} | Academic Year: {currentAcademicYear}</small>
            </div>
            <div className="d-flex gap-2">
              {isSearchMode ? (
                <Button 
                  variant="outline-light" 
                  onClick={switchToEntryMode}
                  size="sm"
                >
                  <FaPlus className="me-2" />
                  New Receipt
                </Button>
              ) : (
                <Button 
                  variant="outline-light" 
                  onClick={switchToSearchMode}
                  size="sm"
                >
                  <FaSearch className="me-2" />
                  Search Receipts
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Search Form */}
        {isSearchMode ? (
          <>
            {/* Search Criteria Form */}
            <div className="row g-3 mb-4 p-3">
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Receipt Number</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={searchReceiptNo}
                    onChange={(e) => {
                      let value = e.target.value.toUpperCase();
                      if (!value.startsWith('IN')) {
                        value = 'IN' + value.replace('IN', '');
                      }
                      value = value.replace(/[^0-9]/g, '').slice(0, 4);
                      setSearchReceiptNo('In' + value);
                    }}
                    placeholder="Enter receipt number (In0001 format)"
                  />
                </div>
              </div>
            </div>

            {/* Search Buttons */}
            <div className="d-flex flex-wrap justify-content-center gap-3 p-3">
              <button 
                className="btn btn-primary flex-grow-1 flex-md-grow-0"
                onClick={searchReceiptByReceiptNo}
                disabled={searchLoading || !searchReceiptNo}
              >
                {searchLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <FaSearch className="me-2" />
                    Search
                  </>
                )}
              </button>
              <button 
                className="btn btn-secondary flex-grow-1 flex-md-grow-0"
                onClick={clearSearch}
                disabled={searchLoading}
              >
                <FaTimes className="me-2" />
                Clear
              </button>
            </div>

            {/* Search Result */}
            {searchResult && (
              <div className="p-3">
                <h6 className="mb-3">Search Result</h6>
                <div className="table-responsive" style={{ 
                  maxWidth: '100%', 
                  overflowX: 'auto',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px'
                }}>
                  <Table striped bordered hover size="sm" style={{ 
                    minWidth: '700px', 
                    tableLayout: 'fixed',
                    marginBottom: '0'
                  }}>
                    <thead>
                      <tr>
                        <th style={{ width: '12%', wordWrap: 'break-word' }}>Receipt No</th>
                        <th style={{ width: '12%', wordWrap: 'break-word' }}>Date</th>
                        <th style={{ width: '18%', wordWrap: 'break-word' }}>Person Name</th>
                        <th style={{ width: '18%', wordWrap: 'break-word' }}>Category</th>
                        <th style={{ width: '12%', wordWrap: 'break-word' }}>Amount</th>
                        <th style={{ width: '12%', wordWrap: 'break-word' }}>Mode</th>
                        <th style={{ width: '8%', wordWrap: 'break-word' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ wordWrap: 'break-word' }}>{searchResult.receiptNo}</td>
                        <td style={{ wordWrap: 'break-word' }}>{formatDate(searchResult.date)}</td>
                        <td style={{ wordWrap: 'break-word' }}>{searchResult.personName}</td>
                        <td style={{ wordWrap: 'break-word' }}>{searchResult.category}</td>
                        <td className="fw-bold" style={{ wordWrap: 'break-word' }}>Rs {parseFloat(searchResult.amount).toFixed(2)}</td>
                        <td style={{ wordWrap: 'break-word' }}>{searchResult.receiptMode}</td>
                        <td>
                          <div className="d-flex justify-content-center">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleViewReceipt(searchResult)}
                              title="View Receipt"
                              style={{ fontSize: '12px', padding: '2px 6px' }}
                            >
                              <FaEye />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </div>
            )}

            {!searchResult && !searchLoading && (
              <div className="text-center text-muted py-4">
                Enter a receipt number to search for receipts.
              </div>
            )}
          </>
        ) : (
          <>
            {/* Original Receipt Entry Form */}
            <div className="row g-3 mb-4 p-3">
              {/* Receipt No (Auto-generated) */}
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">1. Receipt No</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={receiptNo}
                    readOnly 
                    disabled
                    style={{backgroundColor: '#f8f9fa', color: '#6c757d'}}
                  />
                  <small className="form-text text-muted">Auto-generated (In0001-In5000, resets after 5000)</small>
                </div>
              </div>

              {/* Date */}
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">2. Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Category Dropdown (FIXED) */}
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">3. Category *</label>
                  <select 
                    className="form-control" 
                    name="category"
                    value={selectedMainHead}
                    onChange={handleMainHeadChange}
                    required
                    disabled={isHeadsLoading}
                  >
                    <option value="">Select Category</option>
                    {receiptMainHeads.length > 0 ? (
                      receiptMainHeads.map((head, index) => (
                        <option key={head.id || index} value={head.headName}>
                          {head.headName}
                        </option>
                      ))
                    ) : (
                       !isHeadsLoading && <option value="" disabled>No categories found</option>
                    )}
                  </select>
                  {isHeadsLoading && (
                    <div className="mt-2 text-primary">
                      <Spinner animation="border" size="sm" />
                      <span className="ms-2 small">Loading categories...</span>
                    </div>
                  )}
                  {receiptMainHeads.length === 0 && !isHeadsLoading && (
                       <small className="text-danger">Please add categories in Setup first</small>
                  )}
                </div>
              </div>

              {/* Person Name */}
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">4. Person Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="personName"
                    value={formData.personName}
                    onChange={handleInputChange}
                    placeholder="Enter person name"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="col-md-12">
                <div className="form-group">
                  <label className="form-label">5. Description</label>
                  <textarea 
                    className="form-control" 
                    name="description" 
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter receipt description..."
                  ></textarea>
                </div>
              </div>

              {/* Receipt Mode */}
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">6. Receipt Mode</label>
                  <select 
                    className="form-control" 
                    name="receiptMode"
                    value={receiptMode}
                    onChange={handleReceiptModeChange}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="online">Online Payment</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                {/* Reference ID Input - Conditionally Rendered */}
                {(receiptMode === 'bank' || receiptMode === 'online' || receiptMode === 'cheque') && (
                  <div className="form-group mt-3">
                    <label className="form-label">Reference ID / Cheque No</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="referenceId"
                      value={formData.referenceId}
                      onChange={handleInputChange}
                      placeholder={`Enter ${receiptMode === 'cheque' ? 'Cheque' : 'Transaction'} Reference`}
                    />
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">7. Amount *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Single Submit Button */}
            <div className="d-flex flex-wrap justify-content-center gap-3 p-3">
              <button 
                className="btn btn-success flex-grow-1 flex-md-grow-0"
                onClick={handleSubmit}
                disabled={loading || !formData.amount || !formData.personName || !selectedMainHead || isHeadsLoading}
                style={{ minWidth: '150px' }}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="me-2" />
                    Save Receipt
                  </>
                )}
              </button>
              <button 
                className="btn btn-secondary flex-grow-1 flex-md-grow-0"
                onClick={handleCancel}
                disabled={loading}
                style={{ minWidth: '150px' }}
              >
                <FaTimes className="me-2" />
                Cancel
              </button>
            </div>
          </>
        )}

        {/* Styles */}
        <style>{`
          .bg-primary {
            background-color: #0B3D7B !important;
          }
          .form-control, .form-select {
            border-radius: 4px;
            border: 1px solid #ced4da;
          }
          .form-control:focus, .form-select:focus {
            border-color: #0B3D7B;
            box-shadow: 0 0 0 0.2rem rgba(11, 61, 123, 0.25);
          }
          .form-label {
            font-weight: 500;
            margin-bottom: 0.5rem;
          }
          .gap-3 {
            gap: 1rem;
          }
          .btn {
            padding: 0.5rem 1.5rem;
          }
          @media (max-width: 768px) {
            .btn {
              width: 100%;
            }
          }
          .form-text {
            font-size: 0.875rem;
          }
          .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          .table-responsive {
            border: 1px solid #dee2e6;
            border-radius: 4px;
          }
          .table {
            margin-bottom: 0;
          }
          .table th {
            background-color: #f8f9fa;
            border-bottom: 2px solid #dee2e6;
            font-weight: 600;
            white-space: nowrap;
          }
          .table td {
            vertical-align: middle;
          }
        `}</style>
      </div>

      {/* Receipt Modal */}
      {receiptData && (
        <ReceiptModal 
          show={showReceipt}
          onHide={() => setShowReceipt(false)}
          receiptData={receiptData}
          schoolInfo={schoolInfo}
          schoolPhoto={schoolPhoto}
        />
      )}

      {/* Toast Container */}
      <ToastContainer />
    </MainContentPage>
  );
};

export default ReceiptEntry;