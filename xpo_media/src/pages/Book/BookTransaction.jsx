"use client"

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import MainContentPage from "../../components/MainContent/MainContentPage";

const BookTransaction = () => {
  const [className, setClassName] = useState("");
  const location = useLocation();

  // Create breadcrumb items from current path
  const pathnames = location.pathname.split("/").filter((x) => x);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Class Name:", className);
  };

  const handleReset = () => {
    setClassName("");
  };

  return (
    <MainContentPage>
      <div className="container-fluid px-4 py-3">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <h4 className="fw-bold">Book Transaction</h4>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="mb-4">
          <nav className="d-flex custom-breadcrumb py-1 py-lg-3">
            <Link to="/home">Home</Link>
            <span className="separator mx-2"></span>
            <div>Transaction</div>
            <span className="separator mx-2"></span>
            <span>Book Transaction</span>
          </nav>
        </div>

        {/* Cards Grid */}
        <div className="row g-4">
          {/* Book/Material Purchase Card */}
          <Link
            style={{ textDecoration: "none" }}
            className="col-12 col-md-6 col-lg-3"
            to="/book/book-material-purchase"
          >
            <div>
              <div className="card fee-setup-card h-100">
                <div className="card-body d-flex align-items-center justify-content-center">
                  <h5 className="card-title text-white m-0">Book/Material Purchase</h5>
                </div>
              </div>
            </div>
          </Link>

          {/* Book Distribute Card - Now separate */}
          <Link
            style={{ textDecoration: "none" }}
            className="col-12 col-md-6 col-lg-3"
            to="/book/book-distribute"
          >
            <div>
              <div className="card fee-setup-card h-100">
                <div className="card-body d-flex align-items-center justify-content-center">
                  <h5 className="card-title text-white m-0">Book Distribute</h5>
                </div>
              </div>
            </div>
          </Link>

          {/* Utilise Material Card - Now separate */}
          <Link
            style={{ textDecoration: "none" }}
            className="col-12 col-md-6 col-lg-3"
            to="/book/utilise-material"
          >
            <div>
              <div className="card fee-setup-card h-100">
                <div className="card-body d-flex align-items-center justify-content-center">
                  <h5 className="card-title text-white m-0">Utilise Material/Other Items</h5>
                </div>
              </div>
            </div>
          </Link>

          {/* Purchase Entry Card */}
          <Link
            style={{ textDecoration: "none" }}
            className="col-12 col-md-6 col-lg-3"
            to="/book/purchase-entry"
          >
            <div>
              <div className="card fee-setup-card h-100">
                <div className="card-body d-flex align-items-center justify-content-center">
                  <h5 className="card-title text-white m-0">Purchase Entry (Journal Entry)</h5>
                </div>
              </div>
            </div>
          </Link>

          {/* Supplier Payment Card */}
          <Link
            style={{ textDecoration: "none" }}
            className="col-12 col-md-6 col-lg-3"
            to="/book/supplier-payment"
          >
            <div>
              <div className="card fee-setup-card h-100">
                <div className="card-body d-flex align-items-center justify-content-center">
                  <h5 className="card-title text-white m-0">Supplier Payment</h5>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <style>
        {`
          .fee-setup-card {
            background-color: #007bff;
            border: none;
            border-radius: 8px;
            transition: transform 0.2s;
          }

          .fee-setup-card:hover {
            transform: scale(1.05);
          }

          .fee-setup-card .card-body {
            height: 100%;
          }

          .fee-setup-card .card-title {
            font-size: 1.25rem;
            text-align: center;
          }

          .custom-breadcrumb {
            background-color: #f8f9fa;
            border-radius: 4px;
          }

          .custom-breadcrumb a {
            color: #007bff;
            text-decoration: none;
          }

          .custom-breadcrumb a:hover {
            text-decoration: underline;
          }

          .custom-breadcrumb .separator {
            color: #6c757d;
          }

          .custom-breadcrumb div {
            color: #6c757d;
          }
        `}
      </style>
    </MainContentPage>
  );
};

export default BookTransaction;