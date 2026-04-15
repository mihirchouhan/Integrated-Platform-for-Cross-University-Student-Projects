import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_BASE = "http://localhost:5000";

export default function ProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("studentToken");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/projects/id/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || data?.error || "Failed");
      setProject(data);
    } catch (e) {
      setError(e?.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const like = async () => {
    try {
      if (!token) return alert("Sign in as student to upvote.");
      const res = await fetch(`${API_BASE}/projects/${id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || data?.error || "Failed");
      setProject((p) => ({ ...p, likes: data.likes }));
    } catch (e) {
      alert(e?.message || "Failed to upvote");
    }
  };

  if (loading) return <div className="app-page">Loading…</div>;
  if (error) return <div className="app-page">Error: {error}</div>;
  if (!project) return <div className="app-page">Not found.</div>;

  return (
    <div className="app-page">
      <div className="d-flex flex-wrap gap-2 mb-3">
        <Link className="btn btn-soft" to="/">
          Back to Global
        </Link>
        <Link className="btn btn-soft" to="/projects">
          All Projects
        </Link>
      </div>

      <div className="app-card">
        <div className="app-card-body">
          <div className="d-flex flex-wrap justify-content-between gap-3">
            <div style={{ minWidth: 280, flex: "1 1 520px" }}>
              <h3 className="mb-1">{project.name}</h3>
              <div className="app-muted">{project.description}</div>
              <div className="mt-2 app-muted" style={{ fontSize: 13 }}>
                Tag: {project.tag} • College: {project.CollegeCode} • Global:{" "}
                {String(!!project.isGlobal)}
              </div>
              <div className="mt-2 app-muted" style={{ fontSize: 13 }}>
                Created by: {project.createdByEmail || "—"}
              </div>
              {project.url ? (
                <div className="mt-2">
                  <a href={project.url} target="_blank" rel="noreferrer">
                    Open project link
                  </a>
                </div>
              ) : null}
            </div>

            <div className="text-end" style={{ minWidth: 220 }}>
              <button className="btn btn-primary" onClick={like}>
                Upvote
              </button>
              <div className="mt-2 app-muted">Votes: {project.likes ?? 0}</div>
            </div>
          </div>

          <hr />
          <h5 className="mb-2">Discussion</h5>
          <div className="app-muted">
            Discussion is available on the Global page card for now.
          </div>
        </div>
      </div>
    </div>
  );
}

