import React from 'react';
import { Routes, Route } from 'react-router-dom';
import BillingEntry from '../../pages/Transaction Pages/BillingEntry';
import OtherFee from '../../pages/Transaction Pages/OtherFee';
import IndividualPaid from '../../pages/Transaction Pages/IndividualPaid';
import ReceiptEntry from '../../pages/Transaction Pages/ReceiptEntry';
import DuplicateBill from '../../pages/Transaction Pages/DuplicateBill';
import PaymentEntry from '../../pages/Transaction Pages/PaymentEntry';
import StaffUpdate from '../../pages/Transaction Pages/StaffUpdate';
import AttendanceEntry from '../../pages/Transaction Pages/AttendanceEntry';
import SmsSend from '../../pages/Transaction Pages/SmsSend';
import EnquirySMS from '../../pages/Transaction Pages/SMSPages/EnquirySMS';
import GeneralCircularSMS from '../../pages/Transaction Pages/SMSPages/GeneralCircularSMS';
import AbsentListSMS from '../../pages/Transaction Pages/SMSPages/AbsentListSMS';
import BillCancel from '../../pages/Transaction Pages/BillCancel';




function TransactionRoute() {
  return (
    <Routes>
      <Route path="billing-entry" element={< BillingEntry/>} />
      <Route path="other-fee" element={< OtherFee/>} />
      <Route path="individual-paid" element={< IndividualPaid/>} />  
      <Route path="payment-entry" element={< PaymentEntry/>} />  
      <Route path="receipt-entry" element={< ReceiptEntry/>} />  
      <Route path="duplicate-bill" element={< DuplicateBill/>} />  
      <Route path="staff-update" element={< StaffUpdate/>} />  
      <Route path="attendance-entry" element={< AttendanceEntry/>} />  
      <Route path="sms-send" element={< SmsSend/>} />  
      <Route path="enquiry-sms" element={< EnquirySMS/>} />  
      <Route path="general-circular-sms" element={< GeneralCircularSMS/>} />  
      <Route path="absent-list-sms" element={< AbsentListSMS/>} />  
      <Route path="Bill-Cancel-Transaction" element={<BillCancel />} />
      
    </Routes>
  );
}

export default TransactionRoute;