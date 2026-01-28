("use client")

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import DOMPurify from "dompurify" // REQUIRED: For XSS prevention
import { ENDPOINTS } from "../SpringBoot/config"

// --- SECURITY CONSTANTS ---
const MAX_INPUT_LENGTH = 150; // Prevent DoS via massive strings

const STORAGE_KEYS = {
  TEACHER_TOKEN: "teacherToken",
  TEACHER_DATA: "teacherData",
  STUDENT_TOKEN: "studentToken",
  STUDENT_DATA: "studentData",
  SCHOOL_CODE: "schoolCode",
  SCHOOL_NAME: "schoolName",
  SCHOOL_ID: "schoolId",
  ACADEMIC_YEAR: "activeAcademicYear",
  ACTIVE_TERM_NAME: "activeTermName",
  ACTIVE_SECTION_NAME: "activeSectionName",
  LAST_ACTIVITY: "lastActivity"
}

// Auto logout configuration
const AUTO_LOGOUT_CONFIG = {
  TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
  CHECK_INTERVAL: 60 * 1000, // Check every minute
}

const UserContext = createContext()

// --- SECURITY UTILITIES ---

/**
 * 1. Input Sanitization & Truncation
 * Prevents XSS and Buffer Overflow/DoS attacks
 */
const secureString = (input) => {
  if (typeof input !== 'string') return input;
  // Truncate to prevent DoS
  const truncated = input.length > MAX_INPUT_LENGTH ? input.substring(0, MAX_INPUT_LENGTH) : input;
  // Sanitize HTML/Scripts
  return DOMPurify.sanitize(truncated.trim());
};

/**
 * 2. Object Sanitization (Recursive)
 * Used when restoring JSON objects from storage to prevent stored XSS or Prototype Pollution
 */
const securePayload = (data) => {
  if (typeof data === 'string') return secureString(data);
  if (typeof data === 'object' && data !== null) {
    // Prevent Prototype Pollution
    if (data.constructor && data.constructor.name !== 'Object' && data.constructor.name !== 'Array') return data;
    
    if (Array.isArray(data)) {
      return data.map(item => securePayload(item));
    }
    
    const sanitized = {};
    for (const key in data) {
      // Prevent pollution keys
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      sanitized[key] = securePayload(data[key]);
    }
    return sanitized;
  }
  return data;
};

