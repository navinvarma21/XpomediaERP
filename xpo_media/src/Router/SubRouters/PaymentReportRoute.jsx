import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PaymentReport from '../../pages/MainPages/PaymentReport';
import DayExpensesReport from '../../pages/Payment Report Pages/DayExpensesReport';
import PeriodExpensesReport from '../../pages/Payment Report Pages/PeriodExpensesReport';






function PaymentReportRoute() {
  return (
    <Routes>
      <Route path="payment-report" element={< PaymentReport/>} />
      <Route path="day-expenses-report" element={< DayExpensesReport/>} />
      <Route path="period-expenses-report" element={< PeriodExpensesReport/>} />
    </Routes>
  );
}

export default PaymentReportRoute;