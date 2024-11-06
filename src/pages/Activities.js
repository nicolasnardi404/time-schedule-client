import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Button, Container, Table, Modal, Form } from "react-bootstrap";

export default function Activities() {
  const [activities, setActivities] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newActivity, setNewActivity] = useState({
    description: "",
    beginning: "",
    end: "",
  });
  const { projectId } = useParams();
  const { user } = useAuth();

  useEffect(() => {
    fetchActivities();
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
      console.error("Error fetching activities:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `http://localhost:8080/api/activities/project/${projectId}`,
        newActivity,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setShowModal(false);
      fetchActivities();
    } catch (error) {
      console.error("Error creating activity:", error);
    }
  };

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Project Activities</h1>
        <Button onClick={() => setShowModal(true)}>Add Activity</Button>
      </div>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Description</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => (
            <tr key={activity.id}>
              <td>{activity.description}</td>
              <td>{activity.beginning}</td>
              <td>{activity.end}</td>
              <td>
                <Button variant="secondary">Edit</Button>
                <Button variant="danger">Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}
