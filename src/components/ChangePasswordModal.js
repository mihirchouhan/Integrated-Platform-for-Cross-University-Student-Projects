import React, { useState } from "react";

import API_BASE_URL from '../apiConfig';

export default function ChangePasswordModal({ isOpen, onClose, role }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) return setStatus("Password must be at least 8 characters long");
    if (newPassword !== confirmNewPassword) return setStatus("Passwords do not match");

    setIsLoading(true);
    setStatus("Updating...");

    let endpoint = "";
    let token = "";

    if (role === "student") {
      endpoint = "/api/student/change-password";
      token = localStorage.getItem("studentToken");
    } else if (role === "collegeAdmin") {
      endpoint = "/api/college/change-password";
      token = localStorage.getItem("collegeAdminToken");
    } else if (role === "recruiter") {
      endpoint = "/api/recruiter/change-password";
      token = localStorage.getItem("recruiterToken");
    }

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update password");

      setStatus("Password updated successfully! ✅");
      setTimeout(() => {
        setOldPassword("");
        setNewPassword("");
        setStatus("");
        onClose();
      }, 2000);
    } catch (err) {
      setStatus(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div className="app-card shadow-lg p-4" style={{ width: '100%', maxWidth: 400 }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="m-0">Change Password</h4>
          <button className="btn btn-sm btn-soft rounded-circle px-2" onClick={onClose} disabled={isLoading}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="d-grid gap-3">
          <div>
            <label className="form-label text-sm">Old Password</label>
            <input 
              type="password" 
              className="form-control form-control-sm" 
              value={oldPassword} 
              onChange={(e) => setOldPassword(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="form-label text-sm">New Password</label>
            <input 
              type="password" 
              className="form-control form-control-sm" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              minLength={8} 
              required 
            />
          </div>
          <div>
            <label className="form-label text-sm">Confirm New Password</label>
            <input 
              type="password" 
              className="form-control form-control-sm" 
              value={confirmNewPassword} 
              onChange={(e) => setConfirmNewPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary mt-2" disabled={isLoading}>
            {isLoading ? "Saving..." : "Update Password"}
          </button>

          {status && (
            <div className={`alert ${status.includes('successfully') ? 'alert-success' : 'alert-info'} mb-0 text-center text-sm py-2`}>
              {status}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
