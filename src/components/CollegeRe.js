import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API_BASE_URL from '../apiConfig';

export default function CollegeRegistration() {
  const [form, setForm] = useState({ code: "", Cname: "", CollegeAdmin: "", CollegeAdminPassword: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    
    if (form.CollegeAdminPassword.length < 8) return setStatus("Password must be at least 8 characters long");
    if (form.CollegeAdminPassword !== confirmPassword) return setStatus("Passwords do not match");
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.CollegeAdmin)) return setStatus("Invalid admin email format");

    setStatus("Registering...");
    try {
      const res = await fetch(`${API_BASE_URL}/registerCollege`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || "Registration failed");
      setStatus("College registered! Redirecting...");
      setTimeout(() => navigate("/college/admin/login"), 1500);
    } catch (err) {
      setStatus(err?.message || "Failed");
    }
  };

  return (
    <div className="app-page">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-6">
          <div className="app-card">
            <div className="app-card-body">
              <div className="text-center mb-4">
                <div style={{ fontSize: 48, marginBottom: 8 }}>🏛️</div>
                <h2 className="mb-1">Register College</h2>
                <p className="app-muted">Register your institution to enable student project approvals.</p>
              </div>

              <form onSubmit={submit} className="d-grid gap-3">
                <div>
                  <label className="form-label">College Code</label>
                  <input className="form-control" value={form.code} onChange={set("code")} placeholder="e.g. IITP" required />
                </div>
                <div>
                  <label className="form-label">College Email Domain (Cname)</label>
                  <input className="form-control" value={form.Cname} onChange={set("Cname")} placeholder="e.g. iitp.ac.in" required />
                </div>
                <div>
                  <label className="form-label">Admin Email</label>
                  <input className="form-control" type="email" value={form.CollegeAdmin} onChange={set("CollegeAdmin")} placeholder="admin@iitp.ac.in" required />
                </div>
                <div>
                  <label className="form-label">Admin Password</label>
                  <input className="form-control" type="password" value={form.CollegeAdminPassword} onChange={set("CollegeAdminPassword")} placeholder="Strong password (min 8 chars)" required />
                </div>
                <div>
                  <label className="form-label">Confirm Password</label>
                  <input className="form-control" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm strong password" required />
                </div>

                <button type="submit" className="btn btn-primary btn-lg">Register</button>

                <div className="d-flex justify-content-between flex-wrap gap-2">
                  <Link className="btn btn-soft" to="/college/admin/login">Already registered? Admin Login</Link>
                  <Link className="btn btn-soft" to="/">Back to Global</Link>
                </div>

                {status && <div className="alert alert-info mb-0">{status}</div>}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
