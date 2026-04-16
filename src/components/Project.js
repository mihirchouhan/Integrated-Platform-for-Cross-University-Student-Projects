import React, { useState } from 'react';
import axios from 'axios';
import { Link } from "react-router-dom";

const Project = () => {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [url, setUrl] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [teamMembers, setTeamMembers] = useState('');
  const [status, setStatus] = useState('');
  const [plagResult, setPlagResult] = useState(null);

  const handleUpload = async () => {
    setStatus('');
    setPlagResult(null);
    const token = localStorage.getItem("studentToken");
    if (!token) { setStatus("Please sign in first."); return; }
    if (!file) { setStatus("Please choose a file."); return; }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('description', description);
    formData.append('tag', tags);
    formData.append('tags', tags);
    formData.append('url', url);
    formData.append('githubLink', githubLink);
    formData.append('teamMembers', teamMembers);

    try {
      const res = await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });
      setStatus(res.data?.message || 'Uploaded!');
      if (res.data?.plagiarism) setPlagResult(res.data.plagiarism);
      setFile(null); setName(''); setDescription(''); setTags(''); setUrl(''); setGithubLink(''); setTeamMembers('');
    } catch (err) {
      setStatus(err?.response?.data?.message || err?.response?.data?.error || err.message);
    }
  };

  return (
    <div className="app-page">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="d-flex justify-content-between align-items-end gap-3 mb-3">
            <div>
              <h2 className="mb-1">📤 Upload Project</h2>
              <p className="app-muted">Upload your project PDF, source code link, and metadata for college review.</p>
            </div>
            <div className="d-flex gap-2">
              <Link className="btn btn-soft" to="/projects">All Projects</Link>
              <Link className="btn btn-soft" to="/">Global</Link>
            </div>
          </div>

          <div className="app-card">
            <div className="app-card-body">
              <div className="d-grid gap-3">
                <div>
                  <label className="form-label">Project File (PDF)</label>
                  <input className="form-control" type="file" onChange={(e) => setFile(e.target.files[0])} />
                </div>
                <div>
                  <label className="form-label">Project Name *</label>
                  <input className="form-control" placeholder="Enter project name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Description *</label>
                  <textarea className="form-control" placeholder="Describe your project..." value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
                </div>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label">Tags (comma-separated)</label>
                    <input className="form-control" placeholder="React, Node.js, AI..." value={tags} onChange={(e) => setTags(e.target.value)} />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">GitHub Link</label>
                    <input className="form-control" placeholder="https://github.com/..." value={githubLink} onChange={(e) => setGithubLink(e.target.value)} />
                  </div>
                </div>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label">Project URL (optional)</label>
                    <input className="form-control" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Team Members (emails, comma-separated)</label>
                    <input className="form-control" placeholder="alice@uni.edu, bob@uni.edu" value={teamMembers} onChange={(e) => setTeamMembers(e.target.value)} />
                  </div>
                </div>

                <div className="d-flex justify-content-end">
                  <button className="btn btn-primary btn-lg" onClick={handleUpload}>🚀 Upload & Check Plagiarism</button>
                </div>
              </div>

              {status && (
                <div className={`alert ${status.includes("⚠️") ? "alert-warning" : "alert-success"} mt-3 mb-0`}>
                  {status}
                </div>
              )}

              {plagResult && (
                <div className={`alert ${plagResult.flagged ? "alert-danger" : "alert-success"} mt-3 mb-0`}>
                  <strong>Plagiarism Check:</strong> {plagResult.similarityScore}% similarity
                  {plagResult.flagged
                    ? " — Flagged for manual review by college admin."
                    : " — Looks original! ✓"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Project;
