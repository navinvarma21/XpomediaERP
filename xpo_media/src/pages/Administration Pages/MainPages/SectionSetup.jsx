"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainContentPage from "../../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container, Table, Spinner } from "react-bootstrap";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useAuthContext } from "../../../Context/AuthContext";
import { ENDPOINTS } from "../../../SpringBoot/config";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";
import "../styles/style.css";

/* ---------- Modal Components ---------- */
const AddSectionModal = ({ isOpen, onClose, onConfirm }) => {
  const [section, setSection] = useState("");
  if (!isOpen) return null;

  const handleSubmit = () => {
    onConfirm(section);
    setSection("");
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Add Section</h2>
        <div className="modal-body">
          <Form.Control
            type="text"
            placeholder="Enter Section Name"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="custom-input"
          />
        </div>
        <div className="modal-buttons">
          <Button className="modal-button confirm" onClick={handleSubmit}>
            Add
          </Button>
          <Button className="modal-button cancel" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

const EditSectionModal = ({ isOpen, onClose, onConfirm, section: selected }) => {
  const [section, setSection] = useState(selected?.section || "");

  useEffect(() => {
    if (selected) setSection(selected.section);
  }, [selected]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Edit Section</h2>
        <div className="modal-body">
          <Form.Control
            type="text"
            placeholder="Enter Section Name"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="custom-input"
          />
        </div>
        <div className="modal-buttons">
          <Button
            className="modal-button confirm"
            onClick={() => onConfirm(selected.id, section)}
          >
            Update
          </Button>
          <Button className="modal-button cancel" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

const DeleteSectionModal = ({ isOpen, onClose, onConfirm, section: selected }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Delete Section</h2>
        <div className="modal-body text-center">
          <p>Are you sure you want to delete this section?</p>
          <p className="fw-bold">{selected?.section}</p>
        </div>
        <div className="modal-buttons">
          <Button
            className="modal-button delete"
            onClick={() => onConfirm(selected.id)}
          >
            Delete
          </Button>
          <Button className="modal-button cancel" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ---------- Main Component ---------- */
const SectionSetup = () => {
  const { user, admin, currentAcademicYear } = useAuthContext();
  const schoolId = user?.uid || admin?.adminId || "-";

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [sections, setSections] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const buildHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
    "X-School-Id": schoolId,
    "X-Academic-Year": currentAcademicYear,
  });

  const fetchSections = async () => {
    if (!schoolId || !currentAcademicYear) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${ENDPOINTS.administration}/sections`, {
        headers: buildHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch sections");
      const data = await response.json();
      setSections(data);
    } catch {
      toast.error("Failed to fetch sections.");
      setSections([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, [schoolId, currentAcademicYear]);

  const handleAddSection = async (section) => {
    if (!section.trim()) return toast.error("Section name cannot be empty.");
    try {
      const response = await fetch(`${ENDPOINTS.administration}/sections`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({ section, academicYear: currentAcademicYear }),
      });
      if (!response.ok) throw new Error("Failed to add section");
      toast.success("Section added successfully!");
      setIsAddModalOpen(false);
      fetchSections();
    } catch {
      toast.error("Failed to add section.");
    }
  };

  const handleEditSection = async (id, newSection) => {
    if (!newSection.trim()) return toast.error("Section name cannot be empty.");
    try {
      const response = await fetch(`${ENDPOINTS.administration}/sections/${id}`, {
        method: "PUT",
        headers: buildHeaders(),
        body: JSON.stringify({ section: newSection, academicYear: currentAcademicYear }),
      });
      if (!response.ok) throw new Error("Failed to update section");
      toast.success("Section updated!");
      setIsEditModalOpen(false);
      fetchSections();
    } catch {
      toast.error("Failed to update section.");
    }
  };

  const handleDeleteSection = async (id) => {
    try {
      const response = await fetch(`${ENDPOINTS.administration}/sections/${id}`, {
        method: "DELETE",
        headers: buildHeaders(),
      });
      if (!response.ok) throw new Error("Failed to delete section");
      toast.success("Section deleted!");
      setIsDeleteModalOpen(false);
      fetchSections();
    } catch {
      toast.error("Failed to delete section.");
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      for (const row of jsonData) {
        if (row["Section Name"]) await handleAddSection(row["Section Name"]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExport = () => {
    if (sections.length === 0) return toast.error("No data to export.");
    const exportData = sections.map((s) => ({ "Section Name": s.section }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sections");
    XLSX.writeFile(workbook, `Sections_${schoolId}_${currentAcademicYear}.xlsx`);
  };

  const filteredSections = sections.filter((s) =>
    s.section?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainContentPage>
      <Container fluid className="px-0 px-lg-0">
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link>
          <span className="separator">&gt;</span>
          <span>Administration</span>
          <span className="separator">&gt;</span>
          <span className="current col-12">Section Setup</span>
        </nav>

        <Row>
          <Col xs={12}>
            <div className="section-setup-container">
              <div className="form-card mt-3">
                <div className="header p-3 d-flex justify-content-between align-items-center">
                  <h2 className="m-0">Create Section Setup</h2>
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleImport}
                      style={{ display: "none" }}
                      id="import-file"
                    />
                    <Button onClick={() => document.getElementById("import-file").click()}>
                      Import
                    </Button>
                    <Button onClick={handleExport} disabled={sections.length === 0}>
                      Export
                    </Button>
                    <Button onClick={() => setIsAddModalOpen(true)}>+ Add Section</Button>
                  </div>
                </div>

                <div className="content-wrapper p-4">
                  <div className="position-relative mb-3">
                    <Form.Control
                      type="text"
                      placeholder="Search by Section Name"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="custom-search"
                      disabled={isLoading}
                    />
                    {searchTerm && (
                      <Button
                        variant="light"
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          border: "none",
                          borderRadius: "50%",
                          width: "32px",
                          height: "32px",
                          fontSize: "20px",
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        }}
                        onClick={() => setSearchTerm("")}
                      >
                        ×
                      </Button>
                    )}
                  </div>

                  {isLoading ? (
                    <div className="text-center my-4">
                      <Spinner animation="border" role="status" variant="primary" />
                      <p>Loading data...</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table bordered hover>
                        <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                          <tr>
                            <th>Section Name</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSections.length === 0 ? (
                            <tr>
                              <td colSpan="2" className="text-center">
                                No data available
                              </td>
                            </tr>
                          ) : (
                            filteredSections.map((s) => (
                              <tr key={s.id}>
                                <td>{s.section}</td>
                                <td>
                                  <Button
                                    variant="link"
                                    className="action-button edit-button me-2"
                                    onClick={() => {
                                      setSelectedSection(s);
                                      setIsEditModalOpen(true);
                                    }}
                                  >
                                    <FaEdit />
                                  </Button>
                                  <Button
                                    variant="link"
                                    className="action-button delete-button"
                                    onClick={() => {
                                      setSelectedSection(s);
                                      setIsDeleteModalOpen(true);
                                    }}
                                  >
                                    <FaTrash />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Modals */}
      <AddSectionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={handleAddSection}
      />
      <EditSectionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onConfirm={handleEditSection}
        section={selectedSection}
      />
      <DeleteSectionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteSection}
        section={selectedSection}
      />

      <ToastContainer />
    </MainContentPage>
  );
};

export default SectionSetup;
