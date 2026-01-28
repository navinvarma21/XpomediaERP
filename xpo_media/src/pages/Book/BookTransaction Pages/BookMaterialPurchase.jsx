"use client";

import React, { useState, useEffect, useRef } from "react";
import MainContentPage from "../../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container, Table, ListGroup } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaTrash, FaSave } from "react-icons/fa";
import { useAuthContext } from "../../../Context/AuthContext";
import { ENDPOINTS } from "../../../SpringBoot/config";
import axios from "axios";

// --- REUSABLE SEARCHABLE DROPDOWN COMPONENT ---
const SearchableDropdown = ({ 
    value, 
    options, 
    onChange, 
    onSelect, 
    placeholder, 
}) => {
    const [show, setShow] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShow(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter options based on input
    const filteredOptions = options.filter(opt => 
        String(opt.label).toLowerCase().includes(String(value || "").toLowerCase())
    );

    return (
        <div ref={wrapperRef} className="position-relative">
            <Form.Control
                type="text"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    if (!show) setShow(true);
                }}
                onFocus={() => setShow(true)}
                placeholder={placeholder}
                size="sm"
                className="bg-white"
                autoComplete="off"
            />
            {show && filteredOptions.length > 0 && (
                <ListGroup className="position-absolute w-100 shadow-sm" style={{ zIndex: 1050, maxHeight: "150px", overflowY: "auto" }}>
                    {filteredOptions.map((opt, idx) => (
                        <ListGroup.Item 
                            key={idx} 
                            action 
                            onClick={() => {
                                onSelect(opt); // Pass full object back
                                setShow(false);
                            }}
                            className="py-1 px-2 small"
                        >
                            {opt.label} {opt.type && <small className="text-muted">({opt.type})</small>}
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}
        </div>
    );
};

const BookMaterialPurchase = () => {
  const { user, currentAcademicYear } = useAuthContext();

  // --- Header States ---
  const [entryNo, setEntryNo] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [billNo, setBillNo] = useState("");
  
  // Supplier States
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupCode, setSelectedSupCode] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");

  // --- Grid/Item States ---
  const [unifiedItemsList, setUnifiedItemsList] = useState([]); // Stores merged Books + Items
  const [standardsList, setStandardsList] = useState([]); 
  const [rows, setRows] = useState([]); 
  const [grossTotal, setGrossTotal] = useState(0);
  const [currentStockDisplay, setCurrentStockDisplay] = useState(0);

  // Suggestions
  const [uniqueHeads, setUniqueHeads] = useState([]);
  const [uniqueUnits, setUniqueUnits] = useState([]);

  const emptyRow = {
    id: Date.now(),
    itemCode: "",
    description: "", 
    head: "",
    std: "",
    unit: "",
    qty: 0,
    rate: 0,
    gstPercent: 0,
    total: 0
  };

  useEffect(() => {
    if (user && currentAcademicYear) {
      fetchInitialData();
      setRows([emptyRow]);
    }
  }, [user, currentAcademicYear]);

  const fetchInitialData = async () => {
    try {
      const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
      const params = { schoolId: user.uid, year: currentAcademicYear };

      // 1. Fetch Suppliers
      const supRes = await axios.get(`${ENDPOINTS.store}/suppliers`, { params, headers });
      setSuppliers(supRes.data || []);

      // 2. Fetch General Items
      const itemRes = await axios.get(`${ENDPOINTS.store}/items`, { params, headers });
      const generalItems = itemRes.data || [];

      // 3. Fetch Books
      const bookRes = await axios.get(`${ENDPOINTS.store}/books`, { params, headers });
      const books = bookRes.data || [];

      // 4. Merge Data for Dropdown
      // Standardizing structure: { label: Name, value: Code, type: "Book"|"Item", ...originalData }
      const mergedList = [
          ...generalItems.map(i => ({
              label: i.itemName,
              value: i.itemCode,
              type: "Item",
              group: i.group,
              unit: i.unit,
              rate: i.purchaseRate,
              gst: i.gstType
          })),
          ...books.map(b => ({
              label: b.bookName,
              value: b.bookCode,
              type: "Book",
              group: "Book", // Default head for books
              unit: "Nos",   // Default unit for books
              rate: 0,       // Default rate
              gst: 0
          }))
      ];
      setUnifiedItemsList(mergedList);
      
      // Extract unique heads/units from general items (Books usually have defaults)
      setUniqueHeads([...new Set(generalItems.map(i => i.group).filter(Boolean))]);
      setUniqueUnits([...new Set(generalItems.map(i => i.unit).filter(Boolean))]);

      // 5. Fetch Standards (Courses)
      const stdRes = await axios.get(`${ENDPOINTS.administration}/courses`, { params, headers });
      setStandardsList(stdRes.data.map(s => s.standard || s.name) || []);

      // 6. Fetch Next Entry No
      const entryRes = await axios.get(`${ENDPOINTS.store}/purchase/next-entry-no`, { params: { schoolId: user.uid }, headers });
      setEntryNo(entryRes.data);

    } catch (err) {
      console.error("Error loading initial data", err);
    }
  };

  // --- ACTIONS ---
  const resetForm = () => {
      setBillNo("");
      setSelectedSupCode("");
      setSupplierName("");
      setSupplierAddress("");
      setRows([{ ...emptyRow, id: Date.now() }]);
      setGrossTotal(0);
      setCurrentStockDisplay(0);
      fetchInitialData(); 
  };

  // Logic to sync Supplier Name/Address when Code is selected
  const handleSupplierCodeSelect = (item) => {
      setSelectedSupCode(item.value);
      setSupplierName(item.name);
      setSupplierAddress(item.address || "N/A");
  };

  // Logic to sync Supplier Code/Address when Name is selected
  const handleSupplierNameSelect = (item) => {
      setSupplierName(item.label);
      setSelectedSupCode(item.value);
      setSupplierAddress(item.address || "N/A");
  };

  const handleRowChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;

    if (["qty", "rate", "gstPercent"].includes(field)) {
        const qty = parseFloat(updatedRows[index].qty) || 0;
        const rate = parseFloat(updatedRows[index].rate) || 0;
        const gst = parseFloat(updatedRows[index].gstPercent) || 0;
        
        const baseTotal = qty * rate;
        const gstAmount = (baseTotal * gst) / 100;
        updatedRows[index].total = (baseTotal + gstAmount).toFixed(2);
    }

    setRows(updatedRows);
    calculateGrossTotal(updatedRows);
  };

  // Handle Selection from Unified List (Grid Items)
  const handleItemSelect = (index, selection) => {
    if (selection) {
        const updatedRows = [...rows];
        const row = updatedRows[index];

        row.description = selection.label;
        row.itemCode = selection.value;
        row.head = selection.group || "";
        row.std = ""; 
        row.unit = selection.unit || "";
        row.rate = selection.rate || 0;
        row.gstPercent = selection.gst ? parseFloat(selection.gst) : 0;
        
        setRows(updatedRows);
        fetchStock(selection.value);
    }
  };

  const fetchStock = async (itemCode) => {
      try {
        const headers = { Authorization: `Bearer ${sessionStorage.getItem("token")}` };
        const res = await axios.get(`${ENDPOINTS.store}/purchase/stock/${itemCode}`, { params: { schoolId: user.uid }, headers });
        setCurrentStockDisplay(res.data);
      } catch (err) { setCurrentStockDisplay(0); }
  };

  const calculateGrossTotal = (currentRows) => {
      const total = currentRows.reduce((sum, row) => sum + (parseFloat(row.total) || 0), 0);
      setGrossTotal(total.toFixed(2));
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Enter" && index === rows.length - 1) {
        setRows([...rows, { ...emptyRow, id: Date.now() }]);
    }
  };

  const handleDeleteRow = (index) => {
      if (rows.length > 1) {
          const updated = rows.filter((_, i) => i !== index);
          setRows(updated);
          calculateGrossTotal(updated);
      }
  };

  const handleSave = async () => {
      if (!billNo || !selectedSupCode) {
          toast.warning("Please fill Invoice No and Supplier details.");
          return;
      }

      const validItems = rows.filter(r => r.itemCode && r.qty > 0).map(r => ({
          itemCode: r.itemCode,
          description: r.description,
          head: r.head,
          standard: r.std,
          unit: r.unit,
          quantity: parseInt(r.qty),
          rate: parseFloat(r.rate),
          gstPercent: parseFloat(r.gstPercent),
          total: parseFloat(r.total)
      }));

      if (validItems.length === 0) {
          toast.warning("Please add at least one valid item.");
          return;
      }

      const payload = {
          billNumber: billNo,
          entryNumber: entryNo,
          entryDate: entryDate,
          supplierCode: selectedSupCode,
          supplierName: supplierName,
          month: new Date(entryDate).toLocaleString('default', { month: 'long' }),
          grossAmount: parseFloat(grossTotal),
          items: validItems,
          schoolId: user.uid,
          academicYear: currentAcademicYear
      };

      try {
          await axios.post(`${ENDPOINTS.store}/purchase/save`, payload, {
            headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
          });
          toast.success("Purchase Saved Successfully!");
          resetForm();
      } catch (err) {
          console.error(err);
          toast.error("Failed to save transaction.");
      }
  };

  return (
    <MainContentPage>
      <Container fluid className="px-0">
        <div className="form-card mt-3">
          <div className="header p-2" style={{ backgroundColor: "#87CEEB", borderBottom: "2px solid #000" }}>
            <h4 className="m-0 text-center">Purchase Entry Window</h4>
          </div>

          <div className="p-3" style={{ backgroundColor: "#E0FFFF" }}>
            
            {/* HEADER */}
            <Row className="mb-2 align-items-center">
                <Col md={2}><Form.Label className="fw-bold">Entry No.</Form.Label></Col>
                <Col md={2}><Form.Control type="text" value={entryNo} readOnly className="bg-light" /></Col>
                <Col md={2}><Form.Label className="fw-bold text-end w-100">Entry Date</Form.Label></Col>
                <Col md={3}><Form.Control type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} /></Col>
                <Col md={1}><Form.Label className="fw-bold text-end w-100">Inv./Bill No.</Form.Label></Col>
                <Col md={2}><Form.Control type="text" value={billNo} onChange={(e) => setBillNo(e.target.value)} style={{backgroundColor: "#FFC0CB"}}/></Col>
            </Row>

            <Row className="mb-3 align-items-center">
                <Col md={2}><Form.Label className="fw-bold">Sup. Code</Form.Label></Col>
                <Col md={2}>
                    {/* Searchable Supplier Code */}
                    <SearchableDropdown 
                        value={selectedSupCode}
                        options={suppliers.map(s => ({ 
                            label: s.supplierCode, 
                            value: s.supplierCode, 
                            name: s.supplierName, 
                            address: s.address 
                        }))}
                        onChange={(val) => setSelectedSupCode(val)}
                        onSelect={handleSupplierCodeSelect}
                        placeholder="Select Code"
                    />
                </Col>
                <Col md={2}><Form.Label className="fw-bold text-end w-100">Supplier Name</Form.Label></Col>
                <Col md={3}>
                    {/* Searchable Supplier Name */}
                    <SearchableDropdown 
                        value={supplierName}
                        options={suppliers.map(s => ({ 
                            label: s.supplierName, 
                            value: s.supplierCode, 
                            address: s.address 
                        }))}
                        onChange={(val) => setSupplierName(val)}
                        onSelect={handleSupplierNameSelect}
                        placeholder="Select Name"
                    />
                </Col>
                <Col md={1}><Form.Label className="fw-bold text-end w-100">Address</Form.Label></Col>
                <Col md={2}><Form.Control type="text" value={supplierAddress} readOnly style={{backgroundColor: "#DDA0DD"}} /></Col>
            </Row>

            <Row className="mb-2 justify-content-end">
                <Col md={2} className="text-end">
                    <div className="border p-1 bg-white text-center">
                        <small>Current Stock</small><br/>
                        <strong className="text-danger fs-5">{currentStockDisplay}</strong>
                    </div>
                </Col>
            </Row>

            {/* GRID */}
            <div className="table-responsive bg-white" style={{ minHeight: "300px", border: "1px solid #ccc" }}>
              <Table bordered size="sm" className="mb-0">
                <thead className="text-white" style={{ backgroundColor: "#800080" }}>
                  <tr>
                    <th style={{width: '5%'}}>SI.N</th>
                    <th style={{width: '20%'}}>Description</th>
                    <th style={{width: '10%'}}>Head</th>
                    <th style={{width: '10%'}}>Std</th>
                    <th style={{width: '8%'}}>Unit</th>
                    <th style={{width: '8%'}}>Qty</th>
                    <th style={{width: '10%'}}>Rate</th>
                    <th style={{width: '8%'}}>GST %</th>
                    <th style={{width: '15%'}}>Total</th>
                    <th style={{width: '5%'}}>Act</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.id}>
                      <td>{index + 1}</td>
                      
                      {/* Description: Searchable from Unified List */}
                      <td>
                        <SearchableDropdown 
                            value={row.description}
                            options={unifiedItemsList} // ✅ Uses Merged List
                            onChange={(val) => handleRowChange(index, "description", val)}
                            onSelect={(val) => handleItemSelect(index, val)}
                            placeholder="Search Item/Book"
                        />
                      </td>

                      {/* Head */}
                      <td>
                        <SearchableDropdown 
                            value={row.head}
                            options={uniqueHeads.map(h => ({ label: h, value: h }))}
                            onChange={(val) => handleRowChange(index, "head", val)}
                            onSelect={(val) => handleRowChange(index, "head", val.value)}
                            placeholder="Head"
                        />
                      </td>

                      {/* Standard */}
                      <td>
                        <SearchableDropdown 
                            value={row.std}
                            options={standardsList.map(s => ({ label: s, value: s }))}
                            onChange={(val) => handleRowChange(index, "std", val)}
                            onSelect={(val) => handleRowChange(index, "std", val.value)}
                            placeholder="Std"
                        />
                      </td>

                      {/* Unit */}
                      <td>
                        <SearchableDropdown 
                            value={row.unit}
                            options={uniqueUnits.map(u => ({ label: u, value: u }))}
                            onChange={(val) => handleRowChange(index, "unit", val)}
                            onSelect={(val) => handleRowChange(index, "unit", val.value)}
                            placeholder="Unit"
                        />
                      </td>

                      <td><Form.Control type="number" value={row.qty} onChange={(e) => handleRowChange(index, "qty", e.target.value)} size="sm" /></td>
                      <td><Form.Control type="number" value={row.rate} onChange={(e) => handleRowChange(index, "rate", e.target.value)} size="sm" /></td>
                      <td><Form.Control type="number" value={row.gstPercent} onChange={(e) => handleRowChange(index, "gstPercent", e.target.value)} size="sm" /></td>
                      <td><Form.Control type="text" value={row.total} readOnly size="sm" onKeyDown={(e) => handleKeyDown(e, index)} /></td>
                      <td><Button variant="link" className="text-danger p-0" onClick={() => handleDeleteRow(index)}><FaTrash /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <Row className="mt-3">
                <Col md={9} className="d-flex gap-2 justify-content-end">
                    <Button variant="info" onClick={resetForm}>New</Button>
                    <Button variant="success" onClick={handleSave}><FaSave /> Save</Button>
                    <Button variant="secondary">Exit</Button>
                </Col>
                <Col md={3}>
                    <div className="p-2 text-center" style={{ backgroundColor: "#ADD8E6", border: "1px solid #000" }}>
                        <h5 className="m-0">Gross Amt</h5>
                        <div className="bg-white border mt-1 p-1 fs-4 fw-bold">{grossTotal}</div>
                    </div>
                </Col>
            </Row>

          </div>
        </div>
        <ToastContainer />
      </Container>
    </MainContentPage>
  );
};

export default BookMaterialPurchase;