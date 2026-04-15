import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from "react-router-dom";

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [q, setQ] = useState("");

  const fetchProjects = async () => {
    try {
      const params = {};
      if (q.trim()) params.q = q.trim();
      const response = await axios.get('http://localhost:5000/projects', { params });
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error.message);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 980, margin: "24px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>All Projects</h2>
          <p style={{ marginTop: 6, color: "#666" }}>
            This shows every project in the database.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link to="/project/upload">Upload new</Link>
          <Link to="/">Go to Global</Link>
        </div>
      </div>

      <div className="app-card" style={{ marginTop: 14 }}>
        <div className="app-card-body d-flex flex-wrap gap-2 align-items-center">
          <input
            className="form-control"
            style={{ maxWidth: 420 }}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, tag, college code…"
          />
          <button className="btn btn-soft" onClick={fetchProjects}>
            Search
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
        {projects.map((project) => (
          <div
            key={project._id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: 14,
              background: "white",
            }}
          >
            <h3 style={{ margin: 0 }}>{project.name}</h3>
            <p style={{ margin: "6px 0 0" }}>{project.description}</p>
            <p style={{ margin: "6px 0 0", color: "#666" }}>
              Tag: {project.tag} • College: {project.CollegeCode} • Global:{" "}
              {String(!!project.isGlobal)}
            </p>
            <div style={{ marginTop: 10 }}>
              <Link to={`/projects/${project._id}`}>Open details</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectList; 