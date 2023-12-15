import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);

    useEffect(() => {
        const fetchProjects = async () => {
        try {
            const response = await axios.get('http://localhost:5000/projects');
            setProjects(response.data);
        } catch (error) {
            console.error('Error fetching projects:', error.message);
        }
        };

        fetchProjects();
    }, []);

  return (
    <div>
      <h2>Project List</h2>
      <ul>
        {projects.map((project) => (
          <li key={project._id}>
            <p>Name: {project.name}</p>
            <p>Description: {project.description}</p>
            <p>Tag: {project.tag}</p>
            {/* Add more fields as needed */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectList; 