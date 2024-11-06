import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Table, Alert } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export default function HomeComponent() {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/project/${user.id}/all-projects`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setProjects(response.data);
      } catch (err) {
        setError("Failed to fetch projects");
        console.error("Error:", err);
      }
    };

    if (user) {
      fetchProjects();
    }
  }, [user]);

  const handleDelete = async (projectId) => {
    try {
      await axios.delete(
        `http://localhost:8080/api/project/${user.id}/projects/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setProjects(projects.filter((project) => project.id !== projectId));
    } catch (err) {
      setError("Failed to delete project");
      console.error("Error:", err);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Projects</h2>
        <Button onClick={() => navigate("/add-project")}>
          Add New Project
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

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
                      onClick={() => navigate(`/update-project/${project.id}`)}
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
    </div>
  );
}
