import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = "http://localhost:5000";

export default function RecruiterSignup() {
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", companyName: "", companyUrl: "", linkedInUrl: "" });
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    
    if (form.password.length < 8) return setStatus("Password must be at least 8 characters long");
    if (form.password !== form.confirmPassword) return setStatus("Passwords do not match");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return setStatus("Invalid email format");

    const urlRegex = /^(https?:\/\/)?([\w\d-]+\.)+[\w\d]{2,}(\/.*)?$/i;
    if (form.companyUrl && !urlRegex.test(form.companyUrl)) return setStatus("Invalid Company URL");
    if (form.linkedInUrl && !urlRegex.test(form.linkedInUrl)) return setStatus("Invalid LinkedIn URL");

    setStatus("Creating account...");
    try {
      const res = await fetch(`${API}/api/recruiter/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          companyName: form.companyName,
          companyUrl: form.companyUrl,
          linkedInUrl: form.linkedInUrl
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Signup failed");
      setStatus("Account created! Redirecting to login...");
      setTimeout(() => navigate("/recruiter/login"), 1500);
    } catch (e) {
      setStatus(e?.message || "Failed");
    }
  };

  return (
    <div className="app-page">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-6">
          <div className="app-card">
            <div className="app-card-body">
              <h2 className="mb-1">🏢 Recruiter Signup</h2>
              <p className="app-muted mb-4">Join as a recruiter to discover talent, acquire projects, and schedule interviews.</p>

              <form onSubmit={submit} className="d-grid gap-3">
                <div>
                  <label className="form-label">Company Name *</label>
                  <input className="form-control" value={form.companyName} onChange={set("companyName")} placeholder="Acme Inc." required />
                </div>
                <div>
                  <label className="form-label">Work Email *</label>
                  <input className="form-control" type="email" value={form.email} onChange={set("email")} placeholder="you@company.com" required />
                </div>
                <div>
                  <label className="form-label">Password *</label>
                  <input className="form-control" type="password" value={form.password} onChange={set("password")} placeholder="Strong password (min 8 chars)" required />
                </div>
                <div>
                  <label className="form-label">Confirm Password *</label>
                  <input className="form-control" type="password" value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Confirm password" required />
                </div>
                <div>
                  <label className="form-label">Company URL</label>
                  <input className="form-control" value={form.companyUrl} onChange={set("companyUrl")} placeholder="https://company.com" />
                </div>
                <div>
                  <label className="form-label">LinkedIn URL</label>
                  <input className="form-control" value={form.linkedInUrl} onChange={set("linkedInUrl")} placeholder="https://linkedin.com/in/..." />
                </div>

                <button type="submit" className="btn btn-primary btn-lg">Create Recruiter Account</button>

                <div className="d-flex justify-content-between flex-wrap gap-2">
                  <Link className="btn btn-soft" to="/recruiter/login">Already have an account?</Link>
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
