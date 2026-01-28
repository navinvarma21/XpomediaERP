"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Link } from "react-router-dom"
import MainContentPage from "../../../components/MainContent/MainContentPage"
import { Form, Button, Row, Col, Container, Table, Spinner, InputGroup, Alert } from "react-bootstrap"
import { FaEdit, FaTrash, FaTimes, FaExclamationTriangle } from "react-icons/fa"
import { useAuthContext } from "../../../Context/AuthContext"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import * as XLSX from "xlsx"
import "../styles/style.css"
import { ENDPOINTS } from "../../../SpringBoot/config"

// Add Hostel Fee Modal Component
const AddHostelFeeModal = ({ isOpen, onClose, onConfirm, courses, studentCategories, feeHeadings, isLoading }) => {
  const [standardId, setStandardId] = useState("")
  const [studentCategoryId, setStudentCategoryId] = useState("")
  const [feeHeadingId, setFeeHeadingId] = useState("")
  const [feeAmount, setFeeAmount] = useState("")

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setStandardId("")
      setStudentCategoryId("")
      setFeeHeadingId("")
      setFeeAmount("")
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!standardId || !studentCategoryId || !feeHeadingId || !feeAmount) {
      toast.error("Please fill in all fields.")
      return
    }

    if (parseFloat(feeAmount) <= 0) {
      toast.error("Fee amount must be greater than 0.")
      return
    }

    // Find the selected items with proper property access
    const selectedStandard = courses.find(course => course.id == standardId || course.standard == standardId)
    const selectedCategory = studentCategories.find(category => category.id == studentCategoryId || category.student_category_name == studentCategoryId)
    const selectedHeading = feeHeadings.find(heading => heading.id == feeHeadingId || heading.fee_head == feeHeadingId)

    onConfirm({
      standardId: standardId,
      standard: selectedStandard?.name || selectedStandard?.standard || "",
      studentCategoryId: studentCategoryId,
      studentCategory: selectedCategory?.name || selectedCategory?.student_category_name || "",
      feeHeadingId: feeHeadingId,
      feeHeading: selectedHeading?.name || selectedHeading?.fee_head || "",
      // Capture account_head here from the dropdown selection
      accountHead: selectedHeading?.account_head || "", 
      feeAmount: parseFloat(feeAmount),
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Add Hostel Fee</h2>
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
                <option key={course.id || course.standard} value={course.id || course.standard}>
                  {course.name || course.standard}
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
                <option key={category.id || category.student_category_name} value={category.id || category.student_category_name}>
                  {category.name || category.student_category_name}
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
                <option key={heading.id || heading.fee_head} value={heading.id || heading.fee_head}>
                  {heading.name || heading.fee_head}
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
          <Button className="modal-button confirm" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Spinner size="sm" animation="border" /> : "Add Fee"}
          </Button>
          <Button className="modal-button cancel" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

// Edit Hostel Fee Modal Component
const EditHostelFeeModal = ({ isOpen, onClose, onConfirm, fee, courses, studentCategories, feeHeadings, isLoading }) => {
  const [standardId, setStandardId] = useState("")
  const [studentCategoryId, setStudentCategoryId] = useState("")
  const [feeHeadingId, setFeeHeadingId] = useState("")
  const [feeAmount, setFeeAmount] = useState("")

  useEffect(() => {
    if (fee && isOpen) {
      // Find IDs based on names if IDs are missing (since backend doesn't store IDs anymore)
      const foundStandard = courses.find(c => c.name === fee.standard || c.standard === fee.standard);
      const foundCategory = studentCategories.find(c => c.name === fee.studentCategory || c.student_category_name === fee.studentCategory);
      const foundHeading = feeHeadings.find(h => h.name === fee.feeHeading || h.fee_head === fee.feeHeading);

      setStandardId(foundStandard?.id || foundStandard?.standard || "")
      setStudentCategoryId(foundCategory?.id || foundCategory?.student_category_name || "")
      setFeeHeadingId(foundHeading?.id || foundHeading?.fee_head || "")
      setFeeAmount(fee.feeAmount?.toString() || "")
    }
  }, [fee, isOpen, courses, studentCategories, feeHeadings])

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!standardId || !studentCategoryId || !feeHeadingId || !feeAmount) {
      toast.error("Please fill in all fields.")
      return
    }

    if (parseFloat(feeAmount) <= 0) {
      toast.error("Fee amount must be greater than 0.")
      return
    }

    const selectedStandard = courses.find(course => course.id == standardId || course.standard == standardId)
    const selectedCategory = studentCategories.find(category => category.id == studentCategoryId || category.student_category_name == studentCategoryId)
    const selectedHeading = feeHeadings.find(heading => heading.id == feeHeadingId || heading.fee_head == feeHeadingId)

    onConfirm(fee.id, {
      standardId: standardId, // Kept for local logic
      standard: selectedStandard?.name || selectedStandard?.standard || "",
      studentCategoryId: studentCategoryId, // Kept for local logic
      studentCategory: selectedCategory?.name || selectedCategory?.student_category_name || "",
      feeHeadingId: feeHeadingId, // Kept for local logic
      feeHeading: selectedHeading?.name || selectedHeading?.fee_head || "",
      // Account head not strictly needed for update (since only amount updates), but good to have
      accountHead: selectedHeading?.account_head || "",
      feeAmount: parseFloat(feeAmount),
      academicYear: fee.academicYear
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Edit Hostel Fee</h2>
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
                <option key={course.id || course.standard} value={course.id || course.standard}>
                  {course.name || course.standard}
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
                <option key={category.id || category.student_category_name} value={category.id || category.student_category_name}>
                  {category.name || category.student_category_name}
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
                <option key={heading.id || heading.fee_head} value={heading.id || heading.fee_head}>
                  {heading.name || heading.fee_head}
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
          <Button className="modal-button confirm" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Spinner size="sm" animation="border" /> : "Update Fee"}
          </Button>
          <Button className="modal-button cancel" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

// Delete Hostel Fee Modal Component
const DeleteHostelFeeModal = ({ isOpen, onClose, onConfirm, fee, isLoading }) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Delete Hostel Fee</h2>
        <div className="modal-body text-center">
          <p>Are you sure you want to delete this hostel fee entry?</p>
          <p className="fw-bold">
            {fee?.standard} - {fee?.studentCategory} - {fee?.feeHeading}
          </p>
        </div>
        <div className="modal-buttons">
          <Button className="modal-button delete" onClick={() => onConfirm(fee.id)} disabled={isLoading}>
            {isLoading ? <Spinner size="sm" animation="border" /> : "Delete"}
          </Button>
          <Button className="modal-button cancel" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

// Confirm Edit Modal Component
const ConfirmEditModal = ({ isOpen, onClose, onConfirm, currentFee, updatedFee, isLoading }) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Confirm Edit</h2>
        <div className="modal-body">
          <p>Are you sure you want to edit this hostel fee?</p>
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
          <Button className="modal-button confirm" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? <Spinner size="sm" animation="border" /> : "Confirm Edit"}
          </Button>
          <Button className="modal-button cancel" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

// Import Results Modal Component
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
                    {item.row}: {item.error}
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

const HostelFeeSetup = () => {
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
  const [hostelFees, setHostelFees] = useState([])
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
    hostelFees: false,
    add: false,
    edit: false,
    delete: false,
    import: false,
  })
  const { user, currentAcademicYear, getAuthHeaders } = useAuthContext()

  // Build base URLs
  const HOSTEL_FEE_BASE_URL = `${ENDPOINTS.administration}/hostelfee`

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    if (!user?.uid || !currentAcademicYear) return

    try {
      setIsLoading(prev => ({ ...prev, courses: true, studentCategories: true, feeHeadings: true, hostelFees: true }))

      const [coursesRes, categoriesRes, feeHeadsRes, feesRes] = await Promise.all([
        fetch(`${HOSTEL_FEE_BASE_URL}/courses/${user.uid}/${currentAcademicYear}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${HOSTEL_FEE_BASE_URL}/studentCategories/${user.uid}/${currentAcademicYear}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${HOSTEL_FEE_BASE_URL}/feeHeadings/${user.uid}/${currentAcademicYear}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${HOSTEL_FEE_BASE_URL}/hostelFees/${user.uid}/${currentAcademicYear}`, {
          headers: getAuthHeaders()
        })
      ])

      if (!coursesRes.ok) throw new Error("Failed to fetch courses")
      if (!categoriesRes.ok) throw new Error("Failed to fetch student categories")
      if (!feeHeadsRes.ok) throw new Error("Failed to fetch fee headings")
      if (!feesRes.ok) throw new Error("Failed to fetch hostel fees")

      const [coursesData, categoriesData, feeHeadsData, feesData] = await Promise.all([
        coursesRes.json(),
        categoriesRes.json(),
        feeHeadsRes.json(),
        feesRes.json()
      ])

      setCourses(coursesData || [])
      setStudentCategories(categoriesData || [])
      setFeeHeadings(feeHeadsData || [])
      setHostelFees(feesData || [])

    } catch (error) {
      console.error("Fetch error:", error)
      toast.error("Failed to fetch data. Please try again.")
    } finally {
      setIsLoading(prev => ({ 
        ...prev, 
        courses: false, 
        studentCategories: false, 
        feeHeadings: false, 
        hostelFees: false 
      }))
    }
  }, [user?.uid, currentAcademicYear, getAuthHeaders, HOSTEL_FEE_BASE_URL])

  // Initialize data on mount
  useEffect(() => {
    if (user?.uid && currentAcademicYear) {
      fetchAllData()
    }
  }, [user?.uid, currentAcademicYear, fetchAllData])

  // Clear search
  const clearSearch = () => {
    setSearchTerm("")
  }

  // Clear course filter
  const clearCourse = () => {
    setSelectedCourse("")
  }

  // Clear student category filter
  const clearStudentCategory = () => {
    setSelectedStudentCategory("")
  }

  // Add fee head with optimistic update
  const handleAddFee = useCallback(
    async (newFee) => {
      if (!user?.uid || !currentAcademicYear) {
        toast.error("User not logged in or no academic year selected.")
        return
      }

      // Validate form data
      if (!newFee.standard || !newFee.studentCategory || !newFee.feeHeading || !newFee.feeAmount) {
        toast.error("Please fill in all fields.")
        return
      }

      if (newFee.feeAmount <= 0) {
        toast.error("Fee amount must be greater than 0.")
        return
      }

      // Check for duplicate entry - Using names now since backend uses names for uniqueness
      const isDuplicate = hostelFees.some(
        (fee) =>
          fee.standard === newFee.standard &&
          fee.studentCategory === newFee.studentCategory &&
          fee.feeHeading === newFee.feeHeading
      )

      if (isDuplicate) {
        toast.error("A fee with the same standard, student category, and fee heading already exists.")
        return
      }

      setIsLoading(prev => ({ ...prev, add: true }))
      const tempId = `temp_${Date.now()}`
      
      // Local state object (needs IDs if possible to keep selection logic working)
      const newFeeLocal = { 
        id: tempId, 
        ...newFee,
        schoolId: user.uid,
        academicYear: currentAcademicYear
      }
      
      try {
        // Optimistic update
        setHostelFees((prev) => [...prev, newFeeLocal])

        // Backend Payload: Strictly match DTO (No IDs)
        const apiPayload = {
            standard: newFee.standard,
            studentCategory: newFee.studentCategory,
            feeHeading: newFee.feeHeading,
            accountHead: newFee.accountHead,
            feeAmount: newFee.feeAmount,
            academicYear: currentAcademicYear
        }

        const response = await fetch(`${HOSTEL_FEE_BASE_URL}/add?schoolId=${user.uid}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders()
          },
          body: JSON.stringify(apiPayload)
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || "Failed to add hostel fee")
        }

        const createdFee = await response.json()

        // Replace temp ID with actual ID from backend
        setHostelFees((prev) => 
          prev.map((fee) => 
            fee.id === tempId ? { ...createdFee, standardId: newFee.standardId, studentCategoryId: newFee.studentCategoryId, feeHeadingId: newFee.feeHeadingId } : fee
          )
        )
        
        setIsAddModalOpen(false)
        toast.success("Hostel fee added successfully!")
      } catch (error) {
        console.error("Add fee error:", error)
        toast.error(error.message || "Failed to add hostel fee. Please try again.")
        // Rollback optimistic update
        setHostelFees((prev) => prev.filter((fee) => fee.id !== tempId))
      } finally {
        setIsLoading(prev => ({ ...prev, add: false }))
      }
    },
    [user?.uid, currentAcademicYear, hostelFees, getAuthHeaders, HOSTEL_FEE_BASE_URL],
  )

  // Edit fee head with optimistic update
  const handleEditFee = useCallback(
    async (id, updatedFeeData) => {
      if (!user?.uid || !currentAcademicYear) {
        toast.error("User not logged in or no academic year selected.")
        return
      }

      // Validate form data
      if (!updatedFeeData.standard || !updatedFeeData.studentCategory || !updatedFeeData.feeHeading || !updatedFeeData.feeAmount) {
        toast.error("Please fill in all fields.")
        return
      }

      if (updatedFeeData.feeAmount <= 0) {
        toast.error("Fee amount must be greater than 0.")
        return
      }

      // Check for duplicate entry (excluding the current fee being edited)
      // This is crucial now that we allow editing all fields
      const isDuplicate = hostelFees.some(
        (fee) =>
          fee.id !== id &&
          fee.standard === updatedFeeData.standard &&
          fee.studentCategory === updatedFeeData.studentCategory &&
          fee.feeHeading === updatedFeeData.feeHeading
      )

      if (isDuplicate) {
        toast.error("A fee with the same standard, student category, and fee heading already exists.")
        return
      }

      setIsEditModalOpen(false)
      setIsConfirmEditModalOpen(true)
      setUpdatedFee(updatedFeeData)
    },
    [user?.uid, currentAcademicYear, hostelFees],
  )

  const confirmEditFee = useCallback(async () => {
    if (!user?.uid || !currentAcademicYear) {
      toast.error("User not logged in or no academic year selected.")
      return
    }

    setIsLoading(prev => ({ ...prev, edit: true }))
    const originalFee = hostelFees.find((fee) => fee.id === selectedFee.id)
    
    try {
      // Optimistic update
      setHostelFees((prev) =>
        prev.map((fee) => (fee.id === selectedFee.id ? { ...fee, ...updatedFee } : fee))
      )

      // Payload for update (All fields updated)
      const apiPayload = {
          standard: updatedFee.standard,
          studentCategory: updatedFee.studentCategory,
          feeHeading: updatedFee.feeHeading,
          accountHead: updatedFee.accountHead,
          feeAmount: updatedFee.feeAmount,
          academicYear: currentAcademicYear
      }

      const response = await fetch(`${HOSTEL_FEE_BASE_URL}/update/${selectedFee.id}?schoolId=${user.uid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(apiPayload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to update hostel fee")
      }

      const updatedFeeFromServer = await response.json()

      // Update with server response (preserve IDs if they exist locally)
      setHostelFees((prev) =>
        prev.map((fee) => (fee.id === selectedFee.id ? { ...fee, ...updatedFeeFromServer } : fee))
      )

      setIsConfirmEditModalOpen(false)
      setSelectedFee(null)
      setUpdatedFee(null)
      toast.success("Hostel fee updated successfully!")
    } catch (error) {
      console.error("Edit fee error:", error)
      toast.error(error.message || "Failed to update hostel fee. Please try again.")
      // Rollback optimistic update
      setHostelFees((prev) =>
        prev.map((fee) => (fee.id === selectedFee.id ? { ...fee, ...originalFee } : fee))
      )
    } finally {
      setIsLoading(prev => ({ ...prev, edit: false }))
    }
  }, [user?.uid, currentAcademicYear, hostelFees, selectedFee, updatedFee, getAuthHeaders, HOSTEL_FEE_BASE_URL])

  // Delete fee head with optimistic update
  const handleDeleteFee = useCallback(
    async (id) => {
      if (!user?.uid || !currentAcademicYear) {
        toast.error("User not logged in or no academic year selected.")
        return
      }

      setIsLoading(prev => ({ ...prev, delete: true }))
      const deletedFee = hostelFees.find((fee) => fee.id === id)
      
      try {
        // Optimistic update
        setHostelFees((prev) => prev.filter((fee) => fee.id !== id))

        const response = await fetch(`${HOSTEL_FEE_BASE_URL}/delete/${id}?schoolId=${user.uid}&academicYear=${currentAcademicYear}`, {
          method: "DELETE",
          headers: getAuthHeaders()
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || "Failed to delete hostel fee")
        }

        setIsDeleteModalOpen(false)
        setSelectedFee(null)
        toast.success("Hostel fee deleted successfully!")
      } catch (error) {
        console.error("Delete fee error:", error)
        toast.error(error.message || "Failed to delete hostel fee. Please try again.")
        // Rollback optimistic update
        setHostelFees((prev) => [...prev, deletedFee])
      } finally {
        setIsLoading(prev => ({ ...prev, delete: false }))
      }
    },
    [user?.uid, currentAcademicYear, hostelFees, getAuthHeaders, HOSTEL_FEE_BASE_URL],
  )

  // Validate Excel row data
  const validateRowData = (row, rowIndex) => {
    const errors = []

    if (!row["Standard"]?.toString().trim()) {
      errors.push("Standard is required")
    }
    if (!row["Student Category"]?.toString().trim()) {
      errors.push("Student Category is required")
    }
    if (!row["Fee Heading"]?.toString().trim()) {
      errors.push("Fee Heading is required")
    }
    if (!row["Fee Amount"]) {
      errors.push("Fee Amount is required")
    } else {
      const feeAmount = parseFloat(row["Fee Amount"])
      if (isNaN(feeAmount) || feeAmount <= 0) {
        errors.push("Fee Amount must be a positive number")
      }
    }

    return errors
  }

  // Import fee heads with comprehensive error handling
  const handleImport = useCallback(
    async (event) => {
      if (!user?.uid || !currentAcademicYear) {
        toast.error("User not logged in or no academic year selected.")
        return
      }

      const file = event.target.files[0]
      if (!file) return

      // Validate file type
      const validExtensions = ['.xlsx', '.xls']
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      if (!validExtensions.includes(fileExtension)) {
        toast.error("Please select a valid Excel file (.xlsx or .xls)")
        event.target.value = ""
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB")
        event.target.value = ""
        return
      }

      setIsLoading(prev => ({ ...prev, import: true }))
      
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: "array" })
          const sheetName = workbook.SheetNames[0]
          
          if (!sheetName) {
            throw new Error("No sheets found in the Excel file")
          }
          
          const sheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(sheet)

          if (jsonData.length === 0) {
            toast.error("No data found in the imported file.")
            return
          }

          // Validate required columns
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

          // Process data with validation
          const validRows = jsonData
            .map((row, index) => {
              const rowErrors = validateRowData(row, index + 2) // +2 for header row and 1-based index
              
              if (rowErrors.length > 0) {
                results.skipped.push({
                  row: index + 2,
                  data: row,
                  reason: rowErrors.join(", ")
                })
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

          // Check for duplicates in import data
          const uniqueRows = []
          const duplicateRows = []

          validRows.forEach(item => {
            const isDuplicateInImport = uniqueRows.some(uniqueItem =>
              uniqueItem.standard.toLowerCase() === item.standard.toLowerCase() &&
              uniqueItem.studentCategory.toLowerCase() === item.studentCategory.toLowerCase() &&
              uniqueItem.feeHeading.toLowerCase() === item.feeHeading.toLowerCase()
            )

            if (isDuplicateInImport) {
              duplicateRows.push(item)
            } else {
              uniqueRows.push(item)
            }
          })

          results.duplicates.push(...duplicateRows)

          // Process unique rows
          for (const item of uniqueRows) {
            try {
              // Find matching entities
              const standard = courses.find((c) => 
                (c.name?.toLowerCase() === item.standard.toLowerCase()) || 
                (c.standard?.toLowerCase() === item.standard.toLowerCase())
              )
              const studentCategory = studentCategories.find((c) => 
                (c.name?.toLowerCase() === item.studentCategory.toLowerCase()) || 
                (c.student_category_name?.toLowerCase() === item.studentCategory.toLowerCase())
              )
              const feeHeading = feeHeadings.find((h) => 
                (h.name?.toLowerCase() === item.feeHeading.toLowerCase()) || 
                (h.fee_head?.toLowerCase() === item.feeHeading.toLowerCase())
              )

              if (!standard) {
                results.errors.push({
                  row: item.row,
                  error: `Standard not found: ${item.standard}`
                })
                continue
              }
              if (!studentCategory) {
                results.errors.push({
                  row: item.row,
                  error: `Student Category not found: ${item.studentCategory}`
                })
                continue
              }
              if (!feeHeading) {
                results.errors.push({
                  row: item.row,
                  error: `Fee Heading not found: ${item.feeHeading}`
                })
                continue
              }

              // Check for duplicates in existing data (Match by Names now)
              const isDuplicate = hostelFees.some(
                fee =>
                  (fee.standard?.toLowerCase() === item.standard.toLowerCase()) &&
                  (fee.studentCategory?.toLowerCase() === item.studentCategory.toLowerCase()) &&
                  (fee.feeHeading?.toLowerCase() === item.feeHeading.toLowerCase())
              )

              if (isDuplicate) {
                results.duplicates.push({
                  ...item,
                  reason: "Duplicate entry already exists in system"
                })
                continue
              }

              // Create API Payload - Match backend DTO structure
              const apiPayload = {
                standard: standard.name || standard.standard,
                studentCategory: studentCategory.name || studentCategory.student_category_name,
                feeHeading: feeHeading.name || feeHeading.fee_head,
                // Automatically fetch account head from the found heading object
                accountHead: feeHeading.account_head || "", 
                feeAmount: item.feeAmount,
                academicYear: currentAcademicYear
              }

              const response = await fetch(`${HOSTEL_FEE_BASE_URL}/add?schoolId=${user.uid}`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...getAuthHeaders()
                },
                body: JSON.stringify(apiPayload)
              })

              if (response.ok) {
                const createdFee = await response.json()
                results.successful.push(createdFee)
              } else {
                const errorText = await response.text()
                results.errors.push({
                  row: item.row,
                  error: `Server error: ${errorText || "Unknown error"}`
                })
              }
            } catch (error) {
              console.error(`Error processing row ${item.row}:`, error)
              results.errors.push({
                row: item.row,
                error: `Processing error: ${error.message}`
              })
            }
          }

          setImportResults(results)
          setIsImportResultsModalOpen(true)

          // Refresh the list if any successful imports
          if (results.successful.length > 0) {
            await fetchAllData()
          }

          // Show summary toast
          const successCount = results.successful.length
          const duplicateCount = results.duplicates.length
          const errorCount = results.errors.length
          const skippedCount = results.skipped.length

          if (successCount > 0) {
            toast.success(`Successfully imported ${successCount} hostel fees!`)
          }
          if (duplicateCount > 0) {
            toast.warning(`${duplicateCount} duplicate entries skipped`)
          }
          if (errorCount > 0) {
            toast.error(`${errorCount} entries had errors`)
          }
          if (skippedCount > 0) {
            toast.info(`${skippedCount} rows skipped due to invalid data`)
          }

        } catch (error) {
          console.error("Import processing error:", error)
          toast.error(`Failed to process import file: ${error.message}`)
        } finally {
          setIsLoading(prev => ({ ...prev, import: false }))
          // Reset file input
          event.target.value = ""
        }
      }

      reader.onerror = () => {
        toast.error("Failed to read the file. Please try again.")
        setIsLoading(prev => ({ ...prev, import: false }))
        event.target.value = ""
      }

      try {
        reader.readAsArrayBuffer(file)
      } catch (error) {
        toast.error("Failed to read the file. Please try again.")
        setIsLoading(prev => ({ ...prev, import: false }))
        event.target.value = ""
      }
    },
    [user?.uid, currentAcademicYear, courses, studentCategories, feeHeadings, hostelFees, getAuthHeaders, fetchAllData, HOSTEL_FEE_BASE_URL],
  )

  // Export fee heads
  const handleExport = useCallback(() => {
    if (!user?.uid || !currentAcademicYear) {
      toast.error("User not logged in or no academic year selected.")
      return
    }

    if (hostelFees.length === 0) {
      toast.error("No data available to export.")
      return
    }

    try {
      const exportData = hostelFees.map((fee) => ({
        "Standard": fee.standard,
        "Student Category": fee.studentCategory,
        "Fee Heading": fee.feeHeading,
        "Fee Amount": fee.feeAmount,
      }))
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "HostelFees")
      XLSX.writeFile(workbook, `HostelFees_Export_${user.uid}_${currentAcademicYear}.xlsx`)
      toast.success("Hostel fees exported successfully!")
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export data. Please try again.")
    }
  }, [user?.uid, currentAcademicYear, hostelFees])

  const openEditModal = useCallback((fee) => {
    setSelectedFee(fee)
    setIsEditModalOpen(true)
  }, [])

  const openDeleteModal = useCallback((fee) => {
    setSelectedFee(fee)
    setIsDeleteModalOpen(true)
  }, [])

  // Custom sorting function for standards
  const sortStandards = (a, b) => {
    const order = ["LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"]
    const aIndex = order.indexOf(a.standard)
    const bIndex = order.indexOf(b.standard)

    if (aIndex === -1 && bIndex === -1) return a.standard.localeCompare(b.standard)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  }

  const filteredFees = useMemo(() => {
    return hostelFees
      .filter(
        (fee) =>
          (selectedCourse === "" || fee.standard === selectedCourse || fee.standardId == selectedCourse) &&
          (selectedStudentCategory === "" || fee.studentCategory === selectedStudentCategory || fee.studentCategoryId == selectedStudentCategory) &&
          (fee.feeHeading?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            fee.standard?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            fee.studentCategory?.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      .sort(sortStandards)
  }, [hostelFees, selectedCourse, selectedStudentCategory, searchTerm])

  // Group fees by standard and student category for displaying totals
  const groupedFees = useMemo(() => {
    return filteredFees.reduce((acc, fee) => {
      // Use name as key since IDs might not be present in all cases now
      const standardKey = fee.standard 
      const categoryKey = fee.studentCategory 
      
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
  }, [filteredFees])

  // Sort standards and categories for display
  const sortedStandards = useMemo(() => {
    return Object.values(groupedFees).sort(sortStandards)
  }, [groupedFees])

  const calculateTotalFee = () => {
    return filteredFees.reduce((total, fee) => total + Number(fee.feeAmount || 0), 0).toFixed(2)
  }

  // Check if any data is loading
  const isAnyLoading = Object.values(isLoading).some((loading) => loading)

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <Row>
          <Col xs={12}>
            <div className="hostel-fee-setup-container">
              {/* Breadcrumb Navigation */}
              <nav className="custom-breadcrumb py-1 py-lg-3">
                <Link to="/home">Home</Link>
                <span className="separator">&gt;</span>
                <span>Administration</span>
                <span className="separator">&gt;</span>
                <span className="current col-12">Hostel Fee Setup</span>
              </nav>

              <div className="form-card mt-3">
                {/* Header */}
                <div className="header p-3 d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="m-0 d-none d-lg-block">Hostel Fee Setup</h2>
                    <h6 className="m-0 d-lg-none">Hostel Fee Setup</h6>
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
                      disabled={!currentAcademicYear || hostelFees.length === 0 || isAnyLoading}
                    >
                      Export
                    </Button>
                    <Button
                      onClick={() => setIsAddModalOpen(true)}
                      className="btn btn-primary text-light"
                      disabled={!currentAcademicYear || isAnyLoading}
                    >
                      + Add Hostel Fee
                    </Button>
                  </div>
                </div>

                <div className="content-wrapper p-4">
                  {!currentAcademicYear ? (
                    <div className="alert alert-warning">Please select an academic year to manage hostel fees.</div>
                  ) : (
                    <>
                      <Row className="mb-3">
                        {/* Select Course with Clear Button */}
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
                                  <option key={course.id || course.standard} value={course.id || course.standard}>
                                    {course.name || course.standard}
                                  </option>
                                ))}
                              </Form.Select>
                              {selectedCourse && (
                                <Button
                                  variant="outline-secondary"
                                  onClick={clearCourse}
                                  disabled={isAnyLoading}
                                >
                                  <FaTimes />
                                </Button>
                              )}
                            </InputGroup>
                          </Form.Group>
                        </Col>

                        {/* Select Student Category with Clear Button */}
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
                                  <option key={category.id || category.student_category_name} value={category.id || category.student_category_name}>
                                    {category.name || category.student_category_name}
                                  </option>
                                ))}
                              </Form.Select>
                              {selectedStudentCategory && (
                                <Button
                                  variant="outline-secondary"
                                  onClick={clearStudentCategory}
                                  disabled={isAnyLoading}
                                >
                                  <FaTimes />
                                </Button>
                              )}
                            </InputGroup>
                          </Form.Group>
                        </Col>

                        {/* Search with Clear Button */}
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
                                <Button
                                  variant="outline-secondary"
                                  onClick={clearSearch}
                                  disabled={isAnyLoading}
                                >
                                  <FaTimes />
                                </Button>
                              )}
                            </InputGroup>
                          </Form.Group>
                        </Col>
                      </Row>

                      {/* Loading Indicator */}
                      {isAnyLoading && (
                        <div className="text-center my-4">
                          <Spinner animation="border" role="status" variant="primary" className="loader">
                            <span className="visually-hidden">Loading...</span>
                          </Spinner>
                          <p className="mt-2">Loading data...</p>
                        </div>
                      )}

                      {/* Hostel Fees Table with Grouped Display */}
                      {!isAnyLoading && (
                        <div className="table-responsive">
                          <Table bordered hover>
                            <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                              <tr>
                                <th>Standard</th>
                                <th>Student Category</th>
                                <th>Fee Heading</th>
                                <th>Fee Amount</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedStandards.length === 0 ? (
                                <tr>
                                  <td colSpan="5" className="text-center">
                                    No data available
                                  </td>
                                </tr>
                              ) : (
                                sortedStandards.map((group, groupIndex) => (
                                  <React.Fragment key={`group-${groupIndex}-${group.standard}`}>
                                    {Object.values(group.categories)
                                      .sort((a, b) => a.studentCategory.localeCompare(b.studentCategory))
                                      .map((category, categoryIndex) => (
                                        <React.Fragment key={`category-${groupIndex}-${categoryIndex}-${category.studentCategory}`}>
                                          {category.fees.map((fee) => (
                                            <tr key={fee.id}>
                                              <td>{fee.standard}</td>
                                              <td>{fee.studentCategory}</td>
                                              <td>{fee.feeHeading}</td>
                                              <td>{fee.feeAmount}</td>
                                              <td>
                                                <Button
                                                  variant="link"
                                                  className="action-button edit-button me-2"
                                                  onClick={() => openEditModal(fee)}
                                                  disabled={isLoading.edit || isLoading.delete}
                                                >
                                                  <FaEdit />
                                                </Button>
                                                <Button
                                                  variant="link"
                                                  className="action-button delete-button"
                                                  onClick={() => openDeleteModal(fee)}
                                                  disabled={isLoading.edit || isLoading.delete}
                                                >
                                                  <FaTrash />
                                                </Button>
                                              </td>
                                            </tr>
                                          ))}
                                          {/* Category Total Row */}
                                          <tr key={`category-total-${groupIndex}-${categoryIndex}`} style={{ backgroundColor: "#e9ecef", fontWeight: "bold" }}>
                                            <td>{group.standard} ({category.studentCategory} Total)</td>
                                            <td colSpan="2"></td>
                                            <td>{category.total.toFixed(2)}</td>
                                            <td></td>
                                          </tr>
                                        </React.Fragment>
                                      ))}
                                    {/* Standard Total Row */}
                                    <tr key={`standard-total-${groupIndex}`} style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                                      <td>Overall {group.standard} Total</td>
                                      <td colSpan="2"></td>
                                      <td>{group.total.toFixed(2)}</td>
                                      <td></td>
                                    </tr>
                                  </React.Fragment>
                                ))
                              )}
                            </tbody>
                            {filteredFees.length > 0 && (
                              <tfoot>
                                <tr>
                                  <td colSpan="3" className="text-end fw-bold">
                                    Overall Total Fee:
                                  </td>
                                  <td colSpan="2" className="fw-bold">
                                    {calculateTotalFee()}
                                  </td>
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

      {/* Modals */}
      <AddHostelFeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={handleAddFee}
        courses={courses}
        studentCategories={studentCategories}
        feeHeadings={feeHeadings}
        isLoading={isLoading.add}
      />
      <EditHostelFeeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedFee(null)
        }}
        onConfirm={handleEditFee}
        fee={selectedFee}
        courses={courses}
        studentCategories={studentCategories}
        feeHeadings={feeHeadings}
        isLoading={isLoading.edit}
      />
      <DeleteHostelFeeModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedFee(null)
        }}
        onConfirm={handleDeleteFee}
        fee={selectedFee}
        isLoading={isLoading.delete}
      />
      <ConfirmEditModal
        isOpen={isConfirmEditModalOpen}
        onClose={() => {
          setIsConfirmEditModalOpen(false)
          setSelectedFee(null)
          setUpdatedFee(null)
        }}
        onConfirm={confirmEditFee}
        currentFee={selectedFee}
        updatedFee={updatedFee}
        isLoading={isLoading.edit}
      />
      <ImportResultsModal
        isOpen={isImportResultsModalOpen}
        onClose={() => setIsImportResultsModalOpen(false)}
        results={importResults}
      />

      {/* Toastify Container */}
      <ToastContainer />
    </MainContentPage>
  )
}

export default HostelFeeSetup