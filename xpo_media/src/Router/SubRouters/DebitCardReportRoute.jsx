import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DAYDCReport from '../../pages/DebitCard Report Pages/DAYDCReport';
import PeriodDCReport from '../../pages/DebitCard Report Pages/PeriodDCReport';
import BankLedger from '../../pages/DebitCard Report Pages/BankLedger';
import BalanceList from '../../pages/DebitCard Report Pages/BalanceList';
import BalanceList1 from '../../pages/DebitCard Report Pages/Balancelist Pages/BalanceList1';
import BalanceList2 from '../../pages/DebitCard Report Pages/Balancelist Pages/BalanceList2';
import BalanceList3 from '../../pages/DebitCard Report Pages/Balancelist Pages/BalanceList3';
import BalanceList4 from '../../pages/DebitCard Report Pages/Balancelist Pages/BalanceList4';
import BalanceList5 from '../../pages/DebitCard Report Pages/Balancelist Pages/BalanceList5';
import BalanceList6 from '../../pages/DebitCard Report Pages/Balancelist Pages/BalanceList6';
import ConsolidatedStrength from '../../pages/DebitCard Report Pages/ConsolidatedStrength';
import BackupData from '../../pages/DebitCard Report Pages/BackupData';
import TrailBalance from '../../pages/DebitCard Report Pages/TrailBalance';
import BankExpenses from '../../pages/DebitCard Report Pages/BankExpenses';
import CashExpenses from '../../pages/DebitCard Report Pages/CashExpenses';
import PromotionHigher from '../../pages/DebitCard Report Pages/PromotionHigher';





function DebitCardReportRoute() {
  return (
    <Routes>
      <Route path="day-dc-report" element={< DAYDCReport/>} />      
      <Route path="period-dc-report" element={< PeriodDCReport/>} />      
      <Route path="bank-ledger" element={< BankLedger/>} />      
      <Route path="balance-list" element={< BalanceList/>} />      
      <Route path="BalanceList1" element={< BalanceList1/>} />      
      <Route path="BalanceList2" element={<BalanceList2/>} />
      <Route path="BalanceList3" element={<BalanceList3/>} />    
      <Route path="BalanceList4" element={<BalanceList4/>} />
      <Route path="BalanceList5" element={<BalanceList5/>} />    
      <Route path="BalanceList6" element={<BalanceList6/>} />    
      <Route path="consolidated-strength" element={<ConsolidatedStrength/>} />      
      <Route path="Backup-Data" element={< BackupData/>} />      
      <Route path="Trail-Balance" element={< TrailBalance/>} />      
      <Route path="Bank-Expenses" element={< BankExpenses/>} />      
      <Route path="Cash-Expenses" element={< CashExpenses/>} />      
      <Route path="Promotion-Higher" element={< PromotionHigher/>} />      
    </Routes>
  );
}

export default DebitCardReportRoute