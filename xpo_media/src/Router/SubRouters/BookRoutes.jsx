import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CategoryHead from '../../pages/Book/CategoryHead';
import CustomerStaffMaster from '../../pages/Book/Customer-Staff-Master';
import BookMaster from '../../pages/Book/Book-Master';
import BookSetupClassWise from '../../pages/Book/BookSetupClassWise';
import SupplierSetup from '../../pages/Book/SupplierSetup';
import ItemBookSetup from '../../pages/Book/Item-Book-Setup';
import BookTransaction from '../../pages/Book/BookTransaction';
import BookMaterialPurchase from '../../pages/Book/BookTransaction Pages/BookMaterialPurchase';
import BookDistribute from '../../pages/Book/BookTransaction Pages/BookDistribute';
import UtiliseMaterialOtherItems from '../../pages/Book/BookTransaction Pages/UtiliseMaterialOtherItems';
import PurchaseEntry from '../../pages/Book/BookTransaction Pages/PurchaseEntry';
import SupplierPaymentEntry from '../../pages/Book/BookTransaction Pages/SupplierPaymentEntry';
import UnitsSetup from '../../pages/Book/UnitsSetup';
import BookMaterialPurchaseView from '../../pages/Book/BookTransaction Pages/BookMaterialPurchaseView';
import GroupSetup from '../../pages/Book/GroupSetup';
import BookTransactionReport from '../../pages/Book/BookTransactionReport';
import StockReport from '../../pages/Book/BookTransaction Pages/StockReport';
import PurchaseReport from '../../pages/Book/BookTransaction Pages/PurchaseReport';
import BookDistributeReport from '../../pages/Book/BookTransaction Pages/BookDistributeReport';
import UtilisedReport from '../../pages/Book/BookTransaction Pages/UtilisedReport';
import Ledger from '../../pages/Book/BookTransaction Pages/Ledger';
import BankAccountSetup from '../../pages/Book/BookTransaction Pages/BankAccountSetup';





function BookRoutes() {
  return (
    <Routes>

        <Route path="Group-Setup" element={<GroupSetup/>} />
        <Route path="Unit-Setup" element={<UnitsSetup/>} />


   <Route path="item-book-master" element={<ItemBookSetup/>} />
      <Route path="category-head" element={<CategoryHead/>} />
      <Route path="customer-staff-master" element={<CustomerStaffMaster/>} />
      <Route path="Book-Master" element={<BookMaster/>} />
      <Route path="Book-setup-class-wise" element={<BookSetupClassWise/>} />
      <Route path="supplier-Setup" element={<SupplierSetup/>} />
      <Route path="book-transaction" element={<BookTransaction/>} />

      <Route path="book-transaction-Report" element={<BookTransactionReport/>} />
      <Route path="book-material-purchase" element={<BookMaterialPurchase/>} />
      <Route path="book-distribute" element={<BookDistribute/>} />
      <Route path="utilise-material" element={<UtiliseMaterialOtherItems/>} />
      <Route path="purchase-entry" element={<PurchaseEntry/>} />
      <Route path="supplier-payment" element={<SupplierPaymentEntry/>} />
      <Route path="unit-setup" element={<UnitsSetup/>} />
      <Route path="book-material-view" element={<BookMaterialPurchaseView/>} />
      <Route path="Bank-Setup" element={<BankAccountSetup/>} />

      {/* Report */}
     
      <Route path="Stock-Report" element={<StockReport/>} />
      <Route path="Purchase-Report" element={<PurchaseReport/>} />
      <Route path="Book-Distribute-Report" element={<BookDistributeReport/>} />
      <Route path="Utilised Report" element={<UtilisedReport/>} />
      <Route path="Ledger" element={<Ledger/>} />

    </Routes>
  );
}

export default BookRoutes;