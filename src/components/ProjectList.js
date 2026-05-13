import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import API_BASE_URL from '../apiConfig';

const API = API_BASE_URL;

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      const response = await fetch(`${API}/projects?${params}`);
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchProjects(); }, []);

  return (
    <div className="app-page">
      <div className="d-flex flex-wrap gap-3 align-items-end justify-content-between mb-3">
        <div>
          <h2 className="mb-1">All Projects</h2>
          <p className="app-muted">Browse every project in the database.</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/project/upload" className="btn btn-soft">Upload</Link>
          <Link to="/" className="btn btn-soft">Global</Link>
        </div>
      </div>

      <div className="app-card mb-3">
        <div className="app-card-body d-flex flex-wrap gap-2 align-items-center">
          <input
            className="form-control"
            style={{ maxWidth: 420, flex: 1 }}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, tag, college code…"
            onKeyDown={(e) => e.key === "Enter" && fetchProjects()}
          />
          <button className="btn btn-primary" onClick={fetchProjects}>Search</button>
        </div>
      </div>

      {loading && <div className="d-grid gap-3">{[1, 2, 3].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>}

      {!loading && projects.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No projects found</h3>
        </div>
      )}

      <div className="d-grid gap-3">
        {projects.map((project) => {
          const tags = project.tags?.length ? project.tags : project.tag ? project.tag.split(",").map(t => t.trim()) : [];
          return (
            <div key={project._id} className="app-card">
              <div className="app-card-body d-flex flex-wrap gap-3 justify-content-between">
                <div style={{ flex: 1, minWidth: 280 }}>
                  <Link to={`/projects/${project._id}`}><h5 className="mb-1">{project.name}</h5></Link>
                  <p className="app-muted" style={{ fontSize: 14 }}>{project.description?.slice(0, 120)}…</p>
                  <div className="d-flex gap-1 flex-wrap mt-2">
                    <span className="badge badge-primary">{project.CollegeCode}</span>
                    {project.isGlobal && <span className="badge badge-success">Global</span>}
                    {tags.map((t, i) => <span key={i} className="tag">{t}</span>)}
                  </div>
                </div>
                <div className="text-end">
                  <div className="app-muted" style={{ fontSize: 13 }}>▲ {project.likes || 0}</div>
                  <Link to={`/projects/${project._id}`} className="btn btn-sm btn-soft mt-2">View</Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectList;