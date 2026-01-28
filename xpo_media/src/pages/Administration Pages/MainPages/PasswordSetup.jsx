import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainContentPage from '../../../components/MainContent/MainContentPage';
import { Form, Button, Row, Col, Container, Table, Spinner, Alert, Modal, Badge, Card, Dropdown } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaSearch, FaUserPlus, FaUserTie, FaUserGraduate, FaTimes, FaSync, FaFilter, FaEdit, FaTrash, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { useAuthContext } from '../../../Context/AuthContext';
import { ENDPOINTS } from '../../../SpringBoot/config';

const PasswordSetup = () => {
  const [accountType, setAccountType] = useState('teacher');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name');
  const [standardFilter, setStandardFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [staffMembers, setStaffMembers] = useState([]);
  const [students, setStudents] = useState([]);
  const [existingAccounts, setExistingAccounts] = useState([]);
  const [loading, setLoading] = useState({
    staff: false,
    students: false,
    create: false,
    accounts: false,
    edit: false,
    delete: false
  });
  
  // Table filter states
  const [tableFilters, setTableFilters] = useState({
    standard: '',
    section: '',
    classInCharge: '',
    designation: '',
    search: ''
  });
  
  // Table sort states
  const [tableSort, setTableSort] = useState({
    field: 'name',
    direction: 'asc'
  });
  
  // Edit/Delete states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState(null);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  
  const navigate = useNavigate();
  const { user, admin, currentAcademicYear, schoolId, schoolCode, getAuthHeaders } = useAuthContext();

  // Search type options
  const searchOptions = {
    teacher: [
      { value: 'name', label: 'Name' },
      { value: 'staffCode', label: 'Staff Code' },
      { value: 'designation', label: 'Designation' },
      { value: 'mobileNumber', label: 'Phone' }
    ],
    student: [
      { value: 'name', label: 'Name' },
      { value: 'admissionNumber', label: 'Admission No' },
      { value: 'class', label: 'Class' },
      { value: 'section', label: 'Section' },
      { value: 'fatherName', label: "Father's Name" },
      { value: 'phoneNumber', label: 'Phone' }
    ]
  };

  // Fetch staff members
  const fetchStaffMembers = useCallback(async () => {
    if (!schoolId || !currentAcademicYear) return;
    
    try {
      setLoading(prev => ({ ...prev, staff: true }));
      const response = await fetch(
        `${ENDPOINTS.administration}/staff?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        {
          method: "GET",
          headers: getAuthHeaders()
        }
      );

      if (response.ok) {
        const result = await response.json();
        // Handle both array and object response formats
        const staffData = Array.isArray(result) ? result : (result.data || []);
        
        // FIX: Ensure staffCode is properly formatted as string
        const processedStaff = staffData.map(staff => ({
          ...staff,
          staffCode: String(staff.staffCode || staff.id || ''),
          id: String(staff.id || ''),
          // Ensure classInCharge is available
          classInCharge: staff.classInCharge || 'Not Assigned'
        }));
        
        setStaffMembers(processedStaff);
      } else if (response.status !== 404) {
        throw new Error(`Failed to fetch staff: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching staff members:", error);
      toast.error("Failed to load staff members");
    } finally {
      setLoading(prev => ({ ...prev, staff: false }));
    }
  }, [schoolId, currentAcademicYear, getAuthHeaders]);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    if (!schoolId || !currentAcademicYear) return;
    
    try {
      setLoading(prev => ({ ...prev, students: true }));
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/admission/school/${schoolId}?academicYear=${currentAcademicYear}`,
        {
          method: "GET",
          headers: getAuthHeaders()
        }
      );

      if (response.ok) {
        const result = await response.json();
        // Handle both array and object response formats
        const studentsData = Array.isArray(result) ? result : (result.data || []);
        
        // FIX: Ensure admissionNumber is properly formatted as string
        const processedStudents = studentsData.map(student => ({
          ...student,
          admissionNumber: String(student.admissionNumber || student.id || ''),
          id: String(student.id || ''),
          // Ensure standard and section are available
          standard: student.standard || 'N/A',
          section: student.section || 'N/A'
        }));
        
        setStudents(processedStudents);
      } else {
        throw new Error(`Failed to fetch students: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(prev => ({ ...prev, students: false }));
    }
  }, [schoolId, currentAcademicYear, getAuthHeaders]);

  // Fetch existing accounts
  const fetchExistingAccounts = useCallback(async () => {
    if (!schoolId || !currentAcademicYear) return;
    
    try {
      setLoading(prev => ({ ...prev, accounts: true }));
      const response = await fetch(
        `${ENDPOINTS.administration}/rolebasedaccounts?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        {
          method: "GET",
          headers: getAuthHeaders()
        }
      );

      if (response.ok) {
        const result = await response.json();
        // Extract data from response object - handle both success object and direct array
        const accountsData = result.success ? (result.data || []) : (Array.isArray(result) ? result : []);
        setExistingAccounts(accountsData);
      } else {
        throw new Error(`Failed to fetch accounts: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching existing accounts:", error);
      toast.error("Failed to load existing accounts");
    } finally {
      setLoading(prev => ({ ...prev, accounts: false }));
    }
  }, [schoolId, currentAcademicYear, getAuthHeaders]);

  useEffect(() => {
    if (schoolId && currentAcademicYear) {
      fetchStaffMembers();
      fetchStudents();
      fetchExistingAccounts();
    }
  }, [schoolId, currentAcademicYear, fetchStaffMembers, fetchStudents, fetchExistingAccounts]);

  // Get unique standards/classes from students
  const availableStandards = useMemo(() => {
    const standards = [...new Set(students.map(student => student.standard).filter(Boolean))];
    return standards.sort();
  }, [students]);

  // Get unique sections from students
  const availableSections = useMemo(() => {
    const sections = [...new Set(students.map(student => student.section).filter(Boolean))];
    return sections.sort();
  }, [students]);

  // Get unique class in charge from staff
  const availableClassInCharge = useMemo(() => {
    const classInCharge = [...new Set(staffMembers.map(staff => staff.classInCharge).filter(Boolean))];
    return classInCharge.sort();
  }, [staffMembers]);

  // Get unique designations from staff
  const availableDesignations = useMemo(() => {
    const designations = [...new Set(staffMembers.map(staff => staff.designation).filter(Boolean))];
    return designations.sort();
  }, [staffMembers]);

  // Filter users based on search term, type, and standard filter
  const filteredUsers = useMemo(() => {
    const users = accountType === 'teacher' ? staffMembers : students;
    
    let filtered = users;

    // Apply standard filter for students
    if (accountType === 'student' && standardFilter) {
      filtered = filtered.filter(user => user.standard === standardFilter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => {
        switch (searchType) {
          case 'name':
            return (accountType === 'teacher' ? user.name : user.studentName)?.toLowerCase().includes(searchLower);
          case 'staffCode':
            return user.staffCode?.toLowerCase().includes(searchLower);
          case 'admissionNumber':
            return user.admissionNumber?.toLowerCase().includes(searchLower);
          case 'designation':
            return user.designation?.toLowerCase().includes(searchLower);
          case 'class':
            return user.standard?.toLowerCase().includes(searchLower);
          case 'section':
            return user.section?.toLowerCase().includes(searchLower);
          case 'fatherName':
            return user.fatherName?.toLowerCase().includes(searchLower);
          case 'mobileNumber':
          case 'phoneNumber':
            return user.mobileNumber?.includes(searchTerm) || user.phoneNumber?.includes(searchTerm);
          default:
            return true;
        }
      });
    }

    return filtered.slice(0, 15); // Limit to 15 results for better performance
  }, [accountType, staffMembers, students, searchTerm, searchType, standardFilter]);

  // Filter and sort existing accounts table
  const filteredAndSortedAccounts = useMemo(() => {
    if (!Array.isArray(existingAccounts)) return [];
    
    let filtered = existingAccounts.filter(account => {
      if (!account || !account.role) return false;
      
      // Filter by account type
      if (account.role !== (accountType === 'teacher' ? 'TEACHER' : 'STUDENT')) {
        return false;
      }

      // Apply table filters
      if (tableFilters.search) {
        const searchLower = tableFilters.search.toLowerCase();
        const matchesSearch = 
          account.username?.toLowerCase().includes(searchLower) ||
          account.userDetails?.name?.toLowerCase().includes(searchLower) ||
          (accountType === 'teacher' 
            ? account.userDetails?.staffId?.toLowerCase().includes(searchLower)
            : account.userDetails?.admissionNo?.toLowerCase().includes(searchLower)
          );
        if (!matchesSearch) return false;
      }

      if (tableFilters.standard && accountType === 'student') {
        if (account.userDetails?.class !== tableFilters.standard) return false;
      }

      if (tableFilters.section && accountType === 'student') {
        if (account.userDetails?.section !== tableFilters.section) return false;
      }

      if (tableFilters.classInCharge && accountType === 'teacher') {
        if (account.userDetails?.classInCharge !== tableFilters.classInCharge) return false;
      }

      if (tableFilters.designation && accountType === 'teacher') {
        if (account.userDetails?.designation !== tableFilters.designation) return false;
      }

      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (tableSort.field) {
        case 'username':
          aValue = a.username || '';
          bValue = b.username || '';
          break;
        case 'name':
          aValue = a.userDetails?.name || '';
          bValue = b.userDetails?.name || '';
          break;
        case 'identifier':
          aValue = accountType === 'teacher' 
            ? (a.userDetails?.staffId || '')
            : (a.userDetails?.admissionNo || '');
          bValue = accountType === 'teacher'
            ? (b.userDetails?.staffId || '')
            : (b.userDetails?.admissionNo || '');
          break;
        case 'class':
          aValue = accountType === 'student' ? (a.userDetails?.class || '') : (a.userDetails?.classInCharge || '');
          bValue = accountType === 'student' ? (b.userDetails?.class || '') : (b.userDetails?.classInCharge || '');
          break;
        case 'section':
          aValue = a.userDetails?.section || '';
          bValue = b.userDetails?.section || '';
          break;
        default:
          aValue = a.userDetails?.name || '';
          bValue = b.userDetails?.name || '';
      }

      if (tableSort.direction === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    return filtered;
  }, [existingAccounts, accountType, tableFilters, tableSort]);

  // Handle table filter change
  const handleTableFilterChange = (filterName, value) => {
    setTableFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Handle table sort
  const handleTableSort = (field) => {
    setTableSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Clear all table filters
  const clearTableFilters = () => {
    setTableFilters({
      standard: '',
      section: '',
      classInCharge: '',
      designation: '',
      search: ''
    });
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (tableSort.field !== field) return <FaSort className="text-muted" />;
    return tableSort.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  // Get user display info
  const getDisplayName = (user) => {
    return accountType === 'teacher' ? user.name : user.studentName;
  };

  const getIdentifier = (user) => {
    return accountType === 'teacher' ? user.staffCode : user.admissionNumber;
  };

  const getAdditionalInfo = (user) => {
    return accountType === 'teacher' ? user.designation : `${user.standard} - ${user.section}`;
  };

  // Get standard info for table display
  const getStandardInfo = (user) => {
    if (accountType === 'teacher') {
      return user.classInCharge || 'Not Assigned';
    } else {
      return `${user.standard || 'N/A'} - ${user.section || 'N/A'}`;
    }
  };

  // Check if user already has an account - safely handle existingAccounts
  const isUserHasAccount = (user) => {
    if (!Array.isArray(existingAccounts)) return false;
    
    return existingAccounts.some(account => {
      if (!account || !account.userDetails) return false;
      
      if (accountType === 'teacher') {
        // FIX: Compare staff codes as strings
        const accountStaffCode = String(account.userDetails.staffId || account.userDetails.staffCode || '');
        const userStaffCode = String(user.staffCode || user.id || '');
        return accountStaffCode === userStaffCode;
      } else {
        const accountAdmissionNo = String(account.userDetails.admissionNo || '');
        const userAdmissionNo = String(user.admissionNumber || '');
        return accountAdmissionNo === userAdmissionNo;
      }
    });
  };

  const handleUserSelect = (user) => {
    if (isUserHasAccount(user)) {
      toast.error('This user already has an account created');
      return;
    }
    
    setSelectedUser(user);
    // Generate username based on user type and details
    if (accountType === 'teacher') {
      setUsername(user.staffCode?.toLowerCase() || user.name?.replace(/\s+/g, '.').toLowerCase());
    } else {
      setUsername(user.admissionNumber?.toLowerCase() || user.studentName?.replace(/\s+/g, '.').toLowerCase());
    }
    setPassword('');
    setConfirmPassword('');
    setSearchTerm(''); // Clear search after selection
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) {
      toast.error('Please select a user first');
      return;
    }

    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, create: true }));

      // FIX: Use staffCode instead of id for teachers
      const payload = {
        schoolId: String(schoolId),
        schoolCode: String(schoolCode),
        academicYear: String(currentAcademicYear),
        username: username.trim(),
        password,
        role: accountType === 'teacher' ? 'TEACHER' : 'STUDENT',
        userDetails: {
          // FIX: Use staffCode for teachers, admissionNumber for students
          staffId: accountType === 'teacher' ? String(selectedUser.staffCode) : null,
          admissionNo: accountType === 'student' ? String(selectedUser.admissionNumber) : null,
          name: accountType === 'teacher' ? String(selectedUser.name) : String(selectedUser.studentName),
          class: accountType === 'student' ? String(selectedUser.standard) : null,
          section: accountType === 'student' ? String(selectedUser.section) : null,
          schoolCode: String(schoolCode),
          username: username.trim(),
          designation: accountType === 'teacher' ? String(selectedUser.designation || '') : null,
          classInCharge: accountType === 'teacher' ? String(selectedUser.classInCharge || '') : null
        }
      };

      console.log('Sending payload:', payload); // Debug log

      const response = await fetch(
        `${ENDPOINTS.administration}/rolebasedaccounts/create`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        }
      );

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(responseText || 'Failed to parse response');
      }

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      if (result.success) {
        toast.success(`${accountType === 'teacher' ? 'Teacher' : 'Student'} account created successfully!`);
        
        // Reset form
        setSelectedUser(null);
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setSearchTerm('');
        setStandardFilter('');
        
        // Refresh data
        fetchExistingAccounts();
      } else {
        throw new Error(result.error || 'Failed to create account');
      }

    } catch (error) {
      console.error('Error creating account:', error);
      toast.error(`Failed to create account: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  // Edit Account Functions
  const handleEditAccount = (account) => {
    setAccountToEdit(account);
    setEditPassword('');
    setEditConfirmPassword('');
    setShowEditModal(true);
  };

  const handleUpdateAccount = async () => {
    if (!accountToEdit) return;

    if (editPassword && editPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (editPassword !== editConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, edit: true }));

      const response = await fetch(
        `${ENDPOINTS.administration}/rolebasedaccounts/${accountToEdit.username}/password?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ password: editPassword })
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success('Account password updated successfully!');
        setShowEditModal(false);
        setAccountToEdit(null);
        setEditPassword('');
        setEditConfirmPassword('');
        fetchExistingAccounts();
      } else {
        throw new Error(result.error || 'Failed to update account');
      }
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error(`Failed to update account: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, edit: false }));
    }
  };

  // Delete Account Functions
  const handleDeleteAccount = (account) => {
    setAccountToDelete(account);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!accountToDelete) return;

    try {
      setLoading(prev => ({ ...prev, delete: true }));

      const response = await fetch(
        `${ENDPOINTS.administration}/rolebasedaccounts/${accountToDelete.username}/delete?schoolId=${schoolId}&academicYear=${currentAcademicYear}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success('Account deleted successfully!');
        setShowDeleteModal(false);
        setAccountToDelete(null);
        fetchExistingAccounts();
      } else {
        throw new Error(result.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(`Failed to delete account: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const handleReset = () => {
    setSelectedUser(null);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setSearchTerm('');
    setStandardFilter('');
  };

  const handleCancel = () => {
    navigate('/home');
  };

  const handleRefresh = () => {
    fetchStaffMembers();
    fetchStudents();
    fetchExistingAccounts();
    clearTableFilters();
    toast.info('Data refreshed successfully');
  };

  // Safely get account count
  const accountCount = Array.isArray(filteredAndSortedAccounts) ? filteredAndSortedAccounts.length : 0;

  // Check if any table filter is active
  const isAnyTableFilterActive = Object.values(tableFilters).some(value => value !== '');

  return (
    <MainContentPage>
      <Container fluid className="px-0 px-lg-0">
        <Row>
          <Col xs={12}>
            <div className="password-setup-container">
              {/* Breadcrumb Navigation */}
              <nav className="custom-breadcrumb py-1 py-lg-3">
                <Link to="/home">Home</Link>
                <span className="separator mx-2">&gt;</span>
                <span>Administration</span>
                <span className="separator mx-2">&gt;</span>
                <span className="current">Password Setup</span>
              </nav>

              <div className="form-card mt-3">
                {/* Header */}
                <div className="header p-3" style={{ backgroundColor: '#0B3D7B' }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <h2 className="m-0 text-white">Role-Based Account Setup</h2>
                    <div className="d-flex align-items-center">
                      <Badge bg="light" text="dark" className="me-3">
                        School Code: {schoolCode || 'N/A'}
                      </Badge>
                      <Button variant="outline-light" size="sm" onClick={handleRefresh}>
                        <FaSync className="me-1" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Form Content - Single Column */}
                <div className="content-wrapper p-4">
                  {!currentAcademicYear ? (
                    <Alert variant="warning">
                      Please select an academic year first to manage accounts.
                    </Alert>
                  ) : (
                    <>
                      {/* Account Type Toggle */}
                      <Row className="mb-4">
                        <Col xs={12}>
                          <div className="account-type-toggle">
                            <Button
                              variant={accountType === 'teacher' ? 'primary' : 'outline-primary'}
                              onClick={() => {
                                setAccountType('teacher');
                                setSelectedUser(null);
                                setSearchTerm('');
                                setSearchType('name');
                                setStandardFilter('');
                                clearTableFilters();
                              }}
                              className="toggle-btn me-3"
                            >
                              <FaUserTie className="me-2" />
                              Teacher Accounts
                            </Button>
                            <Button
                              variant={accountType === 'student' ? 'primary' : 'outline-primary'}
                              onClick={() => {
                                setAccountType('student');
                                setSelectedUser(null);
                                setSearchTerm('');
                                setSearchType('name');
                                setStandardFilter('');
                                clearTableFilters();
                              }}
                              className="toggle-btn"
                            >
                              <FaUserGraduate className="me-2" />
                              Student Accounts
                            </Button>
                          </div>
                        </Col>
                      </Row>

                      {/* Search and Filters Section */}
                      <Card className="mb-4">
                        <Card.Header className="bg-light">
                          <h5 className="mb-0">
                            <FaSearch className="me-2" />
                            Search {accountType === 'teacher' ? 'Staff Member' : 'Student'}
                          </h5>
                        </Card.Header>
                        <Card.Body>
                          <Row className="g-3">
                            {/* Standard Filter for Students */}
                            {accountType === 'student' && (
                              <Col md={6}>
                                <Form.Group>
                                  <Form.Label>
                                    <FaFilter className="me-1" />
                                    Filter by Class
                                  </Form.Label>
                                  <Form.Select 
                                    value={standardFilter} 
                                    onChange={(e) => setStandardFilter(e.target.value)}
                                    className="py-2"
                                  >
                                    <option value="">All Classes</option>
                                    {availableStandards.map(standard => (
                                      <option key={standard} value={standard}>
                                        {standard}
                                      </option>
                                    ))}
                                  </Form.Select>
                                </Form.Group>
                              </Col>
                            )}
                            
                            {/* Search Type and Term */}
                            <Col md={accountType === 'student' ? 3 : 6}>
                              <Form.Group>
                                <Form.Label>Search By</Form.Label>
                                <Form.Select 
                                  value={searchType} 
                                  onChange={(e) => setSearchType(e.target.value)}
                                  className="py-2"
                                >
                                  {searchOptions[accountType].map(option => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            
                            <Col md={accountType === 'student' ? 3 : 6}>
                              <Form.Group>
                                <Form.Label>Search Term</Form.Label>
                                <div className="position-relative">
                                  <Form.Control
                                    type="text"
                                    placeholder={`Enter ${searchOptions[accountType].find(opt => opt.value === searchType)?.label}...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="py-2 pe-5"
                                  />
                                  <FaSearch className="position-absolute top-50 end-0 translate-middle-y me-3 text-muted" />
                                </div>
                              </Form.Group>
                            </Col>
                          </Row>

                          {/* Search Results */}
                          {searchTerm && filteredUsers.length > 0 && (
                            <div className="mt-3">
                              <Alert variant="info" className="py-2">
                                <strong>{filteredUsers.length} {accountType === 'teacher' ? 'staff members' : 'students'} found</strong> - Click to select one:
                              </Alert>
                              <div className="search-results-grid">
                                <Row>
                                  {filteredUsers.map(user => {
                                    const hasAccount = isUserHasAccount(user);
                                    return (
                                      <Col md={6} lg={4} key={user.id} className="mb-3">
                                        <Card 
                                          className={`h-100 ${hasAccount ? 'border-secondary' : 'border-primary cursor-pointer'} ${selectedUser?.id === user.id ? 'border-3' : ''}`}
                                          onClick={() => !hasAccount && handleUserSelect(user)}
                                          style={{ 
                                            cursor: hasAccount ? 'not-allowed' : 'pointer',
                                            opacity: hasAccount ? 0.7 : 1
                                          }}
                                        >
                                          <Card.Body className="p-3">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                              <h6 className="mb-0 text-truncate">{getDisplayName(user)}</h6>
                                              {hasAccount ? (
                                                <Badge bg="success">Account Exists</Badge>
                                              ) : (
                                                <Badge bg="primary">Select</Badge>
                                              )}
                                            </div>
                                            <p className="mb-1 small text-muted">
                                              <strong>{accountType === 'teacher' ? 'Staff Code' : 'Admission No'}:</strong> {getIdentifier(user)}
                                            </p>
                                            <p className="mb-0 small text-muted">
                                              <strong>{accountType === 'teacher' ? 'Designation' : 'Class'}:</strong> {getAdditionalInfo(user)}
                                            </p>
                                            <p className="mb-0 small text-muted">
                                              <strong>Standard:</strong> {getStandardInfo(user)}
                                            </p>
                                          </Card.Body>
                                        </Card>
                                      </Col>
                                    );
                                  })}
                                </Row>
                              </div>
                            </div>
                          )}

                          {searchTerm && filteredUsers.length === 0 && (
                            <Alert variant="info" className="text-center mt-3">
                              No {accountType === 'teacher' ? 'staff members' : 'students'} found matching your search.
                            </Alert>
                          )}

                          {/* Loading States */}
                          {(loading.staff && accountType === 'teacher') || (loading.students && accountType === 'student') ? (
                            <div className="text-center py-4">
                              <Spinner animation="border" variant="primary" />
                              <p className="mt-2">Loading {accountType === 'teacher' ? 'staff members' : 'students'}...</p>
                            </div>
                          ) : null}
                        </Card.Body>
                      </Card>

                      {/* Account Creation Form */}
                      <Card className="mb-4">
                        <Card.Header className="bg-light">
                          <h5 className="mb-0">
                            <FaUserPlus className="me-2" />
                            Create Account
                          </h5>
                        </Card.Header>
                        <Card.Body>
                          {selectedUser ? (
                            <Alert variant="success" className="mb-4">
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <h6 className="mb-2">{getDisplayName(selectedUser)}</h6>
                                  <p className="mb-1">
                                    <strong>{accountType === 'teacher' ? 'Staff Code' : 'Admission No'}:</strong> {getIdentifier(selectedUser)}
                                  </p>
                                  <p className="mb-1">
                                    <strong>{accountType === 'teacher' ? 'Designation' : 'Class'}:</strong> {getAdditionalInfo(selectedUser)}
                                  </p>
                                  <p className="mb-1">
                                    <strong>Standard:</strong> {getStandardInfo(selectedUser)}
                                  </p>
                                  <p className="mb-0">
                                    <strong>School Code:</strong> {schoolCode}
                                  </p>
                                </div>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => setSelectedUser(null)}
                                >
                                  <FaTimes />
                                </Button>
                              </div>
                            </Alert>
                          ) : (
                            <Alert variant="info">
                              Search and select a {accountType === 'teacher' ? 'staff member' : 'student'} above to create an account.
                            </Alert>
                          )}

                          <Form onSubmit={handleCreateAccount}>
                            <Row>
                              <Col md={4}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Username</Form.Label>
                                  <Form.Control
                                    type="text"
                                    placeholder="Enter username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={!selectedUser}
                                    required
                                  />
                                  <Form.Text className="text-muted">
                                    Username for login
                                  </Form.Text>
                                </Form.Group>
                              </Col>
                              <Col md={4}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Password</Form.Label>
                                  <Form.Control
                                    type="password"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={!selectedUser}
                                    minLength={6}
                                    required
                                  />
                                  <Form.Text className="text-muted">
                                    Min. 6 characters
                                  </Form.Text>
                                </Form.Group>
                              </Col>
                              <Col md={4}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Confirm Password</Form.Label>
                                  <Form.Control
                                    type="password"
                                    placeholder="Confirm password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={!selectedUser}
                                    required
                                  />
                                </Form.Group>
                              </Col>
                            </Row>

                            <div className="button-group mt-4">
                              <Button 
                                variant="primary"
                                type="submit"
                                className="px-4 py-2 me-3"
                                disabled={!selectedUser || loading.create || password !== confirmPassword}
                              >
                                {loading.create ? (
                                  <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Creating...
                                  </>
                                ) : (
                                  <>
                                    <FaUserPlus className="me-2" />
                                    Create Account
                                  </>
                                )}
                              </Button>
                              <Button 
                                variant="danger" 
                                type="button"
                                className="px-4 py-2 me-3"
                                onClick={handleReset}
                                disabled={loading.create}
                              >
                                Reset
                              </Button>
                              <Button 
                                variant="secondary" 
                                type="button"
                                className="px-4 py-2"
                                onClick={handleCancel}
                                disabled={loading.create}
                              >
                                Cancel
                              </Button>
                            </div>
                          </Form>
                        </Card.Body>
                      </Card>

                      {/* Existing Accounts Table */}
                      <Card>
                        <Card.Header className="bg-light">
                          <div className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Existing {accountType === 'teacher' ? 'Teacher' : 'Student'} Accounts</h5>
                            <div className="d-flex align-items-center">
                              <Badge bg="success" pill className="me-3">
                                {accountCount} Accounts
                              </Badge>
                              {isAnyTableFilterActive && (
                                <Button 
                                  variant="outline-danger" 
                                  size="sm" 
                                  onClick={clearTableFilters}
                                >
                                  Clear Filters
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          {/* Table Filters */}
                          <Row className="mb-3 g-2">
                            <Col md={3}>
                              <Form.Group>
                                <Form.Label className="small">Search Table</Form.Label>
                                <Form.Control
                                  type="text"
                                  placeholder="Search accounts..."
                                  value={tableFilters.search}
                                  onChange={(e) => handleTableFilterChange('search', e.target.value)}
                                  size="sm"
                                />
                              </Form.Group>
                            </Col>
                            
                            {accountType === 'student' ? (
                              <>
                                <Col md={3}>
                                  <Form.Group>
                                    <Form.Label className="small">Filter by Class</Form.Label>
                                    <Form.Select
                                      value={tableFilters.standard}
                                      onChange={(e) => handleTableFilterChange('standard', e.target.value)}
                                      size="sm"
                                    >
                                      <option value="">All Classes</option>
                                      {availableStandards.map(standard => (
                                        <option key={standard} value={standard}>
                                          {standard}
                                        </option>
                                      ))}
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                                <Col md={3}>
                                  <Form.Group>
                                    <Form.Label className="small">Filter by Section</Form.Label>
                                    <Form.Select
                                      value={tableFilters.section}
                                      onChange={(e) => handleTableFilterChange('section', e.target.value)}
                                      size="sm"
                                    >
                                      <option value="">All Sections</option>
                                      {availableSections.map(section => (
                                        <option key={section} value={section}>
                                          {section}
                                        </option>
                                      ))}
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                              </>
                            ) : (
                              <>
                                <Col md={3}>
                                  <Form.Group>
                                    <Form.Label className="small">Filter by Class Incharge</Form.Label>
                                    <Form.Select
                                      value={tableFilters.classInCharge}
                                      onChange={(e) => handleTableFilterChange('classInCharge', e.target.value)}
                                      size="sm"
                                    >
                                      <option value="">All Class Incharge</option>
                                      {availableClassInCharge.map(classInCharge => (
                                        <option key={classInCharge} value={classInCharge}>
                                          {classInCharge}
                                        </option>
                                      ))}
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                                <Col md={3}>
                                  <Form.Group>
                                    <Form.Label className="small">Filter by Designation</Form.Label>
                                    <Form.Select
                                      value={tableFilters.designation}
                                      onChange={(e) => handleTableFilterChange('designation', e.target.value)}
                                      size="sm"
                                    >
                                      <option value="">All Designations</option>
                                      {availableDesignations.map(designation => (
                                        <option key={designation} value={designation}>
                                          {designation}
                                        </option>
                                      ))}
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                              </>
                            )}
                          </Row>

                          {loading.accounts ? (
                            <div className="text-center py-4">
                              <Spinner animation="border" variant="primary" />
                              <p className="mt-2">Loading accounts...</p>
                            </div>
                          ) : accountCount === 0 ? (
                            <Alert variant="info" className="text-center">
                              No {accountType === 'teacher' ? 'teacher' : 'student'} accounts {isAnyTableFilterActive ? 'match your filters' : 'created yet'}.
                            </Alert>
                          ) : (
                            <div className="table-responsive">
                              <Table striped bordered hover>
                                <thead className="table-dark">
                                  <tr>
                                    <th 
                                      style={{ cursor: 'pointer', minWidth: '120px' }}
                                      onClick={() => handleTableSort('username')}
                                    >
                                      <div className="d-flex align-items-center justify-content-between">
                                        Username
                                        {getSortIcon('username')}
                                      </div>
                                    </th>
                                    <th 
                                      style={{ cursor: 'pointer', minWidth: '150px' }}
                                      onClick={() => handleTableSort('name')}
                                    >
                                      <div className="d-flex align-items-center justify-content-between">
                                        Name
                                        {getSortIcon('name')}
                                      </div>
                                    </th>
                                    <th 
                                      style={{ cursor: 'pointer', minWidth: '120px' }}
                                      onClick={() => handleTableSort('identifier')}
                                    >
                                      <div className="d-flex align-items-center justify-content-between">
                                        {accountType === 'teacher' ? 'Staff Code' : 'Admission No'}
                                        {getSortIcon('identifier')}
                                      </div>
                                    </th>
                                    {accountType === 'student' && (
                                      <th 
                                        style={{ cursor: 'pointer', minWidth: '120px' }}
                                        onClick={() => handleTableSort('class')}
                                      >
                                        <div className="d-flex align-items-center justify-content-between">
                                          Class - Section
                                          {getSortIcon('class')}
                                        </div>
                                      </th>
                                    )}
                                    {accountType === 'teacher' && (
                                      <th 
                                        style={{ cursor: 'pointer', minWidth: '120px' }}
                                        onClick={() => handleTableSort('class')}
                                      >
                                        <div className="d-flex align-items-center justify-content-between">
                                          Class Incharge
                                          {getSortIcon('class')}
                                        </div>
                                      </th>
                                    )}
                                    <th width="120">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredAndSortedAccounts.map(account => (
                                    <tr key={account.id}>
                                      <td>
                                        <Badge bg="primary">{account.username}</Badge>
                                      </td>
                                      <td>{account.userDetails?.name || 'N/A'}</td>
                                      <td>
                                        {accountType === 'teacher' 
                                          ? (account.userDetails?.staffId || 'N/A')
                                          : (account.userDetails?.admissionNo || 'N/A')
                                        }
                                      </td>
                                      {accountType === 'student' && (
                                        <td>
                                          {account.userDetails?.class && account.userDetails?.section 
                                            ? `${account.userDetails.class} - ${account.userDetails.section}`
                                            : 'N/A'
                                          }
                                        </td>
                                      )}
                                      {accountType === 'teacher' && (
                                        <td>
                                          <small className="text-muted">
                                            {account.userDetails?.classInCharge || 'Not Assigned'}
                                          </small>
                                        </td>
                                      )}
                                      <td>
                                        <div className="d-flex justify-content-center gap-2">
                                          <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => handleEditAccount(account)}
                                            title="Edit Password"
                                            className="action-btn"
                                          >
                                            <FaEdit />
                                          </Button>
                                          <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleDeleteAccount(account)}
                                            title="Delete Account"
                                            className="action-btn"
                                          >
                                            <FaTrash />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Edit Account Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Account Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {accountToEdit && (
            <>
              <Alert variant="info" className="mb-3">
                <strong>Username:</strong> {accountToEdit.username}<br />
                <strong>Name:</strong> {accountToEdit.userDetails?.name || 'N/A'}<br />
                <strong>Role:</strong> {accountToEdit.role}<br />
                <strong>{accountToEdit.role === 'TEACHER' ? 'Class Incharge' : 'Class - Section'}:</strong> {accountToEdit.role === 'TEACHER' 
                  ? (accountToEdit.userDetails?.classInCharge || 'Not Assigned')
                  : (accountToEdit.userDetails?.class && accountToEdit.userDetails?.section 
                      ? `${accountToEdit.userDetails.class} - ${accountToEdit.userDetails.section}`
                      : 'N/A'
                    )
                }
              </Alert>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter new password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    minLength={6}
                  />
                  <Form.Text className="text-muted">
                    Leave blank to keep current password
                  </Form.Text>
                </Form.Group>
                {editPassword && (
                  <Form.Group className="mb-3">
                    <Form.Label>Confirm New Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Confirm new password"
                      value={editConfirmPassword}
                      onChange={(e) => setEditConfirmPassword(e.target.value)}
                    />
                  </Form.Group>
                )}
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateAccount}
            disabled={loading.edit || (editPassword && editPassword !== editConfirmPassword)}
          >
            {loading.edit ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Updating...
              </>
            ) : (
              'Update Password'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Account Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {accountToDelete && (
            <Alert variant="warning">
              <h6>Are you sure you want to delete this account?</h6>
              <p className="mb-0">
                <strong>Username:</strong> {accountToDelete.username}<br />
                <strong>Name:</strong> {accountToDelete.userDetails?.name || 'N/A'}<br />
                <strong>Role:</strong> {accountToDelete.role}<br />
                <strong>{accountToDelete.role === 'TEACHER' ? 'Class Incharge' : 'Class - Section'}:</strong> {accountToDelete.role === 'TEACHER' 
                  ? (accountToDelete.userDetails?.classInCharge || 'Not Assigned')
                  : (accountToDelete.userDetails?.class && accountToDelete.userDetails?.section 
                      ? `${accountToDelete.userDetails.class} - ${accountToDelete.userDetails.section}`
                      : 'N/A'
                    )
                }
              </p>
              <p className="mt-2 mb-0 text-danger">
                <small>This action will permanently delete the account from the database and cannot be undone.</small>
              </p>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleConfirmDelete}
            disabled={loading.delete}
          >
            {loading.delete ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              'Delete Account'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer />

      <style>
        {`
          .password-setup-container {
            min-height: 100vh;
          }

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

          .form-card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
          }

          .header {
            background-color: #0B3D7B;
            color: white;
          }

          .account-type-toggle {
            display: flex;
            justify-content: center;
            gap: 1rem;
          }

          .toggle-btn {
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            font-weight: 500;
            transition: all 0.3s ease;
          }

          .toggle-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          }

          .search-results-grid .card {
            transition: all 0.3s ease;
          }

          .search-results-grid .card:hover:not(.border-secondary) {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
          }

          .cursor-pointer {
            cursor: pointer;
          }

          .button-group {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
          }

          .action-btn {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: all 0.2s ease;
          }

          .action-btn:hover {
            transform: scale(1.1);
          }

          /* Table header sort styling */
          .table-dark th {
            cursor: pointer;
            user-select: none;
          }

          .table-dark th:hover {
            background-color: #2c3e50 !important;
          }

          /* Responsive styles */
          @media (max-width: 991.98px) {
            .account-type-toggle {
              flex-direction: column;
              align-items: center;
            }
            
            .toggle-btn {
              width: 100%;
              margin-bottom: 0.5rem;
            }

            .button-group {
              flex-direction: column;
            }

            .button-group .btn {
              width: 100%;
            }

            .table-filters .col-md-3 {
              margin-bottom: 1rem;
            }
          }

          @media (max-width: 767.98px) {
            .content-wrapper {
              padding: 1rem !important;
            }

            .search-results-grid .col-md-6 {
              margin-bottom: 1rem;
            }

            .action-btn {
              width: 32px;
              height: 32px;
            }

            .table-responsive {
              font-size: 0.875rem;
            }
          }

          /* Toastify custom styles */
          .Toastify__toast-container {
            z-index: 9999;
          }

          .Toastify__toast {
            background-color: #0B3D7B;
            color: white;
          }

          .Toastify__toast--success {
            background-color: #0B3D7B;
          }

          .Toastify__toast--error {
            background-color: #dc3545;
          }

          .Toastify__progress-bar {
            background-color: rgba(255, 255, 255, 0.7);
          }
        `}
      </style>
    </MainContentPage>
  );
};

export default PasswordSetup;