export const UserProvider = ({ children }) => {
  const [teacher, setTeacher] = useState(null)
  const [student, setStudent] = useState(null)
  const [school, setSchool] = useState(null)
  const [loading, setLoading] = useState(true)

  // --- ACADEMIC STATE ---
  // Initialize from storage if available (names only) - SECURED READ
  const [currentAcademicYear, setCurrentAcademicYear] = useState(
    () => secureString(sessionStorage.getItem(STORAGE_KEYS.ACADEMIC_YEAR)) || null
  )
  const [activeTermName, setActiveTermName] = useState(
    () => secureString(sessionStorage.getItem(STORAGE_KEYS.ACTIVE_TERM_NAME)) || null
  )
  const [activeSectionName, setActiveSectionName] = useState(
    () => secureString(sessionStorage.getItem(STORAGE_KEYS.ACTIVE_SECTION_NAME)) || null
  )

  // IDs are MEMORY ONLY (initially null, fetched via API)
  const [activeTermId, setActiveTermId] = useState(null) 
  const [activeSectionId, setActiveSectionId] = useState(null) 
   
  const navigate = useNavigate()
  const location = useLocation()

  // Fetch active academic year, term, and section
  const fetchActiveAcademicInfo = useCallback(async (schoolId) => {
    try {
      // SECURITY: Sanitize ID before using in headers
      const safeSchoolId = secureString(schoolId);

      const response = await fetch(`${ENDPOINTS.teachers}/academicyear/active-info`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-School-ID": safeSchoolId,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch active academic info")
      }

      // SECURITY: Sanitize the incoming JSON response
      const rawInfo = await response.json();
      const activeInfo = securePayload(rawInfo);
      
      if (activeInfo && activeInfo.activeYear) {
        // --- STORE IN SESSION STORAGE (Names/Year ONLY) ---
        sessionStorage.setItem(STORAGE_KEYS.ACADEMIC_YEAR, activeInfo.activeYear)
        sessionStorage.setItem(STORAGE_KEYS.ACTIVE_TERM_NAME, activeInfo.activeTermName || "")
        
        if(activeInfo.activeSectionId) {
              sessionStorage.setItem(STORAGE_KEYS.ACTIVE_SECTION_NAME, activeInfo.activeSectionName || "")
        } else {
              sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_SECTION_NAME)
        }
        
        // --- UPDATE STATE (Includes IDs for memory usage) ---
        setCurrentAcademicYear(activeInfo.activeYear)
        setActiveTermId(activeInfo.activeTermId || null) 
        setActiveTermName(activeInfo.activeTermName || "")
        setActiveSectionId(activeInfo.activeSectionId || null)
        setActiveSectionName(activeInfo.activeSectionName || "")
        
        return activeInfo
      }
      return null
    } catch (error) {
      console.error("Error fetching active academic info:", error)
      return null
    }
  }, [])

  // Update last activity timestamp
  const updateLastActivity = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString())
  }, [])

  // Get last activity timestamp
  const getLastActivity = useCallback(() => {
    // SECURITY: Sanitize string before parsing
    const stored = secureString(localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY));
    return parseInt(stored || "0")
  }, [])

  // Check if session has expired
  const checkSessionExpiry = useCallback(() => {
    const lastActivity = getLastActivity()
    const currentTime = Date.now()
    const timeSinceLastActivity = currentTime - lastActivity
    
    if (lastActivity > 0 && timeSinceLastActivity > AUTO_LOGOUT_CONFIG.TIMEOUT) {
      // Session expired, trigger auto logout
      autoLogout(true)
      return true
    }
    return false
  }, [getLastActivity])

  // Get appropriate token based on user type
  const getAuthToken = useCallback(() => {
    // SECURITY: Sanitize tokens read from storage
    const tToken = sessionStorage.getItem(STORAGE_KEYS.TEACHER_TOKEN);
    const sToken = sessionStorage.getItem(STORAGE_KEYS.STUDENT_TOKEN);
    // Note: Tokens are usually long and random, but sanitizing strictly ensures no injected scripts via storage manipulation
    return (tToken ? secureString(tToken) : null) || (sToken ? secureString(sToken) : null);
  }, [])

  // Get user type
  const getUserType = useCallback(() => {
    if (sessionStorage.getItem(STORAGE_KEYS.TEACHER_TOKEN)) return "teacher"
    if (sessionStorage.getItem(STORAGE_KEYS.STUDENT_TOKEN)) return "student"
    return null
  }, [])

  // Store teacher data with sensitive info in sessionStorage
  const storeTeacherData = useCallback(async (teacherData) => {
    // SECURITY: Sanitize the payload before storage
    const safeData = securePayload(teacherData);

    if (safeData.token) {
      sessionStorage.setItem(STORAGE_KEYS.TEACHER_TOKEN, safeData.token)
    }
    
    sessionStorage.setItem(STORAGE_KEYS.TEACHER_DATA, JSON.stringify(safeData))
    
    if (safeData.schoolCode) {
      localStorage.setItem(STORAGE_KEYS.SCHOOL_CODE, safeData.schoolCode)
    }
    if (safeData.schoolName) {
      localStorage.setItem(STORAGE_KEYS.SCHOOL_NAME, safeData.schoolName)
    }
    if (safeData.schoolId) {
      localStorage.setItem(STORAGE_KEYS.SCHOOL_ID, safeData.schoolId)
      
      // Fetch active academic year/term/section after storing school data
      await fetchActiveAcademicInfo(safeData.schoolId)
    }

    updateLastActivity()
  }, [fetchActiveAcademicInfo, updateLastActivity])

  // Store student data with sensitive info in sessionStorage
  const storeStudentData = useCallback(async (studentData) => {
    // SECURITY: Sanitize payload
    const safeData = securePayload(studentData);

    if (safeData.token) {
      sessionStorage.setItem(STORAGE_KEYS.STUDENT_TOKEN, safeData.token)
    }
    
    sessionStorage.setItem(STORAGE_KEYS.STUDENT_DATA, JSON.stringify(safeData))
    
    if (safeData.schoolCode) {
      localStorage.setItem(STORAGE_KEYS.SCHOOL_CODE, safeData.schoolCode)
    }
    if (safeData.schoolName) {
      localStorage.setItem(STORAGE_KEYS.SCHOOL_NAME, safeData.schoolName)
    }
    if (safeData.schoolId) {
      localStorage.setItem(STORAGE_KEYS.SCHOOL_ID, safeData.schoolId)
      
      // Fetch active academic year/term/section after storing school data
      await fetchActiveAcademicInfo(safeData.schoolId)
    }

    updateLastActivity()
  }, [fetchActiveAcademicInfo, updateLastActivity])

  // Clear all teacher data
  const clearTeacherData = useCallback(() => {
    // sessionStorage is cleared in clearSchoolData/logout
    setTeacher(null)
  }, [])

  // Clear all student data
  const clearStudentData = useCallback(() => {
    // sessionStorage is cleared in clearSchoolData/logout
    setStudent(null)
  }, [])

  // Clear school data and Session Storage
  const clearSchoolData = useCallback(() => {
    // Clear Local Storage Items
    localStorage.removeItem(STORAGE_KEYS.SCHOOL_CODE)
    localStorage.removeItem(STORAGE_KEYS.SCHOOL_NAME)
    localStorage.removeItem(STORAGE_KEYS.SCHOOL_ID)
    localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY)
    
    // --- WIPE ALL SESSION STORAGE ---
    sessionStorage.clear()
    
    // Reset Context State
    setSchool(null)
    setCurrentAcademicYear(null)
    setActiveTermId(null)
    setActiveTermName(null)
    setActiveSectionId(null)
    setActiveSectionName(null)
  }, [])

  // Auto logout function
  const autoLogout = useCallback((isAuto = false) => {
    const userType = getUserType()
    const redirectPath = isAuto ? 
      (userType === "teacher" ? "/teacherlogin" : 
       userType === "student" ? "/studentlogin" : "/") : "/"

    if (userType === "teacher") {
      clearTeacherData()
    } else if (userType === "student") {
      clearStudentData()
    }

    clearSchoolData()
    
    const currentPath = location.pathname
    const isOnLoginPage = currentPath.includes('login') || currentPath === '/'
    
    if (!isOnLoginPage) {
      navigate(redirectPath, { replace: true })
    }
  }, [getUserType, clearTeacherData, clearStudentData, clearSchoolData, navigate, location.pathname])

  // Manual logout
  const logout = useCallback((redirectTo = "/") => {
    const userType = getUserType()
    
    if (userType === "teacher") {
      clearTeacherData()
    } else if (userType === "student") {
      clearStudentData()
    }

    clearSchoolData()
    navigate(redirectTo, { replace: true })
  }, [getUserType, clearTeacherData, clearStudentData, clearSchoolData, navigate])

  // Force logout
  const forceLogout = useCallback(() => {
    clearTeacherData()
    clearStudentData()
    clearSchoolData()
    navigate("/", { replace: true })
  }, [clearTeacherData, clearStudentData, clearSchoolData, navigate])

  // Restore session from storage
  const restoreSession = useCallback(async () => {
    const userType = getUserType()
    
    // Restore Academic Info (Names/Year from storage) - SECURED READS
    const storedYear = secureString(sessionStorage.getItem(STORAGE_KEYS.ACADEMIC_YEAR))
    const storedTermName = secureString(sessionStorage.getItem(STORAGE_KEYS.ACTIVE_TERM_NAME))
    const storedSectionName = secureString(sessionStorage.getItem(STORAGE_KEYS.ACTIVE_SECTION_NAME))
    
    if (storedYear) setCurrentAcademicYear(storedYear)
    if (storedTermName) setActiveTermName(storedTermName)
    if (storedSectionName) setActiveSectionName(storedSectionName)

    // Check session expiry first
    if (checkSessionExpiry()) {
      setLoading(false)
      return
    }

    // Restore teacher session
    if (userType === "teacher") {
      const storedTeacherData = sessionStorage.getItem(STORAGE_KEYS.TEACHER_DATA)
      // SECURITY: Sanitize localStorage reads
      const storedSchoolCode = secureString(localStorage.getItem(STORAGE_KEYS.SCHOOL_CODE))
      const storedSchoolName = secureString(localStorage.getItem(STORAGE_KEYS.SCHOOL_NAME))
      const storedSchoolId = secureString(localStorage.getItem(STORAGE_KEYS.SCHOOL_ID))

      if (storedTeacherData) {
        try {
          // SECURITY: Parse then recursively sanitize the object
          let teacherData = JSON.parse(storedTeacherData)
          teacherData = securePayload(teacherData)
          setTeacher(teacherData)
        } catch (e) {
          console.error("Error restoring teacher data", e);
          forceLogout(); // Corrupt data = security risk
          return;
        }
      }

      if (storedSchoolCode || storedSchoolName || storedSchoolId) {
        setSchool({
          schoolCode: storedSchoolCode,
          schoolName: storedSchoolName,
          schoolId: storedSchoolId
        })
        
        // FETCH IDs: Since IDs aren't in storage, we fetch them from server
        if (storedSchoolId) {
              await fetchActiveAcademicInfo(storedSchoolId);
        }
      }
    }

    // Restore student session
    if (userType === "student") {
      const storedStudentData = sessionStorage.getItem(STORAGE_KEYS.STUDENT_DATA)
      const storedSchoolCode = secureString(localStorage.getItem(STORAGE_KEYS.SCHOOL_CODE))
      const storedSchoolName = secureString(localStorage.getItem(STORAGE_KEYS.SCHOOL_NAME))
      const storedSchoolId = secureString(localStorage.getItem(STORAGE_KEYS.SCHOOL_ID))

      if (storedStudentData) {
        try {
           // SECURITY: Parse then recursively sanitize
           let studentData = JSON.parse(storedStudentData)
           studentData = securePayload(studentData)
           setStudent(studentData)
        } catch (e) {
           console.error("Error restoring student data", e);
           forceLogout();
           return;
        }
      }

      if (storedSchoolCode || storedSchoolName || storedSchoolId) {
        setSchool({
          schoolCode: storedSchoolCode,
          schoolName: storedSchoolName,
          schoolId: storedSchoolId
        })
        
        // FETCH IDs
        if (storedSchoolId) {
              await fetchActiveAcademicInfo(storedSchoolId);
        }
      }
    }

    setLoading(false)
  }, [getUserType, checkSessionExpiry, fetchActiveAcademicInfo, forceLogout])

  // Teacher login
  const teacherLogin = useCallback(async (schoolCode, userName, password) => {
    try {
      setLoading(true)
      
      // SECURITY: Session Fixation Prevention
      sessionStorage.clear(); 

      // SECURITY: Input Sanitization
      const safeSchoolCode = secureString(schoolCode);
      const safeUserName = secureString(userName);
      const safePassword = String(password); // Ensure string, do not sanitize chars

      const loginData = {
        schoolCode: safeSchoolCode,
        userName: safeUserName,
        password: safePassword
      }

      const response = await fetch(`${ENDPOINTS.teachers}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Teacher login failed")
      }

      // SECURITY: Sanitize response data before using it in app state
      const rawData = await response.json()
      const responseData = securePayload(rawData)
      
      if (!responseData.success) {
        throw new Error(responseData.message || "Teacher login failed")
      }

      const { token, teacherId, teacherName, schoolCode: respSchoolCode, schoolName, schoolId, userDetails } = responseData

      if (!token) throw new Error("No token returned")

      const teacherData = {
        token,
        teacherId,
        teacherName,
        schoolCode: respSchoolCode,
        schoolName,
        schoolId,
        userDetails,
        ...responseData
      }

      await storeTeacherData(teacherData)
      setTeacher(teacherData)
      setSchool({
        schoolCode: respSchoolCode,
        schoolName: schoolName,
        schoolId: schoolId
      })
      setStudent(null)

      return { success: true, data: teacherData }
    } catch (error) {
      console.error("Teacher login error:", error)
      clearTeacherData()
      clearSchoolData()
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [storeTeacherData, clearTeacherData, clearSchoolData])

  // Student login
  const studentLogin = useCallback(async (schoolCode, userName, password) => {
    try {
      setLoading(true)
      
      // SECURITY: Session Fixation Prevention
      sessionStorage.clear(); 

      // SECURITY: Input Sanitization
      const safeSchoolCode = secureString(schoolCode);
      const safeUserName = secureString(userName);
      const safePassword = String(password);

      const loginData = {
        schoolCode: safeSchoolCode,
        userName: safeUserName,
        password: safePassword
      }

      const response = await fetch(`${ENDPOINTS.students}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Student login failed")
      }

      // SECURITY: Sanitize response data
      const rawData = await response.json()
      const studentData = securePayload(rawData)

      const { token, studentId, studentName, schoolCode: respSchoolCode, schoolName, schoolId } = studentData

      if (!token) throw new Error("No token returned")

      await storeStudentData(studentData)
      setStudent(studentData)
      setSchool({
        schoolCode: respSchoolCode,
        schoolName: schoolName,
        schoolId: schoolId
      })
      setTeacher(null)

      return { success: true, data: studentData }
    } catch (error) {
      console.error("Student login error:", error)
      clearStudentData()
      clearSchoolData()
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [storeStudentData, clearStudentData, clearSchoolData])

  // Academic year management
  const updateCurrentAcademicYear = useCallback((year) => {
    const safeYear = secureString(year); // SECURITY: Sanitize
    setCurrentAcademicYear(safeYear)
    sessionStorage.setItem(STORAGE_KEYS.ACADEMIC_YEAR, safeYear)
  }, [])

  const refreshAcademicYear = useCallback(() => {
    const storedYear = secureString(sessionStorage.getItem(STORAGE_KEYS.ACADEMIC_YEAR))
    if (storedYear) setCurrentAcademicYear(storedYear)
    return storedYear
  }, [])

  // Refresh active academic info
  const refreshActiveAcademicInfo = useCallback(async () => {
    const schoolId = school?.schoolId
    if (schoolId) {
      return await fetchActiveAcademicInfo(schoolId)
    }
    return null
  }, [school?.schoolId, fetchActiveAcademicInfo])

  // Get auth headers for API calls
  const getAuthHeaders = useCallback(() => ({
    "Authorization": `Bearer ${getAuthToken()}`,
    "Content-Type": "application/json"
  }), [getAuthToken])

  // Check if user is authenticated
  const isAuthenticated = useMemo(() => !!teacher || !!student, [teacher, student])
  const userType = getUserType()

  // Convenience getters for teacher specific data
  const teacherData = useMemo(() => {
    if (!teacher) return null
    return {
      id: teacher.teacherId,
      name: teacher.teacherName,
      schoolCode: teacher.schoolCode,
      schoolName: teacher.schoolName,
      schoolId: teacher.schoolId,
      userDetails: teacher.userDetails,
      token: teacher.token
    }
  }, [teacher])

  // Activity tracking
  const trackActivity = useCallback(() => {
    if (isAuthenticated) {
      updateLastActivity()
    }
  }, [isAuthenticated, updateLastActivity])

  // Initialize session on mount
  useEffect(() => {
    let mounted = true
    
    if (mounted) {
      restoreSession()
    }

    return () => {
      mounted = false
    }
  }, [restoreSession])

  // Set up activity listeners and auto logout timer
  useEffect(() => {
    if (!isAuthenticated) return

    // Track user activity
    const activities = ['click', 'keypress', 'scroll', 'mousemove', 'touchstart']
    const handleActivity = () => trackActivity()

    activities.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Set up session expiry check interval
    const expiryCheckInterval = setInterval(() => {
      checkSessionExpiry()
    }, AUTO_LOGOUT_CONFIG.CHECK_INTERVAL)

    // Initial check
    checkSessionExpiry()

    return () => {
      activities.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      clearInterval(expiryCheckInterval)
    }
  }, [isAuthenticated, trackActivity, checkSessionExpiry])

  const contextValue = useMemo(() => ({
    // State
    teacher: teacherData,
    student,
    school,
    loading,
    currentAcademicYear,
    activeTermId,
    activeTermName,
    activeSectionId, 
    activeSectionName, 
    
    // Authentication status
    isAuthenticated,
    userType,
    
    // Login methods
    teacherLogin,
    studentLogin,
    
    // Logout methods
    logout,
    forceLogout,
    autoLogout,
    
    // Academic year
    updateCurrentAcademicYear,
    refreshAcademicYear,
    refreshActiveAcademicInfo,
    
    // Utility methods
    getAuthHeaders,
    getAuthToken,
    trackActivity,
    
    // Convenience getters
    currentUser: teacherData || student,
    schoolCode: school?.schoolCode,
    schoolName: school?.schoolName,
    schoolId: school?.schoolId,
    
    // Teacher specific getters
    isTeacher: userType === "teacher",
    isStudent: userType === "student"
  }), [
    teacherData,
    student,
    school,
    loading,
    currentAcademicYear,
    activeTermId,
    activeTermName,
    activeSectionId, 
    activeSectionName, 
    isAuthenticated,
    userType,
    teacherLogin,
    studentLogin,
    logout,
    forceLogout,
    autoLogout,
    updateCurrentAcademicYear,
    refreshAcademicYear,
    refreshActiveAcademicInfo,
    getAuthHeaders,
    getAuthToken,
    trackActivity
  ])

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  )
}

export const useUserContext = () => {
  const context = useContext(UserContext)
  if (!context) throw new Error("useUserContext must be used within a UserProvider")
  return context
}