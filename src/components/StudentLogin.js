import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API_BASE_URL from '../apiConfig';

const StudentLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");

  const doit = async (e) => {
    e.preventDefault();
    setStatus("Sending OTP...");
    try {
      const res = await fetch(`${API_BASE_URL}/sendotp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, collegeCode: code }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.devOtp) {
          console.log(`%c[DEV] Your OTP is: ${data.devOtp}`, 'color: #6366f1; font-size: 18px; font-weight: bold;');
          alert(`[DEV MODE] Your OTP is: ${data.devOtp}`);
        }
        navigate("/student/otp", { state: { email, code } });
      } else {
        setStatus(data.message || "Failed");
      }
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
                <div style={{ fontSize: 48, marginBottom: 8 }}>✉️</div>
                <h2 className="mb-1">Student Signup (OTP)</h2>
                <p className="app-muted">Enter your college email and code to receive an OTP.</p>
              </div>

              <form onSubmit={doit} className="d-grid gap-3">
                <div>
                  <label className="form-label">College Email</label>
                  <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" required />
                </div>
                <div>
                  <label className="form-label">College Code</label>
                  <input className="form-control" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter your college code" required />
                </div>

                <button type="submit" className="btn btn-primary btn-lg">Request OTP</button>

                <div className="d-flex justify-content-between flex-wrap gap-2">
                  <Link className="btn btn-soft" to="/student/signin">Already registered? Sign in</Link>
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
};

export default StudentLogin;