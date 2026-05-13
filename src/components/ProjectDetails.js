import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API_BASE_URL from '../apiConfig';

const API = API_BASE_URL;

export default function ProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("studentToken");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/projects/id/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      setProject(data);
      setComments(data.comments || []);
    } catch (e) {
      setError(e?.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const like = async () => {
    try {
      if (!token) return alert("Sign in to upvote.");
      const res = await fetch(`${API}/projects/${id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      setProject((p) => ({ ...p, likes: data.likes }));
    } catch (e) {
      alert(e?.message || "Failed");
    }
  };

  const postComment = async () => {
    if (!newComment.trim()) return;
    if (!token) return alert("Sign in to comment.");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/projects/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: newComment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      setComments(data);
      setNewComment("");
    } catch (e) {
      alert(e?.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const tags = project?.tags?.length ? project.tags : project?.tag ? project.tag.split(",").map(t => t.trim()) : [];

  if (loading) return <div className="app-page"><div className="skeleton skeleton-card" /><div className="skeleton skeleton-card mt-3" /></div>;
  if (error) return <div className="app-page"><div className="alert alert-danger">{error}</div></div>;
  if (!project) return <div className="app-page"><div className="alert alert-warning">Project not found.</div></div>;

  return (
    <div className="app-page">
      <div className="d-flex flex-wrap gap-2 mb-3">
        <Link className="btn btn-soft" to="/">← Global</Link>
        <Link className="btn btn-soft" to="/projects">All Projects</Link>
      </div>

      <div className="app-card mb-3">
        <div className="app-card-body">
          <div className="project-card-header">
            <div className="project-card-info">
              <h2 className="mb-2">{project.name}</h2>
              <p className="app-muted" style={{ fontSize: 15, lineHeight: 1.7 }}>{project.description}</p>

              <div className="project-card-meta mt-3">
                <span className="badge badge-primary">{project.CollegeCode}</span>
                {project.status === "Approved" && <span className="badge badge-success">✓ Verified Original</span>}
                {project.status === "Flagged" && <span className="badge badge-danger">⚠ Flagged ({project.plagiarismScore}%)</span>}
                {project.status === "Pending" && <span className="badge badge-warning">Pending Review</span>}
                {project.isGlobal && <span className="badge badge-ghost">🌍 Global</span>}
                {tags.map((t, i) => <span key={i} className="tag">{t}</span>)}
              </div>

              <div className="mt-3 app-muted" style={{ fontSize: 13 }}>
                Created by: <strong>{project.createdByEmail || "—"}</strong>
                {project.teamMembers?.length > 0 && ` • Team: ${project.teamMembers.join(", ")}`}
              </div>

              <div className="d-flex gap-2 mt-3">
                {project.url && <a href={project.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">🔗 Project Link</a>}
                {project.githubLink && <a href={project.githubLink} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline"> GitHub</a>}
                <Link to="/collaborate" className="btn btn-sm btn-accent">🤝 Collaborate</Link>
              </div>
            </div>

            <div className="project-card-actions">
              <button className="upvote-btn" onClick={like}>
                ▲ Upvote <span className="vote-count">{project.likes ?? 0}</span>
              </button>
              <div className="app-muted" style={{ fontSize: 12 }}>💬 {comments.length} comments</div>
            </div>
          </div>
        </div>
      </div>

      {/* Discussion */}
      <div className="app-card">
        <div className="app-card-body">
          <h4 className="mb-3">💬 Discussion</h4>

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
            <p className="app-muted mb-3" style={{ fontSize: 13 }}>No comments yet. Start the discussion!</p>
          )}

          <div className="d-flex gap-2">
            <input
              className="form-control"
              style={{ flex: 1 }}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment…"
              onKeyDown={(e) => e.key === "Enter" && postComment()}
            />
            <button className="btn btn-primary" onClick={postComment} disabled={submitting}>
              {submitting ? "…" : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
