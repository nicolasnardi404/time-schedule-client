import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";


export default function HomeComponent() {
    const [projects, setProjects] = useState([]);
    const idUser = useParams("idUser");

    useEffect(() => {
        fetch(`http://localhost:8080/api/project/1/all-projects`)
            .then(response => response.json())
            .then(data => setProjects(data));
    }, [])

    return (
        <div>
            <table className="table-default table table-striped">
                <thead>
                    <tr>
                        <th>Project</th>
                        <th>Description</th>
                        <th>Created at</th>
                        <th>Value per Hour</th>
                    </tr>
                </thead>
                <tbody>
                {projects.length > 0 ? (
                    projects.map((project) =>
                        <tr key={project.id}>
                            <td>{project.nameProject || "-"}</td>
                            <td>{project.description || "-"}</td>
                            <td>{new Date(project.creationDate).toLocaleString()}</td>
                            <td>{project.valuePerHour || "-"}</td>
                        </tr>
                    )
                ) : (
                    <tr><td colspan="4">No projects found</td></tr>
                )}
                </tbody>
            </table>
        </div>
    );
}
