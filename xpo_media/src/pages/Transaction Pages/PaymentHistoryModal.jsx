"use client"

import { Modal, Button, Table, Badge } from "react-bootstrap"

const PaymentHistoryModal = ({ show, onHide, paymentHistory }) => {

  // --- SAFE DATA GETTERS (Handles CamelCase and Snake_case) ---
  const getVal = (item, ...keys) => {
    for (const key of keys) {
      if (item[key] !== undefined && item[key] !== null) return item[key];
    }
    return null;
  };

  // --- SORTING LOGIC ---
  const sortedPaymentHistory = [...(paymentHistory || [])].sort((a, b) => {
    const dateA = new Date(getVal(a, 'bill_date', 'billDate', 'transactionDate') || 0);
    const dateB = new Date(getVal(b, 'bill_date', 'billDate', 'transactionDate') || 0);
    return dateB - dateA; // Descending (Newest first)
  });

  // --- FORMATTING HELPERS ---
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }); // DD/MM/YYYY
    } catch (e) {
      return "Error";
    }
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount);
    return isNaN(num) ? "₹0.00" : `₹${num.toFixed(2)}`;
  };

  // Format reference number - remove 'REF-' prefix if present
  const formatRefNo = (refNo) => {
    if (!refNo) return '-';
    
    const refString = refNo.toString().trim();
    
    // Remove 'REF-' prefix if it exists
    if (refString.toUpperCase().startsWith('REF-')) {
      return refString.substring(4); // Remove first 4 characters 'REF-'
    }
    
    return refString;
  };

  // Get description from fee details or transaction narrative
  const getDescription = (payment) => {
    // First try to get from fee_details if available
    const feeDetails = getVal(payment, 'fee_details', 'feeDetails');
    if (feeDetails && Array.isArray(feeDetails) && feeDetails.length > 0) {
      // Join all fee descriptions
      return feeDetails.map(fee => 
        fee.description || fee.feeHeading || fee.fee_head || 'Fee Payment'
      ).join(', ');
    }
    
    // Then try transaction narrative
    const narrative = getVal(payment, 'transaction_narrative', 'transactionNarrative');
    if (narrative) return narrative;
    
    // Default description
    return 'Fee Payment';
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered 
      size="xl"
      contentClassName="modal-90vw-content"
      dialogClassName="modal-90vw-dialog"
      backdrop="static" // Prevents accidental closing
    >
      {/* --- HEADER --- */}
      <Modal.Header 
        closeButton
        style={{ 
          backgroundColor: "#0B3D7B", 
          borderBottom: "1px solid #dee2e6",
          padding: '1rem 1.5rem',
          color: 'white'
        }} 
      >
        <Modal.Title 
          className="w-100" 
          style={{ fontSize: '1.25rem', fontWeight: '600' ,color: "white"}}
        >
          Payment History
        </Modal.Title>
      </Modal.Header>
      
      {/* --- BODY --- */}
      <Modal.Body style={{ padding: 0, overflow: 'hidden' }}>
        {sortedPaymentHistory.length > 0 ? (
          <div className="table-container" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
            <Table responsive hover striped className="mb-0 custom-table">
              <thead className="sticky-top" style={{ zIndex: 10 }}>
                <tr style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                  <th className="py-3 px-3">Bill No.</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3 text-end">Amount</th>
                  <th className="py-3 px-3 text-end">Concession</th>
                  <th className="py-3 px-3 text-center">Mode</th>
                  <th className="py-3 px-3">Ref No.</th>
                  <th className="py-3 px-3">Operator</th>
                </tr>
              </thead>
              <tbody>
                {sortedPaymentHistory.map((payment, index) => {
                  // Extract values using safe getter
                  const billNo = getVal(payment, 'bill_number', 'billNumber');
                  const billDate = getVal(payment, 'bill_date', 'billDate');
                  const description = getDescription(payment);
                  const paidAmt = getVal(payment, 'paid_amount', 'paidAmount', 'totalPaidAmount');
                  const concAmt = getVal(payment, 'total_concession_amount', 'totalConcessionAmount', 'concessionAmount');
                  const mode = getVal(payment, 'payment_mode', 'paymentMode');
                  const refNo = getVal(payment, 'payment_number', 'paymentNumber', 'referenceNo');
                  const operator = getVal(payment, 'operator_name', 'operatorName');

                  return (
                    <tr key={index}>
                      <td className="px-3 align-middle fw-bold text-primary">
                        {billNo}
                      </td>
                      <td className="px-3 align-middle">
                        {formatDate(billDate)}
                      </td>
                      <td className="px-3 align-middle" style={{ maxWidth: '250px', minWidth: '200px' }}>
                        <div className="text-truncate" title={description}>
                          {description}
                        </div>
                      </td>
                      <td className="px-3 align-middle text-end fw-bold text-success">
                        {formatCurrency(paidAmt)}
                      </td>
                      <td className="px-3 align-middle text-end text-danger">
                        {parseFloat(concAmt) > 0 ? formatCurrency(concAmt) : '-'}
                      </td>
                      <td className="px-3 align-middle text-center">
                        <Badge bg={
                          mode === 'Cash' ? 'success' : 
                          mode === 'Online' ? 'primary' : 
                          mode === 'DD' ? 'warning' : 'secondary'
                        }>
                          {mode || 'Cash'}
                        </Badge>
                      </td>
                      <td className="px-3 align-middle small text-muted">
                          {formatRefNo(refNo)}
                      </td>
                      <td className="px-3 align-middle small text-uppercase">
                        {operator || 'Admin'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        ) : (
          // --- EMPTY STATE ---
          <div className="text-center py-5">
            <div style={{ fontSize: '3rem', opacity: 0.3 }}>📂</div>
            <h5 className="text-muted mt-3">No payment records found</h5>
            <p className="text-muted small mb-0">Transactions will appear here once processed.</p>
          </div>
        )}
      </Modal.Body>
      
      {/* --- FOOTER --- */}
      <Modal.Footer className="bg-light">
        <div className="d-flex w-100 justify-content-between align-items-center">
            <small className="text-muted">
                Total Records: <strong>{sortedPaymentHistory.length}</strong>
            </small>
            <Button variant="secondary" onClick={onHide}>Close</Button>
        </div>
      </Modal.Footer>

      {/* --- INLINE STYLES --- */}
      <style>{`
        /* Modal centering and width overrides */
        .modal-90vw-content {
          width: 90vw !important;
          max-width: 90vw !important;
          border-radius: 8px;
          border: none;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        
        .modal-90vw-dialog {
          max-width: 90vw !important;
          width: 90vw !important;
          display: flex;
          align-items: center; 
          justify-content: center;
        }
        
        /* Modal backdrop overlay fix */
        .modal-backdrop {
          opacity: 0.5 !important;
        }
        
        /* Ensure modal parent is flex for centering */
        .modal {
          display: flex !important;
          align-items: center;
          justify-content: center;
        }
        
        /* Modal content responsive width */
        @media (min-width: 1200px) {
          .modal-90vw-content,
          .modal-90vw-dialog {
            width: 90vw !important;
            max-width: 90vw !important;
          }
        }
        
        @media (min-width: 992px) and (max-width: 1199px) {
          .modal-90vw-content,
          .modal-90vw-dialog {
            width: 95vw !important;
            max-width: 95vw !important;
          }
        }
        
        @media (min-width: 768px) and (max-width: 991px) {
          .modal-90vw-content,
          .modal-90vw-dialog {
            width: 98vw !important;
            max-width: 98vw !important;
          }
        }
        
        @media (max-width: 767px) {
          .modal-90vw-content,
          .modal-90vw-dialog {
            width: 98vw !important;
            max-width: 98vw !important;
            margin: 0.5rem;
          }
        }
        
        /* Table styling */
        .custom-table thead th {
          background-color: #0B3D7B !important;
          color: white !important;
          font-weight: 500;
          font-size: 0.9rem;
          border-bottom: 2px solid #082d5c;
          white-space: nowrap;
        }

        .custom-table tbody td {
          font-size: 0.9rem;
          border-color: #f0f0f0;
        }

        .custom-table tbody tr:hover {
          background-color: #f8f9fa;
        }

        /* Column width adjustments */
        .custom-table th:nth-child(1), /* Bill No */
        .custom-table td:nth-child(1) {
          min-width: 100px;
          max-width: 120px;
        }
        
        .custom-table th:nth-child(2), /* Date */
        .custom-table td:nth-child(2) {
          min-width: 110px;
          max-width: 120px;
        }
        
        .custom-table th:nth-child(3), /* Description */
        .custom-table td:nth-child(3) {
          min-width: 200px;
          max-width: 300px;
        }
        
        .custom-table th:nth-child(4), /* Amount */
        .custom-table td:nth-child(4) {
          min-width: 120px;
          max-width: 140px;
        }
        
        .custom-table th:nth-child(5), /* Concession */
        .custom-table td:nth-child(5) {
          min-width: 120px;
          max-width: 140px;
        }
        
        .custom-table th:nth-child(6), /* Mode */
        .custom-table td:nth-child(6) {
          min-width: 100px;
          max-width: 120px;
        }
        
        .custom-table th:nth-child(7), /* Ref No */
        .custom-table td:nth-child(7) {
          min-width: 120px;
          max-width: 150px;
        }
        
        .custom-table th:nth-child(8), /* Operator */
        .custom-table td:nth-child(8) {
          min-width: 120px;
          max-width: 150px;
        }

        /* Scrollbar Styling */
        .table-container::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .table-container::-webkit-scrollbar-track {
          background: #f1f1f1; 
        }
        .table-container::-webkit-scrollbar-thumb {
          background: #ccc; 
          border-radius: 3px;
        }
        .table-container::-webkit-scrollbar-thumb:hover {
          background: #aaa; 
        }

        /* Mobile responsiveness */
        @media (max-width: 992px) {
          .modal-90vw-content,
          .modal-90vw-dialog {
            width: 98vw !important;
            max-width: 98vw !important;
            margin: 0.5rem;
          }
          
          .custom-table thead th, .custom-table tbody td {
            font-size: 0.85rem;
            padding: 0.5rem !important;
          }
          
          .custom-table th:nth-child(3), /* Description */
          .custom-table td:nth-child(3) {
            min-width: 150px;
            max-width: 200px;
          }
        }
        
        @media (max-width: 768px) {
          .modal-90vw-content,
          .modal-90vw-dialog {
            width: 98vw !important;
            max-width: 98vw !important;
            margin: 0.5rem;
          }
          
          .custom-table thead th, .custom-table tbody td {
            font-size: 0.8rem;
            padding: 0.5rem !important;
          }
          
          .custom-table th:nth-child(4), /* Amount */
          .custom-table td:nth-child(4) {
            min-width: 90px;
          }
          
          .custom-table th:nth-child(7), /* Ref No */
          .custom-table td:nth-child(7) {
            min-width: 100px;
          }
          
          .custom-table th:nth-child(3), /* Description */
          .custom-table td:nth-child(3) {
            min-width: 120px;
            max-width: 180px;
          }
        }
        
        @media (max-width: 576px) {
          .modal-90vw-content,
          .modal-90vw-dialog {
            width: 98vw !important;
            max-width: 98vw !important;
            margin: 0.25rem;
          }
          
          .custom-table {
            display: block;
            overflow-x: auto;
          }
          
          .custom-table thead th, .custom-table tbody td {
            font-size: 0.75rem;
            padding: 0.4rem !important;
            white-space: nowrap;
          }
          
          .custom-table td:nth-child(3) { /* Description */
            white-space: normal;
            max-width: 150px;
          }
        }
      `}</style>
    </Modal>
  )
}

export default PaymentHistoryModal;