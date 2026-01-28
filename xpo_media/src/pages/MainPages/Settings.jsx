"use client"

import { useState, useEffect } from "react"
import { Container, Card, Form, Button, Image, Spinner, Row, Col, Modal } from "react-bootstrap"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Link } from "react-router-dom"
import { Person, Pencil, Camera, Trash } from "react-bootstrap-icons"
import "bootstrap-icons/font/bootstrap-icons.css"
import { useAuthContext } from "../../Context/AuthContext"
import { ENDPOINTS } from "../../SpringBoot/config"

const Settings = () => {
  const [schoolData, setSchoolData] = useState({
    schoolName: "",
    schoolAddress: "",
    email: "",
    profileImage: "",
    phoneNumber: "",
    city: "",
    state: "",
    pincode: ""
  })
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [imageFile, setImageFile] = useState(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [states, setStates] = useState([])
  const [filteredDistricts, setFilteredDistricts] = useState([])
  const [isDistrictsLoading, setIsDistrictsLoading] = useState(false)
  const [phoneError, setPhoneError] = useState("")
  const [removeImage, setRemoveImage] = useState(false)
  const { schoolId, getAuthHeaders } = useAuthContext()

  // Fetch states
  const fetchStates = async () => {
    if (!schoolId) return;
    
    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/states?schoolId=${schoolId}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const statesData = await response.json();
        setStates(statesData || []);
      }
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  }

  // Fetch districts by state
  const fetchDistrictsByState = async (stateName) => {
    if (!schoolId || !stateName) {
      return;
    }

    try {
      setIsDistrictsLoading(true);
      
      const selectedState = states.find(state => 
        state.name === stateName || state.name?.toLowerCase() === stateName?.toLowerCase()
      );
      
      if (!selectedState || !selectedState.id) {
        return;
      }

      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/districts/bystate?schoolId=${schoolId}&stateId=${selectedState.id}`,
        { headers: getAuthHeaders() }
      );

      if (response.ok) {
        const districtsData = await response.json();
        setFilteredDistricts(districtsData || []);
      }
    } catch (error) {
      console.error("Error fetching districts by state:", error);
    } finally {
      setIsDistrictsLoading(false);
    }
  }

  // Validate phone number
  const validatePhoneNumber = (phone) => {
    if (!phone) return true; // Allow empty phone number
    
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it's exactly 10 digits
    if (cleanPhone.length !== 10) {
      return "Phone number must be exactly 10 digits";
    }
    
    // Check if it contains only digits
    if (!/^\d+$/.test(cleanPhone)) {
      return "Phone number must contain only digits";
    }
    
    return "";
  }

  // Convert file to base64 and get image type
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data:image/...;base64, prefix
        const base64 = reader.result.split(',')[1];
        const imageType = file.type; // Get the MIME type (e.g., "image/jpeg", "image/png")
        resolve({ base64, imageType });
      };
      reader.onerror = error => reject(error);
    });
  }

  // Extract base64 from data URL
  const extractBase64FromDataUrl = (dataUrl) => {
    if (!dataUrl || !dataUrl.startsWith('data:')) return null;
    return dataUrl.split(',')[1];
  }

  // Fetch school data from Spring Boot backend
  const fetchSchoolData = async () => {
    if (!schoolId) {
      toast.error("School ID not available")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/school/school-details?schoolId=${schoolId}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const schoolData = await response.json()
        console.log("Received school data:", schoolData); // Debug log
        
        if (schoolData) {
          let profileImageBase64 = "";
          
          // Check if profileImage is a base64 string (new format) or byte array (old format)
          if (schoolData.profileImage) {
            if (typeof schoolData.profileImage === 'string') {
              // It's already a base64 string - use it directly with the image type
              const imageType = schoolData.profileImageType || "image/jpeg";
              profileImageBase64 = `data:${imageType};base64,${schoolData.profileImage}`;
            } else if (Array.isArray(schoolData.profileImage)) {
              // It's a byte array - convert to base64 (backward compatibility)
              const byteArray = new Uint8Array(schoolData.profileImage);
              const binaryString = String.fromCharCode.apply(null, byteArray);
              const base64 = btoa(binaryString);
              const imageType = schoolData.profileImageType || "image/jpeg";
              profileImageBase64 = `data:${imageType};base64,${base64}`;
            }
          }

          console.log("Processed profile image:", profileImageBase64 ? "Exists" : "Empty"); // Debug log

          setSchoolData({
            schoolName: schoolData.schoolName || "",
            schoolAddress: schoolData.schoolAddress || "",
            email: schoolData.email || "",
            profileImage: profileImageBase64,
            phoneNumber: schoolData.phoneNumber || "",
            city: schoolData.city || "",
            state: schoolData.state || "",
            pincode: schoolData.pincode || ""
          })

          if (schoolData.state) {
            await fetchDistrictsByState(schoolData.state)
          }
        }
      } else if (response.status === 404) {
        // No school details exist yet - this is normal
        setSchoolData({
          schoolName: "",
          schoolAddress: "",
          email: "",
          profileImage: "",
          phoneNumber: "",
          city: "",
          state: "",
          pincode: ""
        })
      } else {
        throw new Error("Failed to fetch school details")
      }
    } catch (error) {
      console.error("Error fetching school data:", error)
      if (!error.message.includes('404')) {
        toast.error("Failed to fetch school profile")
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle state change
  const handleStateChange = async (stateValue) => {
    setSchoolData(prev => ({
      ...prev,
      state: stateValue,
      city: ""
    }))
    await fetchDistrictsByState(stateValue)
  }

  const handleEditToggle = () => {
    setIsEditing(!isEditing)
    setPhoneError("") // Clear phone error when toggling edit mode
    setRemoveImage(false) // Reset remove image flag
    setImageFile(null) // Reset image file
    if (!isEditing) {
      // When opening edit mode, ensure we have latest states data
      fetchStates()
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    if (name === "phoneNumber") {
      // Validate phone number in real-time
      const error = validatePhoneNumber(value);
      setPhoneError(error);
      
      // Only allow digits and limit to 10 characters
      const cleanValue = value.replace(/\D/g, '').slice(0, 10);
      
      setSchoolData((prevData) => ({
        ...prevData,
        [name]: cleanValue,
      }));
    } else if (name === "state") {
      handleStateChange(value)
    } else {
      setSchoolData((prevData) => ({
        ...prevData,
        [name]: value,
      }))
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file")
        return
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Image size should be less than 5MB")
        return
      }
      setImageFile(file)
      setRemoveImage(false) // If user selects new image, cancel remove image
    }
  }

  const handleRemoveImage = () => {
    setRemoveImage(true)
    setImageFile(null)
  }

  const handleSave = async () => {
    if (!schoolId) {
      toast.error("School ID not available")
      return
    }

    // Final validation before saving
    if (schoolData.phoneNumber) {
      const error = validatePhoneNumber(schoolData.phoneNumber);
      if (error) {
        setPhoneError(error);
        toast.error("Please fix phone number validation errors before saving");
        return;
      }
    }

    try {
      setImageLoading(true)

      let profileImageBase64 = null;
      let profileImageType = null;
      
      if (removeImage) {
        // User wants to remove the image - send null values
        profileImageBase64 = null;
        profileImageType = null;
      } else if (imageFile) {
        // User selected a new image
        try {
          const { base64, imageType } = await fileToBase64(imageFile);
          profileImageBase64 = base64; // Send as base64 string
          profileImageType = imageType; // Store the image type
        } catch (error) {
          console.error("Error converting image:", error);
          toast.error("Failed to process image");
          return;
        }
      } else if (schoolData.profileImage) {
        // Keep existing image - extract base64 from data URL
        profileImageBase64 = extractBase64FromDataUrl(schoolData.profileImage);
        // Extract image type from data URL or use default
        const match = schoolData.profileImage.match(/^data:(image\/[^;]+);/);
        profileImageType = match ? match[1] : "image/jpeg";
      }

      // Prepare data for backend - send as base64 string
      const saveData = {
        schoolName: schoolData.schoolName,
        schoolAddress: schoolData.schoolAddress,
        email: schoolData.email,
        phoneNumber: schoolData.phoneNumber,
        city: schoolData.city,
        state: schoolData.state,
        pincode: schoolData.pincode,
        profileImage: profileImageBase64, // Send as base64 string (or null to remove)
        profileImageType: profileImageType // Send image type to backend (or null to remove)
      }

      console.log("Saving data:", { 
        ...saveData, 
        profileImage: profileImageBase64 ? `Base64 string (${profileImageBase64.length} chars)` : "null",
        removeImage: removeImage
      }); // Debug log

      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/school/school-details?schoolId=${schoolId}`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json"
          },
          body: JSON.stringify(saveData)
        }
      )

      if (response.ok) {
        toast.success("Profile updated successfully")
        setIsEditing(false)
        setImageFile(null)
        setRemoveImage(false)
        setPhoneError("") // Clear any phone errors
        // Refresh data to ensure consistency
        fetchSchoolData()
      } else {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error(`Failed to update profile: ${error.message}`)
    } finally {
      setImageLoading(false)
    }
  }

  // Delete school details (similar to CertificateManagement)
  const deleteSchoolDetails = async () => {
    if (!schoolId) {
      toast.error("School ID not available")
      return
    }

    if (!window.confirm("Are you sure you want to delete all school details? This action cannot be undone.")) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/school/school-details?schoolId=${schoolId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders()
        }
      )

      if (response.ok) {
        toast.success("School details deleted successfully!")
        setSchoolData({
          schoolName: "",
          schoolAddress: "",
          email: "",
          profileImage: "",
          phoneNumber: "",
          city: "",
          state: "",
          pincode: ""
        })
        setIsEditing(false)
        setPhoneError("") // Clear any phone errors
      } else {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to delete school details")
      }
    } catch (error) {
      console.error("Error deleting school details:", error)
      toast.error(`Failed to delete school details: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (schoolId) {
      fetchStates()
      fetchSchoolData()
    }
  }, [schoolId])

  if (loading) {
    return (
      <MainContentPage>
        <Container fluid className="px-0">
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading...</p>
          </div>
        </Container>
      </MainContentPage>
    )
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <div className="mb-4">
          <nav className="custom-breadcrumb py-1 py-lg-3">
            <Link to="/home">Home</Link>
            <span className="separator mx-2 text-muted">/</span>
            <span className="text-dark">Profile</span>
          </nav>
        </div>

        <div style={{ backgroundColor: "#0B3D7B" }} className="text-white p-3 rounded-top">
          <h2 className="mb-0">{isEditing ? "Edit Profile" : "Profile"}</h2>
        </div>

        <Card className="shadow-sm border-0 rounded-bottom">
          <Card.Body className="p-0">
            <div className="profile-layout">
              <div className="profile-image-section">
                <div className="profile-image-container">
                  {(imageFile || (schoolData.profileImage && !removeImage)) ? (
                    <div className="profile-image-wrapper">
                      <Image
                        src={imageFile ? URL.createObjectURL(imageFile) : schoolData.profileImage}
                        className="profile-image"
                        alt="School Profile"
                        onError={(e) => {
                          console.error("Image load error:", e);
                          e.target.src = ""
                          e.target.style.display = "none"
                        }}
                        onLoad={() => console.log("Image loaded successfully")}
                      />
                      {isEditing && (
                        <div className="image-overlay">
                          <div className="camera-icon">
                            <Camera size={24} />
                          </div>
                          <p className="change-photo-text">Change Photo</p>
                          <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="file-input"
                            id="profileImage"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="profile-placeholder">
                      <Person size={80} className="placeholder-icon" />
                      {isEditing && (
                        <>
                          <div className="upload-text mt-3">Upload Photo</div>
                          <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="file-input"
                            id="profileImage"
                          />
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Remove Image Button - Only show when editing and image exists */}
                  {isEditing && schoolData.profileImage && !removeImage && (
                    <div className="remove-image-container mt-3">
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={handleRemoveImage}
                        className="remove-image-button"
                      >
                        <Trash className="me-1" size={14} />
                        Remove Image
                      </Button>
                    </div>
                  )}
                  
                  {/* Show message if image will be removed */}
                  {isEditing && removeImage && (
                    <div className="text-center mt-3">
                      <small className="text-muted">
                        Image will be removed when you save changes
                      </small>
                    </div>
                  )}
                </div>
              </div>

              <div className="profile-details-section">
                <div className="profile-details-content">
                  {isEditing ? (
                    <Form className="profile-form">
                      <Form.Group className="mb-3">
                        <Form.Label className="form-label">School Name *</Form.Label>
                        <Form.Control
                          type="text"
                          name="schoolName"
                          value={schoolData.schoolName}
                          onChange={handleChange}
                          placeholder="Enter school name"
                          className="form-input"
                          required
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="form-label">Email *</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={schoolData.email}
                          onChange={handleChange}
                          placeholder="Enter email"
                          className="form-input"
                          required
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="form-label">Phone Number</Form.Label>
                        <Form.Control
                          type="text"
                          name="phoneNumber"
                          value={schoolData.phoneNumber || ""}
                          onChange={handleChange}
                          placeholder="Enter 10-digit phone number"
                          className={`form-input ${phoneError ? 'is-invalid' : ''}`}
                          maxLength={10}
                        />
                        {phoneError && (
                          <div className="invalid-feedback d-block">
                            {phoneError}
                          </div>
                        )}
                        <Form.Text className="text-muted">
                          {schoolData.phoneNumber ? `${schoolData.phoneNumber.length}/10 digits` : 'Optional - must be exactly 10 digits if provided'}
                        </Form.Text>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="form-label">School Address *</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="schoolAddress"
                          value={schoolData.schoolAddress}
                          onChange={handleChange}
                          placeholder="Enter school address"
                          className="form-input"
                          required
                        />
                      </Form.Group>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="form-label">State *</Form.Label>
                            <Form.Select
                              name="state"
                              value={schoolData.state}
                              onChange={handleChange}
                              required
                            >
                              <option value="">Select State</option>
                              {states.map((state) => (
                                <option key={state.id} value={state.name}>
                                  {state.name}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="form-label">District *</Form.Label>
                            <div className="position-relative">
                              <Form.Select
                                name="city"
                                value={schoolData.city}
                                onChange={handleChange}
                                disabled={!schoolData.state || isDistrictsLoading}
                                required
                              >
                                <option value="">
                                  {isDistrictsLoading ? "Loading districts..." : 
                                   schoolData.state ? "Select District" : "First select State"}
                                </option>
                                {filteredDistricts.map((district) => (
                                  <option key={district.id} value={district.name}>
                                    {district.name}
                                  </option>
                                ))}
                                {filteredDistricts.length === 0 && schoolData.state && !isDistrictsLoading && (
                                  <option value="" disabled>No districts found for {schoolData.state}</option>
                                )}
                              </Form.Select>
                              {isDistrictsLoading && (
                                <div className="position-absolute top-50 end-0 translate-middle-y me-2">
                                  <Spinner animation="border" size="sm" variant="primary" />
                                </div>
                              )}
                            </div>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-4">
                        <Form.Label className="form-label">Pincode *</Form.Label>
                        <Form.Control
                          type="text"
                          name="pincode"
                          value={schoolData.pincode}
                          onChange={handleChange}
                          placeholder="Enter pincode"
                          pattern="[0-9]{6}"
                          maxLength={6}
                          className="form-input"
                          required
                        />
                      </Form.Group>

                      <div className="button-container">
                        <div className="d-flex justify-content-between w-100">
                          <div>
                            <Button 
                              variant="outline-danger" 
                              onClick={deleteSchoolDetails}
                              disabled={imageLoading || !schoolData.schoolName}
                            >
                              Delete Profile
                            </Button>
                          </div>
                          <div>
                            <Button 
                              variant="outline-secondary" 
                              onClick={handleEditToggle} 
                              className="cancel-button me-2"
                              disabled={imageLoading}
                            >
                              Cancel
                            </Button>
                            <Button 
                              variant="primary" 
                              onClick={handleSave} 
                              className="save-button" 
                              disabled={imageLoading || !schoolData.schoolName || !schoolData.schoolAddress || !schoolData.email || !schoolData.city || !schoolData.state || !schoolData.pincode || phoneError}
                            >
                              {imageLoading ? (
                                <>
                                  <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                  />
                                  Saving...
                                </>
                              ) : (
                                "Save Changes"
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Form>
                  ) : (
                    <div className="profile-info">
                      <div className="info-row">
                        <div className="info-label">School Name:</div>
                        <div className="info-value">{schoolData.schoolName || "Not set"}</div>
                      </div>
                      <div className="info-row">
                        <div className="info-label">Email:</div>
                        <div className="info-value">{schoolData.email || "Not set"}</div>
                      </div>
                      <div className="info-row">
                        <div className="info-label">Phone Number:</div>
                        <div className="info-value">{schoolData.phoneNumber || "Not set"}</div>
                      </div>
                      <div className="info-row">
                        <div className="info-label">Address:</div>
                        <div className="info-value">{schoolData.schoolAddress || "Not set"}</div>
                      </div>
                      <div className="info-row">
                        <div className="info-label">City:</div>
                        <div className="info-value">{schoolData.city || "Not set"}</div>
                      </div>
                      <div className="info-row">
                        <div className="info-label">State:</div>
                        <div className="info-value">{schoolData.state || "Not set"}</div>
                      </div>
                      <div className="info-row">
                        <div className="info-label">Pincode:</div>
                        <div className="info-value">{schoolData.pincode || "Not set"}</div>
                      </div>

                      <div className="edit-button-container">
                        <Button variant="outline-primary" onClick={handleEditToggle} className="edit-profile-button">
                          <Pencil className="me-2" /> Edit Profile
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Container>

      {/* Updated CSS styles */}
      <style>
        {`
          .custom-breadcrumb {
            padding: 0.5rem 1rem;
            font-size: 0.95rem;
          }

          .custom-breadcrumb a {
            color: #0B3D7B;
            text-decoration: none;
            font-weight: 500;
          }

          .custom-breadcrumb a:hover {
            text-decoration: underline;
          }

          .custom-breadcrumb .separator {
            color: #6c757d;
          }

          .profile-layout {
            display: flex;
            min-height: 500px;
          }
          
          .profile-image-section {
            width: 40%;
            background-color: #f8f9fa;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 30px;
          }
          
          .profile-image-container {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          
          .profile-image-wrapper {
            position: relative;
            width: 100%;
            max-width: 300px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          
          .profile-image {
            width: 100%;
            height: auto;
            object-fit: cover;
            display: block;
          }
          
          .image-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.4);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .profile-image-wrapper:hover .image-overlay {
            opacity: 1;
          }
          
          .camera-icon {
            background-color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 10px;
          }
          
          .change-photo-text {
            color: white;
            font-weight: 500;
            margin: 0;
          }
          
          .file-input {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
          }
          
          .profile-placeholder {
            width: 100%;
            max-width: 300px;
            height: 250px;
            background-color: #e9ecef;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: relative;
          }
          
          .placeholder-icon {
            color: #adb5bd;
          }
          
          .upload-text {
            color: #495057;
            font-weight: 500;
          }
          
          .remove-image-container {
            text-align: center;
          }
          
          .remove-image-button {
            font-size: 0.875rem;
          }
          
          .profile-details-section {
            width: 60%;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 40px;
          }
          
          .profile-details-content {
            width: 100%;
            max-width: 600px;
          }
          
          .profile-form {
            width: 100%;
          }
          
          .form-label {
            font-weight: 500;
            color: #495057;
          }
          
          .form-input {
            border-radius: 4px;
            border: 1px solid #ced4da;
            padding: 10px 12px;
            transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
          }
          
          .form-input:focus {
            border-color: #0B3D7B;
            box-shadow: 0 0 0 0.2rem rgba(11, 61, 123, 0.25);
          }
          
          .profile-info {
            width: 100%;
          }
          
          .info-row {
            display: flex;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e9ecef;
          }
          
          .info-label {
            width: 150px;
            font-weight: 500;
            color: #6c757d;
          }
          
          .info-value {
            flex: 1;
            color: #212529;
          }
          
          .button-container {
            display: flex;
            justify-content: flex-end;
            margin-top: 30px;
          }
          
          .save-button,
          .cancel-button {
            min-width: 120px;
            padding: 8px 16px;
          }
          
          .edit-button-container {
            display: flex;
            justify-content: flex-end;
            margin-top: 30px;
          }
          
          .edit-profile-button {
            min-width: 140px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          @media (max-width: 991px) {
            .profile-layout {
              flex-direction: column;
            }
            
            .profile-image-section,
            .profile-details-section {
              width: 100%;
            }
            
            .profile-image-section {
              padding: 30px 20px;
            }
            
            .profile-details-section {
              padding: 30px 20px;
            }
          }
          
          @media (max-width: 576px) {
            .info-row {
              flex-direction: column;
            }
            
            .info-label {
              width: 100%;
              margin-bottom: 5px;
            }
            
            .button-container {
              flex-direction: column-reverse;
              gap: 10px;
            }
            
            .save-button,
            .cancel-button,
            .edit-profile-button {
              width: 100%;
            }
          }
        `}
      </style>
      <ToastContainer />
    </MainContentPage>
  )
}

export default Settings