import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import MainContentPage from "../../../components/MainContent/MainContentPage";
import "../Styles/ReceiptSetup.css";

const ReceiptSetup = () => {
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
            <h4 className="fw-bold">Students</h4>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="mb-4">
          <nav className="custom-breadcrumb d-flex align-items-center py-1 py-lg-3">
            <Link to="/home" className="text-decoration-none text-primary">Home</Link>
            <span className="mx-2">&gt;</span>
            <span>Administration</span>
            <span className="mx-2">&gt;</span>
            <span className="fw-bold">Receipt Setup</span>
          </nav>
        </div>


        {/* Cards Grid */}
        <div className="row g-4">
          {/* Regular Candidates Card */}

          <Link
            style={{ textDecoration: "none" }}
            className="col-12 col-md-6 col-lg-3"
            to="/administration/head-setup"
          >
            <div>
              <div className="card fee-setup-card h-100">
                <div className="card-body d-flex align-items-center justify-content-center">

                  <h5 className="card-title text-white m-0">
                    Head Setup
                  </h5>

                </div>
              </div>
            </div>
          </Link>

          {/* RTE Candidates Card */}
          <Link
            style={{ textDecoration: "none" }}
            className="col-12 col-md-6 col-lg-3"
            to="/administration/subhead-setup"
          >
            <div className="card fee-setup-card h-100">
              <div className="card-body d-flex align-items-center justify-content-center">
                <h5 className="card-title text-white m-0">Sub Head Setup</h5>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </MainContentPage>
  );
};

export default ReceiptSetup;
