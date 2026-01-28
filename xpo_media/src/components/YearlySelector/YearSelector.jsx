"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "../../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ENDPOINTS } from "../../SpringBoot/config";

function YearSelector() {
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [showAddYear, setShowAddYear] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showAddYearConfirmDialog, setShowAddYearConfirmDialog] = useState(false);
  const [yearError, setYearError] = useState("");
  const [newYearToAdd, setNewYearToAdd] = useState("");
  
  // New loading state
  const [loading, setLoading] = useState(false);

  const { user, updateCurrentAcademicYear } = useAuthContext();
  const navigate = useNavigate();
  const schoolName = user?.name || "";

  // ---------------- Fetch School & Years ----------------
  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    fetchSchoolData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchSchoolData = async () => {
    setLoading(true); // Start loading
    try {
      const token = sessionStorage.getItem("token");
      if (!token || !user?.uid) {
        setLoading(false);
        return;
      }

      const res = await axios.get(`${ENDPOINTS.auth.School}/${user.uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAcademicYears(res.data.academicYears || []);
    } catch (err) {
      console.error("Error fetching school data:", err);
      setAcademicYears([]);
    } finally {
      setLoading(false); // Stop loading regardless of success or error
    }
  };

  // Auto-set end year when start year changes
  useEffect(() => {
    if (startYear && startYear.length === 4 && !isNaN(parseInt(startYear))) {
      setEndYear((parseInt(startYear) + 1).toString());
    }
  }, [startYear]);

  const handleContinueClick = () => {
    if (selectedYear) setShowConfirmDialog(true);
  };

  const handleYearSelect = async () => {
    try {
      const token = sessionStorage.getItem("token");
      await axios.put(
        `${ENDPOINTS.auth.School}/${user.uid}/year`,
        { currentAcademicYear: selectedYear },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await updateCurrentAcademicYear(selectedYear);
      setShowConfirmDialog(false);
      navigate("/home", { replace: true });
    } catch (err) {
      console.error("Error selecting year:", err);
    }
  };

  // ---------------- Add Year Logic ----------------
  const validateYears = () => {
    setYearError("");
    if (!startYear || !endYear)
      return setYearError("Both years are required"), false;
    if (isNaN(startYear) || isNaN(endYear))
      return setYearError("Years must be numbers"), false;
    if (startYear.length !== 4 || endYear.length !== 4)
      return setYearError("Years must be 4 digits"), false;
    if (parseInt(endYear) !== parseInt(startYear) + 1)
      return setYearError("Years must be consecutive (e.g. 2024-2025)"), false;
    return true;
  };

  const handleAddYearClick = () => {
    if (!validateYears()) return;
    setNewYearToAdd(`${startYear}-${endYear}`);
    setShowAddYearConfirmDialog(true);
  };

  const handleAddYear = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.post(
        `${ENDPOINTS.auth.School}/${user.uid}/years`,
        { year: newYearToAdd },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAcademicYears(res.data.academicYears || []);
      setSelectedYear(newYearToAdd);
      await updateCurrentAcademicYear(newYearToAdd);

      setStartYear("");
      setEndYear("");
      setShowAddYear(false);
      setShowAddYearConfirmDialog(false);
    } catch (err) {
      console.error("Error adding year:", err);
    }
  };

  // ---------------- UI ----------------
  const ConfirmYearDialog = () =>
    showConfirmDialog && (
      <div className="confirm-dialog-overlay">
        <div className="confirm-dialog">
          <h3>Confirm Academic Year</h3>
          <p>Are you sure you want to continue with:</p>
          <div className="selected-year-display">{selectedYear}</div>
          <div className="confirm-dialog-buttons">
            <button className="cancel-btn" onClick={() => setShowConfirmDialog(false)}>Cancel</button>
            <button className="confirm-btn" onClick={handleYearSelect}>Confirm</button>
          </div>
        </div>
      </div>
    );

  const AddYearConfirmDialog = () =>
    showAddYearConfirmDialog && (
      <div className="confirm-dialog-overlay">
        <div className="confirm-dialog">
          <h3>Confirm New Academic Year</h3>
          <p>Are you sure you want to add and select:</p>
          <div className="selected-year-display">{newYearToAdd}</div>
          <div className="school-name-display"><strong>School:</strong> {schoolName}</div>
          <div className="confirm-dialog-buttons">
            <button className="cancel-btn" onClick={() => setShowAddYearConfirmDialog(false)}>Cancel</button>
            <button className="confirm-btn" onClick={handleAddYear}>Confirm</button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="year-selector-container">
      <div className="year-selector-card">
        <h2>Select Academic Year</h2>
        <p>Please select an academic year to continue</p>

        {!showAddYear ? (
          <>
            {schoolName && (
              <div className="school-name-header">
                <h3>School: {schoolName}</h3>
              </div>
            )}

            {/* Conditionally Render Loader or List */}
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p className="loading-text">Loading years...</p>
              </div>
            ) : academicYears.length > 0 ? (
              <div className="year-list">
                {academicYears.map((year) => (
                  <div
                    key={year}
                    className={`year-item ${selectedYear === year ? "selected" : ""}`}
                    onClick={() => setSelectedYear(year)}
                  >
                    {year}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-years">No academic years found. Please add one.</p>
            )}

            <div className="button-group">
              <button
                className="add-year-btn btn btn-secondary"
                disabled={loading} // Disable while loading
                onClick={() => {
                  setShowAddYear(true);
                  setYearError("");
                }}
              >
                Add New Academic Year
              </button>
              {selectedYear && (
                <button
                  className="continue-btn btn btn-primary"
                  onClick={handleContinueClick}
                >
                  Continue
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="add-year-form">
            <div className="school-input-wrapper">
              <label>School Name</label>
              <input
                type="text"
                value={schoolName}
                readOnly
                className="form-control school-input"
              />
              <div className="school-name-note">
                School name is from your profile and cannot be changed
              </div>
            </div>

            <div className="year-input-group">
              <div className="year-input-wrapper">
                <label>Start Year</label>
                <input
                  type="number"
                  placeholder="2024"
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  min="2000"
                  max="2100"
                  className="form-control year-input"
                />
              </div>
              <div className="year-separator">-</div>
              <div className="year-input-wrapper">
                <label>End Year</label>
                <input
                  type="number"
                  placeholder="2025"
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                  min="2000"
                  max="2100"
                  className="form-control year-input"
                />
              </div>
            </div>

            {yearError && <div className="year-error text-danger">{yearError}</div>}

            <div className="year-preview">
              Format:{" "}
              <span className="year-format">
                {startYear && endYear ? `${startYear}-${endYear}` : "YYYY-YYYY"}
              </span>
            </div>

            <div className="button-group">
              <button
                className="cancel-btn btn btn-secondary"
                onClick={() => {
                  setShowAddYear(false);
                  setStartYear("");
                  setEndYear("");
                  setYearError("");
                }}
              >
                Cancel
              </button>
              <button
                className="save-btn btn btn-primary"
                onClick={handleAddYearClick}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmYearDialog />
      <AddYearConfirmDialog />
  

      <style>{`
        .year-selector-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(180deg, #1470E1 0%, #0B3D7B 100%);
          padding: 20px;
        }
        
        .year-selector-card {
          background: white;
          border-radius: 10px;
          padding: 30px;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        
        h2 {
          color: #0B3D7B;
          margin-bottom: 10px;
          text-align: center;
        }
        
        p {
          color: #666;
          margin-bottom: 20px;
          text-align: center;
        }

        /* --- LOADER STYLES --- */
        .loading-container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 30px 0;
            min-height: 150px;
        }

        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #0B3D7B;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        .loading-text {
            margin-top: 15px;
            font-size: 14px;
            color: #0B3D7B;
            font-weight: 500;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        /* --------------------- */
        
        .school-name-header {
          background-color: #f8f9fa;
          border-left: 4px solid #0B3D7B;
          padding: 10px 15px;
          margin-bottom: 20px;
          border-radius: 5px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .school-name-header h3 {
          margin: 0;
          font-size: 16px;
          color: #333;
        }
        
        .year-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .year-item {
          padding: 12px 15px;
          border: 1px solid #ddd;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .year-item:hover {
          background-color: #f5f5f5;
        }
        
        .year-item.selected {
          background-color: #0B3D7B;
          color: white;
          border-color: #0B3D7B;
        }
        
        .button-group {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
        }
        
        button {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: 500;
          transition: opacity 0.2s;
        }

        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .add-year-btn {
          background-color: #6c757d;
          color: white;
        }
        
        .continue-btn {
          background-color: #0B3D7B;
          color: white;
        }
        
        .cancel-btn {
          background-color: #6c757d;
          color: white;
        }
        
        .save-btn, .confirm-btn {
          background-color: #0B3D7B;
          color: white;
        }
        
        .school-input-wrapper {
          margin-bottom: 20px;
        }
        
        .school-input-wrapper label {
          display: block;
          margin-bottom: 5px;
          color: #555;
          font-size: 14px;
        }
        
        .school-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 16px;
        }
        
        .school-input[readonly] {
          background-color: #f8f9fa;
          cursor: not-allowed;
        }
        
        .school-name-note {
          font-size: 12px;
          color: #6c757d;
          margin-top: 5px;
          font-style: italic;
        }
        
        .year-input-group {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 15px;
        }
        
        .year-input-wrapper {
          flex: 1;
        }
        
        .year-input-wrapper label {
          display: block;
          margin-bottom: 5px;
          color: #555;
          font-size: 14px;
        }
        
        .year-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 16px;
        }
        
        .year-separator {
          font-size: 24px;
          font-weight: bold;
          margin: 0 10px;
          padding-top: 25px;
          color: #0B3D7B;
        }
        
        .year-error {
          color: #dc3545;
          font-size: 14px;
          margin-top: 5px;
          margin-bottom: 15px;
          text-align: left;
        }
        
        .year-preview {
          background-color: #f8f9fa;
          padding: 10px;
          border-radius: 5px;
          text-align: center;
          margin-bottom: 15px;
          color: #666;
        }
        
        .year-format {
          font-weight: bold;
          color: #0B3D7B;
        }
        
        .no-years {
          color: #dc3545;
          font-style: italic;
        }
        
        /* Confirmation Dialog Styles */
        .confirm-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .confirm-dialog {
          background: white;
          border-radius: 10px;
          padding: 25px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          text-align: center;
        }
        
        .confirm-dialog h3 {
          color: #0B3D7B;
          margin-bottom: 15px;
        }
        
        .selected-year-display {
          background-color: #f8f9fa;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 12px;
          margin: 15px 0;
          font-size: 18px;
          font-weight: bold;
          color: #0B3D7B;
        }
        
        .school-name-display {
          background-color: #f8f9fa;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 12px;
          margin: 15px 0;
          font-size: 16px;
          color: #333;
        }
        
        .confirm-dialog-buttons {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 20px;
        }
        
        .confirm-dialog-buttons button {
          min-width: 100px;
        }
        
        /* Responsive adjustments */
        @media (max-width: 576px) {
          .year-selector-card {
            padding: 20px;
          }
          
          .button-group {
            flex-direction: column;
            gap: 10px;
          }
          
          button {
            width: 100%;
          }
          
          .confirm-dialog-buttons {
            flex-direction: row;
          }
        }
      `}</style>
    </div>
  )
}

export default YearSelector