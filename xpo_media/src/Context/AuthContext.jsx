("use client")

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import DOMPurify from "dompurify" // REQUIRED: For XSS prevention
import { ENDPOINTS } from "../SpringBoot/config"

// --- SECURITY CONSTANTS ---
const MAX_INPUT_LENGTH = 150; // Prevent DoS via massive strings

const STORAGE_KEYS = {
  TOKEN: "token",
  ADMIN_TOKEN: "adminToken",
  USER_ID: "userId",
  ADMIN_ID: "adminId",
  SCHOOL_NAME: "schoolName",
  ADMIN_NAME: "adminName",
  ACADEMIC_YEAR: "currentAcademicYear",
  SCHOOL_STATUS: "schoolStatus",
  SCHOOL_FROM_DATE: "schoolFromDate",
  SCHOOL_TO_DATE: "schoolToDate",
  SCHOOL_CODE: "schoolCode" 
}

const AuthContext = createContext()

// --- SECURITY UTILITIES ---

/**
 * 1. Input Sanitization & Truncation
 * Prevents XSS and Buffer Overflow/DoS attacks
 */
const secureString = (input) => {
  if (typeof input !== 'string') return input;
  // Truncate to prevent DoS (freeze browser with 10MB string)
  const truncated = input.length > MAX_INPUT_LENGTH ? input.substring(0, MAX_INPUT_LENGTH) : input;
  // Sanitize HTML/Scripts
  return DOMPurify.sanitize(truncated.trim());
};

