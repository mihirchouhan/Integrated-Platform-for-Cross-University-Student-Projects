import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import API_BASE_URL from '../apiConfig';

const API = API_BASE_URL;

export default function RecruiterLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setStatus("Invalid email format");

    setStatus("Signing in...");
    try {
      const res = await fetch(`${API}/api/recruiter/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Login failed");
      
      // Clear existing tokens from other roles to prevent simultaneous logins
      localStorage.removeItem("studentToken");
      localStorage.removeItem("studentEmail");
      localStorage.removeItem("studentCollegeCode");
      localStorage.removeItem("collegeAdminToken");
      localStorage.removeItem("collegeAdminCode");

      localStorage.setItem("recruiterToken", data.token);
      localStorage.setItem("recruiterEmail", data.recruiter?.email || email);
      localStorage.setItem("recruiterCompany", data.recruiter?.companyName || "");
      setStatus("Login successful");
      navigate("/recruiter/dashboard");
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
              <h2 className="mb-1">🏢 Recruiter Login</h2>
              <p className="app-muted mb-4">Access the Talent Market and find your next hire.</p>

              <form onSubmit={submit} className="d-grid gap-3">
                <div>
                  <label className="form-label">Email</label>
                  <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
                </div>
                <div>
                  <label className="form-label">Password</label>
                  <input className="form-control" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
                </div>

                <button type="submit" className="btn btn-primary btn-lg">Log in</button>

                <div className="d-flex justify-content-between flex-wrap gap-2 text-sm mt-2">
                  <Link className="app-muted" to="/recruiter/signup">New? Create account</Link>
                  <Link className="app-muted" to="/forgot-password">Forgot Password?</Link>
                </div>
                <div className="text-center mt-3">
                  <Link className="app-muted" style={{textDecoration: "underline"}} to="/">Back to Global</Link>
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
