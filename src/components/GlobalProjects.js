import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API = "http://localhost:5000";

export default function GlobalProjects() {
  const token = localStorage.getItem("studentToken");
  const isGuest = !token;
  const limit = isGuest ? 6 : null;

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQ, setSearchQ] = useState("");

  const url = useMemo(() => {
    const qs = limit ? `?limit=${limit}` : "";
    return `${API}/projects/global${qs}`;
  }, [limit]);

  const fetchGlobal = async () => {
    setLoading(true);
    setError("");
    try {
      let fetchUrl = url;
      if (searchQ.trim()) fetchUrl += (fetchUrl.includes("?") ? "&" : "?") + `q=${encodeURIComponent(searchQ)}`;
      const res = await fetch(fetchUrl);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      setProjects(data);
    } catch (e) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobal();
    // eslint-disable-next-line
  }, [url]);

  const likeProject = async (projectId) => {
    if (!token) return alert("Please sign in to upvote.");
    try {
      const res = await fetch(`${API}/projects/${projectId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      setProjects((prev) => prev.map((p) => (p._id === projectId ? { ...p, likes: data.likes } : p)));
    } catch (e) {
      alert(e?.message || "Failed to like");
    }
  };

  const addComment = async (projectId, message) => {
    if (!token) throw new Error("Please sign in to comment.");
    const res = await fetch(`${API}/projects/${projectId}/comments`, {
      method: "POST",
      body: JSON.stringify({ message }),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Failed");
    return data;
  };

  /* Featured = top 1 project */
  const featured = projects[0];
  const rest = projects.slice(1);

  return (
    <div className="app-page global-projects-page">
      <div className="hero">
        <div className="floating-tech">⚛️</div>
        <div className="floating-tech">🐍</div>
        <div className="floating-tech">🟢</div>
        <div className="floating-tech">🍃</div>
        <div className="floating-tech">🟨</div>
        <div className="floating-tech">☕</div>
        <div className="floating-tech">💻</div>

        <div className="hero-content-wrapper fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h1>
            <span className="gradient-text">Global Projects</span> 🌍
          </h1>
          <p className="fade-in-up" style={{ animationDelay: '0.4s' }}>
            {isGuest
              ? "Discover verified student innovations from universities worldwide. Sign in to upvote, comment, and collaborate."
              : "Browse, upvote, and discuss the best student projects. Your proof-of-work portfolio starts here."}
          </p>
          <div className="hero-actions fade-in-up" style={{ animationDelay: '0.6s' }}>
            {/* Search */}
            <div className="d-flex gap-2" style={{ flex: 1, maxWidth: 500 }}>
              <input
                className="form-control"
                placeholder="Search projects by name, tag, college..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchGlobal()}
              />
              <button className="btn btn-soft" onClick={fetchGlobal}>Search</button>
            </div>

            {!token ? (
              <>
                <Link className="btn btn-primary btn-lg" to="/student/signin">Sign In</Link>
                <Link className="btn btn-soft btn-lg" to="/student/signup">Sign Up</Link>
              </>
            ) : (
              <Link className="btn btn-accent btn-lg" to="/project/upload">📤 Upload Project</Link>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="d-grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          {error} <button className="btn btn-sm btn-soft" onClick={fetchGlobal} style={{ marginLeft: 8 }}>Retry</button>
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>No global projects yet</h3>
          <p className="app-muted mt-2">Be the first to upload and get approved!</p>
        </div>
      )}

      {/* Featured project */}
      {!loading && featured && (
        <div className="mb-4">
          <h5 className="mb-3 app-muted" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            ⭐ Featured Project
          </h5>
          <div className="app-card app-card-featured">
            <div className="app-card-body">
              <ProjectCard
                project={featured}
                onLike={() => likeProject(featured._id)}
                onAddComment={addComment}
                onCommentsUpdated={(comments) => setProjects((prev) => prev.map((x) => (x._id === featured._id ? { ...x, comments } : x)))}
                featured
              />
            </div>
          </div>
        </div>
      )}

      {/* Rest */}
      {!loading && rest.length > 0 && (
        <div className="d-grid gap-3">
          {rest.map((p) => (
            <div key={p._id} className="app-card">
              <div className="app-card-body">
                <ProjectCard
                  project={p}
                  onLike={() => likeProject(p._id)}
                  onAddComment={addComment}
                  onCommentsUpdated={(comments) => setProjects((prev) => prev.map((x) => (x._id === p._id ? { ...x, comments } : x)))}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, onLike, onAddComment, onCommentsUpdated, featured }) {
  const [showComments, setShowComments] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const comments = Array.isArray(project.comments) ? project.comments : [];
  const tags = project.tags?.length ? project.tags : project.tag ? project.tag.split(",").map((t) => t.trim()) : [];

  const submit = async () => {
    if (!message) return;
    setSubmitting(true);
    try {
      const comments = await onAddComment(project._id, message);
      onCommentsUpdated?.(comments);
      setMessage("");
    } catch (e) {
      alert(e?.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="project-card">
      <div className="project-card-header">
        <div className="project-card-info">
          <Link to={`/projects/${project._id}`} style={{ textDecoration: "none" }}>
            <h3 className="mb-1" style={{ fontSize: featured ? "1.5rem" : "1.125rem" }}>
              {project.name}
            </h3>
          </Link>
          <p className="app-muted" style={{ fontSize: 14, lineHeight: 1.5 }}>
            {project.description?.length > 200 ? project.description.slice(0, 200) + "…" : project.description}
          </p>

          <div className="project-card-meta">
            <span className="badge badge-primary">{project.CollegeCode}</span>
            {tags.map((t, i) => (
              <span key={i} className="tag">{t}</span>
            ))}
            {project.status === "Flagged" && <span className="badge badge-danger">⚠ Flagged</span>}
            {project.status === "Approved" && <span className="badge badge-success">✓ Verified</span>}
          </div>

          {project.url && (
            <div className="mt-2">
              <a href={project.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">
                🔗 Project Link
              </a>
              {project.githubLink && (
                <a href={project.githubLink} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline" style={{ marginLeft: 8 }}>
                  GitHub
                </a>
              )}
            </div>
          )}
        </div>

        <div className="project-card-actions">
          <button className="upvote-btn" onClick={onLike}>
            ▲ Upvote
            <span className="vote-count">{project.likes ?? 0}</span>
          </button>

          <button className="btn btn-sm btn-soft" onClick={() => setShowComments((s) => !s)}>
            💬 {showComments ? "Hide" : "Discuss"} ({comments.length})
          </button>

          <Link to={`/collaborate`} className="btn btn-sm btn-outline">
            🤝 Collaborate
          </Link>
        </div>
      </div>

      {showComments && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          <div className="divider" />

          {comments.length > 0 ? (
            <div className="d-grid gap-2 mb-3">
              {comments.map((c) => (
                <div key={c._id} className="comment-item">
                  <div className="comment-author">{c.email}</div>
                  <div className="comment-text">{c.message}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="app-muted mb-3" style={{ fontSize: 13 }}>No comments yet. Be the first!</p>
          )}

          <div className="d-flex gap-2">
            <input
              className="form-control"
              style={{ flex: 1 }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a comment…"
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <button className="btn btn-primary btn-sm" onClick={submit} disabled={submitting}>
              {submitting ? "…" : "Post"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
