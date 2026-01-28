import React, { useState, useEffect } from "react";
import API from "./services/api";

function CRUD() {
  const [people, setPeople] = useState([]);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingPerson, setEditingPerson] = useState(null);

  // Fetch all people
  const fetchPeople = async () => {
    try {
      setLoading(true);
      const res = await API.get("/people");
      setPeople(res.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch people: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  // Add or Update Person
  const handleSubmit = async () => {
    if (!name.trim() || !age) {
      setError("Please fill in both name and age");
      return;
    }

    try {
      setLoading(true);

      if (editingPerson) {
        // Update existing person
        const res = await API.put(`/people/${editingPerson.id}`, {
          name: name.trim(),
          age: parseInt(age),
        });
        setPeople(
          people.map((p) => (p.id === editingPerson.id ? res.data : p))
        );
        setEditingPerson(null);
      } else {
        // Add new person
        const res = await API.post("/people", {
          name: name.trim(),
          age: parseInt(age),
        });
        setPeople([...people, res.data]);
      }

      // Reset form
      setName("");
      setAge("");
      setError("");
    } catch (err) {
      setError("Operation failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete person
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await API.delete(`/people/${id}`);
      setPeople(people.filter((p) => p.id !== id));
    } catch (err) {
      setError("Failed to delete person: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Start editing
  const startEditing = (person) => {
    setEditingPerson(person);
    setName(person.name);
    setAge(person.age);
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="text-center mb-5">
            <h1 className="fw-bolder text-primary">
              <i className="bi bi-people-fill me-2"></i>People Manager
            </h1>
            <p className="text-muted lead">
              A simple and elegant CRUD application for managing people.
            </p>
          </div>

          {error && (
            <div className="alert alert-danger text-center shadow-sm" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
          )}

          {/* Add / Edit Person Form */}
          <div className="card shadow-lg border-0 mb-5">
            <div className="card-body p-4 p-md-5">
              <h4 className={`card-title mb-4 fw-bold ${editingPerson ? "text-warning" : "text-success"}`}>
                <i className={`bi ${editingPerson ? "bi-pencil-square" : "bi-plus-circle-fill"} me-2`}></i>
                {editingPerson ? "Edit Person" : "Add New Person"}
              </h4>
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <div className="row g-3">
                  <div className="col-md-5">
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="Enter name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                      aria-label="Name"
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control form-control-lg"
                      placeholder="Enter age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      min="1"
                      max="150"
                      disabled={loading}
                      aria-label="Age"
                    />
                  </div>
                  <div className="col-md-4 d-flex gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`btn btn-lg w-100 ${editingPerson ? "btn-warning" : "btn-success"}`}
                    >
                      {loading
                        ? editingPerson ? "Saving..." : "Adding..."
                        : editingPerson ? "Save Changes" : "Add Person"}
                    </button>
                    {editingPerson && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPerson(null);
                          setName("");
                          setAge("");
                        }}
                        className="btn btn-lg btn-secondary"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* People List */}
          <div className="card shadow-lg border-0">
            <div className="card-header bg-dark text-white d-flex align-items-center justify-content-between p-4">
              <h4 className="mb-0 fw-bold"><i className="bi bi-list-ul me-2"></i>People List</h4>
              <span className="badge bg-secondary rounded-pill fs-6 py-2 px-3">Total: {people.length}</span>
            </div>
            <div className="card-body p-0">
              {loading && people.length === 0 ? (
                <div className="text-center p-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Fetching people data...</p>
                </div>
              ) : people.length === 0 ? (
                <div className="text-center p-5">
                  <i className="bi bi-person-fill-slash" style={{ fontSize: "3rem", color: "#6c757d" }}></i>
                  <p className="mt-3 text-muted">No people found. Add some to get started!</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover mb-0">
                    <thead>
                      <tr className="bg-light">
                        <th scope="col">ID</th>
                        <th scope="col">Name</th>
                        <th scope="col">Age</th>
                        <th scope="col" className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {people.map((person) => (
                        <tr key={person.id} className="align-middle">
                          <td>{person.id}</td>
                          <td>{person.name}</td>
                          <td>{person.age}</td>
                          <td className="text-center">
                            <div className="btn-group" role="group" aria-label="Person Actions">
                              <button
                                onClick={() => startEditing(person)}
                                className="btn btn-sm btn-outline-warning"
                              >
                                <i className="bi bi-pencil"></i> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(person.id)}
                                disabled={loading}
                                className="btn btn-sm btn-outline-danger"
                              >
                                <i className="bi bi-trash"></i> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CRUD;