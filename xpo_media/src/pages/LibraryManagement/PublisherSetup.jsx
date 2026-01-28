"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainContentPage from "../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container, Table, Spinner } from "react-bootstrap";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useAuthContext } from "../../Context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";
import { ENDPOINTS } from "../../SpringBoot/config";


const AddPublisherModal = ({ isOpen, onClose, onConfirm }) => {
  const [publisher, setPublisher] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!publisher.trim()) return toast.error("Publisher name cannot be empty.");
    onConfirm(publisher.trim());
    setPublisher("");
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Add Publisher</h2>
        <div className="modal-body">
          <Form.Control
            type="text"
            placeholder="Enter Publisher Name"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
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

const EditPublisherModal = ({ isOpen, onClose, onConfirm, publisherItem }) => {
  const [publisher, setPublisher] = useState(publisherItem?.name || "");

  useEffect(() => {
    if (publisherItem) setPublisher(publisherItem.name);
  }, [publisherItem]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!publisher.trim()) return toast.error("Publisher name cannot be empty.");
    onConfirm(publisherItem.id, publisher.trim());
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Edit Publisher</h2>
        <div className="modal-body">
          <Form.Control
            type="text"
            placeholder="Enter Publisher Name"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            className="custom-input"
          />
        </div>
        <div className="modal-buttons">
          <Button className="modal-button confirm" onClick={handleSubmit}>
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

const DeletePublisherModal = ({ isOpen, onClose, onConfirm, publisherItem }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Delete Publisher</h2>
        <div className="modal-body text-center">
          <p>Are you sure you want to delete this publisher?</p>
          <p className="fw-bold">{publisherItem?.name}</p>
        </div>
        <div className="modal-buttons">
          <Button className="modal-button delete" onClick={() => onConfirm(publisherItem.id)}>
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

const ConfirmEditModal = ({ isOpen, onClose, onConfirm, currentName, newName }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Confirm Edit</h2>
        <div className="modal-body">
          <p>Are you sure you want to edit this publisher? This may affect book data.</p>
          <p><strong>Current Name:</strong> {currentName}</p>
          <p><strong>New Name:</strong> {newName}</p>
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
  );
};

const PublisherSetup = () => {
  const { user, admin, currentAcademicYear, loading, forceLogout, schoolId } = useAuthContext();

  const [publishers, setPublishers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPublisher, setSelectedPublisher] = useState(null);
  const [newPublisher, setNewPublisher] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isConfirmEditModalOpen, setIsConfirmEditModalOpen] = useState(false);

  const fetchPublishers = async () => {
    if (!schoolId || schoolId === "-" || !currentAcademicYear) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${ENDPOINTS.library}/publishers?schoolId=${schoolId}&year=${currentAcademicYear}`);
      if (!res.ok) throw new Error("Failed to fetch publishers");
      const data = await res.json();
      setPublishers(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch publishers.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPublishers();
  }, [schoolId, currentAcademicYear]);

  const handleAddPublisher = async (publisher) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${ENDPOINTS.library}/publishers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId: schoolId, academicYear: currentAcademicYear, name: publisher }),
      });
      if (!res.ok) throw new Error("Failed to add publisher");
      await fetchPublishers();
      setIsAddModalOpen(false);
      toast.success("Publisher added successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add publisher.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPublisher = (id, newName) => {
    setSelectedPublisher(publishers.find((p) => p.id === id));
    setNewPublisher(newName);
    setIsEditModalOpen(false);
    setIsConfirmEditModalOpen(true);
  };

  const confirmEditPublisher = async () => {
    if (!selectedPublisher) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `${ENDPOINTS.library}/publishers/${selectedPublisher.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schoolId: schoolId, name: newPublisher }),
        }
      );
      if (!res.ok) throw new Error("Failed to update publisher");
      await fetchPublishers();
      setIsConfirmEditModalOpen(false);
      toast.success("Publisher updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update publisher.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePublisher = async (id) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${ENDPOINTS.library}/publishers/${id}?schoolId=${schoolId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete publisher");
      await fetchPublishers();
      setIsDeleteModalOpen(false);
      toast.success("Publisher deleted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete publisher.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      for (const row of jsonData) {
        const name = row["Publisher Name"] || row["name"];
        if (name && !publishers.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
          await handleAddPublisher(name);
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExport = () => {
    if (!publishers.length) return toast.error("No data to export");
    const exportData = publishers.map((p) => ({ "Publisher Name": p.name }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Publishers");
    XLSX.writeFile(workbook, `Publishers_Export_${schoolId}_${currentAcademicYear}.xlsx`);
    toast.success("Publishers exported successfully!");
  };

  const filteredPublishers = publishers.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainContentPage>
      <Container fluid className="px-0 px-lg-0">
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link> &gt; <span>Library</span> &gt;{" "}
          <span className="current col-12">Publisher Setup</span>
        </nav>

        <Row>
          <Col xs={12}>
            <div className="publisher-setup-container">
              <div className="form-card mt-3">
                <div className="header p-3 d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="m-0 d-none d-lg-block">Publisher Setup</h2>
                    <h6 className="m-0 d-lg-none">Publisher Setup</h6>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <input type="file" accept=".xlsx, .xls" onChange={handleImport} style={{ display: "none" }} id="import-file" />
                    <Button onClick={() => document.getElementById("import-file").click()} className="btn btn-primary text-light" disabled={isLoading}>Import</Button>
                    <Button onClick={handleExport} className="btn btn-primary text-light" disabled={isLoading || !publishers.length}>Export</Button>
                    <Button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary text-light" disabled={isLoading}>+ Add Publisher</Button>
                  </div>
                </div>

                <div className="content-wrapper p-4">
                  {!currentAcademicYear ? (
                    <div className="alert alert-warning">Please select an academic year to manage publishers.</div>
                  ) : (
                    <>
                      <div className="position-relative mb-3">
                        <Form.Control
                          type="text"
                          placeholder="Search by Publisher Name"
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

                      {isLoading && <div className="text-center my-4"><Spinner animation="border" /> Loading...</div>}
                      {!isLoading && (
                        <div className="table-responsive">
                          <Table bordered hover>
                            <thead style={{ backgroundColor: "#0B3D7B", color: "white" }}>
                              <tr>
                                <th>Publisher Name</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {publishers.length === 0 ? (
                                <tr><td colSpan="2" className="text-center">No data available</td></tr>
                              ) : filteredPublishers.length === 0 && searchTerm ? (
                                <tr><td colSpan="2" className="text-center">No matching publishers found</td></tr>
                              ) : (
                                filteredPublishers.map((publisher) => (
                                  <tr key={publisher.id}>
                                    <td>{publisher.name}</td>
                                    <td>
                                      <Button variant="link action-button edit-button me-2" onClick={() => { setSelectedPublisher(publisher); setIsEditModalOpen(true) }}><FaEdit /></Button>
                                      <Button variant="link action-button delete-button" onClick={() => { setSelectedPublisher(publisher); setIsDeleteModalOpen(true) }}><FaTrash /></Button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
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

      <AddPublisherModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onConfirm={handleAddPublisher} />
      <EditPublisherModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onConfirm={handleEditPublisher} publisherItem={selectedPublisher} />
      <DeletePublisherModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeletePublisher} publisherItem={selectedPublisher} />
      <ConfirmEditModal isOpen={isConfirmEditModalOpen} onClose={() => setIsConfirmEditModalOpen(false)} onConfirm={confirmEditPublisher} currentName={selectedPublisher?.name} newName={newPublisher} />

      <ToastContainer />
    </MainContentPage>
  );
};

export default PublisherSetup;