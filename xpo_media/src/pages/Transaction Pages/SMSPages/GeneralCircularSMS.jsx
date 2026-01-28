import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import MainContentPage from "../../../components/MainContent/MainContentPage";

const CheckboxItem = ({ label, selectedOptions, handleCheckboxChange }) => {
  return (
    <div className="mb-3 d-flex align-items-center gap-2">
      <div className="form-check mb-0">
        <input
          type="radio"
          className="form-check-input"
          id={label.toLowerCase()}
          name="formType"
          value={label}
          checked={selectedOptions === label}
          onChange={handleCheckboxChange}
        />
        <label className="form-check-label fw-bold" htmlFor={label.toLowerCase()}>
          {label}
        </label>
      </div>
      <select className="form-select">
        <option>Select {label}</option>
      </select>
    </div>
  );
};

export default function GeneralCircularSMS() {
  const [messageContent, setMessageContent] = useState("");
  const [noOfStudents, setNoOfStudents] = useState(0);
  const [selectedOption, setSelectedOption] = useState("Category");

  const handleCheckboxChange = (event) => {
    setSelectedOption(event.target.value);
  };

  return (
    <MainContentPage>
      <div className="p-0">
      <nav aria-label="breadcrumb" className="mb-3 p-3">
          <ol className="breadcrumb d-flex align-items-center mb-0">
            <li className="breadcrumb-item">
              <Link to="/home" className="text-primary text-decoration-none">Home</Link>
            </li>
            <ChevronRight size={16} className="mx-2" />
            <li className="breadcrumb-item">
              <Link className="text-dark text-decoration-none">Transaction</Link>
            </li>
            <ChevronRight size={16} className="mx-2" />
            <li className="breadcrumb-item">
              <Link to="/transaction/sms-send" className="text-primary text-decoration-none">SMS Send</Link>
            </li>
            <ChevronRight size={16} className="mx-2" />
            <li className="breadcrumb-item active text-dark" aria-current="page">
              General Circular SMS
            </li>
          </ol>
        </nav>
        {/* Header */}
        <div className="p-3 text-white" style={{ backgroundColor: "#0B3D7B", borderRadius: "6px 6px 0 0" }}>
          <h4 className="mb-0">General Circular SMS</h4>
        </div>

        {/* Breadcrumb */}
      

        {/* Form Content */}
        <div className="border p-4 bg-white" style={{ borderRadius: "0 0 6px 6px" }}>
          <div className="row">
            {/* Left Column */}
            <div className="col-md-6">
              {['Category', 'DOB', 'Group', 'Wedding'].map((label, index) => (
                <CheckboxItem
                  key={index}
                  label={label}
                  selectedOptions={selectedOption}
                  handleCheckboxChange={handleCheckboxChange}
                />
              ))}

              {['Message Template', 'Client Code', "Client Name's"].map((placeholder, index) => (
                <select className="form-select mb-3" key={index}>
                  <option>{placeholder}</option>
                </select>
              ))}
            </div>

            {/* Right Column - List Nos */}
            <div className="col-md-6">
              <div className="bg-light p-3 border rounded mb-3">
                <h5 className="mb-2">List Nos</h5>
                <div style={{ height: "150px", overflowY: "auto" }}>{/* List content */}</div>
              </div>
              <button className="btn text-white w-100 mb-2" style={{ backgroundColor: "#0B3D7B" }}>Remove [Standard & Section]</button>

              <div className="d-flex gap-2 mb-2">
                <select className="form-select">
                  <option>Select Standard</option>
                </select>
                <select className="form-select">
                  <option>Select Section</option>
                </select>
              </div>

              <div className="d-flex gap-2 mb-2">
                <button className="btn text-white w-50" style={{ backgroundColor: "#0B3D7B" }}>Remove Standard</button>
                <button className="btn text-white w-50" style={{ backgroundColor: "#0B3D7B" }}>Remove Section</button>
              </div>

              <div className="d-flex gap-2">
                <select className="form-select w-50">
                  <option>Select Status</option>
                </select>
                <select className="form-select w-50">
                  <option>Select Option</option>
                </select>
              </div>
            </div>
          </div>

          {/* Individual List Button */}
          <button className="btn text-white w-100 my-3" style={{ backgroundColor: "#0B3D7B" }}>Individual List</button>

          {/* Data Grid */}
          <div className="table-responsive mt-3">
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
                <label className="fw-bold">No Of Student:</label>
                <span className="fw-bold ms-2">{noOfStudents}</span>
              </div>
              <div className="mb-3">
                <label className="fw-bold">Message Contents:</label>
                <span className="fw-bold ms-2">{messageContent.length}</span>
              </div>
              <textarea
                className="form-control mb-3"
                rows={5}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
              />
              <div className="p-3 mb-3 mb-lg-0 text-white text-center" style={{ backgroundColor: "#0B3D7B", borderRadius: "6px" }}>
                No. Of Characters : {messageContent.length}, No. Of SMS : {(messageContent.length / 160).toFixed(2)}
              </div>
            </div>

            <div className="col-md-4 d-flex flex-column justify-content-end">
              {['Msg Send', 'View', 'Close'].map((label, index) => (
                <button className="btn text-white mb-3" style={{ backgroundColor: "#0B3D7B", padding: "10px" }} key={index}>
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