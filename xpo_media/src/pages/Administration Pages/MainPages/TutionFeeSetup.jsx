"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../../components/MainContent/MainContentPage"
import { Form, Button, Row, Col, Container, Table, Spinner, InputGroup, Alert } from "react-bootstrap"
import { FaEdit, FaTrash, FaTimes, FaExclamationTriangle } from "react-icons/fa"
import { ENDPOINTS } from "../../../SpringBoot/config"
import { useAuthContext } from "../../../Context/AuthContext"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "../styles/style.css"
import * as XLSX from "xlsx"

// Add Tuition Fee Modal Component
const AddTuitionFeeModal = ({ isOpen, onClose, onConfirm, courses, studentCategories, feeHeadings }) => {
  const [standardId, setStandardId] = useState("")
  const [studentCategoryId, setStudentCategoryId] = useState("")
  const [feeHeadingId, setFeeHeadingId] = useState("")
  const [feeAmount, setFeeAmount] = useState("")
  const addButtonRef = useRef(null)
  const closeButtonRef = useRef(null)
  const formRef = useRef(null)

  if (!isOpen) return null

  const handleSubmit = () => {
    // Find the selected items to get their names and details
    const selectedStandard = courses.find(course => String(course.value ?? course.id) === String(standardId))
    const selectedCategory = studentCategories.find(category => String(category.value ?? category.id) === String(studentCategoryId))
    const selectedHeading = feeHeadings.find(heading => String(heading.value ?? heading.id) === String(feeHeadingId))

    if (!standardId || !studentCategoryId || !feeHeadingId || !feeAmount) {
      toast.error("Please fill in all fields.")
      return
    }

    if (!selectedStandard || !selectedCategory || !selectedHeading) {
      toast.error("Invalid selection. Please try again.")
      return
    }

    // Backend requires accountHead, but UI doesn't show it. 
    // We extract it from the selected fee heading object.
    const accountHead = selectedHeading.account_head || selectedHeading.accountHead || "";

    if (!accountHead) {
      toast.error("Selected Fee Heading does not have an Account Head mapped. Please check Fee Heading setup.")
      return;
    }

    onConfirm(
      {
        standardId: standardId, // Kept for frontend state management if needed
        standard: selectedStandard.label ?? selectedStandard.name ?? selectedStandard.standard,
        studentCategoryId: studentCategoryId,
        studentCategory: selectedCategory.label ?? selectedCategory.name,
        feeHeadingId: feeHeadingId,
        feeHeading: selectedHeading.label ?? selectedHeading.name,
        accountHead: accountHead, // HIDDEN FIELD SENT TO BACKEND
        feeAmount,
      },
      true // Close modal after adding
    )
    setStandardId("")
    setStudentCategoryId("")
    setFeeHeadingId("")
    setFeeAmount("")
    if (formRef.current && typeof formRef.current.focus === "function") {
      formRef.current.focus()
    }
  }

  const handleClose = () => {
    onClose(true)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === "Tab") {
      if (document.activeElement === addButtonRef.current) {
        e.preventDefault()
        closeButtonRef.current.focus()
      }
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Add Tuition Fee</h2>
        <Form ref={formRef} onKeyDown={handleKeyDown}>
          <div className="modal-body">
            <Form.Group className="mb-3">
              <Form.Label className="w-100 text-start">Select Standard</Form.Label>
              <Form.Select
                value={standardId}
                onChange={(e) => setStandardId(e.target.value)}
                className="custom-input"
                autoFocus
              >
                <option value="">Select Standard</option>
                {courses.map((course) => (
                  <option key={String(course.value ?? course.id)} value={String(course.value ?? course.id)}>
                    {course.label ?? course.name ?? course.standard}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="w-100 text-start">Select Student Category</Form.Label>
              <Form.Select
                value={studentCategoryId}
                onChange={(e) => setStudentCategoryId(e.target.value)}
                className="custom-input"
              >
                <option value="">Select Student Category</option>
                {studentCategories.map((category) => (
                  <option key={String(category.value ?? category.id)} value={String(category.value ?? category.id)}>
                    {category.label ?? category.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="w-100 text-start">Select Fee Heading</Form.Label>
              <Form.Select
                value={feeHeadingId}
                onChange={(e) => setFeeHeadingId(e.target.value)}
                className="custom-input"
              >
                <option value="">Select Fee Heading</option>
                {feeHeadings.map((heading) => (
                  <option key={String(heading.value ?? heading.id)} value={String(heading.value ?? heading.id)}>
                    {heading.label ?? heading.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="w-100 text-start">Fee Amount</Form.Label>
              <Form.Control
                type="number"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                className="custom-input"
                min="0"
                step="0.01"
                placeholder="Enter fee amount"
              />
            </Form.Group>
          </div>
          <div className="modal-buttons">
            <Button ref={addButtonRef} className="modal-button confirm" onClick={handleSubmit}>
              Add Fee
            </Button>
            <Button ref={closeButtonRef} className="modal-button cancel" onClick={handleClose}>
              Close
            </Button>
          </div>
        </Form>
      </div>
    </div>
  )
}

// Edit Tuition Fee Modal Component
const EditTuitionFeeModal = ({ isOpen, onClose, onConfirm, fee, courses, studentCategories, feeHeadings }) => {
  // Logic to pre-fill IDs based on names (since backend might not return IDs anymore)
  // We try to find the ID that corresponds to the name stored in 'fee'
  const getInitialId = (list, name) => {
    if (!name) return "";
    const found = list.find(item => (item.label || item.name || item.standard) === name);
    return found ? String(found.value || found.id) : "";
  };

  const [standardId, setStandardId] = useState("");
  const [studentCategoryId, setStudentCategoryId] = useState("");
  const [feeHeadingId, setFeeHeadingId] = useState("");
  const [feeAmount, setFeeAmount] = useState("");

  useEffect(() => {
    if (fee && isOpen) {
        // If IDs are missing in fee object (due to backend change), lookup by name
        setStandardId(fee.standardId ? String(fee.standardId) : getInitialId(courses, fee.standard));
        setStudentCategoryId(fee.studentCategoryId ? String(fee.studentCategoryId) : getInitialId(studentCategories, fee.studentCategory));
        setFeeHeadingId(fee.feeHeadingId ? String(fee.feeHeadingId) : getInitialId(feeHeadings, fee.feeHeading));
        setFeeAmount(fee.feeAmount ?? "");
    }
  }, [fee, isOpen, courses, studentCategories, feeHeadings]);

  if (!isOpen) return null

  const handleSubmit = () => {
    // Find the selected items to get their names
    const selectedStandard = courses.find(course => String(course.value ?? course.id) === String(standardId))
    const selectedCategory = studentCategories.find(category => String(category.value ?? category.id) === String(studentCategoryId))
    const selectedHeading = feeHeadings.find(heading => String(heading.value ?? heading.id) === String(feeHeadingId))

    if (!standardId || !studentCategoryId || !feeHeadingId || !feeAmount) {
      toast.error("Please fill in all fields.")
      return
    }

    if (!selectedStandard || !selectedCategory || !selectedHeading) {
      toast.error("Invalid selection. Please try again.")
      return
    }

    // Extract Account Head
    const accountHead = selectedHeading.account_head || selectedHeading.accountHead || "";
    
    if (!accountHead) {
        toast.error("Selected Fee Heading does not have an Account Head mapped.");
        return;
    }

    onConfirm(fee.id, {
      standardId: standardId,
      standard: selectedStandard.label ?? selectedStandard.name ?? selectedStandard.standard,
      studentCategoryId: studentCategoryId,
      studentCategory: selectedCategory.label ?? selectedCategory.name,
      feeHeadingId: feeHeadingId,
      feeHeading: selectedHeading.label ?? selectedHeading.name,
      accountHead: accountHead, // HIDDEN FIELD
      feeAmount,
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Edit Tuition Fee</h2>
        <div className="modal-body">
          <Form.Group className="mb-3">
            <Form.Label className="w-100 text-start">Select Standard</Form.Label>
            <Form.Select
              value={standardId}
              onChange={(e) => setStandardId(e.target.value)}
              className="custom-input"
            >
              <option value="">Select Standard</option>
              {courses.map((course) => (
                <option key={String(course.value ?? course.id)} value={String(course.value ?? course.id)}>
                  {course.label ?? course.name ?? course.standard}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="w-100 text-start">Select Student Category</Form.Label>
            <Form.Select
              value={studentCategoryId}
              onChange={(e) => setStudentCategoryId(e.target.value)}
              className="custom-input"
            >
              <option value="">Select Student Category</option>
              {studentCategories.map((category) => (
                <option key={String(category.value ?? category.id)} value={String(category.value ?? category.id)}>
                  {category.label ?? category.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="w-100 text-start">Select Fee Heading</Form.Label>
            <Form.Select
              value={feeHeadingId}
              onChange={(e) => setFeeHeadingId(e.target.value)}
              className="custom-input"
            >
              <option value="">Select Fee Heading</option>
              {feeHeadings.map((heading) => (
                <option key={String(heading.value ?? heading.id)} value={String(heading.value ?? heading.id)}>
                  {heading.label ?? heading.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="w-100 text-start">Fee Amount</Form.Label>
            <Form.Control
              type="number"
              value={feeAmount}
              onChange={(e) => setFeeAmount(e.target.value)}
              className="custom-input"
              min="0"
              step="0.01"
            />
          </Form.Group>
        </div>
        <div className="modal-buttons">
          <Button className="modal-button confirm" onClick={handleSubmit}>
            Update Fee
          </Button>
          <Button className="modal-button cancel" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

// Delete Tuition Fee Modal Component
const DeleteTuitionFeeModal = ({ isOpen, onClose, onConfirm, fee }) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Delete Tuition Fee</h2>
        <div className="modal-body text-center">
          <p>Are you sure you want to delete this tuition fee entry?</p>
          <p className="fw-bold">
            {fee?.standard} - {fee?.studentCategory} - {fee?.feeHeading}
          </p>
        </div>
        <div className="modal-buttons">
          <Button className="modal-button delete" onClick={() => onConfirm(fee.id)}>
            Delete
          </Button>
          <Button className="modal-button cancel" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

// Confirm Edit Modal Component
const ConfirmEditModal = ({ isOpen, onClose, onConfirm, currentFee, updatedFee }) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Confirm Edit</h2>
        <div className="modal-body">
          <p>Are you sure you want to edit this tuition fee? This may affect related data.</p>
          <div className="mb-3">
            <h5>Old Fee Details:</h5>
            <p>Standard: {currentFee?.standard}</p>
            <p>Student Category: {currentFee?.studentCategory}</p>
            <p>Fee Heading: {currentFee?.feeHeading}</p>
            <p>Fee Amount: {currentFee?.feeAmount}</p>
          </div>
          <div>
            <h5>New Fee Details:</h5>
            <p>Standard: {updatedFee?.standard}</p>
            <p>Student Category: {updatedFee?.studentCategory}</p>
            <p>Fee Heading: {updatedFee?.feeHeading}</p>
            <p>Fee Amount: {updatedFee?.feeAmount}</p>
          </div>
        </div>
        <div className="modal-buttons">
          <Button className="modal-button confirm" onClick={onConfirm}>
            Confirm Edit
          </Button>
          <Button className="modal-button cancel" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

// Import Results Modal Component (No changes needed here)
const ImportResultsModal = ({ isOpen, onClose, results }) => {
  if (!isOpen) return null

  const { successful, duplicates, errors, skipped } = results

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <h2 className="modal-title">Import Results</h2>
        <div className="modal-body">
          {successful.length > 0 && (
            <Alert variant="success" className="mb-3">
              <strong>Successfully Imported:</strong> {successful.length} records
              <ul className="mb-0 mt-2">
                {successful.slice(0, 5).map((item, index) => (
                  <li key={index}>
                    {item.standard} - {item.studentCategory} - {item.feeHeading}: ₹{item.feeAmount}
                  </li>
                ))}
                {successful.length > 5 && <li>... and {successful.length - 5} more</li>}
              </ul>
            </Alert>
          )}

          {duplicates.length > 0 && (
            <Alert variant="warning" className="mb-3">
              <strong><FaExclamationTriangle /> Duplicates Skipped:</strong> {duplicates.length} records
              <ul className="mb-0 mt-2">
                {duplicates.slice(0, 5).map((item, index) => (
                  <li key={index}>
                    {item.standard} - {item.studentCategory} - {item.feeHeading}: ₹{item.feeAmount}
                  </li>
                ))}
                {duplicates.length > 5 && <li>... and {duplicates.length - 5} more</li>}
              </ul>
            </Alert>
          )}

          {errors.length > 0 && (
            <Alert variant="danger" className="mb-3">
              <strong><FaExclamationTriangle /> Errors:</strong> {errors.length} records
              <ul className="mb-0 mt-2">
                {errors.slice(0, 5).map((item, index) => (
                  <li key={index}>
                    Row {item.row}: {item.error}
                  </li>
                ))}
                {errors.length > 5 && <li>... and {errors.length - 5} more</li>}
              </ul>
            </Alert>
          )}

          {skipped.length > 0 && (
            <Alert variant="info" className="mb-3">
              <strong>Skipped (Invalid Data):</strong> {skipped.length} records
              <ul className="mb-0 mt-2">
                {skipped.slice(0, 5).map((item, index) => (
                  <li key={index}>
                    Row {item.row}: Missing required fields
                  </li>
                ))}
                {skipped.length > 5 && <li>... and {skipped.length - 5} more</li>}
              </ul>
            </Alert>
          )}
        </div>
        <div className="modal-buttons">
          <Button className="modal-button confirm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

// Custom sorting function
const sortStandards = (a, b) => {
  const getStandardValue = (standard) => {
    if (!standard) return { numeric: Infinity, text: standard }
    const standardStr = String(standard);
    if (standardStr.match(/^(LKG|UKG)$/i)) {
      return { numeric: -1, text: standardStr.toUpperCase() }
    }
    const numericMatch = standardStr.match(/^(\d+)/)
    if (numericMatch) {
      return { 
        numeric: parseInt(numericMatch[1]), 
        text: standardStr.replace(numericMatch[1], '').trim()
      }
    }
    return { numeric: Infinity, text: standardStr }
  }

  const aValue = getStandardValue(a.standard || a.name || a.label)
  const bValue = getStandardValue(b.standard || b.name || b.label)

  if (aValue.numeric !== bValue.numeric) {
    return aValue.numeric - bValue.numeric
  }
  return aValue.text.localeCompare(bValue.text)
}

const TutionFeeSetup = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isConfirmEditModalOpen, setIsConfirmEditModalOpen] = useState(false)
  const [isImportResultsModalOpen, setIsImportResultsModalOpen] = useState(false)
  const [selectedFee, setSelectedFee] = useState(null)
  const [updatedFee, setUpdatedFee] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [feeHeadings, setFeeHeadings] = useState([])
  const [courses, setCourses] = useState([])
  const [studentCategories, setStudentCategories] = useState([])
  const [tuitionFees, setTuitionFees] = useState([])
  const [gradeTotals, setGradeTotals] = useState({})
  const [gradeCategoryTotals, setGradeCategoryTotals] = useState({})
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedStudentCategory, setSelectedStudentCategory] = useState("")
  const [importResults, setImportResults] = useState({
    successful: [],
    duplicates: [],
    errors: [],
    skipped: []
  })
  const [isLoading, setIsLoading] = useState({
    courses: false,
    studentCategories: false,
    feeHeadings: false,
    tuitionFees: false,
    gradeTotals: false,
    gradeCategoryTotals: false,
    import: false,
  })

  const { user, currentAcademicYear, schoolId } = useAuthContext()
  const token = useMemo(() => sessionStorage.getItem("token") || sessionStorage.getItem("adminToken"), [])

  const apiCall = async (url, method = "GET", body = null) => {
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      }

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
      })

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorText = await response.text()
          if (errorText) {
            errorMessage = errorText
          }
        } catch (textError) {
          // Ignore
        }
        throw new Error(errorMessage)
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      } else {
        const responseText = await response.text()
        return responseText ? responseText : { success: true }
      }
    } catch (error) {
      throw error
    }
  }

  useEffect(() => {
    const resetState = () => {
      setFeeHeadings([])
      setCourses([])
      setStudentCategories([])
      setTuitionFees([])
      setGradeTotals({})
      setGradeCategoryTotals({})
      setSearchTerm("")
      setSelectedCourse("")
      setSelectedStudentCategory("")
      setSelectedFee(null)
      setUpdatedFee(null)
      setIsAddModalOpen(false)
      setIsEditModalOpen(false)
      setIsDeleteModalOpen(false)
      setIsConfirmEditModalOpen(false)
      setIsLoading({
        courses: false,
        studentCategories: false,
        feeHeadings: false,
        tuitionFees: false,
        gradeTotals: false,
        gradeCategoryTotals: false,
        import: false,
      })
    }

    resetState()

    const checkAuthAndFetchData = async () => {
      if (schoolId && currentAcademicYear) {
        try {
          await Promise.all([
            fetchCourses(),
            fetchStudentCategories(),
            fetchFeeHeadings(),
            fetchTuitionFees(),
          ])
        } catch (error) {
          toast.error("An error occurred while loading data.")
        }
      } else if (!currentAcademicYear) {
        toast.error("Please select an academic year to view and manage tuition fees.", {
          autoClose: 3000,
        })
      } else {
        toast.error("Please log in to view and manage tuition fees.", {
          autoClose: 3000,
        })
      }
    }

    checkAuthAndFetchData()

    return () => resetState()
  }, [schoolId, currentAcademicYear])

  const fetchCourses = async () => {
    if (!schoolId || !currentAcademicYear) return
    setIsLoading((prev) => ({ ...prev, courses: true }))
    try {
      const url = `${ENDPOINTS.administration}/tutionfeesetup/courses?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      const coursesData = await apiCall(url)
      const sortedCourses = [...coursesData].sort(sortStandards)
      setCourses(sortedCourses)
    } catch (error) {
      toast.error("Failed to fetch courses. Please try again.")
      setCourses([])
    } finally {
      setIsLoading((prev) => ({ ...prev, courses: false }))
    }
  }

  const fetchStudentCategories = async () => {
    if (!schoolId || !currentAcademicYear) return
    setIsLoading((prev) => ({ ...prev, studentCategories: true }))
    try {
      const url = `${ENDPOINTS.administration}/tutionfeesetup/student-categories?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      const categoriesData = await apiCall(url)
      const sortedCategories = [...categoriesData].sort((a, b) => 
        (a.label || a.name).localeCompare(b.label || b.name)
      )
      setStudentCategories(sortedCategories)
    } catch (error) {
      toast.error("Failed to fetch student categories. Please try again.")
      setStudentCategories([])
    } finally {
      setIsLoading((prev) => ({ ...prev, studentCategories: false }))
    }
  }

  const fetchFeeHeadings = async () => {
    if (!schoolId || !currentAcademicYear) return
    setIsLoading((prev) => ({ ...prev, feeHeadings: true }))
    try {
      const url = `${ENDPOINTS.administration}/tutionfeesetup/fee-headings?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      const feeHeadingsData = await apiCall(url)
      // Sort fee headings alphabetically
      const sortedFeeHeadings = [...feeHeadingsData].sort((a, b) => 
        (a.label || a.name).localeCompare(b.label || b.name)
      )
      setFeeHeadings(sortedFeeHeadings)
    } catch (error) {
      toast.error("Failed to fetch fee headings. Please try again.")
      setFeeHeadings([])
    } finally {
      setIsLoading((prev) => ({ ...prev, feeHeadings: false }))
    }
  }

  const fetchTuitionFees = async () => {
    if (!schoolId || !currentAcademicYear) return
    setIsLoading((prev) => ({ ...prev, tuitionFees: true }))
    try {
      const url = `${ENDPOINTS.administration}/tutionfeesetup/fees?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      const feesData = await apiCall(url)
      setTuitionFees(feesData)
      await Promise.all([updateGradeTotals(feesData), updateGradeCategoryTotals(feesData)])
    } catch (error) {
      toast.error("Failed to fetch tuition fees. Please try again.")
      setTuitionFees([])
    } finally {
      setIsLoading((prev) => ({ ...prev, tuitionFees: false }))
    }
  }

  const updateGradeTotals = async (fees) => {
    if (!schoolId || !currentAcademicYear) return
    try {
      const totals = {}
      fees.forEach((fee) => {
        // Fallback to name if ID is missing (backend change)
        const key = fee.standardId || fee.standard;
        if (!totals[key]) {
          totals[key] = 0
        }
        totals[key] += Number(fee.feeAmount || 0)
      })
      setGradeTotals(totals)
    } catch (error) {
      toast.error("Failed to update grade totals. Please try again.")
    }
  }

  const updateGradeCategoryTotals = async (fees) => {
    if (!schoolId || !currentAcademicYear) return
    try {
      const totals = {}
      fees.forEach((fee) => {
        // Fallback to name if ID is missing
        const sKey = fee.standardId || fee.standard;
        const cKey = fee.studentCategoryId || fee.studentCategory;
        const key = `${sKey}_${cKey}`
        if (!totals[key]) {
          totals[key] = 0
        }
        totals[key] += Number(fee.feeAmount || 0)
      })
      setGradeCategoryTotals(totals)
    } catch (error) {
      toast.error("Failed to update grade-category totals. Please try again.")
    }
  }

  const handleAddFee = async (newFee, shouldClose) => {
    if (!schoolId || !currentAcademicYear) {
      toast.error("School not identified or no academic year selected. Please try again.")
      return
    }

    // Validation logic (names must be present)
    if (!newFee.standard || !newFee.studentCategory || !newFee.feeHeading || !newFee.accountHead) {
       // Note: standardId/etc might not be used by backend, but we validate names
      toast.error("Please select all required dropdown fields.")
      return
    }

    if (!newFee.feeAmount || newFee.feeAmount.toString().trim() === "") {
      toast.error("Please enter a fee amount.")
      return
    }

    const feeAmount = parseFloat(newFee.feeAmount)
    if (isNaN(feeAmount) || feeAmount <= 0) {
      toast.error("Fee amount must be a positive number greater than 0.")
      return
    }

    // Duplicate check on client side using NAMES now
    const isDuplicate = tuitionFees.some(
      (fee) =>
        String(fee.standard) === String(newFee.standard) &&
        String(fee.studentCategory) === String(newFee.studentCategory) &&
        String(fee.feeHeading) === String(newFee.feeHeading)
    )

    if (isDuplicate) {
      toast.error("A fee with the same standard, student category, and fee heading already exists.")
      return
    }

    setIsLoading((prev) => ({ ...prev, tuitionFees: true }))
    try {
      const url = `${ENDPOINTS.administration}/tutionfeesetup/fees?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      const response = await apiCall(url, "POST", newFee)

      setTuitionFees((prevFees) => {
        const updatedFees = [...prevFees, { id: response.id, ...newFee }]
        Promise.all([updateGradeTotals(updatedFees), updateGradeCategoryTotals(updatedFees)])
        return updatedFees
      })

      if (shouldClose) {
        setIsAddModalOpen(false)
      }

      toast.success("Tuition fee added successfully!", {
        style: { background: "#0B3D7B", color: "white" },
      })
    } catch (error) {
      toast.error(`Failed to add tuition fee: ${error.message}`)
    } finally {
      setIsLoading((prev) => ({ ...prev, tuitionFees: false }))
    }
  }

  const handleEditFee = async (id, updatedFeeData) => {
    if (!schoolId || !currentAcademicYear) {
      toast.error("School not identified or no academic year selected. Please try again.")
      return
    }

    // Validation
    if (!updatedFeeData.standard || !updatedFeeData.studentCategory || !updatedFeeData.feeHeading || !updatedFeeData.accountHead) {
      toast.error("Please select all required dropdown fields.")
      return
    }

    if (!updatedFeeData.feeAmount || updatedFeeData.feeAmount.toString().trim() === "") {
      toast.error("Please enter a fee amount.")
      return
    }

    const feeAmount = parseFloat(updatedFeeData.feeAmount)
    if (isNaN(feeAmount) || feeAmount <= 0) {
      toast.error("Fee amount must be a positive number greater than 0.")
      return
    }

    const isDuplicate = tuitionFees.some(
      (fee) =>
        fee.id !== id &&
        String(fee.standard) === String(updatedFeeData.standard) &&
        String(fee.studentCategory) === String(updatedFeeData.studentCategory) &&
        String(fee.feeHeading) === String(updatedFeeData.feeHeading),
    )

    if (isDuplicate) {
      toast.error("A fee with the same standard, student category, and fee heading already exists.")
      return
    }

    setIsEditModalOpen(false)
    setIsConfirmEditModalOpen(true)
    setUpdatedFee(updatedFeeData)
  }

  const confirmEditFee = async () => {
    if (!schoolId || !currentAcademicYear) {
      toast.error("School not identified or no academic year selected. Please try again.")
      return
    }

    setIsLoading((prev) => ({ ...prev, tuitionFees: true }))
    try {
      const url = `${ENDPOINTS.administration}/tutionfeesetup/fees/${selectedFee.id}?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      await apiCall(url, "PUT", updatedFee)

      setTuitionFees((prevFees) => {
        const updatedFees = prevFees.map((fee) => (fee.id === selectedFee.id ? { ...fee, ...updatedFee } : fee))
        Promise.all([updateGradeTotals(updatedFees), updateGradeCategoryTotals(updatedFees)])
        return updatedFees
      })

      setIsConfirmEditModalOpen(false)
      setSelectedFee(null)
      setUpdatedFee(null)
      toast.success("Tuition fee updated successfully!", {
        style: { background: "#0B3D7B", color: "white" },
      })
    } catch (error) {
      toast.error(`Failed to update tuition fee: ${error.message}`)
    } finally {
      setIsLoading((prev) => ({ ...prev, tuitionFees: false }))
    }
  }

  const handleDeleteFee = async (id) => {
    if (!schoolId || !currentAcademicYear) {
      toast.error("School not identified or no academic year selected. Please try again.")
      return
    }

    setIsLoading((prev) => ({ ...prev, tuitionFees: true }))
    try {
      const url = `${ENDPOINTS.administration}/tutionfeesetup/fees/${id}?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
      await apiCall(url, "DELETE")

      setTuitionFees((prevFees) => {
        const updatedFees = prevFees.filter((fee) => fee.id !== id)
        Promise.all([updateGradeTotals(updatedFees), updateGradeCategoryTotals(updatedFees)])
        return updatedFees
      })

      setIsDeleteModalOpen(false)
      setSelectedFee(null)
      toast.success("Tuition fee deleted successfully!")
    } catch (error) {
      toast.error(`Failed to delete tuition fee: ${error.message}`)
    } finally {
      setIsLoading((prev) => ({ ...prev, tuitionFees: false }))
    }
  }

  const findIdByName = (array, name, type) => {
    const item = array.find(item => 
      item.label === name || item.name === name
    )
    if (!item) {
      return null
    }
    return item.value || item.id
  }

  const validateRowData = (row, rowIndex) => {
    const errors = []
    if (!row["Standard"]?.toString().trim()) errors.push("Standard is required")
    if (!row["Student Category"]?.toString().trim()) errors.push("Student Category is required")
    if (!row["Fee Heading"]?.toString().trim()) errors.push("Fee Heading is required")
    if (!row["Fee Amount"]) errors.push("Fee Amount is required")
    else {
      const feeAmount = parseFloat(row["Fee Amount"])
      if (isNaN(feeAmount) || feeAmount <= 0) errors.push("Fee Amount must be a positive number")
    }
    return errors
  }

  const handleImport = async (event) => {
    if (!schoolId || !currentAcademicYear) {
      toast.error("School not identified or no academic year selected. Please try again.")
      return
    }

    const file = event.target.files[0]
    if (!file) return

    const validExtensions = ['.xlsx', '.xls']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    if (!validExtensions.includes(fileExtension)) {
      toast.error("Please select a valid Excel file (.xlsx or .xls)")
      event.target.value = ""
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      event.target.value = ""
      return
    }

    setIsLoading((prev) => ({ ...prev, import: true }))
    
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        
        if (!sheetName) throw new Error("No sheets found in the Excel file")
        
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(sheet)

        if (jsonData.length === 0) {
          toast.error("No data found in the imported file.")
          return
        }

        const requiredColumns = ["Standard", "Student Category", "Fee Heading", "Fee Amount"]
        const firstRow = jsonData[0]
        const missingColumns = requiredColumns.filter(col => !(col in firstRow))
        
        if (missingColumns.length > 0) {
          toast.error(`Missing required columns: ${missingColumns.join(", ")}`)
          return
        }

        const results = {
          successful: [],
          duplicates: [],
          errors: [],
          skipped: []
        }

        const validRows = jsonData
          .map((row, index) => {
            const rowErrors = validateRowData(row, index + 2)
            if (rowErrors.length > 0) {
              results.skipped.push({ row: index + 2, data: row, reason: rowErrors.join(", ") })
              return null
            }
            return {
              row: index + 2,
              standard: row["Standard"].toString().trim(),
              studentCategory: row["Student Category"].toString().trim(),
              feeHeading: row["Fee Heading"].toString().trim(),
              feeAmount: parseFloat(row["Fee Amount"])
            }
          })
          .filter(item => item !== null)

        const uniqueRows = []
        const duplicateRows = []

        validRows.forEach(item => {
          const isDuplicateInImport = uniqueRows.some(uniqueItem =>
            uniqueItem.standard.toLowerCase() === item.standard.toLowerCase() &&
            uniqueItem.studentCategory.toLowerCase() === item.studentCategory.toLowerCase() &&
            uniqueItem.feeHeading.toLowerCase() === item.feeHeading.toLowerCase()
          )
          if (isDuplicateInImport) duplicateRows.push(item)
          else uniqueRows.push(item)
        })

        results.duplicates.push(...duplicateRows)

        for (const item of uniqueRows) {
          try {
            // Lookup Names and Account Head
            // Note: Backend has removed ID requirements, so strictly speaking we can send names.
            // But we do need to find the Account Head from Fee Headings list.
            
            // 1. Validate Standard exists in dropdown
            const foundCourse = courses.find(c => (c.label || c.name || c.standard) === item.standard);
            if (!foundCourse) {
               results.errors.push({ row: item.row, error: `Standard not found: "${item.standard}"` })
               continue
            }

            // 2. Validate Student Category exists
            const foundCat = studentCategories.find(c => (c.label || c.name) === item.studentCategory);
            if (!foundCat) {
               results.errors.push({ row: item.row, error: `Student Category not found: "${item.studentCategory}"` })
               continue
            }

            // 3. Validate Fee Heading and Get Account Head
            const foundHeading = feeHeadings.find(h => (h.label || h.name) === item.feeHeading);
            if (!foundHeading) {
               results.errors.push({ row: item.row, error: `Fee Heading not found: "${item.feeHeading}"` })
               continue
            }
            
            // Extract Account Head
            const accountHead = foundHeading.account_head || foundHeading.accountHead;
            if(!accountHead) {
               results.errors.push({ row: item.row, error: `Account Head not found for fee heading: "${item.feeHeading}"` })
               continue
            }

            // Check for duplicates in existing data (frontend check)
            const isDuplicateFrontend = tuitionFees.some(
              fee =>
                String(fee.standard) === String(item.standard) &&
                String(fee.studentCategory) === String(item.studentCategory) &&
                String(fee.feeHeading) === String(item.feeHeading)
            )

            if (isDuplicateFrontend) {
              results.duplicates.push({ ...item, reason: "Duplicate entry already exists in system" })
              continue
            }

            const newFee = {
              standardId: foundCourse.value || foundCourse.id,
              standard: item.standard,
              studentCategoryId: foundCat.value || foundCat.id,
              studentCategory: item.studentCategory,
              feeHeadingId: foundHeading.value || foundHeading.id,
              feeHeading: item.feeHeading,
              accountHead: accountHead, // HIDDEN FIELD
              feeAmount: item.feeAmount,
            }

            const url = `${ENDPOINTS.administration}/tutionfeesetup/fees?schoolId=${schoolId}&academicYear=${currentAcademicYear}`
            
            try {
              const response = await apiCall(url, "POST", newFee)
              if (response && response.id) {
                results.successful.push({ ...newFee, id: response.id })
                setTuitionFees((prevFees) => {
                  const updatedFees = [...prevFees, { id: response.id, ...newFee }]
                  Promise.all([updateGradeTotals(updatedFees), updateGradeCategoryTotals(updatedFees)])
                  return updatedFees
                })
              } else {
                results.errors.push({ row: item.row, error: "Server returned invalid response" })
              }
            } catch (error) {
              if (error.message.includes("exists") || error.message.includes("duplicate")) {
                results.duplicates.push({ ...item, reason: "Duplicate entry detected by server" })
              } else {
                results.errors.push({ row: item.row, error: `Server error: ${error.message}` })
              }
            }
          } catch (error) {
            results.errors.push({ row: item.row, error: `Processing error: ${error.message}` })
          }
        }

        setImportResults(results)
        setIsImportResultsModalOpen(true)

        if (results.successful.length > 0) toast.success(`Successfully imported ${results.successful.length} tuition fees!`)
        if (results.duplicates.length > 0) toast.warning(`${results.duplicates.length} duplicate entries skipped`)
        if (results.errors.length > 0) toast.error(`${results.errors.length} entries had errors`)

      } catch (error) {
        toast.error(`Failed to process import file: ${error.message}`)
      } finally {
        setIsLoading((prev) => ({ ...prev, import: false }))
        event.target.value = ""
      }
    }

    reader.onerror = () => {
      toast.error("Failed to read the file. Please try again.")
      setIsLoading((prev) => ({ ...prev, import: false }))
      event.target.value = ""
    }

    try {
      reader.readAsArrayBuffer(file)
    } catch (error) {
      toast.error("Failed to read the file. Please try again.")
      setIsLoading((prev) => ({ ...prev, import: false }))
      event.target.value = ""
    }
  }

  const handleExport = () => {
    if (!schoolId || !currentAcademicYear) {
      toast.error("School not identified or no academic year selected. Please try again.")
      return
    }

    if (filteredFees.length === 0) {
      toast.error("No data available to export.")
      return
    }

    try {
      // 1. Group the data (To maintain the specific Standard -> Category sort order)
      const groupedData = filteredFees.reduce((acc, fee) => {
        const standardKey = fee.standardId || fee.standard
        const categoryKey = fee.studentCategoryId || fee.studentCategory
        
        if (!acc[standardKey]) {
          acc[standardKey] = {
            standard: fee.standard,
            categories: {},
          }
        }
        if (!acc[standardKey].categories[categoryKey]) {
          acc[standardKey].categories[categoryKey] = {
            studentCategory: fee.studentCategory,
            fees: [],
          }
        }
        acc[standardKey].categories[categoryKey].fees.push(fee)
        return acc
      }, {})

      const sortedGroups = Object.values(groupedData).sort(sortStandards)

      // 2. Build rows structure for Excel (Clean Data Only)
      const exportRows = []

      sortedGroups.forEach(group => {
        // Sort categories alphabetically
        const sortedCategories = Object.values(group.categories).sort((a, b) => 
          a.studentCategory.localeCompare(b.studentCategory)
        )

        sortedCategories.forEach(cat => {
          // Sort fees by Heading for cleaner look
          cat.fees.sort((a, b) => a.feeHeading.localeCompare(b.feeHeading))

          // Add individual fees ONLY
          cat.fees.forEach(fee => {
            exportRows.push({
              "Standard": fee.standard,
              "Student Category": fee.studentCategory,
              "Fee Heading": fee.feeHeading,
              "Fee Amount": Number(fee.feeAmount)
            })
          })
        })
      })

      const worksheet = XLSX.utils.json_to_sheet(exportRows)

      // --- ADDED: Set Column Widths ---
      // 'wch' stands for "width characters" (approximate number of characters)
      const columnWidths = [
        { wch: 20 }, // Column A: Standard
        { wch: 30 }, // Column B: Student Category
        { wch: 40 }, // Column C: Fee Heading
        { wch: 15 }, // Column D: Fee Amount
      ];
      worksheet['!cols'] = columnWidths;
      // --------------------------------

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "TuitionFees")
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      const fileName = `TuitionFees_${schoolId}_${currentAcademicYear}_${timestamp}.xlsx`
      
      XLSX.writeFile(workbook, fileName)
      
      toast.success("Tuition fees exported successfully!", {
        style: { background: "#0B3D7B", color: "white" },
      })
    } catch (error) {
      console.error(error)
      toast.error("Failed to export tuition fees. Please try again.")
    }
  }

  const openEditModal = (fee) => {
    setSelectedFee(fee)
    setIsEditModalOpen(true)
  }

  const openDeleteModal = (fee) => {
    setSelectedFee(fee)
    setIsDeleteModalOpen(true)
  }

  const clearSearch = () => setSearchTerm("")
  const clearCourseFilter = () => setSelectedCourse("")
  const clearStudentCategoryFilter = () => setSelectedStudentCategory("")

  const filteredFees = tuitionFees
    .filter(
      (fee) =>
        (selectedCourse === "" || String(fee.standardId || fee.standard) === String(selectedCourse)) &&
        (selectedStudentCategory === "" || String(fee.studentCategoryId || fee.studentCategory) === String(selectedStudentCategory)) &&
        (fee.feeHeading.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fee.standard.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fee.studentCategory.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    .sort(sortStandards)

  const calculateTotalFee = () => {
    return filteredFees.reduce((total, fee) => total + Number(fee.feeAmount || 0), 0).toFixed(2)
  }

  const groupedFees = filteredFees.reduce((acc, fee) => {
    // Grouping by name since ID might be absent
    const standardKey = fee.standardId || fee.standard
    const categoryKey = fee.studentCategoryId || fee.studentCategory
    
    if (!acc[standardKey]) {
      acc[standardKey] = {
        standard: fee.standard,
        categories: {},
        total: 0,
      }
    }
    if (!acc[standardKey].categories[categoryKey]) {
      acc[standardKey].categories[categoryKey] = {
        studentCategory: fee.studentCategory,
        fees: [],
        total: 0,
      }
    }
    acc[standardKey].categories[categoryKey].fees.push(fee)
    acc[standardKey].categories[categoryKey].total += Number(fee.feeAmount || 0)
    acc[standardKey].total += Number(fee.feeAmount || 0)
    return acc
  }, {})

  const sortedStandards = Object.values(groupedFees).sort(sortStandards)

  const isAnyLoading = Object.values(isLoading).some((loading) => loading)

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <Row>
          <Col xs={12}>
            <div className="tuition-fee-setup-container">
              <nav className="custom-breadcrumb py-1 py-lg-3">
                <Link to="/home">Home</Link>
                <span className="separator">&gt;</span>
                <span>Administration</span>
                <span className="separator">&gt;</span>
                <span className="current col-12">Tuition Fee Setup</span>
              </nav>

              <div className="form-card mt-3">
                <div className="header p-3 d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="m-0 d-none d-lg-block">Tuition Fee Setup</h2>
                    <h6 className="m-0 d-lg-none">Tuition Fee Setup</h6>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleImport}
                      style={{ display: "none" }}
                      id="import-file"
                      disabled={!currentAcademicYear || isAnyLoading}
                    />
                    <Button
                      onClick={() => document.getElementById("import-file").click()}
                      className="btn btn-primary text-light"
                      disabled={!currentAcademicYear || isAnyLoading}
                    >
                      {isLoading.import ? <Spinner size="sm" animation="border" /> : "Import"}
                    </Button>
                    <Button
                      onClick={handleExport}
                      className="btn btn-primary text-light"
                      disabled={!currentAcademicYear || tuitionFees.length === 0 || isAnyLoading}
                    >
                      Export
                    </Button>
                    <Button
                      onClick={() => setIsAddModalOpen(true)}
                      className="btn btn-primary text-light"
                      disabled={!currentAcademicYear || isAnyLoading}
                    >
                      + Add Tuition Fee
                    </Button>
                  </div>
                </div>

                <div className="content-wrapper p-4">
                  {!currentAcademicYear ? (
                    <div className="alert alert-warning">Please select an academic year to manage tuition fees.</div>
                  ) : (
                    <>
                      <Row className="mb-3">
                        <Col xs={12} md={6} lg={3}>
                          <Form.Group>
                            <Form.Label>Select Course</Form.Label>
                            <InputGroup>
                              <Form.Select
                                value={selectedCourse}
                                onChange={(e) => setSelectedCourse(e.target.value)}
                                disabled={isAnyLoading}
                              >
                                <option value="">All Courses</option>
                                {courses.map((course) => (
                                  <option key={String(course.value ?? course.id)} value={String(course.value ?? course.id)}>
                                    {course.label ?? course.name ?? course.standard}
                                  </option>
                                ))}
                              </Form.Select>
                              {selectedCourse && (
                                <Button variant="outline-secondary" onClick={clearCourseFilter} disabled={isAnyLoading}>
                                  <FaTimes />
                                </Button>
                              )}
                            </InputGroup>
                          </Form.Group>
                        </Col>
                        <Col xs={12} md={6} lg={3}>
                          <Form.Group>
                            <Form.Label>Select Student Category</Form.Label>
                            <InputGroup>
                              <Form.Select
                                value={selectedStudentCategory}
                                onChange={(e) => setSelectedStudentCategory(e.target.value)}
                                disabled={isAnyLoading}
                              >
                                <option value="">All Categories</option>
                                {studentCategories.map((category) => (
                                  <option key={String(category.value ?? category.id)} value={String(category.value ?? category.id)}>
                                    {category.label ?? category.name}
                                  </option>
                                ))}
                              </Form.Select>
                              {selectedStudentCategory && (
                                <Button variant="outline-secondary" onClick={clearStudentCategoryFilter} disabled={isAnyLoading}>
                                  <FaTimes />
                                </Button>
                              )}
                            </InputGroup>
                          </Form.Group>
                        </Col>
                        <Col xs={12} md={12} lg={6}>
                          <Form.Group>
                            <Form.Label>Search</Form.Label>
                            <InputGroup>
                              <Form.Control
                                type="text"
                                placeholder="Search by Standard, Category, or Fee Heading"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                disabled={isAnyLoading}
                              />
                              {searchTerm && (
                                <Button variant="outline-secondary" onClick={clearSearch} disabled={isAnyLoading}>
                                  <FaTimes />
                                </Button>
                              )}
                            </InputGroup>
                          </Form.Group>
                        </Col>
                      </Row>

                      {isAnyLoading && (
                        <div className="text-center my-4">
                          <Spinner animation="border" role="status" variant="primary" className="loader">
                            <span className="visually-hidden">Loading...</span>
                          </Spinner>
                          <p className="mt-2">Loading data...</p>
                        </div>
                      )}

                      {!isAnyLoading && (
                        <div className="table-responsive">
                          <Table bordered hover style={{ tableLayout: 'fixed', width: '100%' }}>
                            <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                              <tr>
                                <th style={{ width: '20%' }}>Standard</th>
                                <th style={{ width: '20%' }}>Student Category</th>
                                <th style={{ width: '25%' }}>Fee Heading</th>
                                <th style={{ width: '20%' }}>Fee Amount</th>
                                <th style={{ width: '15%' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedStandards.length === 0 ? (
                                <tr>
                                  <td colSpan="5" className="text-center">No data available</td>
                                </tr>
                              ) : (
                                sortedStandards.flatMap((group, groupIndex) => [
                                  ...Object.values(group.categories)
                                    .sort((a, b) => a.studentCategory.localeCompare(b.studentCategory))
                                    .flatMap((category, categoryIndex) => [
                                      ...category.fees.map((fee, feeIndex) => (
                                        <tr key={`fee-${fee.id}-${feeIndex}`}>
                                          <td>{fee.standard}</td>
                                          <td>{fee.studentCategory}</td>
                                          <td>{fee.feeHeading}</td>
                                          <td>{fee.feeAmount}</td>
                                          <td>
                                            <Button
                                              variant="link"
                                              className="action-button edit-button me-2"
                                              onClick={() => openEditModal(fee)}
                                              disabled={isLoading.tuitionFees}
                                            >
                                              <FaEdit />
                                            </Button>
                                            <Button
                                              variant="link"
                                              className="action-button delete-button"
                                              onClick={() => openDeleteModal(fee)}
                                              disabled={isLoading.tuitionFees}
                                            >
                                              <FaTrash />
                                            </Button>
                                          </td>
                                        </tr>
                                      )),
                                      <tr key={`category-total-${groupIndex}-${categoryIndex}`} style={{ backgroundColor: "#e9ecef", fontWeight: "bold" }}>
                                        <td>{group.standard} ({category.studentCategory} Total)</td>
                                        <td colSpan="2"></td>
                                        <td>{category.total.toFixed(2)}</td>
                                        <td></td>
                                      </tr>
                                    ]),
                                  <tr key={`standard-total-${groupIndex}`} style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                                    <td>Overall {group.standard} Total</td>
                                    <td colSpan="2"></td>
                                    <td>{group.total.toFixed(2)}</td>
                                    <td></td>
                                  </tr>
                                ])
                              )}
                            </tbody>
                            {filteredFees.length > 0 && (
                              <tfoot>
                                <tr>
                                  <td colSpan="3" className="text-end fw-bold">Overall Total Fee:</td>
                                  <td colSpan="2" className="fw-bold">{calculateTotalFee()}</td>
                                </tr>
                              </tfoot>
                            )}
                          </Table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      <AddTuitionFeeModal
        isOpen={isAddModalOpen}
        onClose={(shouldClose) => { if (shouldClose) setIsAddModalOpen(false) }}
        onConfirm={handleAddFee}
        courses={courses}
        studentCategories={studentCategories}
        feeHeadings={feeHeadings}
      />
      <EditTuitionFeeModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedFee(null) }}
        onConfirm={handleEditFee}
        fee={selectedFee}
        courses={courses}
        studentCategories={studentCategories}
        feeHeadings={feeHeadings}
      />
      <DeleteTuitionFeeModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setSelectedFee(null) }}
        onConfirm={handleDeleteFee}
        fee={selectedFee}
      />
      <ConfirmEditModal
        isOpen={isConfirmEditModalOpen}
        onClose={() => { setIsConfirmEditModalOpen(false); setSelectedFee(null); setUpdatedFee(null) }}
        onConfirm={confirmEditFee}
        currentFee={selectedFee}
        updatedFee={updatedFee}
      />
      <ImportResultsModal
        isOpen={isImportResultsModalOpen}
        onClose={() => setIsImportResultsModalOpen(false)}
        results={importResults}
      />

      <ToastContainer />
    </MainContentPage>
  )
}

export default TutionFeeSetup