"use client";

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import MainContentPage from "../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container, Table, Card, Spinner, Tab, Tabs, Dropdown, ListGroup, Modal } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaTrash, FaPlus, FaCalendarAlt, FaFilePdf, FaFileExcel, FaCheckSquare, FaSquare, FaSearch, FaEdit, FaExclamationTriangle, FaSave, FaTimes } from "react-icons/fa";
import { useAuthContext } from "../../Context/AuthContext";
import { ENDPOINTS } from "../../SpringBoot/config";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const BookSetupClassWise = () => {
  const { user, currentAcademicYear } = useAuthContext();
  
  // --- Data States ---
  const [standards, setStandards] = useState([]); 
  const [books, setBooks] = useState([]);         
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("entry");

  // --- Entry Form States ---
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStandards, setSelectedStandards] = useState([]); 
  
  // --- Searchable Book States ---
  const [bookSearchTerm, setBookSearchTerm] = useState("");
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [selectedBookName, setSelectedBookName] = useState("");
  const bookDropdownRef = useRef(null);

  // --- Input States ---
  const [enableAmount, setEnableAmount] = useState(false); // Amount Toggle
  const [enteredAmount, setEnteredAmount] = useState(""); 
  const [enteredNos, setEnteredNos] = useState("");
  const [addedBooks, setAddedBooks] = useState([]); 

  // --- Report States ---
  const [reportData, setReportData] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); 

  // --- Inline Edit States ---
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    bookId: "",
    amount: "",
    quantity: ""
  });

  // --- Confirmation Modal State (Only for Delete Actions) ---
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    if (user && currentAcademicYear) {
      fetchDependencies();
      fetchReportData();
    }
  }, [user, currentAcademicYear]);

  // Handle clicking outside the book dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bookDropdownRef.current && !bookDropdownRef.current.contains(event.target)) {
        setShowBookDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- API CALLS ---
  const fetchDependencies = async () => {
    try {
      const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
      const params = { schoolId: user.uid, year: currentAcademicYear };
      
      const coursesRes = await axios.get(`${ENDPOINTS.administration}/courses`, { params, headers });
      setStandards(coursesRes.data || []);

      const booksRes = await axios.get(`${ENDPOINTS.store}/books`, { params, headers });
      setBooks(booksRes.data || []);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  const fetchReportData = async (dateOverride = null) => {
    setLoading(true);
    const queryDate = dateOverride !== null ? dateOverride : filterDate;
    try {
      const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
      const params = { schoolId: user.uid, year: currentAcademicYear, date: queryDate || null };
      
      const res = await axios.get(`${ENDPOINTS.store}/book-setup-classes`, { params, headers });
      setReportData(res.data || []);
    } catch (err) {
      console.error("Error loading report:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- HELPER: Trigger Confirmation Modal ---
  const triggerConfirm = (message, action) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (confirmAction) confirmAction();
    setShowConfirm(false);
  };

  // --- FORM LOGIC ---
  const toggleStandard = (stdName) => {
    if (selectedStandards.includes(stdName)) {
        setSelectedStandards(selectedStandards.filter(s => s !== stdName));
    } else {
        setSelectedStandards([...selectedStandards, stdName]);
    }
  };

  const handleBookSearchChange = (e) => {
    setBookSearchTerm(e.target.value);
    setShowBookDropdown(true);
    // Reset ID if user types manually to allow custom names or force re-selection
    if (selectedBookId) {
      setSelectedBookId("");
      setSelectedBookName("");
    }
  };

  const selectBook = (book) => {
    setBookSearchTerm(book.bookName);
    setSelectedBookId(book.id);
    setSelectedBookName(book.bookName);
    setShowBookDropdown(false);
  };

  const filteredBooks = books.filter(b => 
    b.bookName.toLowerCase().includes(bookSearchTerm.toLowerCase())
  );

  // --- ENTRY ACTIONS ---
  const handleEnter = () => {
    if (selectedStandards.length === 0) return toast.warning("Please select at least one Standard.");
    
    // We allow bookSearchTerm to be the name even if no ID selected (allows free text if needed, or enforces selection)
    // For consistency with backend requirement of "Book Name", we use the name.
    const finalBookName = selectedBookName || bookSearchTerm;

    if (!finalBookName || !enteredNos) return toast.warning("Please select Book and enter No(s).");
    if (enableAmount && !enteredAmount) return toast.warning("Please enter Amount.");

    const exists = addedBooks.some(item => item.bookId === finalBookName);
    if(exists) return toast.warning("This book is already added.");

    const newEntry = {
      id: Date.now(),
      bookId: finalBookName, // This Name will be the Item Name and used for Item Code generation
      amount: enableAmount ? parseFloat(enteredAmount) : 0, 
      quantity: parseInt(enteredNos, 10)
    };

    setAddedBooks([...addedBooks, newEntry]);
    
    // Reset inputs
    setBookSearchTerm("");
    setSelectedBookId("");
    setSelectedBookName("");
    setEnteredAmount("");
    setEnteredNos("");
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      handleEnter();
    }
  };

  const handleRemoveEntry = (id) => {
    setAddedBooks(addedBooks.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    if (selectedStandards.length === 0 || addedBooks.length === 0) {
      toast.warning("Please select standards and add books.");
      return;
    }

    // Payload: bookId here is actually the Name string
    const payload = {
      standards: selectedStandards,
      entryDate: entryDate,
      books: addedBooks.map(b => ({
        bookId: b.bookId, 
        quantity: b.quantity,
        amount: b.amount 
      })),
      academicYear: currentAcademicYear
    };

    try {
      await axios.post(`${ENDPOINTS.store}/book-setup-classes`, payload, {
        params: { schoolId: user.uid, year: currentAcademicYear },
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
      });
      
      toast.success(`Setup Saved for ${selectedStandards.length} Standards!`);
      setAddedBooks([]);
      setSelectedStandards([]);
      setBookSearchTerm("");
      fetchReportData(); 
    } catch (err) {
      console.error("Error saving:", err);
      toast.error("Failed to save.");
    }
  };

  // --- REPORT ACTIONS ---
  const performDeleteReportItem = async (id) => {
      try {
          await axios.delete(`${ENDPOINTS.store}/book-setup-classes/${id}`, {
              params: { schoolId: user.uid },
              headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
          });
          toast.success("Record deleted successfully.");
          fetchReportData(); 
      } catch (err) {
          toast.error("Failed to delete record.");
      }
  };

  const handleDeleteReportItem = (id) => {
      triggerConfirm("Are you sure you want to permanently delete this record?", () => performDeleteReportItem(id));
  };

  // --- INLINE EDIT FUNCTIONS ---
  const handleEditClick = (item) => {
    setEditingId(item.id);
    setEditForm({
      bookId: item.bookId,
      amount: item.amount ? item.amount.toString() : "0",
      quantity: item.quantity ? item.quantity.toString() : "1"
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({
      bookId: "",
      amount: "",
      quantity: ""
    });
  };

  const handleSaveEdit = async (item) => {
    if (!editForm.bookId || !editForm.quantity) {
      toast.warning("Book name and quantity are required.");
      return;
    }

    const updatedItem = {
      ...item,
      bookId: editForm.bookId,
      amount: parseFloat(editForm.amount) || 0,
      quantity: parseInt(editForm.quantity, 10),
      academicYear: currentAcademicYear
    };

    try {
      const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
      await axios.put(`${ENDPOINTS.store}/book-setup-classes/${item.id}`, updatedItem, {
        params: { schoolId: user.uid },
        headers
      });

      toast.success("Record updated successfully.");
      setEditingId(null);
      fetchReportData(); 
    } catch (err) {
      console.error("Error updating record:", err);
      toast.error("Failed to update record.");
    }
  };

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // --- REPORT GROUPING ---
  const getGroupedReport = () => {
    const grouped = {};
    
    reportData.forEach(item => {
      const key = `${item.entryDate}-${item.standard}`; 
      if (!grouped[key]) {
        grouped[key] = {
          date: item.entryDate,
          standard: item.standard,
          totalQuantity: 0,
          totalAmount: 0, 
          details: []
        };
      }
      grouped[key].details.push(item);
      grouped[key].totalQuantity += item.quantity || 0;
      grouped[key].totalAmount += (item.amount * item.quantity) || 0; 
    });

    return Object.values(grouped).sort((a, b) => {
        if(a.date !== b.date) return new Date(b.date) - new Date(a.date);
        return a.standard.localeCompare(b.standard, undefined, { numeric: true });
    });
  };

  const groupedReport = getGroupedReport();

  // --- PDF & EXCEL ---
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Book Setup Report", 14, 15);
    let finalY = 25;

    groupedReport.forEach((group) => {
        const tableBody = group.details.map(detail => [detail.bookId, detail.amount.toFixed(2), detail.quantity]);
        tableBody.push([
            { content: "Total:", styles: { fontStyle: 'bold', halign: 'right' } },
            { content: group.totalAmount.toFixed(2), styles: { fontStyle: 'bold' } }, 
            { content: group.totalQuantity, styles: { fontStyle: 'bold' } }
        ]);

        doc.setFontSize(12);
        doc.setTextColor(11, 61, 123);
        doc.text(`Standard: ${group.standard} | Date: ${group.date}`, 14, finalY + 10);
        
        autoTable(doc, {
            startY: finalY + 15,
            head: [['Subject / Item Name', 'Amount', 'No(s)']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [11, 61, 123] },
            margin: { top: 10 },
        });
        finalY = doc.lastAutoTable.finalY; 
    });
    doc.save(`book_setup_report.pdf`);
  };

  const exportExcel = () => {
    const flatData = [];
    groupedReport.forEach(group => {
        group.details.forEach(detail => {
            flatData.push({
                "Entry Date": group.date,
                "Standard": group.standard,
                "Item": detail.bookId,
                "Amount": detail.amount,
                "No(s)": detail.quantity
            });
        });
        flatData.push({ "Item": `TOTAL`, "Amount": group.totalAmount, "No(s)": group.totalQuantity });
        flatData.push({}); 
    });
    const ws = XLSX.utils.json_to_sheet(flatData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `book_setup_report.xlsx`);
  };

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        
        {/* CONFIRMATION MODAL */}
        <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
            <Modal.Header closeButton className="bg-warning text-dark">
                <Modal.Title><FaExclamationTriangle className="me-2"/> Confirm Action</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center py-4 fs-5">
                {confirmMessage}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowConfirm(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
            </Modal.Footer>
        </Modal>

        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link> <span className="separator">&gt;</span> <span>Store</span> <span className="separator">&gt;</span> <span className="current">Book Setup Class Wise</span>
        </nav>

        <div className="form-card mt-3">
          <div className="header p-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: "#0B3D7B", color: "white" }}>
            <h2 className="m-0">Book Setup Class Wise</h2>
          </div>

          <div className="p-4">
            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4 custom-tabs">
              
              {/* === TAB 1: ENTRY FORM === */}
              <Tab eventKey="entry" title="Entry">
                <Row className="mb-4">
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="fw-bold">Entry Date</Form.Label>
                      <Form.Control type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
                    </Form.Group>
                  </Col>
                  
                  {/* MULTI-SELECT STANDARDS */}
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-bold">Select Standards (Multi-Select)</Form.Label>
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-secondary" className="w-100 d-flex justify-content-between align-items-center bg-white text-dark border-secondary">
                          {selectedStandards.length > 0 ? `${selectedStandards.length} Selected` : "-- Select Standards --"}
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="w-100" style={{maxHeight: '300px', overflowY: 'auto'}}>
                            {standards.map((std) => {
                                const val = std.standard || std.name;
                                const isChecked = selectedStandards.includes(val);
                                return (
                                    <Dropdown.Item key={std.id} onClick={(e) => { e.preventDefault(); toggleStandard(val); }}>
                                        <div className="d-flex align-items-center">
                                            {isChecked ? <FaCheckSquare className="text-primary me-2"/> : <FaSquare className="text-secondary me-2"/>}
                                            {val}
                                        </div>
                                    </Dropdown.Item>
                                );
                            })}
                        </Dropdown.Menu>
                      </Dropdown>
                      <div className="mt-1 d-flex flex-wrap gap-1">
                        {selectedStandards.map(s => (
                            <span key={s} className="badge bg-info text-dark">{s}</span>
                        ))}
                      </div>
                    </Form.Group>
                  </Col>
                </Row>

                <Card className="p-3 bg-light border-0 mb-3" style={{overflow: 'visible'}}>
                  <Row className="align-items-end">
                    
                    {/* SEARCHABLE BOOK DROPDOWN */}
                    <Col md={4} ref={bookDropdownRef} className="position-relative">
                      <Form.Group>
                        <Form.Label className="fw-bold">Fee Description (Book Name)</Form.Label>
                        <div className="input-group">
                            <span className="input-group-text"><FaSearch /></span>
                            <Form.Control
                                type="text"
                                placeholder="Type to search book..."
                                value={bookSearchTerm}
                                onChange={handleBookSearchChange}
                                onFocus={() => setShowBookDropdown(true)}
                                className="custom-input"
                            />
                        </div>
                        {showBookDropdown && (
                            <ListGroup className="position-absolute w-100 shadow" style={{maxHeight: '200px', overflowY: 'auto', zIndex: 1050, top: '100%'}}>
                                {filteredBooks.length > 0 ? (
                                    filteredBooks.map(book => (
                                        <ListGroup.Item key={book.id} action onClick={() => selectBook(book)}>
                                            {book.bookName}
                                        </ListGroup.Item>
                                    ))
                                ) : (
                                    <ListGroup.Item disabled>No books found</ListGroup.Item>
                                )}
                            </ListGroup>
                        )}
                      </Form.Group>
                    </Col>

                    {/* AMOUNT TOGGLE & INPUT */}
                    <Col md={3}>
                      <Form.Group>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <Form.Label className="fw-bold mb-0">Amount</Form.Label>
                            <Form.Check 
                                type="switch"
                                id="amount-switch"
                                label={enableAmount ? "On" : "Off"}
                                checked={enableAmount}
                                onChange={(e) => setEnableAmount(e.target.checked)}
                                className="small text-muted"
                            />
                        </div>
                        <Form.Control 
                            type="number" 
                            placeholder={enableAmount ? "Enter Amount" : "Disabled"} 
                            value={enteredAmount} 
                            onChange={(e) => setEnteredAmount(e.target.value)} 
                            onKeyDown={handleInputKeyDown}
                            disabled={!enableAmount}
                            className="custom-input" 
                        />
                      </Form.Group>
                    </Col>

                    {/* NOS INPUT */}
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="fw-bold">No(s) (Qty)</Form.Label>
                        <Form.Control 
                            type="number" 
                            placeholder="Quantity" 
                            value={enteredNos} 
                            onChange={(e) => setEnteredNos(e.target.value)} 
                            onKeyDown={handleInputKeyDown}
                            className="custom-input" 
                        />
                      </Form.Group>
                    </Col>

                    <Col md={2}>
                      <Button variant="primary" onClick={handleEnter} style={{ backgroundColor: "#0B3D7B", width: "100%" }}>
                        Enter <FaPlus className="ms-1" size={12}/>
                      </Button>
                    </Col>
                  </Row>
                </Card>

                {/* ENTRY TABLE */}
                <div className="table-responsive mt-3">
                  <Table bordered hover>
                    <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                      <tr>
                        <th style={{ width: "50px" }}>S.No</th>
                        <th>Fee Description (Book Name)</th> 
                        <th>Amount</th>  
                        <th>No(s)</th>   
                        <th style={{ width: "80px" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {addedBooks.length === 0 ? (
                        <tr><td colSpan="5" className="text-center text-muted">No items added yet.</td></tr>
                      ) : (
                        addedBooks.map((item, index) => (
                          <tr key={item.id}>
                            <td>{index + 1}</td>
                            <td>{item.bookId}</td>
                            <td>{item.amount}</td>    
                            <td>{item.quantity}</td>
                            <td className="text-center">
                              <Button variant="link" className="text-danger p-0" onClick={() => handleRemoveEntry(item.id)} title="Remove">
                                <FaTrash />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>

                <div className="d-flex justify-content-end mt-4">
                  <Button size="lg" onClick={handleSave} style={{ backgroundColor: "#28a745", border: "none" }}>Save Setup</Button>
                </div>
              </Tab>

              {/* === TAB 2: REPORT VIEW === */}
              <Tab eventKey="report" title="Report View">
                <Row className="mb-3 d-flex align-items-end">
                  <Col md={3}>
                    <Form.Label className="fw-bold">Filter By Date</Form.Label>
                    <Form.Control type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                  </Col>
                  <Col md={6}>
                    <Button variant="primary" onClick={() => fetchReportData(filterDate)} className="me-2">Search</Button>
                    <Button variant="outline-secondary" onClick={() => { setFilterDate(""); fetchReportData(""); }}>Show All</Button>
                  </Col>
                  <Col md={3} className="text-end">
                    <Button variant="danger" className="me-2" onClick={exportPDF}><FaFilePdf /> PDF</Button>
                    <Button variant="success" onClick={exportExcel}><FaFileExcel /> Excel</Button>
                  </Col>
                </Row>

                {loading ? <div className="text-center"><Spinner animation="border" /></div> : (
                  <div className="report-container">
                    {groupedReport.length === 0 ? <p className="text-center">No records found.</p> : (
                      groupedReport.map((group, idx) => (
                        <Card key={idx} className="mb-4 shadow-sm">
                          <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                            <h5 className="m-0 text-primary">Standard: {group.standard}</h5>
                            <span className="text-muted small fw-bold"><FaCalendarAlt className="me-1"/> Entry Date: {group.date}</span>
                          </Card.Header>
                          <Table striped bordered size="sm" className="mb-0">
                            <thead>
                              <tr>
                                <th>Subject / Item Name</th>
                                <th className="text-end">Amount</th>
                                <th style={{width: '100px'}} className="text-end">No(s)</th>
                                <th style={{width: '150px'}} className="text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.details.map((detail) => (
                                <tr key={detail.id} className={editingId === detail.id ? "editing-row" : ""}>
                                  <td>
                                    {editingId === detail.id ? (
                                      <Form.Control
                                        type="text"
                                        value={editForm.bookId}
                                        onChange={(e) => handleEditFormChange('bookId', e.target.value)}
                                        size="sm"
                                      />
                                    ) : (
                                      detail.bookId
                                    )}
                                  </td>
                                  <td className="text-end">
                                    {editingId === detail.id ? (
                                      <Form.Control
                                        type="number"
                                        value={editForm.amount}
                                        onChange={(e) => handleEditFormChange('amount', e.target.value)}
                                        size="sm"
                                        style={{ width: '100px', marginLeft: 'auto' }}
                                        step="0.01"
                                      />
                                    ) : (
                                      detail.amount.toFixed(2)
                                    )}
                                  </td>
                                  <td className="text-end">
                                    {editingId === detail.id ? (
                                      <Form.Control
                                        type="number"
                                        value={editForm.quantity}
                                        onChange={(e) => handleEditFormChange('quantity', e.target.value)}
                                        size="sm"
                                        style={{ width: '80px', marginLeft: 'auto' }}
                                      />
                                    ) : (
                                      detail.quantity
                                    )}
                                  </td>
                                  <td className="text-center">
                                    {editingId === detail.id ? (
                                      <>
                                        <Button 
                                          variant="link" 
                                          className="text-success p-0 me-2" 
                                          onClick={() => handleSaveEdit(detail)} 
                                          title="Save"
                                        >
                                          <FaSave />
                                        </Button>
                                        <Button 
                                          variant="link" 
                                          className="text-secondary p-0" 
                                          onClick={handleCancelEdit} 
                                          title="Cancel"
                                        >
                                          <FaTimes />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button 
                                          variant="link" 
                                          className="text-primary p-0 me-2" 
                                          onClick={() => handleEditClick(detail)} 
                                          title="Edit"
                                        >
                                          <FaEdit />
                                        </Button>
                                        <Button 
                                          variant="link" 
                                          className="text-danger p-0" 
                                          onClick={() => handleDeleteReportItem(detail.id)} 
                                          title="Delete"
                                        >
                                          <FaTrash />
                                        </Button>
                                      </>
                                    )}
                                  </td>
                                </tr>
                              ))}
                              {/* Total Row */}
                              <tr className="fw-bold bg-secondary text-white">
                                <td className="text-end">Total:</td>
                                <td className="text-end">{group.totalAmount.toFixed(2)}</td>
                                <td className="text-end" colSpan="2">{group.totalQuantity}</td>
                              </tr>
                            </tbody>
                          </Table>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </Tab>

            </Tabs>
          </div>
        </div>
        <ToastContainer />
      </Container>
      <style>{`
        .custom-breadcrumb a { color: #0B3D7B; text-decoration: none; }
        .custom-input { border: 1px solid #ced4da; border-radius: 4px; padding: 8px; }
        .form-card { background: #fff; border: 1px solid #dee2e6; border-radius: 0.25rem; }
        .custom-tabs .nav-link { color: #495057; font-weight: 500; }
        .custom-tabs .nav-link.active { color: #0B3D7B; border-bottom: 3px solid #0B3D7B; font-weight: bold; }
        .report-container { max-height: 600px; overflow-y: auto; padding-right: 5px; }
        .list-group-item-action { cursor: pointer; }
        .editing-row { background-color: #fff8e1 !important; }
      `}</style>
    </MainContentPage>
  );
};

export default BookSetupClassWise;