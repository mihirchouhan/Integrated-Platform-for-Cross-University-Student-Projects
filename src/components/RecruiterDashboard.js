import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ChangePasswordModal from "./ChangePasswordModal";

const API = "http://localhost:5000";

export default function RecruiterDashboard() {
  const token = localStorage.getItem("recruiterToken");
  const company = localStorage.getItem("recruiterCompany");

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skillFilter, setSkillFilter] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);

  const fetchTalent = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (skillFilter.trim()) params.set("skills", skillFilter.trim());
      if (searchQ.trim()) params.set("q", searchQ.trim());
      const res = await fetch(`${API}/api/recruiter/talent?${params}`);
      const data = await res.json();
      setProjects(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTalent(); /* eslint-disable-next-line */ }, []);

  const requestInterview = async (projectId) => {
    try {
      const res = await fetch(`${API}/api/recruiter/request-interview/${projectId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      alert(data.message);
    } catch (e) {
      alert(e?.message || "Failed");
    }
  };

  if (!token) {
    return (
      <div className="app-page">
        <div className="alert alert-warning">Please <Link to="/recruiter/login">log in</Link> as a recruiter first.</div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <div className="hero" style={{ padding: "32px 40px" }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
          <h2 className="m-0"><span className="gradient-text">Talent Market</span> 🎯</h2>
          <button className="btn btn-outline btn-sm" onClick={() => setPasswordModalOpen(true)}>
            🔐 Change Password
          </button>
        </div>
        <p className="app-muted">Welcome, {company}. Browse verified student projects, filter by skills, and connect with talent.</p>

        <ChangePasswordModal 
          isOpen={isPasswordModalOpen} 
          onClose={() => setPasswordModalOpen(false)} 
          role="recruiter" 
        />

        <div className="hero-actions mt-4">
          <input
            className="form-control"
            style={{ maxWidth: 240 }}
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            placeholder="Filter by skills: React, Node..."
          />
          <input
            className="form-control"
            style={{ maxWidth: 240 }}
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search projects..."
          />
          <button className="btn btn-primary" onClick={fetchTalent}>Search</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-value">{projects.length}</div>
          <div className="stat-label">Verified Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{[...new Set(projects.flatMap(p => p.tags || []))].length}</div>
          <div className="stat-label">Unique Skills</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{[...new Set(projects.map(p => p.createdByEmail))].length}</div>
          <div className="stat-label">Developers</div>
        </div>
      </div>

      {loading ? (
        <div className="d-grid gap-3">{[1, 2, 3].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No projects found</h3>
          <p className="app-muted mt-2">Try different skill filters or search terms.</p>
        </div>
      ) : (
        <div className="d-grid gap-3">
          {projects.map((p) => (
            <div key={p._id} className="app-card">
              <div className="app-card-body">
                <div className="project-card-header">
                  <div className="project-card-info">
                    <Link to={`/projects/${p._id}`}><h3 className="mb-1">{p.name}</h3></Link>
                    <p className="app-muted" style={{ fontSize: 14 }}>{p.description?.slice(0, 150)}…</p>
                    <div className="project-card-meta">
                      <span className="badge badge-primary">{p.CollegeCode}</span>
                      <span className="badge badge-success">✓ Verified Original</span>
                      {(p.tags || []).map((t, i) => <span key={i} className="tag">{t}</span>)}
                    </div>
                    <div className="mt-2 app-muted" style={{ fontSize: 13 }}>
                      Created by: {p.createdByEmail} • Team: {p.teamMembers?.length || 1} member(s) • ▲ {p.likes || 0}
                    </div>
                  </div>
                  <div className="project-card-actions">
                    <button className="btn btn-warm" onClick={() => requestInterview(p._id)}>
                      📩 Request Interview
                    </button>
                    <Link to={`/messages`} className="btn btn-sm btn-outline">
                      💬 Message Creator
                    </Link>
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-soft">
                        🔗 View Project
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
