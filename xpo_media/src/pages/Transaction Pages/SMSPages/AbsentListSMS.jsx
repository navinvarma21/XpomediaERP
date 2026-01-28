import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import MainContentPage from "../../../components/MainContent/MainContentPage";

export default function AbsentListSMS() {
  const [messageContent, setMessageContent] = useState("");
  const [selectedOptions, setSelectedOptions] = useState([]);

  const handleCheckboxChange = (event) => {
    const { value, checked } = event.target;
    setSelectedOptions((prev) =>
      checked ? [...prev, value] : prev.filter((item) => item !== value)
    );
  };

  return (
    <MainContentPage>
      <div className="p-0">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-3 p-3   ">
          <ol className="breadcrumb d-flex align-items-center mb-0">
            <li className="breadcrumb-item">
              <Link to="/home" className="text-primary text-decoration-none">Home</Link>
            </li>
            <ChevronRight size={16} className="mx-2" />
            <li className="breadcrumb-item">
              <Link  className="text-dark text-decoration-none">Transaction</Link>
            </li>
            <ChevronRight size={16} className="mx-2" />
            <li className="breadcrumb-item">
              <Link to="/transaction/sms-send" className="text-primary text-decoration-none">SMS Send</Link>
            </li>
            <ChevronRight size={16} className="mx-2" />
            <li className="breadcrumb-item active text-dark" aria-current="page">
              Absent List SMS
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div
          className="p-3 text-white"
          style={{ backgroundColor: "#0B3D7B", borderRadius: "6px 6px 0 0" }}
        >
          <h4 className="mb-0">Absent List SMS</h4>
        </div>

        {/* Form Content */}
        <div
          className="border p-4 bg-white"
          style={{ borderRadius: "0 0 6px 6px" }}
        >
          <div className="row">
            {/* Left Column */}
            <div className="col-md-8">
              {[
                "Standard / Course",
                "Session",
                "Date"
              ].map((label, index) => (
                <div
                  className="mb-4 d-flex align-items-center gap-3"
                  key={index}
                >
                  <div className="form-check mb-0">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id={label.toLowerCase().replace(/\s+/g, "-")}
                      name="formType"
                      value={label}
                      checked={selectedOptions.includes(label)}
                      onChange={handleCheckboxChange}
                    />
                    <label
                      className="form-check-label fw-bold"
                      htmlFor={label.toLowerCase().replace(/\s+/g, "-")}
                    >
                      {label}
                    </label>
                  </div>
                  <select className="form-select">
                    <option>Select {label}</option>
                  </select>
                </div>
              ))}

              {[
                "Admin.Nos.",
                "Candidate Name’s"
              ].map((placeholder, index) => (
                <select className="form-select mb-3" key={index}>
                  <option>{placeholder}</option>
                </select>
              ))}
            </div>

            {/* Right Column - List Numbers */}
            <div className="col-md-4">
              <div className="bg-light p-3 border rounded">
                <h5 className="mb-2">List Nos</h5>
                <div style={{ height: "350px", overflowY: "auto" }}>{/* List content */}</div>
              </div>
            </div>
          </div>

          {/* Data Grid */}
          <div className="table-responsive mt-4">
            <table className="table table-bordered">
              <thead>
                <tr>
                  {[...Array(8)].map((_, i) => (
                    <th key={i} className="p-3"></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {[...Array(8)].map((_, i) => (
                    <td key={i} className="p-3"></td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bottom Section */}
          <div className="row mt-4">
            <div className="col-md-8">
              <div className="mb-3">
                <label className="me-2 fw-bold">No Of Student:</label>
                <span className="fw-bold">0</span>
              </div>
              <div className="mb-3">
                <label className="me-2 fw-bold">Message Contents:</label>
                <span className="fw-bold">{messageContent.length}</span>
              </div>
              <textarea
                className="form-control mb-3"
                rows={5}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
              />
              <div
                className="p-3 text-white text-center"
                style={{
                  backgroundColor: "#0B3D7B",
                  fontSize: "16px",
                  borderRadius: "6px"
                }}
              >
                No. Of Characters : {messageContent.length}, No. Of SMS : {(messageContent.length / 160).toFixed(2)}
              </div>
            </div>
            <div className="col-md-4 d-flex flex-column justify-content-end">
              {["Msg Send", "View", "Close"].map((label, index) => (
                <button
                  className="btn text-white mb-3"
                  style={{
                    backgroundColor: "#0B3D7B",
                    fontSize: "16px",
                    padding: "10px"
                  }}
                  key={index}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainContentPage>
  );
}
