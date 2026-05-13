import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ChangePasswordModal from "./ChangePasswordModal";
import API_BASE_URL from '../apiConfig';

const API = API_BASE_URL;

const isApproved = (p) => p.isGlobal || p.status === "Approved";
const isFlagged = (p) => p.status === "Flagged" && !isApproved(p);
const isPending = (p) => !isApproved(p) && !isFlagged(p);

export default function CollegeAdminDashboard() {
  const token = localStorage.getItem("collegeAdminToken");
  const collegeCode = localStorage.getItem("collegeAdminCode");

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all, pending, flagged, approved
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = projects;
    if (filter === "pending") list = list.filter(isPending);
    else if (filter === "flagged") list = list.filter(isFlagged);
    else if (filter === "approved") list = list.filter(isApproved);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) => (p.name || "").toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q) || (p.tag || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [projects, query, filter]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      if (!collegeCode) throw new Error("Missing college code. Please login again.");
      const res = await fetch(`${API}/projects/${encodeURIComponent(collegeCode)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      setProjects(data);
    } catch (e) {
      setError(e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const approve = async (projectId) => {
    try {
      if (!token) return alert("Please login.");
      const res = await fetch(`${API}/projects/${projectId}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      setProjects((prev) => prev.map((p) => (p._id === projectId ? { ...p, isGlobal: true, status: "Approved" } : p)));
    } catch (e) {
      alert(e?.message || "Failed");
    }
  };

  if (!token) {
    return (
      <div className="app-page">
        <div className="alert alert-warning">Please <Link to="/college/admin/login">login</Link> first.</div>
      </div>
    );
  }

  const counts = {
    total: projects.length,
    pending: projects.filter(isPending).length,
    flagged: projects.filter(isFlagged).length,
    approved: projects.filter(isApproved).length,
  };

  return (
    <div className="app-page">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h2 className="mb-1">🏫 College Admin Dashboard</h2>
          <p className="app-muted mb-0">College: <strong>{collegeCode}</strong> — Review, approve, and manage student projects.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => setPasswordModalOpen(true)}>
          🔐 Change Password
        </button>
      </div>

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setPasswordModalOpen(false)} 
        role="collegeAdmin" 
      />

      {/* Stats */}
      <div className="stats-grid mb-4">
        <div className="stat-card" onClick={() => setFilter("all")} style={{ cursor: "pointer" }}>
          <div className="stat-value">{counts.total}</div>
          <div className="stat-label">Total Projects</div>
        </div>
        <div className="stat-card" onClick={() => setFilter("pending")} style={{ cursor: "pointer" }}>
          <div className="stat-value" style={{ color: "var(--accent-orange)" }}>{counts.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card" onClick={() => setFilter("flagged")} style={{ cursor: "pointer" }}>
          <div className="stat-value" style={{ color: "var(--accent-rose)" }}>{counts.flagged}</div>
          <div className="stat-label">Flagged</div>
        </div>
        <div className="stat-card" onClick={() => setFilter("approved")} style={{ cursor: "pointer" }}>
          <div className="stat-value" style={{ color: "#34d399" }}>{counts.approved}</div>
          <div className="stat-label">Approved</div>
        </div>
      </div>

      {/* Search & refresh */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        <input className="form-control" style={{ maxWidth: 300 }} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects…" />
        <button className="btn btn-soft" onClick={load} disabled={loading}>Refresh</button>
        <div className="d-flex gap-1 align-items-center">
          {["all", "pending", "flagged", "approved"].map((f) => (
            <button key={f} className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-soft"}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="d-grid gap-3">{[1, 2].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No projects found</h3>
        </div>
      )}

      <div className="d-grid gap-3">
        {filtered.map((p) => (
          <div key={p._id} className="app-card">
            <div className="app-card-body d-flex flex-wrap gap-3 justify-content-between">
              <div style={{ flex: 1, minWidth: 280 }}>
                <Link to={`/projects/${p._id}`}><h5 className="mb-1">{p.name}</h5></Link>
                <p className="app-muted" style={{ fontSize: 13 }}>{p.description?.slice(0, 120)}…</p>
                <div className="d-flex gap-1 flex-wrap mt-2">
                  {(p.tags || []).map((t, i) => <span key={i} className="tag">{t}</span>)}
                  {p.plagiarismScore > 0 && (
                    <span className={`badge ${p.plagiarismScore > 30 ? "badge-danger" : "badge-ghost"}`}>
                      Plagiarism: {p.plagiarismScore}%
                    </span>
                  )}
                </div>
                <div className="mt-2 app-muted" style={{ fontSize: 12 }}>
                  By: {p.createdByEmail} • ▲ {p.likes || 0}
                </div>
              </div>
              <div className="text-end" style={{ minWidth: 180 }}>
                {p.isGlobal || p.status === "Approved" ? (
                  <span className="badge badge-success">✓ Approved</span>
                ) : p.status === "Flagged" ? (
                  <div className="d-grid gap-2">
                    <span className="badge badge-danger">⚠ Flagged</span>
                    <button className="btn btn-sm btn-primary" onClick={() => approve(p._id)}>Override & Approve</button>
                  </div>
                ) : (
                  <button className="btn btn-primary" onClick={() => approve(p._id)}>Approve to Global</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
