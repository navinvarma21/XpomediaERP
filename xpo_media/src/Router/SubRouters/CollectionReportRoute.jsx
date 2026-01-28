import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TutionFee from '../../pages/Collection Report Pages/TutionFee';
import MiscellaneousFeeCollection from '../../pages/Collection Report Pages/MiscellaneousFeeCollection';
import Concession from '../../pages/Collection Report Pages/ConcessionA-C';
import BillWiseDetails from '../../pages/Collection Report Pages/BillWiseDetails';
import ReceiptDetails from '../../pages/Collection Report Pages/ReceiptDetails';
import RoutwiseBalanceReport from '../../pages/Collection Report Pages/RoutwiseBalanceReport';
import DayCollectionReport from '../../pages/Collection Report Pages/Tution Fee/DayCollectionReport';
import PeriodicalCollectionReport from '../../pages/Collection Report Pages/Tution Fee/PeriodicalCollectionReport';
import MiscellaneousDayCollectionReport from '../../pages/Collection Report Pages/Miscellaneous Fee Collection/DayCollectionReport';
import MiscellaneousPeriodicalCollectionReport from '../../pages/Collection Report Pages/Miscellaneous Fee Collection/PeriodicalCollectionReport';





function CollectionReportRoute() {
  return (
    <Routes>
      <Route path="tution-fee" element={< TutionFee/>} />
      <Route path="Miscellaneous-Fee-Collection" element={< MiscellaneousFeeCollection/>} />
      <Route path="Concession-AC" element={< Concession/>} />
      <Route path="Bill-Wise-Details" element={< BillWiseDetails/>} />
      <Route path="Receipt-Details" element={< ReceiptDetails/>} />
      <Route path="Routwise-Balance-Report" element={< RoutwiseBalanceReport/>} />
      <Route path="Day-Collection-Report" element={< DayCollectionReport/>} />
      <Route path="Periodical-Collection-Report" element={< PeriodicalCollectionReport/>} />
      <Route path="Miscellaneous-Day-Collection-Report" element={< MiscellaneousDayCollectionReport/>} />
      <Route path="Miscellaneous-Periodical-Collection-Report" element={< MiscellaneousPeriodicalCollectionReport/>} />
      
      
    </Routes>
  );
}

export default CollectionReportRoute;