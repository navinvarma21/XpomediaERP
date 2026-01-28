"use client"

import React, { useState, useEffect } from "react";
import { Container, Form, Button, Row, Col, Spinner } from "react-bootstrap";
import MainContentPage from "../../../components/MainContent/MainContentPage";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaArrowLeft } from "react-icons/fa";
import { useAuthContext } from "../../../Context/AuthContext";
import { ENDPOINTS } from "../../../SpringBoot/config";

const StaffForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isViewMode = new URLSearchParams(location.search).get("mode") === "view";
  const { user, currentAcademicYear, schoolId } = useAuthContext();

  const [formData, setFormData] = useState({
    staffCode: "",
    name: "",
    familyHeadName: "",
    numberStreetName: "",
    placePinCode: "",
    stateId: "",
    state: "",
    districtId: "",
    district: "",
    gender: "",
    dateOfBirth: "",
    communityId: "",
    community: "",
    casteId: "",
    caste: "",
    religionId: "",
    religion: "",
    nationalityId: "",
    nationality: "",
    designationId: "",
    designation: "",
    educationQualification: "",
    salary: "",
    pfNumber: "",
    categoryId: "",
    category: "",
    maritalStatus: "",
    majorSubject: "",
    optionalSubject: "",
    extraTalentDlNo: "",
    experience: "",
    classInChargeId: "",
    classInCharge: "",
    dateOfJoining: "",
    emailBankAcId: "",
    totalLeaveDays: "",
    mobileNumber: "",
    status: "",
    dateOfRelieve: "",
  });

  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [castes, setCastes] = useState([]);
  const [religions, setReligions] = useState([]);
  const [nationalities, setNationalities] = useState([]);
  const [staffDesignations, setStaffDesignations] = useState([]);
  const [staffCategories, setStaffCategories] = useState([]);
  const [courses, setCourses] = useState([]);

  const [isLoading, setIsLoading] = useState({
    init: true,
    states: false,
    districts: false,
    communities: false,
    castes: false,
    religions: false,
    nationalities: false,
    staffDesignations: false,
    staffCategories: false,
    courses: false,
    staffMember: false,
    submit: false,
    districtsByState: false,
  });

  // Get auth token
  const getAuthToken = () => {
    return sessionStorage.getItem("token") || sessionStorage.getItem("adminToken");
  };

  // API request helper
  const apiRequest = async (endpoint, options = {}) => {
    const token = getAuthToken();
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      return response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (schoolId && currentAcademicYear) {
      initializeData();
    }
    // eslint-disable-next-line
  }, [schoolId, currentAcademicYear]);

  // Effect to handle district filtering when stateId changes
  useEffect(() => {
    if (formData.stateId && districts.length > 0) {
      filterDistrictsByState(formData.stateId);
    }
  }, [formData.stateId, districts]);

  const initializeData = async () => {
    try {
      setIsLoading((prev) => ({ ...prev, init: true }));
      await Promise.all([
        fetchStates(),
        fetchDistricts(),
        fetchCommunities(),
        fetchCastes(),
        fetchReligions(),
        fetchNationalities(),
        fetchStaffDesignations(),
        fetchStaffCategories(),
        fetchCourses(),
      ]);

      if (id) {
        await fetchStaffMember(id);
      } else {
        // Auto-generate 4-digit staff code for new staff on frontend!
        const random4Digit = Math.floor(1000 + Math.random() * 9000); // Generates 1000-9999
        const newStaffCode = `STAFF${random4Digit}`;
        setFormData((prevState) => ({
          ...prevState,
          staffCode: newStaffCode,
        }));
      }
      setIsLoading((prev) => ({ ...prev, init: false }));
    } catch (error) {
      console.error("Error initializing data:", error);
      toast.error("Failed to initialize. Please try again.");
      setIsLoading((prev) => ({ ...prev, init: false }));
    }
  };

  // --- States ---
  const fetchStates = async () => {
    if (!currentAcademicYear || !schoolId) return;
    try {
      setIsLoading((prev) => ({ ...prev, states: true }));
      const statesData = await apiRequest(
        `${ENDPOINTS.administration}/staff-dropdowns/states?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      );
      setStates(statesData);
      setIsLoading((prev) => ({ ...prev, states: false }));
    } catch (error) {
      console.error("Error fetching states:", error);
      setIsLoading((prev) => ({ ...prev, states: false }));
    }
  };

  // --- Districts ---
  const fetchDistricts = async () => {
    if (!currentAcademicYear || !schoolId) return;
    try {
      setIsLoading((prev) => ({ ...prev, districts: true }));
      const districtsData = await apiRequest(
        `${ENDPOINTS.administration}/staff-dropdowns/districts?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      );
      setDistricts(districtsData);
      setIsLoading((prev) => ({ ...prev, districts: false }));
    } catch (error) {
      console.error("Error fetching districts:", error);
      setIsLoading((prev) => ({ ...prev, districts: false }));
    }
  };

  // --- Communities ---
  const fetchCommunities = async () => {
    if (!currentAcademicYear || !schoolId) return;
    try {
      setIsLoading((prev) => ({ ...prev, communities: true }));
      const communitiesData = await apiRequest(
        `${ENDPOINTS.administration}/staff-dropdowns/communities?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      );
      setCommunities(communitiesData);
      setIsLoading((prev) => ({ ...prev, communities: false }));
    } catch (error) {
      console.error("Error fetching communities:", error);
      setIsLoading((prev) => ({ ...prev, communities: false }));
    }
  };

  // --- Castes ---
  const fetchCastes = async () => {
    if (!currentAcademicYear || !schoolId) return;
    try {
      setIsLoading((prev) => ({ ...prev, castes: true }));
      const castesData = await apiRequest(
        `${ENDPOINTS.administration}/staff-dropdowns/castes?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      );
      setCastes(castesData);
      setIsLoading((prev) => ({ ...prev, castes: false }));
    } catch (error) {
      console.error("Error fetching castes:", error);
      setIsLoading((prev) => ({ ...prev, castes: false }));
    }
  };

  // --- Religions ---
  const fetchReligions = async () => {
    if (!currentAcademicYear || !schoolId) return;
    try {
      setIsLoading((prev) => ({ ...prev, religions: true }));
      const religionsData = await apiRequest(
        `${ENDPOINTS.administration}/staff-dropdowns/religions?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      );
      setReligions(religionsData);
      setIsLoading((prev) => ({ ...prev, religions: false }));
    } catch (error) {
      console.error("Error fetching religions:", error);
      setIsLoading((prev) => ({ ...prev, religions: false }));
    }
  };

  // --- Nationalities ---
  const fetchNationalities = async () => {
    if (!currentAcademicYear || !schoolId) return;
    try {
      setIsLoading((prev) => ({ ...prev, nationalities: true }));
      const nationalitiesData = await apiRequest(
        `${ENDPOINTS.administration}/staff-dropdowns/nationalities?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      );
      setNationalities(nationalitiesData);
      setIsLoading((prev) => ({ ...prev, nationalities: false }));
    } catch (error) {
      console.error("Error fetching nationalities:", error);
      setIsLoading((prev) => ({ ...prev, nationalities: false }));
    }
  };

  // --- Staff Designations ---
  const fetchStaffDesignations = async () => {
    if (!currentAcademicYear || !schoolId) return;
    try {
      setIsLoading((prev) => ({ ...prev, staffDesignations: true }));
      const designationsData = await apiRequest(
        `${ENDPOINTS.administration}/staff-dropdowns/staff-designations?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      );
      setStaffDesignations(designationsData);
      setIsLoading((prev) => ({ ...prev, staffDesignations: false }));
    } catch (error) {
      console.error("Error fetching staff designations:", error);
      setIsLoading((prev) => ({ ...prev, staffDesignations: false }));
    }
  };

  // --- Staff Categories ---
  const fetchStaffCategories = async () => {
    if (!currentAcademicYear || !schoolId) return;
    try {
      setIsLoading((prev) => ({ ...prev, staffCategories: true }));
      const categoriesData = await apiRequest(
        `${ENDPOINTS.administration}/staff-dropdowns/staff-categories?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      );
      setStaffCategories(categoriesData);
      setIsLoading((prev) => ({ ...prev, staffCategories: false }));
    } catch (error) {
      console.error("Error fetching staff categories:", error);
      setIsLoading((prev) => ({ ...prev, staffCategories: false }));
    }
  };

  // --- Courses ---
  const fetchCourses = async () => {
    if (!currentAcademicYear || !schoolId) return;
    try {
      setIsLoading((prev) => ({ ...prev, courses: true }));
      const coursesData = await apiRequest(
        `${ENDPOINTS.administration}/staff-dropdowns/staff-courses?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      );
      setCourses(coursesData);
      setIsLoading((prev) => ({ ...prev, courses: false }));
    } catch (error) {
      console.error("Error fetching courses:", error);
      setIsLoading((prev) => ({ ...prev, courses: false }));
    }
  };

  // --- Staff Member fetch ---
  const fetchStaffMember = async (staffId) => {
    if (!currentAcademicYear || !schoolId) {
      toast.error("Please select an academic year first");
      return;
    }
    try {
      setIsLoading((prev) => ({ ...prev, staffMember: true }));
      const staffData = await apiRequest(
        `${ENDPOINTS.administration}/staff/${staffId}?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      );

      // Set form data first
      setFormData(staffData);

      setIsLoading((prev) => ({ ...prev, staffMember: false }));
    } catch (error) {
      console.error("Error fetching staff member:", error);
      toast.error("Failed to fetch staff member. Please try again.");
      setIsLoading((prev) => ({ ...prev, staffMember: false }));
    }
  };

  // --- Handle state selection and filter districts ---
  const handleStateChange = async (e) => {
    const { value } = e.target;
    if (!value) {
      setFormData((prevState) => ({
        ...prevState,
        stateId: "",
        state: "",
        districtId: "",
        district: "",
      }));
      setFilteredDistricts([]);
      return;
    }
    const [id, displayValue] = value.split("|");
    setFormData((prevState) => ({
      ...prevState,
      stateId: id,
      state: displayValue,
      districtId: "",
      district: "",
    }));
  };

  // --- Filter districts by stateId ---
  const filterDistrictsByState = async (stateId) => {
    if (!stateId) {
      setFilteredDistricts([]);
      return;
    }

    setIsLoading((prev) => ({ ...prev, districtsByState: true }));
    try {
      const filtered = districts.filter(
        (district) => String(district.stateId) === String(stateId)
      );
      setFilteredDistricts(filtered);

      if (formData.districtId && filtered.length > 0) {
        const currentDistrictExists = filtered.some(
          district => String(district.id) === String(formData.districtId)
        );

        if (!currentDistrictExists) {
          setFormData(prev => ({
            ...prev,
            districtId: "",
            district: ""
          }));
        }
      }
    } catch (error) {
      console.error("Error filtering districts:", error);
      setFilteredDistricts([]);
    } finally {
      setIsLoading((prev) => ({ ...prev, districtsByState: false }));
    }
  };

  // --- Allow staffCode to be editable ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // --- Select change for dropdowns ---
  const handleSelectChange = (e) => {
    const { name, value } = e.target;

    if (name === "district") {
      if (!value) {
        setFormData((prevState) => ({
          ...prevState,
          districtId: "",
          district: "",
        }));
        return;
      }
      const [id, displayValue] = value.split("|");
      setFormData((prevState) => ({
        ...prevState,
        districtId: id,
        district: displayValue,
      }));
      return;
    }

    // For other dropdowns
    if (!value) {
      setFormData((prevState) => ({
        ...prevState,
        [`${name}Id`]: "",
        [name]: "",
      }));
      return;
    }
    const [id, displayValue] = value.split("|");
    setFormData((prevState) => ({
      ...prevState,
      [`${name}Id`]: id,
      [name]: displayValue,
    }));
  };

  // --- Get current district value for dropdown ---
  const getDistrictValue = () => {
    if (!formData.districtId || !formData.district) {
      return "";
    }

    const currentDistrict = filteredDistricts.find(
      district => String(district.id) === String(formData.districtId)
    );

    if (currentDistrict) {
      return `${formData.districtId}|${formData.district}`;
    }

    return "";
  };

  // --- Validate ---
  const validateForm = () => {
    const requiredFields = [
      "staffCode",
      "name",
      "familyHeadName",
      "numberStreetName",
      "placePinCode",
      "stateId",
      "districtId",
      "gender",
      "dateOfBirth",
      "communityId",
      "casteId",
      "religionId",
      "nationalityId",
      "designationId",
      "educationQualification",
      "salary",
      "pfNumber",
      "categoryId",
      "maritalStatus",
      "majorSubject",
      "extraTalentDlNo",
      "experience",
      "dateOfJoining",
      "emailBankAcId",
      "totalLeaveDays",
      "mobileNumber",
      "status",
    ];
    const missingFields = requiredFields.filter((field) => !formData[field]);
    if (missingFields.length > 0) {
      const fieldNames = missingFields.map((field) => {
        return field
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())
          .replace(/Id$/, "");
      });
      toast.error(`Please fill in all required fields: ${fieldNames.join(", ")}`);
      return false;
    }
    if (!/^\d{10}$/.test(formData.mobileNumber)) {
      toast.error("Mobile number must be 10 digits");
      return false;
    }
    return true;
  };

  // --- Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentAcademicYear || !schoolId) {
      toast.error("Please select an academic year first");
      return;
    }
    if (!validateForm()) {
      return;
    }
    try {
      setIsLoading((prev) => ({ ...prev, submit: true }));
      const staffData = {
        ...formData,
        schoolId,
        academicYear: currentAcademicYear,
      };

      let response;
      if (id) {
        response = await apiRequest(
          `${ENDPOINTS.administration}/staff/${id}?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
          {
            method: "PUT",
            body: JSON.stringify(staffData),
          }
        );
        toast.success("Staff member updated successfully!");
      } else {
        response = await apiRequest(`${ENDPOINTS.administration}/staff`, {
          method: "POST",
          body: JSON.stringify(staffData),
        });
        toast.success("Staff member added successfully!");
      }
      navigate("/administration/staff-master");
      setIsLoading((prev) => ({ ...prev, submit: false }));
    } catch (error) {
      console.error("Error adding/updating staff member:", error);
      toast.error("Failed to add/update staff member. Please try again.");
      setIsLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  const handleBack = () => {
    navigate("/administration/staff-master");
  };

  const isAnyLoading = Object.values(isLoading).some(Boolean);

  // Render loading state
  if (isLoading.init) {
    return (
      <MainContentPage>
        <Container fluid className="px-0">
          <div className="mb-4">
            <nav className="custom-breadcrumb py-1 py-lg-3">
              <Link to="/home">Home</Link>
              <span className="separator mx-2">&gt;</span>
              <span>Administration</span>
              <span className="separator mx-2">&gt;</span>
              <Link to="/administration/staff-master">Staff Master</Link>
              <span className="separator mx-2">&gt;</span>
              <span>{isViewMode ? "View Staff" : id ? "Edit Staff" : "Add Staff"}</span>
            </nav>
          </div>
          <div
            style={{ backgroundColor: "#0B3D7B" }}
            className="text-white p-3 rounded-top d-flex justify-content-between align-items-center"
          >
            <div className="d-flex align-items-center">
              <Button variant="link" className="text-white p-0 back-button me-3" onClick={handleBack}>
                <FaArrowLeft size={20} />
              </Button>
              <h2 className="mb-0">{isViewMode ? "View Staff" : id ? "Edit Staff" : "Add Staff"}</h2>
            </div>
            <div style={{ width: "20px" }}></div>
          </div>
          <div className="bg-white p-4 rounded-bottom shadow">
            <div className="text-center py-5">
              <Spinner animation="border" role="status" style={{ color: "#0B3D7B" }}>
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-2">Loading staff data...</p>
            </div>
          </div>
        </Container>
        <ToastContainer />
      </MainContentPage>
    );
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <div className="mb-4">
          <nav className="custom-breadcrumb py-1 py-lg-3">
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <span>Administration</span>
            <span className="separator mx-2">&gt;</span>
            <Link to="/administration/staff-master">Staff Master</Link>
            <span className="separator mx-2">&gt;</span>
            <span>{isViewMode ? "View Staff" : id ? "Edit Staff" : "Add Staff"}</span>
          </nav>
        </div>
        <div
          style={{ backgroundColor: "#0B3D7B" }}
          className="text-white p-3 rounded-top d-flex justify-content-between align-items-center"
        >
          <div className="d-flex align-items-center">
            <Button variant="link" className="text-white p-0 back-button me-3" onClick={handleBack}>
              <FaArrowLeft size={20} />
            </Button>
            <h2 className="mb-0">{isViewMode ? "View Staff" : id ? "Edit Staff" : "Add Staff"}</h2>
          </div>
          <div style={{ width: "20px" }}></div>
        </div>
        <div className="bg-white p-4 rounded-bottom shadow">
          <Form onSubmit={handleSubmit} className="h-100">
            <Row className="h-100">
              <Col md={4} className="d-flex flex-column">
                {/* Staff Code */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Staff Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="staffCode"
                    value={formData.staffCode}
                    onChange={handleInputChange}
                    placeholder="Auto-generated or custom code"
                    required
                    disabled={isViewMode || isLoading.submit}
                  />
                  <Form.Text className="text-muted">
                    You can edit this code if you wish.
                  </Form.Text>
                </Form.Group>

                {/* Name */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter name"
                    required
                    disabled={isViewMode || isLoading.submit}
                  />
                </Form.Group>

                {/* Family Head Name */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Family Head Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="familyHeadName"
                    value={formData.familyHeadName}
                    onChange={handleInputChange}
                    placeholder="Enter family head name"
                    required
                    disabled={isViewMode || isLoading.submit}
                  />
                </Form.Group>

                {/* Number & Street Name */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Number & Street Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="numberStreetName"
                    value={formData.numberStreetName}
                    onChange={handleInputChange}
                    placeholder="Enter street address"
                    required
                    disabled={isViewMode || isLoading.submit}
                  />
                </Form.Group>

                {/* Place/Pin Code */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Place/Pin Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="placePinCode"
                    value={formData.placePinCode}
                    onChange={handleInputChange}
                    placeholder="Enter place and pin code"
                    required
                    disabled={isViewMode || isLoading.submit}
                  />
                </Form.Group>

                {/* State */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>State</Form.Label>
                  {isViewMode ? (
                    <Form.Control
                      type="text"
                      value={formData.state || ""}
                      disabled
                      readOnly
                    />
                  ) : (
                    <Form.Select
                      name="state"
                      value={formData.stateId ? `${formData.stateId}|${formData.state}` : ""}
                      onChange={handleStateChange}
                      required
                      disabled={isViewMode || isLoading.submit || isLoading.states}
                    >
                      <option value="">Select State</option>
                      {states.map((state) => (
                        <option key={state.id} value={`${state.id}|${state.state || state.name}`}>
                          {state.state || state.name}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </Form.Group>

                {/* District */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>District</Form.Label>
                  {isViewMode ? (
                    <Form.Control
                      type="text"
                      value={formData.district || ""}
                      disabled
                      readOnly
                    />
                  ) : (
                    <Form.Select
                      name="district"
                      value={getDistrictValue()}
                      onChange={handleSelectChange}
                      required
                      disabled={
                        isViewMode ||
                        isLoading.submit ||
                        isLoading.districtsByState ||
                        !formData.stateId
                      }
                    >
                      <option value="">Select District</option>
                      {isLoading.districtsByState ? (
                        <option value="" disabled>
                          Loading districts...
                        </option>
                      ) : (
                        filteredDistricts.map((district) => (
                          <option
                            key={district.id}
                            value={`${district.id}|${district.district || district.name}`}
                          >
                            {district.district || district.name}
                          </option>
                        ))
                      )}
                    </Form.Select>
                  )}
                  {!isViewMode && !formData.stateId && (
                    <Form.Text className="text-muted">
                      Please select a state first
                    </Form.Text>
                  )}
                </Form.Group>

                {/* Gender */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Gender</Form.Label>
                  {isViewMode ? (
                    <Form.Control
                      type="text"
                      value={formData.gender || ""}
                      disabled
                      readOnly
                    />
                  ) : (
                    <Form.Select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                      disabled={isViewMode || isLoading.submit}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Transgender">Transgender</option>
                    </Form.Select>
                  )}
                </Form.Group>

                {/* Date Of Birth */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Date Of Birth</Form.Label>
                  <Form.Control
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                    disabled={isViewMode || isLoading.submit}
                  />
                </Form.Group>
              </Col>

              <Col md={4} className="d-flex flex-column">
                {/* Community */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Community</Form.Label>
                  {isViewMode ? (
                    <Form.Control
                      type="text"
                      value={formData.community || ""}
                      disabled
                      readOnly
                    />
                  ) : (
                    <Form.Select
                      name="community"
                      value={formData.communityId ? `${formData.communityId}|${formData.community}` : ""}
                      onChange={handleSelectChange}
                      required
                      disabled={isViewMode || isLoading.submit || isLoading.communities}
                    >
                      <option value="">Select Community</option>
                      {communities.map((community) => (
                        <option key={community.id} value={`${community.id}|${community.community || community.name}`}>
                          {community.community || community.name}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </Form.Group>

                {/* Caste */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Caste</Form.Label>
                  {isViewMode ? (
                    <Form.Control
                      type="text"
                      value={formData.caste || ""}
                      disabled
                      readOnly
                    />
                  ) : (
                    <Form.Select
                      name="caste"
                      value={formData.casteId ? `${formData.casteId}|${formData.caste}` : ""}
                      onChange={handleSelectChange}
                      required
                      disabled={isViewMode || isLoading.submit || isLoading.castes}
                    >
                      <option value="">Select Caste</option>
                      {castes.map((caste) => (
                        <option key={caste.id} value={`${caste.id}|${caste.caste || caste.name}`}>
                          {caste.caste || caste.name}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </Form.Group>

                {/* Religion */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Religion</Form.Label>
                  {isViewMode ? (
                    <Form.Control
                      type="text"
                      value={formData.religion || ""}
                      disabled
                      readOnly
                    />
                  ) : (
                    <Form.Select
                      name="religion"
                      value={formData.religionId ? `${formData.religionId}|${formData.religion}` : ""}
                      onChange={handleSelectChange}
                      required
                      disabled={isViewMode || isLoading.submit || isLoading.religions}
                    >
                      <option value="">Select Religion</option>
                      {religions.map((religion) => (
                        <option key={religion.id} value={`${religion.id}|${religion.religion || religion.name}`}>
                          {religion.religion || religion.name}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </Form.Group>

                {/* Nationality */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Nationality</Form.Label>
                  {isViewMode ? (
                    <Form.Control
                      type="text"
                      value={formData.nationality || ""}
                      disabled
                      readOnly
                    />
                  ) : (
                    <Form.Select
                      name="nationality"
                      value={formData.nationalityId ? `${formData.nationalityId}|${formData.nationality}` : ""}
                      onChange={handleSelectChange}
                      required
                      disabled={isViewMode || isLoading.submit || isLoading.nationalities}
                    >
                      <option value="">Select Nationality</option>
                      {nationalities.map((nationality) => (
                        <option key={nationality.id} value={`${nationality.id}|${nationality.nationality || nationality.name}`}>
                          {nationality.nationality || nationality.name}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </Form.Group>

                {/* Designation */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Designation</Form.Label>
                  {isViewMode ? (
                    <Form.Control
                      type="text"
                      value={formData.designation || ""}
                      disabled
                      readOnly
                    />
                  ) : (
                    <Form.Select
                      name="designation"
                      value={formData.designationId ? `${formData.designationId}|${formData.designation}` : ""}
                      onChange={handleSelectChange}
                      required
                      disabled={isViewMode || isLoading.submit || isLoading.staffDesignations}
                    >
                      <option value="">Select Designation</option>
                      {staffDesignations.map((designation) => (
                        <option key={designation.id} value={`${designation.id}|${designation.designation || designation.name}`}>
                          {designation.designation || designation.name}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </Form.Group>

                {/* Education Qualification */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Education Qualification</Form.Label>
                  <Form.Control
                    type="text"
                    name="educationQualification"
                    value={formData.educationQualification}
                    onChange={handleInputChange}
                    placeholder="Enter qualification"
                    required
                    disabled={isViewMode || isLoading.submit}
                  />
                </Form.Group>

                {/* Salary */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Salary</Form.Label>
                  <Form.Control
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    placeholder="Enter salary"
                    required
                    disabled={isViewMode || isLoading.submit}
                  />
                </Form.Group>

                {/* P.F.Number */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>P.F.Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="pfNumber"
                    value={formData.pfNumber}
                    onChange={handleInputChange}
                    placeholder="Enter PF number"
                    required
                    disabled={isViewMode || isLoading.submit}
                  />
                </Form.Group>

                {/* Category */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Category</Form.Label>
                  {isViewMode ? (
                    <Form.Control
                      type="text"
                      value={formData.category || ""}
                      disabled
                      readOnly
                    />
                  ) : (
                    <Form.Select
                      name="category"
                      value={formData.categoryId ? `${formData.categoryId}|${formData.category}` : ""}
                      onChange={handleSelectChange}
                      required
                      disabled={isViewMode || isLoading.submit || isLoading.staffCategories}
                    >
                      <option value="">Select Category</option>
                      {staffCategories.map((category) => (
                        <option key={category.id} value={`${category.id}|${category.category || category.name}`}>
                          {category.category || category.name}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </Form.Group>
              </Col>

              <Col md={4} className="d-flex flex-column">
                {/* Marital Status */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Marital Status</Form.Label>
                  {isViewMode ? (
                    <Form.Control
                      type="text"
                      value={formData.maritalStatus || ""}
                      disabled
                      readOnly
                    />
                  ) : (
                    <Form.Select
                      name="maritalStatus"
                      value={formData.maritalStatus}
                      onChange={handleInputChange}
                      required
                      disabled={isViewMode || isLoading.submit}
                    >
                      <option value="">Select Marital Status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                    </Form.Select>
                  )}
                </Form.Group>

                {/* Major Subject */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Major Subject</Form.Label>
                  <Form.Control
                    type="text"
                    name="majorSubject"
                    value={formData.majorSubject}
                    onChange={handleInputChange}
                    placeholder="Enter major subject"
                    required
                    disabled={isViewMode || isLoading.submit}
                  />
                </Form.Group>

                {/* Optional Subject */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Optional Subject</Form.Label>
                  <Form.Control
                    type="text"
                    name="optionalSubject"
                    value={formData.optionalSubject}
                    onChange={handleInputChange}
                    placeholder="Enter optional subject"
                    disabled={isViewMode || isLoading.submit}
                  />
                </Form.Group>

                {/* Extra Talent/Dl.No */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Extra Talent/Dl.No</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="extraTalentDlNo"
                    value={formData.extraTalentDlNo}
                    onChange={handleInputChange}
                    placeholder="Enter extra talent/DL number"
                    required
                    disabled={isViewMode || isLoading.submit}
                  />
                </Form.Group>

                {/* Experience */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Experience</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="Enter experience"
                    required
                    disabled={isViewMode || isLoading.submit}
                  />
                </Form.Group>

                {/* Class IN charge */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Class IN charge</Form.Label>
                  {isViewMode ? (
                    <Form.Control
                      type="text"
                      value={formData.classInCharge || ""}
                      disabled
                      readOnly
                    />
                  ) : (
                    <Form.Select
                      name="classInCharge"
                      value={formData.classInChargeId ? `${formData.classInChargeId}|${formData.classInCharge}` : ""}
                      onChange={handleSelectChange}
                      disabled={isViewMode || isLoading.submit || isLoading.courses}
                    >
                      <option value="">Select Class</option>
                      {courses.map((course) => (
                        <option key={course.id} value={`${course.id}|${course.standard || course.name}`}>
                          {course.standard || course.name}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </Form.Group>

                {/* Date Of Joining */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Date Of Joining</Form.Label>
                  <Form.Control
                    type="date"
                    name="dateOfJoining"
                    value={formData.dateOfJoining}
                    onChange={handleInputChange}
                    required
                    disabled={isViewMode || isLoading.submit}
                  />
                </Form.Group>

                {/* Email/Bank A/C ID */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Email/Bank A/C ID</Form.Label>
                  <Form.Control
                    type="text"
                    name="emailBankAcId"
                    value={formData.emailBankAcId}
                    onChange={handleInputChange}
                    placeholder="Enter email/bank account ID"
                    required
                    disabled={isViewMode || isLoading.submit}
                  />
                </Form.Group>

                {/* Total Leave Days */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Total Leave Days</Form.Label>
                  <Form.Control
                    type="number"
                    name="totalLeaveDays"
                    value={formData.totalLeaveDays}
                    onChange={handleInputChange}
                    placeholder="Enter total leave days"
                    required
                    disabled={isViewMode || isLoading.submit}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                {/* Mobile Number */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Mobile Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                    placeholder="Enter mobile number"
                    required
                    disabled={isViewMode || isLoading.submit}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                {/* Status */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Status</Form.Label>
                  {isViewMode ? (
                    <Form.Control
                      type="text"
                      value={formData.status || ""}
                      disabled
                      readOnly
                    />
                  ) : (
                    <Form.Select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                      disabled={isViewMode || isLoading.submit}
                    >
                      <option value="">Select Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Form.Select>
                  )}
                </Form.Group>
              </Col>
              <Col md={4}>
                {/* Date Of Relieve */}
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Label>Date Of Relieve</Form.Label>
                  <Form.Control
                    type="date"
                    name="dateOfRelieve"
                    value={formData.dateOfRelieve}
                    onChange={handleInputChange}
                    disabled={isViewMode || isLoading.submit}
                  />
                </Form.Group>
              </Col>
            </Row>
            {!isViewMode && (
              <div className="text-center mt-3">
                <Button size="lg" type="submit" className="custom-btn" disabled={isLoading.submit}>
                  {isLoading.submit ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      {id ? "Updating..." : "Submitting..."}
                    </>
                  ) : id ? (
                    "Update"
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
            )}
          </Form>
        </div>
      </Container>
      <ToastContainer />
      <style>
        {`
            .custom-breadcrumb a {
              color: #0B3D7B;
              text-decoration: none;
            }
            .custom-btn {
              background: #0B3D7B;
              color: white;
            }
            .back-button:hover {
              opacity: 0.8;
            }
          `}
      </style>
    </MainContentPage>
  );
};

export default StaffForm;