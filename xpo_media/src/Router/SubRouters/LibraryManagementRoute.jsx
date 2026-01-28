import React from "react";
import { Routes, Route } from "react-router-dom";
import CourseSetup from "../../pages/Administration Pages/MainPages/CourseSetup";
import BookManagement from "../../pages/LibraryManagement/BookManagement";
import AddNewBookDetail from "../../pages/LibraryManagement/AddNewBookDetail";
import BookEntry from "../../pages/LibraryManagement/BookEntry";
// import MembersManagement from "../../pages/LibraryManagement/MembersManagement";
import BookCategorySetup from "../../pages/LibraryManagement/BookCategorySetup";
import PublisherSetup from "../../pages/LibraryManagement/PublisherSetup";
import EditBookDetail from "../../pages/LibraryManagement/EditBookDetail";
import ViewBookDetail from "../../pages/LibraryManagement/ViewBookDetail";
import LibraryMembership from "../../pages/LibraryManagement/LibraryMembership";
import BookIssueDetails from "../../pages/LibraryManagement/BookIssueDetails";
import BookSetup from "../../pages/LibraryManagement/Book-Setup/BookSetup";
import StaffandstudentSetup from "../../pages/LibraryManagement/StaffandstudentSetup";
import BookSupplierMaster from "../../pages/LibraryManagement/BookSupplierMaster";
import QRCodeSetup from "../../pages/LibraryManagement/QR Code Setup/QRCodeSetup";
import QRCodeSetup_New from "../../pages/LibraryManagement/QR Code Setup/QRCodeSetup_New";
import QRCodeSetup_Exist from "../../pages/LibraryManagement/QR Code Setup/QRCodeSetup_Exist";
import Bookissue_entry from "../../pages/LibraryManagement/Bookissue_entry";
import Library_Report_Generation from "../../pages/LibraryManagement/Library Report Generation/Library_Report_Generation";
import Book_Issue from "../../pages/LibraryManagement/Book_Issue_Book_Return/Book_Issue";
import Book_Return from "../../pages/LibraryManagement/Book_Issue_Book_Return/Book_Return";
import Stock_Report from "../../pages/LibraryManagement/Library Report Generation/Stock_Report";
import Book_Issued_Report from "../../pages/LibraryManagement/Library Report Generation/Book_Issued_Report";
import Book_Return_Report from "../../pages/LibraryManagement/Library Report Generation/Book_Return_Report";

function LibraryManagementRoute() {
  return (
    <Routes>
      <Route path="/Staff-Student-Master-Setup" element={<StaffandstudentSetup/>} />

      <Route path="/Book-Supplier-Master" element={<BookSupplierMaster/>} />
     
      <Route path="/book-setup" element={<BookSetup/>} /> 

      <Route path="/BookCategorySetup" element={<BookCategorySetup/>} /> 

      <Route path="/PublisherSetup" element={<PublisherSetup/>} /> 

      <Route path="/AddNewBookDetail" element={<AddNewBookDetail/>} /> 

      <Route path="/BookManagement" element={<BookManagement/>} /> 

      <Route path="/QR-code-Setup" element={<QRCodeSetup/>} /> 

      <Route path="/QR Code Setup - New" element={<QRCodeSetup_New/>} /> 

       <Route path="/QR Code Setup - Exist" element={<QRCodeSetup_Exist/>} /> 

       <Route path="/Bookissue_entry" element={<Bookissue_entry/>} /> 

       <Route path="/Library_Report_Generation" element={<Library_Report_Generation/>} /> 

        <Route path="/Book_issue" element={<Book_Issue/>} />

        <Route path="/Book_Return" element={<Book_Return/>} /> 

        <Route path="/Stock_Report" element={<Stock_Report/>} />  

        <Route path="/Book Issued Report" element={<Book_Issued_Report/>} />  

        <Route path="/Book Return Report" element={<Book_Return_Report/>} />  






      
    </Routes>
  );
}

export default LibraryManagementRoute;