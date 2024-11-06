import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export default function AddProjectForm() {
  const [newProject, setNewProject] = useState({
    nameProject: "",
    description: "",
    valuePerHour: "",
  });
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/project/${user.id}/get-project/${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const projectData = response.data;
        setNewProject({
          nameProject: projectData.nameProject || "",
          description: projectData.description || "",
          valuePerHour: projectData.valuePerHour || "",
        });
      } catch (error) {
        console.error("Error fetching project data:", error);
      }
    };

    if (projectId && user) {
      fetchProject();
    }
  }, [projectId, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      };

      if (projectId) {
        await axios.put(
          `http://localhost:8080/api/project/${user.id}/update-project/${projectId}`,
          newProject,
          config
        );
      } else {
        await axios.post(
          `http://localhost:8080/api/project/${user.id}/add-project`,
          newProject,
          config
        );
      }
      navigate("/");
    } catch (error) {
      console.error("Error submitting project:", error);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setNewProject((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  return (
    <Form className="form-default" onSubmit={handleSubmit}>
      <h2>{projectId ? "Edit Project" : "Create New Project"}</h2>
      <Form.Group className="mb-3" controlId="nameProject">
        <Form.Label>Project Name</Form.Label>
        <Form.Control
          type="text"
          name="nameProject"
          value={newProject.nameProject}
          onChange={handleChange}
          placeholder="Enter project name"
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="description">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          name="description"
          value={newProject.description}
          onChange={handleChange}
          rows={5}
          placeholder="Enter Description"
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="valuePerHour">
        <Form.Label>Value Per Hour</Form.Label>
        <Form.Control
          type="number"
          name="valuePerHour"
          value={newProject.valuePerHour}
          onChange={handleChange}
          placeholder="Enter Value per hour"
        />
      </Form.Group>

      <Button variant="primary" type="submit">
        Submit
      </Button>
    </Form>
  );
}
