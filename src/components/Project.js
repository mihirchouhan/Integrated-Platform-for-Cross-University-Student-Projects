import React, { useState } from 'react';
import axios from 'axios';
import { Link } from "react-router-dom";

const Project = () => {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    setStatus('');
    const token = localStorage.getItem("studentToken");
    if (!token) {
      setStatus("Please sign in first.");
      return;
    }
    if (!file) {
      setStatus("Please choose a file.");
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('description', description);
    formData.append('tag', tag);
    formData.append('url', url);

    try {
      await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setStatus('File uploaded successfully');
      setFile(null);
      setName('');
      setDescription('');
      setTag('');
      setUrl('');
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
              <h2 className="mb-1">Upload Project</h2>
              <div className="app-muted">
                Upload your project PDF/details for college review.
              </div>
            </div>
            <div className="d-flex gap-2">
              <Link className="btn btn-soft" to="/projects">
                View all projects
              </Link>
              <Link className="btn btn-soft" to="/">
                Global
              </Link>
            </div>
          </div>

          <div className="app-card">
            <div className="app-card-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Project file (PDF)</label>
                  <input className="form-control" type="file" onChange={handleFileChange} />
                </div>

                <div className="col-12">
                  <label className="form-label">Project name</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Enter project name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    placeholder="Short project description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Tag</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="e.g. AI, Web, IoT"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Project URL (optional)</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>

                <div className="col-12 d-flex justify-content-end">
                  <button className="btn btn-primary" onClick={handleUpload}>
                    Upload
                  </button>
                </div>
              </div>

              {status ? (
                <div className="alert alert-info mt-3 mb-0" role="alert">
                  {status}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Project;
