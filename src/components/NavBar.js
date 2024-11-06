import Nav from "react-bootstrap/Nav";

export default function NavBar() {
  return (
    <>
      <Nav>
        <Nav.Item>
          <Nav.Link href="/">Home</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href="/add-project">Add New Project</Nav.Link>
        </Nav.Item>
      </Nav>
    </>
  );
}
