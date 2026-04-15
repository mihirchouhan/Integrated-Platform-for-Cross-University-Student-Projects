import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CollegeAdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setStatus("Signing in...");
    try {
      const res = await fetch("http://localhost:5000/college/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data?.message || data?.error || "Login failed");
        return;
      }
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
        <div className="col-12 col-md-8 col-lg-6">
          <div className="app-card">
            <div className="app-card-body">
              <h2 className="mb-1">College Admin Login</h2>
              <p className="app-muted mb-4">
                Approve college projects and publish them to the global section.
              </p>

              <form onSubmit={submit} className="d-grid gap-3">
                <div>
                  <label className="form-label">Email</label>
                  <input
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@college.edu"
                    type="email"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Password</label>
                  <input
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    type="password"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary">
                  Log in
                </button>
              </form>

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
}

