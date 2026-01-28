"use client"

import { Modal, Button, Table } from "react-bootstrap"

const BusPaymentHistoryModal = ({ show, onHide, busPaymentHistory }) => {
  // Sort bus payment history by bill date (newest first)
  const sortedBusPaymentHistory = [...busPaymentHistory].sort((a, b) => {
    const dateA = new Date(a.bus_bill_date || a.busBillDate)
    const dateB = new Date(b.bus_bill_date || b.busBillDate)
    return dateB.getTime() - dateA.getTime()
  })

  // Function to format date
  const formatDate = (date) => {
    if (!date) return "N/A"
    try {
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) return "Invalid Date"
      return dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
    } catch (error) {
      return "Invalid Date"
    }
  }

  // Function to format currency
  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0
    return `₹${num.toFixed(2)}`
  }

  return (
    <Modal show={show} onHide={onHide} centered style={{ width: '90vw', maxWidth: '95vw', margin: '0 auto' }} contentClassName="modal-90vw-content">
      <Modal.Header style={{ backgroundColor: "#0B3D7B", borderBottom: "0.1vw solid #dee2e6", padding: '1.5vw', borderTopLeftRadius: '0.5vw', borderTopRightRadius: '0.5vw', width: '100%' }} className="text-white">
        <Modal.Title className="text-center w-100 mb-0" style={{ fontSize: '1.5vw', fontWeight: '600', color: 'white' }}>
          Bus Payment History
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ padding: 0, width: '100%', maxHeight: '70vh', overflow: 'hidden' }}>
        {sortedBusPaymentHistory.length > 0 ? (
          <div className="table-container" style={{ maxHeight: '50vh', overflowY: 'auto', width: '100%' }}>
            <Table bordered hover className="bus-payment-history-table mb-0">
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr style={{ backgroundColor: "#0B3D7B" }}>
                  <th style={{ padding: '1vw', fontWeight: '600', fontSize: '0.9vw' }}>Bus Bill No.</th>
                  <th style={{ padding: '1vw', fontWeight: '600', fontSize: '0.9vw' }}>Date</th>
                  <th style={{ padding: '1vw', fontWeight: '600', fontSize: '0.9vw' }}>Amount</th>
                  <th style={{ padding: '1vw', fontWeight: '600', fontSize: '0.9vw' }}>Concession</th>
                  <th style={{ padding: '1vw', fontWeight: '600', fontSize: '0.9vw' }}>Payment Mode</th>
                  <th style={{ padding: '1vw', fontWeight: '600', fontSize: '0.9vw' }}>Operator</th>
                  <th style={{ padding: '1vw', fontWeight: '600', fontSize: '0.9vw' }}>Route No.</th>
                  <th style={{ padding: '1vw', fontWeight: '600', fontSize: '0.9vw' }}>Bus Fee Details</th>
                </tr>
              </thead>
              <tbody>
                {sortedBusPaymentHistory.map((payment, index) => (
                  <tr key={payment.id || index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                    <td style={{ padding: '2vw', verticalAlign: 'middle', fontSize: '0.85vw' }}>
                      <strong>{payment.bus_bill_number || payment.busBillNumber}</strong>
                    </td>
                    <td style={{ padding: '1vw', verticalAlign: 'middle', fontSize: '0.85vw' }}>
                      {formatDate(payment.bus_bill_date || payment.busBillDate)}
                    </td>
                    <td style={{ padding: '1vw', verticalAlign: 'middle', fontWeight: '500', fontSize: '0.85vw' }}>
                      {/* FIXED: Explicitly check for bus_paid_amount */}
                      {formatCurrency(payment.bus_paid_amount || payment.paid_amount || payment.totalBusPaidAmount)}
                    </td>
                    <td style={{ padding: '1vw', verticalAlign: 'middle', fontSize: '0.85vw' }}>
                      {formatCurrency(payment.total_bus_concession_amount || payment.totalBusConcessionAmount || '0')}
                    </td>
                    <td style={{ padding: '1vw', verticalAlign: 'middle', fontSize: '0.85vw' }}>
                      <span className={`badge ${(payment.payment_mode || payment.paymentMode) === 'Cash' ? 'bg-success' : (payment.payment_mode || payment.paymentMode) === 'Online' ? 'bg-primary' : 'bg-info'}`} style={{ fontSize: '0.8vw' }}>
                        {payment.payment_mode || payment.paymentMode}
                      </span>
                    </td>
                    <td style={{ padding: '1vw', verticalAlign: 'middle', fontSize: '0.85vw' }}>
                      {payment.operator_name || payment.operatorName || 'N/A'}
                    </td>
                    <td style={{ padding: '1vw', verticalAlign: 'middle', fontSize: '0.85vw' }}>
                      {payment.route_number || payment.routeNumber || 'N/A'}
                    </td>
                    <td style={{ padding: '1vw', verticalAlign: 'middle', maxWidth: '15vw', fontSize: '0.85vw' }}>
                      <small className="text-muted">{payment.bus_fee_details || 'Bus Fee Payment'}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-5" style={{ minHeight: '30vh', width: '100%' }}>
            <div style={{ fontSize: '4vw', color: '#6c757d', marginBottom: '2vw' }}>🚌</div>
            <p className="text-muted mb-0" style={{ fontSize: '1.2vw' }}>No bus payment history available</p>
            <small className="text-muted" style={{ fontSize: '1vw' }}>This student has no previous bus fee payments</small>
          </div>
        )}
      </Modal.Body>
      
      <Modal.Footer className="d-flex justify-content-center" style={{ borderTop: '0.1vw solid #dee2e6', padding: '1.5vw', borderBottomLeftRadius: '0.5vw', borderBottomRightRadius: '0.5vw', backgroundColor: '#f8f9fa', width: '100%' }}>
        <Button variant="primary" onClick={onHide} style={{ backgroundColor: "#0B3D7B", borderColor: "#0B3D7B", minWidth: '8vw', fontSize: '1vw', padding: '0.6vw 1.5vw' }}>Close</Button>
      </Modal.Footer>
      
      <style>
        {`
          .modal-90vw-content { width: 90vw !important; max-width: 95vw !important; border-radius: 0.5vw; box-shadow: 0 0.3vw 1.5vw rgba(0,0,0,0.15); border: none; }
          .bus-payment-history-table th { border-bottom: 0.15vw solid #dee2e6; background-color: #0B3D7B !important; color: #495057; font-weight: 600; white-space: nowrap; }
          .bus-payment-history-table td { border-color: #e9ecef; vertical-align: middle; }
          .bus-payment-history-table tbody tr:hover { background-color: #0B3D7B !important; transition: background-color 0.2s ease; }
          @media (max-width: 1000px) { .bus-payment-history-table { min-width: 95vw; } }
          @media (max-width: 768px) { .bus-payment-history-table { min-width: 80vw; } }
          .table-container::-webkit-scrollbar { width: 0.4vw; height: 0.4vw; }
          .table-container::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 0.2vw; }
          .table-container::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 0.2vw; }
          .table-container::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
        `}
      </style>
    </Modal>
  )
}

export default BusPaymentHistoryModal