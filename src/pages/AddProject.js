import NavBar from "../components/NavBar";
import AddProjectForm from "../components/AddProjectForm";
import { Container, Card } from "react-bootstrap";

export default function AddProject() {
  return (
    <div className="page-container">
      <NavBar />
      <Container className="py-5">
        <Card className="project-form-card">
          <Card.Body>
            <AddProjectForm />
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
