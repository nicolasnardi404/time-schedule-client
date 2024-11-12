import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Container, Table, Modal, Alert } from "react-bootstrap";
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
    fetchProjects();
    fetchTotalProjects();
  }, [currentPage]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/project/${user.id}/pagination?page=${currentPage - 1}&size=10`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setProjects(response.data.content);
      setTotalProjects(response.data.totalCount);
      // Calculate total pages based on the totalCount
      const totalPages = Math.ceil(response.data.totalCount / 10); // Assuming 10 projects per page
      setCurrentPage(Math.min(currentPage, totalPages)); // Ensure currentPage doesn't exceed totalPages
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

  const handleDelete = (projectId) => {
    setProjectToDelete(projectId);
    setShowDeleteModal(true);
  };

  const handlePageChange = (newPage) => {
    if (typeof newPage === 'number' && newPage >= 1 && newPage <= Math.ceil(totalProjects / 10)) {
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
      <Container className="mt-4">
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

        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Project</th>
              <th>Description</th>
              <th>Created at</th>
              <th>Value per Hour</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.length > 0 ? (
              projects.map((project) => (
                <tr key={project.id}>
                  <td>{project.nameProject || "-"}</td>
                  <td>{project.description || "-"}</td>
                  <td>{new Date(project.creationDate).toLocaleString()}</td>
                  <td>${project.valuePerHour || "-"}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          navigate(`/project/${project.id}/activities`)
                        }
                      >
                        Activities
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          navigate(`/update-project/${project.id}`)
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(project.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">
                  No projects found
                </td>
              </tr>
            )}
          </tbody>
        </Table>

        {projects.length > 0 && (
          <>
            <PaginationComponent 
              totalPages={Math.ceil(totalProjects / 10)} 
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
