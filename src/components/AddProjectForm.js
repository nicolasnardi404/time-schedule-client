import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useParams } from "react-router-dom";
import axios from "axios";

export default function AddProjectForm() {
    const [newProject, setNewProject] = useState({
        nameProject: "",
        description: "",
        valuePerHour: ""
    })
    const {idProject} = useParams();

    useEffect(() => {
        if (idProject) {
          axios.get(`http://localhost:8080/api/project/1/get-project/${idProject}`)
            .then(response => {
              const responseData = response.data; // Access the nested data
              setNewProject({
                nameProject: responseData.nameProject || '',
                description: responseData.description || '',
                valuePerHour: responseData.valuePerHour || ''
              });
            })
            .catch(error => {
              console.error('Error fetching project data:', error);
            });
        }
      }, [idProject]);

    async function handleSubmit(){
        try {
            let response;
            if(idProject){
                response = axios.put(`http://localhost:8080/api/project/1/update-project/${idProject}`, newProject)
            } else{
                response = axios.post('http://localhost:8080/api/project/1/add-project', newProject);
            }

            const data = await response.json();

        
            console.error(`HTTP error! status: ${response.status}`);
            if(!response.ok){
                console.error(`HTTP error! status: ${response.status}`);
            }
            setNewProject({nameProject: "", description: "", valuePerHour: ""});

        } catch (error) {
            console.error(error.message);
        }
    }

    const handleChange = (event) => {
        const { name, value } = event.target;
        setNewProject(prevState => ({
            ...prevState,
            [name]: value
        }));
        console.log(newProject)
    };
    

    return (
        <Form className='form-default' onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="nameProject">
                <Form.Label>Project Name</Form.Label>
                <Form.Control 
                    type="text" 
                    name="nameProject" 
                    value={newProject.nameProject}
                    onChange={handleChange}
                    placeholder="Enter project name" />
            </Form.Group>

            <Form.Group className="mb-3" controlId="description">
                <Form.Label>Description</Form.Label>
                <Form.Control 
                    as="textarea" 
                    name="description"
                    value={newProject.description}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Enter Description" />
            </Form.Group>

            <Form.Group className="mb-3" controlId="valuePerHour">
                <Form.Label>Value Per Hour</Form.Label>
                <Form.Control 
                    type="number" 
                    name="valuePerHour"
                    value={newProject.valuePerHour}
                    onChange={handleChange}
                    placeholder="Enter Value per hour" />
            </Form.Group>

            <Button variant="primary" type="submit">
                Submit
            </Button>
        </Form>
    );
}
