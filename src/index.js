import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Home from './pages/Home';
import AddProject from './pages/AddProject';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./App.css";

export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="add-project/:idUser" element={<AddProject />} />
        <Route path="update-project/:idUser/:idProject" element={<AddProject />} />
      </Routes>
    </ BrowserRouter>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <App />
);

