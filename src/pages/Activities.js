import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Button, Table, Modal, Form, Container, Alert } from "react-bootstrap";
import NavBar from "../components/NavBar";

const calculateHours = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffInMilliseconds = endDate - startDate;
  const diffInHours = diffInMilliseconds / (1000 * 60 * 60);
  return diffInHours.toFixed(2);
};

const calculateTotalHours = (activities) => {
  if (!activities || activities.length === 0) return "0.00";
  return activities
    .reduce((total, activity) => {
      return (
        total + parseFloat(calculateHours(activity.beginning, activity.end))
      );
    }, 0)
    .toFixed(2);
};

const calculateTotalValue = (totalHours, valuePerHour) => {
  return (parseFloat(totalHours) * parseFloat(valuePerHour)).toFixed(2);
};

export default function Activities() {
  const [activities, setActivities] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [newActivity, setNewActivity] = useState({
    description: "",
    beginning: "",
    end: "",
    projectId: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [projectDetails, setProjectDetails] = useState(null);

  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (projectId) {
      setNewActivity((prev) => ({ ...prev, projectId }));
      fetchActivities();
      fetchProjectDetails();
    }
  }, [projectId]);

  const fetchActivities = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/activities/project/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setActivities(response.data);
    } catch (error) {
      setError("Failed to fetch activities");
      console.error("Error:", error);
    }
  };

  const fetchProjectDetails = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/project/${user.id}/get-project/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setProjectDetails(response.data);
    } catch (error) {
      console.error("Error fetching project details:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(
          `http://localhost:8080/api/activities/${editingActivity.id}`,
          {
            ...newActivity,
            projectId: parseInt(projectId),
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );
        setShowModal(false);
        setNewActivity({
          description: "",
          beginning: "",
          end: "",
          projectId: projectId,
        });
        setIsEditing(false);
        setEditingActivity(null);
        fetchActivities();
      } else {
        await axios.post(
          `http://localhost:8080/api/activities/project/${projectId}`,
          {
            ...newActivity,
            projectId: parseInt(projectId),
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );
        setShowModal(false);
        setNewActivity({
          description: "",
          beginning: "",
          end: "",
          projectId: projectId,
        });
        fetchActivities();
      }
    } catch (error) {
      setError("Failed to create activity");
      console.error("Error:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewActivity((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = (activity) => {
    setIsEditing(true);
    setEditingActivity(activity);
    setNewActivity({
      description: activity.description,
      beginning: new Date(activity.beginning).toISOString().slice(0, 16),
      end: new Date(activity.end).toISOString().slice(0, 16),
      projectId: projectId,
    });
    setShowModal(true);
  };

  const handleDelete = async (activityId) => {
    try {
      await axios.delete(`http://localhost:8080/api/activities/${activityId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      fetchActivities();
    } catch (error) {
      setError("Failed to delete activity");
      console.error("Error:", error);
    }
  };

  return (
    <>
      <NavBar />
      <Container className="mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Activities</h2>
          <Button onClick={() => setShowModal(true)}>Add Activity</Button>
        </div>

        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Description</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Total Hours</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {activities && activities.length > 0 ? (
              activities.map((activity) => (
                <tr key={activity.id}>
                  <td>{activity.description}</td>
                  <td>{new Date(activity.beginning).toLocaleString()}</td>
                  <td>{new Date(activity.end).toLocaleString()}</td>
                  <td>
                    {calculateHours(activity.beginning, activity.end)} hours
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEdit(activity)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(activity.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No activities available</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="table-info">
              <td colSpan="3" className="text-end fw-bold">
                Total Project Hours:
              </td>
              <td colSpan="2" className="fw-bold">
                {calculateTotalHours(activities)} hours
              </td>
            </tr>
          </tfoot>
        </Table>

        {projectDetails && (
          <div className="mt-4 p-3 bg-light rounded">
            <h4>Project Summary</h4>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="mb-1">
                  <strong>Value per Hour:</strong> $
                  {projectDetails.valuePerHour}
                </p>
                <p className="mb-1">
                  <strong>Total Hours:</strong>{" "}
                  {calculateTotalHours(activities)}
                </p>
              </div>
              <div>
                <h5 className="text-primary">
                  Total Project Value: $
                  {calculateTotalValue(
                    calculateTotalHours(activities),
                    projectDetails.valuePerHour
                  )}
                </h5>
              </div>
            </div>
          </div>
        )}

        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Add New Activity</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  type="text"
                  name="description"
                  value={newActivity.description}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Start Time</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="beginning"
                  value={newActivity.beginning}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>End Time</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="end"
                  value={newActivity.end}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save Activity
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      </Container>
    </>
  );
}
