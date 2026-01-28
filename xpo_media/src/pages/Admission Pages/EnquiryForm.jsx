"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Container, Form, Button, Row, Col, Table } from "react-bootstrap"
import MainContentPage from "../../components/MainContent/MainContentPage"
import { Link, useNavigate, useParams, useLocation } from "react-router-dom"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import defaultStudentPhoto from "../../images/StudentProfileIcon/studentProfile.jpeg"
import { useAuthContext } from "../../Context/AuthContext"
import { ENDPOINTS } from "../../SpringBoot/config"
import { FaArrowLeft } from "react-icons/fa"

// Custom styles for date inputs
const dateInputStyles = {
  wrapper: {
    position: "relative",
    width: "100%",
  },
  calendarIcon: {
    position: "absolute",
    right: "0",
    top: "0",
    height: "100%",
    width: "38px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    zIndex: 2,
  },
  error: {
    color: "#dc3545",
    fontSize: "0.875rem",
    marginTop: "0.25rem",
  },
}

const EnquiryForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isViewMode = new URLSearchParams(location.search).get("view") === "true"
  const { schoolId, getAuthHeaders, isAuth, currentAcademicYear, getAuthToken } = useAuthContext()

  // Track if we have an existing photo
  const [hasExistingPhoto, setHasExistingPhoto] = useState(false)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState("")

  // Fee structure to store all fee details with account heads
  const [feeStructure, setFeeStructure] = useState({
    tuitionFees: [],  // Array of {feeHeading, accountHead, amount}
    hostelFees: [],   // Array of {feeHeading, accountHead, amount}
    busFee: null,     // {feeHeading, accountHead, amount}
    totalFees: "0.00"
  })

  // Simplified form data structure
  const [formData, setFormData] = useState({
    enquiryKey: "",
    admissionNumber: "",
    studentName: "",
    fatherName: "",
    motherName: "",
    streetVillage: "",
    placePincode: "",
    district: "",
    phoneNumber: "",
    boardingPoint: "",
    busRouteNumber: "",
    emailId: "",
    communicationAddress: "",
    nationality: "",
    religion: "",
    state: "",
    community: "",
    caste: "",
    studentType: "",
    studentCategory: "",
    standard: "",
    section: "",
    gender: "",
    dateOfBirth: "",
    emis: "",
    lunchRefresh: "",
    bloodGroup: "",
    dateOfAdmission: "",
    motherTongue: "",
    fatherOccupation: "",
    motherOccupation: "",
    examNumber: "",
    busFee: "0.00",
    hostelFee: "0.00",
    tutionFees: "0.00",
    studiedYear: "",
    classLastStudied: "",
    classToBeAdmitted: "",
    nameOfSchool: "",
    remarks: "",
    identificationMark1: "",
    identificationMark2: "",
    aadharNumber: "",
  })

  const [errors, setErrors] = useState({})
  const [photoPreview, setPhotoPreview] = useState(defaultStudentPhoto)
  const [photoFile, setPhotoFile] = useState(null)
  const fileInputRef = useRef(null)
  const dateOfBirthRef = useRef(null)
  const dateOfAdmissionRef = useRef(null)
  const [setupData, setSetupData] = useState({
    nationalities: [],
    religions: [],
    communities: [],
    castes: [],
    districts: [],
    states: [],
    sections: [],
    motherTongues: [],
    studentCategories: [],
    courses: [],
    boardingPoints: [],
    busRoutes: [],
    parentOccupations: [],
    bloodGroups: [],
  })
  const [filteredDistricts, setFilteredDistricts] = useState([])
  const [loading, setLoading] = useState(false)
  const [isBusRequired, setIsBusRequired] = useState(false)
  const [isHostelRequired, setIsHostelRequired] = useState(false)
  const [isSetupDataLoaded, setIsSetupDataLoaded] = useState(false)
  const [isDistrictsLoading, setIsDistrictsLoading] = useState(false)

  // Fee related states
  const [feeDetails, setFeeDetails] = useState([])
  const [hostelFeeDetails, setHostelFeeDetails] = useState([])
  const [isFeeLoading, setIsFeeLoading] = useState(false)
  const [isHostelFeeLoading, setIsHostelFeeLoading] = useState(false)
  const [isBusFeeLoading, setIsBusFeeLoading] = useState(false)
  
  // State to store bus fee details including fee heading and account head
  const [busFeeDetails, setBusFeeDetails] = useState(null)

  // Add back button handler
  const handleBack = () => {
    navigate("/admission/enquiry")
  }

  // Generate random enquiry key in frontend
  const generateRandomEnquiryKey = useCallback(() => {
    const randomNumber = Math.floor(Math.random() * 9000) + 1000
    const newEnquiryKey = `ENQ${randomNumber}`
    
    setFormData((prevData) => ({
      ...prevData,
      enquiryKey: newEnquiryKey
    }))
    
    return newEnquiryKey
  }, [])

  // Check if enquiry key already exists
  const checkEnquiryKeyExists = async (enquiryKey) => {
    if (!schoolId || !enquiryKey) return false

    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/enquiry/check-key?schoolId=${schoolId}&enquiryKey=${enquiryKey}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const result = await response.json()
        return result || false
      }
      return false
    } catch (error) {
      return false
    }
  }

  // Generate unique enquiry key
  const generateUniqueEnquiryKey = useCallback(async () => {
    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
      const newKey = generateRandomEnquiryKey()
      const keyExists = await checkEnquiryKeyExists(newKey)
      
      if (!keyExists) {
        return newKey
      }
      attempts++
    }

    // Fallback: use timestamp with random suffix
    const fallbackKey = `ENQ${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`
    setFormData((prevData) => ({
      ...prevData,
      enquiryKey: fallbackKey
    }))
    return fallbackKey
  }, [generateRandomEnquiryKey, schoolId])

  // Function to fetch all tuition fees based on standard and student category
  const fetchAllFees = async (standard, studentCategory) => {
    if (!schoolId || !standard || !studentCategory) {
      setFeeDetails([])
      setFeeStructure(prev => ({
        ...prev,
        tuitionFees: [],
        totalFees: "0.00"
      }))
      setFormData(prev => ({ 
        ...prev, 
        tutionFees: "0.00" 
      }))
      return
    }

    try {
      setIsFeeLoading(true)
      
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/allfees?schoolId=${schoolId}&standard=${standard}&studentCategory=${studentCategory}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const feesData = await response.json()
        setFeeDetails(feesData || [])
        
        // Store fee structure with account heads
        const tuitionFeeStructure = feesData.map(fee => ({
          feeHeading: fee.feeHeading || "Tuition Fee",
          accountHead: fee.accountHead || "General",
          amount: parseFloat(fee.amount) || 0
        }))
        
        // Calculate total tuition fees
        const totalTuitionFee = tuitionFeeStructure.reduce((total, fee) => {
          return total + fee.amount
        }, 0)
        
        setFeeStructure(prev => ({
          ...prev,
          tuitionFees: tuitionFeeStructure
        }))
        
        setFormData(prev => ({ 
          ...prev, 
          tutionFees: totalTuitionFee.toFixed(2) 
        }))
      } else {
        setFeeDetails([])
        setFeeStructure(prev => ({
          ...prev,
          tuitionFees: [],
          totalFees: "0.00"
        }))
        setFormData(prev => ({ 
          ...prev, 
          tutionFees: "0.00" 
        }))
      }
    } catch (error) {
      setFeeDetails([])
      setFeeStructure(prev => ({
        ...prev,
        tuitionFees: [],
        totalFees: "0.00"
      }))
      setFormData(prev => ({ 
        ...prev, 
        tutionFees: "0.00" 
      }))
      console.error("Failed to fetch tuition fee details:", error)
    } finally {
      setIsFeeLoading(false)
    }
  }

  // Function to fetch hostel fees based on standard and student category
  const fetchHostelFees = async (standard, studentCategory) => {
    if (!schoolId || !standard || !studentCategory) {
      setHostelFeeDetails([])
      setFeeStructure(prev => ({
        ...prev,
        hostelFees: [],
        totalFees: "0.00"
      }))
      setFormData(prev => ({ 
        ...prev, 
        hostelFee: "0.00" 
      }))
      return
    }

    try {
      setIsHostelFeeLoading(true)
      
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/hostelfees?schoolId=${schoolId}&standard=${standard}&studentCategory=${studentCategory}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const hostelFeesData = await response.json()
        setHostelFeeDetails(hostelFeesData || [])
        
        // Store hostel fee structure with account heads
        const hostelFeeStructure = hostelFeesData.map(fee => ({
          feeHeading: fee.feeHeading || "Hostel Fee",
          accountHead: fee.accountHead || "Hostel",
          amount: parseFloat(fee.amount) || 0
        }))
        
        // Calculate total hostel fees
        const totalHostelFee = hostelFeeStructure.reduce((total, fee) => {
          return total + fee.amount
        }, 0)
        
        setFeeStructure(prev => ({
          ...prev,
          hostelFees: hostelFeeStructure
        }))
        
        setFormData(prev => ({ 
          ...prev, 
          hostelFee: totalHostelFee.toFixed(2) 
        }))
      } else {
        setHostelFeeDetails([])
        setFeeStructure(prev => ({
          ...prev,
          hostelFees: [],
          totalFees: "0.00"
        }))
        setFormData(prev => ({ 
          ...prev, 
          hostelFee: "0.00" 
        }))
      }
    } catch (error) {
      setHostelFeeDetails([])
      setFeeStructure(prev => ({
        ...prev,
        hostelFees: [],
        totalFees: "0.00"
      }))
      setFormData(prev => ({ 
        ...prev, 
        hostelFee: "0.00" 
      }))
      console.error("Failed to fetch hostel fee details:", error)
    } finally {
      setIsHostelFeeLoading(false)
    }
  }

  // Function to fetch bus fee based on boarding point and route
  const fetchBusFee = async (boardingPoint, busRouteNumber) => {
    if (!schoolId || !boardingPoint || !busRouteNumber) {
      setFeeStructure(prev => ({
        ...prev,
        busFee: null,
        totalFees: "0.00"
      }))
      setFormData(prev => ({ 
        ...prev, 
        busFee: "0.00" 
      }))
      setBusFeeDetails(null)
      return
    }

    try {
      setIsBusFeeLoading(true)
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/busfee?schoolId=${schoolId}&boardingPoint=${boardingPoint}&routeNumber=${busRouteNumber}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const busFeeData = await response.json()
        const busFee = busFeeData?.amount || 0
        
        // Store bus fee details including account head
        const busFeeStructure = {
          feeHeading: busFeeData?.feeHeading || "Bus Fee",
          accountHead: busFeeData?.accountHead || "Transport",
          amount: busFee
        }
        
        setBusFeeDetails(busFeeData)
        setFeeStructure(prev => ({
          ...prev,
          busFee: busFeeStructure
        }))
        
        setFormData(prev => ({ 
          ...prev, 
          busFee: busFee.toFixed(2) 
        }))
        
        toast.success(`Bus fee loaded: ₹${busFee.toFixed(2)}`)
      } else {
        setFeeStructure(prev => ({
          ...prev,
          busFee: null,
          totalFees: "0.00"
        }))
        setFormData(prev => ({ 
          ...prev, 
          busFee: "0.00" 
        }))
        setBusFeeDetails(null)
        toast.warning("No bus fee found for selected boarding point and route")
      }
    } catch (error) {
      setFeeStructure(prev => ({
        ...prev,
        busFee: null,
        totalFees: "0.00"
      }))
      setFormData(prev => ({ 
        ...prev, 
        busFee: "0.00" 
      }))
      setBusFeeDetails(null)
      console.error("Failed to fetch bus fee:", error)
      toast.error("Failed to fetch bus fee")
    } finally {
      setIsBusFeeLoading(false)
    }
  }

  // Auto-fetch bus fee when both boarding point and route are selected
  useEffect(() => {
    if (isBusRequired && formData.boardingPoint && formData.busRouteNumber) {
      const timer = setTimeout(() => {
        fetchBusFee(formData.boardingPoint, formData.busRouteNumber)
      }, 500); // Add small delay to avoid too many API calls

      return () => clearTimeout(timer)
    }
  }, [isBusRequired, formData.boardingPoint, formData.busRouteNumber])

  // Fetch all setup data for dropdowns
  const fetchSetupData = async () => {
    if (!schoolId || !isAuth) return

    try {
      setLoading(true)

      // Fetch all dropdown data in parallel
      const [
        nationalityRes,
        religionRes,
        communityRes,
        casteRes,
        districtRes,
        stateRes,
        sectionRes,
        motherTongueRes,
        studentCategoryRes,
        courseRes,
        parentOccupationRes,
        bloodGroupRes,
        busFeeSetupRes,
      ] = await Promise.all([
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/nationalities?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/religions?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/communities?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/castes?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/districts?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/states?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/sections?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/mothertongues?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/studentcategories?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/courses?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/parentoccupations?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/bloodgroups?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/busfees?schoolId=${schoolId}`, {
          headers: getAuthHeaders()
        })
      ])

      // Parse all responses
      const [
        nationalities,
        religions,
        communities,
        castes,
        districts,
        states,
        sections,
        motherTongues,
        studentCategories,
        courses,
        parentOccupations,
        bloodGroups,
        busFeeSetupData,
      ] = await Promise.all([
        nationalityRes.ok ? nationalityRes.json() : [],
        religionRes.ok ? religionRes.json() : [],
        communityRes.ok ? communityRes.json() : [],
        casteRes.ok ? casteRes.json() : [],
        districtRes.ok ? districtRes.json() : [],
        stateRes.ok ? stateRes.json() : [],
        sectionRes.ok ? sectionRes.json() : [],
        motherTongueRes.ok ? motherTongueRes.json() : [],
        studentCategoryRes.ok ? studentCategoryRes.json() : [],
        courseRes.ok ? courseRes.json() : [],
        parentOccupationRes.ok ? parentOccupationRes.json() : [],
        bloodGroupRes.ok ? bloodGroupRes.json() : [],
        busFeeSetupRes.ok ? busFeeSetupRes.json() : [],
      ])

      // Process data for dropdowns
      const uniqueBoardingPoints = [...new Set(busFeeSetupData.map((item) => item.boardingPoint))].filter(Boolean)
      const uniqueRoutes = [...new Set(busFeeSetupData.map((item) => item.route))].filter(Boolean)

      setSetupData({
        nationalities: nationalities || [],
        religions: religions || [],
        communities: communities || [],
        castes: castes || [],
        districts: districts || [],
        states: states || [],
        sections: sections || [],
        motherTongues: motherTongues || [],
        studentCategories: studentCategories || [],
        courses: courses || [],
        parentOccupations: parentOccupations || [],
        bloodGroups: bloodGroups || [],
        boardingPoints: uniqueBoardingPoints.map((point) => ({ id: point, placeName: point })),
        busRoutes: uniqueRoutes.map((route) => ({ id: route, route: route })),
      })

      setIsSetupDataLoaded(true)

    } catch (error) {
      toast.error("Failed to fetch setup data. Please try again.")
      console.error("Setup data fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  // Function to fetch districts based on selected state
  const fetchDistrictsByState = async (stateName) => {
    if (!schoolId || !stateName) {
      setFilteredDistricts([])
      setFormData(prev => ({ ...prev, district: "" }))
      return
    }

    try {
      setIsDistrictsLoading(true)
      
      // Find the state ID from the states list
      const selectedState = setupData.states.find(state => 
        state.name === stateName || state.name?.toLowerCase() === stateName?.toLowerCase()
      )
      
      if (!selectedState || !selectedState.id) {
        setFilteredDistricts([])
        setFormData(prev => ({ ...prev, district: "" }))
        return
      }

      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/districts/bystate?schoolId=${schoolId}&stateId=${selectedState.id}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const districts = await response.json()
        setFilteredDistricts(districts || [])

        // If we have existing district data, check if it exists in the filtered list
        if (formData.district && districts && districts.length > 0) {
          const districtExists = districts.some(d => 
            d.name === formData.district || d.name?.toLowerCase() === formData.district?.toLowerCase()
          )
          
          if (!districtExists) {
            // Don't clear the district here - let it remain as the user might want to keep it
          }
        }
      } else {
        setFilteredDistricts([])
      }
    } catch (error) {
      setFilteredDistricts([])
      console.error("District fetch error:", error)
    } finally {
      setIsDistrictsLoading(false)
    }
  }

  // Handle state change - fetch districts for selected state
  const handleStateChange = async (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      district: "" // Clear district when state changes
    }))

    setErrors((prev) => ({ ...prev, [name]: "", district: "" }))

    // Fetch districts for the selected state
    if (value) {
      await fetchDistrictsByState(value)
    } else {
      setFilteredDistricts([])
    }
  }

  // Fetch enquiry data for editing/viewing
  const fetchEnquiryData = async (enquiryId) => {
    if (!schoolId) return

    try {
      setLoading(true)
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/enquiry/${enquiryId}?schoolId=${schoolId}`,
        { headers: getAuthHeaders() }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch enquiry data")
      }

      const enquiryData = await response.json()
      
      // Map backend response to form data structure
      const newFormData = {
        enquiryKey: enquiryData.enquiryKey || "",
        admissionNumber: enquiryData.admissionNumber || "",
        studentName: enquiryData.studentName || "",
        fatherName: enquiryData.fatherName || "",
        motherName: enquiryData.motherName || "",
        streetVillage: enquiryData.streetVillage || "",
        placePincode: enquiryData.placePincode || "",
        district: enquiryData.district || "",
        phoneNumber: enquiryData.phoneNumber || "",
        boardingPoint: enquiryData.boardingPoint || "",
        busRouteNumber: enquiryData.busRouteNumber || "",
        emailId: enquiryData.emailId || "",
        communicationAddress: enquiryData.communicationAddress || "",
        nationality: enquiryData.nationality || "",
        religion: enquiryData.religion || "",
        state: enquiryData.state || "",
        community: enquiryData.community || "",
        caste: enquiryData.caste || "",
        studentType: enquiryData.studentType || "",
        studentCategory: enquiryData.studentCategory || "",
        standard: enquiryData.standard || "",
        section: enquiryData.section || "",
        gender: enquiryData.gender || "",
        dateOfBirth: enquiryData.dateOfBirth || "",
        emis: enquiryData.emis || "",
        lunchRefresh: enquiryData.lunchRefresh || "",
        bloodGroup: enquiryData.bloodGroup || "",
        dateOfAdmission: enquiryData.dateOfAdmission || "",
        motherTongue: enquiryData.motherTongue || "",
        fatherOccupation: enquiryData.fatherOccupation || "",
        motherOccupation: enquiryData.motherOccupation || "",
        examNumber: enquiryData.examNumber || "",
        busFee: enquiryData.busFee || "0.00",
        hostelFee: enquiryData.hostelFee || "0.00",
        tutionFees: enquiryData.tutionFees || "0.00",
        studiedYear: enquiryData.studiedYear || "",
        classLastStudied: enquiryData.classLastStudied || "",
        classToBeAdmitted: enquiryData.classToBeAdmitted || "",
        nameOfSchool: enquiryData.nameOfSchool || "",
        remarks: enquiryData.remarks || "",
        identificationMark1: enquiryData.identificationMark1 || "",
        identificationMark2: enquiryData.identificationMark2 || "",
        aadharNumber: enquiryData.aadharNumber || "",
      }

      setFormData(newFormData)

      // Set bus required state based on existing data
      const busRequired = !!(enquiryData.boardingPoint && enquiryData.busRouteNumber)
      setIsBusRequired(busRequired)

      // Set photo preview if student photo exists - track existing photo state
      if (enquiryData.studentPhoto) {
        const photoUrl = `${ENDPOINTS.admissionmaster}/enquiry/${enquiryId}/photo?schoolId=${schoolId}&t=${Date.now()}`
        setPhotoPreview(photoUrl)
        setHasExistingPhoto(true)
        setExistingPhotoUrl(photoUrl)
      } else {
        setPhotoPreview(defaultStudentPhoto)
        setHasExistingPhoto(false)
        setExistingPhotoUrl("")
      }

      // Set hostel toggle states based on existing data
      const hostelRequired = !!enquiryData.lunchRefresh
      setIsHostelRequired(hostelRequired)

      // Fetch fee details if standard and student category exist
      if (newFormData.standard && newFormData.studentCategory) {
        await fetchAllFees(newFormData.standard, newFormData.studentCategory)
        if (hostelRequired) {
          await fetchHostelFees(newFormData.standard, newFormData.studentCategory)
        }
      }

      // Fetch bus fee if bus is required
      if (busRequired) {
        await fetchBusFee(newFormData.boardingPoint, newFormData.busRouteNumber)
      }

      // Return the form data for use in useEffect
      return newFormData

    } catch (error) {
      toast.error("Failed to fetch enquiry data. Please try again.")
      console.error("Enquiry data fetch error:", error)
      navigate("/admission/enquiry")
      return null
    } finally {
      setLoading(false)
    }
  }

  // Initialize component with proper sequencing
  useEffect(() => {
    if (schoolId && isAuth) {
      fetchSetupData()
    }
  }, [schoolId, isAuth])

  // Improved data loading sequence
  useEffect(() => {
    if (schoolId && isSetupDataLoaded) {
      if (id) {
        // Fetch enquiry data after setup data is loaded
        fetchEnquiryData(id).then((enquiryData) => {
          if (enquiryData && enquiryData.state) {
            // Fetch districts for the saved state after a short delay to ensure setup data is ready
            setTimeout(() => {
              fetchDistrictsByState(enquiryData.state)
            }, 500)
          }
        })
      } else {
        // Generate enquiry key immediately in frontend for new enquiries
        generateUniqueEnquiryKey()
      }
    }
  }, [schoolId, id, isSetupDataLoaded])

  // Handle bus transport toggle
  const handleBusToggle = (e) => {
    const isChecked = e.target.checked
    setIsBusRequired(isChecked)

    if (!isChecked) {
      // Clear bus-related fields when toggle is turned off
      setFormData((prev) => ({
        ...prev,
        boardingPoint: "",
        busRouteNumber: "",
        busFee: "0.00"
      }))
      setBusFeeDetails(null) // Clear bus fee details
      setFeeStructure(prev => ({
        ...prev,
        busFee: null
      }))
    }
  }

  // Handle hostel toggle - ALWAYS fetch tuition fees when toggled on/off
  const handleHostelToggle = async (e) => {
    const isChecked = e.target.checked
    setIsHostelRequired(isChecked)

    if (formData.standard && formData.studentCategory) {
      // Always fetch tuition fees when hostel toggle changes
      await fetchAllFees(formData.standard, formData.studentCategory)
      
      if (isChecked) {
        // Fetch hostel fees when toggle is turned on
        await fetchHostelFees(formData.standard, formData.studentCategory)
      } else {
        // Clear hostel-related fields when toggle is turned off
        setHostelFeeDetails([])
        setFeeStructure(prev => ({
          ...prev,
          hostelFees: []
        }))
        setFormData((prev) => ({
          ...prev,
          lunchRefresh: "",
          hostelFee: "0.00"
        }))
      }
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target

    // Special handling for state change
    if (name === "state") {
      handleStateChange(e)
      return
    }

    // Handle standard change - fetch fees if student category is also selected
    if (name === "standard" && value) {
      if (formData.studentCategory) {
        fetchAllFees(value, formData.studentCategory)
        if (isHostelRequired) {
          fetchHostelFees(value, formData.studentCategory)
        }
      }
    }

    // Handle student category change - fetch fees if standard is also selected
    if (name === "studentCategory" && value) {
      if (formData.standard) {
        fetchAllFees(formData.standard, value)
        if (isHostelRequired) {
          fetchHostelFees(formData.standard, value)
        }
      }
    }

    // Add validation for Aadhar Number - only allow 12 digits
    if (name === "aadharNumber") {
      const digitsOnly = value.replace(/\D/g, "")
      const limitedValue = digitsOnly.slice(0, 12)
      setFormData((prev) => ({
        ...prev,
        [name]: limitedValue,
      }))
      setErrors((prev) => ({ ...prev, [name]: "" }))
      return
    }

    // Add validation for Phone Number - only allow 10 digits
    if (name === "phoneNumber") {
      const digitsOnly = value.replace(/\D/g, "")
      const limitedValue = digitsOnly.slice(0, 10)
      setFormData((prev) => ({
        ...prev,
        [name]: limitedValue,
      }))
      setErrors((prev) => ({ ...prev, [name]: "" }))
      return
    }

    // Special handling for enquiry key to allow manual editing
    if (name === "enquiryKey") {
      // Allow alphanumeric characters and some special characters like hyphens, underscores
      const sanitizedValue = value.replace(/[^a-zA-Z0-9-_]/g, '')
      setFormData((prev) => ({
        ...prev,
        [name]: sanitizedValue,
      }))
      setErrors((prev) => ({ ...prev, [name]: "" }))
      return
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  // Handle photo change - properly track when user uploads a new photo
  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Increased file size validation to 5MB
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Photo size should be less than 5MB")
        return
      }
      
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
      
      // Clear existing photo tracking when user uploads a new photo
      setHasExistingPhoto(false)
      setExistingPhotoUrl("")
    }
  }

  // Handle photo removal
  const handlePhotoRemove = () => {
    if (!isViewMode) {
      setPhotoFile(null)
      setPhotoPreview(defaultStudentPhoto)
      setHasExistingPhoto(false)
      setExistingPhotoUrl("")
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handlePhotoClick = () => {
    if (!isViewMode) {
      fileInputRef.current.click()
    }
  }

  // Regenerate enquiry key function
  const handleRegenerateKey = async () => {
    if (isViewMode || id) return
    
    setLoading(true)
    try {
      await generateUniqueEnquiryKey()
      toast.success("New enquiry key generated!")
    } catch (error) {
      toast.error("Failed to generate new key")
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    const requiredFields = [
      "enquiryKey",
      "studentName",
      "fatherName",
      "motherName",
      "streetVillage",
      "placePincode",
      "district",
      "phoneNumber",
      "nationality",
      "religion",
      "state",
      "community",
      "caste",
      "studentType",
      "studentCategory",
      "standard",
      "section",
      "gender",
      "dateOfBirth",
      "emis",
      "bloodGroup",
      "dateOfAdmission",
      "motherTongue",
      "fatherOccupation",
      "motherOccupation",
      "examNumber",
      "studiedYear",
      "classLastStudied",
      "classToBeAdmitted",
      "nameOfSchool",
      "identificationMark1",
      "identificationMark2",
      "aadharNumber",
    ]

    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].toString().trim() === "") {
        const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, " $1").trim()
        newErrors[field] = `${fieldName} is required`
      }
    })

    // Additional validation for enquiry key format
    if (formData.enquiryKey && !/^[a-zA-Z0-9-_]+$/.test(formData.enquiryKey)) {
      newErrors.enquiryKey = "Enquiry key can only contain letters, numbers, hyphens, and underscores"
    }

    // Validate bus fields if bus transport is required
    if (isBusRequired) {
      if (!formData.boardingPoint) {
        newErrors.boardingPoint = "Boarding Point is required when bus transport is selected"
      }
      if (!formData.busRouteNumber) {
        newErrors.busRouteNumber = "Bus Route Number is required when bus transport is selected"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Calculate total fees including all categories
  const calculateTotalFees = () => {
    const tuitionTotal = feeStructure.tuitionFees.reduce((total, fee) => total + fee.amount, 0)
    const hostelTotal = feeStructure.hostelFees.reduce((total, fee) => total + fee.amount, 0)
    const busTotal = feeStructure.busFee ? feeStructure.busFee.amount : 0
    const overallTotal = tuitionTotal + hostelTotal + busTotal
    
    return {
      tuitionTotal: tuitionTotal.toFixed(2),
      hostelTotal: hostelTotal.toFixed(2),
      busTotal: busTotal.toFixed(2),
      overallTotal: overallTotal.toFixed(2)
    }
  }

  // Handle form submission with proper FormData and photo handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!schoolId) {
      toast.error("School ID not available. Please login again.");
      return;
    }

    if (!validateForm()) {
      toast.error("Please fill in all required fields marked in red");
      // Scroll to the first error field
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    try {
      setLoading(true);

      // Create form data for file upload
      const formDataToSend = new FormData();
      
      // Prepare enquiry data with fee structure as JSON
      const enquiryData = {
        ...formData,
        academicYear: currentAcademicYear || '2024-2025',
        busFee: isBusRequired ? (formData.busFee || "0.00") : "0.00",
        hostelFee: isHostelRequired ? (formData.hostelFee || "0.00") : "0.00",
        tutionFees: formData.tutionFees || "0.00",
        // Ensure optional fields are not null
        admissionNumber: formData.admissionNumber || "",
        boardingPoint: isBusRequired ? (formData.boardingPoint || "") : "",
        busRouteNumber: isBusRequired ? (formData.busRouteNumber || "") : "",
        lunchRefresh: isHostelRequired ? "Hostel Required" : "", // Set a default value for hostel
        // Store fee structure as JSON string in remarks field (or separate column if you prefer)
        feeStructure: JSON.stringify({
          tuitionFees: feeStructure.tuitionFees,
          hostelFees: feeStructure.hostelFees,
          busFee: feeStructure.busFee,
          total: calculateTotalFees().overallTotal
        })
      }

      // Remove any undefined values
      Object.keys(enquiryData).forEach(key => {
        if (enquiryData[key] === undefined) {
          enquiryData[key] = "";
        }
      });

      formDataToSend.append('enquiryData', JSON.stringify(enquiryData));

      // Handle photo upload properly
      // Only add photo file if user uploaded a new one
      if (photoFile) {
        formDataToSend.append('studentPhoto', photoFile);
      } else if (!hasExistingPhoto && id) {
        // If editing and no existing photo and no new photo, send a flag to remove existing photo
        // This handles the case where user removed the existing photo
        formDataToSend.append('removeExistingPhoto', 'true');
      }
      // If hasExistingPhoto is true and no new photoFile, the existing photo is preserved

      const token = getAuthToken();
      let url, method;
      
      if (id) {
        // Update existing enquiry
        url = `${ENDPOINTS.admissionmaster}/enquiry/${id}/with-photo?schoolId=${schoolId}`;
        method = "PUT";
      } else {
        // Create new enquiry
        url = `${ENDPOINTS.admissionmaster}/enquiry/with-photo?schoolId=${schoolId}`;
        method = "POST";
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          "Authorization": `Bearer ${token}`,
          // Don't set Content-Type for FormData - let browser set it with boundary
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        } catch (e) {
          throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const result = await response.json();
      toast.success(`Enquiry ${id ? 'updated' : 'submitted'} successfully!`);
      navigate("/admission/enquiry");

    } catch (error) {
      let errorMessage = "Failed to submit enquiry";
      
      if (error.message.includes("413")) {
        // Updated error message to reflect 5MB limit
        errorMessage = "File size too large. Please use a smaller photo (max 5MB).";
      } else if (error.message.includes("Failed to fetch")) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
      console.error("Form submission error:", error);
    } finally {
      setLoading(false);
    }
  }

  // Render fee table rows with category-wise grouping
  const renderFeeTableRows = () => {
    const totals = calculateTotalFees()
    const allFeeDetails = []

    // Add tuition fees section
    if (feeStructure.tuitionFees.length > 0) {
      // Add section header for tuition fees
      allFeeDetails.push({
        type: "section-header",
        heading: "TUITION FEES",
        amount: "",
        isHeader: true
      })
      
      // Add individual tuition fees (don't show account head in UI)
      feeStructure.tuitionFees.forEach((fee, index) => {
        allFeeDetails.push({
          type: "Tuition",
          heading: fee.feeHeading || "Tuition Fee",
          amount: fee.amount.toFixed(2),
          isItem: true
        })
      })
      
      // Add tuition total
      allFeeDetails.push({
        type: "section-total",
        heading: "Tuition Total",
        amount: totals.tuitionTotal,
        isTotal: true
      })
      
      // Add empty row for spacing
      allFeeDetails.push({
        type: "spacer",
        heading: "",
        amount: "",
        isSpacer: true
      })
    }

    // Add bus fee section if required
    if (isBusRequired && feeStructure.busFee) {
      allFeeDetails.push({
        type: "section-header",
        heading: "TRANSPORT FEES",
        amount: "",
        isHeader: true
      })
      
      // Only show fee heading, not account head
      allFeeDetails.push({
        type: "Transport",
        heading: feeStructure.busFee.feeHeading || "Bus Fee",
        amount: feeStructure.busFee.amount.toFixed(2),
        isItem: true
      })
      
      allFeeDetails.push({
        type: "section-total",
        heading: "Transport Total",
        amount: totals.busTotal,
        isTotal: true
      })
      
      allFeeDetails.push({
        type: "spacer",
        heading: "",
        amount: "",
        isSpacer: true
      })
    }

    // Add hostel fees section if required
    if (isHostelRequired && feeStructure.hostelFees.length > 0) {
      allFeeDetails.push({
        type: "section-header",
        heading: "HOSTEL FEES",
        amount: "",
        isHeader: true
      })
      
      feeStructure.hostelFees.forEach((fee, index) => {
        allFeeDetails.push({
          type: "Hostel",
          heading: fee.feeHeading || "Hostel Fee",
          amount: fee.amount.toFixed(2),
          isItem: true
        })
      })
      
      allFeeDetails.push({
        type: "section-total",
        heading: "Hostel Total",
        amount: totals.hostelTotal,
        isTotal: true
      })
    }

    if (allFeeDetails.length === 0) {
      return (
        <tr>
          <td colSpan="3" className="text-center">
            {(isFeeLoading || isHostelFeeLoading) ? "Loading fee details..." : "No fee details available. Please select Standard and Student Category."}
          </td>
        </tr>
      )
    }

    return allFeeDetails.map((detail, index) => {
      if (detail.isHeader) {
        return (
          <tr key={index} style={{ backgroundColor: "#e9ecef" }}>
            <td colSpan="3" className="fw-bold text-center">
              {detail.heading}
            </td>
          </tr>
        )
      } else if (detail.isTotal) {
        return (
          <tr key={index} style={{ backgroundColor: "#f8f9fa" }}>
            <td colSpan="2" className="fw-bold text-end">
              {detail.heading}:
            </td>
            <td className="fw-bold">₹ {detail.amount}</td>
          </tr>
        )
      } else if (detail.isSpacer) {
        return <tr key={index} style={{ height: "10px" }}><td colSpan="3"></td></tr>
      } else {
        return (
          <tr key={index}>
            <td>{detail.type}</td>
            <td>{detail.heading}</td>
            <td>₹ {detail.amount}</td>
          </tr>
        )
      }
    })
  }

  if (loading && !isSetupDataLoaded) {
    return (
      <MainContentPage>
        <Container fluid className="px-0">
          <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading enquiry form...</p>
            </div>
          </div>
        </Container>
      </MainContentPage>
    )
  }

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        {/* Breadcrumb Navigation */}
        <div className="mb-4">
          <nav className="custom-breadcrumb py-1 py-lg-3">
            <Link to="/home">Home</Link>
            <span className="separator mx-2">&gt;</span>
            <Link to="/admission">Admission</Link>
            <span className="separator mx-2">&gt;</span>
            <Link to="/admission/enquiry">Enquiry</Link>
            <span className="separator mx-2">&gt;</span>
            <span>{isViewMode ? "View Enquiry" : id ? "Edit Enquiry" : "Add Enquiry"}</span>
          </nav>
        </div>

        {/* Card Header */}
        <div
          style={{ backgroundColor: "#0B3D7B" }}
          className="text-white p-3 rounded-top d-flex justify-content-between align-items-center"
        >
          <div className="d-flex align-items-center">
            <Button variant="link" className="text-white p-0 back-button me-3" onClick={handleBack}>
              <FaArrowLeft size={20} />
            </Button>
            <h2 className="mb-0">{isViewMode ? "View Enquiry" : id ? "Edit Enquiry" : "Add Enquiry"}</h2>
          </div>
          <div style={{ width: "20px" }}></div>
        </div>

        {/* Form Container */}
        <div className="bg-white p-4 rounded-bottom shadow">
          <Form onSubmit={handleSubmit} className="enquiry-form">
            <Row>
              <Col md={6}>
                {/* Student Photo Section */}
                <div className="text-center mb-4">
                  <h3 className="section-title">Student Photo</h3>
                  <div
                    className="photo-upload-circle mx-auto"
                    onClick={handlePhotoClick}
                    style={{
                      width: "200px",
                      height: "200px",
                      border: "2px dashed #ccc",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: isViewMode ? "default" : "pointer",
                      overflow: "hidden",
                      backgroundColor: "#f8f9fa",
                      marginBottom: "20px",
                      position: "relative",
                    }}
                  >
                    {photoPreview ? (
                      <img
                        src={photoPreview || "/placeholder.svg"}
                        alt="Student"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          e.target.style.display = 'none'
                          setPhotoPreview(defaultStudentPhoto)
                        }}
                      />
                    ) : (
                      <div className="text-center">
                        <div>Upload Photo Here</div>
                      </div>
                    )}
                    
                    {/* Show existing photo indicator */}
                    {hasExistingPhoto && (
                      <div 
                        style={{
                          position: "absolute",
                          bottom: "5px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          backgroundColor: "rgba(11, 61, 123, 0.8)",
                          color: "white",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontSize: "12px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Existing Photo
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{ display: "none" }}
                    disabled={isViewMode}
                  />
                  
                  {/* Add photo removal button */}
                  {!isViewMode && photoPreview !== defaultStudentPhoto && (
                    <div className="d-flex justify-content-center gap-2 mt-2">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={handlePhotoRemove}
                      >
                        Remove Photo
                      </Button>
                    </div>
                  )}
                  
                  {!isViewMode && (
                    <div className="text-muted small mt-2">
                      Click the circle to upload a student photo (JPG, PNG, etc.) - Max 5MB
                      {hasExistingPhoto && (
                        <div className="text-info mt-1">
                          <strong>Note:</strong> Existing photo will be preserved if you don't upload a new one.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Col>
              <Col md={6}>
                {/* Enquiry Key Section - Frontend Generated */}
                <div className="text-center mb-4">
                  <h3 className="section-title">Enquiry Key</h3>
                  <div className="enquiry-key-section">
                    <Form.Group className="mb-3">
                      <Form.Label>Enquiry Key</Form.Label>
                      <div className="d-flex gap-2">
                        <Form.Control
                          type="text"
                          name="enquiryKey"
                          value={formData.enquiryKey || ""}
                          onChange={handleInputChange}
                          disabled={isViewMode || !!id}
                          className={`form-control-blue ${errors.enquiryKey ? "is-invalid" : ""}`}
                          placeholder="ENQ123456"
                        />
                        {!id && !isViewMode && (
                          <Button
                            variant="outline-primary"
                            onClick={handleRegenerateKey}
                            disabled={loading}
                            title="Generate new enquiry key"
                          >
                            🔄
                          </Button>
                        )}
                      </div>
                      {errors.enquiryKey && <div style={dateInputStyles.error}>{errors.enquiryKey}</div>}
                      <Form.Text className="text-muted">
                        {!id ? "Auto-generated unique key. Click refresh to generate new one." : "Enquiry key cannot be changed for existing records."}
                      </Form.Text>
                    </Form.Group>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Rest of the form remains the same */}
            <Row>
              <Col md={6}>
                {/* Basic Details */}
                <Form.Group className="mb-3">
                  <Form.Label>Student Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="studentName"
                    value={formData.studentName || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.studentName ? "is-invalid" : ""}`}
                  />
                  {errors.studentName && <div style={dateInputStyles.error}>{errors.studentName}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Father's Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="fatherName"
                    value={formData.fatherName || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.fatherName ? "is-invalid" : ""}`}
                  />
                  {errors.fatherName && <div style={dateInputStyles.error}>{errors.fatherName}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Mother's Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="motherName"
                    value={formData.motherName || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.motherName ? "is-invalid" : ""}`}
                  />
                  {errors.motherName && <div style={dateInputStyles.error}>{errors.motherName}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Father's Occupation</Form.Label>
                  <Form.Select
                    name="fatherOccupation"
                    value={formData.fatherOccupation || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.fatherOccupation ? "is-invalid" : ""}`}
                  >
                    <option value="">Select Father's Occupation</option>
                    {setupData.parentOccupations.map((occupation) => (
                      <option key={occupation.id} value={occupation.name}>
                        {occupation.name}
                      </option>
                    ))}
                  </Form.Select>
                  {errors.fatherOccupation && <div style={dateInputStyles.error}>{errors.fatherOccupation}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Mother's Occupation</Form.Label>
                  <Form.Select
                    name="motherOccupation"
                    value={formData.motherOccupation || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.motherOccupation ? "is-invalid" : ""}`}
                  >
                    <option value="">Select Mother's Occupation</option>
                    {setupData.parentOccupations.map((occupation) => (
                      <option key={occupation.id} value={occupation.name}>
                        {occupation.name}
                      </option>
                    ))}
                  </Form.Select>
                  {errors.motherOccupation && <div style={dateInputStyles.error}>{errors.motherOccupation}</div>}
                </Form.Group>

                {/* Personal Details */}
                <h3 className="section-title mt-4">Personal Details</h3>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.phoneNumber ? "is-invalid" : ""}`}
                  />
                  {errors.phoneNumber && <div style={dateInputStyles.error}>{errors.phoneNumber}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email ID</Form.Label>
                  <Form.Control
                    type="email"
                    name="emailId"
                    value={formData.emailId || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className="form-control-blue"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Gender</Form.Label>
                  <Form.Select
                    name="gender"
                    value={formData.gender || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.gender ? "is-invalid" : ""}`}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Transgender">Transgender</option>
                  </Form.Select>
                  {errors.gender && <div style={dateInputStyles.error}>{errors.gender}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Date Of Birth</Form.Label>
                  <div style={dateInputStyles.wrapper}>
                    <Form.Control
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth || ""}
                      onChange={handleInputChange}
                      disabled={isViewMode}
                      className={`form-control-blue ${errors.dateOfBirth ? "is-invalid" : ""}`}
                      ref={dateOfBirthRef}
                    />
                    {!isViewMode && (
                      <button
                        type="button"
                        style={dateInputStyles.calendarIcon}
                        onClick={(e) => {
                          e.preventDefault()
                          dateOfBirthRef.current.showPicker()
                        }}
                      />
                    )}
                  </div>
                  {errors.dateOfBirth && <div style={dateInputStyles.error}>{errors.dateOfBirth}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Blood Group</Form.Label>
                  <Form.Select
                    name="bloodGroup"
                    value={formData.bloodGroup || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.bloodGroup ? "is-invalid" : ""}`}
                  >
                    <option value="">Select Blood Group</option>
                    {setupData.bloodGroups.map((bg) => (
                      <option key={bg.id} value={bg.name}>
                        {bg.name}
                      </option>
                    ))}
                  </Form.Select>
                  {errors.bloodGroup && <div style={dateInputStyles.error}>{errors.bloodGroup}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Nationality</Form.Label>
                  <Form.Select
                    name="nationality"
                    value={formData.nationality || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.nationality ? "is-invalid" : ""}`}
                  >
                    <option value="">Select Nationality</option>
                    {setupData.nationalities.map((nat) => (
                      <option key={nat.id} value={nat.name}>
                        {nat.name}
                      </option>
                    ))}
                  </Form.Select>
                  {errors.nationality && <div style={dateInputStyles.error}>{errors.nationality}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Religion</Form.Label>
                  <Form.Select
                    name="religion"
                    value={formData.religion || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.religion ? "is-invalid" : ""}`}
                  >
                    <option value="">Select Religion</option>
                    {setupData.religions.map((rel) => (
                      <option key={rel.id} value={rel.name}>
                        {rel.name}
                      </option>
                    ))}
                  </Form.Select>
                  {errors.religion && <div style={dateInputStyles.error}>{errors.religion}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Community</Form.Label>
                  <Form.Select
                    name="community"
                    value={formData.community || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.community ? "is-invalid" : ""}`}
                  >
                    <option value="">Select Community</option>
                    {setupData.communities.map((comm) => (
                      <option key={comm.id} value={comm.name}>
                        {comm.name}
                      </option>
                    ))}
                  </Form.Select>
                  {errors.community && <div style={dateInputStyles.error}>{errors.community}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Caste</Form.Label>
                  <Form.Select
                    name="caste"
                    value={formData.caste || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.caste ? "is-invalid" : ""}`}
                  >
                    <option value="">Select Caste</option>
                    {setupData.castes.map((caste) => (
                      <option key={caste.id} value={caste.name}>
                        {caste.name}
                      </option>
                    ))}
                  </Form.Select>
                  {errors.caste && <div style={dateInputStyles.error}>{errors.caste}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Mother Tongue</Form.Label>
                  <Form.Select
                    name="motherTongue"
                    value={formData.motherTongue || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.motherTongue ? "is-invalid" : ""}`}
                  >
                    <option value="">Select Mother Tongue</option>
                    {setupData.motherTongues.map((mt) => (
                      <option key={mt.id} value={mt.name}>
                        {mt.name}
                      </option>
                    ))}
                  </Form.Select>
                  {errors.motherTongue && <div style={dateInputStyles.error}>{errors.motherTongue}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Aadhar Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="aadharNumber"
                    value={formData.aadharNumber || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.aadharNumber ? "is-invalid" : ""}`}
                  />
                  {errors.aadharNumber && <div style={dateInputStyles.error}>{errors.aadharNumber}</div>}
                </Form.Group>

                {/* Address Details */}
                <h3 className="section-title">Address Details</h3>
                <Form.Group className="mb-3">
                  <Form.Label>Street/Village</Form.Label>
                  <Form.Control
                    type="text"
                    name="streetVillage"
                    value={formData.streetVillage || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.streetVillage ? "is-invalid" : ""}`}
                  />
                  {errors.streetVillage && <div style={dateInputStyles.error}>{errors.streetVillage}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Place/Pincode</Form.Label>
                  <Form.Control
                    type="text"
                    name="placePincode"
                    value={formData.placePincode || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.placePincode ? "is-invalid" : ""}`}
                  />
                  {errors.placePincode && <div style={dateInputStyles.error}>{errors.placePincode}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>State</Form.Label>
                  <Form.Select
                    name="state"
                    value={formData.state || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.state ? "is-invalid" : ""}`}
                  >
                    <option value="">Select State</option>
                    {setupData.states.map((state) => (
                      <option key={state.id} value={state.name}>
                        {state.name}
                      </option>
                    ))}
                  </Form.Select>
                  {errors.state && <div style={dateInputStyles.error}>{errors.state}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>District</Form.Label>
                  <div className="position-relative">
                    <Form.Select
                      name="district"
                      value={formData.district || ""}
                      onChange={handleInputChange}
                      disabled={isViewMode || !formData.state || isDistrictsLoading}
                      className={`form-control-blue ${errors.district ? "is-invalid" : ""}`}
                    >
                      <option value="">
                        {isDistrictsLoading ? "Loading districts..." : 
                         formData.state ? "Select District" : "First select State"}
                      </option>
                      {filteredDistricts.map((district) => (
                        <option key={district.id} value={district.name}>
                          {district.name}
                        </option>
                      ))}
                      {filteredDistricts.length === 0 && formData.state && !isDistrictsLoading && (
                        <option value="" disabled>No districts found for {formData.state}</option>
                      )}
                    </Form.Select>
                    {isDistrictsLoading && (
                      <div className="position-absolute top-50 end-0 translate-middle-y me-2">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.district && <div style={dateInputStyles.error}>{errors.district}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Communication Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="communicationAddress"
                    value={formData.communicationAddress || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className="form-control-blue"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                {/* Academic Details */}
                <h3 className="section-title mt-4">Academic Details</h3>
                <Form.Group className="mb-3">
                  <Form.Label>Student Type</Form.Label>
                  <Form.Select
                    name="studentType"
                    value={formData.studentType || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.studentType ? "is-invalid" : ""}`}
                  >
                    <option value="">Select Student Type</option>
                    <option value="New">New</option>
                    <option value="Existing">Existing</option>
                  </Form.Select>
                  {errors.studentType && <div style={dateInputStyles.error}>{errors.studentType}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Student Category</Form.Label>
                  <Form.Select
                    name="studentCategory"
                    value={formData.studentCategory || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.studentCategory ? "is-invalid" : ""}`}
                  >
                    <option value="">Select Category</option>
                    {setupData.studentCategories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </Form.Select>
                  {errors.studentCategory && <div style={dateInputStyles.error}>{errors.studentCategory}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Standard</Form.Label>
                  <Form.Select
                    name="standard"
                    value={formData.standard || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.standard ? "is-invalid" : ""}`}
                  >
                    <option value="">Select Standard</option>
                    {setupData.courses.map((course) => (
                      <option key={course.id} value={course.name}>
                        {course.name}
                      </option>
                    ))}
                  </Form.Select>
                  {errors.standard && <div style={dateInputStyles.error}>{errors.standard}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Section</Form.Label>
                  <Form.Select
                    name="section"
                    value={formData.section || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.section ? "is-invalid" : ""}`}
                  >
                    <option value="">Select Section</option>
                    {setupData.sections.map((section) => (
                      <option key={section.id} value={section.name}>
                        {section.name}
                      </option>
                    ))}
                  </Form.Select>
                  {errors.section && <div style={dateInputStyles.error}>{errors.section}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>EMIS</Form.Label>
                  <Form.Control
                    type="text"
                    name="emis"
                    value={formData.emis || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.emis ? "is-invalid" : ""}`}
                  />
                  {errors.emis && <div style={dateInputStyles.error}>{errors.emis}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Date Of Admission</Form.Label>
                  <div style={dateInputStyles.wrapper}>
                    <Form.Control
                      type="date"
                      name="dateOfAdmission"
                      value={formData.dateOfAdmission || ""}
                      onChange={handleInputChange}
                      disabled={isViewMode}
                      className={`form-control-blue ${errors.dateOfAdmission ? "is-invalid" : ""}`}
                      ref={dateOfAdmissionRef}
                    />
                    {!isViewMode && (
                      <button
                        type="button"
                        style={dateInputStyles.calendarIcon}
                        onClick={(e) => {
                          e.preventDefault()
                          dateOfAdmissionRef.current.showPicker()
                        }}
                      />
                    )}
                  </div>
                  {errors.dateOfAdmission && <div style={dateInputStyles.error}>{errors.dateOfAdmission}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Exam Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="examNumber"
                    value={formData.examNumber || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.examNumber ? "is-invalid" : ""}`}
                  />
                  {errors.examNumber && <div style={dateInputStyles.error}>{errors.examNumber}</div>}
                </Form.Group>

                {/* Bus Transport Details */}
                <h3 className="section-title mt-4">Bus Transport Details</h3>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="bus-toggle"
                    label="Bus Transport Required"
                    checked={isBusRequired}
                    onChange={handleBusToggle}
                    disabled={isViewMode}
                  />
                </Form.Group>
                {isBusRequired && (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label>Boarding Point</Form.Label>
                      <Form.Select
                        name="boardingPoint"
                        value={formData.boardingPoint || ""}
                        onChange={handleInputChange}
                        disabled={isViewMode}
                        className={`form-control-blue ${errors.boardingPoint ? "is-invalid" : ""}`}
                      >
                        <option value="">Select Boarding Point</option>
                        {setupData.boardingPoints.map((point) => (
                          <option key={point.id} value={point.placeName}>
                            {point.placeName}
                          </option>
                        ))}
                      </Form.Select>
                      {errors.boardingPoint && <div style={dateInputStyles.error}>{errors.boardingPoint}</div>}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Bus Route Number</Form.Label>
                      <Form.Select
                        name="busRouteNumber"
                        value={formData.busRouteNumber || ""}
                        onChange={handleInputChange}
                        disabled={isViewMode}
                        className={`form-control-blue ${errors.busRouteNumber ? "is-invalid" : ""}`}
                      >
                        <option value="">Select Bus Route</option>
                        {setupData.busRoutes.map((route) => (
                          <option key={route.id} value={route.route}>
                            {route.route}
                          </option>
                        ))}
                      </Form.Select>
                      {errors.busRouteNumber && <div style={dateInputStyles.error}>{errors.busRouteNumber}</div>}
                    </Form.Group>
                    
                    {/* Bus Fee Loading Indicator */}
                    {isBusFeeLoading && (
                      <div className="mb-3">
                        <div className="d-flex align-items-center text-primary">
                          <div className="spinner-border spinner-border-sm me-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          Loading bus fee...
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Hostel Details - Only toggle button */}
                <h3 className="section-title mt-4">Hostel Details</h3>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="hostel-toggle"
                    label="Hostel Required"
                    checked={isHostelRequired}
                    onChange={handleHostelToggle}
                    disabled={isViewMode}
                  />
                </Form.Group>

                {/* Previous Studied Details */}
                <h3 className="section-title mt-4">Previous Studied Details</h3>
                <Form.Group className="mb-3">
                  <Form.Label>Studied Year</Form.Label>
                  <Form.Control
                    type="text"
                    name="studiedYear"
                    value={formData.studiedYear || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.studiedYear ? "is-invalid" : ""}`}
                  />
                  {errors.studiedYear && <div style={dateInputStyles.error}>{errors.studiedYear}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Class Last Studied</Form.Label>
                  <Form.Select
                    name="classLastStudied"
                    value={formData.classLastStudied || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.classLastStudied ? "is-invalid" : ""}`}
                  >
                    <option value="">Select Class</option>
                    {setupData.courses.map((course) => (
                      <option key={course.id} value={course.name}>
                        {course.name}
                      </option>
                    ))}
                  </Form.Select>
                  {errors.classLastStudied && <div style={dateInputStyles.error}>{errors.classLastStudied}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Class to be Admitted</Form.Label>
                  <Form.Select
                    name="classToBeAdmitted"
                    value={formData.classToBeAdmitted || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.classToBeAdmitted ? "is-invalid" : ""}`}
                  >
                    <option value="">Select Class</option>
                    {setupData.courses.map((course) => (
                      <option key={course.id} value={course.name}>
                        {course.name}
                      </option>
                    ))}
                  </Form.Select>
                  {errors.classToBeAdmitted && <div style={dateInputStyles.error}>{errors.classToBeAdmitted}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Name of the School</Form.Label>
                  <Form.Control
                    type="text"
                    name="nameOfSchool"
                    value={formData.nameOfSchool || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.nameOfSchool ? "is-invalid" : ""}`}
                  />
                  {errors.nameOfSchool && <div style={dateInputStyles.error}>{errors.nameOfSchool}</div>}
                </Form.Group>

                {/* Remarks and Identification Marks */}
                <h3 className="section-title mt-4">Remarks</h3>
                <Form.Group className="mb-3">
                  <Form.Label>Student Identification Mark 1</Form.Label>
                  <Form.Control
                    type="text"
                    name="identificationMark1"
                    value={formData.identificationMark1 || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.identificationMark1 ? "is-invalid" : ""}`}
                  />
                  {errors.identificationMark1 && <div style={dateInputStyles.error}>{errors.identificationMark1}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Student Identification Mark 2</Form.Label>
                  <Form.Control
                    type="text"
                    name="identificationMark2"
                    value={formData.identificationMark2 || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.identificationMark2 ? "is-invalid" : ""}`}
                  />
                  {errors.identificationMark2 && <div style={dateInputStyles.error}>{errors.identificationMark2}</div>}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Remarks</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="remarks"
                    value={formData.remarks || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className="form-control-blue"
                  />
                </Form.Group>

                {/* Fee Details Table */}
                <h3 className="section-title mt-4">All Fees Details</h3>
                <div className="fee-details-table mb-4">
                  <Table bordered hover size="sm">
                    <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                      <tr>
                        <th>Fee Type</th>
                        <th>Fee Heading</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(isFeeLoading || isHostelFeeLoading || isBusFeeLoading) ? (
                        <tr>
                          <td colSpan="3" className="text-center">
                            <div className="d-flex justify-content-center align-items-center">
                              <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              Loading fee details...
                            </div>
                          </td>
                        </tr>
                      ) : (
                        renderFeeTableRows()
                      )}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                        <td colSpan="2" className="text-end fw-bold">
                          GRAND TOTAL:
                        </td>
                        <td className="fw-bold">₹ {calculateTotalFees().overallTotal}</td>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              </Col>
            </Row>

            {/* Submit Button */}
            <div className="d-flex justify-content-center mt-4">
              {!isViewMode && (
                <Button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? "SUBMITTING..." : "SUBMIT ENQUIRY"}
                </Button>
              )}
            </div>
          </Form>
        </div>
      </Container>

      <style>
        {`
          .custom-breadcrumb {
            padding: 0.5rem 1rem;
          }

          .custom-breadcrumb a {
            color: #0B3D7B;
            text-decoration: none;
          }

          .custom-breadcrumb .separator {
            margin: 0 0.5rem;
            color: #6c757d;
          }

          .custom-breadcrumb .current {
            color: #212529;
          }

          .enquiry-form-container {
            background-color: #fff;
            padding: 2rem;
          }

          .enquiry-form {
            max-width: 1200px;
            margin: 0 auto;
          }

          .section-title {
            color: #0B3D7B;
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 1rem;
          }

          .form-control-blue {
            background-color: #F0F4FF !important;
            border: 1px solid #E2E8F0;
            border-radius: 4px;
            padding: 0.5rem;
          }

          .form-control-blue:focus {
            border-color: #0B3D7B;
            box-shadow: 0 0 0 0.2rem rgba(11, 61, 123, 0.25);
          }

          .submit-btn {
            background: linear-gradient(to bottom, #1565C0, #0B3D7B);
            border: none;
            padding: 0.75rem 2rem;
            font-weight: 600;
            letter-spacing: 0.5px;
            min-width: 200px;
          }

          .submit-btn:hover:not(:disabled) {
            background: linear-gradient(to bottom, #1976D2, #1565C0);
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          .submit-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .photo-upload-circle {
            transition: all 0.3s ease;
          }

          .photo-upload-circle:hover:not(:disabled) {
            border-color: #0B3D7B;
            background-color: #F8FAFF;
          }

          .form-label {
            font-weight: 500;
            color: #2D3748;
          }

          /* Custom styling for date inputs */
          input[type="date"].form-control-blue {
            position: relative;
            padding-right: 35px;
          }

          input[type="date"].form-control-blue::-webkit-calendar-picker-indicator {
            position: absolute;
            right: 10px;
            cursor: pointer;
          }

          /* Card header styles */
          h2 {
            font-size: 1.5rem;
            margin-bottom: 0;
          }

          .fee-details-table table {
            margin-bottom: 1rem;
          }

          .fee-details-table th,
          .fee-details-table td {
            vertical-align: middle;
            padding: 0.5rem;
          }

          .fee-details-table tfoot td {
            background-color: #f8f9fa;
          }

          /* Error styles */
          .is-invalid {
            border-color: #dc3545 !important;
          }

          /* Enquiry key section styles */
          .enquiry-key-section {
            max-width: 300px;
            margin: 0 auto;
          }

          /* Back button styles */
          .back-button:hover {
            opacity: 0.8;
          }

          /* Responsive adjustments */
          @media (max-width: 768px) {
            .enquiry-form-container {
              padding: 1rem;
            }

            .section-title {
              font-size: 1.1rem;
            }

            .submit-btn {
              width: 100%;
            }
            
            .fee-details-table table {
              font-size: 0.9rem;
            }

            .enquiry-key-section {
              max-width: 100%;
            }
          }
        `}
      </style>
      <ToastContainer />
    </MainContentPage>
  )
}

export default EnquiryForm