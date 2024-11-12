import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Button, Table, Modal, Form, Container, Alert } from "react-bootstrap";
import NavBar from "../components/NavBar";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

const generatePdf = (monthActivities, monthYear, projectDetails) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Add title
  doc.setFontSize(16);
  doc.text(`Activities Report - ${monthYear}`, pageWidth/2, 20, { align: 'center' });
  
  // Add project details
  doc.setFontSize(12);
  doc.text(`Project: ${projectDetails?.name || 'N/A'}`, 20, 40);
  doc.text(`Value per Hour: $${projectDetails?.valuePerHour || '0'}`, 20, 50);
  
  // Add activities table
  let yPos = 70;
  const headers = ['Description', 'Start Time', 'End Time', 'Hours'];
  const data = monthActivities.map(activity => [
    activity.description,
    new Date(activity.beginning).toLocaleString(),
    new Date(activity.end).toLocaleString(),
    calculateHours(activity.beginning, activity.end)
  ]);
  
  // Add total
  const totalHours = calculateTotalHours(monthActivities);
  const totalValue = calculateTotalValue(totalHours, projectDetails?.valuePerHour || 0);
  
  doc.autoTable({
    startY: yPos,
    head: [headers],
    body: data,
    foot: [['Total', '', '', `${totalHours} hours`]],
    theme: 'grid'
  });
  
  doc.text(`Total Value: $${totalValue}`, 20, doc.lastAutoTable.finalY + 20);
  
  // Save the PDF
  doc.save(`activities-${monthYear}.pdf`);
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
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);

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
      setIsLoading(true);
      const response = await axios.get(
        `http://localhost:8080/api/activities/project/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Extract just the necessary activity data
      const activitiesData = Array.isArray(response.data)
        ? response.data.map((activity) => ({
            id: activity.id,
            description: activity.description,
            beginning: activity.beginning,
            end: activity.end,
            isClosed: activity.closed
          }))
        : [];

      setActivities(activitiesData);
    } catch (error) {
      console.error("GET activities error:", error.response?.status);
      setError("Failed to fetch activities");
      setActivities([]);
    } finally {
      setIsLoading(false);
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
      const token = localStorage.getItem("token");
      console.log("Token present:", !!token);
      console.log("Token first 10 chars:", token?.substring(0, 10));

      const formattedActivity = {
        description: newActivity.description,
        beginning: new Date(newActivity.beginning).toISOString(),
        end: new Date(newActivity.end).toISOString(),
      };

      console.log("Sending activity data:", formattedActivity);
      console.log("Project ID:", projectId);

      if (isEditing) {
        await axios.put(
          `http://localhost:8080/api/activities/${editingActivity.id}`,
          formattedActivity,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        const response = await axios.post(
          `http://localhost:8080/api/activities/project/${projectId}`,
          formattedActivity,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Server response:", response.data);
      }

      setShowModal(false);
      setNewActivity({
        description: "",
        beginning: "",
        end: "",
        projectId: projectId,
      });
      if (isEditing) {
        setIsEditing(false);
        setEditingActivity(null);
      }
      fetchActivities();
    } catch (error) {
      console.error("Full error object:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error status:", error.response?.status);
      setError(
        error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Failed to save activity"
      );
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
    setActivityToDelete(activityId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:8080/api/activities/${activityToDelete}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      fetchActivities();
      setShowDeleteModal(false);
    } catch (error) {
      setError("Failed to delete activity");
      console.error("Error:", error);
    }
  };

  const organizeActivitiesByMonth = (activities) => {
    if (!activities) return {};
    
    return activities.reduce((acc, activity) => {
      const date = new Date(activity.beginning);
      const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
      
      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }
      acc[monthYear].push(activity);
      return acc;
    }, {});
  };

  const handleCloseMonth = async (year, month) => {
    try {
      await axios.put(
        `http://localhost:8080/api/activities/project/${projectId}/close-month?year=${year}&month=${month}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      fetchActivities();
    } catch (error) {
      setError("Failed to close activities for the month");
      console.error("Error:", error);
    }
  };

  const handleGeneratePdf = (monthActivities, monthYear) => {
    generatePdf(monthActivities, monthYear, projectDetails);
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

        {isLoading ? (
          <div className="text-center">Loading...</div>
        ) : activities && activities.length > 0 ? (
          Object.entries(organizeActivitiesByMonth(activities)).map(([monthYear, monthActivities]) => {
            const [monthName, yearStr] = monthYear.split(' ');
            const year = parseInt(yearStr);
            const month = new Date(Date.parse(monthName + " 1, 2000")).getMonth() + 1;
            
            const allClosed = monthActivities.every(activity => activity.isClosed);

            return (
              <div key={monthYear} className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3>{monthYear}</h3>
                  <Button 
                    variant={allClosed ? "success" : "warning"}
                    onClick={() => handleCloseMonth(year, month)}
                    disabled={allClosed}
                  >
                    {allClosed ? "Month Closed" : "Close Month"}
                  </Button>
                </div>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Start Time</th>
                      <th>End Time</th>
                      <th>Total Hours</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthActivities.map((activity) => (
                      <tr key={activity.id} className={activity.isClosed ? 'table-secondary' : ''}>
                        <td>{activity.description}</td>
                        <td>{new Date(activity.beginning).toLocaleString()}</td>
                        <td>{new Date(activity.end).toLocaleString()}</td>
                        <td>{calculateHours(activity.beginning, activity.end)} hours</td>
                        <td>
                          <span className={`badge ${activity.isClosed ? 'bg-success' : 'bg-warning'}`}>
                            {activity.isClosed ? 'Closed' : 'Open'}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEdit(activity)}
                              disabled={activity.isClosed}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(activity.id)}
                              disabled={activity.isClosed}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr className="table-info">
                      <td colSpan="3" className="text-end fw-bold">
                        Total Hours for {monthYear}:
                      </td>
                      <td colSpan="3" className="fw-bold">
                        {calculateTotalHours(monthActivities)} hours
                      </td>
                    </tr>
                  </tbody>
                </Table>
                <Button 
                  variant="primary"
                  onClick={() => handleGeneratePdf(monthActivities, monthYear)}
                >
                  Generate PDF
                </Button>
              </div>
            );
          })
        ) : (
          <div className="text-center">No activities available</div>
        )}

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

        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to delete this activity?
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
}
