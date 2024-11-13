import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Container, Alert, Modal, Dropdown, DropdownButton } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import PaginationComponent from "../components/PaginationComponent"

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);

  useEffect(() => {
    if (isNaN(currentPage)) {
      return;
    }
    
    const fetchData = async () => {
      await fetchProjects();
      await fetchTotalProjects();
    };
    fetchData();
  }, [currentPage]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/project/${user.id}/pagination?page=${currentPage - 1}&size=12`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setProjects(response.data.content);
      setTotalProjects(response.data.totalCount);
    } catch (error) {
      setError("Failed to fetch projects");
      console.error("Error:", error);
    }
  };

  const fetchTotalProjects = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/project/${user.id}/projects/count`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setTotalProjects(response.data);
    } catch (error) {
      console.error('Error fetching total projects:', error);
      setTotalProjects(0);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const searchTerm = e.target.querySelector('input').value;
    
    try {
      const response = await axios.get(
        `http://localhost:8080/api/project/${user.id}/search`,
        {
          params: { searchTerm },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      setProjects(response.data);
    } catch (error) {
      setError("Failed to perform search");
      console.error("Error:", error);
    }
  };

  const handleDelete = (projectId) => {
    setProjectToDelete(projectId);
    setShowDeleteModal(true);
  };

  const handlePageChange = (newPage) => {
    if (typeof newPage === 'number' && newPage >= 1 && newPage <= Math.ceil(totalProjects / 12)) {
      setCurrentPage(newPage);
    } else {
      console.warn(`Invalid page number: ${newPage}`);
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:8080/api/project/${user.id}/projects/${projectToDelete}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setProjects(projects.filter((project) => project.id !== projectToDelete));
      setShowDeleteModal(false);
    } catch (error) {
      setError("Failed to delete project");
      console.error("Error:", error);
    }
  };

  return (
    <>
      <NavBar />
      <Container >
        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>My Projects</h2>
          <Button onClick={() => navigate("/add-project")}>
            Add New Project
          </Button>
        </div>

        <form onSubmit={handleSearch} className="mb-4">
          <div className="input-group">
            <input 
              className="form-control" 
              type="text" 
              placeholder="Search projects..." 
              aria-label="Search"
            />
            <button className="btn btn-outline-success" type="submit">
              Search
            </button>
          </div>
        </form>

        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {projects.length > 0 ? (
            projects.map((project) => (
              <div key={project.id} className="col">
                <div className="card h-100 shadow-sm border-0">
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="card-title mb-0">{project.nameProject || "-"}</h5>
                      <div className="d-flex gap-1">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          className="py-0 px-2"
                          onClick={() => navigate(`/update-project/${project.id}`)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          className="py-0 px-2"
                          onClick={() => handleDelete(project.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <p className="card-text text-muted">{project.description || "-"}</p>
                    <div className="mt-auto">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted">
                          Created: {new Date(project.creationDate).toLocaleString()}
                        </small>
                        <span className="badge bg-primary">
                          ${project.valuePerHour || "-"}/hr
                        </span>
                      </div>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={() => navigate(`/project/${project.id}/activities`)}
                        className="w-100"
                      >
                        Activities
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12 text-center">
              <p className="text-muted">No projects found</p>
            </div>
          )}
        </div>

        {projects.length > 0 && (
          <>
            <PaginationComponent 
              totalPages={Math.ceil(totalProjects / 12)} 
              currentPage={currentPage} 
              onPageChange={handlePageChange}
            />
            
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Confirm Delete</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                Are you sure you want to delete this project? This action cannot be undone.
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={confirmDelete}>
                  Delete
                </Button>
              </Modal.Footer>
            </Modal>
          </>
        )}
      </Container>
    </>
  );
}
