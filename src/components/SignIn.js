import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";



const SignIn = () => {
  const [status, setStatus] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Signing in...");
    try {
      const res = await fetch("http://localhost:5000/Studentlogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data?.message || "Invalid credentials");
        return;
      }
      setStatus("Login successful");
      if (data?.token) {
        localStorage.setItem("studentToken", data.token);
      }
      if (data?.user?.email) localStorage.setItem("studentEmail", data.user.email);
      if (data?.user?.collegeCode)
        localStorage.setItem("studentCollegeCode", data.user.collegeCode);
      navigate("/projects");
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
              <h2 className="mb-1">Student Sign in</h2>
              <p className="app-muted mb-4">
                Sign in with your registered college email to upload projects and
                interact with global projects.
              </p>

              <form onSubmit={handleSubmit} className="d-grid gap-3">
                <div>
                  <label className="form-label" htmlFor="email">
                    Email
                  </label>
                  <input
                    className="form-control"
                    type="email"
                    id="email"
                    placeholder="student@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="password">
                    Password
                  </label>
                  <input
                    className="form-control"
                    type="password"
                    id="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary">
                  Log in
                </button>

                <div className="d-flex justify-content-between flex-wrap gap-2">
                  <Link className="btn btn-soft" to="/student/signup">
                    New user? Signup (OTP)
                  </Link>
                  <Link className="btn btn-soft" to="/">
                    Back to Global
                  </Link>
                </div>

                {status ? (
                  <div className="alert alert-info mb-0" role="alert">
                    {status}
                  </div>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;