import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:5000";

export default function CollegeAdminDashboard() {
  const token = localStorage.getItem("collegeAdminToken");
  const collegeCode = localStorage.getItem("collegeAdminCode");

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        String(p.name || "").toLowerCase().includes(q) ||
        String(p.description || "").toLowerCase().includes(q) ||
        String(p.tag || "").toLowerCase().includes(q)
    );
  }, [projects, query]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      if (!collegeCode) throw new Error("Missing college code. Please login again.");
      const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(collegeCode)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || data?.error || "Failed");
      setProjects(data);
    } catch (e) {
      setError(e?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approve = async (projectId) => {
    try {
      if (!token) {
        alert("Please login as college admin.");
        return;
      }
      const res = await fetch(`${API_BASE}/projects/${projectId}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || data?.error || "Failed");
      setProjects((prev) =>
        prev.map((p) => (p._id === projectId ? { ...p, isGlobal: true } : p))
      );
    } catch (e) {
      alert(e?.message || "Approval failed");
    }
  };

  if (!token) {
    return (
      <div className="app-page">
        <div className="alert alert-warning">
          Please login first at <code>/college/admin/login</code>.
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <div className="d-flex flex-wrap gap-3 align-items-end justify-content-between mb-3">
        <div>
          <h2 className="mb-1">College Admin Dashboard</h2>
          <div className="app-muted">College: {collegeCode}</div>
        </div>

        <div className="d-flex gap-2">
          <input
          className="form-control"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects…"
          style={{ minWidth: 260 }}
          />
          <button className="btn btn-soft" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? <p>Loading…</p> : null}
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      {filtered.length === 0 && !loading ? (
        <p>No projects found.</p>
      ) : (
        <div className="row g-3">
          {filtered.map((p) => (
            <div key={p._id} className="col-12">
              <div className="app-card">
                <div className="app-card-body d-flex flex-wrap gap-3 justify-content-between">
                  <div style={{ minWidth: 280, flex: "1 1 520px" }}>
                    <h5 className="mb-1">{p.name}</h5>
                    <div className="app-muted">{p.description}</div>
                    <div className="mt-2 app-muted" style={{ fontSize: 13 }}>
                      Tag: {p.tag} • Global: {String(!!p.isGlobal)} • Created by:{" "}
                      {p.createdByEmail || "—"}
                    </div>
                  </div>
                  <div className="text-end" style={{ minWidth: 220 }}>
                    {p.isGlobal ? (
                      <span className="badge text-bg-success">Approved</span>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={() => approve(p._id)}
                      >
                        Approve to Global
                      </button>
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

