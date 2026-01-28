"use client"

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import MainContentPage from "../../components/MainContent/MainContentPage";
import { Button, Card, Row, Col, Table, Form, InputGroup, Badge, Spinner } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuthContext } from "../../Context/AuthContext";
import { ENDPOINTS } from "../../SpringBoot/config";
import * as XLSX from 'xlsx';
import jsPDF from "jspdf";
import "jspdf-autotable";
import { 
  FaSearch, 
  FaFileExcel, 
  FaFilePdf, 
  FaPrint, 
  FaFilter, 
  FaSync,
  FaFileAlt
} from "react-icons/fa";

const CertificateManagement = () => {
  const { schoolId, currentAcademicYear, getAuthHeaders } = useAuthContext();
  
  // ================= STATE =================
  const [loadingSchool, setLoadingSchool] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);
  
  // Data States
  const [schoolDetails, setSchoolDetails] = useState({
    schoolName: "", schoolAddress: "", city: "", state: "", pincode: ""
  });
  const [tcList, setTcList] = useState([]);
  const [standards, setStandards] = useState([]);
  const [sections, setSections] = useState([]);

  // Filter States
  const [filters, setFilters] = useState({
    standard: "",
    section: "",
    search: "",
    studentType: "" 
  });

  // ================= FETCH LOGIC =================

  // 1. Fetch School Details
  const fetchSchoolDetails = async () => {
    if (!schoolId) return;
    try {
      setLoadingSchool(true);
      const response = await fetch(
        `${ENDPOINTS.admissionmaster}/school/school-details?schoolId=${schoolId}`,
        { headers: getAuthHeaders() }
      );
      if (response.ok) {
        const data = await response.json();
        setSchoolDetails(data || {});
      }
    } catch (error) {
      console.error("Error fetching school details:", error);
    } finally {
      setLoadingSchool(false);
    }
  };

  // 2. Fetch Dropdowns (Standards)
  const fetchDropdowns = async () => {
    try {
      const res = await fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/courses?schoolId=${schoolId}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        // Handle various response formats (array of strings or objects)
        const stds = Array.isArray(data) ? data.map(item => typeof item === 'object' ? item.standard || item.value : item) : [];
        setStandards(stds);
      }
    } catch (e) { console.error(e); }
  };

  // 3. Fetch Sections when Standard changes
  useEffect(() => {
    const fetchSections = async () => {
      if (!filters.standard) {
        setSections([]);
        return;
      }
      try {
        const res = await fetch(`${ENDPOINTS.admissionmaster}/amdropdowns/sections?schoolId=${schoolId}`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          const secs = Array.isArray(data) ? data.map(item => typeof item === 'object' ? item.section || item.value : item) : [];
          setSections(secs);
        }
      } catch (e) { console.error(e); }
    };
    fetchSections();
  }, [filters.standard, schoolId, getAuthHeaders]);

  // 4. Fetch TC List Table Data
  const fetchTCList = useCallback(async () => {
    if (!schoolId || !currentAcademicYear) return;
    
    setLoadingTable(true);
    try {
      // Construct Query Params
      const params = new URLSearchParams({
        schoolId,
        academicYear: currentAcademicYear,
        standard: filters.standard,
        section: filters.section,
        search: filters.search
      });

      const response = await fetch(
        `${ENDPOINTS.tc}/list?${params.toString()}`,
        { headers: getAuthHeaders() }
      );

      if (response.ok) {
        const data = await response.json();
        // Ensure data is array
        setTcList(Array.isArray(data) ? data : []);
      } else {
        // If table doesn't exist yet (400/404), just set empty list, don't error
        setTcList([]);
      }
    } catch (error) {
      console.error("Error fetching TC list:", error);
      toast.error("Network error loading TCs");
    } finally {
      setLoadingTable(false);
    }
  }, [schoolId, currentAcademicYear, filters, getAuthHeaders]);

  // Initial Load
  useEffect(() => {
    if (schoolId) {
      fetchSchoolDetails();
      fetchDropdowns();
      fetchTCList();
    }
  }, [schoolId, fetchTCList]);

  // ================= HANDLERS =================

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    // If standard changes, section resets automatically via logic
    if (name === 'standard') setFilters(prev => ({ ...prev, standard: value, section: "" }));
  };

  // EXPORT TO EXCEL
  const handleExportExcel = () => {
    if (tcList.length === 0) return toast.warning("No data to export");

    const worksheet = XLSX.utils.json_to_sheet(tcList.map(item => ({
      "TC Number": item.tcNumber,
      "Admission No": item.admissionNumber,
      "Student Name": item.studentName,
      "Standard": item.standard,
      "Section": item.section,
      "Date Left": item.dateOfLeaving,
      "Issue Date": item.issueDate,
      "Fee Status": item.feeStatus
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TC_Report");
    XLSX.writeFile(workbook, `TC_Report_${currentAcademicYear}.xlsx`);
  };

  // EXPORT TO PDF
  const handleExportPDF = () => {
    if (tcList.length === 0) return toast.warning("No data to export");

    const doc = new jsPDF();
    doc.text(`TC Issued Report - ${schoolDetails.schoolName}`, 14, 15);
    doc.text(`Academic Year: ${currentAcademicYear}`, 14, 22);

    const tableColumn = ["TC No", "Adm No", "Student Name", "Class", "Issue Date", "Status"];
    const tableRows = [];

    tcList.forEach(item => {
      const row = [
        item.tcNumber,
        item.admissionNumber,
        item.studentName,
        `${item.standard || ''} - ${item.section || ''}`,
        item.issueDate,
        item.feeStatus
      ];
      tableRows.push(row);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });

    doc.save(`TC_Report_${currentAcademicYear}.pdf`);
  };

  // ================= RENDER =================

  return (
    <MainContentPage>
      <div className="container-fluid px-4 py-3">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <h4 className="fw-bold text-primary">Certificates & School Management</h4>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="mb-4">
          <nav className="d-flex custom-breadcrumb py-2 px-3 rounded shadow-sm">
            <Link to="/home" className="text-decoration-none fw-bold">Home</Link>
            <span className="separator mx-2 text-muted">/</span>
            <div className="text-muted">Transaction</div>
            <span className="separator mx-2 text-muted">/</span>
            <span className="text-primary fw-bold">Certificate Management</span>
          </nav>
        </div>

        {/* School Details Card */}
        <div className="row mb-4">
          <div className="col-12">
            <Card className="shadow-sm border-0 border-top border-4 border-primary">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="card-title mb-0 fw-bold text-dark">School Profile</h5>
                  <Badge bg="info">View Only</Badge>
                </div>
                
                {loadingSchool ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" variant="primary" size="sm" /> Loading...
                  </div>
                ) : (
                  <Row className="small">
                    <Col md={6}>
                      <p className="mb-1"><strong>Name:</strong> {schoolDetails.schoolName || "N/A"}</p>
                      <p className="mb-1"><strong>Address:</strong> {schoolDetails.schoolAddress || "N/A"}</p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-1"><strong>City/State:</strong> {schoolDetails.city}, {schoolDetails.state}</p>
                      <p className="mb-1"><strong>Pincode:</strong> {schoolDetails.pincode}</p>
                    </Col>
                  </Row>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* Certificate Generation Shortcuts - ALL 3 TYPES */}
        <h6 className="fw-bold text-secondary mb-3">Generate New Certificates</h6>
        <div className="row g-4 mb-5">
          <Link style={{ textDecoration: "none" }} className="col-12 col-md-6 col-lg-3" to="/admission/tenth-certificate">
            <div className="card fee-setup-card h-100 shadow-sm text-white bg-primary">
              <div className="card-body d-flex flex-column align-items-center justify-content-center p-4">
                <FaFileAlt size={40} className="mb-3 opacity-75" />
                <h5 className="card-title m-0">TN State Board TC</h5>
                <small className="opacity-75">Standard Format</small>
              </div>
            </div>
          </Link>

          <Link style={{ textDecoration: "none" }} className="col-12 col-md-6 col-lg-3" to="/admission/cbse-certificate-1">
            <div className="card fee-setup-card h-100 shadow-sm text-white bg-success">
              <div className="card-body d-flex flex-column align-items-center justify-content-center p-4">
                <FaFilePdf size={40} className="mb-3 opacity-75" />
                <h5 className="card-title m-0">CBSE Format 1</h5>
                <small className="opacity-75">Layout Option A</small>
              </div>
            </div>
          </Link>

          <Link style={{ textDecoration: "none" }} className="col-12 col-md-6 col-lg-3" to="/admission/cbse-certificate-2">
            <div className="card fee-setup-card h-100 shadow-sm text-white bg-teal" style={{backgroundColor: '#20c997'}}>
              <div className="card-body d-flex flex-column align-items-center justify-content-center p-4">
                <FaFilePdf size={40} className="mb-3 opacity-75" />
                <h5 className="card-title m-0">CBSE Format 2</h5>
                <small className="opacity-75">Layout Option B</small>
              </div>
            </div>
          </Link>
        </div>

        {/* === TC LIST TABLE === */}
        <div className="row mb-4">
          <div className="col-12">
            <Card className="shadow border-0">
              <Card.Header className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div className="d-flex align-items-center">
                  <FaFilter className="text-primary me-2" />
                  <h5 className="mb-0 fw-bold text-primary">Issued Certificates Log</h5>
                </div>
                
                {/* Export Buttons */}
                <div className="btn-group">
                  <Button variant="outline-success" size="sm" onClick={handleExportExcel} title="Export Excel">
                    <FaFileExcel className="me-1"/> Excel
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={handleExportPDF} title="Export PDF">
                    <FaFilePdf className="me-1"/> PDF
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => window.print()} title="Print List">
                    <FaPrint className="me-1"/> Print
                  </Button>
                </div>
              </Card.Header>

              <Card.Body className="bg-light">
                {/* Filters Row */}
                <Row className="g-3 mb-4">
                  <Col md={3}>
                    <Form.Label className="small fw-bold text-muted">Standard</Form.Label>
                    <Form.Select 
                      size="sm" 
                      name="standard" 
                      value={filters.standard} 
                      onChange={handleFilterChange}
                    >
                      <option value="">All Standards</option>
                      {standards.map((s, i) => <option key={i} value={s}>{s}</option>)}
                    </Form.Select>
                  </Col>
                  
                  <Col md={3}>
                    <Form.Label className="small fw-bold text-muted">Section</Form.Label>
                    <Form.Select 
                      size="sm" 
                      name="section" 
                      value={filters.section} 
                      onChange={handleFilterChange}
                      disabled={!filters.standard}
                    >
                      <option value="">All Sections</option>
                      {sections.map((s, i) => <option key={i} value={s}>{s}</option>)}
                    </Form.Select>
                  </Col>

                  <Col md={2}>
                    <Form.Label className="small fw-bold text-muted">Student Type</Form.Label>
                    <Form.Select 
                      size="sm" 
                      name="studentType" 
                      value={filters.studentType} 
                      onChange={handleFilterChange}
                    >
                      <option value="">All Types</option>
                      <option value="Day Scholar">Day Scholar</option>
                      <option value="Hosteller">Hosteller</option>
                    </Form.Select>
                  </Col>

                  <Col md={3}>
                    <Form.Label className="small fw-bold text-muted">Search (Name/Adm/TC)</Form.Label>
                    <InputGroup size="sm">
                      <InputGroup.Text><FaSearch /></InputGroup.Text>
                      <Form.Control 
                        type="text" 
                        name="search" 
                        value={filters.search} 
                        onChange={handleFilterChange} 
                        placeholder="Search..." 
                      />
                    </InputGroup>
                  </Col>

                  <Col md={1} className="d-flex align-items-end">
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="w-100" 
                      onClick={fetchTCList}
                      disabled={loadingTable}
                    >
                      {loadingTable ? <Spinner size="sm" /> : <FaSync />}
                    </Button>
                  </Col>
                </Row>

                {/* Data Table */}
                <div className="table-responsive bg-white rounded border">
                  <Table hover striped className="mb-0 align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th className="py-3 ps-3">TC Number</th>
                        <th className="py-3">Adm No</th>
                        <th className="py-3">Student Name</th>
                        <th className="py-3">Standard</th>
                        <th className="py-3">Issued Date</th>
                        <th className="py-3">Status</th>
                        {/* Action Column Removed */}
                      </tr>
                    </thead>
                    <tbody>
                      {loadingTable ? (
                        <tr>
                          <td colSpan="6" className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2 text-muted small">Loading records...</p>
                          </td>
                        </tr>
                      ) : tcList.length > 0 ? (
                        tcList.map((tc, index) => (
                          <tr key={index}>
                            <td className="ps-3 fw-bold text-primary">{tc.tcNumber}</td>
                            <td>{tc.admissionNumber}</td>
                            <td className="fw-medium">{tc.studentName}</td>
                            {/* Fixed Standard Display */}
                            <td>
                                <Badge bg="secondary">
                                    {tc.standard || 'N/A'} {tc.section ? `- ${tc.section}` : ''}
                                </Badge>
                            </td>
                            <td>{tc.issueDate}</td>
                            <td>
                              <Badge bg={tc.feeStatus === 'Cleared' ? 'success' : 'warning'}>
                                {tc.feeStatus}
                              </Badge>
                            </td>
                            {/* Action Button Removed */}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-5 text-muted">
                            No Transfer Certificates found matching criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
                <div className="d-flex justify-content-between align-items-center mt-3">
                   <small className="text-muted">Showing {tcList.length} records</small>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>

      </div>
      <ToastContainer />

      <style>
        {`
          .fee-setup-card {
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
            border: none;
          }
          .fee-setup-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
          }
          .custom-breadcrumb {
            background-color: #ffffff;
            border-left: 4px solid #007bff;
          }
          .separator {
            font-size: 0.8rem;
          }
          /* Hide print buttons when printing */
          @media print {
            .btn-group, .card-header button { display: none !important; }
          }
        `}
      </style>
    </MainContentPage>
  );
};

export default CertificateManagement;