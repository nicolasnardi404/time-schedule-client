import Nav from "react-bootstrap/Nav";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Button from "react-bootstrap/Button";

export default function NavBar() {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <Nav className="nav">
      <div className="d-flex gap-2">
        <Nav.Link className="nav-link" onClick={() => handleNavigation("/")}>
          Dashboard
        </Nav.Link>
        <Nav.Link
          className="nav-link"
          onClick={() => handleNavigation("/add-project")}
        >
          New Project
        </Nav.Link>
      </div>
      <Button variant="outline-primary" onClick={handleLogout}>
        Logout
      </Button>
    </Nav>
  );
}
