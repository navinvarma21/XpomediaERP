"use client";

import React, { useState, useEffect } from "react";
import MainContentPage from "../../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container, Table, Modal, Card } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEdit, FaTrash, FaPlus, FaUniversity, FaCreditCard, FaMapMarkerAlt } from "react-icons/fa";
import { useAuthContext } from "../../../Context/AuthContext";
import { ENDPOINTS } from "../../../SpringBoot/config";
import axios from "axios";

const BankAccountSetup = () => {
    const { user, currentAcademicYear } = useAuthContext();
    const [accounts, setAccounts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form State (Removed openingBalance)
    const [formData, setFormData] = useState({
        bankName: "",
        accountName: "",
        accountNumber: "",
        ifscCode: "",
        branchName: "",
        accountType: "Savings"
    });

    useEffect(() => {
        if (user) fetchAccounts();
    }, [user]);

    const fetchAccounts = async () => {
        try {
            const res = await axios.get(`${ENDPOINTS.store}/bank-accounts`, {
                params: { schoolId: user.uid }
            });
            // Ensure unique IDs to prevent duplicate key errors
            const uniqueData = res.data ? res.data.map((item, index) => ({...item, uniqueKey: item.id || `temp-${index}`})) : [];
            setAccounts(uniqueData);
        } catch (err) {
            console.error(err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!formData.bankName || !formData.accountNumber) {
            toast.warning("Bank Name and Account Number are required");
            return;
        }

        const payload = {
            ...formData,
            schoolId: user.uid,
            academicYear: currentAcademicYear
        };

        try {
            if (editingId) {
                await axios.put(`${ENDPOINTS.store}/bank-accounts/update/${editingId}`, payload, {
                    params: { schoolId: user.uid }
                });
                toast.success("Account Updated Successfully");
            } else {
                await axios.post(`${ENDPOINTS.store}/bank-accounts/save`, payload, {
                    params: { schoolId: user.uid }
                });
                toast.success("Account Added Successfully");
            }
            setShowModal(false);
            setEditingId(null);
            resetForm();
            fetchAccounts(); // Refresh list
        } catch (err) {
            console.error(err);
            toast.error("Operation Failed. Check network or server.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this account?")) return;
        try {
            await axios.delete(`${ENDPOINTS.store}/bank-accounts/delete/${id}`, {
                params: { schoolId: user.uid }
            });
            toast.success("Deleted Successfully");
            fetchAccounts();
        } catch (err) {
            toast.error("Failed to delete");
        }
    };

    const handleEdit = (account) => {
        setFormData({
            bankName: account.bankName,
            accountName: account.accountName,
            accountNumber: account.accountNumber,
            ifscCode: account.ifscCode,
            branchName: account.branchName,
            accountType: account.accountType
        });
        setEditingId(account.id);
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            bankName: "",
            accountName: "",
            accountNumber: "",
            ifscCode: "",
            branchName: "",
            accountType: "Savings"
        });
        setEditingId(null);
    };

    const handleAddNew = () => {
        resetForm();
        setShowModal(true);
    };

    return (
        <MainContentPage>
            <Container fluid className="px-0">
                {/* Header */}
                <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="fw-bold text-dark m-0 d-flex align-items-center">
                            <div className="icon-box me-3">
                                <FaUniversity className="text-white" size={20} />
                            </div>
                            Bank Account Setup
                        </h4>
                        <Button 
                            className="custom-btn-primary" 
                            onClick={handleAddNew}
                        >
                            <FaPlus className="me-2" /> Add Account
                        </Button>
                    </div>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mt-2">
                            <li className="breadcrumb-item"><a href="/home" className="text-decoration-none" style={{ color: "#0B3D7B" }}>Home</a></li>
                            <li className="breadcrumb-item text-secondary">Masters</li>
                            <li className="breadcrumb-item active">Bank Setup</li>
                        </ol>
                    </nav>
                </div>

                {/* Table Card */}
                <Card className="custom-card shadow-sm">
                    <Card.Body className="p-0">
                        <div className="table-responsive">
                            <Table hover className="align-middle mb-0 custom-table">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="py-3 px-4">Bank Name</th>
                                        <th className="py-3">Account Holder</th>
                                        <th className="py-3">Account No</th>
                                        <th className="py-3">IFSC</th>
                                        <th className="py-3">Branch</th>
                                        <th className="py-3 text-center">Type</th>
                                        <th className="py-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accounts.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-5">
                                                <div className="text-muted d-flex flex-column align-items-center">
                                                    <FaUniversity size={40} className="mb-3 text-secondary opacity-50"/>
                                                    <span>No Bank Accounts Found</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        accounts.map((acc) => (
                                            <tr key={acc.uniqueKey}>
                                                <td className="px-4 fw-bold" style={{color: "#0B3D7B"}}>{acc.bankName}</td>
                                                <td className="text-secondary fw-bold">{acc.accountName}</td>
                                                <td><span className="badge bg-light text-dark border">{acc.accountNumber}</span></td>
                                                <td className="small text-muted">{acc.ifscCode}</td>
                                                <td>{acc.branchName}</td>
                                                <td className="text-center">
                                                    <span className={`badge ${acc.accountType === 'Current' ? 'bg-info' : 'bg-secondary'}`}>
                                                        {acc.accountType}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <Button variant="link" className="text-primary p-0 me-3 hover-scale" onClick={() => handleEdit(acc)}>
                                                        <FaEdit size={16} />
                                                    </Button>
                                                    <Button variant="link" className="text-danger p-0 hover-scale" onClick={() => handleDelete(acc.id)}>
                                                        <FaTrash size={16} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>

                {/* --- CUSTOM STYLED MODAL --- */}
                <Modal 
                    show={showModal} 
                    onHide={() => setShowModal(false)} 
                    centered 
                    size="lg"
                    contentClassName="custom-modal-content"
                    backdrop="static"
                >
                    <Modal.Header closeButton className="custom-modal-header">
                        <Modal.Title className="fw-bold text-white d-flex align-items-center">
                            <FaUniversity className="me-2" />
                            {editingId ? "Edit Bank Account" : "Add New Bank Account"}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4 custom-modal-body">
                        <div className="section-title mb-3">Bank Details</div>
                        <Row className="g-3 mb-4">
                            <Col md={6}>
                                <div className="form-floating-custom">
                                    <label>Bank Name <span className="text-danger">*</span></label>
                                    <div className="input-with-icon">
                                        <FaUniversity className="input-icon" />
                                        <input 
                                            type="text" 
                                            name="bankName" 
                                            className="custom-input" 
                                            value={formData.bankName} 
                                            onChange={handleInputChange} 
                                            placeholder="e.g. HDFC Bank" 
                                        />
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="form-floating-custom">
                                    <label>Branch Name</label>
                                    <div className="input-with-icon">
                                        <FaMapMarkerAlt className="input-icon" />
                                        <input 
                                            type="text" 
                                            name="branchName" 
                                            className="custom-input" 
                                            value={formData.branchName} 
                                            onChange={handleInputChange} 
                                            placeholder="e.g. Main Street Branch" 
                                        />
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        <div className="section-title mb-3">Account Information</div>
                        <Row className="g-3 mb-4">
                            <Col md={6}>
                                <div className="form-floating-custom">
                                    <label>Account Holder Name</label>
                                    <div className="input-with-icon">
                                        <FaEdit className="input-icon" />
                                        <input 
                                            type="text" 
                                            name="accountName" 
                                            className="custom-input" 
                                            value={formData.accountName} 
                                            onChange={handleInputChange} 
                                            placeholder="e.g. School Trust Account" 
                                        />
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="form-floating-custom">
                                    <label>Account Number <span className="text-danger">*</span></label>
                                    <div className="input-with-icon">
                                        <FaCreditCard className="input-icon" />
                                        <input 
                                            type="text" 
                                            name="accountNumber" 
                                            className="custom-input" 
                                            value={formData.accountNumber} 
                                            onChange={handleInputChange} 
                                            placeholder="e.g. 5010023..." 
                                        />
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="form-floating-custom">
                                    <label>IFSC Code</label>
                                    <div className="input-with-icon">
                                        <span className="input-icon fw-bold" style={{fontSize:'12px'}}>IFSC</span>
                                        <input 
                                            type="text" 
                                            name="ifscCode" 
                                            className="custom-input" 
                                            value={formData.ifscCode} 
                                            onChange={handleInputChange} 
                                            placeholder="e.g. HDFC0001234" 
                                        />
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="form-floating-custom">
                                    <label>Account Type</label>
                                    <select 
                                        name="accountType" 
                                        className="custom-input" 
                                        value={formData.accountType} 
                                        onChange={handleInputChange}
                                        style={{paddingLeft: '15px'}}
                                    >
                                        <option>Savings</option>
                                        <option>Current</option>
                                        <option>OD</option>
                                    </select>
                                </div>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer className="custom-modal-footer">
                        <Button variant="light" className="custom-btn-secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button className="custom-btn-primary" onClick={handleSave}>
                            {editingId ? "Update Account" : "Save Account"}
                        </Button>
                    </Modal.Footer>
                </Modal>

                <ToastContainer position="top-right" autoClose={3000} />
            </Container>
            
            <style>{`
                /* Header Styling */
                .icon-box {
                    background: #0B3D7B;
                    padding: 8px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 6px rgba(11, 61, 123, 0.2);
                }

                .custom-btn-primary {
                    background-color: #0B3D7B;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 500;
                    box-shadow: 0 4px 6px rgba(11, 61, 123, 0.2);
                    transition: all 0.3s ease;
                    color: white;
                }
                .custom-btn-primary:hover {
                    background-color: #082d5c;
                    transform: translateY(-1px);
                    color: white;
                }

                .custom-card {
                    border: none;
                    border-radius: 15px;
                    overflow: hidden;
                }

                .custom-table thead th {
                    border-bottom: none;
                    color: #555;
                    font-weight: 600;
                    font-size: 0.9rem;
                    background-color: #f8f9fa;
                }

                .hover-scale {
                    transition: transform 0.2s;
                }
                .hover-scale:hover {
                    transform: scale(1.2);
                }

                /* --- MODAL STYLING --- */
                .custom-modal-content {
                    border: none;
                    border-radius: 16px;
                    box-shadow: 0 15px 40px rgba(0,0,0,0.2);
                    overflow: hidden;
                }

                .custom-modal-header {
                    background: linear-gradient(135deg, #0B3D7B 0%, #1059b0 100%);
                    border-bottom: none;
                    padding: 20px 30px;
                }
                
                .custom-modal-header .btn-close {
                    filter: invert(1) grayscale(100%) brightness(200%);
                }

                .custom-modal-body {
                    background-color: #fff;
                    padding: 30px 40px !important;
                }

                .custom-modal-footer {
                    border-top: 1px solid #f0f0f0;
                    background-color: #f8f9fa;
                    padding: 15px 30px;
                }

                .section-title {
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: #adb5bd;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 5px;
                }

                /* Input Styling */
                .form-floating-custom {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .form-floating-custom label {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #495057;
                }

                .input-with-icon {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .input-icon {
                    position: absolute;
                    left: 12px;
                    color: #0B3D7B;
                    opacity: 0.7;
                    z-index: 2;
                }

                .custom-input {
                    width: 100%;
                    padding: 12px 12px 12px 40px; /* Space for icon */
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    font-size: 0.95rem;
                    transition: all 0.3s ease;
                    background-color: #fcfcfc;
                }

                .custom-input:focus {
                    border-color: #0B3D7B;
                    background-color: #fff;
                    box-shadow: 0 0 0 4px rgba(11, 61, 123, 0.1);
                    outline: none;
                }

                .custom-input::placeholder {
                    color: #adb5bd;
                    font-size: 0.9rem;
                }

                .custom-btn-secondary {
                    border: 1px solid #dee2e6;
                    background: white;
                    color: #555;
                    font-weight: 500;
                    padding: 10px 20px;
                    border-radius: 8px;
                }
                .custom-btn-secondary:hover {
                    background: #f1f1f1;
                }
            `}</style>
        </MainContentPage>
    );
};

export default BankAccountSetup;