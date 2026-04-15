import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:5000";

export default function GlobalProjects() {
  // For now we treat this page as "public landing".
  // Guests see limited projects; later, we'll detect login and show full list.
  const token = localStorage.getItem("studentToken");
  const isGuest = !token;
  const limit = isGuest ? 5 : null;

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const url = useMemo(() => {
    const qs = limit ? `?limit=${encodeURIComponent(limit)}` : "";
    return `${API_BASE}/projects/global${qs}`;
  }, [limit]);

  const fetchGlobal = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || data?.error || "Failed");
      setProjects(data);
    } catch (e) {
      setError(e?.message || "Failed to load global projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const likeProject = async (projectId) => {
    try {
      if (!token) {
        alert("Please sign in to upvote.");
        return;
      }
      const res = await fetch(`${API_BASE}/projects/${projectId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || data?.error || "Failed");
      setProjects((prev) =>
        prev.map((p) => (p._id === projectId ? { ...p, likes: data.likes } : p))
      );
    } catch (e) {
      alert(e?.message || "Failed to like");
    }
  };

  const addComment = async (projectId, message) => {
    if (!token) throw new Error("Please sign in to comment.");
    const res = await fetch(`${API_BASE}/projects/${projectId}/comments`, {
      method: "POST",
      body: JSON.stringify({ message }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || data?.error || "Failed");
    return data;
  };

  if (loading) return <div style={{ padding: 16 }}>Loading global projects…</div>;
  if (error)
    return (
      <div style={{ padding: 16 }}>
        <p>Failed to load: {error}</p>
        <button onClick={fetchGlobal}>Retry</button>
      </div>
    );

  return (
    <div className="app-page">
      <div className="app-card mb-3">
        <div className="app-card-body">
          <div className="d-flex flex-wrap justify-content-between gap-3 align-items-center">
            <div>
              <h2 className="mb-1">Global Projects</h2>
              <div className="app-muted">
                {isGuest
                  ? "Guest view: showing top projects only. Sign in to view all, upvote and discuss."
                  : "Showing all global projects. You can upvote and discuss."}
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2">
              {!token ? (
                <>
                  <Link className="btn btn-primary" to="/student/signin">
                    Student Sign in
                  </Link>
                  <Link className="btn btn-soft" to="/student/signup">
                    Student Signup
                  </Link>
                </>
              ) : (
                <Link className="btn btn-primary" to="/project/upload">
                  Upload Project
                </Link>
              )}
              <Link className="btn btn-soft" to="/college/admin/login">
                College Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      {projects.length === 0 ? (
        <p>No global projects yet.</p>
      ) : (
        <div className="row g-3">
          {projects.map((p) => (
            <div key={p._id} className="col-12">
              <ProjectCard
                project={p}
                onLike={() => likeProject(p._id)}
                onAddComment={addComment}
                onCommentsUpdated={(comments) => {
                  setProjects((prev) =>
                    prev.map((x) => (x._id === p._id ? { ...x, comments } : x))
                  );
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, onLike, onAddComment, onCommentsUpdated }) {
  const [showComments, setShowComments] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const comments = Array.isArray(project.comments) ? project.comments : [];

  const submit = async () => {
    if (!message) return alert("Write a comment");
    setSubmitting(true);
    try {
      const comments = await onAddComment(project._id, message);
      onCommentsUpdated?.(comments);
      setMessage("");
    } catch (e) {
      alert(e?.message || "Failed to comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-card">
      <div className="app-card-body">
        <div className="d-flex flex-wrap justify-content-between gap-3">
          <div style={{ minWidth: 280, flex: "1 1 520px" }}>
            <h5 className="mb-1">{project.name}</h5>
            <div className="app-muted">{project.description}</div>
            <div className="mt-2 app-muted" style={{ fontSize: 13 }}>
              Tag: {project.tag} • College: {project.CollegeCode}
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
            <button className="btn btn-primary" onClick={onLike}>
              Upvote
            </button>
            <div className="mt-2 app-muted">Votes: {project.likes ?? 0}</div>
            <button
              className="btn btn-soft mt-2"
              onClick={() => setShowComments((s) => !s)}
            >
              {showComments ? "Hide discussion" : "Discuss"} ({comments.length})
            </button>
          </div>
        </div>

        {showComments ? (
          <div className="mt-3">
          {comments.length ? (
            <div className="d-grid gap-2 mb-3">
              {comments.map((c) => (
                <div key={c._id} className="p-2 rounded" style={{ background: "#f6f7f9" }}>
                  <div className="app-muted" style={{ fontSize: 12 }}>
                    {c.email}
                  </div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{c.message}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="app-muted mb-3">No comments yet.</div>
          )}

          <div className="row g-2">
            <div className="col-12 col-md-9">
              <input
              className="form-control"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a comment…"
              />
            </div>
            <div className="col-12 col-md-3 d-grid">
              <button className="btn btn-soft" onClick={submit} disabled={submitting}>
                {submitting ? "Posting…" : "Post"}
              </button>
            </div>
          </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