/**
 * 2. Object Sanitization (Recursive)
 * Used for registration payloads to clean nested JSON data
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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Safe init of Academic Year
  const [currentAcademicYear, setCurrentAcademicYear] = useState(
    () => secureString(localStorage.getItem(STORAGE_KEYS.ACADEMIC_YEAR)) || null
  )

  const getAuthToken = useCallback(() => {
    return sessionStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)
  }, [])

  // Simplified restoreSession
  const restoreSession = useCallback(async () => {
    const token = getAuthToken()
    
    // SECURITY: Sanitize data read from storage. 
    // If an attacker manually modifies localStorage to inject scripts, this blocks it.
    const storedYear = secureString(localStorage.getItem(STORAGE_KEYS.ACADEMIC_YEAR))
    const storedUserId = secureString(localStorage.getItem(STORAGE_KEYS.USER_ID))
    const storedAdminId = secureString(localStorage.getItem(STORAGE_KEYS.ADMIN_ID))
    const storedSchoolName = secureString(localStorage.getItem(STORAGE_KEYS.SCHOOL_NAME))
    const storedAdminName = secureString(localStorage.getItem(STORAGE_KEYS.ADMIN_NAME))
    
    const storedStatus = secureString(sessionStorage.getItem(STORAGE_KEYS.SCHOOL_STATUS))
    const storedFromDate = secureString(sessionStorage.getItem(STORAGE_KEYS.SCHOOL_FROM_DATE))
    const storedToDate = secureString(sessionStorage.getItem(STORAGE_KEYS.SCHOOL_TO_DATE))
    const storedSchoolCode = secureString(sessionStorage.getItem(STORAGE_KEYS.SCHOOL_CODE))

    if (storedYear) setCurrentAcademicYear(storedYear)

    // Restore normal user
    if (token && storedUserId) {
      setUser({ 
        uid: storedUserId, 
        name: storedSchoolName || "Authenticated User",
        status: storedStatus,        
        fromDate: storedFromDate,    
        toDate: storedToDate,        
        schoolCode: storedSchoolCode 
      })
    }

    // Restore admin
    if (token && storedAdminId) {
      setAdmin({ 
        adminId: storedAdminId, 
        name: storedAdminName || "Admin" 
      })
    }

    setLoading(false)
  }, [getAuthToken])

  // Add cleanup effect
  useEffect(() => {
    let mounted = true
    if (mounted) {
      restoreSession()
    }
    return () => {
      mounted = false
    }
  }, [restoreSession])

  const login = useCallback(async (email, password) => {
    try {
      setLoading(true)
      
      // SECURITY: Session Fixation Prevention
      // Clear any potential old data before establishing new session
      sessionStorage.clear(); 
      
      // SECURITY: Sanitize Inputs
      const safeEmail = secureString(email);
      // Passwords must be sent raw (hashing happens on server), but ensure string type
      const safePassword = String(password); 

      const response = await fetch(ENDPOINTS.auth.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: safeEmail, password: safePassword }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Login failed")
      }
      
      const data = await response.json()
      // Use raw data for logic, but ensure UI-bound data is safe? 
      // Ideally backend returns safe data, but we store it carefully below.
      const { token, id, schoolCode, schoolName, email: userEmail, status, fromDate, toDate } = data

      if (!token) throw new Error("No token returned")

      sessionStorage.setItem(STORAGE_KEYS.TOKEN, token)

      if (status) sessionStorage.setItem(STORAGE_KEYS.SCHOOL_STATUS, status)
      if (fromDate) sessionStorage.setItem(STORAGE_KEYS.SCHOOL_FROM_DATE, fromDate)
      if (toDate) sessionStorage.setItem(STORAGE_KEYS.SCHOOL_TO_DATE, toDate)
      if (schoolCode) sessionStorage.setItem(STORAGE_KEYS.SCHOOL_CODE, schoolCode)

      localStorage.setItem(STORAGE_KEYS.USER_ID, id || userEmail)
      if (schoolName) localStorage.setItem(STORAGE_KEYS.SCHOOL_NAME, schoolName)

      setUser({ 
        uid: id || userEmail, 
        name: schoolName || userEmail,
        status: status,        
        fromDate: fromDate,    
        toDate: toDate,        
        schoolCode: schoolCode 
      })
      setAdmin(null)
      
      return { success: true, data }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const adminLogin = useCallback(async (adminId, password) => {
    try {
      setLoading(true)
      
      // SECURITY: Session Fixation Prevention
      sessionStorage.clear();

      const safeAdminId = secureString(adminId);
      const safePassword = String(password);

      const response = await fetch(ENDPOINTS.admin.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: safeAdminId, password: safePassword }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Admin login failed")
      }
      
      const data = await response.json()
      const token = data.token

      if (!token) throw new Error("No token returned")

      sessionStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token)
      localStorage.setItem(STORAGE_KEYS.ADMIN_ID, safeAdminId)

      const adminName = data.adminName || "Admin"
      localStorage.setItem(STORAGE_KEYS.ADMIN_NAME, adminName)

      setAdmin({ 
        adminId: safeAdminId, 
        name: adminName 
      })
      setUser(null)

      return { success: true, data }
    } catch (error) {
      console.error("Admin login error:", error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (payload) => {
    try {
      // SECURITY: Sanitize entire object payload to prevent XSS via registration fields
      const safePayload = securePayload(payload);

      const response = await fetch(ENDPOINTS.auth.register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(safePayload),
      })
      if (!response.ok) throw new Error("Registration failed")
      return await response.json()
    } catch (error) {
      console.error("Register error:", error)
      throw error
    }
  }, [])

  const registerSchool = useCallback(async (payload) => {
    try {
      const token = getAuthToken()
      // SECURITY: Sanitize payload
      const safePayload = securePayload(payload);

      const response = await fetch(ENDPOINTS.admin.registerSchool, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(safePayload),
      })
      if (!response.ok) throw new Error("School registration failed")
      return await response.json()
    } catch (error) {
      console.error("School registration error:", error)
      throw error
    }
  }, [getAuthToken])

  // --- MODIFIED: CLEAR BOTH STORAGES ---
  const logout = useCallback(() => {
    setUser(null)
    setAdmin(null)
    
    // Completely wipe all storage to prevent any data persistence
    sessionStorage.clear();
    localStorage.clear();
  }, [])

  // --- MODIFIED: CLEAR BOTH STORAGES ---
  const forceLogout = useCallback(() => {
    setUser(null)
    setAdmin(null)
    
    // Completely wipe all storage
    sessionStorage.clear();
    localStorage.clear();
  }, [])

  const updateCurrentAcademicYear = useCallback((year) => {
    const safeYear = secureString(year); // Sanitize input
    setCurrentAcademicYear(safeYear)
    localStorage.setItem(STORAGE_KEYS.ACADEMIC_YEAR, safeYear)
  }, [])

  const refreshAcademicYear = useCallback(() => {
    const storedYear = secureString(localStorage.getItem(STORAGE_KEYS.ACADEMIC_YEAR))
    if (storedYear) setCurrentAcademicYear(storedYear)
    return storedYear
  }, [])

  const isAuth = !!user || !!admin
  const schoolId = user?.uid || admin?.adminId || "-"
  const schoolCode = user?.schoolCode || null 

  const getAuthHeaders = useCallback(() => ({
    "Authorization": `Bearer ${getAuthToken()}`,
    "Content-Type": "application/json"
  }), [getAuthToken])

  const contextValue = useMemo(() => ({
    user,
    admin,
    loading,
    isAuth,
    currentAcademicYear,
    schoolId,
    schoolCode, 
    login,
    adminLogin,
    register,
    registerSchool,
    updateCurrentAcademicYear,
    refreshAcademicYear,
    logout,
    forceLogout,
    getAuthHeaders,
    getAuthToken
  }), [
    user, admin, loading, isAuth, currentAcademicYear, schoolId, schoolCode,
    login, adminLogin, register, registerSchool, 
    updateCurrentAcademicYear, refreshAcademicYear, logout, forceLogout, 
    getAuthHeaders, getAuthToken
  ])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuthContext must be used within an AuthProvider")
  return context
}