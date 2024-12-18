import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Projects from "./pages/Projects";
import AddProject from "./pages/AddProject";
import Activities from "./pages/Activities";
import LoginComponent from "./components/LoginComponent";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import Register from "./pages/Register";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { useContext } from "react";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Projects />
              </PrivateRoute>
            }
          />
          <Route
            path="/project/:projectId/activities"
            element={
              <PrivateRoute>
                <Activities />
              </PrivateRoute>
            }
          />
          <Route
            path="/add-project"
            element={
              <PrivateRoute>
                <AddProject />
              </PrivateRoute>
            }
          />
          <Route
            path="/update-project/:projectId"
            element={
              <PrivateRoute>
                <AddProject />
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<LoginComponent />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
