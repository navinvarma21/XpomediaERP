"use client"

import React, { useState, useEffect, useCallback } from 'react';
import MainContentPage from '../../components/MainContent/MainContentPage';
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuthContext } from '../../Context/AuthContext';
import { ENDPOINTS } from '../../SpringBoot/config';

const StaffUpdate = () => {
  const navigate = useNavigate();
  const { getAuthHeaders, schoolId, currentAcademicYear, user } = useAuthContext();
  
  const [staffList, setStaffList] = useState([]);
  const [filteredStaffList, setFilteredStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    staffCode: "",
    staffName: "",
    category: "",
    currentPhone: "",
    newPhone: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  // Debounce function for search
  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      
      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);
    
    return debouncedValue;
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch staff list
  const fetchStaffList = useCallback(async () => {
    if (!schoolId || !currentAcademicYear) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${ENDPOINTS.transaction}/staffphone/staff-list?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        {
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const staffData = result.data || [];
        setStaffList(staffData);
        setFilteredStaffList(staffData);
      } else {
        throw new Error(result.message || "Failed to load staff data");
      }
    } catch (error) {
      console.error("Error fetching staff list:", error);
      toast.error(error.message || "Error loading staff data");
      setStaffList([]);
      setFilteredStaffList([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId, currentAcademicYear, getAuthHeaders]);

  useEffect(() => {
    fetchStaffList();
  }, [fetchStaffList]);

  // Search staff when debounced term changes
  useEffect(() => {
    const searchStaff = async () => {
      if (!debouncedSearchTerm.trim() || !schoolId || !currentAcademicYear) {
        setFilteredStaffList(staffList);
        return;
      }

      try {
        const response = await fetch(
          `${ENDPOINTS.transaction}/staffphone/search?schoolId=${schoolId}&academicYear=${currentAcademicYear}&searchTerm=${encodeURIComponent(debouncedSearchTerm)}`,
          {
            headers: getAuthHeaders()
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setFilteredStaffList(result.data || []);
          } else {
            setFilteredStaffList(staffList.filter(staff =>
              staff.staffCode?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
              staff.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
            ));
          }
        }
      } catch (error) {
        console.error("Error searching staff:", error);
        // Fallback to client-side filtering
        setFilteredStaffList(staffList.filter(staff =>
          staff.staffCode?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          staff.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        ));
      }
    };

    searchStaff();
  }, [debouncedSearchTerm, schoolId, currentAcademicYear, getAuthHeaders, staffList]);

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.staffCode.trim()) {
      errors.staffCode = "Please select a staff member";
    }

    if (!formData.newPhone.trim()) {
      errors.newPhone = "Please enter a new phone number";
    } else if (!/^[0-9]{10}$/.test(formData.newPhone)) {
      errors.newPhone = "Please enter a valid 10-digit phone number";
    }

    if (formData.newPhone === formData.currentPhone) {
      errors.newPhone = "New phone number must be different from current number";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle staff code input change
  const handleStaffCodeInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);
    
    // Clear errors when user types
    if (formErrors.staffCode) {
      setFormErrors(prev => ({ ...prev, staffCode: "" }));
    }
    
    // Clear success message when user starts new action
    if (successMessage) {
      setSuccessMessage("");
    }
    
    // If user clears the input, reset the form
    if (value === "") {
      resetForm();
    }
  };

  // Handle staff selection from dropdown
  const handleStaffSelection = async (staff) => {
    setFormData({
      staffCode: staff.staffCode || "",
      staffName: staff.name || "",
      category: staff.category || "",
      currentPhone: staff.mobileNumber || "",
      newPhone: ""
    });
    setSearchTerm(staff.staffCode || "");
    setShowDropdown(false);
    
    // Clear staff code error
    if (formErrors.staffCode) {
      setFormErrors(prev => ({ ...prev, staffCode: "" }));
    }
    
    // Clear success message when selecting new staff
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  // Handle manual staff code entry
  const handleStaffCodeBlur = async () => {
    setTimeout(() => setShowDropdown(false), 200);
    
    // If user manually entered a staff code, try to find it
    if (searchTerm.trim() && !formData.staffCode) {
      try {
        const response = await fetch(
          `${ENDPOINTS.transaction}/staffphone/staff-details?schoolId=${schoolId}&academicYear=${currentAcademicYear}&staffCode=${encodeURIComponent(searchTerm)}`,
          {
            headers: getAuthHeaders()
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            handleStaffSelection(result.data);
          } else {
            toast.warning("Staff code not found. Please select from the dropdown.");
            setFormData(prev => ({
              ...prev,
              staffCode: searchTerm
            }));
          }
        } else {
          toast.warning("Staff code not found. Please select from the dropdown.");
          setFormData(prev => ({
            ...prev,
            staffCode: searchTerm
          }));
        }
      } catch (error) {
        console.error("Error validating staff code:", error);
        toast.warning("Staff code not found. Please select from the dropdown.");
        setFormData(prev => ({
          ...prev,
          staffCode: searchTerm
        }));
      }
    }
  };

  // Handle new phone number change
  const handleNewPhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({
      ...prev,
      newPhone: value
    }));
    
    // Clear phone error when user types
    if (formErrors.newPhone) {
      setFormErrors(prev => ({ ...prev, newPhone: "" }));
    }
    
    // Clear success message when making changes
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  // Reset form completely
  const resetForm = () => {
    setFormData({
      staffCode: "",
      staffName: "",
      category: "",
      currentPhone: "",
      newPhone: ""
    });
    setSearchTerm("");
    setFormErrors({});
    setShowDropdown(false);
    setSuccessMessage("");
  };

  // Handle form submission
  const handleSubmit = async (e, action) => {
    e.preventDefault();
    
    if (action === "cancel") {
      navigate("/home");
      return;
    }

    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(formErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }

    try {
      setSubmitting(true);
      setSuccessMessage("");
      
      const updateData = {
        schoolId,
        academicYear: currentAcademicYear,
        staffCode: formData.staffCode,
        newPhoneNumber: formData.newPhone,
        updatedBy: user?.username || "system"
      };

      const response = await fetch(
        `${ENDPOINTS.transaction}/staffphone/update-phone`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        const successMsg = result.message || "Phone number updated successfully!";
        toast.success(successMsg);
        setSuccessMessage(successMsg);
        
        // Update local state to reflect the change
        const updatedStaffList = staffList.map(staff => 
          staff.staffCode === formData.staffCode 
            ? { ...staff, mobileNumber: formData.newPhone }
            : staff
        );
        setStaffList(updatedStaffList);
        
        // Update form to show the new phone as current, but keep staff selected
        setFormData(prev => ({
          ...prev,
          currentPhone: formData.newPhone,
          newPhone: "" // Clear new phone field for next update
        }));
        
        // Refresh staff list to get latest data
        setTimeout(() => {
          fetchStaffList();
        }, 1000);

      } else {
        throw new Error(result.message || `Failed to update phone number: HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("Error updating phone number:", error);
      toast.error(error.message || "Failed to update phone number. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainContentPage>
      <div className="mb-4">
        <nav className="d-flex custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link>
          <span className="separator mx-2">/</span>
          <div>Transaction</div>
          <span className="separator mx-2">/</span>
          <span>Staff Phone Update</span>
        </nav>
      </div>
      
      <div className="bg-white rounded shadow">
        {/* Header */}
        <div className="bg-primary text-white p-3 mb-4">
          <h2 className="m-0">Staff Phone Update</h2>
          <p className="m-0 mt-1 small opacity-75">Update staff phone numbers securely</p>
        </div>

        {/* Success Message Banner */}
        {successMessage && (
          <div className="alert alert-success mx-3 mt-3 mb-0 d-flex align-items-center">
            <i className="fas fa-check-circle me-2"></i>
            <div className="flex-grow-1">
              <strong>Success!</strong> {successMessage}
            </div>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setSuccessMessage("")}
              aria-label="Close"
            ></button>
          </div>
        )}

        {/* Form Rows */}
        <div className="row g-3 mb-4 p-3">
          {/* Staff Code - Text Field + Dropdown */}
          <div className="col-md-6">
            <div className="form-group position-relative">
              <label className="form-label required">Staff Code</label>
              <input
                type="text"
                className={`form-control ${formErrors.staffCode ? 'is-invalid' : ''}`}
                value={searchTerm}
                onChange={handleStaffCodeInputChange}
                onFocus={() => setShowDropdown(true)}
                onBlur={handleStaffCodeBlur}
                placeholder="Enter or select staff code"
                disabled={loading || submitting}
                name="staffCode"
              />
              {formErrors.staffCode && (
                <div className="invalid-feedback d-block">
                  {formErrors.staffCode}
                </div>
              )}
              
              {/* Dropdown */}
              {showDropdown && filteredStaffList.length > 0 && (
                <div className="position-absolute w-100 bg-white border rounded shadow-sm mt-1 z-3 max-h-200 overflow-auto">
                  {filteredStaffList.map(staff => (
                    <div
                      key={staff.staffCode}
                      className="dropdown-item p-2 cursor-pointer hover-bg-light"
                      onClick={() => handleStaffSelection(staff)}
                      onMouseDown={(e) => e.preventDefault()} // Prevent blur
                    >
                      <div className="fw-bold text-primary">{staff.staffCode}</div>
                      <div className="small text-muted">
                        {staff.name} - {staff.designation} 
                        {staff.mobileNumber && ` - 📞 ${staff.mobileNumber}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* No results message */}
              {showDropdown && debouncedSearchTerm && filteredStaffList.length === 0 && (
                <div className="position-absolute w-100 bg-white border rounded shadow-sm mt-1 z-3 p-3 text-center text-muted">
                  <div>No staff members found for "{debouncedSearchTerm}"</div>
                  <small className="text-muted">Try a different search term</small>
                </div>
              )}
            </div>
          </div>

          {/* Staff Name */}
          <div className="col-md-6">
            <div className="form-group">
              <label className="form-label">Staff Name</label>
              <input
                className="form-control bg-light"
                value={formData.staffName}
                disabled
                placeholder="Select a staff member to see details"
              />
            </div>
          </div>

          {/* Category */}
          <div className="col-md-6">
            <div className="form-group">
              <label className="form-label">Category</label>
              <input
                className="form-control bg-light"
                value={formData.category}
                disabled
                placeholder="—"
              />
            </div>
          </div>

          {/* Current Phone (Read-only) */}
          <div className="col-md-6">
            <div className="form-group">
              <label className="form-label">Current Phone Number</label>
              <input
                className="form-control bg-light"
                value={formData.currentPhone || "—"}
                disabled
                placeholder="No phone number set"
              />
            </div>
          </div>

          {/* New Phone */}
          <div className="col-md-6">
            <div className="form-group">
              <label className="form-label required">New Phone Number</label>
              <input
                className={`form-control ${formErrors.newPhone ? 'is-invalid' : ''}`}
                value={formData.newPhone}
                onChange={handleNewPhoneChange}
                placeholder="Enter 10-digit phone number"
                type="tel"
                maxLength="10"
                disabled={!formData.staffCode || submitting}
                name="newPhone"
              />
              {formErrors.newPhone && (
                <div className="invalid-feedback d-block">
                  {formErrors.newPhone}
                </div>
              )}
              <div className="form-text">
                Enter 10-digit mobile number without country code
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="d-flex flex-wrap justify-content-center gap-3 p-3 border-top">
          <button
            className="btn custom-btn-clr flex-grow-1 flex-md-grow-0"
            onClick={(e) => handleSubmit(e, "save")}
            disabled={submitting || !formData.newPhone || !formData.staffCode}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Updating...
              </>
            ) : (
              "Update Phone Number"
            )}
          </button>
          
          <button 
            type="button"
            className="btn btn-outline-secondary flex-grow-1 flex-md-grow-0"
            onClick={resetForm}
            disabled={submitting}
          >
            {successMessage ? "Update Another" : "Reset"}
          </button>
          
          <button 
            className="btn btn-secondary flex-grow-1 flex-md-grow-0"
            onClick={(e) => handleSubmit(e, "cancel")}
            disabled={submitting}
          >
            Back to Home
          </button>
        </div>

        {/* Loading Indicator for initial load */}
        {loading && (
          <div className="text-center p-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading staff data...</span>
            </div>
            <div className="mt-2 text-muted">Loading staff data...</div>
          </div>
        )}

        {/* Info Card */}
        {!loading && staffList.length === 0 && (
          <div className="alert alert-info mx-3">
            <div className="d-flex">
              <div className="flex-shrink-0">
                <i className="fas fa-info-circle fa-lg"></i>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="alert-heading">No Staff Members Found</h6>
                <p className="mb-0">There are no active staff members in the current academic year.</p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions after successful update */}
        {successMessage && (
          <div className="alert alert-light mx-3 mb-3 border">
            <div className="d-flex">
              <div className="flex-shrink-0">
                <i className="fas fa-lightbulb text-warning fa-lg"></i>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="alert-heading">What's Next?</h6>
                <p className="mb-1">You can:</p>
                <ul className="mb-0">
                  <li>Update another staff member's phone number</li>
                  <li>Click "Update Another" to reset the form</li>
                  <li>Click "Back to Home" to return to the main menu</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Styles */}
        <style>
          {`
            .bg-primary {
              background-color: #0B3D7B !important;
            }
            .form-control {
              border-radius: 4px;
              border: 1px solid #ced4da;
            }
            .form-control:disabled {
              background-color: #f8f9fa;
              opacity: 1;
            }
            .form-label {
              font-weight: 500;
            }
            .form-label.required::after {
              content: " *";
              color: #dc3545;
            }
            .gap-3 {
              gap: 1rem;
            }
            .btn {
              padding: 0.5rem 2rem;
              border-radius: 4px;
              font-weight: 500;
            }
            .custom-btn-clr {
              background-color: #0B3D7B;
              color: white;
              border: 1px solid #0B3D7B;
            }
            .custom-btn-clr:hover:not(:disabled) {
              background-color: #092f63;
              border-color: #092f63;
              color: white;
            }
            .custom-btn-clr:disabled {
              background-color: #6c757d;
              border-color: #6c757d;
              opacity: 0.65;
            }
            .dropdown-item {
              cursor: pointer;
              border-bottom: 1px solid #f8f9fa;
              transition: background-color 0.15s ease;
            }
            .dropdown-item:hover {
              background-color: #f8f9fa;
            }
            .hover-bg-light:hover {
              background-color: #f8f9fa !important;
            }
            .max-h-200 {
              max-height: 200px;
            }
            .cursor-pointer {
              cursor: pointer;
            }
            .bg-light {
              background-color: #f8f9fa !important;
            }
            @media (max-width: 768px) {
              .btn {
                width: 100%;
              }
            }
            .custom-breadcrumb {
              font-size: 14px;
            }
            .custom-breadcrumb a {
              color: #0B3D7B;
              text-decoration: none;
            }
            .custom-breadcrumb a:hover {
              text-decoration: underline;
            }
            .separator {
              color: #6c757d;
            }
            .border-top {
              border-top: 1px solid #dee2e6 !important;
            }
          `}
        </style>
      </div>
      
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </MainContentPage>
  );
};

export default StaffUpdate;