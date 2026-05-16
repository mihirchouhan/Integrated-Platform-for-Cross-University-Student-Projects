import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API_BASE_URL from '../apiConfig';

export default function CollegeAdminLogin() {
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
      const res = await fetch(`${API_BASE_URL}/college/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus(data?.message || "Login failed"); return; }
      
      // Clear existing tokens from other roles to prevent simultaneous logins
      localStorage.removeItem("studentToken");
      localStorage.removeItem("studentEmail");
      localStorage.removeItem("studentCollegeCode");
      localStorage.removeItem("recruiterToken");
      localStorage.removeItem("recruiterEmail");
      localStorage.removeItem("recruiterCompany");

      localStorage.setItem("collegeAdminToken", data.token);
      localStorage.setItem("collegeAdminCode", data?.college?.code || "");
      setStatus("Login successful");
      navigate("/college/admin/dashboard");
    } catch (err) {
      setStatus(err?.message || "Login failed");
    }
  };

  return (
    <div className="app-page">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-6">
          <div className="app-card">
            <div className="app-card-body">
              <div className="text-center mb-4">
                <div style={{ fontSize: 48, marginBottom: 8 }}>🏫</div>
                <h2 className="mb-1">College Admin Login</h2>
                <p className="app-muted">Approve projects and publish them to the global section.</p>
              </div>

              <form onSubmit={submit} className="d-grid gap-3">
                <div>
                  <label className="form-label">Admin Email</label>
                  <input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@college.edu" type="email" required />
                </div>
                <div>
                  <label className="form-label">Password</label>
                  <input className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required />
                </div>

                <button type="submit" className="btn btn-primary btn-lg">Log in</button>

                <div className="d-flex justify-content-between flex-wrap gap-2 text-sm mt-2">
                  <Link className="app-muted" to="/college/register">Register College</Link>
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
