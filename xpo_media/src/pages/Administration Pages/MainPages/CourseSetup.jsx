// "use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainContentPage from "../../../components/MainContent/MainContentPage";
import { Form, Button, Row, Col, Container, Table, Spinner } from "react-bootstrap";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useAuthContext } from "../../../Context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";
import { ENDPOINTS } from "../../../SpringBoot/config";
import "../styles/style.css";

// --------------------- Modals ---------------------
const AddCourseModal = ({ isOpen, onClose, onConfirm }) => {
  const [standard, setStandard] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!standard.trim()) return toast.error("Course name cannot be empty.");
    onConfirm(standard.trim());
    setStandard("");
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Add Course</h2>
        <div className="modal-body">
          <Form.Control
            type="text"
            placeholder="Enter Standard/Course Name"
            value={standard}
            onChange={(e) => setStandard(e.target.value)}
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

const EditCourseModal = ({ isOpen, onClose, onConfirm, course }) => {
  const [standard, setStandard] = useState(course?.standard || "");

  useEffect(() => {
    if (course) setStandard(course.standard);
  }, [course]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!standard.trim()) return toast.error("Course name cannot be empty.");
    onConfirm(course.id, standard.trim());
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Edit Course</h2>
        <div className="modal-body">
          <Form.Control
            type="text"
            placeholder="Enter Standard/Course Name"
            value={standard}
            onChange={(e) => setStandard(e.target.value)}
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

const DeleteCourseModal = ({ isOpen, onClose, onConfirm, course }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Delete Course</h2>
        <div className="modal-body text-center">
          <p>Are you sure you want to delete this course?</p>
          <p className="fw-bold">{course?.standard}</p>
        </div>
        <div className="modal-buttons">
          <Button className="modal-button delete" onClick={() => onConfirm(course.id)}>
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
          <p>Are you sure you want to edit this course? This may affect student data.</p>
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

// --------------------- Main Component ---------------------
const CourseSetup = () => {
  const { user, admin, currentAcademicYear, loading, forceLogout } = useAuthContext();
  const schoolId = user?.uid || admin?.adminId || "-";

  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [newStandard, setNewStandard] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isConfirmEditModalOpen, setIsConfirmEditModalOpen] = useState(false);

  // --------------------- Fetch Courses ---------------------
  const fetchCourses = async () => {
    if (!schoolId || schoolId === "-" || !currentAcademicYear) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${ENDPOINTS.administration}/courses?schoolId=${schoolId}&year=${currentAcademicYear}`);
      if (!res.ok) throw new Error("Failed to fetch courses");
      const data = await res.json();
      setCourses(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch courses.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [schoolId, currentAcademicYear]);

  // --------------------- Add Course ---------------------
  const handleAddCourse = async (standard) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${ENDPOINTS.administration}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId: schoolId, academicYear: currentAcademicYear, standard }),
      });
      if (!res.ok) throw new Error("Failed to add course");
      await fetchCourses(); // refresh from backend
      setIsAddModalOpen(false);
      toast.success("Course added successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add course.");
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------- Edit Course ---------------------
  const handleEditCourse = (id, newName) => {
    setSelectedCourse(courses.find((c) => c.id === id));
    setNewStandard(newName);
    setIsEditModalOpen(false);
    setIsConfirmEditModalOpen(true);
  };

  const confirmEditCourse = async () => {
    if (!selectedCourse) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `${ENDPOINTS.administration}/courses/${selectedCourse.id}?schoolId=${schoolId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schoolId: schoolId, standard: newStandard }),
        }
      );
      if (!res.ok) throw new Error("Failed to update course");
      await fetchCourses();
      setIsConfirmEditModalOpen(false);
      toast.success("Course updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update course.");
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------- Delete Course ---------------------
  const handleDeleteCourse = async (id) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${ENDPOINTS.administration}/courses/${id}?schoolId=${schoolId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete course");
      await fetchCourses();
      setIsDeleteModalOpen(false);
      toast.success("Course deleted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete course.");
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------- Import / Export ---------------------
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
        const standard = row["Course Name"] || row["standard"];
        if (standard && !courses.some((c) => c.standard.toLowerCase() === standard.toLowerCase())) {
          await handleAddCourse(standard);
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExport = () => {
    if (!courses.length) return toast.error("No data to export");
    const exportData = courses.map((c) => ({ "Course Name": c.standard }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Courses");
    XLSX.writeFile(workbook, `Courses_Export_${schoolId}_${currentAcademicYear}.xlsx`);
    toast.success("Courses exported successfully!");
  };

  const filteredCourses = courses.filter((c) =>
    c.standard.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainContentPage>
      <Container fluid className="px-0 px-lg-0">
        <nav className="custom-breadcrumb py-1 py-lg-3">
          <Link to="/home">Home</Link> &gt; <span>Administration</span> &gt;{" "}
          <span className="current col-12">Standard/Course Setup</span>
        </nav>

        <Row>
          <Col xs={12}>
            <div className="course-setup-container">
              <div className="form-card mt-3">
                <div className="header p-3 d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="m-0 d-none d-lg-block">Create Standard/Course Name Setup</h2>
                    <h6 className="m-0 d-lg-none">Create Standard/Course Name Setup</h6>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <input type="file" accept=".xlsx, .xls" onChange={handleImport} style={{ display: "none" }} id="import-file" />
                    <Button onClick={() => document.getElementById("import-file").click()} className="btn btn-primary text-light" disabled={isLoading}>Import</Button>
                    <Button onClick={handleExport} className="btn btn-primary text-light" disabled={isLoading || !courses.length}>Export</Button>
                    <Button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary text-light" disabled={isLoading}>+ Add Course</Button>
                  </div>
                </div>

                <div className="content-wrapper p-4">
                  {!currentAcademicYear ? (
                    <div className="alert alert-warning">Please select an academic year to manage courses.</div>
                  ) : (
                    <>
                      <div className="position-relative mb-3">
                        <Form.Control
                          type="text"
                          placeholder="Search by Course Name"
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
                                <th>Course Name</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {courses.length === 0 ? (
                                <tr><td colSpan="2" className="text-center">No data available</td></tr>
                              ) : filteredCourses.length === 0 && searchTerm ? (
                                <tr><td colSpan="2" className="text-center">No matching courses found</td></tr>
                              ) : (
                                filteredCourses.map((course) => (
                                  <tr key={course.id}>
                                    <td>{course.standard}</td>
                                    <td>
                                      <Button variant="link action-button edit-button me-2" onClick={() => { setSelectedCourse(course); setIsEditModalOpen(true) }}><FaEdit /></Button>
                                      <Button variant="link action-button delete-button" onClick={() => { setSelectedCourse(course); setIsDeleteModalOpen(true) }}><FaTrash /></Button>
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

      <AddCourseModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onConfirm={handleAddCourse} />
      <EditCourseModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onConfirm={handleEditCourse} course={selectedCourse} />
      <DeleteCourseModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteCourse} course={selectedCourse} />
      <ConfirmEditModal isOpen={isConfirmEditModalOpen} onClose={() => setIsConfirmEditModalOpen(false)} onConfirm={confirmEditCourse} currentName={selectedCourse?.standard} newName={newStandard} />

      <ToastContainer />
    </MainContentPage>
  );
};

export default CourseSetup;