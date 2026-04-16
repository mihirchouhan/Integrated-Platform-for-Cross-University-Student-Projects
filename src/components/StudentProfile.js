import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ChangePasswordModal from "./ChangePasswordModal";

const API = "http://localhost:5000";

export default function StudentProfile() {
  const token = localStorage.getItem("studentToken");
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", bio: "", skills: "", portfolio: "" });
  const [status, setStatus] = useState("");
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/student/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setForm({ name: data.name || "", bio: data.bio || "", skills: (data.skills || []).join(", "), portfolio: data.portfolio || "" });
      })
      .catch(console.error);

    // Fetch student's projects
    const email = localStorage.getItem("studentEmail");
    if (email) {
      fetch(`${API}/api/projects?email=${encodeURIComponent(email)}`)
        .then((r) => r.json())
        .then((data) => setProjects(data))
        .catch(console.error);
    }
  }, [token]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setStatus("Saving...");
    try {
      const res = await fetch(`${API}/api/student/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, skills: form.skills }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      setProfile(data);
      setEditing(false);
      setStatus("Profile updated!");
      setTimeout(() => setStatus(""), 2000);
    } catch (e) {
      setStatus(e?.message || "Failed");
    }
  };

  // Auto-extract skills from project tags
  const autoSkills = [...new Set(projects.flatMap((p) => p.tags || (p.tag ? p.tag.split(",").map((t) => t.trim()) : [])))];

  if (!token) {
    return (
      <div className="app-page">
        <div className="alert alert-warning">Please <Link to="/student/signin">sign in</Link> to view your profile.</div>
      </div>
    );
  }

  if (!profile) {
    return <div className="app-page"><div className="skeleton skeleton-card" /></div>;
  }

  return (
    <div className="app-page">
      <div className="row g-3">
        {/* Profile card */}
        <div className="col-12 col-md-4">
          <div className="app-card">
            <div className="app-card-body text-center">
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 32 }}>
                {profile.name ? profile.name[0].toUpperCase() : "👤"}
              </div>
              <h3>{profile.name || "Student"}</h3>
              <p className="app-muted" style={{ fontSize: 13 }}>{profile.email}</p>
              <span className="badge badge-primary mt-2">{profile.collegeCode}</span>

              {profile.bio && <p className="app-muted mt-3" style={{ fontSize: 14 }}>{profile.bio}</p>}
              {profile.portfolio && (
                <a href={profile.portfolio} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline mt-2">🔗 Portfolio</a>
              )}

              <div className="divider" />

              <h5 className="mb-2">Skills</h5>
              <div className="d-flex flex-wrap gap-1 justify-content-center">
                {(profile.skills || []).map((s, i) => <span key={i} className="tag">{s}</span>)}
                {(profile.skills || []).length === 0 && <span className="app-muted" style={{ fontSize: 13 }}>No skills added</span>}
              </div>

              {autoSkills.length > 0 && (
                <>
                  <div className="divider" />
                  <h5 className="mb-2">Auto-Detected Skills</h5>
                  <p className="app-muted mb-2" style={{ fontSize: 11 }}>From your project tags</p>
                  <div className="d-flex flex-wrap gap-1 justify-content-center">
                    {autoSkills.map((s, i) => <span key={i} className="tag">{s}</span>)}
                  </div>
                </>
              )}

              <div className="divider" />
              <div className="d-grid gap-2">
                <button className="btn btn-soft" onClick={() => setEditing(!editing)}>
                  {editing ? "Cancel" : "✏️ Edit Profile"}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setPasswordModalOpen(true)}>
                  🔐 Change Password
                </button>
              </div>
            </div>
          </div>
        </div>

        <ChangePasswordModal 
          isOpen={isPasswordModalOpen} 
          onClose={() => setPasswordModalOpen(false)} 
          role="student" 
        />

        {/* Main content */}
        <div className="col-12 col-md-8">
          {editing && (
            <div className="app-card mb-3">
              <div className="app-card-body">
                <h5 className="mb-3">Edit Profile</h5>
                <form onSubmit={saveProfile} className="d-grid gap-3">
                  <div><label className="form-label">Name</label><input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div><label className="form-label">Bio</label><textarea className="form-control" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} /></div>
                  <div><label className="form-label">Skills (comma-separated)</label><input className="form-control" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="React, Node.js, Python..." /></div>
                  <div><label className="form-label">Portfolio URL</label><input className="form-control" value={form.portfolio} onChange={(e) => setForm({ ...form, portfolio: e.target.value })} /></div>
                  <button type="submit" className="btn btn-primary">Save</button>
                  {status && <div className="alert alert-info mb-0">{status}</div>}
                </form>
              </div>
            </div>
          )}

          <h4 className="mb-3">My Projects ({projects.length})</h4>
          {projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📁</div>
              <h3>No projects yet</h3>
              <Link to="/project/upload" className="btn btn-primary mt-3">Upload Your First Project</Link>
            </div>
          ) : (
            <div className="d-grid gap-3">
              {projects.map((p) => (
                <div key={p._id} className="app-card">
                  <div className="app-card-body d-flex justify-content-between flex-wrap gap-3">
                    <div>
                      <Link to={`/projects/${p._id}`}><h5 className="mb-1">{p.name}</h5></Link>
                      <p className="app-muted" style={{ fontSize: 13 }}>{p.description?.slice(0, 100)}…</p>
                      <div className="d-flex gap-1 flex-wrap mt-2">
                        {(p.tags || []).map((t, i) => <span key={i} className="tag">{t}</span>)}
                        <span className={`badge ${p.isGlobal ? "badge-success" : "badge-warning"}`}>
                          {p.isGlobal ? "Global" : p.status || "Pending"}
                        </span>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="app-muted" style={{ fontSize: 13 }}>▲ {p.likes || 0} • 💬 {p.comments?.length || 0}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
