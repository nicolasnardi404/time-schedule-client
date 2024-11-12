import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Button, Table, Modal, Form, Container, Alert, ButtonGroup, Dropdown } from "react-bootstrap";
import NavBar from "../components/NavBar";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

<style>
  {`
    .btn-ellipsis {
      padding: 0 0.5rem;
      font-weight: bold;
      font-size: 1.2rem;
      line-height: 1;
    }
    .btn-ellipsis::after {
      display: none;
    }
  `}
</style>

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
  const [filterStatus, setFilterStatus] = useState('all');
  const [activityCounts, setActivityCounts] = useState({
    all: 0,
    open: 0,
    closed: 0
  });

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

  useEffect(() => {
    if (projectId) {
      fetchActivityCounts();
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchActivities();
    }
  }, [filterStatus, projectId]);

  const fetchActivityCounts = async () => {
    try {
      const [allResponse, openResponse, closedResponse] = await Promise.all([
        axios.get(`http://localhost:8080/api/activities/project/${projectId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        axios.get(`http://localhost:8080/api/activities/project/${projectId}/open`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        axios.get(`http://localhost:8080/api/activities/project/${projectId}/closed`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
      ]);

      setActivityCounts({
        all: allResponse.data.length,
        open: openResponse.data.length,
        closed: closedResponse.data.length
      });
    } catch (error) {
      console.error("Error fetching activity counts:", error);
    }
  };

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      let endpoint = `http://localhost:8080/api/activities/project/${projectId}`;
      
      if (filterStatus === 'open') {
        endpoint += '/open';
      } else if (filterStatus === 'closed') {
        endpoint += '/closed';
      }

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

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

  // Add this new function to handle toggling activity status
  const handleToggleStatus = async (activityId) => {
    try {
      await axios.put(
        `http://localhost:8080/api/activities/${activityId}/toggle-status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      fetchActivities();
      fetchActivityCounts(); // Refresh the counts after toggling
    } catch (error) {
      setError("Failed to update activity status");
      console.error("Error:", error);
    }
  };

  return (
    <>
      <NavBar />
      <Container className="mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Activities</h2>
          <div className="d-flex gap-2">
            <Button onClick={() => setShowModal(true)}>Add Activity</Button>
          </div>
        </div>

        <div className="mb-4">
          <ButtonGroup>
            <Button
              variant={filterStatus === 'all' ? 'primary' : 'outline-primary'}
              onClick={() => setFilterStatus('all')}
            >
              All Activities ({activityCounts.all})
            </Button>
            <Button
              variant={filterStatus === 'open' ? 'primary' : 'outline-primary'}
              onClick={() => setFilterStatus('open')}
            >
              Open Activities ({activityCounts.open})
            </Button>
            <Button
              variant={filterStatus === 'closed' ? 'primary' : 'outline-primary'}
              onClick={() => setFilterStatus('closed')}
            >
              Closed Activities ({activityCounts.closed})
            </Button>
          </ButtonGroup>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {isLoading ? (
          <div className="text-center">Loading...</div>
        ) : activities.length > 0 ? (
          Object.entries(organizeActivitiesByMonth(activities)).map(([monthYear, monthActivities]) => (
            <div key={monthYear} className="mb-5">
              <h3>{monthYear}</h3>
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
                    <tr key={activity.id}>
                      <td>{activity.description}</td>
                      <td>{new Date(activity.beginning).toLocaleString()}</td>
                      <td>{new Date(activity.end).toLocaleString()}</td>
                      <td>{calculateHours(activity.beginning, activity.end)}</td>
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
                          <Dropdown>
                            <Dropdown.Toggle 
                              variant="light" 
                              size="sm" 
                              id={`dropdown-${activity.id}`}
                              className="btn-ellipsis"
                            >
                              ...
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item 
                                onClick={() => handleToggleStatus(activity.id)}
                              >
                                {activity.isClosed ? "Reopen Activity" : "Close Activity"}
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filterStatus === 'all' ? (
                    <>
                      <tr className="table-info">
                        <td colSpan="2" className="text-end fw-bold">
                          Open Activities Total Value:
                        </td>
                        <td className="fw-bold">
                          ${calculateTotalValue(
                            calculateTotalHours(monthActivities.filter(a => !a.isClosed)),
                            projectDetails?.valuePerHour || 0
                          )}
                        </td>
                        <td colSpan="2" className="text-end fw-bold">
                          Closed Activities Total Value:
                        </td>
                        <td className="fw-bold">
                          ${calculateTotalValue(
                            calculateTotalHours(monthActivities.filter(a => a.isClosed)),
                            projectDetails?.valuePerHour || 0
                          )}
                        </td>
                      </tr>
                      <tr className="table-primary">
                        <td colSpan="2" className="text-end fw-bold">
                          Month Total Hours:
                        </td>
                        <td className="fw-bold">
                          {calculateTotalHours(monthActivities)} hours
                        </td>
                        <td colSpan="2" className="text-end fw-bold">
                          Month Total Value:
                        </td>
                        <td className="fw-bold">
                          ${calculateTotalValue(
                            calculateTotalHours(monthActivities),
                            projectDetails?.valuePerHour || 0
                          )}
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr className="table-primary">
                      <td colSpan="2" className="text-end fw-bold">
                        Total Hours:
                      </td>
                      <td className="fw-bold">
                        {calculateTotalHours(monthActivities)} hours
                      </td>
                      <td colSpan="2" className="text-end fw-bold">
                        Total Value:
                      </td>
                      <td className="fw-bold">
                        ${calculateTotalValue(
                          calculateTotalHours(monthActivities),
                          projectDetails?.valuePerHour || 0
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
              <Button 
                variant="primary"
                onClick={() => handleGeneratePdf(monthActivities, monthYear)}
              >
                Generate PDF
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center">No activities available</div>
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
