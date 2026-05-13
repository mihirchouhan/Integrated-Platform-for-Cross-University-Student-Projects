import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API_BASE_URL from '../apiConfig';

const API = API_BASE_URL;

export default function Marketplace() {
  const studentToken = localStorage.getItem("studentToken");
  const recruiterToken = localStorage.getItem("recruiterToken");

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skillFilter, setSkillFilter] = useState("");
  const [myProjects, setMyProjects] = useState([]);

  /* List form */
  const [showListForm, setShowListForm] = useState(false);
  const [listForm, setListForm] = useState({ projectId: "", price: 0, licenseType: "non-exclusive" });
  const [listStatus, setListStatus] = useState("");

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (skillFilter.trim()) params.set("skills", skillFilter.trim());
      const res = await fetch(`${API}/api/marketplace?${params}`);
      const data = await res.json();
      setListings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchListings(); 
    const email = localStorage.getItem("studentEmail");
    if (email) {
      fetch(`${API}/api/projects?email=${encodeURIComponent(email)}`)
        .then((r) => r.json())
        .then((data) => setMyProjects(data))
        .catch(console.error);
    }
    /* eslint-disable-next-line */ 
  }, []);

  const listProject = async (e) => {
    e.preventDefault();
    setListStatus("Listing...");
    try {
      const res = await fetch(`${API}/api/marketplace/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
        body: JSON.stringify(listForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      setListStatus("Listed successfully!");
      setShowListForm(false);
      fetchListings();
    } catch (e) {
      setListStatus(e?.message || "Failed");
    }
  };

  const placeBid = async (listingId) => {
    const amount = prompt("Enter your bid amount ($):");
    if (!amount) return;
    try {
      const res = await fetch(`${API}/api/marketplace/${listingId}/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${recruiterToken}` },
        body: JSON.stringify({ amount: Number(amount), message: "Interested in acquiring this project" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      alert(data.message);
    } catch (e) {
      alert(e?.message || "Failed");
    }
  };

  const buyProject = async (listingId) => {
    if (!window.confirm("Proceed with mock purchase?")) return;
    try {
      const res = await fetch(`${API}/api/marketplace/${listingId}/buy`, {
        method: "POST",
        headers: { Authorization: `Bearer ${recruiterToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      alert(data.message);
      fetchListings();
    } catch (e) {
      alert(e?.message || "Failed");
    }
  };

  return (
    <div className="app-page">
      <div className="hero" style={{ padding: "32px 40px" }}>
        <h2><span className="gradient-text">Marketplace</span> 💼</h2>
        <p className="app-muted">Acquire project rights, license innovations, and connect with student entrepreneurs.</p>
        <div className="hero-actions">
          <input
            className="form-control"
            style={{ maxWidth: 300 }}
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            placeholder="Filter by skills: React, AI..."
          />
          <button className="btn btn-primary" onClick={fetchListings}>Search</button>
          {studentToken && (
            <button className="btn btn-accent" onClick={() => setShowListForm(!showListForm)}>
              {showListForm ? "Cancel" : "📤 List Your Project"}
            </button>
          )}
        </div>
      </div>

      {/* List form */}
      {showListForm && (
        <div className="app-card mb-4">
          <div className="app-card-body">
            <h5 className="mb-3">List a Project on Marketplace</h5>
            <form onSubmit={listProject} className="d-flex flex-wrap gap-3 align-items-end">
              <div>
                <label className="form-label">Select Project</label>
                <select 
                  className="form-control" 
                  value={listForm.projectId} 
                  onChange={(e) => setListForm({ ...listForm, projectId: e.target.value })} 
                  required
                >
                  <option value="" disabled>Choose your project...</option>
                  {myProjects.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Price ($)</label>
                <input className="form-control" type="number" value={listForm.price} onChange={(e) => setListForm({ ...listForm, price: Number(e.target.value) })} min="0" />
              </div>
              <div>
                <label className="form-label">License</label>
                <select className="form-control" value={listForm.licenseType} onChange={(e) => setListForm({ ...listForm, licenseType: e.target.value })}>
                  <option value="non-exclusive">Non-Exclusive</option>
                  <option value="exclusive">Exclusive</option>
                  <option value="open">Open</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary">List Project</button>
              {listStatus && <span className="app-muted" style={{ fontSize: 13 }}>{listStatus}</span>}
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="d-grid gap-3">{[1, 2, 3].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>
      ) : listings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏪</div>
          <h3>No marketplace listings yet</h3>
          <p className="app-muted mt-2">Students can list their approved projects here.</p>
        </div>
      ) : (
        <div className="d-grid gap-3">
          {listings.map((l) => {
            const p = l.projectId;
            if (!p) return null;
            return (
              <div key={l._id} className="app-card">
                <div className="app-card-body">
                  <div className="project-card-header">
                    <div className="project-card-info">
                      <Link to={`/projects/${p._id}`}><h3 className="mb-1">{p.name}</h3></Link>
                      <p className="app-muted" style={{ fontSize: 14 }}>{p.description?.slice(0, 150)}…</p>
                      <div className="project-card-meta">
                        <span className="badge badge-primary">${l.price || "Free"}</span>
                        <span className="badge badge-ghost">{l.licenseType}</span>
                        <span className="badge badge-success">✓ Verified</span>
                        {(p.tags || []).map((t, i) => <span key={i} className="tag">{t}</span>)}
                      </div>
                      <div className="mt-2 app-muted" style={{ fontSize: 13 }}>
                        Creator: {p.createdByEmail} • Bids: {l.bids?.length || 0}
                      </div>
                    </div>
                    <div className="project-card-actions">
                      {recruiterToken && (
                        <>
                          <button className="btn btn-primary" onClick={() => placeBid(l._id)}>💰 Place Bid</button>
                          <button className="btn btn-warm" onClick={() => buyProject(l._id)}>🛒 Buy Now</button>
                        </>
                      )}
                      <Link to={`/projects/${p._id}`} className="btn btn-sm btn-soft">View Details</Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
