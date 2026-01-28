"use client"

import { Modal, Button, Table } from "react-bootstrap"


const PaymentHistoryModal = ({ show, onHide, paymentHistory }) => {
  // Sort payment history by bill date (newest first)
  const sortedPaymentHistory = [...paymentHistory].sort((a, b) => {
    const dateA = a.billDate instanceof Timestamp ? a.billDate.toDate() : new Date(a.billDate)
    const dateB = b.billDate instanceof Timestamp ? b.billDate.toDate() : new Date(b.billDate)
    return dateB.getTime() - dateA.getTime()
  })

  // Function to format date
  const formatDate = (date) => {
    if (date instanceof Timestamp) {
      date = date.toDate()
    } else if (!(date instanceof Date)) {
      date = new Date(date)
    }

    if (isNaN(date.getTime())) {
      return "Invalid Date"
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <Modal show={show} onHide={onHide} centered dialogClassName="payment-history-modal" size="lg">
      <Modal.Header style={{ backgroundColor: "#fff", borderBottom: "1px solid #dee2e6" }}>
        <Modal.Title className="text-center w-100">Payment History</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {sortedPaymentHistory.length > 0 ? (
          <div className="table-container">
            <Table bordered hover className="payment-history-table">
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th>Bill No.</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Payment Mode</th>
                </tr>
              </thead>
              <tbody>
                {sortedPaymentHistory.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.billNumber}</td>
                    <td>{formatDate(payment.billDate)}</td>
                    <td>₹{payment.totalPaidAmount}</td>
                    <td>{payment.paymentMode}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          <p className="text-center">No payment history available</p>
        )}
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-center">
        <Button variant="secondary" onClick={onHide} style={{ backgroundColor: "#6c757d", borderColor: "#6c757d" }}>
          Close
        </Button>
      </Modal.Footer>
      <style>
        {`
          .payment-history-modal .modal-content {
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            max-width: auto !important;
          }

          .payment-history-modal .modal-header {
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            padding: 15px 20px;
          }

          .payment-history-modal .modal-title {
            font-weight: 500;
            color: #333;
          }

          .payment-history-modal .modal-body {
            padding: 20px;
          }

          .payment-history-modal .modal-footer {
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
            padding: 15px;
          }

          .table-container {
            width: 100%;
            overflow-x: auto;
          }

          .payment-history-table {
            width: 100%;
            min-width: 600px; /* Ensure table doesn't shrink too much on small screens */
          }

          /* Make sure the modal is wide enough on all screens */
          .payment-history-modal .modal-dialog {
            max-width: 90%;
            width: 800px;
          }

          /* Adjust modal width for very small screens */
          @media (max-width: 576px) {
            .payment-history-modal .modal-dialog {
              max-width: 95%;
              width: auto;
              margin: 10px;
            }
          }
        `}
      </style>
    </Modal>
  )
}

export default PaymentHistoryModal

