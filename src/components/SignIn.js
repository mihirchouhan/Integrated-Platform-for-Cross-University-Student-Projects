import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from '../apiConfig';

const SignIn = () => {
  const [status, setStatus] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setStatus("Invalid email format");

    setStatus("Signing in...");
    try {
      const res = await fetch(`${API_BASE_URL}/Studentlogin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus(data?.message || "Invalid credentials"); return; }
      setStatus("Login successful");
      // Clear existing tokens from other roles to prevent simultaneous logins
      localStorage.removeItem("collegeAdminToken");
      localStorage.removeItem("collegeAdminCode");
      localStorage.removeItem("recruiterToken");
      localStorage.removeItem("recruiterEmail");
      localStorage.removeItem("recruiterCompany");

      if (data?.token) localStorage.setItem("studentToken", data.token);
      if (data?.user?.email) localStorage.setItem("studentEmail", data.user.email);
      if (data?.user?.collegeCode) localStorage.setItem("studentCollegeCode", data.user.collegeCode);
      navigate("/projects");
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
                <div style={{ fontSize: 48, marginBottom: 8 }}>🎓</div>
                <h2 className="mb-1">Student Sign In</h2>
                <p className="app-muted">Sign in with your registered college email to upload, upvote, and collaborate.</p>
              </div>

              <form onSubmit={handleSubmit} className="d-grid gap-3">
                <div>
                  <label className="form-label" htmlFor="email">Email</label>
                  <input className="form-control" type="email" id="email" placeholder="student@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <label className="form-label" htmlFor="password">Password</label>
                  <input className="form-control" type="password" id="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>

                <button type="submit" className="btn btn-primary btn-lg">Sign In</button>

                <div className="d-flex justify-content-between flex-wrap gap-2 text-sm mt-2">
                  <Link className="app-muted" to="/student/signup">New? Sign up with OTP</Link>
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
};

export default SignIn;