import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Reset Password
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const requestOTP = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setStatus("Invalid email format");

    setIsLoading(true);
    setStatus("Sending OTP...");
    
    // Map role to backend endpoint
    let endpoint = "";
    if (role === "student") endpoint = "/api/student/forgot-password";
    else if (role === "college") endpoint = "/api/college/forgot-password";
    else if (role === "recruiter") endpoint = "/api/recruiter/forgot-password";

    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to send OTP");
      
      setStatus("OTP sent! Please check your email.");
      setStep(2);
    } catch (err) {
      setStatus(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword.length < 8) return setStatus("Password must be at least 8 characters long");
    if (newPassword !== confirmNewPassword) return setStatus("Passwords do not match");

    setIsLoading(true);
    setStatus("Resetting password...");
    
    let endpoint = "";
    if (role === "student") endpoint = "/api/student/reset-password";
    else if (role === "college") endpoint = "/api/college/reset-password";
    else if (role === "recruiter") endpoint = "/api/recruiter/reset-password";

    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Password reset failed");
      
      setStatus("Password reset successful! You can now log in.");
      setStep(3); // Success screen
    } catch (err) {
      setStatus(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-page">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-5">
          <div className="app-card shadow-lg p-3">
            <div className="app-card-body">
              <div className="text-center mb-4">
                <div style={{ fontSize: 40, marginBottom: 8 }}>🔐</div>
                <h2>Reset Password</h2>
                <p className="app-muted text-sm px-3">
                  {step === 1 ? "Select your role and enter your registered email to receive an OTP."
                   : step === 2 ? "Enter the OTP sent to your email and your new password."
                   : "Your password has been changed."}
                </p>
              </div>

              {step === 1 && (
                <form onSubmit={requestOTP} className="d-grid gap-3">
                  <div>
                    <label className="form-label">Role</label>
                    <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)} required>
                      <option value="student">Student</option>
                      <option value="college">College Admin</option>
                      <option value="recruiter">Recruiter</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Registered Email</label>
                    <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@domain.com" />
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg mt-2" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Request OTP"}
                  </button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={resetPassword} className="d-grid gap-3">
                  <div>
                    <label className="form-label">Email</label>
                    <input className="form-control" value={email} disabled />
                  </div>
                  <div>
                    <label className="form-label">6-Digit OTP</label>
                    <input className="form-control" value={otp} onChange={(e) => setOtp(e.target.value)} required placeholder="123456" maxLength={6} style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }} />
                  </div>
                  <div>
                    <label className="form-label">New Password</label>
                    <input className="form-control" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="•••••••• (min 8 chars)" minLength={8} />
                  </div>
                  <div>
                    <label className="form-label">Confirm New Password</label>
                    <input className="form-control" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required placeholder="••••••••" />
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg mt-2" disabled={isLoading}>
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </button>
                  <button type="button" className="btn btn-soft btn-sm mx-auto d-block" onClick={() => setStep(1)} disabled={isLoading}>
                    Back to Request
                  </button>
                </form>
              )}

              {step === 3 && (
                <div className="text-center d-grid gap-3 mt-4">
                  <div className="alert alert-success">✅ Password reset successfully!</div>
                  <div className="d-flex justify-content-center gap-2 flex-wrap">
                    <Link to="/student/signin" className="btn btn-soft">Student Login</Link>
                    <Link to="/college/admin/login" className="btn btn-soft">Admin Login</Link>
                    <Link to="/recruiter/login" className="btn btn-soft">Recruiter Login</Link>
                  </div>
                </div>
              )}

              {status && step !== 3 && (
                <div className="alert alert-info mt-3 mb-0 text-center text-sm">{status}</div>
              )}

              {step !== 3 && (
                <div className="text-center mt-4">
                  <Link to="/" className="app-muted" style={{ fontSize: 13, textDecoration: 'underline' }}>Back to Home</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
