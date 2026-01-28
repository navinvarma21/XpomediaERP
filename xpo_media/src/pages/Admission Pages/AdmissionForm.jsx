"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useNavigate, useLocation, Link } from "react-router-dom"
import { Form, Button, Row, Col, Container, Table, Modal } from "react-bootstrap"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import MainContentPage from "../../components/MainContent/MainContentPage"
import defaultStudentPhoto from "../../images/StudentProfileIcon/studentProfile.jpeg"
import { QRCodeSVG } from "qrcode.react"
import QRCode from "qrcode"
import { useAuthContext } from "../../Context/AuthContext"
import { ENDPOINTS } from "../../SpringBoot/config"
import { FaArrowLeft, FaTimes, FaDownload, FaQrcode } from "react-icons/fa"
import "./AdmissionForm.css"

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

// QR Code Modal Component
const QRCodeModal = ({ isOpen, onClose, studentData, onDownload }) => {
  if (!isOpen || !studentData) return null

  const handleDownload = () => {
    onDownload(studentData)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <h2 className="modal-title">Student QR Code</h2>
        <div className="modal-body text-center">
          <div className="mb-3">
            <QRCodeSVG
              value={studentData.qrCode || ""}
              size={250}
              level="H"
              includeMargin
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </div>
          <div className="student-info mb-3 p-3 bg-light rounded text-center">
            <h5 className="mb-2 fw-bold text-primary">{studentData.studentName}</h5>
            <p className="mb-1"><strong>Admission No:</strong> {studentData.admissionNumber}</p>
            <p className="mb-1"><strong>Class:</strong> {studentData.standard} - {studentData.section}</p>
            <p className="mb-0"><strong>Father:</strong> {studentData.fatherName}</p>
          </div>
        </div>
        <div className="modal-buttons">
          <Button className="modal-button confirm" onClick={handleDownload}>
            <FaDownload className="me-2" />
            Download QR
          </Button>
          <Button className="modal-button cancel" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

// Beautiful QR Code Display Component
const BeautifulQRDisplay = ({ qrData, studentData, size = 200, showInfo = true }) => {
  if (!qrData) {
    return (
      <div className="text-muted text-center">
        <div style={{
          width: size,
          height: size,
          border: '2px dashed #ccc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          margin: '0 auto'
        }}>
          QR code will appear after filling admission details
        </div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="mb-3">
        <QRCodeSVG
          value={qrData}
          size={size}
          level="H"
          includeMargin
          bgColor="#FFFFFF"
          fgColor="#000000"
        />
      </div>
    </div>
  )
}

const AdmissionForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isViewMode = new URLSearchParams(location.search).get("view") === "true"
  const { schoolId, getAuthHeaders, isAuth, currentAcademicYear, getAuthToken } = useAuthContext()

  // Track if we have an existing photo
  const [hasExistingPhoto, setHasExistingPhoto] = useState(false)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState("")

  // Fee structure to store all fee details with account heads (NOT displayed in UI)
  const [feeStructure, setFeeStructure] = useState({
    tuitionFees: [],  // Array of {feeHeading, accountHead, amount}
    hostelFees: [],   // Array of {feeHeading, accountHead, amount}
    busFee: null,     // {feeHeading, accountHead, amount, boardingPoint, busRouteNumber}
    totalFees: "0.00"
  })

  // Form data state
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
    phoneNumber2: "",
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
  const [busFeeDetails, setBusFeeDetails] = useState(null)
  const [isFeeLoading, setIsFeeLoading] = useState(false)
  const [isHostelFeeLoading, setIsHostelFeeLoading] = useState(false)
  const [isBusFeeLoading, setIsBusFeeLoading] = useState(false)
  const [qrCodeData, setQRCodeData] = useState("")
  const [enquiryNumbers, setEnquiryNumbers] = useState([])

  // QR Modal states
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrStudentData, setQrStudentData] = useState(null)

  // Add back button handler
  const handleBack = () => {
    navigate("/admission/StudentDetails")
  }

  // Generate admission number in frontend
  const generateAdmissionNumber = useCallback(async () => {
    if (!schoolId) return ""

    try {
      const fourDigitNumber = Math.floor(1000 + Math.random() * 9000)
      const newAdmissionNumber = `ADM${fourDigitNumber}`

      setFormData((prevData) => ({
        ...prevData,
        admissionNumber: newAdmissionNumber
      }))

      return newAdmissionNumber
    } catch (error) {
      const timestamp = Date.now().toString().slice(-4)
      const fallbackNumber = `ADM${timestamp}`
      setFormData((prevData) => ({
        ...prevData,
        admissionNumber: fallbackNumber
      }))
      return fallbackNumber
    }
  }, [schoolId])

  // Function to fetch all tuition fees based on standard and student category
  const fetchAllFees = async (standard, studentCategory) => {
    if (!schoolId || !standard || !studentCategory) {
      setFeeDetails([])
      setFeeStructure(prev => ({
        ...prev,
        tuitionFees: [],
        totalFees: "0.00"
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
        
        // Store fee structure with account heads (NOT displayed in UI)
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
        
      } else {
        setFeeDetails([])
        setFeeStructure(prev => ({
          ...prev,
          tuitionFees: [],
          totalFees: "0.00"
        }))
      }
    } catch (error) {
      setFeeDetails([])
      setFeeStructure(prev => ({
        ...prev,
        tuitionFees: [],
        totalFees: "0.00"
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
        
        // Store hostel fee structure with account heads (NOT displayed in UI)
        const hostelFeeStructure = hostelFeesData.map(fee => ({
          feeHeading: fee.feeHeading || "Hostel Fee",
          accountHead: fee.accountHead || "Hostel",
          amount: parseFloat(fee.amount) || 0
        }))
        
        setFeeStructure(prev => ({
          ...prev,
          hostelFees: hostelFeeStructure
        }))
        
      } else {
        setHostelFeeDetails([])
        setFeeStructure(prev => ({
          ...prev,
          hostelFees: [],
          totalFees: "0.00"
        }))
      }
    } catch (error) {
      setHostelFeeDetails([])
      setFeeStructure(prev => ({
        ...prev,
        hostelFees: [],
        totalFees: "0.00"
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
        
        // Store bus fee details including account head (NOT displayed in UI)
        const busFeeStructure = {
          feeHeading: busFeeData?.feeHeading || "Bus Fee",
          accountHead: busFeeData?.accountHead || "Transport",
          amount: busFee,
          boardingPoint: boardingPoint,
          busRouteNumber: busRouteNumber
        }
        
        setBusFeeDetails(busFeeData)
        setFeeStructure(prev => ({
          ...prev,
          busFee: busFeeStructure
        }))
        
        toast.success(`Bus fee loaded: ₹${busFee.toFixed(2)}`)
      } else {
        setFeeStructure(prev => ({
          ...prev,
          busFee: null,
          totalFees: "0.00"
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
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [isBusRequired, formData.boardingPoint, formData.busRouteNumber])

  // Fetch all setup data for dropdowns
  const fetchSetupData = async () => {
    if (!schoolId || !isAuth) return

    try {
      setLoading(true)

      const responses = await Promise.all([
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

      const data = await Promise.all(responses.map(async response =>
        response.ok ? response.json() : []
      ))

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
      ] = data

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
    } finally {
      setLoading(false)
    }
  }

  // Function to fetch districts based on selected state
  const fetchDistrictsByState = async (stateName) => {
    if (!schoolId || !stateName) {
      setFilteredDistricts([])
      return
    }

    try {
      setIsDistrictsLoading(true)

      const selectedState = setupData.states.find(state =>
        state.name === stateName || state.name?.toLowerCase() === stateName?.toLowerCase()
      )

      if (!selectedState || !selectedState.id) {
        setFilteredDistricts([])
        return
      }

      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/amdropdowns/districts/bystate?schoolId=${schoolId}&stateId=${selectedState.id}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const districts = await response.json()
        setFilteredDistricts(districts || [])
      } else {
        setFilteredDistricts([])
      }
    } catch (error) {
      setFilteredDistricts([])
    } finally {
      setIsDistrictsLoading(false)
    }
  }

  // Fetch enquiry numbers for dropdown
  const fetchEnquiryNumbers = async () => {
    if (!schoolId) return

    try {
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/enquiry/school/${schoolId}?academicYear=${currentAcademicYear || '2024-2025'}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const enquiries = await response.json()
        const enquiryKeys = enquiries.map(enquiry => enquiry.enquiryKey).filter(Boolean)
        setEnquiryNumbers(enquiryKeys)
      }
    } catch (error) {
      // Silently handle error
    }
  }

  // Convert image URL to File object
  const urlToFile = async (url, filename) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const file = new File([blob], filename, { type: blob.type })
      return file
    } catch (error) {
      return null
    }
  }

  // Enhanced function to fetch enquiry data and load related data
  const fetchEnquiryData = async (enquiryKey) => {
    if (!schoolId || !enquiryKey) return

    try {
      setLoading(true)

      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/enquiry/school/${schoolId}?academicYear=${currentAcademicYear || '2024-2025'}`,
        { headers: getAuthHeaders() }
      )

      if (response.ok) {
        const enquiries = await response.json()
        const enquiryData = enquiries.find(enquiry => enquiry.enquiryKey === enquiryKey)

        if (enquiryData) {
          const newFormData = {
            enquiryKey: enquiryData.enquiryKey || "",
            admissionNumber: "",
            studentName: enquiryData.studentName || "",
            fatherName: enquiryData.fatherName || "",
            motherName: enquiryData.motherName || "",
            streetVillage: enquiryData.streetVillage || "",
            placePincode: enquiryData.placePincode || "",
            district: enquiryData.district || "",
            phoneNumber: enquiryData.phoneNumber || "",
            phoneNumber2: enquiryData.phoneNumber2 || "",
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
            studiedYear: enquiryData.studiedYear || "",
            classLastStudied: enquiryData.classLastStudied || "",
            classToBeAdmitted: enquiryData.classToBeAdmitted || "",
            nameOfSchool: enquiryData.nameOfSchool || "",
            remarks: enquiryData.remarks || "",
            identificationMark1: enquiryData.identificationMark1 || "",
            identificationMark2: enquiryData.identificationMark2 || "",
            aadharNumber: enquiryData.aadharNumber || "",
          }

          setFormData(prev => ({
            ...prev,
            ...newFormData,
            admissionNumber: prev.admissionNumber
          }))

          const busRequired = !!(enquiryData.boardingPoint && enquiryData.busRouteNumber)
          setIsBusRequired(busRequired)

          if (enquiryData.studentPhoto) {
            const photoUrl = `${ENDPOINTS.admissionmaster}/enquiry/${enquiryData.id}/photo?schoolId=${schoolId}&t=${Date.now()}`
            setPhotoPreview(photoUrl)
            setHasExistingPhoto(true)
            setExistingPhotoUrl(photoUrl)

            try {
              const photoFile = await urlToFile(photoUrl, `student-photo-${enquiryData.enquiryKey}.jpg`)
              if (photoFile) {
                setPhotoFile(photoFile)
              }
            } catch (error) {
              // Silently handle error
            }
          } else {
            setPhotoPreview(defaultStudentPhoto)
            setHasExistingPhoto(false)
            setExistingPhotoUrl("")
            setPhotoFile(null)
          }

          const hostelRequired = !!enquiryData.lunchRefresh
          setIsHostelRequired(hostelRequired)

          if (enquiryData.state) {
            await fetchDistrictsByState(enquiryData.state)
          }

          if (enquiryData.standard && enquiryData.studentCategory) {
            await fetchAllFees(enquiryData.standard, enquiryData.studentCategory)

            if (hostelRequired) {
              await fetchHostelFees(enquiryData.standard, enquiryData.studentCategory)
            }
          }

          if (busRequired && enquiryData.boardingPoint && enquiryData.busRouteNumber) {
            await fetchBusFee(enquiryData.boardingPoint, enquiryData.busRouteNumber)
          }

          toast.success("Enquiry data loaded successfully!")
        } else {
          toast.error("No enquiry found with the given key.")
        }
      }
    } catch (error) {
      toast.error("Failed to fetch enquiry data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Fetch admission data for editing/viewing
  const fetchAdmissionData = async (admissionId) => {
    if (!schoolId) return

    try {
      setLoading(true)
      
      // First fetch basic admission data
      const admissionResponse = await fetch(
        `${ENDPOINTS.admissionmaster}/admission/${admissionId}?schoolId=${schoolId}&academicYear=${currentAcademicYear || '2024-2025'}`,
        { headers: getAuthHeaders() }
      )

      if (admissionResponse.ok) {
        const admissionData = await admissionResponse.json()

        const newFormData = {
          enquiryKey: admissionData.enquiryKey || "",
          admissionNumber: admissionData.admissionNumber || "",
          studentName: admissionData.studentName || "",
          fatherName: admissionData.fatherName || "",
          motherName: admissionData.motherName || "",
          streetVillage: admissionData.streetVillage || "",
          placePincode: admissionData.placePincode || "",
          district: admissionData.district || "",
          phoneNumber: admissionData.phoneNumber || "",
          phoneNumber2: admissionData.phoneNumber2 || "",
          boardingPoint: admissionData.boardingPoint || "",
          busRouteNumber: admissionData.busRouteNumber || "",
          emailId: admissionData.emailId || "",
          communicationAddress: admissionData.communicationAddress || "",
          nationality: admissionData.nationality || "",
          religion: admissionData.religion || "",
          state: admissionData.state || "",
          community: admissionData.community || "",
          caste: admissionData.caste || "",
          studentType: admissionData.studentType || "",
          studentCategory: admissionData.studentCategory || "",
          standard: admissionData.standard || "",
          section: admissionData.section || "",
          gender: admissionData.gender || "",
          dateOfBirth: admissionData.dateOfBirth || "",
          emis: admissionData.emis || "",
          lunchRefresh: admissionData.lunchRefresh || "",
          bloodGroup: admissionData.bloodGroup || "",
          dateOfAdmission: admissionData.dateOfAdmission || "",
          motherTongue: admissionData.motherTongue || "",
          fatherOccupation: admissionData.fatherOccupation || "",
          motherOccupation: admissionData.motherOccupation || "",
          examNumber: admissionData.examNumber || "",
          studiedYear: admissionData.studiedYear || "",
          classLastStudied: admissionData.classLastStudied || "",
          classToBeAdmitted: admissionData.classToBeAdmitted || "",
          nameOfSchool: admissionData.nameOfSchool || "",
          remarks: admissionData.remarks || "",
          identificationMark1: admissionData.identificationMark1 || "",
          identificationMark2: admissionData.identificationMark2 || "",
          aadharNumber: admissionData.aadharNumber || "",
        }

        setFormData(newFormData)

        // Then fetch fee details
        const feeResponse = await fetch(
          `${ENDPOINTS.admissionmaster}/admission/${admissionId}/fee-details?schoolId=${schoolId}&academicYear=${currentAcademicYear || '2024-2025'}`,
          { headers: getAuthHeaders() }
        )

        if (feeResponse.ok) {
          const feeDetails = await feeResponse.json()
          
          // Update fee structure from backend
          setFeeStructure({
            tuitionFees: feeDetails.tuitionFees || [],
            hostelFees: feeDetails.hostelFees || [],
            busFee: feeDetails.transportFee ? {
              feeHeading: feeDetails.transportFee.feeHeading,
              accountHead: feeDetails.transportFee.accountHead,
              amount: feeDetails.transportFee.amount,
              boardingPoint: feeDetails.transportFee.boardingPoint,
              busRouteNumber: feeDetails.transportFee.busRouteNumber
            } : null,
            totalFees: feeDetails.grandTotal ? feeDetails.grandTotal.toFixed(2) : "0.00"
          })

          // Update fee details for UI display
          setFeeDetails(feeDetails.tuitionFees || [])
          setHostelFeeDetails(feeDetails.hostelFees || [])
          setBusFeeDetails(feeDetails.transportFee)
        }

        if (admissionData.studentPhoto) {
          const photoUrl = `${ENDPOINTS.admissionmaster}/admission/${admissionId}/photo?schoolId=${schoolId}&academicYear=${currentAcademicYear || '2024-2025'}&t=${Date.now()}`
          setPhotoPreview(photoUrl)
          setHasExistingPhoto(true)
          setExistingPhotoUrl(photoUrl)
          setPhotoFile(null)
        } else {
          setPhotoPreview(defaultStudentPhoto)
          setHasExistingPhoto(false)
          setExistingPhotoUrl("")
          setPhotoFile(null)
        }

        const busRequired = !!(admissionData.boardingPoint && admissionData.busRouteNumber)
        const hostelRequired = !!admissionData.lunchRefresh

        setIsBusRequired(busRequired)
        setIsHostelRequired(hostelRequired)

        if (admissionData.state) {
          await fetchDistrictsByState(admissionData.state)
        }

        // Fetch current fee structure if not available
        if (newFormData.standard && newFormData.studentCategory && (!feeDetails || feeDetails.length === 0)) {
          await fetchAllFees(newFormData.standard, newFormData.studentCategory)

          if (hostelRequired) {
            await fetchHostelFees(newFormData.standard, newFormData.studentCategory)
          }
        }

        if (busRequired && admissionData.boardingPoint && admissionData.busRouteNumber && !busFeeDetails) {
          await fetchBusFee(admissionData.boardingPoint, admissionData.busRouteNumber)
        }

      } else {
        toast.error("Failed to fetch admission data. Please try again.")
      }
    } catch (error) {
      toast.error("Failed to fetch admission data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Reset form function
  const resetForm = () => {
    setFormData({
      enquiryKey: "",
      admissionNumber: "",
      studentName: "",
      fatherName: "",
      motherName: "",
      streetVillage: "",
      placePincode: "",
      district: "",
      phoneNumber: "",
      phoneNumber2: "",
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
      studiedYear: "",
      classLastStudied: "",
      classToBeAdmitted: "",
      nameOfSchool: "",
      remarks: "",
      identificationMark1: "",
      identificationMark2: "",
      aadharNumber: "",
    })

    setErrors({})
    setPhotoPreview(defaultStudentPhoto)
    setPhotoFile(null)
    setHasExistingPhoto(false)
    setExistingPhotoUrl("")
    setIsBusRequired(false)
    setIsHostelRequired(false)
    setFeeDetails([])
    setHostelFeeDetails([])
    setBusFeeDetails(null)
    setFilteredDistricts([])
    setQRCodeData("")
    setFeeStructure({
      tuitionFees: [],
      hostelFees: [],
      busFee: null,
      totalFees: "0.00"
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    generateAdmissionNumber()

    toast.success("Form cleared successfully!")
  }

  // Initialize component with proper sequencing
  useEffect(() => {
    if (schoolId && isAuth) {
      fetchSetupData()
      fetchEnquiryNumbers()
    }
  }, [schoolId, isAuth])

  // Improved data loading sequence
  useEffect(() => {
    if (schoolId && isSetupDataLoaded) {
      if (id) {
        fetchAdmissionData(id)
      } else {
        generateAdmissionNumber()
      }
    }
  }, [schoolId, id, isSetupDataLoaded, currentAcademicYear])

  // Update QR code when essential data changes
  useEffect(() => {
    if (formData.admissionNumber && formData.studentName && formData.standard && formData.section) {
      const formattedPhoneNumbers = [formData.phoneNumber, formData.phoneNumber2]
        .filter(phone => phone && phone.trim() !== "")
        .join(", ")
      
      const formattedQRData = `STUDENT INFORMATION:
━━━━━━━━━━━━━━━━━━━━
🎓 Admission: ${formData.admissionNumber}
👤 Name: ${formData.studentName}
📚 Class: ${formData.standard} - ${formData.section}
👨‍👦 Father: ${formData.fatherName}
📞 Phone: ${formattedPhoneNumbers}
📅 Year: ${currentAcademicYear}
━━━━━━━━━━━━━━━━━━━━`

      setQRCodeData(formattedQRData)
    }
  }, [formData.admissionNumber, formData.studentName, formData.standard, formData.section, formData.fatherName, formData.phoneNumber, formData.phoneNumber2, schoolId, currentAcademicYear])

  // Handle state change - fetch districts for selected state
  const handleStateChange = async (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      district: ""
    }))

    setErrors((prev) => ({ ...prev, [name]: "", district: "" }))

    if (value) {
      await fetchDistrictsByState(value)
    } else {
      setFilteredDistricts([])
    }
  }

  // Handle bus transport toggle
  const handleBusToggle = (e) => {
    const isChecked = e.target.checked
    setIsBusRequired(isChecked)

    if (!isChecked) {
      setFormData((prev) => ({
        ...prev,
        boardingPoint: "",
        busRouteNumber: ""
      }))
      setBusFeeDetails(null)
      setFeeStructure(prev => ({
        ...prev,
        busFee: null
      }))
    }
  }

  // Handle hostel toggle
  const handleHostelToggle = async (e) => {
    const isChecked = e.target.checked
    setIsHostelRequired(isChecked)

    if (formData.standard && formData.studentCategory) {
      await fetchAllFees(formData.standard, formData.studentCategory)

      if (isChecked) {
        await fetchHostelFees(formData.standard, formData.studentCategory)
      } else {
        setHostelFeeDetails([])
        setFeeStructure(prev => ({
          ...prev,
          hostelFees: []
        }))
        setFormData((prev) => ({
          ...prev,
          lunchRefresh: ""
        }))
      }
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target

    if (name === "state") {
      handleStateChange(e)
      return
    }

    if (name === "enquiryKey" && value) {
      fetchEnquiryData(value)
    }

    if (name === "standard" && value) {
      if (formData.studentCategory) {
        fetchAllFees(value, formData.studentCategory)
        if (isHostelRequired) {
          fetchHostelFees(value, formData.studentCategory)
        }
      }
    }

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

    // Add validation for Phone Numbers - only allow 10 digits
    if (name === "phoneNumber" || name === "phoneNumber2") {
      const digitsOnly = value.replace(/\D/g, "")
      const limitedValue = digitsOnly.slice(0, 10)
      setFormData((prev) => ({
        ...prev,
        [name]: limitedValue,
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

  // Handle photo change
  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
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

  // Handle QR Code View/Download
  const handleQRClick = () => {
    if (qrCodeData) {
      const formattedPhoneNumbers = [formData.phoneNumber, formData.phoneNumber2]
        .filter(phone => phone && phone.trim() !== "")
        .join(", ")
      
      const studentData = {
        admissionNumber: formData.admissionNumber,
        studentName: formData.studentName,
        standard: formData.standard,
        section: formData.section,
        fatherName: formData.fatherName,
        phoneNumber: formattedPhoneNumbers,
        academicYear: currentAcademicYear,
        qrCode: qrCodeData
      }
      setQrStudentData(studentData)
      setShowQRModal(true)
    } else {
      toast.warning("Please fill in admission details to generate QR code")
    }
  }

  // Handle QR Code Download
  const handleDownloadQR = async (studentData) => {
    try {
      const qrSize = 300
      const textHeight = 80
      const padding = 20
      const canvasWidth = qrSize + (padding * 2)
      const canvasHeight = qrSize + textHeight + (padding * 2)

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = canvasWidth
      canvas.height = canvasHeight

      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      const qrCodeDataUrl = await QRCode.toDataURL(studentData.qrCode || "", {
        width: qrSize,
        height: qrSize,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      const qrImage = new Image()
      qrImage.onload = () => {
        ctx.drawImage(qrImage, padding, padding, qrSize, qrSize)

        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 1
        ctx.strokeRect(padding, padding, qrSize, qrSize)

        ctx.fillStyle = '#000000'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(studentData.studentName, canvasWidth / 2, qrSize + padding + 25)

        ctx.font = '14px Arial'
        ctx.fillText(`Admission: ${studentData.admissionNumber}`, canvasWidth / 2, qrSize + padding + 45)
        ctx.fillText(`Class: ${studentData.standard} - ${studentData.section}`, canvasWidth / 2, qrSize + padding + 65)

        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = `QR_${studentData.admissionNumber}_${studentData.studentName}.png`
          link.href = url
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)

          toast.success(`QR code downloaded for ${studentData.studentName}!`)
        }, 'image/png')
      }

      qrImage.src = qrCodeDataUrl

    } catch (error) {
      console.error('Error downloading QR code:', error)
      toast.error('Failed to download QR code. Please try again.')
    }
  }

  const validateForm = () => {
    const newErrors = {}
    const requiredFields = [
      "admissionNumber",
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

    // Validate at least one phone number is provided
    if (!formData.phoneNumber && !formData.phoneNumber2) {
      newErrors.phoneNumber = "At least one phone number is required"
    }

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
    const tuitionTotal = feeStructure.tuitionFees.reduce((total, fee) => total + (fee.amount || 0), 0)
    const hostelTotal = feeStructure.hostelFees.reduce((total, fee) => total + (fee.amount || 0), 0)
    const busTotal = feeStructure.busFee ? (feeStructure.busFee.amount || 0) : 0
    const overallTotal = tuitionTotal + hostelTotal + busTotal
    
    return {
      tuitionTotal: tuitionTotal.toFixed(2),
      hostelTotal: hostelTotal.toFixed(2),
      busTotal: busTotal.toFixed(2),
      overallTotal: overallTotal.toFixed(2)
    }
  }

  // Handle form submission - Includes fee structure with account heads
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!schoolId) {
      toast.error("School ID not available. Please login again.");
      return;
    }

    if (!formData.admissionNumber || formData.admissionNumber.trim() === "") {
      toast.error("Admission number is required. Please wait for it to be generated.");
      return;
    }

    if (!validateForm()) {
      toast.error("Please fill in all required fields marked in red");
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    try {
      setLoading(true);

      const formDataToSend = new FormData();

      // Calculate totals
      const totals = calculateTotalFees();

      // Prepare admission data with separate fee tables
      const admissionData = {
        enquiryKey: formData.enquiryKey || "",
        admissionNumber: formData.admissionNumber,
        studentName: formData.studentName || "",
        fatherName: formData.fatherName || "",
        motherName: formData.motherName || "",
        streetVillage: formData.streetVillage || "",
        placePincode: formData.placePincode || "",
        district: formData.district || "",
        phoneNumber: formData.phoneNumber || "",
        phoneNumber2: formData.phoneNumber2 || "",
        boardingPoint: isBusRequired ? (formData.boardingPoint || "") : "",
        busRouteNumber: isBusRequired ? (formData.busRouteNumber || "") : "",
        emailId: formData.emailId || "",
        communicationAddress: formData.communicationAddress || "",
        nationality: formData.nationality || "",
        religion: formData.religion || "",
        state: formData.state || "",
        community: formData.community || "",
        caste: formData.caste || "",
        studentType: formData.studentType || "",
        studentCategory: formData.studentCategory || "",
        standard: formData.standard || "",
        section: formData.section || "",
        gender: formData.gender || "",
        dateOfBirth: formData.dateOfBirth || "",
        emis: formData.emis || "",
        lunchRefresh: isHostelRequired ? "Hostel Required" : "",
        bloodGroup: formData.bloodGroup || "",
        dateOfAdmission: formData.dateOfAdmission || "",
        motherTongue: formData.motherTongue || "",
        fatherOccupation: formData.fatherOccupation || "",
        motherOccupation: formData.motherOccupation || "",
        examNumber: formData.examNumber || "",
        totalTuitionFee: parseFloat(totals.tuitionTotal),
        totalHostelFee: parseFloat(totals.hostelTotal),
        totalTransportFee: parseFloat(totals.busTotal),
        totalFees: parseFloat(totals.overallTotal),
        studiedYear: formData.studiedYear || "",
        classLastStudied: formData.classLastStudied || "",
        classToBeAdmitted: formData.classToBeAdmitted || "",
        nameOfSchool: formData.nameOfSchool || "",
        remarks: formData.remarks || "",
        identificationMark1: formData.identificationMark1 || "",
        identificationMark2: formData.identificationMark2 || "",
        aadharNumber: formData.aadharNumber || "",
        qrCodeData: qrCodeData || "",
        academicYear: currentAcademicYear || '2024-2025',
        schoolId: schoolId,
        // Fee details for separate tables
        tuitionFees: feeStructure.tuitionFees || [],
        hostelFees: isHostelRequired ? (feeStructure.hostelFees || []) : [],
        transportFee: isBusRequired ? (feeStructure.busFee ? {
          feeHeading: feeStructure.busFee.feeHeading,
          accountHead: feeStructure.busFee.accountHead,
          amount: feeStructure.busFee.amount,
          boardingPoint: formData.boardingPoint,
          busRouteNumber: formData.busRouteNumber
        } : null) : null
      }

      // Remove any undefined values
      Object.keys(admissionData).forEach(key => {
        if (admissionData[key] === undefined) {
          admissionData[key] = "";
        }
      });

      formDataToSend.append('admissionData', JSON.stringify(admissionData));

      if (photoFile) {
        formDataToSend.append('studentPhoto', photoFile);
      } else if (hasExistingPhoto && !id) {
        try {
          const photoFileFromUrl = await urlToFile(existingPhotoUrl, `student-photo-${formData.enquiryKey}.jpg`);
          if (photoFileFromUrl) {
            formDataToSend.append('studentPhoto', photoFileFromUrl);
          }
        } catch (error) {
          // Silently handle error
        }
      } else if (!hasExistingPhoto && id) {
        formDataToSend.append('removeExistingPhoto', 'true');
      }

      const token = getAuthToken();
      let url, method;

      if (id) {
        url = `${ENDPOINTS.admissionmaster}/admission/${id}/with-photo?schoolId=${schoolId}`;
        method = "PUT";
      } else {
        url = `${ENDPOINTS.admissionmaster}/admission/with-photo?schoolId=${schoolId}`;
        method = "POST";
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          "Authorization": `Bearer ${token}`,
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

      await response.json();

      toast.success(`Admission ${id ? 'updated' : 'submitted'} successfully!`);

      navigate("/admission/StudentDetails");

    } catch (error) {
      let errorMessage = "Failed to submit admission";

      if (error.message.includes("413")) {
        errorMessage = "File size too large. Please use a smaller photo (max 5MB).";
      } else if (error.message.includes("Failed to fetch")) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else {
        errorMessage = error.message || errorMessage;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // Calculate category totals for UI display (account heads NOT shown)
  const calculateCategoryTotalsUI = () => {
    const tuitionTotal = feeStructure.tuitionFees.reduce((total, fee) => total + (fee.amount || 0), 0)
    const hostelTotal = isHostelRequired ? feeStructure.hostelFees.reduce((total, fee) => total + (fee.amount || 0), 0) : 0
    const busTotal = isBusRequired && feeStructure.busFee ? (feeStructure.busFee.amount || 0) : 0

    return {
      tuitionTotal: tuitionTotal.toFixed(2),
      hostelTotal: hostelTotal.toFixed(2),
      busTotal: busTotal.toFixed(2),
      overallTotal: (tuitionTotal + hostelTotal + busTotal).toFixed(2)
    }
  }

  // Render fee table rows with category-wise grouping (account heads NOT shown in UI)
  const renderFeeTableRows = () => {
    const totals = calculateCategoryTotalsUI()
    const allFeeDetails = []

    // Add tuition fees section
    if (feeStructure.tuitionFees.length > 0) {
      allFeeDetails.push({
        type: "section-header",
        heading: "TUITION FEES",
        amount: "",
        isHeader: true
      })

      // Show only fee headings, not account heads
      feeStructure.tuitionFees.forEach((fee, index) => {
        allFeeDetails.push({
          type: "Tuition",
          heading: fee.feeHeading || "Tuition Fee",
          amount: parseFloat(fee.amount || 0).toFixed(2),
          isItem: true
        })
      })

      allFeeDetails.push({
        type: "section-total",
        heading: "Tuition Total",
        amount: totals.tuitionTotal,
        isTotal: true
      })

      allFeeDetails.push({
        type: "spacer",
        heading: "",
        amount: "",
        isSpacer: true
      })
    }

    // Add bus fee section if required
    if (isBusRequired && feeStructure.busFee && feeStructure.busFee.amount > 0) {
      allFeeDetails.push({
        type: "section-header",
        heading: "TRANSPORT FEES",
        amount: "",
        isHeader: true
      })

      // Only show fee heading, not account head
      const busFeeHeading = feeStructure.busFee?.feeHeading || "Transport Fee"

      allFeeDetails.push({
        type: "Transport",
        heading: busFeeHeading,
        amount: parseFloat(feeStructure.busFee.amount).toFixed(2),
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
    if ((isHostelRequired || (id && formData.lunchRefresh)) && feeStructure.hostelFees.length > 0) {
      allFeeDetails.push({
        type: "section-header",
        heading: "HOSTEL FEES",
        amount: "",
        isHeader: true
      })

      // Show only fee headings, not account heads
      feeStructure.hostelFees.forEach((fee, index) => {
        allFeeDetails.push({
          type: "Hostel",
          heading: fee.feeHeading || "Hostel Fee",
          amount: parseFloat(fee.amount || 0).toFixed(2),
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
            {(isFeeLoading || isHostelFeeLoading || isBusFeeLoading) ? "Loading fee details..." : "No fee details available. Please select Standard and Student Category."}
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
              <p className="mt-2">Loading admission form...</p>
            </div>
          </div>
        </Container>
      </MainContentPage>
    )
  }

  // Prepare student data for QR display
  const qrStudentInfo = {
    admissionNumber: formData.admissionNumber,
    studentName: formData.studentName,
    standard: formData.standard,
    section: formData.section,
    fatherName: formData.fatherName,
    phoneNumber: [formData.phoneNumber, formData.phoneNumber2]
      .filter(phone => phone && phone.trim() !== "")
      .join(", ")
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
            <Link to="/admission/StudentDetails">Student Details</Link>
            <span className="separator mx-2">&gt;</span>
            <span>{isViewMode ? "View Admission" : id ? "Edit Admission" : "Add Admission"}</span>
          </nav>
        </div>

        {/* Card Header */}
        <div className="header-container">
          <div className="d-flex align-items-center">
            <Button variant="link" className="text-white p-0 back-button me-3" onClick={handleBack}>
              <FaArrowLeft size={20} />
            </Button>
            <h2 className="mb-0">{isViewMode ? "View Admission" : id ? "Edit Admission" : "Add Admission"}</h2>
          </div>
          <div style={{ width: "20px" }}></div>
        </div>

        {/* Form Container */}
        <div className="form-container">
          <Form onSubmit={handleSubmit} className="admission-form">
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
                {/* QR Code Section */}
                <div className="text-center mb-4">
                  <h3 className="section-title">QR Code Preview</h3>
                  <BeautifulQRDisplay
                    qrData={qrCodeData}
                    studentData={qrStudentInfo}
                    size={200}
                    showInfo={true}
                  />
                  {qrCodeData && (
                    <Button
                      variant="info"
                      className="d-flex align-items-center gap-2 mx-auto mt-3"
                      onClick={handleQRClick}
                    >
                      <FaQrcode />
                      View & Download QR
                    </Button>
                  )}
                </div>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                {/* Enquiry Key Section with Clear Button */}
                <Form.Group className="mb-3">
                  <Form.Label>Enquiry Key</Form.Label>
                  <div className="position-relative">
                    <Form.Select
                      name="enquiryKey"
                      value={formData.enquiryKey || ""}
                      onChange={handleInputChange}
                      disabled={isViewMode}
                      className="form-control-blue"
                      style={{
                        paddingRight: formData.enquiryKey ? "40px" : "12px"
                      }}
                    >
                      <option value="">Select Enquiry Key</option>
                      {enquiryNumbers.map((key) => (
                        <option key={key} value={key}>
                          {key}
                        </option>
                      ))}
                    </Form.Select>
                    {formData.enquiryKey && !isViewMode && (
                      <Button
                        variant="link"
                        className="position-absolute end-0 top-50 translate-middle-y p-0 me-5"
                        onClick={resetForm}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#6c757d",
                          zIndex: 3,
                        }}
                        title="Clear form"
                      >
                        <FaTimes size={16} />
                      </Button>
                    )}
                  </div>
                  <Form.Text className="text-muted">
                    Select an enquiry key to pre-fill data from an existing enquiry
                    {formData.enquiryKey && !isViewMode && (
                      <span className="ms-1">
                        • Click the <FaTimes size={12} className="d-inline" /> to clear the form
                      </span>
                    )}
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Admission Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="admissionNumber"
                    value={formData.admissionNumber || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.admissionNumber ? "is-invalid" : ""}`}
                    placeholder="Admission number will be auto-generated"
                  />
                  {errors.admissionNumber && <div style={dateInputStyles.error}>{errors.admissionNumber}</div>}
                  <Form.Text className="text-muted">
                    {formData.admissionNumber ? `Current admission number: ${formData.admissionNumber}` : "Generating admission number..."}
                  </Form.Text>
                </Form.Group>

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
                
                {/* Phone Number 1 */}
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number 1</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`form-control-blue ${errors.phoneNumber ? "is-invalid" : ""}`}
                    placeholder="Primary phone number"
                  />
                  {errors.phoneNumber && <div style={dateInputStyles.error}>{errors.phoneNumber}</div>}
                </Form.Group>

                {/* Phone Number 2 */}
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number 2 (Optional)</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phoneNumber2"
                    value={formData.phoneNumber2 || ""}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className="form-control-blue"
                    placeholder="Secondary phone number"
                  />
                  <Form.Text className="text-muted">
                    {formData.phoneNumber && formData.phoneNumber2 
                      ? `Phone numbers will be stored separately: ${formData.phoneNumber} (Primary), ${formData.phoneNumber2} (Secondary)`
                      : "Enter a second phone number if needed"}
                  </Form.Text>
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

                {/* Hostel Details */}
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

                {/* Fee Details Table - Account heads NOT shown in UI */}
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
                        <td className="fw-bold">₹ {calculateCategoryTotalsUI().overallTotal}</td>
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
                  disabled={loading || !formData.admissionNumber}
                >
                  {loading ? "SUBMITTING..." : `SUBMIT ADMISSION - ${formData.admissionNumber || 'NO ADMISSION NUMBER'}`}
                </Button>
              )}
            </div>
          </Form>
        </div>
      </Container>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => {
          setShowQRModal(false)
          setQrStudentData(null)
        }}
        studentData={qrStudentData}
        onDownload={handleDownloadQR}
      />

      <ToastContainer />
    </MainContentPage>
  )
}

export default AdmissionForm